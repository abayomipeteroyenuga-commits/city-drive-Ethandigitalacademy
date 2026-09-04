# CITY DRIVE — Comprehensive 20-Level Mission Audit & Fix

## Scope
Audited the campaign flow from mission start, navigation/waypoint, timer, objective completion, rewards/XP, cleanup, level unlock, celebration, and automatic next-level start.

## Campaign coverage
- 20 campaign levels present and sequential (1–20).
- Every job campaign level has a matching job type and two-stage pickup/dropoff route.
- Every race campaign level has a matching race type and 5 checkpoints.
- Drive/objective levels have valid destination data.
- Campaign progression remains sequential and authoritative through `campaignLevel`.

## Mission completion paths
- Drive: proximity to destination completes the level.
- Job: pickup must be reached first, then delivery destination must be reached.
- Upgrade: upgrade is only accepted at the physical Main Garage.
- Buy: vehicle purchase is only accepted at the physical Vehicle Marketplace.
- Race: every checkpoint must be reached in order before payout.
- Level completion pays configured CASH + XP exactly once, records completion, unlocks the next level, clears route/waypoint/rivals, and starts the celebration/next level flow.
- Timeout clears active mission state and mission visuals and requires the same level to be restarted.

## Bugs fixed
1. **GPS runtime error:** `setGPSDestination()` referenced an undefined `opts` variable. Removed the invalid campaign timer references.
2. **Level 3 navigation mismatch:** destination aligned to the actual Main Garage location.
3. **Level 8 marketplace bypass:** the pause/menu marketplace could previously complete the buy mission away from the marketplace. Added the same physical-location guard used by normal purchases.
4. **Campaign job rival stage bug:** rivals could stop at pickup instead of continuing to the delivery stage. Their route is now rebuilt when pickup is completed.
5. **Mission overlap:** starting another job/race/campaign while a mission is active is now blocked, preventing state corruption and countdown conflicts.
6. **Route rendering performance:** route geometry was being disposed/recreated every frame. Updates are now throttled and only rebuilt after meaningful movement, reducing allocation/GC pressure.
7. **Four-wheel consistency:** removed the obsolete Motorcycle Race from the playable race list; the vehicle catalog remains 15 four-wheel vehicles with zero motorcycle definitions.
8. **Stale UI wording:** removed the obsolete “Power Bikes” wording from the dealership UI.
9. **Objective destinations aligned:** drive/objective destination points were aligned to their corresponding landmark/service locations where applicable (Airport, Grand Hotel, Marketplace, Nova Tower, Stadium, Bridge, etc.).

## Performance audit
- All JavaScript files pass `node --check`.
- Campaign rivals are capped at 3.
- Mission route updates are throttled instead of allocating geometry every frame.
- Existing shadow-map, minimap, traffic collision, DOM standings, audio tick, DPR and safe-delta performance fixes remain intact.
- Mission completion cleanup removes route lines, waypoints, race markers and campaign rival meshes.

## Verification result
**PASS — static comprehensive audit completed.**

Runtime browser/WebGL behavior should still be smoke-tested in the deployed browser after upload, especially on the target device/GPU, but the campaign state machine and referenced mission data are internally consistent and the identified code-path bugs have been fixed.
