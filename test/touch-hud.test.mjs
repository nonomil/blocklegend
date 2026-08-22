/**
 * 触控 HUD：左边方框摇杆可滑，右边攻击/冲刺/跳/放/潜行。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import '../data/touch-hud.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const H = globalThis.BlockLegendTouchHud;
assert.ok(H, 'BlockLegendTouchHud must be injected');

const BOX = { left: 0, top: 0, width: 100, height: 100 };

test('摇杆死区：按在正中不走，钮也回中', () => {
    const s = H.stickFromPointer(BOX, 50, 50);
    assert.equal(s.x, 0);
    assert.equal(s.y, 0);
    assert.equal(s.fwd, false);
    assert.equal(s.back, false);
    assert.equal(s.left, false);
    assert.equal(s.right, false);
    assert.equal(s.knobX, 0);
    assert.equal(s.knobY, 0);
});

test('摇杆可滑：右推给 +x，前推给 +y，钮跟着走且不出方框', () => {
    const right = H.stickFromPointer(BOX, 100, 50);
    assert.ok(right.x > 0.9, '右推应接近满轴');
    assert.ok(Math.abs(right.y) < 0.15);
    assert.equal(right.right, true);
    assert.ok(right.knobX > 0.9);
    assert.equal(right.knobY, 0);

    const fwd = H.stickFromPointer(BOX, 50, 0);
    assert.ok(fwd.y > 0.9, '上滑是前进');
    assert.ok(Math.abs(fwd.x) < 0.15);
    assert.equal(fwd.fwd, true);
    assert.ok(fwd.knobY < -0.9, '钮在屏幕上往上走');

    const out = H.stickFromPointer(BOX, 180, -40);
    assert.ok(out.x <= 1 && out.x >= -1);
    assert.ok(out.y <= 1 && out.y >= -1);
    assert.ok(out.knobX <= 1 && out.knobX >= -1);
    assert.ok(out.knobY <= 1 && out.knobY >= -1);
});

test('松手后面板把钮像素位移清零', () => {
    const idle = H.knobPixel(null, 40);
    assert.deepEqual(idle, { x: 0, y: 0 });
    const held = H.knobPixel({ knobX: 1, knobY: -0.5 }, 40);
    assert.equal(held.x, 40);
    assert.equal(held.y, -20);
});

test('右边五键：剑攻击、>> 冲刺、上跳、十字放、下潜行', () => {
    const ids = H.ACTIONS.map(function (a) { return a.id; });
    assert.deepEqual(ids, ['attack', 'sprint', 'jump', 'place', 'sneak']);
    const byId = {};
    H.ACTIONS.forEach(function (a) { byId[a.id] = a; });
    assert.equal(byId.attack.hold, null);
    assert.equal(byId.sprint.hold, 'boost');
    assert.equal(byId.jump.hold, 'jump');
    assert.equal(byId.sneak.hold, 'sneak');
    assert.equal(byId.place.hold, null);
    assert.equal(H.LAYOUT.attack.col, 1);
    assert.equal(H.LAYOUT.sprint.col, 2);
    assert.equal(H.LAYOUT.jump.col, 3);
    assert.equal(H.LAYOUT.jump.row, 1);
    assert.equal(H.LAYOUT.place.row, 2);
    assert.equal(H.LAYOUT.sneak.row, 3);
});

test('页面是方框滑钮，不是四向圆键', () => {
    const html = readFileSync(join(root, 'index.html'), 'utf8');
    assert.match(html, /id="touch-stick-knob"/);
    assert.match(html, /id="touch-sprint"/);
    assert.match(html, /id="touch-sneak"/);
    assert.match(html, /id="touch-attack"/);
    assert.match(html, /id="touch-jump"/);
    assert.match(html, /id="touch-place"/);
    assert.doesNotMatch(html, /class="bl-dpad-btn/);
    const css = readFileSync(join(root, 'game.css'), 'utf8');
    assert.match(css, /\.bl-stick-knob/);
    assert.match(css, /\.bl-touch-act/);
    assert.doesNotMatch(css, /\.bl-dpad-btn\s*\{[^}]*border-radius:\s*999px/);
});
