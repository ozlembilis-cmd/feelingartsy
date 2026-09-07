import records from '../src/content/artworks.json';
import type { Artwork } from '../src/content/types';
import { createProfileHandler, type ProfileEnv } from './profile-api';

declare const __APP_HTML__: string;
interface Env extends ProfileEnv {
  ASSETS?: { fetch(request: Request): Promise<Response> };
}
const catalog = (records as Artwork[]).filter(
  (a) => a.status === 'published' && a.image.review === 'approved',
);
const profile = createProfileHandler(catalog);

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/art-profile') return profile(request, env);
    if (url.pathname.startsWith('/api/'))
      return Response.json({ error: 'not_found' }, { status: 404 });
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(__APP_HTML__, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('Not found', { status: 404 });
  },
};
export default worker;
