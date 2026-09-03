
/* City Drive - procedural driving audio upgrade */
(function () {
  const DriveAudio = {
    ctx: null, master: null, engine: null, skid: null, started: false,
    start() {
      if (this.started) {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.16;
      this.master.connect(this.ctx.destination);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      gain.gain.value = 0.0001;
      osc.connect(gain).connect(this.master);
      osc.start();
      this.engine = { osc, gain };

      const skidOsc = this.ctx.createBufferSource();
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 1, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      skidOsc.buffer = buffer; skidOsc.loop = true;
      const skidGain = this.ctx.createGain(); skidGain.gain.value = 0.0001;
      const filter = this.ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1600;
      skidOsc.connect(filter).connect(skidGain).connect(this.master);
      skidOsc.start();
      this.skid = skidGain;
      this.started = true;
    },
    update(speed, throttle, skidding) {
      if (!this.started || !this.ctx) return;
      const s = Math.max(0, Math.min(1, Math.abs(speed) / 30));
      const th = Math.max(0, Math.min(1, throttle || 0));
      const now = this.ctx.currentTime;
      this.engine.osc.frequency.setTargetAtTime(65 + s * 150 + th * 90, now, 0.04);
      this.engine.gain.gain.setTargetAtTime(0.015 + s * 0.055 + th * 0.045, now, 0.05);
      this.skid.gain.setTargetAtTime(skidding ? 0.07 : 0.0001, now, 0.03);
    },
    horn() {
      if (!this.started || !this.ctx) return;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'square'; o.frequency.value = 440; g.gain.value = 0.0001;
      o.connect(g).connect(this.master);
      const n = this.ctx.currentTime;
      g.gain.exponentialRampToValueAtTime(0.07, n + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, n + 0.25);
      o.start(n); o.stop(n + 0.27);
    }
  };
  window.DriveAudio = DriveAudio;
  const unlock = () => DriveAudio.start();
  ['pointerdown','keydown','touchstart'].forEach(e => window.addEventListener(e, unlock, {once:false, passive:true}));
})();
