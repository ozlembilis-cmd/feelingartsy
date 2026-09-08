# Feeling artsy?

An immersive art gallery built with React, TypeScript, and Vite, with an optional server-backed AI profile. A rotating constellation of paintings surrounds the bold Inter Tight opening, “Feeling artsy?”. Click anywhere to begin or resume; click a painting to open it. Look at a painting, record an optional first response, reveal its story, look again, and keep a private reflection. There are no scores or required answers.

## Run locally

Requires Node.js 22.18 or newer (Node 24 is also supported).

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. To verify and build:

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

The deployment output is `dist/client/` for the gallery and `dist/server/index.js` for its Cloudflare-compatible Worker. `.openai/hosting.json` retains the existing private Sites project. The gallery and local first-impressions summary need no API key. AI generation requires server-only Mistral configuration; see `AI-PROFILE-GUIDE.md` and `.env.example`. `npm run dev` serves the gallery and local API; `npm run preview` previews the static frontend only.

## What is included

- A full, sharp painting surrounded by a blurred extension of the same image, with compact icon controls.
- First-look → story → second-look → optional reflection → inline comparison.
- Multi-select feelings, exclusive “Nothing in particular,” custom words, skipping, and explicit “I feel the same.”
- Optional artist guesses for the priority set. Attribution is revealed neutrally; no scoring.
- Frozen first response after revealing context, and distinct records for every visit.
- Local settings, saved IDs, current position, and per-visit history. The intro resumes the current visit; its shuffle icon opens something new.
- Height in cm or feet/inches, deletion of height, and clearing all app data.
- Original full artwork fitting, manual zoom/pan/reset, and Just look with Escape to restore controls.
- A two-dimensional size diagram with one shared pixels-per-centimeter scale.
- Collection search by title or artist and Available, Saved, and Visited views.
- Responsive layouts, keyboard controls, visible focus, screen-reader labels, reduced-motion styles, and image recovery controls.

Gallery state stays under localStorage key `second-look:v1`; a generated profile uses `feeling-artsy:profile:v1`. If storage is inaccessible or full, the app keeps working in memory and displays a session-only notice. Clearing data removes both app keys and leaves other browser data alone. Local preview and the deployed URL have separate browser storage, as do different browsers/devices. There is no analytics or app account. Height and guesses are never sent to the profile API. Only an explicit generation action sends saved choices and feelings to Mistral; written reflections require a separate opt-in in the profile panel. The result stays in this browser. Model-provider retention and training settings are separate from local storage; see the guide. A private hosting layer may ask the site owner to sign in to open the URL; this is separate from the app and its local data.

## Collection: actual delivery count

**100 sourced records; 100 paintings available in this private gallery.** There are no empty placeholders in the live queue. This is a curated selection, not an objective popularity ranking.

The ten requested priority works have records. All ten are available, including The Creation of Adam as a fresco with a museum-supported ceiling-campaign date of 1508–1512. Its exact panel dimensions have not been established, so its size comparison is disabled.

**Guernica uses the owner’s supplied photograph.** The owner stated that they took the photograph and requested its use on 7 September 2026. It is displayed as supplied, without cropping or perspective correction. The use record is in `content-research/guernica-user-photo.md` and is linked from the app. This is user-provided content for the private gallery, not a public-domain claim or a public-redistribution license for the painting. The image includes the wall and floor, so size comparison is disabled; verified canvas dimensions remain 776.6 × 349.3 cm.

The expanded collection includes paintings from the Art Institute of Chicago and Cleveland Museum of Art with verified object-level public-domain/CC0 indicators. Chinese, Japanese, Korean, Indian, and Tibetan works broaden the collection alongside European and American paintings. Screens, devotional cloth paintings, and illustrated painted pages are identified by their actual medium. No prints, photographs, or sculptures were added to reach the count.

