/**
 * BlockLegend vindicator — olive-coat illager with a chest axe.
 * Original voxel design; not a Mojang mesh.
 */
(function (global) {
    'use strict';

    function createVindicatorModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.vindicator) {
            const fv = global.BlockLegendFourView.build(THREE, 'vindicator', options || {});
            if (fv) { return fv; }
        }
        const root = new THREE.Group();
        root.name = 'vindicator';
        return root;
    }

    global.BlockLegendVindicatorModel = { create: createVindicatorModel };
}(typeof window !== 'undefined' ? window : globalThis));
