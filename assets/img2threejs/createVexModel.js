/**
 * BlockLegend vex — tiny flyer from four-view atlas.
 * Original voxel design; not a Mojang mesh.
 */
(function (global) {
    'use strict';

    function createVexModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.vex) {
            const fv = global.BlockLegendFourView.build(THREE, 'vex', options || {});
            if (fv) { return fv; }
        }
        const root = new THREE.Group();
        root.name = 'vex';
        return root;
    }

    global.BlockLegendVexModel = { create: createVexModel };
}(typeof window !== 'undefined' ? window : globalThis));
