import { fileURLToPath } from 'node:url';
import { access } from 'node:fs/promises';
import worker from '../dist/server/index.js';
import { createNodeServer } from '../server/node-server.mjs';

const clientDir = fileURLToPath(new URL('../dist/client', import.meta.url));
// Fail before accepting traffic if the required gallery build is missing.
await access(new URL('../dist/client/index.html', import.meta.url));
const port = Number(process.env.PORT || 3000);
const server = createNodeServer({ worker, clientDir, env: process.env });
server.listen(port, '0.0.0.0', () =>
  console.log(`Gallery listening on port ${port}`),
);

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
