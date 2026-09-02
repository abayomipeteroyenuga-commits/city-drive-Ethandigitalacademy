/**
 * Procedural vehicle meshes — each of the 15 vehicles looks different.
 */
import * as THREE from 'three';

function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.35 })
  );
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cyl(rTop, rBot, h, color, rotX = 0) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBot, h, 12),
    new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.2 })
  );
  m.rotation.x = rotX;
  m.castShadow = true;
  return m;
}

function addWheels(group, positions, radius, width, color = 0x111111) {
  for (const p of positions) {
    const w = cyl(radius, radius, width, color, Math.PI / 2);
    w.position.set(p.x, p.y, p.z);
    w.name = 'wheel';
    group.add(w);
  }
}

export function createVehicleMesh(def) {
  const g = new THREE.Group();
  g.name = def.id;
  const c = def.customization?.primaryColor ?? def.color;
  const s = def.customization?.secondaryColor ?? def.secondaryColor;

  if (def.isMotorcycle) {
    buildMotorcycle(g, def, c, s);
  } else if (def.id === 'metro_bus') {
    buildBus(g, def, c, s);
  } else if (def.id === 'city_van') {
    buildVan(g, def, c, s);
  } else if (def.id === 'cargo_king') {
    buildPickup(g, def, c, s);
  } else if (def.type === 'suv') {
    buildSuv(g, def, c, s);
  } else if (def.id === 'vortex_x' || def.id === 'falcon_sport') {
    buildSport(g, def, c, s);
  } else if (def.id === 'titan_muscle') {
    buildMuscle(g, def, c, s);
  } else {
    buildSedan(g, def, c, s);
  }

  return g;
}

function buildSedan(g, def, c, s) {
  const long = def.id === 'royal_executive' ? 4.8 : 4.2;
  const wide = def.id === 'royal_executive' ? 1.95 : 1.75;
  g.add(box(wide, 0.55, long, c, 0, 0.55, 0));
  g.add(box(wide * 0.92, 0.48, long * 0.5, s, 0, 1.02, -0.15));
  g.add(box(wide * 0.88, 0.08, 0.08, 0x88ccff, 0, 0.82, long * 0.48));
  addWheels(g, [
    { x: wide * 0.48, y: 0.32, z: long * 0.32 },
    { x: -wide * 0.48, y: 0.32, z: long * 0.32 },
    { x: wide * 0.48, y: 0.32, z: -long * 0.32 },
    { x: -wide * 0.48, y: 0.32, z: -long * 0.32 }
  ], 0.32, 0.22);
}

function buildSport(g, def, c, s) {
  const low = def.id === 'vortex_x';
  g.add(box(1.85, 0.38, 4.4, c, 0, 0.42, 0));
  g.add(box(1.7, 0.32, 2.0, s, 0, 0.75, -0.2));
  g.add(box(1.6, 0.06, 0.8, 0x111111, 0, 0.32, 2.0));
  if (low) g.add(box(1.4, 0.08, 0.4, c, 0, 0.85, -2.1)); // spoiler
  g.add(box(1.7, 0.06, 0.06, 0x66ddff, 0, 0.55, 2.15));
  addWheels(g, [
    { x: 0.82, y: 0.28, z: 1.35 },
    { x: -0.82, y: 0.28, z: 1.35 },
    { x: 0.82, y: 0.28, z: -1.35 },
    { x: -0.82, y: 0.28, z: -1.35 }
  ], 0.30, 0.26);
}

function buildMuscle(g, def, c, s) {
  g.add(box(1.95, 0.5, 4.6, c, 0, 0.58, 0));
  g.add(box(1.7, 0.4, 1.8, s, 0, 1.0, -0.35));
  g.add(box(0.5, 0.12, 0.7, 0x222222, 0, 0.88, 1.4));
  addWheels(g, [
    { x: 0.9, y: 0.36, z: 1.45 },
    { x: -0.9, y: 0.36, z: 1.45 },
    { x: 0.9, y: 0.36, z: -1.45 },
    { x: -0.9, y: 0.36, z: -1.45 }
  ], 0.36, 0.28);
}

function buildSuv(g, def, c, s) {
  const tall = def.id === 'mountain_beast';
  const h = tall ? 1.15 : 0.95;
  g.add(box(2.05, 0.6, 4.5, c, 0, 0.7, 0));
  g.add(box(1.95, h * 0.7, 3.0, s, 0, 1.25, -0.2));
  addWheels(g, [
    { x: 0.95, y: tall ? 0.45 : 0.38, z: 1.45 },
    { x: -0.95, y: tall ? 0.45 : 0.38, z: 1.45 },
    { x: 0.95, y: tall ? 0.45 : 0.38, z: -1.45 },
    { x: -0.95, y: tall ? 0.45 : 0.38, z: -1.45 }
  ], tall ? 0.42 : 0.36, 0.28);
}

function buildPickup(g, def, c, s) {
  g.add(box(1.95, 0.55, 2.4, c, 0, 0.7, 0.7));
  g.add(box(1.85, 0.7, 1.6, s, 0, 1.25, 0.85));
  g.add(box(1.9, 0.45, 2.2, 0x333344, 0, 0.75, -1.3));
  addWheels(g, [
    { x: 0.92, y: 0.4, z: 1.4 },
    { x: -0.92, y: 0.4, z: 1.4 },
    { x: 0.92, y: 0.4, z: -1.4 },
    { x: -0.92, y: 0.4, z: -1.4 }
  ], 0.4, 0.28);
}

function buildVan(g, def, c, s) {
  g.add(box(2.0, 1.6, 5.0, c, 0, 1.15, 0));
  g.add(box(1.9, 0.5, 1.4, 0x88aacc, 0, 1.5, 1.7));
  addWheels(g, [
    { x: 0.95, y: 0.35, z: 1.5 },
    { x: -0.95, y: 0.35, z: 1.5 },
    { x: 0.95, y: 0.35, z: -1.5 },
    { x: -0.95, y: 0.35, z: -1.5 }
  ], 0.35, 0.26);
}

function buildBus(g, def, c, s) {
  g.add(box(2.5, 2.4, 10.5, c, 0, 1.5, 0));
  g.add(box(2.4, 0.7, 1.6, 0xaad4ff, 0, 1.7, 4.6));
  const stripe = box(2.52, 0.18, 10.4, s, 0, 1.1, 0);
  g.add(stripe);
  addWheels(g, [
    { x: 1.15, y: 0.4, z: 3.4 },
    { x: -1.15, y: 0.4, z: 3.4 },
    { x: 1.15, y: 0.4, z: -3.4 },
    { x: -1.15, y: 0.4, z: -3.4 }
  ], 0.42, 0.32);
}

function buildMotorcycle(g, def, c, s) {
  const dirt = def.id === 'dirt_runner';
  const r = dirt ? 0.38 : 0.32;
  g.add(box(0.35, 0.28, 1.5, c, 0, 0.55, 0));
  g.add(box(0.45, 0.12, 0.45, s, 0, 0.78, -0.15));
  const fork = box(0.08, 0.5, 0.08, 0x222222, 0, 0.7, 0.7);
  g.add(fork);
  const wf = cyl(r, r, 0.12, 0x111111, Math.PI / 2);
  wf.position.set(0, r, 0.75);
  wf.name = 'wheel';
  const wr = cyl(r, r, 0.12, 0x111111, Math.PI / 2);
  wr.position.set(0, r, -0.7);
  wr.name = 'wheel';
  g.add(wf, wr);
  g.add(box(0.55, 0.06, 0.08, 0x333333, 0, 1.05, 0.55));
}
