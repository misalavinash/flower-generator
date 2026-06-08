// Pure coordinate helpers. MUST NOT import Three.js or browser APIs.

// MediaPipe returns normalized x in [0,1] from the raw (un-mirrored) frame.
// The video is displayed mirrored, so mirror x for display/interaction.
export function mirrorX(x) {
  return 1 - x;
}

// Map a normalized point (x,y in [0,1], origin top-left) to orthographic
// world coordinates (origin center, +y up) given the camera half-extents.
export function normalizedToWorld(nx, ny, halfWidth, halfHeight) {
  return {
    x: (nx - 0.5) * 2 * halfWidth,
    y: (0.5 - ny) * 2 * halfHeight,
  };
}
