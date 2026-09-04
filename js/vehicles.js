/**
 * CITY DRIVE — Vehicle Database
 * Modern original fictional vehicle catalog
 */

export const VEHICLE_TIERS = {
  STARTER: 'Starter',
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  PREMIUM: 'Premium',
  ELITE: 'Elite'
};

export const VEHICLE_TYPES = {
  CAR: 'car',
  SUV: 'suv',
  MOTORCYCLE: 'motorcycle',
  COMMERCIAL: 'commercial'
};

/**
 * Central vehicle database.
 * All stats are real and affect gameplay.
 */
export const VEHICLES = [
  {
    id: 'metro_s', name: 'Titan X4', manufacturer: 'Ethan Motors', type: VEHICLE_TYPES.SUV, tier: VEHICLE_TIERS.STARTER, price: 0,
    topSpeed: 145, acceleration: 6.8, handling: 72, braking: 70, weight: 2380, grip: 0.88, offroad: 90,
    fuelCapacity: 75, fuelConsumption: 12.8, nitroCapacity: 50, condition: 100, mileage: 0, resaleFactor: 0.68, requiredLevel: 1,
    color: 0x1f3b2d, secondaryColor: 0x0b1210, description: 'Original fictional luxury 4x4 starter SUV with a tall boxy stance, upright front and commanding road presence.', seats: 5, isMotorcycle: false, fourWheels: true, streetTraffic: true
  },
  {
    id: 'urban_lx', name: 'Executive S9', manufacturer: 'Ethan Motors', type: VEHICLE_TYPES.CAR, tier: VEHICLE_TIERS.BEGINNER, price: 18500,
    topSpeed: 175, acceleration: 5.9, handling: 78, braking: 76, weight: 1980, grip: 0.84, offroad: 18,
    fuelCapacity: 66, fuelConsumption: 9.2, nitroCapacity: 55, condition: 100, mileage: 0, resaleFactor: 0.68, requiredLevel: 2,
    color: 0x11151a, secondaryColor: 0x5f6872, description: 'Luxury executive sedan with smooth power, premium comfort and refined handling.', seats: 5, isMotorcycle: false, fourWheels: true, streetTraffic: true
  },
  {
    id: 'falcon_sport', name: 'Nova VXR-6', manufacturer: 'Nova Performance', type: VEHICLE_TYPES.CAR, tier: VEHICLE_TIERS.ADVANCED, price: 48500,
    topSpeed: 245, acceleration: 3.9, handling: 86, braking: 84, weight: 1470, grip: 0.91, offroad: 10,
    fuelCapacity: 65, fuelConsumption: 11.8, nitroCapacity: 80, condition: 100, mileage: 0, resaleFactor: 0.68, requiredLevel: 5,
    color: 0xcc202b, secondaryColor: 0x1b0508, description: 'Fictional mid-engine supercar with sharp acceleration and precise high-speed control.', seats: 2, isMotorcycle: false, fourWheels: true, streetTraffic: true
  },
  {
    id: 'titan_muscle', name: 'Thunder GT', manufacturer: 'Ethan Motors', type: VEHICLE_TYPES.CAR, tier: VEHICLE_TIERS.PREMIUM, price: 62000,
    topSpeed: 235, acceleration: 3.6, handling: 70, braking: 74, weight: 1770, grip: 0.82, offroad: 22,
    fuelCapacity: 61, fuelConsumption: 14.2, nitroCapacity: 90, condition: 100, mileage: 0, resaleFactor: 0.68, requiredLevel: 6,
    color: 0x1d4ed8, secondaryColor: 0x0a1024, description: 'Bold fictional muscle coupe with explosive acceleration and a wide stance.', seats: 4, isMotorcycle: false, fourWheels: true, streetTraffic: true
  },
  {
    id: 'royal_executive', name: 'Royal Crest X', manufacturer: 'Crown Automotive', type: VEHICLE_TYPES.SUV, tier: VEHICLE_TIERS.PREMIUM, price: 89000,
    topSpeed: 210, acceleration: 5.1, handling: 76, braking: 80, weight: 2160, grip: 0.86, offroad: 40,
    fuelCapacity: 85, fuelConsumption: 13.2, nitroCapacity: 65, condition: 100, mileage: 0, resaleFactor: 0.68, requiredLevel: 7,
    color: 0x101214, secondaryColor: 0x9a8f78, description: 'Ultra-luxury SUV inspired by grand touring comfort and powerful road presence.', seats: 5, isMotorcycle: false, fourWheels: true, streetTraffic: true
  },
  {
    id: 'vortex_x', name: 'Vortex X1', manufacturer: 'Nova Performance', type: VEHICLE_TYPES.CAR, tier: VEHICLE_TIERS.ELITE, price: 185000,
    topSpeed: 330, acceleration: 2.6, handling: 96, braking: 94, weight: 1570, grip: 0.97, offroad: 8,
    fuelCapacity: 68, fuelConsumption: 16.5, nitroCapacity: 100, condition: 100, mileage: 0, resaleFactor: 0.68, requiredLevel: 9,
    color: 0xd90018, secondaryColor: 0x220006, description: 'Extreme fictional supercar performance with explosive acceleration, grip and braking.', seats: 2, isMotorcycle: false, fourWheels: true, streetTraffic: true
  },
  {
    id: 'city_explorer', name: 'Terra Guard', manufacturer: 'Atlas Automotive', type: VEHICLE_TYPES.SUV, tier: VEHICLE_TIERS.INTERMEDIATE, price: 27500,
    topSpeed: 165, acceleration: 6.4, handling: 64, braking: 66, weight: 2050, grip: 0.84, offroad: 92,
    fuelCapacity: 80, fuelConsumption: 11.8, nitroCapacity: 50, condition: 100, mileage: 0, resaleFactor: 0.68, requiredLevel: 3,
    color: 0x6f8061, secondaryColor: 0x182018, description: 'Rugged premium SUV built for city streets, sand, dirt and rough roads.', seats: 5, isMotorcycle: false, fourWheels: true, streetTraffic: true
  },
  {
    id: 'grand_terrain', name: 'Grand Terrain', manufacturer: 'Atlas Automotive', type: VEHICLE_TYPES.SUV, tier: VEHICLE_TIERS.ADVANCED, price: 72000,
    topSpeed: 195, acceleration: 5.4, handling: 72, braking: 74, weight: 2320, grip: 0.87, offroad: 82,
    fuelCapacity: 90, fuelConsumption: 13.5, nitroCapacity: 60, condition: 100, mileage: 0, resaleFactor: 0.68, requiredLevel: 5,
    color: 0x566878, secondaryColor: 0x141b22, description: 'Luxury all-terrain SUV with a smooth ride, strong grip and confident off-road ability.', seats: 5, isMotorcycle: false, fourWheels: true, streetTraffic: true
  },
  {
    id: 'mountain_beast', name: 'Trailmaster R', manufacturer: 'Atlas Automotive', type: VEHICLE_TYPES.SUV, tier: VEHICLE_TIERS.ADVANCED, price: 58000,
    topSpeed: 155, acceleration: 6.8, handling: 58, braking: 62, weight: 2080, grip: 0.88, offroad: 98,
    fuelCapacity: 81, fuelConsumption: 14.5, nitroCapacity: 45, condition: 100, mileage: 0, resaleFactor: 0.68, requiredLevel: 6,
    color: 0x66734a, secondaryColor: 0x172018, description: 'Iconic off-road SUV with excellent traction for dirt, sand and mountain routes.', seats: 5, isMotorcycle: false, fourWheels: true, streetTraffic: true
  },
  {
    id: 'street_hawk', name: 'Falcon XR4', manufacturer: 'Nova Performance', type: VEHICLE_TYPES.CAR, tier: VEHICLE_TIERS.BEGINNER, price: 54000,
    topSpeed: 250, acceleration: 4.1, handling: 84, braking: 82, weight: 1725, grip: 0.89, offroad: 16,
    fuelCapacity: 59, fuelConsumption: 10.6, nitroCapacity: 70, condition: 100, mileage: 0, resaleFactor: 0.68, requiredLevel: 4,
    color: 0x1d1f24, secondaryColor: 0xbfc5cb, description: 'Aggressive performance coupe with a sporty silhouette and four planted wheels.', seats: 4, isMotorcycle: false, fourWheels: true, streetTraffic: true
  },
  {
    id: 'thunder_r', name: 'Apex R9', manufacturer: 'Nova Performance', type: VEHICLE_TYPES.CAR, tier: VEHICLE_TIERS.ADVANCED, price: 78000,
    topSpeed: 293, acceleration: 3.7, handling: 91, braking: 89, weight: 1590, grip: 0.94, offroad: 12,
    fuelCapacity: 64, fuelConsumption: 10.9, nitroCapacity: 85, condition: 100, mileage: 0, resaleFactor: 0.68, requiredLevel: 6,
    color: 0xffd21c, secondaryColor: 0x111315, description: 'Fictional rear-engine sports car with agile cornering and exhilarating acceleration.', seats: 4, isMotorcycle: false, fourWheels: true, streetTraffic: true
  },
  {
    id: 'dirt_runner', name: 'Vortex SUV', manufacturer: 'Nova Performance', type: VEHICLE_TYPES.SUV, tier: VEHICLE_TIERS.PREMIUM, price: 118000,
    topSpeed: 305, acceleration: 3.6, handling: 88, braking: 86, weight: 2200, grip: 0.9, offroad: 72,
    fuelCapacity: 85, fuelConsumption: 14.8, nitroCapacity: 90, condition: 100, mileage: 0, resaleFactor: 0.68, requiredLevel: 8,
    color: 0xe0a400, secondaryColor: 0x1a1200, description: 'Super-SUV combining exotic styling, brutal speed and everyday four-wheel confidence.', seats: 5, isMotorcycle: false, fourWheels: true, streetTraffic: true
  },
  {
    id: 'cargo_king', name: 'DirtForce X', manufacturer: 'Atlas Automotive', type: VEHICLE_TYPES.COMMERCIAL, tier: VEHICLE_TIERS.INTERMEDIATE, price: 36000,
    topSpeed: 175, acceleration: 7.4, handling: 58, braking: 62, weight: 2050, grip: 0.79, offroad: 88,
    fuelCapacity: 80, fuelConsumption: 12.2, nitroCapacity: 40, condition: 100, mileage: 0, resaleFactor: 0.68, requiredLevel: 3,
    color: 0x9b1c24, secondaryColor: 0x17191d, description: 'Sporty pickup truck with four-wheel traction, useful cargo space and rugged handling.', seats: 5, isMotorcycle: false, fourWheels: true, streetTraffic: true
  },
  {
    id: 'city_van', name: 'CityRunner Van', manufacturer: 'Ethan Motors', type: VEHICLE_TYPES.COMMERCIAL, tier: VEHICLE_TIERS.INTERMEDIATE, price: 42000,
    topSpeed: 165, acceleration: 8.8, handling: 52, braking: 58, weight: 2350, grip: 0.76, offroad: 50,
    fuelCapacity: 93, fuelConsumption: 13.8, nitroCapacity: 25, condition: 100, mileage: 0, resaleFactor: 0.68, requiredLevel: 3,
    color: 0xf2f2ee, secondaryColor: 0x25303a, description: 'Premium city van with four wheels, high visibility and strong utility for delivery work.', seats: 8, isMotorcycle: false, fourWheels: true, streetTraffic: true
  },
  {
    id: 'metro_bus', name: 'Velocity V7', manufacturer: 'Nova Performance', type: VEHICLE_TYPES.CAR, tier: VEHICLE_TIERS.ELITE, price: 112000,
    topSpeed: 305, acceleration: 3.4, handling: 90, braking: 91, weight: 2040, grip: 0.94, offroad: 15,
    fuelCapacity: 73, fuelConsumption: 12.4, nitroCapacity: 95, condition: 100, mileage: 0, resaleFactor: 0.68, requiredLevel: 8,
    color: 0x9ca3af, secondaryColor: 0x111827, description: 'Luxury performance fastback with supercar pace and a practical four-door cabin.', seats: 5, isMotorcycle: false, fourWheels: true, streetTraffic: true
  }
];

