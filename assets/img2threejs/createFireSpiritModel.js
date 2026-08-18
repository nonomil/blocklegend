/**
 * BlockLegend fire spirit — original flame wisp from four-view atlas.
 */
(function (global) {
    'use strict';

    function createFireSpiritModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.fire_spirit) {
            const fv = global.BlockLegendFourView.build(THREE, 'fire_spirit', options || {});
            if (fv) { return fv; }
        }
        const root = new THREE.Group();
        root.name = 'fire_spirit';
        return root;
    }

    global.BlockLegendFireSpiritModel = { create: createFireSpiritModel };
}(typeof window !== 'undefined' ? window : globalThis));
