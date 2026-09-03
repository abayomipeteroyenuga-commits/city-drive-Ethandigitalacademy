/**
 * Lightweight traffic, pedestrians, and police
 */
import * as THREE from 'three';
import { VEHICLES, cloneVehicle } from './vehicles.js';
import { createVehicleMesh } from './vehicleFactory.js';

function trafficVehicle(id, colorOverride) {
  const base = VEHICLES.find(v => v.id === id) || VEHICLES[0];
  const def = cloneVehicle(base, { isOwned: false, currentFuel: base.fuelCapacity, currentCondition: 100 });
  if (colorOverride !== undefined) { def.color = colorOverride; def.customization = { primaryColor: colorOverride, secondaryColor: base.secondaryColor }; }
  return createVehicleMesh(def);
}

function simplePed(color) {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xd39b78, roughness: 0.8 });
  const shirt = new THREE.MeshStandardMaterial({ color, roughness: 0.75 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x20242b, roughness: 0.9 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.25), shirt);
  torso.position.y = 0.95;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), skin);
  head.position.y = 1.38;
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.55, 0.22), dark);
  legs.position.y = 0.42;
  [torso, head, legs].forEach(m => { m.castShadow = true; m.receiveShadow = true; g.add(m); });
  return g;
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
  }

  spawn(densityT = 0.7, densityP = 0.6) {
    const colors = [0xcc2222, 0x2266cc, 0xe5e5e5, 0x20252b, 0x2e9b63, 0xc99a20, 0xeeeeee, 0x5522aa];
    const trafficIds = ['street_metro','street_exec','street_hatch','street_family_hatch','street_compact_suv','street_urban_suv','street_lux_suv','street_mpv','street_taxi','street_van','street_pickup','street_offroad_pickup','metro_s','urban_lx','city_explorer','grand_terrain','cargo_king','city_van'];
    const nT = Math.floor(24 * Math.min(1, Math.max(0, densityT)));
    const nP = Math.floor(14 * densityP);
    for (let i = 0; i < nT; i++) {
      const mesh = trafficVehicle(trafficIds[i % trafficIds.length], colors[i % colors.length]);
      const lane = (i % 9) - 4;
      mesh.position.set(lane * 80 + (i % 2 ? 4 : -4), 0, (i * 70) % 600 - 300);
      const heading = i % 2 ? Math.PI / 2 : 0;
      mesh.rotation.y = heading;
      this.scene.add(mesh);
      this.traffic.push({
        mesh,
        speed: 12 + (i % 5) * 2,
        currentSpeed: 12 + (i % 5) * 2,
        heading,
        axis: i % 2 === 0 ? 'z' : 'x'
      });
    }
    for (let i = 0; i < nP; i++) {
      const mesh = simplePed(0xcc9966);
      mesh.position.set((i * 37) % 200 - 100, 0, (i * 53) % 200 - 80);
      this.scene.add(mesh);
      this.peds.push({
        mesh,
        dir: new THREE.Vector3(Math.sin(i), 0, Math.cos(i)).normalize(),
        speed: 1.2 + (i % 3) * 0.3,
        phase: i * 0.8
      });
    }
    for (let i = 0; i < 3; i++) {
      const mesh = trafficVehicle('urban_lx', 0x1a2a88);
      const light = new THREE.PointLight(0x2244ff, 0.25, 12);
      light.castShadow = false;
      mesh.add(light);
      mesh.position.set(60 + i * 20, 0, 40 + i * 30);
      this.scene.add(mesh);
      this.police.push({ mesh, speed: 16, chase: false, search: 0 });
    }
  }

  update(dt, playerPos, playerSpeed, flags) {
    // traffic along grid axes
    for (const t of this.traffic) {
      const dx = playerPos.x - t.mesh.position.x;
      const dz = playerPos.z - t.mesh.position.z;
      const far = dx * dx + dz * dz > 220 * 220;
      t.mesh.visible = !far;
      if (far) continue;
      const f = new THREE.Vector3(Math.sin(t.heading), 0, Math.cos(t.heading));
      const stopped = this.world?.shouldStopTraffic?.(t.mesh.position, t.axis, t.heading);
      const targetSpeed = stopped ? 0 : t.speed;
      t.currentSpeed = THREE.MathUtils.damp(t.currentSpeed || t.speed, targetSpeed, stopped ? 8 : 3, dt);
      t.mesh.position.addScaledVector(f, t.currentSpeed * dt);
      t.mesh.rotation.y = t.heading;
      if (t.mesh.position.z > 360 || t.mesh.position.z < -360 || t.mesh.position.x > 360 || t.mesh.position.x < -360) {
        t.heading += Math.PI / 2;
        t.mesh.rotation.y = t.heading;
        t.axis = t.axis === 'z' ? 'x' : 'z';
        t.mesh.position.x = Math.max(-350, Math.min(350, t.mesh.position.x));
        t.mesh.position.z = Math.max(-350, Math.min(350, t.mesh.position.z));
      }
    }
    for (const p of this.peds) {
      const pdx = playerPos.x - p.mesh.position.x;
      const pdz = playerPos.z - p.mesh.position.z;
      if (pdx * pdx + pdz * pdz > 160 * 160) { p.mesh.visible = false; continue; }
      p.mesh.visible = true;
      p.phase += dt * p.speed * 3.2;
      p.mesh.position.addScaledVector(p.dir, p.speed * dt);
      const parts = p.mesh.userData.walkParts;
      if (parts) {
        const swing = Math.sin(p.phase) * 0.28;
        parts.armL.rotation.z = swing; parts.armR.rotation.z = -swing;
        parts.legs.scale.y = 1 + Math.abs(Math.sin(p.phase)) * 0.04;
        parts.head.position.y = 1.38 + Math.sin(p.phase * 2) * 0.018;
      }
      if (Math.abs(p.mesh.position.x) > 160 || Math.abs(p.mesh.position.z) > 160) {
        p.dir.multiplyScalar(-1);
      }
    }

    if (flags.reckless) {
      this.wanted = Math.min(5, this.wanted + dt * 0.35);
      this.wantedCooldown = 8;
    } else {
      this.wantedCooldown -= dt;
      if (this.wantedCooldown <= 0 && this.wanted > 0) {
        this.wanted = Math.max(0, this.wanted - dt * 0.12);
      }
    }

    const chasing = this.wanted >= 2;
    for (const cop of this.police) {
      if (chasing) {
        const to = playerPos.clone().sub(cop.mesh.position);
        to.y = 0;
        const dist = to.length();
        if (dist > 1) {
          to.normalize();
          cop.mesh.position.addScaledVector(to, (18 + this.wanted * 2) * dt);
          cop.mesh.rotation.y = Math.atan2(to.x, to.z);
        }
        if (dist < 6 && this.wanted >= 3 && playerSpeed < 8) {
          flags.busted = true;
        }
      } else {
        cop.mesh.rotation.y += dt * 0.2;
      }
    }
    return Math.round(this.wanted);
  }
}
