// Pure two-hand heart (🫶) detection. MUST NOT import Three.js or browser APIs.
//
// A 🫶 is: both index fingertips together up top, both thumb tips together at
// the bottom, hands mirrored. We measure cross-hand fingertip distances, which
// is unambiguous against a single-hand pinch. Reports the rising edge so one
// gesture fires once, plus the gesture's center + size (raw, un-mirrored).

import { distance2D } from './pinchDetector.js';

const THUMB_TIP = 4;
const INDEX_TIP = 8;

export class HeartDetector {
  constructor({ indexThreshold = 0.12, thumbThreshold = 0.12, sizeFactor = 1.5 } = {}) {
    this.indexThreshold = indexThreshold;
    this.thumbThreshold = thumbThreshold;
    this.sizeFactor = sizeFactor;
    this.active = false;
  }

  // hands: array of hands, each a 21-entry landmark array of {x,y}.
  update(hands) {
    if (!hands || hands.length < 2 || !hands[0] || !hands[1]) {
      this.active = false;
      return { isHeart: false, justFormed: false };
    }
    const a = hands[0];
    const b = hands[1];
    const aT = a[THUMB_TIP];
    const aI = a[INDEX_TIP];
    const bT = b[THUMB_TIP];
    const bI = b[INDEX_TIP];
    if (!aT || !aI || !bT || !bI) {
      this.active = false;
      return { isHeart: false, justFormed: false };
    }

    const indexDist = distance2D(aI, bI);
    const thumbDist = distance2D(aT, bT);
    const indexMidY = (aI.y + bI.y) / 2;
    const thumbMidY = (aT.y + bT.y) / 2;

    const isHeart =
      indexDist < this.indexThreshold &&
      thumbDist < this.thumbThreshold &&
      indexMidY < thumbMidY; // index tips above thumb tips

    if (!isHeart) {
      this.active = false;
      return { isHeart: false, justFormed: false };
    }

    const justFormed = !this.active;
    this.active = true;

    const xs = [aT.x, aI.x, bT.x, bI.x];
    const ys = [aT.y, aI.y, bT.y, bI.y];
    const center = {
      x: (xs[0] + xs[1] + xs[2] + xs[3]) / 4,
      y: (ys[0] + ys[1] + ys[2] + ys[3]) / 4,
    };
    const w = Math.max(...xs) - Math.min(...xs);
    const h = Math.max(...ys) - Math.min(...ys);
    const size = Math.min(0.3, Math.max(0.08, this.sizeFactor * 0.5 * Math.max(w, h)));

    return { isHeart: true, justFormed, center, size };
  }
}
