# CITY DRIVE

**EARN • DRIVE • EXPLORE • BUILD**

Open-world 3D vehicle-life game set in fictional **Nova City**. Start with a Metro and City Cash. Work jobs, race, buy and customize 18 original vehicles, and grow your garage.

## Play locally

This is a static site. Serve the `city-drive` folder over HTTP (ES modules will not load from `file://`).

```bash
cd city-drive
python3 -m http.server 8080
```

Use the included launcher (`START-CITY-DRIVE.cmd` or `start-city-drive.bat`). It automatically finds a free local port between 8765 and 8795 and opens CITY DRIVE.

Or:

```bash
npx serve .
```

## Deploy on Vercel

1. Push this folder (or the repo root containing `index.html`) to GitHub.
2. In Vercel: New Project → import the repo.
3. Framework preset: **Other**.
4. Output / root directory: the folder that contains `index.html` (`city-drive` if that is the subfolder).
5. Deploy. No environment variables or API keys are required.

`vercel.json` is included for SPA-style static hosting.

## Multiplayer racing

1. **Local 2 player** — one keyboard. P1 WASD, P2 IJKL (U nitro, O handbrake).
2. **Room code, same PC** — Host a room, open a second browser tab, Join with the code (`BroadcastChannel`).
3. **Room code, other device** — optional PeerJS P2P when a PeerJS client is supplied/bundled. Offline mode does not download PeerJS at runtime.

Live standings use checkpoint order. First through all gates gets the multiplayer win payout.

## Controls

| Action | Desktop | Mobile |
|---|---|---|
| Accelerate | W / ↑ | ▲ |
| Brake / Reverse | S / ↓ | ▼ |
| Steer | A D / ← → | ◀ ▶ |
| Handbrake | Space | HB |
| Nitro | Shift | N |
| Camera | C | C |
| Enter / Exit / Interact | E | E |
| Garage | G | menu |
| Map | M | menu |
| Pause | Esc | — |

## Version 1 content

- 18 original vehicles (cars, SUVs, motorcycles, commercial)
- Nova City districts, landmarks, dealerships, garage, fuel, repair
- Jobs, races, police wanted meter, traffic and pedestrians
- Fuel, damage, repairs, upgrades, paint, marketplace
- Day/night cycle, weather, achievements, XP / levels
- Save / load via LocalStorage

No copyrighted brands, maps, or music. Audio is generated with the Web Audio API. Vehicles are procedural Three.js meshes (no external model files required).

## Stack

HTML5, CSS3, JavaScript modules, Three.js r160 (bundled locally for offline play), WebGL, Web Audio, LocalStorage.


## Navigation & mobile controls
- The live minimap shows a bright route from your current position to the active mission destination.
- Press **M** for the full Nova City map. Choose **SET DESTINATION** to set GPS; the route is drawn from YOU to the destination.
- **Ctrl** = sprint while on foot. Hold the mobile **SPRINT** button to run.
- **GYRO** on mobile enables tilt steering. Grant motion permission when the browser asks.
- Vehicle **Shift** remains Nitro; sprint is only for on-foot movement.

## Campaign & Retention
- 20 sequential campaign levels with cash + XP rewards.
- Rotating daily challenge with daily streak bonuses to encourage repeat play.
- Daily challenge progress is saved offline with campaign progress.
- Career rankings are offline-first; the Vercel leaderboard endpoint provides online rankings when deployed. Persistent production-wide ranking storage requires a durable server-side database/KV provider.
