/**
 * BlockLegend guardian — ocean sentry from four-view atlas.
 * Original voxel design; not a Mojang mesh.
 */
(function (global) {
    'use strict';

    function createGuardianModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.guardian) {
            const fv = global.BlockLegendFourView.build(THREE, 'guardian', options || {});
            if (fv) { return fv; }
        }
        const root = new THREE.Group();
        root.name = 'guardian';
        return root;
    }

    global.BlockLegendGuardianModel = { create: createGuardianModel };
}(typeof window !== 'undefined' ? window : globalThis));
