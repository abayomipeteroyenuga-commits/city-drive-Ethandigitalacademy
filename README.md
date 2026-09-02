# CITY DRIVE

**EARN • DRIVE • EXPLORE • BUILD**

Open-world 3D vehicle-life game set in fictional **Nova City**. Start with a Metro S and limited City Cash. Work jobs, race, buy and customize 15 original vehicles, and grow your garage.

## Play locally

This is a static site. Serve the `city-drive` folder over HTTP (ES modules will not load from `file://`).

```bash
cd city-drive
python3 -m http.server 8080
```

Open http://localhost:8080

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
3. **Room code, other device** — optional PeerJS P2P. If the public broker is blocked, same-origin tabs still work.

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

- 15 original vehicles (cars, SUVs, motorcycles, commercial)
- Nova City districts, landmarks, dealerships, garage, fuel, repair
- Jobs, races, police wanted meter, traffic and pedestrians
- Fuel, damage, repairs, upgrades, paint, marketplace
- Day/night cycle, weather, achievements, XP / levels
- Save / load via LocalStorage

No copyrighted brands, maps, or music. Audio is generated with the Web Audio API. Vehicles are procedural Three.js meshes (no external model files required).

## Stack

HTML5, CSS3, JavaScript modules, Three.js r160 (CDN), WebGL, Web Audio, LocalStorage.
