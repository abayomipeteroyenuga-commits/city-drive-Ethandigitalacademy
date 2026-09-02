/**
 * CITY DRIVE — Player XP / Levels
 */

export const LEVELS = [
  { level: 1, name: 'New Driver', xp: 0 },
  { level: 2, name: 'Learner', xp: 200 },
  { level: 3, name: 'City Driver', xp: 500 },
  { level: 4, name: 'Skilled Driver', xp: 1000 },
  { level: 5, name: 'Professional', xp: 1800 },
  { level: 6, name: 'Expert', xp: 2800 },
  { level: 7, name: 'Elite', xp: 4200 },
  { level: 8, name: 'Master', xp: 6000 },
  { level: 9, name: 'Legend', xp: 8500 },
  { level: 10, name: 'City Champion', xp: 12000 }
];

export function xpForLevel(level) {
  const row = LEVELS.find(l => l.level === level);
  return row ? row.xp : 0;
}

export function levelFromXp(xp) {
  let lvl = 1;
  for (const row of LEVELS) {
    if (xp >= row.xp) lvl = row.level;
  }
  return lvl;
}

export function levelName(level) {
  return LEVELS.find(l => l.level === level)?.name || 'Driver';
}

export function xpProgress(xp) {
  const level = levelFromXp(xp);
  const current = xpForLevel(level);
  const nextRow = LEVELS.find(l => l.level === level + 1);
  if (!nextRow) return { level, pct: 100, toNext: 0 };
  const span = nextRow.xp - current;
  const into = xp - current;
  return { level, pct: Math.min(100, (into / span) * 100), toNext: nextRow.xp - xp };
}
