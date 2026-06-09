// Pure two-hand heart (🫶) detection. MUST NOT import Three.js or browser APIs.
//
// A 🫶 is two DISTINCT hands (wrists apart, side by side) with both index
// fingertips together up top and both thumb tips together below. Checking the
// wrist separation is essential: with numHands=2 the tracker can return two
// overlapping detections of a single hand, whose tips are ~0 apart and would
// otherwise pass as a heart. A short sustained hold rejects transient/phantom
// detections. Reports the rising edge so one gesture fires once, plus the
// gesture's center + size (raw, un-mirrored) and diagnostics.

import { distance2D } from './pinchDetector.js';

const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_TIP = 8;

export class HeartDetector {
  constructor({
    indexThreshold = 0.12,
    thumbThreshold = 0.12,
    minHandSeparation = 0.1,
    holdFrames = 1,
    sizeFactor = 1.5,
  } = {}) {
    this.indexThreshold = indexThreshold;
    this.thumbThreshold = thumbThreshold;
    this.minHandSeparation = minHandSeparation;
    this.holdFrames = holdFrames;
    this.sizeFactor = sizeFactor;
    this.active = false;
    this.qualified = 0; // consecutive qualifying frames
  }

  // hands: array of hands, each a 21-entry landmark array of {x,y}.
  update(hands) {
    const count = Array.isArray(hands) ? hands.filter(Boolean).length : 0;
    const miss = {
      isHeart: false, justFormed: false,
      count, indexDist: null, thumbDist: null, wristDist: null, orient: false,
    };

    if (!hands || hands.length < 2 || !hands[0] || !hands[1]) {
      this.active = false;
      this.qualified = 0;
      return miss;
    }
    const a = hands[0];
    const b = hands[1];
    const aT = a[THUMB_TIP];
    const aI = a[INDEX_TIP];
    const bT = b[THUMB_TIP];
    const bI = b[INDEX_TIP];
    if (!aT || !aI || !bT || !bI) {
      this.active = false;
      this.qualified = 0;
      return miss;
    }

    const indexDist = distance2D(aI, bI);
    const thumbDist = distance2D(aT, bT);
    const wristDist = a[WRIST] && b[WRIST] ? distance2D(a[WRIST], b[WRIST]) : 0;
    const indexMidY = (aI.y + bI.y) / 2;
    const thumbMidY = (aT.y + bT.y) / 2;
    const orient = indexMidY < thumbMidY; // index tips above thumb tips

    const qualifies =
      indexDist < this.indexThreshold &&
      thumbDist < this.thumbThreshold &&
      wristDist > this.minHandSeparation && // two distinct, separated hands
      orient;

    const diag = { count, indexDist, thumbDist, wristDist, orient };

    if (!qualifies) {
      this.active = false;
      this.qualified = 0;
      return { isHeart: false, justFormed: false, ...diag };
    }

    // Require the pose held for a few frames before firing.
    this.qualified += 1;
    if (this.qualified < this.holdFrames) {
      return { isHeart: false, justFormed: false, ...diag };
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

    return { isHeart: true, justFormed, ...diag, center, size };
  }
}
