/**
 * BlockLegend snow golem — pumpkin-headed snow stack from four-view atlas.
 * Original voxel design; not a Mojang mesh.
 */
(function (global) {
    'use strict';

    function createSnowGolemModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.snowgolem) {
            const fv = global.BlockLegendFourView.build(THREE, 'snowgolem', options || {});
            if (fv) { return fv; }
        }
        const root = new THREE.Group();
        root.name = 'snowgolem';
        return root;
    }

    global.BlockLegendSnowGolemModel = { create: createSnowGolemModel };
}(typeof window !== 'undefined' ? window : globalThis));
