# Merge notes: performance, camera and pedestrian impacts

## Bring these files together

- `prototype/js/performance.js`: rigid batching, quality profiles, frame sampler.
- `prototype/js/camera.js`: chase framing, angle damping and boom obstruction math.
- `prototype/js/impacts.js`: swept vehicle contact and the reaction lifecycle.
- `prototype/js/effects.js`: bounded blood pool.
- `prototype/js/app.js`: integration, collision routing, input, demo, render loop and UI binding.
- `prototype/js/characters.js`: optimized IK, pose cache, falling/get-up/strike poses.
- `prototype/js/vehicles.js`: mesh complexity reduction and batching boundaries.
- `prototype/index.html` and `prototype/style.css`: quality/benchmark/playback/demo controls.
- `tests/`, `scripts/benchmark-geometry.mjs`, `docs/benchmarks/geometry-before.json`, `package.json`, `package-lock.json`, and these Markdown documents.

The earlier character/vehicle revision also created the shared module layout and made `prototype/cars.html` redirect to `index.html`. Include that foundation if merging into the original standalone-HTML branch. The historical crowd/camera/character experiments are unchanged. Both revisions were developed on the existing working tree; do not omit new/untracked files when preparing your commit.

## Dependency and coordinate contracts

Three.js remains pinned to **0.170.0** in both the import map and Node dependency. No physics or animation package was added. `BufferGeometryUtils.mergeGeometries` comes from the matching Three.js addons version.

Vehicle forward is local **+Z**, driver side is **+X**, and ground is **Y=0**. Characters are normalized to this forward direction before fitting and caching bind poses. Preserve `prepareCharacter → createActor` ordering. Do not reintroduce the old global `FACE_OFFSET` or copy raw bone quaternion tracks between incompatible rigs.

## Highest-conflict areas

### Main loop and pose ownership

Keep simulation substeps separate from `updatePoses()`. Collision and reaction timers run on every simulation step, including distant actors. Posing may run less often. Boarding currently poses within its own transition update because its contact targets change there. A seated driver is positioned by `setHipWorld` and then posed once through the normal pose pass.

Set `poseDirty=true` after reset, impact, attack completion, demo repositioning or other state changes that invalidate a cached pose. Do not skip a pose merely because speed is zero while entering, falling, getting up, striking or settling the head.

### Camera and input

Normal views use an elevated chase camera: 5.2 m behind / 3.05 m high on foot; 7 m behind / 3.45 m high driving. Mouse orbit temporarily overrides heading and recenters after 2.5 seconds. Car inspection is a separate explicit orbit mode, and entering a seat returns to chase mode. The head spring does not move the camera. Boom obstruction checks include both drivable cars and traffic.

**W/S move forward/back; A/D turn** on foot and in cars. Arrows match. This replaces the prior camera-relative walking direction to avoid feedback loops while the camera follows the character's heading. E handles entry/exit. **F is reserved for close-range strikes**, not vehicle entry. Space jumps. Do not restore the older `E || F` entry shortcut.

### Collision and interruptions

Keep vehicle-vs-vehicle blocking. Remove the old “stop car whenever within 2.4 m of a pedestrian” check, because it prevents all impacts. Use `sweptVehicleHit` on actual accepted vehicle motion, including reverse travel. Ignore the driver, seated/boarding occupants and high airborne actors. Below 0.9 m/s, contact does not knock anyone down.

The reaction sequence is `falling → down → gettingUp → fleeing → idle`. Hits cannot restart a fall every frame. Fleeing characters can be hit again after cooldown. Boarding and impacts cancel unfinished strikes; otherwise the driver can remain in a frozen punch and defeat pose caching. The car remains reserved through the entire entry/exit transition.

Falling is a direction-sensitive articulated procedural animation with bounded impulse motion. It is **not** a rigid-body ragdoll solver. Blood is small and pooled. Flee navigation tries traversable directions away from the hit source, and actors can move out of overlaps left by an impact.

### Geometry edits

Do not merge across door, steering or wheel pivot boundaries. Do not animate baked static meshes. Transparent materials keep separate meshes and single-pass rendering. The shader pool and frame sampler must not allocate scene objects in the render loop. Shared material/primitive caches belong to the page/module lifetime; do not dispose them when removing just one car.

