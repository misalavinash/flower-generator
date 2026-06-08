// Pure pinch detection. MUST NOT import Three.js or browser APIs.
// Points are { x, y } in normalized [0,1] coords.

export function distance2D(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Tracks pinch state with hysteresis and reports rising edges.
// closeThreshold < openThreshold avoids flicker / repeated spawns.
export class PinchDetector {
  constructor({ closeThreshold = 0.05, openThreshold = 0.08 } = {}) {
    this.closeThreshold = closeThreshold;
    this.openThreshold = openThreshold;
    this.pinched = false;
  }

  // Returns { pinched, justPinched }; justPinched is the open->closed edge.
  update(thumbTip, indexTip) {
    if (!thumbTip || !indexTip) {
      this.pinched = false;
      return { pinched: false, justPinched: false };
    }
    const d = distance2D(thumbTip, indexTip);
    let justPinched = false;
    if (!this.pinched && d < this.closeThreshold) {
      this.pinched = true;
      justPinched = true;
    } else if (this.pinched && d > this.openThreshold) {
      this.pinched = false;
    }
    return { pinched: this.pinched, justPinched };
  }
}
