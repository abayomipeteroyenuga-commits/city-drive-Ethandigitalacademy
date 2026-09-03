const THREEClamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * Keyboard-first input. Held-key state + one-shot presses + remapping.
 */

export const DEFAULT_BINDS = {
  accel: ['KeyW', 'ArrowUp'],
  brake: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  handbrake: ['Space'],
  nitro: ['ShiftLeft', 'ShiftRight'],
  camera: ['KeyC'],
  interact: ['KeyE'],
  headlights: ['KeyF'],
  horn: ['KeyH'],
  emote: ['KeyB'],
  map: ['KeyM'],
  garage: ['KeyG'],
  pause: ['Escape', 'KeyP'],
  jump: ['Space'],
  sprint: ['ControlLeft', 'ControlRight']
};

const GAME_CODES = new Set([
  'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'ShiftLeft', 'ShiftRight', 'Tab'
]);

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return !!el.isContentEditable;
}

export function loadBinds() {
  try {
    const raw = localStorage.getItem('citydrive_binds_v1');
    if (!raw) return { ...DEFAULT_BINDS };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ...DEFAULT_BINDS };
    const clean = {};
    for (const [action, defaults] of Object.entries(DEFAULT_BINDS)) {
      const value = parsed[action];
      clean[action] = Array.isArray(value) && value.every(v => typeof v === 'string') && value.length
        ? value.slice(0, 3)
        : [...defaults];
    }
    return clean;
  } catch {
    return { ...DEFAULT_BINDS };
  }
}

export function saveBinds(binds) {
  try { localStorage.setItem('citydrive_binds_v1', JSON.stringify(binds)); } catch {}
}

export function codeLabel(code) {
  return String(code)
    .replace('Key', '')
    .replace('Arrow', 'Arrow ')
    .replace('ShiftLeft', 'Left Shift')
    .replace('ShiftRight', 'Right Shift')
    .replace('Space', 'Space')
    .replace('Escape', 'Esc');
}

export class Input {
  constructor() {
    this.binds = loadBinds();
    this.held = new Set();
    this._pressed = new Set();
    this._consumed = new Set();
    this.gameplayEnabled = true;
    this.menuMode = false;
    this.remapAction = null;
    this.onMenuKey = null;

    this.accel = false;
    this.brake = false;
    this.left = false;
    this.right = false;
    this.handbrake = false;
    this.nitro = false;
    this.enter = false;
    this.camera = false;
    this.map = false;
    this.pause = false;
    this.garage = false;
    this.headlights = false;
    this.horn = false;
    this.emote = false;
    this.jump = false;
    this.sprint = false;
    this.gyroEnabled = false;
    this.gyroSteer = 0;
    this.gyroBaseline = null;
    this.mobileHeld = {};

    this.p2 = { accel: false, brake: false, left: false, right: false, handbrake: false, nitro: false };

    this._onDown = (e) => this._down(e);
    this._onUp = (e) => this._up(e);
    this._onBlur = () => this.clearGameplay();
    this._onVis = () => { if (document.hidden) this.clearGameplay(); };

    window.addEventListener('keydown', this._onDown);
    window.addEventListener('keyup', this._onUp);
    window.addEventListener('blur', this._onBlur);
    document.addEventListener('visibilitychange', this._onVis);
  }

  setBinds(binds) {
    this.binds = { ...DEFAULT_BINDS, ...binds };
    saveBinds(this.binds);
  }

  resetBinds() {
    this.setBinds({ ...DEFAULT_BINDS });
  }

  _matches(action, code) {
    const list = this.binds[action] || DEFAULT_BINDS[action] || [];
    return list.includes(code);
  }

