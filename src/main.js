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

console.log('✅ All modules imported successfully');

// =========================================
// UI ELEMENT INITIALIZATION
// =========================================
const UI = {
  video: document.getElementById('video'),
  scoreValue: document.getElementById('scoreValue'),
  scoreStatus: document.getElementById('scoreStatus'),
  sessionDuration: document.getElementById('sessionDuration'),
  distractionCount: document.getElementById('distractionCount'),
  streakValue: document.getElementById('streakValue'),
  focusRing: document.getElementById('focusRing'),
  logPanel: document.getElementById('logPanel'),
  waveCanvas: document.getElementById('waveCanvas'),
  startBtn: document.getElementById('startBtn'),
  stopBtn: document.getElementById('stopBtn'),
};

console.log('UI Elements found:', {
  video: !!UI.video,
  scoreValue: !!UI.scoreValue,
  scoreStatus: !!UI.scoreStatus,
  startBtn: !!UI.startBtn,
  stopBtn: !!UI.stopBtn,
});

// Validate critical elements
if (!UI.startBtn || !UI.stopBtn) {
  console.error('❌ CRITICAL: Start/Stop buttons not found in DOM');
  throw new Error('Required UI elements missing');
}

// Reset button states
UI.startBtn.disabled = false;
UI.stopBtn.disabled = true;
console.log('✓ Button states initialized: startBtn enabled, stopBtn disabled');

// =========================================
// CORE ENGINE INITIALIZATION
// =========================================
try {
  var cameraService = new CameraService(UI.video);
  var detectionEngine = new DetectionEngine(UI.video);
  var eyeTrackingEngine = new EyeTrackingEngine(UI.video);
  var focusEngine = new ScientificFocusEngine({});
  var audioEngine = new AudioEngine({});
  var sessionTracker = new SessionTracker();
  var waveform = new Waveform(UI.waveCanvas);
  var dashboard = new Dashboard({
    scoreEl: UI.scoreValue,
    statusEl: UI.scoreStatus,
    modeEl: null,
    durationEl: UI.sessionDuration,
    distractionEl: UI.distractionCount,
    streakEl: UI.streakValue,
    ringEl: UI.focusRing,
    logEl: UI.logPanel,
  });
  console.log('✓ All engines initialized successfully');
} catch (err) {
  console.error('❌ Engine initialization failed:', err);
  throw err;
}

// =========================================
// SESSION STATE
// =========================================
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

// =========================================
// ALERT SYSTEM
// =========================================
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

// =========================================
// AUTO MODE DETECTION
// =========================================
function getAutoMode(score) {
  if (score >= 80) return 'theta';
  if (score >= 55) return 'beta';
  return 'alpha';
}

