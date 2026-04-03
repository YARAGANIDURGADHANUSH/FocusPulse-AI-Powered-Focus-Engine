import CameraService from './services/cameraService.js';
import DetectionEngine from './core/detectionEngine.js';
import EyeTrackingEngine from './core/eyeTrackingEngine.js';
import ScientificFocusEngine from './core/scientificFocusEngine.js';
import AudioEngine from './core/audioEngine.js';
import SessionTracker from './analytics/sessionTracker.js';
import { categorizePerformance, generateInsight } from './analytics/reportGenerator.js';
import { CertificateGenerator, ReportGenerator } from './analytics/certificateGenerator.js';
import Waveform from './ui/waveform.js';
import Dashboard from './ui/dashboard.js';

const UI = {
  video: document.getElementById('video'),
  scoreValue: document.getElementById('scoreValue'),
  scoreStatus: document.getElementById('scoreStatus'),
  focusMode: document.getElementById('focusMode'),
  sessionDuration: document.getElementById('sessionDuration'),
  distractionCount: document.getElementById('distractionCount'),
  streakValue: document.getElementById('streakValue'),
  focusRing: document.getElementById('focusRing'),
  logPanel: document.getElementById('logPanel'),
  waveCanvas: document.getElementById('waveCanvas'),
  startBtn: document.getElementById('startBtn'),
  stopBtn: document.getElementById('stopBtn'),
};

const cameraService = new CameraService(UI.video);
const detectionEngine = new DetectionEngine(UI.video);
const eyeTrackingEngine = new EyeTrackingEngine(UI.video);
const focusEngine = new ScientificFocusEngine({});
const audioEngine = new AudioEngine({});
const sessionTracker = new SessionTracker();
const waveform = new Waveform(UI.waveCanvas);
const dashboard = new Dashboard({
  scoreEl: UI.scoreValue,
  statusEl: UI.scoreStatus,
  modeEl: UI.focusMode,
  durationEl: UI.sessionDuration,
  distractionEl: UI.distractionCount,
  streakEl: UI.streakValue,
  ringEl: UI.focusRing,
  logEl: UI.logPanel,
});

let running = false;
let lastTime = performance.now();
let lastDistractTime = 0;
let lastNoFaceAlertTime = 0;
let noFaceDetectedCount = 0;

const MODES = {
  'Deep Work': 'theta',
  'Sustained Attention': 'beta',
  'Light Focus': 'alpha',
};

// Alert notification system
class AlertSystem {
  static show(message, type = 'info', duration = 4000) {
    const existingAlert = document.querySelector('.alert-notification');
    if (existingAlert) existingAlert.remove();

    const alert = document.createElement('div');
    alert.className = `alert-notification alert-${type}`;
    alert.textContent = message;
    alert.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      border-radius: 8px;
      background: ${type === 'danger' ? '#ff3b5c' : type === 'warning' ? '#ffb800' : '#00ffa3'};
      color: ${type === 'danger' || type === 'warning' ? '#fff' : '#000'};
      font-weight: 600;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(alert);

    setTimeout(() => alert.remove(), duration);
  }
}

function getAutoMode(score) {
  if (score >= 80) return 'theta';
  if (score >= 55) return 'beta';
  return 'alpha';
}

function onAnimationFrame() {
  if (!running) return;

  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  focusEngine.updateSession(dt);
  const detection = detectionEngine.detect();

  const result = focusEngine.score({
    hasFace: detection.hasFace,
    stability: detection.stability,
    distractions: focusEngine.distractions,
    skinRatio: detection.skinRatio,
  });

  sessionTracker.addFocusSample(result.value);
  waveform.addSample(result.value);

  // No face detection alert system
  if (!detection.hasFace) {
    noFaceDetectedCount++;
    if (noFaceDetectedCount > 15 && Date.now() - lastNoFaceAlertTime > 5000) {
      // No face for ~0.5 seconds
      AlertSystem.show('⚠ Face not detected - Please stay in frame', 'warning', 3000);
      lastNoFaceAlertTime = Date.now();
      focusEngine.registerDistraction();
      sessionTracker.addDistraction('Face not detected');
      dashboard.addLog('Alert: Face not detected in frame');
    }
  } else {
    noFaceDetectedCount = 0;
  }

  if (!detection.hasFace && Date.now() - lastDistractTime > 3000) {
    focusEngine.registerDistraction();
    sessionTracker.addDistraction('Face not detected');
    lastDistractTime = Date.now();
    dashboard.addLog('Distraction: Face not visible');
    if (focusEngine.distractions > 1) {
      audioEngine.start('alpha');
    }
  }

  const currentMode = getAutoMode(result.value);
  if (result.value >= 55 && !audioEngine.isRunning) {
    audioEngine.start(currentMode);
  }
  if (result.value < 35 && audioEngine.isRunning) {
    audioEngine.stop();
  }

  dashboard.updateScore(result.value, result.details);
  
  const modeDescription = result.value >= 80 ? 'Deep Work' : result.value >= 55 ? 'Sustained Attention' : 'Light Focus';
  
  dashboard.updateStats({
    duration: Math.floor(focusEngine.sessionSeconds),
    distractions: focusEngine.distractions,
    streak: result.details.bestStreak,
    mode: modeDescription,
  });

  window.requestAnimationFrame(onAnimationFrame);
}

