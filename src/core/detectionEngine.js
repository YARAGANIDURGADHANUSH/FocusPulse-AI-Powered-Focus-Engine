export default class DetectionEngine {
  constructor(videoElement, sampleWidth = 160, sampleHeight = 120) {
    this.video = videoElement;
    this.sampleWidth = sampleWidth;
    this.sampleHeight = sampleHeight;
    this.offscreen = document.createElement('canvas');
    this.offscreen.width = sampleWidth;
    this.offscreen.height = sampleHeight;
    this.ctx = this.offscreen.getContext('2d', { willReadFrequently: true });
    this.lastSkinRatio = 0;
    this.frameHistory = [];
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
    let edgeCount = 0;
    let brightnessSum = 0;
    let topThirdSkinCount = 0;
    const topThirdStartIdx = 0;
    const topThirdEndIdx = (this.sampleWidth * this.sampleHeight) / 3;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      brightnessSum += y;

      // Stricter skin tone detection in YCbCr space
      const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
      const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;

      // Tighter thresholds: higher brightness, narrower Cr/Cb ranges
      if (y > 85 && Cr > 138 && Cr < 185 && Cb > 90 && Cb < 142) {
        skinCount++;
        if (i / 4 < topThirdEndIdx) topThirdSkinCount++;
      }
    }

    const totalPixels = data.length / 4;
    const skinRatio = skinCount / totalPixels;
    const avgBrightness = brightnessSum / totalPixels;
    
    // Require higher skin ratio and consistency
    const hasFace = skinRatio > 0.08 && avgBrightness > 70;
    
    // Frame-to-frame smoothing to avoid flickering
    this.frameHistory.push(skinRatio);
    if (this.frameHistory.length > 5) this.frameHistory.shift();
    const avgSkinRatio = this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length;
    
    const stability = Math.min(1, Math.max(0, Math.abs(avgSkinRatio - 0.1) < 0.05 ? 1 : 0.3));

    return {
      hasFace,
      stability,
      brightness: avgBrightness,
      skinRatio: avgSkinRatio,
      motion: 0,
    };
  }

  detect() {
    const frame = this.sampleFrame();
    return this.analyzeFrame(frame);
  }
}
