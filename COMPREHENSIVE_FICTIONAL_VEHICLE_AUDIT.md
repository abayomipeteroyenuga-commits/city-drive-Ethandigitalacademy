# CITY DRIVE — Comprehensive Fictional Vehicle & Performance Audit

## Vehicle/IP cleanup
- Authoritative catalog remains exactly 15 vehicles.
- All displayed manufacturer and model names are fictional.
- Removed legacy real-vehicle image assets from the distributable build.
- Removed ambiguous model-name remnants such as Falcon M4, Apex 911, Velocity RS7 and DirtForce GR.
- First-page and vehicle-selection visuals use original fictional Titan X4 artwork and fictional lineup artwork.

## Performance fixes
- Added broad-phase distance gating to traffic-vs-traffic collision checks.
- Added broad-phase distance gating to police-vs-police and police-vs-traffic checks.
- Throttled multiplayer standings DOM rebuilds to 4 Hz.
- Removed dead procedural building-generation code from the building-free world mode.
- Preserved minimap throttling, shadow update throttling, vector reuse and safe frame delta from previous audits.

## Validation
- All JavaScript files pass `node --check`.
- No runtime source references remain to the removed legacy vehicle images.
