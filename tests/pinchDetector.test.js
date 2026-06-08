import { test } from 'node:test';
import assert from 'node:assert/strict';
import { distance2D, PinchDetector } from '../src/pinchDetector.js';

test('distance2D computes euclidean distance', () => {
  assert.equal(distance2D({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
});

test('rising edge fires once when fingers close', () => {
  const d = new PinchDetector({ closeThreshold: 0.05, openThreshold: 0.08 });
  // far apart -> open
  let r = d.update({ x: 0, y: 0 }, { x: 0.2, y: 0 });
  assert.deepEqual(r, { pinched: false, justPinched: false });
  // close -> rising edge
  r = d.update({ x: 0, y: 0 }, { x: 0.02, y: 0 });
  assert.deepEqual(r, { pinched: true, justPinched: true });
  // still close (held) -> no new edge
  r = d.update({ x: 0, y: 0 }, { x: 0.02, y: 0 });
  assert.deepEqual(r, { pinched: true, justPinched: false });
});

test('hysteresis: must exceed openThreshold to release, then can fire again', () => {
  const d = new PinchDetector({ closeThreshold: 0.05, openThreshold: 0.08 });
  d.update({ x: 0, y: 0 }, { x: 0.02, y: 0 }); // pinch
  // between thresholds -> stays pinched
  let r = d.update({ x: 0, y: 0 }, { x: 0.06, y: 0 });
  assert.equal(r.pinched, true);
  // beyond openThreshold -> release
  r = d.update({ x: 0, y: 0 }, { x: 0.1, y: 0 });
  assert.equal(r.pinched, false);
  // close again -> new rising edge
  r = d.update({ x: 0, y: 0 }, { x: 0.02, y: 0 });
  assert.equal(r.justPinched, true);
});

test('missing landmarks reset to open without firing', () => {
  const d = new PinchDetector();
  d.update({ x: 0, y: 0 }, { x: 0.02, y: 0 }); // pinch
  const r = d.update(null, null);
  assert.deepEqual(r, { pinched: false, justPinched: false });
});
