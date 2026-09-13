# Racing, running and police verification — 2026-09-13

## Automated checks

`npm test`: 42/42 pass. Every JavaScript module passes `node --check`; `git diff --check` is clean. Added checks cover racing profiles and moving door glass, opaque lightweight locked traffic, six-hit health/death/reset, spread and cover, sprint timing/cooldown, faster and larger run wobble, held native Death animation, and drift-free articulated ground contact.

`npm run benchmark:geometry` confirms sedan/hatch 3,388 triangles and van 3,532, each with 14 mesh draws. Sports targa is 11,548 triangles. Incremental geometry comparisons are recorded in PERFORMANCE.md and vehicle-racing-report.md; benchmark output uses the older original baseline.

Independent code reviews identified and then verified fixes for native Death pose caching, floating grounded bodies and decreased run wobble amplitude. Final focused review reported no remaining P1/P2 issues. Vehicle review also found no significant remaining issues.

## Browser checks

The live yard loaded both local civilian NPCs and the imported cast without console errors. The revised gallery loaded all 12 entries, has no Kenney car tiles, and includes the racing car plus dark-window traffic. Sports boarding and exit transitioned through the existing staged animation controls.

A police encounter registered six hits out of 22 shots, reached zero health and displayed the death/restart state. Restart restored 100 health and neutral police state. This is one randomized encounter, not a promised hit percentage. Running demo entered run mode, with visibly larger head motion. A timed capture confirmed the down state with the body lying on the ground; the sequence then returned to idle with zero head tilt and an Explorer recovered readout.

## Limits

Six-body-hit death is a gameplay rule, not a anatomical damage model. Police use spread, range and vehicle cover, without tactical pathfinding or bone hitboxes. Falling combines impulse/gravity with articulated or native animation; it is not a full rigid-body ragdoll. Native NPC recovery reverses the source Death clip. Race handling is available, but this pass does not add a race track, timing or race opponents. No overall FPS improvement is inferred from triangle counts alone.
