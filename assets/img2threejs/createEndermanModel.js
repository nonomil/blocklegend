/**
 * BlockLegend enderman — 64×64 ink skin + purple eyes. Original design, not a Mojang skin.
 */
(function (global) {
    'use strict';

    function createEndermanModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.enderman) {
            const fv = global.BlockLegendFourView.build(THREE, 'enderman', Object.assign({
                emissive: { match: 'eye', color: 0x2a0044 }
            }, options || {}));
            if (fv) { return fv; }
        }
        const px = (options && options.pixel) || 1 / 16;
        const P = global.BlockLegendVoxelPix;
        const root = new THREE.Group();
        root.name = 'enderman';
        const ink = P.regionMat(THREE, 'enderman', 20, 20, 8, 8);
        const head = new THREE.Mesh(new THREE.BoxGeometry(6 * px, 7 * px, 6 * px), P.headMats(THREE, 'enderman', { emissive: 0x080810 }));
        head.name = 'head';
        head.position.y = 38 * px;
        const glow = new THREE.MeshLambertMaterial({ color: 0xc84cff, emissive: 0x4a1480 });
        const eyeL = P.box(THREE, 2.2 * px, 1.1 * px, 0.5 * px, glow);
        const eyeR = P.box(THREE, 2.2 * px, 1.1 * px, 0.5 * px, glow);
        eyeL.position.set(-1.4 * px, 0.4 * px, 3.1 * px);
        eyeR.position.set(1.4 * px, 0.4 * px, 3.1 * px);
        head.add(eyeL);
        head.add(eyeR);
        const body = P.box(THREE, 6 * px, 14 * px, 3 * px, ink);
        body.name = 'body';
        body.position.y = 27 * px;
        root.add(head);
        root.add(body);
        const arms = [];
        const legs = [];
        [-1, 1].forEach(function (side) {
            const ap = new THREE.Group();
            ap.position.set(side * 4.2 * px, 33 * px, 0);
            const arm = P.box(THREE, 2 * px, 20 * px, 2 * px, ink);
            arm.position.y = -10 * px;
            ap.add(arm);
            root.add(ap);
            arms.push(ap);
            const lp = new THREE.Group();
            lp.position.set(side * 1.6 * px, 20 * px, 0);
            const leg = P.box(THREE, 2 * px, 20 * px, 2 * px, ink);
            leg.position.y = -10 * px;
            lp.add(leg);
            root.add(lp);
            legs.push(lp);
        });
        root.userData.sculptRuntime = { nodes: { head: head, body: body, arms: arms, legs: legs } };
        root.userData.tick = function (t, moving) {
            const s = Math.sin(t * (moving ? 6.4 : 2.8)) * (moving ? 0.4 : 0.1);
            legs[0].rotation.x = s;
            legs[1].rotation.x = -s;
            arms[0].rotation.x = 0.08 + s * 0.15;
            arms[1].rotation.x = 0.08 - s * 0.15;
            head.position.y = 38 * px + Math.sin(t * 1.6) * 0.02;
        };
        return root;
    }

    global.BlockLegendEndermanModel = { create: createEndermanModel };
}(typeof window !== 'undefined' ? window : globalThis));
