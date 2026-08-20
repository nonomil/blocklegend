/**
 * blocklegend · 关卡复习课表（T20260819-E2 S1）
 * 无 DOM。浏览器挂 window.BlockLegendReviewSchedule，node 可 import。
 * 间隔与宽限来自借鉴包 04 §3，不复制外部实现。
 */
(function (global) {
    'use strict';

    const INTERVALS_HOURS = [6, 18, 24, 48, 72, 168, 336];
    const FIRST_GRACE_HOURS = 6;
    const LATER_GRACE_HOURS = 24;
    const REVIEW_ROUNDS = INTERVALS_HOURS.length;
    const CURRENT_PLAN_VERSION = 1;

    function nowMs(now) {
        if (now instanceof Date) return now.getTime();
        if (typeof now === 'number' && Number.isFinite(now)) return now;
        const parsed = Date.parse(String(now || ''));
        return Number.isNaN(parsed) ? Date.now() : parsed;
    }

    function addHours(from, hours) {
        return new Date(nowMs(from) + Number(hours) * 3600000).toISOString();
    }

    function planVersion(entry) {
        const n = Number(entry && entry.reviewPlanVersion);
        return n > 0 ? n : CURRENT_PLAN_VERSION;
    }

    function graceHoursFor(round) {
        return Number(round) === 0 ? FIRST_GRACE_HOURS : LATER_GRACE_HOURS;
    }

    function nextReviewFor(levelId, round, completedAt) {
        const r = Math.max(0, Math.round(Number(round) || 0));
        const id = String(levelId || '');
        if (r >= REVIEW_ROUNDS) {
            return {
                levelId: id,
                round: REVIEW_ROUNDS,
                dueAt: null,
                graceUntil: null,
                graduated: true,
                reviewPlanVersion: CURRENT_PLAN_VERSION
            };
        }
        const dueAt = addHours(completedAt, INTERVALS_HOURS[r]);
        const grace = graceHoursFor(r);
        return {
            levelId: id,
            round: r,
            dueAt: dueAt,
            graceUntil: addHours(dueAt, grace),
            graduated: false,
            reviewPlanVersion: CURRENT_PLAN_VERSION
        };
    }

    function isReady(item, now) {
        if (!item || item.graduated || !item.dueAt) return false;
        return nowMs(now) >= nowMs(item.dueAt);
    }

    function isOverdue(item, now) {
        if (!item || item.graduated || !item.dueAt) return false;
        return nowMs(now) > nowMs(item.dueAt) + graceHoursFor(item.round) * 3600000;
    }

    function withReviewMap(progress) {
        const next = progress && typeof progress === 'object' ? progress : {};
        if (!next.levelReview || typeof next.levelReview !== 'object') next.levelReview = {};
        return next;
    }

    function stampFirstClear(progress, levelId, completedAt) {
        const next = withReviewMap(progress);
        const key = String(levelId);
        const cur = next.levelReview[key];
        if (cur && cur.lastCompletedAt) return next;
        next.levelReview[key] = {
            round: 0,
            lastCompletedAt: String(completedAt || ''),
            reviewPlanVersion: CURRENT_PLAN_VERSION
        };
        return next;
    }

    function advanceAfterReview(progress, levelId, completedAt) {
        const next = withReviewMap(progress);
        const key = String(levelId);
        const cur = next.levelReview[key] || { round: 0, reviewPlanVersion: CURRENT_PLAN_VERSION };
        const round = Math.min(REVIEW_ROUNDS, (Number(cur.round) || 0) + 1);
        const entry = {
            round: round,
            lastCompletedAt: String(completedAt || ''),
            reviewPlanVersion: planVersion(cur)
        };
        if (round >= REVIEW_ROUNDS) entry.graduated = true;
        next.levelReview[key] = entry;
        return next;
    }

    function doorStatus(entry, now) {
        const r = Math.max(0, Math.round(Number(entry && entry.round) || 0));
        if (!entry || r >= REVIEW_ROUNDS || entry.graduated) return 'graduated';
        const plan = nextReviewFor('', r, entry.lastCompletedAt);
        if (isOverdue(plan, now)) return 'overdue';
        if (isReady(plan, now)) return 'ready';
        return 'waiting';
    }

    function buildReviewPool(parts) {
        const src = parts && typeof parts === 'object' ? parts : {};
        const out = [];
        const seen = {};
        ['hardWords', 'reviewWords', 'dueWords'].forEach(function (key) {
            (Array.isArray(src[key]) ? src[key] : []).forEach(function (word) {
                const w = typeof word === 'object'
                    ? String((word && (word.word || word.text)) || '').trim().toLowerCase()
                    : String(word || '').trim().toLowerCase();
                if (!w || seen[w]) return;
                seen[w] = true;
                out.push(w);
            });
        });
        return out;
    }

    function bumpQuestionKind(kind) {
        const k = String(kind || '');
        if (k === 'speak' || k === 'spell' || k === 'fill' || k === 'letters') return 'speak';
        if (k === 'choice' || k === 'enpick' || k === 'listen' || k === 'picture') return 'spell';
        return 'enpick';
    }

    function reviewSunlightKey(levelId, round) {
        return 'bl-review-' + String(levelId) + '-' + String(Math.max(0, Math.round(Number(round) || 0)));
    }

    function reviewCoins(base) {
        return Math.floor(Math.max(0, Number(base) || 0) / 2);
    }

    function formatDoorCountdown(dueAt, now) {
        const ms = nowMs(dueAt) - nowMs(now);
        if (ms <= 0) return '可以进';
        const hours = Math.floor(ms / 3600000);
        if (hours >= 1) return '还要 ' + hours + ' 小时';
        return '还要 ' + Math.max(1, Math.ceil(ms / 60000)) + ' 分钟';
    }

    function doorLabel(status, dueAt, now) {
        if (status === 'overdue') return '待复习';
        if (status === 'ready') return '复习之门';
        if (status === 'graduated') return '已毕业';
        return formatDoorCountdown(dueAt, now);
    }

    function listReviewDoors(progress, now) {
        const cleared = progress && Array.isArray(progress.clearedLevels) ? progress.clearedLevels : [];
        const map = progress && progress.levelReview && typeof progress.levelReview === 'object'
            ? progress.levelReview
            : {};
        return cleared.map(function (id) {
            const key = String(id);
            const entry = map[key] || map[id];
            if (!entry) {
                return { levelId: key, round: 0, status: 'waiting', dueAt: null, canEnter: false, label: '待开启' };
            }
            const status = doorStatus(entry, now);
            const plan = nextReviewFor(key, entry.round, entry.lastCompletedAt);
            return {
                levelId: key,
                round: Number(entry.round) || 0,
                status: status,
                dueAt: plan.dueAt,
                canEnter: status === 'ready' || status === 'overdue',
                label: doorLabel(status, plan.dueAt, now)
            };
        });
    }

    function reviewRunConfig(levelCfg) {
        const waves = Number(levelCfg && levelCfg.waves) || 4;
        return {
            waves: waves <= 4 ? 2 : 3,
            bossHp: Math.max(20, Math.round((Number(levelCfg && levelCfg.bossHp) || 80) * 0.5)),
            bossShield: Math.max(1, Math.round((Number(levelCfg && levelCfg.bossShield) || 3) * 0.5))
        };
    }

    function selectTodayAdventure(progress, now, unlockedLevel) {
        const doors = listReviewDoors(progress, now);
        const overdue = doors.filter(function (d) { return d.status === 'overdue'; });
        const ready = doors.filter(function (d) { return d.status === 'ready'; });
        const soon = doors.filter(function (d) {
            if (d.status !== 'waiting' || !d.dueAt) return false;
            const wait = nowMs(d.dueAt) - nowMs(now);
            return wait > 0 && wait <= 24 * 3600000;
        });
        const nextLv = Math.min(12, Math.max(1, Number(unlockedLevel) || 1));
        const advance = {
            kind: 'advance',
            levelId: String(nextLv),
            status: 'advance',
            label: '推进新关',
            canEnter: true
        };
        const items = [];
        function pushDoor(door, kind) {
            items.push({
                kind: kind,
                levelId: door.levelId,
                status: door.status,
                label: door.label,
                canEnter: !!door.canEnter
            });
        }
        overdue.forEach(function (d) { pushDoor(d, 'door'); });
        ready.forEach(function (d) { pushDoor(d, 'door'); });
        soon.forEach(function (d) { pushDoor(d, 'soon'); });
        if (!overdue.length && !ready.length) {
            items.unshift(advance);
        } else if (items.length < 3) {
            items.push(advance);
        }
        return { items: items.slice(0, 3) };
    }

    function noteHardWord(progress, word, correct, extra) {
        const next = progress && typeof progress === 'object' ? progress : {};
        const key = String(word || '').trim().toLowerCase();
        if (!key) return next;
        if (!Array.isArray(next.hardWords)) next.hardWords = [];
        if (!next.hardTally || typeof next.hardTally !== 'object') next.hardTally = {};
        const now = String((extra && extra.now) || '');
        let entry = null;
        next.hardWords.forEach(function (item) {
            if (item && item.word === key) entry = item;
        });
        if (!correct) {
            next.hardTally[key] = (Number(next.hardTally[key]) || (entry && entry.misses) || 0) + 1;
            const misses = next.hardTally[key];
            if (misses >= 2) {
                if (!entry) {
                    next.hardWords.push({ word: key, misses: misses, lastAt: now, reviewHits: 0 });
                } else {
                    entry.misses = misses;
                    entry.lastAt = now;
                    entry.reviewHits = 0;
                }
            }
            return next;
        }
        if (extra && extra.inReview && entry) {
            entry.reviewHits = (Number(entry.reviewHits) || 0) + 1;
            if (entry.reviewHits >= 2) {
                next.hardWords = next.hardWords.filter(function (item) { return item && item.word !== key; });
                delete next.hardTally[key];
            }
        }
        return next;
    }

    function noteHearSpeak(progress, channel) {
        const next = progress && typeof progress === 'object' ? progress : {};
        if (!next.stats || typeof next.stats !== 'object') next.stats = { inputWords: 0, outputWords: 0 };
        const kind = String(channel || '');
        if (kind === 'speak' || kind === 'spell' || kind === 'fill' || kind === 'letters') {
            next.stats.outputWords = (Number(next.stats.outputWords) || 0) + 1;
        } else if (kind === 'listen' || kind === 'choice' || kind === 'picture' || kind === 'enpick') {
            next.stats.inputWords = (Number(next.stats.inputWords) || 0) + 1;
        }
        return next;
    }

    function hearSpeakLine(stats) {
        const src = stats && typeof stats === 'object' ? stats : {};
        const input = Number(src.inputWords) || 0;
        const output = Number(src.outputWords) || 0;
        if (!input && !output) return '听说比 还没开始';
        return '听说比 ' + output + '/' + input;
    }

    global.BlockLegendReviewSchedule = {
        INTERVALS_HOURS: INTERVALS_HOURS,
        REVIEW_ROUNDS: REVIEW_ROUNDS,
        CURRENT_PLAN_VERSION: CURRENT_PLAN_VERSION,
        nextReviewFor: nextReviewFor,
        isReady: isReady,
        isOverdue: isOverdue,
        planVersion: planVersion,
        stampFirstClear: stampFirstClear,
        advanceAfterReview: advanceAfterReview,
        doorStatus: doorStatus,
        buildReviewPool: buildReviewPool,
        bumpQuestionKind: bumpQuestionKind,
        reviewSunlightKey: reviewSunlightKey,
        reviewCoins: reviewCoins,
        formatDoorCountdown: formatDoorCountdown,
        listReviewDoors: listReviewDoors,
        reviewRunConfig: reviewRunConfig,
        selectTodayAdventure: selectTodayAdventure,
        noteHardWord: noteHardWord,
        noteHearSpeak: noteHearSpeak,
        hearSpeakLine: hearSpeakLine
    };
})(typeof window !== 'undefined' ? window : globalThis);
