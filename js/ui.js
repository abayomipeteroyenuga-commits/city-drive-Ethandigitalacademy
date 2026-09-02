import { Input } from './controls.js';
import { VEHICLES, getVehicleById, cloneVehicle } from './vehicles.js';
import { ACHIEVEMENT_DEFS } from './achievements.js';
import { levelName, xpProgress } from './progression.js';
import { Settings } from './settings.js';
import { POIS, DISTRICTS, LANDMARKS } from './world.js';
import { makeRoomCode } from './multiplayer.js';
import { DEFAULT_BINDS, codeLabel } from './controls.js';

export class UI {
  constructor() {
    this.input = new Input();
    this.input.bindMobile();
    this.toastTimer = null;
  }

  $(id) { return document.getElementById(id); }

  setLoading(pct, text) {
    const fill = this.$('progress-fill');
    const t = this.$('loading-text');
    if (fill) fill.style.width = pct + '%';
    if (t && text) t.textContent = text;
  }

  hideLoading() {
    this.$('loading-screen').classList.add('hidden');
    this.$('main-menu').classList.remove('hidden');
  }

  showGame() {
    this.$('main-menu').classList.add('hidden');
    this.$('loading-screen').classList.add('hidden');
    this.$('game-container').classList.remove('hidden');
    if (window.innerWidth <= 600) this.$('mobile-controls').classList.remove('hidden');
  }

