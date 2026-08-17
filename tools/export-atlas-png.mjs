/**
 * Dump ART-01 core tiles to 16x16 PNGs + a nearest-neighbor strip.
 */
import { createWriteStream } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync, crc32 } from 'node:zlib';
import '../data/atlas-paint.js';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'assets', 'atlas');
const P = globalThis.BlockLegendAtlasPaint;

function chunk(type, data) {
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    return Buffer.concat([len, body, crc]);
}

function encodePng(w, h, rgba) {
    const raw = Buffer.alloc((w * 4 + 1) * h);
    for (let y = 0; y < h; y += 1) {
        raw[y * (w * 4 + 1)] = 0;
        rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0);
    ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        chunk('IHDR', ihdr),
        chunk('IDAT', deflateSync(raw)),
        chunk('IEND', Buffer.alloc(0))
    ]);
}

function tileRgba(name) {
    const pix = P.decodeTile(name);
    const buf = Buffer.alloc(16 * 16 * 4);
    pix.forEach((p, i) => {
        buf[i * 4] = p.r;
        buf[i * 4 + 1] = p.g;
        buf[i * 4 + 2] = p.b;
        buf[i * 4 + 3] = p.a;
    });
    return buf;
}

mkdirSync(outDir, { recursive: true });
const names = Object.keys(P.CORE);
names.forEach((name) => {
    const png = encodePng(16, 16, tileRgba(name));
    const dest = join(outDir, name + '.png');
    createWriteStream(dest).end(png);
});

const scale = 16;
const gap = 8;
const stripW = names.length * (16 * scale + gap) + gap;
const stripH = 16 * scale + gap * 2;
const strip = Buffer.alloc(stripW * stripH * 4, 0);
names.forEach((name, n) => {
    const src = tileRgba(name);
    const ox = gap + n * (16 * scale + gap);
    const oy = gap;
    for (let y = 0; y < 16; y += 1) {
        for (let x = 0; x < 16; x += 1) {
            const si = (y * 16 + x) * 4;
            for (let dy = 0; dy < scale; dy += 1) {
                for (let dx = 0; dx < scale; dx += 1) {
                    const di = ((oy + y * scale + dy) * stripW + (ox + x * scale + dx)) * 4;
                    strip[di] = src[si];
                    strip[di + 1] = src[si + 1];
                    strip[di + 2] = src[si + 2];
                    strip[di + 3] = src[si + 3];
                }
            }
        }
    }
});
createWriteStream(join(outDir, 'core-strip.png')).end(encodePng(stripW, stripH, strip));
console.log('wrote', names.length, 'tiles + strip to', outDir);
