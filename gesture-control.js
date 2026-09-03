/* ============================================================
   GESTURE CONTROL — Hand gesture navigation via webcam
   Uses MediaPipe Hands (ES module import from CDN)
   
   Gestures:
     ✋ Open palm move UP/DOWN     → Scroll up/down
     ✋ Open palm move LEFT/RIGHT  → Scroll left/right
     👌 Pinch (thumb + index)      → Click element under cursor
     🤏 Pinch spread/close         → Zoom in/out
     ✊ Closed fist                 → Pause gesture tracking
     ✌️ Victory sign               → Reset zoom
   ============================================================ */

/* ── Config ─────────────────────────────────────────── */
let SCROLL_MULTIPLIER = 2200;       // scroll pixels per unit delta (adaptive)
const SCROLL_DEAD_ZONE = 0.012;     // ignore tiny movements
const SCROLL_HISTORY = 5;           // frames to average for smooth scroll
const ZOOM_HAND_DIST_MIN = 0.05;    // min change in hand distance to trigger zoom
const ZOOM_SENSITIVITY = 0.015;
const CLICK_COOLDOWN = 800;
const CURSOR_SMOOTHING = 0.4;

/* ── Landmark indices ───────────────────────────────── */
const WRIST = 0, THUMB_TIP = 4, INDEX_TIP = 8, MIDDLE_TIP = 12;
const RING_TIP = 16, PINKY_TIP = 20;
const INDEX_MCP = 5, MIDDLE_MCP = 9, RING_MCP = 13, PINKY_MCP = 17;

/* ── State ──────────────────────────────────────────── */
let isEnabled = false, isTracking = false, isPaused = false;
let handLandmarker = null;
let video = null, canvas = null, ctx = null, animFrame = null;
let prevPalmCenter = null;
let cursorX = window.innerWidth / 2, cursorY = window.innerHeight / 2;
let lastClickTime = 0, currentZoom = 1;
let cursorEl = null, gestureLabel = null, toggleBtn = null, previewWrap = null;
let prevTwoHandDist = null;  // distance between two hands for zoom

// Rolling average buffers for smooth scrolling
let dyHistory = [], dxHistory = [];

/* ── Helpers ──────────────────────────────────────────── */
function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function palmCenter(lm) {
  // Use middle finger MCP as primary reference — most stable point
  const pts = [lm[WRIST], lm[INDEX_MCP], lm[MIDDLE_MCP], lm[RING_MCP], lm[PINKY_MCP]];
  return { x: pts.reduce((s, p) => s + p.x, 0) / 5, y: pts.reduce((s, p) => s + p.y, 0) / 5 };
}

function fingerExtended(lm, tip, mcp) {
  return dist(lm[tip], lm[WRIST]) > dist(lm[mcp], lm[WRIST]) * 1.15;
}

function countExtended(lm) {
  let c = 0;
  if (dist(lm[THUMB_TIP], lm[INDEX_MCP]) > 0.08) c++;
  if (fingerExtended(lm, INDEX_TIP, INDEX_MCP)) c++;
  if (fingerExtended(lm, MIDDLE_TIP, MIDDLE_MCP)) c++;
  if (fingerExtended(lm, RING_TIP, RING_MCP)) c++;
  if (fingerExtended(lm, PINKY_TIP, PINKY_MCP)) c++;
  return c;
}

const isFist = lm => countExtended(lm) <= 1;
const isOpenPalm = lm => countExtended(lm) >= 4;

function isVictory(lm) {
  return fingerExtended(lm, INDEX_TIP, INDEX_MCP) &&
         fingerExtended(lm, MIDDLE_TIP, MIDDLE_MCP) &&
         !fingerExtended(lm, RING_TIP, RING_MCP) &&
         !fingerExtended(lm, PINKY_TIP, PINKY_MCP);
}