export function getVehicleById(id) {
  return VEHICLES.find(v => v.id === id) || null;
}

export function getVehiclesByTier(tier) {
  return VEHICLES.filter(v => v.tier === tier);
}

export function getVehiclesByType(type) {
  return VEHICLES.filter(v => v.type === type);
}

export function makeVehicleUid() {
  return 'veh_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

export function cloneVehicle(base, overrides = {}) {
  return {
    ...JSON.parse(JSON.stringify(base)),
    ...overrides,
    vehicleUid: overrides.vehicleUid || makeVehicleUid(),
    vehicleId: base.id,
    vehicleType: base.type,
    isOwned: overrides.isOwned !== false,
    isTestDrive: !!overrides.isTestDrive,
    purchasePrice: overrides.purchasePrice ?? base.price,
    purchaseDate: overrides.purchaseDate || Date.now(),
    currentFuel: overrides.currentFuel ?? base.fuelCapacity,
    currentCondition: overrides.currentCondition ?? base.condition,
    currentMileage: overrides.currentMileage ?? 0,
    upgrades: overrides.upgrades || {
      engine: 0,
      transmission: 0,
      tires: 0,
      brakes: 0,
      suspension: 0,
      nitro: 0,
      fuelSystem: 0
    },
    customization: overrides.customization || {
      primaryColor: base.color,
      secondaryColor: base.secondaryColor,
      wheels: 0,
      tint: 0,
      headlights: 0,
      spoiler: 0,
      underglow: 0
    },
    owned: true,
    favorite: false
  };
}

/* Street-car catalog is loaded by streetCars.js. */

/* Real street-car bridge: makes the new bodies first-class selectable vehicles. */
(function(){
"use strict";
function install(){
 const C=window.CityDriveRealStreetCars;
 if(!C) return;
 window.CITY_DRIVE_STREET_VEHICLES=C.catalog;
 // Common global registries used by this project/variants.
 const targets=[window.VEHICLES,window.vehicleDatabase,window.VEHICLE_DEFS,window.vehicleCatalog];
 for(const target of targets){
   if(target && typeof target==="object"){
     for(const [id,s] of Object.entries(C.catalog)){
       if(!target[id]) target[id]={id,...s,streetCar:true};
     }
   }
 }
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",install); else install();
})();
