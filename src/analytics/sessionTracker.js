export default class SessionTracker {
  constructor() {
    this.startTime = null;
    this.endTime = null;
    this.duration = 0;
    this.focusSamples = [];
    this.distractionEvents = [];
  }

  start() {
    this.startTime = Date.now();
    this.focusSamples = [];
    this.distractionEvents = [];
    this.endTime = null;
  }

  stop() {
    this.endTime = Date.now();
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }

  addFocusSample(value) {
    this.focusSamples.push({ timestamp: Date.now(), value });
  }

  addDistraction(reason) {
    this.distractionEvents.push({ timestamp: Date.now(), reason });
  }

  summary() {
    const total = this.focusSamples.reduce((acc, item) => acc + item.value, 0);
    const avgFocus = this.focusSamples.length ? Math.round(total / this.focusSamples.length) : 0;
    const streak = this.calculateBestStreak(70);

    return {
      duration: this.duration,
      averageFocus: avgFocus,
      distractions: this.distractionEvents.length,
      distractionFrequency: this.distractionEvents.length > 0 ? Number((this.distractionEvents.length / Math.max(1, this.duration)).toFixed(3)) : 0,
      bestStreak: streak,
      samples: this.focusSamples.length,
    };
  }

  calculateBestStreak(minValue) {
    let best = 0;
    let current = 0;
    for (const sample of this.focusSamples) {
      if (sample.value >= minValue) {
        current += 1;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    }
    return best;
  }
}
