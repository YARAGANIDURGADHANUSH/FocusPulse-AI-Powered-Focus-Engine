# FocusPulse — AI-Powered Focus Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)  [![GitHub stars](https://img.shields.io/github/stars/YARAGANIDURGADHANUSH/FocusPulse-AI-Powered-Focus-Engine?style=social)](https://github.com/YARAGANIDURGADHANUSH/FocusPulse-AI-Powered-Focus-Engine/stargazers)

> In-browser focus coaching engine with behavior-based scoring, binaural response, and full local privacy.

## 🎯 Project Snapshot
- Single-page browser app with modular source architecture
- Webcam-based focus detection and session learning
- AI-like scoring model (face, stability, duration, distraction penalties)
- Real-time visual feedback: progress ring, waveform, streak metrics
- Dynamic binaural audio support: **Alpha / Beta / Theta / Gamma**
- No backend, no data leaving user device

## 🚀 Quick Demo
- **Live Demo:** [https://ydhanush.tech/lander](https://ydhanush.tech/lander)
- **Repo:** https://github.com/YARAGANIDURGADHANUSH/FocusPulse-AI-Powered-Focus-Engine

## 🧩 Folder Structure
```
public/
  index.html
  styles.css
src/
  core/
    detectionEngine.js
    focusEngine.js
    audioEngine.js
  analytics/
    sessionTracker.js
    metrics.js
  services/
    cameraService.js
  ui/
    dashboard.js
    waveform.js
  main.js
docs/
  architecture.md
  design-decisions.md
README.md
LICENSE
vercel.json
```

## ✨ Feature Highlights
- **AI-like Focus Intelligence**: Weighted scoring built from multiple signals.
- **Behavioral Signals**: face presence, stability, session progression, distraction count.
- **Intervention Logic**: automatically triggers binaural beats on attention dips.
- **Modes**: Deep Work (Theta), Study (Beta), Focused Calm (Alpha), Peak (Gamma).
- **Analytics**: avg score, best streak, distraction frequency, duration.
- **Live Dashboard**: real-time score, mode, waveform graph, event log.
- **Privacy First**: all data remains client-side.

## 🧠 How It Works (elevator pitch)
1. `CameraService` controls webcam permissions and stream.
2. `DetectionEngine` samples video frames (160x120) and extracts face/stability signals.
3. `FocusEngine` computes a weighted 0–100 score and handles streak/distraction state.
4. `AudioEngine` runs binaural oscillators based on focus state and selected mode.
5. `SessionTracker` accumulates metrics and builds post-session report.
6. `Dashboard` renders UI elements and logs user event history.

## ✅ AI Scoring Model
Score = base + (face * w1 + stability * w2 + durationBonus * w3) - distractionPenalty
- face provides confidence signal (0/100)
- stability measures consistency
- duration is positive reinforcement
- distractions apply negative penalty
- tuned for realistic human behavior and ease of extension to ML later

## ▶️ Usage
1. Open `public/index.html` in a modern browser (Chrome/Edge/Firefox).
2. Allow camera access.
3. Choose focus mode (Alpha/Beta/Theta/Gamma).
4. Press `Start`.
5. Watch focus ring and waveform update.
6. Press `Stop`; session summary is logged and saved in-app.

## 📦 Local Deployment
- **GitHub Pages**: push `/public` contents to `gh-pages` branch or use GitHub Actions.
- **Vercel**: set project root to `/public` or use `vercel.json` rewrite.
- **Static Host**: place `public/index.html`, `public/styles.css` in root and open.

## 🛠 Developer Setup
```bash
git clone https://github.com/YARAGANIDURGADHANUSH/FocusPulse-AI-Powered-Focus-Engine.git
cd "FocusPulse — AI-Powered Focus Engine"
# Open public/index.html in browser or use local server:
# python -m http.server 8080
```

## 🧾 Docs
- `docs/architecture.md` – system pipeline and data flow
- `docs/design-decisions.md` – rationale (client-side, no ML model yet, performance)

## 📈 Why this is portfolio-ready
- Demonstrates modular architecture and clean engineering in a frontend product.
- Includes measurable session analytics with inferred ‘AI’ scoring.
- Great talking points for system design, algorithmic signals, and UX.
- Minimal dependencies and production deployment in a static environment.

## 📜 License
MIT. See [LICENSE](LICENSE).

