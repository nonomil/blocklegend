/**
 * blocklegend · 挖掘碎屑色与三材质短音（ART-06）
 * 浏览器挂 window.BlockLegendFx，node 可 import。
 */
(function (global) {
    'use strict';

    const WOOD = { log: 1, leaf: 1, plank: 1, table: 1 };
    const STONE = { stone: 1, coal: 1, iron: 1, gold: 1, diamond: 1 };
    const DEBRIS = {
        grass: 0x5ca838,
        dirt: 0x9a6a3c,
        sand: 0xd4b45c,
        snow: 0xe8f0f4,
        stone: 0x7a7c82,
        coal: 0x3a3a3c,
        iron: 0xb0a090,
        gold: 0xe0c040,
        diamond: 0x48d2d6,
        log: 0x8a5a2c,
        leaf: 0x4a8a30,
        plank: 0xc49a58,
        table: 0xc49a58,
        word: 0xf0c84a
    };

    function mineSfxKind(kind) {
        if (WOOD[kind]) return 'wood';
        if (STONE[kind]) return 'stone';
        return 'dirt';
    }

    function debrisColor(kind) {
        return DEBRIS[kind] || 0xc8b48a;
    }

    const WORD_FLASH = {
        word: {
            additive: true,
            flashColor: 0xffe27a,
            flashScale: 1.7,
            flashLife: 0.32,
            ringColor: 0xf0c84a,
            ringR0: 0.7,
            ringGrow: 1.8,
            ringLife: 0.42
        },
        shield: {
            additive: true,
            flashColor: 0xa8dcff,
            flashScale: 2.4,
            flashLife: 0.4,
            ringColor: 0x6ec8ff,
            ringR0: 1.05,
            ringGrow: 2.8,
            ringLife: 0.5
        }
    };

    function wordFlash(kind) {
        return WORD_FLASH[kind] || null;
    }

    const HIT_FLASH = {
        hit: {
            additive: true,
            flashColor: 0xf2f4f8,
            flashScale: 0.95,
            flashLife: 0.16,
            ringColor: 0,
            ringR0: 0,
            ringGrow: 0,
            ringLife: 0
        },
        combo: {
            additive: true,
            flashColor: 0xff7a32,
            flashScale: 2.05,
            flashLife: 0.36,
            ringColor: 0xff6a20,
            ringR0: 0.85,
            ringGrow: 2.15,
            ringLife: 0.46
        }
    };

    function hitFlash(kind) {
        return HIT_FLASH[kind] || null;
    }

    const BOLT_GLOW = {
        bolt: {
            additive: true,
            trail: false,
            stretch: 1.7,
            coreColor: 0xf0e8ff,
            haloColor: 0x7a3ce0,
            haloOpacity: 0.38
        },
        word: {
            additive: true,
            trail: false,
            stretch: 2.05,
            coreColor: 0xffe8a8,
            haloColor: 0xf0b44a,
            haloOpacity: 0.42
        }
    };

    function boltGlow(kind) {
        return BOLT_GLOW[kind] || null;
    }

    const CLIMATE_MOOD = {
        plains:    { fogC: 0xb0d6f0, sunDisc: 0xfff3c4, sunSize: 3.4, fogN: 54, fogF: 112 },
        forest:    { fogC: 0x88b894, sunDisc: 0xf0f4d0, sunSize: 2.8, fogN: 42, fogF: 86 },
        quarry:    { fogC: 0xb0b8c0, sunDisc: 0xf0eee0, sunSize: 3.0, fogN: 48, fogF: 96 },
        cherry:    { fogC: 0xf4d0dc, sunDisc: 0xffd0e0, sunSize: 3.2, fogN: 38, fogF: 76 },
        desert:    { fogC: 0xf0dc9c, sunDisc: 0xffe090, sunSize: 4.2, fogN: 66, fogF: 142 },
        duskvale:  { fogC: 0xd4a080, sunDisc: 0xffb070, sunSize: 3.6, fogN: 34, fogF: 72 },
        crystal:   { fogC: 0x9ec8d8, sunDisc: 0xd0f4ff, sunSize: 3.1, fogN: 42, fogF: 86 },
        nether:    { fogC: 0x4a1412, sunDisc: 0xff5028, sunSize: 2.2, fogN: 26, fogF: 54 },
        snow:      { fogC: 0xdce8f4, sunDisc: 0xf8fbff, sunSize: 3.0, fogN: 34, fogF: 70 },
        ocean:     { fogC: 0x7eb8d4, sunDisc: 0xfff0c8, sunSize: 3.5, fogN: 56, fogF: 118 },
        mushroom:  { fogC: 0xd4b0d8, sunDisc: 0xf0c8e8, sunSize: 2.9, fogN: 42, fogF: 86 },
        volcano:   { fogC: 0x5a2018, sunDisc: 0xff6030, sunSize: 2.6, fogN: 30, fogF: 62 },
        deep_dark: { fogC: 0x102028, sunDisc: 0x3a7080, sunSize: 1.4, fogN: 20, fogF: 44 },
        astral:    { fogC: 0xd0dcec, sunDisc: 0xe8f0ff, sunSize: 2.7, fogN: 46, fogF: 92 },
        end:       { fogC: 0x241830, sunDisc: 0xc8a0ff, sunSize: 2.0, fogN: 24, fogF: 50 }
    };

    function climateMood(name) {
        return CLIMATE_MOOD[name] || CLIMATE_MOOD.plains;
    }

    const SLASH_FLASH = {
        swing: {
            additive: true,
            flashColor: 0xfff4dc,
            flashScale: 1.15,
            flashLife: 0.2,
            ringGrow: 0
        },
        cast: {
            additive: true,
            flashColor: 0xffd878,
            flashScale: 1.35,
            flashLife: 0.24,
            ringGrow: 0
        }
    };

    function slashFlash(kind) {
        return SLASH_FLASH[kind] || null;
    }

    const HIT_PUNCH = {
        word: { yaw: 0.018, pitch: 0.011, life: 0.16 },
        combo: { yaw: 0.03, pitch: 0.018, life: 0.22 },
        shield: { yaw: 0.038, pitch: 0.024, life: 0.26 }
    };

    function hitPunch(kind) {
        return HIT_PUNCH[kind] || null;
    }

    const HIT_LIGHT = {
        hit: { color: 0xf0f2f8, intensity: 0.55, range: 2.4, life: 0.14 },
        word: { color: 0xffe27a, intensity: 1.8, range: 4.6, life: 0.28 },
        combo: { color: 0xff7a32, intensity: 2.4, range: 5.4, life: 0.34 },
        shield: { color: 0x6ec8ff, intensity: 2.2, range: 5.8, life: 0.36 }
    };

    function hitLight(kind) {
        return HIT_LIGHT[kind] || null;
    }

    function fogAltitudeScale(y) {
        const t = Math.max(0, Math.min(1, (Number(y) - 50) / 40));
        return 1 + 0.8 * t;
    }

    function rideFov(kind) {
        if (kind === 'up') return { add: 8, life: 0.32 };
        if (kind === 'down') return { add: -5, life: 0.24 };
        return null;
    }

    const RIDE_CRUISE = 12;

    function rideFloor(surfaceY) {
        return (Number(surfaceY) || 0) + RIDE_CRUISE;
    }

    function rideMountY(surfaceY, dragonY) {
        const seat = (dragonY != null ? Number(dragonY) : Number(surfaceY) || 0) + 1.32;
        return Math.max(seat, rideFloor(surfaceY));
    }

    function wingFlap(t, moving) {
        const time = Number(t) || 0;
        if (moving) return Math.sin(time * 6.2) * 0.72 + Math.sin(time * 12.4) * 0.12;
        return Math.sin(time * 2.2) * 0.1;
    }

    function rideCam(opts) {
        const o = opts || {};
        if (!o.mounted) return null;
        const pitch = Number(o.pitch) || 0;
        return {
            back: 8.6,
            up: 3.4,
            pitchScale: 0.72,
            pitchBias: 0.14,
            yLift: pitch * 1.15
        };
    }

    function waterFlow() {
        const cols = 4, rows = 9, tile = 14;
        const col = tile % cols;
        const row = Math.floor(tile / cols);
        return {
            tile: tile,
            speed: 0.032,
            ripple: 0.035,
            u0: col / cols,
            v0: 1 - (row + 1) / rows,
            uSize: 1 / cols,
            vSize: 1 / rows
        };
    }

    function plantSway(lite) {
        if (lite) return null;
        return { angle: 0.11, speed: 1.05 };
    }

    function placeBurst(kind) {
        return { n: 5, color: debrisColor(kind) };
    }

    global.BlockLegendFx = {
        mineSfxKind: mineSfxKind,
        debrisColor: debrisColor,
        wordFlash: wordFlash,
        hitFlash: hitFlash,
        boltGlow: boltGlow,
        climateMood: climateMood,
        slashFlash: slashFlash,
        hitPunch: hitPunch,
        hitLight: hitLight,
        fogAltitudeScale: fogAltitudeScale,
        RIDE_CRUISE: RIDE_CRUISE,
        rideFloor: rideFloor,
        rideMountY: rideMountY,
        wingFlap: wingFlap,
        rideCam: rideCam,
        rideFov: rideFov,
        waterFlow: waterFlow,
        plantSway: plantSway,
        placeBurst: placeBurst
    };
}(typeof window !== 'undefined' ? window : globalThis));
