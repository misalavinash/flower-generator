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
