# Performance, camera and impact implementation plan

**Goal:** Reduce rendering and animation costs, add chase cameras and complete impact recovery behaviour.
**Architecture:** Reusable geometry batching, camera math, impact state and effect modules; integrate with the existing yard and character rig. Preserve the previous turn's uncommitted work.
**Tech stack:** Three.js r170, ES modules, Node tests.

- [x] Measure baseline vehicle geometry and browser frame times.
- [x] Test and implement rigid mesh batching, lower decorative tessellation and render-quality controls.
- [x] Reduce inverse-kinematics transform work, reuse math temporaries, cache idle/seated poses and throttle distant posing.
- [x] Test and implement elevated chase camera with orbit recovery and obstruction handling.
- [x] Test swept vehicle strikes and impact/recovery/flee state progression; integrate F strikes.
- [x] Pose articulated falls and get-up motion; pool small fading blood effects.
- [x] Verify browser gameplay, benchmark the finished build and write reusable merge/performance Markdown.
