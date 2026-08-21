/**
 * 骑乘龙分节姿态：颈 3 / 翅肩+膜 / 尾 5。只出数字，不依赖 Three。
 */
(function (global) {
    'use strict';

    const NECK = 3;
    const WING = 2;
    const TAIL = 5;
    const LAG = 0.113;

    function flapAt(t, moving) {
        const fx = global.BlockLegendFx && global.BlockLegendFx.wingFlap;
        if (fx) return fx(t, moving);
        const time = Number(t) || 0;
        if (moving) return Math.sin(time * 6.2) * 0.72 + Math.sin(time * 12.4) * 0.12;
        return Math.sin(time * 2.2) * 0.1;
    }

    function pose(t, moving) {
        const time = Number(t) || 0;
        const fly = !!moving;
        const flap = flapAt(time, fly);
        const flapLag = flapAt(time - LAG, fly);
        const neckBob = Math.sin(time * (fly ? 2.5 : 1.1)) * (fly ? 0.05 : 0.02);
        const neckYaw = Math.sin(time * 1.1) * (fly ? 0.08 : 0.04);
        const neck = [];
        for (let i = 0; i < NECK; i += 1) {
            neck.push({
                pitch: (-0.08 + neckBob) * ((i + 1) / NECK),
                yaw: neckYaw / NECK
            });
        }
        const tail = [];
        for (let i = 0; i < TAIL; i += 1) {
            tail.push({
                yaw: Math.sin(time * 1.8 - i * 0.7) * (fly ? 0.16 : 0.06),
                pitch: Math.sin(time * 1.2 - i * 0.5) * (fly ? 0.06 : 0.02)
            });
        }
        return {
            neck: neck,
            jaw: fly ? 0.12 + Math.max(0, flap) * 0.08 : 0.03,
            wingL: { shoulderZ: flap, membraneZ: flapLag * 0.8, x: flap * 0.16 },
            wingR: { shoulderZ: -flap, membraneZ: -flapLag * 0.8, x: flap * 0.16 },
            tail: tail,
            legsFold: fly ? 0.9 : 0
        };
    }

    function applyPose(joints, next) {
        if (!joints || !next) return joints;
        (next.neck || []).forEach(function (seg, i) {
            const n = joints.neck && joints.neck[i];
            if (!n || !n.rotation) return;
            n.rotation.x = seg.pitch;
            n.rotation.y = seg.yaw;
        });
        if (joints.jaw && joints.jaw.rotation) joints.jaw.rotation.x = next.jaw;
        ['wingL', 'wingR'].forEach(function (side) {
            const w = joints[side];
            const p = next[side];
            if (!w || !p) return;
            if (w.shoulder && w.shoulder.rotation) {
                w.shoulder.rotation.z = p.shoulderZ;
                w.shoulder.rotation.x = p.x;
            }
            if (w.membrane && w.membrane.rotation) w.membrane.rotation.z = p.membraneZ;
        });
        (next.tail || []).forEach(function (seg, i) {
            const n = joints.tail && joints.tail[i];
            if (!n || !n.rotation) return;
            n.rotation.y = seg.yaw;
            n.rotation.x = seg.pitch;
        });
        (joints.legs || []).forEach(function (leg) {
            if (leg && leg.rotation) leg.rotation.x = next.legsFold;
        });
        return joints;
    }

    function chainNeck(THREE, root, nodes, joints) {
        const src = nodes.neck;
        if (!src) return;
        const px = 1 / 16;
        const neck0 = new THREE.Group();
        neck0.name = 'neck0';
        root.add(neck0);
        neck0.position.copy(src.position);
        neck0.attach(src);
        joints.neck.push(neck0);
        let parent = neck0;
        for (let i = 1; i < NECK; i += 1) {
            const g = new THREE.Group();
            g.name = 'neck' + i;
            g.position.set(0, 0.35 * px, 4.2 * px);
            const extra = src.clone();
            extra.name = 'neckSeg' + i;
            extra.scale.setScalar(1 - i * 0.14);
            extra.position.set(0, 0, 1.6 * px);
            g.add(extra);
            parent.add(g);
            joints.neck.push(g);
            parent = g;
        }
        if (nodes.head) parent.attach(nodes.head);
        if (nodes.jaw && nodes.head) nodes.head.attach(nodes.jaw);
        if (nodes.hornL && nodes.head) nodes.head.attach(nodes.hornL);
        if (nodes.hornR && nodes.head) nodes.head.attach(nodes.hornR);
    }

    function splitWing(THREE, nodes, side, joints) {
        const mesh = nodes['wing' + side];
        if (!mesh || !mesh.parent) return;
        const pivot = mesh.parent;
        const membrane = new THREE.Group();
        membrane.name = 'wing' + side + 'Mem';
        const isL = side === 'L';
        membrane.position.set(isL ? -0.42 : 0.42, 0, 0);
        pivot.add(membrane);
        membrane.attach(mesh);
        const stub = mesh.clone();
        stub.name = 'wing' + side + 'Arm';
        stub.scale.set(0.4, 1.1, 0.5);
        stub.position.set(isL ? -0.12 : 0.12, 0, 0);
        pivot.add(stub);
        joints['wing' + side] = { shoulder: pivot, membrane: membrane };
    }

    function chainTail(THREE, root, nodes, joints) {
        const src = nodes.tail;
        if (!src) return;
        const px = 1 / 16;
        const tail0 = new THREE.Group();
        tail0.name = 'tail0';
        root.add(tail0);
        tail0.position.copy(src.position);
        tail0.attach(src);
        src.scale.set(1, 1, 0.28);
        joints.tail.push(tail0);
        let parent = tail0;
        for (let i = 1; i < TAIL; i += 1) {
            const g = new THREE.Group();
            g.name = 'tail' + i;
            g.position.set(0, -0.15 * px, -3.6 * px);
            const extra = src.clone();
            extra.name = 'tailSeg' + i;
            extra.scale.set(1 - i * 0.12, 1 - i * 0.12, 0.28);
            extra.position.set(0, 0, -1.2 * px);
            g.add(extra);
            parent.add(g);
            joints.tail.push(g);
            parent = g;
        }
    }

    function collectLegs(nodes, joints) {
        ['legFL', 'legFR', 'legBL', 'legBR'].forEach(function (name) {
            const mesh = nodes[name];
            if (mesh && mesh.parent) joints.legs.push(mesh.parent);
        });
    }

    function attach(THREE, root) {
        if (!THREE || !root || !root.userData) return null;
        const nodes = root.userData.sculptRuntime && root.userData.sculptRuntime.nodes;
        if (!nodes) return null;
        const joints = {
            neck: [],
            jaw: nodes.jaw || null,
            wingL: null,
            wingR: null,
            tail: [],
            legs: []
        };
        chainNeck(THREE, root, nodes, joints);
        splitWing(THREE, nodes, 'L', joints);
        splitWing(THREE, nodes, 'R', joints);
        chainTail(THREE, root, nodes, joints);
        collectLegs(nodes, joints);
        root.userData.dragonJoints = joints;
        root.userData.dragonBaseY = root.position ? root.position.y || 0 : 0;
        root.userData.tick = function (t, moving) {
            applyPose(joints, pose(t, moving));
            if (root.position) {
                root.position.y = (root.userData.dragonBaseY || 0) + 0.06 + Math.sin((Number(t) || 0) * 2) * 0.03;
            }
        };
        return joints;
    }

    global.BlockLegendDragonRig = {
        NECK: NECK,
        WING: WING,
        TAIL: TAIL,
        pose: pose,
        applyPose: applyPose,
        attach: attach
    };
}(typeof window !== 'undefined' ? window : globalThis));
