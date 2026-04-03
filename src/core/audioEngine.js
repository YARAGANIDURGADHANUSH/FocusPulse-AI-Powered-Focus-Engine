const WAVETYPES = {
  alpha: { base: 10, type: 'sine' },
  beta: { base: 18, type: 'sine' },
  theta: { base: 6, type: 'sine' },
  gamma: { base: 40, type: 'sine' },
};

export default class AudioEngine {
  constructor({ masterGain = 0.14 } = {}) {
    this.audioCtx = null;
    this.oscLeft = null;
    this.oscRight = null;
    this.gain = null;
    this.currentMode = 'alpha';
    this.isRunning = false;
    this.masterGain = masterGain;
  }

  initialize() {
    if (this.audioCtx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContext();
    this.gain = this.audioCtx.createGain();
    this.gain.gain.value = 0;
    this.gain.connect(this.audioCtx.destination);
  }

  start(mode = 'alpha') {
    this.initialize();
    if (this.isRunning) {
      this.setMode(mode);
      return;
    }

    const profile = WAVETYPES[mode] || WAVETYPES.alpha;
    this.oscLeft = this.audioCtx.createOscillator();
    this.oscRight = this.audioCtx.createOscillator();

    this.oscLeft.type = profile.type;
    this.oscRight.type = profile.type;

    this.oscLeft.frequency.setValueAtTime(220, this.audioCtx.currentTime);
    this.oscRight.frequency.setValueAtTime(220 + profile.base, this.audioCtx.currentTime);

    this.oscLeft.connect(this.gain);
    this.oscRight.connect(this.gain);

    this.gain.gain.value = 0.001;
    this.gain.gain.exponentialRampToValueAtTime(this.masterGain, this.audioCtx.currentTime + 1);

    this.oscLeft.start();
    this.oscRight.start();
    this.isRunning = true;
    this.currentMode = mode;
  }

  setMode(mode) {
    if (!this.isRunning) return;
    this.currentMode = mode;
    const profile = WAVETYPES[mode] || WAVETYPES.alpha;
    this.oscRight.frequency.setValueAtTime(220 + profile.base, this.audioCtx.currentTime);
  }

  stop() {
    if (!this.isRunning) return;
    this.gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.8);
    setTimeout(() => {
      if (this.oscLeft) this.oscLeft.stop();
      if (this.oscRight) this.oscRight.stop();
      this.isRunning = false;
    }, 900);
  }
}
