# CITY DRIVE — Mission & Destination Audit (Final Fix)

## Findings
- The previous destination pass used several coordinates that were not actually the landmark's road-access point.
- Some destination names claimed "main entrance" while coordinates could land inside or too close to a landmark.
- Campaign drive/job destinations could fall back to raw landmark centers.
- Race checkpoint route was not refreshed after advancing to the next checkpoint.

## Fixes
- Replaced all 20 campaign destination coordinates with road/access-road targets.
- Removed campaign fallback to raw landmark centers for drive missions and campaign jobs.
- Renamed destinations to explicitly describe the drivable access point (Main Access Road, Service Road, Starting Grid, etc.).
- Level 4 airport now targets the airport access road north of the terminal instead of the terminal building center.
- Level 15 stadium now targets the adjacent main road instead of the stadium center.
- Level 7 hotel now targets the nearby beachfront road instead of the hotel building center.
- Level 14 uses the dedicated off-road access road.
- Campaign race route is refreshed to the current checkpoint after each checkpoint is passed.
- Race HUD now says COLORED CHECKPOINTS instead of implying all campaign routes are green.
- Campaign destination colors remain unique per level.

## Required manual checks
1. Start a NEW GAME.
2. Start Campaign Level 1 and verify the route ends on the road outside Central Mall.
3. Test Levels 4, 7, 10, 14 and 15 because they are the strongest landmark-access tests.
4. Test Levels 5, 9, 12, 16 and 19 and verify each checkpoint updates the tracker and route.
5. Confirm no campaign destination places the vehicle inside a building.

## Code audit
All JavaScript files were syntax-checked after the changes.
