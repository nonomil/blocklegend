/**
 * BlockLegend four-view atlas model builder.
 * Consumes atlases produced by tools/fourview-to-atlas.py: every box face
 * gets its UVs from pixels mechanically cropped out of the approved
 * four-view sheet. No hand-painted or procedural noise textures.
 */
(function (global) {
    'use strict';

    // BoxGeometry face order: px, nx, py, ny, pz, nz (4 uv verts each)
    var FACE_ORDER = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];

    function setFaceUv(geo, faceIndex, rect, atlasW, atlasH) {
        var u0 = rect[0] / atlasW;
        var v1 = 1 - rect[1] / atlasH;
        var u1 = (rect[0] + rect[2]) / atlasW;
        var v0 = 1 - (rect[1] + rect[3]) / atlasH;
        var uv = geo.attributes.uv;
        var o = faceIndex * 4;
        uv.setXY(o, u0, v1);
        uv.setXY(o + 1, u1, v1);
        uv.setXY(o + 2, u0, v0);
        uv.setXY(o + 3, u1, v0);
        uv.needsUpdate = true;
    }

    var texCache = {};

    function atlasTexture(THREE, url) {
        if (!texCache[url]) {
            var tex = new THREE.TextureLoader().load(url);
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            tex.generateMipmaps = false;
            if ('colorSpace' in tex && THREE.SRGBColorSpace) {
                tex.colorSpace = THREE.SRGBColorSpace;
            }
            texCache[url] = tex;
        }
        return texCache[url];
    }

    function build(THREE, id, options) {
        var data = global.BlockLegendAtlas4V && global.BlockLegendAtlas4V[id];
        if (!data) { return null; }
        var opts = options || {};
        var px = opts.pixel || 1 / 16;
        var base = opts.basePath || 'assets/atlas4v/';
        var tex = atlasTexture(THREE, base + data.texture + (opts.texQuery || ''));

        var root = new THREE.Group();
        root.name = id;
        var nodes = {};
        var swingers = [];

        data.parts.forEach(function (part) {
            var w = part.size[0] * px;
            var h = part.size[1] * px;
            var d = part.size[2] * px;
            var geo = new THREE.BoxGeometry(w, h, d);
            FACE_ORDER.forEach(function (face, fi) {
                setFaceUv(geo, fi, part.faces[face], data.size[0], data.size[1]);
            });
            var matOpts = { map: tex };
            if (opts.emissive && part.name.indexOf(opts.emissive.match) === 0) {
                matOpts.emissive = opts.emissive.color;
            }
            var mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial(matOpts));
            mesh.name = part.name;
            nodes[part.name] = mesh;

            var isLimb = /^(leg|arm)[LR]$/.test(part.name) || /^leg[FMHB][LR]$/.test(part.name);
            var isWing = /^wing[LR]$/.test(part.name);
            var swingArms = opts.swingArms !== false;
            if (isLimb && (part.name.charAt(0) === 'l' || swingArms)) {
                var pivot = new THREE.Group();
                pivot.name = part.name + 'Pivot';
                pivot.position.set(part.pos[0] * px, (part.pos[1] + part.size[1] / 2) * px, part.pos[2] * px);
                mesh.position.set(0, -h / 2, 0);
                pivot.add(mesh);
                root.add(pivot);
                var slot = part.name.charAt(3);
                var isBack = slot === 'B' || slot === 'H';
                var sideSign = part.name.slice(-1) === 'L' ? 1 : -1;
                swingers.push({ pivot: pivot, sign: sideSign * (isBack ? -1 : 1), arm: part.name.charAt(0) === 'a' });
            } else if (isWing) {
                var wPivot = new THREE.Group();
                wPivot.name = part.name + 'Pivot';
                var isLeftWing = part.name.slice(-1) === 'L';
                wPivot.position.set((part.pos[0] + (isLeftWing ? w / 2 : -w / 2)) * px, (part.pos[1] + part.size[1] / 2) * px, part.pos[2] * px);
                mesh.position.set(isLeftWing ? -w / 2 * px : w / 2 * px, -h / 2, 0);
                wPivot.add(mesh);
                root.add(wPivot);
                swingers.push({ pivot: wPivot, sign: isLeftWing ? 1 : -1, wing: true });
            } else {
                mesh.position.set(part.pos[0] * px, part.pos[1] * px, part.pos[2] * px);
                root.add(mesh);
            }
        });

        root.userData.sculptRuntime = { nodes: nodes };
        root.userData.tick = function (t, moving) {
            var s = Math.sin(t * (moving ? 6.0 : 1.8)) * (moving ? 0.35 : 0.05);
            var flap = Math.sin(t * (moving ? 12.0 : 3.0)) * (moving ? 0.4 : 0.08);
            swingers.forEach(function (sw) {
                if (sw.wing) {
                    sw.pivot.rotation.z = flap * sw.sign;
                } else {
                    sw.pivot.rotation.x = s * sw.sign * (sw.arm ? 0.4 : 1);
                }
            });
        };
        return root;
    }

    global.BlockLegendFourView = { build: build };
}(typeof window !== 'undefined' ? window : globalThis));