// Rolling average
function rollingAvg(arr, val, maxLen) {
  arr.push(val);
  if (arr.length > maxLen) arr.shift();
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/* ── Scroll via WheelEvent (works with Lenis) ─────────── */
function emitScroll(deltaX, deltaY) {
  // Lenis listens to wheel events, so dispatch a synthetic one
  window.dispatchEvent(new WheelEvent('wheel', {
    deltaX: deltaX,
    deltaY: deltaY,
    bubbles: true,
    cancelable: true
  }));
}

/* ── Visual feedback ──────────────────────────────────── */
function updateCursor(x, y) {
  // Clamp to viewport bounds
  x = Math.max(0, Math.min(window.innerWidth, x));
  y = Math.max(0, Math.min(window.innerHeight, y));
  cursorX = x; cursorY = y;
  if (cursorEl) { cursorEl.style.left = x + 'px'; cursorEl.style.top = y + 'px'; }
}

function showGesture(icon, text) {
  if (!gestureLabel) return;
  gestureLabel.textContent = icon + ' ' + text;
  gestureLabel.classList.add('visible');
  clearTimeout(gestureLabel._t);
  gestureLabel._t = setTimeout(() => gestureLabel.classList.remove('visible'), 1200);
}

/* ── Core gesture processing ──────────────────────────── */
let scrollActiveFrames = 0;

function processLandmarks(landmarks, allLandmarks) {
  // ── TWO HANDS → Zoom ──
  if (allLandmarks && allLandmarks.length >= 2) {
    const hand1 = allLandmarks[0];
    const hand2 = allLandmarks[1];

    // Validate both hands have proper landmark data
    if (!hand1 || hand1.length < 21 || !hand1[0]?.x || !hand2 || hand2.length < 21 || !hand2[0]?.x) {
      prevTwoHandDist = null; return;
    }

    // Use palm centers of both hands
    const pc1 = palmCenter(hand1);
    const pc2 = palmCenter(hand2);
    const handDist = dist(pc1, pc2);

    // Show zoom cursor between both hands
    const midX = ((1 - pc1.x) + (1 - pc2.x)) / 2 * window.innerWidth;
    const midY = (pc1.y + pc2.y) / 2 * window.innerHeight;
    cursorX += (midX - cursorX) * 0.5;
    cursorY += (midY - cursorY) * 0.5;
    updateCursor(cursorX, cursorY);
    if (cursorEl) { cursorEl.classList.add('active'); cursorEl.classList.add('zooming'); }

    if (prevTwoHandDist !== null) {
      const delta = handDist - prevTwoHandDist;
      if (Math.abs(delta) > 0.008) {
        // Hands spreading apart = zoom in, coming together = zoom out
        currentZoom = Math.max(0.5, Math.min(3, currentZoom + delta * 0.8));
        document.body.style.zoom = currentZoom;
        showGesture(delta > 0 ? '🔍+' : '🔍−', 'Zoom ' + (currentZoom * 100).toFixed(0) + '%');
      }
    }
    prevTwoHandDist = handDist;

    // Reset single-hand state
    prevPalmCenter = null; dyHistory = []; dxHistory = []; scrollActiveFrames = 0;
    return;
  }

  // Only one hand (or none) — clear two-hand state
  prevTwoHandDist = null;
  if (cursorEl) cursorEl.classList.remove('zooming');

  // ── SINGLE HAND gestures (scroll, click, fist, victory) ──
  if (!landmarks || !landmarks.length) {
    prevPalmCenter = null;
    dyHistory = []; dxHistory = [];
    scrollActiveFrames = 0;
    if (cursorEl) cursorEl.classList.remove('active');
    return;
  }


  const lm = landmarks;
  // Validate landmarks have proper structure (21 points with x,y)
  if (lm.length < 21 || !lm[INDEX_TIP] || typeof lm[INDEX_TIP].x !== 'number') {
    return;
  }
  if (cursorEl) cursorEl.classList.add('active');

  // Map hand to screen (mirrored X)
  const handX = (1 - lm[INDEX_TIP].x) * window.innerWidth;
  const handY = lm[INDEX_TIP].y * window.innerHeight;
  cursorX += (handX - cursorX) * (1 - CURSOR_SMOOTHING);
  cursorY += (handY - cursorY) * (1 - CURSOR_SMOOTHING);
  updateCursor(cursorX, cursorY);

  const pc = palmCenter(lm);

  // ── FIST → Pause ──
  if (isFist(lm)) {
    if (!isPaused) { isPaused = true; showGesture('✊', 'Paused'); cursorEl?.classList.add('paused'); }
    prevPalmCenter = null; dyHistory = []; dxHistory = [];
    scrollActiveFrames = 0;
    return;
  } else if (isPaused) {
    isPaused = false; cursorEl?.classList.remove('paused'); showGesture('✋', 'Resumed');
  }

  // ── PINCH (single hand) → Click ──
  const pinchDist = dist(lm[THUMB_TIP], lm[INDEX_TIP]);
  if (pinchDist < 0.06) {
    if (Date.now() - lastClickTime > CLICK_COOLDOWN) {
      lastClickTime = Date.now();
      const el = document.elementFromPoint(cursorX, cursorY);
      if (el) {
        el.click();
        showGesture('👌', 'Click');
        cursorEl?.classList.add('clicking');
        setTimeout(() => cursorEl?.classList.remove('clicking'), 300);
      }
    }
    prevPalmCenter = null; dyHistory = []; dxHistory = [];
    scrollActiveFrames = 0;
    return;
  }

  // ── OPEN PALM → Scroll ──
  if (isOpenPalm(lm) && prevPalmCenter) {
    const rawDy = pc.y - prevPalmCenter.y;
    const rawDx = pc.x - prevPalmCenter.x;

    // Rolling average to smooth out jitter
    const smoothDy = rollingAvg(dyHistory, rawDy, SCROLL_HISTORY);
    const smoothDx = rollingAvg(dxHistory, rawDx, SCROLL_HISTORY);

    scrollActiveFrames++;

    // Only scroll after a few frames of consistent palm movement (reduces false triggers)
    if (scrollActiveFrames > 3) {
      // Vertical scroll
      if (Math.abs(smoothDy) > SCROLL_DEAD_ZONE) {
        const scrollY = smoothDy * SCROLL_MULTIPLIER;
        emitScroll(0, scrollY);

        // Show direction indicator
        if (Math.abs(smoothDy) > SCROLL_DEAD_ZONE * 2) {
          showGesture(smoothDy > 0 ? '⬇️' : '⬆️', smoothDy > 0 ? 'Scroll Down' : 'Scroll Up');
        }
      }

      // Horizontal scroll
      if (Math.abs(smoothDx) > SCROLL_DEAD_ZONE * 1.5) {
        const scrollX = -smoothDx * SCROLL_MULTIPLIER * 0.7;
        emitScroll(scrollX, 0);
        showGesture(smoothDx < 0 ? '➡️' : '⬅️', smoothDx < 0 ? 'Scroll Right' : 'Scroll Left');
      }
    }
  } else {
    dyHistory = []; dxHistory = [];
    scrollActiveFrames = 0;
  }

  // ── VICTORY → Reset zoom ──
  if (isVictory(lm) && currentZoom !== 1) {
    currentZoom = 1; document.body.style.zoom = 1; showGesture('✌️', 'Zoom Reset');
  }

  prevPalmCenter = pc;
}

/* ── Draw skeleton ────────────────────────────────────── */
const CONNS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];

