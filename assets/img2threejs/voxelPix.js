/**
 * Shared nearest-neighbor materials from BlockLegendSkins 64×64 sheets.
 */
(function (global) {
    'use strict';

    const cache = {};

    function canvasTex(THREE, canvas) {
        const t = new THREE.CanvasTexture(canvas);
        t.magFilter = THREE.NearestFilter;
        t.minFilter = THREE.NearestFilter;
        t.generateMipmaps = false;
        return t;
    }

    function sheetCanvas(kind) {
        const key = 'sheet:' + kind;
        if (cache[key]) return cache[key];
        const c = document.createElement('canvas');
        c.width = 64;
        c.height = 64;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        const SK = global.BlockLegendSkins;
        if (SK && SK.createSkinImage) {
            const id = ctx.createImageData(64, 64);
            id.data.set(SK.createSkinImage(kind));
            ctx.putImageData(id, 0, 0);
        } else {
            ctx.fillStyle = '#888';
            ctx.fillRect(0, 0, 64, 64);
        }
        cache[key] = c;
        return c;
    }

    function regionCanvas(kind, x, y, w, h) {
        const key = 'reg:' + kind + ':' + x + ',' + y + ',' + w + ',' + h;
        if (cache[key]) return cache[key];
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        const SK = global.BlockLegendSkins;
        if (SK && SK.facePixels && SK.createSkinImage) {
            const pix = SK.facePixels(SK.createSkinImage(kind), x, y, w, h);
            const id = ctx.createImageData(w, h);
            pix.forEach(function (p, i) {
                id.data[i * 4] = p[0];
                id.data[i * 4 + 1] = p[1];
                id.data[i * 4 + 2] = p[2];
                id.data[i * 4 + 3] = p[3] == null ? 255 : p[3];
            });
            ctx.putImageData(id, 0, 0);
        }
        cache[key] = c;
        return c;
    }

    function faceCanvas(kind, x, y) {
        return regionCanvas(kind, x == null ? 8 : x, y == null ? 8 : y, 8, 8);
    }

    function matFromCanvas(THREE, canvas, extra) {
        const o = extra || {};
        return new THREE.MeshLambertMaterial({
            map: canvasTex(THREE, canvas),
            emissive: o.emissive || 0x000000
        });
    }

    function sheetMat(THREE, kind, extra) {
        return matFromCanvas(THREE, sheetCanvas(kind), extra);
    }

    function regionMat(THREE, kind, x, y, w, h, extra) {
        return matFromCanvas(THREE, regionCanvas(kind, x, y, w, h), extra);
    }

    function faceMat(THREE, kind, extra) {
        const o = extra || {};
        return matFromCanvas(THREE, faceCanvas(kind, o.faceX, o.faceY), extra);
    }

    function headMats(THREE, kind, extra) {
        const o = extra || {};
        const body = regionMat(THREE, kind, o.bodyX == null ? 20 : o.bodyX, o.bodyY == null ? 20 : o.bodyY, 8, 8, extra);
        const face = faceMat(THREE, kind, extra);
        return [body, body, body, body, face, body];
    }

    function box(THREE, w, h, d, mat) {
        return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    }

    global.BlockLegendVoxelPix = {
        sheetMat: sheetMat,
        regionMat: regionMat,
        faceMat: faceMat,
        headMats: headMats,
        box: box
    };
}(typeof window !== 'undefined' ? window : globalThis));