## Merge verification

1. `npm install` (or `npm ci` when the lockfile is present).
2. `npm test` and `npm run benchmark:geometry`.
3. `node --check` each `prototype/js/*.js` file; `git diff --check`.
4. `npm start`, then open `http://localhost:8080/prototype/index.html`.
5. Run Walk / stop demo: observe wobble then exact rest. Turn on foot and verify camera recenters behind the player.
6. Inspect both cars, enter, drive, stop and exit. Check doors, spinning/steering wheels, driver hands, and seat pose. Press F then E near a car to verify the strike is cancelled during boarding.
7. Run Car impact demo. Observe falling, ground contact, a small blood patch, recovery, running away and effect expiry. Character tuning → Slow motion makes the transitions easier to inspect. Restore Normal before ordinary play.
8. Test a close-range F strike, a miss/out-of-range strike, reverse-car contact, and repeated collisions. Idle/seated/boarding ownership must remain coherent.
9. Run Performance → Benchmark 5 s for each relevant preset and record viewport, pixel ratio, median/P95 frames and CPU time. Closing/hiding the tab cancels a sample. Do not compare different camera views or interpret CPU submission time as GPU timing.

Measured results and reuse details are in `PERFORMANCE.md`. Unit tests cover geometry/animation boundaries, IK lengths, head settling, camera math, swept contact, cooldown/lifecycle and bounded effect expiry. Full browser driving coverage and a device matrix remain manual checks; no sustained-60-FPS claim is implied.

## Follow-up: free assets and moonwalking fix

Bring `motion.js`, `characters.js`, `app.js`, `tests/gait.test.mjs`, and the updated walk-demo label together. `actor.phase` now counts **gait cycles**, not radians. The head's separate `head.phase` is unchanged. Gait phase advances from signed root displacement projected onto heading, not `dt * speed`; this keeps steps matched to movement and reverses the pattern for S/backward movement. The stance is linear backward travel in body space; the lifted return moves forward. Ground contact points are retained through ordinary turns. Small pelvis lowering keeps the leg targets reachable.

Clear `actor.gait` when teleporting/repositioning actors. Reset, benchmark resets, `setHipWorld` and reaction posing do this; the pose function also rejects jumps larger than 0.75 m. Pose caching includes heading. The native gait remains a lightweight approximation: abrupt tight turns, stopping and direction changes are not a motion-captured locomotion system.

Asset candidates live in `prototype/assets/candidates/`. Include **Textures/colormap.png**, both creator license files and `catalog.json`, not just model files. `tests/assets.test.mjs` verifies local dependencies, checksums and geometry counts. Candidate humans use a different control-rig hierarchy and are not drop-in replacements for the yard's Mixamo-style IK. See `ASSET-SOURCES.md` before integrating them.

## Unified review page

The review page now shows all 15 items together: five current vehicle designs, four downloaded cars, four current cast instances and two downloaded humans. Merge `prototype/asset-review.html`, `prototype/review.css`, `prototype/js/asset-review.js`, `prototype/js/review-catalog.js` and `tests/review.test.mjs` together. The yard links to this page.

The gallery uses one WebGL renderer and individual scissored scene views. Preserve the full tile viewport when clipping its visible scissor rectangle, otherwise partially scrolled models distort. Only visible tiles are posed/rendered; scroll, filter, resize and control changes invalidate the paused frame. Pixel ratio is capped at 1.25. Assets and the shared environment are retained for the page lifetime so scrolling does not reload models. Character downloads are cached by URL and skeletons are cloned per instance. Gameplay asset loading is unchanged.

Current cast previews use the yard's procedural gait; downloaded humans use native clips. Shared Backward selects the downloaded `Run_Back` clip, since those files contain no backward-walk clip. Individual native clip menus can override shared motion. The gallery is an in-place visual review, not a gameplay test or a claim that the different rigs share motion timing. All models remain on the same page when using the category filters.

## Racing, running and police update — 2026-09-13

This section supersedes the earlier candidate-only and 15-model gallery notes.

