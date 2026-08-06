/**
 * js/audio.js
 * Synthesizes chess game sound effects using the browser's Web Audio API.
 * This guarantees a custom, royalty-free audio experience with no external assets.
 */

class AudioSynth {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API is not supported in this browser.", e);
    }
  }

  setEnabled(val) {
    this.enabled = !!val;
    if (this.enabled && !this.ctx) {
      this.init();
    }
  }

  // Soft envelope setup helper
  createOscillator(type, freq, startTime, duration, startVol = 0.1, endVol = 0) {
    if (!this.ctx) this.init();
    if (!this.ctx || this.ctx.state === 'suspended') return null;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(startVol, startTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(endVol, 0.0001), startTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    return { osc, gain };
  }

  playMove() {
    if (!this.enabled) return;
    try {
      this.init();
      const now = this.ctx.currentTime;
      // Single warm wood knock: Sine wave dropping from 250Hz to 120Hz
      const sound = this.createOscillator('triangle', 250, now, 0.12, 0.15, 0.001);
      if (!sound) return;

      sound.osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
      sound.osc.start(now);
      sound.osc.stop(now + 0.12);
    } catch (e) {
      console.error(e);
    }
  }

  playCapture() {
    if (!this.enabled) return;
    try {
      this.init();
      const now = this.ctx.currentTime;
      // Sharp friction capture: Noise-like double crisp frequencies
      const s1 = this.createOscillator('triangle', 380, now, 0.15, 0.2, 0.001);
      const s2 = this.createOscillator('sawtooth', 180, now + 0.03, 0.12, 0.1, 0.001);

      if (s1) {
        s1.osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        s1.osc.start(now);
        s1.osc.stop(now + 0.15);
      }
      if (s2) {
        s2.osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
        s2.osc.start(now + 0.03);
        s2.osc.stop(now + 0.15);
      }
    } catch (e) {
      console.error(e);
    }
  }

  playCheck() {
    if (!this.enabled) return;
    try {
      this.init();
      const now = this.ctx.currentTime;
      // High warning alert: Two rapid alternating tones (C6 then Eb6)
      const s1 = this.createOscillator('sine', 1046.50, now, 0.15, 0.15, 0.001);
      const s2 = this.createOscillator('sine', 1244.51, now + 0.08, 0.25, 0.15, 0.001);

      if (s1) {
        s1.osc.start(now);
        s1.osc.stop(now + 0.15);
      }
      if (s2) {
        s2.osc.start(now + 0.08);
        s2.osc.stop(now + 0.33);
      }
    } catch (e) {
      console.error(e);
    }
  }

  playCheckmate() {
    if (!this.enabled) return;
    try {
      this.init();
      const now = this.ctx.currentTime;
      // Low descending victory/defeat triad: minor major transition
      const f1 = this.createOscillator('triangle', 330, now, 0.2, 0.15, 0.001); // E4
      const f2 = this.createOscillator('triangle', 261.63, now + 0.15, 0.25, 0.15, 0.001); // C4
      const f3 = this.createOscillator('sawtooth', 164.81, now + 0.3, 0.6, 0.15, 0.001); // E3

      if (f1) { f1.osc.start(now); f1.osc.stop(now + 0.2); }
      if (f2) { f2.osc.start(now + 0.15); f2.osc.stop(now + 0.4); }
      if (f3) { f3.osc.start(now + 0.3); f3.osc.stop(now + 0.9); }
    } catch (e) {
      console.error(e);
    }
  }

  playButtonClick() {
    if (!this.enabled) return;
    try {
      this.init();
      const now = this.ctx.currentTime;
      // Tiny subtle tick
      const sound = this.createOscillator('sine', 600, now, 0.04, 0.12, 0.001);
      if (!sound) return;

      sound.osc.start(now);
      sound.osc.stop(now + 0.04);
    } catch (e) {
      console.error(e);
    }
  }
}

export const audio = new AudioSynth();
export default audio;
