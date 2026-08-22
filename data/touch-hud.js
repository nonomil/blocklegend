/**
 * 触控 HUD：方框摇杆滑动 + 右侧动作键位（纯函数，node 可测）。
 */
(function (global) {
    'use strict';

    const DEAD = 0.18;
    const DIR = 0.22;

    const ACTIONS = [
        { id: 'attack', hold: null },
        { id: 'sprint', hold: 'boost' },
        { id: 'jump', hold: 'jump' },
        { id: 'place', hold: null },
        { id: 'sneak', hold: 'sneak' }
    ];

    const LAYOUT = {
        attack: { col: 1, row: 2 },
        sprint: { col: 2, row: 2 },
        jump: { col: 3, row: 1 },
        place: { col: 3, row: 2 },
        sneak: { col: 3, row: 3 }
    };

    function clamp1(n) {
        return Math.max(-1, Math.min(1, n));
    }

    function stickFromPointer(box, clientX, clientY) {
        const b = box || { left: 0, top: 0, width: 1, height: 1 };
        const hw = Math.max(1, Number(b.width) / 2);
        const hh = Math.max(1, Number(b.height) / 2);
        const rx = (Number(clientX) - (Number(b.left) + hw)) / hw;
        const ry = (Number(clientY) - (Number(b.top) + hh)) / hh;
        const nx = clamp1(rx);
        const ny = clamp1(ry);
        const mag = Math.hypot(nx, ny);
        if (mag < DEAD) {
            return { x: 0, y: 0, fwd: false, back: false, left: false, right: false, knobX: 0, knobY: 0 };
        }
        return {
            x: nx,
            y: -ny,
            fwd: ny < -DIR,
            back: ny > DIR,
            left: nx < -DIR,
            right: nx > DIR,
            knobX: nx,
            knobY: ny
        };
    }

    function knobPixel(state, travel) {
        const t = Number(travel) || 0;
        if (!state) return { x: 0, y: 0 };
        return {
            x: (Number(state.knobX) || 0) * t,
            y: (Number(state.knobY) || 0) * t
        };
    }

    global.BlockLegendTouchHud = {
        ACTIONS: ACTIONS,
        LAYOUT: LAYOUT,
        stickFromPointer: stickFromPointer,
        knobPixel: knobPixel
    };
})(typeof globalThis !== 'undefined' ? globalThis : window);
