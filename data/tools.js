/**
 * blocklegend · 工具与体素射线（纯函数，无 DOM）
 * 剑打怪、斧砍树、镐挖石、铲挖土，手感贴近原版分工。
 */
(function (global) {
    'use strict';

    const SLOT_IDS = ['fist', 'sword', 'axe', 'pickaxe', 'shovel'];
    const DEFAULT_HOTBAR = ['fist', null, null, null, 'oak-log', 'plank', null, null, null];
    const START_BAG = { 'oak-log': 3, plank: 4 };
    const FOOD = {
        pork: 4, beef: 4, mutton: 4, chicken: 3, egg: 2,
        bread: 5, cookie: 2, cake: 8, apple: 3, golden_apple: 10,
        cooked_pork: 6, cooked_beef: 6, cooked_mutton: 6, cooked_chicken: 5, milk: 3, fish: 4,
        cooked_fish: 6
    };

    function emptyHotbar() {
        return DEFAULT_HOTBAR.slice();
    }

    function normalizeHotbar(bar) {
        const next = emptyHotbar();
        if (!Array.isArray(bar)) return next;
        for (let i = 0; i < 9; i += 1) {
            if (bar[i] !== undefined) next[i] = bar[i] || null;
        }
        return next;
    }

    function assignHotbar(bar, index, id) {
        const next = normalizeHotbar(bar);
        const i = Math.max(0, Math.min(8, Number(index) || 0));
        next[i] = id || null;
        return next;
    }

    function swapHotbar(bar, a, b) {
        const next = Array.isArray(bar) ? bar.slice() : emptyHotbar();
        const i = Math.max(0, Math.min(next.length - 1, Number(a) || 0));
        const j = Math.max(0, Math.min(next.length - 1, Number(b) || 0));
        const tmp = next[i];
        next[i] = next[j];
        next[j] = tmp;
        return next;
    }

    function isHotTool(id) {
        if (!id) return false;
        if (id === 'fist' || id === 'sword' || id === 'axe' || id === 'pickaxe' || id === 'shovel' || id === 'place') return true;
        return /_(sword|pick|axe|shovel|bow|shield|hoe)$/.test(id)
            || id === 'flint_and_steel' || id === 'arrow' || id === 'snowball'
            || id === 'shears' || id === 'fishing_rod' || id === 'bucket' || id === 'lead';
    }

    function isLegacyLoadout(bar) {
        return !!(bar && bar[0] === 'sword' && bar[1] === 'axe' && bar[2] === 'pickaxe' && bar[3] === 'shovel');
    }

    function toolRole(id) {
        const key = String(id || '');
        if (!key || key === 'fist') return 'fist';
        if (/hoe/.test(key)) return 'hoe';
        if (/pick/.test(key)) return 'pickaxe';
        if (/axe/.test(key)) return 'axe';
        if (/shovel/.test(key)) return 'shovel';
        if (/sword/.test(key) || key === 'sword') return 'sword';
        if (key === 'flint_and_steel') return 'flint';
        if (key === 'arrow' || key === 'snowball' || key === 'wood_bow' || /bow/.test(key)) return key.indexOf('bow') >= 0 ? 'bow' : 'arrow';
        return 'fist';
    }

    function eatHeal(id) {
        return FOOD[id] || 0;
    }

    function applyEat(hp, hpMax, item) {
        const heal = eatHeal(item);
        const cur = Number(hp) || 0;
        const max = Number(hpMax) || 10;
        if (!heal) return { ok: false, hp: cur, heal: 0 };
        return { ok: true, hp: Math.min(max, cur + heal), heal: heal };
    }
    const BASE_BREAK_MS = {
        log: 900,
        leaf: 320,
        dirt: 520,
        grass: 420,
        sand: 480,
        snow: 380,
        stone: 1400,
        water: 280,
        coal: 1200,
        iron: 1500,
        gold: 1600,
        diamond: 1800,
        plank: 700,
        table: 720,
        word: 280,
        gate: 400,
        glass: 600,
        tnt: 400,
        gravel: 480,
        clay: 500,
        sandstone: 1100,
        stone_brick: 1400,
        brick: 1200,
        wool: 360,
        carpet: 280,
        ice: 700,
        packed_ice: 800,
        quartz: 1400,
        quartz_block: 1400,
        snow_block: 400,
        slab: 500,
        stairs: 600,
        trapdoor: 600,
        coal_block: 1100,
        iron_block: 1600,
        gold_block: 1600,
        diamond_block: 1800,
        campfire: 500
    };
    const TOOLS = {
        fist: { id: 'fist', melee: 0.22, mine: { log: 0.28, leaf: 0.4, dirt: 0.42, grass: 0.42, sand: 0.4, snow: 0.4, stone: 0.1, water: 0.3, coal: 0.1, iron: 0.08, gold: 0.08, diamond: 0.06, plank: 0.28, table: 0.28, word: 1, gate: 1, glass: 0.16, tnt: 0.5 } },
        sword: { id: 'sword', melee: 1, mine: { log: 0.35, leaf: 0.45, dirt: 0.28, grass: 0.28, sand: 0.28, snow: 0.3, stone: 0.16, water: 0.3, coal: 0.16, iron: 0.14, gold: 0.14, diamond: 0.12, plank: 0.4, table: 0.4, word: 1, gate: 1, glass: 0.2, tnt: 0.5 } },
        axe: { id: 'axe', melee: 0.55, mine: { log: 1, leaf: 1, dirt: 0.34, grass: 0.34, sand: 0.34, snow: 0.34, stone: 0.2, water: 0.34, coal: 0.2, iron: 0.18, gold: 0.16, diamond: 0.14, plank: 1, table: 1, word: 1, gate: 1, glass: 0.22, tnt: 0.5 } },
        pickaxe: { id: 'pickaxe', melee: 0.42, mine: { log: 0.4, leaf: 0.4, dirt: 0.72, grass: 0.72, sand: 0.72, snow: 0.72, stone: 1, water: 0.4, coal: 1, iron: 1, gold: 1, diamond: 1, plank: 0.45, table: 0.45, word: 1, gate: 1, glass: 1, tnt: 0.6 } },
        shovel: { id: 'shovel', melee: 0.35, mine: { log: 0.25, leaf: 0.3, dirt: 1, grass: 1, sand: 1, snow: 1, stone: 0.14, water: 1, coal: 0.14, iron: 0.12, gold: 0.12, diamond: 0.1, plank: 0.28, table: 0.28, word: 1, gate: 1, glass: 0.18, tnt: 0.5 } },
        hoe: { id: 'hoe', melee: 0.28, mine: { log: 0.25, leaf: 0.3, dirt: 0.9, grass: 0.9, sand: 0.7, snow: 0.7, stone: 0.14, water: 0.4, coal: 0.14, iron: 0.12, gold: 0.12, diamond: 0.1, plank: 0.28, table: 0.28, word: 1, gate: 1, glass: 0.18, tnt: 0.5 } },
        flint: { id: 'flint', melee: 0.2, mine: { log: 0.2, leaf: 0.2, dirt: 0.2, grass: 0.2, sand: 0.2, snow: 0.2, stone: 0.12, water: 0.2, coal: 0.12, iron: 0.1, gold: 0.1, diamond: 0.08, plank: 0.2, table: 0.2, word: 1, gate: 1, glass: 0.14, tnt: 1 } },
        place: { id: 'place', melee: 0.28, mine: { log: 0.22, leaf: 0.28, dirt: 0.32, grass: 0.32, sand: 0.32, snow: 0.32, stone: 0.12, water: 0.3, coal: 0.12, iron: 0.1, gold: 0.1, diamond: 0.08, plank: 0.24, table: 0.24, word: 1, gate: 1, glass: 0.14, tnt: 0.5 } }
    };
    const DROPS = {
        log: 'oak-log',
        leaf: 'stick',
        dirt: 'dirt',
        grass: 'dirt',
        sand: 'sand',
        glass: 'glass',
        snow: 'snowball',
        ice: 'ice',
        packed_ice: 'packed_ice',
        quartz: 'quartz',
        quartz_block: 'quartz_block',
        snow_block: 'snow_block',
        slab: 'slab',
        stairs: 'stairs',
        trapdoor: 'trapdoor',
        coal_block: 'coal_block',
        iron_block: 'iron_block',
        gold_block: 'gold_block',
        diamond_block: 'diamond_block',
        campfire: 'campfire',
        stone: 'cobble',
        water: 'dirt',
        coal: 'coal',
        iron: 'iron_ore',
        gold: 'gold',
        diamond: 'diamond',
        plank: 'plank',
        table: 'table',
        tnt: 'tnt',
        gravel: 'gravel',
        clay: 'clay',
        sandstone: 'sandstone',
        stone_brick: 'stone_brick',
        brick: 'bricks',
        wool: 'wool',
        carpet: 'carpet'
    };

    function toolOf(id) {
        if (TOOLS[id]) return TOOLS[id];
        return TOOLS[toolRole(id)] || TOOLS.fist;
    }

    function mineSpeedOf(tool, kind) {
        if (tool.mine && tool.mine[kind] != null) return tool.mine[kind];
        if (kind === 'gravel' || kind === 'clay' || kind === 'snow_block') return tool.mine.sand || 0.4;
        if (kind === 'sandstone' || kind === 'stone_brick' || kind === 'brick' || kind === 'quartz' || kind === 'quartz_block'
            || kind === 'coal_block' || kind === 'iron_block' || kind === 'gold_block' || kind === 'diamond_block') {
            return tool.mine.stone || 0.2;
        }
        if (kind === 'ice' || kind === 'packed_ice') return tool.mine.glass || tool.mine.stone || 0.2;
        if (kind === 'wool' || kind === 'carpet' || kind === 'hay') return tool.mine.leaf || 0.4;
        return 0.25;
    }

    function breakMs(toolId, kind) {
        const base = BASE_BREAK_MS[kind] || 800;
        const tool = toolOf(toolId);
        const speed = mineSpeedOf(tool, kind);
        return Math.max(120, Math.round(base / speed));
    }

    function meleeScale(toolId) {
        return toolOf(toolId).melee;
    }

    function extraDrop(kind, x, y, z) {
        if (kind !== 'leaf') return null;
        const n = Math.abs((Number(x) || 0) * 3 + (Number(y) || 0) * 5 + (Number(z) || 0) * 7);
        return n % 6 === 0 ? 'apple' : null;
    }

    function dropOf(kind) {
        return DROPS[kind] || kind;
    }

    function lookDir(yaw, pitch) {
        const cp = Math.cos(pitch || 0);
        return {
            x: -Math.sin(yaw) * cp,
            y: Math.sin(pitch || 0),
            z: -Math.cos(yaw) * cp
        };
    }

    function voxelRay(origin, dir, maxDist, sample) {
        const step = 0.08;
        const max = Number(maxDist) || 6;
        let t = 0;
        let last = { x: null, y: null, z: null };
        let prev = null;
        while (t <= max) {
            const x = Math.floor(origin.x + dir.x * t);
            const y = Math.floor(origin.y + dir.y * t);
            const z = Math.floor(origin.z + dir.z * t);
            if (x !== last.x || y !== last.y || z !== last.z) {
                const kind = sample(x, y, z);
                if (kind) return { hit: true, x: x, y: y, z: z, kind: kind, dist: t, prev: prev };
                prev = { x: x, y: y, z: z };
                last = { x: x, y: y, z: z };
            }
            t += step;
        }
        return { hit: false, prev: last };
    }

    const PLACE_OF = {
        dirt: 'dirt', cobble: 'stone', 'oak-log': 'log', plank: 'plank', table: 'table',
        sand: 'sand', glass: 'glass', tnt: 'tnt', gravel: 'gravel', clay: 'clay',
        sandstone: 'sandstone', stone_brick: 'stone_brick', bricks: 'brick', brick: 'brick',
        wool: 'wool', carpet: 'carpet', stone: 'stone',
        slab: 'slab', stairs: 'stairs', trapdoor: 'trapdoor',
        pressure_plate: 'pressure_plate', button: 'button', fence_gate: 'fence_gate',
        sign: 'sign', painting: 'painting', flower_pot: 'flower_pot', campfire: 'campfire',
        coal_block: 'coal_block', iron_block: 'iron_block', gold_block: 'gold_block',
        diamond_block: 'diamond_block', snow_block: 'snow_block', ice: 'ice',
        packed_ice: 'packed_ice', quartz_block: 'quartz_block', hay: 'hay',
        chest: 'chest', furnace: 'furnace', torch: 'torch', bed: 'bed',
        door: 'door', ladder: 'ladder', fence: 'fence', boat: 'boat', lantern: 'lantern'
    };

    function placeKindOf(loot) {
        return PLACE_OF[loot] || null;
    }

    function lootOfPlace(kind) {
        if (kind === 'dirt' || kind === 'grass') return 'dirt';
        if (kind === 'stone') return 'cobble';
        if (kind === 'log') return 'oak-log';
        if (kind === 'plank') return 'plank';
        if (kind === 'table') return 'table';
        if (kind === 'sand') return 'sand';
        if (kind === 'glass') return 'glass';
        if (kind === 'tnt') return 'tnt';
        if (kind === 'gravel') return 'gravel';
        if (kind === 'clay') return 'clay';
        if (kind === 'sandstone') return 'sandstone';
        if (kind === 'stone_brick') return 'stone_brick';
        if (kind === 'brick') return 'bricks';
        if (kind === 'wool') return 'wool';
        if (kind === 'carpet') return 'carpet';
        if (PLACE_OF[kind]) return kind === 'stone' ? 'cobble' : kind;
        return null;
    }

    global.BlockLegendTools = {
        SLOT_IDS: SLOT_IDS,
        TOOLS: TOOLS,
        BASE_BREAK_MS: BASE_BREAK_MS,
        toolOf: toolOf,
        breakMs: breakMs,
        meleeScale: meleeScale,
        dropOf: dropOf,
        extraDrop: extraDrop,
        lookDir: lookDir,
        voxelRay: voxelRay,
        placeKindOf: placeKindOf,
        lootOfPlace: lootOfPlace,
        DEFAULT_HOTBAR: DEFAULT_HOTBAR,
        START_BAG: START_BAG,
        FOOD: FOOD,
        emptyHotbar: emptyHotbar,
        normalizeHotbar: normalizeHotbar,
        assignHotbar: assignHotbar,
        swapHotbar: swapHotbar,
        isHotTool: isHotTool,
        isLegacyLoadout: isLegacyLoadout,
        toolRole: toolRole,
        eatHeal: eatHeal,
        applyEat: applyEat
    };
}(typeof window !== 'undefined' ? window : globalThis));
