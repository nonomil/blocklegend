/**
 * blocklegend · 词级 Leitner 记忆状态（T20260819-dungeon-anki-uplift D1）
 * 无 DOM。浏览器挂 window.BlockLegendWordMemory，node 可 import。
 */
(function (global) {
    'use strict';

    const BOX_DAYS = [1, 3, 7, 14, 30];
    const DAY_MS = 86400000;
    const CURRENT_MEMORY_VERSION = 1;
    const DENSITY_KEEP = 20;

    function nowMs(now) {
        if (now instanceof Date) return now.getTime();
        if (typeof now === 'number' && Number.isFinite(now)) return now;
        const parsed = Date.parse(String(now || ''));
        return Number.isNaN(parsed) ? Date.now() : parsed;
    }

    function wordKey(word) {
        if (word && typeof word === 'object') {
            return String(word.text || word.word || word.id || '').trim().toLowerCase();
        }
        return String(word || '').trim().toLowerCase();
    }

    function aliasKeys(word) {
        const out = [];
        function push(value) {
            const key = String(value || '').trim().toLowerCase();
            if (key && out.indexOf(key) < 0) out.push(key);
        }
        if (word && typeof word === 'object') {
            push(word.text);
            push(word.word);
            push(word.id);
        } else {
            push(word);
        }
        return out;
    }

    function cloneArr(list) {
        return (Array.isArray(list) ? list : []).map(function (item) {
            return item && typeof item === 'object' ? Object.assign({}, item) : item;
        });
    }

    function createMemory(src) {
        const raw = src && typeof src === 'object' ? src : {};
        const next = Object.assign({}, raw);
        const ver = Number(raw.memoryVersion);
        next.memoryVersion = ver > 0 ? ver : CURRENT_MEMORY_VERSION;
        next.words = raw.words && typeof raw.words === 'object' ? Object.assign({}, raw.words) : {};
        Object.keys(next.words).forEach(function (key) {
            const row = next.words[key];
            next.words[key] = row && typeof row === 'object' ? Object.assign({}, row) : { box: 0 };
        });
        next.hardWords = cloneArr(raw.hardWords);
        next.hardTally = raw.hardTally && typeof raw.hardTally === 'object' ? Object.assign({}, raw.hardTally) : {};
        return next;
    }

    function boxIntervalMs(box) {
        const i = Math.max(1, Math.min(5, Math.round(Number(box) || 1))) - 1;
        return BOX_DAYS[i] * DAY_MS;
    }

    function noteHard(mem, key, correct, extra, now) {
        if (!Array.isArray(mem.hardWords)) mem.hardWords = [];
        if (!mem.hardTally || typeof mem.hardTally !== 'object') mem.hardTally = {};
        let entry = null;
        mem.hardWords.forEach(function (item) {
            if (item && item.word === key) entry = item;
        });
        if (!correct) {
            mem.hardTally[key] = (Number(mem.hardTally[key]) || (entry && entry.misses) || 0) + 1;
            const misses = mem.hardTally[key];
            if (misses >= 2) {
                if (!entry) {
                    mem.hardWords.push({ word: key, misses: misses, lastAt: now, reviewHits: 0, meets: 0 });
                } else {
                    entry.misses = misses;
                    entry.lastAt = now;
                    entry.reviewHits = 0;
                }
            }
            return;
        }
        if (extra && extra.context === 'review' && entry) {
            entry.reviewHits = (Number(entry.reviewHits) || 0) + 1;
            if (entry.reviewHits >= 2) {
                mem.hardWords = mem.hardWords.filter(function (item) { return item && item.word !== key; });
                delete mem.hardTally[key];
            }
        }
    }

    function hardEntry(mem, key) {
        const keys = aliasKeys(key);
        let hit = null;
        (mem.hardWords || []).forEach(function (item) {
            const word = String((item && item.word) || '').trim().toLowerCase();
            if (word && keys.indexOf(word) >= 0) hit = item;
        });
        return hit;
    }

    function recordAnswer(src, word, extra, now) {
        const mem = createMemory(src);
        const key = wordKey(word);
        if (!key) return mem;
        const t = nowMs(now);
        const opt = extra && typeof extra === 'object' ? extra : {};
        const correct = !!opt.correct;
        const prev = mem.words[key] && typeof mem.words[key] === 'object' ? mem.words[key] : null;
        let box;
        let streak;
        if (!prev || !prev.box) {
            box = correct ? 2 : 1;
            streak = correct ? 1 : 0;
        } else if (correct) {
            box = Math.min(5, (Number(prev.box) || 1) + 1);
            streak = (Number(prev.streak) || 0) + 1;
        } else {
            box = Math.max(1, (Number(prev.box) || 1) - 1);
            streak = 0;
        }
        const row = Object.assign({}, prev || {}, {
            box: box,
            streak: streak,
            lastSeen: t,
            dueAt: t + boxIntervalMs(box)
        });
        if (opt.meet) {
            row.meets = (Number(row.meets) || 0) + 1;
        }
        mem.words[key] = row;
        noteHard(mem, key, correct, opt, String(t));
        if (opt.meet) {
            const hard = hardEntry(mem, key);
            if (hard) hard.meets = (Number(hard.meets) || 0) + 1;
        }
        return mem;
    }

    function dueWords(mem, now, filterIds) {
        const src = createMemory(mem);
        const t = nowMs(now);
        const allow = Array.isArray(filterIds)
            ? filterIds.map(wordKey).filter(Boolean)
            : null;
        const out = [];
        Object.keys(src.words).forEach(function (key) {
            const row = src.words[key];
            if (!row || row.dueAt == null) return;
            if (nowMs(row.dueAt) > t) return;
            if (allow && allow.indexOf(key) < 0) return;
            out.push(key);
        });
        return out;
    }

    function wordPower(mem) {
        const src = createMemory(mem);
        let n = 0;
        Object.keys(src.words).forEach(function (key) {
            n += Math.max(0, Number(src.words[key] && src.words[key].box) || 0);
        });
        return n;
    }

    function levelStars(mem, focusWords) {
        const list = (focusWords || []).map(wordKey).filter(Boolean);
        if (!list.length) return 0;
        const src = createMemory(mem);
        let sum = 0;
        list.forEach(function (key) {
            sum += Math.max(0, Number(src.words[key] && src.words[key].box) || 0);
        });
        return Math.round(sum / list.length);
    }

    function avgBox(mem, focusWords) {
        const list = (focusWords || []).map(wordKey).filter(Boolean);
        if (!list.length) return 0;
        const src = createMemory(mem);
        let sum = 0;
        list.forEach(function (key) {
            sum += Math.max(0, Number(src.words[key] && src.words[key].box) || 0);
        });
        return sum / list.length;
    }

    function hydrateFromLearned(learnedIds, now) {
        const mem = createMemory();
        const t = nowMs(now);
        (learnedIds || []).forEach(function (id) {
            const key = wordKey(id);
            if (!key || mem.words[key]) return;
            mem.words[key] = { box: 1, streak: 0, lastSeen: t, dueAt: t + DAY_MS };
        });
        return mem;
    }

    function attachToProgress(progress, mem) {
        const next = progress && typeof progress === 'object' ? progress : {};
        const src = createMemory(mem);
        next.wordMemory = src.words;
        next.memoryVersion = src.memoryVersion;
        next.hardWords = src.hardWords;
        next.hardTally = src.hardTally;
        return next;
    }

    function memoryFromProgress(progress, now) {
        const p = progress && typeof progress === 'object' ? progress : {};
        if (p.wordMemory && typeof p.wordMemory === 'object' && Object.keys(p.wordMemory).length) {
            return createMemory({
                memoryVersion: p.memoryVersion,
                words: p.wordMemory,
                hardWords: p.hardWords,
                hardTally: p.hardTally
            });
        }
        // 只读已落盘的词账。learnedIds 水合只在 loadProgress 做一次，
        // 避免首答把 english-word-* id 写成幽灵盒、词力多算。
        return createMemory({
            memoryVersion: p.memoryVersion,
            words: {},
            hardWords: p.hardWords,
            hardTally: p.hardTally
        });
    }

    function pushUnique(out, seen, key) {
        const k = wordKey(key);
        if (!k || seen[k]) return;
        seen[k] = true;
        out.push(k);
    }

    function buildWaveWords(opts) {
        const o = opts || {};
        const size = Math.max(1, Number(o.size) || 5);
        const cap = o.reviewCap == null ? 0.6 : Math.max(0, Math.min(1, Number(o.reviewCap)));
        const mem = createMemory(o.mem);
        const now = o.now;
        const reviewMax = Math.max(0, Math.floor(size * cap + 1e-9));
        const seen = {};
        const review = [];
        dueWords(mem, now, o.levelWords || []).forEach(function (w) { pushUnique(review, seen, w); });
        (o.otherDue || []).forEach(function (w) {
            if (dueWords(mem, now, [w]).length) pushUnique(review, seen, w);
        });
        (o.reviewWords || []).forEach(function (w) { pushUnique(review, seen, w); });
        const fresh = [];
        const freshSeen = Object.assign({}, seen);
        (o.levelWords || []).forEach(function (w) { pushUnique(fresh, freshSeen, w); });
        (o.focusWords || []).forEach(function (w) { pushUnique(fresh, freshSeen, w); });
        const out = review.slice(0, reviewMax);
        fresh.forEach(function (w) {
            if (out.length >= size) return;
            if (out.indexOf(w) >= 0) return;
            out.push(w);
        });
        if (cap >= 1 && out.length < size) {
            review.forEach(function (w) {
                if (out.length >= size) return;
                if (out.indexOf(w) >= 0) return;
                out.push(w);
            });
        }
        return out.slice(0, size);
    }

    function needsScaffold(mem, word) {
        const keys = aliasKeys(word);
        const src = createMemory(mem);
        const hard = hardEntry(src, word);
        if (!hard) return false;
        let meets = Number(hard.meets) || 0;
        keys.forEach(function (key) {
            meets = Math.max(meets, Number((src.words[key] && src.words[key].meets) || 0));
        });
        return meets === 1;
    }

    function scaffoldQuiz(word, mem) {
        const w = word || {};
        return {
            mode: 'choice',
            word: w,
            answer: w.zh || '',
            phraseZh: w.phraseZh || '',
            phonetic: w.phonetic || '',
            scaffold: true
        };
    }

    function pushSessionDensity(rows, item) {
        const next = cloneArr(rows);
        next.push({
            asked: Math.max(0, Number(item && item.asked) || 0),
            minutes: Math.max(0, Number(item && item.minutes) || 0)
        });
        return next.slice(-DENSITY_KEEP);
    }

    function densityLine(item) {
        const asked = Math.max(0, Math.round(Number(item && item.asked) || 0));
        const minutes = Math.max(0, Math.round(Number(item && item.minutes) || 0));
        return '本局答题 ' + asked + ' 题 · ' + minutes + ' 分钟';
    }

    global.BlockLegendWordMemory = {
        BOX_DAYS: BOX_DAYS,
        CURRENT_MEMORY_VERSION: CURRENT_MEMORY_VERSION,
        createMemory: createMemory,
        recordAnswer: recordAnswer,
        dueWords: dueWords,
        wordPower: wordPower,
        levelStars: levelStars,
        avgBox: avgBox,
        hydrateFromLearned: hydrateFromLearned,
        attachToProgress: attachToProgress,
        memoryFromProgress: memoryFromProgress,
        buildWaveWords: buildWaveWords,
        needsScaffold: needsScaffold,
        scaffoldQuiz: scaffoldQuiz,
        pushSessionDensity: pushSessionDensity,
        densityLine: densityLine
    };
})(typeof window !== 'undefined' ? window : globalThis);
