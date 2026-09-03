/** CITY DRIVE — career ranking, offline-first and online-ready */
const KEY = 'citydrive_rankings_v1';

export function getCareerScore(state) {
  const p = state.player || {};
  return Math.max(0, Math.round((p.xp||0) + (p.missionsCompleted||0)*900 + (p.racesWon||0)*1200 + (p.jobsCompleted||0)*250 + (p.distanceDriven||0)*12 + Math.min(100000, p.money||0)/100));
}
export function getRankTier(score) {
  if (score >= 60000) return 'GLOBAL LEGEND';
  if (score >= 35000) return 'ELITE DRIVER';
  if (score >= 18000) return 'PRO DRIVER';
  if (score >= 8000) return 'RISING STAR';
  return 'ROOKIE';
}
export function loadLocalRanks() {
  try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch { return []; }
}
export function saveLocalRank(state) {
  try {
    const p = state.player || {}; const score = getCareerScore(state);
    const id = state._rankId || ('driver_' + Math.random().toString(36).slice(2,10)); state._rankId = id;
    const a = loadLocalRanks().filter(x => x && x.id !== id);
    a.push({id, name:String(p.name||'Driver').slice(0,24), score, level:p.level||1, wins:p.racesWon||0, missions:p.missionsCompleted||0, updated:Date.now()});
    a.sort((x,y)=>y.score-x.score); a.splice(50);
    localStorage.setItem(KEY, JSON.stringify(a)); return a;
  } catch { return []; }
}
export function getLocalRank(state) {
  const a = saveLocalRank(state); const score=getCareerScore(state); const idx=a.findIndex(x=>x.id===state._rankId); return {position:idx+1,total:a.length,score,tier:getRankTier(score),leaders:a};
}

export async function syncGlobalRank(state) {
  const p = state.player || {};
  const score = getCareerScore(state);
  const id = state._rankId || ('driver_' + Math.random().toString(36).slice(2,10));
  state._rankId = id;
  const payload = { id, name:String(p.name||'Driver').slice(0,24), score, level:p.level||1, wins:p.racesWon||0, missions:p.missionsCompleted||0 };
  try {
    const res = await fetch('./api/leaderboard', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload), cache:'no-store' });
    if (!res.ok) throw new Error('leaderboard unavailable');
    const data = await res.json();
    if (!data?.ok || !Array.isArray(data.drivers)) throw new Error('invalid leaderboard');
    return { online:true, drivers:data.drivers, position:Number(data.position)||0, score, tier:getRankTier(score) };
  } catch {
    const local=getLocalRank(state);
    return { online:false, drivers:local.leaders, position:local.position, score, tier:local.tier };
  }
}
