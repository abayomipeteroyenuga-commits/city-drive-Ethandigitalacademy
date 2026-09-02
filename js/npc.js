/**
 * Lightweight traffic, pedestrians, and police
 */
import * as THREE from 'three';

function simpleCar(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.5, 3.2),
    new THREE.MeshStandardMaterial({ color })
  );
  body.position.y = 0.5;
  body.castShadow = true;
  g.add(body);
  return g;
}

function simplePed(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.22, 0.7, 4, 8),
    new THREE.MeshStandardMaterial({ color })
  );
  body.position.y = 0.85;
  g.add(body);
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
    const colors = [0xcc4444, 0x4488cc, 0xdddddd, 0x333333, 0x44aa66, 0xccaa22];
    const nT = Math.floor(18 * densityT);
    const nP = Math.floor(14 * densityP);
    for (let i = 0; i < nT; i++) {
      const mesh = simpleCar(colors[i % colors.length]);
      const lane = (i % 9) - 4;
      mesh.position.set(lane * 80 + (i % 2 ? 4 : -4), 0, (i * 70) % 600 - 300);
      mesh.rotation.y = i % 2 ? 0 : Math.PI;
      this.scene.add(mesh);
      this.traffic.push({
        mesh,
        speed: 12 + (i % 5) * 2,
        heading: i % 2 ? 0 : Math.PI,
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
        speed: 1.2 + (i % 3) * 0.3
      });
    }
    for (let i = 0; i < 3; i++) {
      const mesh = simpleCar(0x1a2a88);
      const light = new THREE.PointLight(0x2244ff, 0.4, 16);
      mesh.add(light);
      mesh.position.set(60 + i * 20, 0, 40 + i * 30);
      this.scene.add(mesh);
      this.police.push({ mesh, speed: 16, chase: false, search: 0 });
    }
  }

  update(dt, playerPos, playerSpeed, flags) {
    // traffic along grid axes
    for (const t of this.traffic) {
      const f = new THREE.Vector3(Math.sin(t.heading), 0, Math.cos(t.heading));
      t.mesh.position.addScaledVector(f, t.speed * dt);
      if (t.mesh.position.z > 360 || t.mesh.position.z < -360 || t.mesh.position.x > 360 || t.mesh.position.x < -360) {
        t.heading += Math.PI / 2;
        t.mesh.rotation.y = t.heading;
        t.mesh.position.x = Math.max(-350, Math.min(350, t.mesh.position.x));
        t.mesh.position.z = Math.max(-350, Math.min(350, t.mesh.position.z));
      }
    }
    for (const p of this.peds) {
      p.mesh.position.addScaledVector(p.dir, p.speed * dt);
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
