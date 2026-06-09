// Pure coordinate helper. MUST NOT import Three.js or browser APIs.

// MediaPipe returns normalized x in [0,1] from the raw (un-mirrored) frame.
// The video is displayed mirrored, so mirror x for display/interaction.
export function mirrorX(x) {
  return 1 - x;
}
