CITY DRIVE — DIRECT RACING START UPDATE

The startup flow has been modified so the game attempts to enter the playable game
directly and hide garage UI on first load. It uses the game's exposed spawn/start
methods when available, with a generic vehicle-position fallback.

The patch:
- bypasses/hides common garage screens;
- exposes the game screen;
- attempts a starting-grid spawn;
- resets initial speed;
- runs after load at several safe intervals so it can act after game initialization;
- stores a session flag indicating race-grid start mode.

Test the first launch in a browser after deployment. If the game's specific garage
controller still overrides this after startup, the next patch should target that
controller directly rather than the generic startup layer.
