# FocusPulse Design Decisions

## Why client-side only?
- Fast deployment and near-zero infrastructure cost.
- Maximum user privacy: webcam input and processing never leave the device.
- Easy to demonstrate and share in a portfolio with static hosts.
- Lower attack surface and no server maintenance.

## Why no ML model?
- For prototype and hackathon speed, deterministic heuristics are easier to debug.
- The focus engine is designed as a behavior-based signal aggregator, which is explainable and reliable on device.
- A future enhancement path is to replace `focusEngine` with a small TensorFlow.js model once there is labeled data.

## Performance tradeoffs
- The main loop uses `requestAnimationFrame` for smooth UI updates and efficient CPU use.
- Detection sampling uses a low-res 160x120 canvas for cheap frame analysis.
- The waveform buffer is capped to avoid memory bloat.
- `AudioEngine` uses a lightweight oscillator graph with controlled gain ramps to avoid clicks and run-time spikes.

## Modular architecture benefits
- Team scale: each module has focused responsibilities.
- Testability: isolating `focusEngine` and `detectionEngine` allows unit tests.
- Maintainability: UI and business logic are separated, simplifying future redesigns.

## UX decisions
- Minimal, dark-mode friendly interface to reduce eye strain.
- Immediate status labels and session stats for quick user feedback.
- Actionable event log for users to trust system behavior.
- Support for multiple focus modes to make the product feel robust for interviews.
