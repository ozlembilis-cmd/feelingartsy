import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createNodeServer } from '../server/node-server.mjs';

test('production HTTP server serves assets, handles profiles, and isolates private files', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'artsy-http-'));
  const clientDir = join(directory, 'client');
  await mkdir(join(clientDir, 'assets'), { recursive: true });
  await writeFile(
    join(clientDir, 'assets', 'app-hash.js'),
    'window.gallery = true;',
  );
  await writeFile(join(directory, '.env'), 'PRIVATE_TEST_FIXTURE');
  await symlink(join(directory, '.env'), join(clientDir, 'escape.txt'));
  const worker = {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (url.pathname === '/')
        return new Response('<h1>Feeling artsy?</h1>', {
          headers: { 'Content-Type': 'text/html' },
        });
      if (url.pathname === '/api/art-profile')
        return Response.json({
          available: false,
          origin: url.origin,
          client: request.headers.get('CF-Connecting-IP'),
          body: request.method === 'POST' ? await request.json() : null,
        });
      return env.ASSETS.fetch(request);
    },
  };
  const server = createNodeServer({
    worker,
    clientDir,
    env: {
      RAILWAY_PUBLIC_DOMAIN: 'art.example',
      RAILWAY_ENVIRONMENT_ID: 'fixture',
      RAILWAY_GIT_COMMIT_SHA: 'test-revision',
    },
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.match(await (await fetch(base)).text(), /Feeling artsy/);
  const asset = await fetch(`${base}/assets/app-hash.js`);
  assert.equal(asset.status, 200);
  assert.match(asset.headers.get('Content-Type'), /javascript/);
  assert.match(asset.headers.get('Cache-Control'), /immutable/);
  assert.equal(await asset.text(), 'window.gallery = true;');
  const head = await fetch(`${base}/assets/app-hash.js`, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.deepEqual(await (await fetch(`${base}/healthz`)).json(), {
    status: 'ok',
    revision: 'test-revision',
  });
  for (const path of [
    '/.env',
    '/%2eenv',
    '/escape.txt',
    '/missing.js',
    '/..%2f.env',
  ])
    assert.equal((await fetch(base + path)).status, 404, path);
  const api = await fetch(`${base}/api/art-profile`, {
    method: 'POST',
    body: JSON.stringify({ evidence: [] }),
    headers: {
      'Content-Type': 'application/json',
      'CF-Connecting-IP': '203.0.113.99',
      'X-Real-IP': '192.0.2.1',
    },
  });
  assert.deepEqual(await api.json(), {
    available: false,
    origin: 'https://art.example',
    client: '192.0.2.1',
    body: { evidence: [] },
  });
  assert.equal(
    (await fetch(base, { method: 'POST', body: 'test' })).status,
    405,
  );
});
