# Racing, running and police implementation plan

> Use subagent-driven-development for the isolated vehicle task; integrate character/combat work in the main session.

**Goal:** Deliver the requested lineup, running/falls and police gameplay in both live yard and review gallery.
**Architecture:** Keep Three.js renderer and current actor loop. Isolate driving profiles, combat math and native NPC posing in small modules. Preserve uncommitted existing work.
**Constraints:** No new runtime dependencies. Free existing assets. Opaque locked traffic. Six body hits to death. No automatic respawn. Tests and merge notes required. Do not commit or change branches in this shared checkout.

- [x] Vehicle task: modify vehicles.js only plus vehicle tests and vehicle report. Add sports coupe with cabin/door markers and distinct proportions. Expose maxSpeed/acceleration/reverseSpeed on all cars; sports 24/9/5 versus 8/4/3.5. Closed traffic types have playerUsable false, opaque dark glazing and no hidden interior; preserve wheel animation. Compare before/after triangle counts. Tests assert entry/door clearance on sports and locked traffic opacity/count reduction.
- [x] Character task: add native NPC adapter for the two local Quaternius humans; integrate same reaction/locomotion state with native clip playback. Add running input and distance-based trip timer; amplify head movement with faster cadence at sprint speed. Keep stopped heads settling exactly. Extend unit tests before behavior changes.
- [x] Combat/falls task: add isolated deterministic shot/spread/health logic with injected random values; ray/segment vehicle cover checks. Improve impact gravity/contact and persistent fatal state, preserving recoverable falls. Integrate visible police aiming, tracers, hit blood, health UI and restart. Test hits/misses, cover, death and immunity after death.
- [x] Gallery/UI task: remove Kenney entries from catalog, add sports and police identity, keep both humans, update counts automatically. Add racing inspect and police demo controls plus keyboard hints. Keep existing responsive design.
- [x] Verify: npm test, JS syntax, git diff --check, actual geometry benchmark, browser checks of gallery and live gameplay. Independent final review; address findings. Document exact changes, controls and limitations.
