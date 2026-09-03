/**
 * CITY DRIVE — Living street NPCs.
 * Animated pedestrians + visible drivers + collision-safe traffic.
 */
import * as THREE from 'three';
import { VEHICLES, cloneVehicle } from './vehicles.js';
import { createVehicleMesh } from './vehicleFactory.js';

function trafficVehicle(id, colorOverride) {
  const base = VEHICLES.find(v => v.id === id) || VEHICLES[0];
  const def = cloneVehicle(base, { isOwned: false, currentFuel: base.fuelCapacity, currentCondition: 100 });
  if (colorOverride !== undefined) {
    def.color = colorOverride;
    def.customization = { primaryColor: colorOverride, secondaryColor: base.secondaryColor };
  }
  const mesh = createVehicleMesh(def);
  mesh.userData.vehicleDef = def;
  return mesh;
}

function human(color = 0x3b82f6, skinColor = 0x8b5a3c) {
  const g = new THREE.Group();
  g.name = 'AnimatedHuman';
  const skin = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.82 });
  const shirt = new THREE.MeshStandardMaterial({ color, roughness: 0.75 });
  const trousers = new THREE.MeshStandardMaterial({ color: 0x20242b, roughness: 0.88 });
  const shoes = new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.9 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.55, 0.24), shirt);
  torso.position.y = 0.95;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), skin);
  head.position.y = 1.37;
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.52, 0.18), trousers);
  const legR = legL.clone();
  legL.position.set(-0.105, 0.42, 0); legR.position.set(0.105, 0.42, 0);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.14), shirt);
  const armR = armL.clone();
  armL.position.set(-0.27, 0.96, 0); armR.position.set(0.27, 0.96, 0);
  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.10, 0.25), shoes);
  const shoeR = shoeL.clone();
  shoeL.position.set(-0.105, 0.14, 0.04); shoeR.position.set(0.105, 0.14, 0.04);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.165, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.48), new THREE.MeshStandardMaterial({ color: 0x17120f, roughness: 0.95 }));
  hair.position.y = 1.42;
  [torso, head, legL, legR, armL, armR, shoeL, shoeR, hair].forEach(m => { m.castShadow = true; m.receiveShadow = true; g.add(m); });
  g.userData.animParts = { armL, armR, legL, legR, head, phase: Math.random() * Math.PI * 2 };
  return g;
}

function simplePed(color) {
  return human(color, [0x6b3f2a,0x8b5a3c,0xa86f4f,0x5b3928][Math.floor(Math.random()*4)]);
}

function createDriver(def) {
  const driver = human(0x2457a6, 0x8b5a3c);
  driver.name = 'NPCDriver';
  // Sit inside the cabin, slightly above the body shell so the head/arms are visible.
  driver.scale.setScalar(0.9);
  driver.position.set(0, 0.48, 0.18);
  driver.userData.driver = true;
  return driver;
}

function animateHuman(h, phase, driving = false) {
  const a = h?.userData?.animParts;
  if (!a) return;
  a.phase = phase;
  const swing = Math.sin(phase) * (driving ? 0.08 : 0.42);
  const legSwing = Math.sin(phase) * (driving ? 0.03 : 0.32);
  a.armL.rotation.z = swing;
  a.armR.rotation.z = -swing;
  a.legL.rotation.x = legSwing;
  a.legR.rotation.x = -legSwing;
  a.head.position.y = 1.37 + Math.sin(phase * 2) * (driving ? 0.006 : 0.018);
}

