/**
 * Three r147 本地圆角盒。算法对齐 three/addons RoundedBoxGeometry：
 * 分段盒子的角点推到圆角球面上，棱变软，不是管子也不是碎体素。
 */
(function (global) {
    'use strict';

    function create(THREE, width, height, depth, segments, radius) {
        var segs = Math.max(1, (segments || 2) * 2 + 1);
        var r = Math.min(width / 2, height / 2, depth / 2, radius || 0.1);
        var geo = new THREE.BoxGeometry(1, 1, 1, segs, segs, segs);
        if (segs === 1) {
            geo.scale(width, height, depth);
            return geo;
        }
        var flat = geo.toNonIndexed();
        geo.dispose();
        var pos = flat.attributes.position;
        var nrm = flat.attributes.normal;
        var box = new THREE.Vector3(width, height, depth).multiplyScalar(0.5).subScalar(r);
        var p = new THREE.Vector3();
        var n = new THREE.Vector3();
        var half = 0.5 / segs;
        for (var i = 0; i < pos.count; i += 1) {
            p.fromBufferAttribute(pos, i);
            n.copy(p);
            n.x -= Math.sign(n.x) * half;
            n.y -= Math.sign(n.y) * half;
            n.z -= Math.sign(n.z) * half;
            n.normalize();
            pos.setXYZ(i, box.x * Math.sign(p.x) + n.x * r, box.y * Math.sign(p.y) + n.y * r, box.z * Math.sign(p.z) + n.z * r);
            nrm.setXYZ(i, n.x, n.y, n.z);
        }
        pos.needsUpdate = true;
        nrm.needsUpdate = true;
        flat.computeVertexNormals();
        return flat;
    }

    function tint(name) {
        if (/belly|chest|jaw|horn|Bone|toe|ridge/i.test(name)) return 0xd4a843;
        if (/^leg/.test(name)) return 0x3a1c4a;
        return 0x6a3b8a;
    }

    global.BlockLegendRoundedBox = { create: create, tint: tint };
}(typeof window !== 'undefined' ? window : globalThis));
