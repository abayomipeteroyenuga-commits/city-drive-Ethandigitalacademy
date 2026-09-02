/**
 * CITY DRIVE — Web Audio (procedural, no external files required)
 */

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.engineOsc = null;
    this.engineGain = null;
    this.musicOsc = [];
    this.enabled = true;
    this.musicOn = true;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.8;
    this.sfxGain.connect(this.master);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.12;
    this.musicGain.connect(this.master);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0;
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 40;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);
    this.engineOsc.start();
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  setVolumes(sfx, music, musicOn) {
    if (!this.sfxGain) return;
    this.sfxGain.gain.value = sfx;
    this.musicGain.gain.value = musicOn ? music * 0.15 : 0;
    this.musicOn = musicOn;
  }

  updateEngine(speedKmh, throttle, inVehicle) {
    if (!this.engineOsc) return;
    if (!inVehicle) {
      this.engineGain.gain.value = 0;
      return;
    }
    const rpm = 40 + speedKmh * 1.8 + throttle * 30;
    this.engineOsc.frequency.setTargetAtTime(rpm, this.ctx.currentTime, 0.08);
    this.engineGain.gain.setTargetAtTime(0.04 + throttle * 0.08 + speedKmh * 0.0004, this.ctx.currentTime, 0.1);
  }

  beep(freq = 440, dur = 0.12, type = 'square', vol = 0.08) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g);
    g.connect(this.sfxGain);
    o.start();
    o.stop(this.ctx.currentTime + dur);
  }

  uiClick() { this.beep(660, 0.06, 'square', 0.05); }
  checkpoint() { this.beep(880, 0.15, 'triangle', 0.08); }
  success() { this.beep(523, 0.1); setTimeout(() => this.beep(659, 0.1), 90); setTimeout(() => this.beep(784, 0.18), 180); }
  fail() { this.beep(180, 0.25, 'sawtooth', 0.08); }
  collision() { this.beep(90, 0.2, 'sawtooth', 0.12); }
  sirenTick(on) {
    if (!on) return;
    this.beep(740, 0.15, 'square', 0.04);
  }
}
