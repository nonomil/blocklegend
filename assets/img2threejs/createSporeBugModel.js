/**
 * BlockLegend spore bug — original mushroom beetle from four-view atlas.
 */
(function (global) {
    'use strict';

    function createSporeBugModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.spore_bug) {
            const fv = global.BlockLegendFourView.build(THREE, 'spore_bug', options || {});
            if (fv) { return fv; }
        }
        const root = new THREE.Group();
        root.name = 'spore_bug';
        return root;
    }

    global.BlockLegendSporeBugModel = { create: createSporeBugModel };
}(typeof window !== 'undefined' ? window : globalThis));
