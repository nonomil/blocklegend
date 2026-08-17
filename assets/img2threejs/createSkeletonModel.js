/**
 * BlockLegend skeleton — 64×64 pixel skin + rib cage. Original design, not a Mojang skin.
 */
(function (global) {
    'use strict';

    function createSkeletonModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.skeleton) {
            const fv = global.BlockLegendFourView.build(THREE, 'skeleton', options || {});
            if (fv) { return fv; }
        }
        const px = (options && options.pixel) || 1 / 16;
        const P = global.BlockLegendVoxelPix;
        const root = new THREE.Group();
        root.name = 'skeleton';
        const bone = P.regionMat(THREE, 'skeleton', 20, 20, 8, 8);
        const head = new THREE.Mesh(new THREE.BoxGeometry(8 * px, 8 * px, 8 * px), P.headMats(THREE, 'skeleton'));
        head.name = 'head';
        head.position.y = 28 * px;
        const body = P.box(THREE, 6 * px, 12 * px, 3 * px, bone);
        body.name = 'body';
        body.position.y = 18 * px;
        root.add(head);
        root.add(body);
        for (let i = 0; i < 4; i += 1) {
            const rib = P.box(THREE, 7.2 * px, 1.1 * px, 4.2 * px, bone);
            rib.position.y = (21 - i * 2.2) * px;
            root.add(rib);
        }
        const spine = P.box(THREE, 1.4 * px, 11 * px, 1.4 * px, bone);
        spine.position.y = 18 * px;
        root.add(spine);
        const arms = [];
        const legs = [];
        [-1, 1].forEach(function (side) {
            const ap = new THREE.Group();
            ap.position.set(side * 5 * px, 24 * px, 0);
            ap.rotation.x = -0.35;
            const arm = P.box(THREE, 2 * px, 12 * px, 2 * px, bone);
            arm.position.y = -6 * px;
            ap.add(arm);
            root.add(ap);
            arms.push(ap);
            const lp = new THREE.Group();
            lp.position.set(side * 2 * px, 12 * px, 0);
            const leg = P.box(THREE, 2 * px, 12 * px, 2 * px, bone);
            leg.position.y = -6 * px;
            lp.add(leg);
            root.add(lp);
            legs.push(lp);
        });
        root.userData.sculptRuntime = { nodes: { head: head, body: body, arms: arms, legs: legs } };
        root.userData.tick = function (t, moving) {
            const s = Math.sin(t * (moving ? 7.2 : 3.2)) * (moving ? 0.55 : 0.12);
            legs[0].rotation.x = s;
            legs[1].rotation.x = -s;
            arms[0].rotation.x = -0.35 - s * 0.4;
            arms[1].rotation.x = -0.35 + s * 0.4;
        };
        return root;
    }

    global.BlockLegendSkeletonModel = { create: createSkeletonModel };
}(typeof window !== 'undefined' ? window : globalThis));
