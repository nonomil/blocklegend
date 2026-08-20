/**
 * 动作词：玩家做的事立刻闪出英文名。
 * 浏览器挂 window.BlockLegendActionWords，node 可 import。
 */
(function (global) {
    'use strict';

    const ACTIONS = {
        jump: { word: 'jump', zh: '跳', ms: 1200, block: false },
        swim: { word: 'swim', zh: '游泳', ms: 1500, block: false },
        cut: { word: 'cut', zh: '砍', ms: 1200, block: false },
        eat: { word: 'eat', zh: '吃', ms: 1200, block: false },
        ride: { word: 'ride', zh: '骑', ms: 1500, block: false },
        hurt: { word: 'hurt', zh: '受伤', ms: 1000, block: false },
        die: { word: 'die', zh: '倒下', ms: 2000, block: false }
    };

    const CUT_KINDS = { log: true, oak_log: true, 'oak-log': true };

    function ofAction(kind) {
        return ACTIONS[kind] || null;
    }

    function actionFromBlock(kind) {
        return CUT_KINDS[kind] ? 'cut' : null;
    }

    function shouldShow(kind, ctx) {
        const spec = ofAction(kind);
        if (!spec) return false;
        const c = ctx || {};
        if (kind === 'swim' && !c.moving) return false;
        const now = Number(c.now) || 0;
        const lastAt = Number(c.lastAt) || 0;
        if (lastAt && now - lastAt < spec.ms) return false;
        return true;
    }

    global.BlockLegendActionWords = {
        ACTIONS: ACTIONS,
        ofAction: ofAction,
        actionFromBlock: actionFromBlock,
        shouldShow: shouldShow
    };
})(typeof globalThis !== 'undefined' ? globalThis : window);
