export default class DetectionEngine {
  constructor(videoElement, sampleWidth = 160, sampleHeight = 120) {
    this.video = videoElement;
    this.sampleWidth = sampleWidth;
    this.sampleHeight = sampleHeight;
    this.offscreen = document.createElement('canvas');
    this.offscreen.width = sampleWidth;
    this.offscreen.height = sampleHeight;
    this.ctx = this.offscreen.getContext('2d', { willReadFrequently: true });
  }

  sampleFrame() {
    if (this.video.readyState < 2) return null;
    this.ctx.drawImage(this.video, 0, 0, this.sampleWidth, this.sampleHeight);
    return this.ctx.getImageData(0, 0, this.sampleWidth, this.sampleHeight);
  }

  analyzeFrame(imageData) {
    if (!imageData) return { hasFace: false, stability: 0, brightness: 0 };

    const data = imageData.data;
    let skinCount = 0;
    let motionScore = 0;
    let brightnessSum = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      brightnessSum += y;

      // Simple skin tone heuristic in YCrCb-style ranges.
      const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
      const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;

      if (y > 60 && Cr > 135 && Cr < 190 && Cb > 85 && Cb < 150) {
        skinCount++;
      }
    }

    const totalPixels = data.length / 4;
    const skinRatio = skinCount / totalPixels;
    const avgBrightness = brightnessSum / totalPixels;
    const hasFace = skinRatio > 0.03;
    const stability = Math.min(1, Math.max(0, 1 - Math.abs((skinRatio - 0.08) * 6)));

    return {
      hasFace,
      stability,
      brightness: avgBrightness,
      skinRatio,
      motion: motionScore,
    };
  }

  detect() {
    const frame = this.sampleFrame();
    return this.analyzeFrame(frame);
  }
}
