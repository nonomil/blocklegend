/**
 * blocklegend · atles 图集守护测试（ART-01/ART-02 基线）
 * 守护"手绘有限色盘 16×16 像素块，非噪声"；同时为后续树木贴图改动立回归锚。
 * data/atlas-paint.js 零 DOM 依赖，node 直接 import 后 globalThis.BlockLegendAtlasPaint 可用。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../data/atlas-paint.js';

const A = globalThis.BlockLegendAtlasPaint;
assert.ok(A, 'BlockLegendAtlasPaint must be injected');

const TILE = A.TILE;

test('CORE 8 块各自 decodeTile 产出 16×16 全像素 RGBA', () => {
  const names = Object.keys(A.CORE);
  assert.equal(names.length, 8, 'CORE 应有 8 张核心块');
  for (const name of names) {
    const pix = A.decodeTile(name);
    assert.equal(pix.length, TILE * TILE, `${name} 应为 16×16 = 256 像素`);
    for (const p of pix) {
      assert.ok(Number.isInteger(p.r) && Number.isInteger(p.g) && Number.isInteger(p.b));
      assert.ok(p.r >= 0 && p.r <= 255 && p.g >= 0 && p.g <= 255 && p.b >= 0 && p.b <= 255);
      assert.ok(p.a === 255 || p.a === 0, `${name} alpha 只允许 255/0`);
    }
  }
  // 仅 oak_leaf 是镂空叶（alpha 0/255 混用），其余 7 块必须全不透明
  for (const name of names) {
    if (name === 'oak_leaf') continue;
    const alphas = new Set(A.decodeTile(name).map((p) => p.a));
    assert.deepEqual([...alphas], [255], `${name} 应为全不透明，实际 alpha ${[...alphas]}`);
  }
});

test('未知 tile 名 decodeTile 抛错', () => {
  assert.throws(() => A.decodeTile('not_a_real_tile'), /unknown atlas tile/);
});

test('paintCore 逐块把像素喂给 putPixel（8×256 次）', () => {
  const seen = new Set();
  const calls = [];
  A.paintCore((idx, x, y, r, g, b, a) => {
    seen.add(idx);
    calls.push({ idx, x, y, r, g, b, a });
  });
  // 每个 CORE 索引都出现
  for (const v of Object.values(A.CORE)) assert.ok(seen.has(v), `CORE index ${v} 应有像素`);
  assert.equal(calls.length, Object.keys(A.CORE).length * TILE * TILE);
  // 每个索引 256 次、坐标不越界
  const byIdx = {};
  for (const c of calls) {
    assert.ok(c.x >= 0 && c.x < TILE && c.y >= 0 && c.y < TILE);
    (byIdx[c.idx] = byIdx[c.idx] || []).push(c);
  }
  for (const k of Object.keys(byIdx)) assert.equal(byIdx[k].length, TILE * TILE);
});

test('grass_top 是有限色盘（≤4 色），非噪声', () => {
  const spec = A.TILES.grass_top;
  const colors = new Set(spec.rows.flatMap((row) => row.split('')));
  assert.ok(colors.size <= 4, 'grass_top 色盘应非常有限');
  for (const key of colors) assert.ok(spec.palette[key], `色盘缺字符 ${key}`);
});

test('grass_top 四边可无缝平铺', () => {
  const rows = A.TILES.grass_top.rows;
  assert.equal(rows[0], rows[rows.length - 1], '首尾行应相同');
  rows.forEach(function (row, i) {
    assert.equal(row.charAt(0), row.charAt(row.length - 1), '行 ' + i + ' 左右应相同');
  });
});

test('paintLeaves 输出 4 种镂空叶（LEAF_SLOTS 各索引）且保留 base 镂空 alpha', () => {
  const base = A.decodeTile('oak_leaf');
  const byIdx = {};
  A.paintLeaves((idx, x, y, r, g, b, a) => {
    (byIdx[idx] = byIdx[idx] || []).push({ x, y, r, g, b, a });
  });
  const slots = A.LEAF_SLOTS; // {oak:6,birch:10,spruce:13,cherry:22}
  assert.deepEqual(Object.keys(slots).length, 4, 'LEAF_SLOTS 应 4 种叶');
  // ridge: 4 种叶子索引互不重叠
  assert.equal(new Set(Object.values(slots)).size, Object.keys(slots).length, '叶索引不应重复');
  for (const [name, idx] of Object.entries(slots)) {
    const arr = byIdx[idx];
    assert.equal(arr && arr.length, TILE * TILE, `${name}@${idx} 应为 256 像素`);
    // 每种染色叶必须保留与 oak_leaf 基准一致的镂空（alpha 0 的像素保持透明）
    for (let i = 0; i < arr.length; i += 1) {
      assert.equal(arr[i].a, base[i].a, `${name}@${idx} 像素 ${i} alpha 应随基准镂空`);
    }
    // 按 alpha 分组：镂空位置集合应与基准完全相同
    const holePixels = arr.some((p, i) => (p.a === 0) !== (base[i].a === 0));
    assert.equal(holePixels, false, `${name} 镂空形状应与 oak_leaf 一致`);
  }
});

test('oak_leaf 五色镂空且上亮下暗', () => {
  const spec = A.TILES.oak_leaf;
  const keys = new Set(spec.rows.join('').split(''));
  ['d', 'D', 'g', 'G', 'y', '.'].forEach(function (k) {
    assert.ok(spec.palette[k], 'oak_leaf 缺色 ' + k);
  });
  assert.equal([...keys].filter(function (k) { return k !== '.'; }).length, 5);
  const pix = A.decodeTile('oak_leaf');
  assert.equal(pix.filter(function (p) { return p.a === 0; }).length, 25);
  function avgG(y0, y1) {
    let s = 0, n = 0;
    for (let y = y0; y < y1; y += 1) {
      for (let x = 0; x < TILE; x += 1) {
        const p = pix[y * TILE + x];
        if (p.a) { s += p.g; n += 1; }
      }
    }
    return n ? s / n : 0;
  }
  assert.ok(avgG(0, 6) > avgG(10, 16), '橡叶上半应比下半亮');
});
