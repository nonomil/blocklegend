/**
 * BlockLegend husk — desert zombie variant from four-view atlas.
 * Original voxel design; not a Mojang skin.
 */
(function (global) {
    'use strict';

    function createHuskModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.husk) {
            const fv = global.BlockLegendFourView.build(THREE, 'husk', options || {});
            if (fv) { return fv; }
        }
        if (global.BlockLegendZombieModel) {
            return global.BlockLegendZombieModel.create(THREE, options || {});
        }
        const root = new THREE.Group();
        root.name = 'husk';
        return root;
    }

    global.BlockLegendHuskModel = { create: createHuskModel };
}(typeof window !== 'undefined' ? window : globalThis));
