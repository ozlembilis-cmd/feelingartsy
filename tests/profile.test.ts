import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initialState, reducer } from '../src/model.ts';
import {
  collectProfileEvidence,
  describeEvidence,
  validArtProfile,
  profileCandidates,
  type ProfileEvidence,
} from '../src/profile.ts';
import {
  createProfileHandler,
  parseEvidence,
  profilePrompt,
} from '../server/profile-api.ts';
import type { Artwork } from '../src/content/types.ts';
const catalog: Artwork[] = JSON.parse(
  readFileSync(
    new URL('../src/content/artworks.json', import.meta.url),
    'utf8',
  ),
).filter(
  (a: Artwork) => a.status === 'published' && a.image.review === 'approved',
);
const id = catalog[0].id;
const bookmark: ProfileEvidence[] = [
  { artworkId: id, saved: true, reactions: [] },
];
const freeEnv = {
  MISTRAL_API_KEY: 'test-fixture-not-a-key',
  MISTRAL_FREE_TIER_CONFIRMED: 'true',
};
function request(
  evidence: unknown = bookmark,
  extra: Record<string, string> = {},
) {
  return new Request('https://gallery.example/api/art-profile', {
    method: 'POST',
    headers: {
      Origin: 'https://gallery.example',
      'Content-Type': 'application/json',
      ...extra,
    },
    body: JSON.stringify({ evidence }),
  });
}
function answer() {
  return {
    title: 'A first impression',
    summary: 'You saved one artwork to return to.',
    observations: [
      { text: 'This piece caught your attention.', artworkIds: [id] },
    ],
    recommendations: [
      {
        artworkId: profileCandidates(bookmark, catalog)[0].id,
        reason: 'Another work to explore.',
      },
    ],
  };
}

test('height, guesses, navigation and skipped drafts do not count; saves alone do', () => {
  let state = reducer(initialState(id), {
    type: 'height',
    heightCm: 180,
    units: 'cm',
  });
  state = reducer(state, { type: 'guess', value: 'Example artist' });
  state = reducer(state, {
    type: 'first',
    response: { feelings: ['Calm'], words: '' },
  });
  state = reducer(state, { type: 'discover', skip: true });
  assert.equal(collectProfileEvidence(state, catalog).length, 0);
  state = reducer(state, { type: 'bookmark', artworkId: id });
  assert.deepEqual(collectProfileEvidence(state, catalog), bookmark);
  state = reducer(state, { type: 'bookmark', artworkId: id });
  assert.equal(collectProfileEvidence(state, catalog).length, 0);
});

test('each artwork counts once despite saves, multiple visits and duplicate current visit', () => {
  let state = reducer(initialState(id), {
    type: 'first',
    response: { feelings: ['Nothing in particular'], words: '' },
  });
  state = reducer(state, { type: 'bookmark', artworkId: id });
  state = reducer(state, { type: 'discover' });
  state = reducer(state, { type: 'look-again' });
  state = reducer(state, { type: 'same' });
  state = reducer(state, { type: 'reflect' });
  state = reducer(state, { type: 'save-reflection' });
  const evidence = collectProfileEvidence(state, catalog);
  assert.equal(evidence.length, 1);
  assert.equal(evidence[0].reactions.length, 1);
  state = reducer(state, { type: 'next', artworkId: id });
  state = reducer(state, {
    type: 'first',
    response: { feelings: ['Calm'], words: '' },
  });
  assert.equal(collectProfileEvidence(state, catalog).length, 1);
  assert.equal(collectProfileEvidence(state, catalog)[0].reactions.length, 2);
  assert.match(
    describeEvidence(evidence, catalog).join(' '),
    /Nothing in particular/,
  );
});

test('five is not a generation gate and written responses retain before/after context', () => {
  let state = reducer(initialState(id), {
    type: 'first',
    response: { feelings: ['Uneasy'], words: 'I love this.' },
  });
  state = reducer(state, { type: 'discover' });
  state = reducer(state, { type: 'look-again' });
  state = reducer(state, {
    type: 'second',
    response: { feelings: ['Moved'], words: '' },
  });
  const evidence = collectProfileEvidence(state, catalog);
  assert.equal(evidence[0].reactions[0].first?.words, 'I love this.');
  assert.equal(evidence[0].reactions[0].second?.feelings[0], 'Moved');
  assert.deepEqual(
    parseEvidence(evidence.length ? { evidence } : null, catalog),
    evidence,
  );
});

