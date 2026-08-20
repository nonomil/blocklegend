/**
 * blocklegend · 战斗纯函数（T20260815-blocklegend-3d S2）
 * 无 DOM / 无 three.js。浏览器挂 window.BlockLegendCombat，node 可 import。
 */
(function (global) {
    'use strict';

    const CRIT_MULT = 3;
    const BASE_MELEE = 8;
    const BASE_BOLT = 5;
    const BASE_BREATH = 4;
    const BREATH_WORD_WINDOW_MS = 8000;
    const MELEE_COOLDOWN_MS = 420;
    const BOLT_COOLDOWN_MS = 640;
    const INVINCIBLE_MS = 1600;
    const MELEE_RANGE = 4.5;
    const MELEE_ARC = 1.15; // 约 66° 半角
    const BOLT_SPEED = 11;
    const BOLT_TURN = 7.2; // rad/s
    const BOLT_LIFE = 2.4;
    const CONTACT_RANGE = 1.7; // 停在玩家前方可见距离（1.15 时低于相机半视场角看不见）
    const AGGRO_ENTER = 8;
    const AGGRO_EXIT = 14;

    const MONSTERS = {
        slime: { kind: 'slime', hp: 24, coins: 4, contact: 1, speed: 1.12, loot: 'slime-gel', color: 0x6fbf4a },
        cube: { kind: 'cube', hp: 36, coins: 6, contact: 2, speed: 1.05, loot: 'cube-shard', color: 0xc47a3a },
        husk: { kind: 'husk', hp: 48, coins: 8, contact: 2, speed: 1.05, loot: 'husk-bone', color: 0x8a8f99 },
        fox: { kind: 'fox', hp: 28, coins: 5, contact: 1, speed: 1.55, loot: 'fox-fur', color: 0xe07a28 },
        magma: { kind: 'magma', hp: 40, coins: 7, contact: 2, speed: 0.95, loot: 'magma-cream', color: 0xff6a2a },
        blaze: { kind: 'blaze', hp: 36, coins: 8, contact: 2, speed: 1.15, loot: 'blaze-rod', color: 0xffc04a, hitRadius: 0.55 },
        ghast: { kind: 'ghast', hp: 52, coins: 10, contact: 2, speed: 0.72, loot: 'ghast-tear', color: 0xf4f0ea, hitRadius: 0.9 },
        warden: { kind: 'warden', hp: 70, coins: 12, contact: 3, speed: 0.7, loot: 'warden-horn', color: 0x2a6a78, hitRadius: 0.7 },
        creeper: { kind: 'creeper', hp: 32, coins: 7, contact: 3, speed: 1.05, loot: 'gunpowder', color: 0x6fbf45, hitRadius: 0.55 },
        zombie: { kind: 'zombie', hp: 44, coins: 7, contact: 2, speed: 1.12, loot: 'rotten-flesh', color: 0x5a7a4a, hitRadius: 0.5 },
        skeleton: { kind: 'skeleton', hp: 36, coins: 8, contact: 2, speed: 1.12, loot: 'bone', color: 0xe8d8b8, hitRadius: 0.45 },
        spider: { kind: 'spider', hp: 30, coins: 6, contact: 2, speed: 1.28, loot: 'string', color: 0x3a2418, hitRadius: 0.7 },
        enderman: { kind: 'enderman', hp: 50, coins: 10, contact: 2, speed: 1.22, loot: 'ender-pearl', color: 0x14141c, hitRadius: 0.45 },
        piglin: { kind: 'piglin', hp: 42, coins: 8, contact: 2, speed: 1.0, loot: 'gold-nugget', color: 0xe8a878, hitRadius: 0.5 },
        witch: { kind: 'witch', hp: 38, coins: 9, contact: 2, speed: 0.86, loot: 'glow-dust', color: 0x5a2a78, hitRadius: 0.5 },
        golem: { kind: 'golem', hp: 64, coins: 12, contact: 3, speed: 0.62, loot: 'iron-ingot', color: 0xb8c4c8, hitRadius: 0.7 },
        ravager: { kind: 'ravager', hp: 68, coins: 12, contact: 3, speed: 0.72, loot: 'saddle', color: 0x6a5a48, hitRadius: 0.85 },
        phantom: { kind: 'phantom', hp: 34, coins: 8, contact: 2, speed: 1.18, loot: 'phantom-membrane', color: 0x3a4a78, hitRadius: 0.7 },
        vex: { kind: 'vex', hp: 26, coins: 7, contact: 1, speed: 1.45, loot: 'vex-wing', color: 0x8ad4e8, hitRadius: 0.4 },
        drowned: { kind: 'drowned', hp: 46, coins: 8, contact: 2, speed: 1.08, loot: 'trident-shard', color: 0x3a7a6a, hitRadius: 0.5 },
        snowgolem: { kind: 'snowgolem', hp: 36, coins: 6, contact: 1, speed: 0.78, loot: 'snowball', color: 0xf4f0ea, hitRadius: 0.5 },
        vindicator: { kind: 'vindicator', hp: 48, coins: 9, contact: 2, speed: 1.0, loot: 'iron_ingot', color: 0x4a4a3a, hitRadius: 0.5 },
        guardian: { kind: 'guardian', hp: 54, coins: 10, contact: 2, speed: 0.68, loot: 'prismarine', color: 0x4aa090, hitRadius: 0.7 },
        pufferfish: { kind: 'pufferfish', hp: 22, coins: 5, contact: 2, speed: 0.9, loot: 'puffer-spine', color: 0xf2a04a, hitRadius: 0.45 },
        spore_bug: { kind: 'spore_bug', hp: 28, coins: 6, contact: 1, speed: 1.08, loot: 'spore-cap', color: 0xb4543a, hitRadius: 0.5 },
        fire_spirit: { kind: 'fire_spirit', hp: 32, coins: 7, contact: 2, speed: 1.2, loot: 'ember-core', color: 0xe07020, hitRadius: 0.45 },
        sculk_worm: { kind: 'sculk_worm', hp: 38, coins: 7, contact: 2, speed: 0.82, loot: 'sculk-thread', color: 0x1a3a40, hitRadius: 0.55 },
        shadow_stalker: { kind: 'shadow_stalker', hp: 44, coins: 8, contact: 2, speed: 1.18, loot: 'shadow-hood', color: 0x1c1c24, hitRadius: 0.45 },
        pillager: { kind: 'pillager', hp: 42, coins: 8, contact: 2, speed: 1.0, loot: 'crossbow-bolt', color: 0x5a2a3a, hitRadius: 0.5 }
    };
    const ANIMALS = {
        pig: { kind: 'pig', hp: 16, coins: 2, contact: 0, loot: ['pork'], bodyRadius: 0.95 },
        cow: { kind: 'cow', hp: 20, coins: 2, contact: 0, loot: ['beef'], bodyRadius: 1.15 },
        sheep: { kind: 'sheep', hp: 14, coins: 2, contact: 0, loot: ['wool', 'mutton'], bodyRadius: 1.35 },
        chicken: { kind: 'chicken', hp: 8, coins: 1, contact: 0, loot: ['chicken', 'egg'], bodyRadius: 0.6 }
    };
    const WILD_ANIMALS = {
        wolf: { kind: 'wolf', hp: 14, coins: 2, contact: 0, loot: [] },
        bee: { kind: 'bee', hp: 6, coins: 1, contact: 0, loot: [] }
    };
    const BUILD_DROP = {
        slime: 'cobble', cube: 'cobble', husk: 'cobble', zombie: 'cobble', golem: 'cobble',
        creeper: 'sand', skeleton: 'glass', spider: 'wool', fox: 'wool',
        magma: 'glass', blaze: 'glass', drowned: 'sand'
    };

    function isFarmAnimal(kind) {
        return !!ANIMALS[kind];
    }

    function animalOf(kind) {
        const row = ANIMALS[kind];
        if (!row) return null;
        return {
            kind: row.kind,
            hp: row.hp,
            coins: row.coins,
            contact: row.contact,
            loot: row.loot.slice(),
            bodyRadius: row.bodyRadius || 0.9
        };
    }

    function animalBodyRadius(kind) {
        const row = ANIMALS[kind];
        return row && row.bodyRadius ? row.bodyRadius : 0;
    }

    function worldAnimalOf(kind) {
        const farm = animalOf(kind);
        if (farm) return farm;
        const row = WILD_ANIMALS[kind];
        if (!row) return null;
        return {
            kind: row.kind,
            hp: row.hp,
            coins: row.coins,
            contact: row.contact,
            loot: row.loot.slice()
        };
    }

    function animalLoot(kind) {
        const row = ANIMALS[kind] || WILD_ANIMALS[kind];
        return row ? row.loot.slice() : [];
    }

    function bonusBuildDrop(kind) {
        return BUILD_DROP[kind] || 'cobble';
    }

    const MONSTER_KINDS = Object.keys(MONSTERS);
    const BEHAVIOR = {
        slime: 'chase', cube: 'chase', husk: 'chase', fox: 'chase',
        magma: 'chase', creeper: 'chase', zombie: 'chase', spider: 'chase',
        piglin: 'chase', ravager: 'chase', drowned: 'chase', vex: 'chase', pufferfish: 'chase',
        spore_bug: 'chase', fire_spirit: 'chase', sculk_worm: 'chase', shadow_stalker: 'chase',
        vindicator: 'chase',
        blaze: 'ranged', ghast: 'ranged', skeleton: 'ranged', phantom: 'ranged', snowgolem: 'ranged', guardian: 'ranged', pillager: 'ranged',
        warden: 'shield', enderman: 'shield', golem: 'shield',
        witch: 'summon'
    };

    function behaviorOf(kind) {
        return BEHAVIOR[kind] || 'chase';
    }

    const FLY_HOVER = {
        bee: 2.4, phantom: 2.55, vex: 1.75, blaze: 1.55, ghast: 2.3,
        fire_spirit: 1.7, wither: 2.1, dragon: 2.4, storm: 2.5
    };
    const SWIM_HOVER = { guardian: 0.42, pufferfish: 0.42 };
    const HOP_HEIGHT = { chicken: 0.22, slime: 0.18, magma: 0.16 };
    const FLY_BOSSES = { wither: 1, dragon: 1, storm: 1, 'night-phantom': 1, ghast: 1, blaze: 1 };

    function locomotionOf(kind, extra) {
        const o = extra || {};
        const k = String(kind || '');
        const bossId = String(o.bossId || '');
        if (FLY_HOVER[k] != null) {
            return { mode: 'fly', flyer: true, hover: FLY_HOVER[k], hop: 0 };
        }
        if (o.isBoss && (FLY_BOSSES[bossId] || FLY_HOVER[bossId])) {
            return { mode: 'fly', flyer: true, hover: FLY_HOVER[bossId] || FLY_HOVER[k] || 1.8, hop: 0 };
        }
        if (SWIM_HOVER[k] != null) {
            return { mode: 'swim', flyer: false, hover: SWIM_HOVER[k], hop: 0 };
        }
        if (HOP_HEIGHT[k] != null) {
            return { mode: 'hop', flyer: false, hover: 0, hop: HOP_HEIGHT[k] };
        }
        return { mode: 'walk', flyer: false, hover: 0, hop: 0 };
    }

    function stanceAltitude(kind, surface, phase, extra) {
        const loc = locomotionOf(kind, extra);
        const p = Number(phase) || 0;
        let y = Number(surface) || 0;
        const hab = extra && extra.habitat;
        if (hab === 'water') return y - 0.05 + Math.sin(p * 2.4) * 0.08;
        if (loc.mode === 'fly') return y + loc.hover + Math.sin(p * 3.1) * 0.18;
        if (loc.mode === 'swim') return y + loc.hover + Math.sin(p * 2.4) * 0.08;
        if (loc.mode === 'hop') return y + Math.abs(Math.sin(p * 8)) * loc.hop;
        return y;
    }

    const SIGNATURES = {
        skeleton: { shot: 'bolt', color: 0xe8d8b8, halo: 0xfff4d0, intervalMs: 2200, count: 1, glow: 0, anim: 'aim' },
        pillager: { shot: 'bolt', color: 0x5a2a3a, halo: 0xc45a48, intervalMs: 2400, count: 1, glow: 0, anim: 'aim' },
        snowgolem: { shot: 'bolt', color: 0xf4f8ff, halo: 0xc8e0f4, intervalMs: 1800, count: 1, glow: 0, anim: 'aim' },
        phantom: { shot: 'bolt', color: 0x3a4a78, halo: 0x8aa0d8, intervalMs: 2200, count: 1, glow: 0x304878, anim: 'pulse' },
        vindicator: { shot: null, glow: 0x4a4a3a, anim: 'aim' },
        witch: { shot: 'bolt', color: 0x7a3ce0, halo: 0xd9b3ff, intervalMs: 3000, count: 1, glow: 0x5a2a78, anim: 'puff' },
        blaze: { shot: 'fire', color: 0xff7a20, halo: 0xffc04a, intervalMs: 2600, count: 3, glow: 0xff6020, anim: 'pulse' },
        ghast: { shot: 'fire', color: 0xff8a40, halo: 0xffe0a0, intervalMs: 2800, count: 1, glow: 0xffc8a0, anim: 'puff' },
        fire_spirit: { shot: 'fire', color: 0xe07020, halo: 0xffc04a, intervalMs: 2400, count: 1, glow: 0xff6020, anim: 'pulse' },
        guardian: { shot: 'sonic', color: 0x4ad4e0, halo: 0x1a6a70, intervalMs: 2600, count: 1, glow: 0x40c8c0, anim: 'pulse' },
        creeper: { shot: null, glow: 0x3a6a20, anim: 'swell' },
        enderman: { shot: null, glow: 0x201828, anim: 'blink', onHurt: 'blink' },
        vex: { shot: null, glow: 0x8ad4e8, anim: 'pulse' },
        warden: { shot: 'sonic', color: 0x4ad4e0, halo: 0x1a6a70, intervalMs: 2800, count: 1, range: 6, glow: 0x2a6a78, anim: 'pulse' },
        magma: { shot: null, glow: 0xff6a2a, anim: 'pulse' },
        slime: { shot: null, glow: 0, anim: 'hop' },
        cube: { shot: null, glow: 0, anim: 'hop' },
        zombie: { shot: null, glow: 0, anim: 'lunge' },
        husk: { shot: null, glow: 0, anim: 'lunge' },
        drowned: { shot: 'bolt', color: 0x3a7a6a, halo: 0x7ad4c0, intervalMs: 2000, count: 1, range: 7, glow: 0, anim: 'lunge' },
        piglin: { shot: null, glow: 0, anim: 'lunge' },
        spider: { shot: null, glow: 0, anim: 'skitter' },
        fox: { shot: null, glow: 0, anim: 'pounce' },
        ravager: { shot: null, glow: 0, anim: 'stomp' },
        golem: { shot: null, glow: 0, anim: 'stomp' },
        spore_bug: { shot: null, glow: 0xb4543a, anim: 'skitter' },
        sculk_worm: { shot: null, glow: 0x1a3a40, anim: 'skitter' },
        shadow_stalker: { shot: null, glow: 0x1c1c24, anim: 'blink' },
        pufferfish: { shot: null, glow: 0xf2a04a, anim: 'puff' }
    };

    function signatureOf(kind) {
        const row = SIGNATURES[kind] || { shot: null, glow: 0, anim: 'none', intervalMs: 0, count: 0 };
        return {
            shot: row.shot || null,
            color: row.color || 0xfff4d0,
            halo: row.halo || 0xffe8a0,
            intervalMs: Number(row.intervalMs) || 0,
            count: Number(row.count) || 0,
            glow: Number(row.glow) || 0,
            anim: row.anim || 'none',
            onHurt: row.onHurt || null,
            range: Number(row.range) || 0
        };
    }

    function canFireSkill(sig, now, lastAt, dist, stopAt) {
        if (!sig || !sig.shot) return false;
        const reach = Number(sig.range) > 0 ? Number(sig.range)
            : (Number(stopAt) > 0 ? Number(stopAt) : 4.2);
        const d = Number(dist);
        if (!(d >= 0) || d > reach + 0.6 || d < 1.2) return false;
        const gap = Number(sig.intervalMs) || 2200;
        const last = Number(lastAt) || 0;
        const t = Number(now) || 0;
        return last <= 0 || t - last >= gap;
    }

    function swellScale(dist, inner, outer) {
        const a = Number(inner) > 0 ? Number(inner) : 1.6;
        const b = Number(outer) > 0 ? Number(outer) : 3.2;
        const d = Number(dist);
        if (!(d >= 0) || d >= b) return 1;
        if (d <= a) return 1.38;
        return 1 + 0.38 * (1 - (d - a) / (b - a));
    }

    function blinkOffset(x, z, salt) {
        let h = (Math.floor(Number(x) * 10) * 374761393
            + Math.floor(Number(z) * 10) * 668265263
            + (Number(salt) || 0) * 1274126177) >>> 0;
        h = ((h ^ (h >> 13)) * 1274126177) >>> 0;
        const ang = (h / 4294967296) * Math.PI * 2;
        return { dx: Math.sin(ang) * 2.4, dz: Math.cos(ang) * 2.4 };
    }

    function poseStep(kind, extra) {
        const o = extra || {};
        const d = Number(o.dist);
        const out = { dash: 1, lift: 0, climb: 0, lean: 0 };
        if (!o.aggro || !(d >= 0)) return out;
        const anim = signatureOf(kind).anim;
        if (anim === 'pounce' && d >= 1.8 && d <= 5.5) {
            out.dash = 2.15;
            out.lift = 0.72;
            out.lean = -0.35;
        } else if (anim === 'lunge' && d >= 1.6 && d <= 3.8) {
            out.dash = 1.55;
            out.lean = 0.22;
        } else if (anim === 'stomp' && d <= 2.8) {
            out.dash = 1.7;
            out.lean = 0.28;
        }
        if ((anim === 'skitter' || kind === 'spider') && o.blocked && Number(o.playerAbove) > 0.8) {
            out.climb = 0.85;
            out.dash = Math.max(out.dash, 1.2);
        }
        if (kind === 'vex' && d >= 1.4 && d <= 7) {
            out.dash = 2.35;
        }
        if (kind === 'phantom' && d >= 2 && d <= 8) {
            out.dash = Math.max(out.dash, 1.45);
            out.lift = -0.55;
        }
        return out;
    }

    function inflateScale(kind, dist) {
        if (kind !== 'pufferfish') return 1;
        return swellScale(dist, 1.5, 4);
    }

    function deathBurstOf(kind) {
        const row = MONSTERS[kind] || {};
        const color = row.color || 0xc8b48a;
        if (kind === 'slime' || kind === 'magma' || kind === 'cube') {
            return { count: 18, ring: true, color: color };
        }
        if (kind === 'creeper') return { count: 20, ring: true, color: 0x6fbf45 };
        if (kind === 'ghast' || kind === 'blaze' || kind === 'fire_spirit') {
            return { count: 16, ring: false, color: color };
        }
        if (kind === 'warden') return { count: 16, ring: true, color: 0x2a6a78 };
        return { count: 12, ring: false, color: color };
    }

    function strafeStep(kind, extra) {
        const o = extra || {};
        if (signatureOf(kind).anim !== 'aim' || !o.aggro) return { sx: 0, sz: 0 };
        const d = Number(o.dist);
        if (!(d >= 2.2) || d > 8.5) return { sx: 0, sz: 0 };
        const dx = Number(o.dx) || 0;
        const dz = Number(o.dz) || 1;
        const len = Math.hypot(dx, dz) || 1;
        const side = Math.cos((Number(o.t) || 0) * 1.6) * 1.6;
        return { sx: (-dz / len) * side, sz: (dx / len) * side };
    }

    function retreatStep(kind, extra) {
        const o = extra || {};
        const sig = signatureOf(kind);
        const ranged = sig.anim === 'aim' || sig.shot === 'fire' || kind === 'guardian';
        if (!o.aggro || !ranged) return { sx: 0, sz: 0 };
        const d = Number(o.dist);
        if (!(d >= 0) || d >= 3.8) return { sx: 0, sz: 0 };
        const dx = Number(o.dx) || 0;
        const dz = Number(o.dz) || 1;
        const len = Math.hypot(dx, dz) || 1;
        return { sx: -(dx / len) * 1.8, sz: -(dz / len) * 1.8 };
    }

    function splitChildOf(kind, gen) {
        const g = Number(gen) || 0;
        if ((kind !== 'slime' && kind !== 'magma' && kind !== 'cube') || g >= 1) return null;
        return { kind: kind, gen: g + 1, hpScale: 0.45, size: 0.55, count: 2 };
    }

    function sipHeal(kind, hp, maxHp) {
        if (kind !== 'witch') return 0;
        const h = Number(hp);
        const m = Number(maxHp);
        if (!(m > 0) || h >= m * 0.55) return 0;
        return Math.min(4, Math.ceil(m * 0.12));
    }

    function lookBlink(kind, looking) {
        return !!looking && kind === 'enderman';
    }

    function fleeStep(kind, extra) {
        const o = extra || {};
        if ((kind !== 'villager' && !isFarmAnimal(kind)) || !o.threat) return { sx: 0, sz: 0 };
        const d = Number(o.dist);
        if (!(d >= 0) || d >= 6.5) return { sx: 0, sz: 0 };
        const dx = Number(o.dx) || 0;
        const dz = Number(o.dz) || 1;
        const len = Math.hypot(dx, dz) || 1;
        const spd = isFarmAnimal(kind) ? 1.85 : 1.6;
        return { sx: -(dx / len) * spd, sz: -(dz / len) * spd };
    }

    function stingDive(kind, extra) {
        const o = extra || {};
        if (kind !== 'bee' || !o.angry) return { sx: 0, sz: 0 };
        const d = Number(o.dist);
        if (!(d >= 0) || d > 6) return { sx: 0, sz: 0 };
        const dx = Number(o.dx) || 0;
        const dz = Number(o.dz) || 1;
        const len = Math.hypot(dx, dz) || 1;
        return { sx: (dx / len) * 2.1, sz: (dz / len) * 2.1 };
    }

    function burrowStep(kind, extra) {
        const o = extra || {};
        if (kind !== 'sculk_worm' || !o.aggro) {
            return { sx: 0, sz: 0, lift: 0, hidden: false };
        }
        const d = Number(o.dist);
        if (!(d >= 1.4) || d > 9) return { sx: 0, sz: 0, lift: 0, hidden: false };
        const phase = ((Number(o.t) || 0) % 2.4) / 2.4;
        const dx = Number(o.dx) || 0;
        const dz = Number(o.dz) || 1;
        const len = Math.hypot(dx, dz) || 1;
        if (phase < 0.35) return { sx: 0, sz: 0, lift: -0.95, hidden: true };
        if (phase < 0.7) {
            return { sx: (dx / len) * 2.4, sz: (dz / len) * 2.4, lift: -1.15, hidden: true };
        }
        return { sx: (dx / len) * 1.2, sz: (dz / len) * 1.2, lift: 0.15, hidden: false };
    }

    function homeStep(kind, extra) {
        const o = extra || {};
        if (kind !== 'villager' || !o.threat) return { sx: 0, sz: 0 };
        const td = Number(o.dist);
        if (!(td >= 0) || td >= 8) return { sx: 0, sz: 0 };
        const hx = Number(o.homeX) - Number(o.x);
        const hz = Number(o.homeZ) - Number(o.z);
        const len = Math.hypot(hx, hz) || 0;
        if (len < 0.35) return { sx: 0, sz: 0 };
        return { sx: (hx / len) * 1.9, sz: (hz / len) * 1.9 };
    }

    function goldPeace(kind, extra) {
        return kind === 'piglin' && Number(extra && extra.gold) > 0;
    }

    function canEnterHouse(kind) {
        return kind === 'zombie' || kind === 'husk';
    }

    function phaseGhost(kind) {
        return kind === 'vex';
    }

    function barterOf(kind, extra) {
        const o = extra || {};
        if (kind !== 'piglin' || !(Number(o.gold) > 0)) return null;
        const pool = ['ender-pearl', 'magma-cream', 'string', 'glow-dust', 'cobble', 'ember-core'];
        const salt = Math.abs(Math.floor(Number(o.salt) || 0));
        return { take: 'gold-nugget', give: pool[salt % pool.length] };
    }

    function dayCalm(kind, extra) {
        return kind === 'spider' && !!(extra && extra.exposed);
    }

    function heatMelt(kind, extra) {
        if (kind !== 'snowgolem') return false;
        const o = extra || {};
        if (o.wet) return true;
        const c = o.climate;
        return c === 'desert' || c === 'nether' || c === 'volcano';
    }

    function layEgg(kind, extra) {
        if (kind !== 'chicken') return false;
        const t = Number(extra && extra.t) || 0;
        const last = Number(extra && extra.lastAt) || 0;
        return t - last >= 12;
    }

    function waterBlink(kind, extra) {
        return kind === 'enderman' && !!(extra && extra.wet);
    }

    function thornTouch(kind, extra) {
        return kind === 'guardian' && !!(extra && extra.melee);
    }

    function grazeOf(kind, extra) {
        if (kind !== 'sheep') return false;
        const t = Number(extra && extra.t) || 0;
        const last = Number(extra && extra.lastAt) || 0;
        return t - last >= 8;
    }

    function sunBurn(kind, extra) {
        return kind === 'zombie' && !!(extra && extra.exposed);
    }

    function sporePuff(kind, dist) {
        return kind === 'spore_bug' && Number(dist) >= 0 && Number(dist) < 2.2;
    }

    function shadowLunge(kind, extra) {
        const o = extra || {};
        if (kind !== 'shadow_stalker' || !o.wasFar) return { dash: 1 };
        const d = Number(o.dist);
        if (!(d >= 0) || d > 3.2) return { dash: 1 };
        return { dash: 2.1 };
    }

    function packHunt(kind, extra) {
        const o = extra || {};
        if (kind !== 'wolf' || !o.ally) return { sx: 0, sz: 0 };
        const d = Number(o.dist);
        if (!(d >= 1.2) || d > 8) return { sx: 0, sz: 0 };
        const dx = Number(o.dx) || 0;
        const dz = Number(o.dz) || 1;
        const len = Math.hypot(dx, dz) || 1;
        return { sx: (dx / len) * 1.7, sz: (dz / len) * 1.7 };
    }

    function chargeGlow(kind, now, lastAt) {
        if (kind !== 'guardian' && kind !== 'ghast') return 0;
        const gap = signatureOf(kind).intervalMs || 2600;
        const last = Number(lastAt) || 0;
        const t = Number(now) || 0;
        const elapsed = last <= 0 ? gap : t - last;
        const remain = gap - elapsed;
        if (remain > 900 || remain < 0) return 0;
        return 1 - remain / 900;
    }

    function behaviorSpeedScale(behavior) {
        if (behavior === 'ranged') return 0.72;
        if (behavior === 'shield') return 0.55;
        if (behavior === 'summon') return 0.8;
        return 1;
    }

    function torchSlow(opts) {
        const o = opts || {};
        if (o.hasTorch && o.inCave) return 0.6;
        return 1;
    }

    function tickAggro(wasAggro, dist, enter, exit) {
        const on = Number(enter) > 0 ? Number(enter) : AGGRO_ENTER;
        const off = Number(exit) > 0 ? Number(exit) : AGGRO_EXIT;
        const d = Number(dist);
        if (!(d >= 0)) return !!wasAggro;
        if (d <= on) return true;
        if (d >= off) return false;
        return !!wasAggro;
    }

    function behaviorStopRange(behavior, contact) {
        const base = Number(contact) > 0 ? Number(contact) : CONTACT_RANGE;
        if (behavior === 'ranged') return Math.max(base, 4.2);
        if (behavior === 'shield') return Math.max(base, 2.2);
        return Math.max(base, CONTACT_RANGE);
    }

    function critMultiplier(opts) {
        const o = opts || {};
        if (!o.answered || !o.correct) return 1;
        const combo = Math.max(0, Number(o.combo) || 0);
        return combo >= 3 ? CRIT_MULT + 1 : CRIT_MULT;
    }

    function channelMultiplier(channel) {
        if (channel === 'choice') return 2;
        if (channel === 'spell' || channel === 'speak') return 3;
        if (channel === 'combo') return 4;
        return 1;
    }

    function damage(opts) {
        const o = opts || {};
        const base = o.kind === 'bolt' ? BASE_BOLT : BASE_MELEE;
        return base * critMultiplier(o);
    }

    function breathDamage(opts) {
        const o = opts || {};
        const base = Number(o.base) > 0 ? Number(o.base) : BASE_BREATH;
        if (o.correct === false) return base;
        if (o.correct === true) return base * 2;
        const now = Number(o.now) || 0;
        const wordAt = Number(o.wordAt) || 0;
        const windowMs = Number(o.windowMs) > 0 ? Number(o.windowMs) : BREATH_WORD_WINDOW_MS;
        if (wordAt > 0 && now - wordAt >= 0 && now - wordAt <= windowMs) return base * 2;
        return base;
    }

    function nextCombo(opts) {
        const o = opts || {};
        if (!o.answered || !o.correct) return 0;
        return (Math.max(0, Number(o.combo) || 0)) + 1;
    }

    function cooldownOf(kind) {
        return kind === 'bolt' ? BOLT_COOLDOWN_MS : MELEE_COOLDOWN_MS;
    }

    function canAttack(opts) {
        const o = opts || {};
        const last = Number(o.lastAt) || 0;
        if (last <= 0) return true;
        const now = Number(o.now) || 0;
        return now - last >= cooldownOf(o.kind);
    }

    function monsterOf(kind) {
        const row = MONSTERS[kind] || MONSTERS.slime;
        return {
            kind: row.kind,
            hp: row.hp,
            coins: row.coins,
            contact: row.contact,
            speed: row.speed,
            loot: row.loot,
            color: row.color,
            hitRadius: row.hitRadius || 0.45
        };
    }

    function emptyBag() {
        return {};
    }

    function addLoot(bag, item, n) {
        const next = Object.assign({}, bag || {});
        const key = String(item || '');
        if (!key) return next;
        next[key] = (Number(next[key]) || 0) + (Number(n) || 0);
        return next;
    }

    function pickupCoins(current, amount) {
        return (Number(current) || 0) + (Number(amount) || 0);
    }

    function forwardXZ(yaw) {
        return { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    }

    function waveOffsets(yaw, n) {
        const f = forwardXZ(yaw);
        const right = { x: -f.z, z: f.x };
        const rings = [
            { dist: 12, angle: 0 },
            { dist: 14, angle: -0.42 },
            { dist: 14, angle: 0.42 },
            { dist: 22, angle: 1.15 },
            { dist: 22, angle: -1.15 },
            { dist: 30, angle: 2.15 },
            { dist: 30, angle: -2.15 },
            { dist: 38, angle: 3.14 },
            { dist: 26, angle: 1.7 },
            { dist: 26, angle: -1.7 }
        ];
        const count = Math.max(1, Number(n) || 3);
        return rings.slice(0, count).map(function (r) {
            const c = Math.cos(r.angle);
            const s = Math.sin(r.angle);
            return {
                dx: (f.x * c + right.x * s) * r.dist,
                dz: (f.z * c + right.z * s) * r.dist
            };
        });
    }

    function aimAction(opts) {
        const o = opts || {};
        const range = Number(o.meleeRange) || MELEE_RANGE;
        const lookDist = o.lookDist == null ? Infinity : Number(o.lookDist);
        if (o.inMelee || (o.lookMob && lookDist <= range + 0.2)) return 'melee';
        if (o.mining && o.hasBlock) return 'mine';
        return 'none';
    }

    function aimPoint(mob) {
        const m = mob || {};
        const h = Number(m.height) || 1.6;
        return {
            x: Number(m.x) || 0,
            y: (Number(m.y) || 0) + h * 0.55,
            z: Number(m.z) || 0
        };
    }

    function inMeleeArc(player, yaw, target) {
        const dx = target.x - player.x;
        const dz = target.z - player.z;
        const dist = Math.hypot(dx, dz);
        const pad = Number(target.hitRadius) || 0;
        if (dist > MELEE_RANGE + pad) return false;
        if (dist < 0.05 || dist <= pad + 0.35) return true;
        const f = forwardXZ(yaw);
        const dot = (dx * f.x + dz * f.z) / dist;
        return Math.acos(Math.max(-1, Math.min(1, dot))) <= MELEE_ARC;
    }

    function nearestMonster(origin, monsters) {
        let best = null;
        let bestD = Infinity;
        (monsters || []).forEach(function (m) {
            if (!m || (Number(m.hp) || 0) <= 0) return;
            const d = Math.hypot(m.x - origin.x, m.z - origin.z);
            if (d < bestD) {
                bestD = d;
                best = m;
            }
        });
        return best;
    }

    function steerBolt(bolt, target, dt) {
        const next = {
            x: bolt.x, z: bolt.z,
            vx: bolt.vx, vz: bolt.vz
        };
        if (!target) return next;
        const dx = target.x - bolt.x;
        const dz = target.z - bolt.z;
        const dist = Math.hypot(dx, dz) || 1;
        const wantX = dx / dist * BOLT_SPEED;
        const wantZ = dz / dist * BOLT_SPEED;
        const maxTurn = BOLT_TURN * (Number(dt) || 0);
        const curAng = Math.atan2(bolt.vx, bolt.vz);
        const wantAng = Math.atan2(wantX, wantZ);
        let diff = wantAng - curAng;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const ang = curAng + Math.max(-maxTurn, Math.min(maxTurn, diff));
        next.vx = Math.sin(ang) * BOLT_SPEED;
        next.vz = Math.cos(ang) * BOLT_SPEED;
        next.x = bolt.x + next.vx * (Number(dt) || 0);
        next.z = bolt.z + next.vz * (Number(dt) || 0);
        return next;
    }

    function canTouch(player, monster, opts) {
        const o = opts || {};
        const range = Number(o.range) || CONTACT_RANGE;
        const dist = Math.hypot((player.x || 0) - (monster.x || 0), (player.z || 0) - (monster.z || 0));
        if (dist > range) return false;
        if (o.playerSheltered && !o.mobSheltered) return false;
        if (o.wallBetween) return false;
        return true;
    }

    function applyContact(player, monster, now) {
        const hp = Number(player && player.hp) || 0;
        const last = Number(player && player.lastHitAt) || 0;
        const t = Number(now) || 0;
        if (last > 0 && t - last < INVINCIBLE_MS) {
            return { hit: false, hp: hp, lastHitAt: last };
        }
        const dmg = Math.max(1, Number(monster && monster.contact) || 1);
        return { hit: true, hp: Math.max(0, hp - dmg), lastHitAt: t };
    }

    function applyHit(hp, amount) {
        const next = Math.max(0, (Number(hp) || 0) - (Number(amount) || 0));
        return { hp: next, dead: next <= 0 };
    }

    global.BlockLegendCombat = {
        CRIT_MULT: CRIT_MULT,
        BASE_MELEE: BASE_MELEE,
        BASE_BOLT: BASE_BOLT,
        MELEE_COOLDOWN_MS: MELEE_COOLDOWN_MS,
        BOLT_COOLDOWN_MS: BOLT_COOLDOWN_MS,
        INVINCIBLE_MS: INVINCIBLE_MS,
        MELEE_RANGE: MELEE_RANGE,
        MELEE_ARC: MELEE_ARC,
        BOLT_SPEED: BOLT_SPEED,
        BOLT_TURN: BOLT_TURN,
        BOLT_LIFE: BOLT_LIFE,
        CONTACT_RANGE: CONTACT_RANGE,
        AGGRO_ENTER: AGGRO_ENTER,
        AGGRO_EXIT: AGGRO_EXIT,
        tickAggro: tickAggro,
        MONSTERS: MONSTERS,
        MONSTER_KINDS: MONSTER_KINDS,
        ANIMALS: ANIMALS,
        WILD_ANIMALS: WILD_ANIMALS,
        isFarmAnimal: isFarmAnimal,
        animalOf: animalOf,
        worldAnimalOf: worldAnimalOf,
        animalLoot: animalLoot,
        animalBodyRadius: animalBodyRadius,
        bonusBuildDrop: bonusBuildDrop,
        behaviorOf: behaviorOf,
        locomotionOf: locomotionOf,
        stanceAltitude: stanceAltitude,
        signatureOf: signatureOf,
        canFireSkill: canFireSkill,
        swellScale: swellScale,
        blinkOffset: blinkOffset,
        poseStep: poseStep,
        inflateScale: inflateScale,
        deathBurstOf: deathBurstOf,
        strafeStep: strafeStep,
        chargeGlow: chargeGlow,
        retreatStep: retreatStep,
        splitChildOf: splitChildOf,
        sipHeal: sipHeal,
        lookBlink: lookBlink,
        fleeStep: fleeStep,
        packHunt: packHunt,
        stingDive: stingDive,
        burrowStep: burrowStep,
        homeStep: homeStep,
        goldPeace: goldPeace,
        canEnterHouse: canEnterHouse,
        phaseGhost: phaseGhost,
        barterOf: barterOf,
        dayCalm: dayCalm,
        heatMelt: heatMelt,
        layEgg: layEgg,
        waterBlink: waterBlink,
        thornTouch: thornTouch,
        grazeOf: grazeOf,
        sunBurn: sunBurn,
        sporePuff: sporePuff,
        shadowLunge: shadowLunge,
        behaviorSpeedScale: behaviorSpeedScale,
        behaviorStopRange: behaviorStopRange,
        torchSlow: torchSlow,
        critMultiplier: critMultiplier,
        channelMultiplier: channelMultiplier,
        damage: damage,
        breathDamage: breathDamage,
        BASE_BREATH: BASE_BREATH,
        BREATH_WORD_WINDOW_MS: BREATH_WORD_WINDOW_MS,
        nextCombo: nextCombo,
        canAttack: canAttack,
        cooldownOf: cooldownOf,
        monsterOf: monsterOf,
        emptyBag: emptyBag,
        addLoot: addLoot,
        pickupCoins: pickupCoins,
        forwardXZ: forwardXZ,
        waveOffsets: waveOffsets,
        aimAction: aimAction,
        aimPoint: aimPoint,
        inMeleeArc: inMeleeArc,
        nearestMonster: nearestMonster,
        steerBolt: steerBolt,
        canTouch: canTouch,
        applyContact: applyContact,
        applyHit: applyHit
    };
}(typeof window !== 'undefined' ? window : globalThis));
