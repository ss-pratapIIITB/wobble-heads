# Asset sourcing and gait verification — 2026-09-13

## Checks

- `npm test`: **26 passing, zero failures**.
- `node --check` on all `prototype/js/*.js`: passed.
- `git diff --check`: clean.
- Browser: all six local candidates loaded; native human Walk and the large-head toggle displayed correctly. Human-to-car switching was exercised. Vehicle textures were visually confirmed after adding the shared PNG. The viewer was inspected at 1280 × 720 and 390 × 844, then the temporary viewport override was cleared.
- Yard: forward walking was inspected in slow motion and normal playback, and the new forward/back/stop demo returned to still/head-rest state. The browser warning/error log was empty. Direction reversal and planted-foot drift are covered by automated rig tests; exhaustive manual keyboard/turning coverage is not claimed.

## Evidence for the gait fix

The old cycle raised the foot while its local Z position moved backward, then put it on the floor while it moved forward. At representative ground phases, foot world velocity was about 2.1–3.5 m/s despite walking at 1.35 m/s. A synthetic IK regression also measured approximately 7 cm of foot drift in one backward 30 Hz step.

Three new gait regressions failed before implementation: missing stance/swing sampler, planted-foot drift, and continuing to cycle with unchanged position. They pass with distance-driven phase, the corrected return arc and ground-contact caching. Existing stopping/head-settling behavior remains covered. A separate asset-dependency test first caught the missing `Textures/colormap.png`, then passed after it was extracted from the original archive.

Independent code review confirmed straight forward/back planted-foot error below 0.33 mm in its extended synthetic test. Tight continuous turns can exceed the solver's leg reach and still introduce foot slip; this is a known limit rather than a claim of full motion-captured locomotion. Review also caught a transient human-to-car preview null reference, which was fixed by clearing and guarding head-scale state. Preview cleanup now disposes skeleton bone textures as well as ordinary mesh resources.

The UI detector ran in degraded regex mode because its optional HTML/CSS parsers are absent. Its type-hierarchy warning was assessed against the existing yard's compact inspector style; it is not a computed accessibility audit.

## Merge boundaries

See `MERGE-NOTES.md` for the gait-state contract. See `ASSET-SOURCES.md` for download origins, license files, measured budgets, rejected candidates and skeleton compatibility. No purchases were made. Candidate assets remain separate from the game's runtime asset loading.
