/**
 * BlockLegend weeping cube — white head, frown, hanging tentacles.
 * Ref: Godot mobs/ghast.png (front/side views)
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

    function createGhastModel(THREE, options) {
        const px = (options && options.pixel) || 1 / 14;
        const root = new THREE.Group();
        root.name = 'ghast';
        const body = box(THREE, 16 * px, 16 * px, 16 * px, 0xf4f0ea);
        body.name = 'body';
        body.position.y = 18 * px;
        const eyeL = box(THREE, 3 * px, 2 * px, 0.5 * px, 0x3a3a42);
        const eyeR = box(THREE, 3 * px, 2 * px, 0.5 * px, 0x3a3a42);
        eyeL.position.set(-3.2 * px, 2 * px, 8.2 * px);
        eyeR.position.set(3.2 * px, 2 * px, 8.2 * px);
        eyeL.rotation.z = 0.28;
        eyeR.rotation.z = -0.28;
        const mouth = box(THREE, 6 * px, 1.4 * px, 0.5 * px, 0x3a3a42);
        mouth.position.set(0, -2.4 * px, 8.2 * px);
        body.add(eyeL);
        body.add(eyeR);
        body.add(mouth);
        root.add(body);
        const tentacles = [];
        const spots = [
            [-4, -4], [0, -5], [4, -4],
            [-5, 0], [5, 0],
            [-4, 4], [0, 5], [4, 4]
        ];
        spots.forEach(function (p, i) {
            const t = new THREE.Group();
            t.position.set(p[0] * px, 10 * px, p[1] * px);
            const col = i % 3 === 0 ? 0xe8e0d8 : 0xf4f0ea;
            [0, 1, 2].forEach(function (seg) {
                const bit = box(THREE, 2 * px, 3.2 * px, 2 * px, col);
                bit.position.y = -(seg * 3.4 + 1.6) * px;
                t.add(bit);
            });
            const tip = box(THREE, 1.6 * px, 1.6 * px, 1.6 * px, 0xffffff);
            tip.position.y = -11.2 * px;
            t.add(tip);
            root.add(t);
            tentacles.push(t);
        });
        root.userData.sculptRuntime = { nodes: { body: body, tentacles: tentacles } };
        root.userData.tick = function (t) {
            body.position.y = 18 * px + Math.sin(t * 1.6) * 0.06;
            tentacles.forEach(function (n, i) {
                n.rotation.x = Math.sin(t * 2.2 + i) * 0.18;
                n.rotation.z = Math.cos(t * 1.7 + i * 0.7) * 0.1;
            });
        };
        return root;
    }

    global.BlockLegendGhastModel = { create: createGhastModel };
}(typeof window !== 'undefined' ? window : globalThis));
