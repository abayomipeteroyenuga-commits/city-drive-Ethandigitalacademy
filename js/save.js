/**
 * CITY DRIVE — Save / Load (version 2, vehicleUid authoritative)
 */

const SAVE_KEY = 'citydrive_save_v1';
const SETTINGS_KEY = 'citydrive_settings_v1';

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
  if (!v || typeof v !== 'object') return null;
  if (v.isTestDrive) return null;
  const vehicleUid = v.vehicleUid || uid();
  return {
    ...v,
    vehicleUid,
    vehicleId: v.vehicleId || v.id,
    id: v.id || v.vehicleId,
    vehicleType: v.vehicleType || v.type,
    isOwned: true,
    isTestDrive: false,
    purchasePrice: v.purchasePrice ?? v.price,
    purchaseDate: v.purchaseDate || Date.now(),
    currentFuel: v.currentFuel ?? v.fuelCapacity,
    currentCondition: v.currentCondition ?? 100,
    currentMileage: v.currentMileage ?? 0,
    upgrades: v.upgrades || {
      engine: 0, transmission: 0, tires: 0, brakes: 0, suspension: 0, nitro: 0, fuelSystem: 0
    },
    customization: v.customization || {
      primaryColor: v.color,
      secondaryColor: v.secondaryColor,
      wheels: 0, tint: 0, headlights: 0, spoiler: 0, underglow: 0
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
    player: raw.player || {},
    garage: {
      capacity: raw.garage?.capacity || 5,
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
        missionsCompleted: state.player.missionsCompleted
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
