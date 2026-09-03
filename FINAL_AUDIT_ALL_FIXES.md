# CITY DRIVE — Final Audit of Current Build

- JavaScript syntax: all `js/*.js` files pass `node --check`.
- Campaign helper imports are present.
- Campaign progression is sequential and persisted: completing Level N unlocks Level N+1.
- Campaign completion clears the active mission, saves state, and starts the next mission when the player remains in driving mode.
- Mission menu starts the driving world before campaign/side-job/race activities when no vehicle is active.
- WOW first-page start button displays the player's current unlocked campaign level.
- WOW vehicle selection remains tied to the authoritative 15-vehicle catalog.
- Building-free world generation remains enabled.
- Animated pedestrians and visible NPC drivers remain enabled.
- Civilian traffic hard-separation remains enabled.
- Police vehicles are included in hard collision separation against police, civilian traffic, and the player vehicle.
