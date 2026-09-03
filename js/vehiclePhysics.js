/**
 * Arcade-realistic vehicle physics. Different vehicles feel different.
 */
import * as THREE from 'three';

export class VehicleController {
  constructor(mesh, def) {
    this.mesh = mesh;
    this.def = def;
    this.velocity = new THREE.Vector3();
    this.speed = 0; // m/s
    this.heading = 0;
    this.steer = 0;
    this.steerAngle = 0;
    this.throttle = 0;
    this.brake = 0;
    this.reverse = false;
    this.handbrake = false;
    this.nitro = false;
    this.nitroAmount = def.currentNitro ?? (def.nitroCapacity || 0);
    this.onGround = true;
    this.driftFactor = 0;
    this.gear = 'P';
    this.rpm = 0;
    this.lean = 0;
    this.cameraMode = 0;
    this.lastPos = mesh.position.clone();
  }

  applyUpgrades(up) {
    this.up = up || this.def.upgrades || {};
  }

  effectiveStats() {
    const u = this.up || this.def.upgrades || {};
    const cond = (this.def.currentCondition ?? 100) / 100;
    const condMul = 0.55 + cond * 0.45;
    const wet = this.wetGrip || 1;
    const off = this.offroadMul || 1;
    const fuelEmpty = (this.def.currentFuel ?? 1) <= 0.01;

    const engineBoost = 1 + (u.engine || 0) * 0.08;
    const transBoost = 1 + (u.transmission || 0) * 0.05;
    const tireGrip = 1 + (u.tires || 0) * 0.06;
    const brakeBoost = 1 + (u.brakes || 0) * 0.08;
    const susp = 1 + (u.suspension || 0) * 0.05;

    const fuelFrac = Math.max(0, (this.def.currentFuel ?? 0) / Math.max(0.01, this.def.fuelCapacity));
    const fuelMul = fuelFrac <= 0.01 ? 0.08 : fuelFrac < 0.12 ? 0.55 : 1;
    const massMul = Math.max(0.55, 1400 / Math.max(400, this.def.weight));
    const top = (this.def.topSpeed / 3.6) * condMul * transBoost * fuelMul;
    const accelTime = Math.max(1.4, this.def.acceleration / engineBoost);
    const accel = (this.def.topSpeed / 3.6) / (accelTime * 1.65) * massMul;
    const grip = this.def.grip * tireGrip * wet * off * condMul;
    const handling = (this.def.handling / 100) * susp * (this.def.isMotorcycle ? 1.25 : 1);
    const braking = (7 + this.def.braking / 11) * brakeBoost * condMul * massMul;
    const weight = this.def.weight;
    return { top, accel, grip, handling, braking, weight, fuelEmpty, fuelMul };
  }

