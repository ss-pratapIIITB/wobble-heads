# Performance and gameplay verification — 2026-09-13

## Automated checks

- `npm test`: 21 tests passed, zero failures.
- `npm run benchmark:geometry`: confirmed the before/after mesh and triangle counts recorded in `PERFORMANCE.md`.
- `node --check` passed for every `prototype/js/*.js` module.
- `git diff --check`: clean.

Tests cover rotated-rig IK, walking head settling, boarding contacts, door sweep clearance, batching/articulation preservation, camera framing and obstruction, forward/reverse swept vehicle hits, reaction progression at different frame rates, cooldowns, strike cancellation and fixed-size blood-effect expiry.

## Browser checks

Used the local preview in the Codex in-app browser at 1280 × 720.

- Observed elevated chase framing behind the character and behind a seated driver.
- Ran the car-impact demo through falling, ground contact, getting up, running away and recovery. Small dark-red ground drops were visible and expired. Slow motion was used to inspect recovery and restored to Normal.
- On the final optimized build, inspected the cabrio, pressed F followed immediately by E, completed boarding without a frozen strike, then completed exit and returned to still/head-rest state.
- Compared baseline, Balanced and Performance samples; measurements and their limitations are recorded in `PERFORMANCE.md`.
- Final warmed Performance repeat: 301 frames, 16.7 ms median / 16.8 ms P95 frame interval, 2.4 ms median / 4.0 ms P95 CPU submission, 144 median draws. Browser warning/error log was empty.

Code review identified two issues that were corrected: unfinished strikes surviving boarding, and traffic cars missing from camera obstruction checks.

## Limits

Falls are procedural articulated animation with impulse movement, not physics ragdolls. A low-end/mobile device matrix, sustained frame-rate guarantee, and exhaustive manual driving/close-range strike coverage are not claimed. Follow `MERGE-NOTES.md` for the manual regression checklist after integration.
