/**
 * BlockLegend spider — 64×64 fur/eye skin + 8 legs. Original design, not a Mojang skin.
 */
(function (global) {
    'use strict';

    function createSpiderModel(THREE, options) {
        const px = (options && options.pixel) || 1 / 16;
        const P = global.BlockLegendVoxelPix;
        const root = new THREE.Group();
        root.name = 'spider';
        const fur = P.regionMat(THREE, 'spider', 16, 16, 16, 16);
        const body = P.box(THREE, 10 * px, 6 * px, 12 * px, fur);
        body.name = 'body';
        body.position.y = 5 * px;
        const head = new THREE.Mesh(new THREE.BoxGeometry(6 * px, 5 * px, 5 * px), P.headMats(THREE, 'spider', { faceX: 20, faceY: 20, bodyX: 16, bodyY: 16 }));
        head.name = 'head';
        head.position.set(0, 5 * px, 7 * px);
        const eyeMat = new THREE.MeshLambertMaterial({ color: 0xf2e6c4, emissive: 0x331108 });
        [[-1.6, 0.8], [1.6, 0.8], [-0.6, 1.3], [0.6, 1.3]].forEach(function (p) {
            const eye = P.box(THREE, 1.1 * px, 1.1 * px, 0.5 * px, eyeMat);
            eye.position.set(p[0] * px, p[1] * px, 2.6 * px);
            head.add(eye);
        });
        root.add(body);
        root.add(head);
        const legs = [];
        for (let i = 0; i < 8; i += 1) {
            const side = i < 4 ? -1 : 1;
            const z = ((i % 4) - 1.5) * 2.4 * px;
            const pivot = new THREE.Group();
            pivot.position.set(side * 5 * px, 5 * px, z);
            const thigh = P.box(THREE, 5 * px, 1.3 * px, 1.3 * px, fur);
            thigh.position.x = side * 2.6 * px;
            const shin = P.box(THREE, 5 * px, 1.2 * px, 1.2 * px, fur);
            shin.position.set(side * 6.4 * px, -1.6 * px, 0);
            pivot.rotation.z = side * 0.45;
            pivot.add(thigh);
            pivot.add(shin);
            root.add(pivot);
            legs.push(pivot);
        }
        root.userData.sculptRuntime = { nodes: { head: head, body: body, legs: legs } };
        root.userData.tick = function (t, moving) {
            const amp = moving ? 0.42 : 0.1;
            legs.forEach(function (leg, i) {
                leg.rotation.x = Math.sin(t * (moving ? 9 : 4) + i) * amp;
            });
        };
        return root;
    }

    global.BlockLegendSpiderModel = { create: createSpiderModel };
}(typeof window !== 'undefined' ? window : globalThis));
