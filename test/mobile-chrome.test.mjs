/**
 * 手机 HUD：大屏保持展开，小屏把统计/顶栏收进菜单。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../data/mobile-chrome.js';

const C = globalThis.BlockLegendMobileChrome;
assert.ok(C, 'BlockLegendMobileChrome must be injected');

function fakeEl() {
    const s = new Set();
    return {
        classList: {
            toggle(name, on) {
                if (on) s.add(name);
                else s.delete(name);
            },
            contains(name) {
                return s.has(name);
            }
        }
    };
}

test('网页桌面不折叠，即使点了菜单', () => {
    assert.equal(C.wantCompact({ playMode: 'desktop' }), false);
    assert.equal(C.wantCompact({ playMode: 'web' }), false);
    const el = fakeEl();
    const out = C.apply(el, { compact: false, open: true, overlay: false });
    assert.equal(out.compact, false);
    assert.equal(out.open, false);
    assert.equal(el.classList.contains('is-hud-compact'), false);
    assert.equal(el.classList.contains('is-hud-menu'), false);
});

test('APK / 粗指针要折叠，默认关着菜单', () => {
    assert.equal(C.wantCompact({ capacitor: true }), true);
    assert.equal(C.wantCompact({ coarse: true }), true);
    assert.equal(C.wantCompact({ hoverNone: true }), true);
    assert.equal(C.wantCompact({ playMode: 'tablet' }), true);
    const el = fakeEl();
    const out = C.apply(el, { compact: true, open: false, overlay: false });
    assert.equal(out.compact, true);
    assert.equal(out.open, false);
    assert.equal(el.classList.contains('is-hud-compact'), true);
    assert.equal(el.classList.contains('is-hud-menu'), false);
});

test('折叠后点菜单才展开；弹层打开时菜单关掉', () => {
    const el = fakeEl();
    let out = C.apply(el, { compact: true, open: true, overlay: false });
    assert.equal(out.open, true);
    assert.equal(el.classList.contains('is-hud-menu'), true);
    out = C.apply(el, { compact: true, open: true, overlay: true });
    assert.equal(out.open, false);
    assert.equal(el.classList.contains('is-hud-compact'), true);
    assert.equal(el.classList.contains('is-hud-menu'), false);
});

test('chrome=full 强制保持网页展开', () => {
    assert.equal(C.wantCompact({ capacitor: true, chromeFull: true }), false);
});

test('折叠时小地图和任务仍留在画面，统计进菜单', () => {
    assert.ok(C.PLAY_KEEP.includes('mini-map'));
    assert.ok(C.PLAY_KEEP.includes('quest-panel'));
    assert.ok(C.PLAY_KEEP.includes('world-meta'));
    assert.ok(C.FOLD.includes('learn-panel'));
    assert.ok(C.FOLD.includes('topbar'));
    assert.equal(C.PLAY_KEEP.includes('learn-panel'), false);
});