- Active gallery: six original car designs (Jeep, Mini, Veloce sports targa, sedan, hatch, van) and six character instances. Four Kenney cars are filtered out; their archived source files/licenses remain for provenance. The two downloaded humans are Quaternius assets and now load in the live yard.
- `vehicles.js`: `playerUsable`, `maxSpeed`, `acceleration`, `reverseSpeed` are the shared vehicle contract. Only jeep/mini/sports are usable. Sports uses 24 m/s, 9 m/s², 5 m/s reverse; old hero cars use 8, 4, 3.5. Its side glass moves with the door; open targa center clears oversized heads. Locked traffic omits interior/driver geometry and uses opaque dark glass; do not re-add app-level driver silhouettes.
- `native-characters.js`: dedicated Quaternius native clip adapter. Do not rename its control bones to Mixamo or pass it into the existing IK/boarding code. Cache pre-wobble head orientation/scale; never reset every bone before an unchanged mixer sample, which causes held Death poses to snap to bind pose.
- `motion.js`: default wobble strength 3.8; frequency and spring response scale together at running speeds. Shift+movement runs at 3.7 m/s. `stepSprint` accumulates elapsed run time (7.5 s straight, faster while turning), with a 12 s cooldown. Player trips recover control after standing; civilian impacts still end in fleeing.
- `impacts.js` / `characters.js`: gravity, airborne versus ground friction, impact roll, articulated contact settlement and persistent fatal down state. Ground contact must lower as well as raise the root. Keep head-size-aware clearance. This is a lightweight hybrid, not a full rigid-body ragdoll.
- `combat.js`: deterministic spread/ray/health functions. Body damage is 18 out of 100 health, so six successful hits kill. No damage after death. `police.js` owns hostility, visible police accessories, pooled tracers, range, randomized cadence/spread, vehicle cover checks and death transition.
- Violence by the player starts hostility. The Police encounter button resets and stages a demonstration. Reset/Restart/R clears health, death, hostility, effects and current vehicle reservation. Dead actors cannot move/drive/board/strike; death does not automatically respawn.
- UI controls added: Racing coupe inspection, Run / trip demo, Police encounter, health readout and restart notice. Existing `cars.html` redirects to the live yard. Main yard and unified gallery share the vehicle and head-motion implementations.

Merge the new native/combat/police modules alongside `app.js`, `characters.js`, `motion.js`, `impacts.js`, vehicle changes, gallery catalog/viewer, both page HTML files and styles. Include new combat/native tests and extended gait/vehicle/review tests. Keep the two local human glTF files and Quaternius license. The existing imported cast still requires CDN access.

Known limits: police use a torso target with spread and simplified vehicle cover boxes, not per-bone hitboxes or tactical navigation. Native civilian recovery now blends into the forward grounded-to-standing half of Roll (see the aiming/recovery follow-up below). Driving collisions remain yard approximations; there is no race timing/track system in this request. Extreme head tuning may still intersect windshield/hoop geometry.

## Police shooting and introductions — 2026-09-13

- The blue head accessory is removed entirely. `dressPolice` now builds the badge and a sidearm with slide, grip, sights, barrel, muzzle marker and reusable flash geometry. `poseAim(actor,target,{recoil,raise})` provides a two-hand raised stance and visible recoil; it is shared with the gallery firing preview.
- `stepBurst` in `combat.js` schedules three shots 0.18 s apart, then a 1.25–1.70 s recovery. The existing angular spread and 18-damage/six-hit rule remain. Shooting rays begin at the posed weapon muzzle, not the torso. Range remains 26 m for police engagement and 30 m for rays. Vehicle cover still uses simplified boxes.
- `gun-effects.js` owns eight reusable tracer lines and 32 impact-spark instances. No light or particle object is created per shot. Synthetic shot audio uses Web Audio after a user gesture; the Sound on/off button mutes it. There are no downloaded sound dependencies.
- `PoliceSystem.findObserver` requires a wanted, living player within range and a clear torso sightline. `app.js` starts the introduction on the first such sighting per reset/encounter, before police firing. Hostility is still triggered by player violence or Police encounter.
- `police-intro.js` owns only presentation: one 3.6 s orbit, 32 instanced glitter particles, lower-third title and Skip overlay. `police-intro.css` is required by index.html. Reduced-motion preference selects a static 0.8 s reveal without glitter.
- Main app owns simulation suspension, officer turn/draw/raise pose, one-shot encounter tracking, Escape/Skip, and the 0.6 s camera return. No world locomotion, traffic simulation, damage or firing advances during intro or return; the officer’s presentation pose still animates. Regular HUD is hidden while the orbit is active. Reset cancels the cinematic and clears encounter tracking. Keys are cleared at entry/skip; the intro does not repeatedly trigger during continuous hostility.
- Cinematic camera uses the car obstruction check and returns from the actual rendered view. Preserve the final camera sample on natural completion and initialize it immediately on start for an immediate skip.
- The review gallery provides Preview firing / Stop firing on the police card. This is a local visual preview and does not damage anybody.

