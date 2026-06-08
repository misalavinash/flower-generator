import { FlowerSketch } from './flowerSketch.js';
import { HandTracking } from './handTracking.js';
import { PinchDetector } from './pinchDetector.js';
import { mirrorX } from './coords.js';

const THUMB_TIP = 4;
const INDEX_TIP = 8;

const canvas = document.getElementById('canvas');
const video = document.getElementById('cam');
const statusEl = document.getElementById('status');
const cleanBtn = document.querySelector('.clean-btn');

const sketch = new FlowerSketch(canvas);
sketch.start();

const pinch = new PinchDetector();

// Fallback when there's no camera: click to plant a flower.
canvas.addEventListener('click', (e) => {
  sketch.plant(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
});

// Clear the screen.
cleanBtn.addEventListener('click', () => sketch.clean());
window.addEventListener('keydown', (e) => {
  if (e.key === 'c' || e.key === 'C') sketch.clean();
});

const tracking = new HandTracking(video);

function trackLoop() {
  const landmarks = tracking.detect(performance.now());
  if (landmarks) {
    const thumb = landmarks[THUMB_TIP];
    const index = landmarks[INDEX_TIP];
    const { justPinched } = pinch.update(thumb, index);
    if (justPinched) {
      // Midpoint of the two fingertips, mirrored to match the selfie view.
      const nx = mirrorX((thumb.x + index.x) / 2);
      const ny = (thumb.y + index.y) / 2;
      sketch.plant(nx, ny);
    }
  } else {
    pinch.update(null, null);
  }
  requestAnimationFrame(trackLoop);
}

async function main() {
  try {
    statusEl.textContent = 'Loading camera + hand model…';
    await tracking.init();
    statusEl.textContent =
      'Pinch thumb + index to plant a flower. Press C to clear.';
    setTimeout(() => { statusEl.style.opacity = '0'; }, 5000);
    trackLoop();
  } catch (err) {
    console.error(err);
    statusEl.textContent =
      'Camera/model unavailable (' + err.message +
      '). Click anywhere to plant a flower. Press C to clear.';
  }
}

main();
