import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mirrorX, normalizedToWorld } from '../src/coords.js';

test('mirrorX flips around 0.5', () => {
  assert.equal(mirrorX(0), 1);
  assert.equal(mirrorX(1), 0);
  assert.equal(mirrorX(0.25), 0.75);
});

test('normalizedToWorld maps center to origin', () => {
  const p = normalizedToWorld(0.5, 0.5, 10, 8);
  assert.equal(p.x, 0);
  assert.equal(p.y, 0);
});

test('normalizedToWorld maps corners (top-left normalized origin)', () => {
  // nx=1, ny=0 => right edge, top edge
  const tr = normalizedToWorld(1, 0, 10, 8);
  assert.equal(tr.x, 10);
  assert.equal(tr.y, 8);
  // nx=0, ny=1 => left edge, bottom edge
  const bl = normalizedToWorld(0, 1, 10, 8);
  assert.equal(bl.x, -10);
  assert.equal(bl.y, -8);
});
