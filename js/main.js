import { UI } from './ui.js';
import { Game, hasSave } from './game.js';
import { VEHICLES } from './vehicles.js';

// Expose the authoritative 15-vehicle catalog to the non-module WOW menu.
window.VEHICLES = VEHICLES;

const ui = new UI();
let game = null;

function setProgress(p, t) { ui.setLoading(p, t); }

async function boot() {
  setProgress(35, 'Loading CITY DRIVE systems...');
  await tick();
  setProgress(55, 'Preparing vehicles...');
  await tick();
  setProgress(75, 'Preparing city...');
  await tick();
  setProgress(90, 'Starting game...');
  await tick();
  setProgress(100, 'Ready — Drive!');
  await tick(250);
  ui.hideLoading();
  wireMenu();
  wireMainMenuKeys();
  // Boot into the cinematic CITY DRIVE presentation; vehicle selection follows START CITY DRIVE.
  const first = ensureGame();
  if (window.CityDriveWowMenu) {
    const mm=document.getElementById('main-menu'); if(mm) mm.classList.add('hidden');
    const gc=document.getElementById('game-container'); if(gc) gc.classList.add('hidden');
    window.CityDriveWowMenu.open();
  } else first.enterWorld(true, { startGrid: true });
}

function wireMainMenuKeys() {
  const buttons = [...document.querySelectorAll('#main-menu .menu-btn')];
  let i = 0;
  const paint = () => buttons.forEach((b, n) => b.classList.toggle('selected', n === i));
  paint();
  window.addEventListener('keydown', (e) => {
    const menu = document.getElementById('main-menu');
    if (!menu || menu.classList.contains('hidden')) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') { i = (i + 1) % buttons.length; paint(); e.preventDefault(); }
    if (e.code === 'ArrowUp' || e.code === 'KeyW') { i = (i - 1 + buttons.length) % buttons.length; paint(); e.preventDefault(); }
    if (e.code === 'Enter') { buttons[i].click(); e.preventDefault(); }
    if (e.code === 'Tab') { i = (i + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length; paint(); e.preventDefault(); }
  });
}

function tick(ms = 80) {
  return new Promise(r => setTimeout(r, ms));
}

function ensureGame() {
  if (game) return game;
  const canvas = document.getElementById('game-canvas');
  game = new Game(canvas, ui);
  window.game = game;
  window.cityDriveGame = game;
  window.dispatchEvent(new CustomEvent("citydrive:game-ready"));
  wirePause(game);
  return game;
}

function wireMenu() {
  const cont = document.getElementById('btn-continue');
  if (!hasSave()) cont.style.opacity = '0.4';

  document.getElementById('btn-new-game').onclick = () => {
    const name = prompt('Driver name?', 'Driver') || 'Driver';
    if (hasSave() && !confirm('Start a NEW GAME? This resets saved progress.')) return;
    const g = ensureGame();
    g.startNew(name);
    g.enterWorld(true, { startGrid: true });
  };
  document.getElementById('btn-continue').onclick = () => {
    if (!hasSave()) { ui.toast('No save found'); return; }
    const g = ensureGame();
    g.continueGame();
    g.enterWorld(true, { startGrid: true });
  };

  // Every feature card on the landing page is a real working control.
  document.querySelectorAll('#main-menu [data-landing-action]').forEach((card) => {
    card.onclick = () => {
      const action = card.dataset.landingAction;
      const g = ensureGame();
      if (action === 'campaign') { ui.openJobs(g); return; }
      if (action === 'garage') { ui.openGarage(g); return; }
      if (action === 'races') { ui.openJobs(g); return; }
      if (action === 'drive') {
        if (window.CityDriveWowMenu) {
          document.getElementById('main-menu')?.classList.add('hidden');
          window.CityDriveWowMenu.open();
        } else {
          g.enterWorld(true, { startGrid: true });
        }
      }
    };
  });
}

function wirePause(g) {
  document.getElementById('btn-resume').onclick = () => {
    g.paused = false;
    document.getElementById('pause-menu').classList.add('hidden');
  };
  document.getElementById('btn-pause-map').onclick = () => ui.openMap(g);
  document.getElementById('btn-pause-garage').onclick = () => ui.openGarage(g);
  document.getElementById('btn-pause-market').onclick = () => ui.openMarketplace(g);
  document.getElementById('btn-pause-shop').onclick = () => ui.openShop(g);
  document.getElementById('btn-pause-ranking').onclick = () => ui.openRankings(g);
  document.getElementById('btn-pause-missions').onclick = () => ui.openJobs(g);
  document.getElementById('btn-pause-mp').onclick = () => ui.openMultiplayer(g);
  document.getElementById('btn-pause-settings').onclick = () => ui.openSettings(g);
  document.getElementById('btn-restart').onclick = () => {
    if (confirm('Restart current session from last save?')) g.continueGame();
    document.getElementById('pause-menu').classList.add('hidden');
  };
  document.getElementById('btn-main-menu').onclick = () => {
    g.paused = true;
    g.inMenu = true;
    document.getElementById('pause-menu').classList.add('hidden');
    document.getElementById('game-container').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    g.persist();
  };

}

boot().catch((err) => {
  console.error(err);
  ui.setLoading(100, 'Startup error');
  const box = document.getElementById('loading-screen');
  const text = document.getElementById('loading-text');
  if (text) text.innerHTML = 'CITY DRIVE could not start.<br><small>' + String(err?.message || err).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</small>';
  if (box) box.classList.remove('hidden');
});


/* Driving audio hooks added by audit patch */
(function(){
  let lastAudioTick = 0;
  function audioTick(now){
    if (now - lastAudioTick < 33) { requestAnimationFrame(audioTick); return; }
    lastAudioTick = now;
    try {
      if (!window.DriveAudio) return;
      const v = window.vehicle || window.car || window.playerCar || window.player;
      let speed = 0, throttle = 0, skid = false;
      if (v) {
        speed = Number(v.speed ?? v.velocity?.length?.() ?? 0) || 0;
        throttle = Number(v.throttle ?? v.acceleration ?? 0) || 0;
        skid = !!(v.skidding ?? v.isDrifting ?? v.handbrake);
      }
      window.DriveAudio.update(speed, throttle, skid);
    } catch(e) {}
    requestAnimationFrame(audioTick);
  }
  requestAnimationFrame(audioTick);
  window.addEventListener('keydown', e => { if (e.code === 'Space' || e.key.toLowerCase() === 'h') window.DriveAudio && window.DriveAudio.horn(); });
})();
