# FocusPulse — AI-Powered Focus Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

FocusPulse is an innovative, real-time focus tracking application that leverages computer vision and audio cues to enhance productivity. Utilizing your device's webcam, it analyzes facial presence and provides instant feedback through a dynamic focus score, binaural beats, and session analytics—all processed locally for maximum privacy.

**Live Demo:** [https://ydhanush.tech/lander](https://ydhanush.tech/lander)

## Table of Contents
- [Features](#features)
- [How It Works](#how-it-works)
- [Benefits](#benefits)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [License](#license)

## Features
- **Real-Time Face Detection**: Employs skin-tone heuristics on pixel data to detect facial presence.
- **Dynamic Focus Score**: Displays a 0–100 focus score with an animated ring interface.
- **Binaural Beats Integration**: Generates Alpha, Beta, Theta, and Gamma waves using the Web Audio API.
- **Focus Waveform Visualization**: Renders a live canvas-based waveform of focus levels over time.
- **Distraction Logging**: Maintains a timestamped log of attention breaks.
- **Session Analytics**: Provides shareable reports including duration, average score, streaks, and distractions.
- **Privacy-First Design**: All processing occurs locally; no data is transmitted or stored externally.

## How It Works
FocusPulse operates entirely within the browser, requiring no installation or external dependencies. Upon starting a session, the application accesses the user's webcam to monitor facial activity. It uses pixel analysis to assess focus levels, updating the score in real-time. When distractions are detected, binaural beats are triggered to gently redirect attention. Session data is logged and summarized for review.

## Benefits
FocusPulse empowers users to maintain deep focus by offering immediate, non-intrusive feedback. It helps build self-awareness of productivity patterns, reduces micro-distractions, and supports sustained concentration during work or study sessions. Ideal for remote workers, students, and professionals seeking to optimize their cognitive performance.

## Tech Stack
- **Frontend Framework**: Vanilla HTML, CSS, and JavaScript (no external libraries)
- **Audio Processing**: Web Audio API for binaural beat generation
- **Media Access**: `getUserMedia` API for webcam integration
- **Graphics Rendering**: Canvas API for pixel analysis and waveform visualization
- **Styling and Animations**: CSS custom properties and keyframes for UI effects

## Installation
FocusPulse is a single-file web application with no dependencies. To deploy:

1. Clone or download the repository.
2. Upload `index.html` to a static hosting service such as:
   - **Vercel**: Configure with the provided `vercel.json` for automatic deployment.
   - **GitHub Pages**: Host directly from your repository.
   - **Other Platforms**: Any web server supporting static files.

## Usage
1. Open the application in a modern web browser with webcam support.
2. Grant camera permissions when prompted.
3. Click "Start Session" to begin monitoring.
4. Monitor your focus score, waveform, and logs in real-time.
5. Select binaural beat types as needed.
6. End the session to view and share your report.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