  _down(e) {
    const code = e.code;
    if (this.remapAction) {
      e.preventDefault();
      if (code !== 'Escape') this._finishRemap(code);
      else this.remapAction = null;
      return;
    }

    if (isTypingTarget(e.target)) return;

    const panelOpen = !!document.getElementById('active-panel');
    const pauseOpen = document.getElementById('pause-menu') && !document.getElementById('pause-menu').classList.contains('hidden');
    const mainOpen = document.getElementById('main-menu') && !document.getElementById('main-menu').classList.contains('hidden');

    if (this._shouldPrevent(code) && !isTypingTarget(e.target)) e.preventDefault();

    if (e.repeat) {
      this.held.add(code);
      this._syncAxes();
      return;
    }

    this.held.add(code);
    this._pressed.add(code);

    if (panelOpen || pauseOpen || mainOpen) {
      this.gameplayEnabled = false;
      if (this.onMenuKey) this.onMenuKey(e);
      this._syncAxes();
      this.gameplayEnabled = !panelOpen && !pauseOpen && !mainOpen;
      return;
    }
    this.gameplayEnabled = true;

    this._syncAxes();
  }

  _up(e) {
    const code = e.code;
    this.held.delete(code);
    this._pressed.delete(code);
    this._consumed.delete(code);
    this._syncAxes();
  }

  _shouldPrevent(code) {
    if (GAME_CODES.has(code)) return true;
    for (const list of Object.values(this.binds)) {
      if (list.includes(code)) return true;
    }
    return false;
  }

  _syncAxes() {
    if (!this.gameplayEnabled || isTypingTarget(document.activeElement)) {
      this.accel = this.brake = this.left = this.right = false;
      this.handbrake = this.nitro = false;
      this.p2.accel = this.p2.brake = this.p2.left = this.p2.right = false;
      this.p2.handbrake = this.p2.nitro = false;
      return;
    }
    this.accel = this._heldAction('accel') || !!this.mobileHeld.accel;
    this.brake = this._heldAction('brake') || !!this.mobileHeld.brake;
    this.left = this._heldAction('left') || !!this.mobileHeld.left;
    this.right = this._heldAction('right') || !!this.mobileHeld.right;
    this.handbrake = this._heldAction('handbrake') || !!this.mobileHeld.handbrake;
    this.nitro = this._heldAction('nitro') || !!this.mobileHeld.nitro;
    this.enter = this._heldAction('interact');
    this.camera = this._heldAction('camera');
    this.map = this._heldAction('map');
    this.garage = this._heldAction('garage');
    this.pause = this._heldAction('pause');
    this.headlights = this._heldAction('headlights');
    this.horn = this._heldAction('horn');
    this.emote = this._heldAction('emote');
    this.jump = this._heldAction('jump');
    this.sprint = this._heldAction('sprint') || !!this.mobileHeld.sprint;

    this.p2.accel = this.held.has('KeyI');
    this.p2.brake = this.held.has('KeyK');
    this.p2.left = this.held.has('KeyJ');
    this.p2.right = this.held.has('KeyL');
    this.p2.nitro = this.held.has('KeyU');
    this.p2.handbrake = this.held.has('KeyO');
  }

  _heldAction(action) {
    const list = this.binds[action] || [];
    return list.some((c) => this.held.has(c));
  }

  _justPressedAction(action) {
    const list = this.binds[action] || [];
    for (const c of list) {
      if (this._pressed.has(c) && !this._consumed.has(c)) {
        this._consumed.add(c);
        return true;
      }
    }
    return false;
  }

  consume(action) {
    return this._justPressedAction(action);
  }

  consumeCamera() { return this.consume('camera'); }
  consumeEnter() { return this.consume('interact'); }
  consumePause() { return this.consume('pause'); }
  consumeMap() { return this.consume('map'); }
  consumeGarage() { return this.consume('garage'); }
  consumeHeadlights() { return this.consume('headlights'); }
  consumeHorn() { return this.consume('horn'); }
  consumeEmote() { return this.consume('emote'); }

