import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { isIP } from 'node:net';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

export function createNodeServer({ worker, clientDir, env = {} }) {
  const root = realpathSync(clientDir);
  const assets = {
    async fetch(request) {
      try {
        const pathname = decodeURIComponent(new URL(request.url).pathname);
        if (pathname.split(/[\\/]/).some((part) => part.startsWith('.')))
          return new Response('Not found', { status: 404 });
        const file = await realpath(resolve(root, `.${pathname}`));
        if (!file.startsWith(root + sep))
          return new Response('Not found', { status: 404 });
        const bytes = await readFile(file);
        return new Response(bytes, {
          headers: {
            'Content-Type': types[extname(file)] || 'application/octet-stream',
            'Content-Length': String(bytes.length),
            'Cache-Control': pathname.startsWith('/assets/')
              ? 'public, max-age=31536000, immutable'
              : 'public, max-age=3600',
          },
        });
      } catch {
        return new Response('Not found', { status: 404 });
      }
    },
  };
  return createServer(async (incoming, outgoing) => {
    const abort = new AbortController();
    incoming.once('aborted', () => abort.abort());
    outgoing.once('close', () => {
      if (!outgoing.writableEnded) abort.abort();
    });
    try {
      if (!incoming.url?.startsWith('/') || incoming.url.startsWith('//')) {
        outgoing.writeHead(400);
        outgoing.end();
        return;
      }
      const headers = new Headers();
      for (const [name, value] of Object.entries(incoming.headers))
        if (value)
          headers.set(name, Array.isArray(value) ? value.join(', ') : value);
      // Railway supplies X-Real-IP at its edge. Never accept a visitor's
      // CF-Connecting-IP header as the existing Worker's limiter identity.
      const edgeIP = env.RAILWAY_ENVIRONMENT_ID && headers.get('x-real-ip');
      headers.set(
        'CF-Connecting-IP',
        edgeIP && isIP(edgeIP)
          ? edgeIP
          : incoming.socket.remoteAddress || 'local',
      );
      const origin = env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${env.RAILWAY_PUBLIC_DOMAIN}`
        : `http://${incoming.headers.host || 'localhost'}`;
      const url = new URL(incoming.url || '/', origin);
      const readOnly = incoming.method === 'GET' || incoming.method === 'HEAD';
      let response;
      if (url.pathname === '/healthz' && readOnly) {
        response = Response.json(
          { status: 'ok', revision: env.RAILWAY_GIT_COMMIT_SHA || null },
          { headers: { 'Cache-Control': 'no-store' } },
        );
      } else if (!readOnly && !url.pathname.startsWith('/api/')) {
        response = new Response('Method not allowed', { status: 405 });
      } else {
        const request = new Request(url, {
          method: incoming.method,
          headers,
          signal: abort.signal,
          ...(!readOnly
            ? { body: Readable.toWeb(incoming), duplex: 'half' }
            : {}),
        });
        response = await worker.fetch(request, { ...env, ASSETS: assets });
      }
      outgoing.statusCode = response.status;
      response.headers.forEach((value, name) =>
        outgoing.setHeader(name, value),
      );
      outgoing.setHeader('X-Content-Type-Options', 'nosniff');
      if (incoming.method === 'HEAD' || !response.body) outgoing.end();
      else await pipeline(Readable.fromWeb(response.body), outgoing);
    } catch {
      if (!outgoing.headersSent) {
        outgoing.writeHead(500, { 'Content-Type': 'application/json' });
        outgoing.end(JSON.stringify({ error: 'server_error' }));
      } else outgoing.destroy();
    }
  });
}
