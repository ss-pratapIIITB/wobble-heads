# Asset candidates and grounded walking

**Goal:** Find reusable prebuilt vehicles/humans and remove the moonwalking pattern without changing car interactions or head settling.

**Approach:** Keep the existing procedural rig adapter, but replace time-driven sinusoidal feet with a distance-driven stance/swing cycle. Ground contact moves backward relative to the body at exactly its travel speed; the returning foot lifts. Signed travel supports backing up. Cache world contact points through turns. Download a small selection of clearly licensed assets for visual review and record source, license, size, topology and integration gaps before replacing animated vehicles.

**Alternatives considered:** Flipping the sine fixes the inverted lift but retains speed mismatch and backward sliding. Replacing the entire animation system with third-party clips needs per-rig retargeting and does not itself solve root-speed mismatch. Distance-driven contact fixes the current defect while retaining boarding and impact poses.

## Work

- [x] Add failing walking regression tests using synthetic articulated rigs: grounded-foot world drift, lifted return, reverse motion, stop and render-rate independence.
- [x] Implement gait sampling in `motion.js` and integrate actual movement, contact retention and interruption resets in `characters.js` / `app.js`.
- [x] Inspect primary asset sources, download selected licensed candidates, and measure their real GLB budgets.
- [x] Add a lightweight candidate preview and an asset sourcing Markdown with integration recommendations.
- [x] Run the test suite, inspect forward/backward walking and stopping in the browser, verify candidate loading and update merge notes.

No purchases. Preserve previous uncommitted work. Candidate assets must not silently replace working door/seat rigs. Files intended only for review must not load in the game.
