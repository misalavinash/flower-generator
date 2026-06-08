# Flower Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A browser sketch where pinching thumb + index (tracked via webcam) plants a flower whose stem grows from the bottom of the screen and then blooms, over a live webcam feed.

**Architecture:** A mirrored full-screen `<video>` shows the webcam; a transparent Three.js canvas (orthographic camera) draws stems + GLSL-shader flowers on top. MediaPipe Tasks Vision `HandLandmarker` provides hand landmarks; a pure pinch detector fires a rising-edge event that spawns one flower at the pinch position. Pure logic (pinch, coordinate mapping, flower lifecycle) is unit-tested in Node; rendering/tracking is manually verified.

**Tech Stack:** Vanilla ES modules + CDN import map (no build step), Three.js, MediaPipe Tasks Vision, GLSL. Static server on localhost. Node's built-in test runner (`node --test`) for pure modules.

---

## File Structure

| File | Responsibility | Tested by |
|------|----------------|-----------|
| `package.json` | `type: module`, `start` + `test` scripts | — |
| `index.html` | Markup, import map, video + canvas + status overlay | manual |
| `styles.css` | Full-screen layout, mirrored video, overlay | manual |
| `src/coords.js` | Pure coordinate helpers (mirror, normalized→world) | `tests/coords.test.js` |
| `src/pinchDetector.js` | Pure pinch distance + rising-edge state machine | `tests/pinchDetector.test.js` |
| `src/flowerLifecycle.js` | Pure stem-grow + bloom timing/state | `tests/flowerLifecycle.test.js` |
| `src/flowerShader.js` | GLSL vertex + fragment source strings | `tests/flowerShader.test.js` |
| `src/flower.js` | `Flower` class: stem + shader head meshes + `update` | manual |
| `src/scene.js` | Three.js renderer, ortho camera, resize, loop | manual |
| `src/handTracking.js` | Webcam + `HandLandmarker` setup + per-frame detect | manual |
| `src/main.js` | Wire-up: tracking → pinch → spawn; C-key clear; status | manual |

The pure modules (`coords`, `pinchDetector`, `flowerLifecycle`, `flowerShader`) MUST NOT import Three.js or browser APIs, so they run under Node for testing.

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `styles.css`
- Create: `src/main.js` (placeholder)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "flower-generator",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "python3 -m http.server 8000",
    "test": "node --test tests/"
  }
}
```

- [ ] **Step 2: Create `styles.css`**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  width: 100%; height: 100%; overflow: hidden;
  background: #111; font-family: system-ui, sans-serif;
}
#cam {
  position: fixed; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  transform: scaleX(-1); /* mirror for natural selfie view */
  z-index: 0;
}
#scene {
  position: fixed; inset: 0;
  width: 100%; height: 100%;
  z-index: 1;
}
#status {
  position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%);
  z-index: 2;
  color: #fff; background: rgba(0,0,0,0.5);
  padding: 10px 18px; border-radius: 999px;
  font-size: 14px; transition: opacity 1s ease;
  pointer-events: none; text-align: center; max-width: 90vw;
}
```

- [ ] **Step 3: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Flower Generator</title>
  <link rel="stylesheet" href="styles.css" />
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js",
      "@mediapipe/tasks-vision": "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs"
    }
  }
  </script>
</head>
<body>
  <video id="cam" autoplay playsinline muted></video>
  <canvas id="scene"></canvas>
  <div id="status">Loading…</div>
  <script type="module" src="./src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create placeholder `src/main.js`**

```js
const status = document.getElementById('status');
status.textContent = 'Scaffold loaded.';
console.log('Flower Generator scaffold loaded');
```

- [ ] **Step 5: Verify it serves and loads**

Run: `python3 -m http.server 8000`
Then open `http://localhost:8000` in a browser.
Expected: page is dark, status pill reads "Scaffold loaded.", console logs "Flower Generator scaffold loaded", no errors. Stop the server with Ctrl-C.

- [ ] **Step 6: Commit**

```bash
git add package.json index.html styles.css src/main.js
git commit -m "feat: project scaffold (html, css, import map, server)"
```

---

## Task 2: Coordinate helpers (`coords.js`)

**Files:**
- Create: `src/coords.js`
- Test: `tests/coords.test.js`

- [ ] **Step 1: Write the failing test**

