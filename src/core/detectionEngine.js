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
    this.confidenceHistory = [];
    this.faceConfidence = 0;
  }

  sampleFrame() {
    if (this.video.readyState < 2) return null;
    this.ctx.drawImage(this.video, 0, 0, this.sampleWidth, this.sampleHeight);
    return this.ctx.getImageData(0, 0, this.sampleWidth, this.sampleHeight);
  }

  detectEdges(data) {
    let edgeCount = 0;
    const width = this.sampleWidth;
    const height = this.sampleHeight;

    for (let i = 0; i < data.length; i += 4) {
      const idx = i / 4;
      const x = idx % width;
      const y = Math.floor(idx / width);

      if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
        const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const rightBrightness = 0.299 * data[i + 4] + 0.587 * data[i + 5] + 0.114 * data[i + 6];
        const bottomBrightness = 0.299 * data[i + width * 4] + 0.587 * data[i + width * 4 + 1] + 0.114 * data[i + width * 4 + 2];

        if (Math.abs(brightness - rightBrightness) > 30 || Math.abs(brightness - bottomBrightness) > 30) {
          edgeCount++;
        }
      }
    }

    return edgeCount / (data.length / 4);
  }

  analyzeFrame(imageData) {
    if (!imageData) return { hasFace: false, stability: 0, brightness: 0, confidence: 0 };

    const data = imageData.data;
    let skinCount = 0;
    let brightnessSum = 0;
    let topThirdSkinCount = 0;
    const topThirdEndIdx = (this.sampleWidth * this.sampleHeight) / 3;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      brightnessSum += y;

      // Enhanced skin tone detection in YCbCr space (accounts for various skin tones)
      const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
      const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;

      // Broader but still strict thresholds for better face detection
      if (y > 50 && Cr > 125 && Cr < 195 && Cb > 75 && Cb < 155) {
        skinCount++;
        if (i / 4 < topThirdEndIdx) topThirdSkinCount++;
      }
    }

    const totalPixels = data.length / 4;
    const skinRatio = skinCount / totalPixels;
    const avgBrightness = brightnessSum / totalPixels;
    const edgeRatio = this.detectEdges(data);

    // Calculate face confidence
    let faceConfidence = 0;
    if (skinRatio > 0.05 && avgBrightness > 60) faceConfidence += 0.3;
    if (topThirdSkinCount > skinCount * 0.3) faceConfidence += 0.3; // Face should have skin in top portion
    if (edgeRatio > 0.08 && edgeRatio < 0.4) faceConfidence += 0.4; // Good edge detection

    // Frame-to-frame smoothing to avoid flickering
    this.frameHistory.push(skinRatio);
    this.confidenceHistory.push(faceConfidence);
    if (this.frameHistory.length > 8) this.frameHistory.shift();
    if (this.confidenceHistory.length > 8) this.confidenceHistory.shift();

    const avgSkinRatio = this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length;
    const avgConfidence = this.confidenceHistory.reduce((a, b) => a + b, 0) / this.confidenceHistory.length;
    this.faceConfidence = avgConfidence;

    // Require higher confidence for face detection (reduced false positives)
    const hasFace = avgConfidence > 0.5 && skinRatio > 0.06 && avgBrightness > 65;

    const stability = Math.min(1, Math.max(0, avgConfidence));

    return {
      hasFace,
      stability,
      brightness: avgBrightness,
      skinRatio: avgSkinRatio,
      confidence: avgConfidence,
      motion: edgeRatio,
    };
  }

  detect() {
    const frame = this.sampleFrame();
    return this.analyzeFrame(frame);
  }
}
