import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flowerVertexShader, flowerFragmentShader } from '../src/flowerShader.js';

test('shaders are non-empty strings', () => {
  assert.equal(typeof flowerVertexShader, 'string');
  assert.equal(typeof flowerFragmentShader, 'string');
  assert.ok(flowerVertexShader.length > 0);
  assert.ok(flowerFragmentShader.length > 0);
});

test('fragment shader declares the expected uniforms and output', () => {
  for (const u of ['uBloom', 'uPetals', 'uColorA', 'uColorB', 'uSeed']) {
    assert.ok(flowerFragmentShader.includes(u), `missing uniform ${u}`);
  }
  assert.ok(flowerFragmentShader.includes('gl_FragColor'));
});

test('vertex shader passes uv varying', () => {
  assert.ok(flowerVertexShader.includes('vUv'));
  assert.ok(flowerVertexShader.includes('gl_Position'));
});
