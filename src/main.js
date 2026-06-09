import { FlowerSketch } from './flowerSketch.js';
import { HandTracking } from './handTracking.js';
import { PinchDetector } from './pinchDetector.js';
import { HeartDetector } from './heartDetector.js';
import { heartPoints } from './heartShape.js';
import { mirrorX } from './coords.js';

const THUMB_TIP = 4;
const INDEX_TIP = 8;

const HEART_FLOWER_COUNT = 16;     // flowers around the heart outline
const HEART_PLANT_INTERVAL = 380;  // ms between flowers (each needs time to bloom)
const CLEAN_DELAY = 90;            // ms to wait after clean() before planting
const HEART_SIZE = 0.3;            // half-extent of the heart (normalized)
const HEART_CX = 0.5;              // centered on screen
const HEART_CY = 0.5;

const canvas = document.getElementById('canvas');
const video = document.getElementById('cam');
const statusEl = document.getElementById('status');
const cleanBtn = document.querySelector('.clean-btn');
const introEl = document.getElementById('intro');
const startBtn = document.getElementById('start-btn');
const nocamBtn = document.getElementById('nocam-btn');
const modeBtn = document.getElementById('mode-btn');

const sketch = new FlowerSketch(canvas);
sketch.start();

const pinch = new PinchDetector();
// Require the heart held for ~8 frames so transient / overlapping two-hand
// detections don't false-trigger.
const heart = new HeartDetector({ holdFrames: 8 });

// Flowers are planted one-per-interval (the shader grows one flower at a time),
// so the heart formation blooms point-by-point.
const plantQueue = [];
let heartActive = false; // a heart formation is being planted right now
let lastPlantTime = 0;

function pumpQueue() {
  if (plantQueue.length > 0) {
    const now = performance.now();
    if (now - lastPlantTime >= HEART_PLANT_INTERVAL) {
      const p = plantQueue.shift();
      sketch.plant(p.x, p.y);
      lastPlantTime = now;
      if (plantQueue.length === 0) heartActive = false;
    }
  }
  requestAnimationFrame(pumpQueue);
}
requestAnimationFrame(pumpQueue);

function startHeart() {
  heartActive = true;
  sketch.clean(); // wipe every other flower first
  // Begin planting just after the clean wipe so the first flowers aren't erased.
  setTimeout(() => {
    lastPlantTime = 0; // plant the first one immediately
    for (const p of heartPoints(HEART_CX, HEART_CY, HEART_SIZE, HEART_FLOWER_COUNT)) {
      plantQueue.push(p);
    }
  }, CLEAN_DELAY);
}

function clearAll() {
  plantQueue.length = 0;
  heartActive = false;
  sketch.clean();
}

