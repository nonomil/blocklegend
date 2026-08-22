/**
 * 本地绑骨（dragon-3 平展翅姿势）：翅骨只管两侧翼面，脖头独立，脚不动。
 * 坐标为标准空间：翅 ±x（到 ±0.56），高 y 0~0.64，头 -z。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
await import('../data/dragon-skin.js');

const S = globalThis.BlockLegendDragonSkin;

function wingWeight(r) {
  return r.indices[1] <= 4 ? r.weights[1] + r.weights[2] : 0;
}

function neckWeight(r) {
  return r.indices[1] === 5 ? r.weights[1] + r.weights[2] : 0;
}

test('脚（y 低）不受翅骨影响', () => {
  const r = S.weightsFor(-0.08, 0.08, 0.05);
  assert.equal(wingWeight(r), 0);
  assert.equal(r.weights[0], 1);
});

test('前颈中央归脖骨，不归翅骨', () => {
  const r = S.weightsFor(0.02, 0.46, -0.14);
  assert.ok(neckWeight(r) > 0.5, '脖区应有脖骨权重');
  assert.equal(wingWeight(r), 0);
});

test('头顶归头骨为主', () => {
  const r = S.weightsFor(0.03, 0.60, -0.16);
  assert.equal(r.indices[2], 6);
  assert.ok(r.weights[2] > r.weights[1], '高处头骨占比应超过脖骨');
});

test('脖侧过渡带不被翅骨拽动', () => {
  const r = S.weightsFor(0.15, 0.5, -0.14);
  assert.ok(wingWeight(r) < 0.15, '前颈侧翅骨权重应被压掉，实际 ' + wingWeight(r));
});

test('翅尖权重最大且分侧，前缘不受脖区限制', () => {
  const l = S.weightsFor(-0.52, 0.5, -0.12);
  assert.ok(wingWeight(l) > 0.95, '左翅尖应几乎全权重');
  assert.equal(l.indices[1], 1);
  const rgt = S.weightsFor(0.5, 0.5, 0.05);
  assert.ok(wingWeight(rgt) > 0.95);
  assert.equal(rgt.indices[1], 3);
});

test('翅根到翅尖平滑过渡', () => {
  const near = wingWeight(S.weightsFor(-0.17, 0.5, 0.05));
  const mid = wingWeight(S.weightsFor(-0.26, 0.5, 0.05));
  const far = wingWeight(S.weightsFor(-0.50, 0.5, 0.05));
  assert.ok(near > 0 && near < 1);
  assert.ok(mid >= near);
  assert.ok(far >= mid);
});

test('尾巴（后方 z 大）不吃翅骨满权重也不吃脖骨', () => {
  const r = S.weightsFor(0.05, 0.3, 0.35);
  assert.equal(neckWeight(r), 0);
  assert.ok(wingWeight(r) < 0.5);
});

function tailWeight(r) {
  return r.indices[1] === 7 ? r.weights[1] + r.weights[2] : 0;
}

test('后方中央归尾骨，尾尖占比随 z 增大', () => {
  const base = S.weightsFor(0.03, 0.25, 0.28);
  assert.ok(tailWeight(base) > 0.8, '尾中段应几乎全尾骨，实际 ' + tailWeight(base));
  const tip = S.weightsFor(0.02, 0.22, 0.40);
  assert.equal(tip.indices[2], 8);
  assert.ok(tip.weights[2] > tip.weights[1], '尾尖处尾尖骨应占大头');
});

test('翼面后缘（|x| 大）不吃尾骨', () => {
  const r = S.weightsFor(-0.40, 0.45, 0.22);
  assert.equal(tailWeight(r), 0);
  assert.ok(wingWeight(r) > 0.5);
});

test('权重和为 1', () => {
  [[-0.3, 0.5, 0.05], [0.2, 0.4, -0.1], [0, 0.1, 0.2], [-0.55, 0.55, -0.1], [0.03, 0.6, -0.18]].forEach(function (p) {
    const r = S.weightsFor(p[0], p[1], p[2]);
    const sum = r.weights.reduce(function (a, b) { return a + b; }, 0);
    assert.ok(Math.abs(sum - 1) < 1e-6, 'sum=' + sum);
  });
});

test('飞行姿态：左倾左翼下沉，抬头颈头跟上、尾巴反向', () => {
  const flat = S.applyFlightPose(0, 0, 0, {});
  const bankL = S.applyFlightPose(0, 0, 0, { bank: 0.38 });
  const climb = S.applyFlightPose(0, 0, 0, { pitch: 0.28 });
  const spit = S.applyFlightPose(0, 0, 0, { breath: 1 });
  assert.equal(flat.neckX, 0);
  assert.ok(bankL.wingLZ > flat.wingLZ, '左倾时左翅更下沉');
  assert.ok(bankL.tailY > 0, '左倾尾巴跟着甩');
  assert.ok(climb.neckX > 0 && climb.headX > 0, '抬头时颈和头都抬');
  assert.ok(climb.tailX < 0, '抬头时尾巴反向压');
  assert.ok(spit.neckX < 0 && spit.headX < 0, '喷息时头颈往前压');
});