**Size comparison is enabled for 75 of the 100 available works.** For 25 works it is disabled because dimensions are missing, the photograph includes a frame/mount/predella, or its visible extent cannot be matched reliably to the verified painting dimensions. Verified object measurements are preserved separately from display eligibility. Comparisons are proportional estimates, never actual size on screen or a recreation of a museum’s hanging position. Small photographic/aspect variation may remain even in eligible records. No artwork or person is independently fitted into matching-height boxes.

## Editing content

Start with `CONTENT-GUIDE.md`. The content lives in `src/content/artworks.json`, separate from interface components. `src/content/types.ts` documents the schema. `content-research/` contains the individual source, rights, dimension, download, and image-review records. Every live work also exposes Sources and Image credit & permissions in the app.

The original summaries contain roughly 60–90 words across the three story sections; the validation ceiling is 95 to allow small punctuation/tokenization variation. Longer content belongs in the optional `story.more` field. Interpretations are framed as interpretations, qualified attributions remain qualified, and historical dates distinguish exact years from ranges.

The artwork JPEGs and font files are served locally, so the app does not depend on fragile external hotlinks. Inter Tight, DM Sans, and Newsreader use the SIL Open Font License; their notices are in `licenses/`. Museum image rights remain those documented for each asset; the app does not assert universal worldwide public-domain status.

## Verification and limitations

See `QA.md` for the exercised journeys and formats. Twenty-four automated tests cover the profile counter, request validation, mocked API handling, invented-ID rejection, and the existing transition invariants, skipping, unchanged emotions, independent understanding, persistence, corruption, revisiting, saving, scale geometry, and source/rights readiness. Type checking, lint, and the production build are part of delivery validation.

Known limits: the supplied Guernica photograph is documented for this private gallery; 25 live works have size comparison disabled; very wide handscrolls become small when fully contained (manual zoom is available); images are optimized viewing reproductions, not museum-grade gigapixel assets; local data does not sync or survive browser-data deletion. Text and accessibility were checked through the browser accessibility tree and keyboard use, not a full audit with every screen-reader/device combination.

The opening animation has a pause control, pauses when a painting receives keyboard focus, and becomes static when the browser requests reduced motion. Height setup is optional and appears through the size tool or Settings. The original local-storage key is retained so existing responses survive this redesign.

A subtle **How it works** link opens the short guide from the intro; the gallery’s question-mark icon reopens it. The guide appears automatically on the first entry until dismissed. Its `guideSeen` preference is saved with the existing browser data and resets with Clear my data. Older saved visits are migrated without losing responses. Icon tooltips explain actions on hover and keyboard focus; the guide provides the same essential orientation for touch users.

## Art profile

Create my art profile is available from the intro, palette icon, and collection drawer. On the intro it sits immediately before Something new, with only How it works centered and no visible click-anywhere prompt. Compact screens use a labelled profile icon; phone layouts move credits and animation controls to the upper corner so the footer stays in one row. Five quiet dots appear only inside the profile panel. Distinct saved or responded-to artworks count once; height changes and artist guesses do not count. Five is a suggested target, never a required quiz. A local first-impressions summary is clearly labelled as non-AI and remains usable when AI is unavailable.

On 7 September 2026, the saved local key authenticated successfully and Free mode with pay-as-you-go disabled was confirmed. Synthetic generation requests returned HTTP 429, including a minimal diagnostic request. Mistral's [status page](https://status.mistral.ai/) reported its free API temporarily disabled. Production AI configuration remains unset until a successful free-mode test is possible. No successful live profile has been generated; model quality is still unverified.

The server validates catalogue IDs and model response structure, keeps the key server-side, caps input size and output length, and performs no automatic retries or paid fallback. A result is cached locally for unchanged evidence. The shortlist uses artist, period, and culture metadata; its quality and the model’s explanations still need human evaluation. Free-tier limits come from the provider account; per-Worker burst guards are not a durable public-traffic quota.
