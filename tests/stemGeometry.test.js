import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stemOffsetX, stemHalfWidth, buildStemRibbon } from '../src/stemGeometry.js';

const params = {
  x: 3,
  bottomY: -10,
  targetY: 6,
  bend: 2,        // lateral sweep at the base (world units)
  wiggleAmp: 1,
  wiggleFreq: 7,
  wigglePhase: 0.5,
  wBase: 0.14,    // half-width at base
  wTip: 0.05,     // half-width at tip
};

test('offset is zero at the top so the stem meets the flower', () => {
  assert.ok(Math.abs(stemOffsetX(1, params)) < 1e-9);
});

test('offset is non-zero at the base (stem leans/sweeps out)', () => {
  assert.ok(Math.abs(stemOffsetX(0, params)) > 1e-6);
});

test('half-width tapers from thick base to thin tip', () => {
  assert.equal(stemHalfWidth(0, params), 0.14);
  assert.equal(stemHalfWidth(1, params), 0.05);
  assert.ok(stemHalfWidth(0, params) > stemHalfWidth(1, params));
});

test('ribbon spans bottom to top with the right vertex count', () => {
  const samples = 20;
  const r = buildStemRibbon(params, samples);
  const vertexCount = (samples + 1) * 2;
  assert.equal(r.positions.length, vertexCount * 3);
  assert.equal(r.ts.length, vertexCount);
  // first pair sits at the base, last pair at the target height
  assert.ok(Math.abs(r.positions[1] - params.bottomY) < 1e-9);
  const lastY = r.positions[r.positions.length - 2];
  assert.ok(Math.abs(lastY - params.targetY) < 1e-9);
});

test('ribbon top center aligns with the flower x', () => {
  const samples = 10;
  const r = buildStemRibbon(params, samples);
  const n = r.positions.length;
  const leftTopX = r.positions[n - 6];  // left vertex of top pair
  const rightTopX = r.positions[n - 3]; // right vertex of top pair
  assert.ok(Math.abs((leftTopX + rightTopX) / 2 - params.x) < 1e-9);
});

test('ribbon indices form two triangles per segment', () => {
  const samples = 4;
  const r = buildStemRibbon(params, samples);
  assert.equal(r.indices.length, samples * 6);
});
