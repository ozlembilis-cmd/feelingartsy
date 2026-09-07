# Verification record

Checked on 6 September 2026 (America/Los_Angeles).

## Automated checks

14 tests in `tests/` exercise:

- initial unanswered state versus an explicit “Nothing in particular” response;
- multi-selection, exclusivity, and no automatic stage advancement;
- full journey and first-response immutability after story reveal;
- neutral artist-guess persistence;
- explicit unchanged feelings and independent change in understanding;
- skipped first response, absent “same” copying, and skipped reflections not marked complete;
- all optional responses skipped, with “Not recorded” display;
- separate repeat visits and no duplicate save on repeated actions;
- bookmarks, height deletion, and preserved current answers;
- storage round-trip, malformed data, and inaccessible-storage fallback;
- shared-scale geometry across portrait, landscape, square, and Guernica-sized mural dimensions, at heights 120/170/210 cm and viewports 280×250, 800×500, and 1400×800;
- unique IDs, actual file availability, source links, dimension validity, complete original stories, media type, and image-rights readiness for every published record.

Type checking and lint pass. The production build is checked before packaging. Dependency remediation removed the unused server framework from this frontend-only project; the final npm audit reported zero known vulnerabilities.

## Browser interaction and layout checks

The in-app browser was used at 1440×900 desktop and 390×844 mobile sizes. A 670-pixel panel also exposed an intermediate-width issue, fixed by allowing the compact dock to stack below 850 pixels.

Exercised the actual interface for: Begin; first reaction without automatic advancement; optional artist guess; story reveal; unselected second-response controls; I feel the same; understanding-more-with-same-feeling; text reflection; save and inline comparison; save artwork; collection count and Visited history; refresh and Continue; skipping a first response and omission of “I feel the same”; keyboard selection and continuation; title search; zoom, arrow-key pan, reset; Just look and Escape; feet/inches height entry (5 ft 7 in → 170.2 cm) and proportional display; and disabled comparison for unmatched dimensions.

Viewed complete portrait (Girl with a Pearl Earring), landscape (The Starry Night), diamond/square (Mondrian’s Lozenge Composition), and wide mural (The Last Supper) images. All use contain fitting. Zoom is manual; the painting is not automatically panned or animated.

A temporary missing-image source was introduced and restored to exercise failure, retry, retained responses, and recovery. No test URL or missing image remains in the delivered content. The error path is shared with the scale diagram.

Text enlargement was forced to a 32px root (200% of the normal size). On mobile it remains horizontally contained, with a larger scrollable viewing area and wrapped controls. The test style was removed. Reduced-motion CSS disables animations and transitions for `prefers-reduced-motion: reduce`; the CSS rule was checked, but the browser connector does not expose OS-level media emulation. This is not a comprehensive screen-reader or physical-device certification.

The local test data is disposable and separate from the deployed origin. No personal responses are seeded into source code or the deployed app.
