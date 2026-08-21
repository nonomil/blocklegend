/**
 * 骑乘龙不再走四视图方盒：细长有机剪影 + 紫金校队色。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../data/fx.js';
import '../data/dragon-rig.js';
import '../data/academy-dragon.js';

const Spec = globalThis.BlockLegendAcademyDragon;
assert.ok(Spec, 'BlockLegendAcademyDragon must be injected');

test('造型是有机细长，不是方盒拼接', () => {
  assert.equal(Spec.form, 'organic');
  assert.ok(Spec.neck.length / Spec.body.height >= 2.2, '脖子要比身子细长');
  assert.ok(Spec.tail.length / Spec.body.length >= 2.4, '尾巴要拖得长');
  assert.ok(Spec.wing.span / Spec.body.length >= 2.8, '翅展要大');
  assert.ok(Spec.neck.radius < Spec.body.radius * 0.55, '颈要比胸细');
});

test('身躯是一条连续 loft，不是一截一截圆柱', () => {
  assert.equal(Spec.skin, 'loft');
  assert.equal(Spec.spineMeshes, 1);
});

test('按设计文档：胸腰臀体积、翅膜拱起、物理材质', () => {
  assert.ok(Spec.chestRadius > Spec.waistRadius, '胸要比腰鼓');
  assert.ok(Spec.hipRadius > Spec.waistRadius, '臀要比腰鼓');
  assert.ok(Spec.wing.zBend >= 0.5, '膜要明显拱起');
  assert.equal(Spec.material, 'physical');
});

test('紫金校队色，不抄红龙', () => {
  assert.equal(Spec.palette.scale, 0x6a3b8a);
  assert.equal(Spec.palette.gold, 0xd4a843);
  assert.equal(Spec.palette.highlight, 0xf0e68c);
  assert.equal(Spec.palette.shadow, 0x3a1c4a);
  assert.notEqual(Spec.palette.scale, 0x8b1a1a);
});

test('关节数仍对接现有 rig 数字', () => {
  const Rig = globalThis.BlockLegendDragonRig;
  assert.equal(Spec.joints.neck, Rig.NECK);
  assert.equal(Spec.joints.wing, Rig.WING);
  assert.equal(Spec.joints.tail, Rig.TAIL);
});

test('鳞片画布纹理、翅脉、爬行类组合头', () => {
  assert.equal(Spec.scaleTexture, true);
  assert.ok(Spec.wingVeins >= 4, '金骨脉络至少 4 条');
  assert.deepEqual(Spec.headParts, ['skull', 'snout', 'jaw', 'horn']);
});
