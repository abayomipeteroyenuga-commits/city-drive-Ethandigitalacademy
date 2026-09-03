# CITY DRIVE — Destination Tracker Audit / Update

Implemented:
- Live destination tracker on driving HUD.
- Explicit message: "YOU ARE GOING TO: [destination]".
- Distance updates every HUD frame.
- Direction arrow points toward the active destination.
- Unique campaign color assigned to every level 1–20.
- Campaign route line, destination beacon and minimap destination marker use the current level color.
- Race checkpoints use the campaign color during campaign races.
- Free GPS keeps its cyan color.
- Tracker hides when there is no active destination.
- Existing UID/save/garage architecture preserved.

Campaign colors are defined in `js/missions.js` via `CAMPAIGN_COLORS` and `getCampaignColor()`.
