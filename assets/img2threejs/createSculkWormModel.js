/**
 * BlockLegend sculk worm — original sculk caterpillar from four-view atlas.
 */
(function (global) {
    'use strict';

    function createSculkWormModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.sculk_worm) {
            const fv = global.BlockLegendFourView.build(THREE, 'sculk_worm', options || {});
            if (fv) { return fv; }
        }
        const root = new THREE.Group();
        root.name = 'sculk_worm';
        return root;
    }

    global.BlockLegendSculkWormModel = { create: createSculkWormModel };
}(typeof window !== 'undefined' ? window : globalThis));