// =========================================
// MAIN ANIMATION LOOP
// =========================================
function onAnimationFrame() {
  if (!running) return;

  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  focusEngine.updateSession(dt);
  const detection = detectionEngine.detect();

  // Eye tracking analysis
  let eyeData = { eyeFocusScore: 50, gazeStability: 50, blinkRate: 0, blinkQuality: 'unknown' };
  if (detection.hasFace && UI.video.readyState >= 2) {
    const imageData = detectionEngine.sampleFrame();
    eyeData = eyeTrackingEngine.analyze(imageData);
    sessionTracker.addEyeMetrics(eyeData);
    if (eyeData.eyeFocusScore > 60) {
      focusEngine.recordRecovery(eyeData.eyeFocusScore);
    }
  }

  // Track face stability
  sessionTracker.addFaceStability(detection.stability);

  try {
    const result = focusEngine.score({
      eyeFocusScore: eyeData.eyeFocusScore,
      faceStability: detection.stability,
      blinkQuality: eyeData.blinkQuality,
      distractions: focusEngine.distractions,
      hasFace: detection.hasFace,
    });

    sessionTracker.addFocusSample(result.value);
    waveform.addSample(result.value);

    // No face detection alert system
    if (!detection.hasFace) {
      noFaceDetectedCount++;
      if (noFaceDetectedCount > 15 && Date.now() - lastNoFaceAlertTime > 5000) {
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
  } catch (err) {
    console.error('Error in animation frame:', err);
  }

  window.requestAnimationFrame(onAnimationFrame);
}

// =========================================
// SESSION CONTROL
// =========================================
async function startSession() {
  if (running) return;
  try {
    console.log('📹 Requesting camera access...');
    await cameraService.start();
    console.log('✓ Camera access granted');
    
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
    
    // Start animation loop
    onAnimationFrame();
    
    UI.startBtn.disabled = true;
    UI.stopBtn.disabled = false;
  } catch (error) {
    console.error('❌ Camera Error:', error);
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

// =========================================
// REPORT CARD DISPLAY
// =========================================
function displayReportCard(summary) {
  const { category, label, criteria, categoryDetails } = categorizePerformance(summary);
  const insight = generateInsight(category, summary);
  const reportModal = document.getElementById('reportModal');

  if (!reportModal) {
    console.error('Report modal not found');
    return;
  }

  // Format duration
  const mins = Math.floor(summary.duration / 60);
  const secs = summary.duration % 60;
  const durationStr = `${mins}:${String(secs).padStart(2, '0')}`;

  // Focus metrics
  const focusMetrics = {
    eyeFocus: summary.averageEyeFocus || 70,
    gazeStability: summary.averageGazeStability || 65,
    stability: summary.averageStability || 70,
  };

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

  // Scientific metrics section
  const scientificMetrics = `
    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #2b3345;">
      <h4 style="margin: 0 0 8px; font-size: 0.9rem; color: #00ffa3;">Scientific Metrics</h4>
      <div class="criterion met">
        <span class="criterion-check">📊</span>
        <strong>Eye Focus Score:</strong> ${focusMetrics.eyeFocus}% - ${focusMetrics.eyeFocus >= 75 ? 'Excellent' : focusMetrics.eyeFocus >= 55 ? 'Good' : 'Needs Improvement'}
      </div>
      <div class="criterion met">
        <span class="criterion-check">👁️</span>
        <strong>Gaze Stability:</strong> ${focusMetrics.gazeStability}% - ${focusMetrics.gazeStability >= 75 ? 'Stable' : focusMetrics.gazeStability >= 50 ? 'Moderate' : 'Variable'}
      </div>
      <div class="criterion met">
        <span class="criterion-check">🎯</span>
        <strong>Blink Quality:</strong> ${summary.blinkQuality || 'normal'} - ${summary.averageBlinkRate || 15} blinks/min
      </div>
    </div>
  `;

  // Render session criteria
  const criteriaList = document.getElementById('criteriaList');
  if (criteriaList) {
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
      ${scientificMetrics}
    `;
  }

  const insightEl = document.getElementById('sessionInsight');
  if (insightEl) {
    insightEl.textContent = insight;
  }

  // Hide event log, show report
  const logPanel = document.getElementById('logPanel');
  if (logPanel) {
    logPanel.style.display = 'none';
  }
  reportModal.classList.add('open');

  // Store for PDF generation
  window.reportData = {
    category,
    categoryDetails,
    summary,
    focusMetrics,
    eyeMetrics: {
      eyeFocusScore: summary.averageEyeFocus || 50,
      blinkQuality: summary.blinkQuality || 'normal',
      gazeStability: focusMetrics.gazeStability,
    },
  };
}

// =========================================
// PDF GENERATION HELPERS
// =========================================
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
  if (!window.reportData) {
    AlertSystem.show('No report data available', 'warning');
    return;
  }

  try {
    const { category, summary, focusMetrics, eyeMetrics } = window.reportData;
    ReportGenerator.downloadDetailedReport(category, summary, focusMetrics, eyeMetrics);
  } catch (err) {
    console.error('PDF download error:', err);
    AlertSystem.show('Error generating PDF', 'danger');
  }
}

function downloadCertificate() {
  if (!window.reportData) {
    AlertSystem.show('No certificate data available', 'warning');
    return;
  }

  try {
    const { category, categoryDetails, summary, focusMetrics } = window.reportData;
    CertificateGenerator.downloadCertificate(category, categoryDetails, summary, focusMetrics);
  } catch (err) {
    console.error('Certificate download error:', err);
    AlertSystem.show('Error generating certificate', 'danger');
  }
}

// =========================================
// EVENT LISTENERS
// =========================================
function setupButtons() {
  console.log('🔧 Attaching button event listeners...');
  
  if (!UI.startBtn || !UI.stopBtn) {
    console.error('❌ Buttons not found for event binding');
    return;
  }

  UI.startBtn.addEventListener('click', (e) => {
    console.log('✓✓✓ START BUTTON CLICKED ✓✓✓');
    e.preventDefault();
    startSession();
  });

  UI.stopBtn.addEventListener('click', (e) => {
    console.log('✓✓✓ STOP BUTTON CLICKED ✓✓✓');
    e.preventDefault();
    stopSession();
  });

  console.log('✅ Button event listeners attached');
}

// Setup buttons immediately
setupButtons();

// Report modal handlers
const reportModal = document.getElementById('reportModal');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const downloadCertBtn = document.getElementById('downloadCertBtn');
const newSessionBtn = document.getElementById('newSessionBtn');

if (downloadPdfBtn) {
  downloadPdfBtn.addEventListener('click', downloadReportPDF);
}

if (downloadCertBtn) {
  downloadCertBtn.addEventListener('click', downloadCertificate);
}

if (newSessionBtn && reportModal) {
  newSessionBtn.addEventListener('click', () => {
    reportModal.classList.remove('open');
    const logPanel = document.getElementById('logPanel');
    if (logPanel) {
      logPanel.style.display = 'flex';
    }
  });
}

// =========================================
// EXPORTS & INITIALIZATION COMPLETE
// =========================================
console.log('✅ FocusPulse initialized successfully');
console.log('Ready to start session. Click Start button.');

export { startSession, stopSession };
