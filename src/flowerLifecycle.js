// Pure flower lifecycle math. MUST NOT import Three.js or browser APIs.

export const STATE = {
  GROWING: 'growing',
  BLOOMING: 'blooming',
  IDLE: 'idle',
};

export const GROW_DURATION = 0.8;  // seconds for stem to reach full height
export const BLOOM_DURATION = 1.2; // seconds for the flower to open

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

// Given elapsed seconds since spawn, return the animation state.
// { state, stemProgress (0..1), bloom (0..1) }
export function lifecycleAt(elapsed) {
  if (elapsed < GROW_DURATION) {
    return {
      state: STATE.GROWING,
      stemProgress: clamp01(elapsed / GROW_DURATION),
      bloom: 0,
    };
  }
  const bloomElapsed = elapsed - GROW_DURATION;
  if (bloomElapsed < BLOOM_DURATION) {
    return {
      state: STATE.BLOOMING,
      stemProgress: 1,
      bloom: clamp01(bloomElapsed / BLOOM_DURATION),
    };
  }
  return { state: STATE.IDLE, stemProgress: 1, bloom: 1 };
}
