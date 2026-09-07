# Verification record

Checked on 6 September 2026 (America/Los_Angeles).

## Automated checks

16 tests in `tests/` exercise:

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

## Immersive redesign — 7 September 2026

Checked the new floating-artwork intro at desktop 1440×900, the normal 667-pixel panel, and mobile 390×844. Pause changes the control to Play; painting selection opens that exact work. Tab then Return enters the gallery and resumes the saved visit. The headline uses the local Inter Tight variable font. Background and tile entry lead directly into the existing journey, with no height onboarding gate.

Verified the supplied Guernica image in the live queue, its full uncropped aspect ratio, blurred background extension, and disabled size tool for its angled museum photograph. Completed Curious → story → I feel the same → understand more → save, then reloaded and resumed the same comparison. Just look hides the dock and chrome while keeping restore and credits available. The original browser storage key and visit history model are retained.

At 200% root text size on mobile, the intro prompt wraps beside its icons and reaction controls wrap without horizontal overflow (document width 390px, dock scroll width 360px). A resize-related hidden-container scroll offset was fixed with non-scrollable clipping; the artwork and header stay in place. The temporary enlarged-text stylesheet was removed before the final build.

The animation listens for reduced-motion preference changes and renders a static composition when requested. Its pause control was exercised; OS-level reduced-motion emulation remains unavailable in the browser tool. These checks supplement the original flow coverage above, not a full device or screen-reader audit.

## Guide and icon explanations — 7 September 2026

Verified the new How it works dialog from the gallery, its mobile 390×844 layout, the Add your height shortcut, and the concise height explanation. Confirmed an actual pointer hover displays the Settings tooltip and keyboard focus displays the Explore collection explanation; Escape dismisses the tooltip. The existing visit and responses remain intact while opening and closing the guide. An added model test covers migration from saved data without `guideSeen`, dismissal persistence, and reset on a new state.

## Art profile update — 7 September 2026

- 24 tests pass, including distinct-work counting, save-only and sparse profiles, repeated/current visit deduplication, skipped/height/guess exclusion, server input validation, same-origin enforcement, missing-configuration behavior, structured output and catalogue-ID checks, quota handling and no automatic retries. Model API responses in these tests are synthetic fixtures.
- UI uses the existing accessible dialog and icon tooltip system, responsive CSS, optional reflection sharing, and local result caching. A small counter is shown only after opening the profile.
- New browser interaction/visual QA was not performed for this update. Existing browser checks above describe the earlier gallery version.
- No Mistral account/key is available yet. Live model quality, quota, latency, provider configuration, and end-to-end generation remain unverified. The app reports that AI profiles are not connected and continues to show a truthful local summary.
- Existing gallery storage is retained. Clear my data removes the gallery key and the profile cache. No email or account flow was added.
