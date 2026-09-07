import { defineConfig, loadEnv, type Plugin } from 'vite';
import { sites } from '@openai/sites-vite-plugin';
import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig(({ mode, isSsrBuild }) => {
  const localEnv = loadEnv(mode, process.cwd(), 'MISTRAL_');
  const profileApi: Plugin = {
    name: 'local-art-profile-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.split('?')[0] !== '/api/art-profile') return next();
        try {
          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers))
            if (value)
              headers.set(key, Array.isArray(value) ? value.join(', ') : value);
          const chunks: Buffer[] = [];
          let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 65_536) {
              res.statusCode = 413;
              res.end();
              return;
            }
            chunks.push(chunk);
          }
          const worker = await server.ssrLoadModule('/server/index.ts');
          const request = new Request(`http://${req.headers.host}${req.url}`, {
            method: req.method,
            headers,
            body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
          });
          const response: Response = await worker.default.fetch(
            request,
            localEnv,
          );
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(await response.text());
        } catch {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'profile_unavailable' }));
        }
      });
    },
  };
  return {
    plugins: [react(), sites(), profileApi],
    // Only the built HTML is embedded. Server credentials are never defined into
    // browser JavaScript, and only VITE_ variables are browser-visible by Vite.
    define: {
      __APP_HTML__: JSON.stringify(
        isSsrBuild ? readFileSync('dist/client/index.html', 'utf8') : '',
      ),
    },
    build: {
      outDir: isSsrBuild ? 'dist/server' : 'dist/client',
      copyPublicDir: !isSsrBuild,
      rollupOptions: isSsrBuild
        ? { output: { entryFileNames: 'index.js' } }
        : undefined,
    },
    resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
    css: { postcss: { plugins: [tailwindcss()] } },
    server: { watch: { useFsEvents: false, usePolling: true } },
  };
});
