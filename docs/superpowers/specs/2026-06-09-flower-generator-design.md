# Flower Generator — Design

**Date:** 2026-06-09
**Status:** Approved

## Summary

A browser-based creative sketch: the webcam tracks the user's hand, and pinching
thumb + index together plants a flower on screen. A green stem grows from the
bottom of the screen up to the pinch point, then a procedurally-generated flower
blooms at the top. Flowers accumulate into a garden over the live webcam feed.

Inspired by:
- [shape-creator-tutorial](https://github.com/collidingScopes/shape-creator-tutorial) — Three.js + MediaPipe hand-gesture scaffold.
- [Ksenia Kondrashova's flower CodePen](https://codepen.io/ksenia-k/full/RwqrxBG) — GLSL fragment-shader flower.

## Goals

- Track one hand via webcam and detect a thumb+index pinch.
- Each pinch plants a flower: stem grows from the bottom of the screen to the
  pinch location, then the flower blooms.
- Flowers are randomized each time (color palette, petal count, size).
- Flowers accumulate; pressing `C` clears them all.
- The live webcam feed is visible behind the flowers (mirrored, selfie view).

## Non-Goals

- Multi-hand support (single hand is enough; design should not preclude it).
- Saving/exporting the garden.
- Mobile/touch fallback controls.
- A build pipeline or framework.

## Stack & Approach

- **Three.js** — orthographic, full-screen scene for stems and flowers.
- **MediaPipe Tasks Vision `HandLandmarker`** — current, maintained hand-tracking API.
- **GLSL fragment shader** — procedural petals drawn in polar coordinates.
- **Vanilla ES modules + CDN import map** — no build step. Loaded from a CDN
  (e.g. jsDelivr/unpkg). Matches the reference projects; nothing to install.
- Served via a simple static server on `localhost` (required for webcam access
  and ES module imports).

## Architecture

A mirrored full-screen `<video>` element renders the webcam in the background.
A transparent Three.js `<canvas>` sits on top and draws the stems + flowers. An
**orthographic camera** maps screen space directly to world space, so a pinch at
screen point `(x, y)` plants a flower exactly there.

### Coordinate spaces

- MediaPipe returns normalized landmark coordinates in `[0, 1]` (origin top-left,
  in the raw, un-mirrored camera frame).
- The webcam video is displayed mirrored (`scaleX(-1)`) for a natural selfie view,
  so landmark `x` must be mirrored (`1 - x`) before mapping to screen/world.
- Screen coords map to the orthographic camera's world coords so flowers land
  where the user pinches.

### Modules

| File | Responsibility |
|------|----------------|
| `index.html` | Markup: `<video>` background, Three.js `<canvas>`, import map, status overlay. |
| `styles.css` | Full-screen layout, mirrored video, overlay styling. |
| `handTracking.js` | Initialize webcam + `HandLandmarker`; run per-frame detection; expose latest landmarks. Surfaces camera-permission errors. |
| `pinchDetector.js` | Compute thumb-tip↔index-tip distance; detect the **rising edge** (open → pinched) so one pinch = one flower; report pinch screen position (fingertip midpoint). |
| `flowerShader.js` | GLSL vertex + fragment source. Petals in polar coords; uniforms for `bloom` (0→1), color palette, petal count, seed. |
| `flower.js` | `Flower` class: owns a stem mesh + flower mesh, randomized params, and a lifecycle state machine (growing → blooming → idle). `update(dt)` advances animation. |
| `scene.js` | Three.js renderer, orthographic camera, resize handling, animation loop driving `flower.update`. |
| `main.js` | Wire-up: feed tracking → pinch detector → spawn `Flower`; handle `C` key to clear; manage flower list. |

### Data flow

```
webcam frame
  -> handTracking (HandLandmarker) -> landmarks
    -> pinchDetector -> { pinched: rising-edge?, screenPos }
      -> main: on rising edge, spawn Flower at screenPos
        -> scene loop: flower.update(dt) each frame (stem grows, then bloom animates)
```

## Flower lifecycle

1. **Spawn** — created at pinch position with randomized params (palette, petal
   count, size, seed). Stem starts at the bottom of the screen, height 0.
2. **Growing** — stem height interpolates from the bottom up to the flower's
   planted point over a short duration. Flower mesh hidden / `bloom = 0`.
3. **Blooming** — once the stem reaches the point, the flower's `bloom` uniform
   animates 0 → 1, opening the petals.
4. **Idle** — fully bloomed; gently persists. (Optional subtle sway is a stretch,
   not required.)

## Interaction

- **Pinch (thumb + index together):** plant one flower. Debounced via rising-edge
  detection so holding the pinch does not spawn a stream.
- **`C` key:** clear all flowers from the scene.
- Refresh resets everything.

## Error / edge cases

- **No camera permission / no device:** show a readable status message overlay;
  do not crash.
- **No hand detected:** no-op; pinch state treated as "open".
- **Pinch held:** only the open→pinched transition spawns a flower.
- **Window resize:** renderer + camera update to keep full-screen mapping;
  existing flowers keep their relative positions.
- **CDN/model load failure:** show a status message rather than a blank screen.

## Verification

This is a webcam/visual project, so full gesture testing requires the user's
camera. Automated/observable checks the implementer will perform:

- App serves and loads without console errors.
- Camera initializes (permission prompt appears) and the mirrored video shows.
- Three.js scene renders (transparent canvas over video).
- A simulated/forced pinch (or a temporary debug spawn) produces a stem that
  grows and a flower that blooms.
- `C` clears flowers.

A run command and a manual gesture checklist will be provided to the user for
final confirmation with their camera.

## Future extensions (out of scope)

- Two-hand support, sway/wind animation, export-to-image, color control via hand
  position, sound.
