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
