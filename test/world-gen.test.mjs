import { test } from 'node:test';
import assert from 'node:assert/strict';

// 加载 world-gen.js：它是 IIFE，node 下 global === globalThis，
// 所以加载后 globalThis.BlockLegendWorld 可直接用。
await import('../data/world-gen.js');
const W = globalThis.BlockLegendWorld;
assert.ok(W, 'BlockLegendWorld 应挂载到 globalThis');

const BIOME_NAMES = ['plains', 'forest', 'desert', 'mountain', 'snow'];

test('makeRng 确定性：同 seed 序列一致', () => {
  const a = W.makeRng(7);
  const b = W.makeRng(7);
  const seqA = [a(), a(), a(), a(), a()];
  const seqB = [b(), b(), b(), b(), b()];
  assert.deepEqual(seqA, seqB);
  assert.equal(typeof seqA[0], 'number');
});

test('hash3 确定性：同参一致', () => {
  assert.equal(W.hash3(3, 4, 5), W.hash3(3, 4, 5));
  assert.equal(typeof W.hash3(0, 0, 0), 'number');
});

test('createWorld 返回结构完整', () => {
  const w = W.createWorld(7);
  for (const k of ['heights', 'biomes', 'trees', 'animals', 'edits', 'hollow', 'wordGates']) {
    assert.ok(k in w, `缺少字段 ${k}`);
  }
  assert.equal(w.size, 512);
  assert.equal(w.seed, 7);
});

test('createWorld 确定性：heights 深比较相等', () => {
  const a = W.createWorld(7);
  const b = W.createWorld(7);
  assert.deepEqual(Array.from(a.heights), Array.from(b.heights));
  assert.equal(a.heights.length, 512 * 512);
});

test('biomeAt 返回合法 biome 名', () => {
  const w = W.createWorld(7);
  for (const [x, z] of [[0, 0], [100, 50], [511, 511], [200, 300]]) {
    const b = W.biomeAt(w, x, z);
    assert.ok(BIOME_NAMES.includes(b), `biomeAt(0/0) 返回非法 biome: ${b}`);
  }
});

test('openWordGate 可调用（stub world 不抛）', () => {
  const w = { size: 512, heights: new Float32Array(512 * 512).fill(0) };
  // openWordGate 无副作用时返回布尔/undefined 均可，仅需不抛
  assert.doesNotThrow(() => W.openWordGate(w));
});

test('HEIGHT_MAX 为 48 且列扫描不跟全局封顶死扫', () => {
  assert.equal(W.HEIGHT_MAX, 48);
  const plainsEnd = W.columnScanYEnd(10, 48);
  const peakEnd = W.columnScanYEnd(35, 48);
  assert.ok(plainsEnd <= 32, '平原列不应扫到 64');
  assert.ok(peakEnd > plainsEnd);
  assert.ok(peakEnd <= 48 + 16);
});

test('同种子：雪地比平原高，出生点 3×3 平整', () => {
  const plains = W.createWorld(7, { climate: 'plains' });
  const snow = W.createWorld(7, { climate: 'snow' });
  const n = plains.size;
  let pMax = 0, sMax = 0;
  for (let i = 0; i < plains.heights.length; i += 1) {
    if (plains.heights[i] > pMax) pMax = plains.heights[i];
    if (snow.heights[i] > sMax) sMax = snow.heights[i];
  }
  assert.ok(sMax > pMax, '雪地应出现山系，实际 plains=' + pMax + ' snow=' + sMax);
  const cx = n / 2, cz = n / 2;
  const base = plains.heights[cz * n + cx];
  for (let dz = -1; dz <= 1; dz += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      assert.equal(plains.heights[(cz + dz) * n + (cx + dx)], base);
    }
  }
});

test('脊谷噪声可上可下', () => {
  assert.equal(W.ridgeSigned(0.5), 1);
  assert.equal(W.ridgeSigned(0), -1);
  assert.equal(W.ridgeSigned(1), -1);
});

test('雪地同时有高峰和低谷', () => {
  const snow = W.createWorld(7, { climate: 'snow' });
  const n = snow.size;
  const cx = n / 2, cz = n / 2;
  let lo = 99, hi = 0;
  for (let z = 0; z < n; z += 16) {
    for (let x = 0; x < n; x += 16) {
      if (Math.max(Math.abs(x - cx), Math.abs(z - cz)) < 80) continue;
      const h = snow.heights[z * n + x];
      if (h < lo) lo = h;
      if (h > hi) hi = h;
    }
  }
  assert.ok(hi - lo >= 14, '雪地应有脊谷高差，实际 ' + lo + '-' + hi);
  assert.ok(lo <= 8, '应有下切谷，最低 ' + lo);
});

test('每气候有一座 30 格空中地标', () => {
  ['forest', 'snow', 'desert', 'cherry', 'volcano', 'crystal'].forEach(function (name) {
    const w = W.createWorld(7, { climate: name });
    const mark = (w.skyMarks || [])[0];
    assert.ok(mark, name + ' 缺空中地标');
    assert.ok(mark.h >= 30, name + ' 地标高度 ' + mark.h);
  });
});

test('createWorld 树列确定性且橡树有多层冠', () => {
  const a = W.createWorld(7);
  const b = W.createWorld(7);
  assert.deepEqual(Object.keys(a.treeCols).sort(), Object.keys(b.treeCols).sort());
  const oak = (a.trees || []).find(function (t) { return t.species === 'oak'; });
  assert.ok(oak, 'seed 7 应有橡树');
  let leaves = 0;
  W.eachTreeVoxel(oak, function (x, y, z, kind) {
    if (kind === 'leaf') leaves += 1;
  });
  assert.ok(leaves >= 24, '橡树冠应多层，实际 ' + leaves);
});
