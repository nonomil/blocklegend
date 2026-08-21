/**
 * 紫金学园龙 · 纯 Three.js（2026-08-21--生成龙.md）。
 * CatmullRom 变半径身/颈/尾 + Shape 翅膜 + 金骨 + 组合头。
 */
(function (global) {
    'use strict';

    const SPEC = {
        form: 'organic',
        skin: 'loft',
        spineMeshes: 1,
        material: 'physical',
        scaleTexture: true,
        wingVeins: 5,
        headParts: ['skull', 'snout', 'jaw', 'horn'],
        chestRadius: 0.26,
        waistRadius: 0.11,
        hipRadius: 0.22,
        body: { length: 0.7, height: 0.28, radius: 0.2 },
        neck: { length: 1.16, radius: 0.068 },
        tail: { length: 1.92, radius: 0.075 },
        wing: { span: 2.9, zBend: 0.62 },
        joints: { neck: 3, wing: 2, tail: 5 },
        palette: {
            scale: 0x6a3b8a,
            gold: 0xd4a843,
            highlight: 0xf0e68c,
            shadow: 0x3a1c4a
        }
    };

    const FIT = 0.24;

    function phys(THREE, opts) {
        if (THREE.MeshPhysicalMaterial) return new THREE.MeshPhysicalMaterial(opts);
        return new THREE.MeshLambertMaterial({
            color: opts.color,
            map: opts.map || null,
            emissive: opts.emissive || 0x000000,
            transparent: !!opts.transparent,
            opacity: opts.opacity == null ? 1 : opts.opacity,
            side: opts.side
        });
    }

    function makeScaleTexture(THREE) {
        if (!SPEC.scaleTexture || typeof document === 'undefined' || !document.createElement) return null;
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.fillStyle = '#3a1c4a';
        ctx.fillRect(0, 0, 256, 256);
        const colors = ['#6A3B8A', '#5A2B7A', '#7A4B9A'];
        for (let row = 0; row < 20; row += 1) {
            for (let col = 0; col < 20; col += 1) {
                const x = col * 13 + (row % 2) * 6.5;
                const y = row * 13;
                ctx.fillStyle = colors[(row + col) % 3];
                ctx.beginPath();
                for (let i = 0; i < 6; i += 1) {
                    const angle = Math.PI / 3 * i + Math.PI / 6;
                    const px = x + 6 * Math.cos(angle);
                    const py = y + 6 * Math.sin(angle);
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#D4A843';
                ctx.lineWidth = 0.3;
                ctx.stroke();
            }
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(4, 6);
        tex.needsUpdate = true;
        return tex;
    }

    function mats(THREE) {
        const scaleMap = makeScaleTexture(THREE);
        return {
            scale: phys(THREE, {
                color: scaleMap ? 0xc8b4d8 : SPEC.palette.scale,
                map: scaleMap,
                roughness: 0.3,
                metalness: 0.1,
                clearcoat: 0.25,
                clearcoatRoughness: 0.3,
                emissive: 0x2a1b4a,
                emissiveIntensity: 0.15
            }),
            gold: phys(THREE, {
                color: SPEC.palette.gold,
                roughness: 0.25,
                metalness: 0.7,
                emissive: 0x8a6a20,
                emissiveIntensity: 0.15
            }),
            membrane: phys(THREE, {
                color: 0x8a5baa,
                roughness: 0.4,
                metalness: 0,
                transparent: true,
                opacity: 0.75,
                side: THREE.DoubleSide,
                clearcoat: 0.1,
                depthWrite: false
            }),
            horn: phys(THREE, { color: 0x3a2a1a, roughness: 0.6, metalness: 0 }),
            deep: phys(THREE, { color: SPEC.palette.shadow, roughness: 1 }),
            eye: phys(THREE, {
                color: SPEC.palette.highlight,
                emissive: SPEC.palette.gold,
                emissiveIntensity: 0.8,
                roughness: 0.1
            })
        };
    }

    function radiusFn(t, start, end, bulge) {
        const mid = start + (end - start) * t;
        return Math.max(0.03, mid + (bulge || 0) * Math.sin(t * Math.PI));
    }

    function loftCurve(THREE, points, segments, rings, radiusAt) {
        const curve = new THREE.CatmullRomCurve3(points);
        const pos = [];
        const uv = [];
        const up0 = new THREE.Vector3(0, 1, 0);
        const hint = new THREE.Vector3(1, 0, 0);
        for (let i = 0; i <= segments; i += 1) {
            const t = i / segments;
            const p = curve.getPoint(t);
            const tan = curve.getTangent(t).normalize();
            let right = new THREE.Vector3().crossVectors(tan, up0);
            if (right.lengthSq() < 1e-6) right.crossVectors(tan, hint);
            right.normalize();
            const localUp = new THREE.Vector3().crossVectors(right, tan).normalize();
            const r = radiusAt(t);
            for (let j = 0; j < rings; j += 1) {
                const a = (j / rings) * Math.PI * 2;
                const c = Math.cos(a);
                const s = Math.sin(a);
                pos.push(
                    p.x + right.x * c * r + localUp.x * s * r,
                    p.y + right.y * c * r + localUp.y * s * r,
                    p.z + right.z * c * r + localUp.z * s * r
                );
                uv.push(t * 3, j / rings);
            }
        }
        const index = [];
        for (let i = 0; i < segments; i += 1) {
            for (let j = 0; j < rings; j += 1) {
                const a = i * rings + j;
                const b = i * rings + ((j + 1) % rings);
                const c = (i + 1) * rings + j;
                const d = (i + 1) * rings + ((j + 1) % rings);
                index.push(a, c, b, b, c, d);
            }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        geo.setIndex(index);
        geo.computeVertexNormals();
        return { geo: geo, curve: curve };
    }

    function makeHead(THREE, M) {
        const head = new THREE.Group();
        head.name = 'head';
        const skull = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), M.scale);
        skull.name = 'skull';
        skull.scale.set(1, 0.8, 1.3);
        skull.position.set(0, 0.1, 0);
        const snout = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 6), M.scale);
        snout.name = 'snout';
        snout.rotation.x = Math.PI / 2 - 0.3;
        snout.position.set(0, -0.05, 0.5);
        const upperJaw = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.3), M.scale);
        upperJaw.position.set(0, -0.05, 0.65);
        const jaw = new THREE.Group();
        jaw.name = 'jaw';
        const jawMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.35), M.scale);
        jawMesh.position.set(0, -0.2, 0.45);
        jaw.add(jawMesh);
        [-1, 1].forEach(function (side) {
            const socket = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), M.deep);
            socket.position.set(side * 0.18, 0.08, 0.22);
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), M.eye);
            eye.position.set(side * 0.18, 0.08, 0.25);
            head.add(socket);
            head.add(eye);
            const horn = new THREE.Group();
            horn.name = 'horn';
            const s1 = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.2, 5), M.horn);
            s1.position.set(0, 0.2, -0.05);
            s1.rotation.z = side * 0.3;
            const s2 = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.25, 5), M.horn);
            s2.position.set(side * 0.06, 0.4, -0.08);
            s2.rotation.set(-0.2, 0, side * 0.5);
            const s3 = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.2, 5), M.gold);
            s3.position.set(side * 0.1, 0.58, -0.1);
            s3.rotation.set(-0.4, 0, side * 0.7);
            horn.add(s1);
            horn.add(s2);
            horn.add(s3);
            horn.position.set(side * 0.22, 0.2, 0.15);
            head.add(horn);
        });
        head.add(skull);
        head.add(snout);
        head.add(upperJaw);
        head.add(jaw);
        head.userData.jaw = jaw;
        return head;
    }

    function makeWing(THREE, sign, M) {
        const shoulder = new THREE.Group();
        shoulder.name = sign < 0 ? 'wingL' : 'wingR';
        const membrane = new THREE.Group();
        membrane.name = shoulder.name + 'Mem';
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.quadraticCurveTo(1.2, 1.5, 3.5, 1.2);
        shape.quadraticCurveTo(4.0, 0.5, 3.8, -0.5);
        shape.quadraticCurveTo(3.0, -1.2, 1.5, -1.5);
        shape.quadraticCurveTo(0.5, -0.8, 0, 0);
        const wingGeo = new THREE.ShapeGeometry(shape, 18);
        const pos = wingGeo.attributes.position;
        for (let i = 0; i < pos.count; i += 1) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const t = (x + 0.5) / 4;
            const zBend = SPEC.wing.zBend * 0.4 * Math.sin(Math.max(0, Math.min(1, t)) * Math.PI) * (1 - Math.abs(y) * 0.3);
            pos.setX(i, sign * x);
            pos.setY(i, y);
            pos.setZ(i, zBend + 0.05);
        }
        pos.needsUpdate = true;
        wingGeo.computeVertexNormals();
        const sail = new THREE.Mesh(wingGeo, M.membrane);
        sail.rotation.x = -0.1;
        sail.rotation.z = sign * 0.2;
        membrane.add(sail);
        const veins = [
            [[0, 0, 0], [1.0, 1.0, 0.15], [2.2, 1.3, 0.25], [3.5, 0.9, 0.2]],
            [[0, 0, 0], [0.8, -0.9, 0.1], [1.8, -1.4, 0.18], [2.8, -1.0, 0.15]],
            [[0, 0, 0], [1.1, 0.2, 0.12], [2.4, 0.15, 0.2], [3.2, 0.05, 0.16]],
            [[0, 0, 0], [0.7, 0.7, 0.08], [1.6, 0.85, 0.14], [2.4, 0.55, 0.12]],
            [[0, 0, 0], [0.55, -0.45, 0.06], [1.3, -0.7, 0.1], [2.0, -0.55, 0.08]]
        ].slice(0, SPEC.wingVeins);
        veins.forEach(function (raw) {
            const curve = new THREE.CatmullRomCurve3(raw.map(function (p) {
                return new THREE.Vector3(sign * p[0], p[1], p[2]);
            }));
            membrane.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.022, 4, false), M.gold));
        });
        shoulder.add(membrane);
        return { shoulder: shoulder, membrane: membrane };
    }

    function dummyChain(count, name) {
        const out = [];
        let parent = null;
        for (let i = 0; i < count; i += 1) {
            const g = new THREE.Group();
            g.name = name + i;
            if (parent) parent.add(g);
            out.push(g);
            parent = g;
        }
        return out;
    }

    function create(THREE, options) {
        const hideShield = options && options.hideShield;
        const M = mats(THREE);
        const root = new THREE.Group();
        root.name = 'dragon';
        root.userData.form = SPEC.form;
        root.userData.skin = SPEC.skin;
        const inner = new THREE.Group();
        inner.name = 'dragonInner';

        const bodyPts = [
            new THREE.Vector3(0, 0.2, 0),
            new THREE.Vector3(0, -0.1, 0.8),
            new THREE.Vector3(0, -0.4, 2.0),
            new THREE.Vector3(0, -0.3, 3.6),
            new THREE.Vector3(0, 0.0, 5.2),
            new THREE.Vector3(0, 0.3, 6.8),
            new THREE.Vector3(0, 0.4, 8.0)
        ];
        const bodyLoft = loftCurve(THREE, bodyPts, 48, 12, function (t) {
            return Math.max(0.03, 0.15 + 0.55 * Math.sin(t * Math.PI) * (1 - 0.2 * Math.pow(t - 0.5, 2)));
        });
        const body = new THREE.Mesh(bodyLoft.geo, M.scale);
        body.name = 'body';
        body.position.set(0, 0, -4);
        inner.add(body);

        const neckPts = [
            new THREE.Vector3(0, 0.3, 0.2),
            new THREE.Vector3(0, 1.0, 0.8),
            new THREE.Vector3(0, 1.8, 1.4),
            new THREE.Vector3(0, 2.2, 2.2),
            new THREE.Vector3(0, 2.0, 3.0),
            new THREE.Vector3(0, 1.4, 3.6)
        ];
        const neckLoft = loftCurve(THREE, neckPts, 24, 8, function (t) {
            return radiusFn(t, 0.32, 0.18, 0);
        });
        const neckMesh = new THREE.Mesh(neckLoft.geo, M.scale);
        neckMesh.position.set(0, 0, -4);
        inner.add(neckMesh);

        const head = makeHead(THREE, M);
        head.position.set(0, 1.4, -0.6);
        inner.add(head);

        const wingL = makeWing(THREE, 1, M);
        const wingR = makeWing(THREE, -1, M);
        wingL.shoulder.position.set(0.25, 0.3, -2.2);
        wingR.shoulder.position.set(-0.25, 0.3, -2.2);
        inner.add(wingL.shoulder);
        inner.add(wingR.shoulder);

        const tailPts = [
            new THREE.Vector3(0, 0.3, 8.0),
            new THREE.Vector3(0, 0.6, 9.5),
            new THREE.Vector3(0, 0.8, 11.0),
            new THREE.Vector3(0, 0.5, 12.5),
            new THREE.Vector3(0, 0.1, 13.5)
        ];
        const tailRoot = new THREE.Group();
        tailRoot.name = 'tail0';
        const tailLoft = loftCurve(THREE, tailPts, 28, 8, function (t) {
            return radiusFn(t, 0.35, 0.04, 0);
        });
        const tailMesh = new THREE.Mesh(tailLoft.geo, M.scale);
        tailMesh.position.set(0, 0, -4);
        tailRoot.add(tailMesh);
        const tailSpike = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.2, 4), M.horn);
        tailSpike.position.set(0, 0.1, 9.8);
        tailRoot.add(tailSpike);
        inner.add(tailRoot);

        [
            { x: 0.35, z: -2.0 },
            { x: -0.35, z: -2.0 },
            { x: 0.4, z: 4.0 },
            { x: -0.4, z: 4.0 }
        ].forEach(function (lp) {
            const hip = new THREE.Group();
            const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.5, 6), M.scale);
            upper.position.y = -0.25;
            upper.rotation.x = 0.2;
            const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.4, 6), M.scale);
            lower.position.set(0, -0.55, 0.05);
            lower.rotation.x = -0.1;
            hip.add(upper);
            hip.add(lower);
            [-1, 1].forEach(function (clawSide) {
                const claw = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 4), M.horn);
                claw.position.set(clawSide * 0.06, -0.75, 0.08);
                claw.rotation.x = 0.3;
                claw.rotation.z = clawSide * 0.2;
                hip.add(claw);
            });
            hip.position.set(lp.x, -0.2, lp.z - 4);
            inner.add(hip);
        });

        for (let i = 0; i < 8; i += 1) {
            const t = 0.1 + i * 0.1;
            const pt = bodyLoft.curve.getPoint(t);
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 4), M.gold);
            spike.position.set(pt.x, pt.y + 0.15, pt.z - 4);
            spike.rotation.x = -0.2;
            inner.add(spike);
        }

        inner.scale.setScalar(FIT);
        inner.position.y = 0.72;
        root.add(inner);

        const joints = {
            neck: dummyChain(SPEC.joints.neck, 'neck'),
            jaw: head.userData.jaw,
            wingL: wingL,
            wingR: wingR,
            tail: dummyChain(SPEC.joints.tail, 'tail'),
            legs: []
        };
        inner.add(joints.neck[0]);
        tailRoot.add(joints.tail[0]);

        if (!hideShield) {
            const shield = new THREE.Mesh(
                new THREE.SphereGeometry(1.3, 12, 8),
                new THREE.MeshLambertMaterial({
                    color: SPEC.palette.scale,
                    transparent: true,
                    opacity: 0.07,
                    depthWrite: false
                })
            );
            shield.position.y = 0.8;
            shield.name = 'boss-shield';
            root.add(shield);
            root.userData.sculptRuntime = { nodes: { head: head, body: body, wings: [wingL.shoulder, wingR.shoulder], shield: shield } };
        } else {
            root.userData.sculptRuntime = { nodes: { head: head, body: body, wings: [wingL.shoulder, wingR.shoulder] } };
        }

        root.userData.dragonJoints = joints;
        root.userData.dragonBaseY = 0;
        root.userData.tick = function (t, moving) {
            const Rig = global.BlockLegendDragonRig;
            const time = Number(t) || 0;
            const pose = Rig && Rig.pose ? Rig.pose(time, moving) : null;
            if (pose) {
                if (joints.jaw && joints.jaw.rotation) joints.jaw.rotation.x = pose.jaw;
                head.rotation.x = (pose.neck[2] ? pose.neck[2].pitch : 0) * 0.8;
                head.rotation.y = pose.neck[0].yaw * 1.6;
                tailRoot.rotation.y = pose.tail[0].yaw * 1.8;
                tailRoot.rotation.x = pose.tail[1] ? pose.tail[1].pitch : 0;
                ['wingL', 'wingR'].forEach(function (side) {
                    const w = joints[side];
                    const p = pose[side];
                    if (!w || !p) return;
                    w.shoulder.rotation.z = p.shoulderZ * 0.85;
                    w.shoulder.rotation.x = p.x * 1.15;
                    if (w.membrane) w.membrane.rotation.z = p.membraneZ * 0.45;
                });
            }
            root.position.y = (root.userData.dragonBaseY || 0) + 0.03 + Math.sin(time * 1.5) * 0.02;
        };
        return root;
    }

    global.BlockLegendAcademyDragon = {
        form: SPEC.form,
        skin: SPEC.skin,
        spineMeshes: SPEC.spineMeshes,
        material: SPEC.material,
        scaleTexture: SPEC.scaleTexture,
        wingVeins: SPEC.wingVeins,
        headParts: SPEC.headParts,
        chestRadius: SPEC.chestRadius,
        waistRadius: SPEC.waistRadius,
        hipRadius: SPEC.hipRadius,
        body: SPEC.body,
        neck: SPEC.neck,
        tail: SPEC.tail,
        wing: SPEC.wing,
        joints: SPEC.joints,
        palette: SPEC.palette,
        create: create
    };
}(typeof window !== 'undefined' ? window : globalThis));
