import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mirrorX } from '../src/coords.js';

test('mirrorX flips around 0.5', () => {
  assert.equal(mirrorX(0), 1);
  assert.equal(mirrorX(1), 0);
  assert.equal(mirrorX(0.25), 0.75);
});
