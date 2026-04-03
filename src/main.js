import CameraService from './services/cameraService.js';
import DetectionEngine from './core/detectionEngine.js';
import FocusEngine from './core/focusEngine.js';
import AudioEngine from './core/audioEngine.js';
import SessionTracker from './analytics/sessionTracker.js';
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
const focusEngine = new FocusEngine({});
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

const MODES = {
  'Deep Work': 'theta',
  'Sustained Attention': 'beta',
  'Light Focus': 'alpha',
};

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

  if (!detection.hasFace && Date.now() - lastDistractTime > 3000) {
    focusEngine.registerDistraction();
    sessionTracker.addDistraction('Face not detected');
    lastDistractTime = Date.now();
    dashboard.addLog('Distraction detected: face not visible');
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
    audioEngine.initialize();
    running = true;
    lastTime = performance.now();
    dashboard.addLog('Session started');
    onAnimationFrame();
    UI.startBtn.disabled = true;
    UI.stopBtn.disabled = false;
  } catch (error) {
    dashboard.addLog(`Camera error: ${error.message}`);
  }
}

function stopSession() {
  if (!running) return;
  running = false;
  cameraService.stop();
  audioEngine.stop();
  sessionTracker.stop();
  dashboard.addLog('Session stopped');
  UI.startBtn.disabled = false;
  UI.stopBtn.disabled = true;
  const summary = sessionTracker.summary();
  dashboard.addLog(`Session summary: ${JSON.stringify(summary)}`);
}

UI.startBtn.addEventListener('click', startSession);
UI.stopBtn.addEventListener('click', stopSession);

export { startSession, stopSession };
