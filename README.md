# Second Look

A working, frontend-only art gallery built with React, TypeScript, and Vite. Look at a painting, record an optional first response, reveal its story, look again, and keep a private reflection. There are no scores or required answers.

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

The deployment output is `dist/`. Any static web host can serve it. `.openai/hosting.json` retains the registered private Sites project and static-output configuration. No environment variables, database, account service, or AI API are needed for the app.

## What is included

- First-look → story → second-look → optional reflection → inline comparison.
- Multi-select feelings, exclusive “Nothing in particular,” custom words, skipping, and explicit “I feel the same.”
- Optional artist guesses for the priority set. Attribution is revealed neutrally; no scoring.
- Frozen first response after revealing context, and distinct records for every visit.
- Local settings, saved IDs, current position, and per-visit history. Return visits offer Continue or Something new.
- Height in cm or feet/inches, deletion of height, and clearing all app data.
- Original full artwork fitting, manual zoom/pan/reset, and Just look with Escape to restore controls.
- A two-dimensional size diagram with one shared pixels-per-centimeter scale.
- Collection search by title or artist and Available, Saved, and Visited views.
- Responsive layouts, keyboard controls, visible focus, screen-reader labels, reduced-motion styles, and image recovery controls.

All personal state stays under the single localStorage key `second-look:v1`. If storage is inaccessible or full, the app keeps working in memory and displays a session-only notice. Clearing data affects only this app’s key. Local preview and the deployed URL have separate browser storage, as do different browsers/devices. There is no analytics, account, or transmission of height, guesses, or notes. A private hosting layer may ask the site owner to sign in to open the URL; this is separate from the app and its local data.

## Collection: actual delivery count

**100 sourced records; 99 published paintings; 1 rights-pending entry.** There are no empty placeholders in the live queue. This is a curated selection, not an objective popularity ranking.

The ten requested priority works have records. Nine are available, including The Creation of Adam as a fresco with a museum-supported ceiling-campaign date of 1508–1512. Its exact panel dimensions have not been established, so its size comparison is disabled.

**Guernica is not published.** The editorial record, verified 776.6 × 349.3 cm dimensions, museum references, and image configuration slot are present. No image has been supplied because permission for reproduction has not been established. Its museum copyright notice is linked in the record. An authorized asset is the remaining work needed to reach 100 published entries.

The expanded collection includes paintings from the Art Institute of Chicago and Cleveland Museum of Art with verified object-level public-domain/CC0 indicators. Chinese, Japanese, Korean, Indian, and Tibetan works broaden the collection alongside European and American paintings. Screens, devotional cloth paintings, and illustrated painted pages are identified by their actual medium. No prints, photographs, or sculptures were added to reach the count.

**Size comparison is enabled for 75 of the 99 published works.** For 24 works it is disabled because dimensions are missing, the photograph includes a frame/mount/predella, or its visible extent cannot be matched reliably to the verified painting dimensions. Verified object measurements are preserved separately from display eligibility. Comparisons are proportional estimates, never actual size on screen or a recreation of a museum’s hanging position. Small photographic/aspect variation may remain even in eligible records. No artwork or person is independently fitted into matching-height boxes.

## Editing content

Start with `CONTENT-GUIDE.md`. The content lives in `src/content/artworks.json`, separate from interface components. `src/content/types.ts` documents the schema. `content-research/` contains the individual source, rights, dimension, download, and image-review records. Every live work also exposes Sources and Image credit & permissions in the app.

The original summaries contain roughly 60–90 words across the three story sections; the validation ceiling is 95 to allow small punctuation/tokenization variation. Longer content belongs in the optional `story.more` field. Interpretations are framed as interpretations, qualified attributions remain qualified, and historical dates distinguish exact years from ranges.

The artwork JPEGs and font files are served locally, so the app does not depend on fragile external hotlinks. Fonts use the SIL Open Font License; their notices are in `licenses/`. Museum image rights remain those documented for each asset; the app does not assert universal worldwide public-domain status.

## Verification and limitations

See `QA.md` for the exercised journeys and formats. Fourteen automated tests cover transition invariants, skipping, unchanged emotions, independent understanding, persistence, corruption, revisiting, saving, scale geometry, and source/rights readiness. Type checking, lint, and the production build are part of delivery validation.

Known limits: Guernica awaits an authorized image; 24 live works have size comparison disabled; very wide handscrolls become small when fully contained (manual zoom is available); images are optimized viewing reproductions, not museum-grade gigapixel assets; local data does not sync or survive browser-data deletion. Text and accessibility were checked through the browser accessibility tree and keyboard use, not a full audit with every screen-reader/device combination.
