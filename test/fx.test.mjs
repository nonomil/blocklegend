/**
 * 说中闪光规格：开口/拼对必须比空挥更亮，破盾再大一号。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../data/fx.js';

const FX = globalThis.BlockLegendFx;
assert.ok(FX, 'BlockLegendFx must be injected');

test('空挥 / 未知通道没有闪光', () => {
  assert.equal(FX.wordFlash('miss'), null);
  assert.equal(FX.wordFlash('swing'), null);
  assert.equal(FX.wordFlash(''), null);
});

test('说中闪光：加法混合 + 贴地环 + 短寿命', () => {
  const spec = FX.wordFlash('word');
  assert.ok(spec, 'word 必须有闪光');
  assert.equal(spec.additive, true);
  assert.ok(spec.flashScale > 1, '闪光要比角色身位大');
  assert.ok(spec.flashLife > 0 && spec.flashLife <= 0.5, '闪光必须一闪就过');
  assert.ok(spec.ringR0 > 0 && spec.ringGrow > spec.ringR0, '法阵要往外扩');
  assert.ok(spec.ringLife > 0 && spec.ringLife <= 0.6);
  assert.equal(typeof spec.flashColor, 'number');
  assert.equal(typeof spec.ringColor, 'number');
  const r = (spec.flashColor >> 16) & 255;
  const g = (spec.flashColor >> 8) & 255;
  assert.ok(r >= 200 && g >= 160, '说中应是暖金，不是暗灰火花');
});

test('破盾闪光比说中更大', () => {
  const word = FX.wordFlash('word');
  const shield = FX.wordFlash('shield');
  assert.ok(shield, '破盾必须有闪光');
  assert.equal(shield.additive, true);
  assert.ok(shield.flashScale > word.flashScale);
  assert.ok(shield.ringGrow > word.ringGrow);
});

test('普通击中：短白闪，没有法阵，比说中小', () => {
  const hit = FX.hitFlash('hit');
  const word = FX.wordFlash('word');
  assert.ok(hit, '打中必须有闪光');
  assert.equal(hit.additive, true);
  assert.ok(hit.flashScale < word.flashScale, '击中不能盖过说中');
  assert.ok(hit.flashLife > 0 && hit.flashLife < word.flashLife);
  assert.ok(!hit.ringGrow, '普通击中不铺法阵');
  const b = hit.flashColor & 255;
  assert.ok(b >= 180, '击中应是白闪，不是暖金');
});

test('连击：热橙环，比击中大，仍小于破盾', () => {
  const hit = FX.hitFlash('hit');
  const combo = FX.hitFlash('combo');
  const shield = FX.wordFlash('shield');
  assert.ok(combo, '连击必须有闪光');
  assert.equal(combo.additive, true);
  assert.ok(combo.flashScale > hit.flashScale);
  assert.ok(combo.ringGrow > combo.ringR0);
  assert.ok(combo.flashScale < shield.flashScale);
  assert.ok(combo.ringGrow < shield.ringGrow);
  const r = (combo.flashColor >> 16) & 255;
  const g = (combo.flashColor >> 8) & 255;
  const b = combo.flashColor & 255;
  assert.ok(r >= 200 && g <= 180 && b <= 90, '连击应是热橙');
});

test('空挥通道没有击中/连击闪光', () => {
  assert.equal(FX.hitFlash('miss'), null);
  assert.equal(FX.hitFlash('swing'), null);
  assert.equal(FX.hitFlash(''), null);
});

test('弹道光：加法核心亮、外晕暗、沿速度拉长、不甩方块尾', () => {
  const bolt = FX.boltGlow('bolt');
  assert.ok(bolt, '弹道必须有发光规格');
  assert.equal(bolt.additive, true);
  assert.equal(bolt.trail, false);
  assert.ok(bolt.stretch > 1 && bolt.stretch <= 2.4, '假尾迹只拉长，不另建几何');
  assert.ok(bolt.haloOpacity > 0 && bolt.haloOpacity < 0.7);
  const core = bolt.coreColor;
  const halo = bolt.haloColor;
  const lum = (c) => ((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11;
  assert.ok(lum(core) > lum(halo), '核心必须比外晕亮');
});

test('说中弹道比普通弹更暖、更长', () => {
  const bolt = FX.boltGlow('bolt');
  const word = FX.boltGlow('word');
  assert.ok(word, '说中弹道必须有规格');
  assert.equal(word.additive, true);
  assert.equal(word.trail, false);
  assert.ok(word.stretch >= bolt.stretch);
  const wr = (word.coreColor >> 16) & 255;
  const wg = (word.coreColor >> 8) & 255;
  const br = (bolt.coreColor >> 16) & 255;
  const bb = bolt.coreColor & 255;
  assert.ok(wr >= 200 && wg >= 160, '说中弹应偏暖金');
  assert.ok(bb >= 160, '普通弹应偏紫蓝');
  assert.ok(wr > br, '说中弹比普通弹更暖');
});

test('未知弹道没有发光规格', () => {
  assert.equal(FX.boltGlow('miss'), null);
  assert.equal(FX.boltGlow(''), null);
});

const CLIMATES = [
  'plains', 'forest', 'quarry', 'cherry', 'desert', 'duskvale', 'crystal',
  'nether', 'snow', 'ocean', 'mushroom', 'volcano', 'deep_dark', 'astral', 'end'
];

test('气候氛围：每气候有雾色和太阳，未知回落平原', () => {
  const plains = FX.climateMood('plains');
  assert.ok(plains && plains.fogC && plains.sunDisc && plains.sunSize > 0);
  assert.equal(FX.climateMood('not-a-biome').fogC, plains.fogC);
  CLIMATES.forEach(function (name) {
    const m = FX.climateMood(name);
    assert.ok(m.fogC, name + ' 缺雾色');
    assert.ok(m.sunDisc, name + ' 缺太阳色');
    assert.ok(m.sunSize > 0 && m.sunSize <= 5, name + ' 太阳尺寸越界');
    assert.ok(m.fogF > m.fogN, name + ' 雾 far 应大于 near');
  });
});

test('气候氛围：沙漠更远更大、雪地冷白、下界偏红、深暗太阳最小', () => {
  const desert = FX.climateMood('desert');
  const snow = FX.climateMood('snow');
  const nether = FX.climateMood('nether');
  const dark = FX.climateMood('deep_dark');
  const plains = FX.climateMood('plains');
  assert.ok(desert.fogF > snow.fogF);
  assert.ok(desert.sunSize > plains.sunSize);
  assert.ok(dark.sunSize < nether.sunSize);
  const sr = (snow.fogC >> 16) & 255, sg = (snow.fogC >> 8) & 255, sb = snow.fogC & 255;
  assert.ok(sr >= 190 && sg >= 200 && sb >= 210, '雪雾应冷白');
  const nr = (nether.fogC >> 16) & 255, ng = (nether.fogC >> 8) & 255, nb = nether.fogC & 255;
  assert.ok(nr > ng && nr > nb, '下界雾应偏红');
});

test('挥砍刀光：加法短闪，施法刀更暖', () => {
  const swing = FX.slashFlash('swing');
  const cast = FX.slashFlash('cast');
  assert.ok(swing && cast);
  assert.equal(swing.additive, true);
  assert.ok(!swing.ringGrow, '刀光不铺地面法阵');
  assert.ok(swing.flashLife > 0 && swing.flashLife <= 0.28);
  assert.ok(cast.flashScale >= swing.flashScale);
  assert.ok((cast.flashColor & 255) < (swing.flashColor & 255), '施法刀应更暖、蓝更少');
});

test('空挥通道没有刀光规格', () => {
  assert.equal(FX.slashFlash('miss'), null);
  assert.equal(FX.slashFlash(''), null);
});

test('镜头短震：空挥和普通击中不震，说中才震', () => {
  assert.equal(FX.hitPunch('miss'), null);
  assert.equal(FX.hitPunch('swing'), null);
  assert.equal(FX.hitPunch('hit'), null);
  const word = FX.hitPunch('word');
  assert.ok(word);
  assert.ok(word.life > 0 && word.life <= 0.28);
  assert.ok(word.yaw > 0 && word.yaw < 0.05);
  assert.ok(word.pitch > 0 && word.pitch < word.yaw);
});

test('连击震比说中大，破盾最大', () => {
  const word = FX.hitPunch('word');
  const combo = FX.hitPunch('combo');
  const shield = FX.hitPunch('shield');
  assert.ok(combo.yaw > word.yaw);
  assert.ok(combo.life >= word.life);
  assert.ok(shield.yaw >= combo.yaw);
  assert.ok(shield.life <= 0.32);
});

test('命中光池：空挥没有，说中比普通击中更亮更远', () => {
  assert.equal(FX.hitLight('miss'), null);
  assert.equal(FX.hitLight(''), null);
  const hit = FX.hitLight('hit');
  const word = FX.hitLight('word');
  assert.ok(hit && word);
  assert.ok(word.intensity > hit.intensity);
  assert.ok(word.range > hit.range);
  assert.ok(word.life > 0 && word.life <= 0.45);
  const r = (word.color >> 16) & 255;
  const g = (word.color >> 8) & 255;
  assert.ok(r >= 200 && g >= 160, '说中光应是暖金');
});

test('连击光比说中强，破盾光偏蓝', () => {
  const word = FX.hitLight('word');
  const combo = FX.hitLight('combo');
  const shield = FX.hitLight('shield');
  assert.ok(combo.intensity > word.intensity);
  assert.ok((shield.color & 255) > ((shield.color >> 16) & 255), '破盾光应偏蓝');
});

test('高空雾倍率：地面 1 倍，y=90 为 1.8，不依赖 Fog.userData', () => {
  assert.equal(FX.fogAltitudeScale(10), 1);
  assert.equal(FX.fogAltitudeScale(50), 1);
  assert.ok(Math.abs(FX.fogAltitudeScale(90) - 1.8) < 1e-9);
  assert.ok(FX.fogAltitudeScale(70) > 1 && FX.fogAltitudeScale(70) < 1.8);
});

test('下龙没有第三人称偏移', () => {
  assert.equal(FX.rideCam({ mounted: false }), null);
  assert.equal(FX.rideCam({}), null);
});

test('骑乘相机：后拉抬高，俯仰跟着看，略低头看龙', () => {
  const flat = FX.rideCam({ mounted: true, pitch: 0 });
  assert.ok(flat);
  assert.ok(flat.back >= 5 && flat.back <= 8.5, '后拉要看见整条龙，又别拉到世界边缘');
  assert.ok(flat.up >= 1.8 && flat.up <= 3.4);
  assert.ok(flat.pitchScale > 0.5 && flat.pitchScale < 1, '俯仰要跟，但比第一人称软');
  assert.ok(flat.pitchBias > 0 && flat.pitchBias < 0.28);
  const up = FX.rideCam({ mounted: true, pitch: 0.7 });
  const down = FX.rideCam({ mounted: true, pitch: -0.7 });
  assert.ok(up.yLift > down.yLift, '抬头时相机应更高');
});

test('水面流动：只动 14 号格，速度慢，有范围', () => {
  const w = FX.waterFlow();
  assert.ok(w);
  assert.equal(w.tile, 14);
  assert.ok(w.speed > 0 && w.speed <= 0.06);
  assert.ok(w.ripple > 0 && w.ripple <= 0.08);
  assert.ok(w.uSize > 0 && w.vSize > 0);
  assert.ok(w.u0 >= 0 && w.u0 < 1);
});

test('花草摆动：桌面有、lite 关掉', () => {
  assert.equal(FX.plantSway(true), null);
  const s = FX.plantSway(false);
  assert.ok(s);
  assert.ok(s.angle > 0 && s.angle <= 0.2);
  assert.ok(s.speed > 0.4 && s.speed <= 2);
});

test('起降 FOV：上龙拉宽、下龙收回，寿命短', () => {
  assert.equal(FX.rideFov('miss'), null);
  const up = FX.rideFov('up');
  const down = FX.rideFov('down');
  assert.ok(up && down);
  assert.ok(up.add > 0 && up.add <= 12);
  assert.ok(down.add < 0 && down.add >= -10);
  assert.ok(up.life > 0 && up.life <= 0.4);
  assert.ok(down.life > 0 && down.life <= 0.4);
});

test('放置碎屑：有颜色、比挖掘少', () => {
  const place = FX.placeBurst('dirt');
  assert.ok(place);
  assert.equal(place.color, FX.debrisColor('dirt'));
  assert.ok(place.n >= 3 && place.n <= 6);
  assert.equal(FX.placeBurst('unknown').color, FX.debrisColor('unknown'));
});
