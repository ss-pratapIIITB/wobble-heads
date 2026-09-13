# Characters and vehicles

The approved direction is realistic vehicle proportions with clean game materials, alongside the existing oversized characters. The main sandbox and cars entry point must share one implementation.

## Review

Current vehicles have solid box cabins, centered door pivots, decorative wheels that do not turn together, and one generic seat position. The imported Ferrari has no boarding rig. Entry interpolates sideways through the shell and changes orientation abruptly when attaching. Head motion ignores mass, is barely visible, and jumps to rest. Animation quaternions are copied across different bind poses without conversion.

## Design

Build procedural, editable meshes: an olive open Rubicon-inspired off-roader with seven grille slots, chunky tires, flat fenders, exposed hinges, roll bars and spare; and a red Mini-inspired convertible with rounded bodywork, circular headlights, contrasting mirrors, chrome trim, four seats and folded roof. Both have real cabin openings, front-hinged doors, individual seat/footwell/steering anchors and visible interiors. Three simpler traffic models (sedan, hatchback, van) circulate outside the character courtyard with yielding and a pause control.

Use world-space bone targeting to accommodate different skeleton orientations. Walking drives a damped head spring; no continuous excitation at idle, in air or seated, and a short critically damped stop settles exactly to rest. Mass changes lag. Entry is approach, reach/open, turn, leading foot in, lower hips, trailing foot in, face forward, close. Exit reverses the contact order. A car remains reserved and stationary for the entire transition. Reset releases reservations and closes doors.

Keep the current keyboard movement and camera, adding vehicle inspection and entry demonstration controls so designs are easy to review. Share materials and modest-resolution geometry; defer LOD and broader optimization.

## Verification

Node regression tests cover movement/idle spring convergence across frame rates, mass response, boarding endpoints and door timing, traffic spacing, vehicle openings, wheel hierarchy and door sweep. In-browser review covers idle/walk, both car entry/exit paths, steering, traffic, reset, mobile layout and console errors.

Design references: https://www.jeep.com/nz/wrangler-2dr/exterior.html and https://www.mini.com/en_MS/home/new-family/new-mini-convertible.html . These are inspired models, not exact licensed replicas.