  update(dt, input, world) {
    const st = this.effectiveStats();
    const isBike = this.def.isMotorcycle;

    this.throttle = input.accel ? 1 : 0;
    this.brake = input.brake ? 1 : 0;
    this.handbrake = !!input.handbrake;
    this.nitro = !!input.nitro && this.nitroAmount > 0 && this.def.nitroCapacity > 0;

    const maxSteer = (isBike ? 0.72 : this.def.type === 'commercial' ? 0.28 : 0.44)
      * (1.2 - Math.min(0.65, Math.abs(this.speed) / Math.max(4, st.top)));
    const keyboardSteer = (input.left ? 1 : 0) - (input.right ? 1 : 0);
    const gyroSteer = input.gyroEnabled ? (input.gyroSteer || 0) : 0;
    const targetSteer = Math.abs(gyroSteer) > 0.08 ? gyroSteer : keyboardSteer;
    this.steerAngle = THREE.MathUtils.damp(this.steerAngle, targetSteer * maxSteer, 12, dt);

    let force = 0;
    if (this.nitro && this.throttle) {
      force += st.accel * 1.55;
      this.nitroAmount = Math.max(0, this.nitroAmount - dt * 22);
      this.def.currentNitro = this.nitroAmount;
    } else if (this.throttle) {
      force += st.accel;
    }

    if (this.brake && this.speed > 0.4) {
      force -= st.braking;
    } else if (this.brake && this.speed <= 0.4) {
      force -= st.accel * 0.45;
    }

    if (this.handbrake) {
      force -= st.braking * 0.6;
      this.driftFactor = Math.min(1, this.driftFactor + dt * 3);
    } else {
      this.driftFactor = Math.max(0, this.driftFactor - dt * 2);
    }

    const drag = 0.35 + st.weight / 8000;
    force -= Math.sign(this.speed) * drag * this.speed * this.speed * 0.012;

    this.speed += force * dt;
    const reverseCap = st.top * 0.28;
    this.speed = THREE.MathUtils.clamp(this.speed, -reverseCap, st.top);

    const slip = this.driftFactor * (1 - st.grip) + (1 - st.grip) * 0.18;
    const weightSteer = this.def.weight > 3000 ? 0.85 : this.def.weight > 1800 ? 1.05 : 1.2;
    const turnRate = this.steerAngle * st.handling * (isBike ? 2.8 : 1.55 * weightSteer)
      * (this.speed / Math.max(2, Math.abs(this.speed) + 2));
    this.heading += turnRate * Math.sign(this.speed) * (1 - slip * 0.5) * dt;

    const forward = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    const lateral = new THREE.Vector3(forward.z, 0, -forward.x);
    const move = forward.multiplyScalar(this.speed * dt);
    if (this.driftFactor > 0.2) {
      move.add(lateral.multiplyScalar(this.speed * dt * this.driftFactor * 0.15 * Math.sign(this.steerAngle || 1)));
    }

    this.mesh.position.add(move);
    this.mesh.rotation.y = this.heading;

    if (isBike) {
      const targetLean = -this.steerAngle * Math.min(1, Math.abs(this.speed) / 8) * 0.72;
      this.lean = THREE.MathUtils.damp(this.lean, targetLean, 10, dt);
      this.mesh.rotation.z = this.lean;
    } else {
      const bob = Math.sin(performance.now() * 0.008 + this.speed) * Math.min(0.06, Math.abs(this.speed) * 0.004);
      this.mesh.rotation.z = THREE.MathUtils.damp(this.mesh.rotation.z, -this.steerAngle * 0.1, 8, dt);
      this.mesh.rotation.x = THREE.MathUtils.damp(this.mesh.rotation.x || 0, bob, 6, dt);
    }

    // world bounds / ground
    this.mesh.position.y = world.getGroundHeight(this.mesh.position.x, this.mesh.position.z);

    // collide simple buildings
    world.resolveVehicleCollision(this);

    // fuel
    const consume = (Math.abs(this.speed) / 20) * (this.def.fuelConsumption / 100) * dt * (this.nitro ? 2.2 : 1);
    this.def.currentFuel = Math.max(0, (this.def.currentFuel ?? this.def.fuelCapacity) - consume);

    // mileage km
    const dist = this.lastPos.distanceTo(this.mesh.position) / 1000;
    this.def.currentMileage = (this.def.currentMileage || 0) + dist;
    this.lastPos.copy(this.mesh.position);

    const kmh = Math.abs(this.speed) * 3.6;
    if (Math.abs(this.speed) < 0.15 && !this.throttle && !this.brake) this.gear = 'P';
    else if (this.speed < -0.3) this.gear = 'R';
    else this.gear = 'D';
    this.rpm = Math.min(1, kmh / (this.def.topSpeed || 1) * 0.85 + this.throttle * 0.15);

    return kmh;
  }

  applyDamage(amount) {
    this.def.currentCondition = Math.max(5, (this.def.currentCondition ?? 100) - amount);
  }

  refuel(amountLiters = null) {
    const cap = this.def.fuelCapacity;
    if (amountLiters == null) this.def.currentFuel = cap;
    else this.def.currentFuel = Math.min(cap, (this.def.currentFuel || 0) + amountLiters);
  }

  repair(full = true) {
    if (full) this.def.currentCondition = 100;
    else this.def.currentCondition = Math.min(100, (this.def.currentCondition || 0) + 25);
  }

  refillNitro() {
    this.nitroAmount = this.def.nitroCapacity + ((this.def.upgrades?.nitro || 0) * 15);
    this.def.currentNitro = this.nitroAmount;
  }
}



/* CITY DRIVE PERFORMANCE PATCH
   Supplies a safe frame delta for physics systems without creating a second
   per-frame physics loop. */
(function(){
  "use strict";
  const MAX_DT=1/30;
  let last=performance.now();
  window.CityDriveGetDelta=function(now){var d=(now-(window.__cityDriveLastFrame||now))/1000;window.__cityDriveLastFrame=now;return Math.min(0.033,Math.max(0,d||0));};
})();;
