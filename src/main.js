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
  modeSelect: document.getElementById('modeSelect'),
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

const MODES = ['alpha', 'beta', 'theta', 'gamma'];

function setFocusMode(mode) {
  audioEngine.setMode(mode);
  dashboard.addLog(`Focus mode set to ${mode}`);
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

  if (result.value < 45 && detection.hasFace) {
    focusEngine.registerDistraction();
    sessionTracker.addDistraction('Low focus');
    dashboard.addLog('Distraction detected: low focus score');
    if (focusEngine.distractions > 1) {
      audioEngine.start(MODES[Math.floor(Math.random() * MODES.length)]);
    }
  }

  if (result.value >= 75 && !audioEngine.isRunning) {
    audioEngine.start(UI.modeSelect.value);
  }
  if (result.value < 55 && audioEngine.isRunning) {
    audioEngine.stop();
  }

  dashboard.updateScore(result.value, result.details);
  dashboard.updateStats({
    duration: sessionTracker.duration || Math.floor(focusEngine.sessionSeconds),
    distractions: focusEngine.distractions,
    streak: result.details.bestStreak,
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
    running = true;
    lastTime = performance.now();
    dashboard.addLog('Session started');
    audioEngine.start(UI.modeSelect.value);
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
UI.modeSelect.addEventListener('change', (event) => setFocusMode(event.target.value));

export { startSession, stopSession };
