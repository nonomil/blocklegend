/**
 * 骑乘龙 GLB 加载：Meshy/Tripo 等生成的 academy-dragon.glb 优先，失败回落程序化龙。
 */
(function (global) {
    'use strict';

    const GLB_PATH = 'assets/models/academy-dragon.glb';
    const TARGET_LEN = 3.45;

    let cached = null;
    let loadPromise = null;

    function hasLoader(THREE) {
        return !!(THREE && THREE.GLTFLoader);
    }

    function stripShadows(root) {
        root.traverse(function (o) {
            if (o.isMesh || o.isSkinnedMesh) {
                o.castShadow = false;
                o.receiveShadow = false;
            }
        });
    }

    function fitRoot(root, THREE) {
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const len = Math.max(size.x, size.y, size.z, 0.001);
        const s = TARGET_LEN / len;
        root.scale.setScalar(s);
        root.position.sub(center.multiplyScalar(s));
        root.position.y -= box.min.y * s;
        root.rotation.y = Math.PI;
    }

    function isClayMaterial(mat) {
        if (!mat) return false;
        if (mat.map || mat.emissiveMap || mat.normalMap) return false;
        const c = mat.color;
        if (!c) return true;
        const r = c.r;
        const g = c.g;
        const b = c.b;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        return max - min < 0.06 && r > 0.35 && r < 0.92;
    }

    function academyMats(THREE) {
        const Phys = THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial || THREE.MeshLambertMaterial;
        return {
            scale: new Phys({
                color: 0x6a3b8a,
                roughness: 0.28,
                metalness: 0.08,
                clearcoat: 0.25,
                emissive: 0x2a1b4a,
                emissiveIntensity: 0.12
            }),
            gold: new Phys({
                color: 0xd4a843,
                roughness: 0.22,
                metalness: 0.65,
                emissive: 0x6a5010,
                emissiveIntensity: 0.15
            }),
            membrane: new Phys({
                color: 0x7a4b9a,
                roughness: 0.48,
                metalness: 0,
                transparent: true,
                opacity: 0.78,
                side: THREE.DoubleSide,
                depthWrite: false
            })
        };
    }

    /** 灰模 GLB 无贴图时，按部位染成紫金校队色。 */
    function tintUntextured(root, THREE) {
        const M = academyMats(THREE);
        root.traverse(function (o) {
            if (!o.isMesh && !o.isSkinnedMesh) return;
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            const clay = mats.every(isClayMaterial);
            if (!clay) return;
            const name = (o.name || '').toLowerCase();
            let pick = M.scale;
            if (/wing|membrane|web| patagium/.test(name)) pick = M.membrane;
            else if (/horn|claw|spine|ridge|gold|bone|tooth|talon/.test(name)) pick = M.gold;
            else if (/belly|under|ventral|gold/.test(name)) pick = M.gold;
            o.material = pick;
        });
    }

    function bindRuntime(root, animations, THREE) {
        tintUntextured(root, THREE);
        stripShadows(root);
        root.name = 'dragon';
        root.userData.form = 'gltf';
        let mixer = null;
        let flyAction = null;
        if (animations && animations.length && global.THREE && global.THREE.AnimationMixer) {
            mixer = new global.THREE.AnimationMixer(root);
            const pick = animations.find(function (c) {
                return /fly|flap|idle|glide/i.test(c.name);
            }) || animations[0];
            flyAction = mixer.clipAction(pick);
            flyAction.play();
        }
        root.userData.dragonBaseY = 0;
        root.userData.tick = function (t, moving) {
            const time = Number(t) || 0;
            if (mixer) {
                mixer.update(moving ? 0.032 : 0.012);
                if (flyAction) flyAction.timeScale = moving ? 1.15 : 0.45;
            }
            root.position.y = (root.userData.dragonBaseY || 0) + 0.03 + Math.sin(time * 1.5) * 0.02;
        };
        return root;
    }

    function load(THREE) {
        if (cached) return Promise.resolve(cached);
        if (loadPromise) return loadPromise;
        if (!hasLoader(THREE)) {
            return Promise.reject(new Error('GLTFLoader missing'));
        }
        loadPromise = new Promise(function (resolve, reject) {
            const loader = new THREE.GLTFLoader();
            loader.load(
                GLB_PATH,
                function (gltf) {
                    cached = { scene: gltf.scene, animations: gltf.animations || [] };
                    resolve(cached);
                },
                undefined,
                reject
            );
        });
        return loadPromise;
    }

    function create(THREE, options) {
        if (!cached || !THREE) return null;
        const root = cached.scene.clone(true);
        if (options && options.hideShield) {
            root.traverse(function (o) {
                if (o.name === 'boss-shield') o.visible = false;
            });
        }
        fitRoot(root, THREE);
        root.userData.rideScale = 1;
        return bindRuntime(root, cached.animations, THREE);
    }

    function isReady() {
        return !!cached;
    }

    global.BlockLegendDragonGltf = {
        path: GLB_PATH,
        targetLength: TARGET_LEN,
        hasLoader: hasLoader,
        load: load,
        create: create,
        isReady: isReady,
        tintUntextured: tintUntextured,
        isClayMaterial: isClayMaterial
    };
}(typeof window !== 'undefined' ? window : globalThis));
