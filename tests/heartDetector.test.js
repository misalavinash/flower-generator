import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HeartDetector } from '../src/heartDetector.js';

// Build a 21-landmark hand with wrist (0), thumb tip (4) and index tip (8) set.
function hand(thumbTip, indexTip, wrist = { x: 0, y: 0 }) {
  const lm = Array.from({ length: 21 }, () => ({ x: 0, y: 0 }));
  lm[0] = wrist;
  lm[4] = thumbTip;
  lm[8] = indexTip;
  return lm;
}

// Two DISTINCT hands forming a heart: wrists apart (side by side), index tips
// touching up top, thumb tips touching below.
function heartPose() {
  return [
    hand({ x: 0.49, y: 0.55 }, { x: 0.48, y: 0.40 }, { x: 0.42, y: 0.70 }),
    hand({ x: 0.51, y: 0.55 }, { x: 0.52, y: 0.40 }, { x: 0.58, y: 0.70 }),
  ];
}

test('detects a two-hand heart and fires once on the rising edge', () => {
  const d = new HeartDetector();
  let r = d.update(heartPose());
  assert.equal(r.isHeart, true);
  assert.equal(r.justFormed, true);
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

test('not a heart when index tips are far apart (hands still distinct)', () => {
  const d = new HeartDetector();
  const r = d.update([
    hand({ x: 0.49, y: 0.55 }, { x: 0.20, y: 0.40 }, { x: 0.42, y: 0.70 }),
    hand({ x: 0.51, y: 0.55 }, { x: 0.80, y: 0.40 }, { x: 0.58, y: 0.70 }),
  ]);
  assert.equal(r.isHeart, false);
});

test('not a heart with wrong orientation (index tips below thumb tips)', () => {
  const d = new HeartDetector();
  const r = d.update([
    hand({ x: 0.49, y: 0.40 }, { x: 0.48, y: 0.55 }, { x: 0.42, y: 0.70 }),
    hand({ x: 0.51, y: 0.40 }, { x: 0.52, y: 0.55 }, { x: 0.58, y: 0.70 }),
  ]);
  assert.equal(r.isHeart, false);
});

test('one hand (or none) is never a heart', () => {
  const d = new HeartDetector();
  assert.equal(d.update([hand({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.4 })]).isHeart, false);
  assert.equal(d.update([]).isHeart, false);
  assert.equal(d.update(null).isHeart, false);
});

test('NOT a heart when the two hands overlap (one hand detected twice)', () => {
  const d = new HeartDetector();
  // Tips close + correct orientation, but wrists coincide -> not two distinct hands.
  const r = d.update([
    hand({ x: 0.500, y: 0.55 }, { x: 0.500, y: 0.40 }, { x: 0.500, y: 0.70 }),
    hand({ x: 0.505, y: 0.55 }, { x: 0.505, y: 0.40 }, { x: 0.505, y: 0.70 }),
  ]);
  assert.equal(r.isHeart, false);
  assert.equal(r.justFormed, false);
});

test('always reports diagnostics (hand count + tip distances + orientation)', () => {
  const d = new HeartDetector();
  const m = d.update(heartPose());
  assert.equal(m.count, 2);
  assert.ok(m.indexDist >= 0);
  assert.ok(m.thumbDist >= 0);
  assert.equal(typeof m.orient, 'boolean');

  const none = d.update([]);
  assert.equal(none.count, 0);
  assert.equal(none.indexDist, null);
  assert.equal(none.thumbDist, null);
});

test('re-arming: fires again after the heart is released and reformed', () => {
  const d = new HeartDetector();
  assert.equal(d.update(heartPose()).justFormed, true);
  d.update(heartPose()); // held
  d.update([]);          // released
  assert.equal(d.update(heartPose()).justFormed, true);
});

test('holdFrames requires the pose sustained for N frames before firing', () => {
  const d = new HeartDetector({ holdFrames: 3 });
  assert.equal(d.update(heartPose()).isHeart, false); // frame 1
  assert.equal(d.update(heartPose()).isHeart, false); // frame 2
  const r = d.update(heartPose());                    // frame 3 -> fires
  assert.equal(r.isHeart, true);
  assert.equal(r.justFormed, true);
});

test('holdFrames resets if the pose is interrupted before reaching N', () => {
  const d = new HeartDetector({ holdFrames: 3 });
  d.update(heartPose()); // 1
  d.update([]);          // interrupted -> reset
  d.update(heartPose()); // 1 again
  assert.equal(d.update(heartPose()).isHeart, false); // only 2 consecutive
});
