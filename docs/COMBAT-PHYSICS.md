# Boxing and police shooting

## References and approach

- [Rapier scene-query examples](https://rapier.rs/docs/user_guides/javascript/scene_queries/): sweep a shape over a segment, find the first contact, and compare its time of impact with cover. Used as the collision-design pattern for the small analytic sphere sweeps in `boxing.js`; no Rapier code copied or runtime added.
- [Three.js Raycaster](https://threejs.org/docs/pages/Raycaster.html): origin/direction/range and nearest-contact conventions for shots.
- [Fix Your Timestep](https://gafferongames.com/post/fix_your_timestep/): bounded simulation steps. Retains the existing 60 Hz maximum substep and samples curved punch paths at intervals no longer than 12 ms.

This is animation-driven contact and impulse combat, not articulated rigid-body ragdolls. Existing fall/get-up animations remain responsible for recovering bodies. The fist trajectory drives both hand IK and its collision query. Limb IK may clamp unreachable targets to the rig's physical reach.

## Controls and behavior

F is the only attack button. Each accepted press randomly selects jab/cross and left/right hand. Inputs during recovery or without enough stamina are rejected. Hold Q to guard the front; guarding slows movement and consumes stamina when hit. Guard does not stop bullets. Punches have windup, contact, recovery, stamina cost and one contact per swing. Movement slows while punching.

Ordinary hits cause a short recoil/stagger and small displacement; combinations accumulate poise damage and knock the target down. NPCs guard, approach and counter for a limited fight window after being attacked, then disengage. Knocked-down NPCs recover through the existing get-up/flee system and regain a minimum of 45 health. NPC health bottoms out at one; player health can reach zero.

Boxing practice places a nearby sparring partner and suppresses police shooting until Reset or another demo. Ordinary fights still cause police hostility. NPC counterpunches can hurt the player even in practice.

## Shooting changes

The current muzzle transform supplies both origin and barrel direction. Recoil widens spread and changes the firing direction. Hits use stacked sphere body volumes, including a low volume for fallen actors, and stop at the first body before cover. Tracers and blood terminate at the entry contact, rather than the target center. Intervening NPCs can be hit. Injured or punching officers cannot fire, and opaque car cover prevents firing. Existing three-shot bursts, pooled effects and six body-shot player damage remain.

Limitations: simplified body volumes rather than per-bone colliders; car boxes and ground provide cover, not a complete world collider hierarchy. No projectile drop at these short ranges, penetration, dismemberment, full ragdoll solver or simulated muscle physics. Friendly-fire avoidance and more sophisticated NPC tactics are future improvements.

## Verification

74 tests passed, including punch contact at 15/30/60/120 FPS, single-hit sweeps, range/behind/cover misses, stamina and stun rejection, guard damage reduction, combination knockdown, body entry contacts, interrupted police firing and intervening NPCs. Browser checks confirmed contact damage, NPC counters, player knockdown, zero gunfire in practice, and no recorded console errors.

## Fight camera

An accepted player punch or a melee contact involving the player activates a broadside camera for 2.5 seconds, renewed by further exchanges. It frames both nearby fighters around hand height, keeps the side stable during a bout, and expands for narrow screens. Existing camera smoothing and car-obstruction avoidance remain. Driving, boarding, death and police introductions take precedence. After the fight pauses, normal chase framing resumes.

## Shoulder-driven punches

Punch windup, extension and recovery now drive hip yaw, torso rotation, clavicle rotation where the rig provides shoulder bones, and a small forward weight shift. Foot IK preserves planted feet. The hand collision trajectory remains shared with fist IK. A rig test asserts actual shoulder-joint advancement, torso rotation and stable foot height for both hands.