function drawSkeleton(landmarks) {
  if (!ctx || !canvas) return;
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.save(); ctx.translate(w, 0); ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, w, h);
  ctx.restore();

  if (!landmarks?.length) return;

  const colors = ['rgba(91,140,255,0.8)', 'rgba(52,211,153,0.8)'];
  const dotColors = [['#ff6b3d', '#5b8cff'], ['#ff6b3d', '#34d399']];

  for (let hi = 0; hi < landmarks.length; hi++) {
    const hand = landmarks[hi];
    ctx.strokeStyle = colors[hi] || colors[0]; ctx.lineWidth = 2;
    for (const [a, b] of CONNS) {
      ctx.beginPath();
      ctx.moveTo((1 - hand[a].x) * w, hand[a].y * h);
      ctx.lineTo((1 - hand[b].x) * w, hand[b].y * h);
      ctx.stroke();
    }
    for (let j = 0; j < hand.length; j++) {
      ctx.beginPath();
      ctx.arc((1 - hand[j].x) * w, hand[j].y * h, 3, 0, Math.PI * 2);
      ctx.fillStyle = (j === THUMB_TIP || j === INDEX_TIP) ? dotColors[hi][0] : dotColors[hi][1];
      ctx.fill();
    }
  }
}

/* ── Camera + detection loop ──────────────────────────── */
function startTracking() {
  if (isTracking) return;
  isTracking = true;

  // Adaptive camera resolution based on device
  const isMobile = window.innerWidth <= 768;
  const camWidth = isMobile ? 240 : 320;
  const camHeight = isMobile ? 180 : 240;

  let lastTimestamp = -1;

  navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: camWidth }, height: { ideal: camHeight }, facingMode: 'user' } })
    .then(stream => {
      video.srcObject = stream;
      video.play();
      function detect() {
        if (!isTracking || !handLandmarker) return;
        if (video.readyState >= 2) {
          // Ensure strictly increasing timestamps for MediaPipe
          const now = performance.now();
          if (now <= lastTimestamp) { animFrame = requestAnimationFrame(detect); return; }
          lastTimestamp = now;

          try {
            const result = handLandmarker.detectForVideo(video, now);
            const lms = result.landmarks;
            drawSkeleton(lms);
            processLandmarks(lms?.length ? lms[0] : null, lms);
          } catch (e) {
            // Don't let one bad frame kill the loop
            console.warn('[Gesture] Detection error:', e.message);
          }
        }
        animFrame = requestAnimationFrame(detect);
      }
      detect();
    })
    .catch(err => {
      console.error('[Gesture] Camera error:', err);
      showGesture('❌', 'Camera blocked');
      isEnabled = false; updateToggleUI();
    });
}

