/**
 * 骑乘龙：约 5000 体素铺形，再整网 Laplacian 平滑。
 */
(function (global) {
    'use strict';

    const WING_SPAN_PX = 38;

    function hideShield(root, hide) {
        if (!hide) return;
        root.traverse(function (o) {
            if (o.name === 'boss-shield') o.visible = false;
        });
    }

    function createDragonModel(THREE, options) {
        const opts = options || {};
        if (global.BlockLegendSmoothVoxelDragon && global.BlockLegendDragonVoxels) {
            const root = global.BlockLegendSmoothVoxelDragon.create(THREE, opts);
            if (root) {
                hideShield(root, opts.hideShield);
                return root;
            }
        }
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.dragon) {
            const root = global.BlockLegendFourView.build(THREE, 'dragon', Object.assign({ rounded: false }, opts));
            if (root) {
                hideShield(root, opts.hideShield);
                return root;
            }
        }
        const px = opts.pixel || 1 / 16;
        const root = new THREE.Group();
        root.name = 'dragon';
        return root;
    }

    global.BlockLegendDragonModel = {
        create: createDragonModel,
        kind: 'smooth-voxel',
        wingSpanPx: WING_SPAN_PX,
        rounded: false
    };
}(typeof window !== 'undefined' ? window : globalThis));
