# Flower Generator

By [@misalavinash](https://www.misalavinash.com)

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
- **Two-hand heart (🫶):** clear the screen and bloom a heart of flowers
- **C:** clear all flowers

## Privacy

The camera is never accessed until you opt in on the start screen.

- Everything runs **in your browser**. Your camera video is used only for hand
  tracking and **never leaves your device** — no frames are uploaded, recorded,
  or stored.
- No accounts, no cookies, no analytics, no tracking.
- Hand tracking runs locally (MediaPipe, via WebAssembly). The only outside
  requests are one-time downloads of the Three.js + MediaPipe libraries/model
  from public CDNs (esm.sh, jsDelivr, Google storage).
- You can also use it **without the camera** (click to plant), and you can
  revoke camera access anytime in your browser's site settings.

## Develop / test

    npm test           # runs pure-logic unit tests (node --test)

## Credits

- Hand-gesture + Three.js scaffold inspired by
  [collidingScopes/shape-creator-tutorial](https://github.com/collidingScopes/shape-creator-tutorial)
- Flower shader inspired by
  [Ksenia Kondrashova's CodePen](https://codepen.io/ksenia-k/full/RwqrxBG)
