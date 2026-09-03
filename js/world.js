/**
 * NOVA CITY — procedural open world
 */
import * as THREE from 'three';

export const DISTRICTS = [
  { id: 'downtown', name: 'Downtown', cx: 0, cz: 0, color: 0x2a3048 },
  { id: 'residential', name: 'Residential', cx: 180, cz: 40, color: 0x2a3a2a },
  { id: 'commercial', name: 'Commercial', cx: -160, cz: 80, color: 0x3a2a38 },
  { id: 'industrial', name: 'Industrial', cx: 80, cz: -200, color: 0x3a3a28 },
  { id: 'airport', name: 'Airport District', cx: -280, cz: -80, color: 0x2a2a32 },
  { id: 'beachfront', name: 'Beachfront', cx: 0, cz: 260, color: 0x1a3a48 },
  { id: 'suburbs', name: 'Suburbs', cx: 280, cz: 160, color: 0x2a3a2e },
  { id: 'mountain', name: 'Mountain Area', cx: 320, cz: -220, color: 0x3a3224 },
  { id: 'rural', name: 'Rural Outskirts', cx: -300, cz: 220, color: 0x2a3820 }
];

export const LANDMARKS = [
  { id: 'nova_tower', name: 'Nova Tower', x: 20, z: 10 },
  { id: 'central_mall', name: 'Central Mall', x: -40, z: 30 },
  { id: 'stadium', name: 'Nova Stadium', x: 120, z: -40 },
  { id: 'city_hall', name: 'City Hall', x: -20, z: -30 },
  { id: 'airport', name: 'International Airport', x: -280, z: -80 },
  { id: 'grand_hotel', name: 'Grand Hotel', x: 10, z: 240 },
  { id: 'bridge', name: 'Riverside Bridge', x: 0, z: 140 },
  { id: 'garage', name: 'Main Garage', x: 40, z: -60 },
  { id: 'market', name: 'Vehicle Marketplace', x: -70, z: 10 },
  { id: 'police', name: 'Police HQ', x: 60, z: 50 },
  { id: 'repair', name: 'Repair Center', x: 30, z: -80 },
  { id: 'arena', name: 'Race Arena', x: -120, z: -140 },
  { id: 'fuel1', name: 'Fuel Station Downtown', x: 55, z: 25 },
  { id: 'fuel2', name: 'Fuel Station Beach', x: 20, z: 220 },
  { id: 'fuel3', name: 'Fuel Station Industrial', x: 90, z: -180 }
];

export const POIS = {
  garage: { x: 40, z: -60, r: 8 },
  repair: { x: 30, z: -80, r: 8 },
  fuel: [
    { x: 55, z: 25, r: 7 },
    { x: 20, z: 220, r: 7 },
    { x: 90, z: -180, r: 7 }
  ],
  dealerships: [
    { id: 'nova_motors', name: 'Nova Motors', x: -50, z: 50, stock: ['metro_s', 'urban_lx', 'falcon_sport'] },
    { id: 'elite_autos', name: 'Elite Autos', x: -90, z: 70, stock: ['royal_executive', 'titan_muscle'] },
    { id: 'speed_zone', name: 'Speed Zone', x: -80, z: -20, stock: ['falcon_sport', 'vortex_x', 'titan_muscle'] },
    { id: 'bike_hub', name: 'Bike Hub', x: 90, z: 20, stock: ['street_hawk', 'thunder_r', 'dirt_runner'] },
    { id: 'offroad', name: 'Off-Road Center', x: 300, z: -200, stock: ['city_explorer', 'grand_terrain', 'mountain_beast', 'dirt_runner'] },
    { id: 'commercial', name: 'Commercial Motors', x: 70, z: -190, stock: ['cargo_king', 'city_van', 'metro_bus'] }
  ],
  jobs: [
    { type: 'delivery', name: 'Delivery Job', x: -40, z: 30 },
    { type: 'taxi', name: 'Taxi Stand', x: 0, z: 0 },
    { type: 'food', name: 'Food Delivery', x: -30, z: 80 },
    { type: 'truck', name: 'Truck Depot', x: 80, z: -200 },
    { type: 'bus', name: 'Bus Depot', x: 10, z: -50 },
    { type: 'vip', name: 'VIP Lounge', x: -20, z: -30 },
    { type: 'recovery', name: 'Recovery Yard', x: 90, z: -160 },
    { type: 'offroad', name: 'Off-Road Contract', x: 310, z: -210 }
  ],
  races: [
    { id: 'street', name: 'Street Race', x: 10, z: 60 },
    { id: 'circuit', name: 'Circuit Race', x: -120, z: -140 },
    { id: 'checkpoint', name: 'Checkpoint Race', x: 40, z: 100 },
    { id: 'highway', name: 'Highway Sprint', x: -200, z: 0 },
    { id: 'offroad', name: 'Off-Road Race', x: 300, z: -240 },
    { id: 'bike', name: 'Motorcycle Race', x: 90, z: 40 },
    { id: 'timetrial', name: 'Time Trial', x: -100, z: -100 },
    { id: 'drift', name: 'Drift Challenge', x: -140, z: -130 }
  ]
};

