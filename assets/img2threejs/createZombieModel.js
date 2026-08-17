/**
 * BlockLegend zombie — procedural THREE.Group from four-view references.
 * Original voxel design; not a Mojang skin.
 */
(function (global) {
    'use strict';

    function paint(w, h, fn) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        fn(ctx);
        return c;
    }

    function tex(THREE, canvas) {
        const t = new THREE.CanvasTexture(canvas);
        t.magFilter = THREE.NearestFilter;
        t.minFilter = THREE.NearestFilter;
        t.generateMipmaps = false;
        return t;
    }

    function faceTex(THREE) {
        return tex(THREE, paint(8, 8, function (ctx) {
            ctx.fillStyle = '#7a8a7a';
            ctx.fillRect(0, 0, 8, 8);
            ctx.fillStyle = '#5a6a5a';
            ctx.fillRect(0, 0, 8, 1);
            ctx.fillStyle = '#1c2018';
            ctx.fillRect(1, 2, 2, 2);
            ctx.fillRect(5, 2, 2, 2);
            ctx.fillStyle = '#3a4030';
            ctx.fillRect(2, 5, 4, 2);
        }));
    }

    function skinTex(THREE) {
        return tex(THREE, paint(8, 8, function (ctx) {
            for (let y = 0; y < 8; y += 1) {
                for (let x = 0; x < 8; x += 1) {
                    ctx.fillStyle = ((x + y) % 3 === 0) ? '#6e7c6e' : '#889488';
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }));
    }

    function shirtTex(THREE) {
        return tex(THREE, paint(8, 12, function (ctx) {
            ctx.fillStyle = '#2f8f8a';
            ctx.fillRect(0, 0, 8, 12);
            ctx.fillStyle = '#1f6e6a';
            ctx.fillRect(0, 0, 8, 2);
            ctx.fillRect(6, 7, 2, 5);
            ctx.fillStyle = '#6e7c6e';
            ctx.fillRect(0, 10, 2, 2);
        }));
    }

    function pantsTex(THREE) {
        return tex(THREE, paint(4, 12, function (ctx) {
            ctx.fillStyle = '#3a2a1c';
            ctx.fillRect(0, 0, 4, 12);
            ctx.fillStyle = '#2a1c12';
            ctx.fillRect(0, 10, 4, 2);
        }));
    }

    function box(THREE, w, h, d, mat) {
        return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    }

    function createZombieModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.zombie) {
            const fv = global.BlockLegendFourView.build(THREE, 'zombie', options || {});
            if (fv) { return fv; }
        }
        const o = options || {};
        const px = o.pixel || 1 / 16;
        const root = new THREE.Group();
        root.name = 'zombie';
        const skin = new THREE.MeshLambertMaterial({ map: skinTex(THREE) });
        const face = new THREE.MeshLambertMaterial({ map: faceTex(THREE) });
        const shirt = new THREE.MeshLambertMaterial({ map: shirtTex(THREE) });
        const pants = new THREE.MeshLambertMaterial({ map: pantsTex(THREE) });
        const head = new THREE.Mesh(new THREE.BoxGeometry(8 * px, 8 * px, 8 * px), [skin, skin, skin, skin, face, skin]);
        head.name = 'head';
        head.position.y = 28 * px;
        const body = box(THREE, 8 * px, 12 * px, 4 * px, shirt);
        body.name = 'body';
        body.position.y = 18 * px;
        root.add(head);
        root.add(body);
        const arms = [];
        [-1, 1].forEach(function (side) {
            const pivot = new THREE.Group();
            pivot.name = side < 0 ? 'arm-right' : 'arm-left';
            pivot.position.set(side * 6 * px, 24 * px, 0);
            pivot.rotation.x = -Math.PI / 2.5;
            const arm = box(THREE, 4 * px, 12 * px, 4 * px, skin);
            arm.position.y = -6 * px;
            pivot.add(arm);
            root.add(pivot);
            arms.push(pivot);
        });
        const legs = [];
        [-1, 1].forEach(function (side) {
            const pivot = new THREE.Group();
            pivot.name = side < 0 ? 'leg-right' : 'leg-left';
            pivot.position.set(side * 2 * px, 12 * px, 0);
            const leg = box(THREE, 4 * px, 12 * px, 4 * px, pants);
            leg.position.y = -6 * px;
            pivot.add(leg);
            root.add(pivot);
            legs.push(pivot);
        });
        root.userData.sculptRuntime = {
            nodes: { head: head, body: body, arms: arms, legs: legs },
            sockets: { head: head, rightHand: arms[0], leftHand: arms[1] },
            colliders: [{ kind: 'box', size: [8 * px, 32 * px, 8 * px] }]
        };
        root.userData.tick = function (t, moving) {
            const swing = Math.sin(t * (moving ? 7 : 3.2)) * (moving ? 0.55 : 0.12);
            legs[0].rotation.x = swing;
            legs[1].rotation.x = -swing;
            arms.forEach(function (arm, i) {
                arm.rotation.x = -Math.PI / 2.5 + Math.sin(t * 2 + i) * 0.05;
            });
            head.rotation.y = Math.sin(t * 0.7) * 0.1;
        };
        return root;
    }

    global.BlockLegendZombieModel = { create: createZombieModel };
}(typeof window !== 'undefined' ? window : globalThis));
