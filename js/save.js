/**
 * CITY DRIVE — Save / Load (version 2, vehicleUid authoritative)
 */

const SAVE_KEY = 'citydrive_save_v1';
const SETTINGS_KEY = 'citydrive_settings_v1';
import { getVehicleById } from './vehicles.js';

export function hasSave() {
  try {
    return !!localStorage.getItem(SAVE_KEY);
  } catch {
    return false;
  }
}

function uid() {
  return 'veh_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

export function sanitizeOwnedVehicle(v) {
  if (!v || typeof v !== 'object' || v.isTestDrive) return null;
  if (!getVehicleById(v.id || v.vehicleId)) return null;
  const vehicleUid = v.vehicleUid || uid();
  const fuelCapacity = Number(v.fuelCapacity);
  const cap = Number.isFinite(fuelCapacity) && fuelCapacity > 0 ? fuelCapacity : 1;
  const n = (x, fallback=0) => { const z = Number(x); return Number.isFinite(z) ? z : fallback; };
  const upgrades = {};
  for (const part of ['engine','transmission','tires','brakes','suspension','nitro','fuelSystem']) upgrades[part] = Math.min(5, Math.max(0, Math.trunc(n(v.upgrades?.[part], 0))));
  return {
    ...v,
    vehicleUid,
    vehicleId: v.vehicleId || v.id,
    id: v.id || v.vehicleId,
    vehicleType: v.vehicleType || v.type,
    isOwned: true,
    isTestDrive: false,
    purchasePrice: Math.max(0, n(v.purchasePrice ?? v.price, 0)),
    purchaseDate: n(v.purchaseDate, Date.now()),
    currentFuel: Math.min(cap, Math.max(0, n(v.currentFuel, cap))),
    currentCondition: Math.min(100, Math.max(0, n(v.currentCondition, 100))),
    currentMileage: Math.max(0, n(v.currentMileage, 0)),
    upgrades,
    customization: {
      primaryColor: n(v.customization?.primaryColor ?? v.color, 0x4488cc),
      secondaryColor: n(v.customization?.secondaryColor ?? v.secondaryColor, 0x222233),
      wheels: Math.max(0, Math.trunc(n(v.customization?.wheels, 0))),
      tint: Math.max(0, Math.trunc(n(v.customization?.tint, 0))),
      headlights: Math.max(0, Math.trunc(n(v.customization?.headlights, 0))),
      spoiler: Math.max(0, Math.trunc(n(v.customization?.spoiler, 0))),
      underglow: Math.max(0, Math.trunc(n(v.customization?.underglow, 0)))
    }
  };
}

export function migrateSave(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const garageVeh = (raw.garage?.vehicles || [])
    .map(sanitizeOwnedVehicle)
    .filter(Boolean);

  let activeUid = raw.activeVehicleUid || null;
  if (!activeUid && raw.activeVehicleId) {
    const match = garageVeh.find(v => v.id === raw.activeVehicleId || v.vehicleId === raw.activeVehicleId);
    activeUid = match?.vehicleUid || garageVeh[0]?.vehicleUid || null;
  }
  if (!activeUid) activeUid = garageVeh[0]?.vehicleUid || null;

  const ownedUids = garageVeh.map(v => v.vehicleUid);

  return {
    version: 2,
    timestamp: raw.timestamp || Date.now(),
    player: {
      ...(raw.player || {}),
      name: String(raw.player?.name || 'Driver').slice(0, 24),
      money: (() => { const n = Number(raw.player?.money); return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 50000; })(),
      xp: (() => { const n = Number(raw.player?.xp); return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0; })(),
      distanceDriven: (() => { const n = Number(raw.player?.distanceDriven); return Number.isFinite(n) ? Math.max(0, n) : 0; })(),
      jobsCompleted: (() => { const n = Number(raw.player?.jobsCompleted); return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0; })(),
      racesWon: (() => { const n = Number(raw.player?.racesWon); return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0; })(),
      missionsCompleted: (() => { const n = Number(raw.player?.missionsCompleted); return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0; })(),
      campaignLevel: (() => { const n = Number(raw.player?.campaignLevel); return Number.isFinite(n) ? Math.min(20, Math.max(1, Math.trunc(n))) : 1; })(),
      campaignCompleted: Array.isArray(raw.player?.campaignCompleted) ? [...new Set(raw.player.campaignCompleted.map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= 20))] : [],
      daily: raw.player?.daily || null,
      shop: raw.player?.shop || null,
      rankId: raw.player?.rankId || null
    },
    garage: {
      capacity: (() => { const n = Number(raw.garage?.capacity); return Number.isFinite(n) ? Math.min(30, Math.max(1, Math.trunc(n))) : 8; })(),
      vehicles: garageVeh
    },
    ownedVehicleIds: ownedUids,
    activeVehicleUid: activeUid,
    activeVehicleId: garageVeh.find(v => v.vehicleUid === activeUid)?.id || raw.activeVehicleId || null,
    achievements: raw.achievements || {},
    completedJobs: raw.completedJobs || [],
    completedRaces: raw.completedRaces || [],
    unlockedAreas: raw.unlockedAreas || ['downtown', 'residential'],
    visitedDistricts: raw.visitedDistricts || ['downtown']
  };
}

export function saveGame(state) {
  try {
    const vehicles = (state.garage?.vehicles || [])
      .map(sanitizeOwnedVehicle)
      .filter(Boolean);
    const activeUid = state.activeVehicleUid
      || vehicles.find(v => v.id === state.activeVehicleId)?.vehicleUid
      || vehicles[0]?.vehicleUid
      || null;
    const data = {
      version: 2,
      timestamp: Date.now(),
      player: {
        name: state.player.name,
        money: state.player.money,
        xp: state.player.xp,
        level: state.player.level,
        distanceDriven: state.player.distanceDriven,
        jobsCompleted: state.player.jobsCompleted,
        racesWon: state.player.racesWon,
        missionsCompleted: state.player.missionsCompleted,
        campaignLevel: Number(state.player.campaignLevel || 1),
        campaignCompleted: Array.isArray(state.player.campaignCompleted) ? state.player.campaignCompleted : [],
        daily: state.player.daily || null,
        shop: state.player.shop || null,
        rankId: state._rankId || state.player.rankId || null
      },
      garage: {
        capacity: state.garage.capacity,
        vehicles
      },
      ownedVehicleIds: vehicles.map(v => v.vehicleUid),
      activeVehicleUid: activeUid,
      activeVehicleId: vehicles.find(v => v.vehicleUid === activeUid)?.id || null,
      achievements: state.achievements,
      completedJobs: state.completedJobs || [],
      completedRaces: state.completedRaces || [],
      unlockedAreas: state.unlockedAreas || ['downtown', 'residential'],
      visitedDistricts: state.visitedDistricts || []
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Save failed:', e);
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const migrated = migrateSave(parsed);
    if (migrated && parsed.version !== 2) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch (e) {
    console.error('Load failed:', e);
    return null;
  }
}

export function deleteSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Settings save failed', e);
  }
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return getDefaultSettings();
    return { ...getDefaultSettings(), ...JSON.parse(raw) };
  } catch {
    return getDefaultSettings();
  }
}

function getDefaultSettings() {
  return {
    graphics: 'medium',
    shadows: true,
    trafficDensity: 0.7,
    pedestrianDensity: 0.6,
    soundVolume: 0.8,
    musicVolume: 0.5,
    musicOn: true,
    cameraSensitivity: 1.0,
    steeringSensitivity: 1.0,
    touchControls: true,
    vibration: true
  };
}
