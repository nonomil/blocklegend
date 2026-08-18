/**
 * blocklegend · 关卡与 Boss 纯函数（T20260815-blocklegend-3d S4）
 */
(function (global) {
    'use strict';

    const UNLOCK_COST = [0, 50, 150, 300, 500, 800, 1100, 1500, 2000, 2600, 3300, 4200];
    const SUN_PER_LEVEL = 8;
    const SHIELD_REDUCE = 0.5;
    const BROKEN_MS = 8000;
    const LEVEL_TOTAL = 12;

    const LEVELS = [
        {
            level: 1, waves: 5, bossHp: 80, bossShield: 3, climate: 'plains', worldSeed: 7,
            bossId: 'wither', bossMechanic: 'speak-break', missionType: 'chop-craft-fight',
            waveKinds: ['slime', 'cube', 'creeper'], targetWords: 50, reviewRatio: 0.2,
            wordThemes: ['颜色', '自然', '物品', '动物'],
            climateWords: ['sun'],
            focusWords: ['tree', 'sword', 'slime', 'apple', 'jump', 'sun', 'flower', 'run', 'bed', 'home', 'teacher'],
            unlock: { coins: 0, recallWords: 0 }
        },
        {
            level: 2, waves: 4, bossHp: 110, bossShield: 4, climate: 'forest', worldSeed: 21,
            bossId: 'mirror-fox', bossMechanic: 'direction-callout', missionType: 'find-and-guide',
            waveKinds: ['slime', 'fox', 'creeper', 'spider'], targetWords: 50, reviewRatio: 0.4,
            wordThemes: ['动物', '自然', '方位'],
            climateWords: ['fox', 'right', 'flower'],
            focusWords: ['fox', 'flower', 'right', 'behind', 'tree', 'spider'],
            unlock: { coins: 50, recallWords: 5 }
        },
        {
            level: 3, waves: 4, bossHp: 140, bossShield: 4, climate: 'desert', worldSeed: 33,
            bossId: 'key-guardian', bossMechanic: 'spell-key', missionType: 'collect-key',
            waveKinds: ['zombie', 'husk', 'drowned', 'ravager', 'pillager'], targetWords: 50, reviewRatio: 0.4,
            wordThemes: ['物品', '自然', '动作'],
            climateWords: ['hot', 'warm', 'wind'],
            focusWords: ['sand', 'stone', 'key', 'door', 'chest', 'open', 'husk', 'pillager'],
            unlock: { coins: 150, recallWords: 5 }
        },
        {
            level: 4, waves: 4, bossHp: 170, bossShield: 5, climate: 'snow', worldSeed: 47,
            bossId: 'night-phantom', bossMechanic: 'action-potion', missionType: 'night-escort',
            waveKinds: ['skeleton', 'enderman', 'phantom', 'vex', 'shadow_stalker', 'snowgolem'], targetWords: 50, reviewRatio: 0.5,
            wordThemes: ['动作', '生活', '动物'],
            climateWords: ['night', 'moon', 'snow', 'cold', 'white'],
            focusWords: ['run', 'jump', 'torch', 'night', 'wolf', 'help', 'snow', 'phantom', 'shadow stalker', 'snow golem'],
            unlock: { coins: 300, recallWords: 5 }
        },
        {
            level: 5, waves: 4, bossHp: 200, bossShield: 5, climate: 'deep_dark', worldSeed: 59,
            bossId: 'warden', bossMechanic: 'listen-pair', missionType: 'deep-listen',
            waveKinds: ['spider', 'witch', 'shulker', 'warden', 'golem', 'sculk_worm'], targetWords: 50, reviewRatio: 0.5,
            wordThemes: ['描述', '颜色', '自然'],
            climateWords: ['black', 'light'],
            focusWords: ['black', 'light', 'blue', 'red', 'shulker', 'sculk worm'],
            unlock: { coins: 500, recallWords: 5 }
        },
        {
            level: 6, waves: 5, bossHp: 240, bossShield: 6, climate: 'nether', worldSeed: 71,
            bossId: 'ghast', bossMechanic: 'review-route', missionType: 'mixed-review',
            waveKinds: ['magma', 'piglin', 'ghast', 'blaze', 'fire_spirit'], targetWords: 50, reviewRatio: 0.7,
            wordThemes: ['高频词', '动物', '物品'],
            climateWords: ['red', 'open'],
            focusWords: ['fire', 'gold', 'hot', 'dark', 'run', 'help', 'door', 'key', 'fire spirit'],
            unlock: { coins: 800, recallWords: 5 }
        },
        {
            level: 7, waves: 4, bossHp: 260, bossShield: 6, climate: 'quarry', worldSeed: 83,
            bossId: 'ravager', bossMechanic: 'speak-break', missionType: 'quarry-dig',
            waveKinds: ['husk', 'creeper', 'golem', 'spider', 'pillager'], targetWords: 50, reviewRatio: 0.5,
            wordThemes: ['动物', '自然', '物品'],
            climateWords: ['door'],
            focusWords: ['stone', 'dark', 'spider', 'run', 'help'],
            unlock: { coins: 1100, recallWords: 6 }
        },
        {
            level: 8, waves: 4, bossHp: 280, bossShield: 6, climate: 'astral', worldSeed: 97,
            bossId: 'storm', bossMechanic: 'listen-pair', missionType: 'star-trail',
            waveKinds: ['phantom', 'vex', 'skeleton', 'husk'], targetWords: 50, reviewRatio: 0.55,
            wordThemes: ['自然', '描述', '动作'],
            climateWords: ['star', 'cloud'],
            focusWords: ['star', 'cloud', 'run', 'help'],
            unlock: { coins: 1500, recallWords: 6 }
        },
        {
            level: 9, waves: 5, bossHp: 300, bossShield: 7, climate: 'ocean', worldSeed: 111,
            bossId: 'key-guardian', bossMechanic: 'spell-key', missionType: 'tide-collect',
            waveKinds: ['drowned', 'guardian', 'pufferfish', 'vex'], targetWords: 50, reviewRatio: 0.55,
            wordThemes: ['自然', '物品', '动作'],
            climateWords: ['water', 'fish', 'boat', 'swim'],
            focusWords: ['water', 'fish', 'boat', 'swim', 'blue', 'open'],
            unlock: { coins: 2000, recallWords: 7 }
        },
        {
            level: 10, waves: 4, bossHp: 320, bossShield: 7, climate: 'crystal', worldSeed: 127,
            bossId: 'mirror-fox', bossMechanic: 'direction-callout', missionType: 'spore-guide',
            waveKinds: ['slime', 'cube', 'spider', 'witch', 'spore_bug'], targetWords: 50, reviewRatio: 0.6,
            wordThemes: ['颜色', '自然', '动物'],
            climateWords: ['jump', 'green'],
            focusWords: ['green', 'jump', 'right', 'spore bug'],
            unlock: { coins: 2600, recallWords: 7 }
        },
        {
            level: 11, waves: 5, bossHp: 340, bossShield: 7, climate: 'volcano', worldSeed: 141,
            bossId: 'blaze', bossMechanic: 'review-route', missionType: 'lava-review',
            waveKinds: ['magma', 'blaze', 'ghast', 'creeper', 'fire_spirit'], targetWords: 50, reviewRatio: 0.65,
            wordThemes: ['高频词', '描述', '物品'],
            climateWords: ['help'],
            focusWords: ['hot', 'fire', 'rock', 'dark', 'run', 'help', 'fire spirit'],
            unlock: { coins: 3300, recallWords: 8 }
        },
        {
            level: 12, waves: 5, bossHp: 380, bossShield: 8, climate: 'end', worldSeed: 157,
            bossId: 'dragon', bossMechanic: 'action-potion', missionType: 'end-ascent',
            waveKinds: ['enderman', 'shulker', 'phantom', 'warden', 'sculk_worm'], targetWords: 50, reviewRatio: 0.7,
            wordThemes: ['动作', '描述', '高频词'],
            climateWords: ['cool'],
            focusWords: ['dark', 'jump', 'end', 'hard', 'help', 'light', 'sculk worm'],
            unlock: { coins: 4200, recallWords: 8 }
        }
    ];

    function cloneBoss(boss) {
        return Object.assign({}, boss);
    }

    function levelOf(n) {
        return LEVELS[Math.max(0, Math.min(LEVEL_TOTAL, Number(n) || 1) - 1)];
    }

    function eventKey(n) {
        return 'level-' + Number(n);
    }

    function bossModelOf(id) {
        if (id === 'dragon') return 'dragon';
        if (id === 'storm') return 'storm';
        if (id === 'mirror-fox') return 'fox';
        if (id === 'key-guardian') return 'guardian';
        if (id === 'night-phantom') return 'phantom';
        if (id === 'warden' || id === 'ghast' || id === 'ravager' || id === 'blaze') return id;
        return 'boss';
    }

    function bossTitle(id) {
        if (id === 'dragon') return '末影龙';
        if (id === 'storm') return '凋灵风暴';
        if (id === 'mirror-fox') return '镜子狐狸';
        if (id === 'key-guardian') return '钥匙守卫';
        if (id === 'warden') return '监守者';
        if (id === 'ghast') return '恶魂';
        if (id === 'ravager') return '劫掠兽';
        if (id === 'blaze') return '烈焰人';
        if (id === 'night-phantom') return '幻翼';
        return '凋灵';
    }

    function bossSpawnKind(id) {
        const model = bossModelOf(id);
        if (model === 'boss' || model === 'dragon' || model === 'storm' || model === 'wither') return 'husk';
        return model;
    }

    const FIRST_WAVE_COUNT = 6;

    function firstWaveKinds(n) {
        const cfg = levelOf(n);
        const raw = (!cfg || cfg.level <= 1)
            ? ['slime']
            : (cfg.waveKinds || ['slime']).filter(Boolean);
        const kinds = raw.length ? raw : ['slime'];
        const out = [];
        for (let i = 0; i < FIRST_WAVE_COUNT; i += 1) out.push(kinds[i % kinds.length]);
        return out;
    }

    const BOSS_KITS = {
        wither: {
            thresholds: [0.6, 0.2],
            skills: [
                { id: 'skull_shot', intervalMs: 2800, count: 1, label: '黑球' },
                { id: 'fan_shot', intervalMs: 2000, count: 3, label: '扇形黑球' },
                { id: 'track_shot', intervalMs: 1400, count: 4, label: '追踪弹' }
            ]
        },
        ghast: {
            thresholds: [0.5, 0.2],
            skills: [
                { id: 'fireball', intervalMs: 2600, count: 1, label: '火球' },
                { id: 'rush', intervalMs: 3200, count: 1, label: '突进' },
                { id: 'fireball', intervalMs: 1200, count: 3, label: '连发火球' }
            ],
            cryHits: 10
        },
        blaze: {
            thresholds: [0.7, 0.5],
            minion: 'blaze',
            skills: [
                { id: 'fireball', intervalMs: 2400, count: 3, label: '三连火球' },
                { id: 'slam', intervalMs: 3600, count: 1, label: '火焰旋风' },
                { id: 'summon', intervalMs: 8000, count: 2, label: '召小烈焰' }
            ]
        },
        warden: {
            thresholds: [0.65, 0.35],
            skills: [
                { id: 'slam', intervalMs: 3000, count: 1, label: '砸地' },
                { id: 'sonic', intervalMs: 2400, count: 1, label: '音波' },
                { id: 'sonic', intervalMs: 1600, count: 2, label: '暗脉冲' }
            ]
        },
        ravager: {
            thresholds: [0.7, 0.34],
            skills: [
                { id: 'charge', intervalMs: 2800, count: 1, label: '跟踪' },
                { id: 'charge', intervalMs: 2200, count: 1, label: '冲撞' },
                { id: 'stomp', intervalMs: 1800, count: 1, label: '践踏' }
            ]
        },
        dragon: {
            thresholds: [0.66, 0.33],
            skills: [
                { id: 'skull_shot', intervalMs: 2600, count: 1, label: '绕飞吐息' },
                { id: 'dive', intervalMs: 3000, count: 1, label: '俯冲' },
                { id: 'fan_shot', intervalMs: 1400, count: 3, label: '狂暴吐息' }
            ]
        },
        storm: {
            thresholds: [0.55, 0.25],
            skills: [
                { id: 'skull_shot', intervalMs: 2400, count: 1, label: '电弧' },
                { id: 'fan_shot', intervalMs: 1800, count: 3, label: '落雷扇' },
                { id: 'track_shot', intervalMs: 1200, count: 3, label: '连雷' }
            ]
        },
        'key-guardian': {
            thresholds: [0.6, 0.3],
            skills: [
                { id: 'sonic', intervalMs: 2600, count: 1, label: '蓄激光' },
                { id: 'sonic', intervalMs: 1800, count: 2, label: '激光' },
                { id: 'fan_shot', intervalMs: 1600, count: 3, label: '刺射' }
            ]
        },
        'mirror-fox': {
            thresholds: [0.6, 0.3],
            skills: [
                { id: 'charge', intervalMs: 2600, count: 1, label: '绕扑' },
                { id: 'rush', intervalMs: 2000, count: 1, label: '闪身' },
                { id: 'charge', intervalMs: 1400, count: 1, label: '连扑' }
            ]
        },
        'night-phantom': {
            thresholds: [0.6, 0.3],
            skills: [
                { id: 'dive', intervalMs: 2600, count: 1, label: '俯冲' },
                { id: 'fan_shot', intervalMs: 2000, count: 3, label: '夜息扇' },
                { id: 'track_shot', intervalMs: 1400, count: 3, label: '追踪翼' }
            ]
        }
    };

    function kitOf(id) {
        return BOSS_KITS[id] || BOSS_KITS.wither;
    }

    const BOSS_FORMS = {
        wither: { glow: [0xf4f4f4, 0xff3a3a, 0xffd24a], scale: [1, 1.12, 1.26] },
        ghast: { glow: [0x88c8ff, 0xff7a20, 0xff3a10], scale: [1, 1.08, 1.18] },
        blaze: { glow: [0xffc04a, 0xff7a20, 0xfff0a0], scale: [1, 1.1, 1.2] },
        warden: { glow: [0x2a6a78, 0x3ad4e0, 0xe8ffff], scale: [1, 1.1, 1.22] },
        ravager: { glow: [0x6a5a48, 0xc47a3a, 0xe8a060], scale: [1, 1.08, 1.16] },
        dragon: { glow: [0x6a2a88, 0xaa00ff, 0xff66cc], scale: [1, 1.1, 1.2] },
        storm: { glow: [0xaa00ff, 0xcc66ff, 0xfff0a0], scale: [1, 1.1, 1.24] },
        fox: { glow: [0xe07a28, 0xffb060, 0xfff0c8], scale: [1, 1.06, 1.14] },
        guardian: { glow: [0x4aa090, 0xffe060, 0xfff6a0], scale: [1, 1.08, 1.16] },
        phantom: { glow: [0x3a4a78, 0x6a80c8, 0xc8d8ff], scale: [1, 1.12, 1.22] }
    };

    function formIdOf(id) {
        if (id === 'key-guardian') return 'guardian';
        if (id === 'mirror-fox') return 'fox';
        if (id === 'night-phantom') return 'phantom';
        return id || 'wither';
    }

    function bossFormOf(id, phase) {
        const row = BOSS_FORMS[formIdOf(id)] || BOSS_FORMS.wither;
        const i = Math.max(0, Math.min(2, (Number(phase) || 1) - 1));
        return { id: formIdOf(id), glow: row.glow[i], scale: row.scale[i], phase: i + 1 };
    }

    function hpPhase(hp, maxHp, thresholds) {
        const pct = (Number(hp) || 0) / Math.max(1, Number(maxHp) || 1);
        const t = thresholds || [0.6, 0.2];
        if (pct <= t[1]) return 3;
        if (pct <= t[0]) return 2;
        return 1;
    }

    function nextBossAction(boss, opts) {
        const o = opts || {};
        const b = boss || {};
        const kit = kitOf(b.id);
        const phase = hpPhase(b.hp, b.maxHp, kit.thresholds);
        const skill = kit.skills[phase - 1] || kit.skills[0];
        const now = Number(o.now) || 0;
        const last = Number(o.lastAt) || 0;
        const crying = !!(o.cryUntil && now < o.cryUntil);
        if (crying) return { ready: false, phase: phase, skill: 'cry', label: '哭泣', kit: kit };
        const slow = b.state === 'shielded' ? 1.6 : 1;
        const wait = (Number(skill.intervalMs) || 2400) * slow;
        if (now - last < wait) return { ready: false, phase: phase, skill: skill.id, label: skill.label, kit: kit };
        return {
            ready: true,
            phase: phase,
            skill: skill.id,
            count: Number(skill.count) || 1,
            label: skill.label,
            minion: kit.minion || '',
            kit: kit
        };
    }

    function bossSkillFx(skill, phase, bossId) {
        const p = Math.max(1, Math.min(3, Number(phase) || 1));
        const id = formIdOf(bossId);
        if (skill === 'charge' || skill === 'rush' || skill === 'dive') {
            return {
                kind: 'dash',
                color: skill === 'dive' ? 0xaa00ff : (id === 'fox' ? 0xe07a28 : 0xc47a3a),
                dashMs: 640 + p * 220,
                lean: skill === 'dive' ? 'down' : 'forward',
                burst: 6 + p * 4
            };
        }
        if (skill === 'slam' || skill === 'stomp') {
            return {
                kind: 'ring',
                color: skill === 'stomp' ? 0xc47a3a : (id === 'warden' ? 0x3ad4e0 : 0xff7a20),
                radius: 1.8 + p * 0.55,
                grow: 3.2 + p * 1.1,
                burst: 8 + p * 4,
                lean: 'up'
            };
        }
        if (skill === 'summon') {
            return { kind: 'summon', color: 0xffc04a, burst: 14, lean: 'spin' };
        }
        if (skill === 'sonic') {
            return { kind: 'shot', shot: 'sonic', color: 0x4ad4e0, halo: 0x1a6a70, track: p >= 3, lean: 'forward', ring: p >= 2 };
        }
        if (skill === 'fireball') {
            return { kind: 'shot', shot: 'fire', color: 0xff7a20, halo: 0xffc04a, track: false, lean: 'forward' };
        }
        if (skill === 'track_shot') {
            return { kind: 'shot', shot: id === 'storm' ? 'bolt' : 'skull', color: id === 'storm' ? 0xfff0a0 : 0x2a1a2a, halo: 0xffd24a, track: true, lean: 'spin' };
        }
        if (skill === 'fan_shot') {
            return { kind: 'shot', shot: id === 'storm' || id === 'dragon' ? 'bolt' : 'skull', color: id === 'storm' ? 0xaa00ff : 0x1a1a1e, halo: 0xff3a3a, track: false, lean: 'forward' };
        }
        return { kind: 'shot', shot: 'skull', color: 0x1a1a1e, halo: 0xf4f4f4, track: false, lean: 'forward' };
    }

    function bossFormLine(boss) {
        const b = boss || {};
        const kit = kitOf(b.id);
        const phase = hpPhase(b.hp, b.maxHp, kit.thresholds);
        const skill = kit.skills[phase - 1] || kit.skills[0];
        return '阶段' + phase + ' · ' + skill.label;
    }

    function createBoss(level) {
        const cfg = levelOf(level);
        const kit = kitOf(cfg.bossId);
        return {
            level: cfg.level,
            id: cfg.bossId,
            mechanic: cfg.bossMechanic || 'speak-break',
            hp: cfg.bossHp,
            maxHp: cfg.bossHp,
            shield: cfg.bossShield,
            shieldMax: cfg.bossShield,
            state: 'shielded',
            color: 'blue',
            brokenUntil: 0,
            dead: false,
            phase: 1,
            thresholds: kit.thresholds.slice()
        };
    }

    function applyBossDamage(boss, raw, opts) {
        const now = (opts && opts.now) || 0;
        let b = tickBoss(boss, now);
        if (b.dead) return { dealt: 0, boss: b };
        const amount = Number(raw) || 0;
        const channel = opts && opts.channel;
        if (b.state === 'shielded' && !canChipShield(b.mechanic, channel)) {
            return { dealt: 0, blocked: true, boss: b };
        }
        const dealt = b.state === 'shielded' ? amount * SHIELD_REDUCE : amount;
        b = cloneBoss(b);
        b.hp = Math.max(0, b.hp - dealt);
        if (b.hp <= 0) {
            b.hp = 0;
            b.dead = true;
        }
        const prev = Number(boss && boss.phase) || 1;
        b.phase = hpPhase(b.hp, b.maxHp, (kitOf(b.id).thresholds));
        if (b.phase !== prev) b.phaseChanged = true;
        return { dealt: dealt, boss: b };
    }

    function bossBreakChannels(mechanic) {
        if (mechanic === 'spell-key') return ['spell'];
        if (mechanic === 'listen-pair') return ['listen', 'speak', 'spell'];
        if (mechanic === 'direction-callout') return ['enpick', 'speak'];
        if (mechanic === 'action-potion' || mechanic === 'review-route') return ['spell', 'speak'];
        return ['speak', 'spell'];
    }

    function canChipShield(mechanic, channel) {
        const ch = String(channel || '');
        return bossBreakChannels(mechanic).indexOf(ch) >= 0;
    }

    function bossQuizMode(mechanic, word) {
        if (mechanic === 'spell-key' || mechanic === 'action-potion') return 'spell';
        if (mechanic === 'direction-callout') return 'enpick';
        if (mechanic === 'listen-pair') return (word && word.audio) ? 'listen' : 'letters';
        return 'letters';
    }

    function bossQuizKicker(mechanic) {
        if (mechanic === 'spell-key') return '蓝罩 · 拼出钥匙词才破';
        if (mechanic === 'listen-pair') return '蓝罩 · 听音或拼出来才破';
        if (mechanic === 'direction-callout') return '蓝罩 · 看中文选英文，或按 V 喊出来';
        if (mechanic === 'action-potion') return '蓝罩 · 拼出动作词才破';
        if (mechanic === 'review-route') return '蓝罩 · 补全这个复习词才破';
        return '蓝罩 · 拼出来或按 V 说出来才破';
    }

    function shieldChipOf(channel, shield, mechanic) {
        if (mechanic != null && !canChipShield(mechanic, channel)) return 0;
        if (channel === 'speak' || channel === 'spell' || channel === 'listen' || channel === 'enpick') {
            return Math.max(1, Number(shield) || 1);
        }
        return 1;
    }

    function chipShield(boss, amount, opts) {
        const now = (opts && opts.now) || 0;
        let b = tickBoss(boss, now);
        if (b.dead || b.state === 'broken') return { boss: b };
        b = cloneBoss(b);
        b.shield = Math.max(0, b.shield - (Number(amount) || 0));
        if (b.shield <= 0) {
            b.shield = 0;
            b.state = 'broken';
            b.color = 'red';
            b.brokenUntil = now + BROKEN_MS;
        }
        return { boss: b };
    }

    function tickBoss(boss, now) {
        const b = cloneBoss(boss || createBoss(1));
        if (b.dead) return b;
        if (b.state === 'broken' && now >= (b.brokenUntil || 0)) {
            b.state = 'shielded';
            b.color = 'blue';
            b.shield = Math.max(1, Math.floor((b.shieldMax || 1) * 0.5));
            b.brokenUntil = 0;
        }
        return b;
    }

    function tryUnlock(progress, level) {
        const p = Object.assign({ unlockedLevel: 1, coined: 0 }, progress || {});
        const want = Number(level) || 1;
        if (want <= p.unlockedLevel) return { ok: true, unlockedLevel: p.unlockedLevel, coined: p.coined };
        if (want > p.unlockedLevel + 1) return { ok: false, unlockedLevel: p.unlockedLevel, coined: p.coined };
        let cost = UNLOCK_COST[want - 1] || 0;
        const gate = (levelOf(want) && levelOf(want).unlock) || {};
        const needRecall = Number(gate.recallWords) || 0;
        const haveRecall = Number(p.recallWords) || 0;
        if (needRecall && haveRecall >= needRecall) cost = Math.floor(cost * 0.3);
        if ((Number(p.coined) || 0) < cost) {
            return { ok: false, unlockedLevel: p.unlockedLevel, coined: p.coined };
        }
        return { ok: true, unlockedLevel: want, coined: (Number(p.coined) || 0) - cost };
    }

    function bossPhase(boss) {
        const b = boss || {};
        if (b.state === 'broken') return b.id ? bossFormLine(b) : '破罩输出';
        const max = Number(b.shieldMax) || 0;
        const cur = Number(b.shield) || 0;
        const first = max > 0 && cur >= max;
        if (b.mechanic === 'direction-callout') return first ? '听方位' : '喊方位';
        if (b.mechanic === 'spell-key') return first ? '拼钥匙' : '拼写回忆';
        if (b.mechanic === 'action-potion') return first ? '听动作' : '解药水';
        if (b.mechanic === 'listen-pair') return first ? '听近音' : '辨近音';
        if (b.mechanic === 'review-route') return first ? '复习到期词' : '选路线';
        if (first) return '识别';
        return '回忆';
    }

    function addCalendarDays(dateStr, days) {
        const d = new Date(String(dateStr || '') + 'T12:00:00');
        if (isNaN(d.getTime())) return '';
        d.setDate(d.getDate() + (Number(days) || 0));
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function streakFromDates(dates, today) {
        const day = String(today || '');
        if (!day) return 0;
        const seen = {};
        (dates || []).forEach(function (d) {
            if (d) seen[String(d)] = true;
        });
        if (!seen[day]) return 0;
        let n = 0;
        let cur = day;
        while (seen[cur]) {
            n += 1;
            cur = addCalendarDays(cur, -1);
            if (!cur) break;
        }
        return n;
    }

    function buildSettlement(opts) {
        const o = opts || {};
        const sun = Number(o.sunAwarded) || 0;
        const capped = !!o.sunCapped;
        const lv = Number(o.level) || 1;
        const newWords = Number(o.newWords) || 0;
        const review = (o.reviewWords || []).filter(Boolean).slice(0, 5);
        const next = lv < LEVEL_TOTAL ? '下一关解锁要 ' + (UNLOCK_COST[lv] || 0) + ' 金币' : '全部关卡都打完啦';
        const sunLine = capped
            ? '阳光已达今日上限，学习进度已保存'
            : ('阳光 +' + sun + ' → 工作台成长');
        return {
            gain: '本关学会 ' + newWords + ' 个新词 · ' + sunLine,
            progressLabel: review.length ? ('明天将复习：' + review.join(', ')) : '本关没有待复习词',
            nextGoal: next
        };
    }

    global.BlockLegendLevels = {
        UNLOCK_COST: UNLOCK_COST,
        SUN_PER_LEVEL: SUN_PER_LEVEL,
        SHIELD_REDUCE: SHIELD_REDUCE,
        BROKEN_MS: BROKEN_MS,
        LEVEL_TOTAL: LEVEL_TOTAL,
        LEVELS: LEVELS,
        levelOf: levelOf,
        eventKey: eventKey,
        bossModelOf: bossModelOf,
        bossTitle: bossTitle,
        bossSpawnKind: bossSpawnKind,
        FIRST_WAVE_COUNT: FIRST_WAVE_COUNT,
        firstWaveKinds: firstWaveKinds,
        BOSS_KITS: BOSS_KITS,
        kitOf: kitOf,
        BOSS_FORMS: BOSS_FORMS,
        formIdOf: formIdOf,
        bossFormOf: bossFormOf,
        bossSkillFx: bossSkillFx,
        hpPhase: hpPhase,
        nextBossAction: nextBossAction,
        bossFormLine: bossFormLine,
        createBoss: createBoss,
        applyBossDamage: applyBossDamage,
        bossBreakChannels: bossBreakChannels,
        canChipShield: canChipShield,
        bossQuizMode: bossQuizMode,
        bossQuizKicker: bossQuizKicker,
        shieldChipOf: shieldChipOf,
        chipShield: chipShield,
        tickBoss: tickBoss,
        tryUnlock: tryUnlock,
        bossPhase: bossPhase,
        buildSettlement: buildSettlement,
        streakFromDates: streakFromDates
    };
}(typeof window !== 'undefined' ? window : globalThis));
