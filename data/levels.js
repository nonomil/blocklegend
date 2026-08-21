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
            waveKinds: ['slime', 'cube', 'creeper'], targetWords: 50, reviewRatio: 0.2, // reviewRatio = 复习占比上限
            wordThemes: ['颜色', '自然', '物品', '动物'],
            climateWords: ['sun'],
            focusWords: ['tree', 'sword', 'slime', 'apple', 'jump', 'sun', 'flower', 'run', 'bed', 'home', 'teacher'],
            unlock: { coins: 0, recallWords: 0 },
            flavorText: '动物们忘了自己的名字，帮它们找回来。',
            flavorEn: 'The animals forgot their names. Help them remember.'
        },
        {
            level: 2, waves: 4, bossHp: 110, bossShield: 4, climate: 'forest', worldSeed: 21,
            bossId: 'mirror-fox', bossMechanic: 'direction-callout', missionType: 'find-and-guide',
            waveKinds: ['slime', 'fox', 'creeper', 'spider'], targetWords: 50, reviewRatio: 0.4,
            wordThemes: ['动物', '自然', '方位'],
            climateWords: ['fox', 'right', 'flower'],
            focusWords: ['fox', 'flower', 'right', 'behind', 'tree', 'spider'],
            unlock: { coins: 50, recallWords: 5 },
            flavorText: '狐狸把单词藏在了树洞里，找到它们。',
            flavorEn: 'The fox hid words in tree hollows. Find them.'
        },
        {
            level: 3, waves: 4, bossHp: 140, bossShield: 4, climate: 'desert', worldSeed: 33,
            bossId: 'key-guardian', bossMechanic: 'spell-key', missionType: 'collect-key',
            waveKinds: ['zombie', 'husk', 'drowned', 'ravager', 'pillager'], targetWords: 50, reviewRatio: 0.4,
            wordThemes: ['物品', '自然', '动作'],
            climateWords: ['hot', 'warm', 'wind'],
            focusWords: ['sand', 'stone', 'key', 'door', 'chest', 'open', 'husk', 'pillager'],
            unlock: { coins: 150, recallWords: 5 },
            flavorText: '沙漠商队的物资清单被风吹散了，拼回来。',
            flavorEn: 'The desert caravan list was blown away. Put it back together.'
        },
        {
            level: 4, waves: 4, bossHp: 170, bossShield: 5, climate: 'snow', worldSeed: 47,
            bossId: 'night-phantom', bossMechanic: 'action-potion', missionType: 'night-escort',
            waveKinds: ['skeleton', 'enderman', 'phantom', 'vex', 'shadow_stalker', 'snowgolem'], targetWords: 50, reviewRatio: 0.5,
            wordThemes: ['动作', '生活', '动物'],
            climateWords: ['night', 'moon', 'snow', 'cold', 'white'],
            focusWords: ['run', 'jump', 'torch', 'night', 'wolf', 'help', 'snow', 'phantom', 'shadow stalker', 'snow golem'],
            unlock: { coins: 300, recallWords: 5 },
            flavorText: '夜里的雪原要靠火把和呼喊带路。',
            flavorEn: 'Call out and light the way through the snowy night.'
        },
        {
            level: 5, waves: 4, bossHp: 200, bossShield: 5, climate: 'deep_dark', worldSeed: 59,
            bossId: 'warden', bossMechanic: 'listen-pair', missionType: 'deep-listen',
            waveKinds: ['spider', 'witch', 'vindicator', 'warden', 'golem', 'sculk_worm'], targetWords: 50, reviewRatio: 0.5,
            wordThemes: ['描述', '颜色', '自然'],
            climateWords: ['black', 'light'],
            focusWords: ['black', 'light', 'blue', 'red', 'vindicator', 'sculk worm'],
            unlock: { coins: 500, recallWords: 5 },
            flavorText: '地下城的声音在发指令，按指令行动。',
            flavorEn: 'The dungeon is giving orders. Follow them.'
        },
        {
            level: 6, waves: 5, bossHp: 240, bossShield: 6, climate: 'nether', worldSeed: 71,
            bossId: 'ghast', bossMechanic: 'review-route', missionType: 'mixed-review',
            waveKinds: ['magma', 'piglin', 'ghast', 'blaze', 'fire_spirit'], targetWords: 50, reviewRatio: 0.7,
            wordThemes: ['高频词', '动物', '物品'],
            climateWords: ['red', 'open'],
            focusWords: ['fire', 'gold', 'hot', 'dark', 'run', 'help', 'door', 'key', 'fire spirit'],
            unlock: { coins: 800, recallWords: 5 },
            flavorText: '火焰领主只听得懂完整的句子。',
            flavorEn: 'The fire lord only understands complete sentences.'
        },
        {
            level: 7, waves: 4, bossHp: 260, bossShield: 6, climate: 'quarry', worldSeed: 83,
            bossId: 'ravager', bossMechanic: 'speak-break', missionType: 'quarry-dig',
            waveKinds: ['husk', 'creeper', 'golem', 'spider', 'pillager'], targetWords: 50, reviewRatio: 0.5,
            wordThemes: ['动物', '自然', '物品'],
            climateWords: ['door'],
            focusWords: ['stone', 'dark', 'spider', 'run', 'help'],
            unlock: { coins: 1100, recallWords: 6 },
            flavorText: '矿坑里的石头把词压住了，挖出来。',
            flavorEn: 'The quarry buried the words in stone. Dig them out.'
        },
        {
            level: 8, waves: 4, bossHp: 280, bossShield: 6, climate: 'astral', worldSeed: 97,
            bossId: 'storm', bossMechanic: 'listen-pair', missionType: 'star-trail',
            waveKinds: ['phantom', 'vex', 'skeleton', 'husk'], targetWords: 50, reviewRatio: 0.55,
            wordThemes: ['自然', '描述', '动作'],
            climateWords: ['star', 'cloud'],
            focusWords: ['star', 'cloud', 'run', 'help'],
            unlock: { coins: 1500, recallWords: 6 },
            flavorText: '星路上的云把路标吹散了，念出来。',
            flavorEn: 'Clouds blew the star-trail signs away. Say them aloud.'
        },
        {
            level: 9, waves: 5, bossHp: 300, bossShield: 7, climate: 'ocean', worldSeed: 111,
            bossId: 'key-guardian', bossMechanic: 'spell-key', missionType: 'tide-collect',
            waveKinds: ['drowned', 'guardian', 'pufferfish', 'vex'], targetWords: 50, reviewRatio: 0.55,
            wordThemes: ['自然', '物品', '动作'],
            climateWords: ['water', 'fish', 'boat', 'swim'],
            focusWords: ['water', 'fish', 'boat', 'swim', 'blue', 'open'],
            unlock: { coins: 2000, recallWords: 7 },
            flavorText: '潮水冲走了船上的词，游过去捡回来。',
            flavorEn: 'The tide washed the words off the boat. Swim and fetch them.'
        },
        {
            level: 10, waves: 4, bossHp: 320, bossShield: 7, climate: 'crystal', worldSeed: 127,
            bossId: 'mirror-fox', bossMechanic: 'direction-callout', missionType: 'spore-guide',
            waveKinds: ['slime', 'cube', 'spider', 'witch', 'spore_bug'], targetWords: 50, reviewRatio: 0.6,
            wordThemes: ['颜色', '自然', '动物'],
            climateWords: ['jump', 'green'],
            focusWords: ['green', 'jump', 'right', 'spore bug'],
            unlock: { coins: 2600, recallWords: 7 },
            flavorText: '水晶里锁着颜色和跳跃，说对才开门。',
            flavorEn: 'Colors and jumps are locked in the crystals. Say them to open the way.'
        },
        {
            level: 11, waves: 5, bossHp: 340, bossShield: 7, climate: 'volcano', worldSeed: 141,
            bossId: 'blaze', bossMechanic: 'review-route', missionType: 'lava-review',
            waveKinds: ['magma', 'blaze', 'ghast', 'creeper', 'fire_spirit'], targetWords: 50, reviewRatio: 0.65,
            wordThemes: ['高频词', '描述', '物品'],
            climateWords: ['help'],
            focusWords: ['hot', 'fire', 'rock', 'dark', 'run', 'help', 'fire spirit'],
            unlock: { coins: 3300, recallWords: 8 },
            flavorText: '岩浆里的旧词快忘了，再喊一遍。',
            flavorEn: 'Old words are fading in the lava. Call them out again.'
        },
        {
            level: 12, waves: 5, bossHp: 380, bossShield: 8, climate: 'end', worldSeed: 157,
            bossId: 'dragon', bossMechanic: 'action-potion', missionType: 'end-ascent',
            waveKinds: ['enderman', 'vindicator', 'phantom', 'warden', 'sculk_worm'], targetWords: 50, reviewRatio: 0.7,
            wordThemes: ['动作', '描述', '高频词'],
            climateWords: ['cool'],
            focusWords: ['dark', 'jump', 'end', 'hard', 'help', 'light', 'sculk worm'],
            unlock: { coins: 4200, recallWords: 8 },
            flavorText: '终点只认又准又完整的英文。',
            flavorEn: 'The end only accepts clear and complete English.'
        }
    ];

    function cloneBoss(boss) {
        return Object.assign({}, boss);
    }

    function levelOf(n) {
        return LEVELS[Math.max(0, Math.min(LEVEL_TOTAL, Number(n) || 1) - 1)];
    }

    function flavorOf(n) {
        const i = Number(n);
        if (!Number.isFinite(i) || i < 1 || i > LEVEL_TOTAL) return null;
        const lv = LEVELS[i - 1];
        if (!lv) return null;
        const zh = String(lv.flavorText || '').trim();
        const en = String(lv.flavorEn || '').trim();
        if (!zh && !en) return null;
        return { zh: zh, en: en, ms: 3000, skippable: true, pause: false };
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

    const CLIMATE_ZH = {
        plains: '平原', forest: '密林', desert: '沙漠', snow: '雪原',
        deep_dark: '深暗', nether: '下界', quarry: '采石', astral: '星空',
        ocean: '海洋', crystal: '晶簇', volcano: '火山', end: '末地'
    };
    const HUB_RING = 140;
    const HUB_SPOTS = (function () {
        const out = [];
        for (let i = 0; i < 12; i += 1) {
            const a = -Math.PI / 2 + i * (Math.PI / 6);
            out.push({
                dx: Math.round(Math.cos(a) * HUB_RING),
                dz: Math.round(Math.sin(a) * HUB_RING)
            });
        }
        return out;
    }());
    const HUB_STATION = {
        plains: { frame: 'gold', wall: 'plank', roof: 'leaf', shape: 'house', line: '砍树合成 · 打史莱姆' },
        forest: { frame: 'leaf', wall: 'log', roof: 'leaf', shape: 'cabin', line: '密林找路 · 跟着狐狸' },
        desert: { frame: 'sand', wall: 'sand', roof: 'sand', shape: 'hut', line: '热风沙丘 · 找钥匙' },
        snow: { frame: 'iron', wall: 'snow', roof: 'snow', shape: 'igloo', line: '雪夜护送 · 带上火把' },
        deep_dark: { frame: 'coal', wall: 'coal', roof: 'stone', shape: 'bunker', line: '深暗听声 · 别出声' },
        nether: { frame: 'table', wall: 'stone', roof: 'table', shape: 'forge', line: '下界火路 · 复习过关' },
        quarry: { frame: 'iron', wall: 'stone', roof: 'iron', shape: 'mine', line: '采石挖掘 · 大声破盾' },
        astral: { frame: 'diamond', wall: 'iron', roof: 'diamond', shape: 'spire', line: '星空小径 · 听一对词' },
        ocean: { frame: 'diamond', wall: 'plank', roof: 'iron', shape: 'dock', line: '涨潮捞宝 · 拼出钥匙' },
        crystal: { frame: 'diamond', wall: 'diamond', roof: 'leaf', shape: 'crystal', line: '晶簇指路 · 说左右' },
        volcano: { frame: 'table', wall: 'stone', roof: 'gold', shape: 'forge', line: '火山复习 · 别掉进岩浆' },
        end: { frame: 'coal', wall: 'stone', roof: 'coal', shape: 'end', line: '末地登高 · 喝下药水' }
    };
    const MAP_SPOTS = {
        camp: { x: 16, y: 60 },
        1: { x: 28, y: 58 },
        2: { x: 30, y: 40 },
        3: { x: 44, y: 68 },
        4: { x: 22, y: 24 },
        5: { x: 46, y: 40 },
        6: { x: 56, y: 54 },
        7: { x: 62, y: 32 },
        8: { x: 52, y: 16 },
        9: { x: 70, y: 74 },
        10: { x: 78, y: 38 },
        11: { x: 84, y: 60 },
        12: { x: 90, y: 18 },
        secret: { x: 12, y: 32 }
    };
    const CAMP_BUILDINGS = [
        { id: 'trade', x: 11, y: 54, label: '商人摊' },
        { id: 'dummy', x: 20, y: 54, label: '训练假人' },
        { id: 'chest', x: 16, y: 66, label: '奖励箱' }
    ];

    function campMapOf(opts) {
        const o = opts || {};
        const unlocked = Number(o.unlockedLevel) || 1;
        const cleared = (o.clearedLevels || []).map(Number);
        const due = (o.dueLevelIds || []).map(Number);
        const campAt = MAP_SPOTS.camp;
        const nodes = LEVELS.map(function (lv) {
            let state = 'locked';
            if (lv.level > unlocked) state = 'locked';
            else if (due.indexOf(lv.level) >= 0) state = 'due';
            else if (cleared.indexOf(lv.level) >= 0 || lv.level < unlocked) state = 'cleared';
            else state = 'open';
            const at = MAP_SPOTS[lv.level] || campAt;
            return {
                level: lv.level,
                climate: lv.climate,
                title: CLIMATE_ZH[lv.climate] || lv.climate,
                state: state,
                x: at.x,
                y: at.y
            };
        });
        return {
            camp: {
                chest: Number(o.campChest) || 0,
                secret: !!o.secret,
                x: campAt.x,
                y: campAt.y,
                secretX: MAP_SPOTS.secret.x,
                secretY: MAP_SPOTS.secret.y,
                buildings: CAMP_BUILDINGS.map(function (b) {
                    return { id: b.id, x: b.x, y: b.y, label: b.label };
                })
            },
            nodes: nodes
        };
    }

    function hubPortalsOf(opts) {
        const o = opts || {};
        const map = campMapOf(o);
        const cx = Number(o.cx);
        const cz = Number(o.cz);
        const ox = Number.isFinite(cx) ? cx : 192;
        const oz = Number.isFinite(cz) ? cz : 192;
        return map.nodes.map(function (n, i) {
            const station = HUB_STATION[n.climate] || HUB_STATION.plains;
            const spot = HUB_SPOTS[i] || { dx: 0, dz: -16 };
            const unlocked = n.state !== 'locked';
            return {
                level: n.level,
                climate: n.climate,
                title: n.title,
                state: n.state,
                x: ox + spot.dx,
                z: oz + spot.dz,
                frame: unlocked ? 'leaf' : 'gold',
                wall: station.wall,
                roof: station.roof,
                shape: station.shape,
                line: station.line,
                mark: String(n.level)
            };
        });
    }

    function canJumpHub(opts, level) {
        const o = opts || {};
        const lv = Number(level) || 0;
        const unlocked = Math.max(1, Number(o.unlockedLevel) || 1);
        if (lv < 1 || lv > LEVEL_TOTAL) return { ok: false, reason: 'missing' };
        if (lv > unlocked) {
            return {
                ok: false,
                reason: 'locked',
                unlockAt: lv,
                message: '第' + lv + '关 · 通完第' + (lv - 1) + '关后解锁'
            };
        }
        const due = (o.dueLevelIds || []).map(Number);
        if (due.indexOf(lv) >= 0) return { ok: true, reason: 'due' };
        if (lv < unlocked) return { ok: true, reason: 'cleared' };
        return { ok: true, reason: 'open' };
    }

    function nextUnlockOf(opts) {
        const o = opts || {};
        const unlocked = Math.max(1, Number(o.unlockedLevel) || 1);
        const next = unlocked + 1;
        if (next > LEVEL_TOTAL) return null;
        const cleared = (o.clearedLevels || []).map(Number);
        if (cleared.indexOf(unlocked) < 0) return null;
        return { level: next, cost: UNLOCK_COST[next - 1] || 0 };
    }

    const HUB_TALK_NEAR = 10;
    const HUB_TALK_FIRST = [
        {
            stage: 'welcome',
            who: '老师',
            zh: '欢迎回家。营地更大了：多个广场、学堂、工坊，东边还有码头和湖。先逛逛，再沿着石边土路走。',
            en: 'Welcome home. Explore the plazas, lake and dock, then follow the path.',
            prompts: [{ en: 'home', zh: '家' }, { en: 'word', zh: '单词' }, { en: 'go', zh: '走' }]
        },
        {
            stage: 'point',
            who: '老师',
            zh: '石边宽路通向北边写着 1 的门。跟着黄光走过去。',
            en: 'Follow the wide path to door one.',
            prompts: [{ en: 'go', zh: '走' }, { en: 'one', zh: '一' }, { en: 'door', zh: '门' }]
        },
        {
            stage: 'near',
            who: '老师',
            zh: '走进去。动物们忘了名字，帮它们找回来。',
            en: 'Go in. Help the animals remember.',
            prompts: [{ en: 'go', zh: '走' }, { en: 'animal', zh: '动物' }],
            last: true
        }
    ];
    const HUB_TALK_NEXT = [
        {
            stage: 'next',
            who: '老师',
            zh: '下一关的门开了。跟着黄光走。',
            en: 'Go to the next door.',
            prompts: [{ en: 'go', zh: '走' }, { en: 'next', zh: '下一关' }],
            last: true
        }
    ];

    function hubYardsOf(opts) {
        const o = opts || {};
        const cx = Number.isFinite(Number(o.cx)) ? Number(o.cx) : 192;
        const cz = Number.isFinite(Number(o.cz)) ? Number(o.cz) : 192;
        return [
            { id: 'center', dx: 0, dz: 0, r: 16, fill: 'dirt', edge: 'stone_brick' },
            { id: 'school', dx: -19, dz: -19, r: 12, fill: 'dirt', edge: 'stone_brick' },
            { id: 'market', dx: 22, dz: -8, r: 12, fill: 'dirt', edge: 'stone_brick' },
            { id: 'rest', dx: 6, dz: 24, r: 11, fill: 'dirt', edge: 'stone_brick' },
            { id: 'harbor', dx: 40, dz: 6, r: 8, fill: 'plank', edge: 'stone_brick' }
        ].map(function (y) {
            return {
                id: y.id,
                r: y.r,
                fill: y.fill,
                edge: y.edge,
                x: cx + y.dx,
                z: cz + y.dz
            };
        });
    }

    function hubLandOf(opts) {
        const o = opts || {};
        const cx = Number.isFinite(Number(o.cx)) ? Number(o.cx) : 192;
        const cz = Number.isFinite(Number(o.cz)) ? Number(o.cz) : 192;
        return {
            lakes: [
                { x: cx + 58, z: cz + 18, r: 8 },
                { x: cx - 48, z: cz + 36, r: 6 }
            ],
            river: {
                points: [
                    { x: cx - 44, z: cz + 34 },
                    { x: cx - 10, z: cz + 42 },
                    { x: cx + 20, z: cz + 36 },
                    { x: cx + 50, z: cz + 22 }
                ]
            },
            hills: [
                { x: cx + 36, z: cz - 36, r: 6, h: 4 }
            ]
        };
    }

    function hubPlazaOf(opts) {
        const o = opts || {};
        const cx = Number.isFinite(Number(o.cx)) ? Number(o.cx) : 192;
        const cz = Number.isFinite(Number(o.cz)) ? Number(o.cz) : 192;
        return [
            { id: 'word', label: '单词小屋', en: 'Word Hut', role: 'word', dx: -22, dz: -12, wall: 'plank', roof: 'leaf', shape: 'house' },
            { id: 'dummy', label: '练习房', en: 'Practice', role: 'dummy', dx: 18, dz: -12, wall: 'stone', roof: 'iron', shape: 'hut' },
            { id: 'trade', label: '商人摊', en: 'Shop', role: 'trader', dx: 8, dz: -26, wall: 'plank', roof: 'gold', shape: 'hut' },
            { id: 'teacher', label: '学堂', en: 'School', role: 'teacher', dx: -16, dz: -26, wall: 'plank', roof: 'leaf', shape: 'house' },
            { id: 'craft', label: '工坊', en: 'Workshop', role: 'craft', dx: 26, dz: 2, wall: 'plank', roof: 'gold', shape: 'cabin' },
            { id: 'furnace', label: '熔炉房', en: 'Furnace', role: 'furnace', dx: 22, dz: 16, wall: 'stone', roof: 'iron', shape: 'forge' },
            { id: 'chest', label: '存储箱', en: 'Chest', role: 'chest', dx: 8, dz: 22, wall: 'plank', roof: 'iron', shape: 'hut' },
            { id: 'bed', label: '休息屋', en: 'Rest', role: 'bed', dx: -4, dz: 22, wall: 'plank', roof: 'leaf', shape: 'house' },
            { id: 'library', label: '图书角', en: 'Library', role: 'library', dx: -36, dz: -6, wall: 'plank', roof: 'gold', shape: 'house' },
            { id: 'lookout', label: '瞭望塔', en: 'Lookout', role: 'lookout', dx: 36, dz: -32, wall: 'stone', roof: 'gold', shape: 'tower' },
            { id: 'dock', label: '码头', en: 'Dock', role: 'dock', dx: 42, dz: 4, wall: 'plank', roof: 'leaf', shape: 'cabin' },
            { id: 'barn', label: '牲口棚', en: 'Barn', role: 'barn', dx: 34, dz: 30, wall: 'plank', roof: 'iron', shape: 'barn' },
            { id: 'farm', label: '农田', en: 'Farm', role: 'farm', dx: 16, dz: 38, wall: 'plank', roof: 'leaf', shape: 'house' }
        ].map(function (b) {
            const w = 7;
            const d = 7;
            return {
                id: b.id,
                label: b.label,
                en: b.en,
                role: b.role,
                wall: b.wall,
                roof: b.roof,
                shape: b.shape,
                w: w,
                d: d,
                x: cx + b.dx,
                z: cz + b.dz,
                interactX: cx + b.dx + w / 2,
                interactZ: cz + b.dz + d - 0.4
            };
        });
    }

    function hubRoadPlanOf(opts) {
        const o = opts || {};
        const cx = Number.isFinite(Number(o.cx)) ? Number(o.cx) : 192;
        const cz = Number.isFinite(Number(o.cz)) ? Number(o.cz) : 192;
        const portals = o.portals || [];
        const plaza = o.plaza || hubPlazaOf(o);
        let primary = null;
        let i;
        for (i = 0; i < portals.length; i += 1) {
            if (portals[i] && (portals[i].state === 'open' || Number(portals[i].level) === 1)) {
                primary = portals[i];
                break;
            }
        }
        if (!primary) primary = portals[0] || null;
        const strokes = [];
        plaza.forEach(function (b) {
            strokes.push({
                kind: 'plaza',
                x0: cx,
                z0: cz,
                x1: Number(b.interactX != null ? b.interactX : b.x + 2.5),
                z1: Number(b.interactZ != null ? b.interactZ : b.z + 4),
                width: 3,
                fill: 'dirt',
                edge: 'stone_brick',
                lamps: false,
                apron: false
            });
        });
        if (primary) {
            strokes.push({
                kind: 'primary',
                level: primary.level,
                x0: cx,
                z0: cz - 2,
                x1: Number(primary.x) + 1.5,
                z1: Number(primary.z) + 3,
                width: 5,
                fill: 'dirt',
                edge: 'stone_brick',
                lamps: true,
                apron: true
            });
        }
        portals.forEach(function (p) {
            if (!p || (primary && p.level === primary.level)) return;
            const open = p.state === 'open' || p.state === 'due';
            strokes.push({
                kind: open ? 'side' : 'locked',
                level: p.level,
                x0: cx,
                z0: cz - 2,
                x1: Number(p.x) + 1.5,
                z1: Number(p.z) + 3,
                width: open ? 3 : 2,
                fill: 'dirt',
                edge: open ? 'gravel' : 'stone',
                lamps: !!open,
                apron: !!open
            });
        });
        const yards = hubYardsOf(o);
        yards.forEach(function (y) {
            if (!y || y.id === 'center') return;
            strokes.push({
                kind: 'yard',
                x0: cx,
                z0: cz,
                x1: Number(y.x),
                z1: Number(y.z),
                width: 3,
                fill: y.fill === 'plank' ? 'plank' : 'dirt',
                edge: y.edge || 'stone_brick',
                lamps: false,
                apron: false
            });
        });
        return {
            plaza: yards[0] || { x: cx, z: cz, r: 16, fill: 'dirt', edge: 'stone_brick' },
            yards: yards,
            strokes: strokes
        };
    }

    function hubTalkOf(opts) {
        const o = opts || {};
        const unlocked = Math.max(1, Number(o.unlockedLevel) || 1);
        const cleared = (o.clearedLevels || []).map(Number);
        const dist = Number(o.dist);
        const near = Number.isFinite(dist) && dist <= HUB_TALK_NEAR;
        const doneOne = unlocked > 1 || cleared.indexOf(1) >= 0;
        const lines = doneOne ? HUB_TALK_NEXT : HUB_TALK_FIRST;
        let i = Math.max(0, Math.min(lines.length - 1, Number(o.line) || 0));
        if (!doneOne && near) i = lines.length - 1;
        const row = lines[i];
        const prompts = (row.prompts || []).map(function (p) {
            return { en: p.en, zh: p.zh };
        });
        const say = row.who + '：' + row.zh;
        return {
            who: row.who,
            zh: row.zh,
            en: row.en,
            say: say,
            prompts: prompts,
            stage: row.stage,
            last: !!row.last || i === lines.length - 1,
            line: i,
            lineCount: lines.length,
            goal: doneOne
                ? ('走到黄点进第' + unlocked + '关')
                : '跟着黄光走进第一关',
            hint: prompts.map(function (p) { return p.en + ' · ' + p.zh; }).join('   ')
        };
    }

    function guideMarkOf(opts) {
        const o = opts || {};
        if (o.settleAt && o.settleAt.x != null) {
            return {
                kind: 'settle',
                x: Number(o.settleAt.x),
                z: Number(o.settleAt.z),
                label: '走到黄点结算金币',
                hint: '小地图黄点 · 走过去开下一关'
            };
        }
        if (o.hub) {
            const next = nextUnlockOf(o);
            const post = o.unlockPost;
            if (next && post && post.x != null) {
                return {
                    kind: 'unlock',
                    x: Number(post.x),
                    z: Number(post.z),
                    level: next.level,
                    cost: next.cost,
                    label: '走到黄点解锁第' + next.level + '关',
                    hint: '花 ' + next.cost + ' 金币 · 跟着小地图黄点走'
                };
            }
            const portals = o.portals || [];
            let i;
            let jump = null;
            for (i = 0; i < portals.length; i += 1) {
                if (portals[i].state === 'open' || portals[i].state === 'due') {
                    jump = portals[i];
                    break;
                }
            }
            if (!jump) {
                for (i = 0; i < portals.length; i += 1) {
                    if (portals[i].state === 'cleared') {
                        jump = portals[i];
                        break;
                    }
                }
            }
            if (jump) {
                return {
                    kind: 'portal',
                    x: Number(jump.x),
                    z: Number(jump.z),
                    level: jump.level,
                    label: '走到黄点进第' + jump.level + '关 · ' + (jump.title || ''),
                    hint: '小地图黄点是传送门'
                };
            }
            return null;
        }
        const boss = o.bossMob || o.boss;
        if (boss && (boss.hp == null || boss.hp > 0) && boss.x != null) {
            return {
                kind: 'boss',
                x: Number(boss.x),
                z: Number(boss.z),
                label: '走到黄点打 Boss',
                hint: '清完波次后，黄点就是 Boss'
            };
        }
        const player = o.player || { x: 0, z: 0 };
        const mobs = (o.monsters || []).filter(function (m) {
            return m && m.hp > 0 && !m.peaceful && !m.isBoss;
        });
        if (mobs.length) {
            mobs.sort(function (a, b) {
                return Math.hypot(a.x - player.x, a.z - player.z) - Math.hypot(b.x - player.x, b.z - player.z);
            });
            return {
                kind: 'mob',
                x: Number(mobs[0].x),
                z: Number(mobs[0].z),
                label: '走到黄点打怪',
                hint: '清光黄点附近的怪，下一波会来'
            };
        }
        return null;
    }

    global.BlockLegendLevels = {
        UNLOCK_COST: UNLOCK_COST,
        SUN_PER_LEVEL: SUN_PER_LEVEL,
        SHIELD_REDUCE: SHIELD_REDUCE,
        BROKEN_MS: BROKEN_MS,
        LEVEL_TOTAL: LEVEL_TOTAL,
        LEVELS: LEVELS,
        levelOf: levelOf,
        flavorOf: flavorOf,
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
        campMapOf: campMapOf,
        hubPortalsOf: hubPortalsOf,
        HUB_SPOTS: HUB_SPOTS,
        canJumpHub: canJumpHub,
        nextUnlockOf: nextUnlockOf,
        hubPlazaOf: hubPlazaOf,
        hubYardsOf: hubYardsOf,
        hubLandOf: hubLandOf,
        hubRoadPlanOf: hubRoadPlanOf,
        hubTalkOf: hubTalkOf,
        guideMarkOf: guideMarkOf,
        bossPhase: bossPhase,
        buildSettlement: buildSettlement,
        streakFromDates: streakFromDates
    };
}(typeof window !== 'undefined' ? window : globalThis));
