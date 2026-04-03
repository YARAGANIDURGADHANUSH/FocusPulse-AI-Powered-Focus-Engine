export default class SessionTracker {
  constructor() {
    this.startTime = null;
    this.endTime = null;
    this.duration = 0;
    this.focusSamples = [];
    this.distractionEvents = [];
    this.eyeMetrics = [];
    this.faceStabilityMetrics = [];
  }

  start() {
    this.startTime = Date.now();
    this.focusSamples = [];
    this.distractionEvents = [];
    this.eyeMetrics = [];
    this.faceStabilityMetrics = [];
    this.endTime = null;
  }

  stop() {
    this.endTime = Date.now();
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }

  addFocusSample(value) {
    this.focusSamples.push({ timestamp: Date.now(), value });
  }

  addEyeMetrics(eyeData) {
    this.eyeMetrics.push({ timestamp: Date.now(), ...eyeData });
  }

  addFaceStability(stability) {
    this.faceStabilityMetrics.push({ timestamp: Date.now(), stability });
  }

  addDistraction(reason) {
    this.distractionEvents.push({ timestamp: Date.now(), reason });
  }

  summary() {
    const total = this.focusSamples.reduce((acc, item) => acc + item.value, 0);
    const avgFocus = this.focusSamples.length ? Math.round(total / this.focusSamples.length) : 0;
    const streak = this.calculateBestStreak(70);

    const avgEyeFocus = this.eyeMetrics.length
      ? Math.round(this.eyeMetrics.reduce((acc, item) => acc + item.eyeFocusScore, 0) / this.eyeMetrics.length)
      : 0;

    const avgStability = this.faceStabilityMetrics.length
      ? Math.round(this.faceStabilityMetrics.reduce((acc, item) => acc + item.stability * 100, 0) / this.faceStabilityMetrics.length)
      : 0;

    const avgGazeStability = this.eyeMetrics.length
      ? Math.round(this.eyeMetrics.reduce((acc, item) => acc + item.gazeStability, 0) / this.eyeMetrics.length)
      : 0;

    const avgBlinkRate = this.eyeMetrics.length
      ? Math.round(this.eyeMetrics.reduce((acc, item) => acc + item.blinkRate, 0) / this.eyeMetrics.length)
      : 0;

    const blinkQualities = this.eyeMetrics.map(m => m.blinkQuality);
    const blinkQuality = blinkQualities.length > 0 
      ? blinkQualities.sort((a, b) => blinkQualities.filter(v => v === a).length - blinkQualities.filter(v => v === b).length).pop()
      : 'unknown';

    return {
      duration: this.duration,
      averageFocus: avgFocus,
      averageEyeFocus: avgEyeFocus,
      averageStability: avgStability,
      averageGazeStability: avgGazeStability,
      averageBlinkRate: avgBlinkRate,
      blinkQuality,
      distractions: this.distractionEvents.length,
      distractionFrequency: this.distractionEvents.length > 0 ? Number((this.distractionEvents.length / Math.max(1, this.duration)).toFixed(3)) : 0,
      bestStreak: streak,
      samples: this.focusSamples.length,
      eyeMetricsSamples: this.eyeMetrics.length,
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
