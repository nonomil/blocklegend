/**
 * BlockLegend elder guardian — larger white sibling of the guardian atlas model.
 */
(function (global) {
    'use strict';

    function createElderGuardianModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.elder_guardian) {
            const fv = global.BlockLegendFourView.build(THREE, 'elder_guardian', options || {});
            if (fv) {
                fv.scale.setScalar(1.05);
                return fv;
            }
        }
        const root = new THREE.Group();
        root.name = 'elder_guardian';
        return root;
    }

    global.BlockLegendElderGuardianModel = { create: createElderGuardianModel };
}(typeof window !== 'undefined' ? window : globalThis));
