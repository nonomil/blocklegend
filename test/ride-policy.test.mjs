/**
 * 骑龙门控：营地短体验、龙鞍买断、指定关短骑、堡垒必须落地。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
await import('../data/ride-policy.js');
await import('../data/shop.js');

const P = globalThis.BlockLegendRidePolicy;
const S = globalThis.BlockLegendShop;
assert.ok(P && S);

test('无鞍、营地、未体验：可以 demo 20 秒', () => {
  const r = P.canStartMount({ gear: {}, hub: true, demoUsed: false });
  assert.equal(r.ok, true);
  assert.equal(r.mode, 'demo');
  assert.equal(r.limitMs, 20000);
});

test('无鞍、营地、体验已用：不能骑', () => {
  const r = P.canStartMount({ gear: {}, hub: true, demoUsed: true });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'need-saddle');
});

test('无鞍、关卡：不能骑', () => {
  const r = P.canStartMount({ gear: {}, hub: false, demoUsed: false, level: 4 });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'need-saddle');
});

test('有龙鞍：营地无限，指定关短骑，其他关拒绝', () => {
  const gear = { saddle: 'dragon-saddle' };
  assert.equal(P.hasSaddle(gear), true);
  assert.equal(P.canStartMount({ gear: gear, hub: true, demoUsed: true }).mode, 'free');
  const seg = P.canStartMount({ gear: gear, hub: false, level: 4 });
  assert.equal(seg.mode, 'segment');
  assert.equal(seg.limitMs, 40000);
  const nether = P.canStartMount({ gear: gear, hub: false, level: 6 });
  assert.equal(nether.ok, true);
  const ground = P.canStartMount({ gear: gear, hub: false, level: 1 });
  assert.equal(ground.ok, false);
  assert.equal(ground.reason, 'not-ride-level');
});

test('demo / 短骑到点判定', () => {
  assert.equal(P.demoExpired(1000, 1000 + 19999), false);
  assert.equal(P.demoExpired(1000, 1000 + 20000), true);
  assert.equal(P.demoExpired(1000, 1000 + 39999, 40000), false);
  assert.equal(P.demoExpired(1000, 1000 + 40000, 40000), true);
});

test('商店龙鞍 / 护目镜 / 龙息宝石', () => {
  const saddle = S.buy({ coined: 40, gear: {} }, 'dragon-saddle');
  assert.equal(saddle.ok, true);
  assert.equal(saddle.gear.saddle, 'dragon-saddle');
  assert.equal(S.statsOf(saddle.gear).atk, 0);
  const gog = S.buy({ coined: 25, gear: saddle.gear }, 'ride-goggles');
  assert.equal(gog.ok, true);
  assert.equal(gog.gear.goggles, 'ride-goggles');
  const gem = S.buy({ coined: 30, gear: gog.gear }, 'breath-gem');
  assert.equal(gem.ok, true);
  assert.equal(gem.gear.charm, 'breath-gem');
  assert.equal(S.buy({ coined: 24, gear: {} }, 'ride-goggles').ok, false);
});

test('第 12 关堡垒：说词推进，飞着不能通关', () => {
  let st = P.fortressStart();
  st = P.fortressOnWord(st);
  st = P.fortressOnWord(st);
  st = P.fortressOnWord(st);
  assert.equal(st.step, 2);
  st = P.fortressOnWord(st);
  assert.equal(st.step, 3);
  st = P.fortressOnWord(st);
  st = P.fortressOnWord(st);
  st = P.fortressOnWord(st);
  assert.equal(st.step, 4);
  assert.equal(P.fortressCanFinish({ fortress: st, mounted: true }).ok, false);
  assert.equal(P.fortressCanFinish({ fortress: st, mounted: false }).ok, false);
  st = P.fortressOnLand(st);
  assert.equal(st.step, 5);
  assert.equal(P.fortressCanFinish({ fortress: st, mounted: false }).ok, true);
  assert.equal(P.fortressCanFinish({ fortress: null, mounted: false }).ok, true);
  assert.equal(P.rideHoldOpen({ step: 1 }), true, '堡垒进行中不应超时踢下龙');
  assert.equal(P.rideHoldOpen({ step: 4 }), true);
  assert.equal(P.rideHoldOpen({ step: 5 }), false, '落地收尾后可以按时落地');
  assert.equal(P.rideHoldOpen(null), false);
});

test('空战和堡垒按关卡往后加：4 无、6 恶魂、8 幻翼、12 才开堡垒', () => {
  const e4 = P.rideEncounterOf(4);
  assert.equal(e4.air, null);
  assert.equal(e4.fortress, false);
  assert.equal(P.shouldStartFortress(4), false);
  assert.equal(P.airSpawnOf(4, 0), null);

  const air6 = P.airSpawnOf(6, 0);
  assert.ok(air6);
  assert.deepEqual(air6.kinds, ['ghast']);
  assert.equal(air6.count, 1);
  assert.equal(P.shouldStartFortress(6), false);

  const air8 = P.airSpawnOf(8, 0);
  assert.ok(air8);
  assert.equal(air8.kinds.indexOf('phantom') >= 0, true);
  assert.ok(air8.count >= 2);
  assert.equal(P.shouldStartFortress(8), false);
  const packs8 = P.airPacksOf(8, 0);
  assert.ok(packs8.length >= 2, '第8关应同时出幻翼和风暴');
  const kinds8 = packs8.reduce((acc, p) => acc.concat(p.kinds || []), []);
  assert.ok(kinds8.indexOf('storm') >= 0, '骑龙段应有风暴');
  assert.ok(P.rideHint(8).indexOf('风暴') >= 0);
  let st = P.stormStart();
  st = P.stormOnWord(st);
  assert.equal(st.done, false);
  st = P.stormOnWord(st);
  assert.equal(st.done, true);
  assert.ok(st.toast && st.toast.indexOf('风暴') >= 0);

  assert.equal(P.shouldStartFortress(12), true);
  assert.equal(P.airSpawnOf(12, 1), null);
  const air12 = P.airSpawnOf(12, 2);
  assert.ok(air12);
  assert.deepEqual(air12.kinds, ['ghast']);
  const air12b = P.airSpawnOf(12, 3);
  assert.ok(air12b);
  assert.deepEqual(air12b.kinds, ['wither']);
  assert.equal(P.fortressHint({ step: 1, words: 1 }).indexOf('1/5') >= 0, true);
  assert.equal(P.fortressHint({ step: 4, words: 0 }).indexOf('落地') >= 0, true);
});

test('空中猎手高度：骑着跟玩家，落地回地面', () => {
  assert.equal(P.airHuntY({ mounted: false, playerY: 18, groundY: 8, lift: 0.6 }), 8);
  assert.equal(P.airHuntY({ mounted: true, playerY: 18, groundY: 8, lift: 0.6 }), 18.6);
});

test('第12关堡垒布局：浮岛、塔、桥、落地点，桥和岛不重叠', () => {
  const L = P.fortressLayoutOf({ cx: 256, cz: 256, surfaceY: 8 });
  assert.ok(L.island.length >= 20, '岛面应有足够体素');
  assert.ok(L.tower.length >= 8, '塔应有墙和金门框');
  assert.ok(L.bridge.length >= 6, '桥应有可放下的木板');
  assert.equal(L.deckY, 20, '甲板应在地面 +12（巡航高度）');
  assert.ok(L.land.y >= L.deckY, '落地点应在甲板上');
  const kinds = {};
  L.island.concat(L.tower, L.bridge).forEach((b) => {
    assert.ok(b.x && b.y && b.z && b.kind, '每格应有坐标和种类');
    kinds[b.kind] = true;
  });
  ['stone', 'plank', 'gold'].forEach((k) => {
    assert.ok(kinds[k], '应使用现有体素 ' + k);
  });
  const islandKeys = new Set(L.island.map((b) => b.x + ',' + b.y + ',' + b.z));
  L.bridge.forEach((b) => {
    assert.equal(islandKeys.has(b.x + ',' + b.y + ',' + b.z), false, '桥不应盖住岛');
  });
  assert.ok(P.shouldDropBridge({ step: 1 }, { step: 2 }), '第1步说完应变第2步并放桥');
  assert.equal(P.shouldDropBridge({ step: 2 }, { step: 3 }), false);
});

test('第4关雪夜门：说两个词开门，布局有柱和冰封', () => {
  assert.equal(P.shouldStartRideDoor(4), true);
  assert.equal(P.shouldStartRideDoor(8), false);
  let st = P.rideDoorStart();
  st = P.rideDoorOnWord(st);
  assert.equal(st.open, false);
  st = P.rideDoorOnWord(st);
  assert.equal(st.open, true);
  assert.ok(st.toast && st.toast.indexOf('门') >= 0);
  assert.ok(P.shouldOpenRideDoor({ open: false }, { open: true }));
  assert.equal(P.shouldOpenRideDoor({ open: true }, { open: true }), false);
  const L = P.rideDoorLayoutOf({ cx: 256, cz: 256, surfaceY: 8 });
  assert.ok(L.posts.length >= 8);
  assert.ok(L.fill.length >= 6);
  assert.ok(L.lintel.length >= 3);
  const kinds = {};
  L.posts.concat(L.fill, L.lintel).forEach((b) => { kinds[b.kind] = true; });
  assert.ok(kinds.log && kinds.ice && kinds.gold);
  const postKeys = new Set(L.posts.map((b) => b.x + ',' + b.y + ',' + b.z));
  L.fill.forEach((b) => {
    assert.equal(postKeys.has(b.x + ',' + b.y + ',' + b.z), false, '冰封不应盖住门柱');
  });
  assert.ok(P.rideHint(4).indexOf('门') >= 0);
});

test('词灵光点：无鞍不亮，有鞍随关卡和连对变亮', () => {
  assert.equal(P.spiritLightOf({ gear: {} }).on, false);
  const camp = P.spiritLightOf({ gear: { saddle: 'dragon-saddle' }, level: 1 });
  assert.equal(camp.on, true);
  assert.ok(camp.intensity > 0);
  const l12 = P.spiritLightOf({ gear: { saddle: 'dragon-saddle' }, level: 12, combo: 3, mounted: true });
  assert.ok(l12.intensity > camp.intensity);
  assert.ok(l12.scale >= camp.scale);
});

test('词灵：连对缩短龙息冷却，护目镜加题时，宝石加说中窗口', () => {
  assert.equal(P.breathCooldownMs({ combo: 0 }), 1000);
  assert.equal(P.breathCooldownMs({ combo: 3 }), 750);
  assert.equal(P.wordWindowMs({}), 8000);
  assert.equal(P.wordWindowMs({ gem: true }), 9000);
  assert.equal(P.quizBonusMs({ goggles: true, mounted: true }), 2000);
  assert.equal(P.quizBonusMs({ goggles: true, mounted: false }), 0);
  assert.ok(P.spiritScale(12, { saddle: 'dragon-saddle' }) > P.spiritScale(4, { saddle: 'dragon-saddle' }));
});
