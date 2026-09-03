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
  // 1. STARTER
  {
    id: 'metro_s',
    name: 'Metro',
    manufacturer: 'Aether',
    type: VEHICLE_TYPES.CAR,
    tier: VEHICLE_TIERS.STARTER,
    price: 8500,
    topSpeed: 145,          // km/h
    acceleration: 6.8,      // 0-100 time (lower = better)
    handling: 62,
    braking: 58,
    weight: 1180,
    grip: 0.72,
    offroad: 25,
    fuelCapacity: 42,
    fuelConsumption: 7.2,   // L/100km approx factor
    nitroCapacity: 40,
    condition: 100,
    mileage: 0,
    resaleFactor: 0.72,
    requiredLevel: 1,
    color: 0x4488cc,
    secondaryColor: 0x222233,
    description: 'Affordable compact sedan. Balanced and easy to drive.',
    seats: 4,
    isMotorcycle: false
  },
  // 2. BEGINNER
  {
    id: 'urban_lx',
    name: 'Urban LX',
    manufacturer: 'Aether',
    type: VEHICLE_TYPES.CAR,
    tier: VEHICLE_TIERS.BEGINNER,
    price: 18500,
    topSpeed: 175,
    acceleration: 5.9,
    handling: 68,
    braking: 64,
    weight: 1320,
    grip: 0.76,
    offroad: 28,
    fuelCapacity: 48,
    fuelConsumption: 8.1,
    nitroCapacity: 50,
    condition: 100,
    mileage: 0,
    resaleFactor: 0.70,
    requiredLevel: 2,
    color: 0x55aa77,
    secondaryColor: 0x1a2a22,
    description: 'Comfortable family sedan with better speed and handling.',
    seats: 5,
    isMotorcycle: false
  },
  // 3. ADVANCED
  {
    id: 'falcon_sport',
    name: 'Falcon Sport',
    manufacturer: 'Vespera',
    type: VEHICLE_TYPES.CAR,
    tier: VEHICLE_TIERS.ADVANCED,
    price: 48500,
    topSpeed: 245,
    acceleration: 3.9,
    handling: 82,
    braking: 78,
    weight: 1280,
    grip: 0.88,
    offroad: 18,
    fuelCapacity: 52,
    fuelConsumption: 11.5,
    nitroCapacity: 80,
    condition: 100,
    mileage: 0,
    resaleFactor: 0.68,
    requiredLevel: 5,
    color: 0xcc3344,
    secondaryColor: 0x220011,
    description: 'Sports coupe. High acceleration and sharp handling.',
    seats: 2,
    isMotorcycle: false
  },
  // 4. PREMIUM
  {
    id: 'titan_muscle',
    name: 'Titan Muscle',
    manufacturer: 'Ironclad',
    type: VEHICLE_TYPES.CAR,
    tier: VEHICLE_TIERS.PREMIUM,
    price: 62000,
    topSpeed: 235,
    acceleration: 3.6,
    handling: 64,
    braking: 70,
    weight: 1780,
    grip: 0.80,
    offroad: 22,
    fuelCapacity: 68,
    fuelConsumption: 14.2,
    nitroCapacity: 90,
    condition: 100,
    mileage: 0,
    resaleFactor: 0.65,
    requiredLevel: 6,
    color: 0x2244aa,
    secondaryColor: 0x111122,
    description: 'Powerful muscle-style car. Brutal acceleration, heavier feel.',
    seats: 4,
    isMotorcycle: false
  },
  // 5. PREMIUM
  {
    id: 'royal_executive',
    name: 'Royal Executive',
    manufacturer: 'Lumina',
    type: VEHICLE_TYPES.CAR,
    tier: VEHICLE_TIERS.PREMIUM,
    price: 89000,
    topSpeed: 210,
    acceleration: 5.1,
    handling: 74,
    braking: 76,
    weight: 1850,
    grip: 0.82,
    offroad: 20,
    fuelCapacity: 72,
    fuelConsumption: 10.8,
    nitroCapacity: 60,
    condition: 100,
    mileage: 0,
    resaleFactor: 0.75,
    requiredLevel: 7,
    color: 0x111111,
    secondaryColor: 0x333344,
    description: 'Luxury sedan. Expensive, comfortable and refined.',
    seats: 5,
    isMotorcycle: false
  },
  // 6. ELITE
  {
    id: 'vortex_x',
    name: 'Vortex X',
    manufacturer: 'Vespera',
    type: VEHICLE_TYPES.CAR,
    tier: VEHICLE_TIERS.ELITE,
    price: 185000,
    topSpeed: 330,
    acceleration: 2.6,
    handling: 94,
    braking: 92,
    weight: 1320,
    grip: 0.96,
    offroad: 12,
    fuelCapacity: 55,
    fuelConsumption: 16.5,
    nitroCapacity: 100,
    condition: 100,
    mileage: 0,
    resaleFactor: 0.60,
    requiredLevel: 9,
    color: 0xff2200,
    secondaryColor: 0x220000,
    description: 'High-performance supercar. Extremely fast with advanced handling.',
    seats: 2,
    isMotorcycle: false
  },
  // 7. INTERMEDIATE SUV
  {
    id: 'city_explorer',
    name: 'City Explorer',
    manufacturer: 'Trailforge',
    type: VEHICLE_TYPES.SUV,
    tier: VEHICLE_TIERS.INTERMEDIATE,
    price: 27500,
    topSpeed: 165,
    acceleration: 6.4,
    handling: 58,
    braking: 60,
    weight: 1680,
    grip: 0.74,
    offroad: 72,
    fuelCapacity: 70,
    fuelConsumption: 11.0,
    nitroCapacity: 45,
    condition: 100,
    mileage: 0,
    resaleFactor: 0.70,
    requiredLevel: 3,
    color: 0x668855,
    secondaryColor: 0x223322,
    description: 'Affordable SUV. Balanced road and light off-road performance.',
    seats: 5,
    isMotorcycle: false
  },
  // 8. ADVANCED SUV
  {
    id: 'grand_terrain',
    name: 'Grand Terrain',
    manufacturer: 'Lumina',
    type: VEHICLE_TYPES.SUV,
    tier: VEHICLE_TIERS.ADVANCED,
    price: 72000,
    topSpeed: 195,
    acceleration: 5.4,
    handling: 66,
    braking: 68,
    weight: 2150,
    grip: 0.78,
    offroad: 65,
    fuelCapacity: 85,
    fuelConsumption: 13.5,
    nitroCapacity: 55,
    condition: 100,
    mileage: 0,
    resaleFactor: 0.72,
    requiredLevel: 5,
    color: 0x335577,
    secondaryColor: 0x112233,
    description: 'Luxury SUV. High stability and comfort.',
    seats: 7,
    isMotorcycle: false
  },
  // 9. ADVANCED OFF-ROAD
  {
    id: 'mountain_beast',
    name: 'Mountain Beast',
    manufacturer: 'Trailforge',
    type: VEHICLE_TYPES.SUV,
    tier: VEHICLE_TIERS.ADVANCED,
    price: 58000,
    topSpeed: 155,
    acceleration: 6.8,
    handling: 52,
    braking: 55,
    weight: 2320,
    grip: 0.85,
    offroad: 95,
    fuelCapacity: 90,
    fuelConsumption: 15.0,
    nitroCapacity: 40,
    condition: 100,
    mileage: 0,
    resaleFactor: 0.68,
    requiredLevel: 6,
    color: 0x886633,
    secondaryColor: 0x332211,
    description: 'Off-road SUV. Excellent dirt, sand and mountain performance.',
    seats: 5,
    isMotorcycle: false
  },
  // 10. BEGINNER BIKE
  {
    id: 'street_hawk',
    name: 'Street Hawk',
    manufacturer: 'Apex',
    type: VEHICLE_TYPES.MOTORCYCLE,
    tier: VEHICLE_TIERS.BEGINNER,
    price: 9200,
    topSpeed: 185,
    acceleration: 4.2,
    handling: 88,
    braking: 70,
    weight: 185,
    grip: 0.78,
    offroad: 30,
    fuelCapacity: 14,
    fuelConsumption: 4.5,
    nitroCapacity: 35,
    condition: 100,
    mileage: 0,
    resaleFactor: 0.65,
    requiredLevel: 2,
    color: 0xdd4422,
    secondaryColor: 0x111111,
    description: 'Entry-level street motorcycle. Fast and agile.',
    seats: 2,
    isMotorcycle: true
  },
  // 11. ADVANCED BIKE
  {
    id: 'thunder_r',
    name: 'Thunder R',
    manufacturer: 'Apex',
    type: VEHICLE_TYPES.MOTORCYCLE,
    tier: VEHICLE_TIERS.ADVANCED,
    price: 28500,
    topSpeed: 275,
    acceleration: 2.9,
    handling: 94,
    braking: 82,
    weight: 175,
    grip: 0.90,
    offroad: 22,
    fuelCapacity: 16,
    fuelConsumption: 5.8,
    nitroCapacity: 70,
    condition: 100,
    mileage: 0,
    resaleFactor: 0.62,
    requiredLevel: 5,
    color: 0x00aaff,
    secondaryColor: 0x002233,
    description: 'Sport motorcycle. Very high acceleration and handling.',
    seats: 2,
    isMotorcycle: true
  },
  // 12. INTERMEDIATE DIRT BIKE
  {
    id: 'dirt_runner',
    name: 'Dirt Runner',
    manufacturer: 'Trailforge',
    type: VEHICLE_TYPES.MOTORCYCLE,
    tier: VEHICLE_TIERS.INTERMEDIATE,
    price: 14500,
    topSpeed: 145,
    acceleration: 4.0,
    handling: 80,
    braking: 65,
    weight: 145,
    grip: 0.82,
    offroad: 98,
    fuelCapacity: 10,
    fuelConsumption: 5.2,
    nitroCapacity: 30,
    condition: 100,
    mileage: 0,
    resaleFactor: 0.60,
    requiredLevel: 3,
    color: 0x44aa22,
    secondaryColor: 0x113311,
    description: 'Off-road dirt bike. Excellent on dirt and mountain terrain.',
    seats: 1,
    isMotorcycle: true
  },
  // 13. ADVANCED POWER BIKE
  {
    id: 'phantom_rr', name: 'Phantom RR', manufacturer: 'Apex', type: VEHICLE_TYPES.MOTORCYCLE, tier: VEHICLE_TIERS.ADVANCED, price: 42000,
    topSpeed: 305, acceleration: 2.5, handling: 96, braking: 88, weight: 188, grip: 0.93, offroad: 18, fuelCapacity: 17, fuelConsumption: 6.1, nitroCapacity: 85, condition: 100, mileage: 0, resaleFactor: 0.62, requiredLevel: 6, color: 0x6611cc, secondaryColor: 0x12051f, description: 'Track-inspired superbike with extreme acceleration and precision handling.', seats: 2, isMotorcycle: true
  },
  // 14. ELITE POWER BIKE
  {
    id: 'apex_900', name: 'Apex 900', manufacturer: 'Apex', type: VEHICLE_TYPES.MOTORCYCLE, tier: VEHICLE_TIERS.ELITE, price: 68000,
    topSpeed: 340, acceleration: 2.2, handling: 98, braking: 92, weight: 181, grip: 0.96, offroad: 15, fuelCapacity: 18, fuelConsumption: 6.4, nitroCapacity: 100, condition: 100, mileage: 0, resaleFactor: 0.60, requiredLevel: 8, color: 0xeeeeee, secondaryColor: 0x111111, description: 'Premium superbike built for high-speed city racing.', seats: 2, isMotorcycle: true
  },
  // 15. PREMIUM CRUISER
  {
    id: 'road_master', name: 'Road Master', manufacturer: 'Apex', type: VEHICLE_TYPES.MOTORCYCLE, tier: VEHICLE_TIERS.PREMIUM, price: 35500,
    topSpeed: 235, acceleration: 3.7, handling: 84, braking: 80, weight: 248, grip: 0.86, offroad: 28, fuelCapacity: 20, fuelConsumption: 5.5, nitroCapacity: 55, condition: 100, mileage: 0, resaleFactor: 0.64, requiredLevel: 5, color: 0x222222, secondaryColor: 0xbb8833, description: 'Power cruiser with strong acceleration, stability and long-range fuel.', seats: 2, isMotorcycle: true
  },
  // 13. INTERMEDIATE TRUCK
  {
    id: 'cargo_king',
    name: 'Cargo King',
    manufacturer: 'Haultech',
    type: VEHICLE_TYPES.COMMERCIAL,
    tier: VEHICLE_TIERS.INTERMEDIATE,
    price: 32000,
    topSpeed: 140,
    acceleration: 8.5,
    handling: 48,
    braking: 52,
    weight: 2450,
    grip: 0.70,
    offroad: 55,
    fuelCapacity: 90,
    fuelConsumption: 16.0,
    nitroCapacity: 25,
    condition: 100,
    mileage: 0,
    resaleFactor: 0.68,
    requiredLevel: 3,
    color: 0x555566,
    secondaryColor: 0x222233,
    description: 'Delivery pickup truck. Useful for delivery jobs.',
    seats: 2,
    isMotorcycle: false
  },
  // 14. INTERMEDIATE VAN
  {
    id: 'city_van',
    name: 'City Van',
    manufacturer: 'Haultech',
    type: VEHICLE_TYPES.COMMERCIAL,
    tier: VEHICLE_TIERS.INTERMEDIATE,
    price: 28500,
    topSpeed: 135,
    acceleration: 9.2,
    handling: 45,
    braking: 50,
    weight: 2100,
    grip: 0.68,
    offroad: 35,
    fuelCapacity: 80,
    fuelConsumption: 14.5,
    nitroCapacity: 20,
    condition: 100,
    mileage: 0,
    resaleFactor: 0.66,
    requiredLevel: 3,
    color: 0xffffff,
    secondaryColor: 0x334455,
    description: 'Delivery/passenger van. Useful for delivery missions.',
    seats: 8,
    isMotorcycle: false
  },
  // 15. ELITE BUS
  {
    id: 'metro_bus',
    name: 'Metro Bus',
    manufacturer: 'Haultech',
    type: VEHICLE_TYPES.COMMERCIAL,
    tier: VEHICLE_TIERS.ELITE,
    price: 125000,
    topSpeed: 95,
    acceleration: 14.0,
    handling: 28,
    braking: 40,
    weight: 9800,
    grip: 0.55,
    offroad: 15,
    fuelCapacity: 200,
    fuelConsumption: 28.0,
    nitroCapacity: 0,
    condition: 100,
    mileage: 0,
    resaleFactor: 0.55,
    requiredLevel: 8,
    color: 0x2266aa,
    secondaryColor: 0xffffff,
    description: 'Large city bus. Slow but earns high rewards from bus jobs.',
    seats: 40,
    isMotorcycle: false
  },

  // STREET TRAFFIC EXPANSION — fictional, real-world-inspired road cars
  ...[
    ['street_metro','Metro Sedan','sedan',145,6.8,62,58,1180,0xD8D8D8,0x252930],
    ['street_exec','Executive Sedan','sedan',190,5.9,68,64,1450,0x20252A,0x11151A],
    ['street_hatch','City Hatch','hatchback',125,7.5,64,60,1120,0xB72D2D,0x24282D],
    ['street_family_hatch','Family Hatch','hatchback',155,6.9,66,62,1240,0xEEEEEE,0x30343A],
    ['street_compact_suv','Compact SUV','suv',180,7.4,60,62,1520,0x8A8A82,0x20252A],
    ['street_urban_suv','Urban SUV','suv',220,6.6,64,66,1760,0x25282C,0x111318],
    ['street_lux_suv','Luxury SUV','suv',300,5.7,72,72,2050,0x171A1D,0x32363C],
    ['street_mpv','Family MPV','mpv',160,7.2,56,58,1580,0xF1F1E8,0x30343A],
    ['street_taxi','City Taxi','taxi',150,7.0,61,60,1280,0xE6C31F,0x16191D],
    ['street_van','Delivery Van','van',175,9.2,48,52,1850,0xF4F4F4,0x30343A],
    ['street_pickup','Street Pickup','pickup',230,7.0,56,58,1900,0xA83B2F,0x24282D],
    ['street_offroad_pickup','Off-Road Pickup','pickup',280,6.1,60,64,2050,0x314936,0x171B1A]
  ].map(([id,name,shape,topSpeed,acceleration,handling,braking,weight,color,secondaryColor]) => ({
    id,name,manufacturer:'Roadline',type: shape==='suv'?VEHICLE_TYPES.SUV:(shape==='van'||shape==='pickup'?VEHICLE_TYPES.COMMERCIAL:VEHICLE_TYPES.CAR),
    tier:VEHICLE_TIERS.BEGINNER,price:12000,topSpeed,acceleration,handling,braking,weight,grip:0.74,offroad:shape==='suv'||shape==='pickup'?55:22,
    fuelCapacity:50,fuelConsumption:8.5,nitroCapacity:0,condition:100,mileage:0,resaleFactor:0.65,requiredLevel:1,
    color,secondaryColor,description:'Everyday fictional street vehicle for realistic city traffic.',seats:shape==='van'?2:5,isMotorcycle:false,streetTraffic:true
  }))
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
