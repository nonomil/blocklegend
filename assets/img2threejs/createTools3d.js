/**
 * BlockLegend first-person tools — procedural THREE.Group from voxel tool refs.
 * Original designs (oak + iron/bronze). Not Mojang item meshes or official textures.
 * Refs: prj/assets/generated/blocklegend-tools/raw/{sword,axe,pickaxe,bow,arrow,shovel}.png
 */
(function (global) {
    'use strict';

    const TEX = {};

    function pixTex(THREE, key, paint) {
        if (TEX[key]) return TEX[key];
        const c = document.createElement('canvas');
        c.width = 8;
        c.height = 8;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        paint(ctx);
        const tex = new THREE.CanvasTexture(c);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.generateMipmaps = false;
        TEX[key] = tex;
        return tex;
    }

    function woodTex(THREE) {
        return pixTex(THREE, 'wood', function (ctx) {
            for (let y = 0; y < 8; y += 1) {
                ctx.fillStyle = y % 2 ? '#8a6234' : '#6b4424';
                ctx.fillRect(0, y, 8, 1);
                ctx.fillStyle = '#5a3418';
                ctx.fillRect(2, y, 1, 1);
                ctx.fillRect(6, y, 1, 1);
            }
        });
    }

    function leatherTex(THREE) {
        return pixTex(THREE, 'leather', function (ctx) {
            ctx.fillStyle = '#5a3824';
            ctx.fillRect(0, 0, 8, 8);
            ctx.fillStyle = '#3a2418';
            ctx.fillRect(0, 1, 8, 1);
            ctx.fillRect(0, 4, 8, 1);
            ctx.fillRect(0, 7, 8, 1);
            ctx.fillStyle = '#7a4a28';
            ctx.fillRect(1, 2, 6, 1);
        });
    }

    function steelTex(THREE) {
        return pixTex(THREE, 'steel', function (ctx) {
            ctx.fillStyle = '#d8dee6';
            ctx.fillRect(0, 0, 8, 8);
            ctx.fillStyle = '#eef2f6';
            ctx.fillRect(2, 0, 2, 8);
            ctx.fillStyle = '#9aa2ac';
            ctx.fillRect(0, 0, 8, 1);
            ctx.fillRect(0, 7, 8, 1);
            ctx.fillStyle = '#c4cad2';
            ctx.fillRect(6, 1, 1, 6);
        });
    }

    function ironTex(THREE) {
        return pixTex(THREE, 'iron', function (ctx) {
            ctx.fillStyle = '#8a929c';
            ctx.fillRect(0, 0, 8, 8);
            ctx.fillStyle = '#b4bac4';
            ctx.fillRect(1, 1, 3, 6);
            ctx.fillStyle = '#6a727c';
            ctx.fillRect(0, 0, 8, 1);
            ctx.fillRect(6, 2, 2, 4);
        });
    }

    function goldTex(THREE) {
        return pixTex(THREE, 'gold', function (ctx) {
            ctx.fillStyle = '#e0b040';
            ctx.fillRect(0, 0, 8, 8);
            ctx.fillStyle = '#f4d878';
            ctx.fillRect(2, 1, 3, 5);
            ctx.fillStyle = '#b88820';
            ctx.fillRect(0, 6, 8, 2);
        });
    }

    function diamondTex(THREE) {
        return pixTex(THREE, 'diamond', function (ctx) {
            ctx.fillStyle = '#3ad4d4';
            ctx.fillRect(0, 0, 8, 8);
            ctx.fillStyle = '#b8fff6';
            ctx.fillRect(2, 1, 3, 5);
            ctx.fillStyle = '#1a8a8a';
            ctx.fillRect(0, 0, 8, 1);
            ctx.fillRect(0, 7, 8, 1);
        });
    }

    function oakTex(THREE) {
        return pixTex(THREE, 'oak', function (ctx) {
            ctx.fillStyle = '#c4a06a';
            ctx.fillRect(0, 0, 8, 8);
            ctx.fillStyle = '#a07840';
            ctx.fillRect(0, 2, 8, 1);
            ctx.fillRect(0, 5, 8, 1);
            ctx.fillStyle = '#d8b888';
            ctx.fillRect(1, 0, 2, 8);
        });
    }

    function headTex(THREE, tier) {
        if (tier === 'diamond') return diamondTex(THREE);
        if (tier === 'iron') return ironTex(THREE);
        if (tier === 'gold') return goldTex(THREE);
        return oakTex(THREE);
    }

    function mesh(THREE, w, h, d, tex, color) {
        const mat = new THREE.MeshLambertMaterial({
            map: tex || null,
            color: tex ? 0xffffff : color
        });
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        return m;
    }

    function add(g, part, x, y, z) {
        part.position.set(x, y, z);
        g.add(part);
        return part;
    }

    function createSword(THREE) {
        const g = new THREE.Group();
        g.name = 'sword';
        const wood = woodTex(THREE);
        const leather = leatherTex(THREE);
        const steel = steelTex(THREE);
        const gold = goldTex(THREE);
        add(g, mesh(THREE, 0.07, 0.05, 0.07, gold), 0, 0.03, 0);
        add(g, mesh(THREE, 0.045, 0.18, 0.045, wood), 0, 0.14, 0);
        add(g, mesh(THREE, 0.062, 0.14, 0.062, leather), 0, 0.15, 0);
        add(g, mesh(THREE, 0.26, 0.045, 0.07, gold), 0, 0.26, 0);
        add(g, mesh(THREE, 0.05, 0.05, 0.08, gold), 0, 0.26, 0);
        add(g, mesh(THREE, 0.055, 0.1, 0.028, steel), 0, 0.34, 0);
        add(g, mesh(THREE, 0.09, 0.22, 0.022, steel), 0, 0.5, 0);
        add(g, mesh(THREE, 0.07, 0.16, 0.02, steel), 0, 0.68, 0);
        add(g, mesh(THREE, 0.045, 0.1, 0.018, steel), 0, 0.8, 0);
        add(g, mesh(THREE, 0.028, 0.07, 0.016, steel), 0, 0.88, 0);
        const glow = mesh(THREE, 0.018, 0.42, 0.026, null, 0xffffff);
        glow.material.emissive = new THREE.Color(0x8899bb);
        add(g, glow, 0, 0.58, 0);
        g.userData.glow = glow;
        return g;
    }

    function createIronSword(THREE) {
        const g = new THREE.Group();
        g.name = 'iron_sword';
        const wood = woodTex(THREE);
        const leather = leatherTex(THREE);
        const steel = steelTex(THREE);
        const iron = ironTex(THREE);
        add(g, mesh(THREE, 0.072, 0.052, 0.072, iron), 0, 0.03, 0);
        add(g, mesh(THREE, 0.046, 0.2, 0.046, wood), 0, 0.15, 0);
        add(g, mesh(THREE, 0.064, 0.15, 0.064, leather), 0, 0.16, 0);
        add(g, mesh(THREE, 0.28, 0.048, 0.075, iron), 0, 0.28, 0);
        add(g, mesh(THREE, 0.06, 0.11, 0.03, steel), 0, 0.37, 0);
        add(g, mesh(THREE, 0.1, 0.24, 0.024, steel), 0, 0.54, 0);
        add(g, mesh(THREE, 0.075, 0.18, 0.022, steel), 0, 0.74, 0);
        add(g, mesh(THREE, 0.048, 0.11, 0.02, steel), 0, 0.88, 0);
        add(g, mesh(THREE, 0.03, 0.08, 0.018, steel), 0, 0.97, 0);
        return g;
    }

    function createAxe(THREE) {
        const g = new THREE.Group();
        g.name = 'axe';
        const wood = woodTex(THREE);
        const leather = leatherTex(THREE);
        const iron = ironTex(THREE);
        const steel = steelTex(THREE);
        add(g, mesh(THREE, 0.045, 0.72, 0.045, wood), 0, 0.36, 0);
        add(g, mesh(THREE, 0.06, 0.1, 0.06, leather), 0, 0.58, 0);
        add(g, mesh(THREE, 0.14, 0.16, 0.1, iron), 0.04, 0.66, 0);
        add(g, mesh(THREE, 0.1, 0.2, 0.07, steel), 0.16, 0.66, 0);
        add(g, mesh(THREE, 0.08, 0.26, 0.05, steel), 0.24, 0.66, 0);
        add(g, mesh(THREE, 0.05, 0.18, 0.04, steel), 0.3, 0.66, 0);
        return g;
    }

    function createPickaxe(THREE) {
        const g = new THREE.Group();
        g.name = 'pickaxe';
        const wood = woodTex(THREE);
        const leather = leatherTex(THREE);
        const iron = ironTex(THREE);
        const steel = steelTex(THREE);
        add(g, mesh(THREE, 0.045, 0.7, 0.045, wood), 0, 0.35, 0);
        add(g, mesh(THREE, 0.06, 0.1, 0.06, leather), 0, 0.58, 0);
        add(g, mesh(THREE, 0.12, 0.1, 0.1, iron), 0, 0.68, 0);
        const left = mesh(THREE, 0.22, 0.07, 0.07, steel);
        left.position.set(-0.16, 0.64, 0);
        left.rotation.z = 0.38;
        g.add(left);
        const right = mesh(THREE, 0.22, 0.07, 0.07, steel);
        right.position.set(0.16, 0.64, 0);
        right.rotation.z = -0.38;
        g.add(right);
        add(g, mesh(THREE, 0.07, 0.07, 0.06, steel), -0.26, 0.56, 0);
        add(g, mesh(THREE, 0.07, 0.07, 0.06, steel), 0.26, 0.56, 0);
        add(g, mesh(THREE, 0.05, 0.05, 0.05, steel), -0.3, 0.52, 0);
        add(g, mesh(THREE, 0.05, 0.05, 0.05, steel), 0.3, 0.52, 0);
        return g;
    }

    function createBow(THREE) {
        const g = new THREE.Group();
        g.name = 'bow';
        const wood = woodTex(THREE);
        const leather = leatherTex(THREE);
        add(g, mesh(THREE, 0.05, 0.16, 0.05, leather), 0, 0.36, 0);
        const segs = [
            [0.05, 0.12, 0.05, 0.02, 0.22, 0],
            [0.05, 0.12, 0.05, 0.08, 0.12, 0],
            [0.05, 0.1, 0.05, 0.1, 0.04, 0],
            [0.05, 0.12, 0.05, 0.08, 0.6, 0],
            [0.05, 0.12, 0.05, 0.02, 0.5, 0],
            [0.05, 0.1, 0.05, 0.1, 0.68, 0]
        ];
        segs.forEach(function (s) {
            add(g, mesh(THREE, s[0], s[1], s[2], wood), s[3], s[4], s[5]);
        });
        const upper = mesh(THREE, 0.05, 0.14, 0.05, wood);
        upper.position.set(0.04, 0.62, 0);
        upper.rotation.z = -0.55;
        g.add(upper);
        const lower = mesh(THREE, 0.05, 0.14, 0.05, wood);
        lower.position.set(0.04, 0.1, 0);
        lower.rotation.z = 0.55;
        g.add(lower);
        add(g, mesh(THREE, 0.012, 0.62, 0.012, null, 0xf0e6d2), 0.16, 0.36, 0);
        return g;
    }

    function createArrow(THREE) {
        const g = new THREE.Group();
        g.name = 'arrow';
        const wood = woodTex(THREE);
        const iron = ironTex(THREE);
        add(g, mesh(THREE, 0.022, 0.5, 0.022, wood), 0, 0.28, 0);
        add(g, mesh(THREE, 0.05, 0.06, 0.05, iron), 0, 0.56, 0);
        add(g, mesh(THREE, 0.035, 0.05, 0.035, iron), 0, 0.61, 0);
        add(g, mesh(THREE, 0.02, 0.04, 0.02, iron), 0, 0.65, 0);
        add(g, mesh(THREE, 0.09, 0.07, 0.012, null, 0xc45a3a), 0, 0.06, 0);
        add(g, mesh(THREE, 0.012, 0.07, 0.09, null, 0xc45a3a), 0, 0.06, 0);
        return g;
    }

    function createShovel(THREE) {
        const g = new THREE.Group();
        g.name = 'shovel';
        const wood = woodTex(THREE);
        const leather = leatherTex(THREE);
        const iron = ironTex(THREE);
        const steel = steelTex(THREE);
        add(g, mesh(THREE, 0.045, 0.62, 0.045, wood), 0, 0.31, 0);
        add(g, mesh(THREE, 0.06, 0.08, 0.06, leather), 0, 0.18, 0);
        add(g, mesh(THREE, 0.055, 0.1, 0.055, iron), 0, 0.64, 0);
        add(g, mesh(THREE, 0.16, 0.2, 0.04, steel), 0, 0.78, 0);
        add(g, mesh(THREE, 0.18, 0.04, 0.05, iron), 0, 0.7, 0);
        add(g, mesh(THREE, 0.14, 0.03, 0.03, iron), 0, 0.88, 0);
        return g;
    }

    function createShield(THREE) {
        const g = new THREE.Group();
        g.name = 'shield';
        const wood = woodTex(THREE);
        const iron = ironTex(THREE);
        const gold = goldTex(THREE);
        add(g, mesh(THREE, 0.42, 0.52, 0.05, iron), 0, 0.26, 0);
        add(g, mesh(THREE, 0.36, 0.46, 0.06, wood), 0, 0.26, 0.01);
        add(g, mesh(THREE, 0.12, 0.12, 0.08, gold), 0, 0.28, 0.05);
        add(g, mesh(THREE, 0.38, 0.04, 0.04, iron), 0, 0.04, 0);
        add(g, mesh(THREE, 0.38, 0.04, 0.04, iron), 0, 0.48, 0);
        return g;
    }

    function createSwordOf(THREE, tier) {
        const g = new THREE.Group();
        g.name = (tier || 'wood') + '_sword';
        const wood = woodTex(THREE);
        const head = headTex(THREE, tier);
        add(g, mesh(THREE, 0.07, 0.05, 0.07, head), 0, 0.03, 0);
        add(g, mesh(THREE, 0.045, 0.18, 0.045, wood), 0, 0.14, 0);
        add(g, mesh(THREE, 0.26, 0.045, 0.07, head), 0, 0.26, 0);
        add(g, mesh(THREE, 0.09, 0.22, 0.022, head), 0, 0.5, 0);
        add(g, mesh(THREE, 0.07, 0.16, 0.02, head), 0, 0.68, 0);
        add(g, mesh(THREE, 0.045, 0.1, 0.018, head), 0, 0.8, 0);
        add(g, mesh(THREE, 0.028, 0.07, 0.016, head), 0, 0.88, 0);
        return g;
    }

    function createAxeOf(THREE, tier) {
        const g = new THREE.Group();
        g.name = (tier || 'wood') + '_axe';
        const wood = woodTex(THREE);
        const head = headTex(THREE, tier);
        add(g, mesh(THREE, 0.045, 0.72, 0.045, wood), 0, 0.36, 0);
        add(g, mesh(THREE, 0.14, 0.16, 0.1, head), 0.04, 0.66, 0);
        add(g, mesh(THREE, 0.1, 0.2, 0.07, head), 0.16, 0.66, 0);
        add(g, mesh(THREE, 0.08, 0.26, 0.05, head), 0.24, 0.66, 0);
        return g;
    }

    function createPickaxeOf(THREE, tier) {
        const g = new THREE.Group();
        g.name = (tier || 'wood') + '_pickaxe';
        const wood = woodTex(THREE);
        const head = headTex(THREE, tier);
        add(g, mesh(THREE, 0.045, 0.7, 0.045, wood), 0, 0.35, 0);
        add(g, mesh(THREE, 0.12, 0.1, 0.1, head), 0, 0.68, 0);
        const left = mesh(THREE, 0.22, 0.07, 0.07, head);
        left.position.set(-0.16, 0.64, 0);
        left.rotation.z = 0.38;
        g.add(left);
        const right = mesh(THREE, 0.22, 0.07, 0.07, head);
        right.position.set(0.16, 0.64, 0);
        right.rotation.z = -0.38;
        g.add(right);
        return g;
    }

    function createShovelOf(THREE, tier) {
        const g = new THREE.Group();
        g.name = (tier || 'wood') + '_shovel';
        const wood = woodTex(THREE);
        const head = headTex(THREE, tier);
        add(g, mesh(THREE, 0.045, 0.62, 0.045, wood), 0, 0.31, 0);
        add(g, mesh(THREE, 0.055, 0.1, 0.055, head), 0, 0.64, 0);
        add(g, mesh(THREE, 0.16, 0.2, 0.04, head), 0, 0.78, 0);
        add(g, mesh(THREE, 0.18, 0.04, 0.05, head), 0, 0.7, 0);
        add(g, mesh(THREE, 0.14, 0.03, 0.03, head), 0, 0.88, 0);
        return g;
    }

    function createWoodSword(THREE) { return createSwordOf(THREE, 'wood'); }
    function createGoldSword(THREE) { return createSwordOf(THREE, 'gold'); }
    function createDiamondSword(THREE) { return createSwordOf(THREE, 'diamond'); }
    function createWoodAxe(THREE) { return createAxeOf(THREE, 'wood'); }
    function createIronAxe(THREE) { return createAxeOf(THREE, 'iron'); }
    function createGoldAxe(THREE) { return createAxeOf(THREE, 'gold'); }
    function createDiamondAxe(THREE) { return createAxeOf(THREE, 'diamond'); }
    function createWoodPickaxe(THREE) { return createPickaxeOf(THREE, 'wood'); }
    function createIronPickaxe(THREE) { return createPickaxeOf(THREE, 'iron'); }
    function createGoldPickaxe(THREE) { return createPickaxeOf(THREE, 'gold'); }
    function createDiamondPickaxe(THREE) { return createPickaxeOf(THREE, 'diamond'); }
    function createWoodShovel(THREE) { return createShovelOf(THREE, 'wood'); }
    function createIronShovel(THREE) { return createShovelOf(THREE, 'iron'); }
    function createGoldShovel(THREE) { return createShovelOf(THREE, 'gold'); }
    function createDiamondShovel(THREE) { return createShovelOf(THREE, 'diamond'); }

    global.BlockLegendTools3d = {
        createSword: createSword,
        createIronSword: createIronSword,
        createGoldSword: createGoldSword,
        createDiamondSword: createDiamondSword,
        createWoodSword: createWoodSword,
        createAxe: createAxe,
        createWoodAxe: createWoodAxe,
        createIronAxe: createIronAxe,
        createGoldAxe: createGoldAxe,
        createDiamondAxe: createDiamondAxe,
        createPickaxe: createPickaxe,
        createWoodPickaxe: createWoodPickaxe,
        createIronPickaxe: createIronPickaxe,
        createGoldPickaxe: createGoldPickaxe,
        createDiamondPickaxe: createDiamondPickaxe,
        createPickaxeOf: createPickaxeOf,
        createAxeOf: createAxeOf,
        createSwordOf: createSwordOf,
        createShovelOf: createShovelOf,
        createBow: createBow,
        createArrow: createArrow,
        createShovel: createShovel,
        createWoodShovel: createWoodShovel,
        createIronShovel: createIronShovel,
        createGoldShovel: createGoldShovel,
        createDiamondShovel: createDiamondShovel,
        createShield: createShield
    };
}(typeof window !== 'undefined' ? window : globalThis));
