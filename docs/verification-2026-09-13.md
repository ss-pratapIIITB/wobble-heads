# Vehicle yard verification

- `npm test`: 9 passing tests. Includes a regression that initially failed for the standing point inside the door sweep, then passed after repositioning it.
- `node --check prototype/js/{app,characters,motion,vehicles}.js`: each module checked individually, no syntax errors.
- `git diff --check`: clean.
- Browser: all three character assets loaded; scene rendered without reported console errors or warnings.
- Walk/stop demo: live head tilt observed at 4.2 degrees during walking, then 0.0 degrees at idle.
- Both open cars: inspection, completed entry with seated pose, exit back to standing and closed door verified. Rechecked convertible entry after the door clearance fix.
- Traffic pause changes to resume state. Live scene statistics confirmed functioning (counts vary with camera/frustum).
- Responsive review at 390 × 844: car framing and control/footer overlap corrected. Desktop viewport restored after checking.
- Independent code review identified door-sweep intersection and false movement speed during blocked approach; both fixed.
- Impeccable mechanical scan returned no regex findings, but ran in degraded mode because optional parser packages were unavailable. It did not validate computed contrast.

Limits: no device performance benchmark, touch-driving implementation, rigid-body collision simulation, or motion-capture validation. Extreme head sizes can intersect cabin geometry. Archived experiments retain their historical behavior; the main index and cars entry use the revised yard.
