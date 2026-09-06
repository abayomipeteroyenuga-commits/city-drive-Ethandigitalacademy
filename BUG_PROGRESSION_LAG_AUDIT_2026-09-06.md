# CITY DRIVE — Bug, Progression & Lag Audit

## Progression fixes
- Campaign saves are normalized from the completed-level list.
- Only contiguous completed levels unlock the next level.
- Corrupted/out-of-order arrays such as `[1,3]` now correctly resume at Level 2 instead of skipping ahead.
- Duplicate completed levels are removed and sorted on load.
- Full 20-level completion remains at Level 20 without reopening earlier stages.

## Lag/performance fixes
- Removed the unused secondary `requestAnimationFrame` driving-audio loop from `main.js`; the main game audio system remains authoritative.
- Reduced collision hot-path allocation by no longer building a combined collider array every frame.
- HUD DOM updates are capped around 30 FPS while game physics/rendering remain full-rate.
- Autosave interval increased from 8 seconds to 15 seconds to reduce localStorage serialization hitches on slower phones.
- Existing route/minimap throttles and dynamic-traffic broad-phase collision optimizations remain enabled.

## Validation
- All JavaScript files pass `node --check` syntax validation.
- Campaign progression invariant smoke tests pass for normal, duplicate, out-of-order, missing-level, and fully-completed save states.
- Existing swept scenery collision remains active, preventing high-speed tunnelling through registered static obstacles.