async function startSession() {
  if (running) return;
  try {
    await cameraService.start();
    sessionTracker.start();
    focusEngine.sessionSeconds = 0;
    focusEngine.distractions = 0;
    focusEngine.currentStreak = 0;
    focusEngine.highestStreak = 0;
    lastDistractTime = 0;
    lastNoFaceAlertTime = 0;
    noFaceDetectedCount = 0;
    audioEngine.initialize();
    running = true;
    lastTime = performance.now();
    dashboard.addLog('Session started');
    AlertSystem.show('✓ Focus Session Started', 'info', 2000);
    onAnimationFrame();
    UI.startBtn.disabled = true;
    UI.stopBtn.disabled = false;
  } catch (error) {
    dashboard.addLog(`Camera error: ${error.message}`);
    AlertSystem.show(`❌ Camera Error: ${error.message}`, 'danger', 4000);
  }
}

function stopSession() {
  if (!running) return;
  running = false;
  noFaceDetectedCount = 0;
  cameraService.stop();
  audioEngine.stop();
  sessionTracker.stop();
  dashboard.addLog('Session stopped');
  AlertSystem.show('✓ Session Completed', 'info', 2000);
  UI.startBtn.disabled = false;
  UI.stopBtn.disabled = true;
  
  const summary = sessionTracker.summary();
  displayReportCard(summary);
}

function displayReportCard(summary) {
  const { category, label, criteria, categoryDetails } = categorizePerformance(summary);
  const insight = generateInsight(category, summary);
  const reportModal = document.getElementById('reportModal');

  // Format duration
  const mins = Math.floor(summary.duration / 60);
  const secs = summary.duration % 60;
  const durationStr = `${mins}:${String(secs).padStart(2, '0')}`;

  // Update modal content
  document.getElementById('reportTimestamp').textContent = new Date().toLocaleString();
  document.getElementById('badgeCircle').textContent = label.charAt(0).toUpperCase();
  document.getElementById('badgeCircle').style.background = getGradient(label);
  document.getElementById('categoryName').textContent = categoryDetails.name;
  document.getElementById('categoryLabel').textContent = categoryDetails.description;

  document.getElementById('repDuration').textContent = durationStr;
  document.getElementById('repAvgFocus').textContent = `${summary.averageFocus}%`;
  document.getElementById('repDistractions').textContent = summary.distractions;
  document.getElementById('repBestStreak').textContent = `${summary.bestStreak}s`;

  // Render session criteria
  const criteriaList = document.getElementById('criteriaList');
  criteriaList.innerHTML = `
    <div style="margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid #2b3345;">
      <h4 style="margin: 0 0 8px; font-size: 0.9rem; color: #00ffa3;">Your Session Performance</h4>
      ${criteria.map(c => `
        <div class="criterion ${c.met ? 'met' : 'unmet'}">
          <span class="criterion-check">${c.met ? '✓' : '✗'}</span>
          <strong>${c.name}:</strong> ${c.value} (${c.threshold})
        </div>
      `).join('')}
    </div>
    <div>
      <h4 style="margin: 0 0 8px; font-size: 0.9rem; color: #00ffa3;">${categoryDetails.name} Requirements</h4>
      ${categoryDetails.requirements.map(req => `
        <div class="criterion met" style="border-left-color: #00ffa3;">
          <span class="criterion-check">•</span>
          ${req}
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('sessionInsight').textContent = insight;

  // Hide event log, show report
  document.getElementById('logPanel').style.display = 'none';
  reportModal.classList.add('open');
}

function getGradient(label) {
  const gradients = {
    gamma: 'radial-gradient(circle, #ff6b35, #cc3d1f)',
    delta: 'radial-gradient(circle, #7c6fff, #5a4fbf)',
    beta: 'radial-gradient(circle, #ffb800, #cc9300)',
    alpha: 'radial-gradient(circle, #00ffa3, #008a5f)',
  };
  return gradients[label] || gradients.alpha;
}

function downloadReportPDF() {
  const reportCard = document.querySelector('.report-card');
  const html2pdf = window.html2pdf;

  if (!html2pdf) {
    alert('PDF library loading... Please try again in a moment.');
    // Lazy load html2pdf
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => downloadReportPDF();
    document.head.appendChild(script);
    return;
  }

  const options = {
    margin: 10,
    filename: `FocusPulse-Report-${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
  };

  html2pdf().set(options).from(reportCard).save();
}

UI.startBtn.addEventListener('click', startSession);
UI.stopBtn.addEventListener('click', stopSession);

// Report modal handlers
const reportModal = document.getElementById('reportModal');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const newSessionBtn = document.getElementById('newSessionBtn');

downloadPdfBtn.addEventListener('click', downloadReportPDF);
newSessionBtn.addEventListener('click', () => {
  reportModal.classList.remove('open');
  document.getElementById('logPanel').style.display = 'flex';
});

export { startSession, stopSession };
