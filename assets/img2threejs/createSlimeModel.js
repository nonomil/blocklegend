/**
 * BlockLegend slime / magma / cube — layered jelly cubes. Original design.
 * Ref: prj/assets/generated/blocklegend-roster/raw/cubes-fox.png
 */
(function (global) {
    'use strict';

    function createSlimeModel(THREE, options) {
        const o = options || {};
        const kind = o.kind || 'slime';
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V[kind]) {
            const extra = kind === 'magma' ? { emissive: { match: 'eye', color: 0x663300 } } : {};
            const fv = global.BlockLegendFourView.build(THREE, kind, Object.assign(extra, o));
            if (fv) { return fv; }
        }
        const px = o.pixel || 1 / 16;
        const P = global.BlockLegendVoxelPix;
        const root = new THREE.Group();
        root.name = kind;
        const extra = kind === 'magma' ? { emissive: 0x401000 } : {};
        const jelly = P
            ? P.regionMat(THREE, kind, 16, 16, 16, 16, extra)
            : new THREE.MeshLambertMaterial({ color: kind === 'magma' ? 0xa83414 : kind === 'cube' ? 0xc47a3a : 0x6fbf4a });
        const face = P && kind === 'slime'
            ? P.regionMat(THREE, kind, 0, 0, 16, 16, extra)
            : jelly;
        if (kind === 'slime') {
            jelly.transparent = true;
            jelly.opacity = 0.82;
            if (face !== jelly) {
                face.transparent = true;
                face.opacity = 0.82;
            }
        }
        const outer = kind === 'slime' ? [jelly, jelly, jelly, jelly, face, jelly] : jelly;
        const body = new THREE.Mesh(new THREE.BoxGeometry(16 * px, 16 * px, 16 * px), outer);
        body.name = 'body';
        body.position.y = 8 * px;
        const inner = new THREE.Mesh(
            new THREE.BoxGeometry(10 * px, 10 * px, 10 * px),
            new THREE.MeshLambertMaterial({
                color: kind === 'magma' ? 0xff6a20 : kind === 'cube' ? 0x8a4a20 : 0x3d7a28,
                emissive: kind === 'magma' ? 0x662200 : 0x000000
            })
        );
        inner.position.y = 8 * px;
        if (kind !== 'slime') {
            const eyeC = kind === 'magma' ? 0xffc04a : 0x1a2414;
            const eyeL = new THREE.Mesh(new THREE.BoxGeometry(2.4 * px, 2.4 * px, 0.5 * px), new THREE.MeshLambertMaterial({ color: eyeC, emissive: kind === 'magma' ? 0x663300 : 0x000000 }));
            const eyeR = new THREE.Mesh(new THREE.BoxGeometry(2.4 * px, 2.4 * px, 0.5 * px), new THREE.MeshLambertMaterial({ color: eyeC, emissive: kind === 'magma' ? 0x663300 : 0x000000 }));
            eyeL.position.set(-3.2 * px, 2 * px, 8.2 * px);
            eyeR.position.set(3.2 * px, 2 * px, 8.2 * px);
            body.add(eyeL);
            body.add(eyeR);
        }
        root.add(inner);
        root.add(body);
        if (kind === 'magma') {
            for (let i = 0; i < 3; i += 1) {
                const slab = new THREE.Mesh(new THREE.BoxGeometry(17 * px, 2 * px, 17 * px), outer);
                slab.position.y = (3 + i * 5) * px;
                root.add(slab);
            }
        }
        root.userData.sculptRuntime = { nodes: { body: body } };
        root.userData.tick = function (t, moving) {
            const hop = moving ? Math.abs(Math.sin(t * 6)) * 0.12 : Math.sin(t * 3) * 0.03;
            root.position.y = hop;
            body.scale.y = 1 - hop * 0.4;
        };
        return root;
    }

    global.BlockLegendSlimeModel = { create: createSlimeModel };
}(typeof window !== 'undefined' ? window : globalThis));
