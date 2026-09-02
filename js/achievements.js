/**
 * CITY DRIVE — Achievements
 */

export const ACHIEVEMENT_DEFS = [
  { id: 'first_ride', name: 'First Ride', desc: 'Drive a vehicle for the first time.' },
  { id: 'first_job', name: 'First Job', desc: 'Complete your first job.' },
  { id: 'first_race', name: 'First Race', desc: 'Finish your first race.' },
  { id: 'first_purchase', name: 'First Vehicle Purchase', desc: 'Buy a vehicle from a dealership.' },
  { id: 'first_upgrade', name: 'First Upgrade', desc: 'Install a performance upgrade.' },
  { id: 'first_win', name: 'First Win', desc: 'Win a race.' },
  { id: 'speed_demon', name: 'Speed Demon', desc: 'Reach 200 km/h.' },
  { id: 'clean_driver', name: 'Clean Driver', desc: 'Complete a job with no damage.' },
  { id: 'collector', name: 'Vehicle Collector', desc: 'Own 5 vehicles.' },
  { id: 'bike_rider', name: 'Bike Rider', desc: 'Ride a motorcycle.' },
  { id: 'offroad_master', name: 'Off-Road Master', desc: 'Complete an off-road contract.' },
  { id: 'night_driver', name: 'Night Driver', desc: 'Drive at night.' },
  { id: 'rain_driver', name: 'Rain Driver', desc: 'Drive in the rain.' },
  { id: 'explorer', name: 'Explorer', desc: 'Visit 6 city districts.' },
  { id: 'pro_driver', name: 'Professional Driver', desc: 'Reach level 5.' },
  { id: 'garage_owner', name: 'Garage Owner', desc: 'Expand the garage.' },
  { id: 'luxury_owner', name: 'Luxury Owner', desc: 'Own the Royal Executive or Vortex X.' },
  { id: 'race_champion', name: 'Race Champion', desc: 'Win 5 races.' },
  { id: 'long_distance', name: 'Long Distance', desc: 'Drive 50 km total.' },
  { id: 'city_legend', name: 'City Legend', desc: 'Reach level 10.' }
];

export function checkAchievements(state, flags) {
  const unlocked = state.achievements || {};
  const newly = [];

  function unlock(id) {
    if (!unlocked[id]) {
      unlocked[id] = Date.now();
      newly.push(ACHIEVEMENT_DEFS.find(a => a.id === id));
    }
  }

  if (flags.drove) unlock('first_ride');
  if (state.player.jobsCompleted >= 1) unlock('first_job');
  if (flags.raced) unlock('first_race');
  if (flags.purchased) unlock('first_purchase');
  if (flags.upgraded) unlock('first_upgrade');
  if (state.player.racesWon >= 1) unlock('first_win');
  if (flags.speed200) unlock('speed_demon');
  if (flags.cleanJob) unlock('clean_driver');
  if ((state.garage?.vehicles?.length || 0) >= 5) unlock('collector');
  if (flags.bike) unlock('bike_rider');
  if (flags.offroadJob) unlock('offroad_master');
  if (flags.night) unlock('night_driver');
  if (flags.rain) unlock('rain_driver');
  if ((state.visitedDistricts || []).length >= 6) unlock('explorer');
  if (state.player.level >= 5) unlock('pro_driver');
  if ((state.garage?.capacity || 5) > 5) unlock('garage_owner');
  if ((state.garage?.vehicles || []).some(v => v.id === 'royal_executive' || v.id === 'vortex_x')) unlock('luxury_owner');
  if (state.player.racesWon >= 5) unlock('race_champion');
  if ((state.player.distanceDriven || 0) >= 50) unlock('long_distance');
  if (state.player.level >= 10) unlock('city_legend');

  state.achievements = unlocked;
  return newly;
}
