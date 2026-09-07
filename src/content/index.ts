import records from './artworks.json';
import type { Artwork } from './types';
export const catalog = records as Artwork[];
export const artworks = catalog.filter(
  (a) =>
    a.status === 'published' &&
    a.image.review === 'approved' &&
    a.image.src &&
    a.sources.length &&
    a.story.behind &&
    a.story.matters &&
    a.story.closer,
);
