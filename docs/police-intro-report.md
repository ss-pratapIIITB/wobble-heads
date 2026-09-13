# Police introduction cinematic report

## Interface

`new PoliceIntro(scene, {onSkip, reducedMotion})` creates one reusable cinematic controller and adds a hidden 32-instance spark mesh to the supplied Three.js scene.

- `start(actor)` validates `actor.root`, resets elapsed state and returns whether the introduction started.
- `update(dt)` advances normalized `progress`. The standard introduction lasts exactly 3.6 seconds; reduced motion uses a static 0.8-second reveal. Completion hides the overlay and spark pool safely.
- `camera(out)` fills the supplied object with `x`, `y`, `z`, `lookX`, `lookY` and `lookZ`. The standard camera performs one complete orbit with a smooth height crest and identical start/end azimuth. The target is captured at `start()` for a stable composition.
- `cancel()` is idempotent and hides cinematic visuals. The skip button invokes `onSkip`; the integration owner calls `cancel()` and starts its camera return.
- `returnDuration` is `0.6`, exposing the planned chase-camera blend duration without making this visual module own the gameplay camera.
- `active`, `actor`, and normalized `progress` are public integration state.

The class does not mutate actor transforms, health, wanted state, simulation timing or other gameplay state. The parent integration remains responsible for freezing simulation, posing the officer, preventing shots during the introduction, handling skip/Escape, and blending its camera after completion.

## Visual resources

The title overlay contains “POLICE”, “YOU HAVE THEIR ATTENTION”, and an accessible Skip button. The title sits in the lower-left so the orbiting officer remains unobscured, while Skip stays in the upper-right. Its CSS provides a restrained letterbox/vignette, responsive gold-and-ivory title treatment, keyboard focus styling, and motion suppression for both the explicit reduced-motion option and the operating-system media query.

Spark geometry, material, deterministic seed data, transform helper and instance buffer are allocated once in the constructor. Updates rewrite the same 32 instance matrices, so the effect has a fixed resource bound and performs no geometry or instance-buffer allocation per frame.

## Verification

- `node --test tests/police-intro.test.mjs`: 6 tests passed.
- `npm test`: 52 tests passed.
- Tests cover exact duration including the sub-nanosecond pre-boundary, full-orbit endpoints and dynamic height, stable targeting after actor movement, 0.6-second return metadata, bounded/reused spark resources, actor-state isolation, start/reset/cancel behavior, exact DOM titles and overlay lifecycle, parent-owned skip cancellation, DOM-free construction, and reduced motion.
