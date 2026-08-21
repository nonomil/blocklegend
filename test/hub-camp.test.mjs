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
  plaza.forEach(function (b) {
    assert.ok(Math.hypot(b.x - 192, b.z - 192) <= 80, b.id + ' stays around the camp');
    assert.ok((b.w || 0) >= 7, b.id + ' is a walk-in house');
  });
});

test('hub camp has extra yards, lakes and a river', () => {
  const yards = L.hubYardsOf({ cx: 192, cz: 192 });
  assert.ok(yards.length >= 4);
  const land = L.hubLandOf({ cx: 192, cz: 192 });
  assert.ok((land.lakes || []).length >= 2);
  assert.ok(land.river && (land.river.points || []).length >= 3);
  const plan = L.hubRoadPlanOf({
    cx: 192,
    cz: 192,
    portals: L.hubPortalsOf({ unlockedLevel: 1, cx: 192, cz: 192 }),
    plaza: L.hubPlazaOf({ cx: 192, cz: 192 })
  });
  assert.ok((plan.yards || []).length >= 4);
  assert.ok((plan.plaza && plan.plaza.r) >= 14);
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
});
