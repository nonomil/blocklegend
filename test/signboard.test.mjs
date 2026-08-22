/**
 * 告示牌上的字：中英分行，能画到木板上。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../data/signboard.js';
import '../data/levels.js';
import '../data/world-gen.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const S = globalThis.BlockLegendSignboard;
const L = globalThis.BlockLegendLevels;
const W = globalThis.BlockLegendWorld;
const root = fileURLToPath(new URL('..', import.meta.url));

test('牌子把欢迎词拆成短行，中英都在', () => {
  assert.ok(S, 'BlockLegendSignboard must be injected');
  const lines = S.boardLines({
    who: '老师',
    zh: '欢迎回家。营地更大了：多个广场、学堂、工坊，东边还有码头和湖。',
    en: 'Welcome home. Explore the plazas, lake and dock.',
    prompts: [{ en: 'home', zh: '家' }, { en: 'go', zh: '走' }]
  });
  assert.ok(lines.length >= 4);
  assert.ok(lines.length <= 8);
  assert.equal(lines[0], '老师');
  assert.ok(lines.some(function (l) { return l.indexOf('欢迎') >= 0; }));
  assert.ok(lines.some(function (l) { return /Welcome/i.test(l); }));
  lines.forEach(function (l) {
    assert.ok(l.length <= 16, 'line too long: ' + l);
  });
});

test('营地在地上立欢迎牌和指路牌，不再弹老师浮层', () => {
  const signs = L.hubSignsOf({ cx: 192, cz: 192 });
  assert.ok(signs.length >= 2);
  signs.forEach(function (s) {
    assert.equal(s.kind, 'sign');
    assert.ok(s.zh);
    assert.ok(s.en);
    assert.ok(Math.hypot(s.x - 192, s.z - 192) <= 20);
  });
  const portals = L.hubPortalsOf({ unlockedLevel: 1, cx: 192, cz: 192 });
  const world = W.createWorld(7, { climate: 'plains', hub: true, portals: portals });
  const planted = (world.placedProps || []).filter(function (p) { return p.kind === 'sign'; });
  assert.ok(planted.length >= 2, 'world plants wooden signs');
  assert.ok(planted.some(function (p) { return String(p.zh).indexOf('欢迎') >= 0; }));
  const game = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
  assert.match(game, /function paintHubTalk\(\) \{[\s\S]{0,280}hub-guide[\s\S]{0,180}classList\.add\('is-hidden'\)/);
  assert.doesNotMatch(game, /function paintHubTalk\(\) \{[\s\S]{0,900}classList\.remove\('is-hidden'\)/);
});