export class NPCSystem {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.traffic = [];
    this.peds = [];
    this.police = [];
    this.wanted = 0;
    this.wantedCooldown = 0;
    this._collisionTmp = new THREE.Vector3();
  }

  spawn(densityT = 0.7, densityP = 0.6) {
    const colors = [0xcc2222, 0x2266cc, 0xe5e5e5, 0x20252b, 0x2e9b63, 0xc99a20, 0xeeeeee, 0x5522aa];
    const trafficIds = ['metro_s','urban_lx','falcon_sport','titan_muscle','royal_executive','vortex_x','city_explorer','grand_terrain','mountain_beast','street_hawk','thunder_r','dirt_runner','cargo_king','city_van','metro_bus'];
    const nT = Math.floor(24 * Math.min(1, Math.max(0, densityT)));
    const nP = Math.floor(18 * Math.min(1, Math.max(0, densityP)));

    for (let i = 0; i < nT; i++) {
      const mesh = trafficVehicle(trafficIds[i % trafficIds.length], colors[i % colors.length]);
      const lane = (i % 9) - 4;
      mesh.position.set(lane * 80 + (i % 2 ? 4 : -4), 0, (i * 70) % 600 - 300);
      const heading = i % 2 ? Math.PI / 2 : 0;
      mesh.rotation.y = heading;
      const driver = createDriver(mesh.userData.vehicleDef || {});
      mesh.add(driver);
      this.scene.add(mesh);
      const radius = 2.45;
      this.traffic.push({ mesh, driver, radius, speed: 12 + (i % 5) * 2, currentSpeed: 12 + (i % 5) * 2, heading, axis: i % 2 === 0 ? 'z' : 'x', blocked: 0, anim: i * 0.6 });
    }

    const pedColors = [0x2563eb,0xdc2626,0x16a34a,0x9333ea,0xea580c,0x0891b2,0x4f46e5];
    for (let i = 0; i < nP; i++) {
      const mesh = simplePed(pedColors[i % pedColors.length]);
      mesh.position.set((i * 37) % 200 - 100, 0, (i * 53) % 200 - 80);
      this.scene.add(mesh);
      this.peds.push({ mesh, dir: new THREE.Vector3(Math.sin(i * 1.7), 0, Math.cos(i * 1.3)).normalize(), speed: 1.2 + (i % 3) * 0.3, phase: i * 0.8 });
    }

    for (let i = 0; i < 3; i++) {
      const mesh = trafficVehicle('urban_lx', 0x1a2a88);
      const light = new THREE.PointLight(0x2244ff, 0.25, 12);
      light.castShadow = false;
      mesh.add(light);
      const driver = createDriver(mesh.userData.vehicleDef || {});
      mesh.add(driver);
      mesh.position.set(60 + i * 20, 0, 40 + i * 30);
      this.scene.add(mesh);
      this.police.push({ mesh, driver, radius: 2.45, speed: 16, currentSpeed: 16, chase: false, search: 0, anim: i });
    }
  }

  _resolveCarPair(a, b) {
    const dx = b.mesh.position.x - a.mesh.position.x;
    const dz = b.mesh.position.z - a.mesh.position.z;
    const minDist = (a.radius || 2.4) + (b.radius || 2.4);
    const d2 = dx * dx + dz * dz;
    if (d2 >= minDist * minDist) return false;
    const d = Math.sqrt(d2) || 0.001;
    const nx = dx / d, nz = dz / d;
    const overlap = minDist - d;
    // Hard separation: two NPC cars can never occupy the same space.
    a.mesh.position.x -= nx * overlap * 0.52;
    a.mesh.position.z -= nz * overlap * 0.52;
    b.mesh.position.x += nx * overlap * 0.52;
    b.mesh.position.z += nz * overlap * 0.52;
    const av = a.currentSpeed || 0, bv = b.currentSpeed || 0;
    const avg = Math.max(0, Math.min(av, bv) * 0.25);
    a.currentSpeed = avg;
    b.currentSpeed = avg;
    a.blocked = 0.22; b.blocked = 0.22;
    return true;
  }

  _resolvePlayerCollision(t, playerMesh, playerController) {
    if (!playerMesh) return;
    const dx = playerMesh.position.x - t.mesh.position.x;
    const dz = playerMesh.position.z - t.mesh.position.z;
    const playerRadius = 2.45;
    const minDist = t.radius + playerRadius;
    const d2 = dx * dx + dz * dz;
    if (d2 >= minDist * minDist) return;
    const d = Math.sqrt(d2) || 0.001;
    const nx = dx / d, nz = dz / d;
    const overlap = minDist - d;
    // Push the traffic car away and push the player's car back just enough to stop interpenetration.
    t.mesh.position.x -= nx * overlap * 0.55;
    t.mesh.position.z -= nz * overlap * 0.55;
    playerMesh.position.x += nx * overlap * 0.45;
    playerMesh.position.z += nz * overlap * 0.45;
    t.currentSpeed = Math.min(t.currentSpeed, 2.0);
    if (playerController) {
      playerController.speed *= 0.22;
      playerController.lastPos.copy(playerMesh.position);
    }
  }

  update(dt, playerPos, playerSpeed, flags = {}) {
    const playerController = flags.controller || null;
    const playerMesh = flags.playerMesh || null;

    for (const t of this.traffic) {
      const dx = playerPos.x - t.mesh.position.x;
      const dz = playerPos.z - t.mesh.position.z;
      const far = dx * dx + dz * dz > 220 * 220;
      t.mesh.visible = !far;
      if (far) continue;
      const f = new THREE.Vector3(Math.sin(t.heading), 0, Math.cos(t.heading));
      const stopped = this.world?.shouldStopTraffic?.(t.mesh.position, t.axis, t.heading);
      const blocked = t.blocked > 0;
      t.blocked = Math.max(0, t.blocked - dt);
      const targetSpeed = stopped || blocked ? 0 : t.speed;
      t.currentSpeed = THREE.MathUtils.damp(t.currentSpeed || t.speed, targetSpeed, stopped || blocked ? 10 : 3, dt);
      t.mesh.position.addScaledVector(f, t.currentSpeed * dt);
      t.mesh.rotation.y = t.heading;
      t.anim += dt * (0.8 + t.currentSpeed * 0.06);
      animateHuman(t.driver, t.anim, true);
      if (t.mesh.position.z > 360 || t.mesh.position.z < -360 || t.mesh.position.x > 360 || t.mesh.position.x < -360) {
        t.heading += Math.PI / 2;
        t.mesh.rotation.y = t.heading;
        t.axis = t.axis === 'z' ? 'x' : 'z';
        t.mesh.position.x = Math.max(-350, Math.min(350, t.mesh.position.x));
        t.mesh.position.z = Math.max(-350, Math.min(350, t.mesh.position.z));
      }
    }

    // Pairwise hard collision pass. This is intentionally separate from movement so
    // cars cannot visually enter one another between frames.
    for (let i = 0; i < this.traffic.length; i++) {
      const a = this.traffic[i];
      if (!a.mesh.visible) continue;
      for (let j = i + 1; j < this.traffic.length; j++) {
        const b = this.traffic[j];
        if (!b.mesh.visible) continue;
        this._resolveCarPair(a, b);
      }
      this._resolvePlayerCollision(a, playerMesh, playerController);
    }

    for (const p of this.peds) {
      const pdx = playerPos.x - p.mesh.position.x;
      const pdz = playerPos.z - p.mesh.position.z;
      if (pdx * pdx + pdz * pdz > 180 * 180) { p.mesh.visible = false; continue; }
      p.mesh.visible = true;
      p.phase += dt * p.speed * 3.2;
      p.mesh.position.addScaledVector(p.dir, p.speed * dt);
      animateHuman(p.mesh, p.phase, false);
      p.mesh.rotation.y = Math.atan2(p.dir.x, p.dir.z);
      if (Math.abs(p.mesh.position.x) > 160 || Math.abs(p.mesh.position.z) > 160) p.dir.multiplyScalar(-1);
    }

    if (flags.reckless) {
      this.wanted = Math.min(5, this.wanted + dt * 0.35);
      this.wantedCooldown = 8;
    } else {
      this.wantedCooldown -= dt;
      if (this.wantedCooldown <= 0 && this.wanted > 0) this.wanted = Math.max(0, this.wanted - dt * 0.12);
    }

    const chasing = this.wanted >= 2;
    for (const cop of this.police) {
      if (chasing) {
        const to = playerPos.clone().sub(cop.mesh.position); to.y = 0;
        const dist = to.length();
        if (dist > 1) {
          to.normalize();
          cop.mesh.position.addScaledVector(to, (18 + this.wanted * 2) * dt);
          cop.mesh.rotation.y = Math.atan2(to.x, to.z);
        }
        cop.anim += dt * 1.5;
        animateHuman(cop.driver, cop.anim, true);
        if (dist < 6 && this.wanted >= 3 && playerSpeed < 8) flags.busted = true;
      } else {
        cop.mesh.rotation.y += dt * 0.2;
        cop.anim += dt * 0.8;
        animateHuman(cop.driver, cop.anim, true);
      }
    }

    // Final hard collision pass: police are vehicles too. This prevents
    // civilian traffic, police cars and the player's car from interpenetrating.
    for (let i = 0; i < this.police.length; i++) {
      const a = this.police[i];
      if (!a?.mesh?.visible) continue;
      for (let j = i + 1; j < this.police.length; j++) {
        const b = this.police[j];
        if (b?.mesh?.visible) this._resolveCarPair(a, b);
      }
      for (const t of this.traffic) {
        if (t?.mesh?.visible) this._resolveCarPair(a, t);
      }
      this._resolvePlayerCollision(a, playerMesh, playerController);
    }
    return Math.round(this.wanted);
  }
}
