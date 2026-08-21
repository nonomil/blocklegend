/**
 * 手机 HUD 折叠：大屏展开，小屏把顶栏/统计收进菜单。
 */
(function (global) {
    'use strict';

    function wantCompact(flags) {
        const f = flags || {};
        if (f.chromeFull) return false;
        if (f.capacitor) return true;
        if (f.playMode === 'tablet') return true;
        if (f.playMode === 'desktop' || f.playMode === 'web') return false;
        if (f.coarse || f.hoverNone) return true;
        return false;
    }

    function apply(el, state) {
        const s = state || {};
        const compact = !!s.compact;
        const open = !!(compact && s.open && !s.overlay);
        if (el && el.classList) {
            el.classList.toggle('is-hud-compact', compact);
            el.classList.toggle('is-hud-menu', open);
        }
        return { compact: compact, open: open };
    }

    global.BlockLegendMobileChrome = {
        PLAY_KEEP: ['mini-map', 'quest-panel', 'world-meta', 'speech-hud', 'craft-btn'],
        FOLD: ['learn-panel', 'topbar', 'hint', 'look-tip'],
        wantCompact: wantCompact,
        apply: apply
    };
})(typeof globalThis !== 'undefined' ? globalThis : window);
