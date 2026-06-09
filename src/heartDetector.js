// Pure two-hand heart (🫶) detection. MUST NOT import Three.js or browser APIs.
//
// A 🫶 is two DISTINCT hands (wrists apart, side by side) with both index
// fingertips together up top and both thumb tips together below. Checking the
// wrist separation is essential: with numHands=2 the tracker can return two
// overlapping detections of a single hand, whose tips are ~0 apart and would
// otherwise pass as a heart. A short sustained hold rejects transient/phantom
// detections. Reports the rising edge so one gesture fires once.

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
  } = {}) {
    this.indexThreshold = indexThreshold;
    this.thumbThreshold = thumbThreshold;
    this.minHandSeparation = minHandSeparation;
    this.holdFrames = holdFrames;
    this.active = false;
    this.qualified = 0; // consecutive qualifying frames
  }

  // hands: array of hands, each a 21-entry landmark array of {x,y}.
  // Returns { isHeart, justFormed } where justFormed is the rising edge.
  update(hands) {
    const reset = () => {
      this.active = false;
      this.qualified = 0;
      return { isHeart: false, justFormed: false };
    };

    if (!hands || hands.length < 2 || !hands[0] || !hands[1]) return reset();
    const a = hands[0];
    const b = hands[1];
    const aT = a[THUMB_TIP];
    const aI = a[INDEX_TIP];
    const bT = b[THUMB_TIP];
    const bI = b[INDEX_TIP];
    if (!aT || !aI || !bT || !bI) return reset();

    const wristDist = a[WRIST] && b[WRIST] ? distance2D(a[WRIST], b[WRIST]) : 0;
    const qualifies =
      distance2D(aI, bI) < this.indexThreshold && // index tips together (top)
      distance2D(aT, bT) < this.thumbThreshold && // thumb tips together (bottom)
      wristDist > this.minHandSeparation &&        // two distinct, separated hands
      (aI.y + bI.y) / 2 < (aT.y + bT.y) / 2;       // index tips above thumb tips

    if (!qualifies) return reset();

    // Require the pose held for a few frames before firing.
    this.qualified += 1;
    if (this.qualified < this.holdFrames) {
      return { isHeart: false, justFormed: false };
    }
    const justFormed = !this.active;
    this.active = true;
    return { isHeart: true, justFormed };
  }
}
