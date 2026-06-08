import { Scene } from './scene.js';
import { Flower } from './flower.js';
import { HandTracking } from './handTracking.js';
import { PinchDetector } from './pinchDetector.js';
import { mirrorX, normalizedToWorld } from './coords.js';

const THUMB_TIP = 4;
const INDEX_TIP = 8;

const canvas = document.getElementById('scene');
const video = document.getElementById('cam');
const statusEl = document.getElementById('status');

const scene = new Scene(canvas);
scene.start();

const pinch = new PinchDetector();

// Spawn a flower from a normalized point (x,y in [0,1], origin top-left).
function spawnAt(nx, ny) {
  const world = normalizedToWorld(nx, ny, scene.halfWidth, scene.halfHeight);
  scene.addFlower(new Flower(world, scene.bottomY));
}

// Debug fallback: click to plant a flower (works without a camera).
canvas.addEventListener('click', (e) => {
  spawnAt(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
});

// Clear the garden with C.
window.addEventListener('keydown', (e) => {
  if (e.key === 'c' || e.key === 'C') scene.clear();
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
      spawnAt(nx, ny);
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
      '). You can still click anywhere to plant a flower. Press C to clear.';
  }
}

main();
