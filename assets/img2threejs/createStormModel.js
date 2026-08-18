/**
 * BlockLegend wither-storm — three mandible heads, one purple eye each, tentacles.
 * Original design inspired by Story Mode silhouette, not a Mojang mesh.
 * Ref: prj/assets/generated/blocklegend-roster/raw/bosses.png
 */
(function (global) {
    'use strict';

    function createStormModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.storm) {
            const fv = global.BlockLegendFourView.build(THREE, 'storm', Object.assign({
                emissive: { match: 'command', color: 0x441000 }
            }, options || {}));
            if (fv) { return fv; }
        }
        const px = (options && options.pixel) || 1 / 16;
        const P = global.BlockLegendVoxelPix;
        const root = new THREE.Group();
        root.name = 'storm';
        const ink = P.regionMat(THREE, 'storm', 20, 20, 8, 8);
        const purple = new THREE.MeshLambertMaterial({ color: 0xb450ff, emissive: 0x4a1480 });
        const core = P.box(THREE, 16 * px, 16 * px, 14 * px, ink);
        core.name = 'body';
        core.position.y = 14 * px;
        const command = new THREE.Mesh(
            new THREE.BoxGeometry(5 * px, 5 * px, 5 * px),
            new THREE.MeshLambertMaterial({ color: 0x5a3cff, emissive: 0x221060 })
        );
        command.position.set(0, 14 * px, 7.4 * px);
        root.add(core);
        root.add(command);
        const heads = [];
        [[-12, 28, 6], [0, 32, 8], [12, 28, 6]].forEach(function (p) {
            const neck = P.box(THREE, 3 * px, 6 * px, 3 * px, ink);
            neck.position.set(p[0] * px, (p[1] - 5) * px, p[2] * px);
            const head = new THREE.Mesh(new THREE.BoxGeometry(8 * px, 8 * px, 8 * px), P.headMats(THREE, 'storm'));
            head.name = 'storm-head';
            head.position.set(p[0] * px, p[1] * px, p[2] * px);
            const eye = P.box(THREE, 3.2 * px, 3.2 * px, 0.6 * px, purple);
            eye.position.set(0, 0.6 * px, 4.2 * px);
            const mandibleL = P.box(THREE, 1.4 * px, 4 * px, 3 * px, ink);
            const mandibleR = P.box(THREE, 1.4 * px, 4 * px, 3 * px, ink);
            mandibleL.position.set(-3.2 * px, -3.4 * px, 2.4 * px);
            mandibleR.position.set(3.2 * px, -3.4 * px, 2.4 * px);
            head.add(eye);
            head.add(mandibleL);
            head.add(mandibleR);
            root.add(neck);
            root.add(head);
            heads.push(head);
        });
        const arms = [];
        [-1, 1, 0].forEach(function (side, i) {
            const tent = P.box(THREE, 3 * px, 18 * px, 3 * px, ink);
            tent.position.set(side * 10 * px, 4 * px, (-6 + i * 4) * px);
            tent.rotation.z = side * 0.55;
            root.add(tent);
            arms.push(tent);
        });
        [-8, 8].forEach(function (x) {
            const tent = P.box(THREE, 2.4 * px, 14 * px, 2.4 * px, ink);
            tent.position.set(x * px, 2 * px, 6 * px);
            tent.rotation.x = 0.4;
            root.add(tent);
            arms.push(tent);
        });
        const shield = new THREE.Mesh(
            new THREE.SphereGeometry(1.55, 16, 12),
            new THREE.MeshLambertMaterial({ color: 0xb450ff, transparent: true, opacity: 0.14, depthWrite: false })
        );
        shield.position.y = 1.2;
        shield.name = 'boss-shield';
        root.add(shield);
        root.userData.sculptRuntime = { nodes: { heads: heads, body: core, shield: shield } };
        root.userData.tick = function (t) {
            root.position.y = Math.sin(t * 2) * 0.08;
            heads.forEach(function (h, i) {
                h.rotation.y = Math.sin(t * 1.5 + i) * 0.22;
            });
            arms.forEach(function (a, i) {
                a.rotation.x = 0.2 + Math.sin(t * 2.4 + i) * 0.18;
            });
            command.rotation.y += 0.04;
            shield.rotation.y += 0.03;
        };
        return root;
    }

    global.BlockLegendStormModel = { create: createStormModel };
}(typeof window !== 'undefined' ? window : globalThis));
