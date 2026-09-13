# Vehicle racing implementation report

## Vehicle behavior

- Added the `sports` coupe as a low, wide targa player vehicle. Its wedge nose, broad front fenders, splitter, twin hood accents, tapered side glass, rear hoop and descending fastback deck distinguish it from the traffic sedans. It keeps the existing boarding contract: seat, board, handle, steering and door-pivot markers, animated outward-opening doors, and four independently animated wheel groups.
- The sports cockpit has two seats. Each front side pane belongs to its door pivot and travels out of the entry path when the door opens; only the small rear quarter pane remains fixed.
- Added driving profiles to every vehicle. Sports uses `maxSpeed: 24`, `acceleration: 9`, and `reverseSpeed: 5`; all other vehicles use `8`, `4`, and `3.5` respectively.
- Added `playerUsable`. Jeep, mini and sports are usable; sedan, hatch and van are locked traffic.
- Locked traffic uses opaque dark glazing and omits seats, console, dashboard, steering wheel, interior door trim and high-detail wheel decoration. Its wheel spin and front-wheel steering interfaces remain unchanged.
- Rigid body batching is preserved. Door, steering and wheel articulation nodes remain batching boundaries when present.

## Geometry measurements

Counts are unbatched source triangles from `createVehicle(type, undefined, {batch: false})`, so they measure removed geometry rather than changes in draw batching.

| Vehicle | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Sedan | 12,072 | 3,388 | 71.9% |
| Hatch | 12,072 | 3,388 | 71.9% |
| Van | 12,216 | 3,532 | 71.1% |
| Sports | n/a | 11,548 | new model |

The locked cars have no transparent meshes after the change. Their dark window material is fully opaque; the triangle reduction comes from omitted interior and wheel-detail meshes.

The existing seated character contract keeps the torso at the seat marker and enlarges the head to 2.1× without applying a driving crouch. A low closed roof would intersect that head envelope. The sports car therefore uses an open targa center above the two seats, which gives the large head unbounded vertical clearance while retaining the windshield frame, side glass, rear hoop and fastback rear profile. The trade-off is that the sports car is intentionally not a fully enclosed coupe.

## Verification

- `node --test tests/vehicles.test.mjs`: 7 tests passed.
- `npm test`: 42 tests passed.
- `git diff --check -- prototype/js/vehicles.js tests/vehicles.test.mjs docs/vehicle-racing-report.md`: passed.
- Tests cover all driving profiles and usability flags, the coupe proportions, two-seat cabin and entry markers, full door-sweep clearance, moving front glazing with no fixed pane across the open doorway, locked-window opacity, geometry reduction, and existing wheel/door behavior.
