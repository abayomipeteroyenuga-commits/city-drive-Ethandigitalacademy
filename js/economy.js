/**
 * CITY DRIVE — Economy System
 */

export class Economy {
  constructor(initialMoney = 20000) {
    this.money = initialMoney;
  }

  canAfford(amount) {
    return this.money >= amount;
  }

  spend(amount, reason = '') {
    if (!this.canAfford(amount)) return false;
    this.money = Math.max(0, Math.round(this.money - amount));
    return true;
  }

  earn(amount, reason = '') {
    this.money = Math.round(this.money + amount);
    return this.money;
  }

  getMoney() {
    return this.money;
  }

  format(amount = this.money) {
    return '$' + amount.toLocaleString('en-US');
  }
}

/** Job base rewards (scaled by distance, performance, vehicle) */
export const JOB_REWARDS = {
  delivery: { base: 180, xp: 25 },
  taxi: { base: 220, xp: 30 },
  food: { base: 150, xp: 20 },
  truck: { base: 350, xp: 45 },
  bus: { base: 480, xp: 55 },
  vip: { base: 400, xp: 50 },
  recovery: { base: 300, xp: 40 },
  offroad: { base: 280, xp: 40 }
};

export function calculateJobPayout(jobType, distanceKm, timeBonus = 1, damagePenalty = 1, vehicleBonus = 1) {
  const base = JOB_REWARDS[jobType]?.base || 150;
  const distFactor = Math.max(0.6, Math.min(2.5, distanceKm / 2.5));
  return Math.round(base * distFactor * timeBonus * damagePenalty * vehicleBonus);
}
