export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.musicTimer = null;
    this.musicPlaying = false;
    this.muted = false;
  }

  init() {
    if (this.audioContext) {
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    this.audioContext = new AudioContextClass();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.16;
    this.masterGain.connect(this.audioContext.destination);
  }

  ensureStarted() {
    this.init();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.16;
    }
  }

  playSfx(type) {
    if (this.muted) {
      return;
    }

    this.ensureStarted();
    if (!this.audioContext || !this.masterGain) {
      return;
    }

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    oscillator.connect(gain);
    gain.connect(this.masterGain);

    const settings = {
      jump: { frequency: 660, duration: 0.12, type: 'triangle', gain: 0.06 },
      punch: { frequency: 540, duration: 0.08, type: 'square', gain: 0.05 },
      hit: { frequency: 180, duration: 0.16, type: 'sawtooth', gain: 0.08 },
      dash: { frequency: 880, duration: 0.12, type: 'sine', gain: 0.06 },
      menu: { frequency: 520, duration: 0.06, type: 'triangle', gain: 0.03 }
    }[type];

    if (!settings) {
      return;
    }

    oscillator.type = settings.type;
    oscillator.frequency.setValueAtTime(settings.frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(settings.frequency * 0.8, now + settings.duration);

    gain.gain.setValueAtTime(settings.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + settings.duration);

    oscillator.start(now);
    oscillator.stop(now + settings.duration + 0.01);
  }

  playMusic() {
    if (this.musicPlaying || this.muted) {
      return;
    }

    this.ensureStarted();
    if (!this.audioContext || !this.masterGain) {
      return;
    }

    this.musicPlaying = true;
    const notes = [220, 330, 392, 330];
    let step = 0;

    const loop = () => {
      if (!this.musicPlaying || this.muted) {
        return;
      }

      const now = this.audioContext.currentTime;
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(notes[step % notes.length], now);
      gain.gain.setValueAtTime(0.012, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      oscillator.connect(gain);
      gain.connect(this.masterGain);
      oscillator.start(now);
      oscillator.stop(now + 0.55);

      step += 1;
      this.musicTimer = window.setTimeout(loop, 650);
    };

    loop();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }
}
