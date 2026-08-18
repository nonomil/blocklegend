/**
 * BlockLegend ravager — raid beast from four-view atlas.
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

    function createRavagerModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.ravager) {
            const fv = global.BlockLegendFourView.build(THREE, 'ravager', options || {});
            if (fv) { return fv; }
        }
        const o = options || {};
        const px = o.pixel || 1 / 16;
        const root = new THREE.Group();
        root.name = 'ravager';
        const hide = 0x5a4a3c;
        const body = box(THREE, 20 * px, 16 * px, 26 * px, hide);
        body.position.y = 18 * px;
        const head = box(THREE, 16 * px, 16 * px, 14 * px, 0x6a5848);
        head.position.set(0, 26 * px, 22 * px);
        root.add(body);
        root.add(head);
        return root;
    }

    global.BlockLegendRavagerModel = { create: createRavagerModel };
}(typeof window !== 'undefined' ? window : globalThis));
