# CITY DRIVE — Collision + Graphics Audit

## Implemented
- Replaced endpoint-only scenery collision with swept/continuous collision detection.
- Fast cars can no longer skip through thin poles, street lights, traffic-light poles, trees, signs, planters, fountains, arches, benches, or registered solid scenery simply because of frame distance.
- Existing building collider support remains active if buildings are added later.
- Added mountain collision footprints so visible mountain masses are not pass-through scenery.
- Preserved traffic/player vehicle separation already present in the NPC and race systems.
- Improved collision impact response to stop/bounce the car without excessive rebound.
- Improved open-city graphics: removed the giant flat asphalt sheet that made the whole map look like one parking lot; terrain is now visibly distinct from the road network.
- Added road-edge line work for stronger lane definition and visual depth.
- Preserved the building-free city design so campaign routes stay open and GPS destinations are not trapped inside structures.

## Validation
- JavaScript syntax check passed for all JS modules and API JS file.
- Local HTML stylesheet/script/image references checked; no missing referenced files found.