  toast(msg) {
    const el = this.$('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    el.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.add('hidden'), 2800);
  }

  prompt(text) {
    const el = this.$('prompt');
    if (!text) { el.classList.add('hidden'); return; }
    el.textContent = text;
    el.classList.remove('hidden');
  }

  updateHUD(game) {
    const v = game.controller?.def;
    const kmh = game.controller ? Math.abs(game.controller.speed) * 3.6 : 0;
    this.$('speed-num').textContent = String(Math.round(kmh)).padStart(3, '0');
    this.$('gear-display').textContent = game.controller?.gear || 'P';
    this.$('rpm-fill').style.width = ((game.controller?.rpm || 0) * 100) + '%';
    const fuelPct = v ? Math.round(((v.currentFuel || 0) / v.fuelCapacity) * 100) : 0;
    const cond = v ? Math.round(v.currentCondition ?? 100) : 100;
    this.$('fuel-bar').style.width = fuelPct + '%';
    this.$('fuel-pct').textContent = fuelPct + '%';
    this.$('cond-bar').style.width = cond + '%';
    this.$('cond-pct').textContent = cond + '%';
    const nitro = game.controller ? (game.controller.nitroAmount / Math.max(1, v.nitroCapacity || 1)) * 100 : 0;
    this.$('nitro-bar').style.width = Math.max(0, nitro) + '%';
    this.$('money-display').textContent = game.economy.format();
    const stars = Math.round(game.npc.wanted);
    this.$('wanted-stars').textContent = stars ? '★'.repeat(stars) : '';
    this.$('level-display').textContent = 'LVL ' + game.state.player.level;

    const mp = this.$('mission-panel');
    if (game.activeMission) {
      mp.classList.remove('hidden');
      this.$('mission-title').textContent = game.activeMission.name;
      if (game.activeMission.kind === 'job') {
        const p = game.controller?.mesh.position || game.playerMesh.position;
        const d = Math.hypot(p.x - game.activeMission.dest.x, p.z - game.activeMission.dest.z);
        this.$('mission-objective').textContent = 'Go to ' + game.activeMission.dest.name;
        this.$('mission-distance').textContent = (d / 10).toFixed(1) + ' km';
      } else {
        this.$('mission-objective').textContent = `Checkpoint ${game.activeMission.index + 1}/${game.activeMission.checkpoints.length}`;
        this.$('mission-distance').textContent = '';
      }
    } else mp.classList.add('hidden');

    const board = this.$('mp-board');
    if (board) {
      if (game.mp?.active) {
        const rows = game.mp.standings();
        board.classList.remove('hidden');
        board.innerHTML = `<strong>RACE ${game.mp.room ? '· ' + game.mp.room : 'LOCAL'}</strong>` +
          rows.map((r, i) => `<div class="${r.you ? 'you' : ''}">${i + 1}. ${r.name}  CP ${r.cp}</div>`).join('');
      } else {
        board.classList.add('hidden');
      }
    }
  }

  drawMinimap(game) {
    const c = this.$('minimap');
    if (!c) return;
    const ctx = c.getContext('2d');
    const w = c.width, h = c.height;
    ctx.fillStyle = '#122018';
    ctx.fillRect(0, 0, w, h);
    const pos = game.mode === 'driving' && game.controller ? game.controller.mesh.position : game.playerMesh.position;
    const scale = 0.28;
    const sx = (x) => w / 2 + (x - pos.x) * scale;
    const sy = (z) => h / 2 + (z - pos.z) * scale;
    ctx.strokeStyle = '#445';
    ctx.lineWidth = 2;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(sx(i * 80), sy(-360)); ctx.lineTo(sx(i * 80), sy(360)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx(-360), sy(i * 80)); ctx.lineTo(sx(360), sy(i * 80)); ctx.stroke();
    }
    ctx.fillStyle = '#ff66aa';
    POIS.dealerships.forEach(p => { ctx.fillRect(sx(p.x) - 2, sy(p.z) - 2, 4, 4); });
    ctx.fillStyle = '#00d4ff';
    ctx.fillRect(sx(POIS.garage.x) - 2, sy(POIS.garage.z) - 2, 4, 4);
    ctx.fillStyle = '#ffaa00';
    POIS.fuel.forEach(p => ctx.fillRect(sx(p.x) - 2, sy(p.z) - 2, 4, 4));
    if (game.activeMission?.dest) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(sx(game.activeMission.dest.x), sy(game.activeMission.dest.z), 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#00ff9d';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  openPanel(title, html) {
    const root = this.$('ui-panels');
    root.innerHTML = `
      <div class="panel" id="active-panel">
        <div class="panel-header">
          <h2>${title}</h2>
          <button class="panel-close" id="panel-close">✕</button>
        </div>
        <div class="panel-body">${html}</div>
      </div>`;
    this.$('panel-close').onclick = () => this.closePanel();
    this._focusMenuItems();
  }

  closePanel() {
    this.$('ui-panels').innerHTML = '';
    this.input.gameplayEnabled = true;
    this.input.clearGameplay();
  }

  offerTestDriveReturn(game, catalogId) {
    const v = getVehicleById(catalogId);
    if (!v) return;
    this.openPanel('TEST DRIVE COMPLETE', `
      <h3>${v.name}</h3>
      <p class="price">${game.economy.format(v.price)}</p>
      <button class="menu-btn primary" id="td-buy">BUY VEHICLE</button>
      <button class="menu-btn" id="td-back">RETURN</button>
    `);
    this.$('td-buy').onclick = () => { if (game.buyVehicle(catalogId)) this.closePanel(); };
    this.$('td-back').onclick = () => this.openDealership(game, { name: 'Dealership', stock: null });
  }

  togglePause(game) {
    if (document.getElementById('active-panel')) {
      this.closePanel();
      return;
    }
    game.paused = !game.paused;
    this.$('pause-menu').classList.toggle('hidden', !game.paused);
    if (game.paused) this.input.clearGameplay();
  }

  _focusMenuItems() {
    const items = [...document.querySelectorAll('#active-panel .menu-btn, #active-panel .vehicle-card, #main-menu .menu-btn')];
    if (!items.length) return;
    let i = 0;
    const apply = () => {
      items.forEach((el, n) => el.classList.toggle('selected', n === i));
      items[i].scrollIntoView({ block: 'nearest' });
    };
    apply();
    this.input.onMenuKey = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return;
      if (e.code === 'Escape') { this.closePanel(); e.preventDefault(); return; }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { i = (i + 1) % items.length; apply(); e.preventDefault(); }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { i = (i - 1 + items.length) % items.length; apply(); e.preventDefault(); }
      if (e.code === 'Tab') { i = (i + (e.shiftKey ? -1 : 1) + items.length) % items.length; apply(); e.preventDefault(); }
      if (e.code === 'Enter') {
        const el = items[i];
        const btn = el.matches('button') ? el : el.querySelector('button');
        if (btn) btn.click();
        else el.click();
        e.preventDefault();
      }
    };
  }

