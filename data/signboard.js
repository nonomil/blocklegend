/**
 * 告示牌文案：短行中英，给 3D 木板贴图用。
 */
(function (global) {
    'use strict';

    function wrapText(text, width) {
        const s = String(text || '');
        const max = Math.max(4, Number(width) || 11);
        const lines = [];
        let cur = '';
        let i;
        for (i = 0; i < s.length; i += 1) {
            const ch = s[i];
            if (ch === '\n') {
                if (cur) lines.push(cur);
                cur = '';
                continue;
            }
            cur += ch;
            if (cur.length >= max) {
                lines.push(cur);
                cur = '';
            }
        }
        if (cur) lines.push(cur);
        return lines;
    }

    function boardLines(talk, opts) {
        const o = opts || {};
        const max = Math.max(4, Number(o.maxLines) || 7);
        const zhW = Math.max(6, Number(o.zhWidth) || 11);
        const enW = Math.max(8, Number(o.enWidth) || 16);
        const row = talk || {};
        const out = [];
        if (row.who) out.push(String(row.who));
        wrapText(row.zh, zhW).forEach(function (l) { out.push(l); });
        wrapText(row.en, enW).forEach(function (l) { out.push(l); });
        if (row.prompts && row.prompts.length) {
            out.push(row.prompts.map(function (p) {
                return String(p.en || '') + ' ' + String(p.zh || '');
            }).join('  '));
        }
        return out.slice(0, max);
    }

    function paintBoard(canvas, lines) {
        if (!canvas || !canvas.getContext) return canvas;
        const ctx = canvas.getContext('2d');
        const w = canvas.width || 256;
        const h = canvas.height || 192;
        ctx.fillStyle = '#c8a56a';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#5a3a18';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, w - 8, h - 8);
        ctx.fillStyle = '#2a1c10';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const rows = lines || [];
        const step = Math.min(28, (h - 24) / Math.max(1, rows.length));
        ctx.font = 'bold ' + Math.max(16, Math.floor(step * 0.72)) + 'px "Microsoft YaHei","PingFang SC",sans-serif';
        rows.forEach(function (line, i) {
            ctx.fillText(String(line || ''), w / 2, 16 + step * (i + 0.5), w - 24);
        });
        return canvas;
    }

    global.BlockLegendSignboard = {
        wrapText: wrapText,
        boardLines: boardLines,
        paintBoard: paintBoard
    };
})(typeof globalThis !== 'undefined' ? globalThis : window);
