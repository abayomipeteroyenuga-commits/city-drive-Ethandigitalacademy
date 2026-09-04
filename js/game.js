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
import { CAMPAIGN_MISSIONS, getCampaignMission, getCampaignColor, getCampaignDestination, getCampaignJobStages, getCampaignRaceCheckpoints, getDailyChallenge, getDailyDateKey } from './missions.js';

const STARTER_GWAGON_GREEN = 0x1f5b3a;
import { SHOP_ITEMS, getShopItem } from './shop.js';
import { getCareerScore, saveLocalRank } from './ranking.js';

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ui = ui;
    this.clock = new THREE.Clock();
    this.paused = false;
    this.inMenu = true;
    this.mode = 'driving'; // driving | onfoot
    this.cameraMode = 0;
    this.audio = new AudioSystem();
    this.economy = new Economy(50000);
    this.state = this._freshState();
    this.flags = {};
    this.activeMission = null;
    this.testDrive = null;
    this.visited = new Set(['downtown']);
    this.missionWaypoint = null;
    this.destinationTracker = null;
    this.destinationTrackerColor = 0x00d4ff;
    this._routeProgressTimer = 0;
    this._routeProgressPos = new THREE.Vector3();
    // Three AI rivals accompany every campaign level and are capped before the finish.
    this._campaignRivals = [];
    this.emoteState = { name: '', emoji: '', until: 0, pulse: 0 };
    this._emoteBubble = null;
    this.levelCelebration = null;

    const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const isSmallScreen = Math.min(window.innerWidth, window.innerHeight) <= 820;
    const savedGraphics = Settings.get('graphics') || 'auto';
    const useAntialias = savedGraphics === 'low' ? false : (!isTouchDevice && !isSmallScreen);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: useAntialias, powerPreference: isTouchDevice ? 'low-power' : 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    const dprCap = isTouchDevice ? 1.25 : (isSmallScreen ? 1.45 : 1.75);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.useLegacyLights = false;
    this.renderer.shadowMap.enabled = false;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 900);
    this.camera.position.set(0, 8, 16);

    this.world = new World(this.scene).build();
    this.npc = new NPCSystem(this.scene, this.world);
    this.npc.spawn(Settings.get('trafficDensity'), Settings.get('pedestrianDensity'));

    this.playerMesh = this._createPlayer();
    this.scene.add(this.playerMesh);
    this._applyShopAppearance();
    // David is an optional on-foot avatar. CITY DRIVE always boots as a driving game.
    this.playerMesh.visible = false;

    this.vehicleActors = [];
    this.controller = null;
    this.activeActor = null;
    // Spawn the starter/selected car immediately so every menu path has a real vehicle.
    this._spawnOwnedVehicles();

    this.rain = null;
    this.mp = new Multiplayer(this);
    window.addEventListener('resize', () => this._resize());
  }

  _freshState() {
    const starter = cloneVehicle(getVehicleById('metro_s'), { currentFuel: 70, currentMileage: 12, isOwned: true, currentCondition: 100, customization: { primaryColor: STARTER_GWAGON_GREEN, secondaryColor: getVehicleById('metro_s')?.secondaryColor, wheels: 0, tint: 0, headlights: 0, spoiler: 0, underglow: 0, colorCustomized: false } });
    return {
      player: {
        name: 'Driver',
        money: 50000,
        xp: 0,
        level: 1,
        distanceDriven: 0,
        jobsCompleted: 0,
        racesWon: 0,
        missionsCompleted: 0,
        campaignLevel: 1,
        campaignCompleted: [],
        daily: { date: '', challengeId: '', completed: false, streak: 0, lastCompletedDate: '', startDistance: 0, startMoney: 50000, cashEarned: 0, districtsVisited: [] },
        shop: { owned: ['outfit_city','shoes_city','hair_classic','accessory_none'], equipped: { outfit: 'outfit_city', shoes: 'shoes_city', hair: 'hair_classic', accessory: 'accessory_none' } }
      },
      garage: { capacity: 8, vehicles: [starter] },
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
    // David is only used after the player exits a vehicle. Keep him as a
    // lightweight low-poly human made from standard primitives — never a
    // capsule placeholder — so the driving start is visually car-first.
    const g = new THREE.Group();
    g.name = 'David';

    const skin = new THREE.MeshStandardMaterial({ color: 0x8b5a3c, roughness: 0.8 });
    const shirt = new THREE.MeshStandardMaterial({ color: 0x244a7a, roughness: 0.72 });
    const trousers = new THREE.MeshStandardMaterial({ color: 0x202634, roughness: 0.82 });
    const shoes = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9, metalness: 0.05 });
    const hair = new THREE.MeshStandardMaterial({ color: 0x17120f, roughness: 0.95 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.72, 0.34), shirt);
    torso.name = 'david_shirt';
    torso.position.y = 1.15;
    torso.castShadow = true;
    g.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), skin);
    head.position.y = 1.72;
    head.scale.set(0.92, 1.05, 0.92);
    head.castShadow = true;
    g.add(head);

    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.255, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.48), hair);
    hairCap.name = 'david_hair';
    hairCap.position.y = 1.78;
    hairCap.castShadow = true;
    g.add(hairCap);

    for (const x of [-0.18, 0.18]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.62, 0.22), trousers);
      leg.name = 'david_trousers';
      leg.position.set(x, 0.52, 0);
      leg.castShadow = true;
      g.add(leg);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.34), shoes);
      shoe.name = 'david_shoe';
      shoe.position.set(x, 0.17, 0.04);
      shoe.castShadow = true;
      g.add(shoe);
    }

    for (const x of [-0.42, 0.42]) {
      const side = x < 0 ? 'L' : 'R';
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.62, 0.18), shirt);
      arm.name = `david_arm_${side}`;
      arm.position.set(x, 1.16, 0);
      arm.rotation.z = x < 0 ? 0.08 : -0.08;
      arm.castShadow = true;
      g.add(arm);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 7), skin);
      hand.name = `david_hand_${side}`;
      // Parent the hand to the arm so the celebration pose visibly raises
      // the complete arm + hand together.
      hand.position.set(0, 0.36, 0);
      hand.castShadow = true;
      arm.add(hand);
    }

    const chain = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.018, 6, 24, Math.PI * 1.65), new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.22 }));
    chain.name = 'david_accessory_chain';
    chain.rotation.x = Math.PI / 2;
    chain.position.set(0, 1.38, 0.19);
    chain.visible = false;
    g.add(chain);
    const shades = new THREE.Group();
    shades.name = 'david_accessory_shades';
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.35, roughness: 0.25 });
    const lensL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.055, 0.025), lensMat);
    const lensR = lensL.clone();
    lensL.position.x = -0.095; lensR.position.x = 0.095;
    shades.add(lensL, lensR);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.025), lensMat);
    shades.add(bridge);
    shades.position.set(0, 1.73, 0.225);
    shades.visible = false;
    g.add(shades);

    g.position.set(42, 0, -52);
    return g;
  }

  _resetSessionRuntime() {
    if (this._tdTimer) { clearTimeout(this._tdTimer); this._tdTimer = null; }
    this.testDrive = null;
    this.levelCelebration = null;
    this.activeMission = null;
    this._clearMissionWaypoint();
    this._clearRoute();
    this._clearRaceMarkers();
    this._clearCampaignRivals();
    this._clearRaceAI();
    if (this.mp?.active) this.mp.end();
    this.activeActor = null;
    this.controller = null;
    this.mode = 'driving';
    this.flags = {};
    this._lowFuelWarned = false;
    this._saveTimer = 0;
    this._jumping = false;
    this.playerMesh.visible = false;
  }

  startNew(name = 'Driver') {
    this._resetSessionRuntime();
    this.isNewGameSession = true;
    this.state = this._freshState();
    this._pendingVehicleColor = null;
    this.state.player.name = name || 'Driver';
    this.economy.money = this.state.player.money;
    this._ensureDailyChallenge();
    this.visited = new Set(this.state.visitedDistricts || ['downtown']);
    this._spawnOwnedVehicles();
    this.enterWorld(true);
    saveGame(this._savePayload());
  }

  continueGame() {
    this.isNewGameSession = false;
    const data = loadGame();
    if (!data) { this.startNew(); return; }
    this._resetSessionRuntime();
    this.state.player = { ...this.state.player, ...data.player };
    this.state.garage = data.garage || this.state.garage;
    // Legacy saves sometimes carried the old black Titan X4. New games must
    // always start with the requested green Titan X4; preserve deliberate
    // player repaint choices via colorCustomized.
    (this.state.garage.vehicles || []).forEach(v => {
      if (v?.id === 'metro_s') {
        v.customization = v.customization || {};
        if (!v.customization.colorCustomized && (!v.customization.primaryColor || Number(v.customization.primaryColor) === 0x111111 || Number(v.customization.primaryColor) === 0x000000)) {
          v.customization.primaryColor = STARTER_GWAGON_GREEN;
          v.color = STARTER_GWAGON_GREEN;
        }
      }
    });
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
    const loadedCampaignLevel = Number(data.player?.campaignLevel);
    this.state.player.campaignLevel = Number.isFinite(loadedCampaignLevel) ? Math.trunc(loadedCampaignLevel) : 1;
    this.state.player.campaignCompleted = Array.isArray(data.player?.campaignCompleted) ? data.player.campaignCompleted.filter(n => Number.isInteger(Number(n)) && Number(n) >= 1 && Number(n) <= CAMPAIGN_MISSIONS.length).map(Number) : [];
    this.state.player.campaignLevel = Math.min(CAMPAIGN_MISSIONS.length, Math.max(1, this.state.player.campaignLevel));
    this.state.player.daily = { ...(this.state.player.daily || {}), ...(data.player?.daily || {}) };
    if (!Array.isArray(this.state.player.daily.districtsVisited)) this.state.player.daily.districtsVisited = [];
    const dailyCash = Number(this.state.player.daily.cashEarned);
    this.state.player.daily.cashEarned = Number.isFinite(dailyCash) && dailyCash >= 0 ? dailyCash : 0;
    this.state.player.shop = { owned: ['outfit_city','shoes_city','hair_classic','accessory_none'], equipped: { outfit:'outfit_city', shoes:'shoes_city', hair:'hair_classic', accessory:'accessory_none' }, ...(this.state.player.shop || {}), ...(data.player?.shop || {}), equipped: { ...(this.state.player.shop?.equipped || {}), ...(data.player?.shop?.equipped || {}) } };
    this._rankId = data.player?.rankId || this._rankId || null;
    this.state.player.shop.owned = Array.isArray(this.state.player.shop.owned) ? this.state.player.shop.owned : ['outfit_city','shoes_city','hair_classic','accessory_none'];
    this.state.player.shop.equipped = { outfit:'outfit_city', shoes:'shoes_city', hair:'hair_classic', accessory:'accessory_none', ...(this.state.player.shop.equipped || {}) };
    this._applyShopAppearance();
    this.state.visitedDistricts = Array.isArray(data.visitedDistricts) && data.visitedDistricts.length ? data.visitedDistricts : ['downtown'];
    this.visited = new Set(this.state.visitedDistricts);
    this.economy.money = this.state.player.money;
    this._ensureDailyChallenge();
    this._spawnOwnedVehicles();
    this.enterWorld(true);
    this.persist();
  }

  _savePayload() {
    this.state.player.money = this.economy.money;
    this.state.player.rankId = this._rankId || this.state.player.rankId || null;
    saveLocalRank(this.state);
    this.state.player.level = levelFromXp(this.state.player.xp);
    this.state.garage.vehicles = (this.state.garage.vehicles || []).filter(v => v && v.isOwned && !v.isTestDrive);
    this.state.ownedVehicleIds = this.state.garage.vehicles.map(v => v.vehicleUid);
    return this.state;
  }

  persist() {
    saveGame(this._savePayload());
  }

  _disposeObject3D(root) {
    if (!root) return;
    root.traverse(obj => {
      if (obj.geometry?.dispose) obj.geometry.dispose();
      const materials = Array.isArray(obj.material) ? obj.material : (obj.material ? [obj.material] : []);
      materials.forEach(mat => {
        if (mat?.map?.dispose) mat.map.dispose();
        if (mat?.normalMap?.dispose) mat.normalMap.dispose();
        if (mat?.roughnessMap?.dispose) mat.roughnessMap.dispose();
        if (mat?.metalnessMap?.dispose) mat.metalnessMap.dispose();
        if (mat?.emissiveMap?.dispose) mat.emissiveMap.dispose();
        if (mat?.dispose) mat.dispose();
      });
    });
  }

  _spawnOwnedVehicles() {
    for (const a of this.vehicleActors) { this.scene.remove(a.mesh); this._disposeObject3D(a.mesh); }
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
    if (this.activeActor) {
      this.state.activeVehicleUid = this.activeActor.def.vehicleUid;
      this.state.activeVehicleId = this.activeActor.def.id;
    }
  }

  _placeActiveCarOnStartGrid() {
    if (!this.activeActor?.mesh || !this.activeActor?.ctrl) return false;
    // Main north/south road: x=0. Keep the player in the left free lane.
    // heading=0 means the car travels toward +Z in VehicleController.
    const x = -3.35;
    const z = -120;
    this.activeActor.mesh.position.set(x, this.world.getGroundHeight(x, z) + 0.03, z);
    this.activeActor.mesh.rotation.set(0, 0, 0);
    this.activeActor.ctrl.heading = 0;
    this.activeActor.ctrl.speed = 0;
    this.activeActor.ctrl.velocity.set(0, 0, 0);
    this.activeActor.ctrl.lastPos.copy(this.activeActor.mesh.position);
    this.activeActor.ctrl.steerAngle = 0;
    this.activeActor.ctrl.throttle = 0;
    this.activeActor.ctrl.brake = 0;
    return true;
  }

  previewVehicle(def) {
    if (!def) return;
    this.inMenu = true;
    this.mode = 'driving';
    this.controller = null;
    this.playerMesh.visible = false;
    if (this._menuPreviewMesh) { this.scene.remove(this._menuPreviewMesh); this._disposeObject3D(this._menuPreviewMesh); this._menuPreviewMesh = null; }
    const mesh = createVehicleMesh(def);
    mesh.position.set(0, 0.05, 0);
    mesh.rotation.y = Math.PI;
    this.scene.add(mesh);
    this._menuPreviewMesh = mesh;
    this._menuPreviewDef = def;
    this.camera.position.set(8.5, 3.7, 10.5);
    this.camera.lookAt(0, 1.0, 0);
    this.ui.showGame();
    this.ui.setVehicleSelectionMode(true);
  }

  setStartingCash(amount) {
    if (!this.isNewGameSession) {
      this.ui.toast('Starting cash can only be changed for a NEW GAME');
      return false;
    }
    const value = amount === 50000 ? 50000 : 20000;
    this.state.player.money = value;
    this.economy.money = value;
    if (this.state.player.daily) { this.state.player.daily.startMoney = value; this.state.player.daily.cashEarned = 0; this.state.player.daily.startDistance = this.state.player.distanceDriven || 0; }
    this.persist();
    this.ui.toast(`Starting cash set to ${this.economy.format(value)}`);
    return true;
  }

  driveSelectedVehicle(def) {
    if (!def) return false;
    if (this._menuPreviewMesh) { this.scene.remove(this._menuPreviewMesh); this._menuPreviewMesh = null; }
    const owned = (this.state.garage.vehicles || []).find(v => v && v.isOwned !== false && !v.isTestDrive && (def.vehicleUid ? v.vehicleUid === def.vehicleUid : v.id === def.id));
    if (owned) {
      this.state.activeVehicleUid = owned.vehicleUid;
      this.state.activeVehicleId = owned.id;
      this._spawnOwnedVehicles();
      const actor = this.findActorByUid(owned.vehicleUid);
      if (!actor) return false;
      this.enterVehicle(actor);
      this.persist();
      // Critical: the WOW selection screen can be opened while the game canvas
      // is hidden. Always perform a real world entry here so START LEVEL never
      // leaves the player on a blank screen.
      this.enterWorld(true, { startGrid: true });
      if (this._pendingVehicleColor != null) { this.setVehicleColor(owned, this._pendingVehicleColor, false); this._pendingVehicleColor = null; }
      this.startCampaignMission();
      return true;
    }
    if (!this.buyVehicle(def.id)) return false;
    const bought = (this.state.garage.vehicles || []).find(v => v && v.id === def.id);
    if (!bought) return false;
    this.state.activeVehicleUid = bought.vehicleUid;
    this.state.activeVehicleId = bought.id;
    this._spawnOwnedVehicles();
    const actor = this.findActorByUid(bought.vehicleUid);
    if (!actor) return false;
    this.enterVehicle(actor);
    this.persist();
    this.enterWorld(true, { startGrid: true });
    if (this._pendingVehicleColor != null) { this.setVehicleColor(bought, this._pendingVehicleColor, false); this._pendingVehicleColor = null; }
    this.startCampaignMission();
    return true;
  }

  findActorByUid(uid) {
    return this.vehicleActors.find(a => a.def.vehicleUid === uid && !a.temp) || null;
  }

  enterWorld(startInVehicle = true, options = {}) {
    this.inMenu = false;
    // Never expose the on-foot placeholder on world entry. If vehicles were not spawned yet, create them now.
    if (!this.activeActor) this._spawnOwnedVehicles();
    if (options.startGrid) this._placeActiveCarOnStartGrid();
    this.paused = false;
    // Start directly in the player's owned vehicle so the game opens as a driving game.
    this.mode = this.activeActor ? 'driving' : 'onfoot';
    this.controller = this.mode === 'driving' ? this.activeActor.ctrl : null;
    this.playerMesh.visible = this.mode !== 'driving';
    if (this.mode === 'driving') {
      this.controller.speed = 0;
      this.controller.heading = this.activeActor.mesh.rotation.y;
      this.controller.lastPos.copy(this.activeActor.mesh.position);
      // Snap the camera to the selected car on first entry so no capsule frame is shown.
      const h = this.controller.heading;
      this.camera.position.set(
        this.activeActor.mesh.position.x - Math.sin(h) * 8.5,
        this.activeActor.mesh.position.y + 3.2,
        this.activeActor.mesh.position.z - Math.cos(h) * 8.5
      );
      this.camera.lookAt(this.activeActor.mesh.position.x, this.activeActor.mesh.position.y + 1.1, this.activeActor.mesh.position.z);
    }
    this.ui.showGame();
    this.audio.resume().then(() => this.audio.engineStart()).catch(() => {});
    this.audio.setVolumes(Settings.get('soundVolume'), Settings.get('musicVolume'), Settings.get('musicOn'));
    this.clock.getDelta();
    if (!this.loopRunning) {
      this.loopRunning = true;
      this._loop();
    }
  }

  _loop = () => {
    requestAnimationFrame(this._loop);
    const rawDt = this.clock.getDelta();
    const dt = this.cityDriveSafeDelta(rawDt);
    if (window.CityDrivePerformance) { window.CityDrivePerformance.observe(dt); window.CityDrivePerformance.apply(this.renderer); }
    if (this.inMenu) {
      if (this._menuPreviewMesh) this._menuPreviewMesh.rotation.y += dt * 0.28;
      this.render();
      return;
    }
    if (this.paused) {
      if (this.ui.input.consumePause()) this.ui.togglePause(this);
      this.render();
      return;
    }
    this.update(dt);
    this._updateFollowCarShadow();
    this._shadowTick = (this._shadowTick || 0) + 1;
    // Refresh often enough that the shadow frustum follows the moving car
    // without paying the cost of a shadow-map rebuild every render frame.
    if (false) this.renderer.shadowMap.needsUpdate = true;
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
      if (!this.headlightsOn && this.mode === 'driving' && !this._lightsUserOff) this.toggleHeadlights(false);
    } else if (this.headlightsOn && !this._lightsUserOff && day.t > 7 && day.t < 17) {
      this.toggleHeadlights(false);
    }
    if (this.world.weather === 'rain') this.flags.rain = true;

    if (input.consumeCamera()) {
      this.cameraMode = (this.cameraMode + 1) % 5;
      const labels = ['CHASE', 'CLOSE CHASE', 'LOW', 'HOOD', 'FRONT VIEW'];
      this.ui.toast('CAMERA: ' + labels[this.cameraMode]);
    }
    if (input.consumeHeadlights()) {
      this._lightsUserOff = this.headlightsOn; // if currently on, user is turning off
      this.toggleHeadlights(true);
    }
    if (input.consumeHorn()) this.audio.beep(220, 0.28, 'square', 0.1);
    if (input.consumeEmote()) this.ui.openEmoteWheel(this);
    this._updateEmote(dt);
    if (this.levelCelebration) {
      const elapsed = (performance.now() - this.levelCelebration.started) / 1000;
      this._setPlayerCelebrationPose(elapsed);
      if (elapsed >= this.levelCelebration.duration / 1000) this._finishLevelCelebration();
    }

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
      if (!this.controller.def.isMotorcycle && Number(this.controller.def.topSpeed || 0) >= 220) this.flags.performance = true;
      this.audio.updateEngine(kmh, this.controller.throttle, true, this.controller.def);

      this._missionUpdate(dt);
      this._updateDailyChallenge();
      const interacted = this._poiPrompts(this.controller.mesh.position);
      if (!interacted && input.consumeEnter()) this.exitVehicle();
    } else {
      this._walk(dt, input);
      this.audio.updateEngine(0, 0, false);
      const interacted = this._poiPrompts(this.playerMesh.position);
      if (!interacted && input.consumeEnter()) this._tryEnter();
    }

    if (this.mode !== 'driving') this._updateDailyChallenge();

    const driving = this.mode === 'driving' && this.controller;
    const pos = driving ? this.controller.mesh.position : this.playerMesh.position;
    const spd = driving ? Math.abs(this.controller.speed) : 0;
    const reckless = driving && (spd > 28) && this.controller.handbrake;
    const wanted = this.npc.update(dt, pos, spd, { reckless, busted: false, controller: this.controller, playerMesh: driving ? this.controller.mesh : this.playerMesh });
    if (this.npc.wanted >= 1 && Math.random() < dt * 2) this.audio.sirenTick(true);

    const d = this.world.getDistrict(pos.x, pos.z);
    this.visited.add(d.id);
    this.state.visitedDistricts = [...this.visited];

    this._updateCampaignRivals(dt);

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
        // Legacy multiplayer race AI is retained, but never advances through the
        // final checkpoint before the human player.
        if (bot.cp < this.activeMission.checkpoints.length - 1 && d < 8) bot.cp++;
      }
      this._separateDynamicCars(this._raceAI, this.controller?.mesh, this.controller);
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

    this._updateRouteProgress(dt);
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

  toggleHeadlights(announce = true) {
    this.headlightsOn = !this.headlightsOn;
    if (!this._headlamp) {
      this._headlamp = new THREE.SpotLight(0xfff2cc, 0, 42, Math.PI / 5, 0.45, 1);
      this._headlamp.castShadow = false;
      this.scene.add(this._headlamp);
      this.scene.add(this._headlamp.target);
    }
    this._headlamp.intensity = this.headlightsOn ? 2.0 : 0;
    if (announce) this.ui.toast(this.headlightsOn ? 'Headlights ON' : 'Headlights OFF');
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
    this.inMenu = false;
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
    const nearV = this.mode === 'onfoot' ? this.vehicleActors.find(a => !a.temp && a.mesh.position.distanceTo(this.playerMesh.position) < 6) : null;

    if (nearFuel && this.controller) this.ui.prompt('E — REFUEL + NITRO  ·  R +10L');
    else if (nearGarage) this.ui.prompt('E — GARAGE');
    else if (nearRepair && this.controller) this.ui.prompt('E — REPAIR');
    else if (nearDeal) this.ui.prompt(`E — ${nearDeal.name}`);
    else if (nearJob && this.controller) this.ui.prompt(`E — ${nearJob.name}`);
    else if (nearRace && this.controller) this.ui.prompt(`E — ${nearRace.name}`);
    else if (nearV) this.ui.prompt('E — ENTER VEHICLE');
    else this.ui.prompt('');

    // Only consume E when there is an actual interaction. This preserves E
    // for vehicle exit/vehicle entry when no POI is being used.
    const canInteract = !!(nearFuel && this.controller) || !!nearGarage || !!(nearRepair && this.controller) || !!nearDeal || !!(nearJob && this.controller) || !!(nearRace && this.controller) || !!nearV;
    if (!canInteract || !this.ui.input.consumeEnter()) return false;

    if (nearFuel && this.controller) {
      if (this.ui.input.held.has('KeyR')) this.refuelPartial(10);
      else this._refuel();
      return true;
    }
    if (nearGarage) { this.ui.openGarage(this); return true; }
    if (nearRepair && this.controller) { this._repair(); return true; }
    if (nearDeal) { this.ui.openDealership(this, nearDeal); return true; }
    if (nearJob && this.controller) { this.startJob(nearJob); return true; }
    if (nearRace && this.controller) { this.startRace(nearRace); return true; }
    if (nearV) { this.enterVehicle(nearV); return true; }
    return false;
  }

  refuelVehicle(v, liters = null) {
    if (!v) return false;
    const need = Math.max(0, v.fuelCapacity - (v.currentFuel || 0));
    const add = Math.min(need, liters == null ? need : Math.max(0, liters));
    if (add <= 0.001) { this.ui.toast('FUEL TANK ALREADY FULL'); return false; }
    const cost = Math.max(1, Math.round(add * 2.4));
    if (!this.economy.canAfford(cost)) { this.ui.toast('INSUFFICIENT FUNDS'); return false; }
    this.economy.spend(cost);
    v.currentFuel = Math.min(v.fuelCapacity, (v.currentFuel || 0) + add);
    if (this.controller?.def === v) this.controller.refillNitro();
    this.persist();
    this.ui.toast(`REFUELED ${add.toFixed(1)}L — ${this.economy.format(cost)}`);
    return true;
  }

  _refuel() {
    const v = this.controller.def;
    const cap = Math.max(0, Number(v.fuelCapacity) || 0);
    const current = Math.min(cap, Math.max(0, Number(v.currentFuel) || 0));
    const need = Math.max(0, cap - current);
    const nitroCap = Math.max(0, Number(v.nitroCapacity) || 0) + ((v.upgrades?.nitro || 0) * 15);
    const nitroNeed = Math.max(0, nitroCap - Math.max(0, Number(this.controller.nitroAmount) || 0));
    if (need <= 0.001 && nitroNeed <= 0.001) { this.ui.toast('FUEL & NITRO ALREADY FULL'); return; }
    const fuelCost = Math.round(need * 2.4);
    const nitroCost = Math.round(nitroNeed * 1.8);
    const cost = Math.max(1, fuelCost + nitroCost);
    if (!this.economy.canAfford(cost)) { this.ui.toast('INSUFFICIENT FUNDS'); return; }
    this.economy.spend(cost);
    this.controller.refuel();
    this.controller.refillNitro();
    this.ui.toast(`REFUELED + NITRO — ${this.economy.format(cost)}`);
    this.persist();
  }

  refuelPartial(liters) {
    if (!this.controller) return;
    const v = this.controller.def;
    const cap = Math.max(0, Number(v.fuelCapacity) || 0);
    const current = Math.min(cap, Math.max(0, Number(v.currentFuel) || 0));
    const add = Math.min(Math.max(0, Number(liters) || 0), Math.max(0, cap - current));
    if (add <= 0.001) { this.ui.toast('FUEL TANK ALREADY FULL'); return; }
    const cost = Math.max(1, Math.round(add * 2.4));
    if (!this.economy.canAfford(cost)) { this.ui.toast('INSUFFICIENT FUNDS'); return; }
    this.economy.spend(cost);
    this.controller.refuel(add);
    this.controller.refillNitro();
    this.ui.toast(`PARTIAL REFUEL +${add.toFixed(1)}L + NITRO — ${this.economy.format(cost)}`);
    this.persist();
  }

  _repair() {
    if (!this.controller) return false;
    const v = this.controller.def;
    const dmg = 100 - (v.currentCondition || 100);
    const cost = Math.round(dmg * 18 + 40);
    if (dmg < 1) { this.ui.toast('Vehicle is already in excellent condition'); return false; }
    if (!this.economy.canAfford(cost)) { this.ui.toast('INSUFFICIENT FUNDS'); return false; }
    this.economy.spend(cost);
    this.controller.repair(true);
    this.ui.toast(`Repaired — ${this.economy.format(cost)}`);
    this.persist();
    return true;
  }

  repairVehicle(v) {
    if (!v) return false;
    const dmg = Math.max(0, 100 - Number(v.currentCondition ?? 100));
    if (dmg < 1) { this.ui.toast('Vehicle is already in excellent condition'); return false; }
    const cost = Math.max(40, Math.round(dmg * 18 + 40));
    if (!this.economy.canAfford(cost)) { this.ui.toast('INSUFFICIENT FUNDS'); return false; }
    this.economy.spend(cost);
    v.currentCondition = 100;
    const actor = this.vehicleActors.find(a => a.def === v);
    actor?.ctrl?.repair(true);
    this.ui.toast(`Repaired ${v.name} — ${this.economy.format(cost)}`);
    this.persist();
    return true;
  }

  _buildRoute(start, dest) {
    // ROAD-SAFE GPS: never use diagonal shortcuts through city blocks.
    // Main roads are centered on the 80-unit grid.
    const road = (v) => Math.round(Number(v) / 80) * 80;
    const s = { x: Number(start.x), z: Number(start.z) };
    const d = { x: Number(dest.x), z: Number(dest.z) };
    const sx = road(s.x), sz = road(s.z), dx = road(d.x), dz = road(d.z);
    const clean = (r) => r.filter((p,i,a) => i === 0 || Math.hypot(p.x-a[i-1].x,p.z-a[i-1].z) > 1);
    const a = clean([s,{x:sx,z:s.z},{x:sx,z:sz},{x:dx,z:sz},{x:dx,z:dz},d]);
    const b = clean([s,{x:s.x,z:sz},{x:sx,z:sz},{x:sx,z:dz},{x:dx,z:dz},d]);
    const score = r => r.reduce((n,p,i) => i ? n + Math.abs(p.x-r[i-1].x) + Math.abs(p.z-r[i-1].z) : 0, 0);
    return score(a) <= score(b) ? a : b;
  }

  _setRoute(start, dest, color=0x00d4ff) {
    return this._setRoutePoints(this._buildRoute(start, dest), color);
  }

  _setRoutePoints(points, color=0x00d4ff) {
    this._clearRoute();
    const route = (points || []).map(p => ({x:Number(p.x), z:Number(p.z)})).filter(p => Number.isFinite(p.x) && Number.isFinite(p.z));
    if (route.length < 2) return route;
    this.activeRoute = route;
    const pts = route.map(p => new THREE.Vector3(p.x, 0.13, p.z));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent:true, opacity:.72 }));
    line.renderOrder = 4;
    this.scene.add(line);
    this.routeLine = line;
    return route;
  }

  _clearRoute() {
    if (this.routeLine) { this.routeLine.geometry.dispose(); this.routeLine.material.dispose(); this.scene.remove(this.routeLine); }
    this.routeLine = null;
    this.activeRoute = null;
  }

  _updateRouteProgress(dt = 0) {
    if (!this.routeLine || !this.activeMission || !this.controller) return;
    this._routeProgressTimer += Number(dt) || 0;
    const p = this.controller.mesh.position;
    // Rebuild the route geometry at a modest cadence and only after the car
    // has moved. This removes a per-frame geometry dispose/allocation hotspot.
    const moved = this._routeProgressPos.distanceToSquared(p) > 9;
    if (this._routeProgressTimer < 0.10 && !moved) return;
    this._routeProgressTimer = 0;
    this._routeProgressPos.copy(p);
    const route = this.activeRoute || [];
    if (route.length < 2) return;
    let nearest = 1, best = Infinity;
    for (let i=1;i<route.length;i++) { const d=Math.hypot(route[i].x-p.x,route[i].z-p.z); if(d<best){best=d;nearest=i;} }
    const points = [{x:p.x,z:p.z}, ...route.slice(nearest)];
    this.routeLine.geometry.dispose();
    this.routeLine.geometry = new THREE.BufferGeometry().setFromPoints(points.map(q=>new THREE.Vector3(q.x,.13,q.z)));
  }

  setGPSDestination(dest) {
    if (!dest || !Number.isFinite(Number(dest.x)) || !Number.isFinite(Number(dest.z))) return false;
    const start = this.mode === 'driving' && this.controller?.mesh ? this.controller.mesh.position : this.playerMesh.position;
    const dist = Math.hypot(Number(dest.x) - start.x, Number(dest.z) - start.z) / 100;
    this.activeMission = {
      kind: 'gps',
      type: 'gps',
      name: 'GPS',
      dest: { name: String(dest.name || 'Destination'), x: Number(dest.x), z: Number(dest.z) },
      startDamage: this.controller?.def.currentCondition ?? 100,
      startTime: performance.now(),
      timeLimit: null,
      deadline: null,
      dist
    };
    this._setRoute(start, {x:Number(dest.x), z:Number(dest.z)}, 0x00d4ff);
    this._setMissionWaypoint(Number(dest.x), Number(dest.z), 0x00d4ff);
    this.ui.toast(`GPS SET → ${dest.name || 'Destination'}`);
    this.audio.checkpoint();
    return true;
  }

  _ensureDailyChallenge() {
    const key = getDailyDateKey();
    const challenge = getDailyChallenge();
    const d = this.state.player.daily || {};
    if (d.date !== key || d.challengeId !== challenge.id) {
      const yesterday = new Date(Date.now() - 86400000);
      const yesterdayKey = getDailyDateKey(yesterday);
      const keepStreak = d.lastCompletedDate === yesterdayKey;
      this.state.player.daily = {
        date: key, challengeId: challenge.id, completed: false,
        streak: keepStreak ? Number(d.streak || 0) : (d.lastCompletedDate === key ? Number(d.streak || 0) : 0),
        lastCompletedDate: d.lastCompletedDate || '',
        cashEarned: 0,
        startDistance: Number(this.state.player.distanceDriven || 0),
        startMoney: Number(this.economy?.money ?? this.state.player.money ?? 0),
        districtsVisited: []
      };
    }
  }

  _updateDailyChallenge() {
    this._ensureDailyChallenge();
    const d = this.state.player.daily;
    if (d.completed) return;
    const c = getDailyChallenge();
    const distance = Math.max(0, (this.state.player.distanceDriven || 0) - (d.startDistance || 0));
    const earned = Math.max(0, Number(d.cashEarned || 0));
    if (!Array.isArray(d.districtsVisited)) d.districtsVisited = [];
    const currentDistrict = this.mode === 'driving' && this.controller ? this.world.getDistrict(this.controller.mesh.position.x, this.controller.mesh.position.z)?.id : null;
    if (currentDistrict && !d.districtsVisited.includes(currentDistrict)) d.districtsVisited.push(currentDistrict);
    const districts = d.districtsVisited.length;
    const speed = this.controller ? Math.abs(this.controller.speed) * 3.6 : 0;
    const value = c.id === 'distance' ? distance : c.id === 'cash' ? earned : c.id === 'districts' ? districts : speed;
    if (value < c.target) return;
    d.completed = true;
    d.streak = Number(d.streak || 0) + 1;
    d.lastCompletedDate = d.date;
    const streakBonus = Math.min(2500, d.streak * 250);
    const reward = c.reward + streakBonus;
    this._earn(reward);
    this.state.player.xp += c.xp;
    this.state.player.level = levelFromXp(this.state.player.xp);
    this.audio.success();
    this.ui.toast(`DAILY CHALLENGE COMPLETE! +${this.economy.format(reward)} • ${d.streak} DAY STREAK`);
    this.persist();
  }

  getDailyChallengeStatus() {
    this._ensureDailyChallenge();
    const d = this.state.player.daily;
    const c = getDailyChallenge();
    const distance = Math.max(0, (this.state.player.distanceDriven || 0) - (d.startDistance || 0));
    const earned = Math.max(0, Number(d.cashEarned || 0));
    if (!Array.isArray(d.districtsVisited)) d.districtsVisited = [];
    const currentDistrict = this.mode === 'driving' && this.controller ? this.world.getDistrict(this.controller.mesh.position.x, this.controller.mesh.position.z)?.id : null;
    if (currentDistrict && !d.districtsVisited.includes(currentDistrict)) d.districtsVisited.push(currentDistrict);
    const districts = d.districtsVisited.length;
    const speed = this.controller ? Math.abs(this.controller.speed) * 3.6 : 0;
    const value = c.id === 'distance' ? distance : c.id === 'cash' ? earned : c.id === 'districts' ? districts : speed;
    return { ...c, value, completed: !!d.completed, streak: Number(d.streak || 0) };
  }

  getCampaignMission() {
    return getCampaignMission(this.state.player.campaignLevel || 1);
  }

  _campaignTimeLimit(type) {
    // Generous but meaningful campaign timer. The clock starts when the level
    // begins and is shared across pickup/delivery stages.
    if (type === 'race') return 150;
    if (type === 'job') return 210;
    return 180;
  }

  _failCampaignMissionByTimeout() {
    const m = this.activeMission;
    if (!m?.campaign) return;
    const level = Number(m.campaign.level || this.state.player.campaignLevel || 1);
    this.activeMission = null;
    this._clearMissionWaypoint();
    this._clearRoute();
    this._clearRaceMarkers();
    this._clearRaceAI();
    this._clearCampaignRivals();
    this.persist();
    this.ui.toast(`TIME UP — LEVEL ${level} FAILED. START LEVEL ${level} AGAIN.`);
  }

  startCampaignMission() {
    const m = this.getCampaignMission();
    if (!m || this.mode !== 'driving' || !this.controller) return false;
    if (this.activeMission) {
      if (this.activeMission.campaign?.level === m.level) return true;
      this.ui.toast('FINISH THE CURRENT MISSION FIRST');
      return false;
    }
    if ((this.state.player.campaignCompleted || []).includes(m.level)) {
      this.ui.toast('CAMPAIGN COMPLETE — ALL 20 LEVELS FINISHED');
      return false;
    }
    this._clearRoute();
    if (m.type === 'drive') {
      const dest = getCampaignDestination(m.level);
      if (!dest) { this.ui.toast('MISSION DESTINATION UNAVAILABLE'); return false; }
      const p = this.controller.mesh.position;
      this.activeMission = { kind: 'campaign', campaignType: 'drive', campaign: m, name: `LEVEL ${m.level} — ${m.title}`, dest, startTime: performance.now(), timeLimit: this._campaignTimeLimit(m.type), deadline: performance.now() + this._campaignTimeLimit(m.type) * 1000, dist: Math.hypot(dest.x - p.x, dest.z - p.z) / 100 };
      this._setRoute(p, dest, getCampaignColor(m.level));
      this._setMissionWaypoint(dest.x, dest.z, getCampaignColor(m.level));
    } else if (m.type === 'job') {
      const job = POIS.jobs.find(j => j.type === m.job);
      if (!job) return false;
      return this.startJob(job, { campaign: m });
    } else if (m.type === 'race') {
      const race = POIS.races.find(r => r.id === m.race);
      if (!race) return false;
      return this.startRace(race, { campaign: m });
    } else {
      // Upgrade/buy levels use the exact physical service location as their
      // navigation target. Completion is still validated against that location
      // inside upgradeVehicle()/buyVehicle().
      const objectiveDest = getCampaignDestination(m.level);
      this.activeMission = {
        kind: 'campaign',
        campaignType: m.type,
        campaign: m,
        name: `LEVEL ${m.level} — ${m.title}`,
        dest: objectiveDest ? { name: objectiveDest.name, x: objectiveDest.x, z: objectiveDest.z } : null,
        startTime: performance.now(),
        timeLimit: this._campaignTimeLimit(m.type),
        deadline: performance.now() + this._campaignTimeLimit(m.type) * 1000
      };
      if (objectiveDest) {
        const p = this.controller.mesh.position;
        this._setRoute(p, objectiveDest, getCampaignColor(m.level));
        this._setMissionWaypoint(objectiveDest.x, objectiveDest.z, getCampaignColor(m.level));
      }
    }
    this._spawnCampaignRivals();
    this.ui.toast(`LEVEL ${m.level}: ${m.objective}`);
    this.audio.checkpoint();
    return true;
  }

  _earn(amount) {
    const value = Math.max(0, Math.round(Number(amount) || 0));
    if (!value) return 0;
    this.economy.earn(value);
    const d = this.state.player.daily;
    if (d && !d.completed) d.cashEarned = Math.max(0, Number(d.cashEarned || 0)) + value;
    return value;
  }

  _completeCampaignMission() {
    const m = this.getCampaignMission();
    if (!m || this.activeMission?.campaign?.level !== m.level) return;
    if ((this.state.player.campaignCompleted || []).includes(m.level)) {
      this.activeMission = null;
      this._clearMissionWaypoint();
      this._clearRoute();
      return;
    }
    if (!Array.isArray(this.state.player.campaignCompleted)) this.state.player.campaignCompleted = [];
    if (!this.state.player.campaignCompleted.includes(m.level)) this.state.player.campaignCompleted.push(m.level);
    // Campaign progression is sequential and authoritative: completing Level N
    // immediately unlocks Level N+1, independent of the player's XP/rank level.
    const unlocked = this.state.player.campaignCompleted.reduce((max, n) => {
      const level = Number(n);
      return Number.isInteger(level) && level === max + 1 ? level + 1 : max;
    }, 1);
    const nextUnlocked = Math.min(CAMPAIGN_MISSIONS.length, Math.max(1, unlocked));
    this.state.player.campaignLevel = Math.max(this.state.player.campaignLevel || 1, nextUnlocked);
    this.state.player.missionsCompleted++;
    this._earn(m.reward);
    this.state.player.xp += m.xp;
    this.state.player.level = levelFromXp(this.state.player.xp);
    const next = getCampaignMission(m.level + 1);
    this.activeMission = null;
    this._clearMissionWaypoint();
    this._clearRoute();
    this._clearCampaignRivals();
    this.audio.success();
    if (next) {
      this.state.player.campaignLevel = next.level;
      this.ui.toast(`LEVEL ${m.level} COMPLETE! LEVEL ${next.level} UNLOCKED! +${this.economy.format(m.reward)} +${m.xp} XP`);
      this.persist();
      this._startLevelCompleteCelebration(m.level, next.level);
    } else {
      this.state.player.campaignLevel = m.level;
      this.ui.toast(`CAMPAIGN COMPLETE! +${this.economy.format(m.reward)} +${m.xp} XP`);
    }
    this.persist();
  }

  _startLevelCompleteCelebration(completedLevel, nextLevel) {
    // Automatic level-finish emote: the driver steps out of the winning car,
    // raises both hands in celebration, then returns to the car and launches
    // the newly unlocked level. This is deliberately non-interactive so it
    // cannot break campaign progression.
    if (!this.controller?.mesh) return;
    const car = this.controller.mesh;
    const ctrl = this.controller;
    const side = car.rotation.y + Math.PI / 2;
    this.playerMesh.position.copy(car.position);
    this.playerMesh.position.x += Math.sin(side) * 2.6;
    this.playerMesh.position.z += Math.cos(side) * 2.6;
    this.playerMesh.position.y = 0;
    this.playerMesh.rotation.y = car.rotation.y;
    this.playerMesh.visible = true;
    this.mode = 'onfoot';
    this.controller = null;
    this.levelCelebration = {
      car,
      ctrl,
      completedLevel,
      nextLevel,
      started: performance.now(),
      duration: 4200,
      phase: 'celebrating'
    };
    this._setPlayerCelebrationPose(0);
    this.triggerEmote('LEVEL COMPLETE!', '🎉');
    this.ui.toast(`LEVEL ${completedLevel} COMPLETE — DRIVER CELEBRATION!`);
  }

  _setPlayerCelebrationPose(t) {
    const leftArm = this.playerMesh.getObjectByName('david_arm_L');
    const rightArm = this.playerMesh.getObjectByName('david_arm_R');
    const leftHand = this.playerMesh.getObjectByName('david_hand_L');
    const rightHand = this.playerMesh.getObjectByName('david_hand_R');
    if (!leftArm || !rightArm) return;
    const wave = Math.sin(t * 10) * 0.12;
    leftArm.rotation.z = -0.95 - wave;
    rightArm.rotation.z = 0.95 + wave;
    leftArm.rotation.x = Math.sin(t * 6) * 0.08;
    rightArm.rotation.x = -Math.sin(t * 6) * 0.08;
    if (leftHand) leftHand.rotation.z = -0.25;
    if (rightHand) rightHand.rotation.z = 0.25;
    this.playerMesh.position.y = Math.max(0, Math.sin(t * 5.2) * 0.08);
  }

  _finishLevelCelebration() {
    const c = this.levelCelebration;
    if (!c) return;
    const car = c.car;
    const ctrl = c.ctrl;
    this.levelCelebration = null;
    // Restore normal player pose before hiding the on-foot avatar.
    const leftArm = this.playerMesh.getObjectByName('david_arm_L');
    const rightArm = this.playerMesh.getObjectByName('david_arm_R');
    if (leftArm) { leftArm.rotation.set(0, 0, 0.08); }
    if (rightArm) { rightArm.rotation.set(0, 0, -0.08); }
    this.playerMesh.position.y = 0;
    this.playerMesh.visible = false;
    this.mode = 'driving';
    this.activeActor = this.findActorByUid(this.state.activeVehicleUid) || this.activeActor;
    this.controller = ctrl || this.activeActor?.ctrl || null;
    if (this.controller && this.activeActor) {
      this.controller.speed = 0;
      this.controller.brake = 0;
      this.controller.throttle = 0;
      this.controller.lastPos.copy(car.position);
      this.cameraMode = 0;
      this.camera.position.set(
        car.position.x - Math.sin(car.rotation.y) * 8.5,
        car.position.y + 3.2,
        car.position.z - Math.cos(car.rotation.y) * 8.5
      );
      this.camera.lookAt(car.position.x, car.position.y + 1.1, car.position.z);
    }
    if (c.nextLevel && this.mode === 'driving' && this.controller) {
      setTimeout(() => {
        if (!this.levelCelebration && this.mode === 'driving' && this.controller) this.startCampaignMission();
      }, 350);
    }
  }

  startJob(job, opts = {}) {
    if (!job || this.mode !== 'driving' || !this.controller) { this.ui.toast('You must be driving to start a job'); return false; }
    if (this.activeMission) {
      this.ui.toast(opts.campaign ? 'CAMPAIGN MISSION ALREADY ACTIVE' : 'FINISH THE CURRENT MISSION FIRST');
      return false;
    }
    const stages = opts.campaign ? getCampaignJobStages(opts.campaign.level) : null;
    const dest = stages?.pickup || (opts.campaign ? getCampaignDestination(opts.campaign.level) : LANDMARKS[Math.floor(Math.random() * LANDMARKS.length)]);
    if (!dest) { this.ui.toast('MISSION DESTINATION UNAVAILABLE'); return false; }
    const start = this.mode === 'driving' ? this.controller.mesh.position : this.playerMesh.position;
    const dist = Math.hypot(dest.x - start.x, dest.z - start.z) / 100;
    this.activeMission = {
      kind: opts.campaign ? 'campaign' : 'job',
      campaignType: opts.campaign ? 'job' : null,
      campaign: opts.campaign || null,
      type: job.type,
      name: opts.campaign ? `LEVEL ${opts.campaign.level} — ${opts.campaign.title}` : job.name,
      dest,
      stages,
      stage: stages ? 0 : null,
      startDamage: this.controller?.def.currentCondition ?? 100,
      startTime: performance.now(),
      timeLimit: opts.campaign ? this._campaignTimeLimit('job') : null,
      deadline: opts.campaign ? performance.now() + this._campaignTimeLimit('job') * 1000 : null,
      dist
    };
    this._setRoute(this.controller.mesh.position, dest, opts.campaign ? getCampaignColor(opts.campaign.level) : 0xffcc33);
    this._setMissionWaypoint(dest.x, dest.z, opts.campaign ? getCampaignColor(opts.campaign.level) : 0xffcc33);
    if (opts.campaign) this._spawnCampaignRivals();
    this.ui.toast(`MISSION STARTED → ${dest.name}`);
    this.audio.checkpoint();
    return true;
  }

  startRace(race, opts = {}) {
    if (!race || this.mode !== 'driving' || !this.controller) { this.ui.toast('You must be driving to start a race'); return false; }
    if (this.activeMission) {
      this.ui.toast(opts.campaign ? 'CAMPAIGN RACE ALREADY ACTIVE' : 'FINISH THE CURRENT MISSION FIRST');
      return false;
    }
    if (opts.campaign?.race === 'bike') { this.ui.toast('This race has been upgraded to a four-wheel performance race'); return false; }
    this._clearRaceAI();
    this._clearRaceMarkers();
    this._clearMissionWaypoint();
    const checkpoints = opts.checkpoints || (opts.campaign ? (getCampaignRaceCheckpoints(opts.campaign.level) || []) : []);
    if (!checkpoints.length) {
      for (let i = 0; i < 5; i++) {
        checkpoints.push({
          x: race.x + Math.sin(i * 1.2) * (40 + i * 15),
          z: race.z + Math.cos(i * 1.2) * (40 + i * 15)
        });
      }
    }
    this._spawnRaceMarkers(checkpoints);
    this._setMissionWaypoint(checkpoints[0].x, checkpoints[0].z, opts.campaign ? getCampaignColor(opts.campaign.level) : 0x00ff9d);
    this.activeMission = {
      kind: 'race',
      type: race.id,
      name: race.name,
      checkpoints,
      index: 0,
      startTime: performance.now(),
      timeLimit: opts.campaign ? this._campaignTimeLimit('race') : null,
      deadline: opts.campaign ? performance.now() + this._campaignTimeLimit('race') * 1000 : null,
      multiplayer: !!opts.multiplayer || this.mp.active,
      campaign: opts.campaign || null,
      dest: checkpoints[0] ? { name: 'CHECKPOINT 1', x: checkpoints[0].x, z: checkpoints[0].z } : null
    };
    this._setRoutePoints([this.controller.mesh.position, ...checkpoints], opts.campaign ? getCampaignColor(opts.campaign.level) : 0x00ff9d);
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
        if (this.activeMission?.campaign) this._spawnCampaignRivals();
        else this._spawnRaceAI(this.activeMission.checkpoints);
      }
    };
    setTimeout(tick, 700);
    this.ui.toast(`${race.name} — get ready`);
    return true;
  }

  _setMissionWaypoint(x, z, color=0xffcc33) {
    this._clearMissionWaypoint();
    this.destinationTrackerColor = color;
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.22, 10, 32), new THREE.MeshBasicMaterial({color}));
    ring.rotation.x = Math.PI/2; ring.position.y = 0.25; g.add(ring);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.55, 8, 12), new THREE.MeshBasicMaterial({color, transparent:true, opacity:.28}));
    beam.position.y = 4; g.add(beam);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(.55, 16, 10), new THREE.MeshBasicMaterial({color}));
    beacon.position.y = 8; g.add(beacon);
    g.position.set(x,0,z); this.scene.add(g); this.missionWaypoint = g;
    this.destinationTracker = { x:Number(x), z:Number(z), color };
  }

  _clearMissionWaypoint() {
    if (this.missionWaypoint) this.scene.remove(this.missionWaypoint);
    this.missionWaypoint = null;
    this.destinationTracker = null;
  }

    _spawnCampaignRivals() {
    this._clearCampaignRivals();
    const m = this.activeMission;
    if (!m?.campaign || !this.controller) return;

    // Three fictional rival drivers. They are intentionally not tied to the
    // player's vehicle inventory and never award/receive mission completion.
    const ids = ['urban_lx', 'falcon_sport', 'city_explorer'];
    const names = ['Alex', 'Jordan', 'Riley'];
    let route = [];
    if (m.kind === 'race' && Array.isArray(m.checkpoints)) {
      route = [{ x: this.controller.mesh.position.x, z: this.controller.mesh.position.z }, ...m.checkpoints];
    } else if (m.dest) {
      route = this.activeRoute?.length ? this.activeRoute.map(q => ({ x: q.x, z: q.z })) : [
        { x: this.controller.mesh.position.x, z: this.controller.mesh.position.z },
        { x: m.dest.x, z: m.dest.z }
      ];
    } else {
      // Objective missions without a driving destination still have a visible
      // parallel contest: upgrades race to the garage, while vehicle purchases
      // race to the marketplace. They stop short of the objective.
      const objective = m.campaignType === 'buy'
        ? getCampaignDestination(m.campaign?.level || 1)
        : getCampaignDestination(m.campaign?.level || 1);
      const target = objective || { x: 40, z: -60 };
      route = [
        { x: this.controller.mesh.position.x, z: this.controller.mesh.position.z },
        { x: target.x, z: target.z }
      ];
    }
    if (route.length < 2) return;

    this._campaignRivals = ids.map((id, i) => {
      const def = cloneVehicle(getVehicleById(id));
      def.isOwned = false;
      const mesh = createVehicleMesh(def);
      const start = route[0];
      const lateral = (i - 1) * 6;
      mesh.position.set(start.x + lateral, 0, start.z + 9 + i * 3);
      mesh.rotation.y = this.controller.mesh.rotation.y;
      this.scene.add(mesh);

      const tag = new THREE.Group();
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.7, 0.12, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xff3b5c, transparent: true, opacity: 0.75 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.15;
      tag.add(ring);
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0xff3b5c })
      );
      beacon.position.y = 2.7;
      tag.add(beacon);
      mesh.add(tag);

      return {
        mesh,
        def,
        name: names[i],
        route,
        segment: 1,
        speed: 13.5 + i * 2.2,
        progress: 0,
        finished: false
      };
    });

    this.ui.toast('3 RIVALS ENTERED THE MISSION — BEAT THEM TO THE FINISH!');
  }

  _separateDynamicCars(cars, playerMesh = null, playerController = null) {
    const radiusOf = (def) => 2.45;
    for (let i = 0; i < cars.length; i++) {
      const a = cars[i];
      if (!a?.mesh) continue;
      const ra = radiusOf(a.def);
      for (let j = i + 1; j < cars.length; j++) {
        const b = cars[j];
        if (!b?.mesh) continue;
        const rb = radiusOf(b.def);
        const dx = b.mesh.position.x - a.mesh.position.x;
        const dz = b.mesh.position.z - a.mesh.position.z;
        const min = ra + rb;
        const d = Math.hypot(dx, dz);
        if (d >= min) continue;
        const nx = dx / (d || 0.001), nz = dz / (d || 0.001);
        const overlap = min - d;
        a.mesh.position.x -= nx * overlap * 0.5;
        a.mesh.position.z -= nz * overlap * 0.5;
        b.mesh.position.x += nx * overlap * 0.5;
        b.mesh.position.z += nz * overlap * 0.5;
        if ('speed' in a) a.speed *= 0.25;
        if ('speed' in b) b.speed *= 0.25;
      }
      if (playerMesh) {
        const rp = radiusOf(playerController?.def);
        const dx = playerMesh.position.x - a.mesh.position.x;
        const dz = playerMesh.position.z - a.mesh.position.z;
        const min = ra + rp;
        const d = Math.hypot(dx, dz);
        if (d < min) {
          const nx = dx / (d || 0.001), nz = dz / (d || 0.001);
          const overlap = min - d;
          a.mesh.position.x -= nx * overlap * 0.55;
          a.mesh.position.z -= nz * overlap * 0.55;
          playerMesh.position.x += nx * overlap * 0.45;
          playerMesh.position.z += nz * overlap * 0.45;
          if ('speed' in a) a.speed = Math.min(a.speed, 1.5);
          if (playerController) { playerController.speed *= 0.2; playerController.lastPos.copy(playerMesh.position); }
        }
      }
    }
  }

  _updateCampaignRivals(dt) {
    const m = this.activeMission;
    if (!m?.campaign || !this._campaignRivals.length) return;
    for (const rival of this._campaignRivals) {
      if (rival.finished || !rival.route?.length) continue;
      const targetIndex = Math.min(rival.segment, rival.route.length - 1);
      const target = rival.route[targetIndex];
      if (!target) continue;
      const final = targetIndex >= rival.route.length - 1;
      const dx = target.x - rival.mesh.position.x;
      const dz = target.z - rival.mesh.position.z;
      const d = Math.hypot(dx, dz);

      // Always leave a clear buffer before the final destination/checkpoint.
      // Rivals can look competitive but can never cross the player's finish line.
      const finishBuffer = m.kind === 'race' ? 18 : 14;
      if (final && d <= finishBuffer) {
        rival.finished = true;
        rival.progress = Math.min(92, Math.max(rival.progress, 92));
        continue;
      }
      const step = Math.min(d, rival.speed * dt);
      if (d > 0.001) {
        rival.mesh.position.x += (dx / d) * step;
        rival.mesh.position.z += (dz / d) * step;
        rival.mesh.rotation.y = Math.atan2(dx / d, dz / d);
      }
      if (d <= 7 && !final) rival.segment++;
      const totalSegments = Math.max(1, rival.route.length - 1);
      rival.progress = Math.min(92, ((Math.max(0, rival.segment - 1) + (1 - Math.min(1, d / 100))) / totalSegments) * 100);
    }
    this._separateDynamicCars(this._campaignRivals, this.controller?.mesh, this.controller);
  }

  _clearCampaignRivals() {
    (this._campaignRivals || []).forEach(r => { this.scene.remove(r.mesh); this._disposeObject3D(r.mesh); });
    this._campaignRivals = [];
    this.emoteState = { name: '', emoji: '', until: 0, pulse: 0 };
    this._emoteBubble = null;
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
      const marker = new THREE.Group();
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.5, 4), new THREE.MeshBasicMaterial({color: 0xff3344, transparent: true, opacity: 0.95}));
      arrow.rotation.z = Math.PI / 2; arrow.position.y = 2.7; marker.add(arrow);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.12, 8, 24), new THREE.MeshBasicMaterial({color: 0xff3344, transparent: true, opacity: 0.7}));
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.15; marker.add(ring);
      mesh.add(marker);
      return { mesh, def, cp: 0, speed: 16 + i * 3, marker };
    });
  }

  _clearRaceAI() {
    (this._raceAI || []).forEach(r => { this.scene.remove(r.mesh); this._disposeObject3D(r.mesh); });
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
    if (this.activeMission.campaign && this.activeMission.deadline && performance.now() >= this.activeMission.deadline) {
      this._failCampaignMissionByTimeout();
      return;
    }
    const p = this.controller.mesh.position;
    if (this.activeMission.kind === 'campaign' && this.activeMission.campaignType === 'drive') {
      const d = Math.hypot(p.x - this.activeMission.dest.x, p.z - this.activeMission.dest.z);
      if (d < 10 && !this.activeMission.paid) { this.activeMission.paid = true; this._completeCampaignMission(); }
    } else if (this.activeMission.kind === 'campaign' && this.activeMission.campaignType === 'upgrade') {
      // Completion is triggered by upgradeVehicle().
    } else if (this.activeMission.kind === 'campaign' && this.activeMission.campaignType === 'buy') {
      // Completion is triggered by buying a vehicle.
    } else if (this.activeMission.kind === 'campaign' && this.activeMission.campaignType === 'job') {
      const m = this.activeMission;
      const d = Math.hypot(p.x - m.dest.x, p.z - m.dest.z);
      if (d < 10 && !m.paid) {
        if (m.stages && m.stage === 0) {
          m.stage = 1;
          m.dest = { ...m.stages.dropoff };
          m.dist += Math.hypot(m.stages.dropoff.x - m.stages.pickup.x, m.stages.dropoff.z - m.stages.pickup.z) / 100;
          const color = getCampaignColor(m.campaign.level);
          this._setMissionWaypoint(m.dest.x, m.dest.z, color);
          this._setRoute(p, m.dest, color);
          // Carry campaign rivals into the delivery stage instead of leaving
          // them parked at the pickup point.
          for (const rival of this._campaignRivals || []) {
            rival.route = [
              { x: rival.mesh.position.x, z: rival.mesh.position.z },
              { x: m.dest.x, z: m.dest.z }
            ];
            rival.segment = 1;
            rival.finished = false;
            rival.progress = Math.min(45, Number(rival.progress) || 0);
          }
          this.audio.checkpoint();
          this.ui.toast(`PICKUP COMPLETE → NOW DELIVER TO ${m.dest.name}`);
        } else {
          this._completeJob();
        }
      }
    } else if (this.activeMission.kind === 'job') {
      const d = Math.hypot(p.x - this.activeMission.dest.x, p.z - this.activeMission.dest.z);
      if (d < 10 && !this.activeMission.paid) this._completeJob();
    } else if (this.activeMission.kind === 'gps') {
      const d = Math.hypot(p.x - this.activeMission.dest.x, p.z - this.activeMission.dest.z);
      if (d < 10 && !this.activeMission.paid) {
        this.activeMission.paid = true;
        const destinationName = this.activeMission.dest.name;
        this._clearMissionWaypoint();
        this._clearRoute();
        this.activeMission = null;
        this.audio.success();
        this.ui.toast(`Arrived at ${destinationName}`);
      }
    } else if (this.activeMission.kind === 'race') {
      const cp = this.activeMission.checkpoints[this.activeMission.index];
      if (cp && Math.hypot(p.x - cp.x, p.z - cp.z) < 10) {
        this.activeMission.index++;
        this.audio.checkpoint();
        const next = this.activeMission.checkpoints[this.activeMission.index];
        if (next) {
          const raceColor = this.activeMission?.campaign ? getCampaignColor(this.activeMission.campaign.level) : 0x00ff9d;
          this.activeMission.dest = { name: `CHECKPOINT ${this.activeMission.index + 1}`, x: next.x, z: next.z };
          this._setMissionWaypoint(next.x, next.z, raceColor);
          this._setRoute(p, next, raceColor);
        } else {
          this.activeMission.dest = null;
        }
        const markers = this._raceMarkers || [];
        const raceColor = this.activeMission?.campaign ? getCampaignColor(this.activeMission.campaign.level) : 0x00ff9d;
        if (markers[this.activeMission.index - 1]) markers[this.activeMission.index - 1].material.color.setHex(0x335544);
        if (markers[this.activeMission.index]) markers[this.activeMission.index].material.color.setHex(raceColor);
        if (this.activeMission.index >= this.activeMission.checkpoints.length && !this.activeMission.paid) this._completeRace();
      }
    }
  }

  _completeJob() {
    const m = this.activeMission;
    if (!m || m.paid) return;
    if (m.kind === 'campaign' && m.campaign) {
      m.paid = true;
      this._completeCampaignMission();
      return;
    }
    m.paid = true;
    const condNow = this.controller?.def.currentCondition ?? 100;
    const clean = condNow >= m.startDamage - 1;
    if (clean) this.flags.cleanJob = true;
    if (m.type === 'offroad') this.flags.offroadJob = true;
    const pay = calculateJobPayout(m.type, m.dist, 1.1, clean ? 1.15 : 0.85, 1);
    const xp = 25 + Math.round(m.dist * 8);
    this._earn(pay);
    this.state.player.xp += xp;
    this.state.player.jobsCompleted++;
    this.state.player.level = levelFromXp(this.state.player.xp);
    this.activeMission = null;
    this._clearMissionWaypoint();
    this._clearRoute();
    this.audio.success();
    this.ui.toast(`Job complete +${this.economy.format(pay)}  +${xp} XP`);
    this.persist();
  }

  _completeRace() {
    if (!this.activeMission || this.activeMission.paid) return;
    if (this.activeMission.campaign) {
      this.activeMission.paid = true;
      this._clearRaceMarkers();
      this._clearRaceAI();
      this._clearCampaignRivals();
      this._completeCampaignMission();
      return;
    }
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
    this._earn(pay);
    this.state.player.xp += xp;
    if (win) this.state.player.racesWon++;
    this.state.player.level = levelFromXp(this.state.player.xp);
    this.activeMission = null;
    this._clearMissionWaypoint();
    this._clearRoute();
    this._clearRaceMarkers();
    this._clearRaceAI();
    this._clearCampaignRivals();
    this.audio.success();
    this.ui.toast(mp
      ? `P${place}  ${elapsed.toFixed(1)}s  +${this.economy.format(pay)}`
      : `${win ? 'Race won' : 'Race finished'} +${this.economy.format(pay)}`);
    this.persist();
  }

  _applyShopAppearance() {
    const eq = this.state.player.shop?.equipped || {};
    const outfit = getShopItem(eq.outfit)?.style || { shirt: 0x244a7a, trousers: 0x202634 };
    const shoes = getShopItem(eq.shoes)?.style?.color || 0x151515;
    const hair = getShopItem(eq.hair)?.style?.color || 0x17120f;
    if (!this.playerMesh) return;
    const shirt = this.playerMesh.getObjectByName('david_shirt');
    const trousers = this.playerMesh.getObjectByName('david_trousers');
    const shoeMeshes = this.playerMesh.children.filter(x => x.name === 'david_shoe');
    const hairMesh = this.playerMesh.getObjectByName('david_hair');
    const chain = this.playerMesh.getObjectByName('david_accessory_chain');
    const shades = this.playerMesh.getObjectByName('david_accessory_shades');
    if (shirt?.material?.color) shirt.material.color.setHex(outfit.shirt);
    if (trousers?.material?.color) trousers.material.color.setHex(outfit.trousers);
    shoeMeshes.forEach(x => x.material?.color?.setHex(shoes));
    if (hairMesh?.material?.color) hairMesh.material.color.setHex(hair);
    if (chain) chain.visible = eq.accessory === 'accessory_gold';
    if (shades) shades.visible = eq.accessory === 'accessory_shades';
  }

  buyShopItem(id) {
    const item = getShopItem(id);
    if (!item) return false;
    const shop = this.state.player.shop || (this.state.player.shop = { owned: [], equipped: {} });
    if (!Array.isArray(shop.owned)) shop.owned = [];
    if (shop.owned.includes(id)) return this.equipShopItem(id);
    if (!this.economy.canAfford(item.price)) { this.ui.toast('INSUFFICIENT FUNDS'); return false; }
    this.economy.spend(item.price);
    shop.owned.push(id);
    this.flags.shopPurchase = true;
    this.equipShopItem(id, true);
    this.ui.toast(`${item.name} purchased & equipped`);
    this.persist();
    return true;
  }

  equipShopItem(id, silent = false) {
    const item = getShopItem(id);
    const shop = this.state.player.shop || (this.state.player.shop = { owned: [], equipped: {} });
    if (!Array.isArray(shop.owned) || !shop.owned.includes(id)) return false;
    shop.equipped[item.slot] = id;
    this._applyShopAppearance();
    if (!silent) { this.ui.toast(`${item.name} equipped`); this.persist(); }
    return true;
  }

  buyVehicle(id) {
    const base = getVehicleById(id);
    if (!base) return false;
    // Campaign Level 8 must actually be completed at the Marketplace.
    // Opening the marketplace UI from anywhere must not silently complete the mission.
    if (this.activeMission?.kind === 'campaign' && this.activeMission.campaignType === 'buy') {
      const p = this.controller?.mesh?.position;
      const market = LANDMARKS.find(x => x.id === 'market');
      if (!p || !market || Math.hypot(p.x - market.x, p.z - market.z) > 18) {
        this.ui.toast('DRIVE TO THE VEHICLE MARKETPLACE FIRST');
        return false;
      }
    }
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
    if (this.activeMission?.kind === 'campaign' && this.activeMission.campaignType === 'buy') {
      this._completeCampaignMission();
    } else {
      this.persist();
    }
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
    // Campaign Level 3 is a garage visit + upgrade. Require the player to be
    // physically at the Main Garage before the upgrade can complete the level.
    if (this.activeMission?.kind === 'campaign' && this.activeMission.campaignType === 'upgrade') {
      const p = this.controller?.mesh?.position;
      const garage = LANDMARKS.find(x => x.id === 'garage');
      if (!p || !garage || Math.hypot(p.x - garage.x, p.z - garage.z) > 18) {
        this.ui.toast('DRIVE TO THE MAIN GARAGE FIRST');
        return;
      }
    }
    if (v.upgrades[part] >= 5) { this.ui.toast('Max upgrade'); return; }
    const cost = 400 + v.upgrades[part] * 350 + Math.round(v.price * 0.02);
    if (!this.economy.canAfford(cost)) { this.ui.toast('INSUFFICIENT FUNDS'); return; }
    this.economy.spend(cost);
    v.upgrades[part]++;
    if (part === 'fuelSystem') v.fuelConsumption *= 0.94;
    this.flags.upgraded = true;
    this.ui.toast(`${part} upgraded to ${v.upgrades[part]}`);
    if (this.activeMission?.kind === 'campaign' && this.activeMission.campaignType === 'upgrade') this._completeCampaignMission();
    else this.persist();
  }

  setVehicleColor(v, color, charge = false) {
    if (!v) return false;
    const hex = Number(color) >>> 0;
    if (!hex) return false;
    if (charge) {
      const cost = 250;
      if (!this.economy.canAfford(cost)) { this.ui.toast('INSUFFICIENT FUNDS'); return false; }
      this.economy.spend(cost);
    }
    v.customization = v.customization || {};
    v.customization.primaryColor = hex;
    v.customization.colorCustomized = true;
    v.color = hex;
    const actor = this.vehicleActors.find(a => a.def === v);
    if (actor?.mesh) {
      actor.mesh.traverse(ch => {
        if (ch.isMesh && ch.material?.color && ch.userData?.paintable) ch.material.color.setHex(hex);
      });
    }
    this.persist();
    if (charge) this.ui.toast('Paint applied');
    return true;
  }

  paintVehicle(v, color) {
    return this.setVehicleColor(v, color, true);
  }

  expandGarage() {
    const cap = Number(this.state.garage.capacity || 8);
    const next = cap < 12 ? 12 : cap < 20 ? 20 : cap < 30 ? 30 : null;
    const cost = next === 12 ? 12000 : next === 20 ? 30000 : 65000;
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

  triggerEmote(name, emoji) {
    if (this.inMenu || this.paused) return;
    this.emoteState = { name: String(name || 'Wave'), emoji: String(emoji || '👋'), until: performance.now() + 2200, pulse: 0 };
    const target = this.mode === 'driving' && this.controller ? this.controller.mesh : this.playerMesh;
    if (!target) return;
    if (!this._emoteBubble) {
      const el = document.createElement('div');
      el.id = 'city-drive-emote-bubble';
      el.innerHTML = '<span class="emote-bubble-icon"></span><span class="emote-bubble-label"></span>';
      document.body.appendChild(el);
      this._emoteBubble = el;
    }
    this._emoteBubble.querySelector('.emote-bubble-icon').textContent = this.emoteState.emoji;
    this._emoteBubble.querySelector('.emote-bubble-label').textContent = this.emoteState.name.toUpperCase();
    this._emoteBubble.classList.add('show');
    if (this.audio?.beep) this.audio.beep(620, 0.08, 'sine', 0.035);
  }

  _updateEmote(dt) {
    const now = performance.now();
    const active = this.emoteState.until > now;
    const bubble = this._emoteBubble;
    if (!active) {
      if (bubble) bubble.classList.remove('show');
      return;
    }
    this.emoteState.pulse += dt * 8;
    const target = this.mode === 'driving' && this.controller ? this.controller.mesh : this.playerMesh;
    if (!target || !bubble) return;
    const p = target.position.clone();
    p.y += this.mode === 'driving' ? 2.8 : 2.25;
    p.project(this.camera);
    const x = (p.x * .5 + .5) * innerWidth;
    const y = (-p.y * .5 + .5) * innerHeight;
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
    const scale = 1 + Math.sin(this.emoteState.pulse) * .06;
    bubble.style.setProperty('--emote-scale', scale.toFixed(3));
  }

  _updateCamera(dt) {
    const target = this.mode === 'driving' ? this.controller.mesh : this.playerMesh;
    const heading = this.mode === 'driving' ? this.controller.heading : 0;
    const modes = [
      { back: 8.5, up: 3.2 },
      { back: 5.5, up: 2.2 },
      { back: 2.2, up: 1.4 },
      { back: 0.3, up: 1.35 },
      { front: true, distance: 7.2, up: 2.7 }
    ];
    const m = modes[this.cameraMode] || modes[0];
    const isBike = this.mode === 'driving' && this.controller.def.isMotorcycle;
    let desired, look;
    if (m.front && this.mode === 'driving') {
      // Front camera: place the camera ahead of the car and look back at its
      // grille. This makes the Titan X4 front visible during races and turns.
      const d = m.distance * (isBike ? 0.9 : 1);
      desired = new THREE.Vector3(
        target.position.x + Math.sin(heading) * d,
        target.position.y + m.up,
        target.position.z + Math.cos(heading) * d
      );
      look = target.position.clone();
      look.y += 1.0;
      look.x -= Math.sin(heading) * 0.9;
      look.z -= Math.cos(heading) * 0.9;
    } else {
      const back = isBike ? m.back * 0.85 : m.back;
      const ox = Math.sin(heading) * -back;
      const oz = Math.cos(heading) * -back;
      desired = new THREE.Vector3(target.position.x + ox, target.position.y + m.up, target.position.z + oz);
      look = target.position.clone();
      look.y += 1.1;
      look.x += Math.sin(heading) * 4;
      look.z += Math.cos(heading) * 4;
    }
    this.camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
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
    this.scene.remove(this.testDrive.mesh);
    this.vehicleActors = this.vehicleActors.filter(a => !a.temp && a.mesh !== this.testDrive.mesh);
    this.testDrive = null;
    this.activeActor = this.findActorByUid(prevUid) || this.activeActor;
    this.state.activeVehicleUid = prevUid;
    this.state.activeVehicleId = this.activeActor?.def?.id || this.state.activeVehicleId;
    if (this.activeActor) {
      this.controller = this.activeActor.ctrl;
      this.mode = 'driving';
      this.playerMesh.visible = false;
    } else {
      this.controller = null;
      this.mode = 'onfoot';
      this.playerMesh.visible = true;
    }
    this.ui.toast('Test drive ended');
    this.ui.offerTestDriveReturn(this, catalogId);
  }

  _updateFollowCarShadow() {
    if (!this.renderer.shadowMap.enabled || !this.world?.sun) return;
    const target = this.mode === 'driving' && this.controller ? this.controller.mesh : this.playerMesh;
    if (!target) return;
    const sun = this.world.sun;
    const horizontalLen = Math.hypot(sun.position.x, sun.position.z) || 1;
    const lightDistance = 150;
    // Keep the sun direction but translate the shadow volume with the active car.
    sun.position.set(
      target.position.x + (sun.position.x / horizontalLen) * lightDistance,
      Math.max(target.position.y + 80, sun.position.y),
      target.position.z + (sun.position.z / horizontalLen) * lightDistance
    );
    sun.target.position.set(target.position.x, target.position.y + 0.5, target.position.z);
    sun.target.updateMatrixWorld();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    this.ui.drawMinimap(this);
  }

  _resize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    const touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const small = Math.min(innerWidth, innerHeight) <= 820;
    const cap = touch ? 1.25 : (small ? 1.45 : 1.75);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
    this.renderer.setSize(innerWidth, innerHeight, false);
  }

  resetProgress() {
    deleteSave();
    this.startNew(this.state.player.name);
  }
}

export { VEHICLES, POIS, DISTRICTS, LANDMARKS, hasSave, levelName, xpProgress, Settings, makeRoomCode };

/* CITY DRIVE — guaranteed street-car selection helper */
(function(){
"use strict";
function install(){
 const G=window.Game, C=window.CityDriveRealStreetCars;
 if(!G||!C||G.prototype.cityDriveStreetCarInstalled) return;
 G.prototype.cityDriveStreetCarInstalled=true;
 G.prototype.getStreetCarSpec=function(id){return C.catalog[id]||null;};
 G.prototype.buildStreetCar=function(id){
   const s=C.catalog[id]; if(!s) return null;
   return C.buildBody(s);
 };
 G.prototype.isStreetCar=function(id){return !!C.catalog[id];};
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(install,0)); else setTimeout(install,0);
})();

/* Lag safety: callers may normalize frame delta through this method. */
Game.prototype.cityDriveSafeDelta=function(dt){
  return window.CityDrivePerformance ? window.CityDrivePerformance.clampDelta(dt) : Math.min(0.033,Math.max(0,dt||0.016));
};