  openGarage(game) {
    const g = game.state.garage;
    const owned = (g.vehicles || []).filter(v => v && v.isOwned !== false && !v.isTestDrive);
    const cards = owned.map((v, i) => `
      <div class="vehicle-card" data-i="${i}" data-uid="${v.vehicleUid}">
        <h3>${v.name} <span style="color:#8ab;font-size:.8rem">${v.manufacturer}</span></h3>
        <div class="price">Condition ${Math.round(v.currentCondition || 100)}% · Fuel ${Math.round((v.currentFuel / v.fuelCapacity) * 100)}% · ${Math.round(v.currentMileage || 0)} km</div>
        <div class="stats">
          <div>Top ${v.topSpeed} km/h</div><div>Accel ${v.acceleration}s</div>
          <div>Handling ${v.handling}</div><div>Off-road ${v.offroad}</div>
        </div>
        <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
          <button class="menu-btn" data-act="drive" data-i="${i}" data-uid="${v.vehicleUid}">DRIVE</button>
          <button class="menu-btn" data-act="upgrade" data-i="${i}" data-uid="${v.vehicleUid}">UPGRADE</button>
          <button class="menu-btn" data-act="paint" data-i="${i}" data-uid="${v.vehicleUid}">PAINT</button>
          <button class="menu-btn" data-act="sell" data-i="${i}" data-uid="${v.vehicleUid}">SELL</button>
        </div>
      </div>`).join('');
    this._garageIndex = 0;
    this.openPanel(`MY GARAGE  ${owned.length}/${g.capacity}`, `
      <p style="margin-bottom:12px">${game.economy.format()} · Level ${game.state.player.level} ${levelName(game.state.player.level)}</p>
      <p style="color:#8aa;font-size:.8rem;margin-bottom:8px">↑↓ select · E drive · C paint · U upgrade · R repair · F refuel · S sell · Esc close</p>
      <button class="menu-btn primary" id="btn-expand">EXPAND GARAGE</button>
      ${cards || '<p>No vehicles</p>'}
    `);
    this.$('btn-expand').onclick = () => { game.expandGarage(); this.openGarage(game); };
    const prevMenu = this.input.onMenuKey;
    this.input.onMenuKey = (e) => {
      if (e.target && e.target.tagName === 'INPUT') return;
      const n = owned.length;
      if (e.code === 'ArrowRight' || e.code === 'ArrowDown') this._garageIndex = Math.min(n - 1, (this._garageIndex || 0) + 1);
      if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') this._garageIndex = Math.max(0, (this._garageIndex || 0) - 1);
      const v = owned[this._garageIndex || 0];
      if (!v) { if (prevMenu) prevMenu(e); return; }
      if (e.code === 'KeyE' || e.code === 'Enter') {
        const actor = game.findActorByUid(v.vehicleUid);
        this.closePanel();
        if (actor) game.enterVehicle(actor);
        return;
      }
      if (e.code === 'KeyC') {
        const colors = [0x4488cc, 0xcc3344, 0x111111, 0xffffff, 0xffaa00, 0x22aa66, 0x7b5cff];
        game.paintVehicle(v, colors[Math.floor(Math.random() * colors.length)]);
      }
      if (e.code === 'KeyU') this.openUpgrades(game, v);
      if (e.code === 'KeyR') {
        if (game.controller && game.controller.def === v) game._repair();
        else { v.currentCondition = 100; game.persist(); this.toast('Repaired ' + v.name); this.openGarage(game); }
      }
      if (e.code === 'KeyF') {
        v.currentFuel = v.fuelCapacity;
        game.persist();
        this.toast('Refueled ' + v.name);
        this.openGarage(game);
      }
      if (e.code === 'KeyS') {
        if (confirm('Sell this vehicle?')) { game.sellVehicleByUid(v.vehicleUid); this.openGarage(game); }
      }
      if (prevMenu) prevMenu(e);
    };
    this.$('ui-panels').querySelectorAll('[data-act]').forEach(btn => {
      btn.onclick = () => {
        const uid = btn.dataset.uid || owned[+btn.dataset.i]?.vehicleUid;
        const v = owned.find(x => x.vehicleUid === uid) || owned[+btn.dataset.i];
        const act = btn.dataset.act;
        if (act === 'drive') {
          const actor = v ? game.findActorByUid(v.vehicleUid) : null;
          this.closePanel();
          if (actor) game.enterVehicle(actor);
        } else if (act === 'sell') {
          if (v && confirm('Sell this vehicle?')) { game.sellVehicleByUid(v.vehicleUid); this.openGarage(game); }
        } else if (act === 'upgrade') { if (v) this.openUpgrades(game, v); }
        else if (act === 'paint') {
          const colors = [0x4488cc, 0xcc3344, 0x111111, 0xffffff, 0xffaa00, 0x22aa66, 0x7b5cff];
          if (v) game.paintVehicle(v, colors[Math.floor(Math.random() * colors.length)]);
        }
      };
    });
  }

