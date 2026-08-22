/**
 * 约 2000 个体素先铺满，再抽外表面、焊点、Laplacian 整网平滑。
 * 不逐盒倒圆角。翅左右分开，才能振翅。
 */
(function (global) {
    'use strict';

    var DIRS = [
        { d: [1, 0, 0], corners: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
        { d: [-1, 0, 0], corners: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]] },
        { d: [0, 1, 0], corners: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]] },
        { d: [0, -1, 0], corners: [[0, 0, 1], [0, 0, 0], [1, 0, 0], [1, 0, 1]] },
        { d: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
        { d: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] }
    ];

    function key3(i, j, k) {
        return i + ',' + j + ',' + k;
    }

    function buildGroupMesh(THREE, pack, groupName, px, smoothIters) {
        var cell = pack.cell;
        var ox = pack.origin[0];
        var oy = pack.origin[1];
        var oz = pack.origin[2];
        var filled = {};
        var colors = {};
        pack.cells.forEach(function (c) {
            if (c[3] !== groupName) return;
            var k = key3(c[0], c[1], c[2]);
            filled[k] = true;
            colors[k] = [c[4] / 255, c[5] / 255, c[6] / 255];
        });
        var vertIndex = {};
        var positions = [];
        var colorAttr = [];
        var indices = [];

        function vert(i, j, k, cr, cg, cb) {
            var id = key3(i, j, k);
            if (vertIndex[id] != null) return vertIndex[id];
            var idx = positions.length / 3;
            vertIndex[id] = idx;
            positions.push(
                (ox + i * cell - cell * 0.5) * px,
                (oy + j * cell - cell * 0.5) * px,
                (oz + k * cell - cell * 0.5) * px
            );
            colorAttr.push(cr, cg, cb);
            return idx;
        }

        Object.keys(filled).forEach(function (fk) {
            var p = fk.split(',');
            var i = +p[0];
            var j = +p[1];
            var k = +p[2];
            var rgb = colors[fk];
            DIRS.forEach(function (face) {
                var ni = i + face.d[0];
                var nj = j + face.d[1];
                var nk = k + face.d[2];
                if (filled[key3(ni, nj, nk)]) return;
                var a = vert(i + face.corners[0][0], j + face.corners[0][1], k + face.corners[0][2], rgb[0], rgb[1], rgb[2]);
                var b = vert(i + face.corners[1][0], j + face.corners[1][1], k + face.corners[1][2], rgb[0], rgb[1], rgb[2]);
                var c = vert(i + face.corners[2][0], j + face.corners[2][1], k + face.corners[2][2], rgb[0], rgb[1], rgb[2]);
                var d = vert(i + face.corners[3][0], j + face.corners[3][1], k + face.corners[3][2], rgb[0], rgb[1], rgb[2]);
                indices.push(a, b, c, a, c, d);
            });
        });

        if (!positions.length) return null;

        var adj = [];
        var vcount = positions.length / 3;
        for (var v = 0; v < vcount; v += 1) adj[v] = {};
        for (var t = 0; t < indices.length; t += 3) {
            var a = indices[t];
            var b = indices[t + 1];
            var c = indices[t + 2];
            adj[a][b] = 1;
            adj[a][c] = 1;
            adj[b][a] = 1;
            adj[b][c] = 1;
            adj[c][a] = 1;
            adj[c][b] = 1;
        }

        var src = positions.slice();
        var dst = positions.slice();
        var iters = smoothIters == null ? 7 : smoothIters;
        for (var it = 0; it < iters; it += 1) {
            for (var vi = 0; vi < vcount; vi += 1) {
                var nbrs = Object.keys(adj[vi]);
                if (!nbrs.length) continue;
                var ax = 0;
                var ay = 0;
                var az = 0;
                for (var n = 0; n < nbrs.length; n += 1) {
                    var ni2 = +nbrs[n];
                    ax += src[ni2 * 3];
                    ay += src[ni2 * 3 + 1];
                    az += src[ni2 * 3 + 2];
                }
                ax /= nbrs.length;
                ay /= nbrs.length;
                az /= nbrs.length;
                dst[vi * 3] = src[vi * 3] * 0.42 + ax * 0.58;
                dst[vi * 3 + 1] = src[vi * 3 + 1] * 0.42 + ay * 0.58;
                dst[vi * 3 + 2] = src[vi * 3 + 2] * 0.42 + az * 0.58;
            }
            var tmp = src;
            src = dst;
            dst = tmp;
        }
        positions = src;

        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colorAttr, 3));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        var mat = new THREE.MeshLambertMaterial({ vertexColors: THREE.VertexColors, side: THREE.DoubleSide });
        if ('vertexColors' in mat && THREE.VertexColors == null) mat.vertexColors = true;
        return new THREE.Mesh(geo, mat);
    }

    function centroid(mesh) {
        mesh.geometry.computeBoundingBox();
        var c = new THREE.Vector3();
        mesh.geometry.boundingBox.getCenter(c);
        return c;
    }

    function create(THREE, options) {
        var pack = global.BlockLegendDragonVoxels;
        if (!THREE || !pack || !pack.cells) return null;
        var opts = options || {};
        var px = opts.pixel || 1 / 16;
        var root = new THREE.Group();
        root.name = 'dragon';

        var body = buildGroupMesh(THREE, pack, 'body', px, 5);
        if (body) {
            body.name = 'body';
            root.add(body);
        }

        var wings = [];
        ['L', 'R'].forEach(function (side) {
            var mesh = buildGroupMesh(THREE, pack, 'wing' + side, px, 4);
            if (!mesh) return;
            mesh.name = 'wing' + side;
            var piv = new THREE.Group();
            piv.name = 'wing' + side + 'Pivot';
            var mid = centroid(mesh);
            var isL = side === 'L';
            var innerX = isL ? mesh.geometry.boundingBox.max.x : mesh.geometry.boundingBox.min.x;
            piv.position.set(innerX, mid.y, mid.z);
            mesh.position.sub(piv.position);
            piv.add(mesh);
            root.add(piv);
            wings.push({ pivot: piv, sign: isL ? 1 : -1 });
        });

        root.userData.rideScale = 1.62;
        root.userData.sculptRuntime = { nodes: { body: body, wingL: wings[0] && wings[0].pivot.children[0], wingR: wings[1] && wings[1].pivot.children[0] } };
        root.userData.tick = function (t, moving) {
            var flapFn = global.BlockLegendFx && global.BlockLegendFx.wingFlap;
            var flap = flapFn ? flapFn(t, moving) : Math.sin(t * (moving ? 6.2 : 2.2)) * (moving ? 0.72 : 0.1);
            wings.forEach(function (w) {
                w.pivot.rotation.z = flap * w.sign;
                w.pivot.rotation.x = flap * 0.16;
            });
        };
        return root;
    }

    global.BlockLegendSmoothVoxelDragon = {
        create: create,
        voxelCount: function () {
            return global.BlockLegendDragonVoxels && global.BlockLegendDragonVoxels.count;
        }
    };
}(typeof window !== 'undefined' ? window : globalThis));
