/**
 * BlockLegend shadow stalker — original hooded hunter from four-view atlas.
 */
(function (global) {
    'use strict';

    function createShadowStalkerModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.shadow_stalker) {
            const fv = global.BlockLegendFourView.build(THREE, 'shadow_stalker', options || {});
            if (fv) { return fv; }
        }
        const root = new THREE.Group();
        root.name = 'shadow_stalker';
        return root;
    }

    global.BlockLegendShadowStalkerModel = { create: createShadowStalkerModel };
}(typeof window !== 'undefined' ? window : globalThis));
