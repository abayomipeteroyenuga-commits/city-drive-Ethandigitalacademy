# CITY DRIVE — REAL CAR SELECTION FIX

The street vehicles are now wired directly into the authoritative `VEHICLES` catalog and `createVehicleMesh()` factory. Selecting a street vehicle by ID now produces the correct body type instead of falling through to the generic sedan builder.

Covered: sedans, hatchbacks, SUVs, MPV, taxi, van, pickups and off-road pickup.

The previous standalone street-car global scripts were removed because the game uses ES modules and the authoritative factory is the correct integration point.
