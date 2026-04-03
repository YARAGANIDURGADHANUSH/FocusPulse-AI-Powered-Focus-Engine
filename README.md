# 🧠 FocusPulse — AI-Powered Focus Engine

> Stay in the zone. Always.

FocusPulse is a real-time, in-browser focus tracker that uses your webcam and pixel-analysis AI to detect when you drift — then fires binaural beats to pull you back. No install, no cloud, no data sent anywhere.

**Live demo:** https://ydhanush.tech/lander

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎥 **Face Presence Detection** | Detects if your face is in frame using skin-tone heuristics on pixel data |
| 🔵 **Focus Score Ring** | Real-time 0–100 score with smooth animated ring |
| 🎵 **Binaural Beats** | Alpha, Beta, Theta, Gamma — all generated via Web Audio API |
| 📊 **Focus Waveform** | Live canvas-drawn waveform of your focus over time |
| 📋 **Distraction Log** | Timestamped log of every attention break |
| 📈 **Session Report** | Shareable summary with duration, avg score, streak, distractions |
| 🔒 **100% Local** | Camera feed never leaves your device |

---

## 🚀 Deploy

### GitHub Pages / Static Host

Just push `index.html` to your repo root. This is a **zero-dependency single-file app**.

```bash
git init
git add .
git commit -m "feat: initial focuspulse release"
git remote add origin https://github.com/YOUR_USERNAME/focuspulse.git
git push -u origin main
```

Then in your web server (nginx/apache), point `/lander` to this file:

```nginx
location /lander {
  alias /var/www/focuspulse;
  try_files $uri $uri/ /lander/index.html;
}
```

Or just drop `index.html` into your server's `/lander/` directory.

---

## 🛠 Tech Stack

- Vanilla HTML/CSS/JS — zero frameworks, zero dependencies
- Web Audio API — real binaural beat generation
- `getUserMedia` — webcam access
- Canvas API — pixel analysis + waveform rendering
- CSS custom properties + animations — all UI effects

---

## 🏆 Hackathon Pitch

> "Every knowledge worker loses 3+ hours daily to micro-distractions. FocusPulse is the first focus tracker that runs entirely in the browser — no extension, no install, no cloud — using your webcam as a passive awareness sensor and binaural beats as an acoustic nudge system. It doesn't interrupt you; it guards you."

---

## 📄 License

MIT — built for the people, by the people.
