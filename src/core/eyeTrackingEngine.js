/**
 * Eye Tracking Engine - Scientifically-backed eye analysis
 * Metrics: Blink rate, gaze stability, eye openness
 * Based on research: Eyelid movement indicates cognitive load and attention levels
 */
export default class EyeTrackingEngine {
  constructor(videoElement, sampleWidth = 160, sampleHeight = 120) {
    this.video = videoElement;
    this.sampleWidth = sampleWidth;
    this.sampleHeight = sampleHeight;
    this.canvas = document.createElement('canvas');
    this.canvas.width = sampleWidth;
    this.canvas.height = sampleHeight;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    // Eye tracking metrics
    this.blinkCount = 0;
    this.blinkHistory = [];
    this.eyeOpenness = 1; // 0-1 scale
    this.gazeStability = 1; // 0-1 scale
    this.lastBlinkTime = 0;
    this.blinkDurationStart = null;

    // Gaze tracking
    this.gazePositionHistory = [];
    this.maxGazeHistoryLength = 30;

    // Eye region detection
    this.eyeRegionState = { left: false, right: false };
    this.eyeRegionHistory = [];
  }

  /**
   * Detect eyes region in the upper portion of face
   * Eyes typically occupy upper 1/3 of face
   */
  detectEyeRegion(imageData) {
    if (!imageData) return { confidence: 0, darkness: 0 };

    const data = imageData.data;
    const width = this.sampleWidth;
    const height = this.sampleHeight;

    // Focus on upper 40% of image (where eyes typically are)
    const eyeRegionHeight = Math.floor(height * 0.4);
    let darkPixels = 0;
    let totalPixels = 0;

    for (let y = 0; y < eyeRegionHeight; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

        totalPixels++;
        // Eyes and pupils are darker than surrounding skin
        if (brightness < 100) {
          darkPixels++;
        }
      }
    }

    const eyeDarkness = totalPixels > 0 ? darkPixels / totalPixels : 0;
    const confidence = Math.min(1, eyeDarkness * 3); // Scale to 0-1

