# Unified car and character review

**Goal:** Put every current design and downloaded candidate on one review page.

**Design:** Expand `prototype/asset-review.html` into a scrolling comparison gallery, grouped into cars and people. Include five current vehicle designs, four downloaded cars, four current character instances and two downloaded humans. Mark current/candidate provenance per model. Shared Idle/Walk/Back/Run and head-size controls let humans be compared together; each tile rotates independently. Preserve the game entry point and link to the unified review from it.

**Performance:** One shared WebGL renderer with scissored views, capped pixel ratio, and rendering only tiles intersecting the viewport. Load each source character once and clone skeletons; downloaded candidates stay outside gameplay loading. Model failure is local to a tile.

- [x] Add a review catalog and coverage tests proving all 15 items are included once with correct sources.
- [x] Replace the single-model viewer with the gallery, shared controls and independent rotation.
- [x] Verify all sources load, compare animations and check narrow-screen layout.
- [x] Update README and merge notes; run the test suite and syntax checks.
