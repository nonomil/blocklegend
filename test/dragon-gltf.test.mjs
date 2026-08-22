/**
 * 骑乘龙 GLB 加载器：有 academy-dragon.glb 时优先，否则回落程序化龙。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../data/dragon-gltf.js';

const G = globalThis.BlockLegendDragonGltf;
assert.ok(G, 'BlockLegendDragonGltf must be injected');

test('GLB 路径锁定，未加载前 isReady 为 false', () => {
  assert.equal(G.path, 'assets/models/academy-dragon-rig.glb');
  assert.equal(G.isReady(), false);
  assert.equal(G.targetLength, 3.45);
});

test('灰模材质可被识别', () => {
  assert.equal(G.isClayMaterial({ color: { r: 0.7, g: 0.7, b: 0.72 } }), true);
  assert.equal(G.isClayMaterial({ color: { r: 0.7, g: 0.7, b: 0.72 }, map: {} }), false);
  assert.equal(G.isClayMaterial({ color: { r: 0.9, g: 0.2, b: 0.1 } }), false);
});
