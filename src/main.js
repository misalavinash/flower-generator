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

const sketch = new FlowerSketch(canvas);
sketch.start();

const pinch = new PinchDetector();
const heart = new HeartDetector();

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

async function main() {
  try {
    statusEl.textContent = 'Loading camera + hand model…';
    await tracking.init();
    statusEl.textContent =
      'Pinch to plant a flower • two-hand 🫶 to bloom a heart • C to clear.';
    setTimeout(() => { statusEl.style.opacity = '0'; }, 6000);
    trackLoop();
  } catch (err) {
    console.error(err);
    statusEl.textContent =
      'Camera/model unavailable (' + err.message +
      '). Click anywhere to plant a flower. Press C to clear.';
  }
}

main();
