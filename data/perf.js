/**
 * 卡顿两刀：小地图缓存键、APK 画布封顶。
 */
(function (global) {
    'use strict';

    const LITE_LONG_EDGE = 720;
    const HUD_MS = 200;
    const LIFE_RADIUS = 48;

    function terrainKey(world, canvasW) {
        const w = world || {};
        return [w.size || 0, w.seed || 0, w.climate || '', Number(canvasW) || 0].join(':');
    }

    function shouldPaintTerrain(prevKey, world, canvasW) {
        return String(prevKey || '') !== terrainKey(world, canvasW);
    }

    function internalSize(cssW, cssH, cap) {
        const w = Math.max(1, Math.floor(Number(cssW) || 1));
        const h = Math.max(1, Math.floor(Number(cssH) || 1));
        const long = Math.max(w, h);
        const limit = Number(cap) || 0;
        if (!limit || long <= limit) return { w: w, h: h };
        const scale = limit / long;
        return {
            w: Math.max(1, Math.floor(w * scale)),
            h: Math.max(1, Math.floor(h * scale))
        };
    }

    function shouldPulse(now, lastAt, ms) {
        const gap = Number(ms) || HUD_MS;
        const prev = Number(lastAt) || 0;
        if (!prev) return true;
        return (Number(now) || 0) - prev >= gap;
    }

    function shouldTickLife(entity, player, opts) {
        const o = opts || {};
        if (o.always) return true;
        const row = entity || {};
        if (row.hunting || row.fleeing || row.guarding) return true;
        const me = player || {};
        const r = o.radius == null ? LIFE_RADIUS : Number(o.radius);
        const dx = (row.x || 0) - (me.x || 0);
        const dz = (row.z || 0) - (me.z || 0);
        return (dx * dx + dz * dz) <= r * r;
    }

    global.BlockLegendPerf = {
        LITE_LONG_EDGE: LITE_LONG_EDGE,
        HUD_MS: HUD_MS,
        LIFE_RADIUS: LIFE_RADIUS,
        terrainKey: terrainKey,
        shouldPaintTerrain: shouldPaintTerrain,
        internalSize: internalSize,
        shouldPulse: shouldPulse,
        shouldTickLife: shouldTickLife
    };
})(typeof globalThis !== 'undefined' ? globalThis : window);
