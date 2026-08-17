/**
 * BlockLegend creeper — procedural THREE.Group from four-view references.
 * Original voxel design; not a Mojang mesh or official texture.
 */
(function (global) {
    'use strict';

    function faceTex(THREE) {
        const c = document.createElement('canvas');
        c.width = 8; c.height = 8;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#6fbf45';
        ctx.fillRect(0, 0, 8, 8);
        ctx.fillStyle = '#4a8a2e';
        ctx.fillRect(0, 0, 8, 1);
        ctx.fillRect(0, 7, 8, 1);
        ctx.fillStyle = '#1a2414';
        ctx.fillRect(1, 2, 2, 2);
        ctx.fillRect(5, 2, 2, 2);
        ctx.fillRect(2, 5, 4, 2);
        const tex = new THREE.CanvasTexture(c);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.generateMipmaps = false;
        return tex;
    }

    function mossTex(THREE, seed) {
        const c = document.createElement('canvas');
        c.width = 8; c.height = 8;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        for (let y = 0; y < 8; y += 1) {
            for (let x = 0; x < 8; x += 1) {
                const n = ((x * 13 + y * 29 + seed * 17) % 7);
                ctx.fillStyle = n > 4 ? '#4f8a32' : n > 2 ? '#7dcc52' : '#68b33c';
                ctx.fillRect(x, y, 1, 1);
            }
        }
        const tex = new THREE.CanvasTexture(c);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.generateMipmaps = false;
        return tex;
    }

    function box(THREE, w, h, d, mat) {
        return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    }

    function createCreeperModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.creeper) {
            const fv = global.BlockLegendFourView.build(THREE, 'creeper', options || {});
            if (fv) { return fv; }
        }
        const o = options || {};
        const px = o.pixel || 1 / 16;
        const root = new THREE.Group();
        root.name = 'creeper';
        const moss = new THREE.MeshLambertMaterial({ map: mossTex(THREE, 3) });
        const mossB = new THREE.MeshLambertMaterial({ map: mossTex(THREE, 9) });
        const face = new THREE.MeshLambertMaterial({ map: faceTex(THREE) });
        const headMats = [moss, moss, moss, moss, face, mossB];
        const head = new THREE.Mesh(new THREE.BoxGeometry(8 * px, 8 * px, 8 * px), headMats);
        head.name = 'head';
        head.position.y = 22 * px;
        const body = box(THREE, 8 * px, 12 * px, 4 * px, mossB);
        body.name = 'body';
        body.position.y = 12 * px;
        root.add(head);
        root.add(body);
        const legs = [];
        [[-2, -2], [2, -2], [-2, 2], [2, 2]].forEach(function (p, i) {
            const pivot = new THREE.Group();
            pivot.name = 'leg-pivot-' + i;
            pivot.position.set(p[0] * px, 6 * px, p[1] * px);
            const leg = box(THREE, 4 * px, 6 * px, 4 * px, moss);
            leg.name = 'leg-' + i;
            leg.position.y = -3 * px;
            pivot.add(leg);
            root.add(pivot);
            legs.push(pivot);
        });
        root.userData.sculptRuntime = {
            nodes: { head: head, body: body, legs: legs },
            sockets: { head: head, root: root },
            colliders: [{ kind: 'box', size: [8 * px, 26 * px, 8 * px] }]
        };
        root.userData.tick = function (t, moving) {
            const swing = Math.sin(t * (moving ? 8 : 3.2)) * (moving ? 0.55 : 0.1);
            legs.forEach(function (leg, i) {
                leg.rotation.x = swing * (i % 2 === 0 ? 1 : -1);
            });
            head.rotation.y = Math.sin(t * 0.8) * 0.08;
        };
        return root;
    }

    global.BlockLegendCreeperModel = { create: createCreeperModel };
}(typeof window !== 'undefined' ? window : globalThis));
