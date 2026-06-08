// GLSL for the stem ribbon. Plain strings — no imports.
// aT is the per-vertex t (0 base .. 1 tip). uGrow reveals the stem from the
// base upward; the color is a vertical green gradient (darker base -> lighter
// near the flower).

export const stemVertexShader = /* glsl */ `
  attribute float aT;
  varying float vT;
  void main() {
    vT = aT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const stemFragmentShader = /* glsl */ `
  precision highp float;
  varying float vT;
  uniform float uGrow;       // 0..1 reveal height
  uniform vec3  uColorBase;  // color at the base
  uniform vec3  uColorTip;   // color near the flower

  void main() {
    // Only draw the grown portion (base -> uGrow).
    if (vT > uGrow) discard;
    vec3 col = mix(uColorBase, uColorTip, vT);
    gl_FragColor = vec4(col, 1.0);
  }
`;
