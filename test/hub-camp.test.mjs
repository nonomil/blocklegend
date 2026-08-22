/**
 * 0.9.3 营地：多广场、河湖、屋子里的床和家具。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import '../data/levels.js';
import '../data/world-gen.js';

const L = globalThis.BlockLegendLevels;
const W = globalThis.BlockLegendWorld;
const root = fileURLToPath(new URL('..', import.meta.url));

test('hub plaza lists thirteen walk-in houses around camp', () => {
  assert.equal(typeof L.hubPlazaOf, 'function');
  const plaza = L.hubPlazaOf({ cx: 192, cz: 192 });
  assert.ok(plaza.length >= 12);
  const ids = plaza.map(function (b) { return b.id; });
  ['word', 'dummy', 'trade', 'chest', 'bed', 'craft', 'furnace', 'teacher', 'library', 'lookout', 'dock', 'barn', 'farm'].forEach(function (id) {
    assert.ok(ids.indexOf(id) >= 0, 'plaza has ' + id);
  });
  let far = 0;
  plaza.forEach(function (b, i) {
    const dist = Math.hypot(b.x - 192, b.z - 192);
    assert.ok(dist <= 160, b.id + ' still on the camp map');
    assert.ok((b.w || 0) >= 4 && (b.d || 0) >= 4, b.id + ' is walk-in');
    if (dist >= 40) far += 1;
    plaza.forEach(function (other, j) {
      if (j <= i) return;
      assert.ok(Math.hypot(b.x - other.x, b.z - other.z) >= 22, b.id + ' crowded with ' + other.id);
    });
  });
  assert.ok(far >= 6, 'most houses sit far enough to walk to');
  const looks = plaza.map(function (b) { return [b.shape, b.wall, b.roof, b.w, b.d].join('/'); });
  assert.ok(new Set(looks).size >= 8, 'houses need distinct shapes and colors');
});

test('first door stands beside spawn; roads are stone not dirt yards', () => {
  const cx = 192, cz = 192;
  const portals = L.hubPortalsOf({ unlockedLevel: 1, cx: cx, cz: cz });
  const one = portals.filter(function (p) { return Number(p.level) === 1; })[0];
  assert.ok(one, 'level 1 portal exists');
  assert.ok(Math.hypot(one.x - cx, one.z - cz) <= 12, 'door 1 is next to spawn');
  const plan = L.hubRoadPlanOf({ cx: cx, cz: cz, portals: portals, plaza: L.hubPlazaOf({ cx: cx, cz: cz }) });
  const stone = { stone: 1, stone_brick: 1, gravel: 1 };
  (plan.strokes || []).forEach(function (s) {
    assert.ok(stone[s.fill], s.kind + ' path must be stone, got ' + s.fill);
  });
  assert.ok((plan.plaza && plan.plaza.r) <= 8, 'spawn court stays small');
  assert.ok((plan.yards || []).length <= 2, 'do not pave extra dirt plazas');
});

test('hub camp has extra yards, lakes and a river', () => {
  const yards = L.hubYardsOf({ cx: 192, cz: 192 });
  assert.ok(yards.length >= 1);
  const land = L.hubLandOf({ cx: 192, cz: 192 });
  assert.ok((land.lakes || []).length >= 2);
  assert.ok(land.river && (land.river.points || []).length >= 3);
  const plan = L.hubRoadPlanOf({
    cx: 192,
    cz: 192,
    portals: L.hubPortalsOf({ unlockedLevel: 1, cx: 192, cz: 192 }),
    plaza: L.hubPlazaOf({ cx: 192, cz: 192 })
  });
  assert.ok((plan.yards || []).length >= 1);
  assert.ok((plan.plaza && plan.plaza.r) >= 5);
});

test('hub houses keep beds and furniture inside the walls', () => {
  const n = W.WORLD_SIZE || 512;
  const cx = Math.floor(n / 2);
  const cz = Math.floor(n / 2);
  const portals = L.hubPortalsOf({ unlockedLevel: 1, cx: cx, cz: cz });
  const world = W.createWorld(7, { climate: 'plains', hub: true, portals: portals });
  const plazaHouses = (world.houses || []).filter(function (h) { return h.hubService; });
  assert.ok(plazaHouses.length >= 12);
  plazaHouses.forEach(function (h) {
    const inside = (world.placedProps || []).filter(function (p) {
      return p.x >= h.x + 1 && p.x <= h.x + h.w - 2 && p.z >= h.z + 1 && p.z <= h.z + h.d - 2;
    });
    assert.ok(inside.length >= 4, h.hubService + ' has interior furniture');
    assert.ok(inside.some(function (p) { return p.kind === 'bed'; }), h.hubService + ' has a bed');
    assert.ok(inside.some(function (p) { return p.kind === 'chest'; }), h.hubService + ' has a chest');
  });
  assert.ok((world.beds || []).length >= plazaHouses.length);
  const land = L.hubLandOf({ cx: cx, cz: cz });
  land.lakes.forEach(function (lake) {
    let water = 0;
    let dz, dx;
    for (dz = -2; dz <= 2; dz += 1) {
      for (dx = -2; dx <= 2; dx += 1) {
        if (world.ponds && world.ponds[(lake.x + dx) + ',' + (lake.z + dz)]) water += 1;
      }
    }
    assert.ok(water >= 1, 'camp lake at ' + lake.x + ',' + lake.z);
  });
  const game = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
  assert.match(game, /svc\.id === 'dock'/);
  assert.match(game, /svc\.id === 'library'/);
  const one = (world.levelPortals || []).filter(function (p) { return Number(p.level) === 1; })[0];
  assert.ok(one && Math.hypot(one.x - cx, one.z - cz) <= 14, 'world plants door 1 beside spawn');
  const edits = world.edits || {};
  let stone = 0;
  Object.keys(edits).forEach(function (key) {
    const p = key.split(',');
    const x = Number(p[0]);
    const z = Number(p[2]);
    const kind = edits[key];
    if (Math.abs(x - cx) > 5 || z < cz - 8 || z > cz + 2) return;
    if (kind === 'stone' || kind === 'stone_brick' || kind === 'gravel') stone += 1;
  });
  assert.ok(stone >= 10, 'spawn path is cobble, not grass');
});
