import * as THREE from 'three';

// Renders flowers using Ksenia Kondrashova's CodePen technique (RwqrxBG):
// a full-screen shader that draws one growing flower at u_cursor each "plant",
// ping-ponged through two render targets so previously drawn flowers persist
// in a feedback texture. The final display pass makes empty (black) pixels
// transparent so the webcam feed behind the canvas shows through.
export class FlowerSketch {
  constructor(canvas) {
    this.pointer = { x: 0.5, y: 0.5, clicked: false, vanishCanvas: false };

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.sceneShader = new THREE.Scene();
    this.sceneBasic = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
    this.clock = new THREE.Clock();

    this.renderTargets = [
      new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight),
      new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight),
    ];

    const vert = document.getElementById('vertexShader').textContent;
    const frag = document.getElementById('fragmentShader').textContent;
    const displayFrag = document.getElementById('displayFragmentShader').textContent;

    this.shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        // Start past the bloom window (>1) so no flower is drawn until the
        // first plant resets this to 0. Otherwise a flower blooms at the
        // default centered cursor on page load.
        u_stop_time: { value: 8 },
        u_stop_randomizer: {
          value: new THREE.Vector2(Math.random(), Math.random()),
        },
        u_cursor: { value: new THREE.Vector2(this.pointer.x, this.pointer.y) },
        u_ratio: { value: window.innerWidth / window.innerHeight },
        u_texture: { value: null },
        u_clean: { value: 1 },
      },
      vertexShader: vert,
      fragmentShader: frag,
    });

    this.displayMaterial = new THREE.ShaderMaterial({
      uniforms: { u_texture: { value: null } },
      vertexShader: vert,
      fragmentShader: displayFrag,
      transparent: true,
    });

    const geo = new THREE.PlaneGeometry(2, 2);
    this.sceneShader.add(new THREE.Mesh(geo, this.shaderMaterial));
    this.sceneBasic.add(new THREE.Mesh(geo, this.displayMaterial));

    window.addEventListener('resize', () => this._resize());
    this._resize();
  }

  _resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.shaderMaterial.uniforms.u_ratio.value = w / h;
    this.renderer.setSize(w, h);
    this.renderTargets[0].setSize(w, h);
    this.renderTargets[1].setSize(w, h);
    this.clean(); // resizing discards the feedback buffer; wipe cleanly
  }

  // Plant a flower at a normalized point (x,y in [0,1], origin top-left).
  plant(nx, ny) {
    this.pointer.x = nx;
    this.pointer.y = ny;
    this.pointer.clicked = true;
  }

  // Clear all flowers. Cancels any pending plant and freezes an in-progress
  // flower (pushes its timer past the bloom window) so nothing re-appears
  // after the one-frame wipe, then blanks the feedback buffer.
  clean() {
    this.pointer.clicked = false;
    this.shaderMaterial.uniforms.u_stop_time.value = 8; // past the bloom window
    this.pointer.vanishCanvas = true;
    setTimeout(() => { this.pointer.vanishCanvas = false; }, 50);
  }

  start() {
    const render = () => {
      this.shaderMaterial.uniforms.u_clean.value = this.pointer.vanishCanvas ? 0 : 1;
      this.shaderMaterial.uniforms.u_texture.value = this.renderTargets[0].texture;

      if (this.pointer.clicked) {
        this.shaderMaterial.uniforms.u_cursor.value =
          new THREE.Vector2(this.pointer.x, 1 - this.pointer.y);
        this.shaderMaterial.uniforms.u_stop_randomizer.value =
          new THREE.Vector2(Math.random(), Math.random());
        this.shaderMaterial.uniforms.u_stop_time.value = 0;
        this.pointer.clicked = false;
      }
      this.shaderMaterial.uniforms.u_stop_time.value += this.clock.getDelta();

      // Draw into target[1], reading target[0] as the feedback texture.
      this.renderer.setRenderTarget(this.renderTargets[1]);
      this.renderer.render(this.sceneShader, this.camera);

      // Blit the result to the screen with content-based alpha.
      this.displayMaterial.uniforms.u_texture.value = this.renderTargets[1].texture;
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.sceneBasic, this.camera);

      // Swap targets for the next frame.
      const tmp = this.renderTargets[0];
      this.renderTargets[0] = this.renderTargets[1];
      this.renderTargets[1] = tmp;

      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }
}
