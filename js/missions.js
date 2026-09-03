/**
 * CITY DRIVE — 20-level campaign + rotating daily challenge.
 */
export const CAMPAIGN_MISSIONS = [
  { level: 1, title: 'FIRST DELIVERY', type: 'drive', objective: 'Drive to Central Mall', dest: 'central_mall', reward: 500, xp: 100 },
  { level: 2, title: 'CITY COURIER', type: 'job', objective: 'Complete a Delivery Job', job: 'delivery', reward: 650, xp: 120 },
  { level: 3, title: 'UPGRADE YOUR RIDE', type: 'upgrade', objective: 'Install your first vehicle upgrade', reward: 800, xp: 150 },
  { level: 4, title: 'AIRPORT RUN', type: 'drive', objective: 'Drive to International Airport', dest: 'airport', reward: 900, xp: 170 },
  { level: 5, title: 'PROVE YOURSELF', type: 'race', objective: 'Finish the Street Race', race: 'street', reward: 1200, xp: 220 },
  { level: 6, title: 'FOOD ON THE MOVE', type: 'job', objective: 'Complete a Food Delivery', job: 'food', reward: 1100, xp: 200 },
  { level: 7, title: 'BEACHFRONT DRIVE', type: 'drive', objective: 'Drive to the Grand Hotel', dest: 'grand_hotel', reward: 1300, xp: 230 },
  { level: 8, title: 'BIGGER AND BETTER', type: 'buy', objective: 'Buy a second vehicle', reward: 1600, xp: 280 },
  { level: 9, title: 'CHAMPION RUN', type: 'race', objective: 'Finish the Circuit Race', race: 'circuit', reward: 2000, xp: 350 },
  { level: 10, title: 'CITY DRIVER', type: 'drive', objective: 'Drive to Nova Tower', dest: 'nova_tower', reward: 2400, xp: 420 },
  { level: 11, title: 'NIGHT SHIFT', type: 'job', objective: 'Complete a VIP Job', job: 'vip', reward: 2600, xp: 450 },
  { level: 12, title: 'HIGHWAY HUNT', type: 'race', objective: 'Finish the Highway Sprint', race: 'highway', reward: 2800, xp: 480 },
  { level: 13, title: 'BIKE LIFE', type: 'drive', objective: 'Reach the Vehicle Marketplace', dest: 'market', reward: 3000, xp: 500 },
  { level: 14, title: 'OFF-ROAD KING', type: 'job', objective: 'Complete an Off-Road Contract', job: 'offroad', reward: 3300, xp: 540 },
  { level: 15, title: 'STADIUM RUN', type: 'drive', objective: 'Drive to Nova Stadium', dest: 'stadium', reward: 3500, xp: 580 },
  { level: 16, title: 'MOTORCYCLE MAYHEM', type: 'race', objective: 'Finish the Motorcycle Race', race: 'bike', reward: 3800, xp: 620 },
  { level: 17, title: 'CITY CONNECTION', type: 'drive', objective: 'Cross Riverside Bridge', dest: 'bridge', reward: 4200, xp: 680 },
  { level: 18, title: 'RECOVERY SPECIALIST', type: 'job', objective: 'Complete a Recovery Contract', job: 'recovery', reward: 4500, xp: 720 },
  { level: 19, title: 'FINAL CIRCUIT', type: 'race', objective: 'Finish the Time Trial', race: 'timetrial', reward: 5000, xp: 800 },
  { level: 20, title: 'KING OF NOVA CITY', type: 'drive', objective: 'Drive to Nova Tower and complete the 20-level campaign', dest: 'nova_tower', reward: 10000, xp: 1200 }
];

export function getCampaignMission(level) {
  return CAMPAIGN_MISSIONS.find(m => m.level === level) || null;
}

const DAILY_POOL = [
  { id:'distance', title:'ROAD WARRIOR', text:'Drive 5 km today', target:5, reward:1200, xp:160 },
  { id:'cash', title:'MONEY RUN', text:'Earn $2,500 today', target:2500, reward:1500, xp:180 },
  { id:'districts', title:'CITY EXPLORER', text:'Visit 3 different districts', target:3, reward:1400, xp:170 },
  { id:'speed', title:'SPEED DEMON', text:'Reach 160 KM/H', target:160, reward:1300, xp:170 }
];

function dateKey(date = new Date()) { return date.toISOString().slice(0,10); }
function hashDate(key) { let h=0; for (let i=0;i<key.length;i++) h=(h*31+key.charCodeAt(i))>>>0; return h; }
export function getDailyChallenge(date = new Date()) { return DAILY_POOL[hashDate(dateKey(date)) % DAILY_POOL.length]; }
export function getDailyDateKey(date = new Date()) { return dateKey(date); }
