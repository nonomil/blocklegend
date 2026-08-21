/**
 * 骑乘龙分节：颈 3 / 翅 2 / 尾 5，扇翅有相位差，飞行收腿。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../data/fx.js';
import '../data/dragon-rig.js';

const Rig = globalThis.BlockLegendDragonRig;
assert.ok(Rig, 'BlockLegendDragonRig must be injected');

test('分节数：颈 3、翅 2、尾 5', () => {
  assert.equal(Rig.NECK, 3);
  assert.equal(Rig.WING, 2);
  assert.equal(Rig.TAIL, 5);
});

test('左右翅肩角反向，膜相对肩有相位差', () => {
  const p = Rig.pose(0.37, true);
  assert.ok(p.wingL.shoulderZ * p.wingR.shoulderZ < 0, '左右应对称反号');
  assert.ok(Math.abs(p.wingL.membraneZ - p.wingL.shoulderZ) > 0.04, '膜不能跟肩齐转');
  assert.ok(Math.abs(p.wingR.membraneZ - p.wingR.shoulderZ) > 0.04);
});

test('尾各节偏航不同，形成滞后甩尾', () => {
  const p = Rig.pose(0.9, true);
  assert.equal(p.tail.length, Rig.TAIL);
  const yaws = p.tail.map((seg) => seg.yaw);
  const unique = new Set(yaws.map((n) => n.toFixed(4)));
  assert.ok(unique.size >= 3, '尾节不应同一角度');
});

test('飞行收腿，落地腿放下；张口随飞略开', () => {
  const fly = Rig.pose(0.2, true);
  const idle = Rig.pose(0.2, false);
  assert.ok(fly.legsFold >= 0.7);
  assert.ok(idle.legsFold <= 0.12);
  assert.ok(fly.jaw > idle.jaw);
});

test('applyPose 把数字写进关节 rotation', () => {
  const joints = {
    neck: [{ rotation: { x: 0, y: 0 } }, { rotation: { x: 0, y: 0 } }, { rotation: { x: 0, y: 0 } }],
    jaw: { rotation: { x: 0 } },
    wingL: { shoulder: { rotation: { z: 0, x: 0 } }, membrane: { rotation: { z: 0 } } },
    wingR: { shoulder: { rotation: { z: 0, x: 0 } }, membrane: { rotation: { z: 0 } } },
    tail: [
      { rotation: { x: 0, y: 0 } },
      { rotation: { x: 0, y: 0 } },
      { rotation: { x: 0, y: 0 } },
      { rotation: { x: 0, y: 0 } },
      { rotation: { x: 0, y: 0 } }
    ],
    legs: [{ rotation: { x: 0 } }, { rotation: { x: 0 } }]
  };
  const pose = Rig.pose(0.37, true);
  Rig.applyPose(joints, pose);
  assert.equal(joints.neck[0].rotation.x, pose.neck[0].pitch);
  assert.equal(joints.wingL.membrane.rotation.z, pose.wingL.membraneZ);
  assert.equal(joints.tail[2].rotation.y, pose.tail[2].yaw);
  assert.equal(joints.legs[0].rotation.x, pose.legsFold);
  assert.equal(joints.jaw.rotation.x, pose.jaw);
});
