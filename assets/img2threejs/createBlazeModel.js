/**
 * BlockLegend fire rod — glowing head, orbiting ember sticks.
 * Ref: Godot mobs/blaze.png
 */
(function (global) {
    'use strict';

    function box(THREE, w, h, d, color, extra) {
        const o = extra || {};
        return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({
            color: color,
            emissive: o.emissive || 0x000000
        }));
    }

    function createBlazeModel(THREE, options) {
        const px = (options && options.pixel) || 1 / 16;
        const root = new THREE.Group();
        root.name = 'blaze';
        const head = box(THREE, 8 * px, 8 * px, 8 * px, 0xffb02a, { emissive: 0x662200 });
        head.name = 'head';
        head.position.y = 22 * px;
        const brow = box(THREE, 6 * px, 1 * px, 0.4 * px, 0x1a1008);
        brow.position.set(0, 1.4 * px, 4.1 * px);
        const eyeL = box(THREE, 1.6 * px, 1.2 * px, 0.4 * px, 0x141010);
        const eyeR = box(THREE, 1.6 * px, 1.2 * px, 0.4 * px, 0x141010);
        eyeL.position.set(-1.8 * px, 0.4 * px, 4.1 * px);
        eyeR.position.set(1.8 * px, 0.4 * px, 4.1 * px);
        const mouth = box(THREE, 3.6 * px, 1 * px, 0.4 * px, 0x141010);
        mouth.position.set(0, -1.8 * px, 4.1 * px);
        head.add(brow);
        head.add(eyeL);
        head.add(eyeR);
        head.add(mouth);
        root.add(head);
        const rods = [];
        for (let i = 0; i < 12; i += 1) {
            const ring = i < 6 ? 0 : 1;
            const rod = box(THREE, 1.6 * px, 10 * px, 1.6 * px, ring ? 0xff7a1a : 0xffc04a, { emissive: 0x441000 });
            rod.userData.ring = ring;
            rod.userData.idx = i % 6;
            root.add(rod);
            rods.push(rod);
        }
        root.userData.sculptRuntime = { nodes: { head: head, rods: rods } };
        root.userData.tick = function (t) {
            head.position.y = 22 * px + Math.sin(t * 3) * 0.05;
            rods.forEach(function (rod) {
                const a = t * (rod.userData.ring ? 1.6 : 2.2) + rod.userData.idx * (Math.PI / 3);
                const r = rod.userData.ring ? 0.42 : 0.28;
                rod.position.set(Math.cos(a) * r, (rod.userData.ring ? 0.7 : 1.05) + Math.sin(t * 4 + rod.userData.idx) * 0.06, Math.sin(a) * r);
            });
        };
        return root;
    }

    global.BlockLegendBlazeModel = { create: createBlazeModel };
}(typeof window !== 'undefined' ? window : globalThis));
