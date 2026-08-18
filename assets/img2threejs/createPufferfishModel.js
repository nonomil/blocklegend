/**
 * BlockLegend pufferfish — puffed orange cube from four-view atlas.
 * Original voxel design; not a Mojang mesh.
 */
(function (global) {
    'use strict';

    function createPufferfishModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.pufferfish) {
            const fv = global.BlockLegendFourView.build(THREE, 'pufferfish', options || {});
            if (fv) { return fv; }
        }
        const root = new THREE.Group();
        root.name = 'pufferfish';
        return root;
    }

    global.BlockLegendPufferfishModel = { create: createPufferfishModel };
}(typeof window !== 'undefined' ? window : globalThis));
