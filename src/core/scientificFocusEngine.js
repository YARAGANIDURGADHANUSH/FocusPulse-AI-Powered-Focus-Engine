/**
 * Advanced Focus Engine with Scientific Backing
 * 
 * Evaluation Components (Research-based):
 * 1. Eye Focus Score (30%) - Eye openness, gaze stability, blink rate
 * 2. Face Stability (25%) - Head movement consistency, face position in frame
 * 3. Focus Duration (20%) - Sustained attention streaks
 * 4. Distraction Management (15%) - Recovery from distractions
 * 5. Cognitive Load (10%) - Blink suppression indicates focus intensity
 */
export default class ScientificFocusEngine {
  constructor(config = {}) {
    // Component weights based on cognitive science research
    this.weights = {
      eyeFocus: config.eyeFocusWeight || 0.30,      // Strongest indicator
      faceStability: config.stabilityWeight || 0.25,
      focusDuration: config.durationWeight || 0.20,
      distractionRecovery: config.recoveryWeight || 0.15,
      cognitiveLoad: config.cognitiveWeight || 0.10,
    };

    this.sessionSeconds = 0;
    this.distractions = 0;
    this.highestStreak = 0;
    this.currentStreak = 0;
    this.lastStreakTime = 0;

    // Distraction tracking for recovery score
    this.lastDistractionTime = 0;
    this.distractionRecoveryTimes = [];

    // Cognitive load tracking
    this.eyeFocusScores = [];
    this.faceStabilityScores = [];
  }

  updateSession(timeDiffSec) {
    this.sessionSeconds += timeDiffSec;
    if (this.sessionSeconds < 0) this.sessionSeconds = 0;
  }

  registerDistraction() {
    this.distractions += 1;
    this.currentStreak = 0;
    this.lastDistractionTime = Date.now();
  }

  registerFocusedInterval() {
    this.currentStreak += 1;
    if (this.currentStreak > this.highestStreak) {
      this.highestStreak = this.currentStreak;
    }
  }

  /**
   * Scientific Focus Score Calculation
   * Based on: Cognitive Psychology & Attention Research
   */
  score({ eyeFocusScore, faceStability, blinkQuality, distractions, hasFace }) {
    // Component 1: Eye Focus Score (0-100)
    // Research: Eyes are the window to attention
    const eyeFocusComponent = eyeFocusScore * this.weights.eyeFocus;

    // Component 2: Face Stability (0-100)
    // Research: Head movement indicates mind wandering
    const stabilityComponent = (faceStability * 100) * this.weights.faceStability;

    // Component 3: Focus Duration Bonus (0-25)
    // Research: Longer uninterrupted focus = better concentration
    const durationBonus = Math.min(25, Math.floor(this.highestStreak / 10)) * this.weights.focusDuration;

    // Component 4: Distraction Recovery Score (0-100)
    // Research: How quickly user refocus after distraction
    const recoveryScore = this.calculateRecoveryScore();
    const recoveryComponent = recoveryScore * this.weights.distractionRecovery;

    // Component 5: Cognitive Load Score (0-100)
    // Research: Blink suppression indicates high focus/cognitive engagement
    const cognitiveLoadScore = this.calculateCognitiveLoad(blinkQuality);
    const cognitiveComponent = cognitiveLoadScore * this.weights.cognitiveLoad;

    // Distraction penalty
    const distractionPenalty = Math.min(30, distractions * 5);

    // Calculate weighted score
    const totalScore = 
      eyeFocusComponent +
      stabilityComponent +
      durationBonus +
      recoveryComponent +
      cognitiveComponent -
      distractionPenalty;

    const finalScore = Math.min(100, Math.max(0, totalScore));

    // Track for metrics
    this.eyeFocusScores.push(eyeFocusScore);
    this.faceStabilityScores.push(faceStability * 100);

    // Update streak
    if (hasFace && eyeFocusScore > 60 && faceStability > 0.6 && Date.now() - this.lastStreakTime > 1000) {
      this.registerFocusedInterval();
      this.lastStreakTime = Date.now();
    } else if (!hasFace || eyeFocusScore < 40) {
      this.currentStreak = 0;
    }

    return {
      value: Math.round(finalScore),
      components: {
        eyeFocus: Math.round(eyeFocusComponent),
        stability: Math.round(stabilityComponent),
        duration: Math.round(durationBonus),
        recovery: Math.round(recoveryComponent),
        cognitive: Math.round(cognitiveComponent),
      },
      details: {
        eyeFocusScore: Math.round(eyeFocusScore),
        stabilityScore: Math.round(faceStability * 100),
        blinkQuality,
        streak: this.currentStreak,
        bestStreak: this.highestStreak,
        distractionCount: this.distractions,
      },
    };
  }

