# Officer aiming and recovery verification — 2026-09-13

## Cause and changes

The police intro retained the actor's previous walking heading, while hand IK used the player's world-space position. A player behind the officer therefore pulled the hands behind the torso. The intro now faces the player, and the shared aiming function aligns the torso before solving either arm.

Procedural falls preserve the initial heading, buckle the knees unequally, and brace earlier. Getting up uses cached settled contacts, a supported chest lift, staggered foot placement, separate hand release and standing extension. The 1.45-second recovery duration remains compatible with the impact state machine.

Native Quaternius recovery plays the latter half of Roll forward, blended from the held Death pose over 0.28 seconds. Actual Casual/Hoodie animation sampling found a 73-degree RMS joint discontinuity without blending; the blend removes the initial positional jump. This remains an approximation using the source Roll clip, not a dedicated motion-captured get-up animation or full ragdoll simulation.

## Verification

Final `npm test`: 60/60 passed. Changed JavaScript syntax checks and `git diff --check` passed.

- Regression tests first reproduced backwards aiming and unsupported recovery. New coverage checks front/side/rear aim, supported early recovery, unequal foot placement, endpoint continuity, enlarged-head clearance, and initial impact orientation.
- Browser: slow-motion Run / trip demo reached gettingUp and returned to idle with the character standing on the ground; no console errors.
- Browser: Police encounter showed the weapon lifting in front of the officer's chest during the orbit introduction.
- Native tests cover held down poses, blended forward recovery, bounded head scale and repeated impacts.
- Merge and performance details are in MERGE-NOTES.md; no new geometry or render passes were added.
