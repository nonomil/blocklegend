/**
 * 龙息×说中：念对单词后短窗口内龙息翻倍，把骑龙绑进学习闭环。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../data/combat.js';

const C = globalThis.BlockLegendCombat;
assert.ok(C, 'BlockLegendCombat must be injected');

test('龙息基础伤害 4，未说中不翻倍', () => {
  assert.equal(C.breathDamage({}), 4);
  assert.equal(C.breathDamage({ now: 9000, wordAt: 0 }), 4);
  assert.equal(C.breathDamage({ now: 9000, wordAt: 0, correct: false }), 4);
});

test('说中窗口内龙息 ×2，窗口外恢复基础', () => {
  assert.equal(C.breathDamage({ now: 3000, wordAt: 2000 }), 8);
  assert.equal(C.breathDamage({ now: 2000 + 8000, wordAt: 2000 }), 8);
  assert.equal(C.breathDamage({ now: 2000 + 8001, wordAt: 2000 }), 4);
});

test('答错或过期说中不翻倍', () => {
  assert.equal(C.breathDamage({ now: 1000, wordAt: 900, correct: false }), 4);
  assert.equal(C.breathDamage({ now: 20000, wordAt: 1000 }), 4);
});
