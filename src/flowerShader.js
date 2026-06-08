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
