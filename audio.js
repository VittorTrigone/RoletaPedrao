/**
 * Web Audio API Sound Generator for Rossi Tattoo Raffle Roulette
 * 100% procedural - zero external mp3 files, zero loading issues on GitHub Pages!
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.initOnFirstInteraction();
  }

  initOnFirstInteraction() {
    const unlock = () => {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Mechanical ratchet click when the roulette peg passes the flipper
   * @param {number} speedRatio 0 to 1 indicating wheel rotation speed
   */
  playTick(speedRatio = 1) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Sharp transient click
      osc.type = 'triangle';
      // Pitch shifts slightly with speed
      const baseFreq = 700 + Math.random() * 200 + speedRatio * 300;
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.025);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200 + speedRatio * 800, t);
      filter.Q.setValueAtTime(3.0, t);

      // Volume envelope
      const vol = Math.min(0.35, 0.15 + speedRatio * 0.2);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.035);
    } catch (e) {
      // Audio fallback silent
    }
  }

  /**
   * Tension sub-bass whoosh when the spin starts
   */
  playSpinStart() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.exponentialRampToValueAtTime(280, t + 0.6);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, t);
      filter.frequency.linearRampToValueAtTime(1400, t + 0.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.85);
    } catch (e) {}
  }

  /**
   * Dramatic victory fanfare with chords, sparkling shimmer, and sub impact
   */
  playWinnerFanfare() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;

      // 1. Sub Bass Impact
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(150, t);
      sub.frequency.exponentialRampToValueAtTime(40, t + 0.7);
      subGain.gain.setValueAtTime(0.5, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(t);
      sub.stop(t + 0.85);

      // 2. Victorious Major Arpeggio / Chords (Electric Brass/Synth)
      // Notes: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      const notes = [
        { freq: 440, delay: 0 },       // A4
        { freq: 554.37, delay: 0.12 },  // C#5
        { freq: 659.25, delay: 0.24 },  // E5
        { freq: 880, delay: 0.36 },     // A5 (triumph climax)
        { freq: 1108.73, delay: 0.42 }  // C#6 sparkle
      ];

      notes.forEach(({ freq, delay }) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const f = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t + delay);

        f.type = 'lowpass';
        f.frequency.setValueAtTime(2500, t + delay);
        f.frequency.exponentialRampToValueAtTime(800, t + delay + 1.2);

        g.gain.setValueAtTime(0.001, t + delay);
        g.gain.linearRampToValueAtTime(0.18, t + delay + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, t + delay + 1.4);

        osc.connect(f);
        f.connect(g);
        g.connect(this.ctx.destination);

        osc.start(t + delay);
        osc.stop(t + delay + 1.5);
      });

      // 3. Shimmer sparkles (Trophy chime)
      for (let i = 0; i < 6; i++) {
        const chime = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        const chimeTime = t + 0.5 + i * 0.12;
        chime.type = 'sine';
        chime.frequency.setValueAtTime(1400 + i * 220, chimeTime);

        chimeGain.gain.setValueAtTime(0.08, chimeTime);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, chimeTime + 0.4);

        chime.connect(chimeGain);
        chimeGain.connect(this.ctx.destination);

        chime.start(chimeTime);
        chime.stop(chimeTime + 0.45);
      }
    } catch (e) {}
  }

  /**
   * UI button click feedback
   */
  playButtonTap() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.05);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.07);
    } catch (e) {}
  }
}

// Global instance
window.soundEngine = new SoundEngine();
