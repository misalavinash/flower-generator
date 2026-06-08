import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stemVertexShader, stemFragmentShader } from '../src/stemShader.js';

test('shaders are non-empty strings', () => {
  assert.equal(typeof stemVertexShader, 'string');
  assert.equal(typeof stemFragmentShader, 'string');
  assert.ok(stemVertexShader.length > 0);
  assert.ok(stemFragmentShader.length > 0);
});

test('vertex shader forwards the per-vertex t attribute', () => {
  assert.ok(stemVertexShader.includes('aT'));
  assert.ok(stemVertexShader.includes('vT'));
  assert.ok(stemVertexShader.includes('gl_Position'));
});

test('fragment shader clips growth and draws a gradient', () => {
  assert.ok(stemFragmentShader.includes('uGrow'));
  assert.ok(stemFragmentShader.includes('uColorBase'));
  assert.ok(stemFragmentShader.includes('uColorTip'));
  assert.ok(stemFragmentShader.includes('discard'));
  assert.ok(stemFragmentShader.includes('gl_FragColor'));
});
