import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STATE, GROW_DURATION, BLOOM_DURATION, lifecycleAt,
} from '../src/flowerLifecycle.js';

test('at spawn: growing, no stem, no bloom', () => {
  const s = lifecycleAt(0);
  assert.equal(s.state, STATE.GROWING);
  assert.equal(s.stemProgress, 0);
  assert.equal(s.bloom, 0);
});

test('mid-grow: stem half up, no bloom', () => {
  const s = lifecycleAt(GROW_DURATION / 2);
  assert.equal(s.state, STATE.GROWING);
  assert.ok(Math.abs(s.stemProgress - 0.5) < 1e-9);
  assert.equal(s.bloom, 0);
});

test('mid-bloom: stem full, bloom partial', () => {
  const s = lifecycleAt(GROW_DURATION + BLOOM_DURATION / 2);
  assert.equal(s.state, STATE.BLOOMING);
  assert.equal(s.stemProgress, 1);
  assert.ok(Math.abs(s.bloom - 0.5) < 1e-9);
});

test('after bloom: idle, fully open', () => {
  const s = lifecycleAt(GROW_DURATION + BLOOM_DURATION + 5);
  assert.equal(s.state, STATE.IDLE);
  assert.equal(s.stemProgress, 1);
  assert.equal(s.bloom, 1);
});
