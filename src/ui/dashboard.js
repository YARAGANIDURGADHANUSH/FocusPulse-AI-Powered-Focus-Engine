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

  updateScore(score, details) {
    this.scoreEl.textContent = String(score);
    this.statusEl.textContent = getFocusLevelDescription(score);
    this.modeEl.textContent = getFocusMode(score);
    this.updateRing(score);
    this.addLog(`Score: ${score}; face:${details.faceScore}; stable:${details.stabilityScore}`);
  }

  updateRing(score) {
    const circumference = this.ringEl.getTotalLength();
    const offset = circumference - (score / 100) * circumference;
    this.ringEl.style.strokeDashoffset = offset;
    this.ringEl.style.stroke = score > 70 ? '#00ffa3' : score > 40 ? '#ffb800' : '#ff3b5c';
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