  /**
   * Calculate how quickly user recovers focus after distraction
   * Research: Faster recovery = better attention control
   */
  calculateRecoveryScore() {
    if (this.distractions === 0) return 100;

    const recoveryTimes = this.distractionRecoveryTimes;
    if (recoveryTimes.length === 0) return 50;

    // Average recovery time in seconds
    const avgRecoveryTime = recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length;

    // Optimal recovery: 5-15 seconds
    // Too fast: < 2 seconds (not real recovery)
    // Too slow: > 30 seconds (poor attention control)
    let recoveryScore = 100;

    if (avgRecoveryTime < 2) {
      recoveryScore = 60; // Unrealistic, might be false positive
    } else if (avgRecoveryTime <= 15) {
      recoveryScore = 100; // Optimal
    } else if (avgRecoveryTime <= 30) {
      recoveryScore = 70; // Slow recovery
    } else {
      recoveryScore = 40; // Very slow recovery
    }

    return recoveryScore;
  }

  /**
   * Cognitive Load Score
   * Research: Blink suppression (5-10 blinks/min) indicates high concentration
   * Excessive blinking (>20 blinks/min) indicates fatigue or distraction
   */
  calculateCognitiveLoad(blinkQuality) {
    const blinkScores = {
      'optimal-focus': 100,      // Deep focus, 5-10 blinks/min
      'normal': 70,               // Normal state, 10-20 blinks/min
      'eye-strain': 40,          // Too little blinking, eye strain risk
      'excessive-blinking': 50,  // Too much blinking, fatigue/distraction
      'unknown': 50,             // Default
    };

    return blinkScores[blinkQuality] || 50;
  }

  /**
   * Record recovery event when focus returns after distraction
   */
  recordRecovery(focusScore) {
    if (this.distractions > 0 && Date.now() - this.lastDistractionTime < 120000) {
      // If user recovers to good focus within 2 minutes of distraction
      if (focusScore > 70) {
        const recoveryTime = (Date.now() - this.lastDistractionTime) / 1000;
        this.distractionRecoveryTimes.push(Math.min(recoveryTime, 60)); // Cap at 60 seconds
      }
    }
  }

  /**
   * Get comprehensive summary with scientific metrics
   */
  getSummary() {
    const avgEyeFocus = this.eyeFocusScores.length 
      ? Math.round(this.eyeFocusScores.reduce((a, b) => a + b) / this.eyeFocusScores.length)
      : 0;

    const avgStability = this.faceStabilityScores.length
      ? Math.round(this.faceStabilityScores.reduce((a, b) => a + b) / this.faceStabilityScores.length)
      : 0;

    const avgRecoveryTime = this.distractionRecoveryTimes.length
      ? Number((this.distractionRecoveryTimes.reduce((a, b) => a + b) / this.distractionRecoveryTimes.length).toFixed(1))
      : 0;

    return {
      sessionDuration: this.sessionSeconds,
      averageEyeFocus: avgEyeFocus,
      averageStability: avgStability,
      distanceFocusDuration: this.highestStreak,
      totalDistractions: this.distractions,
      averageRecoveryTime: avgRecoveryTime,
      samplesCollected: this.eyeFocusScores.length,
    };
  }
}