Merge together: app.js, characters.js, combat.js, police.js, gun-effects.js, police-intro.js, asset-review.js, index.html, style.css and police-intro.css, plus the new shooting/intro tests. This extends the prior racing/health work. Keep the intro free of combat ownership; its skip callback delegates cancellation and return blending to the main app.


## Aiming and human recovery follow-up — 2026-09-13

- Merge `characters.js`, `app.js`, `impacts.js`, `native-characters.js`, `tests/aim-recovery.test.mjs` and `tests/native-characters.test.mjs` together.
- The intro previously kept the officer's wandering heading while IK reached toward a world-space target behind them. Intro heading now faces the player; `poseAim` also aligns the actor before solving either arm, covering ordinary combat and gallery previews.
- Impacts retain `reaction.startHeading` and ease toward the landing direction instead of instantly turning the body. Unequal knee buckling and earlier arm bracing break up the rigid fall.
- Procedural recovery caches settled contacts once on `reaction.recovery`, pushes the chest up, draws a leading foot under the hips, releases each hand separately, and extends to standing. Duration remains 1.45 seconds; death and player-trip state ownership are unchanged. Clear the whole reaction object on reset/new impact.
- Quaternius rigs retain their native controls. Recovery blends the held Death endpoint into the forward latter half of Roll over 0.28 seconds, rather than reversing Death. Reused mixer action weights must be reset when selecting a new action.
- No extra geometry, particles, physics engine or render passes. Cached recovery contact vectors exist only during the reaction; additional IK work is limited to recovering characters. Native recovery evaluates two clips during its brief transition.

## Relaxed walking arms — 2026-09-13

- Merge the `poseWalking` and recovery hand-target changes in `characters.js` with the new arm-proportion regression in `tests/gait.test.mjs`.
- Removed fixed waist-height walking targets. Hand reach now scales to each rig's upper-arm + forearm length, with 95.5–97.5% extension and a smooth opposing pendulum swing. This gives a gentle elbow bend rather than folded arms. Running blends toward 78.5% extension and a larger swing.
- Targets originate at the posed shoulder, accounting for gait pelvis lowering. Recovery finishes at the same relaxed hand position, avoiding a hand drop when idle resumes. Native animation clips and police aiming keep their own poses.
- Verification: 61 tests passed, JavaScript syntax and diff checks passed. No extra meshes, materials or render passes.

## Merlion landmark — 2026-09-13

Keep `prototype/assets/merlion/` (including attribution), `prototype/js/merlion.js`, and `scripts/prepare-merlion.py` together. The yard loads it asynchronously at (-10, 0, -32), provides a Merlion inspection camera, and blocks character/car movement through its base and pool. The shared gallery now has 13 models and a Landmarks filter. Preserve the HUD landmark panel, catalog entry, gallery animation branch and collision hooks when merging. Source is a figurine resculpt, with game-added fountain and paving.

## Environment asset review — 2026-09-13

Keep `prototype/assets/environment/` with the gallery changes in `asset-review.html`, `asset-review.js` and `review-catalog.js`. Catalog accepts an optional environment array and now renders 22 cards across five categories. Buildings/Trees filters and per-tree variant selectors are review-only; yard gameplay and loading cost are unchanged. Environment models are uniformly scaled to preview heights and centered using their bounds; original GLBs are unmodified.
