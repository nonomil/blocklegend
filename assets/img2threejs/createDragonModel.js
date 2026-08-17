/**
 * BlockLegend ender dragon — four-leg wyrm with wings. Original design.
 * Ref: prj/assets/generated/blocklegend-roster/raw/bosses.png
 */
(function (global) {
    'use strict';

    function createDragonModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.dragon) {
            const fv = global.BlockLegendFourView.build(THREE, 'dragon', options || {});
            if (fv) { return fv; }
        }
        const px = (options && options.pixel) || 1 / 16;
        const P = global.BlockLegendVoxelPix;
        const root = new THREE.Group();
        root.name = 'dragon';
        const hide = P.regionMat(THREE, 'dragon', 20, 20, 8, 8);
        const glow = new THREE.MeshLambertMaterial({ color: 0xb450ff, emissive: 0x3a1060 });
        const body = P.box(THREE, 12 * px, 8 * px, 18 * px, hide);
        body.name = 'body';
        body.position.set(0, 12 * px, 0);
        const neck1 = P.box(THREE, 5 * px, 5 * px, 7 * px, hide);
        neck1.position.set(0, 15 * px, 12 * px);
        const neck2 = P.box(THREE, 5 * px, 5 * px, 7 * px, hide);
        neck2.position.set(0, 18 * px, 18 * px);
        const head = new THREE.Mesh(new THREE.BoxGeometry(8 * px, 7 * px, 10 * px), P.headMats(THREE, 'dragon'));
        head.name = 'head';
        head.position.set(0, 20 * px, 26 * px);
        const hornL = P.box(THREE, 1.4 * px, 6 * px, 1.4 * px, hide);
        const hornR = P.box(THREE, 1.4 * px, 6 * px, 1.4 * px, hide);
        hornL.position.set(-2.4 * px, 5 * px, -2 * px);
        hornR.position.set(2.4 * px, 5 * px, -2 * px);
        const eyeL = P.box(THREE, 1.4 * px, 1 * px, 0.4 * px, glow);
        const eyeR = P.box(THREE, 1.4 * px, 1 * px, 0.4 * px, glow);
        eyeL.position.set(-2 * px, 0.8 * px, 5.1 * px);
        eyeR.position.set(2 * px, 0.8 * px, 5.1 * px);
        head.add(hornL);
        head.add(hornR);
        head.add(eyeL);
        head.add(eyeR);
        const tail = P.box(THREE, 4 * px, 4 * px, 16 * px, hide);
        tail.position.set(0, 11 * px, -16 * px);
        const wingL = P.box(THREE, 22 * px, 1.2 * px, 12 * px, hide);
        const wingR = P.box(THREE, 22 * px, 1.2 * px, 12 * px, hide);
        wingL.position.set(-16 * px, 16 * px, 0);
        wingR.position.set(16 * px, 16 * px, 0);
        root.add(body);
        root.add(neck1);
        root.add(neck2);
        root.add(head);
        root.add(tail);
        root.add(wingL);
        root.add(wingR);
        [[-4, 6], [4, 6], [-4, -5], [4, -5]].forEach(function (p) {
            const leg = P.box(THREE, 3 * px, 8 * px, 3 * px, hide);
            leg.position.set(p[0] * px, 6 * px, p[1] * px);
            root.add(leg);
        });
        const shield = new THREE.Mesh(
            new THREE.SphereGeometry(1.45, 16, 12),
            new THREE.MeshLambertMaterial({ color: 0xb450ff, transparent: true, opacity: 0.14, depthWrite: false })
        );
        shield.position.y = 1.1;
        shield.name = 'boss-shield';
        root.add(shield);
        root.userData.sculptRuntime = { nodes: { head: head, body: body, wings: [wingL, wingR], shield: shield } };
        root.userData.tick = function (t, moving) {
            const flap = Math.sin(t * (moving ? 6 : 3)) * 0.32;
            wingL.rotation.z = 0.22 + flap;
            wingR.rotation.z = -0.22 - flap;
            head.rotation.y = Math.sin(t * 1.1) * 0.1;
            root.position.y = 0.08 + Math.sin(t * 2) * 0.04;
        };
        return root;
    }

    global.BlockLegendDragonModel = { create: createDragonModel };
}(typeof window !== 'undefined' ? window : globalThis));
