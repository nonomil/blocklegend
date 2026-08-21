/**
 * 卡顿两刀：小地图地形不每帧重画；APK 画布封最长边。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../data/perf.js';

const P = globalThis.BlockLegendPerf;
assert.ok(P, 'BlockLegendPerf must be injected');

test('同一世界同一画布宽度，地形只画一次', () => {
    const world = { size: 512, seed: 7, climate: 'plains' };
    const a = P.terrainKey(world, 112);
    const b = P.terrainKey(world, 112);
    assert.equal(a, b);
    assert.equal(P.shouldPaintTerrain(a, world, 112), false);
    assert.equal(P.shouldPaintTerrain('', world, 112), true);
});

test('换关或画布变了才重画地形', () => {
    const plains = { size: 512, seed: 7, climate: 'plains' };
    const desert = { size: 512, seed: 33, climate: 'desert' };
    const key = P.terrainKey(plains, 112);
    assert.equal(P.shouldPaintTerrain(key, desert, 112), true);
    assert.equal(P.shouldPaintTerrain(key, plains, 200), true);
});

test('精简档 1400×3200 压到最长边 720，比例不变', () => {
    const size = P.internalSize(1400, 3200, P.LITE_LONG_EDGE);
    assert.equal(P.LITE_LONG_EDGE, 720);
    assert.equal(size.h, 720);
    assert.equal(size.w, 315);
    assert.ok(size.w * size.h < 1400 * 3200 / 8);
});

test('未超上限不缩小', () => {
    const size = P.internalSize(640, 480, 720);
    assert.equal(size.w, 640);
    assert.equal(size.h, 480);
});

test('HUD 200ms 才刷新一次', () => {
    assert.equal(P.HUD_MS, 200);
    assert.equal(P.shouldPulse(0, 0, 200), true);
    assert.equal(P.shouldPulse(199, 100, 200), false);
    assert.equal(P.shouldPulse(300, 100, 200), true);
});

test('活物 48 格外不 tick，打猎/守卫/骑着仍 tick', () => {
    const me = { x: 0, z: 0 };
    assert.equal(P.LIFE_RADIUS, 48);
    assert.equal(P.shouldTickLife({ x: 30, z: 0 }, me), true);
    assert.equal(P.shouldTickLife({ x: 60, z: 0 }, me), false);
    assert.equal(P.shouldTickLife({ x: 60, z: 0, hunting: true }, me), true);
    assert.equal(P.shouldTickLife({ x: 60, z: 0, fleeing: true }, me), true);
    assert.equal(P.shouldTickLife({ x: 60, z: 0, guarding: true }, me), true);
    assert.equal(P.shouldTickLife({ x: 60, z: 0 }, me, { always: true }), true);
});