  clearGameplay() {
    this.held.clear();
    this._pressed.clear();
    this._consumed.clear();
    this.accel = this.brake = this.left = this.right = false;
    this.handbrake = this.nitro = this.enter = this.camera = false;
    this.map = this.pause = this.garage = this.headlights = this.horn = this.emote = this.jump = false;
    this.sprint = false;
    this.mobileHeld = {};
    this.p2.accel = this.p2.brake = this.p2.left = this.p2.right = false;
    this.p2.handbrake = this.p2.nitro = false;
  }

  beginRemap(action) {
    this.remapAction = action;
  }

  _finishRemap(code) {
    const action = this.remapAction;
    this.remapAction = null;
    if (!action) return;
    const next = { ...this.binds, [action]: [code] };
    if (action === 'nitro') next.nitro = [code, code === 'ShiftLeft' ? 'ShiftRight' : code];
    this.setBinds(next);
    if (this.onRemap) this.onRemap(action, code);
  }

  async enableGyroscope() {
    if (!window.DeviceOrientationEvent) return false;
    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') return false;
      }
      if (!this._gyroBound) {
        this._gyroHandler = (e) => {
          let gamma = Number.isFinite(e.gamma) ? e.gamma : 0;
          if (screen.orientation?.type?.includes('landscape')) gamma *= -1;
          if (this.gyroBaseline == null) this.gyroBaseline = gamma;
          const delta = THREEClamp(gamma - this.gyroBaseline, -35, 35);
          this.gyroSteer = Math.max(-1, Math.min(1, delta / 22));
        };
        window.addEventListener('deviceorientation', this._gyroHandler, true);
        this._gyroBound = true;
      }
      this.gyroEnabled = true;
      return true;
    } catch { return false; }
  }

  disableGyroscope() { this.gyroEnabled = false; this.gyroSteer = 0; this.gyroBaseline = null; }

  bindMobile() {
    const hold = (id, prop) => {
      const el = document.getElementById(id);
      if (!el) return;
      const start = (e) => { e.preventDefault(); this.mobileHeld[prop] = true; el.classList.add('active'); };
      const end = (e) => { e.preventDefault(); this.mobileHeld[prop] = false; el.classList.remove('active'); };
      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchend', end);
      el.addEventListener('touchcancel', end);
      el.addEventListener('mousedown', start);
      el.addEventListener('mouseup', end);
      el.addEventListener('mouseleave', end);
    };
    hold('btn-accel', 'accel');
    hold('btn-brake', 'brake');
    hold('btn-left', 'left');
    hold('btn-right', 'right');
    hold('btn-handbrake', 'handbrake');
    hold('btn-nitro', 'nitro');
    hold('btn-sprint', 'sprint');
    const gyro = document.getElementById('btn-gyro');
    if (gyro) gyro.addEventListener('click', async () => {
      if (this.gyroEnabled) { this.disableGyroscope(); gyro.classList.remove('active'); gyro.textContent = 'GYRO'; }
      else { const ok = await this.enableGyroscope(); if (ok) { gyro.classList.add('active'); gyro.textContent = 'GYRO ✓'; } }
    });
    const em = document.getElementById('btn-emote');
    if (em) em.addEventListener('click', () => { this._fakePress('emote'); });
    const cam = document.getElementById('btn-camera');
    if (cam) cam.addEventListener('click', () => { this._fakePress('camera'); });
    const ex = document.getElementById('btn-exit');
    if (ex) ex.addEventListener('click', () => { this._fakePress('interact'); });
    const pause = document.getElementById('btn-pause-mobile');
    if (pause) pause.addEventListener('click', () => { this._fakePress('pause'); });
  }

  _fakePress(action) {
    const code = (this.binds[action] || ['KeyE'])[0];
    this.held.add(code);
    this._pressed.add(code);
    this._syncAxes();
    setTimeout(() => {
      this.held.delete(code);
      this._pressed.delete(code);
      this._consumed.delete(code);
      this._syncAxes();
    }, 80);
  }
}
