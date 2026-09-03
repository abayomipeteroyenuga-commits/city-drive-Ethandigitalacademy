// CITY DRIVE — lightweight global leaderboard endpoint.
// For durable production storage, connect this handler to a persistent KV/Redis
// provider. The in-memory store still lets multiple active clients compete while
// a server instance is warm, and the game always falls back safely offline.
let board = globalThis.__CITY_DRIVE_BOARD__ || (globalThis.__CITY_DRIVE_BOARD__ = []);

function cleanName(value) {
  return String(value || 'Driver').replace(/[<>]/g, '').trim().slice(0, 24) || 'Driver';
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok:true, drivers: board.slice(0, 50) });
  }
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed' });
  try {
    const b = req.body || {};
    const score = Number(b.score);
    if (!Number.isFinite(score) || score < 0 || score > 1000000000) return res.status(400).json({ ok:false, error:'Invalid score' });
    const id = String(b.id || '').slice(0, 80);
    if (!id) return res.status(400).json({ ok:false, error:'Missing driver id' });
    const row = { id, name:cleanName(b.name), score:Math.round(score), level:Math.max(1, Math.min(100, Number(b.level)||1)), wins:Math.max(0, Number(b.wins)||0), missions:Math.max(0, Number(b.missions)||0) };
    board = board.filter(x => x.id !== id);
    board.push(row);
    board.sort((a,b) => b.score - a.score);
    board = board.slice(0, 50);
    globalThis.__CITY_DRIVE_BOARD__ = board;
    return res.status(200).json({ ok:true, drivers:board, position:board.findIndex(x=>x.id===id)+1 });
  } catch (e) {
    return res.status(400).json({ ok:false, error:'Invalid request' });
  }
}
