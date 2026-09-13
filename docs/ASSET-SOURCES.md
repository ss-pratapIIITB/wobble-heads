# Free prebuilt assets — reviewed 2026-09-13

User preference: **free assets first**. The active gallery now shows **six original vehicle designs and six human instances**. The four downloaded Kenney cars were removed from the active lineup at the user's request. Their original files, source licenses and hashes remain in the candidates folder as archived provenance; neither live yard nor gallery loads those car models.

The two liked downloaded humans are by **Quaternius**, not Kenney. Both are now live civilian NPCs, using a dedicated native-animation adapter (`native-characters.js`). Their local files add approximately 6.2 MB to the live yard download and 11,982 triangles when both are rendered. They retain their source rigs; they are not selectable player/boarding rigs. [Open the unified review](http://localhost:8080/prototype/asset-review.html).

## Downloaded selection (cars archived, humans active)

| Model | Creator | Actual triangles | Model file size | Role |
|---|---|---:|---:|---|
| SUV | Kenney | 2,474 | 207,572 bytes | Very light SUV traffic |
| Sedan | Kenney | 2,032 | 172,216 bytes | Ordinary traffic |
| Sports hatchback | Kenney | 2,088 | 197,804 bytes | Compact traffic |
| Van | Kenney | 2,082 | 175,664 bytes | Delivery traffic |
| Casual man | Quaternius | 5,776 | 3,058,092 bytes | Clothed civilian, 24 native animations |
| Hoodie man | Quaternius | 6,206 | 3,104,001 bytes | Clothed civilian, 24 native animations |

Counts are calculated from actual glTF triangle accessors, not listing labels. File sizes exclude the small shared car texture. The human files retain the author's original embedded-buffer glTF, including animation data; compact GLB export can reduce transfer size later without changing the mesh.

- **[Kenney Car Kit](https://kenney.nl/assets/car-kit):** CC0, 45 listed assets. Downloaded the creator's archive and retained the four GLBs above plus `Textures/colormap.png` and `KENNEY-LICENSE.txt`. The GLBs reference that PNG externally; copying only the GLBs produces white cars. The style is deliberately angular/toy-like, so these are strongest as traffic candidates, not final realistic hero-car replacements.
- **[Quaternius Ultimate Modular Men](https://quaternius.com/packs/ultimatemodularcharacters.html):** CC0, 11 modular characters and 24 animations. Downloaded `Casual_2.gltf` and `Casual_Hoodie.gltf` from the creator-linked public Drive folder, renamed locally to `casual.gltf` and `hoodie.gltf`, and included the original `QUATERNIUS-LICENSE.txt`. Native clips include Walk, Run, Run_Back, Idle, Interact, hits, punches and Death. Both are clothed male characters; they are a small evaluation sample, not the complete cast.

Original character files: [Casual_2.gltf](https://drive.google.com/file/d/1Jn7kULNmrtqP8BUUL19h8MhbdOnwPFhv/view), [Casual_Hoodie.gltf](https://drive.google.com/file/d/1em1So1xwwQNfHJYMvzKcXkZllvtxpKP5/view). Original car archive: [Kenney Car Kit archive](https://kenney.nl/media/pages/assets/car-kit/1a312ec241-1775131960/kenney_car-kit.zip).

## Closer Jeep/Mini matches and other humans

| Candidate | Listing evidence | Decision |
|---|---|---|
| [Jeep Wrangler Low Poly — Yes / Kyaie](https://sketchfab.com/3d-models/jeep-wrangler-low-poly-7b963c743fa7416eb524f89ebbbd1844) | 2.2k triangles, downloadable, CC Attribution; creator describes modeling it in Blender | Worth a closer hero-car review. Listing only: roof removal, usable interior, separate doors, actual file topology and texture budget remain unverified. Not downloaded. |
| [Low Poly Jeep — _its_sagar_bro](https://sketchfab.com/3d-models/low-poly-jeep-97acf669fb2e40cb80a3daa7dc832f93) | 2.7k triangles, CC Attribution, three colors with diffuse/AO/roughness/metallic maps | Another lightweight Jeep candidate. Same cabin/rig checks required; not downloaded. |
| [2022 Mini Cooper JCW Convertible — tonielpro520](https://sketchfab.com/3d-models/2022-mini-cooper-jcw-convertible-e0e5690799bb49fdb13aaaa3abf4225e) | 496.5k triangles, listed CC Attribution | Exact-looking convertible candidate, but far above the current 13.5k-triangle cabrio. Needs significant reduction and provenance/interior/door inspection. Not imported. |
| [2016 Mini JCW Cabrio — Ddiaz Design](https://sketchfab.com/3d-models/2016-mini-john-cooper-works-cabrio-704688ec24e04155aa45a1a2018286eb) | 88.3k triangles; CC BY-NC-SA; description says based on a Need For Speed Mobile model | Rejected for the reusable project asset set: noncommercial terms and third-party game origin. |
| [Universal Base Characters — Quaternius](https://quaternius.com/packs/universalbasecharacters.html) | CC0; six male/female base forms, 20 hairstyles; average 13k triangles; humanoid rig | Stronger option for more human proportions and cast variety. Standard download is free; source/engine bundle is a separate tier. Base models need clothing/outfit selection. Not downloaded in this pass. |
| [Universal Animation Library — Quaternius](https://quaternius.com/packs/universalanimationlibrary.html) | CC0; FBX/GLB animation library with humanoid retargeting | Useful source of authored locomotion and reaction clips once the target skeleton is chosen. Not downloaded. |

A “low-poly” title is not a budget: [one Jeep listing](https://sketchfab.com/3d-models/low-poly-jeep-4dde986b7667403f820a0dffefa41638) reports **13.1 million triangles**, so it was excluded.

The Sketchfab findings above use the creator listing's published counts/license labels. Their actual downloads and authorship have not been audited. No suitably light, verified, exact roofless Mini replacement was secured in this pass.

## Integration recommendation

1. The local review now contains only original cars and the active clothed humans. The current procedural hero cars remain the stronger functional fit for entry/exit until a better model passes the cabin checks.
2. Gameplay now uses a dedicated native animation adapter. Future player/boarding support would require the pack's **Humanoid Rig** export or a full IK adapter. The downloaded native-control-rig version has `Foot.L/R` parented to `Root`, not to `LowerLeg.L/R`, and `Hips` is not the parent of the legs. Merely renaming bones to Mixamo names would break the current two-bone IK and pelvis posing. Native animation playback in the review works without retargeting.
3. Preserve +Z forward, normalized human height, independently animated door/wheel/steering pivots, and the `seat`, `board`, `handle` contacts described in `MERGE-NOTES.md`.
4. Bring source license files and the shared PNG with model files. Run `npm test`: asset checks validate identity, counts, animations and referenced local files. The active gallery filters out archived cars; the live yard explicitly loads only the two human files.

The immediate moonwalking fix is independent of asset choice: a prettier mesh does not fix a reversed foot cycle or a mismatch between stride and movement speed.