  openUpgrades(game, v) {
    const parts = ['engine', 'transmission', 'tires', 'brakes', 'suspension', 'nitro', 'fuelSystem'];
    const rows = parts.map(p => {
      const lvl = v.upgrades?.[p] || 0;
      return `<div class="vehicle-card"><strong>${p}</strong> Lv ${lvl}/5
        <button class="menu-btn" data-part="${p}">UPGRADE</button></div>`;
    }).join('');
    this.openPanel('UPGRADES — ' + v.name, rows + '<button class="menu-btn" id="back-g">BACK</button>');
    this.$('ui-panels').querySelectorAll('[data-part]').forEach(b => {
      b.onclick = () => { game.upgradeVehicle(v, b.dataset.part); this.openUpgrades(game, v); };
    });
    this.$('back-g').onclick = () => this.openGarage(game);
  }

  openDealership(game, dealer) {
    const ids = dealer.stock || VEHICLES.map(v => v.id);
    const stock = ids.map(id => getVehicleById(id)).filter(Boolean);
    const cards = stock.map(v => `
      <div class="vehicle-card">
        <h3>${v.name}</h3>
        <div class="price">${game.economy.format(v.price)} · Lvl ${v.requiredLevel} · ${v.tier}</div>
        <p style="font-size:.85rem;color:#9aa;margin:6px 0">${v.description}</p>
        <div class="stats">
          <div>Speed ${v.topSpeed}<div class="stat-bar"><div style="width:${v.topSpeed/3.3}%"></div></div></div>
          <div>Handling ${v.handling}<div class="stat-bar"><div style="width:${v.handling}%"></div></div></div>
          <div>Accel ${v.acceleration}s</div>
          <div>Off-road ${v.offroad}</div>
        </div>
        <button class="menu-btn primary" data-buy="${v.id}">BUY VEHICLE</button>
      </div>`).join('');
    this._dealIndex = 0;
    this.openPanel(dealer.name || 'DEALERSHIP', `<p style="color:#8aa;font-size:.8rem;margin-bottom:8px">← → browse · Enter select · B buy · T test drive · Esc exit</p>` + cards);
    this.$('ui-panels').querySelectorAll('[data-buy]').forEach(b => {
      b.onclick = () => {
        if (game.buyVehicle(b.dataset.buy)) this.closePanel();
      };
    });
    const prev = this.input.onMenuKey;
    this.input.onMenuKey = (e) => {
      if (e.target && e.target.tagName === 'INPUT') return;
      if (e.code === 'ArrowRight' || e.code === 'ArrowDown') this._dealIndex = Math.min(stock.length - 1, (this._dealIndex || 0) + 1);
      if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') this._dealIndex = Math.max(0, (this._dealIndex || 0) - 1);
      const v = stock[this._dealIndex || 0];
      if (e.code === 'KeyB' || e.code === 'Enter') {
        if (v && game.buyVehicle(v.id)) this.closePanel();
        return;
      }
      if (e.code === 'KeyT' && v) {
        this.closePanel();
        this.toast('Test drive: ' + v.name + ' — 45s');
        game.startTestDrive(v);
      }
      if (prev) prev(e);
    };
  }

  openMarketplace(game) {
    const used = VEHICLES.slice(0, 8).map((v, i) => {
      const cond = 50 + ((i * 17) % 45);
      const miles = 8000 + i * 4300;
      const price = Math.round(v.price * 0.55 * (cond / 100));
      return { ...v, cond, miles, usedPrice: price };
    });
    const cards = used.map(v => `
      <div class="vehicle-card">
        <h3>${v.name} <em style="color:#c84">USED</em></h3>
        <div class="price">${game.economy.format(v.usedPrice)} · Cond ${v.cond}% · ${v.miles} km</div>
        <button class="menu-btn primary" data-used="${v.id}" data-price="${v.usedPrice}" data-cond="${v.cond}" data-miles="${v.miles}">BUY USED</button>
      </div>`).join('');
    this.openPanel('VEHICLE MARKETPLACE', cards);
    this.$('ui-panels').querySelectorAll('[data-used]').forEach(b => {
      b.onclick = () => {
        const base = getVehicleById(b.dataset.used);
        const price = +b.dataset.price;
        if (!game.economy.canAfford(price)) { this.toast('INSUFFICIENT FUNDS'); return; }
        if (game.state.garage.vehicles.length >= game.state.garage.capacity) { this.toast('Garage full'); return; }
        game.economy.spend(price);
        const owned = cloneVehicle(base, {
          currentCondition: +b.dataset.cond,
          currentMileage: +b.dataset.miles,
          currentFuel: base.fuelCapacity * 0.6
        });
        game.state.garage.vehicles.push(owned);
        game.flags.purchased = true;
        game._spawnOwnedVehicles();
        game.persist();
        this.toast('Purchased used ' + base.name);
        this.closePanel();
      };
    });
  }

