# 🧪 FocusPulse Complete Flow Test Checklist

## PRE-TEST SETUP
- [ ] Hard refresh browser: **Ctrl+F5** (or Cmd+Shift+R on Mac)
- [ ] Clear cache 3x if needed
- [ ] Open Developer Console: **F12** → **Console** tab
- [ ] Keep console visible during entire test

---

## PHASE 1: INITIALIZATION (30 seconds)
Watch the console for these messages in order:

- [ ] `🔷 BOOTSTRAP: Starting initialization...`
- [ ] `📦 BOOTSTRAP: Importing main module...`
- [ ] `✅ All modules imported successfully`
- [ ] `✅ BOOTSTRAP: Main module imported`
- [ ] `✓ startSession available as window.startFocus`
- [ ] `✓ stopSession available as window.stopFocus`
- [ ] `✅ BOOTSTRAP: App initialized successfully`
- [ ] `🔧 Attaching button event listeners...`
- [ ] `✓ Buttons found, attaching listeners...`
- [ ] `✅ Button event listeners attached`
- [ ] `✅ FocusPulse initialized successfully`
- [ ] `Ready to start session. Click Start button.`

**Expected Result:** All messages appear, NO red errors.

---

## PHASE 2: BUTTON RESPONSIVENESS (10 seconds)

### Test Start Button:
1. **Click "Start" button**
   - [ ] Console shows: `🔷 safeStartClick called`
   - [ ] Console shows: `✓ Calling window.startFocus`
   - [ ] Console shows: `✓ START BUTTON CLICKED ✓✓✓`
   - [ ] Console shows: `📹 Requesting camera access...`

2. **Browser asks for camera permission**
   - [ ] Camera permission dialog appears
   - [ ] Click **"Allow"** to grant camera access
   - [ ] Console shows: `✓ Camera access granted`

3. **Session starts**
   - [ ] Start button becomes disabled (grayed out)
   - [ ] Stop button becomes enabled (bright green)
   - [ ] Console shows: `Session started`
   - [ ] Alert shows: `✓ Focus Session Started`
   - [ ] Camera video appears in video element
   - [ ] Event log shows: `Session started`

**Expected Result:** Camera feed appears, buttons change state, session begins.

---

## PHASE 3: LIVE SESSION (30-60 seconds)

1. **Metrics Update in Real-time**
   - [ ] Focus Score changes (0-100)
   - [ ] Ring indicator updates with color
   - [ ] Duration timer counts up (0s → 10s → 20s...)
   - [ ] Waveform animation shows live data
   - [ ] Event log updates with new entries

2. **Eye Tracking Works**
   - [ ] Keep your face in camera frame
   - [ ] Score should increase (60-80+)
   - [ ] Move face out of frame
   - [ ] Score should drop to 0
   - [ ] Alert appears: `⚠ Face not detected - Please stay in frame`

3. **Console Shows Live Updates**
   - [ ] No red errors
   - [ ] Occasional console logs (focus scores, metrics)
   - [ ] No significant lag or freezing

**Expected Result:** Real-time metrics update, session tracks focus accurately.

---

## PHASE 4: STOP SESSION (10 seconds)

1. **Click "Stop" button**
   - [ ] Console shows: `🔷 safeStopClick called`
   - [ ] Console shows: `✓ STOP BUTTON CLICKED ✓✓✓`
   - [ ] Console shows: `Session stopped`
   - [ ] Alert shows: `✓ Session Completed`

2. **Report Card Appears**
   - [ ] Modal overlay appears with report
   - [ ] Session summary shows:
     - [ ] Duration (e.g., "0:45")
     - [ ] Average focus percentage
     - [ ] Distraction count
     - [ ] Best streak time
   - [ ] Category badge shows (Gamma/Delta/Beta/Alpha)
   - [ ] Performance metrics visible

3. **Buttons Update**
   - [ ] Start button re-enabled (bright green)
   - [ ] Stop button disabled (grayed out)

**Expected Result:** Full report generated, buttons reset for new session.

---

## PHASE 5: PDF GENERATION (Optional)

1. **Download Certificate**
   - [ ] Click "🏆 Download Certificate" button
   - [ ] PDF downloads to Downloads folder
   - [ ] Certificate shows session details, category, achievements

2. **Download Detailed Report**
   - [ ] Click "📊 Download Detailed Report" button
   - [ ] PDF downloads to Downloads folder
   - [ ] Report shows scientific metrics, recommendations

**Expected Result:** Both PDFs generate and download successfully.

---

## PHASE 6: NEW SESSION

1. **Click "↻ New Session"**
   - [ ] Report modal closes
   - [ ] Console clears (or shows initialization again)
   - [ ] Start button ready
   - [ ] Event log visible

2. **Repeat Session**
   - [ ] Click Start again
   - [ ] Full flow works again

**Expected Result:** Application resets, ready for another session.

---

## ✅ COMPLETE FLOW SUCCESS CRITERIA

**ALL of the following must be true:**

- [x] Initialization completes without errors
- [x] Buttons respond to clicks immediately
- [x] Camera access works
- [x] Session starts and tracks metrics
- [x] Face detection works (score increases with face visible)
- [x] Session stops cleanly
- [x] Report generates correctly
- [x] PDF downloads work
- [x] New session resets properly
- [x] No console errors throughout

---

## 🐛 TROUBLESHOOTING

**If buttons don't work:**
- [ ] Screenshot console (F12 → Console tab)
- [ ] Look for red error messages
- [ ] Copy exact error text
- [ ] Report specific error

**If camera doesn't start:**
- [ ] Check browser permissions
- [ ] Ensure no other app using camera
- [ ] Try different browser (Chrome/Firefox/Edge)

**If metrics don't update:**
- [ ] Check that face is in frame
- [ ] Move head slightly
- [ ] Check lighting (good bright light helps)

---

## 📝 FINAL REPORT

After testing, save this checklist and provide:

```
COMPLETE FLOW TEST RESULT:
✓ PASS - All sections working
OR
✗ FAIL - Failed at Phase: [X], Issue: [description]
```

Then screenshot the console showing final state.

---

**Good luck! 🚀**