`tests/coords.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mirrorX, normalizedToWorld } from '../src/coords.js';

test('mirrorX flips around 0.5', () => {
  assert.equal(mirrorX(0), 1);
  assert.equal(mirrorX(1), 0);
  assert.equal(mirrorX(0.25), 0.75);
});

test('normalizedToWorld maps center to origin', () => {
  const p = normalizedToWorld(0.5, 0.5, 10, 8);
  assert.equal(p.x, 0);
  assert.equal(p.y, 0);
});

test('normalizedToWorld maps corners (top-left normalized origin)', () => {
  // nx=1, ny=0 => right edge, top edge
  const tr = normalizedToWorld(1, 0, 10, 8);
  assert.equal(tr.x, 10);
  assert.equal(tr.y, 8);
  // nx=0, ny=1 => left edge, bottom edge
  const bl = normalizedToWorld(0, 1, 10, 8);
  assert.equal(bl.x, -10);
  assert.equal(bl.y, -8);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/coords.test.js`
Expected: FAIL — cannot find module `../src/coords.js`.

- [ ] **Step 3: Write minimal implementation**

`src/coords.js`:
```js
// Pure coordinate helpers. MUST NOT import Three.js or browser APIs.

// MediaPipe returns normalized x in [0,1] from the raw (un-mirrored) frame.
// The video is displayed mirrored, so mirror x for display/interaction.
export function mirrorX(x) {
  return 1 - x;
}

// Map a normalized point (x,y in [0,1], origin top-left) to orthographic
// world coordinates (origin center, +y up) given the camera half-extents.
export function normalizedToWorld(nx, ny, halfWidth, halfHeight) {
  return {
    x: (nx - 0.5) * 2 * halfWidth,
    y: (0.5 - ny) * 2 * halfHeight,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/coords.test.js`
Expected: PASS — 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/coords.js tests/coords.test.js
git commit -m "feat: pure coordinate helpers with tests"
```

---

## Task 3: Pinch detector (`pinchDetector.js`)

**Files:**
- Create: `src/pinchDetector.js`
- Test: `tests/pinchDetector.test.js`

- [ ] **Step 1: Write the failing test**

`tests/pinchDetector.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { distance2D, PinchDetector } from '../src/pinchDetector.js';

