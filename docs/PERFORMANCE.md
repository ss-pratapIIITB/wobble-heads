# Wobble Heads performance changes

## Scope and measurements

Measured in the Codex in-app browser at 1280 × 720 on this workstation, with the same elevated reference camera used for comparisons. No hardware/GPU claim is inferred from this browser sample. Character movement and visibility vary slightly between runs. CPU time below includes simulation, posing, HUD work and WebGL submission; it is **not** GPU execution time. Frame intervals include scheduling and GPU stalls.

| Sample | Pixel ratio | Median frame | P95 frame | Median CPU | P95 CPU | Draw calls | Visible triangles |
|---|---:|---:|---:|---:|---:|---:|---:|
| Before optimization | 2 | 50.0 ms | 116.6 ms | 44.2 ms | 68.1 ms | 914 | 297,342 |
| Optimized, Balanced | 1.5 | 33.4 ms | 50.3 ms | 2.7 ms | 6.8 ms | 144 | 129,938 |
| Optimized, Performance | 1 | 17.0 ms | 49.7 ms | 1.9 ms | 4.7 ms | 144 | 129,938 |
| Final build, Performance, warmed repeat | 1 | 16.7 ms | 16.8 ms | 2.4 ms | 4.0 ms | 144 | 129,938 |

The before sample contains 94 frames over approximately five seconds. Balanced contains 144 and Performance contains 201. The 17 ms median is approximately 59 FPS for the median frame, **not** a sustained 60 FPS guarantee: longer frames remain in the tail. Baseline draw/triangle values were captured at the end of the sample; optimized values are medians. These measurements establish a large improvement, not a laboratory-controlled benchmark.

The final warmed repeat contained 301 frames after exercising entry/exit and using the benchmark's world reset. It reached roughly 60 FPS during that five-second sample, with no browser warnings/errors observed. The earlier samples are retained to show variability; this short repeat is not a cold-start or cross-device guarantee.

`Performance` is the default. `Balanced` and `High` preserve an explicit quality choice. The browser benchmark warms for one second, samples for five seconds, temporarily uses the comparison camera, restores cars/characters to their starting locations, normalizes playback speed and cancels if the tab becomes hidden. It leaves the world reset; do not run it during a gameplay state you want to keep.

## Deterministic vehicle geometry counts

Run `npm run benchmark:geometry`. The captured baseline is in `benchmarks/geometry-before.json` and the script constructs the current models, rather than estimating from source lines.

| Vehicle | Meshes before → after | Triangles before → after | Triangle reduction |
|---|---:|---:|---:|
| Open 4×4 | 315 → 28 | 86,348 → 16,716 | 80.6% |
| Cabrio | 178 → 25 | 46,800 → 13,504 | 71.1% |
| Sedan | 170 → 28 | 44,536 → 12,072 | 72.9% |
| Hatchback | 170 → 28 | 44,536 → 12,072 | 72.9% |
| Van | 174 → 28 | 45,736 → 12,216 | 73.3% |

Mesh counts are a useful submission budget, not an exact frame draw count: shadows, transparency, visibility and material passes affect actual calls.

## Reusable techniques

### Batch rigid parts by material and transform owner

`prototype/js/performance.js` exports `batchRigidMeshes(root, boundaries)`. It bakes each opaque mesh into its rigid owner's coordinate system, merges compatible geometry by material/shadow flags, and preserves nested animation boundaries. Transparent glass remains separate for sorting. Input geometry is cloned; cached shared source geometry is never disposed by the batcher. Temporary clones are disposed. Result geometry bounds are computed once.

Call once during construction. Rebuild from source meshes if the design changes. Do not call in the render loop. Supply every independently animated pivot as a boundary. For vehicles that means driver door, steering wheel, every wheel-spin group and every front-wheel steering parent. The passenger door is currently fixed. Add it as a boundary before animating it.

Merged static children have `matrixAutoUpdate=false`. Moving a static child after batching will not work as an ordinary mesh edit. Root and boundary transforms retain automatic updates. Never pass skinned characters through this routine. The world stage is batched separately before dynamic objects are added.