  openJobs(game) {
    const cards = POIS.jobs.map(j => `
      <div class="vehicle-card">
        <h3>${j.name}</h3>
        <p>Drive to the ${j.name} marker in the city and press E.</p>
        <button class="menu-btn" data-job="${j.type}">SET GPS</button>
      </div>`).join('');
    this.openPanel('JOBS', cards);
    this.$('ui-panels').querySelectorAll('[data-job]').forEach(b => {
      b.onclick = () => {
        const j = POIS.jobs.find(x => x.type === b.dataset.job);
        this.toast('GPS set: ' + j.name);
        game.activeMission = { kind: 'job', type: j.type, name: j.name, dest: { name: j.name, x: j.x, z: j.z }, startDamage: 100, startTime: performance.now(), dist: 1 };
        this.closePanel();
      };
    });
  }

  openRaces(game) {
    const cards = POIS.races.map(r => `
      <div class="vehicle-card">
        <h3>${r.name}</h3>
        <button class="menu-btn primary" data-race="${r.id}">START RACE</button>
      </div>`).join('');
    this.openPanel('RACES', cards);
    this.$('ui-panels').querySelectorAll('[data-race]').forEach(b => {
      b.onclick = () => {
        const r = POIS.races.find(x => x.id === b.dataset.race);
        this.closePanel();
        game.startRace(r);
      };
    });
  }