// Fallback when there's no camera: click to plant a flower.
canvas.addEventListener('click', (e) => {
  if (heartActive) return;
  sketch.plant(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
});

cleanBtn.addEventListener('click', clearAll);
window.addEventListener('keydown', (e) => {
  if (e.key === 'c' || e.key === 'C') clearAll();
});

const tracking = new HandTracking(video);

function trackLoop() {
  if (!loopRunning) return; // stops cleanly when the camera is turned off
  const hands = tracking.detect(performance.now());
  const h = heart.update(hands);

  if (h.justFormed && !heartActive) {
    startHeart();
  } else if (!heartActive && !h.isHeart) {
    // Single-hand pinch -> plant one flower.
    const hand0 = hands && hands[0];
    if (hand0) {
      const thumb = hand0[THUMB_TIP];
      const index = hand0[INDEX_TIP];
      const { justPinched } = pinch.update(thumb, index);
      if (justPinched) {
        const nx = mirrorX((thumb.x + index.x) / 2);
        const ny = (thumb.y + index.y) / 2;
        sketch.plant(nx, ny);
      }
    } else {
      pinch.update(null, null);
    }
  } else {
    // While a heart is forming (or held), don't also fire the pinch.
    pinch.update(null, null);
  }

  requestAnimationFrame(trackLoop);
}

const GESTURE_MSG = 'Pinch 🤏 to plant a flower • two-hand 🫶 to bloom a heart • C to clear.';
const NOCAM_MSG = 'Camera off — click anywhere to plant a flower • C to clear.';

let cameraOn = false;
let loopRunning = false;

/* ── Landing-page demo: bloom random flowers in the margins beside the card
   while the intro is open. A steady per-frame fade keeps ~DEMO_MAX_FLOWERS
   alive at once — new ones appear while the oldest quietly fade out (a soft
   cap, not a hard integer count). Cleared when the visitor picks a mode. */
const DEMO_MAX_FLOWERS = 10;
const DEMO_PLANT_INTERVAL = 800; // ms between demo flowers
const DEMO_LIFETIME_S = (DEMO_MAX_FLOWERS * DEMO_PLANT_INTERVAL) / 1000;
// Per-frame fade so a flower is ~gone after DEMO_MAX_FLOWERS newer ones appear.
const DEMO_FADE = Math.pow(0.05, 1 / (DEMO_LIFETIME_S * 60));

let demoTimer = null;

// A random point in the empty columns to the left/right of the centered card.
function marginPoint() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardHalf = Math.min(500, vw * 0.9) / 2;
  const gap = 56;
  const regions = [];
  const leftMax = vw / 2 - cardHalf - gap;
  const rightMin = vw / 2 + cardHalf + gap;
  if (leftMax > 80) regions.push([24, leftMax]);
  if (vw - rightMin > 80) regions.push([rightMin, vw - 24]);
  if (regions.length === 0) return null; // too narrow — no room beside the card
  const [lo, hi] = regions[(Math.random() * regions.length) | 0];
  const px = lo + Math.random() * (hi - lo);
  const py = (0.12 + Math.random() * 0.74) * vh;
  return { x: px / vw, y: py / vh };
}

function startDemo() {
  if (demoTimer) return;
  sketch.fade = DEMO_FADE;
  const tick = () => { const p = marginPoint(); if (p) sketch.plant(p.x, p.y); };
  tick(); // bloom the first one right away
  demoTimer = setInterval(tick, DEMO_PLANT_INTERVAL);
}

function stopDemo() {
  if (demoTimer) { clearInterval(demoTimer); demoTimer = null; }
  sketch.fade = 1; // flowers persist again during the real session
}

// The camera is only touched after the visitor opts in from the intro screen.
async function startWithCamera() {
  stopDemo();
  introEl.classList.add('hidden');
  modeBtn.classList.remove('hidden');
  if (cameraOn) {                 // resuming an existing session
    statusEl.textContent = GESTURE_MSG;
    loopRunning = true;
    trackLoop();
    return;
  }
  sketch.clean();                 // clear the demo flowers for a fresh start
  try {
    statusEl.textContent = 'Loading camera + hand model…';
    await tracking.init();
    cameraOn = true;
    statusEl.textContent = GESTURE_MSG;
    loopRunning = true;
    trackLoop();
  } catch (err) {
    console.error(err);
    statusEl.textContent =
      'Camera/model unavailable (' + err.message +
      '). Click anywhere to plant a flower. Press C to clear.';
  }
}

function startWithoutCamera() {
  stopDemo();
  introEl.classList.add('hidden');
  modeBtn.classList.remove('hidden');
  loopRunning = false;
  if (cameraOn) {                 // turn the camera off if it was running
    tracking.stop();
    cameraOn = false;
  }
  sketch.clean();                 // clear the demo flowers
  statusEl.textContent = NOCAM_MSG;
}

startBtn.addEventListener('click', startWithCamera);
nocamBtn.addEventListener('click', startWithoutCamera);
// Reopen the chooser to switch modes; pause gestures and resume the demo.
modeBtn.addEventListener('click', () => {
  loopRunning = false;
  introEl.classList.remove('hidden');
  startDemo();
});

// The intro is visible on load — start the preview demo immediately.
startDemo();
