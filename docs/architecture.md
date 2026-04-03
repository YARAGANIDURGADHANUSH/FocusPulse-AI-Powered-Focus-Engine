# FocusPulse Architecture

## Overview
FocusPulse is a modular client-side system with the following responsibilities:

- `src/services`: device access and system services. `cameraService.js` abstracts webcam lifecycle.
- `src/core`: real-time processing engines. `detectionEngine.js` reads frames and extracts behavioral signals. `focusEngine.js` computes a weighted nervous-system-like focus score. `audioEngine.js` manages binaural beat playback and adaptive intervention.
- `src/analytics`: session metrics and insight calculations. `sessionTracker.js` logs focus values and distractions; `metrics.js` provides descriptors and mode classification.
- `src/ui`: visualization and interface updates. `dashboard.js` updates DOM elements and event logs; `waveform.js` renders a canvas wave line.
- `src/main.js`: orchestration script that binds engines, listeners, and animation loop.

## Data Flow
1. Start: user triggers `startSession()`.
2. Camera starts via `CameraService.start()`.
3. Main loop cycles with `requestAnimationFrame`:
   - `DetectionEngine.detect()` captures and analyzes frame.
   - `FocusEngine.score()` computes score using face, stability, duration, distractions.
   - `SessionTracker` stores sample and possible distraction events.
   - `AudioEngine` runs/adjusts binaural mode by focus state.
   - `Dashboard` updates visual elements including ring, status text, and logs.
4. Stop: `stopSession()` ends the loop, stops camera/audio, and outputs summary.

## Behavior-Based AI Simulation
Focus score is computed as a weighted aggregate, mimicking a decision model:
- Face presence = confidence signal
- Stability = attention consistency signal
- Duration = cumulative focus stamina
- Distraction count = negative feedback loop

This design is intentionally maintainable and interpretable while appearing smarter than a simple threshold.
