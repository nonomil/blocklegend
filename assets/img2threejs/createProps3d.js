(function (global) {
    'use strict';

    function box(THREE, w, h, d, color, opts) {
        const o = opts || {};
        return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({
            color: color,
            emissive: o.emissive || 0x000000
        }));
    }

    function createChest(THREE) {
        const g = new THREE.Group();
        g.name = 'chest';
        const P = global.BlockLegendVoxelPix;
        const wood = P ? P.regionMat(THREE, 'chest', 8, 8, 16, 12) : null;
        const top = P ? P.regionMat(THREE, 'chest', 8, 0, 16, 8) : null;
        const body = wood
            ? new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.58), [wood, wood, top, wood, wood, wood])
            : box(THREE, 0.9, 0.55, 0.58, 0x8a5a28);
        const lid = wood
            ? new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.22, 0.6), [wood, wood, top, wood, wood, wood])
            : box(THREE, 0.92, 0.22, 0.6, 0x6b4424);
        const latch = box(THREE, 0.12, 0.14, 0.08, 0xe0b040);
        body.position.y = 0.28;
        lid.position.y = 0.62;
        latch.position.set(0, 0.52, 0.32);
        g.add(body); g.add(lid); g.add(latch);
        g.userData.open = false;
        g.userData.toggle = function () {
            g.userData.open = !g.userData.open;
            lid.rotation.x = g.userData.open ? -0.95 : 0;
            lid.position.z = g.userData.open ? -0.14 : 0;
            latch.position.y = g.userData.open ? 0.72 : 0.52;
        };
        return g;
    }

    function createFurnace(THREE) {
        const g = new THREE.Group();
        g.name = 'furnace';
        const P = global.BlockLegendVoxelPix;
        const stone = P ? P.regionMat(THREE, 'furnace', 8, 8, 16, 16) : null;
        const face = P ? P.regionMat(THREE, 'furnace', 8, 8, 16, 16) : null;
        const body = stone
            ? new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), [stone, stone, stone, stone, face, stone])
            : box(THREE, 0.9, 0.9, 0.9, 0x7a7a80);
        const window = box(THREE, 0.36, 0.28, 0.06, 0xff8a2a, { emissive: 0x662200 });
        const lip = box(THREE, 0.5, 0.08, 0.08, 0x4a4a50);
        body.position.y = 0.45;
        window.position.set(0, 0.42, 0.46);
        lip.position.set(0, 0.24, 0.46);
        g.add(body); g.add(window); g.add(lip);
        g.userData.lit = false;
        g.userData.toggle = function () {
            g.userData.lit = !g.userData.lit;
        };
        g.userData.tick = function (t) {
            if (!g.userData.lit) {
                window.scale.set(1, 1, 1);
                return;
            }
            const s = 1 + Math.sin(t * 10) * 0.14;
            window.scale.set(s, s, 1);
        };
        return g;
    }

    function createTorch(THREE) {
        const g = new THREE.Group();
        g.name = 'torch';
        const P = global.BlockLegendVoxelPix;
        const wood = P ? P.regionMat(THREE, 'chest', 8, 8, 8, 8) : null;
        const stick = wood
            ? new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), wood)
            : box(THREE, 0.08, 0.5, 0.08, 0x6b4424);
        const flame = box(THREE, 0.16, 0.2, 0.16, 0xffc04a, { emissive: 0xaa5500 });
        const tip = box(THREE, 0.1, 0.14, 0.1, 0xff7a28, { emissive: 0x882200 });
        stick.position.y = 0.25;
        flame.position.y = 0.56;
        tip.position.y = 0.68;
        g.add(stick); g.add(flame); g.add(tip);
        g.userData.tick = function (t) {
            const s = 1 + Math.sin(t * 14) * 0.12;
            flame.scale.set(s, 1 + Math.sin(t * 11) * 0.18, s);
            tip.position.y = 0.68 + Math.sin(t * 17) * 0.03;
        };
        return g;
    }

    function createBed(THREE) {
        const g = new THREE.Group();
        g.name = 'bed';
        const wood = 0x6d4c41;
        const dark = 0x4e342e;
        const frame = box(THREE, 0.98, 0.12, 0.62, wood);
        const mattress = box(THREE, 0.92, 0.08, 0.56, 0xc62828);
        const pillow = box(THREE, 0.26, 0.08, 0.42, 0xf5f5f5);
        const board = box(THREE, 0.08, 0.36, 0.64, dark);
        frame.position.y = 0.16;
        mattress.position.y = 0.26;
        pillow.position.set(-0.30, 0.34, 0);
        board.position.set(-0.48, 0.28, 0);
        function addLeg(name, x, z) {
            const leg = box(THREE, 0.08, 0.12, 0.08, dark);
            leg.name = name;
            leg.position.set(x, 0.06, z);
            g.add(leg);
        }
        addLeg('legFL', -0.42, 0.24);
        addLeg('legFR', -0.42, -0.24);
        addLeg('legBL', 0.42, 0.24);
        addLeg('legBR', 0.42, -0.24);
        g.add(frame);
        g.add(mattress);
        g.add(pillow);
        g.add(board);
        return g;
    }

    function skinOr(THREE, kind, x, y, w, h, fallback) {
        const P = global.BlockLegendVoxelPix;
        return P ? P.regionMat(THREE, kind, x, y, w, h) : new THREE.MeshLambertMaterial({ color: fallback });
    }

    const PX = 1 / 16;

    function named(mesh, name) {
        mesh.name = name;
        return mesh;
    }

    function hideMat(THREE, kind, fallback) {
        const P = global.BlockLegendVoxelPix;
        if (!P) return new THREE.MeshLambertMaterial({ color: fallback });
        if (kind === 'villager') return P.regionMat(THREE, kind, 20, 20, 8, 8);
        return P.regionMat(THREE, kind, 16, 16, 16, 16);
    }

    function faceOf(THREE, kind, fallback) {
        const P = global.BlockLegendVoxelPix;
        if (!P) return new THREE.MeshLambertMaterial({ color: fallback });
        if (kind === 'villager') return P.faceMat(THREE, kind);
        return P.regionMat(THREE, kind, 16, 16, 16, 16);
    }

    function pbox(THREE, w, h, d, color, extra) {
        if (color && typeof color === 'object' && color.isMaterial) {
            return new THREE.Mesh(new THREE.BoxGeometry(w * PX, h * PX, d * PX), color);
        }
        return box(THREE, w * PX, h * PX, d * PX, color, extra);
    }

    function put(mesh, x, y, z) {
        mesh.position.set(x * PX, y * PX, z * PX);
        return mesh;
    }

    function pivotLegs(THREE, g, color, spots, size, hoofColor) {
        const legs = [];
        const w = size[0], h = size[1], d = size[2];
        spots.forEach(function (p) {
            const lp = new THREE.Group();
            lp.position.set(p[0] * PX, p[1] * PX, p[2] * PX);
            const leg = pbox(THREE, w, h, d, color);
            leg.position.y = -h * PX / 2;
            lp.add(leg);
            if (hoofColor) {
                const hoof = named(pbox(THREE, w * 1.1, 1.2, d * 1.1, hoofColor), 'hoof');
                hoof.position.y = -h * PX;
                lp.add(hoof);
            }
            g.add(lp);
            legs.push(lp);
        });
        g.userData.legs = legs;
        return legs;
    }

    function attachWalk(g) {
        g.userData.tick = function (t, moving) {
            const swing = Math.sin(t * (moving ? 8 : 2.2)) * (moving ? 0.46 : 0.07);
            (g.userData.legs || []).forEach(function (leg, i) {
                leg.rotation.x = swing * (i % 2 === 0 ? 1 : -1);
            });
            if (g.userData.wings) {
                const flap = Math.sin(t * (moving ? 14 : 4)) * 0.38;
                g.userData.wings[0].rotation.z = flap;
                g.userData.wings[1].rotation.z = -flap;
            }
            if (g.userData.tail) g.userData.tail.rotation.y = Math.sin(t * 3.2) * 0.28;
        };
    }

    function withWalk(g) {
        const prev = g.userData && g.userData.tick;
        g.userData = g.userData || {};
        g.userData.tick = function (t, moving) {
            if (typeof prev === 'function') prev.call(g, t, moving);
            g.rotation.z = Math.sin(t * (moving ? 8 : 2.2)) * (moving ? 0.07 : 0.02);
        };
        return g;
    }

    function createVillager(THREE) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.villager) {
            const fv = global.BlockLegendFourView.build(THREE, 'villager', { swingArms: true });
            if (fv) { return withWalk(fv); }
        }
        const g = new THREE.Group();
        g.name = 'villager';
        const skin = faceOf(THREE, 'villager', 0xe8c090);
        const robeC = hideMat(THREE, 'villager', 0x6b4226);
        const head = named(pbox(THREE, 8, 10, 8, skin), 'head');
        const body = named(pbox(THREE, 8, 12, 6, robeC), 'body');
        const robe = pbox(THREE, 9, 18, 7, robeC);
        const nose = named(pbox(THREE, 2, 4, 2, 0xb8865a), 'nose');
        const brow = pbox(THREE, 6, 1.2, 0.5, 0x3e2723);
        const eyeL = pbox(THREE, 1.2, 1.2, 0.4, 0x3d8a3a);
        const eyeR = pbox(THREE, 1.2, 1.2, 0.4, 0x3d8a3a);
        const arms = new THREE.Group();
        arms.name = 'arms';
        const armL = pbox(THREE, 4, 8, 4, robeC);
        const armR = pbox(THREE, 4, 8, 4, robeC);
        const armBar = named(pbox(THREE, 8, 4, 4, robeC), 'arms');
        put(armL, -6, 0, 0);
        put(armR, 6, 0, 0);
        put(armBar, 0, -4, 2);
        arms.add(armL);
        arms.add(armR);
        arms.add(armBar);
        put(arms, 0, 20, 0);
        arms.rotation.x = -0.75;
        put(robe, 0, 15, 0);
        put(body, 0, 18, 0);
        put(head, 0, 29, 0);
        put(nose, 0, 27, 5.5);
        put(brow, 0, 31.2, 4.2);
        put(eyeL, -1.6, 29.6, 4.2);
        put(eyeR, 1.6, 29.6, 4.2);
        pivotLegs(THREE, g, 0x4a2e18, [[-2, 12, 0], [2, 12, 0]], [4, 12, 4]);
        g.add(robe);
        g.add(body);
        g.add(head);
        g.add(nose);
        g.add(brow);
        g.add(eyeL);
        g.add(eyeR);
        g.add(arms);
        g.userData.tick = function (t, moving) {
            g.rotation.z = Math.sin(t * (moving ? 8 : 2.2)) * (moving ? 0.07 : 0.02);
            head.rotation.y = Math.sin(t * 1.4) * 0.12;
            arms.rotation.x = -0.75 + Math.sin(t * (moving ? 8 : 2)) * (moving ? 0.2 : 0.04);
        };
        return g;
    }

    function createTrader(THREE) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.trader) {
            const fv = global.BlockLegendFourView.build(THREE, 'trader', { swingArms: true });
            if (fv) { return withWalk(fv); }
        }
        const g = createVillager(THREE);
        g.name = 'trader';
        const coat = pbox(THREE, 9.4, 14, 7.4, 0x2f5cb0);
        put(coat, 0, 19, 0);
        const hood = pbox(THREE, 8.6, 3, 8.6, 0x2f5cb0);
        put(hood, 0, 34.4, 0);
        const trim = pbox(THREE, 9.6, 1.4, 7.6, 0xd4a017);
        put(trim, 0, 12, 0);
        const backpack = named(pbox(THREE, 6, 7, 3, 0x6b4424), 'backpack');
        put(backpack, 0, 20, -5);
        g.add(coat);
        g.add(hood);
        g.add(trim);
        g.add(backpack);
        return g;
    }

    function createFarmer(THREE) {
        const g = createVillager(THREE);
        g.name = 'farmer';
        const brim = pbox(THREE, 10, 1.2, 10, 0xe6d27a);
        const crown = pbox(THREE, 6, 3, 6, 0xc6a24a);
        put(brim, 0, 34.2, 0);
        put(crown, 0, 36, 0);
        g.add(brim);
        g.add(crown);
        return g;
    }

    function createTeacher(THREE) {
        const g = createVillager(THREE);
        g.name = 'teacher';
        const coat = pbox(THREE, 9.4, 14, 7.4, 0x2e7d4f);
        put(coat, 0, 19, 0);
        const sash = pbox(THREE, 9.6, 1.6, 7.6, 0xf4e4a4);
        put(sash, 0, 16, 0);
        const book = named(pbox(THREE, 4, 1.2, 5, 0xc62828), 'book');
        put(book, 0, 18, 6);
        g.add(coat);
        g.add(sash);
        g.add(book);
        return g;
    }

    function createChair(THREE) {
        const g = new THREE.Group();
        g.name = 'chair';
        const seat = box(THREE, 0.42, 0.08, 0.42, 0x8d6e48);
        const back = box(THREE, 0.08, 0.36, 0.42, 0x6d4c31);
        seat.position.y = 0.22;
        back.position.set(-0.17, 0.44, 0);
        g.add(seat);
        g.add(back);
        return g;
    }

    function createTable(THREE) {
        const g = new THREE.Group();
        g.name = 'table';
        const top = box(THREE, 0.7, 0.08, 0.7, 0xa07848);
        const leg = box(THREE, 0.08, 0.34, 0.08, 0x6d4c31);
        top.position.y = 0.42;
        leg.position.y = 0.16;
        g.add(top);
        g.add(leg);
        return g;
    }

    function createBookshelf(THREE) {
        const g = new THREE.Group();
        g.name = 'bookshelf';
        const frame = box(THREE, 0.7, 0.9, 0.28, 0x6d4c31);
        const rowA = box(THREE, 0.62, 0.16, 0.12, 0xc62828);
        const rowB = box(THREE, 0.62, 0.16, 0.12, 0x1565c0);
        frame.position.y = 0.46;
        rowA.position.set(0, 0.62, 0.1);
        rowB.position.set(0, 0.38, 0.1);
        g.add(frame);
        g.add(rowA);
        g.add(rowB);
        return g;
    }

    function createPig(THREE) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.pig) {
            const fv = global.BlockLegendFourView.build(THREE, 'pig');
            if (fv) { return fv; }
        }
        const g = new THREE.Group();
        g.name = 'pig';
        const pink = hideMat(THREE, 'pig', 0xf2a8b4);
        const dark = 0xd07a90;
        const body = named(pbox(THREE, 10, 8, 16, pink), 'body');
        const head = named(pbox(THREE, 8, 8, 8, faceOf(THREE, 'pig', 0xf2a8b4)), 'head');
        const snout = named(pbox(THREE, 4, 3, 1, dark), 'snout');
        const nostrilL = named(pbox(THREE, 1, 1, 0.4, 0x6a3040), 'nostril');
        const nostrilR = named(pbox(THREE, 1, 1, 0.4, 0x6a3040), 'nostril');
        const eyeL = pbox(THREE, 1.2, 1.2, 0.4, 0x141010);
        const eyeR = pbox(THREE, 1.2, 1.2, 0.4, 0x141010);
        const earL = pbox(THREE, 2, 2, 1, dark);
        const earR = pbox(THREE, 2, 2, 1, dark);
        const tail = named(pbox(THREE, 2, 2, 1.2, dark), 'tail');
        tail.name = 'tail';
        put(body, 0, 10, 0);
        put(head, 0, 12, 12);
        put(snout, 0, 11, 16.5);
        put(nostrilL, -1, 11, 17.1);
        put(nostrilR, 1, 11, 17.1);
        put(eyeL, -2, 13.5, 16.1);
        put(eyeR, 2, 13.5, 16.1);
        put(earL, -3, 16.5, 10);
        put(earR, 3, 16.5, 10);
        put(tail, 0, 12, -8.6);
        pivotLegs(THREE, g, pink, [[-3, 6, 5], [3, 6, 5], [-3, 6, -5], [3, 6, -5]], [4, 6, 4]);
        g.add(body);
        g.add(head);
        g.add(snout);
        g.add(nostrilL);
        g.add(nostrilR);
        g.add(eyeL);
        g.add(eyeR);
        g.add(earL);
        g.add(earR);
        g.add(tail);
        g.userData.tail = tail;
        attachWalk(g);
        return g;
    }

    function createCow(THREE) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.cow) {
            const fv = global.BlockLegendFourView.build(THREE, 'cow');
            if (fv) { return fv; }
        }
        const g = new THREE.Group();
        g.name = 'cow';
        const hide = hideMat(THREE, 'cow', 0x5a3a22);
        const body = named(pbox(THREE, 12, 10, 18, hide), 'body');
        const spotA = pbox(THREE, 4, 4, 5, 0xf2efe6);
        const spotB = pbox(THREE, 3.5, 3.5, 4, 0xf2efe6);
        const head = named(pbox(THREE, 8, 8, 6, faceOf(THREE, 'cow', 0x5a3a22)), 'head');
        const muzzle = pbox(THREE, 4.5, 3, 1.2, 0xd4a090);
        const hornL = pbox(THREE, 1, 3, 1, 0xf4efe4);
        const hornR = pbox(THREE, 1, 3, 1, 0xf4efe4);
        const earL = pbox(THREE, 2, 2, 1, hide);
        const earR = pbox(THREE, 2, 2, 1, hide);
        const udder = pbox(THREE, 4, 3, 4, 0xf2c4c4);
        const eyeL = pbox(THREE, 1.2, 1.2, 0.4, 0x141010);
        const eyeR = pbox(THREE, 1.2, 1.2, 0.4, 0x141010);
        put(body, 0, 17, 1);
        put(spotA, 4, 19, 3);
        put(spotB, -3.5, 16, -4);
        put(head, 0, 20, 13);
        put(muzzle, 0, 18, 16.5);
        put(hornL, -4.5, 25, 12);
        put(hornR, 4.5, 25, 12);
        put(earL, -5, 21, 12);
        put(earR, 5, 21, 12);
        put(udder, 0, 11.5, -1);
        put(eyeL, -2, 21.5, 16.1);
        put(eyeR, 2, 21.5, 16.1);
        pivotLegs(THREE, g, hide, [[-4, 12, 7], [4, 12, 7], [-4, 12, -6], [4, 12, -6]], [4, 12, 4], 0x1a1410);
        g.add(body);
        g.add(spotA);
        g.add(spotB);
        g.add(head);
        g.add(muzzle);
        g.add(hornL);
        g.add(hornR);
        g.add(earL);
        g.add(earR);
        g.add(udder);
        g.add(eyeL);
        g.add(eyeR);
        attachWalk(g);
        return g;
    }

    function createSheep(THREE) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.sheep) {
            const fv = global.BlockLegendFourView.build(THREE, 'sheep');
            if (fv) { return fv; }
        }
        const g = new THREE.Group();
        g.name = 'sheep';
        const wool = named(pbox(THREE, 12, 10, 16, hideMat(THREE, 'sheep', 0xf4f0ea)), 'wool');
        wool.name = 'wool';
        const head = named(pbox(THREE, 6, 6, 8, faceOf(THREE, 'sheep', 0x3a2a1c)), 'head');
        const earL = pbox(THREE, 2, 3, 1, 0x3a2a1c);
        const earR = pbox(THREE, 2, 3, 1, 0x3a2a1c);
        const eyeL = pbox(THREE, 1, 1, 0.4, 0x141010);
        const eyeR = pbox(THREE, 1, 1, 0.4, 0x141010);
        put(wool, 0, 17, 0);
        put(head, 0, 18, 11);
        put(earL, -3.5, 19.5, 10);
        put(earR, 3.5, 19.5, 10);
        put(eyeL, -1.6, 19, 15.1);
        put(eyeR, 1.6, 19, 15.1);
        pivotLegs(THREE, g, 0x3a2a1c, [[-3, 12, 5], [3, 12, 5], [-3, 12, -5], [3, 12, -5]], [4, 12, 4]);
        g.add(wool);
        g.add(head);
        g.add(earL);
        g.add(earR);
        g.add(eyeL);
        g.add(eyeR);
        attachWalk(g);
        return g;
    }

    function createChicken(THREE) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.chicken) {
            const fv = global.BlockLegendFourView.build(THREE, 'chicken');
            if (fv) { return fv; }
        }
        const g = new THREE.Group();
        g.name = 'chicken';
        const hide = hideMat(THREE, 'chicken', 0xf4f0ea);
        const body = named(pbox(THREE, 6, 6, 8, hide), 'body');
        const head = named(pbox(THREE, 4, 6, 3, faceOf(THREE, 'chicken', 0xf4f0ea)), 'head');
        const comb = pbox(THREE, 2, 1.5, 2, 0xc62828);
        const wattle = pbox(THREE, 2, 2, 2, 0xc62828);
        const beak = pbox(THREE, 4, 2, 2, 0xf2c04a);
        const eyeL = pbox(THREE, 0.8, 0.8, 0.3, 0x141010);
        const eyeR = pbox(THREE, 0.8, 0.8, 0.3, 0x141010);
        const wingL = pbox(THREE, 1, 4, 6, 0xe8e4dc);
        const wingR = pbox(THREE, 1, 4, 6, 0xe8e4dc);
        put(body, 0, 8, 0);
        put(head, 0, 13, 5);
        put(comb, 0, 16.5, 5);
        put(wattle, 0, 10, 6.5);
        put(beak, 0, 12, 7.5);
        put(eyeL, -1.4, 14, 6.6);
        put(eyeR, 1.4, 14, 6.6);
        put(wingL, -3.5, 8, 0);
        put(wingR, 3.5, 8, 0);
        const legs = [];
        [-1, 1].forEach(function (side) {
            const lp = new THREE.Group();
            lp.position.set(side * 1.5 * PX, 5 * PX, 1 * PX);
            const stick = pbox(THREE, 1, 5, 1, 0xf2c04a);
            stick.position.y = -2.5 * PX;
            const foot = named(pbox(THREE, 3, 0.8, 3, 0xf2c04a), 'foot');
            foot.name = 'foot';
            foot.position.set(0, -5 * PX, 1 * PX);
            const prong = named(pbox(THREE, 1, 0.8, 2, 0xf2c04a), 'prong');
            prong.position.set(0, -5 * PX, 2.2 * PX);
            lp.add(stick);
            lp.add(foot);
            lp.add(prong);
            g.add(lp);
            legs.push(lp);
        });
        g.userData.legs = legs;
        g.add(body);
        g.add(head);
        g.add(comb);
        g.add(wattle);
        g.add(beak);
        g.add(eyeL);
        g.add(eyeR);
        g.add(wingL);
        g.add(wingR);
        g.userData.wings = [wingL, wingR];
        attachWalk(g);
        return g;
    }

    function createWolf(THREE) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.wolf) {
            const fv = global.BlockLegendFourView.build(THREE, 'wolf');
            if (fv) { return fv; }
        }
        const g = new THREE.Group();
        g.name = 'wolf';
        const hide = hideMat(THREE, 'wolf', 0xb4b8c0);
        const body = named(pbox(THREE, 6, 6, 9, hide), 'body');
        const mane = pbox(THREE, 8, 6, 7, hide);
        const head = named(pbox(THREE, 6, 6, 4, faceOf(THREE, 'wolf', 0xb4b8c0)), 'head');
        const snout = pbox(THREE, 3, 3, 4, 0xd0d2d8);
        const tail = named(pbox(THREE, 2, 2, 8, hide), 'tail');
        tail.name = 'tail';
        const earL = pbox(THREE, 2, 2, 1, 0x888890);
        const earR = pbox(THREE, 2, 2, 1, 0x888890);
        const eyeL = pbox(THREE, 1, 1, 0.3, 0xf2c04a, { emissive: 0x332200 });
        const eyeR = pbox(THREE, 1, 1, 0.3, 0xf2c04a, { emissive: 0x332200 });
        put(body, 0, 11, 1);
        put(mane, 0, 12, 4);
        put(head, 0, 13.5, 9.5);
        put(snout, 0, 12.2, 13.5);
        put(tail, 0, 13, -5.5);
        put(earL, -2, 17.5, 9);
        put(earR, 2, 17.5, 9);
        put(eyeL, -1.6, 14.2, 11.6);
        put(eyeR, 1.6, 14.2, 11.6);
        pivotLegs(THREE, g, hide, [[-2.5, 8, 4], [2.5, 8, 4], [-2.5, 8, -3], [2.5, 8, -3]], [2, 8, 2]);
        g.add(body);
        g.add(mane);
        g.add(head);
        g.add(snout);
        g.add(tail);
        g.add(earL);
        g.add(earR);
        g.add(eyeL);
        g.add(eyeR);
        g.userData.tail = tail;
        attachWalk(g);
        return g;
    }

    function createBee(THREE) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.bee) {
            const fv = global.BlockLegendFourView.build(THREE, 'bee');
            if (fv) { return fv; }
        }
        const g = new THREE.Group();
        g.name = 'bee';
        const hide = new THREE.MeshLambertMaterial({ color: 0xffd54f });
        const body = named(pbox(THREE, 8, 6, 10, hide), 'body');
        const stripe = pbox(THREE, 8.2, 6.2, 3, 0x141010);
        const head = named(pbox(THREE, 5, 5, 4, hide), 'head');
        const wingL = named(pbox(THREE, 6, 1, 6, 0xe8f4ff), 'wingL');
        const wingR = named(pbox(THREE, 6, 1, 6, 0xe8f4ff), 'wingR');
        put(body, 0, 8, 0);
        put(stripe, 0, 8, 0);
        put(head, 0, 8, 6.5);
        put(wingL, -4, 12, 0);
        put(wingR, 4, 12, 0);
        g.add(body);
        g.add(stripe);
        g.add(head);
        g.add(wingL);
        g.add(wingR);
        g.userData.wings = [wingL, wingR];
        attachWalk(g);
        return g;
    }

    global.BlockLegendProps3d = {
        createChest: createChest,
        createFurnace: createFurnace,
        createTorch: createTorch,
        createBed: createBed,
        createVillager: createVillager,
        createTrader: createTrader,
        createTeacher: createTeacher,
        createFarmer: createFarmer,
        createChair: createChair,
        createTable: createTable,
        createBookshelf: createBookshelf,
        createPig: createPig,
        createCow: createCow,
        createSheep: createSheep,
        createChicken: createChicken,
        createWolf: createWolf,
        createBee: createBee
    };
}(typeof window !== 'undefined' ? window : globalThis));
