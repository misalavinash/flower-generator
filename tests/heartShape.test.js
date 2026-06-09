import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heartPoints } from '../src/heartShape.js';

test('returns the requested number of points', () => {
  assert.equal(heartPoints(0.5, 0.5, 0.2, 16).length, 16);
});

test('points stay within the normalized [0,1] range', () => {
  for (const p of heartPoints(0.5, 0.5, 0.3, 40)) {
    assert.ok(p.x >= 0 && p.x <= 1, `x out of range: ${p.x}`);
    assert.ok(p.y >= 0 && p.y <= 1, `y out of range: ${p.y}`);
  }
});

test('the formation is horizontally centered on cx', () => {
  const pts = heartPoints(0.5, 0.5, 0.2, 40);
  const avgX = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  assert.ok(Math.abs(avgX - 0.5) < 1e-6, `avgX = ${avgX}`);
});

test('first point sits at the top dip of the heart (x=cx, above center)', () => {
  const cx = 0.5;
  const cy = 0.5;
  const size = 0.2;
  const p = heartPoints(cx, cy, size, 16)[0];
  assert.ok(Math.abs(p.x - cx) < 1e-9);
  // t=0 => hy = 13-5-2-1 = 5; screen y is downward so the point is above cy
  assert.ok(Math.abs(p.y - (cy - (5 / 16) * size)) < 1e-9);
});
