/**
 * BlockLegend phantom — night flyer from four-view atlas.
 * Original voxel design; not a Mojang mesh.
 */
(function (global) {
    'use strict';

    function box(THREE, w, h, d, color) {
        return new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            new THREE.MeshLambertMaterial({ color: color })
        );
    }

    function createPhantomModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.phantom) {
            const fv = global.BlockLegendFourView.build(THREE, 'phantom', options || {});
            if (fv) { return fv; }
        }
        const o = options || {};
        const px = o.pixel || 1 / 16;
        const root = new THREE.Group();
        root.name = 'phantom';
        const body = box(THREE, 7 * px, 3 * px, 9 * px, 0x3a4458);
        body.position.y = 8 * px;
        const wingL = box(THREE, 16 * px, 2 * px, 9 * px, 0x4a5568);
        wingL.position.set(-11.5 * px, 8.4 * px, 0);
        const wingR = box(THREE, 16 * px, 2 * px, 9 * px, 0x4a5568);
        wingR.position.set(11.5 * px, 8.4 * px, 0);
        root.add(body);
        root.add(wingL);
        root.add(wingR);
        return root;
    }

    global.BlockLegendPhantomModel = { create: createPhantomModel };
}(typeof window !== 'undefined' ? window : globalThis));
