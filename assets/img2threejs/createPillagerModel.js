/**
 * BlockLegend pillager — illager with crossbow from four-view atlas.
 * Original voxel design; not a Mojang skin.
 */
(function (global) {
    'use strict';

    function createPillagerModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.pillager) {
            const fv = global.BlockLegendFourView.build(THREE, 'pillager', options || {});
            if (fv) { return fv; }
        }
        const root = new THREE.Group();
        root.name = 'pillager';
        return root;
    }

    global.BlockLegendPillagerModel = { create: createPillagerModel };
}(typeof window !== 'undefined' ? window : globalThis));
