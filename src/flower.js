import * as THREE from 'three';
import { flowerVertexShader, flowerFragmentShader } from './flowerShader.js';
import { stemVertexShader, stemFragmentShader } from './stemShader.js';
import { buildStemRibbon } from './stemGeometry.js';
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

    // Curved, tapered, slightly wavy stem (positions are in world coords —
    // see stemGeometry.js). Offset is zero at the top so it meets the flower
    // and sweeps out toward the base, with a fading noise wiggle.
    const stemParams = {
      x: this.x,
      bottomY: this.bottomY,
      targetY: this.targetY,
      bend: (rand() - 0.5) * 0.18 * this.stemHeight, // random lean
      wiggleAmp: 0.05 * this.stemHeight,
      wiggleFreq: 4 + rand() * 5,
      wigglePhase: rand() * Math.PI * 2,
      wBase: 0.16, // half-width at base
      wTip: 0.05,  // half-width near the flower
    };
    const ribbon = buildStemRibbon(stemParams, 48);
    const stemGeo = new THREE.BufferGeometry();
    stemGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(ribbon.positions), 3)
    );
    stemGeo.setAttribute(
      'aT',
      new THREE.BufferAttribute(new Float32Array(ribbon.ts), 1)
    );
    stemGeo.setIndex(ribbon.indices);

    const stemHue = 0.30 + rand() * 0.06; // green with per-flower variation
    this.stemMaterial = new THREE.ShaderMaterial({
      vertexShader: stemVertexShader,
      fragmentShader: stemFragmentShader,
      transparent: true,
      uniforms: {
        uGrow: { value: 0 },
        uColorBase: { value: new THREE.Color().setHSL(stemHue, 0.65, 0.28) },
        uColorTip: { value: new THREE.Color().setHSL(stemHue + 0.02, 0.7, 0.5) },
      },
    });
    this.stem = new THREE.Mesh(stemGeo, this.stemMaterial); // world-space, no offset
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
    this.stemMaterial.uniforms.uGrow.value = stemProgress;
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
