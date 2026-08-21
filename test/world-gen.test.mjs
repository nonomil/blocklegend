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

test('平原村子白墙红顶，主村至少 8 栋', () => {
  const mats = W.villageMats('oak');
  assert.equal(mats.wall, 'wool');
  assert.equal(mats.roof, 'brick');
  const plan = W.villagePlan('plains', 256, 256);
  assert.ok(plan.houses.length >= 8, '主村太稀，实际 ' + plan.houses.length);
  const hamlets = W.hamletPlans('plains', 256, 256, 512);
  assert.ok(hamlets.length >= 4);
  assert.ok(hamlets[0].houses.length >= 4);
});

test('cityPlan 是田字路网加 16–24 栋变高楼', () => {
  const village = W.villagePlan('plains', 256, 256);
  const plan = W.cityPlan('plains', 256, 256, 512, [village]);
  assert.ok(plan, '应有城区');
  assert.equal(plan.kind, 'city');
  assert.ok(plan.plaza, '应有广场');
  assert.ok(plan.tower && plan.tower.h >= 10, '广场应有地标塔');
  assert.ok(plan.roads && plan.roads.length >= 4, '田字至少 4 段路，实际 ' + (plan.roads && plan.roads.length));
  assert.ok(plan.roads.every((r) => r.w === 2), '路宽应为 2 格');
  assert.ok(plan.houses.length >= 16 && plan.houses.length <= 32, '楼栋应 16–32，实际 ' + plan.houses.length);
  const stories = new Set(plan.houses.map((h) => h.stories));
  assert.ok(stories.size >= 2, '应有高低错落，实际 ' + [...stories].join(','));
  const span = Math.max(plan.x1 - plan.x0, plan.z1 - plan.z0);
  assert.ok(span >= 64 && span <= 96, '城区应约 64–96 格见方，实际 ' + span);
  plan.houses.forEach((h) => {
    assert.ok(!W.inRect(256, 256, { x0: h.x, z0: h.z, x1: h.x + h.w - 1, z1: h.z + h.d - 1 }), '楼不应压出生点');
    assert.ok(!W.inAnyRect(h.x + 1, h.z + 1, [village]), '楼不应压主村');
  });
});

test('cityPlan 同气候同中心结果一致', () => {
  const a = W.cityPlan('plains', 256, 256, 512);
  const b = W.cityPlan('plains', 256, 256, 512);
  assert.deepEqual(a.houses, b.houses);
  assert.deepEqual(a.roads, b.roads);
});

test('不同气候城区路网和广场不共用一套', () => {
  const plains = W.cityPlan('plains', 256, 256, 512);
  const forest = W.cityPlan('forest', 256, 256, 512);
  const desert = W.cityPlan('desert', 256, 256, 512);
  const nether = W.cityPlan('nether', 256, 256, 512);
  const ocean = W.cityPlan('ocean', 256, 256, 512);
  const keys = [plains, forest, desert, nether, ocean].map((p) => JSON.stringify({
    pattern: p.pattern, plaza: p.plaza, roads: p.roads
  }));
  assert.equal(new Set(keys).size, keys.length, '平原/密林/沙漠/下界/海洋应各有路网');
  assert.notEqual(plains.pattern, forest.pattern);
  assert.notEqual(desert.pattern, ocean.pattern);
  assert.ok(plains.tower.h !== nether.tower.h || plains.houses[0].x !== nether.houses[0].x, '下界楼位或塔高应不同');
});

test('createWorld 接上城区路网和楼，不另造山水', () => {
  const w = W.createWorld(7, { climate: 'plains' });
  assert.ok(w.city && w.city.houses.length >= 16, '世界应带城区');
  assert.ok((w.houses || []).length >= 16 + 8, '城区楼应进 houses');
  const plaza = w.city.plaza;
  const roadHits = Object.keys(w.paths || {}).filter((key) => {
    const [x, z] = key.split(',').map(Number);
    return Math.abs(x - plaza.x) + Math.abs(z - plaza.z) < 40;
  }).length;
  assert.ok(roadHits >= 20, '城区附近应有路，实际 ' + roadHits);
  assert.ok(w.ponds && Object.keys(w.ponds).length > 0, '沿用现有河塘即可');
});

test('scenicPlan 给出两处湖和两片林，躲开城区', () => {
  const city = W.cityPlan('plains', 256, 256, 512);
  const scenic = W.scenicPlan('plains', 256, 256, 512);
  assert.ok(scenic.lakes.length >= 2, '应有湖泊点');
  assert.ok(scenic.lakes.every((l) => l.r >= 7), '湖应比小水塘大');
  assert.ok(scenic.woods.length >= 2, '应有林带');
  scenic.lakes.forEach((lake) => {
    assert.ok(!W.inRect(lake.x, lake.z, city), '湖心不应落在城区');
    assert.ok(Math.abs(lake.x - 256) >= 24 || Math.abs(lake.z - 256) >= 24, '湖不应贴出生点');
  });
});