    return { confidence, darkness: eyeDarkness };
  }

  /**
   * Calculate blink rate (scientific metric for attention)
   * Normal blink rate: 15-20 blinks/minute at rest
   * Concentrated focus: 3-8 blinks/minute (reduced blink rate)
   * High cognitive load: Increased blink suppression
   */
  calculateBlinkRate() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove old blinks outside 1-minute window
    this.blinkHistory = this.blinkHistory.filter(time => time > oneMinuteAgo);

    // Calculate blinks per minute
    const blinksPerMinute = this.blinkHistory.length;

    // Calculate focus score based on blink rate
    // Best focus: 5-10 blinks/minute
    let blinkScore = 1;
    if (blinksPerMinute < 3) {
      blinkScore = 0.7; // Eye strain, too suppressed
    } else if (blinksPerMinute <= 10) {
      blinkScore = 1; // Optimal focus range
    } else if (blinksPerMinute <= 20) {
      blinkScore = 0.8; // Normal blinking
    } else {
      blinkScore = 0.5; // Excessive blinking, distracted/tired
    }

    return {
      rate: blinksPerMinute,
      score: blinkScore,
      quality: this.getBlinkQuality(blinksPerMinute),
    };
  }

  getBlinkQuality(blinksPerMinute) {
    if (blinksPerMinute < 3) return 'eye-strain';
    if (blinksPerMinute <= 10) return 'optimal-focus';
    if (blinksPerMinute <= 20) return 'normal';
    return 'excessive-blinking';
  }

  /**
   * Detect blink event based on eye openness change
   * A blink typically lasts 100-400ms with quick closure and opening
   */
  detectBlink(eyeOpenness) {
    const now = Date.now();

    // Quick drop indicates closing eyes
    if (eyeOpenness < 0.3 && this.eyeOpenness > 0.6) {
      this.blinkDurationStart = now;
    }

    // Quick rise indicates reopening eyes (blink complete)
    if (eyeOpenness > 0.6 && this.eyeOpenness < 0.3 && this.blinkDurationStart !== null) {
      const blinkDuration = now - this.blinkDurationStart;
      // Valid blink: 100-400ms
      if (blinkDuration >= 100 && blinkDuration <= 400) {
        this.blinkCount++;
        this.blinkHistory.push(now);
        this.blinkDurationStart = null;
        return true;
      }
    }

    this.eyeOpenness = eyeOpenness;
    return false;
  }

  /**
   * Calculate gaze stability
   * Stable gaze indicates focused attention
   * Frequent gaze shifts indicate scanning/distraction
   */
  calculateGazeStability() {
    if (this.gazePositionHistory.length < 2) {
      return 1;
    }

    // Calculate variance in gaze position
    let totalVariance = 0;
    for (let i = 1; i < this.gazePositionHistory.length; i++) {
      const prev = this.gazePositionHistory[i - 1];
      const curr = this.gazePositionHistory[i];
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      totalVariance += Math.sqrt(dx * dx + dy * dy);
    }

    const avgVariance = totalVariance / (this.gazePositionHistory.length - 1);

    // Map variance to stability score (lower variance = higher stability)
    // Normalized by image dimensions
    const maxVariance = Math.sqrt(this.sampleWidth * this.sampleWidth + this.sampleHeight * this.sampleHeight);
    const normalizedVariance = avgVariance / maxVariance;

    // Invert: low variance = high stability
    const stability = Math.max(0, 1 - normalizedVariance);

    return stability;
  }

  /**
   * Track gaze center point
   * Uses dark pixel concentration to estimate where eyes are looking
   */
  trackGazePosition(imageData) {
    if (!imageData) return { x: this.sampleWidth / 2, y: this.sampleHeight / 2 };

    const data = imageData.data;
    const width = this.sampleWidth;
    const height = this.sampleHeight;

    // Focus on upper portion where eyes are
    const eyeRegionHeight = Math.floor(height * 0.5);
    let darkCenterX = 0;
    let darkCenterY = 0;
    let darkPixelCount = 0;

    for (let y = 0; y < eyeRegionHeight; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

        // Weight dark pixels (pupils)
        if (brightness < 80) {
          darkCenterX += x;
          darkCenterY += y;
          darkPixelCount++;
        }
      }
    }

    const gazeX = darkPixelCount > 0 ? darkCenterX / darkPixelCount : width / 2;
    const gazeY = darkPixelCount > 0 ? darkCenterY / darkPixelCount : height / 2;

    const position = { x: gazeX, y: gazeY };
    this.gazePositionHistory.push(position);

    if (this.gazePositionHistory.length > this.maxGazeHistoryLength) {
      this.gazePositionHistory.shift();
    }

    return position;
  }

  /**
   * Analyze complete eye metrics
   * Returns scientifically-backed evaluation
   */
  analyze(imageData) {
    if (!imageData) {
      return this.getDefaultAnalysis();
    }

    // Detect eyes and openness
    const eyeRegion = this.detectEyeRegion(imageData);
    const eyeOpenness = Math.max(0, 1 - eyeRegion.darkness * 1.5); // Inverted: less darkness = more open

    // Detect blink
    this.detectBlink(eyeOpenness);

    // Track gaze
    this.trackGazePosition(imageData);

    // Calculate metrics
    const blinkMetrics = this.calculateBlinkRate();
    const gazeStability = this.calculateGazeStability();

    // Composite eye focus score
    const eyeFocusScore = (
      eyeOpenness * 0.3 +          // Eye openness (avoid fatigue)
      blinkMetrics.score * 0.35 +  // Blink rate (cognitive load)
      gazeStability * 0.35         // Gaze stability (attention)
    );

    return {
      eyeOpenness: Math.round(eyeOpenness * 100),
      blinkRate: blinkMetrics.rate,
      blinkQuality: blinkMetrics.quality,
      gazeStability: Math.round(gazeStability * 100),
      eyeFocusScore: Math.round(eyeFocusScore * 100),
      details: {
        eyeDetectionConfidence: eyeRegion.confidence,
        eyeRegionDarkness: eyeRegion.darkness,
      },
    };
  }

  getDefaultAnalysis() {
    return {
      eyeOpenness: 50,
      blinkRate: 0,
      blinkQuality: 'unknown',
      gazeStability: 50,
      eyeFocusScore: 50,
      details: {
        eyeDetectionConfidence: 0,
        eyeRegionDarkness: 0,
      },
    };
  }

  /**
   * Get overall eye health metrics for report
   */
  getSummary() {
    const avgBlinkRate = this.calculateBlinkRate().rate;

    return {
      totalBlinks: this.blinkCount,
      averageBlinkRate: Math.round(avgBlinkRate),
      blinkQuality: this.getBlinkQuality(avgBlinkRate),
      gazeStability: Math.round(this.calculateGazeStability() * 100),
      eyeOpenness: Math.round(this.eyeOpenness * 100),
    };
  }
}
