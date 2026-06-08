# Flower Generator

Pinch your thumb and index finger together in front of your webcam to plant a
flower: a stem grows from the bottom of the screen and a procedural flower blooms
at your pinch point. Flowers accumulate over the live webcam feed; press **C** to
clear them.

The flowers are drawn with Ksenia Kondrashova's full-screen feedback shader
(Three.js ping-pong render targets — each plant grows one flower at the pinch
point while previously planted flowers persist in the feedback texture). A final
display pass makes the empty background transparent so your webcam shows through.
Hand tracking is MediaPipe Tasks Vision (`HandLandmarker`). No build step —
vanilla ES modules via a CDN import map.

## Run

A static server on localhost is required (webcam access + ES module imports):

    npm start          # python3 -m http.server 8000

Then open http://localhost:8000 and allow camera access.

No camera? Click anywhere to plant a flower instead.

## Controls

- **Pinch (thumb + index):** plant a flower
- **C:** clear all flowers

## Develop / test

    npm test           # runs pure-logic unit tests (node --test)

## Credits

- Hand-gesture + Three.js scaffold inspired by
  [collidingScopes/shape-creator-tutorial](https://github.com/collidingScopes/shape-creator-tutorial)
- Flower shader inspired by
  [Ksenia Kondrashova's CodePen](https://codepen.io/ksenia-k/full/RwqrxBG)
