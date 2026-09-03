/**
 * CITY DRIVE — Procedural Web Audio
 * Offline-safe: no external audio files or CDN dependencies.
 *
 * Audio is created lazily and unlocked from a real user gesture so it works
 * reliably in Chrome/Edge/Firefox/Safari, including mobile browsers.
 */

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.engineGain = null;
    this.engineOsc = null;
    this.engineHarmonic = null;
    this.engineNoise = null;
    this.engineFilter = null;
    this.engineNoiseGain = null;
    this.musicTimer = null;
    this.musicStep = 0;
    this.musicOn = true;
    this.enabled = true;
    this.lastEngineWasBike = false;
    this.unlocked = false;
    this._unlockBound = false;
  }

  init() {
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      this.enabled = false;
      return false;
    }

    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.78;
      this.sfxGain.connect(this.master);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0;
      this.musicGain.connect(this.master);

      // Layered engine: low rumble + harmonic + filtered intake/exhaust noise.
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;
      this.engineGain.connect(this.sfxGain);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.value = 520;
      this.engineFilter.Q.value = 0.55;
      this.engineFilter.connect(this.engineGain);

      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'triangle';
      this.engineOsc.frequency.value = 45;
      this.engineOsc.connect(this.engineFilter);
      this.engineOsc.start();

      this.engineHarmonic = this.ctx.createOscillator();
      this.engineHarmonic.type = 'sine';
      this.engineHarmonic.frequency.value = 90;
      const harmonicGain = this.ctx.createGain();
      harmonicGain.gain.value = 0.10;
      this.engineHarmonic.connect(harmonicGain);
      harmonicGain.connect(this.engineFilter);
      this.engineHarmonic.start();

      // Short, looping noise buffer is much cheaper than creating a new source per frame.
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.7;
      this.engineNoise = this.ctx.createBufferSource();
      this.engineNoise.buffer = buffer;
      this.engineNoise.loop = true;
      this.engineNoiseGain = this.ctx.createGain();
      this.engineNoiseGain.gain.value = 0;
      // Noise source retained only for compatibility; it is disconnected from the engine mix.
      this.engineNoise.start();

      // Browser autoplay policy: retry the unlock on a real interaction.
      if (!this._unlockBound) {
        const unlock = () => this.resume();
        ['pointerdown', 'touchstart', 'keydown'].forEach(type =>
          window.addEventListener(type, unlock, { passive: true })
        );
        this._unlockBound = true;
      }
      return true;
    } catch (err) {
      console.warn('CITY DRIVE audio unavailable:', err);
      this.ctx = null;
      this.enabled = false;
      return false;
    }
  }

  async resume() {
    if (!this.init()) return false;
    try {
      if (this.ctx.state !== 'running') await this.ctx.resume();
      this.unlocked = this.ctx.state === 'running';
      if (this.unlocked) this._startMusic();
      return this.unlocked;
    } catch (err) {
      // Browser may reject resume until another user gesture. The bound gesture
      // listeners above will retry automatically.
      this.unlocked = false;
      return false;
    }
  }

  _target(param, value, time, smooth = 0.05) {
    if (!param) return;
    if (typeof param.setTargetAtTime === 'function') param.setTargetAtTime(value, time, smooth);
    else param.value = value;
  }

  setVolumes(sfx = 0.8, music = 0.5, musicOn = true) {
    this.musicOn = !!musicOn;
    if (!this.ctx || !this.sfxGain || !this.musicGain) return;
    const now = this.ctx.currentTime;
    this._target(this.sfxGain.gain, Math.max(0, Number(sfx) || 0), now, 0.03);
    this._target(this.musicGain.gain, this.musicOn ? Math.max(0, Number(music) || 0) * 0.22 : 0, now, 0.08);
    if (this.musicOn) this._startMusic();
    else this._stopMusic();
  }

  _startMusic() {
    if (!this.ctx || this.ctx.state !== 'running' || !this.musicOn || this.musicTimer) return;
    // Original synth driving groove. No copyrighted audio and no network request.
    const notes = [220, 261.63, 329.63, 293.66, 246.94, 293.66, 349.23, 329.63, 392.00, 349.23, 293.66, 261.63];
    this.musicStep = 0;
    const tick = () => {
      this.musicTimer = null;
      if (!this.ctx || this.ctx.state !== 'running' || !this.musicOn) return;
      const f = notes[this.musicStep++ % notes.length];
      this._musicNote(f, 0.20, 0.055);
      if (this.musicStep % 2 === 0) this._musicNote(f * 2, 0.09, 0.018);
      if (this.musicStep % 4 === 0) this._musicNote(f / 2, 0.35, 0.025);
      this.musicTimer = window.setTimeout(tick, 430);
    };
    tick();
  }

  _stopMusic() {
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  _musicNote(freq, dur, vol) {
    if (!this.ctx || !this.musicGain || !this.musicOn || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    o.type = 'triangle';
    o.frequency.setValueAtTime(freq, now);
    filter.type = 'lowpass';
    filter.frequency.value = 1100;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), now + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.04, dur));
    o.connect(filter);
    filter.connect(g);
    g.connect(this.musicGain);
    o.start(now);
    o.stop(now + Math.max(0.04, dur) + 0.03);
  }

  updateEngine(speedKmh = 0, throttle = 0, inVehicle = false, vehicleDef = null) {
    if (!this.ctx || !this.engineOsc || !this.engineGain || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    if (!inVehicle || !vehicleDef) {
      this._target(this.engineGain.gain, 0, now, 0.08);
      return;
    }

    const bike = !!vehicleDef.isMotorcycle;
    const topSpeed = Math.max(80, Number(vehicleDef.topSpeed) || 160);
    const normalized = Math.min(1.5, Math.max(0, Math.abs(Number(speedKmh) || 0) / topSpeed));
    const load = Math.min(1, Math.max(0, Number(throttle) || 0));
    const idle = bike ? 68 : 48;
    const revRange = bike ? 285 : 190;
    const rpm = idle + normalized * revRange + load * (bike ? 95 : 65);

    // Clean, restrained engine: a soft low-frequency tone with almost no upper
    // harmonics. No white-noise layer is mixed into the vehicle sound.
    const targetHz = (bike ? 62 : 42) + normalized * (bike ? 105 : 72) + load * (bike ? 28 : 20);
    this._target(this.engineOsc.frequency, targetHz, now, 0.14);
    this._target(this.engineHarmonic.frequency, targetHz * (bike ? 1.65 : 1.5), now, 0.16);
    this._target(this.engineFilter.frequency, (bike ? 620 : 430) + normalized * 520 + load * 180, now, 0.16);
    this._target(this.engineNoiseGain.gain, 0, now, 0.08);

    // Keep the engine subtle so it never overwhelms music, UI or ambient sound.
    const volume = (bike ? 0.010 : 0.007) + normalized * (bike ? 0.016 : 0.012) + load * (bike ? 0.018 : 0.014);
    this._target(this.engineGain.gain, Math.min(0.055, volume), now, 0.14);
    this.lastEngineWasBike = bike;
  }

  beep(freq = 440, dur = 0.12, type = 'square', vol = 0.08) {
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(20, freq), now);
    g.gain.setValueAtTime(Math.max(0.0001, vol), now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.03, dur));
    o.connect(g);
    g.connect(this.sfxGain);
    o.start(now);
    o.stop(now + Math.max(0.03, dur));
  }

  uiClick() { this.beep(660, 0.06, 'square', 0.05); }
  checkpoint() { this.beep(880, 0.15, 'triangle', 0.08); }
  success() { this.beep(523, 0.1); setTimeout(() => this.beep(659, 0.1), 90); setTimeout(() => this.beep(784, 0.18), 180); }
  fail() { this.beep(180, 0.25, 'sawtooth', 0.08); }
  collision() { this.beep(90, 0.2, 'sawtooth', 0.12); }
  sirenTick(on) { if (on) this.beep(740, 0.15, 'square', 0.04); }
}
