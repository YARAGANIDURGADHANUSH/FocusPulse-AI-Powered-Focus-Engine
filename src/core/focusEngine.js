export default class FocusEngine {
  constructor({ base = 50, faceWeight = 0.35, stabilityWeight = 0.35, durationWeight = 0.15, distractionWeight = 0.15 }) {
    this.base = base;
    this.weights = { face: faceWeight, stability: stabilityWeight, duration: durationWeight, distraction: distractionWeight };
    this.sessionSeconds = 0;
    this.distractions = 0;
    this.highestStreak = 0;
    this.currentStreak = 0;
    this.lastStreakTime = 0;
  }

  updateSession(timeDiffSec) {
    this.sessionSeconds += timeDiffSec;
    if (this.sessionSeconds < 0) this.sessionSeconds = 0;
  }

  registerDistraction() {
    this.distractions += 1;
    this.currentStreak = 0;
  }

  registerFocusedInterval() {
    this.currentStreak += 1;
    if (this.currentStreak > this.highestStreak) this.highestStreak = this.currentStreak;
  }

  score({ hasFace, stability, distractions, skinRatio }) {
    const faceScore = hasFace ? 100 : 0;
    const stabilityScore = stability * 100;
    const durationBonus = Math.min(30, Math.floor(this.sessionSeconds / 60) * 2);
    const distractionPenalty = Math.min(40, distractions * 8);

    const weighted =
      faceScore * this.weights.face +
      stabilityScore * this.weights.stability +
      durationBonus * this.weights.duration -
      distractionPenalty * this.weights.distraction;

    const rawScore = Math.min(100, Math.max(0, this.base + weighted * 0.5));

    if(hasFace && stability > 0.65 && Date.now() - this.lastStreakTime > 1000) {
      this.registerFocusedInterval();
      this.lastStreakTime = Date.now();
    } else if (!hasFace || stability <= 0.5) {
      this.currentStreak = 0;
    }

    return {
      value: Math.round(rawScore),
      details: {
        faceScore: Math.round(faceScore),
        stabilityScore: Math.round(stabilityScore),
        durationBonus,
        distractionPenalty,
        streak: this.currentStreak,
        bestStreak: this.highestStreak,
      },
    };
  }
}
