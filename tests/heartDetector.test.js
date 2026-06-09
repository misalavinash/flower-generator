import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HeartDetector } from '../src/heartDetector.js';

// Build a 21-landmark hand with only the thumb tip (4) and index tip (8) set.
function hand(thumbTip, indexTip) {
  const lm = Array.from({ length: 21 }, () => ({ x: 0, y: 0 }));
  lm[4] = thumbTip;
  lm[8] = indexTip;
  return lm;
}

// Two hands forming a heart: index tips touch high, thumb tips touch low.
function heartPose() {
  return [
    hand({ x: 0.47, y: 0.55 }, { x: 0.45, y: 0.40 }),
    hand({ x: 0.53, y: 0.55 }, { x: 0.55, y: 0.40 }),
  ];
}

test('detects a two-hand heart and fires once on the rising edge', () => {
  const d = new HeartDetector();
  let r = d.update(heartPose());
  assert.equal(r.isHeart, true);
  assert.equal(r.justFormed, true);
  // held -> no repeat
  r = d.update(heartPose());
  assert.equal(r.isHeart, true);
  assert.equal(r.justFormed, false);
});

test('reports a center near the centroid of the four fingertips and a positive size', () => {
  const d = new HeartDetector();
  const r = d.update(heartPose());
  assert.ok(Math.abs(r.center.x - 0.5) < 1e-9);
  assert.ok(Math.abs(r.center.y - 0.475) < 1e-9);
  assert.ok(r.size > 0 && r.size <= 0.3);
});

test('not a heart when index tips are far apart', () => {
  const d = new HeartDetector();
  const r = d.update([
    hand({ x: 0.47, y: 0.55 }, { x: 0.20, y: 0.40 }),
    hand({ x: 0.53, y: 0.55 }, { x: 0.80, y: 0.40 }),
  ]);
  assert.equal(r.isHeart, false);
  assert.equal(r.justFormed, false);
});

test('not a heart when thumb tips are below but index tips are also low (no heart orientation)', () => {
  const d = new HeartDetector();
  // index tips BELOW thumb tips -> wrong orientation
  const r = d.update([
    hand({ x: 0.47, y: 0.40 }, { x: 0.45, y: 0.55 }),
    hand({ x: 0.53, y: 0.40 }, { x: 0.55, y: 0.55 }),
  ]);
  assert.equal(r.isHeart, false);
});

test('one hand (or none) is never a heart', () => {
  const d = new HeartDetector();
  assert.equal(d.update([hand({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.4 })]).isHeart, false);
  assert.equal(d.update([]).isHeart, false);
  assert.equal(d.update(null).isHeart, false);
});

test('re-arming: fires again after the heart is released and reformed', () => {
  const d = new HeartDetector();
  assert.equal(d.update(heartPose()).justFormed, true);
  d.update(heartPose()); // held
  d.update([]);          // released
  assert.equal(d.update(heartPose()).justFormed, true);
});
