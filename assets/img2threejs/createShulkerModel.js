/**
 * BlockLegend shulker — end-city shell from four-view atlas.
 * Original voxel design; not a Mojang mesh.
 */
(function (global) {
    'use strict';

    function createShulkerModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.shulker) {
            const fv = global.BlockLegendFourView.build(THREE, 'shulker', options || {});
            if (fv) { return fv; }
        }
        const root = new THREE.Group();
        root.name = 'shulker';
        return root;
    }

    global.BlockLegendShulkerModel = { create: createShulkerModel };
}(typeof window !== 'undefined' ? window : globalThis));
