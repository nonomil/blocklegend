/**
 * BlockLegend fox — low orange body, white chest, bushy tail. Original design.
 * Ref: prj/assets/generated/blocklegend-roster/raw/cubes-fox.png
 */
(function (global) {
    'use strict';

    function createFoxModel(THREE, options) {
        const px = (options && options.pixel) || 1 / 20;
        const P = global.BlockLegendVoxelPix;
        const root = new THREE.Group();
        root.name = 'fox';
        const fur = P.regionMat(THREE, 'fox', 0, 16, 16, 16);
        const cream = P.regionMat(THREE, 'fox', 32, 16, 8, 8);
        const body = P.box(THREE, 8 * px, 6 * px, 14 * px, fur);
        body.name = 'body';
        body.position.y = 7 * px;
        const chest = P.box(THREE, 6 * px, 4 * px, 4 * px, cream);
        chest.position.set(0, 6.5 * px, 6 * px);
        const head = new THREE.Mesh(new THREE.BoxGeometry(6 * px, 5 * px, 6 * px), P.headMats(THREE, 'fox', { faceX: 0, faceY: 0, bodyX: 8, bodyY: 0 }));
        head.name = 'head';
        head.position.set(0, 9 * px, 10 * px);
        const snout = P.box(THREE, 3 * px, 2 * px, 3 * px, fur);
        snout.position.set(0, -0.6 * px, 4 * px);
        const earL = P.box(THREE, 1.6 * px, 2.6 * px, 1.2 * px, fur);
        const earR = P.box(THREE, 1.6 * px, 2.6 * px, 1.2 * px, fur);
        earL.position.set(-1.8 * px, 3.4 * px, 0);
        earR.position.set(1.8 * px, 3.4 * px, 0);
        head.add(snout);
        head.add(earL);
        head.add(earR);
        const tail = P.box(THREE, 3 * px, 3 * px, 8 * px, fur);
        tail.position.set(0, 8 * px, -10 * px);
        const tip = P.box(THREE, 3.2 * px, 3.2 * px, 2.4 * px, cream);
        tip.position.set(0, 0, -4.4 * px);
        tail.add(tip);
        root.add(body);
        root.add(chest);
        root.add(head);
        root.add(tail);
        const legs = [];
        [[-2.2, 5], [2.2, 5], [-2.2, -4], [2.2, -4]].forEach(function (p) {
            const lp = new THREE.Group();
            lp.position.set(p[0] * px, 5 * px, p[1] * px);
            const leg = P.box(THREE, 2 * px, 5 * px, 2 * px, fur);
            leg.position.y = -2.5 * px;
            lp.add(leg);
            root.add(lp);
            legs.push(lp);
        });
        root.userData.sculptRuntime = { nodes: { head: head, body: body, legs: legs } };
        root.userData.tick = function (t, moving) {
            const s = Math.sin(t * (moving ? 8 : 3)) * (moving ? 0.4 : 0.08);
            legs[0].rotation.x = s;
            legs[3].rotation.x = s;
            legs[1].rotation.x = -s;
            legs[2].rotation.x = -s;
            tail.rotation.y = Math.sin(t * 2) * 0.15;
        };
        return root;
    }

    global.BlockLegendFoxModel = { create: createFoxModel };
}(typeof window !== 'undefined' ? window : globalThis));
