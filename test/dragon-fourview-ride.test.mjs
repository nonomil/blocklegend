/**
 * 骑乘龙：先铺约 2000 体素，再整网平滑，不逐盒倒圆角。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
await import('../assets/img2threejs/dragon-voxels.js');
await import('../assets/img2threejs/createDragonModel.js');

const Model = globalThis.BlockLegendDragonModel;
const Vox = globalThis.BlockLegendDragonVoxels;

test('骑乘龙先体素再整网平滑', () => {
  assert.equal(Model.kind, 'smooth-voxel');
  assert.equal(Model.rounded, false);
});

test('大约 5000 个体素格子', () => {
  const n = Vox && Vox.count;
  assert.ok(n >= 4200 && n <= 6200, '现在 ' + n + ' 格，要对准约 5000');
  const groups = {};
  (Vox.cells || []).forEach(function (c) {
    groups[c[3]] = (groups[c[3]] || 0) + 1;
  });
  assert.ok(groups.body > 200);
  assert.ok(groups.wingL > 40 && groups.wingR > 40);
});
