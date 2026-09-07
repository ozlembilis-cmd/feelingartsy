import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Artwork } from '../src/content/types.ts';
const catalog: Artwork[] = JSON.parse(
  readFileSync(
    new URL('../src/content/artworks.json', import.meta.url),
    'utf8',
  ),
);
const live = catalog.filter((a) => a.status === 'published');
test('100 sourced live paintings including the owner-supplied Guernica photograph', () => {
  assert.equal(catalog.length, 100);
  assert.equal(new Set(catalog.map((a) => a.id)).size, 100);
  assert.equal(live.length, 100);
  assert.equal(catalog.find((a) => a.id === 'guernica')?.status, 'published');
  const g = catalog.find((a) => a.id === 'guernica')!;
  assert.equal(g.image.provenance, 'user-supplied');
  assert.equal(g.dimensions, null);
  assert.equal(g.verifiedArtworkDimensions?.widthCm, 776.6);
  assert.match(g.image.license, /private gallery/);
  assert.equal(g.image.src, '/artworks/guernica-user-photo.jpg');
});
test('every live work has original editorial content, alt text, real local image and per-asset rights', () => {
  for (const a of live) {
    assert.ok(
      a.title &&
        a.artist &&
        a.medium &&
        a.date &&
        a.collection &&
        a.culture &&
        a.period,
      a.id,
    );
    assert.equal(a.image.review, 'approved', a.id);
    assert.ok(
      a.image.license &&
        a.image.credit &&
        a.image.permissionUrl &&
        a.image.reviewedAt,
      a.id,
    );
    assert.ok(a.sources.length >= 1, a.id);
    for (const url of [
      ...a.sources.map((s) => s.url),
      a.image.permissionUrl,
      a.image.source,
    ])
      if (a.image.provenance === 'user-supplied' && url.startsWith('/')) {
        assert.ok(existsSync(resolve('public', url.slice(1))), url);
      } else assert.equal(new URL(url).protocol, 'https:');
    assert.ok(a.image.alt.length > 25, a.id);
    assert.ok(existsSync(resolve('public', a.image.src.slice(1))), a.id);
    const words = [a.story.behind, a.story.matters, a.story.closer]
      .join(' ')
      .split(/\s+/).length;
    assert.ok(words >= 60 && words <= 95, `${a.id}: ${words}`);
    assert.ok(!/\b(print|sculpture|photograph)\b/i.test(a.medium), a.id);
    assert.ok(
      a.artistChoices.length === 0 ||
        (a.artistChoices.length >= 3 && a.artistChoices.length <= 4),
      a.id,
    );
  }
});
test('dimensions are finite, positive, and independently sourced when enabled', () => {
  for (const a of live) {
    if (!a.dimensions) continue;
    assert.ok(
      Number.isFinite(a.dimensions.widthCm) && a.dimensions.widthCm > 0,
      a.id,
    );
    assert.ok(
      Number.isFinite(a.dimensions.heightCm) && a.dimensions.heightCm > 0,
      a.id,
    );
    assert.equal(new URL(a.dimensions.source).protocol, 'https:');
  }
});
test('the requested starting set is present, fresco and wall painting correctly identified', () => {
  for (const id of [
    'mona-lisa',
    'starry-night',
    'creation-of-adam',
    'guernica',
    'last-supper',
    'girl-with-a-pearl-earring',
    'scream',
    'las-meninas',
    'birth-of-venus',
    'night-watch',
  ])
    assert.ok(catalog.some((a) => a.id === id));
  assert.equal(
    catalog.find((a) => a.id === 'creation-of-adam')?.medium,
    'Fresco',
  );
  assert.equal(
    catalog.find((a) => a.id === 'creation-of-adam')?.dimensions,
    null,
  );
  assert.equal(
    catalog.find((a) => a.id === 'last-supper')?.medium,
    'Dry wall painting',
  );
});
