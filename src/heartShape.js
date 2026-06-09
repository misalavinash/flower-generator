// Pure heart-formation generator. MUST NOT import Three.js or browser APIs.
//
// Samples the classic parametric heart curve and places `count` points around
// it, centered at (cx, cy) with a given half-size, in normalized screen coords
// (origin top-left, so y is flipped relative to the math curve).

export function heartPoints(cx, cy, size, count) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);
    // The curve spans roughly [-16, 16] in x; normalize by 16 then scale.
    let x = cx + (hx / 16) * size;
    let y = cy - (hy / 16) * size; // minus: screen y points down
    x = Math.min(1, Math.max(0, x));
    y = Math.min(1, Math.max(0, y));
    pts.push({ x, y });
  }
  return pts;
}
