# Performance, chase camera and impact reactions

## Authorized scope

Speed up the existing yard without discarding the two open-car designs. Add an elevated, behind-the-character chase camera, including while driving. Vehicle collisions and a close-range F strike knock pedestrians down with a small blood effect, then they get up and flee. Record reusable performance and merge guidance in Markdown.

## Design

Rendering: merge opaque geometry by material inside each rigid transform boundary. Preserve door pivots, wheel spin/steering groups, cabin markers and transparent glass sorting. Thin decorative boxes use simple geometry; merge static road markings and planters. Measured preset choice: default pixel ratio capped at 1, shadows at 512 and shadow updates at 15 Hz; Balanced offers 1.5 / 1024 / 30 Hz. Supply a performance preset and high-quality option. Cache idle/seated poses, throttle distant NPC posing, and avoid recursive skeleton work and temporary allocations inside inverse-kinematics solving. Cache control parameters and update the HUD at 10 Hz. Pause simulation when the tab is hidden.

Camera: a damped chase anchor follows the character heading at roughly 5 m distance and 3 m ground height. Driving uses 7 m / 3.5 m. Mouse orbit returns smoothly behind after a delay, with separate inspection mode. Avoid head wobble coupling and shorten the boom for nearby vehicle obstacles. WASD uses forward/back plus turning for stable chase-camera control; arrow keys match. Document this control change.

Impacts: swept car rectangles against pedestrian capsules prevent tunnelling. Vehicle-vehicle collisions still stop cars. Pedestrians no longer act as invisible car blockers. Direction and relative speed determine a bounded impulse. Falling, grounded, getting-up and fleeing are explicit timed states; a short cooldown prevents repeated impacts every frame. Foot strikes have range/facing checks. Render an articulated, direction-sensitive tumble and hand/knee-assisted recovery using the existing skeleton. Pool a small number of dark red drops/decals that fade and expire. No new physics dependency. Keep simulation and collision updates independent of render/pose throttling. Fleeing chooses a traversable direction away from the attacker.

## Verification

Capture baseline frame and draw metrics; compare rigid geometry submissions and a matching browser view. Tests cover transform preservation after batching, door clearance, camera headings/orbit recovery, swept hits, hit exclusions/cooldown, lifecycle completion, bounded effects and frame-rate independence. In-browser checks cover impact → ground → get-up → flee, ordinary entry/exit, chase on foot/in car and benchmark controls. Report measured limits without promising 60 FPS on untested hardware.