  openMap(game) {
    const items = [
      ...POIS.dealerships.map(d => `${d.name}`),
      ...LANDMARKS.map(l => l.name),
      ...DISTRICTS.map(d => d.name)
    ];
    this._mapZoom = this._mapZoom || 1;
    this.openPanel('NOVA CITY MAP', `
      <p>You are in ${game.world.getDistrict(
        (game.controller?.mesh || game.playerMesh).position.x,
        (game.controller?.mesh || game.playerMesh).position.z
      ).name}</p>
      <p style="margin-top:8px;color:#9aa">Landmarks</p>
      <ul style="line-height:1.7" id="map-list">${LANDMARKS.map((l, i) => `<li data-mx="${l.x}" data-mz="${l.z}">${l.name}</li>`).join('')}</ul>
      <p style="color:#8aa;font-size:.8rem;margin-top:8px">↑↓ cursor · Enter set GPS · +/- zoom hint · Esc close · M close</p>
    `);
    let idx = 0;
    const lis = [...document.querySelectorAll('#map-list li')];
    const paint = () => lis.forEach((li, n) => li.style.color = n === idx ? '#00d4ff' : '');
    paint();
    const prev = this.input.onMenuKey;
    this.input.onMenuKey = (e) => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { idx = Math.min(lis.length - 1, idx + 1); paint(); }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { idx = Math.max(0, idx - 1); paint(); }
      if (e.code === 'Equal' || e.code === 'NumpadAdd') this._mapZoom = Math.min(2, (this._mapZoom || 1) + 0.1);
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') this._mapZoom = Math.max(0.5, (this._mapZoom || 1) - 0.1);
      if (e.code === 'Enter') {
        const li = lis[idx];
        if (li) {
          game.activeMission = {
            kind: 'job', type: 'gps', name: 'GPS', dest: { name: li.textContent, x: +li.dataset.mx, z: +li.dataset.mz },
            startDamage: 100, startTime: performance.now(), dist: 1
          };
          this.toast('GPS: ' + li.textContent);
          this.closePanel();
        }
      }
      if (e.code === 'KeyM') this.closePanel();
      if (prev) prev(e);
    };
  }

  openMultiplayer(game) {
    const room = game.mp.room || '';
    this.openPanel('MULTIPLAYER RACE', `
      <p style="margin-bottom:12px;color:#9aa">Same keyboard, two browser tabs, or another device on PeerJS.</p>
      <button class="menu-btn primary" id="mp-local">LOCAL 2 PLAYER</button>
      <button class="menu-btn" id="mp-host">HOST ROOM</button>
      <div class="vehicle-card">
        <label>Join code
          <input id="mp-code" value="${room}" maxlength="8" style="margin:8px;padding:8px;background:#111;color:#fff;border:1px solid #456;letter-spacing:.2em;text-transform:uppercase;width:140px"/>
        </label>
        <button class="menu-btn primary" id="mp-join">JOIN ROOM</button>
      </div>
      <button class="menu-btn" id="mp-start">START MP RACE</button>
      <button class="menu-btn" id="mp-leave">LEAVE SESSION</button>
      <p id="mp-status" style="margin-top:12px;color:#00d4ff">${game.mp.active ? (game.mp.mode === 'local' ? 'Local 2P active' : 'Room ' + game.mp.room + ' · ' + game.mp.role) : 'Not connected'}</p>
      <p style="color:#8aa;font-size:.85rem;margin-top:8px">P1: WASD · P2: IJKL · U nitro · O handbrake<br/>Online: open two windows, Host in one, Join with the code in the other.</p>
    `);
    this.$('mp-local').onclick = () => {
      game.mp.startLocal();
      if (game.mode !== 'driving' && game.vehicleActors[0]) game.enterVehicle(game.vehicleActors[0]);
      this.toast('Player 2 spawned');
      this.closePanel();
    };
    this.$('mp-host').onclick = async () => {
      const code = await game.mp.hostRoom(this.$('mp-code').value || makeRoomCode());
      this.$('mp-code').value = code;
      this.$('mp-status').textContent = 'Hosting room ' + code + ' — share this code';
      this.toast('Room ' + code);
    };
    this.$('mp-join').onclick = async () => {
      try {
        await game.mp.joinRoom(this.$('mp-code').value);
        this.$('mp-status').textContent = 'Joined ' + game.mp.room;
        this.toast('Joined ' + game.mp.room);
      } catch (e) {
        this.toast(e.message || 'Join failed');
      }
    };
    this.$('mp-start').onclick = () => {
      if (game.mode !== 'driving' && game.vehicleActors[0]) game.enterVehicle(game.vehicleActors[0]);
      game.startRace({ id: 'multiplayer', name: 'Multiplayer Race', x: 10, z: 60 }, { multiplayer: true });
      this.closePanel();
    };
    this.$('mp-leave').onclick = () => {
      game.mp.end();
      this.toast('Left multiplayer');
      this.closePanel();
    };
  }

  openAchievements(game) {
    const u = game.state.achievements || {};
    const html = ACHIEVEMENT_DEFS.map(a => `
      <div class="vehicle-card" style="opacity:${u[a.id] ? 1 : 0.45}">
        <h3>${u[a.id] ? '✓ ' : ''}${a.name}</h3>
        <p style="color:#9aa;font-size:.85rem">${a.desc}</p>
      </div>`).join('');
    this.openPanel('ACHIEVEMENTS', html);
  }

  openProfile(game) {
    const p = game.state.player;
    const prog = xpProgress(p.xp);
    this.openPanel('PROFILE', `
      <h3>${p.name}</h3>
      <p>Level ${p.level} — ${levelName(p.level)}</p>
      <p>XP ${p.xp} (${prog.toNext} to next)</p>
      <p>Money ${game.economy.format()}</p>
      <p>Vehicles ${game.state.garage.vehicles.length}/${game.state.garage.capacity}</p>
      <p>Jobs ${p.jobsCompleted} · Races won ${p.racesWon}</p>
      <p>Distance ${p.distanceDriven.toFixed(1)} km</p>
      <label>Change name <input id="rename" value="${p.name}" style="margin:8px;padding:6px;background:#111;color:#fff;border:1px solid #456"/></label>
      <button class="menu-btn" id="save-name">SAVE NAME</button>
    `);
    this.$('save-name').onclick = () => {
      p.name = this.$('rename').value || p.name;
      game.persist();
      this.toast('Name saved');
    };
  }

  openSettings(game) {
    const s = Settings.data;
    this.openPanel('SETTINGS', `
      <div class="vehicle-card">Graphics
        <select id="set-gfx">${['low','medium','high','ultra'].map(q => `<option ${s.graphics===q?'selected':''}>${q}</option>`).join('')}</select>
      </div>
      <div class="vehicle-card">Sound <input type="range" id="set-sfx" min="0" max="1" step="0.05" value="${s.soundVolume}"></div>
      <div class="vehicle-card">Music <input type="range" id="set-mus" min="0" max="1" step="0.05" value="${s.musicVolume}">
        <label><input type="checkbox" id="set-muson" ${s.musicOn?'checked':''}> On</label>
      </div>
      <div class="vehicle-card">Weather
        <button class="menu-btn" data-w="clear">CLEAR</button>
        <button class="menu-btn" data-w="cloudy">CLOUDY</button>
        <button class="menu-btn" data-w="rain">RAIN</button>
      </div>
      <h3 style="margin:16px 0 8px;color:#00d4ff">CONTROLS</h3>
      <p style="color:#8aa;font-size:.8rem">Click a bind, then press a key. Saved in LocalStorage.</p>
      <div id="bind-list"></div>
      <button class="menu-btn" id="reset-binds">RESET DEFAULT BINDS</button>
    `);
    const renderBinds = () => {
      const box = this.$('bind-list');
      const actions = Object.keys(DEFAULT_BINDS);
      box.innerHTML = actions.map(a => `
        <div class="vehicle-card" style="display:flex;justify-content:space-between;align-items:center">
          <span>${a.toUpperCase()}</span>
          <button class="menu-btn" data-bind="${a}">${(this.input.binds[a] || []).map(codeLabel).join(' / ')}</button>
        </div>`).join('');
      box.querySelectorAll('[data-bind]').forEach(b => {
        b.onclick = () => {
          b.textContent = 'Press a key…';
          this.input.onRemap = () => { this.input.onRemap = null; renderBinds(); };
          this.input.beginRemap(b.dataset.bind);
        };
      });
    };
    renderBinds();
    this.$('reset-binds').onclick = () => { this.input.resetBinds(); renderBinds(); this.toast('Binds reset'); };
    this.$('set-gfx').onchange = (e) => { Settings.set('graphics', e.target.value); if (game) Settings.applyGraphics(game.renderer, game.scene); };
    this.$('set-sfx').oninput = (e) => { Settings.set('soundVolume', +e.target.value); game?.audio.setVolumes(Settings.get('soundVolume'), Settings.get('musicVolume'), Settings.get('musicOn')); };
    this.$('set-mus').oninput = (e) => { Settings.set('musicVolume', +e.target.value); game?.audio.setVolumes(Settings.get('soundVolume'), Settings.get('musicVolume'), Settings.get('musicOn')); };
    this.$('set-muson').onchange = (e) => { Settings.set('musicOn', e.target.checked); game?.audio.setVolumes(Settings.get('soundVolume'), Settings.get('musicVolume'), Settings.get('musicOn')); };
    this.$('ui-panels').querySelectorAll('[data-w]').forEach(b => b.onclick = () => {
      if (!game) { this.toast('Start a game before changing weather'); return; }
      game.setWeather(b.dataset.w);
    });
  }

  openHowTo() {
    this.openPanel('HOW TO PLAY', `
      <p>Start with the Metro S and $12,500 City Cash.</p>
      <p>Keyboard-first: hold W to accelerate, A/D to steer, S to brake. Combos like W+A and W+Shift work.</p>
      <p>Walk with WASD. Shift run. Space jump. E enter/exit. F lights. H horn. M map. G garage. P or Esc pause.</p>
      <p>Complete jobs (green markers) and races (red) to earn money and XP.</p>
      <p>Buy vehicles at dealerships (pink). Store them in the garage (cyan).</p>
      <p>Refuel at yellow stations. Repair at the green repair center.</p>
      <p>Upgrades actually change acceleration, grip, brakes, nitro and fuel use.</p>
      <p>Reckless driving raises stars — police will chase you.</p>
      <p>Multiplayer: LOCAL 2P (IJKL) or HOST/JOIN a room code. Two tabs on the same site can race immediately.</p>
    `);
  }

  openCredits() {
    this.openPanel('CREDITS', `
      <p><strong>CITY DRIVE</strong></p>
      <p>Original open-world vehicle life game.</p>
      <p>Built with Three.js, WebGL, Web Audio and LocalStorage.</p>
      <p>Fictional manufacturers, vehicles and Nova City.</p>
      <p>No copyrighted brands or music.</p>
    `);
  }
}


