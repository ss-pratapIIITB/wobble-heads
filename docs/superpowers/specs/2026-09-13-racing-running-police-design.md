# Racing, running and police design

Keep the existing game-style materials and expand the live yard and unified gallery together. Remove four Kenney vehicles from the active lineup. Keep the two Quaternius humans the user liked and add native-animation NPCs to gameplay without forcing their control rigs through the old IK adapter.

Add a low, wide sports targa with an open roof center for large-head clearance and a usable cockpit and animated door. Set its top speed to 24 m/s and acceleration to 9 m/s², versus existing cars at 8 and 4. Locked NPC traffic uses opaque dark glass and omits seats, dashboard and driver geometry; measure actual triangle savings rather than attributing savings to tint.

Shift with W/S or arrows runs at 3.7 m/s. Head motion gets greater amplitude and a cadence that continues increasing when running. Sustained running or sharp turns may trigger a recoverable trip with cooldown. Falls should conserve initial momentum, use gravity and ground contact, articulated limbs and staged recovery; this remains a lightweight animation/physics hybrid.

Identify Ranger as police with visible uniform details and weapon. Police become hostile after player violence, with an explicit test toggle. Shoot periodically with angular spread, distance bounds and vehicle occlusion. Six successful body shots exhaust 100 health; each hit produces a small pooled blood effect. Dead players fall, stay down, cannot move/drive/interact, and may restart explicitly. Reset clears threat, health and death state. No frame-dependent probability or unbounded effect allocation.

Tests cover speed profiles, locked traffic geometry, running cadence/trips, fall stability, hit/miss and occlusion, six-hit death and reset. Browser checks cover live and review pages, keyboard controls and visible state transitions. Record implementation and limitations in merge/performance markdowns.
