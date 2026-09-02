import * as THREE from 'three';
import { VEHICLES, getVehicleById, cloneVehicle } from './vehicles.js';
import { createVehicleMesh } from './vehicleFactory.js';
import { VehicleController } from './vehiclePhysics.js';
import { World, POIS, DISTRICTS, LANDMARKS } from './world.js';
import { NPCSystem } from './npc.js';
import { Economy, calculateJobPayout } from './economy.js';
import { saveGame, loadGame, hasSave, deleteSave } from './save.js';
import { levelFromXp, levelName, xpProgress } from './progression.js';
import { checkAchievements } from './achievements.js';
import { AudioSystem } from './audio.js';
import { Settings } from './settings.js';
import { Multiplayer, makeRoomCode } from './multiplayer.js';

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ui = ui;
    this.clock = new THREE.Clock();
    this.paused = false;
    this.inMenu = true;
    this.mode = 'onfoot'; // onfoot | driving
    this.cameraMode = 0;
    this.audio = new AudioSystem();
    this.economy = new Economy(12500);
    this.state = this._freshState();
    this.flags = {};
    this.activeMission = null;
    this.testDrive = null;
    this.visited = new Set(['downtown']);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio * 1.15, 2.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = Settings.get('graphics') !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = true;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 900);
    this.camera.position.set(0, 8, 16);

    this.world = new World(this.scene).build();
    this.npc = new NPCSystem(this.scene, this.world);
    this.npc.spawn(Settings.get('trafficDensity'), Settings.get('pedestrianDensity'));

    this.playerMesh = this._createPlayer();
    this.scene.add(this.playerMesh);

    this.vehicleActors = [];
    this.controller = null;
    this.activeActor = null;

    this.rain = null;
    this.mp = new Multiplayer(this);
    window.addEventListener('resize', () => this._resize());
  }

  _freshState() {
    const starter = cloneVehicle(getVehicleById('metro_s'), { currentFuel: 42, currentMileage: 12, isOwned: true });
    return {
      player: {
        name: 'Driver',
        money: 12500,
        xp: 0,
        level: 1,
        distanceDriven: 0,
        jobsCompleted: 0,
        racesWon: 0,
        missionsCompleted: 0
      },
      garage: { capacity: 5, vehicles: [starter] },
      ownedVehicleIds: [starter.vehicleUid],
      activeVehicleUid: starter.vehicleUid,
      activeVehicleId: starter.id,
      achievements: {},
      completedJobs: [],
      completedRaces: [],
      unlockedAreas: ['downtown', 'residential'],
      visitedDistricts: ['downtown']
    };
  }

  _createPlayer() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.28, 0.85, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x3366aa })
    );
    body.position.y = 0.95;
    body.castShadow = true;
    g.add(body);
    g.position.set(42, 0, -52);
    return g;
  }

  startNew(name = 'Driver') {
    this.state = this._freshState();
    this.state.player.name = name || 'Driver';
    this.economy.money = this.state.player.money;
    this._spawnOwnedVehicles();
    this.enterWorld(true);
    saveGame(this._savePayload());
  }

  continueGame() {
    const data = loadGame();
    if (!data) { this.startNew(); return; }
    this.state.player = { ...this.state.player, ...data.player };
    this.state.garage = data.garage || this.state.garage;
    (this.state.garage.vehicles || []).forEach(v => {
      if (!v.vehicleUid) v.vehicleUid = 'veh_mig_' + Math.random().toString(36).slice(2, 9);
      v.isOwned = true;
    });
    this.state.ownedVehicleIds = data.ownedVehicleIds || this.state.garage.vehicles.map(v => v.vehicleUid);
    this.state.activeVehicleUid = data.activeVehicleUid || this.state.garage.vehicles[0]?.vehicleUid || null;
    this.state.activeVehicleId = data.activeVehicleId
      || this.state.garage.vehicles.find(v => v.vehicleUid === this.state.activeVehicleUid)?.id
      || null;
    this.state.achievements = data.achievements || {};
    this.state.completedJobs = data.completedJobs || [];
    this.state.completedRaces = data.completedRaces || [];
    this.state.visitedDistricts = data.visitedDistricts || [];
    this.economy.money = this.state.player.money;
    this._spawnOwnedVehicles();
    this.enterWorld(true);
    this.persist();
  }

  _savePayload() {
    this.state.player.money = this.economy.money;
    this.state.player.level = levelFromXp(this.state.player.xp);
    this.state.garage.vehicles = (this.state.garage.vehicles || []).filter(v => v && v.isOwned && !v.isTestDrive);
    this.state.ownedVehicleIds = this.state.garage.vehicles.map(v => v.vehicleUid);
    return this.state;
  }

  persist() {
    saveGame(this._savePayload());
  }

  _spawnOwnedVehicles() {
    for (const a of this.vehicleActors) this.scene.remove(a.mesh);
    this.vehicleActors = [];
    const list = (this.state.garage.vehicles || []).filter(v => v && v.isOwned !== false && !v.isTestDrive);
    this.state.garage.vehicles = list;
    list.forEach((v, i) => {
      const mesh = createVehicleMesh(v);
      mesh.position.set(36 + (i % 3) * 6, 0, -56 - Math.floor(i / 3) * 8);
      mesh.rotation.y = Math.PI;
      this.scene.add(mesh);
      const ctrl = new VehicleController(mesh, v);
      ctrl.applyUpgrades(v.upgrades);
      this.vehicleActors.push({ def: v, mesh, ctrl });
    });
    this.activeActor = this.vehicleActors[0] || null;
    if (this.state.activeVehicleUid) {
      this.activeActor = this.vehicleActors.find(a => a.def.vehicleUid === this.state.activeVehicleUid) || this.activeActor;
    }
  }

  findActorByUid(uid) {
    return this.vehicleActors.find(a => a.def.vehicleUid === uid && !a.temp) || null;
  }

  enterWorld(startInVehicle = true) {
    this.inMenu = false;
    this.paused = false;
    // Start directly in the player's owned vehicle so the game opens as a driving game.
    this.mode = startInVehicle && this.activeActor ? 'driving' : 'onfoot';
    this.controller = this.mode === 'driving' ? this.activeActor.ctrl : null;
    this.playerMesh.visible = this.mode !== 'driving';
    if (this.mode === 'driving') {
      this.controller.speed = 0;
      this.controller.heading = this.activeActor.mesh.rotation.y;
      this.controller.lastPos.copy(this.activeActor.mesh.position);
    }
    this.ui.showGame();
    this.audio.resume();
    this.audio.setVolumes(Settings.get('soundVolume'), Settings.get('musicVolume'), Settings.get('musicOn'));
    this.clock.getDelta();
    if (!this.loopRunning) {
      this.loopRunning = true;
      this._loop();
    }
  }

  _loop = () => {
    requestAnimationFrame(this._loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    if (this.inMenu) return;
    if (this.paused) {
      if (this.ui.input.consumePause()) this.ui.togglePause(this);
      this.render();
      return;
    }
    this.update(dt);
    this.render();
  };

  update(dt) {
    const input = this.ui.input;
    const panelOpen = !!document.getElementById('active-panel');
    input.gameplayEnabled = !panelOpen && !this.paused && !this.inMenu;
    input._syncAxes();

    if (input.consumePause()) {
      this.ui.togglePause(this);
      return;
    }
    if (input.consumeMap()) this.ui.openMap(this);
    if (input.consumeGarage()) this.ui.openGarage(this);

    const day = this.world.updateDayNight(dt, this.paused);
    if (day.night) {
      this.flags.night = true;
      if (!this.headlightsOn && this.mode === 'driving') this.toggleHeadlights();
    }
    if (this.world.weather === 'rain') this.flags.rain = true;

    if (input.consumeCamera()) this.cameraMode = (this.cameraMode + 1) % 4;
    if (input.consumeHeadlights()) this.toggleHeadlights();
    if (input.consumeHorn()) this.audio.beep(220, 0.28, 'square', 0.1);

    if (this.mode === 'driving' && this.controller) {
      const wet = this.world.weather === 'rain' ? 0.82 : 1;
      this.controller.wetGrip = wet;
      const dist = this.world.getDistrict(this.controller.mesh.position.x, this.controller.mesh.position.z);
      this.controller.offroadMul = dist.id === 'mountain' ? (0.6 + this.controller.def.offroad / 200) : 1;
      const fuelPct = Math.round(((this.controller.def.currentFuel || 0) / this.controller.def.fuelCapacity) * 100);
      if (fuelPct <= 15 && fuelPct > 0 && !this._lowFuelWarned) {
        this._lowFuelWarned = true;
        this.ui.toast('LOW FUEL');
      }
      if (fuelPct > 20) this._lowFuelWarned = false;
      const kmh = this.controller.update(dt, input, this.world);
      this.state.player.distanceDriven += (Math.abs(this.controller.speed) * dt) / 1000;
      this.flags.drove = true;
      if (kmh >= 200) this.flags.speed200 = true;
      if (this.controller.def.isMotorcycle) this.flags.bike = true;
      this.audio.updateEngine(kmh, this.controller.throttle, true);

      this._missionUpdate(dt);
      const interacted = this._poiPrompts(this.controller.mesh.position);
      if (!interacted && input.consumeEnter()) this.exitVehicle();
    } else {
      this._walk(dt, input);
      this.audio.updateEngine(0, 0, false);
      const interacted = this._poiPrompts(this.playerMesh.position);
      if (!interacted && input.consumeEnter()) this._tryEnter();
    }

    const driving = this.mode === 'driving' && this.controller;
    const pos = driving ? this.controller.mesh.position : this.playerMesh.position;
    const spd = driving ? Math.abs(this.controller.speed) : 0;
    const reckless = driving && (spd > 28) && this.controller.handbrake;
    const wanted = this.npc.update(dt, pos, spd, { reckless, busted: false });
    if (this.npc.wanted >= 1 && Math.random() < dt * 2) this.audio.sirenTick(true);

    const d = this.world.getDistrict(pos.x, pos.z);
    this.visited.add(d.id);
    this.state.visitedDistricts = [...this.visited];

    if (this._raceAI && this.activeMission?.kind === 'race') {
      for (const bot of this._raceAI) {
        const cp = this.activeMission.checkpoints[bot.cp];
        if (!cp) continue;
        const dx = cp.x - bot.mesh.position.x;
        const dz = cp.z - bot.mesh.position.z;
        const d = Math.hypot(dx, dz) || 1;
        bot.mesh.position.x += (dx / d) * bot.speed * dt;
        bot.mesh.position.z += (dz / d) * bot.speed * dt;
        bot.mesh.rotation.y = Math.atan2(dx / d, dz / d);
        if (d < 8) bot.cp++;
      }
    }

    if (this.mp.active) {
      this.mp.sendState(dt);
      this.mp.interpolate(dt);
      this.mp.updateLocalP2(dt, this.world);
      if (this.mp.p2 && this.activeMission?.kind === 'race') {
        this._advanceRacer(this.mp.p2);
      }
    }

    const newly = checkAchievements(this.state, this.flags);
    newly.forEach(a => this.ui.toast(`Achievement: ${a.name}`));

    this._updateCamera(dt);
    this.ui.updateHUD(this);
    if (this._saveTimer === undefined) this._saveTimer = 0;
    this._saveTimer += dt;
    if (this._saveTimer > 8) { this.persist(); this._saveTimer = 0; }
  }

  _walk(dt, input) {
    const dir = new THREE.Vector3();
    if (input.accel) dir.z -= 1;
    if (input.brake) dir.z += 1;
    if (input.left) dir.x -= 1;
    if (input.right) dir.x += 1;

    // Jump is independent of movement: Space should work while standing still.
    if ((input.consume('jump') || (input.jump && !this._jumping)) && !this._jumping) {
      this._jumping = true;
      this.playerMesh.userData.vy = 4.2;
    }

    if (dir.lengthSq() > 0) {
      dir.normalize();
      const speed = input.sprint ? 8.8 : 4.2;
      // simple world-aligned walk
      this.playerMesh.position.x += dir.x * speed * dt;
      this.playerMesh.position.z += dir.z * speed * dt;
    }
    const vy = this.playerMesh.userData.vy || 0;
    if (this._jumping) {
      this.playerMesh.userData.vy = vy - 12 * dt;
      this.playerMesh.position.y += (this.playerMesh.userData.vy) * dt;
      if (this.playerMesh.position.y <= 0) {
        this.playerMesh.position.y = 0;
        this.playerMesh.userData.vy = 0;
        this._jumping = false;
      }
    } else {
      this.playerMesh.position.y = 0;
    }
  }

  toggleHeadlights() {
    this.headlightsOn = !this.headlightsOn;
    if (!this._headlamp) {
      this._headlamp = new THREE.SpotLight(0xfff2cc, 0, 48, Math.PI / 5, 0.4, 1);
      this.scene.add(this._headlamp);
      this.scene.add(this._headlamp.target);
    }
    this._headlamp.intensity = this.headlightsOn ? 2.2 : 0;
    this.ui.toast(this.headlightsOn ? 'Headlights ON' : 'Headlights OFF');
  }

  _tryEnter() {
    const p = this.playerMesh.position;
    let best = null, bd = 8;
    for (const a of this.vehicleActors) {
      const d = a.mesh.position.distanceTo(p);
      if (d < bd) { bd = d; best = a; }
    }
    if (best) this.enterVehicle(best);
  }

  enterVehicle(actor) {
    this.activeActor = actor;
    this.controller = actor.ctrl;
    this.mode = 'driving';
    this.playerMesh.visible = false;
    this.ui.prompt('');
    this.ui.toast(`Driving ${actor.def.name}`);
    if (actor.def && actor.def.isOwned && !actor.def.isTestDrive) {
      this.state.activeVehicleUid = actor.def.vehicleUid;
      this.state.activeVehicleId = actor.def.id;
    }
  }

  exitVehicle() {
    if (!this.controller) return;
    this.playerMesh.position.copy(this.controller.mesh.position);
    this.playerMesh.position.x += 2;
    this.playerMesh.visible = true;
    this.mode = 'onfoot';
    this.controller = null;
  }

  _poiPrompts(pos) {
    const nearFuel = this.world.nearestPOI(pos.x, pos.z, POIS.fuel, 8);
    const nearGarage = Math.hypot(pos.x - POIS.garage.x, pos.z - POIS.garage.z) < 10;
    const nearRepair = Math.hypot(pos.x - POIS.repair.x, pos.z - POIS.repair.z) < 10;
    const nearDeal = this.world.nearestPOI(pos.x, pos.z, POIS.dealerships, 10);
    const nearJob = this.world.nearestPOI(pos.x, pos.z, POIS.jobs, 9);
    const nearRace = this.world.nearestPOI(pos.x, pos.z, POIS.races, 9);

    if (nearFuel) this.ui.prompt('E — FULL REFUEL  ·  R — +10L');
    else if (nearGarage) this.ui.prompt('E — GARAGE');
    else if (nearRepair) this.ui.prompt('E — REPAIR');
    else if (nearDeal) this.ui.prompt(`E — ${nearDeal.name}`);
    else if (nearJob) this.ui.prompt(`E — ${nearJob.name}`);
    else if (nearRace) this.ui.prompt(`E — ${nearRace.name}`);
    else if (this.mode === 'onfoot') {
      const nearV = this.vehicleActors.some(a => a.mesh.position.distanceTo(this.playerMesh.position) < 6);
      this.ui.prompt(nearV ? 'E — ENTER VEHICLE' : '');
    } else this.ui.prompt(this.mode === 'driving' ? '' : '');

    if (this.ui.input.consumeEnter()) {
      if (nearFuel && this.controller) {
        if (this.ui.input.held.has('KeyR')) this.refuelPartial(10);
        else this._refuel();
        return true;
      }
      if (nearGarage) { this.ui.openGarage(this); return true; }
      if (nearRepair && this.controller) { this._repair(); return true; }
      if (nearDeal) { this.ui.openDealership(this, nearDeal); return true; }
      if (nearJob) { this.startJob(nearJob); return true; }
      if (nearRace) { this.startRace(nearRace); return true; }
    }
    return false;
  }

  _refuel() {
    const v = this.controller.def;
    const need = v.fuelCapacity - (v.currentFuel || 0);
    const cost = Math.round(need * 2.4);
    if (!this.economy.canAfford(cost)) { this.ui.toast('INSUFFICIENT FUNDS'); return; }
    this.economy.spend(cost);
    this.controller.refuel();
    this.controller.refillNitro();
    this.ui.toast(`FULL REFUEL — ${this.economy.format(cost)}`);
    this.persist();
  }

  refuelPartial(liters) {
    if (!this.controller) return;
    const v = this.controller.def;
    const add = Math.min(liters, v.fuelCapacity - (v.currentFuel || 0));
    const cost = Math.round(add * 2.4);
    if (!this.economy.canAfford(cost)) { this.ui.toast('INSUFFICIENT FUNDS'); return; }
    this.economy.spend(cost);
    this.controller.refuel(add);
    this.ui.toast(`PARTIAL REFUEL +${add.toFixed(1)}L — ${this.economy.format(cost)}`);
    this.persist();
  }

  _repair() {
    const v = this.controller.def;
    const dmg = 100 - (v.currentCondition || 100);
    const cost = Math.round(dmg * 18 + 40);
    if (dmg < 1) { this.ui.toast('Vehicle is already in excellent condition'); return; }
    if (!this.economy.canAfford(cost)) { this.ui.toast('INSUFFICIENT FUNDS'); return; }
    this.economy.spend(cost);
    this.controller.repair(true);
    this.ui.toast(`Repaired — ${this.economy.format(cost)}`);
    this.persist();
  }

  startJob(job) {
    const dest = LANDMARKS[Math.floor(Math.random() * LANDMARKS.length)];
    const start = this.mode === 'driving' ? this.controller.mesh.position : this.playerMesh.position;
    const dist = Math.hypot(dest.x - start.x, dest.z - start.z) / 100;
    this.activeMission = {
      kind: 'job',
      type: job.type,
      name: job.name,
      dest,
      startDamage: this.controller?.def.currentCondition ?? 100,
      startTime: performance.now(),
      dist
    };
    this.ui.toast(`${job.name} started → ${dest.name}`);
    this.audio.checkpoint();
  }

  startRace(race, opts = {}) {
    const checkpoints = opts.checkpoints || [];
    if (!checkpoints.length) {
      for (let i = 0; i < 5; i++) {
        checkpoints.push({
          x: race.x + Math.sin(i * 1.2) * (40 + i * 15),
          z: race.z + Math.cos(i * 1.2) * (40 + i * 15)
        });
      }
    }
    this._clearRaceMarkers();
    this._spawnRaceMarkers(checkpoints);
    this.activeMission = {
      kind: 'race',
      type: race.id,
      name: race.name,
      checkpoints,
      index: 0,
      startTime: performance.now(),
      multiplayer: !!opts.multiplayer || this.mp.active
    };
    this.flags.raced = true;
    if (this.mp.active && this.mp.role === 'host') {
      this.mp.hostStartRace(race, checkpoints);
    }
    this.activeMission.countdown = 3;
    this.ui.toast('3');
    const tick = () => {
      if (!this.activeMission || this.activeMission.kind !== 'race') return;
      this.activeMission.countdown -= 1;
      if (this.activeMission.countdown > 0) {
        this.ui.toast(String(this.activeMission.countdown));
        setTimeout(tick, 700);
      } else {
        this.ui.toast('GO');
        this.audio.checkpoint();
        this._spawnRaceAI(this.activeMission.checkpoints);
      }
    };
    setTimeout(tick, 700);
    this.ui.toast(`${race.name} — get ready`);
  }

  _spawnRaceAI(checkpoints) {
    this._clearRaceAI();
    const ids = ['urban_lx', 'falcon_sport', 'city_explorer'];
    this._raceAI = ids.map((id, i) => {
      const def = cloneVehicle(getVehicleById(id));
      def.isOwned = false;
      const mesh = createVehicleMesh(def);
      mesh.position.set(checkpoints[0].x + (i + 1) * 5, 0, checkpoints[0].z - 10);
      this.scene.add(mesh);
      return { mesh, def, cp: 0, speed: 16 + i * 3 };
    });
  }

  _clearRaceAI() {
    (this._raceAI || []).forEach(r => this.scene.remove(r.mesh));
    this._raceAI = [];
  }

  _spawnRaceMarkers(cps) {
    this._raceMarkers = [];
    cps.forEach((cp, i) => {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(4.5, 0.25, 8, 20),
        new THREE.MeshBasicMaterial({ color: i === 0 ? 0x00ff9d : 0xffcc33 })
      );
      m.position.set(cp.x, 2.2, cp.z);
      m.rotation.x = Math.PI / 2;
      this.scene.add(m);
      this._raceMarkers.push(m);
    });
  }

  _clearRaceMarkers() {
    (this._raceMarkers || []).forEach(m => this.scene.remove(m));
    this._raceMarkers = [];
  }

  _advanceRacer(racer) {
    const m = this.activeMission;
    if (!m?.checkpoints) return;
    racer.cp = racer.cp || 0;
    const cp = m.checkpoints[racer.cp];
    if (cp && Math.hypot(racer.mesh.position.x - cp.x, racer.mesh.position.z - cp.z) < 10) {
      racer.cp++;
    }
  }

  _missionUpdate() {
    if (!this.activeMission || !this.controller) return;
    const p = this.controller.mesh.position;
    if (this.activeMission.kind === 'job') {
      const d = Math.hypot(p.x - this.activeMission.dest.x, p.z - this.activeMission.dest.z);
      if (d < 10 && !this.activeMission.paid) this._completeJob();
    } else if (this.activeMission.kind === 'race') {
      const cp = this.activeMission.checkpoints[this.activeMission.index];
      if (cp && Math.hypot(p.x - cp.x, p.z - cp.z) < 10) {
        this.activeMission.index++;
        this.audio.checkpoint();
        const markers = this._raceMarkers || [];
        if (markers[this.activeMission.index - 1]) markers[this.activeMission.index - 1].material.color.setHex(0x335544);
        if (markers[this.activeMission.index]) markers[this.activeMission.index].material.color.setHex(0x00ff9d);
        if (this.activeMission.index >= this.activeMission.checkpoints.length && !this.activeMission.paid) this._completeRace();
      }
    }
  }

  _completeJob() {
    const m = this.activeMission;
    if (!m || m.paid) return;
    m.paid = true;
    const condNow = this.controller?.def.currentCondition ?? 100;
    const clean = condNow >= m.startDamage - 1;
    if (clean) this.flags.cleanJob = true;
    if (m.type === 'offroad') this.flags.offroadJob = true;
    const pay = calculateJobPayout(m.type, m.dist, 1.1, clean ? 1.15 : 0.85, 1);
    const xp = 25 + Math.round(m.dist * 8);
    this.economy.earn(pay);
    this.state.player.xp += xp;
    this.state.player.jobsCompleted++;
    this.state.player.level = levelFromXp(this.state.player.xp);
    this.activeMission = null;
    this.audio.success();
    this.ui.toast(`Job complete +${this.economy.format(pay)}  +${xp} XP`);
    this.persist();
  }

  _completeRace() {
    if (!this.activeMission || this.activeMission.paid) return;
    this.activeMission.paid = true;
    const elapsed = (performance.now() - this.activeMission.startTime) / 1000;
    const mp = this.activeMission.multiplayer && this.mp.active;
    let place = 1;
    if (mp) {
      const othersDone = [...this.mp.finished.values()].length;
      place = othersDone + 1;
      this.mp.announceFinish(place, elapsed);
      if (this.mp.p2 && (this.mp.p2.cp || 0) >= this.activeMission.checkpoints.length) {
        place = Math.max(place, 2);
      }
    }
    const win = mp ? place === 1 : elapsed < 90;
    const pay = win ? (mp ? 650 : 420) : (mp ? 220 : 160);
    const xp = win ? 50 : 20;
    this.economy.earn(pay);
    this.state.player.xp += xp;
    if (win) this.state.player.racesWon++;
    this.state.player.level = levelFromXp(this.state.player.xp);
    this.activeMission = null;
    this._clearRaceMarkers();
    this._clearRaceAI();
    this.audio.success();
    this.ui.toast(mp
      ? `P${place}  ${elapsed.toFixed(1)}s  +${this.economy.format(pay)}`
      : `${win ? 'Race won' : 'Race finished'} +${this.economy.format(pay)}`);
    this.persist();
  }

  buyVehicle(id) {
    const base = getVehicleById(id);
    if (!base) return false;
    if (this.state.player.level < base.requiredLevel) {
      this.ui.toast(`Requires level ${base.requiredLevel}`);
      return false;
    }
    if (this.state.garage.vehicles.length >= this.state.garage.capacity) {
      this.ui.toast('Garage full — expand first');
      return false;
    }
    if (!this.economy.canAfford(base.price)) {
      this.ui.toast('INSUFFICIENT FUNDS');
      return false;
    }
    this.economy.spend(base.price);
    const owned = cloneVehicle(base, { isOwned: true, isTestDrive: false, purchasePrice: base.price });
    this.state.garage.vehicles.push(owned);
    this.state.ownedVehicleIds.push(owned.vehicleUid);
    this.flags.purchased = true;
    const mesh = createVehicleMesh(owned);
    mesh.position.set(36 + this.vehicleActors.filter(a => !a.temp).length * 5, 0, -56);
    this.scene.add(mesh);
    this.vehicleActors.push({ def: owned, mesh, ctrl: new VehicleController(mesh, owned), temp: false });
    this.audio.success();
    this.ui.toast(`Purchased ${base.name} — added to garage`);
    this.persist();
    return true;
  }

  sellVehicleByUid(uid) {
    const index = this.state.garage.vehicles.findIndex(v => v.vehicleUid === uid);
    if (index < 0) return;
    this.sellVehicle(index);
  }

  sellVehicle(index) {
    const v = this.state.garage.vehicles[index];
    if (!v) return;
    if (v.isTestDrive) return;
    if (this.controller && this.controller.def.vehicleUid === v.vehicleUid) {
      this.ui.toast('YOU CANNOT SELL YOUR CURRENT VEHICLE.');
      return;
    }
    if (this.state.garage.vehicles.length <= 1) {
      this.ui.toast('You must keep at least one vehicle');
      return;
    }
    const cond = (v.currentCondition ?? 100) / 100;
    const miles = v.currentMileage || 0;
    const value = Math.round(v.price * v.resaleFactor * cond * Math.max(0.4, 1 - miles / 80000));
    this.economy.earn(value);
    const uid = v.vehicleUid;
    this.state.garage.vehicles = this.state.garage.vehicles.filter(x => x.vehicleUid !== uid);
    const actor = this.findActorByUid(uid);
    this.vehicleActors = this.vehicleActors.filter(a => a.def.vehicleUid !== uid);
    if (actor) this.scene.remove(actor.mesh);
    this.state.ownedVehicleIds = this.state.garage.vehicles.map(x => x.vehicleUid);
    this.ui.toast(`Sold ${v.name} for ${this.economy.format(value)}`);
    this.persist();
  }

  upgradeVehicle(v, part) {
    v.upgrades = v.upgrades || { engine: 0, transmission: 0, tires: 0, brakes: 0, suspension: 0, nitro: 0, fuelSystem: 0 };
    if (v.upgrades[part] >= 5) { this.ui.toast('Max upgrade'); return; }
    const cost = 400 + v.upgrades[part] * 350 + Math.round(v.price * 0.02);
    if (!this.economy.canAfford(cost)) { this.ui.toast('INSUFFICIENT FUNDS'); return; }
    this.economy.spend(cost);
    v.upgrades[part]++;
    if (part === 'fuelSystem') v.fuelConsumption *= 0.94;
    this.flags.upgraded = true;
    this.ui.toast(`${part} upgraded to ${v.upgrades[part]}`);
    this.persist();
  }

  paintVehicle(v, color) {
    const cost = 250;
    if (!this.economy.canAfford(cost)) { this.ui.toast('INSUFFICIENT FUNDS'); return; }
    this.economy.spend(cost);
    v.customization = v.customization || {};
    v.customization.primaryColor = color;
    v.color = color;
    const actor = this.vehicleActors.find(a => a.def === v);
    if (actor) {
      actor.mesh.traverse(ch => {
        if (ch.isMesh && ch.material && ch.material.color && ch.name !== 'wheel') {
          ch.material.color.setHex(color);
        }
      });
    }
    this.persist();
    this.ui.toast('Paint applied');
  }

  expandGarage() {
    const next = this.state.garage.capacity === 5 ? 10 : this.state.garage.capacity === 10 ? 15 : null;
    const cost = next === 10 ? 15000 : 40000;
    if (!next) { this.ui.toast('Garage already premium'); return; }
    if (!this.economy.canAfford(cost)) { this.ui.toast('INSUFFICIENT FUNDS'); return; }
    this.economy.spend(cost);
    this.state.garage.capacity = next;
    this.ui.toast(`Garage expanded to ${next} slots`);
    this.persist();
  }

  setWeather(w) {
    this.world.weather = w;
    if (w === 'rain' && !this.rain) {
      const geo = new THREE.BufferGeometry();
      const n = 800;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 80;
        pos[i * 3 + 1] = Math.random() * 30;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      this.rain = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xaaccff, size: 0.12 }));
      this.scene.add(this.rain);
    }
    if (w !== 'rain' && this.rain) {
      this.scene.remove(this.rain);
      this.rain = null;
    }
  }

  _updateCamera(dt) {
    const target = this.mode === 'driving' ? this.controller.mesh : this.playerMesh;
    const heading = this.mode === 'driving' ? this.controller.heading : 0;
    const modes = [
      { back: 8.5, up: 3.2 },
      { back: 5.5, up: 2.2 },
      { back: 2.2, up: 1.4 },
      { back: 0.3, up: 1.35 }
    ];
    const m = modes[this.cameraMode];
    const isBike = this.mode === 'driving' && this.controller.def.isMotorcycle;
    const back = isBike ? m.back * 0.85 : m.back;
    const ox = Math.sin(heading) * -back;
    const oz = Math.cos(heading) * -back;
    const desired = new THREE.Vector3(target.position.x + ox, target.position.y + m.up, target.position.z + oz);
    this.camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
    const look = target.position.clone();
    look.y += 1.1;
    look.x += Math.sin(heading) * 4;
    look.z += Math.cos(heading) * 4;
    this.camera.lookAt(look);

    if (this.rain) this.rain.position.copy(target.position);
    if (this._headlamp && this.headlightsOn && this.mode === 'driving' && this.controller) {
      const h = this.controller.heading;
      this._headlamp.position.set(target.position.x + Math.sin(h) * 1.6, target.position.y + 0.9, target.position.z + Math.cos(h) * 1.6);
      this._headlamp.target.position.set(target.position.x + Math.sin(h) * 18, 0.4, target.position.z + Math.cos(h) * 18);
    }
  }

  startTestDrive(def) {
    const owned = cloneVehicle(getVehicleById(def.id) || def);
    owned.currentFuel = def.fuelCapacity;
    owned.currentCondition = 100;
    owned.isTestDrive = true;
    owned.isOwned = false;
    const mesh = createVehicleMesh(def);
    mesh.position.set(48, 0, -40);
    this.scene.add(mesh);
    const ctrl = new VehicleController(mesh, owned);
    this.testDrive = {
      mesh, ctrl, catalogId: def.id,
      prevUid: this.state.activeVehicleUid,
      ends: performance.now() + 45000
    };
    this.vehicleActors.push({ def: owned, mesh, ctrl, temp: true });
    this.mode = 'driving';
    this.activeActor = { def: owned, mesh, ctrl };
    this.controller = ctrl;
    this.playerMesh.visible = false;
    this.ui.toast('Test drive — 45 seconds (not added to garage)');
    if (this._tdTimer) clearTimeout(this._tdTimer);
    this._tdTimer = setTimeout(() => this.endTestDrive(), 45000);
  }

  endTestDrive() {
    if (!this.testDrive) return;
    if (this._tdTimer) { clearTimeout(this._tdTimer); this._tdTimer = null; }
    const catalogId = this.testDrive.catalogId;
    const prevUid = this.testDrive.prevUid;
    if (this.mode === 'driving' && this.controller?.def?.isTestDrive) this.exitVehicle();
    this.scene.remove(this.testDrive.mesh);
    this.vehicleActors = this.vehicleActors.filter(a => !a.temp && a.mesh !== this.testDrive.mesh);
    this.testDrive = null;
    this.state.activeVehicleUid = prevUid;
    this.ui.toast('Test drive ended');
    this.ui.offerTestDriveReturn(this, catalogId);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    this.ui.drawMinimap(this);
  }

  _resize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
  }

  resetProgress() {
    deleteSave();
    this.startNew(this.state.player.name);
  }
}

export { VEHICLES, POIS, DISTRICTS, LANDMARKS, hasSave, levelName, xpProgress, Settings, makeRoomCode };
