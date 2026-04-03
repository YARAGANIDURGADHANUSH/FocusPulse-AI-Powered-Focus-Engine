import { getFocusLevelDescription, getFocusMode } from '../analytics/metrics.js';

export default class Dashboard {
  constructor({ scoreEl, statusEl, modeEl, durationEl, distractionEl, streakEl, ringEl, logEl }) {
    this.scoreEl = scoreEl;
    this.statusEl = statusEl;
    this.modeEl = modeEl;
    this.durationEl = durationEl;
    this.distractionEl = distractionEl;
    this.streakEl = streakEl;
    this.ringEl = ringEl;
    this.logEl = logEl;
  }

  getCategoryFromScore(score) {
    if (score >= 85) return 'Gamma (Exceptional)';
    if (score >= 75) return 'Delta (Strong)';
    if (score >= 55) return 'Beta (Good)';
    return 'Alpha (Building)';
  }

  updateScore(score, details) {
    this.scoreEl.textContent = String(score);
    const category = this.getCategoryFromScore(score);
    this.statusEl.textContent = `${getFocusLevelDescription(score)} - ${category}`;
    this.modeEl.textContent = getFocusMode(score);
    this.updateRing(score);
    this.addLog(`Score: ${score} | ${category} | Face: ${details.faceScore}% | Stability: ${details.stabilityScore}%`);
  }

  updateRing(score) {
    const circumference = this.ringEl.getTotalLength();
    const offset = circumference - (score / 100) * circumference;
    this.ringEl.style.strokeDashoffset = offset;
    // Update ring color based on category
    if (score >= 85) {
      this.ringEl.style.stroke = '#ff6b35'; // Gamma - Orange Red
    } else if (score >= 75) {
      this.ringEl.style.stroke = '#7c6fff'; // Delta - Purple
    } else if (score >= 55) {
      this.ringEl.style.stroke = '#ffb800'; // Beta - Amber
    } else {
      this.ringEl.style.stroke = '#00ffa3'; // Alpha - Cyan
    }
  }

  updateStats({ duration, distractions, streak, mode }) {
    this.durationEl.textContent = `${duration}s`;
    this.distractionEl.textContent = distractions;
    this.streakEl.textContent = `${streak}s`;
    if (this.modeEl && mode) {
      this.modeEl.textContent = mode;
    }
  }

  addLog(message) {
    if (!this.logEl) return;
    const item = document.createElement('div');
    item.className = 'log-item';
    item.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    this.logEl.prepend(item);
    if (this.logEl.children.length > 6) {
      this.logEl.removeChild(this.logEl.lastChild);
    }
  }
}