test('createWorld 平原能看见湖、河、山林', () => {
  const w = W.createWorld(7, { climate: 'plains' });
  let lakeBlob = 0;
  Object.keys(w.ponds || {}).forEach((key) => {
    const [x, z] = key.split(',').map(Number);
    let n = 0;
    for (let dz = -2; dz <= 2; dz += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        if (w.ponds[(x + dx) + ',' + (z + dz)]) n += 1;
      }
    }
    if (n > lakeBlob) lakeBlob = n;
  });
  assert.ok(lakeBlob >= 16, '应有成片湖，最大邻域 ' + lakeBlob);
  const waters = Object.keys(w.ponds).map((key) => {
    const [x, z] = key.split(',').map(Number);
    return { x, z };
  });
  const spanX = Math.max(...waters.map((p) => p.x)) - Math.min(...waters.map((p) => p.x));
  const spanZ = Math.max(...waters.map((p) => p.z)) - Math.min(...waters.map((p) => p.z));
  assert.ok(spanX >= 24 || spanZ >= 24, '河应拉得开，跨度 ' + spanX + '/' + spanZ);
  const n = w.size;
  let forest = 0;
  let grove = 0;
  (w.scenic && w.scenic.woods ? w.scenic.woods : []).forEach((box) => {
    for (let z = box.z0; z <= box.z1; z += 6) {
      for (let x = box.x0; x <= box.x1; x += 6) {
        if (x < 0 || z < 0 || x >= n || z >= n) continue;
        if (w.biomes[z * n + x] === 1) forest += 1;
        if ((w.trees || []).some((t) => Math.abs(t.x - x) <= 3 && Math.abs(t.z - z) <= 3)) grove += 1;
      }
    }
  });
  assert.ok(forest >= 8, '林带应涂成森林，实际 ' + forest);
  assert.ok(grove >= 6, '林带里应有树丛，实际 ' + grove);
});

test('十二关气候都有城区，风景按干湿分开', () => {
  const rows = [
    { climate: 'plains', water: true },
    { climate: 'forest', water: true },
    { climate: 'desert', water: true },
    { climate: 'snow', water: true },
    { climate: 'deep_dark', water: true },
    { climate: 'nether', water: false },
    { climate: 'quarry', water: true },
    { climate: 'astral', water: true },
    { climate: 'ocean', water: true },
    { climate: 'crystal', water: true },
    { climate: 'volcano', water: false },
    { climate: 'end', water: false }
  ];
  rows.forEach((row) => {
    const city = W.cityPlan(row.climate, 256, 256, 512);
    const scenic = W.scenicPlan(row.climate, 256, 256, 512);
    assert.ok(city.pattern, row.climate + ' 应标明路网型');
    assert.ok(city.houses.length >= 16, row.climate + ' 应有城区，实际 ' + city.houses.length);
    assert.ok(scenic.woods.length >= 2, row.climate + ' 应有林带');
    if (row.water) {
      assert.ok(scenic.lakes.length >= 2, row.climate + ' 应有湖');
    } else {
      assert.equal(scenic.lakes.length, 0, row.climate + ' 不应灌水');
    }
  });
});

test('密林沙漠有城有景，下界有林不灌水', () => {
  const forest = W.createWorld(21, { climate: 'forest' });
  assert.ok(forest.city && forest.city.houses.length >= 16, '密林应有城');
  assert.ok(forest.scenic.woods.length >= 2 && forest.scenic.lakes.length >= 2, '密林应有湖林');
  const desert = W.createWorld(33, { climate: 'desert' });
  assert.ok(desert.city && desert.city.houses.length >= 16, '沙漠应有城');
  assert.ok(Object.keys(desert.ponds || {}).length >= 20, '沙漠绿洲湖应有水');
  assert.ok((desert.trees || []).some((t) => t.species === 'cactus'), '沙漠林带应是仙人掌');
  const nether = W.createWorld(71, { climate: 'nether' });
  assert.ok(nether.city && nether.city.houses.length >= 16, '下界应有城');
  assert.ok(!nether.ponds || Object.keys(nether.ponds).length === 0, '下界不灌水');
  assert.ok((nether.trees || []).some((t) => t.species === 'crimson'), '下界林带应是绯红');
});

test('气候决定城区建筑形貌、体量和室内', () => {
  const forest = W.cityPlan('forest', 256, 256, 512);
  const desert = W.cityPlan('desert', 256, 256, 512);
  const snow = W.cityPlan('snow', 256, 256, 512);
  const ocean = W.cityPlan('ocean', 256, 256, 512);
  const nether = W.cityPlan('nether', 256, 256, 512);
  assert.ok(forest.houses.length >= 24, '密林应更密，实际 ' + forest.houses.length);
  const fShapes = [...new Set(forest.houses.map((h) => h.shape))].sort();
  const dShapes = [...new Set(desert.houses.map((h) => h.shape))].sort();
  const sShapes = [...new Set(snow.houses.map((h) => h.shape))].sort();
  const oShapes = [...new Set(ocean.houses.map((h) => h.shape))].sort();
  assert.notDeepEqual(fShapes, dShapes, '密林/沙漠外形应不同');
  assert.ok(fShapes.includes('hut') || fShapes.includes('longhouse'), '密林应有木屋或长屋');
  assert.ok(dShapes.includes('adobe') || dShapes.includes('spire'), '沙漠应有平顶或尖塔');
  assert.ok(sShapes.includes('igloo'), '雪地应有圆顶屋');
  assert.ok(oShapes.includes('dock'), '海洋应有码头屋');
  assert.ok(nether.houses.some((h) => h.shape === 'bunker' || h.shape === 'spire'), '下界应有堡垒');
  assert.ok(forest.houses.some((h) => h.w !== desert.houses[0].w || h.d !== desert.houses[0].d), '体量应随气候变');
  assert.ok(desert.houses.every((h) => h.extra), '沙漠室内应有气候内容');
  assert.notEqual(forest.houses[0].extra, desert.houses[0].extra, '室内内容应不同');
});
