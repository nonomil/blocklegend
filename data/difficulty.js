/**
 * blocklegend · 重玩三档 + 卷轴隐藏关（T20260819-dungeon-anki-uplift D2/D3）
 * 无 DOM。浏览器挂 window.BlockLegendDifficulty，node 可 import。
 */
(function (global) {
    'use strict';

    const DIFFICULTY_TIERS = {
        default: {
            id: 'default',
            label: '默认',
            hpScale: 1,
            coinScale: 1,
            reviewCap: 0.6,
            questionTier: 1,
            gateMs: 0,
            bossAnswers: 1
        },
        adventure: {
            id: 'adventure',
            label: '冒险',
            hpScale: 1.3,
            coinScale: 1.5,
            reviewCap: 1,
            questionTier: 2,
            gateMs: 0,
            bossAnswers: 1
        },
        apocalypse: {
            id: 'apocalypse',
            label: '天启',
            hpScale: 1.6,
            coinScale: 2,
            reviewCap: 1,
            questionTier: 2,
            gateMs: 20000,
            bossAnswers: 3
        }
    };

    function tierOf(id) {
        return DIFFICULTY_TIERS[id] || DIFFICULTY_TIERS.default;
    }

    function recommendTier(opts) {
        const o = opts || {};
        const avg = Number(o.avgBox) || 0;
        if (avg >= 4 && o.unlocked) return 'apocalypse';
        if (avg >= 3) return 'adventure';
        return 'default';
    }

    function mechanicOf(levels, levelId) {
        const want = Number(levelId);
        const list = Array.isArray(levels) ? levels : [];
        for (let i = 0; i < list.length; i += 1) {
            if (Number(list[i].level) === want) return String(list[i].bossMechanic || '');
        }
        return '';
    }

    function apocalypseUnlocked(opts) {
        const o = opts || {};
        const map = o.clearedTiers && typeof o.clearedTiers === 'object' ? o.clearedTiers : {};
        const seen = {};
        Object.keys(map).forEach(function (levelId) {
            const tiers = Array.isArray(map[levelId]) ? map[levelId] : [];
            if (tiers.indexOf('adventure') < 0) return;
            const mech = mechanicOf(o.levels, levelId);
            if (mech) seen[mech] = true;
        });
        return Object.keys(seen).length >= 3;
    }

    function markClearedTier(map, levelId, tier) {
        const next = map && typeof map === 'object' ? Object.assign({}, map) : {};
        const key = String(levelId);
        const cur = Array.isArray(next[key]) ? next[key].slice() : [];
        const id = String(tier || 'default');
        if (cur.indexOf(id) < 0) cur.push(id);
        next[key] = cur;
        return next;
    }

    function tierSunlightKey(tier, levelId) {
        if (tier === 'adventure') return 'bl-tier-adv-' + String(levelId);
        if (tier === 'apocalypse') return 'bl-tier-apo-' + String(levelId);
        return 'level-' + String(levelId);
    }

    function tierCoins(base, tier) {
        const scale = (tierOf(tier).coinScale) || 1;
        return Math.floor(Math.max(0, Number(base) || 0) * scale);
    }

    function scrollAvailable(opts) {
        const o = opts || {};
        const words = o.words && typeof o.words === 'object' ? o.words : {};
        const missing = [];
        (o.climateWords || []).forEach(function (word) {
            const key = String(word || '').trim().toLowerCase();
            const box = Number(words[key] && words[key].box) || 0;
            if (!key || box < 3) missing.push(key || String(word || ''));
        });
        return { ok: missing.length === 0, missing: missing };
    }

    function scrollLine(opts) {
        const o = opts || {};
        const have = (Array.isArray(o.scrolls) ? o.scrolls : []).indexOf(String(o.levelId)) >= 0;
        if (have) return { kind: 'have', text: '卷轴已收' };
        const check = scrollAvailable(o);
        if (!check.ok) {
            return { kind: 'gray', text: '还差 ' + (check.missing || []).join('、') + ' 到 3 星' };
        }
        return { kind: 'ready', text: '发光卷轴 · 可以捡' };
    }

    function collectScroll(scrolls, levelId) {
        const next = Array.isArray(scrolls) ? scrolls.slice() : [];
        const key = String(levelId);
        if (key && next.indexOf(key) < 0) next.push(key);
        return next;
    }

    function secretUnlocked(scrolls) {
        return (Array.isArray(scrolls) ? scrolls : []).length >= 3;
    }

    function secretRunConfig() {
        return {
            worldSeed: 999,
            waves: 3,
            boss: false,
            coinScale: 2,
            sunlightKey: 'bl-secret-1',
            reviewCap: 1,
            rareLoot: true,
            title: '词灵回廊'
        };
    }

    function dummyWord(opts) {
        const o = opts || {};
        const hard = Array.isArray(o.hardWords) ? o.hardWords : [];
        if (hard.length) {
            const first = hard[0];
            return first && typeof first === 'object' ? String(first.word || '') : String(first || '');
        }
        const due = Array.isArray(o.dueWords) ? o.dueWords : [];
        return due.length ? String(due[0] || '') : '';
    }

    function applyHpScale(hp, tier) {
        return Math.max(1, Math.round((Number(hp) || 1) * (tierOf(tier).hpScale || 1)));
    }

    function startKind(tier) {
        return (tierOf(tier).questionTier || 1) >= 2 ? 'spell' : 'choice';
    }

    global.BlockLegendDifficulty = {
        DIFFICULTY_TIERS: DIFFICULTY_TIERS,
        tierOf: tierOf,
        recommendTier: recommendTier,
        apocalypseUnlocked: apocalypseUnlocked,
        markClearedTier: markClearedTier,
        tierSunlightKey: tierSunlightKey,
        tierCoins: tierCoins,
        scrollAvailable: scrollAvailable,
        scrollLine: scrollLine,
        collectScroll: collectScroll,
        secretUnlocked: secretUnlocked,
        secretRunConfig: secretRunConfig,
        dummyWord: dummyWord,
        applyHpScale: applyHpScale,
        startKind: startKind
    };
})(typeof window !== 'undefined' ? window : globalThis);
