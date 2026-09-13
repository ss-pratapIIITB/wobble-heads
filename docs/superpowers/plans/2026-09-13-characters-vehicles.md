# Characters and vehicles implementation plan

**Goal:** Revise the playable scene with movement-driven heads, articulated boarding, two open cars and three traffic body styles.

**Architecture:** Shared ES modules for the application, procedural vehicle meshes, character rig targeting and deterministic motion. Preserve historical standalone experiments.

**Tech stack:** Three.js r170, browser ES modules, Node test runner.

## Steps

- [x] Add regression tests for motion timing, spring settling and vehicle geometry.
- [x] Build vehicle models and anchors in `prototype/js/vehicles.js`.
- [x] Build deterministic head and boarding timing in `prototype/js/motion.js`.
- [x] Replace incompatible pose overlays with rig-aware targeting and integrate the shared app.
- [x] Add traffic, inspection controls and reset cleanup.
- [x] Run `npm test`, syntax checks and browser interaction review; update README with controls and limits.
