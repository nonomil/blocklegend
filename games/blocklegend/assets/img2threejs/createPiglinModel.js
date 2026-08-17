/**
 * BlockLegend piglin — 64×64 peach/leather skin + snout and tusks. Original design.
 */
(function (global) {
    'use strict';

    function createPiglinModel(THREE, options) {
        const px = (options && options.pixel) || 1 / 16;
        const P = global.BlockLegendVoxelPix;
        const root = new THREE.Group();
        root.name = 'piglin';
        const skin = P.regionMat(THREE, 'piglin', 20, 20, 8, 8);
        const head = new THREE.Mesh(new THREE.BoxGeometry(8 * px, 8 * px, 8 * px), P.headMats(THREE, 'piglin'));
        head.name = 'head';
        head.position.y = 28 * px;
        const snout = P.box(THREE, 4 * px, 3 * px, 2.4 * px, skin);
        snout.position.set(0, -1.2 * px, 5 * px);
        const hole = new THREE.MeshLambertMaterial({ color: 0x5a3020 });
        const nostrilL = P.box(THREE, 0.8 * px, 0.8 * px, 0.4 * px, hole);
        const nostrilR = P.box(THREE, 0.8 * px, 0.8 * px, 0.4 * px, hole);
        nostrilL.position.set(-0.9 * px, 0, 1.3 * px);
        nostrilR.position.set(0.9 * px, 0, 1.3 * px);
        snout.add(nostrilL);
        snout.add(nostrilR);
        const ivory = new THREE.MeshLambertMaterial({ color: 0xf4efe4 });
        const gold = new THREE.MeshLambertMaterial({ color: 0xe0b040 });
        const tuskL = P.box(THREE, 0.8 * px, 2.2 * px, 0.8 * px, ivory);
        const tuskR = P.box(THREE, 0.8 * px, 2.2 * px, 0.8 * px, ivory);
        tuskL.position.set(-2.6 * px, -3.2 * px, 3.6 * px);
        tuskR.position.set(2.6 * px, -3.2 * px, 3.6 * px);
        const ringL = P.box(THREE, 1.4 * px, 1.4 * px, 0.35 * px, gold);
        const ringR = P.box(THREE, 1.4 * px, 1.4 * px, 0.35 * px, gold);
        ringL.position.set(-4.2 * px, -0.4 * px, 0);
        ringR.position.set(4.2 * px, -0.4 * px, 0);
        head.add(snout);
        head.add(tuskL);
        head.add(tuskR);
        head.add(ringL);
        head.add(ringR);
        const body = P.box(THREE, 8 * px, 12 * px, 4 * px, skin);
        body.name = 'body';
        body.position.y = 18 * px;
        const belt = P.box(THREE, 8.2 * px, 1.4 * px, 4.3 * px, gold);
        belt.position.y = 13 * px;
        root.add(head);
        root.add(body);
        root.add(belt);
        const arms = [];
        const legs = [];
        [-1, 1].forEach(function (side) {
            const ap = new THREE.Group();
            ap.position.set(side * 6 * px, 23 * px, 0);
            const arm = P.box(THREE, 3 * px, 12 * px, 3 * px, skin);
            arm.position.y = -6 * px;
            ap.add(arm);
            root.add(ap);
            arms.push(ap);
            const lp = new THREE.Group();
            lp.position.set(side * 2.1 * px, 12 * px, 0);
            const leg = P.box(THREE, 3.2 * px, 12 * px, 3.2 * px, skin);
            leg.position.y = -6 * px;
            lp.add(leg);
            root.add(lp);
            legs.push(lp);
        });
        root.userData.sculptRuntime = { nodes: { head: head, body: body, arms: arms, legs: legs } };
        root.userData.tick = function (t, moving) {
            const s = Math.sin(t * (moving ? 7 : 3)) * (moving ? 0.5 : 0.1);
            legs[0].rotation.x = s;
            legs[1].rotation.x = -s;
            arms[0].rotation.x = -s * 0.7;
            arms[1].rotation.x = s * 0.7;
        };
        return root;
    }

    global.BlockLegendPiglinModel = { create: createPiglinModel };
}(typeof window !== 'undefined' ? window : globalThis));