function stopTracking() {
  isTracking = false;
  if (animFrame) cancelAnimationFrame(animFrame);
  if (video?.srcObject) { video.srcObject.getTracks().forEach(t => t.stop()); video.srcObject = null; }
  if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  prevPalmCenter = null; prevTwoHandDist = null;
  dyHistory = []; dxHistory = []; scrollActiveFrames = 0;
  cursorEl?.classList.remove('active');
}

/* ── Toggle ───────────────────────────────────────────── */
function updateToggleUI() {
  toggleBtn?.classList.toggle('active', isEnabled);
  toggleBtn?.setAttribute('aria-pressed', String(isEnabled));
  previewWrap?.classList.toggle('visible', isEnabled);
}

function toggle() {
  isEnabled = !isEnabled;
  updateToggleUI();
  if (isEnabled) { startTracking(); showGesture('🖐️', 'Gestures ON'); }
  else { stopTracking(); showGesture('🚫', 'Gestures OFF'); if (currentZoom !== 1) { currentZoom = 1; document.body.style.zoom = 1; } }
}

/* ── Build UI ─────────────────────────────────────────── */
function buildUI() {
  toggleBtn = document.createElement('button');
  toggleBtn.id = 'gesture-toggle';
  toggleBtn.type = 'button';
  toggleBtn.setAttribute('aria-label', 'Toggle gesture control');
  toggleBtn.setAttribute('aria-pressed', 'false');
  toggleBtn.title = 'Enable gesture control (hand tracking)';
  toggleBtn.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 11V6a2 2 0 00-2-2 2 2 0 00-2 2"/>
    <path d="M14 10V4a2 2 0 00-2-2 2 2 0 00-2 2v7"/>
    <path d="M10 10.5V2a2 2 0 00-2-2 2 2 0 00-2 2v11"/>
    <path d="M6 11V9a2 2 0 00-2-2 2 2 0 00-2 2v7a8 8 0 0016 0V11a2 2 0 00-2-2 2 2 0 00-2 2"/>
  </svg>`;
  toggleBtn.addEventListener('click', toggle);
  document.body.appendChild(toggleBtn);

  previewWrap = document.createElement('div');
  previewWrap.id = 'gesture-preview';
  canvas = document.createElement('canvas');
  canvas.width = Math.min(240, window.innerWidth * 0.4);
  canvas.height = Math.min(180, window.innerWidth * 0.3);
  ctx = canvas.getContext('2d');

  video = document.createElement('video');
  video.setAttribute('playsinline', ''); video.muted = true;
  video.setAttribute('autoplay', '');
  video.style.display = 'none';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'gesture-preview-close';
  closeBtn.innerHTML = '✕'; closeBtn.title = 'Close preview';
  closeBtn.addEventListener('click', () => previewWrap.classList.remove('visible'));

  previewWrap.appendChild(canvas);
  previewWrap.appendChild(closeBtn);
  document.body.appendChild(previewWrap);
  document.body.appendChild(video);

  cursorEl = document.createElement('div'); cursorEl.id = 'gesture-cursor';
  document.body.appendChild(cursorEl);
  gestureLabel = document.createElement('div'); gestureLabel.id = 'gesture-label';
  document.body.appendChild(gestureLabel);

  // Handle orientation changes and resize
  function onResize() {
    if (canvas) {
      canvas.width = Math.min(240, window.innerWidth * 0.4);
      canvas.height = Math.min(180, window.innerWidth * 0.3);
    }
    // Adapt scroll speed to viewport height (faster on tall pages, slower on small screens)
    SCROLL_MULTIPLIER = Math.max(1200, Math.min(3000, window.innerHeight * 2.5));
    // Reset cursor to center on orientation change
    cursorX = window.innerWidth / 2;
    cursorY = window.innerHeight / 2;
  }
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', () => {
    setTimeout(onResize, 300); // Wait for layout to settle
  });
}

/* ── Init ─────────────────────────────────────────────── */
async function init() {
  if (!navigator.mediaDevices?.getUserMedia) {
    console.warn('[Gesture] No camera API.'); return;
  }

  buildUI();
  console.log('[Gesture] Loading MediaPipe HandLandmarker…');

  try {
    const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs');
    const { FilesetResolver, HandLandmarker } = vision;

    const filesetResolver = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
    );

    handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    console.log('[Gesture] ✓ Ready. Click the hand button (bottom-left) to enable.');
    toggleBtn.style.opacity = '1';
  } catch (err) {
    console.error('[Gesture] MediaPipe init failed:', err);
    if (toggleBtn) toggleBtn.style.display = 'none';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(init, 2000));
} else {
  setTimeout(init, 2000);
}