### Spend triangles where they change the silhouette

Thin decorative boxes use twelve-triangle box geometry. Remaining rounded boxes have one bevel segment. Small rings use 6 × 20 torus segments. Major silhouettes, tires, cabin openings, seats, hinges and roll bars remain. This is a geometry budget reduction, not a distance LOD system.

### Avoid repeated skeleton traversal

`characters.js` refreshes a rig before posing, reads cached world matrices directly during limb solving, reuses solver vectors/quaternions, and updates only affected chain matrices between aiming the upper and lower bones. The renderer propagates the complete skeleton afterward. The solver is synchronous with module-local scratch storage; do not make it asynchronous or invoke it recursively.

Idle/seated poses are cached once head settling finishes. State changes and interruptions set `poseDirty`. Distant NPC poses update at a lower frequency; movement, hits, cooldowns and reaction progression continue at simulation frequency. Head phase/damping receives accumulated pose time. Never throttle the gameplay state machine just because an actor is off-screen.

### Budget pixels, shadows and UI updates

| Preset | Pixel-ratio cap | Shadow map | Shadow update rate | Distant NPC pose rate |
|---|---:|---:|---:|---:|
| Performance | 1 | 512² | 15 Hz | 20 Hz |
| Balanced | 1.5 | 1024² | 30 Hz | 30 Hz |
| High | 2 | 2048² | 60 Hz | 60 Hz |

Actual pixel ratio never exceeds the device ratio. NPCs farther than 22 m pose at 10 Hz; the player and nearby actors retain per-frame posing. Shadows are cached between scheduled updates. Slider values are cached when changed; the HUD updates at 10 Hz and only writes changed strings. Hidden tabs skip simulation and rendering. Large frame deltas are bounded to 100 ms and split into steps no larger than 1/60 s.

`renderer.compileAsync` prepares scene shaders, including the blood-pool material, before enabling character controls. This shifts first-use compilation into loading. It does not eliminate GPU scheduling hitches or texture-upload cost on every device.

### Pool effects

Blood uses one instanced mesh and 48 reusable slots, six small drops per burst. Drops fall to the floor, fade/shrink after five seconds and expire at eight seconds of simulation time. Repeated impacts recycle old slots. Idle pools skip matrix work. There is no growing array of decals, per-hit geometry allocation, or per-particle draw call.

## Remaining limits

No low-end phone benchmark or GPU timer-query profile has been performed. Traffic lookup is still suitable for this small yard, not hundreds of cars; use a spatial grid before increasing population substantially. Character mesh LOD, compressed local texture pipelines, shared NPC vehicle geometry across instances, and off-main-thread simulation are future options to evaluate only against measurements. Performance mode has visibly simpler shadow edges. High mode can still be GPU-bound.

## Locked traffic and racing update — 2026-09-13

Relative to the previous optimized versions, opaque locked traffic now removes hidden cabin details and high-detail rim pieces:

| Vehicle | Previous triangles | Current triangles | Reduction |
|---|---:|---:|---:|
| Sedan | 12,072 | 3,388 | 71.9% |
| Hatch | 12,072 | 3,388 | 71.9% |
| Van | 12,216 | 3,532 | 71.1% |

Each traffic model submits 14 mesh draws. Tint alone does not remove triangles: the savings come from omitted geometry and simpler opaque construction, which also avoids transparent window sorting. Six traffic instances save 52,104 vehicle triangles before counting the removed driver silhouettes. The new sports targa adds 11,548 triangles and the two new human NPCs add 11,982, so this pass still reduces geometric work overall at equivalent visibility. Camera view and shadows determine actual submitted counts.

The shared renderer, pixel-ratio/shadow caps, distance-throttled NPC posing and pooled blood remain. Police tracers reuse four line geometries. Native humans each use one AnimationMixer; source animation data adds roughly 6.2 MB of transfer. Gallery car candidates are no longer loaded. The geometry benchmark compares against the original pre-optimization baseline, so its percentages differ from this incremental table. No FPS gain is inferred solely from triangle reductions.
