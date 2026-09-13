# Police shooting and introduction verification

## Automated coverage

53 tests pass, including six cinematic tests and five shooting tests. New coverage checks the full 3.6-second orbit, reduced-motion reveal, stable camera target, bounded glitter, overlay/skip/cancel lifecycle, cap removal, muzzle markers, three-shot cadence at 30/60/120 Hz, clear-sight notice detection, no fire/damage while suspended, muzzle-origin tracers and bounded impact effects. Existing six-hit death, cover, recovery, vehicle and locomotion regressions remain green.

## Browser verification

- Desktop and 390×844 introduction render with the officer unobscured, glitter in the 3D scene, lower-third title and a reachable Skip control. Blue headpiece is absent.
- The regular HUD hides during the orbit, then returns to the chase view. Intro health readout remained 100/100 with 0/0 shots; keyboard activation of Skip succeeded and returned focus to the canvas.
- After the reveal, firing resumes in quick sequences. One observed run showed 3 hits from 15 shots with health 46/100; this is a random sample, not a specified accuracy percentage.
- Gallery Preview firing switches to Stop firing and shows two-handed aiming and muzzle flashes; all 12 models load.
- No browser console warnings or errors were recorded during the live encounter.

## Practical limits

The officer remains the existing stylized armored character, with an original modeled sidearm. This is procedural two-hand posing, not motion-captured firearms animation. Cover uses simplified vehicle boxes. Intro motion turns the officer and raises the weapon while the world is paused. The audio is a synthesized firing effect; it depends on browser audio being unlocked by user interaction. No downloaded audio or new runtime dependency was added.
