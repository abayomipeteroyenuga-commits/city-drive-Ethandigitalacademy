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
    this._sky();
    return this;
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
    // highway ring
    addRoad(0, -280, 18, 600, Math.PI / 2);
    addRoad(-280, 0, 18, 600);
    addRoad(0, 200, 16, 500, Math.PI / 2);
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
    return m;
  }

  _districts() {
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
    // Nova Tower
    this._block(20, 10, 16, 90, 16, 0x4a6a88);
    this._block(20, 10, 8, 108, 8, 0x88ccee);
    // Mall
    this._block(-40, 30, 36, 12, 28, 0x886666);
    // Stadium
    const stad = new THREE.Mesh(
      new THREE.CylinderGeometry(22, 26, 10, 24, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x445566, side: THREE.DoubleSide })
    );
    stad.position.set(120, 5, -40);
    this.scene.add(stad);
    // City Hall
    this._block(-20, -30, 22, 16, 18, 0x887766);
    // Airport terminal
    this._block(-280, -80, 50, 10, 18, 0x8899aa);
    const runway = new THREE.Mesh(
      new THREE.BoxGeometry(18, 0.1, 160),
      new THREE.MeshStandardMaterial({ color: 0x44444a })
    );
    runway.position.set(-280, 0.1, -160);
    this.scene.add(runway);
    // Hotel
    this._block(10, 240, 18, 32, 14, 0xaa8866);
    // Police
    this._block(60, 50, 16, 14, 16, 0x2244aa);
    // Garage
    this._block(40, -70, 24, 8, 16, 0x556677);
    // Repair
    this._block(30, -90, 16, 7, 12, 0x667744);
    // Race arena
    this._block(-120, -155, 8, 6, 8, 0x884444);
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
    this.sun = new THREE.DirectionalLight(0xfff2d8, 1.1);
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
    this.scene.fog = new THREE.Fog(0x87a0b8, 90, 620);
    this.scene.background = new THREE.Color(0x87b0d0);
    this.scene.environment = null;
  }

  getGroundHeight() {
    return 0;
  }

  resolveVehicleCollision(veh) {
    const p = veh.mesh.position;
    for (const b of this.buildings) {
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
    if (!paused) this.timeOfDay = (this.timeOfDay + dt * 0.015) % 24;
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
