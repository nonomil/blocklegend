/**
 * 静态龙 GLB 本地绑骨（鸟翼式）：不改文件，运行时造骨架。
 * 模型 = academy-dragon-rig.glb（dragon-3 减面版，翅膀静止姿势已向两侧平展）。
 * 原始朝向：头 +x、翅 ±z；rig 时先绕 Y 转 +90°，得到头 -z、翅 ±x 的标准空间。
 * 动作：翅膀绕肩上下扇（不做开合，静止姿势已张开），翅尖滞后；
 * 脖颈前后点头 + 头自身小幅点头；尾巴左右摆、尾尖滞后。
 * 标准空间尺寸：翅展 x ±0.56，高 y 0~0.64，头前 z≈-0.19、尾后 z≈+0.40。
 */
(function (global) {
    'use strict';

    const CFG = {
        wingStartX: 0.13,
        wingRampX: 0.10,
        tipStartX: 0.30,
        tipRampX: 0.15,
        gateStartY: 0.28,
        gateRampY: 0.10,
        neckZ: -0.05,
        neckRampZ: 0.06,
        neckStartY: 0.35,
        neckRampY: 0.12,
        headStartY: 0.48,
        headRampY: 0.10,
        tailStartZ: 0.14,
        tailRampZ: 0.10,
        tailTipZ: 0.27,
        tailTipRamp: 0.12
    };

    function clamp01(v) {
        return v < 0 ? 0 : v > 1 ? 1 : v;
    }

    /** 把飞行姿态叠到翅/颈/头/尾，纯函数便于测试。 */
    function applyFlightPose(wave, lag, nod, pose) {
        const p = pose || {};
        const bank = Number(p.bank) || 0;
        const pitch = Number(p.pitch) || 0;
        const breath = Number(p.breath) || 0;
        return {
            wingLZ: -wave * 0.75 + bank * 0.18,
            wingRZ: wave * 0.75 + bank * 0.18,
            wingLTipZ: -lag * 0.45,
            wingRTipZ: lag * 0.45,
            neckX: nod + pitch * 0.9 - breath * 0.22,
            headX: -nod * 0.45 + pitch * 0.45 - breath * 0.28,
            tailX: -pitch * 0.4,
            tailY: bank * 0.32
        };
    }

    /**
     * 单顶点骨骼权重（标准空间），纯函数便于测试。
     * 索引：0躯干 1左翅 2左翅尖 3右翅 4右翅尖 5脖颈 6头 7尾 8尾尖
     */
    function weightsFor(x, y, z) {
        const zz = z || 0;
        const ax = Math.abs(x);
        const front = clamp01((CFG.neckZ - zz) / CFG.neckRampZ);
        // 前上中央 = 脖颈+头，独占；|x| 大于 0.16 一定不是脖子
        const neckAmt = clamp01((y - CFG.neckStartY) / CFG.neckRampY)
            * front
            * clamp01((0.16 - ax) / 0.08);
        if (neckAmt > 0) {
            const headT = clamp01((y - CFG.headStartY) / CFG.headRampY);
            return {
                indices: [0, 5, 6, 0],
                weights: [1 - neckAmt, neckAmt * (1 - headT), neckAmt * headT, 0]
            };
        }
        // 后方中央 = 尾巴：z 越大权重越高，翼面（|x| 大）不吃尾骨
        const tailAmt = clamp01((zz - CFG.tailStartZ) / CFG.tailRampZ)
            * clamp01((0.16 - ax) / 0.08);
        if (tailAmt > 0) {
            const tipT = clamp01((zz - CFG.tailTipZ) / CFG.tailTipRamp);
            return {
                indices: [0, 7, 8, 0],
                weights: [1 - tailAmt, tailAmt * (1 - tipT), tailAmt * tipT, 0]
            };
        }
        const wing = clamp01((ax - CFG.wingStartX) / CFG.wingRampX);
        const gate = clamp01((y - CFG.gateStartY) / CFG.gateRampY);
        // 靠前且偏中央的过渡带（脖侧）压掉翅骨影响；|x|>0.22 的翅前缘不受限
        const frontGuard = 1 - front * clamp01((0.22 - ax) / 0.10);
        const w = wing * gate * frontGuard;
        const tip = clamp01((ax - CFG.tipStartX) / CFG.tipRampX);
        const main = x < 0 ? 1 : 3;
        return {
            indices: [0, main, main + 1, 0],
            weights: [1 - w, w * (1 - tip), w * tip, 0]
        };
    }

    function findMesh(root) {
        let found = null;
        root.traverse(function (o) {
            if (!found && (o.isMesh || o.isSkinnedMesh) && o.geometry) found = o;
        });
        return found;
    }

    /** 把静态 GLB 场景转成带骨 SkinnedMesh，返回新 Group；失败返回 null。 */
    function rig(THREE, root) {
        if (!THREE || !THREE.SkinnedMesh || !THREE.Bone || !root) return null;
        const mesh = findMesh(root);
        if (!mesh) return null;
        root.updateMatrixWorld(true);
        const geo = mesh.geometry.clone();
        geo.applyMatrix4(mesh.matrixWorld);
        // 头 +x → 头 -z：翅膀落到 ±x 两侧
        geo.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI / 2));

        const pos = geo.attributes.position;
        const n = pos.count;
        const skinIndex = new Uint16Array(n * 4);
        const skinWeight = new Float32Array(n * 4);
        for (let i = 0; i < n; i += 1) {
            const r = weightsFor(pos.getX(i), pos.getY(i), pos.getZ(i));
            for (let k = 0; k < 4; k += 1) {
                skinIndex[i * 4 + k] = r.indices[k];
                skinWeight[i * 4 + k] = r.weights[k];
            }
        }
        geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndex, 4));
        geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeight, 4));

        const rootBone = new THREE.Bone();
        rootBone.position.set(0, 0.30, 0);
        const wingL = new THREE.Bone();
        wingL.position.set(-0.14, 0.18, 0);
        const wingLTip = new THREE.Bone();
        wingLTip.position.set(-0.16, 0.02, 0);
        const wingR = new THREE.Bone();
        wingR.position.set(0.14, 0.18, 0);
        const wingRTip = new THREE.Bone();
        wingRTip.position.set(0.16, 0.02, 0);
        const neck = new THREE.Bone();
        neck.position.set(0, 0.12, -0.08);
        const head = new THREE.Bone();
        head.position.set(0, 0.13, -0.06);
        const tail = new THREE.Bone();
        tail.position.set(0, 0, 0.16);
        const tailTip = new THREE.Bone();
        tailTip.position.set(0, -0.02, 0.14);
        rootBone.add(wingL);
        wingL.add(wingLTip);
        rootBone.add(wingR);
        wingR.add(wingRTip);
        rootBone.add(neck);
        neck.add(head);
        rootBone.add(tail);
        tail.add(tailTip);

        const smesh = new THREE.SkinnedMesh(geo, mesh.material);
        smesh.name = 'dragon-skin';
        smesh.frustumCulled = false;
        smesh.add(rootBone);
        smesh.bind(new THREE.Skeleton([rootBone, wingL, wingLTip, wingR, wingRTip, neck, head, tail, tailTip]));
        if (smesh.normalizeSkinWeights) smesh.normalizeSkinWeights();

        const g = new THREE.Group();
        g.name = 'dragon';
        g.add(smesh);
        g.userData.sculptRuntime = {
            nodes: { body: smesh, wingL: wingL, wingR: wingR, neck: neck, head: head, tail: tail }
        };
        g.userData.flap = function (t, moving, pose) {
            const flapFn = global.BlockLegendFx && global.BlockLegendFx.wingFlap;
            const wave = flapFn || function (tt, mv) {
                return Math.sin(tt * (mv ? 6.2 : 2.2)) * (mv ? 0.72 : 0.1);
            };
            const a = wave(t, moving);
            const lag = wave(t - 0.12, moving);
            const nod = moving
                ? 0.05 + Math.sin(t * 2.9) * 0.09
                : Math.sin(t * 1.5) * 0.05;
            const rot = applyFlightPose(a, lag, nod, pose);
            const swaySpeed = moving ? 3.4 : 1.6;
            wingL.rotation.z = rot.wingLZ;
            wingR.rotation.z = rot.wingRZ;
            wingLTip.rotation.z = rot.wingLTipZ;
            wingRTip.rotation.z = rot.wingRTipZ;
            neck.rotation.x = rot.neckX;
            head.rotation.x = rot.headX + Math.sin(t * 2.3) * 0.05;
            tail.rotation.y = Math.sin(t * swaySpeed) * (moving ? 0.16 : 0.10) + rot.tailY;
            tail.rotation.x = Math.sin(t * swaySpeed * 0.6) * 0.05 + rot.tailX;
            tailTip.rotation.y = Math.sin((t - 0.25) * swaySpeed) * (moving ? 0.24 : 0.14);
        };
        return g;
    }

    global.BlockLegendDragonSkin = {
        rig: rig,
        weightsFor: weightsFor,
        applyFlightPose: applyFlightPose,
        config: CFG
    };
}(typeof window !== 'undefined' ? window : globalThis));
