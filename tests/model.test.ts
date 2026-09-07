import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  initialState,
  reducer,
  toggleFeeling,
  hasResponse,
  readState,
  fitScale,
  responseText,
  STORAGE_KEY,
} from '../src/model.ts';
import type { GalleryState } from '../src/model.ts';
const base = () => initialState('starry-night');
test('all reactions are initially unanswered, distinct from nothing in particular', () => {
  const s = base();
  assert.equal(s.current.first, null);
  assert.equal(responseText(null), 'Not recorded');
  assert.equal(
    hasResponse({ feelings: ['Nothing in particular'], words: '' }),
    true,
  );
});
test('feelings are multi-select with an exclusive nothing response; no automatic advance', () => {
  let s = base();
  let r = toggleFeeling(null, 'Curious');
  r = toggleFeeling(r, 'Moved');
  assert.deepEqual(r.feelings, ['Curious', 'Moved']);
  r = toggleFeeling(r, 'Nothing in particular');
  assert.deepEqual(r.feelings, ['Nothing in particular']);
  r = toggleFeeling(r, 'Calm');
  assert.deepEqual(r.feelings, ['Calm']);
  s = reducer(s, { type: 'first', response: r });
  assert.equal(s.current.stage, 'first');
});
test('complete journey freezes first answer, hides second until response, saves understanding independently', () => {
  let s = base();
  s = reducer(s, {
    type: 'first',
    response: { feelings: ['Curious'], words: '' },
  });
  s = reducer(s, { type: 'guess', value: 'Claude Monet' });
  s = reducer(s, { type: 'discover' });
  s = reducer(s, {
    type: 'first',
    response: { feelings: ['Moved'], words: 'attempt' },
  });
  assert.deepEqual(s.current.first?.feelings, ['Curious']);
  s = reducer(s, { type: 'look-again' });
  assert.equal(s.current.second, null);
  s = reducer(s, { type: 'same' });
  assert.deepEqual(s.current.second, s.current.first);
  assert.notEqual(s.current.second, s.current.first);
  s = reducer(s, { type: 'reflect' });
  s = reducer(s, {
    type: 'understanding',
    value: 'I understand more, but feel the same',
  });
  s = reducer(s, { type: 'note', value: '  I notice the cypress.  ' });
  s = reducer(s, { type: 'save-reflection' });
  assert.equal(s.current.note, 'I notice the cypress.');
  assert.equal(s.current.stage, 'saved');
  assert.equal(s.visits.length, 1);
  assert.ok(s.current.savedAt);
  assert.equal(s.current.guess, 'Claude Monet');
});
test('skip first discards draft and cannot copy same; skipping reflection never marks completion', () => {
  let s = base();
  s = reducer(s, {
    type: 'first',
    response: { feelings: ['Amused'], words: '' },
  });
  s = reducer(s, { type: 'discover', skip: true });
  assert.equal(s.current.first, null);
  s = reducer(s, { type: 'look-again' });
  s = reducer(s, { type: 'same' });
  assert.equal(s.current.second, null);
  s = reducer(s, { type: 'reflect', skip: true });
  s = reducer(s, { type: 'next', artworkId: 'girl' });
  assert.equal(s.visits[0].savedAt, null);
  assert.equal(s.visits[0].second, null);
});
test('optional fields can all be skipped and explicitly saved with not-recorded labels', () => {
  let s = base();
  for (const action of [
    { type: 'discover' },
    { type: 'look-again' },
    { type: 'reflect', skip: true },
    { type: 'save-reflection' },
  ] as const)
    s = reducer(s, action);
  assert.equal(responseText(s.current.first), 'Not recorded');
  assert.equal(responseText(s.current.second), 'Not recorded');
  assert.equal(s.current.note, '');
  assert.equal(s.current.understanding, null);
});
test('revisiting preserves earlier visits without duplicate saves', () => {
  let s = base();
  s = reducer(s, { type: 'discover' });
  s = reducer(s, { type: 'look-again' });
  s = reducer(s, { type: 'reflect' });
  s = reducer(s, { type: 'save-reflection' });
  const first = s.current.id;
  s = reducer(s, { type: 'save-reflection' });
  assert.equal(s.visits.length, 1);
  s = reducer(s, { type: 'next', artworkId: 'starry-night' });
  assert.notEqual(s.current.id, first);
  assert.equal(s.visits.length, 1);
  s = reducer(s, { type: 'next', artworkId: 'girl' });
  assert.equal(s.visits.length, 2);
  assert.equal(s.visits[0].id, first);
  assert.ok(s.visits[0].savedAt);
  assert.equal(s.visits[1].savedAt, null);
});
test('saved IDs toggle and height deletion retains current stage and answers', () => {
  let s = reducer(base(), { type: 'discover' });
  const v = s.current;
  s = reducer(s, { type: 'height', heightCm: 182.9, units: 'ft' });
  s = reducer(s, { type: 'bookmark', artworkId: 'starry-night' });
  assert.equal(s.savedIds.length, 1);
  s = reducer(s, { type: 'height', heightCm: null, units: 'cm' });
  assert.deepEqual(s.current, v);
  s = reducer(s, { type: 'bookmark', artworkId: 'starry-night' });
  assert.equal(s.savedIds.length, 0);
});
test('round-trip refresh resumes current state and all history; corrupt or inaccessible storage fails gracefully', () => {
  let s = reducer(base(), { type: 'begin', heightCm: 165, units: 'cm' });
  s = reducer(s, { type: 'discover' });
  const storage = {
    getItem: (key: string) => (key === STORAGE_KEY ? JSON.stringify(s) : null),
  };
  assert.deepEqual(readState(storage, ['starry-night']), s);
  assert.equal(readState({ getItem: () => '{bad' }, ['starry-night']), null);
  assert.equal(
    readState(
      {
        getItem: () => {
          throw Error('blocked');
        },
      },
      ['starry-night'],
    ),
    null,
  );
  assert.equal(
    readState(
      {
        getItem: () =>
          JSON.stringify({
            ...s,
            current: { ...s.current, first: { feelings: 'bad' } },
          }),
      },
      ['starry-night'],
    ),
    null,
  );
});
test('scale uses a shared cm ratio for portrait, landscape, square and mural at several heights and viewports', () => {
  for (const [w, h] of [
    [92.1, 73.7],
    [39, 44.5],
    [100, 100],
    [776.6, 349.3],
  ])
    for (const height of [120, 170, 210])
      for (const [vw, vh] of [
        [280, 250],
        [800, 500],
        [1400, 800],
      ]) {
        const s = fitScale(w, h, height, vw, vh);
        assert.ok(Math.abs(s.artHeight / s.personHeight - h / height) < 1e-10);
        assert.ok(Math.abs(s.artWidth / s.artHeight - w / h) < 1e-10);
        assert.ok(s.artWidth + s.personWidth + s.gap <= vw + 1e-9);
        assert.ok(Math.max(s.artHeight, s.personHeight) <= vh + 1e-9);
      }
});
test('clear data removes only this app key and a new gallery begins with no personal responses', () => {
  const data = new Map([
    [STORAGE_KEY, JSON.stringify(base())],
    ['other-app', 'retain'],
  ]);
  data.delete(STORAGE_KEY);
  assert.equal(
    readState({ getItem: (k) => data.get(k) ?? null }, ['starry-night']),
    null,
  );
  assert.equal(data.get('other-app'), 'retain');
  const s: GalleryState = base();
  assert.equal(s.heightCm, null);
  assert.deepEqual(s.visits, []);
  assert.equal(s.onboarded, false);
});

