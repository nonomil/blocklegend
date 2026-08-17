/**
 * BlockLegend wither — three skulls joined by necks to a T-ribcage. Original design.
 * Ref: prj/assets/generated/blocklegend-roster/raw/bosses.png
 */
(function (global) {
    'use strict';

    function createWitherModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.wither) {
            const fv = global.BlockLegendFourView.build(THREE, 'wither', Object.assign({
                emissive: { match: 'eye', color: 0x441010 }
            }, options || {}));
            if (fv) { return fv; }
        }
        const px = (options && options.pixel) || 1 / 16;
        const P = global.BlockLegendVoxelPix;
        const root = new THREE.Group();
        root.name = 'wither';
        const ink = P.regionMat(THREE, 'wither', 20, 20, 8, 8);
        const white = new THREE.MeshLambertMaterial({ color: 0xf4f4f4, emissive: 0x333333 });
        const bar = P.box(THREE, 22 * px, 3 * px, 3 * px, ink);
        bar.name = 'shoulder';
        bar.position.y = 24 * px;
        root.add(bar);
        const heads = [];
        [-1, 0, 1].forEach(function (side) {
            const neck = P.box(THREE, 2.4 * px, 5 * px, 2.4 * px, ink);
            neck.name = 'neck';
            neck.position.set(side * 10 * px, 27.5 * px, 0);
            const head = new THREE.Mesh(new THREE.BoxGeometry(8 * px, 8 * px, 8 * px), P.headMats(THREE, 'wither'));
            head.name = 'wither-head';
            head.position.set(side * 10 * px, 33 * px, 0);
            const eyeL = P.box(THREE, 2 * px, 1 * px, 0.4 * px, white);
            const eyeR = P.box(THREE, 2 * px, 1 * px, 0.4 * px, white);
            const mouth = P.box(THREE, 3.2 * px, 0.7 * px, 0.4 * px, white);
            eyeL.position.set(-1.6 * px, 0.6 * px, 4.1 * px);
            eyeR.position.set(1.6 * px, 0.6 * px, 4.1 * px);
            mouth.position.set(0, -1.6 * px, 4.1 * px);
            head.add(eyeL);
            head.add(eyeR);
            head.add(mouth);
            root.add(neck);
            root.add(head);
            heads.push(head);
        });
        const body = P.box(THREE, 6 * px, 12 * px, 4 * px, ink);
        body.name = 'body';
        body.position.y = 16 * px;
        const rib = P.box(THREE, 10 * px, 8 * px, 3 * px, ink);
        rib.position.y = 16 * px;
        const core = new THREE.Mesh(
            new THREE.BoxGeometry(3 * px, 3 * px, 3 * px),
            new THREE.MeshLambertMaterial({ color: 0xf4f4f4, emissive: 0x444444 })
        );
        core.position.set(0, 16 * px, 2.2 * px);
        const spine = P.box(THREE, 2 * px, 8 * px, 2 * px, ink);
        spine.position.y = 7 * px;
        root.add(body);
        root.add(rib);
        root.add(core);
        root.add(spine);
        const shield = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 16, 12),
            new THREE.MeshLambertMaterial({ color: 0xf4f4f4, transparent: true, opacity: 0.16, depthWrite: false })
        );
        shield.position.y = 1.2;
        shield.name = 'boss-shield';
        root.add(shield);
        root.userData.sculptRuntime = { nodes: { heads: heads, body: body, shield: shield } };
        root.userData.tick = function (t, moving) {
            root.position.y = Math.sin(t * (moving ? 4 : 2.2)) * 0.06;
            heads.forEach(function (h, i) {
                h.rotation.y = Math.sin(t * 1.4 + i) * 0.18;
            });
            shield.rotation.y += 0.03;
            core.scale.setScalar(1 + Math.sin(t * 5) * 0.12);
        };
        return root;
    }

    global.BlockLegendWitherModel = { create: createWitherModel };
}(typeof window !== 'undefined' ? window : globalThis));
