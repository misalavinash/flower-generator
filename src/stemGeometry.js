// Pure stem-path math. MUST NOT import Three.js or browser APIs.
//
// Ports the spirit of Ksenia Kondrashova's flower CodePen stem (RwqrxBG):
// a stem that meets the flower at the top (offset 0) and sweeps/wavers out
// toward the base via a quadratic lean plus a fading noise wiggle, with a
// width that tapers from a thick base to a thin tip.
//
// Parameter t runs 0 (screen-bottom base) -> 1 (flower at the top).

// Lateral offset of the stem centerline at t. Zero at the top (t=1) so the
// stem connects to the flower; grows toward the base.
export function stemOffsetX(t, params) {
  const fromTop = 1 - t;
  const lean = params.bend * fromTop * fromTop;          // quadratic sweep
  const wiggle =
    params.wiggleAmp *
    Math.sin(t * params.wiggleFreq + params.wigglePhase) *
    fromTop;                                             // fades to 0 at flower
  return lean + wiggle;
}

// Half-width of the stem ribbon at t: thick base -> thin tip.
export function stemHalfWidth(t, params) {
  return params.wBase + (params.wTip - params.wBase) * t;
}

// Build a ribbon (triangle-strip-as-triangles) along the stem path in world
// coords. Returns plain arrays so this stays Three.js-free and testable.
// - positions: flat [x,y,z, ...], a left+right vertex pair per sample row
// - ts:        per-vertex t (0..1), for gradient color + grow clipping
// - indices:   two triangles per segment between consecutive rows
export function buildStemRibbon(params, samples) {
  const positions = [];
  const ts = [];
  const indices = [];
  const span = params.targetY - params.bottomY;

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const cx = params.x + stemOffsetX(t, params);
    const y = params.bottomY + t * span;
    const hw = stemHalfWidth(t, params);
    positions.push(cx - hw, y, 0); // left
    positions.push(cx + hw, y, 0); // right
    ts.push(t, t);
  }

  for (let i = 0; i < samples; i++) {
    const l0 = i * 2;
    const r0 = l0 + 1;
    const l1 = l0 + 2;
    const r1 = l0 + 3;
    indices.push(l0, r0, l1); // triangle 1
    indices.push(r0, r1, l1); // triangle 2
  }

  return { positions, ts, indices };
}
