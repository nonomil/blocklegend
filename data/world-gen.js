/**
 * blocklegend · 世界生成 + 体素查询（纯数据层，node 可单测）
 * 自 engine.js 原样迁出（零逻辑改动）。段A 世界生成 + 段B 体素查询，
 * 二者双向耦合故合并；段C 块外观/合批留在 engine.js。
 */
(function (global) {
    'use strict';

    /* ---------- 本文件自声明常量（值与原 engine.js 顶层相同） ---------- */
    const WORLD_SIZE = 512;     // 世界边长（格）→ 32×32 区块
    const HEIGHT_MAX = 48;
    const STEP_UP = 1.05;       // 跨 1 格台阶（wanderBlocked 用到）
    const TREE_COUNT = 96;
    const FLOWER_COUNT = 160;
    const BIOME_NAMES = ['plains', 'forest', 'desert', 'mountain', 'snow'];
    /* ridge = 脊谷噪声振幅(格):snow/volcano/quarry 山系 20,forest/cherry 丘陵 6,plains/ocean 3 */
    const CLIMATES = {
        plains: { temp: 0.55, moist: 0.42, hMin: 3, hMax: 11, ridge: 3, trees: 110, flowers: 160, oak: 0.5, birch: 0.28, spruce: 0.22, sky: 0x7ec8f0 },
        forest: { temp: 0.48, moist: 0.78, hMin: 3, hMax: 11, ridge: 6, trees: 210, flowers: 70, oak: 0.32, birch: 0.22, spruce: 0.46, sky: 0x6aa87a },
        quarry: { temp: 0.42, moist: 0.22, hMin: 5, hMax: 16, ridge: 20, trees: 32, flowers: 28, oak: 0.18, birch: 0.12, spruce: 0.7, sky: 0x9aa4b0 },
        duskvale: { temp: 0.5, moist: 0.58, hMin: 2, hMax: 8, ridge: 4, trees: 72, flowers: 200, oak: 0.4, birch: 0.42, spruce: 0.18, sky: 0xc48a6a },
        crystal: { temp: 0.34, moist: 0.7, hMin: 4, hMax: 13, ridge: 6, trees: 170, flowers: 40, oak: 0.08, birch: 0.14, spruce: 0.78, sky: 0x7aa8c8 },
        astral: { temp: 0.16, moist: 0.38, hMin: 6, hMax: 16, ridge: 10, trees: 48, flowers: 16, oak: 0, birch: 0.12, spruce: 0.88, sky: 0xc8d4e8 },
        cherry: { temp: 0.52, moist: 0.72, hMin: 3, hMax: 10, ridge: 6, trees: 200, flowers: 180, oak: 0.1, birch: 0.1, spruce: 0.1, sky: 0xf3c2d4 },
        desert: { temp: 0.86, moist: 0.12, hMin: 3, hMax: 8, ridge: 4, trees: 24, flowers: 8, oak: 0, birch: 0, spruce: 0, sky: 0xe8d08a },
        nether: { temp: 0.92, moist: 0.08, hMin: 4, hMax: 12, ridge: 6, trees: 40, flowers: 0, oak: 0, birch: 0, spruce: 1, sky: 0x5a1814 },
        snow: { temp: 0.12, moist: 0.36, hMin: 4, hMax: 14, ridge: 20, trees: 64, flowers: 8, oak: 0, birch: 0.2, spruce: 0.8, sky: 0xc8d8e8 },
        ocean: { temp: 0.46, moist: 0.92, hMin: 1, hMax: 6, ridge: 3, trees: 8, flowers: 12, oak: 0.4, birch: 0.4, spruce: 0.2, sky: 0x4aa0c8 },
        mushroom: { temp: 0.5, moist: 0.7, hMin: 3, hMax: 9, ridge: 4, trees: 90, flowers: 40, oak: 0.2, birch: 0.2, spruce: 0.6, sky: 0xc8a0d0 },
        volcano: { temp: 0.9, moist: 0.1, hMin: 5, hMax: 16, ridge: 20, trees: 16, flowers: 0, oak: 0, birch: 0, spruce: 1, sky: 0x6a2018 },
        deep_dark: { temp: 0.22, moist: 0.55, hMin: 2, hMax: 8, ridge: 3, trees: 20, flowers: 4, oak: 0, birch: 0, spruce: 1, sky: 0x0d1f2b },
        end: { temp: 0.28, moist: 0.2, hMin: 6, hMax: 14, ridge: 10, trees: 12, flowers: 0, oak: 0, birch: 0.1, spruce: 0.9, sky: 0x1a1028 }
    };

    /* ================= 段A：世界生成 ================= */
    /* ---------- 确定性随机 ---------- */
    function makeRng(seed) {
        let s = (seed >>> 0) || 1;
        return function () {
            s ^= s << 13; s >>>= 0;
            s ^= s >> 17;
            s ^= s << 5; s >>>= 0;
            return s / 4294967296;
        };
    }
    function hash3(x, y, z) {
        let h = (x * 374761393 + y * 668265263 + z * 2147483647) >>> 0;
        h = (h ^ (h >> 13)) * 1274126177;
        return ((h ^ (h >> 16)) >>> 0) / 4294967296;
    }

    function climateOf(name) {
        return CLIMATES[name] || CLIMATES.plains;
    }

    function makeGrid(rng, coarse) {
        const grid = [];
        for (let i = 0; i <= coarse; i += 1) {
            grid.push([]);
            for (let j = 0; j <= coarse; j += 1) grid[i].push(rng());
        }
        return grid;
    }

    function sampleGrid(grid, coarse, n, x, z) {
        const smooth = function (t) { return t * t * (3 - 2 * t); };
        const fx = x / n * coarse, fz = z / n * coarse;
        const x0 = Math.min(coarse - 1, Math.floor(fx)), z0 = Math.min(coarse - 1, Math.floor(fz));
        const tx = smooth(fx - x0), tz = smooth(fz - z0);
        const a = grid[z0][x0] * (1 - tx) + grid[z0][x0 + 1] * tx;
        const b = grid[z0 + 1][x0] * (1 - tx) + grid[z0 + 1][x0 + 1] * tx;
        return a * (1 - tz) + b * tz;
    }

    function ridgeSigned(rv) {
        const fold = 1 - Math.abs(Number(rv) * 2 - 1);
        return fold * 2 - 1;
    }

    function pickBiome(temp, moist, height01) {
        if (temp < 0.28) return 4;
        if (temp > 0.74 && moist < 0.38) return 2;
        if (height01 > 0.72 || (moist < 0.3 && temp < 0.55)) return 3;
        if (moist > 0.62) return 1;
        return 0;
    }

    function biomeAt(world, x, z) {
        if (!world || x < 0 || z < 0 || x >= world.size || z >= world.size) return 'plains';
        if (!world.biomes) return world.climate || 'plains';
        return BIOME_NAMES[world.biomes[z * world.size + x]] || 'plains';
    }

    /* ---------- 世界生成（纯数据，node 可测） ---------- */
    function inRect(x, z, box) {
        return !!(box && x >= box.x0 && x <= box.x1 && z >= box.z0 && z <= box.z1);
    }

    function inAnyRect(x, z, boxes) {
        if (!boxes) return false;
        const list = Array.isArray(boxes) ? boxes : [boxes];
        for (let i = 0; i < list.length; i += 1) {
            if (inRect(x, z, list[i])) return true;
        }
        return false;
    }

    function villageStyle(climate) {
        if (climate === 'desert') return 'desert';
        if (climate === 'cherry') return 'cherry';
        if (climate === 'crystal') return 'crystal';
        if (climate === 'duskvale') return 'dusk';
        if (climate === 'snow') return 'snow';
        if (climate === 'mushroom') return 'mushroom';
        if (climate === 'deep_dark') return 'dusk';
        if (climate === 'quarry') return 'quarry';
        if (climate === 'astral') return 'crystal';
        if (climate === 'nether') return 'nether';
        if (climate === 'volcano') return 'volcano';
        if (climate === 'end') return 'end';
        return 'oak';
    }

    function villageMats(style) {
        if (style === 'desert') return { wall: 'sand', post: 'sand', roof: 'sand' };
        if (style === 'crystal') return { wall: 'stone', post: 'iron', roof: 'stone' };
        if (style === 'dusk') return { wall: 'stone', post: 'log', roof: 'plank' };
        if (style === 'cherry') return { wall: 'plank', post: 'log', roof: 'plank' };
        if (style === 'snow') return { wall: 'snow', post: 'log', roof: 'plank' };
        if (style === 'mushroom') return { wall: 'plank', post: 'log', roof: 'leaf' };
        if (style === 'quarry') return { wall: 'stone', post: 'stone', roof: 'plank' };
        if (style === 'nether') return { wall: 'stone', post: 'gold', roof: 'stone' };
        if (style === 'volcano') return { wall: 'stone', post: 'stone', roof: 'gold' };
        if (style === 'end') return { wall: 'stone', post: 'iron', roof: 'stone' };
        return { wall: 'plank', post: 'log', roof: 'plank' };
    }

    function villagePlan(climate, cx, cz) {
        if (climate === 'nether' || climate === 'volcano') {
            return {
                x0: cx - 28,
                z0: cz + 1,
                x1: cx - 8,
                z1: cz + 18,
                style: villageStyle(climate),
                houses: [
                    { x: cx - 26, z: cz + 3, w: 6, d: 6, role: 'bed', stories: 1 },
                    { x: cx - 18, z: cz + 3, w: 6, d: 6, role: 'trader', stories: 2 },
                    { x: cx - 26, z: cz + 11, w: 6, d: 6, role: 'word', stories: 2 }
                ],
                garden: { x: cx - 22, z: cz + 10, w: 3, d: 2 },
                golem: { x: cx - 16.5, z: cz + 9.5 }
            };
        }
        if (climate === 'desert') {
            return {
                x0: cx + 6,
                z0: cz + 1,
                x1: cx + 24,
                z1: cz + 18,
                style: 'desert',
                houses: [
                    { x: cx + 8, z: cz + 3, w: 6, d: 6, role: 'bed', stories: 1 },
                    { x: cx + 16, z: cz + 3, w: 6, d: 6, role: 'trader', stories: 2 },
                    { x: cx + 9, z: cz + 11, w: 6, d: 6, role: 'word', stories: 2 },
                    { x: cx + 17, z: cz + 12, w: 5, d: 5, role: 'bed', stories: 1 }
                ],
                garden: { x: cx + 8, z: cz + 16, w: 3, d: 2 },
                well: { x: cx + 14, z: cz + 8 },
                golem: { x: cx + 13.5, z: cz + 7.5 }
            };
        }
        return {
            x0: cx + 6,
            z0: cz + 1,
            x1: cx + 28,
            z1: cz + 22,
            style: villageStyle(climate),
            houses: [
                { x: cx + 8, z: cz + 3, w: 6, d: 6, role: 'bed', stories: 1 },
                { x: cx + 16, z: cz + 3, w: 6, d: 6, role: 'trader', stories: 2 },
                { x: cx + 8, z: cz + 12, w: 6, d: 6, role: 'word', stories: 2 },
                { x: cx + 16, z: cz + 12, w: 5, d: 5, role: 'bed', stories: 1 },
                { x: cx + 23, z: cz + 6, w: 5, d: 5, role: 'farm', stories: 1 }
            ],
            garden: { x: cx + 14, z: cz + 9, w: 4, d: 2 },
            well: { x: cx + 14, z: cz + 7 },
            pen: { x: cx + 20, z: cz + 16, w: 4, d: 3 },
            golem: { x: cx + 20.5, z: cz + 21.5 },
            snowgolem: climate === 'snow' ? { x: cx + 10.5, z: cz + 19.5 } : null
        };
    }

    function hamletPlans(climate, cx, cz, n) {
        const style = villageStyle(climate);
        const harsh = climate === 'nether' || climate === 'volcano' || climate === 'end';
        const layouts = harsh
            ? [
                { ox: -36, oz: 22, houses: [
                    { dx: 0, dz: 0, w: 5, d: 5, role: 'bed' },
                    { dx: 7, dz: 0, w: 5, d: 5, role: 'trader', stories: 2 }
                ], well: true },
                { ox: 32, oz: -28, houses: [
                    { dx: 0, dz: 0, w: 5, d: 5, role: 'word', stories: 2 },
                    { dx: 7, dz: 2, w: 5, d: 5, role: 'bed' }
                ] }
            ]
            : [
                { ox: -46, oz: 24, houses: [
                    { dx: 0, dz: 0, w: 5, d: 5, role: 'bed' },
                    { dx: 7, dz: 0, w: 5, d: 5, role: 'trader', stories: 2 },
                    { dx: 0, dz: 7, w: 5, d: 5, role: 'farm' }
                ], garden: true, well: true, pen: true },
                { ox: 40, oz: -40, houses: [
                    { dx: 0, dz: 0, w: 5, d: 5, role: 'word', stories: 2 },
                    { dx: 7, dz: 1, w: 5, d: 5, role: 'bed' }
                ], well: true },
                { ox: -70, oz: -52, houses: [
                    { dx: 0, dz: 0, w: 5, d: 5, role: 'bed' },
                    { dx: 7, dz: 0, w: 5, d: 5, role: 'bed' },
                    { dx: 3, dz: 7, w: 5, d: 5, role: 'trader', stories: 2 }
                ], garden: true },
                { ox: 64, oz: 48, houses: [
                    { dx: 0, dz: 0, w: 5, d: 5, role: 'word', stories: 2 },
                    { dx: 7, dz: 0, w: 5, d: 5, role: 'bed' },
                    { dx: 0, dz: 7, w: 5, d: 5, role: 'bed' }
                ], well: true },
                { ox: -56, oz: 62, houses: [
                    { dx: 0, dz: 0, w: 5, d: 5, role: 'bed' },
                    { dx: 7, dz: 4, w: 5, d: 5, role: 'trader', stories: 2 }
                ], garden: true, pen: true },
                { ox: 52, oz: 18, houses: [
                    { dx: 0, dz: 0, w: 5, d: 5, role: 'farm' },
                    { dx: 7, dz: 0, w: 5, d: 5, role: 'word', stories: 2 }
                ], garden: true, pen: true },
                { ox: -28, oz: -68, houses: [
                    { dx: 0, dz: 0, w: 5, d: 5, role: 'bed' },
                    { dx: 7, dz: 2, w: 5, d: 5, role: 'bed' },
                    { dx: 14, dz: 0, w: 5, d: 5, role: 'trader', stories: 2 }
                ], garden: true, well: true, pen: true }
            ];
        const out = [];
        layouts.forEach(function (layout) {
            const houses = [];
            layout.houses.forEach(function (spec) {
                const x = cx + layout.ox + spec.dx;
                const z = cz + layout.oz + spec.dz;
                if (x < 6 || z < 6 || x + spec.w >= n - 4 || z + spec.d >= n - 4) return;
                houses.push({
                    x: x, z: z, w: spec.w, d: spec.d,
                    role: spec.role || 'bed',
                    stories: spec.stories || 1
                });
            });
            if (!houses.length) return;
            let x0 = houses[0].x - 1, z0 = houses[0].z - 1;
            let x1 = houses[0].x + houses[0].w + 1, z1 = houses[0].z + houses[0].d + 1;
            houses.forEach(function (h) {
                x0 = Math.min(x0, h.x - 1);
                z0 = Math.min(z0, h.z - 1);
                x1 = Math.max(x1, h.x + h.w + 1);
                z1 = Math.max(z1, h.z + h.d + 1);
            });
            const first = houses[0];
            const plan = {
                x0: x0, z0: z0, x1: x1, z1: z1, style: style, houses: houses,
                golem: { x: first.x + first.w + 1.5, z: first.z + first.d * 0.5 }
            };
            if (layout.garden) {
                plan.garden = { x: first.x + 1, z: Math.min(n - 6, first.z + first.d + 1), w: 3, d: 2 };
            }
            if (layout.well) {
                plan.well = { x: first.x - 2, z: first.z + 2 };
            }
            if (layout.pen) {
                let px = first.x - 5;
                let pz = first.z + first.d + 1;
                if (px < 6) px = first.x + first.w + 1;
                if (pz + 3 >= n - 4) pz = Math.max(6, first.z - 4);
                plan.pen = { x: px, z: pz, w: 4, d: 3 };
            }
            if (plan.garden) {
                x0 = Math.min(x0, plan.garden.x - 1);
                z0 = Math.min(z0, plan.garden.z - 1);
                x1 = Math.max(x1, plan.garden.x + plan.garden.w + 1);
                z1 = Math.max(z1, plan.garden.z + plan.garden.d + 1);
                plan.x0 = x0; plan.z0 = z0; plan.x1 = x1; plan.z1 = z1;
            }
            if (plan.well) {
                x0 = Math.min(x0, plan.well.x - 2);
                z0 = Math.min(z0, plan.well.z - 2);
                x1 = Math.max(x1, plan.well.x + 2);
                z1 = Math.max(z1, plan.well.z + 2);
                plan.x0 = x0; plan.z0 = z0; plan.x1 = x1; plan.z1 = z1;
            }
            if (plan.pen) {
                x0 = Math.min(x0, plan.pen.x - 1);
                z0 = Math.min(z0, plan.pen.z - 1);
                x1 = Math.max(x1, plan.pen.x + plan.pen.w + 1);
                z1 = Math.max(z1, plan.pen.z + plan.pen.d + 1);
                plan.x0 = x0; plan.z0 = z0; plan.x1 = x1; plan.z1 = z1;
            }
            out.push(plan);
        });
        return out;
    }

    function fillPond(ponds, n, px, pz, r, towns, cx, cz) {
        if (Math.abs(px - cx) < 6 && Math.abs(pz - cz) < 6) return;
        for (let dz = -r; dz <= r; dz += 1) {
            for (let dx = -r; dx <= r; dx += 1) {
                if (dx * dx + dz * dz > r * r) continue;
                const x = px + dx, z = pz + dz;
                if (x < 2 || z < 2 || x >= n - 2 || z >= n - 2) continue;
                if (inAnyRect(x, z, towns)) continue;
                ponds[x + ',' + z] = 1;
            }
        }
    }

    function stampRiver(n, ponds, heights, climate, cx, cz, towns) {
        if (climate === 'desert' || climate === 'nether' || climate === 'volcano' || climate === 'end') return;
        const span = n / 256;
        let x = Math.max(6, cx - Math.round(52 * span));
        let z = Math.max(6, cz - 10);
        const endX = Math.min(n - 7, cx + Math.round(48 * span));
        const endZ = Math.min(n - 7, cz + Math.round(64 * span));
        for (let i = 0; i < Math.round(160 * span); i += 1) {
            if (!(Math.abs(x - cx) < 6 && Math.abs(z - cz) < 6) && !inAnyRect(x, z, towns)) {
                fillPond(ponds, n, x, z, i % 8 === 0 ? 2 : 1, towns, cx, cz);
                if (x >= 1 && z >= 1 && x < n - 1 && z < n - 1) {
                    heights[z * n + x] = Math.max(2, heights[z * n + x] - 1);
                }
            }
            if (x === endX && z === endZ) break;
            if (x !== endX) x += x < endX ? 1 : -1;
            if (i % 2 === 0 && z !== endZ) z += z < endZ ? 1 : -1;
            if (i % 5 === 0) z = Math.max(4, Math.min(n - 5, z + ((i % 10) < 5 ? 1 : -1)));
        }
    }

    function stampRidge(n, heights, biomes, cx, cz) {
        const z0 = Math.max(8, cz - 70);
        for (let z = z0; z < z0 + 18 && z < n - 4; z += 1) {
            for (let x = 16; x < n - 16; x += 1) {
                if (Math.abs(x - cx) < 8) continue;
                const d = Math.abs(z - (z0 + 8));
                if (d > 8) continue;
                biomes[z * n + x] = 3;
                heights[z * n + x] = Math.min(HEIGHT_MAX, heights[z * n + x] + 5 - Math.floor(d / 2));
            }
        }
    }

    function stampPonds(n, ponds, rng, climate, cx, cz, village) {
        if (climate === 'nether') return;
        if (climate === 'desert') {
            fillPond(ponds, n, cx - 18, cz + 12, 4, village, cx, cz);
            fillPond(ponds, n, cx - 12, cz + 18, 3, village, cx, cz);
            return;
        }
        if (climate !== 'astral' && climate !== 'quarry') {
            fillPond(ponds, n, cx - 14, cz + 6, 3, village, cx, cz);
            fillPond(ponds, n, cx - 7, cz - 11, 2, village, cx, cz);
        }
        if (climate === 'duskvale' || climate === 'plains') {
            fillPond(ponds, n, cx + 4, cz - 16, 3, village, cx, cz);
        }
        if (climate !== 'astral' && climate !== 'quarry') {
            let x = cx - 14, z = cz + 6;
            const endX = cx - 7, endZ = cz - 11;
            for (let i = 0; i < 48; i += 1) {
                fillPond(ponds, n, x, z, 1, village, cx, cz);
                if (x === endX && z === endZ) break;
                if (x !== endX) x += x < endX ? 1 : -1;
                else z += z < endZ ? 1 : -1;
            }
        }
        const extra = climate === 'ocean' ? 14
            : climate === 'duskvale' ? 10
                : climate === 'plains' ? 7
                    : climate === 'forest' || climate === 'mushroom' ? 5
                        : 0;
        for (let i = 0; i < extra; i += 1) {
            const px = 8 + Math.floor(rng() * (n - 16));
            const pz = 8 + Math.floor(rng() * (n - 16));
            const r = 2 + Math.floor(rng() * 3);
            fillPond(ponds, n, px, pz, r, village, cx, cz);
        }
    }

    function stampVillage(n, heights, edits, ponds, plan) {
        if (!plan) return;
        plan.beds = [];
        plan.villagers = [];
        plan.crops = [];
        plan.animals = [];
        plan.paths = plan.paths || {};
        plan.props = plan.props || [];
        const mats = villageMats(plan.style);
        const wall = mats.wall;
        const post = mats.post;
        const roof = mats.roof;
        plan.houses.forEach(function (house) {
            let y0 = 99;
            for (let z = house.z; z < house.z + house.d; z += 1) {
                for (let x = house.x; x < house.x + house.w; x += 1) {
                    if (x < 1 || z < 1 || x >= n - 1 || z >= n - 1) continue;
                    y0 = Math.min(y0, heights[z * n + x]);
                }
            }
            y0 = Math.max(2, y0);
            house.y0 = y0;
            const barn = house.role === 'farm';
            const stories = house.stories || (house.role === 'trader' || house.role === 'word' ? 2 : 1);
            const wallH = Math.min(stories === 2 ? 6 : 4, HEIGHT_MAX - y0 - 2);
            const doorX = house.x + Math.floor(house.w / 2);
            const doorZ = house.z + house.d - 1;
            const winZ = house.z + 1;
            const midZ = house.z + Math.floor(house.d / 2);
            for (let z = house.z; z < house.z + house.d; z += 1) {
                for (let x = house.x; x < house.x + house.w; x += 1) {
                    if (x < 1 || z < 1 || x >= n - 1 || z >= n - 1) continue;
                    heights[z * n + x] = y0;
                    const edgeX = x === house.x || x === house.x + house.w - 1;
                    const edgeZ = z === house.z || z === house.z + house.d - 1;
                    const door = barn
                        ? (z === doorZ && Math.abs(x - doorX) <= 1)
                        : (x === doorX && z === doorZ);
                    const lowWin = ((edgeX && (z === winZ || z === midZ)) || (edgeZ && x === house.x + 1)) && !door;
                    const highWin = stories === 2 && edgeX && z === winZ && !door;
                    for (let dy = 0; dy < wallH; dy += 1) {
                        if (!(edgeX || edgeZ)) {
                            if (stories === 2 && dy === 3) edits[x + ',' + (y0 + dy) + ',' + z] = wall;
                            continue;
                        }
                        if (door && dy < (barn ? 3 : 2)) continue;
                        if (lowWin && dy === 1) continue;
                        if (highWin && dy === 4) continue;
                        edits[x + ',' + (y0 + dy) + ',' + z] = (edgeX && edgeZ) ? post : wall;
                    }
                    edits[x + ',' + (y0 + wallH) + ',' + z] = roof;
                    if (!edgeX && z === midZ) {
                        edits[x + ',' + (y0 + wallH + 1) + ',' + z] = post;
                    }
                }
            }
            if (!barn && house.role !== 'word') {
                const chimX = house.x + house.w - 1, chimZ = house.z;
                for (let cy = wallH; cy <= wallH + 2; cy += 1) {
                    edits[chimX + ',' + (y0 + cy) + ',' + chimZ] = 'stone';
                }
            }
            if (house.role === 'word') {
                edits[doorX + ',' + (y0 + 2) + ',' + doorZ] = 'gold';
                edits[doorX + ',' + (y0 + 3) + ',' + doorZ] = 'gold';
                edits[(house.x + 1) + ',' + (y0 + 4) + ',' + house.z] = 'gold';
            } else if (house.role === 'trader') {
                edits[doorX + ',' + (y0 + 2) + ',' + doorZ] = 'iron';
                const porchZ = doorZ + 1;
                if (porchZ < n - 1) {
                    edits[(doorX - 1) + ',' + y0 + ',' + porchZ] = post;
                    edits[(doorX + 1) + ',' + y0 + ',' + porchZ] = post;
                    edits[(doorX - 1) + ',' + (y0 + 1) + ',' + porchZ] = post;
                    edits[(doorX + 1) + ',' + (y0 + 1) + ',' + porchZ] = post;
                    edits[(doorX - 1) + ',' + (y0 + 2) + ',' + porchZ] = roof;
                    edits[doorX + ',' + (y0 + 2) + ',' + porchZ] = roof;
                    edits[(doorX + 1) + ',' + (y0 + 2) + ',' + porchZ] = roof;
                }
            } else if (barn) {
                edits[doorX + ',' + (y0 + 3) + ',' + doorZ] = 'plank';
                edits[(house.x + 2) + ',' + (y0 + wallH + 1) + ',' + midZ] = 'plank';
            }
            const bedX = house.x + 1, bedZ = house.z + 1;
            const chestX = house.x + house.w - 2, chestZ = house.z + 1;
            const tableX = house.x + 2, tableZ = house.z + 2;
            const chairX = house.x + 1, chairZ = house.z + 3;
            const workX = house.x + house.w - 2, workZ = house.z + 2;
            if (!barn) plan.beds.push({ x: bedX, z: bedZ, y: y0, role: house.role || 'bed' });
            plan.props.push({ kind: 'chest', x: chestX, z: chestZ, y: y0 });
            plan.props.push({ kind: 'torch', x: doorX, z: house.z + 2, y: y0 + 2 });
            if (house.role === 'trader' || house.role === 'word') {
                edits[workX + ',' + y0 + ',' + (house.z + 3)] = 'table';
            }
            if (house.role === 'trader') {
                plan.props.push({ kind: 'furnace', x: workX, z: workZ, y: y0 });
                plan.props.push({ kind: 'table', x: tableX, z: tableZ, y: y0 });
                plan.props.push({ kind: 'chair', x: chairX, z: chairZ, y: y0 });
            } else if (house.role === 'word') {
                plan.props.push({ kind: 'bookshelf', x: workX, z: workZ, y: y0 });
                plan.props.push({ kind: 'table', x: tableX, z: tableZ, y: y0 });
                plan.props.push({ kind: 'chair', x: chairX, z: chairZ, y: y0 });
            } else if (barn) {
                plan.props.push({ kind: 'chair', x: chairX, z: chairZ, y: y0 });
                edits[bedX + ',' + y0 + ',' + bedZ] = 'plank';
                plan.crops.push({
                    x: tableX,
                    z: house.z + 1,
                    y: y0,
                    kind: plan.style === 'desert' ? 'deadbush' : 'wheat'
                });
            } else {
                plan.props.push({ kind: 'table', x: tableX, z: tableZ, y: y0 });
                plan.props.push({ kind: 'chair', x: chairX, z: chairZ, y: y0 });
            }
            plan.villagers.push({
                x: doorX + 0.5,
                z: doorZ + 1.35,
                homeX: doorX + 0.5,
                homeZ: doorZ + 1.35,
                yaw: 0,
                phase: hash3(doorX, 1, doorZ),
                role: house.role === 'trader' ? 'trader'
                    : house.role === 'word' ? 'teacher'
                        : house.role === 'farm' ? 'farmer'
                            : 'villager'
            });
        });
        function stampPath(sx, sz, ex, ez) {
            let x = sx, z = sz;
            for (let i = 0; i < 48; i += 1) {
                if (x >= 1 && z >= 1 && x < n - 1 && z < n - 1) {
                    const y = heights[z * n + x];
                    edits[x + ',' + (y - 1) + ',' + z] = plan.style === 'desert' ? 'sand' : 'dirt';
                    plan.paths[x + ',' + z] = 1;
                }
                if (x === ex && z === ez) break;
                if (x !== ex) x += x < ex ? 1 : -1;
                else z += z < ez ? 1 : -1;
            }
        }
        if (plan.houses.length >= 2) {
            const a = plan.houses[0];
            for (let hi = 1; hi < plan.houses.length; hi += 1) {
                const b = plan.houses[hi];
                stampPath(a.x + Math.floor(a.w / 2), a.z + a.d, b.x + Math.floor(b.w / 2), b.z + Math.floor(b.d / 2));
            }
        }
        if (plan.well && plan.houses.length) {
            const a = plan.houses[0];
            stampPath(a.x + Math.floor(a.w / 2), a.z + a.d, plan.well.x, plan.well.z);
        }
        plan.houses.forEach(function (h) {
            plan.paths[(h.x + Math.floor(h.w / 2)) + ',' + (h.z + h.d)] = 1;
        });
        if (plan.garden) {
            const g = plan.garden;
            for (let z = g.z - 1; z <= g.z + g.d; z += 1) {
                for (let x = g.x - 1; x <= g.x + g.w; x += 1) {
                    if (x < 1 || z < 1 || x >= n - 1 || z >= n - 1) continue;
                    const edge = x === g.x - 1 || x === g.x + g.w || z === g.z - 1 || z === g.z + g.d;
                    const y = heights[z * n + x];
                    if (edge) {
                        edits[x + ',' + y + ',' + z] = post;
                        continue;
                    }
                    if (x < g.x || z < g.z || x >= g.x + g.w || z >= g.z + g.d) continue;
                    edits[x + ',' + (y - 1) + ',' + z] = 'dirt';
                    plan.crops.push({
                        x: x,
                        z: z,
                        y: y,
                        kind: plan.style === 'desert' ? 'deadbush' : 'wheat'
                    });
                }
            }
        }
        if (plan.well) {
            const wx = plan.well.x, wz = plan.well.z;
            let y0 = 99;
            for (let dz = -1; dz <= 1; dz += 1) {
                for (let dx = -1; dx <= 1; dx += 1) {
                    const x = wx + dx, z = wz + dz;
                    if (x < 1 || z < 1 || x >= n - 1 || z >= n - 1) continue;
                    y0 = Math.min(y0, heights[z * n + x]);
                }
            }
            y0 = Math.max(2, y0);
            for (let dz = -1; dz <= 1; dz += 1) {
                for (let dx = -1; dx <= 1; dx += 1) {
                    const x = wx + dx, z = wz + dz;
                    if (x < 1 || z < 1 || x >= n - 1 || z >= n - 1) continue;
                    heights[z * n + x] = y0;
                    if (dx === 0 && dz === 0) {
                        const dry = plan.style === 'nether' || plan.style === 'volcano' || plan.style === 'end';
                        if (dry) edits[x + ',' + y0 + ',' + z] = 'gold';
                        else ponds[x + ',' + z] = 1;
                    } else {
                        edits[x + ',' + y0 + ',' + z] = 'stone';
                    }
                }
            }
            edits[(wx - 1) + ',' + (y0 + 1) + ',' + (wz - 1)] = post;
            edits[(wx + 1) + ',' + (y0 + 1) + ',' + (wz - 1)] = post;
            edits[(wx - 1) + ',' + (y0 + 2) + ',' + (wz - 1)] = post;
            edits[(wx + 1) + ',' + (y0 + 2) + ',' + (wz - 1)] = post;
            edits[(wx - 1) + ',' + (y0 + 3) + ',' + (wz - 1)] = wall;
            edits[wx + ',' + (y0 + 3) + ',' + (wz - 1)] = wall;
            edits[(wx + 1) + ',' + (y0 + 3) + ',' + (wz - 1)] = wall;
            edits[(wx - 1) + ',' + (y0 + 3) + ',' + (wz + 1)] = wall;
            edits[wx + ',' + (y0 + 3) + ',' + (wz + 1)] = wall;
            edits[(wx + 1) + ',' + (y0 + 3) + ',' + (wz + 1)] = wall;
            const lampX = wx + 2, lampZ = wz;
            if (lampX >= 1 && lampZ >= 1 && lampX < n - 1 && lampZ < n - 1) {
                edits[lampX + ',' + y0 + ',' + lampZ] = post;
                edits[lampX + ',' + (y0 + 1) + ',' + lampZ] = post;
                plan.props.push({ kind: 'torch', x: lampX, z: lampZ, y: y0 + 2 });
            }
        }
        if (plan.pen) {
            const p = plan.pen;
            const stock = plan.style === 'desert' ? ['sheep', 'cow'] : ['pig', 'cow', 'sheep'];
            for (let z = p.z - 1; z <= p.z + p.d; z += 1) {
                for (let x = p.x - 1; x <= p.x + p.w; x += 1) {
                    if (x < 1 || z < 1 || x >= n - 1 || z >= n - 1) continue;
                    const edge = x === p.x - 1 || x === p.x + p.w || z === p.z - 1 || z === p.z + p.d;
                    const y = heights[z * n + x];
                    if (edge) {
                        const gate = z === p.z + p.d && x === p.x + Math.floor(p.w / 2);
                        if (!gate) edits[x + ',' + y + ',' + z] = post;
                        continue;
                    }
                    if (x < p.x || z < p.z || x >= p.x + p.w || z >= p.z + p.d) continue;
                    edits[x + ',' + (y - 1) + ',' + z] = plan.style === 'desert' ? 'sand' : 'dirt';
                }
            }
            for (let i = 0; i < 2; i += 1) {
                const kind = stock[i % stock.length];
                const ax = p.x + 1 + i + 0.5;
                const az = p.z + 1.5;
                plan.animals.push({
                    x: ax,
                    z: az,
                    kind: kind,
                    habitat: 'ground',
                    homeX: ax,
                    homeZ: az,
                    yaw: hash3(ax, 2, az) * Math.PI * 2,
                    phase: hash3(ax, 3, az),
                    pen: true
                });
            }
        }
    }

    function yAt(heights, n, x, z) {
        if (x < 0 || z < 0 || x >= n || z >= n) return 3;
        return Math.max(2, heights[z * n + x] || 3);
    }

    function setY(heights, n, x, z, h) {
        if (x < 1 || z < 1 || x >= n - 1 || z >= n - 1) return;
        heights[z * n + x] = Math.max(2, Math.min(HEIGHT_MAX, h));
    }

    function putBlock(edits, x, y, z, kind) {
        if (x < 1 || z < 1 || y < 1 || y > HEIGHT_MAX + 16) return;
        edits[x + ',' + y + ',' + z] = kind;
    }

    function flattenPad(heights, n, x, z, w, d) {
        let y0 = 99;
        for (let iz = z; iz < z + d; iz += 1) {
            for (let ix = x; ix < x + w; ix += 1) y0 = Math.min(y0, yAt(heights, n, ix, iz));
        }
        y0 = Math.max(2, y0);
        for (let iz = z; iz < z + d; iz += 1) {
            for (let ix = x; ix < x + w; ix += 1) setY(heights, n, ix, iz, y0);
        }
        return y0;
    }

    function defaultHubPortalSpecs(cx, cz) {
        const spots = (global.BlockLegendLevels && global.BlockLegendLevels.HUB_SPOTS) || [];
        const list = spots.length ? spots : (function () {
            const out = [];
            for (let i = 0; i < 12; i += 1) {
                const a = -Math.PI / 2 + i * (Math.PI / 6);
                out.push({ dx: Math.round(Math.cos(a) * 140), dz: Math.round(Math.sin(a) * 140) });
            }
            return out;
        }());
        return list.map(function (spot, i) {
            return {
                level: i + 1,
                climate: 'plains',
                title: String(i + 1),
                state: i === 0 ? 'open' : 'locked',
                x: cx + spot.dx,
                z: cz + spot.dz,
                frame: i === 0 ? 'leaf' : 'gold',
                wall: 'plank',
                roof: 'leaf',
                shape: 'house',
                mark: String(i + 1)
            };
        });
    }

    function levelPortalBoxes(portals) {
        return (portals || []).map(function (p) {
            const x = Math.round((p.x || 0) - 1.5);
            const z = Math.round((p.z || 0) - 0.5);
            return { x0: x - 8, z0: z - 10, x1: x + 10, z1: z + 5 };
        });
    }

    function hubKeepoutBoxes(cx, cz, portals) {
        const boxes = levelPortalBoxes(portals);
        boxes.push({ x0: cx - 3, z0: cz - 8, x1: cx + 3, z1: cz + 1 });
        return boxes;
    }

    function paveTop(heights, n, edits, x, z, kind) {
        if (x < 1 || z < 1 || x >= n - 1 || z >= n - 1) return;
        const h = yAt(heights, n, x, z);
        putBlock(edits, x, h - 1, z, kind || 'dirt');
    }

    function hubLineCells(x0, z0, x1, z1) {
        const out = [];
        let x = Math.round(x0), z = Math.round(z0);
        const tx = Math.round(x1), tz = Math.round(z1);
        const dx = Math.abs(tx - x), dz = Math.abs(tz - z);
        const sx = x < tx ? 1 : -1, sz = z < tz ? 1 : -1;
        let err = dx - dz;
        while (true) {
            out.push({ x: x, z: z });
            if (x === tx && z === tz) break;
            const e2 = err * 2;
            if (e2 > -dz) { err -= dz; x += sx; }
            if (e2 < dx) { err += dx; z += sz; }
        }
        return out;
    }

    function stampHubRoad(n, heights, edits, cx, cz, specs) {
        const ox = cx;
        const oz = cz - 2;
        (specs || []).forEach(function (p) {
            const cells = hubLineCells(ox, oz, Math.round(p.x || 0) + 1, Math.round(p.z || 0) + 3);
            cells.forEach(function (c) {
                for (let dz = -1; dz <= 1; dz += 1) {
                    for (let dx = -1; dx <= 1; dx += 1) {
                        paveTop(heights, n, edits, c.x + dx, c.z + dz, 'dirt');
                    }
                }
            });
        });
    }

    const HUB_GLYPHS = {
        '1': ['.#.', '##.', '.#.', '.#.', '###'],
        '2': ['###', '..#', '###', '#..', '###'],
        '3': ['###', '..#', '###', '..#', '###'],
        '4': ['#.#', '#.#', '###', '..#', '..#'],
        '5': ['###', '#..', '###', '..#', '###'],
        '6': ['###', '#..', '###', '#.#', '###'],
        '7': ['###', '..#', '..#', '..#', '..#'],
        '8': ['###', '#.#', '###', '#.#', '###'],
        '9': ['###', '#.#', '###', '..#', '###'],
        '0': ['.#.', '#.#', '#.#', '#.#', '.#.']
    };

    function stampHubLetters(edits, spec, x, z, y0) {
        const kind = spec.state === 'locked' ? 'gold' : 'leaf';
        const text = String(spec.mark || spec.level || '').replace(/\D/g, '');
        const gw = 3, gap = 1;
        const width = text.length * (gw + gap) - gap;
        const x0 = Math.round(x + 2 - width / 2);
        const yTop = y0 + 11;
        const z0 = z;
        for (let i = 0; i < text.length; i += 1) {
            const rows = HUB_GLYPHS[text.charAt(i)] || ['...', '...', '...', '...', '...'];
            for (let r = 0; r < rows.length; r += 1) {
                const row = rows[r];
                for (let c = 0; c < row.length; c += 1) {
                    if (row.charAt(c) === '#') putBlock(edits, x0 + i * (gw + gap) + c, yTop - r, z0, kind);
                }
            }
        }
    }

    function stampHubBuilding(edits, heights, n, spec, y0) {
        const x = Math.round(spec.x || 0) - 1;
        const z = Math.round(spec.z || 0) - 8;
        const wall = spec.wall || 'plank';
        const roof = spec.roof || 'leaf';
        const shape = spec.shape || 'house';
        const base = y0 != null ? y0 : yAt(heights, n, x + 2, z + 2);
        if (shape === 'spire' || shape === 'crystal' || shape === 'end') {
            stampTowerAt(edits, x + 1, z, 3, 3, shape === 'end' ? 7 : 6, wall, roof, false, base);
            for (let dy = 0; dy < (shape === 'end' ? 9 : 8); dy += 1) putBlock(edits, x + 2, base + dy, z + 1, spec.frame || roof);
            return;
        }
        if (shape === 'igloo') {
            stampTowerAt(edits, x, z, 5, 5, 3, wall, roof, true, base);
            return;
        }
        if (shape === 'dock') {
            stampTowerAt(edits, x, z, 5, 4, 3, wall, roof, true, base);
            for (let ix = x; ix < x + 5; ix += 1) {
                paveTop(heights, n, edits, ix, z + 4, 'plank');
                paveTop(heights, n, edits, ix, z + 5, 'plank');
            }
            return;
        }
        const open = shape !== 'bunker';
        const h = shape === 'bunker' || shape === 'hut' ? 3 : 4;
        const w = shape === 'hut' || shape === 'bunker' ? 4 : 5;
        const d = shape === 'cabin' || shape === 'forge' || shape === 'mine' ? 4 : 5;
        stampTowerAt(edits, x, z, w, d, h, wall, roof, open, base);
    }

    function stampTowerAt(edits, x, z, w, d, h, wall, roof, open, y0) {
        const midX = x + Math.floor(w / 2);
        const midZ = z + Math.floor(d / 2);
        for (let iz = z; iz < z + d; iz += 1) {
            for (let ix = x; ix < x + w; ix += 1) {
                const edge = ix === x || ix === x + w - 1 || iz === z || iz === z + d - 1;
                for (let dy = 0; dy < h; dy += 1) {
                    if (!edge) {
                        if (dy === h - 1) putBlock(edits, ix, y0 + dy, iz, roof || wall);
                        continue;
                    }
                    if (open && dy > 0 && dy < h - 1 && (ix === midX || iz === midZ)) continue;
                    putBlock(edits, ix, y0 + dy, iz, wall);
                }
            }
        }
    }

    function stampLevelPortals(n, heights, edits, specs, wordCells) {
        const out = [];
        (specs || []).forEach(function (p) {
            const x = Math.round(Number(p.x) || 0);
            const z = Math.round(Number(p.z) || 0);
            const y0 = yAt(heights, n, x + 1, z + 1);
            const frame = p.state === 'locked' ? 'gold' : 'leaf';
            for (let i = 0; i < 4; i += 1) {
                putBlock(edits, x + i, y0, z, frame);
                putBlock(edits, x + i, y0 + 4, z, frame);
            }
            for (let dy = 1; dy <= 3; dy += 1) {
                putBlock(edits, x, y0 + dy, z, frame);
                putBlock(edits, x + 3, y0 + dy, z, frame);
                if (p.state === 'locked') {
                    putBlock(edits, x + 1, y0 + dy, z, 'gold');
                    putBlock(edits, x + 2, y0 + dy, z, 'gold');
                }
            }
            stampHubBuilding(edits, heights, n, p, y0);
            stampHubLetters(edits, p, x, z, y0);
            out.push({
                x: x + 1.5,
                z: z + 0.5,
                y: y0,
                level: p.level,
                climate: p.climate,
                title: p.title,
                state: p.state,
                frame: frame,
                shape: p.shape,
                line: p.line,
                mark: String(p.mark || p.level || '')
            });
        });
        return out;
    }

    function stampUnlockPost(n, heights, edits, cx, cz) {
        const x = cx;
        const z = cz - 6;
        const y0 = yAt(heights, n, x, z);
        putBlock(edits, x, y0, z, 'gold');
        putBlock(edits, x, y0 + 1, z, 'gold');
        putBlock(edits, x, y0 + 2, z, 'gold');
        putBlock(edits, x, y0 + 3, z, 'iron');
        return { x: x + 0.5, z: z + 0.5, y: y0 };
    }

    function stampTower(edits, heights, n, x, z, w, d, h, wall, roof, open) {
        const y0 = flattenPad(heights, n, x, z, w, d);
        const midX = x + Math.floor(w / 2);
        const midZ = z + Math.floor(d / 2);
        for (let iz = z; iz < z + d; iz += 1) {
            for (let ix = x; ix < x + w; ix += 1) {
                const edge = ix === x || ix === x + w - 1 || iz === z || iz === z + d - 1;
                for (let dy = 0; dy < h; dy += 1) {
                    if (!edge) {
                        if (dy === h - 1) putBlock(edits, ix, y0 + dy, iz, roof || wall);
                        continue;
                    }
                    if (open && dy > 0 && dy < h - 1 && (ix === midX || iz === midZ)) continue;
                    putBlock(edits, ix, y0 + dy, iz, wall);
                }
            }
        }
        return y0;
    }

    function stampPillar(edits, heights, n, x, z, h, kind) {
        const y0 = yAt(heights, n, x, z);
        for (let dy = 0; dy < h; dy += 1) putBlock(edits, x, y0 + dy, z, kind);
        return y0;
    }

    function stampCrater(heights, n, cx, cz, r, drop) {
        for (let dz = -r; dz <= r; dz += 1) {
            for (let dx = -r; dx <= r; dx += 1) {
                if (dx * dx + dz * dz > r * r) continue;
                setY(heights, n, cx + dx, cz + dz, yAt(heights, n, cx + dx, cz + dz) - drop);
            }
        }
    }

    function stampLandmarks(n, heights, edits, ponds, climate, cx, cz, towns, rng, sites, props, tags) {
        function clear(x, z, w, d) {
            if (x < 6 || z < 6 || x + w >= n - 6 || z + d >= n - 6) return false;
            if (Math.abs(x + w / 2 - cx) < 6 && Math.abs(z + d / 2 - cz) < 6) return false;
            for (let iz = z; iz < z + d; iz += 1) {
                for (let ix = x; ix < x + w; ix += 1) {
                    if (inAnyRect(ix, iz, towns)) return false;
                }
            }
            return true;
        }
        function mark(x, z, w, d, tag) {
            sites.push({ x0: x - 1, z0: z - 1, x1: x + w, z1: z + d });
            tags.push(tag);
        }
        function loot(kind, x, z, y) {
            props.push({ kind: kind, x: x, z: z, y: y });
        }

        if (climate === 'plains') {
            const craterX = cx - 22, craterZ = cz - 18;
            if (clear(craterX - 3, craterZ - 3, 7, 7)) {
                stampCrater(heights, n, craterX, craterZ, 3, 2);
                for (let a = 0; a < 8; a += 1) {
                    const px = craterX + Math.round(Math.cos(a * Math.PI / 4) * 3);
                    const pz = craterZ + Math.round(Math.sin(a * Math.PI / 4) * 3);
                    putBlock(edits, px, yAt(heights, n, px, pz), pz, 'stone');
                }
                mark(craterX - 3, craterZ - 3, 7, 7, 'creeper-crater');
            }
            const shrineX = cx + 18, shrineZ = cz - 10;
            if (clear(shrineX, shrineZ, 5, 5)) {
                const y0 = flattenPad(heights, n, shrineX, shrineZ, 5, 5);
                for (let iz = shrineZ; iz < shrineZ + 5; iz += 1) {
                    for (let ix = shrineX; ix < shrineX + 5; ix += 1) {
                        putBlock(edits, ix, y0, iz, 'stone');
                    }
                }
                putBlock(edits, shrineX + 2, y0 + 1, shrineZ + 2, 'stone');
                putBlock(edits, shrineX + 2, y0 + 2, shrineZ + 2, 'gold');
                loot('chest', shrineX + 1, shrineZ + 1, y0 + 1);
                loot('torch', shrineX + 2, shrineZ + 3, y0 + 1);
                mark(shrineX, shrineZ, 5, 5, 'cube-shrine');
            }
            const twX = cx - 20, twZ = cz + 16;
            if (clear(twX, twZ, 3, 3)) {
                const y0 = stampTower(edits, heights, n, twX, twZ, 3, 3, 6, 'log', 'plank', true);
                loot('torch', twX + 1, twZ + 1, y0 + 5);
                mark(twX, twZ, 3, 3, 'watchtower');
            }
        }

        if (climate === 'cherry') {
            const denX = cx - 20, denZ = cz + 14;
            if (clear(denX, denZ, 5, 5)) {
                const y0 = flattenPad(heights, n, denX, denZ, 5, 5);
                for (let iz = denZ; iz < denZ + 5; iz += 1) {
                    for (let ix = denX; ix < denX + 5; ix += 1) {
                        const edge = ix === denX || ix === denX + 4 || iz === denZ || iz === denZ + 4;
                        if (edge) putBlock(edits, ix, y0, iz, 'dirt');
                        putBlock(edits, ix, y0 + 1, iz, edge ? 'log' : 'leaf');
                    }
                }
                putBlock(edits, denX + 2, y0 + 1, denZ + 4, null);
                loot('chest', denX + 2, denZ + 2, y0);
                mark(denX, denZ, 5, 5, 'fox-den');
            }
        }

        if (climate === 'desert') {
            const ox = cx - 18, oz = cz + 12;
            for (let dz = -4; dz <= 4; dz += 1) {
                for (let dx = -4; dx <= 4; dx += 1) {
                    if (ponds[(ox + dx) + ',' + (oz + dz)]) {
                        setY(heights, n, ox + dx, oz + dz, Math.max(3, yAt(heights, n, ox + dx, oz + dz) - 1));
                    }
                }
            }
            tags.push('oasis');
            const pyX = cx + 20, pyZ = cz - 22;
            if (clear(pyX, pyZ, 7, 7)) {
                const y0 = flattenPad(heights, n, pyX, pyZ, 7, 7);
                for (let i = 0; i < 4; i += 1) {
                    for (let iz = pyZ + i; iz < pyZ + 7 - i; iz += 1) {
                        for (let ix = pyX + i; ix < pyX + 7 - i; ix += 1) {
                            putBlock(edits, ix, y0 + i, iz, i === 3 ? 'gold' : 'sand');
                        }
                    }
                }
                loot('chest', pyX + 3, pyZ + 3, y0 + 1);
                mark(pyX, pyZ, 7, 7, 'pyramid');
            }
            const campX = cx - 24, campZ = cz - 16;
            if (clear(campX, campZ, 7, 7)) {
                const y0 = flattenPad(heights, n, campX, campZ, 7, 7);
                for (let i = 0; i < 7; i += 1) {
                    if (i % 2 === 0) {
                        putBlock(edits, campX + i, y0, campZ, 'sand');
                        putBlock(edits, campX + i, y0 + 1, campZ, 'log');
                        putBlock(edits, campX, y0, campZ + i, 'sand');
                        putBlock(edits, campX + 6, y0 + 1, campZ + i, 'log');
                    }
                }
                loot('chest', campX + 2, campZ + 2, y0);
                loot('furnace', campX + 4, campZ + 3, y0);
                loot('torch', campX + 1, campZ + 1, y0 + 1);
                mark(campX, campZ, 7, 7, 'raid-camp');
            }
        }

        if (climate === 'duskvale') {
            const gyX = cx - 20, gyZ = cz + 16;
            if (clear(gyX, gyZ, 7, 5)) {
                const y0 = flattenPad(heights, n, gyX, gyZ, 7, 5);
                for (let i = 0; i < 3; i += 1) {
                    const gx = gyX + 1 + i * 2;
                    stampPillar(edits, heights, n, gx, gyZ + 1, 2, 'stone');
                    putBlock(edits, gx, y0 + 2, gyZ + 1, 'plank');
                    loot('torch', gx, gyZ + 2, y0 + 1);
                }
                mark(gyX, gyZ, 7, 5, 'graveyard');
            }
            const pilX = cx + 20, pilZ = cz - 14;
            if (clear(pilX, pilZ, 7, 3)) {
                stampPillar(edits, heights, n, pilX, pilZ, 8, 'stone');
                stampPillar(edits, heights, n, pilX + 3, pilZ + 1, 9, 'stone');
                stampPillar(edits, heights, n, pilX + 6, pilZ, 8, 'stone');
                mark(pilX, pilZ, 7, 3, 'enderman-pillars');
            }
            const rsX = cx - 16, rsZ = cz - 22;
            if (clear(rsX, rsZ, 4, 4)) {
                const y0 = stampTower(edits, heights, n, rsX, rsZ, 4, 4, 8, 'stone', 'stone', true);
                loot('torch', rsX + 1, rsZ + 1, y0 + 7);
                mark(rsX, rsZ, 4, 4, 'phantom-roost');
            }
        }

        if (climate === 'crystal') {
            const hutX = cx - 20, hutZ = cz + 14;
            if (clear(hutX, hutZ, 5, 5)) {
                const y0 = flattenPad(heights, n, hutX, hutZ, 5, 5);
                [[0, 0], [4, 0], [0, 4], [4, 4]].forEach(function (p) {
                    stampPillar(edits, heights, n, hutX + p[0], hutZ + p[1], 3, 'log');
                });
                for (let iz = hutZ; iz < hutZ + 5; iz += 1) {
                    for (let ix = hutX; ix < hutX + 5; ix += 1) {
                        const edge = ix === hutX || ix === hutX + 4 || iz === hutZ || iz === hutZ + 4;
                        putBlock(edits, ix, y0 + 3, iz, 'plank');
                        if (edge) {
                            putBlock(edits, ix, y0 + 4, iz, 'plank');
                            putBlock(edits, ix, y0 + 5, iz, 'plank');
                        }
                        putBlock(edits, ix, y0 + 6, iz, 'plank');
                    }
                }
                putBlock(edits, hutX + 2, y0 + 4, hutZ + 4, null);
                loot('chest', hutX + 2, hutZ + 2, y0 + 4);
                loot('furnace', hutX + 1, hutZ + 2, y0 + 4);
                mark(hutX, hutZ, 5, 5, 'witch-hut');
            }
            const nestX = cx + 18, nestZ = cz - 18;
            if (clear(nestX, nestZ, 5, 5)) {
                stampCrater(heights, n, nestX + 2, nestZ + 2, 2, 2);
                for (let a = 0; a < 6; a += 1) {
                    const px = nestX + 2 + Math.round(Math.cos(a) * 2);
                    const pz = nestZ + 2 + Math.round(Math.sin(a) * 2);
                    putBlock(edits, px, yAt(heights, n, px, pz), pz, 'stone');
                }
                mark(nestX, nestZ, 5, 5, 'spider-nest');
            }
            const shX = cx - 18, shZ = cz - 20;
            if (clear(shX, shZ, 3, 3)) {
                stampTower(edits, heights, n, shX, shZ, 3, 3, 6, 'stone', 'gold', false);
                mark(shX, shZ, 3, 3, 'vindicator-outpost');
            }
            const pitX = cx + 22, pitZ = cz - 28;
            if (clear(pitX, pitZ, 5, 5)) {
                stampCrater(heights, n, pitX + 2, pitZ + 2, 2, 3);
                for (let iz = pitZ; iz < pitZ + 5; iz += 1) {
                    for (let ix = pitX; ix < pitX + 5; ix += 1) {
                        putBlock(edits, ix, yAt(heights, n, ix, iz) - 1, iz, 'coal');
                    }
                }
                mark(pitX, pitZ, 5, 5, 'warden-pit');
            }
        }

        if (climate === 'deep_dark') {
            const pitX = cx + 22, pitZ = cz - 28;
            if (clear(pitX, pitZ, 5, 5)) {
                stampCrater(heights, n, pitX + 2, pitZ + 2, 2, 3);
                for (let iz = pitZ; iz < pitZ + 5; iz += 1) {
                    for (let ix = pitX; ix < pitX + 5; ix += 1) {
                        putBlock(edits, ix, yAt(heights, n, ix, iz) - 1, iz, 'coal');
                    }
                }
                mark(pitX, pitZ, 5, 5, 'warden-pit');
            }
            const groveX = cx - 20, groveZ = cz + 16;
            if (clear(groveX, groveZ, 5, 5)) {
                const y0 = flattenPad(heights, n, groveX, groveZ, 5, 5);
                for (let iz = groveZ; iz < groveZ + 5; iz += 1) {
                    for (let ix = groveX; ix < groveX + 5; ix += 1) {
                        putBlock(edits, ix, y0, iz, 'stone');
                        if ((ix + iz) % 2 === 0) putBlock(edits, ix, y0 + 1, iz, 'coal');
                    }
                }
                loot('chest', groveX + 2, groveZ + 2, y0 + 1);
                mark(groveX, groveZ, 5, 5, 'sculk-grove');
            }
        }

        if (climate === 'nether') {
            [[cx - 20, cz + 14], [cx + 16, cz - 18], [cx - 12, cz - 22]].forEach(function (p, i) {
                if (!clear(p[0] - 2, p[1] - 2, 5, 5)) return;
                stampCrater(heights, n, p[0], p[1], 2, 2);
                putBlock(edits, p[0], yAt(heights, n, p[0], p[1]), p[1], i % 2 ? 'gold' : 'coal');
                mark(p[0] - 2, p[1] - 2, 5, 5, 'magma-pit');
            });
            const bx = cx + 20, bz = cz + 16;
            if (clear(bx, bz, 7, 7)) {
                const y0 = stampTower(edits, heights, n, bx, bz, 7, 7, 5, 'stone', 'gold', true);
                putBlock(edits, bx + 3, y0 + 1, bz + 3, 'gold');
                loot('chest', bx + 2, bz + 2, y0);
                loot('furnace', bx + 4, bz + 3, y0);
                mark(bx, bz, 7, 7, 'bastion');
            }
            const blX = cx - 24, blZ = cz - 10;
            if (clear(blX, blZ, 3, 3)) {
                stampTower(edits, heights, n, blX, blZ, 3, 3, 8, 'stone', 'gold', true);
                mark(blX, blZ, 3, 3, 'blaze-cage');
            }
            const ghX = cx + 8, ghZ = cz - 28;
            if (clear(ghX, ghZ, 3, 3)) {
                for (let iz = ghZ; iz < ghZ + 3; iz += 1) {
                    for (let ix = ghX; ix < ghX + 3; ix += 1) {
                        setY(heights, n, ix, iz, Math.min(HEIGHT_MAX, yAt(heights, n, ix, iz) + 5));
                    }
                }
                stampPillar(edits, heights, n, ghX + 1, ghZ + 1, 4, 'stone');
                mark(ghX, ghZ, 3, 3, 'ghast-perch');
            }
        }

        if (climate === 'forest') {
            const nestX = cx + 20, nestZ = cz - 20;
            if (clear(nestX, nestZ, 5, 5)) {
                stampCrater(heights, n, nestX + 2, nestZ + 2, 2, 2);
                mark(nestX, nestZ, 5, 5, 'spider-nest');
            }
            const twX = cx - 22, twZ = cz + 18;
            if (clear(twX, twZ, 3, 3)) {
                stampTower(edits, heights, n, twX, twZ, 3, 3, 7, 'log', 'leaf', true);
                mark(twX, twZ, 3, 3, 'watchtower');
            }
        }

        if (climate === 'quarry') {
            const cutX = cx + 20, cutZ = cz - 20;
            if (clear(cutX, cutZ, 7, 7)) {
                stampCrater(heights, n, cutX + 3, cutZ + 3, 3, 3);
                for (let iz = cutZ; iz < cutZ + 7; iz += 1) {
                    for (let ix = cutX; ix < cutX + 7; ix += 1) {
                        const edge = ix === cutX || ix === cutX + 6 || iz === cutZ || iz === cutZ + 6;
                        putBlock(edits, ix, yAt(heights, n, ix, iz), iz, edge ? 'stone' : 'coal');
                    }
                }
                loot('chest', cutX + 3, cutZ + 3, yAt(heights, n, cutX + 3, cutZ + 3));
                mark(cutX, cutZ, 7, 7, 'mine-cut');
            }
            const padX = cx - 22, padZ = cz + 18;
            if (clear(padX, padZ, 5, 5)) {
                const y0 = flattenPad(heights, n, padX, padZ, 5, 5);
                for (let iz = padZ; iz < padZ + 5; iz += 1) {
                    for (let ix = padX; ix < padX + 5; ix += 1) {
                        putBlock(edits, ix, y0, iz, 'stone');
                    }
                }
                stampPillar(edits, heights, n, padX + 2, padZ + 2, 4, 'stone');
                mark(padX, padZ, 5, 5, 'stone-pad');
            }
        }

        if (climate === 'astral') {
            const spX = cx + 20, spZ = cz - 20;
            if (clear(spX, spZ, 5, 5)) {
                const y0 = flattenPad(heights, n, spX, spZ, 5, 5);
                for (let iz = spZ; iz < spZ + 5; iz += 1) {
                    for (let ix = spX; ix < spX + 5; ix += 1) {
                        putBlock(edits, ix, y0, iz, 'stone');
                    }
                }
                stampPillar(edits, heights, n, spX + 2, spZ + 2, 8, 'stone');
                putBlock(edits, spX + 2, y0 + 8, spZ + 2, 'gold');
                loot('chest', spX + 1, spZ + 1, y0 + 1);
                mark(spX, spZ, 5, 5, 'star-spire');
            }
            const ringX = cx - 22, ringZ = cz + 16;
            if (clear(ringX, ringZ, 7, 7)) {
                const y0 = flattenPad(heights, n, ringX, ringZ, 7, 7);
                for (let a = 0; a < 8; a += 1) {
                    const px = ringX + 3 + Math.round(Math.cos(a * Math.PI / 4) * 3);
                    const pz = ringZ + 3 + Math.round(Math.sin(a * Math.PI / 4) * 3);
                    putBlock(edits, px, y0, pz, 'iron');
                    putBlock(edits, px, y0 + 1, pz, 'iron');
                }
                mark(ringX, ringZ, 7, 7, 'void-ring');
            }
        }

        if (climate === 'snow') {
            const igX = cx - 20, igZ = cz + 16;
            if (clear(igX, igZ, 5, 5)) {
                const y0 = flattenPad(heights, n, igX, igZ, 5, 5);
                for (let iz = igZ; iz < igZ + 5; iz += 1) {
                    for (let ix = igX; ix < igX + 5; ix += 1) {
                        const edge = ix === igX || ix === igX + 4 || iz === igZ || iz === igZ + 4;
                        putBlock(edits, ix, y0, iz, 'snow');
                        if (edge) putBlock(edits, ix, y0 + 1, iz, 'snow');
                        putBlock(edits, ix, y0 + 2, iz, 'snow');
                    }
                }
                putBlock(edits, igX + 2, y0 + 1, igZ + 4, null);
                loot('chest', igX + 2, igZ + 2, y0 + 1);
                mark(igX, igZ, 5, 5, 'igloo');
            }
        }

        if (climate === 'ocean') {
            const dkX = cx + 18, dkZ = cz - 16;
            if (clear(dkX, dkZ, 6, 3)) {
                const y0 = flattenPad(heights, n, dkX, dkZ, 6, 3);
                for (let iz = dkZ; iz < dkZ + 3; iz += 1) {
                    for (let ix = dkX; ix < dkX + 6; ix += 1) {
                        putBlock(edits, ix, y0, iz, 'plank');
                    }
                }
                stampPillar(edits, heights, n, dkX, dkZ, 3, 'log');
                stampPillar(edits, heights, n, dkX + 5, dkZ, 3, 'log');
                loot('chest', dkX + 2, dkZ + 1, y0 + 1);
                loot('torch', dkX + 4, dkZ + 1, y0 + 1);
                mark(dkX, dkZ, 6, 3, 'dock');
            }
        }

        if (climate === 'mushroom') {
            const padX = cx - 18, padZ = cz - 16;
            if (clear(padX, padZ, 5, 5)) {
                const y0 = flattenPad(heights, n, padX, padZ, 5, 5);
                stampPillar(edits, heights, n, padX + 2, padZ + 2, 3, 'log');
                for (let dz = -2; dz <= 2; dz += 1) {
                    for (let dx = -2; dx <= 2; dx += 1) {
                        putBlock(edits, padX + 2 + dx, y0 + 3, padZ + 2 + dz, 'leaf');
                    }
                }
                mark(padX, padZ, 5, 5, 'giant-mushroom');
            }
        }

        if (climate === 'volcano') {
            [[cx - 18, cz + 14], [cx + 16, cz - 18]].forEach(function (p) {
                if (!clear(p[0] - 2, p[1] - 2, 5, 5)) return;
                stampCrater(heights, n, p[0], p[1], 2, 2);
                putBlock(edits, p[0], yAt(heights, n, p[0], p[1]), p[1], 'gold');
                mark(p[0] - 2, p[1] - 2, 5, 5, 'magma-pit');
            });
            const blX = cx + 20, blZ = cz + 16;
            if (clear(blX, blZ, 3, 3)) {
                stampTower(edits, heights, n, blX, blZ, 3, 3, 8, 'stone', 'gold', true);
                mark(blX, blZ, 3, 3, 'blaze-cage');
            }
        }

        if (climate === 'end') {
            const pilX = cx + 18, pilZ = cz - 16;
            if (clear(pilX, pilZ, 7, 3)) {
                stampPillar(edits, heights, n, pilX, pilZ, 9, 'stone');
                stampPillar(edits, heights, n, pilX + 3, pilZ + 1, 10, 'stone');
                stampPillar(edits, heights, n, pilX + 6, pilZ, 9, 'stone');
                mark(pilX, pilZ, 7, 3, 'enderman-pillars');
            }
            const shX = cx - 20, shZ = cz + 14;
            if (clear(shX, shZ, 3, 3)) {
                stampTower(edits, heights, n, shX, shZ, 3, 3, 6, 'stone', 'gold', false);
                mark(shX, shZ, 3, 3, 'vindicator-outpost');
            }
        }
    }

    function stampSkyMark(n, heights, edits, climate, cx, cz, towns, skyMarks) {
        const x = Math.max(12, Math.min(n - 20, cx + 52));
        const z = Math.max(12, Math.min(n - 20, cz - 44));
        const w = 7, d = 7;
        if (inAnyRect(x + 3, z + 3, towns || [])) return;
        const y0 = flattenPad(heights, n, x, z, w, d);
        const h = Math.max(30, Math.min(36, HEIGHT_MAX + 4 - y0));
        const kind = climate === 'forest' ? 'redwood'
            : climate === 'cherry' ? 'torii'
            : climate === 'desert' ? 'obelisk'
            : climate === 'snow' ? 'keep'
            : climate === 'volcano' ? 'cone'
            : climate === 'crystal' ? 'spire'
            : 'beacon';
        const wall = climate === 'desert' ? 'sand'
            : climate === 'forest' || climate === 'cherry' ? 'log'
            : climate === 'crystal' ? 'gold'
            : climate === 'nether' || climate === 'volcano' ? 'coal'
            : 'stone';
        const roof = climate === 'cherry' ? 'leaf'
            : climate === 'desert' ? 'gold'
            : climate === 'snow' ? 'snow'
            : climate === 'crystal' ? 'diamond'
            : climate === 'volcano' ? 'gold'
            : 'plank';
        if (kind === 'redwood') {
            for (let dy = 0; dy < h; dy += 1) {
                putBlock(edits, x + 3, y0 + dy, z + 3, 'log');
                if (dy < 4) {
                    putBlock(edits, x + 2, y0 + dy, z + 3, 'log');
                    putBlock(edits, x + 4, y0 + dy, z + 3, 'log');
                    putBlock(edits, x + 3, y0 + dy, z + 2, 'log');
                    putBlock(edits, x + 3, y0 + dy, z + 4, 'log');
                }
            }
            for (let dz = -3; dz <= 3; dz += 1) {
                for (let dx = -3; dx <= 3; dx += 1) {
                    if (Math.abs(dx) + Math.abs(dz) > 5) continue;
                    putBlock(edits, x + 3 + dx, y0 + h - 2, z + 3 + dz, 'leaf');
                    if (Math.abs(dx) + Math.abs(dz) <= 3) putBlock(edits, x + 3 + dx, y0 + h - 1, z + 3 + dz, 'leaf');
                }
            }
        } else if (kind === 'torii') {
            for (let dy = 0; dy < h; dy += 1) {
                putBlock(edits, x + 1, y0 + dy, z + 3, 'log');
                putBlock(edits, x + 5, y0 + dy, z + 3, 'log');
            }
            for (let ix = x; ix < x + 7; ix += 1) {
                putBlock(edits, ix, y0 + h - 2, z + 3, 'leaf');
                putBlock(edits, ix, y0 + h - 1, z + 3, 'gold');
            }
        } else if (kind === 'cone') {
            for (let r = 6; r >= 0; r -= 1) {
                const lift = Math.round((6 - r) * (h / 8));
                for (let dz = -r; dz <= r; dz += 1) {
                    for (let dx = -r; dx <= r; dx += 1) {
                        if (dx * dx + dz * dz > r * r) continue;
                        setY(heights, n, x + 3 + dx, z + 3 + dz, Math.min(HEIGHT_MAX, y0 + lift));
                        if (r <= 1) putBlock(edits, x + 3 + dx, y0 + lift, z + 3 + dz, 'gold');
                    }
                }
            }
        } else if (kind === 'spire') {
            [[0, 0, h], [2, -2, h - 4], [-2, 2, h - 6]].forEach(function (p) {
                for (let dy = 0; dy < p[2]; dy += 1) {
                    putBlock(edits, x + 3 + p[0], y0 + dy, z + 3 + p[1], dy > p[2] - 4 ? 'gold' : 'stone');
                }
            });
        } else if (kind === 'obelisk') {
            for (let i = 0; i < 4; i += 1) {
                for (let iz = z + i; iz < z + 7 - i; iz += 1) {
                    for (let ix = x + i; ix < x + 7 - i; ix += 1) {
                        putBlock(edits, ix, y0 + i, iz, i === 3 ? 'gold' : 'sand');
                    }
                }
            }
            for (let dy = 4; dy < h; dy += 1) putBlock(edits, x + 3, y0 + dy, z + 3, dy > h - 3 ? 'gold' : 'sand');
        } else {
            stampTowerAt(edits, x + 2, z + 2, 3, 3, h, wall, roof, true, y0);
        }
        skyMarks.push({ kind: kind, climate: climate, x: x + 3, z: z + 3, y: y0, h: h });
    }

    function stampWordCubes(n, heights, edits, wordCells, words, cx, cz, village, ponds, treeSet) {
        const list = (words || []).filter(function (w) { return w && w.text; }).slice(0, 48);
        if (!list.length) return;
        const spots = [];
        function addRing(ox, oz, radii, twist) {
            radii.forEach(function (r, ri) {
                const count = 8 + ri * 2;
                for (let k = 0; k < count; k += 1) {
                    const a = (k / count) * Math.PI * 2 + (twist || 0) + ri * 0.15;
                    spots.push([Math.round(ox + Math.cos(a) * r), Math.round(oz + Math.sin(a) * r)]);
                }
            });
        }
        addRing(cx, cz, [8, 12, 16, 22, 28, 36, 48], 0);
        (Array.isArray(village) ? village : []).forEach(function (plan, pi) {
            const mx = Math.round(((Number(plan.x0) || 0) + (Number(plan.x1) || 0)) / 2);
            const mz = Math.round(((Number(plan.z0) || 0) + (Number(plan.z1) || 0)) / 2);
            if (Math.hypot(mx - cx, mz - cz) < 14) return;
            addRing(mx, mz, [7, 11], pi * 0.4);
        });
        let i = 0;
        const usedXZ = {};
        spots.forEach(function (spot) {
            if (i >= list.length) return;
            const x = spot[0], z = spot[1];
            if (x < 2 || z < 2 || x >= n - 2 || z >= n - 2) return;
            if (usedXZ[x + ',' + z]) return;
            if (inAnyRect(x, z, village) || ponds[x + ',' + z] || treeSet[x + ',' + z]) return;
            if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 2) return;
            const y = heights[z * n + x];
            const key = x + ',' + y + ',' + z;
            if (edits[key]) return;
            edits[key] = 'word';
            wordCells[key] = list[i];
            usedXZ[x + ',' + z] = 1;
            i += 1;
        });
    }

    function addWordArch(n, heights, edits, gates, x, z, axis, word) {
        if (!word || x < 2 || z < 2 || x >= n - 2 || z >= n - 2) return;
        const y = heights[z * n + x] || 4;
        const cells = [];
        const put = function (ix, iy, iz, kind) {
            const key = ix + ',' + iy + ',' + iz;
            edits[key] = kind;
            cells.push(key);
        };
        for (let i = -1; i <= 1; i += 1) {
            const ix = axis === 'x' ? x : x + i;
            const iz = axis === 'x' ? z + i : z;
            put(ix, y, iz, i === 0 ? 'gate' : 'log');
            put(ix, y + 1, iz, i === 0 ? 'gate' : 'log');
            put(ix, y + 2, iz, i === 0 ? 'word' : 'plank');
        }
        gates.push({ x: x, z: z, y: y, word: word, open: false, cells: cells });
    }

    function stampWordGates(n, heights, edits, words, cx, cz, village) {
        const list = (words || []).filter(function (w) { return w && w.text; }).slice(0, 8);
        const gates = [];
        if (!list.length) return gates;
        addWordArch(n, heights, edits, gates, cx + 5, cz, 'x', list[0]);
        addWordArch(n, heights, edits, gates, cx - 6, cz + 1, 'x', list[1] || list[0]);
        addWordArch(n, heights, edits, gates, cx, cz + 8, 'z', list[3] || list[0]);
        addWordArch(n, heights, edits, gates, cx + 10, cz - 4, 'z', list[4] || list[1] || list[0]);
        if (village && village.houses && village.houses.length) {
            const house = village.houses.filter(function (h) { return h.role === 'word'; })[0] || village.houses[0];
            addWordArch(n, heights, edits, gates, house.x + Math.floor(house.w / 2), house.z + house.d, 'z', list[2] || list[0]);
        }
        return gates;
    }

    function openWordGate(world, gate) {
        if (!world || !gate || gate.open) return false;
        gate.open = true;
        if (!world.edits) world.edits = {};
        (gate.cells || []).forEach(function (key) {
            world.edits[key] = null;
        });
        return true;
    }

    function carveCaves(n, heights, hollow, rng, climate, cx, cz, village, treeSet, ponds) {
        const worms = climate === 'quarry' ? 22
            : climate === 'crystal' || climate === 'duskvale' ? 20
                : climate === 'astral' ? 8
                    : climate === 'desert' ? 10
                        : 14;
        const starts = [];
        if (climate !== 'astral') {
            starts.push([cx - 16, cz - 8], [cx - 10, cz + 14], [cx + 6, cz - 18]);
        }
        for (let w = 0; w < worms; w += 1) {
            starts.push([6 + Math.floor(rng() * (n - 12)), 6 + Math.floor(rng() * (n - 12))]);
        }
        starts.forEach(function (start) {
            let x = start[0], z = start[1];
            if (Math.abs(x - cx) < 8 && Math.abs(z - cz) < 8) return;
            if (inAnyRect(x, z, village)) return;
            const h0 = heights[z * n + x] || 4;
            let y = Math.max(2, Math.min(h0 - 3, 2 + Math.floor(rng() * Math.max(1, h0 - 4))));
            const steps = 22 + Math.floor(rng() * 18);
            for (let s = 0; s < steps; s += 1) {
                for (let dy = -1; dy <= 1; dy += 1) {
                    for (let dz = -1; dz <= 0; dz += 1) {
                        for (let dx = -1; dx <= 0; dx += 1) {
                            const xx = x + dx, yy = y + dy, zz = z + dz;
                            if (xx < 1 || zz < 1 || xx >= n - 1 || zz >= n - 1 || yy < 1) continue;
                            if (inAnyRect(xx, zz, village)) continue;
                            if (treeSet[xx + ',' + zz]) continue;
                            const top = heights[zz * n + xx];
                            if (yy >= top) continue;
                            if (ponds[xx + ',' + zz] && yy >= top - 1) continue;
                            if (yy === top - 1 && rng() > 0.12) continue;
                            hollow[xx + ',' + yy + ',' + zz] = 1;
                        }
                    }
                }
                x += Math.floor(rng() * 3) - 1;
                z += Math.floor(rng() * 3) - 1;
                y += Math.floor(rng() * 3) - 1;
                x = Math.max(2, Math.min(n - 3, x));
                z = Math.max(2, Math.min(n - 3, z));
                const nh = heights[z * n + x] || 4;
                y = Math.max(1, Math.min(nh - 2, y));
            }
        });
    }

    function createWorld(seed, options) {
        const opts = options || {};
        const climateName = opts.climate || 'plains';
        const climate = climateOf(climateName);
        const rng = makeRng(seed || 7);
        const n = WORLD_SIZE;
        const heightGrid = makeGrid(rng, 12);
        const ridgeGrid = makeGrid(rng, 4);   // 低频(波长≈n/4≈96格)→绵延带状山脊
        const tempGrid = makeGrid(rng, 6);
        const moistGrid = makeGrid(rng, 6);
        const heights = new Uint8Array(n * n);
        const biomes = new Uint8Array(n * n);
        const at = function (x, z) { return heights[z * n + x]; };
        const put = function (x, z, h) { heights[z * n + x] = h; };
        const hSpan = Math.max(1, climate.hMax - climate.hMin);
        const cx = Math.floor(n / 2), cz = Math.floor(n / 2);
        for (let z = 0; z < n; z += 1) {
            for (let x = 0; x < n; x += 1) {
                const hv = sampleGrid(heightGrid, 12, n, x, z);
                const tv = Math.max(0, Math.min(1, climate.temp + (sampleGrid(tempGrid, 6, n, x, z) - 0.5) * 0.7));
                const mv = Math.max(0, Math.min(1, climate.moist + (sampleGrid(moistGrid, 6, n, x, z) - 0.5) * 0.7));
                const step = hash3(x, 3, z) > 0.8 ? 1 : 0;
                /* 脊谷噪声:1-|noise*2-1| 折叠产生锐利山脊;振幅按气候,出生点周边平缓 */
                const rv = sampleGrid(ridgeGrid, 4, n, x, z);
                const signed = ridgeSigned(rv);
                const distC = Math.max(Math.abs(x - cx), Math.abs(z - cz));
                const taper = Math.max(0, Math.min(1, (distC - 24) / 72));
                const h = Math.max(2, Math.min(HEIGHT_MAX, climate.hMin + Math.round(hv * hSpan + signed * climate.ridge * taper) + step));
                put(x, z, h);
                biomes[z * n + x] = pickBiome(tv, mv, hv);
            }
        }
        if (climateName === 'desert' || climateName === 'nether' || climateName === 'cherry' || climateName === 'snow') {
            const forced = climateName === 'desert' ? 2 : climateName === 'nether' ? 3 : climateName === 'snow' ? 4 : 1;
            biomes.fill(forced);
        }
        const base = at(cx, cz);
        for (let dz = -1; dz <= 1; dz += 1) {
            for (let dx = -1; dx <= 1; dx += 1) {
                put(cx + dx, cz + dz, base);
                biomes[(cz + dz) * n + (cx + dx)] = climateName === 'astral' ? 4
                    : climateName === 'nether' ? 3
                    : climateName === 'desert' ? 2
                    : climateName === 'quarry' ? 3
                    : climateName === 'cherry' ? 1
                    : 0;
            }
        }
        stampRidge(n, heights, biomes, cx, cz);
        const mainVillage = villagePlan(climateName, cx, cz);
        const hamlets = hamletPlans(climateName, cx, cz, n);
        const towns = (mainVillage ? [mainVillage] : []).concat(hamlets);
        const ponds = {};
        stampRiver(n, ponds, heights, climateName, cx, cz, towns);
        stampPonds(n, ponds, rng, climateName, cx, cz, towns);
        const edits = {};
        towns.forEach(function (plan) {
            stampVillage(n, heights, edits, ponds, plan);
        });
        const landmarkSites = [];
        const landmarkProps = [];
        const landmarkTags = [];
        stampLandmarks(n, heights, edits, ponds, climateName, cx, cz, towns, rng, landmarkSites, landmarkProps, landmarkTags);
        const skyMarks = [];
        stampSkyMark(n, heights, edits, climateName, cx, cz, towns, skyMarks);
        const wordCells = {};
        let levelPortals = [];
        let unlockPost = null;
        if (opts.hub) {
            const specs = (opts.portals && opts.portals.length)
                ? opts.portals
                : defaultHubPortalSpecs(cx, cz);
            stampHubRoad(n, heights, edits, cx, cz, specs);
            levelPortals = stampLevelPortals(n, heights, edits, specs, wordCells);
            unlockPost = stampUnlockPost(n, heights, edits, cx, cz);
        }
        const blocked = towns.concat(landmarkSites).concat(
            opts.hub ? hubKeepoutBoxes(cx, cz, levelPortals) : levelPortalBoxes(levelPortals)
        );
        const trees = [];
        let guard = 0;
        const mapScale = n / 256;
        const wantTrees = Math.round(climate.trees * mapScale);
        while (trees.length < wantTrees && guard < 6000) {
            guard += 1;
            const tx = 3 + Math.floor(rng() * (n - 6));
            const tz = 3 + Math.floor(rng() * (n - 6));
            if (Math.abs(tx - cx) <= 3 && Math.abs(tz - cz) <= 3) continue;
            if (inAnyRect(tx, tz, blocked) || ponds[tx + ',' + tz]) continue;
            const biome = BIOME_NAMES[biomes[tz * n + tx]];
            const minGap = climateName === 'desert' || biome === 'desert' ? 3
                : climateName === 'nether' ? 6
                : 5;
            if (trees.some(function (t) { return Math.abs(t.x - tx) + Math.abs(t.z - tz) < minGap; })) continue;
            const roll = rng();
            let species = 'oak';
            if (climateName === 'nether') species = 'crimson';
            else if (climateName === 'desert' || biome === 'desert') species = 'cactus';
            else if (climateName === 'cherry') species = 'cherry';
            else if (biome === 'snow' || climateName === 'astral') species = roll < 0.88 ? 'spruce' : 'birch';
            else if (biome === 'forest' || climateName === 'crystal') species = roll < climate.spruce ? 'spruce' : (roll < climate.spruce + climate.birch ? 'birch' : 'oak');
            else if (roll < climate.oak) species = 'oak';
            else if (roll < climate.oak + climate.birch) species = 'birch';
            else species = 'spruce';
            const trunk = species === 'cactus'
                ? 2 + Math.floor(rng() * 3)
                : species === 'crimson'
                    ? 3 + Math.floor(rng() * 2)
                    : species === 'cherry'
                        ? 5 + Math.floor(rng() * 2)
                        : species === 'spruce'
                            ? 6 + Math.floor(rng() * 3)
                            : species === 'birch'
                                ? 5 + Math.floor(rng() * 2)
                                : 4 + Math.floor(rng() * 2);
            trees.push({ x: tx, z: tz, surface: at(tx, tz), trunk: trunk, species: species });
        }
        const flowers = [];
        guard = 0;
        const wantFlowers = Math.round(climate.flowers * mapScale);
        while (flowers.length < wantFlowers && guard < 4000) {
            guard += 1;
            const fx = 2 + Math.floor(rng() * (n - 4));
            const fz = 2 + Math.floor(rng() * (n - 4));
            if (Math.abs(fx - cx) <= 2 && Math.abs(fz - cz) <= 2) continue;
            if (inAnyRect(fx, fz, blocked) || ponds[fx + ',' + fz]) continue;
            const biome = BIOME_NAMES[biomes[fz * n + fx]];
            if (biome === 'desert' || biome === 'snow' || climateName === 'nether') continue;
            if (trees.some(function (t) { return t.x === fx && t.z === fz; })) continue;
            const kind = climateName === 'cherry'
                ? (rng() > 0.4 ? 'petal' : 'sakura')
                : climateName === 'duskvale'
                    ? (rng() > 0.5 ? 'amber' : 'poppy')
                    : climateName === 'crystal'
                        ? (rng() > 0.5 ? 'crystal' : 'dandelion')
                        : (rng() > 0.45 ? 'poppy' : 'dandelion');
            flowers.push({ x: fx, z: fz, kind: kind });
        }
        const plants = [];
        towns.forEach(function (plan) {
            if (plan.crops) plants.push.apply(plants, plan.crops);
        });
        const wantPlants = Math.round((climateName === 'nether' || climateName === 'volcano' ? 28 : climateName === 'desert' ? 18 : Math.max(24, Math.floor(climate.flowers * 0.55))) * mapScale);
        guard = 0;
        while (plants.length < wantPlants && guard < 3600) {
            guard += 1;
            const px = 2 + Math.floor(rng() * (n - 4));
            const pz = 2 + Math.floor(rng() * (n - 4));
            if (Math.abs(px - cx) <= 2 && Math.abs(pz - cz) <= 2) continue;
            if (inAnyRect(px, pz, blocked) || ponds[px + ',' + pz]) continue;
            if (trees.some(function (t) { return t.x === px && t.z === pz; })) continue;
            const pkind = climateName === 'nether'
                ? (rng() > 0.5 ? 'wart' : 'mushroom')
                : climateName === 'desert'
                    ? (rng() > 0.45 ? 'deadbush' : 'tumble')
                    : climateName === 'cherry'
                        ? (rng() > 0.5 ? 'bush' : 'petalplant')
                        : climateName === 'crystal'
                            ? (rng() > 0.5 ? 'crystalbush' : 'reed')
                            : (rng() > 0.5 ? 'tallgrass' : (rng() > 0.45 ? 'bush' : 'reed'));
            plants.push({ x: px, z: pz, kind: pkind });
        }
        const animals = [];
        const animalKinds = climateName === 'nether' || climateName === 'desert' || climateName === 'volcano' || climateName === 'end' ? []
            : climateName === 'crystal' ? ['sheep', 'chicken']
                : climateName === 'duskvale' ? ['wolf', 'cow', 'chicken']
                    : climateName === 'cherry' ? ['pig', 'chicken', 'sheep', 'bee']
                        : climateName === 'snow' ? ['wolf', 'sheep', 'chicken']
                            : climateName === 'mushroom' ? ['cow', 'sheep', 'bee']
                                : climateName === 'deep_dark' ? ['wolf']
                                    : climateName === 'ocean' ? ['chicken']
                                        : ['pig', 'cow', 'sheep', 'chicken', 'wolf', 'bee'];
        guard = 0;
        const herd = Math.max(4, Math.round(4 * mapScale));
        while (animals.length < animalKinds.length * herd && guard < 3600 && animalKinds.length) {
            guard += 1;
            const ax = 4 + Math.floor(rng() * (n - 8));
            const az = 4 + Math.floor(rng() * (n - 8));
            if (Math.abs(ax - cx) <= 3 && Math.abs(az - cz) <= 3) continue;
            if (inAnyRect(ax, az, blocked) || ponds[ax + ',' + az]) continue;
            if (trees.some(function (t) { return Math.abs(t.x - ax) + Math.abs(t.z - az) < 2; })) continue;
            const kind = animalKinds[animals.length % animalKinds.length];
            const hab = habitatOf(kind);
            const px = ax + 0.5, pz = az + 0.5;
            const minGap = hab === 'air' ? 3 : 4.5;
            let crowded = false;
            for (let ai = 0; ai < animals.length; ai += 1) {
                const other = animals[ai];
                if (other.habitat === 'water') continue;
                const otherAir = other.habitat === 'air' || other.kind === 'bee';
                if (hab === 'air' || otherAir) {
                    if (hab === 'air' && otherAir && Math.hypot(other.x - px, other.z - pz) < minGap) {
                        crowded = true;
                        break;
                    }
                    continue;
                }
                if (Math.hypot(other.x - px, other.z - pz) < 4.5) {
                    crowded = true;
                    break;
                }
            }
            if (crowded) continue;
            animals.push({
                x: px,
                z: pz,
                kind: kind,
                habitat: hab,
                homeX: px,
                homeZ: pz,
                yaw: rng() * Math.PI * 2,
                phase: rng()
            });
        }
        const pondKeys = Object.keys(ponds);
        if (opts.hub || climateName === 'plains' || climateName === 'forest' || climateName === 'cherry') {
            const spots = opts.hub
                ? [[11, -9], [9, 12], [-10, -8]]
                : [[9, 8], [-8, 10], [12, -7]];
            let parked = false;
            for (let si = 0; si < spots.length && !parked; si += 1) {
                const mx = cx + spots[si][0];
                const mz = cz + spots[si][1];
                if (mx < 5 || mz < 5 || mx > n - 6 || mz > n - 6) continue;
                if (inAnyRect(mx, mz, blocked) || ponds[mx + ',' + mz]) continue;
                if (trees.some(function (t) { return Math.abs(t.x - mx) + Math.abs(t.z - mz) < 3; })) continue;
                animals.push({
                    x: mx + 0.5,
                    z: mz + 0.5,
                    kind: 'dragon',
                    rideable: true,
                    habitat: 'ground',
                    homeX: mx + 0.5,
                    homeZ: mz + 0.5,
                    yaw: 2.35,
                    phase: 0.28
                });
                parked = true;
            }
        }
        if (pondKeys.length && climateName !== 'nether' && climateName !== 'volcano' && climateName !== 'end') {
            const waterKinds = climateName === 'crystal' || climateName === 'ocean'
                ? ['pufferfish', 'guardian', 'elder_guardian']
                : ['pufferfish', 'guardian'];
            const wantWater = Math.min(pondKeys.length, waterKinds.length * (climateName === 'ocean' ? 5 : 2));
            for (let wi = 0; wi < wantWater; wi += 1) {
                const key = pondKeys[Math.floor(rng() * pondKeys.length)];
                const parts = key.split(',');
                const wx = Number(parts[0]) + 0.5;
                const wz = Number(parts[1]) + 0.5;
                animals.push({
                    x: wx,
                    z: wz,
                    kind: waterKinds[wi % waterKinds.length],
                    habitat: 'water',
                    yaw: rng() * Math.PI * 2,
                    phase: rng()
                });
            }
        }
        const treeSet = {};
        trees.forEach(function (t) { treeSet[t.x + ',' + t.z] = 1; });
        const wordGates = opts.hub ? [] : stampWordGates(n, heights, edits, opts.words, cx, cz, mainVillage);
        if (!opts.hub) stampWordCubes(n, heights, edits, wordCells, opts.words, cx, cz, towns, ponds, treeSet);
        const hollow = {};
        carveCaves(n, heights, hollow, rng, climateName, cx, cz, towns, treeSet, ponds);
        const allHouses = [];
        const allVillagers = [];
        const allBeds = [];
        const allProps = [];
        const allWells = [];
        const allPens = [];
        const allPaths = {};
        const golems = [];
        towns.forEach(function (plan) {
            if (plan.houses) allHouses.push.apply(allHouses, plan.houses);
            if (plan.villagers) allVillagers.push.apply(allVillagers, plan.villagers);
            if (plan.beds) allBeds.push.apply(allBeds, plan.beds);
            if (plan.props) allProps.push.apply(allProps, plan.props);
            if (plan.animals) animals.push.apply(animals, plan.animals);
            if (plan.well) allWells.push(plan.well);
            if (plan.pen) allPens.push(plan.pen);
            if (plan.paths) Object.assign(allPaths, plan.paths);
            if (plan.golem) {
                golems.push({
                    x: plan.golem.x, z: plan.golem.z, kind: 'golem',
                    homeX: plan.golem.x, homeZ: plan.golem.z,
                    yaw: hash3(plan.golem.x, 0, plan.golem.z) * Math.PI * 2,
                    phase: hash3(plan.golem.x, 1, plan.golem.z)
                });
            }
            if (plan.snowgolem) {
                golems.push({
                    x: plan.snowgolem.x, z: plan.snowgolem.z, kind: 'snowgolem',
                    homeX: plan.snowgolem.x, homeZ: plan.snowgolem.z,
                    yaw: hash3(plan.snowgolem.x, 0, plan.snowgolem.z) * Math.PI * 2,
                    phase: hash3(plan.snowgolem.x, 1, plan.snowgolem.z)
                });
            }
        });
        allProps.push.apply(allProps, landmarkProps);
        return {
            seed: seed || 7,
            climate: climateName,
            size: n,
            heights: heights,
            biomes: biomes,
            trees: trees,
            treeCols: buildTreeCols(trees),
            flowers: flowers,
            plants: plants,
            animals: animals,
            placedProps: allProps,
            villagers: allVillagers,
            beds: allBeds,
            garden: mainVillage && mainVillage.garden ? mainVillage.garden : null,
            well: mainVillage && mainVillage.well ? mainVillage.well : null,
            wells: allWells,
            pens: allPens,
            paths: allPaths,
            golems: golems,
            edits: edits,
            ponds: ponds,
            hollow: hollow,
            wordCells: wordCells,
            wordGates: wordGates,
            hub: !!opts.hub,
            levelPortals: levelPortals,
            unlockPost: unlockPost,
            houses: allHouses,
            landmarks: landmarkTags,
            skyMarks: skyMarks,
            surfaceAt: function (x, z) { return surfaceAtWorld(this, x, z); },
            treeAt: function (x, z) {
                return trees.find(function (t) { return t.x === x && t.z === z; }) || null;
            }
        };
    }

    /* ================= 段B：体素查询 ================= */
    /* ---------- 体素占用：高度图 + 树 + 玩家挖掘覆盖 ---------- */
    function rawHeight(world, x, z) {
        if (x < 0 || z < 0 || x >= world.size || z >= world.size) return 0;
        return world.heights[z * world.size + x];
    }

    function oreNoise(x, y, z) {
        let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 2147483647)) >>> 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }

    function oreOrStone(x, y, z, climate) {
        const n = oreNoise(x, y + 11, z);
        const gemCut = climate === 'crystal' ? 0.982 : 0.994;
        const goldCut = climate === 'nether' ? 0.968 : 0.988;
        if (n > gemCut) return 'diamond';
        if (n > goldCut) return 'gold';
        if (n > 0.975) return 'iron';
        if (n > 0.94) return 'coal';
        return 'stone';
    }

    function groundKind(world, x, y, z) {
        const h = rawHeight(world, x, z);
        if (y < 0 || y >= h) return null;
        if (world.climate === 'nether') {
            if (y >= h - 2) return 'stone';
            return oreOrStone(x, y, z, world.climate);
        }
        const biome = biomeAt(world, x, z);
        if (world.climate === 'desert' || biome === 'desert') {
            if (y >= h - 2) return 'sand';
            return oreOrStone(x, y, z, world.climate);
        }
        if (biome === 'snow') {
            if (y === h - 1) return 'snow';
            if (y === h - 2) return 'dirt';
            return oreOrStone(x, y, z, world.climate);
        }
        if (biome === 'mountain' && h >= 11 && y === h - 1 && world.climate !== 'crystal' && world.climate !== 'cherry') return 'stone';
        if (y === h - 1) return 'grass';
        if (y === h - 2) return 'dirt';
        return oreOrStone(x, y, z, world.climate);
    }

    function eachTreeVoxel(tree, fn) {
        const species = tree.species || 'oak';
        for (let i = 0; i < tree.trunk; i += 1) fn(tree.x, tree.surface + i, tree.z, 'log', species);
        const ty = tree.surface + tree.trunk;
        if (species === 'cactus') {
            const h = hash3(tree.x, 9, tree.z);
            const ay = tree.surface + Math.max(1, tree.trunk - 2);
            if (h > 0.32) {
                const dir = h > 0.66 ? 1 : -1;
                fn(tree.x + dir, ay, tree.z, 'log', species);
                if (h > 0.78) fn(tree.x + dir, ay + 1, tree.z, 'log', species);
            }
            if (h < 0.48) fn(tree.x, ay, tree.z + (h < 0.24 ? 1 : -1), 'log', species);
            return;
        }
        if (species === 'crimson') {
            for (let dz = -2; dz <= 2; dz += 1) {
                for (let dx = -2; dx <= 2; dx += 1) {
                    if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
                    fn(tree.x + dx, ty, tree.z + dz, 'leaf', species);
                }
            }
            for (let dz = -1; dz <= 1; dz += 1) {
                for (let dx = -1; dx <= 1; dx += 1) {
                    fn(tree.x + dx, ty + 1, tree.z + dz, 'leaf', species);
                }
            }
            return;
        }
        if (species === 'cherry') {
            for (let ly = 0; ly < 3; ly += 1) {
                const r = ly === 2 ? 1 : 2;
                for (let dz = -r; dz <= r; dz += 1) {
                    for (let dx = -r; dx <= r; dx += 1) {
                        if (dx === 0 && dz === 0 && ly === 0) continue;
                        if (r === 2 && Math.abs(dx) === 2 && Math.abs(dz) === 2 && ly === 0) continue;
                        fn(tree.x + dx, ty - 1 + ly, tree.z + dz, 'leaf', species);
                    }
                }
            }
            fn(tree.x, ty + 2, tree.z, 'leaf', species);
            fn(tree.x + 1, ty - 2, tree.z, 'leaf', species);
            fn(tree.x - 1, ty - 2, tree.z + 1, 'leaf', species);
            return;
        }
        if (species === 'spruce') {
            for (let ly = 0; ly < 5; ly += 1) {
                const r = Math.max(0, 2 - Math.floor(ly / 2));
                const y = ty - 2 + ly;
                for (let dz = -r; dz <= r; dz += 1) {
                    for (let dx = -r; dx <= r; dx += 1) {
                        if (dx === 0 && dz === 0 && ly < 3) continue;
                        if (r > 0 && Math.abs(dx) === r && Math.abs(dz) === r) continue;
                        fn(tree.x + dx, y, tree.z + dz, 'leaf', species);
                    }
                }
            }
            return;
        }
        if (species === 'oak') {
            const h = hash3(tree.x, 11, tree.z);
            [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (p, i) {
                if (h > 0.18 + i * 0.14) fn(tree.x + p[0], ty - 2, tree.z + p[1], 'leaf', species);
            });
            for (let ly = 0; ly < 3; ly += 1) {
                const r = ly === 2 ? 1 : 2;
                for (let dz = -r; dz <= r; dz += 1) {
                    for (let dx = -r; dx <= r; dx += 1) {
                        if (dx === 0 && dz === 0 && ly === 0) continue;
                        if (r === 2 && Math.abs(dx) === 2 && Math.abs(dz) === 2 && (ly === 0 || h < 0.35 + ly * 0.2)) continue;
                        fn(tree.x + dx, ty - 1 + ly, tree.z + dz, 'leaf', species);
                    }
                }
            }
            fn(tree.x, ty + 2, tree.z, 'leaf', species);
            if (h > 0.55) fn(tree.x + 1, ty, tree.z - 1, 'leaf', species);
            if (h < 0.42) fn(tree.x - 1, ty + 1, tree.z + 1, 'leaf', species);
            return;
        }
        const layers = 2;
        for (let ly = 0; ly < layers; ly += 1) {
            const r = species === 'birch' ? 1 : (ly === 0 ? 2 : 1);
            for (let dz = -r; dz <= r; dz += 1) {
                for (let dx = -r; dx <= r; dx += 1) {
                    if (dx === 0 && dz === 0 && ly === 0) continue;
                    if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
                    fn(tree.x + dx, ty - 1 + ly, tree.z + dz, 'leaf', species);
                }
            }
        }
        fn(tree.x, ty + 1, tree.z, 'leaf', species);
    }

    function buildTreeCols(trees) {
        const cols = {};
        (trees || []).forEach(function (tree) {
            eachTreeVoxel(tree, function (x, y, z, kind, species) {
                const key = x + ',' + z;
                if (!cols[key]) cols[key] = {};
                cols[key][y] = { kind: kind, species: species || tree.species || 'oak' };
            });
        });
        return cols;
    }

    function treeVoxelAt(world, x, y, z) {
        if (!world.treeCols) world.treeCols = buildTreeCols(world.trees || []);
        const col = world.treeCols[x + ',' + z];
        return col && col[y] ? col[y] : null;
    }

    function treeKindAt(world, x, y, z) {
        const hit = treeVoxelAt(world, x, y, z);
        return hit ? hit.kind : null;
    }

    function editKey(x, y, z) { return x + ',' + y + ',' + z; }

    function voxelAt(world, x, y, z) {
        if (y < 0 || x < 0 || z < 0 || x >= world.size || z >= world.size) return null;
        if (!world.edits) world.edits = {};
        const key = editKey(x, y, z);
        if (Object.prototype.hasOwnProperty.call(world.edits, key)) return world.edits[key];
        if (world.hollow && world.hollow[key]) return null;
        const tree = treeVoxelAt(world, x, y, z);
        if (tree) return tree.kind;
        if (world.ponds && world.ponds[x + ',' + z] && y === rawHeight(world, x, z) - 1) return 'water';
        return groundKind(world, x, y, z);
    }

    function voxelSpecies(world, x, y, z) {
        const tree = treeVoxelAt(world, x, y, z);
        return tree ? tree.species : null;
    }

    function hasBlock(world, x, y, z) {
        return voxelAt(world, x, y, z) != null;
    }

    function blockKindAt(world, x, y, z) {
        return voxelAt(world, x, y, z);
    }

    function inHouse(world, x, z) {
        const houses = world && world.houses;
        if (!houses || !houses.length) return false;
        const ix = Math.floor(x), iz = Math.floor(z);
        for (let i = 0; i < houses.length; i += 1) {
            const h = houses[i];
            if (ix >= h.x && ix < h.x + h.w && iz >= h.z && iz < h.z + h.d) return true;
        }
        return false;
    }

    function growWheat(world) {
        let n = 0;
        ((world && world.plants) || []).forEach(function (p) {
            if (!p || p.kind !== 'wheat' || p.grown) return;
            p.grown = true;
            if (p.mesh && p.mesh.scale) {
                p.mesh.scale.y = (Number(p.mesh.scale.y) || 1) * 1.7;
                if (p.mesh.position) p.mesh.position.y += 0.14;
            }
            n += 1;
        });
        return n;
    }

    function habitatOf(kind) {
        if (kind === 'bee' || kind === 'phantom' || kind === 'vex' || kind === 'blaze'
            || kind === 'ghast' || kind === 'fire_spirit' || kind === 'wither'
            || kind === 'dragon' || kind === 'storm') return 'air';
        if (kind === 'pufferfish' || kind === 'guardian' || kind === 'elder_guardian') return 'water';
        return 'ground';
    }

    function lifeAltitude(actor, world) {
        const x = Math.floor(actor.x);
        const z = Math.floor(actor.z);
        const surface = world && typeof world.surfaceAt === 'function' ? world.surfaceAt(x, z) : 4;
        const hab = actor.habitat || habitatOf(actor.kind);
        const phase = actor.phase || actor.bob || 0;
        if (actor.rideable) return surface + 0.12;
        const C = global.BlockLegendCombat;
        if (C && typeof C.stanceAltitude === 'function') {
            return C.stanceAltitude(actor.kind, surface, phase, { habitat: hab });
        }
        if (hab === 'water') return surface - 0.05 + Math.sin(phase * 2.4) * 0.08;
        if (hab === 'air') return surface + 2.4 + Math.sin(phase * 3.1) * 0.22;
        if (actor.kind === 'chicken' || actor.kind === 'slime' || actor.kind === 'magma') {
            return surface + Math.abs(Math.sin(phase * 8)) * 0.22;
        }
        return surface;
    }

    function wanderBlocked(world, nx, nz, actor, hab) {
        const size = (world && world.size) || 64;
        if (nx <= 2 || nz <= 2 || nx >= size - 2 || nz >= size - 2) return true;
        const inWater = !!(world.ponds && world.ponds[Math.floor(nx) + ',' + Math.floor(nz)]);
        if (hab === 'water' ? !inWater : inWater) return true;
        if (hab === 'air') return false;
        if (inHouse(world, nx, nz) && !actor.role) return true;
        if (!world || typeof world.surfaceAt !== 'function' || !world.heights) return false;
        const feetY = world.surfaceAt(Math.floor(actor.x), Math.floor(actor.z));
        return columnBlockedAt(world, nx, nz, feetY);
    }

    function stepWander(actor, dt, world, opts) {
        const o = opts || {};
        const speed = o.speed != null ? o.speed : 0.7;
        const homeR = o.homeR != null ? o.homeR : (actor.pen ? 2.2 : 10);
        const hab = actor.habitat || habitatOf(actor.kind);
        actor.phase = (actor.phase || 0) + dt;
        actor.yaw = actor.yaw || 0;
        if (actor.homeX == null) actor.homeX = actor.x;
        if (actor.homeZ == null) actor.homeZ = actor.z;
        if ((actor.phase * 3) % 4 < dt * 3) {
            actor.yaw += (hash3(Math.floor(actor.x), 2, Math.floor(actor.z)) - 0.5) * 1.6;
        }
        const hx = actor.x - actor.homeX;
        const hz = actor.z - actor.homeZ;
        if (hx * hx + hz * hz > homeR * homeR) {
            actor.yaw = Math.atan2(actor.homeX - actor.x, actor.homeZ - actor.z);
        }
        const step = speed * dt;
        const hereBlocked = wanderBlocked(world, actor.x, actor.z, actor, hab);
        const stride = hereBlocked ? Math.max(step, 0.55) : step;
        const nx = actor.x + Math.sin(actor.yaw) * stride;
        const nz = actor.z + Math.cos(actor.yaw) * stride;
        const onPath = function (x, z) {
            return !!(world && world.paths && world.paths[Math.floor(x) + ',' + Math.floor(z)]);
        };
        if (actor.role && world && world.paths && !wanderBlocked(world, nx, nz, actor, hab)) {
            const nextOk = onPath(nx, nz) || inHouse(world, nx, nz);
            const hereOk = onPath(actor.x, actor.z) || inHouse(world, actor.x, actor.z);
            if (hereOk && !nextOk) {
                actor.yaw += (hash3(Math.floor(actor.x * 4), 7, Math.floor(actor.z * 4)) > 0.5 ? 1 : -1) * 1.15;
                return false;
            }
        }
        if (wanderBlocked(world, nx, nz, actor, hab)) {
            actor.yaw += (hash3(Math.floor(actor.x * 4), 7, Math.floor(actor.z * 4)) > 0.5 ? 1 : -1) * 1.15;
            return false;
        }
        actor.x = nx;
        actor.z = nz;
        return true;
    }

    function ensureWalkTick(mesh) {
        if (!mesh) return mesh;
        mesh.userData = mesh.userData || {};
        if (mesh.userData._walkWrapped) return mesh;
        const prev = mesh.userData.tick;
        mesh.userData._walkWrapped = true;
        mesh.userData.tick = function (t, moving) {
            if (typeof prev === 'function') prev.call(mesh, t, moving);
            mesh.rotation.z = Math.sin(t * (moving ? 8 : 2.2)) * (moving ? 0.07 : 0.02);
        };
        return mesh;
    }

    function columnBlockedAt(world, px, pz, feetY) {
        const cx = Math.floor(px), cz = Math.floor(pz);
        if (!world) return true;
        if (world.surfaceAt(cx, cz) - feetY > STEP_UP) return true;
        const y0 = Math.floor(feetY + 0.35);
        const y1 = Math.floor(feetY + 1.55);
        for (let y = y0; y <= y1; y += 1) {
            const kind = voxelAt(world, cx, y, cz);
            if (kind && kind !== 'water') return true;
        }
        return false;
    }

    function wallBetween(world, ax, ay, az, bx, by, bz) {
        const dx = bx - ax, dy = by - ay, dz = bz - az;
        const dist = Math.hypot(dx, dy, dz) || 1;
        const steps = Math.max(4, Math.ceil(dist / 0.12));
        const minY = Math.min(ay, by) - 0.25;
        const stop = Math.max(0.2, dist - 0.35);
        for (let i = 1; i < steps; i += 1) {
            const t = i / steps;
            if (t * dist > stop) break;
            const y = ay + dy * t;
            if (y < minY) continue;
            const kind = voxelAt(world, Math.floor(ax + dx * t), Math.floor(y), Math.floor(az + dz * t));
            if (kind && kind !== 'water') return true;
        }
        return false;
    }

    function isGroundKind(kind) {
        return kind === 'grass' || kind === 'dirt' || kind === 'stone' || kind === 'sand' || kind === 'snow'
            || kind === 'water' || kind === 'coal' || kind === 'iron' || kind === 'gold' || kind === 'diamond' || kind === 'plank';
    }

    function surfaceAtWorld(world, x, z) {
        if (x < 0 || z < 0 || x >= world.size || z >= world.size) return HEIGHT_MAX + 4;
        const top = rawHeight(world, x, z);
        for (let y = top - 1; y >= 0; y -= 1) {
            const kind = voxelAt(world, x, y, z);
            if (kind && isGroundKind(kind)) return y + 1;
        }
        return 0;
    }

    function removeTree(world, tree) {
        if (!tree || !world.trees) return { ok: false };
        const idx = world.trees.indexOf(tree);
        const target = idx >= 0 ? tree : world.treeAt(tree.x, tree.z);
        if (!target) return { ok: false };
        const at = world.trees.indexOf(target);
        if (at < 0) return { ok: false };
        world.trees.splice(at, 1);
        world.treeCols = buildTreeCols(world.trees);
        return { ok: true, drop: 'oak-log', x: target.x, z: target.z, y: target.surface, kind: 'log' };
    }

    function breakVoxel(world, x, y, z) {
        if (y <= 0) return { ok: false };
        const kind = voxelAt(world, x, y, z);
        if (!kind) return { ok: false };
        if (!world.edits) world.edits = {};
        world.edits[editKey(x, y, z)] = null;
        const drop = (global.BlockLegendTools && global.BlockLegendTools.dropOf)
            ? global.BlockLegendTools.dropOf(kind)
            : kind;
        return { ok: true, kind: kind, drop: drop, x: x, y: y, z: z };
    }

    function columnScanYEnd(surface, heightMax) {
        const cap = (Number(heightMax) > 0 ? Number(heightMax) : HEIGHT_MAX) + 16;
        const top = (Number(surface) || 0) + 20;
        return Math.min(cap, Math.max(12, top));
    }

    function placeVoxel(world, x, y, z, kind) {
        const allowed = { dirt: true, stone: true, log: true, plank: true, table: true, sand: true, glass: true, tnt: true };
        if (y <= 0 || !allowed[kind]) return { ok: false };
        if (voxelAt(world, x, y, z)) return { ok: false };
        if (x < 0 || z < 0 || x >= world.size || z >= world.size) return { ok: false };
        if (!world.edits) world.edits = {};
        world.edits[editKey(x, y, z)] = kind;
        return { ok: true, kind: kind, x: x, y: y, z: z };
    }

    global.BlockLegendWorld = {
        WORLD_SIZE, HEIGHT_MAX, STEP_UP, TREE_COUNT, FLOWER_COUNT, BIOME_NAMES, CLIMATES,
        makeRng, hash3, climateOf, makeGrid, sampleGrid, pickBiome, biomeAt, ridgeSigned,
        inRect, inAnyRect, villageStyle, villageMats, villagePlan, hamletPlans,
        fillPond, stampRiver, stampRidge, stampPonds, stampVillage, yAt, setY,
        putBlock, flattenPad, defaultHubPortalSpecs, levelPortalBoxes,
        hubKeepoutBoxes, paveTop, hubLineCells, stampHubRoad, stampHubLetters,
        stampHubBuilding, stampTowerAt, stampLevelPortals, stampUnlockPost,
        stampTower, stampPillar, stampCrater, stampLandmarks, stampSkyMark, stampWordCubes,
        addWordArch, stampWordGates, openWordGate, carveCaves, createWorld,
        rawHeight, oreNoise, oreOrStone, groundKind, eachTreeVoxel,
        buildTreeCols, treeVoxelAt, treeKindAt, editKey, voxelAt, voxelSpecies,
        hasBlock, blockKindAt, inHouse, growWheat, habitatOf, lifeAltitude,
        wanderBlocked, stepWander, ensureWalkTick, columnBlockedAt, wallBetween,
        isGroundKind, surfaceAtWorld, removeTree, breakVoxel, placeVoxel,
        columnScanYEnd
    };
})(typeof window !== 'undefined' ? window : globalThis);
