/**
 * 动作词：玩家做的事要立刻闪出英文名。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../data/action-words.js';

const A = globalThis.BlockLegendActionWords;
assert.ok(A, 'BlockLegendActionWords must be injected');

test('七个动作都有英文词和不超过 2 秒的停留', () => {
    ['jump', 'swim', 'cut', 'eat', 'ride', 'hurt', 'die'].forEach(function (kind) {
        const spec = A.ofAction(kind);
        assert.ok(spec, kind + ' 必须有规格');
        assert.equal(typeof spec.word, 'string');
        assert.ok(spec.word.length > 0);
        assert.ok(spec.ms >= 1000 && spec.ms <= 2000, kind + ' 停留要短');
        assert.equal(spec.block, false);
    });
});

test('跳跃 / 砍树 / 吃 / 骑 的英文就是动作本身', () => {
    assert.equal(A.ofAction('jump').word, 'jump');
    assert.equal(A.ofAction('cut').word, 'cut');
    assert.equal(A.ofAction('eat').word, 'eat');
    assert.equal(A.ofAction('ride').word, 'ride');
});

test('砍树看体素 kind=log，不是文档里的 oak_log', () => {
    assert.equal(A.actionFromBlock('log'), 'cut');
    assert.equal(A.actionFromBlock('oak_log'), 'cut');
    assert.equal(A.actionFromBlock('dirt'), null);
});

test('游泳要在动，冷却期内不再刷', () => {
    assert.equal(A.shouldShow('swim', { moving: false, now: 1000, lastAt: 0 }), false);
    assert.equal(A.shouldShow('swim', { moving: true, now: 1000, lastAt: 0 }), true);
    assert.equal(A.shouldShow('swim', { moving: true, now: 2000, lastAt: 1000 }), false);
    assert.equal(A.shouldShow('jump', { now: 1000, lastAt: 0 }), true);
});

test('未知动作没有词卡', () => {
    assert.equal(A.ofAction('dash'), null);
});
