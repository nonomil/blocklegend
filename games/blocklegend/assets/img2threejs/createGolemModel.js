/**
 * BlockLegend iron statue from GPT four-view sheet.
 * Cuboids stay public ModelRenderer sizes; surfaces are nearest-neighbor pixels.
 */
(function (global) {
    'use strict';

    function pixTex(THREE, seed, colors) {
        const c = document.createElement('canvas');
        c.width = 8;
        c.height = 8;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        for (let y = 0; y < 8; y += 1) {
            for (let x = 0; x < 8; x += 1) {
                const n = (x * 13 + y * 29 + seed * 17) % colors.length;
                ctx.fillStyle = colors[n];
                ctx.fillRect(x, y, 1, 1);
            }
        }
        const tex = new THREE.CanvasTexture(c);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.generateMipmaps = false;
        return tex;
    }

    function mat(THREE, seed, colors, extra) {
        const o = extra || {};
        return new THREE.MeshLambertMaterial({
            map: pixTex(THREE, seed, colors),
            emissive: o.emissive || 0x000000
        });
    }

    function box(THREE, w, h, d, material) {
        return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    }

    function createGolemModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.golem) {
            const fv = global.BlockLegendFourView.build(THREE, 'golem', Object.assign({
                emissive: { match: 'eye', color: 0x440000 }
            }, options || {}));
            if (fv) { return fv; }
        }
        const px = (options && options.pixel) || 1 / 16;
        const root = new THREE.Group();
        root.name = 'golem';
        const iron = mat(THREE, 1, ['#c4ccd2', '#b4bcc4', '#d0d6dc', '#9aa4ac']);
        const dark = mat(THREE, 4, ['#6a7278', '#5a6268', '#7a8288']);
        const vine = mat(THREE, 7, ['#3d7a32', '#2f6228', '#4a8c3c']);
        const solid = function (color, extra) {
            return new THREE.MeshLambertMaterial({
                color: color,
                emissive: (extra && extra.emissive) || 0x000000
            });
        };

        const chest = box(THREE, 18 * px, 12 * px, 11 * px, iron);
        chest.name = 'body';
        chest.position.set(0, 27 * px, 0);
        const waist = box(THREE, 9 * px, 5 * px, 6 * px, dark);
        waist.position.set(0, 18.5 * px, 0);
        const vineA = box(THREE, 8 * px, 9 * px, 1.2 * px, vine);
        vineA.position.set(-3 * px, 1 * px, 5.8 * px);
        const vineB = box(THREE, 6 * px, 7 * px, 1.2 * px, vine);
        vineB.position.set(4 * px, -2 * px, 5.8 * px);
        const vineBack = box(THREE, 10 * px, 6 * px, 1.2 * px, vine);
        vineBack.position.set(0, 3 * px, -5.8 * px);
        const flower = box(THREE, 2.4 * px, 2.4 * px, 0.8 * px, solid(0xe07090));
        flower.position.set(2 * px, 4 * px, 6.2 * px);
        chest.add(vineA);
        chest.add(vineB);
        chest.add(vineBack);
        chest.add(flower);

        const head = box(THREE, 8 * px, 10 * px, 8 * px, iron);
        head.name = 'head';
        head.position.set(0, 38 * px, -2 * px);
        const brow = box(THREE, 6 * px, 1.6 * px, 0.6 * px, dark);
        brow.position.set(0, 2 * px, 4.2 * px);
        const nose = box(THREE, 2 * px, 4 * px, 2 * px, dark);
        nose.position.set(0, -3 * px, 5.5 * px);
        const eyeL = box(THREE, 2 * px, 0.8 * px, 0.4 * px, solid(0xc62828, { emissive: 0x440000 }));
        const eyeR = box(THREE, 2 * px, 0.8 * px, 0.4 * px, solid(0xc62828, { emissive: 0x440000 }));
        eyeL.position.set(-1.6 * px, 0.4 * px, 4.2 * px);
        eyeR.position.set(1.6 * px, 0.4 * px, 4.2 * px);
        head.add(brow);
        head.add(nose);
        head.add(eyeL);
        head.add(eyeR);

        root.add(chest);
        root.add(waist);
        root.add(head);

        const arms = [];
        const legs = [];
        [-1, 1].forEach(function (side) {
            const ap = new THREE.Group();
            ap.position.set(side * 11 * px, 33.5 * px, 0);
            const arm = box(THREE, 4 * px, 30 * px, 6 * px, iron);
            arm.position.y = -15 * px;
            for (let i = 0; i < 5; i += 1) {
                const rivet = box(THREE, 1.1 * px, 1.1 * px, 1.1 * px, dark);
                rivet.position.set(side * 2.2 * px, 10 * px - i * 5 * px, 0);
                arm.add(rivet);
            }
            const vineArm = box(THREE, 2.2 * px, 8 * px, 1 * px, vine);
            vineArm.position.set(side * 1.6 * px, 8 * px, 3.2 * px);
            arm.add(vineArm);
            ap.add(arm);
            root.add(ap);
            arms.push(ap);

            const lp = new THREE.Group();
            lp.position.set(side * 4.5 * px, 16 * px, 0);
            const leg = box(THREE, 6 * px, 16 * px, 5 * px, dark);
            leg.position.y = -8 * px;
            for (let t = -1; t <= 1; t += 1) {
                const toe = box(THREE, 1.2 * px, 1.2 * px, 1.2 * px, iron);
                toe.position.set(t * 1.6 * px, -8.2 * px, 2.4 * px);
                lp.add(toe);
            }
            lp.add(leg);
            root.add(lp);
            legs.push(lp);
        });

        root.userData.sculptRuntime = { nodes: { head: head, body: chest, arms: arms, legs: legs } };
        root.userData.tick = function (t, moving) {
            const s = Math.sin(t * (moving ? 4.2 : 1.8)) * (moving ? 0.22 : 0.04);
            legs[0].rotation.x = s;
            legs[1].rotation.x = -s;
            arms[0].rotation.x = -s * 0.28;
            arms[1].rotation.x = s * 0.28;
        };
        return root;
    }

    global.BlockLegendGolemModel = { create: createGolemModel };
}(typeof window !== 'undefined' ? window : globalThis));
