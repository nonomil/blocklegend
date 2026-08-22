/**
 * 骑龙门控与剧情段：营地体验、龙鞍、指定关短骑、第 12 关堡垒、词灵加成。
 */
(function (global) {
    'use strict';

    const DEMO_MS = 20000;
    const SADDLE_ID = 'dragon-saddle';
    const GOGGLES_ID = 'ride-goggles';
    const GEM_ID = 'breath-gem';
    const RIDE_LEVELS = [4, 6, 8, 12];
    const SEGMENT_MS = { 4: 40000, 6: 60000, 8: 60000, 12: 60000 };
    const WORD_WINDOW_MS = 8000;

    function hasSaddle(gear) {
        return !!(gear && gear.saddle === SADDLE_ID);
    }

    function hasGoggles(gear) {
        return !!(gear && gear.goggles === GOGGLES_ID);
    }

    function hasGem(gear) {
        return !!(gear && gear.charm === GEM_ID);
    }

    function isRideLevel(level) {
        return RIDE_LEVELS.indexOf(Number(level)) >= 0;
    }

    function segmentMs(level) {
        return SEGMENT_MS[Number(level)] || 60000;
    }

    function canStartMount(opts) {
        const o = opts || {};
        if (hasSaddle(o.gear)) {
            if (o.hub) return { ok: true, mode: 'free' };
            if (isRideLevel(o.level)) {
                return { ok: true, mode: 'segment', limitMs: segmentMs(o.level) };
            }
            return { ok: false, reason: 'not-ride-level' };
        }
        if (o.hub && !o.demoUsed) return { ok: true, mode: 'demo', limitMs: DEMO_MS };
        return { ok: false, reason: 'need-saddle' };
    }

    function demoExpired(startedAt, now, limitMs) {
        const a = Number(startedAt);
        const b = Number(now);
        const lim = Number(limitMs) > 0 ? Number(limitMs) : DEMO_MS;
        if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
        return b - a >= lim;
    }

    function denyToast(reason, hub) {
        if (typeof reason === 'boolean') {
            hub = reason;
            reason = 'need-saddle';
        }
        if (reason === 'not-ride-level') return '这关地面学词 · 第4/6/8/12关才能骑';
        return hub ? '体验结束 · 去商人摊换龙鞍' : '先回营地商人摊换龙鞍';
    }

    function segmentIntro(level) {
        const n = Number(level);
        if (n === 4) return '雪夜护送 · 骑龙约 40 秒，说动作词开门';
        if (n === 6) return '躲开恶魂火球 · 说中再喷龙息';
        if (n === 8) return '沿星路飞 · 听音配对破风暴';
        if (n === 12) return '空中堡垒 · 说词开桥，落地才能通关';
        return '';
    }

    function rideEncounterOf(level) {
        const n = Number(level);
        if (n === 4) return { air: null, fortress: false };
        if (n === 6) return { air: { kinds: ['ghast'], count: 1, on: 'mount' }, fortress: false };
        if (n === 8) {
            return {
                air: [
                    { kinds: ['phantom', 'vex'], count: 2, on: 'mount' },
                    { kinds: ['storm'], count: 1, on: 'mount' }
                ],
                fortress: false
            };
        }
        if (n === 12) {
            return {
                air: [
                    { kinds: ['ghast'], count: 1, on: 'fortress-step', step: 2 },
                    { kinds: ['wither'], count: 1, on: 'fortress-step', step: 3 }
                ],
                fortress: true
            };
        }
        return { air: null, fortress: false };
    }

    function airList(enc) {
        if (!enc || !enc.air) return [];
        return Array.isArray(enc.air) ? enc.air : [enc.air];
    }

    function shouldStartFortress(level) {
        return !!rideEncounterOf(level).fortress;
    }

    function airPacksOf(level, fortressStep) {
        const list = airList(rideEncounterOf(level));
        const step = Number(fortressStep) || 0;
        const out = [];
        for (let i = 0; i < list.length; i += 1) {
            const air = list[i];
            if (air.on === 'mount') out.push(air);
            else if (air.on === 'fortress-step' && step === Number(air.step)) out.push(air);
        }
        return out;
    }

    function airSpawnOf(level, fortressStep) {
        const packs = airPacksOf(level, fortressStep);
        return packs.length ? packs[0] : null;
    }

    function rideHint(level) {
        const n = Number(level);
        if (n === 4) return '雪夜 · 说动作词开门';
        if (n === 8) return '星路 · 听一对词破风暴';
        return '';
    }

    function shouldStartRideDoor(level) {
        return Number(level) === 4;
    }

    function rideDoorStart() {
        return { words: 0, open: false };
    }

    function rideDoorOnWord(state) {
        const cur = state || { words: 0, open: false };
        if (cur.open) return { words: Number(cur.words) || 2, open: true };
        const words = (Number(cur.words) || 0) + 1;
        if (words >= 2) return { words: 2, open: true, toast: '门开了 · 飞过去' };
        return { words: words, open: false };
    }

    function shouldOpenRideDoor(prev, next) {
        return !!(next && next.open) && !(prev && prev.open);
    }

    function rideDoorLayoutOf(opts) {
        const o = opts || {};
        const cx = Math.floor(Number(o.cx) || 256);
        const cz = Math.floor(Number(o.cz) || 256);
        const y0 = Math.max(2, Math.floor(Number(o.surfaceY) || 8));
        const ox = cx - 6;
        const oz = cz - 16;
        const posts = [];
        const lintel = [];
        const fill = [];
        let dy;
        let x;
        for (dy = 0; dy <= 14; dy += 1) {
            posts.push({ x: ox, y: y0 + dy, z: oz, kind: 'log' });
            posts.push({ x: ox + 4, y: y0 + dy, z: oz, kind: 'log' });
        }
        for (x = ox; x <= ox + 4; x += 1) {
            lintel.push({ x: x, y: y0 + 14, z: oz, kind: 'gold' });
            lintel.push({ x: x, y: y0 + 15, z: oz, kind: 'snow' });
        }
        for (dy = 10; dy <= 13; dy += 1) {
            for (x = ox + 1; x <= ox + 3; x += 1) {
                fill.push({ x: x, y: y0 + dy, z: oz, kind: 'ice' });
            }
        }
        for (dy = 1; dy <= 3; dy += 1) {
            for (x = ox + 1; x <= ox + 3; x += 1) {
                fill.push({ x: x, y: y0 + dy, z: oz, kind: 'snow' });
            }
        }
        return {
            posts: posts,
            lintel: lintel,
            fill: fill,
            y0: y0,
            ox: ox,
            oz: oz,
            keepout: { x0: ox - 2, z0: oz - 2, x1: ox + 6, z1: oz + 2 }
        };
    }

    function stormStart() {
        return { words: 0, done: false };
    }

    function stormOnWord(state) {
        const cur = state || { words: 0, done: false };
        if (cur.done) return { words: Number(cur.words) || 2, done: true };
        const words = (Number(cur.words) || 0) + 1;
        if (words >= 2) return { words: 2, done: true, toast: '风暴散了 · 星路能见了' };
        return { words: words, done: false };
    }

    function fortressHint(state) {
        const st = state || {};
        const step = Number(st.step) || 0;
        const words = Number(st.words) || 0;
        if (step === 1) return '堡垒 1/5 · 再说 ' + Math.max(0, 3 - words) + ' 个词放桥';
        if (step === 2) return '堡垒 2/5 · 躲开恶魂 · 说中再喷龙息';
        if (step === 3) return '堡垒 3/5 · 再说 ' + Math.max(0, 3 - words) + ' 个词破凋零';
        if (step === 4) return '堡垒 4/5 · 落地才能通关';
        if (step === 5) return '堡垒 5/5 · 走进去收尾';
        return '';
    }

    function airHuntY(opts) {
        const o = opts || {};
        const ground = Number(o.groundY) || 0;
        if (!o.mounted) return ground;
        return (Number(o.playerY) || 12) + (Number(o.lift) || 0.6);
    }

    function fortressStart() {
        return { step: 1, words: 0 };
    }

    function fortressOnWord(state) {
        const cur = state || { step: 1, words: 0 };
        const next = { step: Number(cur.step) || 1, words: (Number(cur.words) || 0) + 1 };
        if (next.step === 1 && next.words >= 3) {
            return { step: 2, words: 0, toast: '桥放下了 · 左右倾斜躲开恶魂火球' };
        }
        if (next.step === 2 && next.words >= 1) {
            return { step: 3, words: 0, toast: '飞向塔顶 · 再说 3 个词破凋零' };
        }
        if (next.step === 3 && next.words >= 3) {
            return { step: 4, words: 0, toast: '必须落地才能通关' };
        }
        return next;
    }

    function fortressOnLand(state) {
        const cur = state || {};
        if (Number(cur.step) === 4) return { step: 5, words: 0, toast: '落地了 · 走进去收尾' };
        return cur;
    }

    function fortressCanFinish(opts) {
        const o = opts || {};
        if (!o.fortress || !o.fortress.step) return { ok: true };
        if (o.mounted) return { ok: false, reason: 'land-first' };
        if (Number(o.fortress.step) < 5) return { ok: false, reason: 'fortress-open' };
        return { ok: true };
    }

    function rideHoldOpen(fortress) {
        const step = Number(fortress && fortress.step) || 0;
        return step >= 1 && step < 5;
    }

    function fortressDenyToast(reason) {
        if (reason === 'land-first') return '飞着不能通关 · 先落地';
        return '空中堡垒还没走完 · 说词开桥后再落地';
    }

    function shouldDropBridge(prev, next) {
        return Number(prev && prev.step) === 1 && Number(next && next.step) === 2;
    }

    function fortressLayoutOf(opts) {
        const o = opts || {};
        const cx = Math.floor(Number(o.cx) || 256);
        const cz = Math.floor(Number(o.cz) || 256);
        const surfaceY = Math.max(2, Math.floor(Number(o.surfaceY) || 8));
        const deckY = Math.min(36, surfaceY + 12);
        const ix = cx - 8;
        const iz = cz - 22;
        const iw = 7;
        const id = 7;
        const island = [];
        const tx = ix + 2;
        const tz = iz + 1;
        const tw = 3;
        const td = 3;
        const th = 5;
        let x;
        let z;
        for (z = 0; z < id; z += 1) {
            for (x = 0; x < iw; x += 1) {
                island.push({ x: ix + x, y: deckY, z: iz + z, kind: 'stone' });
                island.push({ x: ix + x, y: deckY - 1, z: iz + z, kind: 'coal' });
                const edge = x === 0 || z === 0 || x === iw - 1 || z === id - 1;
                const southGap = z === id - 1 && x >= 2 && x <= 4;
                const underTower = (ix + x) >= tx && (ix + x) < tx + tw && (iz + z) >= tz && (iz + z) < tz + td;
                if (edge && !southGap && !underTower) {
                    island.push({ x: ix + x, y: deckY + 1, z: iz + z, kind: 'stone' });
                }
            }
        }
        const tower = [];
        let dy;
        for (dy = 0; dy < th; dy += 1) {
            for (z = 0; z < td; z += 1) {
                for (x = 0; x < tw; x += 1) {
                    const wall = x === 0 || z === 0 || x === tw - 1 || z === td - 1 || dy === th - 1;
                    const doorHole = dy >= 1 && dy <= 2 && x === 1 && z === td - 1;
                    if (!wall || doorHole) continue;
                    tower.push({
                        x: tx + x,
                        y: deckY + 1 + dy,
                        z: tz + z,
                        kind: dy === th - 1 ? 'gold' : 'stone'
                    });
                }
            }
        }
        tower.push({ x: tx + 1, y: deckY + 1, z: tz + td - 1, kind: 'gold' });
        tower.push({ x: tx, y: deckY + 2, z: tz + td - 1, kind: 'gold' });
        tower.push({ x: tx + 2, y: deckY + 2, z: tz + td - 1, kind: 'gold' });
        const bridge = [];
        const bx = ix + 3;
        let i;
        for (i = 0; i < 5; i += 1) {
            const bz = iz + id + i;
            bridge.push({ x: bx, y: deckY, z: bz, kind: 'plank' });
            bridge.push({ x: bx - 1, y: deckY, z: bz, kind: 'plank' });
            if (i % 2 === 0) {
                bridge.push({ x: bx - 2, y: deckY + 1, z: bz, kind: 'log' });
                bridge.push({ x: bx + 1, y: deckY + 1, z: bz, kind: 'log' });
            }
        }
        return {
            island: island,
            tower: tower,
            bridge: bridge,
            land: { x: ix + 3.5, y: deckY + 1, z: iz + 4.5 },
            door: { x: tx + 1.5, y: deckY + 2, z: tz + td - 0.2 },
            deckY: deckY,
            ix: ix,
            iz: iz,
            iw: iw,
            id: id,
            keepout: { x0: ix - 3, z0: iz - 2, x1: ix + iw + 2, z1: iz + id + 6 }
        };
    }

    function breathCooldownMs(opts) {
        const o = opts || {};
        let cd = 1000;
        if ((Number(o.combo) || 0) >= 3) cd -= 250;
        return cd < 600 ? 600 : cd;
    }

    function wordWindowMs(opts) {
        const o = opts || {};
        return WORD_WINDOW_MS + (o.gem ? 1000 : 0);
    }

    function quizBonusMs(opts) {
        const o = opts || {};
        return o.goggles && o.mounted ? 2000 : 0;
    }

    function spiritScale(level, gear) {
        if (!hasSaddle(gear)) return 1;
        const n = Number(level) || 1;
        if (n >= 12) return 1.22;
        if (n >= 6) return 1.15;
        return 1;
    }

    function spiritLightOf(opts) {
        const o = opts || {};
        if (!hasSaddle(o.gear)) {
            return { on: false, color: 0xffe27a, intensity: 0, scale: 0.08 };
        }
        const n = Number(o.level) || 1;
        let intensity = 0.55;
        let color = 0xffe27a;
        let scale = 0.12;
        if (n >= 6) {
            intensity = 0.85;
            scale = 0.16;
        }
        if (n >= 12) {
            intensity = 1.15;
            color = 0xffd24a;
            scale = 0.2;
        }
        if ((Number(o.combo) || 0) >= 3) intensity += 0.35;
        if (o.mounted) intensity += 0.15;
        return { on: true, color: color, intensity: intensity, scale: scale };
    }

    global.BlockLegendRidePolicy = {
        DEMO_MS: DEMO_MS,
        SADDLE_ID: SADDLE_ID,
        GOGGLES_ID: GOGGLES_ID,
        GEM_ID: GEM_ID,
        RIDE_LEVELS: RIDE_LEVELS,
        hasSaddle: hasSaddle,
        hasGoggles: hasGoggles,
        hasGem: hasGem,
        isRideLevel: isRideLevel,
        segmentMs: segmentMs,
        canStartMount: canStartMount,
        demoExpired: demoExpired,
        denyToast: denyToast,
        segmentIntro: segmentIntro,
        rideEncounterOf: rideEncounterOf,
        shouldStartFortress: shouldStartFortress,
        airPacksOf: airPacksOf,
        airSpawnOf: airSpawnOf,
        rideHint: rideHint,
        shouldStartRideDoor: shouldStartRideDoor,
        rideDoorStart: rideDoorStart,
        rideDoorOnWord: rideDoorOnWord,
        shouldOpenRideDoor: shouldOpenRideDoor,
        rideDoorLayoutOf: rideDoorLayoutOf,
        stormStart: stormStart,
        stormOnWord: stormOnWord,
        airHuntY: airHuntY,
        fortressHint: fortressHint,
        fortressStart: fortressStart,
        fortressOnWord: fortressOnWord,
        fortressOnLand: fortressOnLand,
        fortressCanFinish: fortressCanFinish,
        rideHoldOpen: rideHoldOpen,
        fortressDenyToast: fortressDenyToast,
        fortressLayoutOf: fortressLayoutOf,
        shouldDropBridge: shouldDropBridge,
        breathCooldownMs: breathCooldownMs,
        wordWindowMs: wordWindowMs,
        quizBonusMs: quizBonusMs,
        spiritScale: spiritScale,
        spiritLightOf: spiritLightOf
    };
}(typeof window !== 'undefined' ? window : globalThis));
