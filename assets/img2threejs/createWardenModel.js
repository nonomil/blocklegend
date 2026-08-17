/**
 * BlockLegend echo sentinel — dark teal bulk, cyan sensors, chest mark.
 * Ref: Godot mobs/warden.png
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

    function createWardenModel(THREE, options) {
        if (global.BlockLegendFourView && global.BlockLegendAtlas4V && global.BlockLegendAtlas4V.warden) {
            const fv = global.BlockLegendFourView.build(THREE, 'warden', Object.assign({
                emissive: { match: 'visor', color: 0x146060 }
            }, options || {}));
            if (fv) { return fv; }
        }
        const px = (options && options.pixel) || 1 / 16;
        const root = new THREE.Group();
        root.name = 'warden';
        const hide = 0x163038;
        const plate = 0x6a7278;
        const glow = 0x3de0e8;
        const body = box(THREE, 14 * px, 16 * px, 8 * px, hide);
        body.name = 'body';
        body.position.y = 18 * px;
        const mark = box(THREE, 4 * px, 6 * px, 0.6 * px, glow, { emissive: 0x145050 });
        mark.position.set(0, 1 * px, 4.2 * px);
        const shoulderL = box(THREE, 5 * px, 4 * px, 5 * px, plate);
        const shoulderR = box(THREE, 5 * px, 4 * px, 5 * px, plate);
        shoulderL.position.set(-8 * px, 6 * px, 0);
        shoulderR.position.set(8 * px, 6 * px, 0);
        body.add(mark);
        body.add(shoulderL);
        body.add(shoulderR);
        const head = box(THREE, 10 * px, 9 * px, 8 * px, hide);
        head.name = 'head';
        head.position.y = 31 * px;
        const eyeL = box(THREE, 2.4 * px, 1.2 * px, 0.5 * px, glow, { emissive: 0x146060 });
        const eyeR = box(THREE, 2.4 * px, 1.2 * px, 0.5 * px, glow, { emissive: 0x146060 });
        eyeL.position.set(-2.2 * px, 0.8 * px, 4.1 * px);
        eyeR.position.set(2.2 * px, 0.8 * px, 4.1 * px);
        const tuskL = box(THREE, 1.2 * px, 2 * px, 1.2 * px, 0xe8e8e0);
        const tuskR = box(THREE, 1.2 * px, 2 * px, 1.2 * px, 0xe8e8e0);
        tuskL.position.set(-1.6 * px, -3.4 * px, 3.6 * px);
        tuskR.position.set(1.6 * px, -3.4 * px, 3.6 * px);
        const sensorL = box(THREE, 2 * px, 6 * px, 2 * px, glow, { emissive: 0x0a3030 });
        const sensorR = box(THREE, 2 * px, 6 * px, 2 * px, glow, { emissive: 0x0a3030 });
        sensorL.position.set(-3.2 * px, 6.5 * px, 0);
        sensorR.position.set(3.2 * px, 6.5 * px, 0);
        sensorL.rotation.z = 0.35;
        sensorR.rotation.z = -0.35;
        head.add(eyeL);
        head.add(eyeR);
        head.add(tuskL);
        head.add(tuskR);
        head.add(sensorL);
        head.add(sensorR);
        root.add(body);
        root.add(head);
        const arms = [];
        const legs = [];
        [-1, 1].forEach(function (side) {
            const ap = new THREE.Group();
            ap.position.set(side * 10 * px, 24 * px, 0);
            const arm = box(THREE, 5 * px, 20 * px, 5 * px, hide);
            arm.position.y = -10 * px;
            const claw = box(THREE, 5.4 * px, 3 * px, 6 * px, 0x0e2026);
            claw.position.y = -11 * px;
            ap.add(arm);
            ap.add(claw);
            root.add(ap);
            arms.push(ap);
            const lp = new THREE.Group();
            lp.position.set(side * 3.4 * px, 10 * px, 0);
            const leg = box(THREE, 5 * px, 10 * px, 6 * px, 0x0e2026);
            leg.position.y = -5 * px;
            lp.add(leg);
            root.add(lp);
            legs.push(lp);
        });
        root.userData.sculptRuntime = { nodes: { head: head, body: body, arms: arms, legs: legs } };
        root.userData.tick = function (t, moving) {
            const s = Math.sin(t * (moving ? 3.6 : 1.4)) * (moving ? 0.2 : 0.04);
            legs[0].rotation.x = s;
            legs[1].rotation.x = -s;
            arms[0].rotation.x = -s * 0.4;
            arms[1].rotation.x = s * 0.4;
            sensorL.rotation.z = 0.35 + Math.sin(t * 2) * 0.08;
            sensorR.rotation.z = -0.35 - Math.sin(t * 2) * 0.08;
        };
        return root;
    }

    global.BlockLegendWardenModel = { create: createWardenModel };
}(typeof window !== 'undefined' ? window : globalThis));
