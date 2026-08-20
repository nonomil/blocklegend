/**
 * 每关一句剧情：进关要看见「这一关我要做什么」。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../data/levels.js';

const L = globalThis.BlockLegendLevels;
assert.ok(L, 'BlockLegendLevels must be injected');

test('12 关都有中英一句，3 秒可跳过且不暂停世界', () => {
    for (let n = 1; n <= 12; n += 1) {
        const flavor = L.flavorOf(n);
        assert.ok(flavor, '第 ' + n + ' 关必须有剧情');
        assert.ok(flavor.zh && flavor.zh.length > 4, '第 ' + n + ' 关缺中文');
        assert.ok(flavor.en && flavor.en.length > 4, '第 ' + n + ' 关缺英文');
        assert.equal(flavor.ms, 3000);
        assert.equal(flavor.skippable, true);
        assert.equal(flavor.pause, false);
    }
});

test('第 1–3 关剧情贴气候', () => {
    assert.match(L.flavorOf(1).zh, /名字|动物/);
    assert.match(L.flavorOf(2).zh, /狐狸|树洞/);
    assert.match(L.flavorOf(3).zh, /沙漠|商队|清单/);
});

test('未知关没有剧情卡', () => {
    assert.equal(L.flavorOf(0), null);
    assert.equal(L.flavorOf(99), null);
});
