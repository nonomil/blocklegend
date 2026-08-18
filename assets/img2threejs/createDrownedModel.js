/**
 * BlockLegend drowned — sea zombie variant from four-view atlas.
 * Original voxel design; not a Mojang skin.
 */
(function (global) {
    'use strict';

    function createDrownedModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.drowned) {
            const fv = global.BlockLegendFourView.build(THREE, 'drowned', options || {});
            if (fv) { return fv; }
        }
        if (global.BlockLegendZombieModel) {
            return global.BlockLegendZombieModel.create(THREE, options || {});
        }
        const root = new THREE.Group();
        root.name = 'drowned';
        return root;
    }

    global.BlockLegendDrownedModel = { create: createDrownedModel };
}(typeof window !== 'undefined' ? window : globalThis));
