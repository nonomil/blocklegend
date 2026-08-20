/**
 * blocklegend · 8 张手绘 16×16 核心块（ART-01）+ 镂空叶染色（ART-02）
 * 有限色盘、固定形状，不是 Fable5 噪声填充。
 * 浏览器挂 window.BlockLegendAtlasPaint，node 可 import。
 */
(function (global) {
    'use strict';

    const TILE = 16;
    const CORE = {
        grass_top: 0,
        grass_side: 1,
        dirt: 2,
        stone: 3,
        oak_side: 4,
        oak_top: 5,
        oak_leaf: 6,
        sand: 24
    };

    function wrapSeam(rows) {
        const out = rows.map(function (row) {
            return row.slice(0, row.length - 1) + row.charAt(0);
        });
        out[out.length - 1] = out[0];
        return out;
    }

    const TILES = {
        grass_top: {
            palette: {
                d: [68, 148, 36, 255],
                s: [96, 184, 52, 255],
                g: [126, 208, 72, 255],
                G: [158, 230, 94, 255]
            },
            rows: wrapSeam([
                'ggGgggggGgggggsg',
                'ggggdgggggGggggg',
                'ssgsgggGggggsggg',
                'ssssggggggGggggg',
                'sgsgggGGGGGgggsg',
                'gggGgggGGGGggggg',
                'ggggdgggGGgggGgg',
                'gGgggggggggsgggg',
                'ggggsgggGggggggg',
                'ggggddgggggGgggg',
                'gGggddggggsgggGg',
                'gggggggGgggGGggg',
                'ggsggggggggGGgsg',
                'gggggGggdggggggg',
                'gGgggggggggsgGgg',
                'ggggsgggGggggggg'
            ])
        },
        grass_side: {
            palette: {
                G: [158, 230, 94, 255],
                g: [126, 208, 72, 255],
                s: [96, 184, 52, 255],
                D: [118, 78, 48, 255],
                m: [168, 118, 72, 255],
                L: [198, 148, 96, 255],
                p: [88, 58, 36, 255]
            },
            rows: [
                'ggggGGggggGGgggg',
                'ggGGggggggggGGgg',
                'ssggggggssggggss',
                'mmmmmmmmmmmmmmmm',
                'mmmLLmmmmmmLLmmm',
                'mmmLLmmmmmmLLmmm',
                'mmmmmmmmmmmmmmmm',
                'mmmmmmmDDmmmmmmm',
                'mmmmmmmDDmmmmmmm',
                'mmmmmmmmmmmmmmmm',
                'mmLLmmmmmmmmLLmm',
                'mmLLmmmmmmmmLLmm',
                'mmmmmmmmmmmmmmmm',
                'mmmmmmmpppmmmmmm',
                'mmmmmmmmmmmmmmmm',
                'DmmmmmmmmmmmmmmD'
            ]
        },
        dirt: {
            palette: {
                D: [112, 74, 46, 255],
                m: [158, 110, 68, 255],
                L: [198, 148, 96, 255],
                p: [86, 56, 34, 255],
                h: [214, 172, 118, 255]
            },
            rows: [
                'mmLmmmDmmmLmmmDm',
                'mLmmDmmmmLmmmDmm',
                'mmmmLmmDmmmhmmLm',
                'mDmmmLmmmDmmmmLm',
                'mmLmmmDmmmLmmDmm',
                'mmmDmmmLmmmmDmmm',
                'mLmmmDmpmmLmmmDm',
                'mmmmLmmmDmmmmLmm',
                'mDmmmmmLmmmDmmmm',
                'mmLmmDmmmmLmmmDm',
                'mmmDmmmLhmmDmmmm',
                'mLmmmDmmmmLmmDmm',
                'mmmmLmmmDmmmmLmm',
                'mDmmmmmLmmmDmpmm',
                'mmLmmDmmmmLmmmDm',
                'mmLmmmDmmmLmmmDm'
            ]
        },
        stone: {
            palette: {
                D: [70, 72, 78, 255],
                m: [118, 120, 126, 255],
                L: [162, 164, 170, 255],
                c: [44, 44, 48, 255],
                h: [188, 190, 196, 255]
            },
            rows: [
                'mmLmmmDmmmLmmmDm',
                'mLmmDmmmmLmmmDmm',
                'mmmmcLmmDmmmhmmm',
                'mDmmcLmmmDmmmmLm',
                'mmLmcmDmmmLmmDmm',
                'mmmDccmLmmmmDmmm',
                'mLmmmDcmmmLmmmDm',
                'mmmmLmmcDmmmmLmm',
                'mDmmmmmLccmDmmmm',
                'mmLmmDmmmccmmmDm',
                'mmmDmmmLhmcDmmmm',
                'mLmmmDmmmmcmmDmm',
                'mmmmLmmmDmmmmLmm',
                'mDmmmmmLmmmDmmmm',
                'mmLmmDmmmmLmmmDm',
                'mmLmmmDmmmLmmmDm'
            ]
        },
        oak_side: {
            palette: {
                D: [86, 54, 30, 255],
                m: [148, 98, 52, 255],
                L: [186, 132, 72, 255],
                k: [58, 36, 20, 255],
                g: [168, 118, 64, 255],
                o: [78, 118, 42, 255]
            },
            rows: [
                'DmLgDmLgDkLgDmLg',
                'DmLgDmLgDmLgDmLg',
                'DmLgDkkgDmLgDoLg',
                'DkLgDkkkDmLgDmLg',
                'DmLgDmLgDmLgDmLg',
                'DoLgDmLgDkLgDmLg',
                'DmLgDmLgDkkgDmLg',
                'DmLgDkLgDkkkDmLg',
                'DmLgDmLgDmLgDoLg',
                'DkLgDmLgDmLgDmLg',
                'DkkgDmLgDoLgDmLg',
                'DkkkDmLgDmLgDkLg',
                'DmLgDoLgDmLgDmLg',
                'DmLgDmLgDkLgDmLg',
                'DoLgDmLgDmLgDmLg',
                'DmLgDmLgDmLgDkLg'
            ]
        },
        oak_top: {
            palette: {
                b: [96, 60, 34, 255],
                r: [168, 118, 64, 255],
                h: [214, 176, 112, 255],
                c: [232, 204, 148, 255],
                d: [72, 44, 24, 255]
            },
            rows: [
                'bbbbbbbbbbbbbbbb',
                'brrrrrrrrrrrrrrb',
                'brhhhhhhhhhhhhrb',
                'brhcccccccccchrb',
                'brhccchhhhccchrb',
                'brhccchddhccchrb',
                'brhccchddhccchrb',
                'brhcccddddccchrb',
                'brhcccddddccchrb',
                'brhccchddhccchrb',
                'brhccchddhccchrb',
                'brhccchhhhccchrb',
                'brhcccccccccchrb',
                'brhhhhhhhhhhhhrb',
                'brrrrrrrrrrrrrrb',
                'bbbbbbbbbbbbbbbb'
            ]
        },
        oak_leaf: {
            palette: {
                '.': [0, 0, 0, 0],
                d: [28, 70, 22, 255],
                D: [48, 112, 34, 255],
                g: [78, 158, 48, 255],
                G: [139, 224, 74, 255],
                y: [188, 253, 96, 255]
            },
            rows: [
                '..GGyy..yGGyGG..',
                '.GGyyGGyyGGyyGG.',
                'gGGyGGyGGyGGyGGy',
                'gGGyGGdGGdGGdGGd',
                '.GGyGGdDDdGGdGGd',
                'gGGyGGdDDdGGdDDd',
                'gGGyGGdDDdDDdDDD',
                '.gGyGGdDDdDDdDD.',
                'gdGGdDDdDDdDDDDD',
                'gdgGdDDdDDdDDDDD',
                '.gdgGdDDdDDdDDDD',
                'gdggdDDdDDdDDDD.',
                'gdggDDdDDDDdDDDD',
                '.gdgDDdDDDDdDDDg',
                '..gdgDDdDDDgDD..',
                '...gd.DDDd.DDD..'
            ]
        },
        sand: {
            palette: {
                D: [168, 132, 58, 255],
                m: [210, 174, 92, 255],
                L: [232, 204, 124, 255],
                s: [148, 112, 48, 255],
                h: [242, 220, 156, 255]
            },
            rows: [
                'mmLmmmLmmmLmmmLm',
                'mLmmhmmmmLmmmDmm',
                'LLLLLLLLLLLLLLLL',
                'mDmmmLmmmDmmmmLm',
                'mmLmmmDmmmLmmDmm',
                'ssssssssssssssss',
                'mLmmmDmmmmLmmmDm',
                'mmmmLmmmDmmmmLmm',
                'mmLmmLmmLmmLmmLm',
                'mDmmmmmLmmmDmmmm',
                'LLLLLLLLLLLLLLLL',
                'mmmDmmmLhmmDmmmm',
                'mLmmmDmmmmLmmDmm',
                'ssDssDssDssDssDs',
                'mmLmmDmmmmLmmmDm',
                'mmLmmmLmmmLmmmLm'
            ]
        }
    };

    function decodeTile(name) {
        const spec = TILES[name];
        if (!spec) throw new Error('unknown atlas tile ' + name);
        const out = [];
        let y;
        for (y = 0; y < TILE; y += 1) {
            const row = spec.rows[y];
            if (!row || row.length !== TILE) throw new Error(name + ' row ' + y + ' must be 16 chars');
            let x;
            for (x = 0; x < TILE; x += 1) {
                const key = row.charAt(x);
                const rgba = spec.palette[key];
                if (!rgba) throw new Error(name + ' missing palette ' + key);
                out.push({ r: rgba[0], g: rgba[1], b: rgba[2], a: rgba[3] });
            }
        }
        return out;
    }

    function paintCore(putPixel) {
        Object.keys(CORE).forEach(function (name) {
            const index = CORE[name];
            const pix = decodeTile(name);
            let i;
            for (i = 0; i < pix.length; i += 1) {
                const p = pix[i];
                putPixel(index, i % TILE, (i / TILE) | 0, p.r, p.g, p.b, p.a);
            }
        });
    }

    const LEAF_SLOTS = {
        oak: 6,
        birch: 10,
        spruce: 13,
        cherry: 22
    };
    const LEAF_TINT = {
        oak: [1, 1, 1],
        birch: [1.15, 1.08, 0.72],
        spruce: [0.72, 0.92, 0.78],
        cherry: [1.35, 0.72, 0.95]
    };

    function paintLeaves(putPixel) {
        const base = decodeTile('oak_leaf');
        Object.keys(LEAF_SLOTS).forEach(function (name) {
            const index = LEAF_SLOTS[name];
            const tint = LEAF_TINT[name];
            let i;
            for (i = 0; i < base.length; i += 1) {
                const p = base[i];
                putPixel(
                    index,
                    i % TILE,
                    (i / TILE) | 0,
                    Math.max(0, Math.min(255, Math.round(p.r * tint[0]))),
                    Math.max(0, Math.min(255, Math.round(p.g * tint[1]))),
                    Math.max(0, Math.min(255, Math.round(p.b * tint[2]))),
                    p.a
                );
            }
        });
    }

    global.BlockLegendAtlasPaint = {
        TILE: TILE,
        CORE: CORE,
        TILES: TILES,
        LEAF_SLOTS: LEAF_SLOTS,
        decodeTile: decodeTile,
        paintCore: paintCore,
        paintLeaves: paintLeaves
    };
}(typeof window !== 'undefined' ? window : globalThis));
