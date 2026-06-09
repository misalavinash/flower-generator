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

let cameraOn = false;
let loopRunning = false;

// The camera is only touched after the visitor opts in from the intro screen.
async function startWithCamera() {
  introEl.classList.add('hidden');
  modeBtn.classList.remove('hidden');
  if (cameraOn) return; // already running (re-chosen from the intro)
  try {
    statusEl.textContent = 'Loading camera + hand model…';
    await tracking.init();
    cameraOn = true;
    statusEl.textContent =
      'Pinch 🤏 to plant a flower • two-hand 🫶 to bloom a heart • C to clear.';
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
  introEl.classList.add('hidden');
  modeBtn.classList.remove('hidden');
  // Turn the camera off if it was running, and stop processing frames.
  loopRunning = false;
  if (cameraOn) {
    tracking.stop();
    cameraOn = false;
  }
  statusEl.textContent = 'Camera off — click anywhere to plant a flower • C to clear.';
}

startBtn.addEventListener('click', startWithCamera);
nocamBtn.addEventListener('click', startWithoutCamera);
// Reopen the chooser to switch between camera / no-camera.
modeBtn.addEventListener('click', () => introEl.classList.remove('hidden'));