test('choosing a painting in the intro begins there without creating a phantom visit', () => {
  const started = reducer(initialState('guernica'), {
    type: 'begin',
    artworkId: 'starry-night',
  });
  assert.equal(started.onboarded, true);
  assert.equal(started.current.artworkId, 'starry-night');
  assert.equal(started.current.stage, 'first');
  assert.equal(started.current.first, null);
  assert.equal(started.visits.length, 0);
});

test('the guide can be dismissed once without changing responses, including older saved data', () => {
  const original = reducer(initialState('starry-night'), {
    type: 'first',
    response: { feelings: ['Curious'], words: '' },
  });
  const legacy: Partial<typeof original> = { ...original };
  delete legacy.guideSeen;
  const restored = readState({ getItem: () => JSON.stringify(legacy) }, [
    'starry-night',
  ])!;
  assert.equal(restored.guideSeen, false);
  assert.deepEqual(restored.current, original.current);
  const seen = reducer(restored, { type: 'guide-seen', begin: true });
  assert.equal(seen.guideSeen, true);
  assert.equal(seen.onboarded, true);
  assert.deepEqual(seen.current, original.current);
  assert.equal(
    readState({ getItem: () => JSON.stringify(seen) }, ['starry-night'])
      ?.guideSeen,
    true,
  );
  assert.equal(initialState('starry-night').guideSeen, false);
});