test('server rejects empty signals, duplicate works, unknown art and invalid feelings', () => {
  for (const evidence of [
    [],
    [...bookmark, ...bookmark],
    [{ ...bookmark[0], artworkId: 'invented' }],
    [{ ...bookmark[0], saved: false }],
    [
      {
        ...bookmark[0],
        reactions: [
          { first: { words: '', feelings: ['Fake'] }, second: null, note: '' },
        ],
      },
    ],
    [
      {
        ...bookmark[0],
        reactions: [{ first: null, second: null, note: 'x'.repeat(401) }],
      },
    ],
  ])
    assert.equal(parseEvidence({ evidence }, catalog), null);
});

test('unconfigured API is truthful and cannot call a paid account without free-mode confirmation', async () => {
  let calls = 0;
  const handler = createProfileHandler(catalog, (async () => {
    calls++;
    throw Error('Unexpected call');
  }) as typeof fetch);
  assert.deepEqual(
    await (
      await handler(new Request('https://gallery.example/api/art-profile'), {})
    ).json(),
    { available: false },
  );
  assert.equal((await handler(request(), {})).status, 503);
  assert.equal(
    (await handler(request(), { MISTRAL_API_KEY: 'fixture' })).status,
    503,
  );
  assert.equal(calls, 0);
});

test('private server-only call validates origin, IDs, structured result and burst limits', async () => {
  let calls = 0;
  const handler = createProfileHandler(catalog, (async (url, init) => {
    calls++;
    assert.equal(url, 'https://api.mistral.ai/v1/chat/completions');
    const payload = JSON.parse(init!.body as string);
    assert.equal(payload.model, 'mistral-small-2603');
    assert.equal(payload.response_format.type, 'json_schema');
    assert.ok(!JSON.stringify(payload).includes('test-fixture-not-a-key'));
    return Response.json({
      choices: [
        {
          finish_reason: 'stop',
          message: { content: JSON.stringify(answer()) },
        },
      ],
    });
  }) as typeof fetch);
  assert.equal(
    (
      await handler(
        request(bookmark, { Origin: 'https://other.example' }),
        freeEnv,
      )
    ).status,
    403,
  );
  assert.equal(
    (await handler(request([{ ...bookmark[0], artworkId: 'fake' }]), freeEnv))
      .status,
    400,
  );
  const result = await handler(request(), freeEnv);
  assert.equal(result.status, 200);
  assert.deepEqual((await result.json()).profile, answer());
  assert.equal((await handler(request(), freeEnv)).status, 429);
  assert.equal(calls, 1);
});

test('provider quota, malformed content and invented recommendations never become profiles', async () => {
  const fixtures = [
    new Response('Limit reached', { status: 429 }),
    Response.json({
      choices: [{ finish_reason: 'stop', message: { content: 'not json' } }],
    }),
    Response.json({
      choices: [
        {
          finish_reason: 'stop',
          message: {
            content: JSON.stringify({
              ...answer(),
              recommendations: [{ artworkId: 'made-up', reason: 'A guess' }],
            }),
          },
        },
      ],
    }),
    Response.json({
      choices: [
        {
          finish_reason: 'length',
          message: { content: JSON.stringify(answer()) },
        },
      ],
    }),
  ];
  for (const [i, fixture] of fixtures.entries()) {
    let calls = 0;
    const handler = createProfileHandler(catalog, (async () => {
      calls++;
      return fixture;
    }) as typeof fetch);
    assert.equal(
      (await handler(request(), freeEnv)).status,
      i === 0 ? 429 : 502,
    );
    assert.equal(calls, 1, 'never automatically retries a free-tier call');
  }
});

test('profile content requires evidence references and distinct verified recommendations', () => {
  const evidenceIds = new Set([id]);
  const candidates = new Set(
    profileCandidates(bookmark, catalog).map((a) => a.id),
  );
  assert.equal(validArtProfile(answer(), evidenceIds, candidates), true);
  assert.equal(
    validArtProfile(
      {
        ...answer(),
        observations: [{ text: 'Claim', artworkIds: ['unknown'] }],
      },
      evidenceIds,
      candidates,
    ),
    false,
  );
  const duplicate = answer().recommendations[0];
  assert.equal(
    validArtProfile(
      { ...answer(), recommendations: [duplicate, duplicate] },
      evidenceIds,
      candidates,
    ),
    false,
  );
  const prompt = profilePrompt(bookmark, catalog);
  assert.match(prompt.messages[0].content, /Missing responses mean unknown/);
  assert.ok(!prompt.candidates.some((a) => a.id === id));
});
