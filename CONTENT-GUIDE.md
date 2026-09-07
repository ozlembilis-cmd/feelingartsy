# Content and image review

Edit `src/content/artworks.json`. Each entry needs a stable, unique ID and these fields:

| Field | Purpose |
| --- | --- |
| `id`, `title`, `artist`, `date` | Identity and explicit attribution/date display. Preserve “attributed to,” “follower of,” approximate dates, and specific versions. |
| `medium`, `collection`, `culture`, `period` | Painting medium, collection, and cultural/historical context. Frescoes are frescoes; dry wall painting is not automatically fresco. |
| `dimensions` | Eligible width × height in centimeters with a primary source and review note, or `null`. |
| `verifiedArtworkDimensions` | Optional sourced object measurements retained even when comparison is disabled for the available image. |
| `image.src`, `image.alt` | Local approved asset path and a neutral visual description that does not unnecessarily reveal the title before the story. |
| `image.source`, `credit`, `license`, `permissionUrl` | Individual image record, credit, exact permission basis, and evidence URL. Attribution alone is not permission. |
| `image.review`, `reviewedAt` | `approved` or `pending`, and the date of the image review. |
| `story.behind`, `matters`, `closer` | Original short context, specific significance, and a visible-detail/open observation prompt. |
| `story.more` | Optional longer copy, collapsed by default. |
| `artistChoices` | Empty array if not offered, or 3–4 plausible choices containing the attributed artist. Never use scores. |
| `sources` | Museum/primary-source labels and HTTPS links supporting history and metadata. |
| `status`, `statusNote` | Editorial publication state and outstanding issue, if any. |

Use these publication states distinctly:

- `planned`: a candidate selected for future work, with no implication of verification.
- `research-needed`: metadata or editorial facts are not yet sufficiently supported.
- `rights-pending`: sourced editorial record retained; a usable image is not approved.
- `published`: complete, source-checked content and an individually approved usable asset.

Only published entries with approved images and complete core story fields enter the queue. Tests reject incomplete live metadata, missing assets, non-HTTPS sources, bad dimensions, duplicate IDs, unapproved rights, and an unexpected live count. Update the count assertions only when the underlying review is genuinely complete.

For a new image, prefer a museum’s explicit object-level CC0/public-domain indicator or a file-specific license that permits the intended use. Preserve the image record and rights evidence. Do not infer permission from the museum’s general reputation, an image credit, a search thumbnail, or the age of an artwork. Add the approved image to `public/artworks/`, retaining its full composition and original aspect ratio. Do not insert generated imitations.

For scale, verify unframed **width and height** from an authoritative record. Check what the image actually contains: a surrounding mount, folded screen perspective, frame, doorway, or photograph border can make direct fitting misleading. If the extent cannot be matched, retain the verified object dimensions in `verifiedArtworkDimensions` but set `dimensions: null`. For rotated/diamond paintings, a rectangle around the image is not the original square’s side measurement. Do not enable comparison by guessing.

The scale helper is `fitScale` in `src/model.ts`:

```text
scale = min(availableWidth / combinedWidthCm,
            availableHeight / max(artworkHeightCm, personHeightCm))
artworkWidthPx = artworkWidthCm × scale
artworkHeightPx = artworkHeightCm × scale
personHeightPx = personHeightCm × scale
```

“Not recorded” is distinct from “Nothing in particular.” The reducer freezes first responses when context appears. To revise the journey, keep these invariants and preserve separate visit IDs. Never populate personal responses from example values.

After editing, run `npm test`, `npm run lint`, and `npm run build`. Inspect representative portrait, landscape, square, and very wide works. Keep the image credit accessible before any attribution reveal. Local personal state must never enter content files, logs, analytics, or requests to outside services.

## Owner-supplied photographs

Guernica is the one `image.provenance: "user-supplied"` entry. Its source and permission record are local files, linked from Sources. Its image is used at the photographer/site owner’s explicit request in the private gallery; do not relabel it public domain or imply public redistribution rights. The photograph includes the museum setting and perspective, so `dimensions` stays null while `verifiedArtworkDimensions` preserves the sourced canvas measurements. The historical priority research record describes the former rights-pending state; `guernica-user-photo.md` records the current supplied asset.

The intro’s curated image list is in `src/components/ArtIntro.tsx`. Its images come from the same live content records; replacing an asset there also updates the viewer. `src/immersive.css` controls the new opening and ambient gallery layout.
