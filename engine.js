/**
 * blocklegend · 引擎层（T20260815-blocklegend-3d S1 + 体素地面）
 * three.js r147 UMD（本地 vendor，禁 CDN）。
 * 职责：种子化 384×384 多气候世界 + 洞穴/矿脉/河流/村庄/山脊 + 按玩家半径流式区块 + 第一人称控制。
 * 体素填充/遮挡裁剪改自 dgreenheck/minecraft-threejs-clone（WorldChunk.generateTerrain
 * + isBlockObscured）：列内从 y=0 填到地表，只画邻格为空的单位面。
 * 区块流式改自同仓 scripts/world.js drawDistance：只建玩家半径内区块，离开则 dispose。
 * 性能约束（MuMu WebView）：低模、每区块一次 draw call、pixelRatio ≤ 1.5、无阴影。
 */
(function (global) {
    'use strict';

    /* ---------- 渲染/物理常量（气候与世界尺寸以 world-gen 为准） ---------- */
    const CHUNK = 16;           // 区块边长
    const VIEW_CHUNKS = 4;      // 玩家周围半径（区块）
    const MOBILE_VIEW_CHUNKS = 2; // 手机/APK：5×5 区块，少卡
    const BOOT_CHUNKS = 1;      // 首屏只建 3×3
    const PIXEL_RATIO_CAP = 1.5;
    const MOBILE_PIXEL_RATIO = 1;
    const EYE_HEIGHT = 1.62;
    const MOVE_SPEED = 4.2;     // 格/秒
    const JUMP_VY = 7.2;        // 格/秒
    const GRAVITY = 22;         // 格/秒²
    const MAX_DT = 0.05;        // 挂起恢复时防大步长穿地
    function moveSpeedMul(input) {
        let m = 1;
        if (input && input.boost) m *= 1.45;
        if (input && input.sneak) m *= 0.42;
        return m;
    }
    const ATLAS_TILE = 16;
    const ATLAS_COLS = 4;
    const ATLAS_ROWS = 9;       // 0–19 旧地形/裂纹锁定；20+ 气候/矿石
    const CRACK_TILE0 = 16;     // 第 5 行：crack 0–3

    /* 世界生成 + 体素查询纯函数已抽到 data/world-gen.js（须先于本文件加载） */
    const W = global.BlockLegendWorld;
    if (!W) {
        throw new Error('BlockLegendWorld missing; load data/world-gen.js first');
    }
    const {
        WORLD_SIZE, HEIGHT_MAX, STEP_UP, TREE_COUNT,
        makeRng, hash3, climateOf, biomeAt, openWordGate, createWorld,
        breakVoxel, placeVoxel, voxelAt, voxelSpecies, hasBlock, blockKindAt,
        inHouse, habitatOf, lifeAltitude, stepWander, growWheat, harvestWheat, catchFish,
        columnBlockedAt, wallBetween, removeTree, surfaceAtWorld, buildTreeCols,
        ensureWalkTick
    } = W;

    function clamp01(n) {
        return n < 0 ? 0 : n > 1 ? 1 : n;
    }

    /* ---------- 调色 ---------- */
    function blockColor(kind, x, y, z, species, climate) {
        const v = hash3(x, y, z) * 0.1 - 0.05;
        const grass = climate === 'cherry' ? [0.78, 0.62, 0.72]
            : climate === 'duskvale' ? [0.78, 0.58, 0.32]
            : climate === 'crystal' ? [0.42, 0.78, 0.74]
            : climate === 'snow' ? [0.86, 0.92, 0.88]
            : climate === 'mushroom' ? [0.72, 0.48, 0.70]
            : climate === 'volcano' ? [0.42, 0.22, 0.16]
            : climate === 'deep_dark' ? [0.16, 0.28, 0.30]
            : climate === 'end' ? [0.42, 0.28, 0.58]
            : climate === 'ocean' ? [0.36, 0.70, 0.52]
            : [0.64, 0.86, 0.48];
        const log = species === 'cactus' ? [0.28, 0.62, 0.32]
            : species === 'crimson' ? [0.46, 0.16, 0.18]
            : species === 'cherry' ? [0.58, 0.34, 0.40]
            : species === 'birch' ? [0.94, 0.90, 0.80]
            : species === 'spruce' ? [0.72, 0.58, 0.42]
            : [0.92, 0.74, 0.52];
        const leaf = species === 'cactus' ? [0.35, 0.76, 0.37]
            : species === 'crimson' ? [0.89, 0.24, 0.30]
            : species === 'cherry' ? [1.00, 0.63, 0.82]
            : species === 'birch' ? [0.86, 1.00, 0.56]
            : species === 'spruce' ? [0.56, 0.86, 0.63]
            : [0.73, 0.99, 0.56];
        const pal = {
            grass: grass,
            dirt: [0.90, 0.74, 0.54],
            sand: [0.91, 0.82, 0.52],
            snow: [0.92, 0.95, 0.98],
            stone: climate === 'nether' ? [0.42, 0.18, 0.16] : [0.62, 0.62, 0.65],
            log: log,
            leaf: leaf,
            water: [0.22, 0.48, 0.78],
            coal: [0.28, 0.28, 0.3],
            iron: [0.78, 0.7, 0.52],
            gold: [0.94, 0.78, 0.28],
            diamond: [0.42, 0.86, 0.88],
            plank: [0.90, 0.72, 0.48],
            table: [0.78, 0.52, 0.28],
            word: [0.95, 0.78, 0.28],
            gate: [0.86, 0.62, 0.18],
            gravel: [0.70, 0.66, 0.58],
            clay: [0.82, 0.50, 0.36],
            sandstone: [0.88, 0.76, 0.48],
            stone_brick: [0.58, 0.56, 0.55],
            brick: [0.72, 0.32, 0.22],
            wool: [0.94, 0.92, 0.88],
            carpet: [0.94, 0.90, 0.86],
            slab: [0.88, 0.70, 0.46],
            stairs: [0.86, 0.68, 0.44],
            trapdoor: [0.80, 0.58, 0.34],
            coal_block: [0.22, 0.22, 0.24],
            iron_block: [0.82, 0.82, 0.86],
            gold_block: [0.96, 0.82, 0.28],
            diamond_block: [0.48, 0.90, 0.92],
            snow_block: [0.94, 0.96, 0.98],
            ice: [0.62, 0.84, 0.94],
            packed_ice: [0.48, 0.72, 0.92],
            quartz: [0.92, 0.88, 0.82],
            quartz_block: [0.94, 0.90, 0.86],
            hay: [0.86, 0.74, 0.28]
        };
        const base = pal[kind] || pal.dirt;
        if (kind === 'leaf') {
            // 第二颗种子，避免与 v 同向只压暗；通道同加不偏色
            const j = hash3(x + 17, y + 9, z + 3) * 0.12 - 0.06;
            return [clamp01(base[0] + v + j), clamp01(base[1] + v + j), clamp01(base[2] + v + j)];
        }
        if (climate === 'nether' && kind !== 'log' && kind !== 'leaf') {
            return [base[0] * 0.72 + 0.22 + v, base[1] * 0.38 + 0.04 + v, base[2] * 0.34 + 0.02 + v];
        }
        return [base[0] + v, base[1] + v, base[2] + v];
    }

    // 草块侧面/底面按 dirt 上色（同 dgreenheck grass material 六面贴图分工）
    function faceKind(kind, dir) {
        if (kind === 'grass' && dir !== '+y') return 'dirt';
        if (kind === 'snow' && dir !== '+y') return 'dirt';
        return kind;
    }

    function faceShade(dir) {
        if (dir === '+y') return 1;
        if (dir === '-y') return 0.5;
        if (dir === '+x' || dir === '-x') return 0.6;
        return 0.8;
    }

    function tileIndex(kind, dir, species, climate) {
        if (kind === 'crack') {
            const stage = Math.max(0, Math.min(3, Number(dir) || 0));
            return CRACK_TILE0 + stage;
        }
        if (kind === 'grass') {
            if (dir === '+y') {
                if (climate === 'cherry') return 23;
                if (climate === 'duskvale') return 29;
                if (climate === 'crystal') return 30;
                return 0;
            }
            if (dir === '-y') return 2;
            return 1;
        }
        if (kind === 'sand') return 24;
        if (kind === 'dirt') return 2;
        if (kind === 'snow') return dir === '+y' || dir === '-y' ? 0 : 2;
        if (kind === 'stone') return climate === 'nether' ? 25 : 3;
        if (kind === 'log') {
            if (species === 'cactus') return 28;
            if (species === 'crimson') return 26;
            if (species === 'cherry') return (dir === '+y' || dir === '-y') ? 21 : 20;
            if (species === 'birch') return (dir === '+y' || dir === '-y') ? 9 : 8;
            if (species === 'spruce') return (dir === '+y' || dir === '-y') ? 12 : 11;
            return (dir === '+y' || dir === '-y') ? 5 : 4;
        }
        if (kind === 'leaf') {
            if (species === 'cactus') return 28;
            if (species === 'crimson') return 27;
            if (species === 'cherry') return 22;
            if (species === 'birch') return 10;
            if (species === 'spruce') return 13;
            return 6;
        }
        if (kind === 'water') return 14;
        if (kind === 'coal') return 15;
        if (kind === 'gold') return 32;
        if (kind === 'diamond') return 33;
        if (kind === 'iron') return 3;
        if (kind === 'plank') return 5;
        if (kind === 'table') return 5;
        if (kind === 'word' || kind === 'gate') return 7;
        if (kind === 'glass') return 14;
        if (kind === 'tnt') return 34;
        if (kind === 'gravel') return 3;
        if (kind === 'clay') return 2;
        if (kind === 'sandstone') return 24;
        if (kind === 'stone_brick') return 3;
        if (kind === 'brick') return 25;
        if (kind === 'wool' || kind === 'carpet') return 0;
        if (kind === 'ice' || kind === 'packed_ice') return 14;
        if (kind === 'quartz' || kind === 'quartz_block' || kind === 'snow_block') return 0;
        if (kind === 'coal_block') return 15;
        if (kind === 'gold_block') return 32;
        if (kind === 'diamond_block') return 33;
        if (kind === 'iron_block') return 3;
        if (kind === 'slab' || kind === 'stairs' || kind === 'trapdoor' || kind === 'campfire' || kind === 'hay') return 5;
        return 2;
    }

    function tileCornersUV(index) {
        const w = ATLAS_TILE * ATLAS_COLS;
        const h = ATLAS_TILE * ATLAS_ROWS;
        const col = index % ATLAS_COLS;
        const row = Math.floor(index / ATLAS_COLS);
        const padU = 0.5 / w;
        const padV = 0.5 / h;
        const u0 = col * ATLAS_TILE / w + padU;
        const u1 = (col + 1) * ATLAS_TILE / w - padU;
        const v1 = 1 - row * ATLAS_TILE / h - padV;
        const v0 = 1 - (row + 1) * ATLAS_TILE / h + padV;
        return [[u0, v0], [u0, v1], [u1, v1], [u1, v0]];
    }

    // 图集画法移植自 Fable5-mc src/textures.js（noiseFill/speckle/年轮/锯齿草沿），无外部贴图
    function makeBlockAtlas() {
        const tile = ATLAS_TILE;
        const canvas = document.createElement('canvas');
        canvas.width = tile * ATLAS_COLS;
        canvas.height = tile * ATLAS_ROWS;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        function px(tx, ty, x, y, r, g, b, a) {
            const alpha = a == null ? 255 : a;
            ctx.fillStyle = 'rgba(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ',' + (alpha / 255) + ')';
            ctx.fillRect(tx * tile + x, ty * tile + y, 1, 1);
        }
        function n2(x, y, s) {
            return hash3(x * 17 + s, y * 31 + s, s * 13);
        }
        function lum(x, y, s, amt) {
            return 1 + (n2(x, y, s) - 0.5) * 2 * amt;
        }
        function mul(c, f) {
            return [c[0] * f, c[1] * f, c[2] * f];
        }
        const C = {
            grass: [126, 208, 72],
            dirt: [198, 152, 104],
            dirtDark: [156, 114, 74],
            dirtLight: [226, 184, 128],
            stone: [127, 127, 127],
            oak: [204, 156, 96],
            oakDark: [158, 114, 72],
            oakHeart: [232, 196, 140],
            birch: [240, 232, 214],
            birchDark: [120, 108, 90],
            spruce: [148, 114, 78],
            oakLeaf: [124, 200, 66],
            birchLeaf: [168, 216, 104],
            spruceLeaf: [110, 176, 122],
            cherry: [148, 86, 96],
            cherryDark: [92, 48, 58],
            cherryHeart: [210, 168, 150],
            cherryLeaf: [236, 132, 178],
            cherryGrass: [186, 148, 168],
            sand: [232, 206, 128],
            sandDark: [198, 168, 88],
            nether: [98, 36, 32],
            netherDark: [58, 18, 16],
            crimson: [118, 42, 48],
            crimsonDark: [64, 18, 22],
            crimsonCap: [196, 48, 62],
            cactus: [72, 148, 64],
            cactusDark: [36, 88, 40],
            duskGrass: [196, 132, 64],
            crystalGrass: [88, 186, 176]
        };
        function paintDirtTile(tx, ty, seed) {
            for (let y = 0; y < tile; y += 1) {
                for (let x = 0; x < tile; x += 1) {
                    const c = mul(C.dirt, lum(x, y, seed, 0.1));
                    px(tx, ty, x, y, c[0], c[1], c[2]);
                }
            }
            for (let i = 0; i < 24; i += 1) {
                const x = Math.floor(n2(i, 1, seed + 3) * tile);
                const y = Math.floor(n2(i, 2, seed + 4) * tile);
                px(tx, ty, x, y, C.dirtDark[0], C.dirtDark[1], C.dirtDark[2]);
            }
            for (let i = 0; i < 12; i += 1) {
                const x = Math.floor(n2(i, 3, seed + 5) * tile);
                const y = Math.floor(n2(i, 4, seed + 6) * tile);
                px(tx, ty, x, y, C.dirtLight[0], C.dirtLight[1], C.dirtLight[2]);
            }
        }
        function paintGrassTop(tx, ty) {
            for (let y = 0; y < tile; y += 1) {
                for (let x = 0; x < tile; x += 1) {
                    const c = mul(C.grass, lum(x, y, 1, 0.1));
                    px(tx, ty, x, y, c[0], c[1], c[2]);
                }
            }
            for (let i = 0; i < 26; i += 1) {
                const x = Math.floor(n2(i, 8, 11) * tile);
                const y = Math.floor(n2(i, 9, 12) * tile);
                const c = mul(C.grass, 0.9);
                px(tx, ty, x, y, c[0], c[1], c[2]);
            }
            for (let i = 0; i < 14; i += 1) {
                const x = Math.floor(n2(i, 10, 13) * tile);
                const y = Math.floor(n2(i, 11, 14) * tile);
                const c = mul(C.grass, 1.18);
                px(tx, ty, x, y, c[0], c[1], c[2]);
            }
        }
        function paintGrassSide(tx, ty) {
            paintDirtTile(tx, ty, 20);
            for (let x = 0; x < tile; x += 1) {
                const depth = 2 + Math.floor(n2(x, 0, 21) * 2.4);
                for (let y = 0; y < depth; y += 1) {
                    const c = mul(C.grass, lum(x, y, 22, 0.1));
                    px(tx, ty, x, y, c[0], c[1], c[2]);
                }
                const edge = mul(C.grass, 0.82);
                px(tx, ty, x, depth, edge[0], edge[1], edge[2]);
            }
        }
        function paintStone(tx, ty) {
            for (let y = 0; y < tile; y += 1) {
                for (let x = 0; x < tile; x += 1) {
                    const c = mul(C.stone, lum(x, y, 30, 0.07));
                    px(tx, ty, x, y, c[0], c[1], c[2]);
                }
            }
            for (let i = 0; i < 9; i += 1) {
                const x0 = Math.floor(n2(i, 0, 31) * 14);
                const y0 = Math.floor(n2(i, 1, 32) * tile);
                const len = 2 + Math.floor(n2(i, 2, 33) * 3);
                for (let k = 0; k < len; k += 1) {
                    const c = mul(C.stone, 0.82 + n2(i, k, 34) * 0.06);
                    px(tx, ty, x0 + k, y0, c[0], c[1], c[2]);
                }
            }
        }
        function paintLogSide(tx, ty, bark, dark, seed) {
            for (let x = 0; x < tile; x += 1) {
                const f = 0.82 + n2(x, 0, seed) * 0.36;
                for (let y = 0; y < tile; y += 1) {
                    const c = mul(bark, f * lum(x, y, seed + 1, 0.07));
                    px(tx, ty, x, y, c[0], c[1], c[2]);
                }
            }
            for (let y = 0; y < tile; y += 1) {
                px(tx, ty, 0, y, dark[0] * 0.95, dark[1] * 0.95, dark[2] * 0.95);
                px(tx, ty, 15, y, dark[0] * 0.95, dark[1] * 0.95, dark[2] * 0.95);
            }
        }
        function paintLogTop(tx, ty, bark, heart, seed) {
            for (let y = 0; y < tile; y += 1) {
                for (let x = 0; x < tile; x += 1) {
                    const ring = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)) | 0;
                    const c = ring >= 6
                        ? mul(bark, lum(x, y, seed, 0.08))
                        : mul(ring % 2 === 0 ? heart : bark, lum(x, y, seed + 1, 0.05));
                    px(tx, ty, x, y, c[0], c[1], c[2]);
                }
            }
        }
        function paintLeaf(tx, ty, base, seed) {
            for (let y = 0; y < tile; y += 1) {
                for (let x = 0; x < tile; x += 1) {
                    const edge = Math.min(x, y, 15 - x, 15 - y);
                    const hole = n2(x, y, seed) < (edge < 2 ? 0.22 : 0.05);
                    if (hole) {
                        px(tx, ty, x, y, 0, 0, 0, 0);
                        continue;
                    }
                    const roll = n2(x, y, seed + 1);
                    const f = roll < 0.16 ? 0.62 : roll < 0.42 ? 0.86 : roll < 0.78 ? 1.08 : 1.32;
                    const c = mul(base, f * lum(x, y, seed + 2, 0.05));
                    px(tx, ty, x, y, c[0], c[1], c[2]);
                }
            }
        }
        function paintCloud(tx, ty) {
            for (let y = 0; y < tile; y += 1) {
                for (let x = 0; x < tile; x += 1) {
                    const cl = n2(x, y, 8);
                    px(tx, ty, x, y, 236 + cl * 16, 240 + cl * 12, 246);
                }
            }
        }
        function paintWord(tx, ty) {
            for (let y = 0; y < tile; y += 1) {
                for (let x = 0; x < tile; x += 1) {
                    const edge = x === 0 || y === 0 || x === 15 || y === 15;
                    if (edge) {
                        px(tx, ty, x, y, 118, 72, 28);
                        continue;
                    }
                    const c = mul([236, 196, 72], lum(x, y, 90, 0.1));
                    px(tx, ty, x, y, c[0], c[1], c[2]);
                }
            }
            for (let y = 4; y <= 11; y += 1) {
                px(tx, ty, 5, y, 70, 42, 18);
                px(tx, ty, 10, y, 70, 42, 18);
            }
            for (let x = 5; x <= 10; x += 1) {
                px(tx, ty, x, 4, 70, 42, 18);
                px(tx, ty, x, 8, 70, 42, 18);
            }
        }
        function paintWater(tx, ty) {
            for (let y = 0; y < tile; y += 1) {
                for (let x = 0; x < tile; x += 1) {
                    const wave = 0.88 + n2(x, y, 70) * 0.18 + ((x + y) % 5 === 0 ? 0.08 : 0);
                    px(tx, ty, x, y, 36 * wave, 92 * wave, 168 * wave);
                }
            }
            for (let i = 0; i < 10; i += 1) {
                const x = Math.floor(n2(i, 1, 71) * tile);
                const y = Math.floor(n2(i, 2, 72) * tile);
                px(tx, ty, x, y, 120, 190, 230);
            }
        }
        function paintCoal(tx, ty) {
            for (let y = 0; y < tile; y += 1) {
                for (let x = 0; x < tile; x += 1) {
                    const c = mul([52, 52, 56], lum(x, y, 80, 0.12));
                    px(tx, ty, x, y, c[0], c[1], c[2]);
                }
            }
            for (let i = 0; i < 18; i += 1) {
                const x = Math.floor(n2(i, 1, 81) * tile);
                const y = Math.floor(n2(i, 2, 82) * tile);
                px(tx, ty, x, y, 18, 18, 20);
            }
            for (let i = 0; i < 6; i += 1) {
                const x = Math.floor(n2(i, 3, 83) * tile);
                const y = Math.floor(n2(i, 4, 84) * tile);
                px(tx, ty, x, y, 90, 90, 96);
            }
        }
        function paintCrack(tx, ty, stage) {
            for (let y = 0; y < tile; y += 1) {
                for (let x = 0; x < tile; x += 1) px(tx, ty, x, y, 0, 0, 0, 0);
            }
            const lines = [
                [[3, 1], [7, 6], [5, 11], [8, 15]],
                [[12, 0], [10, 5], [13, 9], [11, 15]],
                [[0, 8], [4, 7], [8, 9], [15, 8]],
                [[6, 0], [6, 7], [9, 10], [4, 14]]
            ];
            const count = stage + 1;
            for (let i = 0; i < count; i += 1) {
                const pts = lines[i];
                for (let p = 0; p < pts.length - 1; p += 1) {
                    const a = pts[p], b = pts[p + 1];
                    const steps = 8;
                    for (let s = 0; s <= steps; s += 1) {
                        const t = s / steps;
                        const x = Math.round(a[0] + (b[0] - a[0]) * t);
                        const y = Math.round(a[1] + (b[1] - a[1]) * t);
                        px(tx, ty, x, y, 20, 16, 12, 220);
                        if (stage >= 2) px(tx, ty, x + 1, y, 12, 10, 8, 160);
                    }
                }
            }
        }
        const AtlasPaint = global.BlockLegendAtlasPaint;
        const useCore = AtlasPaint && typeof AtlasPaint.paintCore === 'function';
        if (useCore) {
            AtlasPaint.paintCore(function (index, x, y, r, g, b, a) {
                px(index % ATLAS_COLS, Math.floor(index / ATLAS_COLS), x, y, r, g, b, a);
            });
        } else {
            paintGrassTop(0, 0);
            paintGrassSide(1, 0);
            paintDirtTile(2, 0, 3);
            paintStone(3, 0);
            paintLogSide(0, 1, C.oak, C.oakDark, 5);
            paintLogTop(1, 1, C.oak, C.oakHeart, 6);
            paintLeaf(2, 1, C.oakLeaf, 7);
        }
        paintWord(3, 1);
        paintLogSide(0, 2, C.birch, C.birchDark, 9);
        paintLogTop(1, 2, C.birch, [236, 228, 210], 10);
        paintLeaf(2, 2, C.birchLeaf, 11);
        paintLogSide(3, 2, C.spruce, [48, 36, 22], 12);
        paintLogTop(0, 3, C.spruce, [148, 113, 64], 13);
        paintLeaf(1, 3, C.spruceLeaf, 14);
        paintWater(2, 3);
        paintCoal(3, 3);
        paintCrack(0, 4, 0);
        paintCrack(1, 4, 1);
        paintCrack(2, 4, 2);
        paintCrack(3, 4, 3);
        function paintTintedGrass(tx, ty, base, seed) {
            for (let y = 0; y < tile; y += 1) {
                for (let x = 0; x < tile; x += 1) {
                    const c = mul(base, lum(x, y, seed, 0.12));
                    px(tx, ty, x, y, c[0], c[1], c[2]);
                }
            }
            for (let i = 0; i < 18; i += 1) {
                const x = Math.floor(n2(i, 8, seed + 2) * tile);
                const y = Math.floor(n2(i, 9, seed + 3) * tile);
                const c = mul(base, 1.16);
                px(tx, ty, x, y, c[0], c[1], c[2]);
            }
        }
        function paintSand(tx, ty) {
            for (let y = 0; y < tile; y += 1) {
                for (let x = 0; x < tile; x += 1) {
                    const c = mul(C.sand, lum(x, y, 60, 0.08));
                    px(tx, ty, x, y, c[0], c[1], c[2]);
                }
            }
            for (let i = 0; i < 20; i += 1) {
                const x = Math.floor(n2(i, 1, 61) * tile);
                const y = Math.floor(n2(i, 2, 62) * tile);
                px(tx, ty, x, y, C.sandDark[0], C.sandDark[1], C.sandDark[2]);
            }
        }
        function paintNether(tx, ty) {
            for (let y = 0; y < tile; y += 1) {
                for (let x = 0; x < tile; x += 1) {
                    const c = mul(C.nether, lum(x, y, 63, 0.1));
                    px(tx, ty, x, y, c[0], c[1], c[2]);
                }
            }
            for (let i = 0; i < 14; i += 1) {
                const x = Math.floor(n2(i, 1, 64) * tile);
                const y = Math.floor(n2(i, 2, 65) * tile);
                px(tx, ty, x, y, C.netherDark[0], C.netherDark[1], C.netherDark[2]);
            }
            for (let i = 0; i < 5; i += 1) {
                const x = Math.floor(n2(i, 3, 66) * tile);
                const y = Math.floor(n2(i, 4, 67) * tile);
                px(tx, ty, x, y, 180, 72, 36);
            }
        }
        function paintCactus(tx, ty) {
            for (let x = 0; x < tile; x += 1) {
                const rib = x % 4 === 0;
                for (let y = 0; y < tile; y += 1) {
                    const c = mul(rib ? C.cactusDark : C.cactus, lum(x, y, 68, 0.08));
                    px(tx, ty, x, y, c[0], c[1], c[2]);
                }
            }
        }
        paintLogSide(0, 5, C.cherry, C.cherryDark, 40);
        paintLogTop(1, 5, C.cherry, C.cherryHeart, 41);
        paintLeaf(2, 5, C.cherryLeaf, 42);
        paintTintedGrass(3, 5, C.cherryGrass, 43);
        if (!useCore) paintSand(0, 6);
        paintNether(1, 6);
        paintLogSide(2, 6, C.crimson, C.crimsonDark, 50);
        paintLeaf(3, 6, C.crimsonCap, 51);
        paintCactus(0, 7);
        paintTintedGrass(1, 7, C.duskGrass, 52);
        paintTintedGrass(2, 7, C.crystalGrass, 53);
        function paintOre(tx, ty, base, spark, seed) {
            for (let y = 0; y < tile; y += 1) {
                for (let x = 0; x < tile; x += 1) {
                    const c = mul(C.stone, lum(x, y, seed, 0.08));
                    px(tx, ty, x, y, c[0], c[1], c[2]);
                }
            }
            for (let i = 0; i < 16; i += 1) {
                const x = Math.floor(n2(i, 1, seed + 2) * tile);
                const y = Math.floor(n2(i, 2, seed + 3) * tile);
                px(tx, ty, x, y, base[0], base[1], base[2]);
                if (i % 3 === 0) px(tx, ty, x, y, spark[0], spark[1], spark[2]);
            }
        }
        paintOre(0, 8, [214, 176, 48], [255, 230, 120], 70);
        paintOre(1, 8, [72, 210, 214], [180, 250, 255], 71);
        function paintTnt(tx, ty) {
            for (let y = 0; y < tile; y += 1) {
                for (let x = 0; x < tile; x += 1) {
                    const band = y >= 6 && y <= 9;
                    const c = band ? [236, 232, 224] : ((x + y) % 2 ? [196, 62, 42] : [168, 40, 28]);
                    px(tx, ty, x, y, c[0], c[1], c[2]);
                }
            }
        }
        paintTnt(2, 8);
        if (AtlasPaint && typeof AtlasPaint.paintLeaves === 'function') {
            AtlasPaint.paintLeaves(function (index, x, y, r, g, b, a) {
                px(index % ATLAS_COLS, Math.floor(index / ATLAS_COLS), x, y, r, g, b, a);
            });
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.generateMipmaps = false;
        tex.needsUpdate = true;
        if ('encoding' in tex && THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
        return tex;
    }


    // 单位立方体面：corners 逆时针朝向法线，跨度恒为 1
    const FACE_DIRS = [
        { dir: '+y', dx: 0, dy: 1, dz: 0, nrm: [0, 1, 0], t1: [0, 0, 1], t2: [1, 0, 0], sc: [[-1, -1], [1, -1], [1, 1], [-1, 1]], corners: function (x, y, z) { return [[x, y + 1, z], [x, y + 1, z + 1], [x + 1, y + 1, z + 1], [x + 1, y + 1, z]]; } },
        { dir: '-y', dx: 0, dy: -1, dz: 0, nrm: [0, -1, 0], t1: [1, 0, 0], t2: [0, 0, 1], sc: [[-1, -1], [1, -1], [1, 1], [-1, 1]], corners: function (x, y, z) { return [[x, y, z], [x + 1, y, z], [x + 1, y, z + 1], [x, y, z + 1]]; } },
        { dir: '-z', dx: 0, dy: 0, dz: -1, nrm: [0, 0, -1], t1: [0, 1, 0], t2: [1, 0, 0], sc: [[-1, -1], [1, -1], [1, 1], [-1, 1]], corners: function (x, y, z) { return [[x, y, z], [x, y + 1, z], [x + 1, y + 1, z], [x + 1, y, z]]; } },
        { dir: '+z', dx: 0, dy: 0, dz: 1, nrm: [0, 0, 1], t1: [1, 0, 0], t2: [0, 1, 0], sc: [[1, -1], [1, 1], [-1, 1], [-1, -1]], corners: function (x, y, z) { return [[x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x, y + 1, z + 1], [x, y, z + 1]]; } },
        { dir: '-x', dx: -1, dy: 0, dz: 0, nrm: [-1, 0, 0], t1: [0, 1, 0], t2: [0, 0, 1], sc: [[-1, 1], [1, 1], [1, -1], [-1, -1]], corners: function (x, y, z) { return [[x, y, z + 1], [x, y + 1, z + 1], [x, y + 1, z], [x, y, z]]; } },
        { dir: '+x', dx: 1, dy: 0, dz: 0, nrm: [1, 0, 0], t1: [0, 1, 0], t2: [0, 0, 1], sc: [[-1, -1], [1, -1], [1, 1], [-1, 1]], corners: function (x, y, z) { return [[x + 1, y, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x + 1, y, z + 1]]; } }
    ];
    const AO_CURVE = [0.45, 0.64, 0.82, 1];
    const AO_CURVE_TOP = [0.6, 0.8, 0.92, 1];

    function vertexAO(world, x, y, z, dir) {
        const face = FACE_DIRS.find(function (d) { return d.dir === dir; });
        if (!face) return [1, 1, 1, 1];
        const cellX = x + face.dx, cellY = y + face.dy, cellZ = z + face.dz;
        const curve = dir === '+y' ? AO_CURVE_TOP : AO_CURVE;
        const out = [];
        for (let i = 0; i < 4; i += 1) {
            const s1 = face.sc[i][0], s2 = face.sc[i][1];
            const o1 = hasBlock(world, cellX + s1 * face.t1[0], cellY + s1 * face.t1[1], cellZ + s1 * face.t1[2]) ? 1 : 0;
            const o2 = hasBlock(world, cellX + s2 * face.t2[0], cellY + s2 * face.t2[1], cellZ + s2 * face.t2[2]) ? 1 : 0;
            const oc = hasBlock(world, cellX + s1 * face.t1[0] + s2 * face.t2[0], cellY + s1 * face.t1[1] + s2 * face.t2[1], cellZ + s1 * face.t1[2] + s2 * face.t2[2]) ? 1 : 0;
            const ao = (o1 && o2) ? 0 : 3 - (o1 + o2 + oc);
            out.push(curve[ao]);
        }
        return out;
    }

    function pushCubeFaces(faces, x, y, z, kind, occluded) {
        for (let i = 0; i < FACE_DIRS.length; i += 1) {
            const d = FACE_DIRS[i];
            if (occluded && occluded(x + d.dx, y + d.dy, z + d.dz)) continue;
            faces.push({
                x: x, y: y, z: z, kind: kind, dir: d.dir,
                nrm: d.nrm,
                corners: d.corners(x, y, z)
            });
        }
    }

    function collectChunkFaces(world, cx0, cz0) {
        const faces = [];
        const n = world.size;
        const x1 = Math.min(n, cx0 + CHUNK);
        const z1 = Math.min(n, cz0 + CHUNK);
        const hidden = function (nx, ny, nz) { return hasBlock(world, nx, ny, nz); };
        const yCap = HEIGHT_MAX + 16;
        const scanY = W.columnScanYEnd || function (surface) {
            return Math.min(yCap, Math.max(12, (Number(surface) || 0) + 20));
        };
        for (let z = cz0; z < z1; z += 1) {
            for (let x = cx0; x < x1; x += 1) {
                const surface = world.surfaceAt ? world.surfaceAt(x, z) : 0;
                const yEnd = scanY(surface, HEIGHT_MAX, world);
                for (let y = 0; y < yEnd; y += 1) {
                    const kind = voxelAt(world, x, y, z);
                    if (!kind) continue;
                    pushCubeFaces(faces, x, y, z, kind, hidden);
                }
            }
        }
        return faces;
    }

    /* ---------- 流式：玩家周围应存在的区块键（纯函数，node 可测） ---------- */
    function chunksAround(px, pz, size, chunk, radius) {
        const ch = chunk || CHUNK;
        const n = size || WORLD_SIZE;
        const r = radius == null ? VIEW_CHUNKS : radius;
        const originX = Math.floor(px / ch) * ch;
        const originZ = Math.floor(pz / ch) * ch;
        const keys = [];
        for (let dz = -r; dz <= r; dz += 1) {
            for (let dx = -r; dx <= r; dx += 1) {
                const cx = originX + dx * ch;
                const cz = originZ + dz * ch;
                if (cx < 0 || cz < 0 || cx >= n || cz >= n) continue;
                keys.push(cx + ',' + cz);
            }
        }
        return keys;
    }

    /* ---------- 区块网格：单位暴露面合批（每区块 1 draw call） ---------- */
    function pushQuad(arr, normal, colors, corners, uvs, flip) {
        const tri = flip ? [1, 2, 3, 1, 3, 0] : [0, 1, 2, 0, 2, 3];
        for (const i of tri) {
            const c = colors[i] || colors[0];
            arr.pos.push(corners[i][0], corners[i][1], corners[i][2]);
            arr.nor.push(normal[0], normal[1], normal[2]);
            arr.col.push(c[0], c[1], c[2]);
            arr.uv.push(uvs[i][0], uvs[i][1]);
        }
    }

    function buildChunkGeometry(world, cx0, cz0) {
        const arr = { pos: [], nor: [], col: [], uv: [] };
        const faces = collectChunkFaces(world, cx0, cz0);
        for (let i = 0; i < faces.length; i += 1) {
            const f = faces[i];
            const species = voxelSpecies(world, f.x, f.y, f.z);
            const rgb = blockColor(faceKind(f.kind, f.dir), f.x, f.y, f.z, species, world.climate);
            const s = faceShade(f.dir);
            const aos = vertexAO(world, f.x, f.y, f.z, f.dir);
            const colors = aos.map(function (a) {
                return [rgb[0] * s * a, rgb[1] * s * a, rgb[2] * s * a];
            });
            const flip = aos[0] + aos[2] > aos[1] + aos[3];
            pushQuad(arr, f.nrm, colors, f.corners, tileCornersUV(tileIndex(f.kind, f.dir, species, world.climate)), flip);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(arr.pos, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(arr.nor, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(arr.col, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(arr.uv, 2));
        return geo;
    }

    /* ---------- 引擎工厂 ---------- */
    function isLiteClient() {
        if (global.Capacitor) return true;
        if (global.matchMedia && global.matchMedia('(pointer: coarse)').matches) return true;
        return false;
    }

    function create(canvas, options) {
        const opts = options || {};
        let world = opts.world || createWorld(opts.seed || 7, opts);
        const lite = isLiteClient();
        const viewChunks = lite ? MOBILE_VIEW_CHUNKS : VIEW_CHUNKS;
        const pixelCap = lite ? MOBILE_PIXEL_RATIO : PIXEL_RATIO_CAP;
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelCap));
        renderer.shadowMap.enabled = false;

        const scene = new THREE.Scene();
        const hemi = new THREE.HemisphereLight(0xfff4d8, 0x6b8a4a, 0.72);
        scene.add(hemi);
        const sun = new THREE.DirectionalLight(0xfff2d0, 1.12);
        sun.position.set(30, 50, 20);
        scene.add(sun);
        let skyDome = null;
        let sunDisc = null;
        let cloudLayer = null;
        let fogBaseN = 54;
        let fogBaseF = 112;
        /* —— 体素云层：单个 InstancedMesh(1 draw call),确定性哈希布局,缓慢漂移 —— */
        function ensureCloudLayer() {
            if (cloudLayer) return cloudLayer;
            const CLOUD_Y = 72;                       // 飞行上限(90)之下,能穿云
            const CELL = 14;                          // 云团网格间距
            const span = Math.ceil(world.size / CELL) + 6;
            const mats = [];
            const rng = makeRng(world.seed ^ 0x51cd);
            for (let gx = 0; gx < span; gx += 1) {
                for (let gz = 0; gz < span; gz += 1) {
                    if (rng() > 0.16) continue;                       // ~16% 格子有云
                    const bx = gx * CELL + rng() * 6;
                    const bz = gz * CELL + rng() * 6;
                    const w = 2 + Math.floor(rng() * 3);             // 云团长宽(格)
                    const d = 2 + Math.floor(rng() * 3);
                    const h = rng() < 0.3 ? 2 : 1;                   // 少数云有厚度
                    mats.push({ x: bx, z: bz, w: w, d: d, h: h });
                }
            }
            const geo = new THREE.BoxGeometry(CELL * 0.72, 3, CELL * 0.72);
            const mat = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.92 });
            cloudLayer = new THREE.InstancedMesh(geo, mat, mats.length);
            const m4 = new THREE.Matrix4();
            mats.forEach(function (c, i) {
                m4.makeScale(c.w, c.h, c.d);
                m4.setPosition(c.x - 3 * CELL, CLOUD_Y, c.z - 3 * CELL);
                cloudLayer.setMatrixAt(i, m4);
            });
            cloudLayer.instanceMatrix.needsUpdate = true;
            cloudLayer.frustumCulled = false;
            cloudLayer.renderOrder = -500;
            cloudLayer.userData.drift = 0;
            scene.add(cloudLayer);
            return cloudLayer;
        }
        function tickClouds(dt) {
            if (!cloudLayer) return;
            cloudLayer.userData.drift += dt * 0.55;                    // 缓慢东移
            const span = world.size + 6 * 14;
            cloudLayer.position.x = ((cloudLayer.userData.drift % span) + span) % span - span / 2 + world.size / 2;
        }
        function ensureSunDisc() {
            if (sunDisc) return sunDisc;
            const mat = new THREE.MeshBasicMaterial({
                color: 0xfff3c4,
                fog: false,
                depthWrite: false
            });
            sunDisc = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), mat);
            sunDisc.renderOrder = -900;
            sunDisc.frustumCulled = false;
            sunDisc.userData.dir = { x: 0.42, y: 0.84, z: 0.28 };
            scene.add(sunDisc);
            return sunDisc;
        }
        function ensureSkyDome() {
            if (skyDome) return skyDome;
            const geo = new THREE.SphereGeometry(72, 24, 16);
            geo.scale(-1, 1, 1);
            const mat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                depthWrite: false,
                fog: false
            });
            skyDome = new THREE.Mesh(geo, mat);
            skyDome.renderOrder = -1000;
            skyDome.frustumCulled = false;
            scene.add(skyDome);
            return skyDome;
        }

        const SKY_FILES = {
            plains: './assets/sky/plains.png',
            cherry: './assets/sky/cherry.png',
            desert: './assets/sky/desert.png',
            nether: './assets/sky/nether.png',
            duskvale: './assets/sky/duskvale.png',
            crystal: './assets/sky/crystal.png'
        };
        /* 每气候氛围参数:hemi/ground/sun 为光色,sunI 定向光强度(0.7-1.3 保可读),
           fogN/fogF 为雾 near/far 能见度(desert 远、snow/deep_dark 近),fogC 可选雾色覆盖
           (缺省用 climate.sky,确保天/雾/光三色协调不断层)。 */
        const CLIMATE_LIGHT = {
            plains:    { hemi: 0xfff4d8, ground: 0x6b8a4a, sun: 0xfff2d0, cloud: 0xf4f7fb, sunI: 1.15, fogN: 54, fogF: 112 },
            forest:    { hemi: 0xd8f0c8, ground: 0x3a5a28, sun: 0xe8f0d0, cloud: 0xe0f0e4, sunI: 1.00, fogN: 42, fogF: 86 },
            quarry:    { hemi: 0xd8dce0, ground: 0x6a7078, sun: 0xe8e8e0, cloud: 0xd0d4d8, sunI: 1.05, fogN: 48, fogF: 96 },
            cherry:    { hemi: 0xffd6e8, ground: 0x8a6a78, sun: 0xffc8d8, cloud: 0xffd0e4, sunI: 1.12, fogN: 38, fogF: 76 },
            desert:    { hemi: 0xffe6a8, ground: 0xc4a060, sun: 0xffe8b0, cloud: 0xfff0d0, sunI: 1.30, fogN: 66, fogF: 142 },
            duskvale:  { hemi: 0xffc898, ground: 0x6a4a38, sun: 0xffb070, cloud: 0xffc8a0, sunI: 0.85, fogN: 34, fogF: 72 },
            crystal:   { hemi: 0xc8f0ff, ground: 0x3a6a78, sun: 0xb8e8f8, cloud: 0xd0f4ff, sunI: 1.10, fogN: 42, fogF: 86 },
            nether:    { hemi: 0xff6040, ground: 0x3a1010, sun: 0xff4020, cloud: 0x6a2020, sunI: 0.75, fogN: 26, fogF: 54 },
            snow:      { hemi: 0xe8f0f8, ground: 0x8aa0b0, sun: 0xf4f8ff, cloud: 0xffffff, sunI: 1.15, fogN: 34, fogF: 70 },
            ocean:     { hemi: 0xc8e8f8, ground: 0x2a6a78, sun: 0xb0d8f0, cloud: 0xe0f0f8, sunI: 1.10, fogN: 56, fogF: 118 },
            mushroom:  { hemi: 0xf0c8e0, ground: 0x6a4060, sun: 0xe8a0c8, cloud: 0xf8d0e8, sunI: 1.00, fogN: 42, fogF: 86 },
            volcano:   { hemi: 0xff8040, ground: 0x3a1810, sun: 0xff5020, cloud: 0x5a2018, sunI: 0.85, fogN: 30, fogF: 62 },
            deep_dark: { hemi: 0x3a6070, ground: 0x0a1820, sun: 0x206070, cloud: 0x1a3038, sunI: 0.60, fogN: 20, fogF: 44 },
            astral:    { hemi: 0xc8d4e8, ground: 0x1a2030, sun: 0xa0b8d8, cloud: 0xd0dce8, sunI: 1.05, fogN: 46, fogF: 92 },
            end:       { hemi: 0xc8a0e8, ground: 0x201028, sun: 0xa070d0, cloud: 0x3a2048, sunI: 0.70, fogN: 24, fogF: 50 }
        };
        function applySky(climateName) {
            const sky = climateOf(climateName).sky;
            const light = CLIMATE_LIGHT[climateName] || CLIMATE_LIGHT.plains;
            hemi.color.setHex(light.hemi);
            hemi.groundColor.setHex(light.ground);
            sun.color.setHex(light.sun);
            /* 定向光强度按气候微调,冷/暗气候稍暗、暖/亮气候稍亮;0.6 下限 + hemi 兜底保可读 */
            sun.intensity = light.sunI;
            scene.background = new THREE.Color(sky);
            /* 能见度按气候微调(desert 远、snow/deep_dark 近),lite 缩小视野 */
            const mood = (global.BlockLegendFx && global.BlockLegendFx.climateMood)
                ? global.BlockLegendFx.climateMood(climateName)
                : {};
            const fogScale = lite ? 0.8 : 1;
            const fogHex = mood.fogC != null ? mood.fogC : sky;
            const fogN = mood.fogN != null ? mood.fogN : light.fogN;
            const fogF = mood.fogF != null ? mood.fogF : light.fogF;
            scene.fog = new THREE.Fog(
                fogHex,
                fogN * fogScale,
                fogF * fogScale
            );
            /* r147 Fog 无 userData，基准记在闭包里供 tickLife 高空扩展 */
            fogBaseN = fogN * fogScale;
            fogBaseF = fogF * fogScale;
            const disc = ensureSunDisc();
            const slen = Math.hypot(sun.position.x, sun.position.y, sun.position.z) || 1;
            disc.userData.dir = {
                x: sun.position.x / slen,
                y: sun.position.y / slen,
                z: sun.position.z / slen
            };
            disc.material.color.setHex(mood.sunDisc || light.sun);
            disc.scale.setScalar(mood.sunSize || 3.2);
            disc.visible = light.sunI >= 0.62;
            const dome = ensureSkyDome();
            dome.material.color.setHex(sky);
            dome.material.map = null;
            /* 云层按气候上色(lite 模式省 draw call 不建云) */
            if (!lite) {
                const cl = ensureCloudLayer();
                cl.material.color.setHex(light.cloud);
                cl.visible = true;
            } else if (cloudLayer) {
                cloudLayer.visible = false;
            }
            const file = SKY_FILES[climateName];
            if (!file) return;
            const loader = new THREE.TextureLoader();
            loader.load(file, function (tex) {
                tex.magFilter = THREE.LinearFilter;
                tex.minFilter = THREE.LinearFilter;
                dome.material.map = tex;
                dome.material.color.setHex(0xffffff);
                dome.material.needsUpdate = true;
            });
        }
        applySky(world.climate);

        const atlas = makeBlockAtlas();
        const terrainMat = new THREE.MeshLambertMaterial({
            map: atlas,
            vertexColors: true,
            alphaTest: 0.5,
            transparent: false
        });
        terrainMat.userData.waterT = 0;
        const waterSpec = (global.BlockLegendFx && global.BlockLegendFx.waterFlow)
            ? global.BlockLegendFx.waterFlow()
            : null;
        if (waterSpec) {
            terrainMat.onBeforeCompile = function (shader) {
                shader.uniforms.uWaterT = { value: 0 };
                terrainMat.userData.uWaterT = shader.uniforms.uWaterT;
                shader.fragmentShader = 'uniform float uWaterT;\n' + shader.fragmentShader;
                shader.fragmentShader = shader.fragmentShader.replace(
                    'vec4 sampledDiffuseColor = texture2D( map, vUv );',
                    [
                        'vec2 blWaterUv = vUv;',
                        'vec2 blLocal = (vUv - vec2(' + waterSpec.u0 + ',' + waterSpec.v0 + ')) / vec2(' + waterSpec.uSize + ',' + waterSpec.vSize + ');',
                        'if (blLocal.x >= 0.0 && blLocal.x <= 1.0 && blLocal.y >= 0.0 && blLocal.y <= 1.0) {',
                        '  blLocal.x = fract(blLocal.x + uWaterT * ' + waterSpec.speed + ');',
                        '  blLocal.y = fract(blLocal.y + sin(uWaterT * 0.8 + blLocal.x * 6.2832) * ' + waterSpec.ripple + ');',
                        '  blWaterUv = vec2(' + waterSpec.u0 + ',' + waterSpec.v0 + ') + blLocal * vec2(' + waterSpec.uSize + ',' + waterSpec.vSize + ');',
                        '}',
                        'vec4 sampledDiffuseColor = texture2D( map, blWaterUv );'
                    ].join('\n')
                );
            };
        }
        const chunkMeshes = [];
        const chunkMap = {};
        const decor = new THREE.Group();
        scene.add(decor);

        const flowerColors = {
            poppy: 0xd63a3a,
            dandelion: 0xffe14a,
            petal: 0xf4a0c8,
            sakura: 0xffd0e8,
            amber: 0xe07a28,
            crystal: 0x7ee8e0
        };
        function rebuildDecor() {
            while (decor.children.length) {
                const ch = decor.children[0];
                decor.remove(ch);
                if (ch.geometry && ch.geometry.dispose) ch.geometry.dispose();
            }
            (world.flowers || []).forEach(function (f) {
                const stem = new THREE.Mesh(
                    new THREE.BoxGeometry(0.08, 0.34, 0.08),
                    new THREE.MeshLambertMaterial({ color: 0x3d8a28 })
                );
                const head = new THREE.Mesh(
                    new THREE.BoxGeometry(0.22, 0.16, 0.22),
                    new THREE.MeshLambertMaterial({ color: flowerColors[f.kind] || 0xffe14a })
                );
                const y = world.surfaceAt(f.x, f.z);
                stem.position.set(f.x + 0.5, y + 0.17, f.z + 0.5);
                head.position.set(f.x + 0.5, y + 0.4, f.z + 0.5);
                stem.userData.sway = { phase: hash3(f.x, 1, f.z) * 6.2832, amp: 0.7 };
                head.userData.sway = { phase: hash3(f.x, 1, f.z) * 6.2832, amp: 1.15 };
                decor.add(stem);
                decor.add(head);
            });
            function boxMesh(w, h, d, color, y) {
                const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: color }));
                mesh.position.y = y;
                return mesh;
            }
            function propOf(name, fallback, spec) {
                const P = global.BlockLegendProps3d;
                if (P && typeof P[name] === 'function') {
                    return name === 'createSign' ? P[name](THREE, spec) : P[name](THREE);
                }
                return fallback();
            }
            function placeLife(mesh, x, z, yOff) {
                const y = world.surfaceAt(Math.floor(x), Math.floor(z)) + (yOff || 0);
                mesh.position.set(x, y, z);
                decor.add(mesh);
                return mesh;
            }
            const plantTint = {
                tallgrass: 0x5aaa32,
                bush: 0x3d8a28,
                reed: 0x6aa84a,
                deadbush: 0x8a6230,
                tumble: 0xa07840,
                wart: 0x8a2030,
                mushroom: 0xc43a3a,
                petalplant: 0xf4a0c8,
                crystalbush: 0x7ee8e0,
                wheat: 0xd8b44a
            };
            (world.plants || []).forEach(function (p) {
                const tint = plantTint[p.kind] || 0x5aaa32;
                const tall = p.kind === 'reed' || p.kind === 'tallgrass' || p.kind === 'wheat';
                const stem = new THREE.Mesh(
                    new THREE.BoxGeometry(p.kind === 'bush' || p.kind === 'crystalbush' ? 0.34 : 0.1, tall ? 0.62 : 0.38, p.kind === 'bush' || p.kind === 'crystalbush' ? 0.34 : 0.1),
                    new THREE.MeshLambertMaterial({ color: tint })
                );
                const y = (p.y != null ? p.y : world.surfaceAt(p.x, p.z));
                stem.position.set(p.x + 0.5, y + (tall ? 0.32 : 0.2), p.z + 0.5);
                stem.userData.sway = { phase: hash3(p.x, 2, p.z) * 6.2832, amp: tall ? 1.2 : 0.9 };
                p.mesh = stem;
                decor.add(stem);
            });
            (world.beds || []).forEach(function (b) {
                const bed = propOf('createBed', function () {
                    const g = new THREE.Group();
                    g.add(boxMesh(0.9, 0.18, 0.55, 0x6d4c41, 0.12));
                    g.add(boxMesh(0.28, 0.1, 0.4, 0xf5f5f5, 0.24));
                    const blanket = boxMesh(0.58, 0.1, 0.5, 0xc62828, 0.24);
                    blanket.position.x = 0.14;
                    g.add(blanket);
                    return g;
                });
                bed.position.set(b.x + 0.5, b.y, b.z + 0.5);
                decor.add(bed);
            });
            (world.villagers || []).forEach(function (v) {
                const factory = v.role === 'trader' ? 'createTrader'
                    : v.role === 'teacher' ? 'createTeacher'
                        : v.role === 'farmer' ? 'createFarmer'
                            : 'createVillager';
                const npc = propOf(factory, function () {
                    const g = new THREE.Group();
                    const robe = v.role === 'trader' ? 0x4a6a8a
                        : v.role === 'teacher' ? 0x2e7d4f
                            : v.role === 'farmer' ? 0xc6a24a
                                : 0x8b4513;
                    g.add(boxMesh(0.34, 0.42, 0.22, robe, 0.72));
                    g.add(boxMesh(0.28, 0.26, 0.26, 0xd2a679, 1.06));
                    g.add(boxMesh(0.1, 0.1, 0.12, 0xc49a6c, 0.98));
                    g.add(boxMesh(0.12, 0.28, 0.12, 0x5a3a1a, 0.2));
                    g.add(boxMesh(0.12, 0.28, 0.12, 0x5a3a1a, 0.2));
                    if (v.role === 'farmer') g.add(boxMesh(0.34, 0.08, 0.34, 0xe6d27a, 1.22));
                    return g;
                });
                ensureWalkTick(npc);
                v.mesh = placeLife(npc, v.x, v.z, 0);
            });
            (world.placedProps || []).forEach(function (p) {
                const factory = p.kind === 'furnace' ? 'createFurnace'
                    : p.kind === 'torch' ? 'createTorch'
                        : p.kind === 'lantern' ? 'createLantern'
                        : p.kind === 'chair' ? 'createChair'
                            : p.kind === 'bookshelf' ? 'createBookshelf'
                                : p.kind === 'table' ? 'createTable'
                                    : p.kind === 'bed' ? 'createBed'
                                        : p.kind === 'door' ? 'createDoor'
                                            : p.kind === 'ladder' ? 'createLadder'
                                                : p.kind === 'fence' ? 'createFence'
                                                    : p.kind === 'boat' ? 'createBoat'
                                                        : p.kind === 'sign' ? 'createSign'
                                                        : 'createChest';
                const mesh = propOf(factory, function () {
                    if (p.kind === 'sign') {
                        const g = new THREE.Group();
                        g.add(boxMesh(0.1, 1.0, 0.1, 0x6b4424, 0.5));
                        g.add(boxMesh(0.9, 0.55, 0.08, 0xc4a574, 1.1));
                        return g;
                    }
                    if (p.kind === 'chair') {
                        const g = new THREE.Group();
                        g.add(boxMesh(0.42, 0.08, 0.42, 0x8d6e48, 0.22));
                        g.add(boxMesh(0.08, 0.36, 0.42, 0x6d4c31, 0.44));
                        return g;
                    }
                    if (p.kind === 'bookshelf') {
                        const g = new THREE.Group();
                        g.add(boxMesh(0.7, 0.9, 0.28, 0x6d4c31, 0.46));
                        g.add(boxMesh(0.62, 0.16, 0.12, 0xc62828, 0.62));
                        g.add(boxMesh(0.62, 0.16, 0.12, 0x1565c0, 0.38));
                        return g;
                    }
                    if (p.kind === 'table') {
                        const g = new THREE.Group();
                        g.add(boxMesh(0.7, 0.08, 0.7, 0xa07848, 0.42));
                        g.add(boxMesh(0.08, 0.34, 0.08, 0x6d4c31, 0.16));
                        return g;
                    }
                    return boxMesh(0.7, 0.7, 0.7, 0x8a5a28, 0.35);
                }, p);
                mesh.position.set(p.x + 0.5, p.y, p.z + 0.5);
                decor.add(mesh);
                p.mesh = mesh;
            });
            (world.animals || []).forEach(function (a) {
                let animal;
                if (a.kind === 'dragon' && global.BlockLegendDragonModel) {
                    animal = global.BlockLegendDragonModel.create(THREE);
                    animal.scale.setScalar(animal.userData.rideScale != null ? animal.userData.rideScale : 1.62);
                    const shield = animal.userData && animal.userData.sculptRuntime
                        && animal.userData.sculptRuntime.nodes
                        && animal.userData.sculptRuntime.nodes.shield;
                    if (shield) shield.visible = false;
                } else if (a.kind === 'fish') {
                    animal = propOf('createFish', function () {
                        const g = new THREE.Group();
                        g.add(boxMesh(0.55, 0.18, 0.22, 0xf2a04a, 0.12));
                        g.add(boxMesh(0.16, 0.16, 0.06, 0xe87828, 0.12));
                        return g;
                    });
                } else if (a.kind === 'pufferfish' && global.BlockLegendPufferfishModel) {
                    animal = global.BlockLegendPufferfishModel.create(THREE);
                } else if (a.kind === 'guardian' && global.BlockLegendGuardianModel) {
                    animal = global.BlockLegendGuardianModel.create(THREE);
                } else if (a.kind === 'elder_guardian' && global.BlockLegendElderGuardianModel) {
                    animal = global.BlockLegendElderGuardianModel.create(THREE);
                } else {
                    const factory = a.kind === 'cow' ? 'createCow'
                        : a.kind === 'sheep' ? 'createSheep'
                            : a.kind === 'chicken' ? 'createChicken'
                                : a.kind === 'wolf' ? 'createWolf'
                                    : a.kind === 'bee' ? 'createBee'
                                        : 'createPig';
                    animal = propOf(factory, function () {
                        const g = new THREE.Group();
                        const color = a.kind === 'cow' ? 0x6b4424 : a.kind === 'sheep' ? 0xf4f0ea : a.kind === 'chicken' ? 0xf4f0ea : a.kind === 'wolf' ? 0xa8a8b0 : a.kind === 'bee' ? 0xffd54f : 0xf2a0b4;
                        g.add(boxMesh(a.kind === 'chicken' ? 0.28 : 0.55, a.kind === 'chicken' ? 0.28 : 0.36, a.kind === 'chicken' ? 0.28 : 0.7, color, a.kind === 'chicken' ? 0.38 : 0.42));
                        return g;
                    });
                }
                a.mesh = placeLife(animal, a.x, a.z, lifeAltitude(a, world) - world.surfaceAt(Math.floor(a.x), Math.floor(a.z)));
                animal.rotation.y = a.yaw || 0;
            });
            (world.golems || []).forEach(function (golem) {
                let mesh;
                if (golem.kind === 'snowgolem' && global.BlockLegendSnowGolemModel) {
                    mesh = global.BlockLegendSnowGolemModel.create(THREE);
                } else if (global.BlockLegendGolemModel && typeof global.BlockLegendGolemModel.create === 'function') {
                    mesh = global.BlockLegendGolemModel.create(THREE);
                } else {
                    mesh = boxMesh(0.72, 1.5, 0.48, 0xb8c4c8, 0.75);
                }
                golem.mesh = placeLife(mesh, golem.x, golem.z, 0);
            });
            const cloudHex = (CLIMATE_LIGHT[world.climate] || CLIMATE_LIGHT.plains).cloud;
            const cloudMat = new THREE.MeshLambertMaterial({ color: cloudHex });
            const cloudRng = makeRng((world.seed || 7) + 99);
            for (let c = 0; c < 16; c += 1) {
                const gx = 4 + cloudRng() * (world.size - 8);
                const gz = 4 + cloudRng() * (world.size - 8);
                const gy = 18 + cloudRng() * 3;
                const w = 2 + Math.floor(cloudRng() * 3);
                for (let i = 0; i < w; i += 1) {
                    const cloud = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 1.4), cloudMat);
                    cloud.position.set(gx + i * 1.2, gy + (i % 2) * 0.25, gz + (cloudRng() - 0.5));
                    decor.add(cloud);
                }
            }
        }
        rebuildDecor();

        const camera = new THREE.PerspectiveCamera(72, 16 / 9, 0.05, 320);
        const BASE_FOV = 72;
        const player = {
            x: Math.floor(world.size / 2) + 0.5,
            z: Math.floor(world.size / 2) + 0.5,
            y: world.surfaceAt(Math.floor(world.size / 2), Math.floor(world.size / 2)),
            vy: 0, onGround: true, hp: 10, hpMax: 10, mounted: null
        };
        const look = { yaw: Math.PI * 0.25, pitch: -0.28 };
        const keys = {};

        function ensureChunk(cx, cz) {
            const key = cx + ',' + cz;
            if (chunkMap[key]) return;
            if (cx < 0 || cz < 0 || cx >= world.size || cz >= world.size) return;
            const mesh = new THREE.Mesh(buildChunkGeometry(world, cx, cz), terrainMat);
            scene.add(mesh);
            chunkMeshes.push(mesh);
            chunkMap[key] = mesh;
        }

        function dropChunk(key) {
            const mesh = chunkMap[key];
            if (!mesh) return;
            scene.remove(mesh);
            if (mesh.geometry && mesh.geometry.dispose) mesh.geometry.dispose();
            delete chunkMap[key];
            const i = chunkMeshes.indexOf(mesh);
            if (i >= 0) chunkMeshes.splice(i, 1);
        }

        let lastStreamKey = '';
        let streamFilled = false;
        function streamChunks(budget) {
            const cx = Math.floor(player.x / CHUNK) * CHUNK;
            const cz = Math.floor(player.z / CHUNK) * CHUNK;
            const here = cx + ',' + cz;
            if (streamFilled && here === lastStreamKey) return;
            lastStreamKey = here;
            const want = {};
            const keys = chunksAround(player.x, player.z, world.size, CHUNK, viewChunks);
            keys.forEach(function (k) { want[k] = true; });
            Object.keys(chunkMap).forEach(function (k) {
                if (!want[k]) dropChunk(k);
            });
            keys.sort(function (a, b) {
                const pa = a.split(',');
                const pb = b.split(',');
                const da = Math.abs(Number(pa[0]) + 8 - player.x) + Math.abs(Number(pa[1]) + 8 - player.z);
                const db = Math.abs(Number(pb[0]) + 8 - player.x) + Math.abs(Number(pb[1]) + 8 - player.z);
                return da - db;
            });
            let built = 0;
            const cap = budget == null ? 1 : budget;
            for (let i = 0; i < keys.length && built < cap; i += 1) {
                if (chunkMap[keys[i]]) continue;
                const parts = keys[i].split(',');
                ensureChunk(Number(parts[0]), Number(parts[1]));
                built += 1;
            }
            streamFilled = built === 0;
        }

        chunksAround(player.x, player.z, world.size, CHUNK, BOOT_CHUNKS).forEach(function (key) {
            const parts = key.split(',');
            ensureChunk(Number(parts[0]), Number(parts[1]));
        });

        function reloadWorld(next) {
            world = next || createWorld(7);
            lastStreamKey = '';
            streamFilled = false;
            Object.keys(chunkMap).forEach(dropChunk);
            player.x = Math.floor(world.size / 2) + 0.5;
            player.z = Math.floor(world.size / 2) + 0.5;
            player.y = world.surfaceAt(Math.floor(player.x), Math.floor(player.z));
            player.vy = 0;
            player.mounted = null;
            applySky(world.climate);
            rebuildDecor();
            chunksAround(player.x, player.z, world.size, CHUNK, BOOT_CHUNKS).forEach(function (key) {
                const parts = key.split(',');
                ensureChunk(Number(parts[0]), Number(parts[1]));
            });
        }

        function remeshAt(x, z) {
            const seen = {};
            for (let dz = -2; dz <= 2; dz += 1) {
                for (let dx = -2; dx <= 2; dx += 1) {
                    const cx = Math.floor((x + dx) / CHUNK) * CHUNK;
                    const cz = Math.floor((z + dz) / CHUNK) * CHUNK;
                    const key = cx + ',' + cz;
                    if (seen[key]) continue;
                    seen[key] = true;
                    const mesh = chunkMap[key];
                    if (!mesh) continue;
                    const old = mesh.geometry;
                    mesh.geometry = buildChunkGeometry(world, cx, cz);
                    if (old && old.dispose) old.dispose();
                }
            }
        }

        /* ---------- 碰撞：高度场 + 树干 ---------- */
        function columnBlocked(px, pz, feetY) {
            return columnBlockedAt(world, px, pz, feetY);
        }

        function onLadder(px, pz) {
            const props = (world.placedProps || []);
            for (let i = 0; i < props.length; i += 1) {
                const p = props[i];
                if (!p || p.kind !== 'ladder') continue;
                if (Math.hypot(px - (p.x + 0.5), pz - (p.z + 0.5)) < 0.9) return true;
            }
            return false;
        }

        function updateBoatPhysics(dt, input) {
            const speed = 7.2;
            const ax = analog.x, ay = analog.y;
            const useStick = Math.abs(ax) + Math.abs(ay) > 0.001;
            const dirX = useStick
                ? (-Math.sin(look.yaw) * ay)
                : (Math.sin(look.yaw) * (input.back ? 1 : 0) - Math.sin(look.yaw) * (input.fwd ? 1 : 0));
            const dirZ = useStick
                ? (-Math.cos(look.yaw) * ay)
                : (Math.cos(look.yaw) * (input.back ? 1 : 0) - Math.cos(look.yaw) * (input.fwd ? 1 : 0));
            const rgtX = useStick
                ? (Math.cos(look.yaw) * ax)
                : (Math.cos(look.yaw) * (input.right ? 1 : 0) - Math.cos(look.yaw) * (input.left ? 1 : 0));
            const rgtZ = useStick
                ? (-Math.sin(look.yaw) * ax)
                : (-Math.sin(look.yaw) * (input.right ? 1 : 0) + Math.sin(look.yaw) * (input.left ? 1 : 0));
            let mx = dirX + rgtX, mz = dirZ + rgtZ;
            const len = Math.hypot(mx, mz);
            if (len > 0) {
                mx = mx / len * speed * dt;
                mz = mz / len * speed * dt;
                player.x = Math.max(2.5, Math.min(world.size - 2.5, player.x + mx));
                player.z = Math.max(2.5, Math.min(world.size - 2.5, player.z + mz));
            }
            player.vy = 0;
            player.y = world.surfaceAt(Math.floor(player.x), Math.floor(player.z)) + 0.28;
            player.onGround = true;
            const boat = player.mounted;
            if (boat) {
                boat.x = Math.floor(player.x);
                boat.z = Math.floor(player.z);
                boat.y = player.y - 0.28;
                boat.yaw = look.yaw + Math.PI;
                if (boat.mesh) {
                    boat.mesh.position.set(player.x, boat.y, player.z);
                    boat.mesh.rotation.y = look.yaw;
                }
            }
        }

        function updateMountPhysics(dt, input) {
            const FLY = 9.6;
            const CLIMB = 6.8;
            const BOOST_X = 1.7;                          // R 急速速度倍率
            const SMOOTH = Math.min(1, dt * 6);           // 平滑过渡到目标速度
            const ROLL_DUR = 1.5;                         // 回旋时长(s)

            // —— R 急速：mount.speedFactor 平滑趋近目标(按住1.7/松开1.0) ——
            const mount0 = player.mounted;
            const sTarget = (input.boost && mount0) ? BOOST_X : 1.0;
            if (mount0) {
                mount0.speedFactor = mount0.speedFactor == null
                    ? sTarget
                    : mount0.speedFactor + (sTarget - mount0.speedFactor) * SMOOTH;
            }
            const speed = FLY * (mount0 ? mount0.speedFactor : 1.0);

            // —— Q/E 回旋：1.5s 内围绕前向轴转 ±360°(rollT 0→1，方向 ±1) ——
            let rollAngle = 0;
            if (mount0) {
                if (mount0.rollState !== 'rolling') {
                    if (input.rollL || input.rollR) {
                        mount0.rollState = 'rolling';
                        mount0.rollT = 0;
                        mount0.rollDir = input.rollL ? 1 : -1;
                    }
                }
                if (mount0.rollState === 'rolling') {
                    mount0.rollT += dt / ROLL_DUR;
                    if (mount0.rollT >= 1) {
                        mount0.rollState = 'done';
                        mount0.rollT = 1;
                    }
                    rollAngle = mount0.rollDir * Math.PI * 2 * mount0.rollT;
                }
            }

            const ax = analog.x, ay = analog.y;
            const useStick = Math.abs(ax) + Math.abs(ay) > 0.001;
            const dirX = useStick
                ? (-Math.sin(look.yaw) * ay)
                : (Math.sin(look.yaw) * (input.back ? 1 : 0) - Math.sin(look.yaw) * (input.fwd ? 1 : 0));
            const dirZ = useStick
                ? (-Math.cos(look.yaw) * ay)
                : (Math.cos(look.yaw) * (input.back ? 1 : 0) - Math.cos(look.yaw) * (input.fwd ? 1 : 0));
            const rgtX = useStick
                ? (Math.cos(look.yaw) * ax)
                : (Math.cos(look.yaw) * (input.right ? 1 : 0) - Math.cos(look.yaw) * (input.left ? 1 : 0));
            const rgtZ = useStick
                ? (-Math.sin(look.yaw) * ax)
                : (-Math.sin(look.yaw) * (input.right ? 1 : 0) + Math.sin(look.yaw) * (input.left ? 1 : 0));
            let mx = dirX + rgtX, mz = dirZ + rgtZ;
            const len = Math.hypot(mx, mz);
            if (len > 0) {
                mx = mx / len * speed * dt;
                mz = mz / len * speed * dt;
                player.x = Math.max(2.5, Math.min(world.size - 2.5, player.x + mx));
                player.z = Math.max(2.5, Math.min(world.size - 2.5, player.z + mz));
            }
            let climb = 0;
            if (input.jump) climb += 1;
            if (input.sneak) climb -= 1;
            if (len > 0.001 || input.fwd || useStick) climb -= Math.sin(look.pitch) * 0.9;
            player.vy = 0;
            player.y += climb * CLIMB * dt;
            const FX = globalThis.BlockLegendFx;
            const surfaceY = world.surfaceAt(Math.floor(player.x), Math.floor(player.z));
            const floorY = FX && FX.rideFloor ? FX.rideFloor(surfaceY) : surfaceY + 12;
            if (player.y < floorY) player.y = floorY;
            if (player.y > 90) player.y = 90;
            player.onGround = player.y <= floorY + 0.08;
            const mount = player.mounted;
            if (mount) {
                mount.x = player.x;
                mount.z = player.z;
                mount.y = player.y - 1.32;
                mount.yaw = look.yaw + Math.PI;
                const att = FX && FX.rideAttitude
                    ? FX.rideAttitude({ left: input.left, right: input.right, ax: analog.x, climb: climb })
                    : { bank: 0, pitch: 0 };
                const poseSmooth = Math.min(1, dt * 7);
                mount.bank = (mount.bank || 0) + (att.bank - (mount.bank || 0)) * poseSmooth;
                mount.pitch = (mount.pitch || 0) + (att.pitch - (mount.pitch || 0)) * poseSmooth;
                if (mount.breath) mount.breath = Math.max(0, mount.breath - dt * 2.8);
                // 回旋覆盖倾斜；平时 roll = 左右倾斜
                mount.roll = rollAngle + (mount.rollState === 'rolling' ? 0 : mount.bank);
                if (mount.rollState === 'done') {
                    agentRollReset(mount);
                }
            }
        }

        function agentRollReset(mount) {
            // 回旋结束复位(回到直立,roll 在 tickLife 读取后由下一帧置 0)
            mount.rollState = null;
            mount.rollDir = 0;
        }

        function updatePhysics(dt, input) {
            if (player.mounted && player.mounted.kind === 'boat') {
                updateBoatPhysics(dt, input);
                return;
            }
            if (player.mounted) {
                updateMountPhysics(dt, input);
                return;
            }
            // 朝向移动（yaw: 0 朝 -Z，与相机一致）
            const ax = analog.x, ay = analog.y;
            const useStick = Math.abs(ax) + Math.abs(ay) > 0.001;
            const dirX = useStick
                ? (-Math.sin(look.yaw) * ay)
                : (Math.sin(look.yaw) * (input.back ? 1 : 0) - Math.sin(look.yaw) * (input.fwd ? 1 : 0));
            const dirZ = useStick
                ? (-Math.cos(look.yaw) * ay)
                : (Math.cos(look.yaw) * (input.back ? 1 : 0) - Math.cos(look.yaw) * (input.fwd ? 1 : 0));
            const rgtX = useStick
                ? (Math.cos(look.yaw) * ax)
                : (Math.cos(look.yaw) * (input.right ? 1 : 0) - Math.cos(look.yaw) * (input.left ? 1 : 0));
            const rgtZ = useStick
                ? (-Math.sin(look.yaw) * ax)
                : (-Math.sin(look.yaw) * (input.right ? 1 : 0) + Math.sin(look.yaw) * (input.left ? 1 : 0));
            let mx = dirX + rgtX, mz = dirZ + rgtZ;
            const len = Math.hypot(mx, mz);
            if (len > 0) {
                mx = mx / len * MOVE_SPEED * moveSpeedMul(input) * dt;
                mz = mz / len * MOVE_SPEED * moveSpeedMul(input) * dt;
                const R = 0.3; // 玩家半径
                // 分轴试探：撞墙只挡该轴，可贴墙滑动
                if (!columnBlocked(player.x + mx + Math.sign(mx) * R, player.z, player.y)) player.x += mx;
                if (!columnBlocked(player.x, player.z + mz + Math.sign(mz) * R, player.y)) player.z += mz;
            }
            if (onLadder(player.x, player.z)) {
                player.vy = 0;
                let climb = 0;
                if (input.jump) climb += 1;
                if (input.sneak) climb -= 1;
                if (input.fwd) climb += 0.65;
                if (input.back) climb -= 0.65;
                player.y += climb * 4.8 * dt;
                const groundY = world.surfaceAt(Math.floor(player.x), Math.floor(player.z));
                if (player.y < groundY) player.y = groundY;
                if (player.y > groundY + 8) player.y = groundY + 8;
                player.onGround = player.y <= groundY + 0.08;
                separatePlayerFromAnimals();
                return;
            }
            // 竖直
            player.vy -= GRAVITY * dt;
            player.y += player.vy * dt;
            const groundY = world.surfaceAt(Math.floor(player.x), Math.floor(player.z));
            if (player.y <= groundY) {
                player.y = groundY;
                player.vy = 0;
                player.onGround = true;
            } else if (player.y - groundY < 0.02) {
                player.onGround = true;
            } else {
                player.onGround = false;
            }
            if (input.jump && player.onGround) {
                player.vy = JUMP_VY;
                player.onGround = false;
                if (api && typeof api.onJump === 'function') api.onJump();
            }
            separatePlayerFromAnimals();
        }

        function farmBodyRadius(kind) {
            const C = global.BlockLegendCombat;
            if (C && typeof C.animalBodyRadius === 'function') return C.animalBodyRadius(kind);
            if (kind === 'sheep') return 1.35;
            if (kind === 'cow') return 1.15;
            if (kind === 'chicken') return 0.6;
            if (kind === 'pig') return 0.95;
            return 0;
        }

        function isFarmKind(kind) {
            const C = global.BlockLegendCombat;
            if (C && C.isFarmAnimal) return C.isFarmAnimal(kind);
            return /^(pig|cow|sheep|chicken)$/.test(kind);
        }

        function separatePlayerFromAnimals() {
            (world.animals || []).forEach(function (a) {
                if (!a || (a.hp != null && a.hp <= 0)) return;
                if (!isFarmKind(a.kind)) return;
                const min = farmBodyRadius(a.kind) + 0.35;
                const dx = player.x - a.x;
                const dz = player.z - a.z;
                const dist = Math.hypot(dx, dz);
                if (dist >= min) return;
                const nx = dist < 0.001 ? 1 : dx / dist;
                const nz = dist < 0.001 ? 0 : dz / dist;
                const push = min - dist;
                const tx = player.x + nx * push;
                const tz = player.z + nz * push;
                const R = 0.3;
                if (!columnBlocked(tx + Math.sign(nx || 1) * R, player.z, player.y)) player.x = tx;
                if (!columnBlocked(player.x, tz + Math.sign(nz || 1) * R, player.y)) player.z = tz;
            });
        }

        const punch = { life: 0, max: 0, yaw: 0, pitch: 0 };
        const fovPulse = { life: 0, max: 0, add: 0 };
        function addFovPulse(spec) {
            if (!spec || !(spec.life > 0)) return;
            fovPulse.life = spec.life;
            fovPulse.max = spec.life;
            fovPulse.add = Number(spec.add) || 0;
        }
        function addPunch(spec) {
            if (!spec || !(spec.life > 0)) return;
            punch.life = spec.life;
            punch.max = spec.life;
            punch.yaw = Number(spec.yaw) || 0;
            punch.pitch = Number(spec.pitch) || 0;
        }
        function applyCamera() {
            camera.rotation.order = 'YXZ';
            let yaw = look.yaw;
            let pitch = look.pitch;
            const FX = global.BlockLegendFx;
            const ride = FX && FX.rideCam
                ? FX.rideCam({ mounted: !!player.mounted, pitch: look.pitch })
                : null;
            if (ride) {
                const fx = -Math.sin(look.yaw);
                const fz = -Math.cos(look.yaw);
                camera.position.set(
                    player.x - fx * ride.back,
                    player.y + ride.up + (ride.yLift || 0),
                    player.z - fz * ride.back
                );
                const floor = world.surfaceAt(Math.floor(camera.position.x), Math.floor(camera.position.z)) + 0.9;
                if (camera.position.y < floor) camera.position.y = floor;
                pitch = look.pitch * (ride.pitchScale || 1) + (ride.pitchBias || 0);
            } else {
                camera.position.set(player.x, player.y + EYE_HEIGHT, player.z);
            }
            if (punch.life > 0 && punch.max > 0) {
                const k = Math.sin((punch.life / punch.max) * Math.PI);
                yaw += punch.yaw * k;
                pitch += punch.pitch * k;
            }
            camera.rotation.y = yaw;
            camera.rotation.x = pitch;
            if (fovPulse.life > 0 && fovPulse.max > 0) {
                const k = Math.sin((fovPulse.life / fovPulse.max) * Math.PI);
                camera.fov = BASE_FOV + fovPulse.add * k;
                camera.updateProjectionMatrix();
            } else if (camera.fov !== BASE_FOV) {
                camera.fov = BASE_FOV;
                camera.updateProjectionMatrix();
            }
            if (skyDome) skyDome.position.copy(camera.position);
            if (sunDisc) {
                const d = sunDisc.userData.dir || { x: 0.42, y: 0.84, z: 0.28 };
                sunDisc.position.set(
                    camera.position.x + d.x * 58,
                    camera.position.y + d.y * 58,
                    camera.position.z + d.z * 58
                );
            }
        }

        function resize() {
            const rect = canvas.getBoundingClientRect();
            const cssW = Math.max(1, Math.floor(rect.width));
            const cssH = Math.max(1, Math.floor(rect.height));
            const P = global.BlockLegendPerf;
            const cap = lite && P && P.LITE_LONG_EDGE ? P.LITE_LONG_EDGE : 0;
            const size = P && P.internalSize ? P.internalSize(cssW, cssH, cap) : { w: cssW, h: cssH };
            renderer.setSize(size.w, size.h, false);
            camera.aspect = cssW / cssH;
            camera.updateProjectionMatrix();
        }

        /* ---------- 输入 ---------- */
        const input = { fwd: false, back: false, left: false, right: false, jump: false, sneak: false, boost: false, rollL: false, rollR: false };
        const held = { fwd: false, back: false, left: false, right: false, jump: false, sneak: false, boost: false, rollL: false, rollR: false };
        const analog = { x: 0, y: 0 };
        let moveLocked = false;
        function refreshKeys() {
            if (moveLocked) {
                input.fwd = false;
                input.back = false;
                input.left = false;
                input.right = false;
                input.jump = false;
                input.sneak = false;
                input.boost = false;
                input.rollL = false;
                input.rollR = false;
                return;
            }
            input.fwd = !!(keys['w'] || keys['arrowup'] || held.fwd);
            input.back = !!(keys['s'] || keys['arrowdown'] || held.back);
            input.left = !!(keys['a'] || keys['arrowleft'] || held.left);
            input.right = !!(keys['d'] || keys['arrowright'] || held.right);
            input.jump = !!(keys[' '] || held.jump);
            input.sneak = !!(keys['shift'] || held.sneak);
            input.boost = !!(keys['r'] || held.boost);
            input.rollL = !!(keys['q'] || held.rollL);
            input.rollR = !!(keys['e'] || held.rollR);
        }
        function setHeld(part, on) {
            if (!Object.prototype.hasOwnProperty.call(held, part)) return;
            held[part] = !!on;
            refreshKeys();
        }
        function setMoveAxis(x, y) {
            analog.x = moveLocked ? 0 : Math.max(-1, Math.min(1, Number(x) || 0));
            analog.y = moveLocked ? 0 : Math.max(-1, Math.min(1, Number(y) || 0));
        }

        let pointerLocked = false;
        let lookFrozen = false;
        let lookLock = true;
        let dragLook = null; // PointerLock 不可用（部分 WebView/触屏）时的拖动视角兜底
        const SENS = 0.0026, DRAG_SENS = 0.005;
        function syncLookTip() {
            const tip = document.getElementById('look-tip');
            if (!tip) return;
            tip.classList.toggle('is-hidden', lookFrozen || pointerLocked || !lookLock);
        }
        function setLookLock(on) {
            lookLock = !!on;
            if (!lookLock && document.exitPointerLock && document.pointerLockElement) {
                document.exitPointerLock();
            }
            syncLookTip();
        }
        function setUiMode(on) {
            lookFrozen = !!on;
            dragLook = null;
            if (lookFrozen && document.exitPointerLock && document.pointerLockElement) {
                document.exitPointerLock();
            }
            syncLookTip();
        }
        function resumeLook() {
            lookFrozen = false;
            if (lookLock && !lite && canvas.requestPointerLock) canvas.requestPointerLock();
            syncLookTip();
        }
        function setCastMode(on) {
            lookFrozen = !!on;
            moveLocked = !!on;
            if (moveLocked) {
                input.fwd = false;
                input.back = false;
                input.left = false;
                input.right = false;
                input.jump = false;
                input.sneak = false;
                input.boost = false;
                input.rollL = false;
                input.rollR = false;
                analog.x = 0;
                analog.y = 0;
            } else {
                refreshKeys();
            }
            syncLookTip();
        }
        function bindInput() {
            document.addEventListener('keydown', function (e) {
                keys[e.key.toLowerCase()] = true;
                refreshKeys();
            });
            document.addEventListener('keyup', function (e) {
                keys[e.key.toLowerCase()] = false;
                refreshKeys();
            });
            canvas.addEventListener('click', function () {
                if (lookFrozen || lite || !lookLock) return;
                if (!pointerLocked && canvas.requestPointerLock) canvas.requestPointerLock();
            });
            document.addEventListener('pointerlockchange', function () {
                pointerLocked = document.pointerLockElement === canvas;
                syncLookTip();
            });
            document.addEventListener('mousemove', function (e) {
                if (lookFrozen || !pointerLocked) return;
                look.yaw -= e.movementX * SENS;
                look.pitch = Math.max(-1.35, Math.min(1.35, look.pitch - e.movementY * SENS));
            });
            canvas.addEventListener('pointerdown', function (e) {
                if (lookFrozen || pointerLocked) return;
                dragLook = { x: e.clientX, y: e.clientY, id: e.pointerId };
            });
            window.addEventListener('pointermove', function (e) {
                if (lookFrozen || !dragLook || e.pointerId !== dragLook.id) return;
                look.yaw -= (e.clientX - dragLook.x) * DRAG_SENS;
                look.pitch = Math.max(-1.35, Math.min(1.35, look.pitch - (e.clientY - dragLook.y) * DRAG_SENS));
                dragLook.x = e.clientX; dragLook.y = e.clientY;
            });
            window.addEventListener('pointerup', function (e) {
                if (dragLook && e.pointerId === dragLook.id) dragLook = null;
            });
            window.addEventListener('resize', resize);
        }

        /* ---------- 主循环（rAF 优先，挂起降级 setInterval，voxel 系同款） ---------- */
        let lastAt = 0, fpsCount = 0, fpsAt = 0, fps = 0;
        function tickLife(dt) {
            tickClouds(dt);
            terrainMat.userData.waterT = (terrainMat.userData.waterT || 0) + dt;
            if (terrainMat.userData.uWaterT) {
                terrainMat.userData.uWaterT.value = terrainMat.userData.waterT;
            }
            const sway = (global.BlockLegendFx && global.BlockLegendFx.plantSway)
                ? global.BlockLegendFx.plantSway(lite)
                : null;
            if (sway) {
                const swayT = terrainMat.userData.waterT;
                decor.children.forEach(function (m) {
                    const s = m.userData && m.userData.sway;
                    if (!s) return;
                    m.rotation.z = Math.sin(swayT * sway.speed + s.phase) * sway.angle * s.amp;
                });
            }
            /* 高空雾扩展:骑龙 y>50 时雾远端×1.8，倍率走 fx.fogAltitudeScale，不写 Fog.userData */
            if (scene.fog) {
                const FX = global.BlockLegendFx;
                const ext = FX && FX.fogAltitudeScale ? FX.fogAltitudeScale(player.y) : 1;
                scene.fog.near = fogBaseN * ext;
                scene.fog.far = fogBaseF * ext;
            }
            const Perf = global.BlockLegendPerf;
            function lifeNear(row, extra) {
                if (!Perf || !Perf.shouldTickLife) return true;
                return Perf.shouldTickLife(row, player, extra);
            }
            (world.animals || []).forEach(function (a) {
                if (!a.mesh) return;
                if (player.mounted === a) {
                    a.phase = (a.phase || 0) + dt;
                    a.x = player.x;
                    a.z = player.z;
                    a.y = player.y - 1.32;
                    a.yaw = look.yaw + Math.PI;
                    a.mesh.position.set(a.x, a.y, a.z);
                    a.mesh.rotation.y = a.yaw;
                    // 骑乘：左右倾斜(bank)+回旋(roll)走 Z，抬头低头走 X
                    a.mesh.rotation.z = a.roll || 0;
                    a.mesh.rotation.x = a.pitch || 0;
                    if (a.mesh.userData && typeof a.mesh.userData.tick === 'function') {
                        a.mesh.userData.tick(a.phase, true, {
                            bank: a.bank || 0,
                            pitch: a.pitch || 0,
                            breath: a.breath || 0
                        });
                    }
                    return;
                }
                const near = lifeNear(a);
                a.mesh.visible = near;
                if (!near) return;
                const hab = a.habitat || habitatOf(a.kind);
                const speed = a.rideable ? 0.36 : hab === 'air' ? 1.15 : hab === 'water' ? 0.55 : 0.7;
                const homeR = a.pen ? 2.2 : a.rideable ? 7 : hab === 'air' ? 16 : hab === 'water' ? 5 : 12;
                const moved = (a.hunting || a.fleeing) ? true : stepWander(a, dt, world, { speed: speed, homeR: homeR });
                if (isFarmKind(a.kind)) {
                    const min = farmBodyRadius(a.kind) + 0.35;
                    const dx = a.x - player.x;
                    const dz = a.z - player.z;
                    const dist = Math.hypot(dx, dz);
                    if (dist < min) {
                        const nx = dist < 0.001 ? 1 : dx / dist;
                        const nz = dist < 0.001 ? 0 : dz / dist;
                        a.x = player.x + nx * min;
                        a.z = player.z + nz * min;
                    }
                }
                a.y = lifeAltitude(a, world);
                a.mesh.position.set(a.x, a.y, a.z);
                a.mesh.rotation.y = a.yaw || 0;
                if (a.mesh.userData && typeof a.mesh.userData.tick === 'function') {
                    a.mesh.userData.tick(a.phase, hab === 'air' ? true : moved);
                }
            });
            (world.villagers || []).forEach(function (v) {
                if (!v.mesh) return;
                const near = lifeNear(v);
                v.mesh.visible = near;
                if (!near) return;
                const moved = stepWander(v, dt, world, { speed: 0.38, homeR: 8 });
                v.y = lifeAltitude(v, world) + Math.sin((v.phase || 0) * 2) * 0.03;
                v.mesh.position.set(v.x, v.y, v.z);
                v.mesh.rotation.y = v.yaw || 0;
                if (v.mesh.userData && typeof v.mesh.userData.tick === 'function') {
                    v.mesh.userData.tick(v.phase, moved);
                }
            });
            (world.golems || []).forEach(function (g) {
                if (!g.mesh) return;
                const near = lifeNear(g);
                g.mesh.visible = near;
                if (!near) return;
                const moved = g.guarding ? true : stepWander(g, dt, world, { speed: 0.55, homeR: 8 });
                g.y = lifeAltitude(g, world);
                g.mesh.position.set(g.x, g.y, g.z);
                g.mesh.rotation.y = g.yaw || 0;
                if (g.mesh.userData && typeof g.mesh.userData.tick === 'function') {
                    g.mesh.userData.tick(g.phase, moved);
                }
            });
            (world.placedProps || []).forEach(function (p) {
                if (!p.mesh) return;
                const near = lifeNear(p);
                p.mesh.visible = near;
                if (!near) return;
                if (p.mesh.userData && typeof p.mesh.userData.tick === 'function') {
                    p.t = (p.t || 0) + dt;
                    p.mesh.userData.tick(p.t);
                }
            });
        }
        let tickHook = null;
        function pump(now) {
            const t = (Number(now) || Date.now()) / 1000;
            const dt = Math.min(MAX_DT, lastAt ? t - lastAt : 0.016);
            lastAt = t;
            updatePhysics(dt, input);
            tickLife(dt);
            separatePlayerFromAnimals();
            streamChunks(1);
            if (typeof tickHook === 'function') tickHook(dt, t);
            if (punch.life > 0) punch.life = Math.max(0, punch.life - dt);
            if (fovPulse.life > 0) fovPulse.life = Math.max(0, fovPulse.life - dt);
            applyCamera();
            renderer.render(scene, camera);
            fpsCount += 1;
            if (t - fpsAt >= 1) {
                fps = fpsCount; fpsCount = 0; fpsAt = t;
                const el = document.getElementById('fps-label');
                if (el) el.textContent = String(fps);
            }
        }
        function startLoop() {
            requestAnimationFrame(function raf(now) {
                requestAnimationFrame(raf);
                pump(now);
            });
            setInterval(function () {
                const idle = performance.now() - (lastAt * 1000);
                if (idle > 500) pump(performance.now());
            }, 33);
        }

        bindInput();
        resize();
        const api = {
            THREE_REF: THREE,
            world: world,
            scene: scene,
            camera: camera,
            renderer: renderer,
            player: player,
            look: look,
            input: input,
            chunkMeshes: chunkMeshes,
            columnBlocked: columnBlocked,
            atlas: atlas,
            remeshAt: remeshAt,
            reloadWorld: function (next) {
                reloadWorld(next);
                api.world = world;
            },
            placeProp: function (kind, x, y, z) {
                const allowed = {
                    chest: 'createChest', furnace: 'createFurnace', torch: 'createTorch', bed: 'createBed',
                    door: 'createDoor', ladder: 'createLadder', fence: 'createFence', boat: 'createBoat',
                    lantern: 'createLantern', sign: 'createSign'
                };
                const factory = allowed[kind];
                if (!factory || y <= 0) return { ok: false };
                if (!world.placedProps) world.placedProps = [];
                const P = global.BlockLegendProps3d;
                const mesh = (P && typeof P[factory] === 'function')
                    ? P[factory](THREE)
                    : new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), new THREE.MeshLambertMaterial({ color: 0x8a5a28 }));
                mesh.position.set(x + 0.5, y, z + 0.5);
                decor.add(mesh);
                const row = { kind: kind, x: x, y: y, z: z, mesh: mesh, t: 0 };
                world.placedProps.push(row);
                return { ok: true, prop: row };
            },
            resize: resize,
            startLoop: startLoop,
            punch: addPunch,
            fovKick: addFovPulse,
            onTick: function (fn) { tickHook = fn; },
            fps: function () { return fps; },
            setUiMode: setUiMode,
            setLookLock: setLookLock,
            resumeLook: resumeLook,
            setCastMode: setCastMode,
            setHeld: setHeld,
            setMoveAxis: setMoveAxis,
            dismount: function () {
                if (!player.mounted) return false;
                const m = player.mounted;
                player.mounted = null;
                player.y = world.surfaceAt(Math.floor(player.x), Math.floor(player.z));
                player.vy = 0;
                if (m) {
                    m.homeX = player.x;
                    m.homeZ = player.z;
                    m.x = player.x;
                    m.z = player.z;
                    m.y = player.y + 0.12;
                }
                return true;
            }
        };
        return api;
    }

    global.BlockLegendEngine = {
        WORLD_SIZE: WORLD_SIZE,
        CHUNK: CHUNK,
        VIEW_CHUNKS: VIEW_CHUNKS,
        chunksAround: chunksAround,
        ATLAS_COLS: ATLAS_COLS,
        ATLAS_ROWS: ATLAS_ROWS,
        tileIndex: tileIndex,
        tileCornersUV: tileCornersUV,
        faceShade: faceShade,
        vertexAO: vertexAO,
        PIXEL_RATIO_CAP: PIXEL_RATIO_CAP,
        EYE_HEIGHT: EYE_HEIGHT,
        MOVE_SPEED: MOVE_SPEED,
        moveSpeedMul: moveSpeedMul,
        JUMP_VY: JUMP_VY,
        GRAVITY: GRAVITY,
        STEP_UP: STEP_UP,
        TREE_COUNT: TREE_COUNT,
        createWorld: createWorld,
        biomeAt: biomeAt,
        climateOf: climateOf,
        blockColor: blockColor,
        hasBlock: hasBlock,
        blockKindAt: blockKindAt,
        voxelAt: voxelAt,
        voxelSpecies: voxelSpecies,
        removeTree: removeTree,
        breakVoxel: breakVoxel,
        placeVoxel: placeVoxel,
        inHouse: inHouse,
        habitatOf: habitatOf,
        lifeAltitude: lifeAltitude,
        stepWander: stepWander,
        growWheat: growWheat,
        harvestWheat: harvestWheat,
        catchFish: catchFish,
        columnBlockedAt: columnBlockedAt,
        wallBetween: wallBetween,
        collectChunkFaces: collectChunkFaces,
        openWordGate: openWordGate,
        create: create
    };
}(typeof window !== 'undefined' ? window : globalThis));