export class World {
  constructor(scene) {
    this.scene = scene;
    this.buildings = [];
    this.roadBoxes = [];
    this.lights = [];
    this.trafficLights = [];
    this.timeOfDay = 10; // hours
    this.signalTime = 0; // real-time traffic signal clock
    this.weather = 'clear';
    this.sun = null;
    this.hemi = null;
  }

  build() {
    this._ground();
    this._roads();
    this._districts();
    this._landmarks();
    this._water();
    this._mountains();
    this._poiMarkers();
    this._streetFurniture();
    this._trafficSignals();
    this._sky();
    return this;
  }


  _trafficSignals() {
    // American-style signalized intersections in the central city.
    // Signals are visual and also expose their state to NPC traffic.
    const poles = [-160, -80, 0, 80, 160];
    const housing = new THREE.MeshStandardMaterial({ color: 0x20242a, metalness: 0.65, roughness: 0.3 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0x33090b, emissive: 0xff1018, emissiveIntensity: 0.05 });
    const amberMat = new THREE.MeshStandardMaterial({ color: 0x332708, emissive: 0xffaa18, emissiveIntensity: 0.05 });
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x07330f, emissive: 0x12ff48, emissiveIntensity: 0.05 });
    for (const x of poles) for (const z of poles) {
      const signal = { x, z, heads: [] };
      // Four corner poles keep the intersection readable from every approach.
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const px = x + sx * 9, pz = z + sz * 9;
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 5.8, 8), housing);
        pole.position.set(px, 2.9, pz); this.scene.add(pole);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 5.8), housing);
        arm.position.set(px, 5.65, z + sz * 3); this.scene.add(arm);
        const head = new THREE.Group();
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.55, 0.38), housing);
        head.add(box);
        const bulbs = [
          new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 8), redMat),
          new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 8), amberMat),
          new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 8), greenMat)
        ];
        bulbs[0].position.y = 0.46; bulbs[1].position.y = 0.0; bulbs[2].position.y = -0.46;
        bulbs.forEach(b => head.add(b));
        head.position.set(px, 4.85, z + sz * 6.0);
        head.rotation.y = sx < 0 ? Math.PI : 0;
        this.scene.add(head);
        signal.heads.push(bulbs);
      }
      // White zebra crosswalks on all four sides.
      const crossMat = new THREE.MeshBasicMaterial({ color: 0xf4f4f4 });
      for (let k = -3; k <= 3; k++) {
        for (const side of [-1, 1]) {
          const a = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.012, 9), crossMat);
          a.position.set(x + k * 1.05, 0.095, z + side * 11); this.scene.add(a);
          const b = new THREE.Mesh(new THREE.BoxGeometry(9, 0.012, 0.75), crossMat);
          b.position.set(x + side * 11, 0.096, z + k * 1.05); this.scene.add(b);
        }
      }
      this.trafficLights.push(signal);
    }
  }

  updateTrafficSignals() {
    for (const signal of this.trafficLights) {
      const phase = this.signalTime % 14;
      const ns = phase < 6.5 ? 'green' : phase < 8 ? 'yellow' : 'red';
      const ew = phase < 6.5 ? 'red' : phase < 8 ? 'yellow' : 'green';
      for (const bulbs of signal.heads) {
        // Alternate heads by their physical approach: first two face north/south,
        // last two face east/west. This keeps the visual cycle obvious.
        const state = bulbs === signal.heads[0] || bulbs === signal.heads[1] ? ns : ew;
        bulbs[0].material.emissiveIntensity = state === 'red' ? 2.8 : 0.03;
        bulbs[1].material.emissiveIntensity = state === 'yellow' ? 2.6 : 0.03;
        bulbs[2].material.emissiveIntensity = state === 'green' ? 2.8 : 0.03;
      }
    }
  }

  getTrafficSignalState(x, z, axis) {
    // 14-second cycle: 6.5s green, 1.5s amber, 6s cross traffic green.
    const phase = this.signalTime % 14;
    const ns = phase < 6.5 ? 'green' : phase < 8 ? 'yellow' : 'red';
    const ew = phase < 6.5 ? 'red' : phase < 8 ? 'yellow' : 'green';
    return axis === 'z' ? ns : ew;
  }

  shouldStopTraffic(pos, axis, heading) {
    const nearestX = Math.round(pos.x / 80) * 80;
    const nearestZ = Math.round(pos.z / 80) * 80;
    if (nearestX < -160 || nearestX > 160 || nearestZ < -160 || nearestZ > 160) return false;
    const lateral = axis === 'z' ? Math.abs(pos.x - nearestX) : Math.abs(pos.z - nearestZ);
    if (lateral > 7) return false;
    const target = axis === 'z' ? nearestZ : nearestX;
    const along = axis === 'z' ? (target - pos.z) * Math.cos(heading) : (target - pos.x) * Math.sin(heading);
    if (along < -2 || along > 18) return false;
    const state = this.getTrafficSignalState(pos.x, pos.z, axis);
    return state !== 'green';
  }

  _ground() {
    const geo = new THREE.PlaneGeometry(1400, 1400);
    const mat = new THREE.MeshStandardMaterial({ color: 0x2a3a28, roughness: 0.95 });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const asphalt = new THREE.Mesh(
      new THREE.PlaneGeometry(900, 900),
      new THREE.MeshStandardMaterial({ color: 0x2a2c32, roughness: 0.9 })
    );
    asphalt.rotation.x = -Math.PI / 2;
    asphalt.position.y = 0.02;
    asphalt.receiveShadow = true;
    this.scene.add(asphalt);
  }

  _roads() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x33363d, roughness: 0.85 });
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xd8d070 });
    const addRoad = (x, z, w, l, rot = 0) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, l), mat);
      m.position.set(x, 0.04, z);
      m.rotation.y = rot;
      m.receiveShadow = true;
      this.scene.add(m);
      this.roadBoxes.push({ x, z, w, l, rot });
    };
    // grid
    for (let i = -4; i <= 4; i++) {
      addRoad(i * 80, 0, 14, 720);
      addRoad(0, i * 80, 14, 720, Math.PI / 2);
    }
    // RACING START GRID — an open-road starting area, away from the garage.
    const gridZ = -120;
    const gridLine = new THREE.Mesh(new THREE.BoxGeometry(14, 0.018, 0.32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    gridLine.position.set(0, 0.105, gridZ); this.scene.add(gridLine);
    for (const laneX of [-3.35, 3.35]) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.018, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 }));
      box.position.set(laneX, 0.106, gridZ - 6); this.scene.add(box);
    }
    const startText = new THREE.Mesh(new THREE.PlaneGeometry(7, 2.1), new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.18, side: THREE.DoubleSide }));
    startText.rotation.x = -Math.PI / 2; startText.position.set(0, 0.11, gridZ - 12); this.scene.add(startText);

    // highway ring
    addRoad(0, -280, 18, 600, Math.PI / 2);
    addRoad(-280, 0, 18, 600);
    addRoad(0, 200, 16, 500, Math.PI / 2);
    // Lane markings and pedestrian-scale street lighting make the city read as a real road network.
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xf5e6a6 });
    for (let i = -4; i <= 4; i++) {
      for (let z = -340; z < 340; z += 48) {
        const d = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.012, 10), dashMat); d.position.set(i*80,0.085,z); this.scene.add(d);
      }
      for (let x = -340; x < 340; x += 48) {
        const d = new THREE.Mesh(new THREE.BoxGeometry(10,0.012,0.18), dashMat); d.position.set(x,0.085,i*80); this.scene.add(d);
      }
    }
    for (const [x,z] of [[-8,-8],[72,-8],[-8,72],[72,72],[152,72],[152,-8]]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.12,5.5,8), new THREE.MeshStandardMaterial({color:0x30343c,metalness:0.7,roughness:0.3}));
      pole.position.set(x,2.75,z); this.scene.add(pole);
      const lamp = new THREE.PointLight(0xffdca8, 1.2, 22, 2); lamp.position.set(x,5.5,z); this.scene.add(lamp);
    }
    // mountain dirt
    const dirt = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.06, 220),
      new THREE.MeshStandardMaterial({ color: 0x6a5438, roughness: 1 })
    );
    dirt.position.set(300, 0.2, -220);
    dirt.rotation.y = 0.4;
    this.scene.add(dirt);
  }

  _block(x, z, w, h, d, color) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.15 })
    );
    m.position.set(x, h / 2, z);
    m.castShadow = true;
    m.receiveShadow = true;
    this.scene.add(m);
    this.buildings.push({ mesh: m, x, z, w, h, d });
    // Lightweight facade detail: lit window strips make the city feel inhabited at night.
    if (h > 8 && w > 9 && d > 9) {
      const glass = new THREE.MeshStandardMaterial({ color: 0x8fc9e8, roughness: .18, metalness: .35, emissive: 0x214a66, emissiveIntensity: .45 });
      const rows = Math.min(5, Math.max(2, Math.floor(h / 12)));
      for (let row = 0; row < rows; row++) {
        const y = 4 + row * Math.max(3.2, (h - 7) / rows);
        const win = new THREE.Mesh(new THREE.BoxGeometry(Math.min(w*.58, 7), .72, .035), glass);
        win.position.set(x, y, z + d/2 + .018); win.castShadow = false; this.scene.add(win);
        const win2 = win.clone(); win2.position.z = z - d/2 - .018; this.scene.add(win2);
      }
      if (h > 25) {
        const roof = new THREE.Mesh(new THREE.BoxGeometry(w*.72, .16, d*.72), new THREE.MeshStandardMaterial({color:0x161a22,roughness:.5,metalness:.4}));
        roof.position.set(x,h+.08,z); this.scene.add(roof);
      }
    }
    return m;
  }

  _districts() {
    // BUILDING-FREE CITY MODE: keep the playable road network completely open.
    // No solid buildings are generated, so traffic, pedestrians, missions and
    // GPS routes can never terminate inside a building collider.
    return;

    // Downtown towers
    const rng = (s) => {
      let a = s;
      return () => { a = (a * 16807) % 2147483647; return (a - 1) / 2147483646; };
    };
    const r = rng(42);
    for (let i = 0; i < 28; i++) {
      const x = (r() - 0.5) * 140;
      const z = (r() - 0.5) * 140;
      if (Math.abs(x) % 80 < 18 || Math.abs(z) % 80 < 18) continue;
      const h = 18 + r() * 55;
      this._block(x, z, 10 + r() * 10, h, 10 + r() * 10, 0x3a4560 + Math.floor(r() * 20) * 0x010101);
    }
    // Residential houses
    for (let i = 0; i < 24; i++) {
      const x = 140 + (r() - 0.3) * 120;
      const z = 20 + (r() - 0.5) * 120;
      this._block(x, z, 8, 5 + r() * 4, 10, 0x6a5a4a);
    }
    // Industrial
    for (let i = 0; i < 12; i++) {
      const x = 40 + r() * 120;
      const z = -160 - r() * 80;
      this._block(x, z, 18 + r() * 16, 10 + r() * 8, 22, 0x555548);
    }
    // Commercial
    for (let i = 0; i < 10; i++) {
      this._block(-140 + r() * 80, 50 + r() * 80, 16, 12 + r() * 16, 16, 0x4a3a4a);
    }
  }

  _landmarks() {
    // BUILDING-FREE CITY MODE:
    // Campaign navigation is designed around open roads and destination pads.
    // Do not spawn solid landmark/building meshes that can block the player or
    // make the GPS appear to point into a structure. POI cones remain available
    // as lightweight visual destination markers.
    this.buildings = [];
  }

  _streetFurniture() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3223, roughness: .95 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d6b3d, roughness: .9 });
    const addTree = (x,z,scale=1) => {
      const g=new THREE.Group();
      const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18*scale,.25*scale,2.2*scale,8),trunkMat); trunk.position.y=1.1*scale; trunk.castShadow=true; g.add(trunk);
      const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.15*scale,1),leafMat); crown.position.y=2.45*scale; crown.castShadow=true; g.add(crown);
      g.position.set(x,0,z); this.scene.add(g);
    };
    for (const [x,z] of [[125,25],[145,70],[185,10],[220,45],[250,120],[290,100],[330,140],[-230,210],[-270,250],[-310,190],[-340,250]]) addTree(x,z,.8+((Math.abs(x)+Math.abs(z))%5)*.07);
    const benchMat=new THREE.MeshStandardMaterial({color:0x5b4433,roughness:.8});
    for(const [x,z] of [[-5,18],[75,18],[145,18],[15,145]]){
      const seat=new THREE.Mesh(new THREE.BoxGeometry(2.2,.14,.55),benchMat); seat.position.set(x,.65,z); seat.castShadow=true; this.scene.add(seat);
      const a=seat.clone(); a.position.y=.35; a.scale.x=.12; a.scale.z=.8; this.scene.add(a);
      const b=a.clone(); b.position.x+=1.8; this.scene.add(b);
    }
  }

  _water() {
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(900, 180),
      new THREE.MeshStandardMaterial({ color: 0x1a4a66, roughness: 0.25, metalness: 0.4 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -0.2, 340);
    this.scene.add(water);
  }

  _mountains() {
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(
        new THREE.ConeGeometry(30 + i * 4, 40 + i * 8, 5),
        new THREE.MeshStandardMaterial({ color: 0x4a4030, roughness: 1 })
      );
      m.position.set(280 + i * 18, 20, -280 - i * 10);
      this.scene.add(m);
    }
  }

  _poiMarkers() {
    const make = (x, z, color) => {
      const m = new THREE.Mesh(
        new THREE.ConeGeometry(1.2, 3.2, 4),
        new THREE.MeshBasicMaterial({ color })
      );
      m.position.set(x, 4, z);
      this.scene.add(m);
    };
    make(POIS.garage.x, POIS.garage.z, 0x00d4ff);
    make(POIS.repair.x, POIS.repair.z, 0x88ff44);
    POIS.fuel.forEach(f => make(f.x, f.z, 0xffaa00));
    POIS.dealerships.forEach(d => make(d.x, d.z, 0xff66aa));
    POIS.jobs.forEach(j => make(j.x, j.z, 0x44ffaa));
    POIS.races.forEach(r => make(r.x, r.z, 0xff4444));
  }

  _sky() {
    this.hemi = new THREE.HemisphereLight(0x9ec8ff, 0x334422, 0.6);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff2d8, 1.35);
    this.sun.position.set(80, 140, 40);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0002;
    this.sun.shadow.normalBias = 0.015;
    this.sun.shadow.camera.near = 10;
    this.sun.shadow.camera.far = 400;
    this.sun.shadow.camera.left = -120;
    this.sun.shadow.camera.right = 120;
    this.sun.shadow.camera.top = 120;
    this.sun.shadow.camera.bottom = -120;
    this.scene.add(this.sun);
    this.scene.fog = new THREE.Fog(0x87a0b8, 110, 700);
    this.scene.background = new THREE.Color(0x8fb8d8);
    const hemi = new THREE.HemisphereLight(0xbfe6ff, 0x24301f, 1.15);
    this.scene.add(hemi);
    this.scene.background = new THREE.Color(0x87b0d0);
    this.scene.environment = null;
  }

  getGroundHeight() {
    return 0;
  }

  resolveVehicleCollision(veh) {
    const p = veh.mesh.position;
    for (const b of this.buildings) {
      const adx = Math.abs(p.x - b.x);
      const adz = Math.abs(p.z - b.z);
      if (adx > b.w / 2 + 8 || adz > b.d / 2 + 8) continue;
      const hx = b.w / 2 + 1.2;
      const hz = b.d / 2 + 1.2;
      if (Math.abs(p.x - b.x) < hx && Math.abs(p.z - b.z) < hz) {
        const dx = p.x - b.x;
        const dz = p.z - b.z;
        if (Math.abs(dx) / hx > Math.abs(dz) / hz) {
          p.x = b.x + Math.sign(dx) * hx;
        } else {
          p.z = b.z + Math.sign(dz) * hz;
        }
        const impact = Math.abs(veh.speed);
        veh.speed *= -0.25;
        if (impact > 4) veh.applyDamage(Math.min(18, impact * 0.8));
        return true;
      }
    }
    p.x = THREE.MathUtils.clamp(p.x, -420, 420);
    p.z = THREE.MathUtils.clamp(p.z, -400, 380);
    return false;
  }

  getDistrict(x, z) {
    let best = DISTRICTS[0];
    let bd = Infinity;
    for (const d of DISTRICTS) {
      const dist = (d.cx - x) ** 2 + (d.cz - z) ** 2;
      if (dist < bd) { bd = dist; best = d; }
    }
    return best;
  }

  nearestPOI(x, z, list, radius = 10) {
    for (const p of list) {
      const dx = p.x - x, dz = p.z - z;
      if (dx * dx + dz * dz < radius * radius) return p;
    }
    return null;
  }

  updateDayNight(dt, paused) {
    if (!paused) {
      this.timeOfDay = (this.timeOfDay + dt * 0.015) % 24;
      this.signalTime = (this.signalTime + dt) % 14;
    }
    this.updateTrafficSignals();
    const t = this.timeOfDay;
    const night = t < 6 || t > 19;
    const sunset = (t > 17 && t < 19.5) || (t > 5 && t < 7);
    let sky, fog, sunI, sunC;
    if (night) {
      sky = 0x0a1020; fog = 0x0a1020; sunI = 0.15; sunC = 0x8899cc;
    } else if (sunset) {
      sky = 0xc07040; fog = 0xb06038; sunI = 0.7; sunC = 0xffaa66;
    } else {
      sky = 0x87b0d0; fog = 0x87a0b8; sunI = 1.1; sunC = 0xfff2d8;
    }
    if (this.weather === 'rain') {
      sky = night ? 0x080c14 : 0x4a5a68;
      fog = night ? 0x080c14 : 0x4a5a68;
    }
    this.scene.background.setHex(sky);
    this.scene.fog.color.setHex(fog);
    this.sun.intensity = sunI;
    this.sun.color.setHex(sunC);
    const ang = ((t - 6) / 12) * Math.PI;
    this.sun.position.set(Math.cos(ang) * 160, Math.sin(ang) * 140 + 20, 40);
    if (!this._street) {
      this._street = [];
      for (let i = -3; i <= 3; i++) {
        const l = new THREE.PointLight(0xffcc88, 0, 28);
        l.position.set(i * 80, 7, 6);
        this.scene.add(l);
        this._street.push(l);
      }
    }
    this._street.forEach(l => { l.intensity = night ? 1.05 : 0; });
    return { night, t };
  }
}
