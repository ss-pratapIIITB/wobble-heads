# Wobble Heads

A Three.js character and vehicle sandbox. Run `npm start` (or `python3 -m http.server 8080`) and open [the vehicle yard](http://localhost:8080/prototype/index.html). The browser loads Three.js and the existing character models from jsDelivr, so an internet connection is required. `prototype/cars.html` opens the same yard; the other HTML files are historical experiments.

## Try it

- **W/S / up/down:** move forward/back. **A/D / left/right:** turn, on foot or driving. Release drive controls to brake.
- **E:** approach and enter a nearby playable car, or exit after stopping.
- **Shift + movement:** run at 3.7 m/s with faster, larger head wobble. Long sprints or sharp turns can cause a recoverable trip. The Run / trip demo shows the full sequence.
- **F:** strike a nearby person in front of you. **Space:** jump. **Drag / scroll:** orbit and zoom; the chase camera recenters behind you.
- **Open 4×4 / Cabrio / Racing coupe:** inspect a car and place your character beside its door.
- **Walk / back / stop:** walk forward for three seconds, backward for three, then stop so you can inspect foot contact and head settling.
- **Character tuning:** head mass, cadence, strength, size, live tilt readout and slow-motion playback.
- **Car impact demo:** a repeatable collision showing a fall, small blood effect, get-up and escape.
- **Police encounter:** starts a repeatable hostile patrol encounter. Player violence also draws police fire. Shots have spread and vehicle cover blocks them. Six body hits cause death; **R / Restart** restores health and clears hostility.
- **Performance:** quality presets, live rendering statistics and a five-second benchmark. Performance is the fast default.
- **Pause traffic:** stop/resume the six NPC vehicles.
- **Reset:** return the player to the courtyard; release the current car and close its door, including during boarding.
- **Review all cars & characters:** opens [one comparison page](http://localhost:8080/prototype/asset-review.html) with all six vehicle designs and six character instances, including both downloaded humans now used as live NPCs. Rotate individual models, open the three playable-car doors, compare shared Idle/Walk/Backward/Run motion, toggle large heads, or pause. Downloaded humans also have individual clip menus. Source/license links and measured triangle counts accompany the models. See [asset recommendations and integration notes](docs/ASSET-SOURCES.md).

## Revised designs

- Olive **Trail**: roofless Rubicon-inspired 4×4, seven-slot grille, round lights, chunky tires, flat fenders, exposed hinges, roll cage and rear spare.
- Red **Coast**: roofless Mini-inspired cabrio, round light rings, curved trim, tan four-seat interior, chrome details and folded soft top.
- **Veloce racing targa:** low, wide two-seat sports car with wedge nose, splitter, open roof center, fastback rear and opening door glass. Top speed 24 m/s (86 km/h), versus 8 m/s (29 km/h) for the original cars.
- Two Quaternius civilian NPCs use native Walk/Run/Death clips with procedural head wobble; the Ranger is a police officer with cap, badge and gun.
- Three NPC body styles: sedan, hatchback and delivery van, with opaque dark glass, wheels and lamps. Hidden interiors and driver silhouettes are omitted; these cars are locked to the player. They follow the outer loop and yield to obstacles ahead.
- Walk motion uses actual signed travel distance: the stance foot stays planted while the lifted foot returns, including when backing up. Hands swing opposite the feet. A damped head spring responds to walking speed and mass; excitation ends on stopping, with an exact neutral pose after 0.45 seconds.
- Boarding opens the front-hinged door, stages each foot into the cabin, lowers and turns the body into a car-specific seat, then closes the door. Exit reverses the sequence. Vehicles remain reserved and stationary throughout.

These are editable procedural game models inspired by the [Wrangler exterior](https://www.jeep.com/nz/wrangler-2dr/exterior.html) and [MINI Convertible](https://www.mini.com/en_MS/home/new-family/new-mini-convertible.html), not exact production replicas.

## Development and checks

`npm install` installs the pinned Three.js dependency used by Node tests; the browser entry point uses the matching CDN version. Run `npm test` for motion, rig targeting, batching, collision, effect and camera regression tests. Run `npm run benchmark:geometry` for reproducible vehicle counts. Source lives in `prototype/js/`, shared by both current entry points.

Opaque vehicle parts and the fixed yard are batched, decorative geometry is lighter, repeated skeleton work is reduced, and shadows/pixel ratio/pose updates have explicit budgets. The default uses 1× rendering and 512² shadows. See [performance measurements and reusable techniques](docs/PERFORMANCE.md) and [merge notes](docs/MERGE-NOTES.md). Scene statistics show actual submitted triangles and draw calls. Swept vehicle contacts and close-range F strikes trigger articulated procedural falls, small pooled blood drops, recovery and fleeing. This is not a rigid-body ragdoll engine; traffic and collisions remain lightweight yard approximations. Boarding is procedural rather than motion capture; unusually large head settings can intersect windshields or roll bars. The interactive sandbox currently uses keyboard/mouse; narrow-screen layout supports inspecting designs and running the demos, not full touch driving.
