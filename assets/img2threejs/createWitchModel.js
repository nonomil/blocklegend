/**
 * BlockLegend witch — 64×64 face/robe skin + hat and staff. Original design.
 */
(function (global) {
    'use strict';

    function createWitchModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.witch) {
            const fv = global.BlockLegendFourView.build(THREE, 'witch', options || {});
            if (fv) { return fv; }
        }
        const px = (options && options.pixel) || 1 / 16;
        const P = global.BlockLegendVoxelPix;
        const root = new THREE.Group();
        root.name = 'witch';
        const robe = P.regionMat(THREE, 'witch', 20, 20, 8, 8);
        const head = new THREE.Mesh(new THREE.BoxGeometry(8 * px, 8 * px, 8 * px), P.headMats(THREE, 'witch'));
        head.name = 'head';
        head.position.y = 26 * px;
        const nose = P.box(THREE, 1.2 * px, 1.2 * px, 2.4 * px, robe);
        nose.position.set(0, -0.4 * px, 5 * px);
        head.add(nose);
        const hat = new THREE.MeshLambertMaterial({ color: 0x1a1a22 });
        const brim = P.box(THREE, 14 * px, 1.2 * px, 14 * px, hat);
        brim.position.y = 31 * px;
        const cone1 = P.box(THREE, 8 * px, 4 * px, 8 * px, hat);
        cone1.position.y = 34 * px;
        const cone2 = P.box(THREE, 5 * px, 5 * px, 5 * px, hat);
        cone2.position.y = 38.5 * px;
        const cone3 = P.box(THREE, 2.4 * px, 5 * px, 2.4 * px, hat);
        cone3.position.set(1.2 * px, 43 * px, 0);
        const buckle = new THREE.MeshLambertMaterial({ color: 0xe0b040 });
        const buckleM = P.box(THREE, 2.2 * px, 1.4 * px, 0.5 * px, buckle);
        buckleM.position.set(0, 32.2 * px, 7.2 * px);
        const body = P.box(THREE, 8 * px, 14 * px, 6 * px, robe);
        body.name = 'body';
        body.position.y = 15 * px;
        const skirt = P.box(THREE, 10 * px, 6 * px, 8 * px, robe);
        skirt.position.y = 6 * px;
        root.add(head);
        root.add(brim);
        root.add(cone1);
        root.add(cone2);
        root.add(cone3);
        root.add(buckleM);
        root.add(body);
        root.add(skirt);
        const arms = [];
        const legs = [];
        [-1, 1].forEach(function (side) {
            const ap = new THREE.Group();
            ap.position.set(side * 5.5 * px, 20 * px, 0);
            const arm = P.box(THREE, 3 * px, 12 * px, 3 * px, robe);
            arm.position.y = -6 * px;
            ap.add(arm);
            root.add(ap);
            arms.push(ap);
            const lp = new THREE.Group();
            lp.position.set(side * 2 * px, 6 * px, 0);
            const leg = P.box(THREE, 3 * px, 6 * px, 3 * px, robe);
            leg.position.y = -3 * px;
            lp.add(leg);
            root.add(lp);
            legs.push(lp);
        });
        const wood = new THREE.MeshLambertMaterial({ color: 0x6b4424 });
        const staff = P.box(THREE, 0.9 * px, 22 * px, 0.9 * px, wood);
        staff.position.set(0, -4 * px, 0);
        const orb = new THREE.Mesh(
            new THREE.BoxGeometry(2.2 * px, 2.2 * px, 2.2 * px),
            new THREE.MeshLambertMaterial({ color: 0x54d43c, emissive: 0x145018 })
        );
        orb.position.set(0, 8 * px, 0);
        arms[1].add(staff);
        arms[1].add(orb);
        root.userData.sculptRuntime = { nodes: { head: head, body: body, arms: arms, legs: legs } };
        root.userData.tick = function (t, moving) {
            const s = Math.sin(t * (moving ? 6 : 2.6)) * (moving ? 0.4 : 0.1);
            legs[0].rotation.x = s;
            legs[1].rotation.x = -s;
            arms[0].rotation.x = -0.2 + s * 0.3;
            arms[1].rotation.x = -0.45;
            orb.position.y = 8 * px + Math.sin(t * 4) * 0.03;
        };
        return root;
    }

    global.BlockLegendWitchModel = { create: createWitchModel };
}(typeof window !== 'undefined' ? window : globalThis));
