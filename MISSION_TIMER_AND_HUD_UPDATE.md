# CITY DRIVE — Mission HUD & Countdown Update

## Changes
- Mission panel and live destination tracker are now arranged side-by-side on desktop.
- Top-center money/startup amount area is preserved and not covered.
- On smaller screens the two panels stack cleanly.
- Campaign missions now have a generous countdown:
  - Drive / objective levels: 3:00
  - Job levels: 3:30
  - Race levels: 2:30
- The timer is shared across pickup/delivery stages of a campaign job.
- Timer becomes visually urgent during the final 30 seconds.
- When time expires, the current campaign level is failed, mission markers/routes/rivals are cleared, progress is NOT advanced, and the player is told to start that same level again.
- Campaign level completion and sequential progression remain unchanged.
- Mission distance display now uses the same world-to-kilometre conversion as mission distance calculations.

## Validation
- All JavaScript files pass `node --check`.