test('distance2D computes euclidean distance', () => {
  assert.equal(distance2D({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
});

test('rising edge fires once when fingers close', () => {
  const d = new PinchDetector({ closeThreshold: 0.05, openThreshold: 0.08 });
  // far apart -> open
  let r = d.update({ x: 0, y: 0 }, { x: 0.2, y: 0 });
  assert.deepEqual(r, { pinched: false, justPinched: false });
  // close -> rising edge
  r = d.update({ x: 0, y: 0 }, { x: 0.02, y: 0 });
  assert.deepEqual(r, { pinched: true, justPinched: true });
  // still close (held) -> no new edge
  r = d.update({ x: 0, y: 0 }, { x: 0.02, y: 0 });
  assert.deepEqual(r, { pinched: true, justPinched: false });
});

test('hysteresis: must exceed openThreshold to release, then can fire again', () => {
  const d = new PinchDetector({ closeThreshold: 0.05, openThreshold: 0.08 });
  d.update({ x: 0, y: 0 }, { x: 0.02, y: 0 }); // pinch
  // between thresholds -> stays pinched
  let r = d.update({ x: 0, y: 0 }, { x: 0.06, y: 0 });
  assert.equal(r.pinched, true);
  // beyond openThreshold -> release
  r = d.update({ x: 0, y: 0 }, { x: 0.1, y: 0 });
  assert.equal(r.pinched, false);
  // close again -> new rising edge
  r = d.update({ x: 0, y: 0 }, { x: 0.02, y: 0 });
  assert.equal(r.justPinched, true);
});

test('missing landmarks reset to open without firing', () => {
  const d = new PinchDetector();
  d.update({ x: 0, y: 0 }, { x: 0.02, y: 0 }); // pinch
  const r = d.update(null, null);
  assert.deepEqual(r, { pinched: false, justPinched: false });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/pinchDetector.test.js`
Expected: FAIL — cannot find module `../src/pinchDetector.js`.

- [ ] **Step 3: Write minimal implementation**

`src/pinchDetector.js`:
```js
// Pure pinch detection. MUST NOT import Three.js or browser APIs.
// Points are { x, y } in normalized [0,1] coords.

export function distance2D(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Tracks pinch state with hysteresis and reports rising edges.
// closeThreshold < openThreshold avoids flicker / repeated spawns.
export class PinchDetector {
  constructor({ closeThreshold = 0.05, openThreshold = 0.08 } = {}) {
    this.closeThreshold = closeThreshold;
    this.openThreshold = openThreshold;
    this.pinched = false;
  }

  // Returns { pinched, justPinched }; justPinched is the open->closed edge.
  update(thumbTip, indexTip) {
    if (!thumbTip || !indexTip) {
      this.pinched = false;
      return { pinched: false, justPinched: false };
    }
    const d = distance2D(thumbTip, indexTip);
    let justPinched = false;
    if (!this.pinched && d < this.closeThreshold) {
      this.pinched = true;
      justPinched = true;
    } else if (this.pinched && d > this.openThreshold) {
      this.pinched = false;
    }
    return { pinched: this.pinched, justPinched };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/pinchDetector.test.js`
Expected: PASS — 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/pinchDetector.js tests/pinchDetector.test.js
git commit -m "feat: pinch detector with rising-edge + hysteresis"
```

---

## Task 4: Flower lifecycle (`flowerLifecycle.js`)

**Files:**
- Create: `src/flowerLifecycle.js`
- Test: `tests/flowerLifecycle.test.js`

- [ ] **Step 1: Write the failing test**

`tests/flowerLifecycle.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STATE, GROW_DURATION, BLOOM_DURATION, lifecycleAt,
} from '../src/flowerLifecycle.js';

test('at spawn: growing, no stem, no bloom', () => {
  const s = lifecycleAt(0);
  assert.equal(s.state, STATE.GROWING);
  assert.equal(s.stemProgress, 0);
  assert.equal(s.bloom, 0);
});

test('mid-grow: stem half up, no bloom', () => {
  const s = lifecycleAt(GROW_DURATION / 2);
  assert.equal(s.state, STATE.GROWING);
  assert.ok(Math.abs(s.stemProgress - 0.5) < 1e-9);
  assert.equal(s.bloom, 0);
});

test('mid-bloom: stem full, bloom partial', () => {
  const s = lifecycleAt(GROW_DURATION + BLOOM_DURATION / 2);
  assert.equal(s.state, STATE.BLOOMING);
  assert.equal(s.stemProgress, 1);
  assert.ok(Math.abs(s.bloom - 0.5) < 1e-9);
});

test('after bloom: idle, fully open', () => {
  const s = lifecycleAt(GROW_DURATION + BLOOM_DURATION + 5);
  assert.equal(s.state, STATE.IDLE);
  assert.equal(s.stemProgress, 1);
  assert.equal(s.bloom, 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/flowerLifecycle.test.js`
Expected: FAIL — cannot find module `../src/flowerLifecycle.js`.

- [ ] **Step 3: Write minimal implementation**

`src/flowerLifecycle.js`:
```js
// Pure flower lifecycle math. MUST NOT import Three.js or browser APIs.

export const STATE = {
  GROWING: 'growing',
  BLOOMING: 'blooming',
  IDLE: 'idle',
};

export const GROW_DURATION = 0.8;  // seconds for stem to reach full height
export const BLOOM_DURATION = 1.2; // seconds for the flower to open

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

// Given elapsed seconds since spawn, return the animation state.
// { state, stemProgress (0..1), bloom (0..1) }
export function lifecycleAt(elapsed) {
  if (elapsed < GROW_DURATION) {
    return {
      state: STATE.GROWING,
      stemProgress: clamp01(elapsed / GROW_DURATION),
      bloom: 0,
    };
  }
  const bloomElapsed = elapsed - GROW_DURATION;
  if (bloomElapsed < BLOOM_DURATION) {
    return {
      state: STATE.BLOOMING,
      stemProgress: 1,
      bloom: clamp01(bloomElapsed / BLOOM_DURATION),
    };
  }
  return { state: STATE.IDLE, stemProgress: 1, bloom: 1 };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/flowerLifecycle.test.js`
Expected: PASS — 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/flowerLifecycle.js tests/flowerLifecycle.test.js
git commit -m "feat: pure flower lifecycle timing"
```

---

## Task 5: Flower shader (`flowerShader.js`)

**Files:**
- Create: `src/flowerShader.js`
- Test: `tests/flowerShader.test.js`

- [ ] **Step 1: Write the failing test**

`tests/flowerShader.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flowerVertexShader, flowerFragmentShader } from '../src/flowerShader.js';

test('shaders are non-empty strings', () => {
  assert.equal(typeof flowerVertexShader, 'string');
  assert.equal(typeof flowerFragmentShader, 'string');
  assert.ok(flowerVertexShader.length > 0);
  assert.ok(flowerFragmentShader.length > 0);
});

test('fragment shader declares the expected uniforms and output', () => {
  for (const u of ['uBloom', 'uPetals', 'uColorA', 'uColorB', 'uSeed']) {
    assert.ok(flowerFragmentShader.includes(u), `missing uniform ${u}`);
  }
  assert.ok(flowerFragmentShader.includes('gl_FragColor'));
});

test('vertex shader passes uv varying', () => {
  assert.ok(flowerVertexShader.includes('vUv'));
  assert.ok(flowerVertexShader.includes('gl_Position'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/flowerShader.test.js`
Expected: FAIL — cannot find module `../src/flowerShader.js`.

- [ ] **Step 3: Write minimal implementation**

`src/flowerShader.js`:
```js
// GLSL source for the procedural flower head. Plain strings — no imports.

export const flowerVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const flowerFragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uBloom;   // 0..1 open amount
  uniform float uPetals;  // petal count
  uniform vec3  uColorA;  // outer petal color
  uniform vec3  uColorB;  // inner petal color
  uniform float uSeed;    // per-flower phase

  #define PI 3.14159265359

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;       // -1..1, center at 0
    float r = length(p);
    float a = atan(p.y, p.x);

    // Petal outline: abs(cos(k*a)) makes 2k lobes, so k = petals/2.
    float wave = abs(cos(a * uPetals * 0.5 + uSeed));
    float petalEdge = mix(0.25, 1.0, pow(wave, 0.6)) * uBloom;

    // Soft mask of the petal area.
    float mask = smoothstep(petalEdge, petalEdge - 0.05, r);
    if (mask < 0.01) discard;

    // Radial color gradient from inner to outer.
    vec3 col = mix(uColorB, uColorA, smoothstep(0.0, max(petalEdge, 0.001), r));

    // Bright center disc.
    float centerR = 0.18 * uBloom;
    float center = smoothstep(centerR + 0.02, centerR, r);
    col = mix(col, vec3(1.0, 0.85, 0.2), center);

    gl_FragColor = vec4(col, mask);
  }
`;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/flowerShader.test.js`
Expected: PASS — 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/flowerShader.js tests/flowerShader.test.js
git commit -m "feat: procedural flower GLSL shader"
```

---

## Task 6: Flower class (`flower.js`)

**Files:**
- Create: `src/flower.js`

This module imports Three.js, so it is verified in the browser (Task 9), not in Node. It uses `lifecycleAt`/`STATE` from Task 4 and the shaders from Task 5.

- [ ] **Step 1: Write `src/flower.js`**

```js
import * as THREE from 'three';
import { flowerVertexShader, flowerFragmentShader } from './flowerShader.js';
import { lifecycleAt, STATE } from './flowerLifecycle.js';

// Tiny seeded PRNG (Lehmer) for stable per-flower randomization.
function makeRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export class Flower {
  // worldPos: { x, y } target point (where the pinch happened).
  // bottomY: world y of the bottom of the screen (stem origin).
  constructor(worldPos, bottomY) {
    this.elapsed = 0;
    this.group = new THREE.Group();

    const rand = makeRandom(Math.floor(Math.random() * 1e9) + 1);
    this.size = 1.2 + rand() * 1.6;
    const petals = Math.floor(5 + rand() * 6); // 5..10
    const hueA = rand();
    const hueB = (hueA + 0.08 + rand() * 0.25) % 1;
    const colorA = new THREE.Color().setHSL(hueA, 0.75, 0.6);
    const colorB = new THREE.Color().setHSL(hueB, 0.85, 0.5);
    const seed = rand() * 10;

    this.x = worldPos.x;
    this.targetY = worldPos.y;
    this.bottomY = bottomY;
    this.stemHeight = Math.max(0.001, this.targetY - this.bottomY);

    // Stem: unit-height plane anchored at its base, scaled in y as it grows.
    const stemGeo = new THREE.PlaneGeometry(0.06, 1);
    stemGeo.translate(0, 0.5, 0); // base at y=0
    const stemMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(0.33, 0.6, 0.4),
      transparent: true,
    });
    this.stem = new THREE.Mesh(stemGeo, stemMat);
    this.stem.position.set(this.x, this.bottomY, 0);
    this.stem.scale.y = 0.0001;
    this.group.add(this.stem);

    // Flower head: shader plane at the target point.
    this.material = new THREE.ShaderMaterial({
      vertexShader: flowerVertexShader,
      fragmentShader: flowerFragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uBloom: { value: 0 },
        uPetals: { value: petals },
        uColorA: { value: colorA },
        uColorB: { value: colorB },
        uSeed: { value: seed },
      },
    });
    const headGeo = new THREE.PlaneGeometry(this.size, this.size);
    this.head = new THREE.Mesh(headGeo, this.material);
    this.head.position.set(this.x, this.targetY, 1);
    this.head.visible = false;
    this.group.add(this.head);
  }

  update(dt) {
    this.elapsed += dt;
    const { stemProgress, bloom, state } = lifecycleAt(this.elapsed);
    this.stem.scale.y = Math.max(0.0001, this.stemHeight * stemProgress);
    if (state === STATE.GROWING) {
      this.head.visible = false;
    } else {
      this.head.visible = true;
      this.material.uniforms.uBloom.value = bloom;
    }
  }

  dispose() {
    this.stem.geometry.dispose();
    this.stem.material.dispose();
    this.head.geometry.dispose();
    this.head.material.dispose();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/flower.js
git commit -m "feat: Flower class (growing stem + shader bloom head)"
```

(Visual verification happens in Task 9.)

---

## Task 7: Scene (`scene.js`)

**Files:**
- Create: `src/scene.js`

Browser-verified module. Provides the renderer, orthographic camera, resize handling, the flower list, and the animation loop.

- [ ] **Step 1: Write `src/scene.js`**

```js
import * as THREE from 'three';

export class Scene {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: true,
    });
    this.renderer.setClearColor(0x000000, 0); // transparent over the video
    this.scene = new THREE.Scene();

    this.halfHeight = 10; // fixed vertical world half-extent
    this.camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 100);
    this.camera.position.z = 10;

    this.flowers = [];
    this.lastTime = performance.now();

    window.addEventListener('resize', () => this._resize());
    this._resize();
  }

  get halfWidth() {
    return this.halfHeight * (window.innerWidth / window.innerHeight);
  }

  get bottomY() {
    return -this.halfHeight;
  }

  _resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    const hw = this.halfWidth;
    this.camera.left = -hw;
    this.camera.right = hw;
    this.camera.top = this.halfHeight;
    this.camera.bottom = -this.halfHeight;
    this.camera.updateProjectionMatrix();
  }

  addFlower(flower) {
    this.flowers.push(flower);
    this.scene.add(flower.group);
  }

  clear() {
    for (const f of this.flowers) {
      this.scene.remove(f.group);
      f.dispose();
    }
    this.flowers = [];
  }

  start() {
    const loop = () => {
      const now = performance.now();
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;
      for (const f of this.flowers) f.update(dt);
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scene.js
git commit -m "feat: Three.js scene with ortho camera + animation loop"
```

---

## Task 8: Hand tracking (`handTracking.js`)

**Files:**
- Create: `src/handTracking.js`

Browser-verified module wrapping MediaPipe Tasks Vision `HandLandmarker` + webcam. Thumb tip is landmark index 4, index-finger tip is index 8.

- [ ] **Step 1: Write `src/handTracking.js`**

```js
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export class HandTracking {
  constructor(video) {
    this.video = video;
    this.landmarker = null;
    this.lastVideoTime = -1;
    this.lastLandmarks = null;
  }

  async init() {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    );
    this.landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/' +
          'hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 1,
    });

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    this.video.srcObject = stream;
    await this.video.play();
  }

  // Returns the first hand's 21 landmarks (array of {x,y,z}) or null.
  detect(timestampMs) {
    if (!this.landmarker || this.video.readyState < 2) return null;
    if (this.video.currentTime === this.lastVideoTime) return this.lastLandmarks;
    this.lastVideoTime = this.video.currentTime;
    const result = this.landmarker.detectForVideo(this.video, timestampMs);
    this.lastLandmarks =
      result.landmarks && result.landmarks.length > 0
        ? result.landmarks[0]
        : null;
    return this.lastLandmarks;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/handTracking.js
git commit -m "feat: MediaPipe HandLandmarker webcam tracking"
```

---

## Task 9: Wire-up (`main.js`) + integration verification

**Files:**
- Modify: `src/main.js` (replace placeholder entirely)

- [ ] **Step 1: Replace `src/main.js` with the full wire-up**

```js
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
```

- [ ] **Step 2: Verify pure tests still pass**

Run: `node --test tests/`
Expected: PASS — all tests across coords, pinchDetector, flowerLifecycle, flowerShader.

- [ ] **Step 3: Verify in the browser (no camera needed first)**

Run: `python3 -m http.server 8000`
Open `http://localhost:8000`.
- Expected: status pill shows "Loading camera + hand model…".
- **Click** anywhere on the page. Expected: a green stem grows from the bottom of the screen up to the click point (~0.8s), then a colorful flower blooms (~1.2s). Each click produces a differently colored/sized flower.
- Press **C**. Expected: all flowers disappear.
- Check the console: no errors (a camera-permission denial is reported in the status pill, not as an uncaught error).

- [ ] **Step 4: Verify with the camera (gesture)**

Reload and **allow** camera access when prompted.
- Expected: your mirrored webcam shows behind the canvas; status updates to the pinch instructions then fades.
- Bring **thumb + index together**. Expected: one flower plants at the pinch location; releasing and pinching again plants another (holding the pinch does not spawn a stream).
- Press **C** to clear.

- [ ] **Step 5: Commit**

```bash
git add src/main.js
git commit -m "feat: wire tracking + pinch to flower spawning, C to clear"
```

---

## Task 10: README + final verification

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

```markdown
# Flower Generator

Pinch your thumb and index finger together in front of your webcam to plant a
flower: a stem grows from the bottom of the screen and a procedural flower blooms
at your pinch point. Flowers accumulate over the live webcam feed; press **C** to
clear them.

Built with Three.js (orthographic scene + GLSL flower shader) and MediaPipe Tasks
Vision (`HandLandmarker`). No build step — vanilla ES modules via a CDN import map.

## Run

A static server on localhost is required (webcam access + ES module imports):

    npm start          # python3 -m http.server 8000

Then open http://localhost:8000 and allow camera access.

No camera? Click anywhere to plant a flower instead.

## Controls

- **Pinch (thumb + index):** plant a flower
- **C:** clear all flowers

## Develop / test

    npm test           # runs pure-logic unit tests (node --test)

## Credits

- Hand-gesture + Three.js scaffold inspired by
  [collidingScopes/shape-creator-tutorial](https://github.com/collidingScopes/shape-creator-tutorial)
- Flower shader inspired by
  [Ksenia Kondrashova's CodePen](https://codepen.io/ksenia-k/full/RwqrxBG)
```

- [ ] **Step 2: Run the full test suite**

Run: `node --test tests/`
Expected: PASS — all unit tests pass.

- [ ] **Step 3: Final manual checklist (browser)**

Serve and open the app; confirm in order:
- App loads with no console errors.
- Clicking plants a growing-then-blooming flower; colors/sizes vary.
- Window resize keeps the scene full-screen and flowers in place.
- Camera (if allowed) shows mirrored; pinch plants flowers at the fingertips.
- `C` clears the garden.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add README with run + controls"
```

---

## Self-Review Notes

- **Spec coverage:** pinch detection (Task 3) ✓; stem-grow-then-bloom lifecycle (Task 4, 6) ✓; randomized flowers (Task 6) ✓; webcam-feed background mirrored (Task 1 CSS, Task 8) ✓; accumulate + `C` clear (Task 7 `clear`, Task 9) ✓; orthographic screen-space mapping (Task 2, 7) ✓; error/edge cases — no camera (Task 9 try/catch + click fallback), no hand (Task 9 `pinch.update(null,null)`), pinch held (Task 3 hysteresis), resize (Task 7) ✓; CDN/model load failure surfaced (Task 9 catch) ✓.
- **Type consistency:** `Flower(worldPos, bottomY)`, `scene.addFlower`/`scene.clear`/`scene.halfWidth`/`scene.halfHeight`/`scene.bottomY`, `PinchDetector.update → {pinched, justPinched}`, `lifecycleAt → {state, stemProgress, bloom}`, `tracking.detect → landmarks|null`, `normalizedToWorld(nx,ny,halfWidth,halfHeight)`, `mirrorX(x)` — all used consistently across tasks.
- **No placeholders:** every code step contains complete, runnable code.
