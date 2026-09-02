import { loadSettings, saveSettings } from './save.js';

export const Settings = {
  data: loadSettings(),

  get(key) {
    return this.data[key];
  },

  set(key, value) {
    this.data[key] = value;
    saveSettings(this.data);
  },

  applyGraphics(renderer, scene) {
    const q = this.data.graphics;
    const map = { low: 0.6, medium: 0.85, high: 1.0, ultra: 1.25 };
    const pixel = map[q] || 0.85;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio * pixel, 2));
    if (scene) {
      scene.fog.far = q === 'low' ? 280 : q === 'medium' ? 420 : q === 'high' ? 560 : 720;
    }
  }
};
