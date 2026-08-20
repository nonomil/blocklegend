/**
 * blocklegend · 句子跟读循环（T20260819-E4）
 * 无 DOM。播句 → 录音 → 评分 → 遍间停顿。评分低也推进。
 * 参数来自借鉴包 04 §7，不复制外部实现。
 */
(function (global) {
    'use strict';

    const PASSES_TARGET = 3;
    const MIN_RECORD_MS = 10000;
    const FIXED_INTERVAL_MS = 5000;
    const SKIP_WAIT_MS = 1000;
    const WORD_MS = 400;

    function wordCount(text) {
        const found = String(text || '').match(/[A-Za-z]+(?:'[A-Za-z]+)?/g);
        return found ? found.length : 0;
    }

    function sentenceMs(text) {
        return Math.max(1, wordCount(text)) * WORD_MS;
    }

    function recordLimitMs(text) {
        const seconds = sentenceMs(text) / 1000;
        return Math.round(Math.max(seconds * 2.5 + 5, 10) * 1000);
    }

    function intervalMs(text, opts) {
        const mode = opts && opts.mode;
        if (mode !== 'smart') return FIXED_INTERVAL_MS;
        const raw = 1000 + 0.6 * sentenceMs(text);
        return Math.round(Math.max(2000, Math.min(20000, raw)));
    }

    function scenes() {
        return global.BlockLegendScenes || {};
    }

    function lineOf(sceneId, idx) {
        const sc = scenes().sceneOf ? scenes().sceneOf(sceneId) : null;
        const lines = (sc && sc.lines) || [];
        return lines[idx] || null;
    }

    function lineCount(sceneId) {
        const sc = scenes().sceneOf ? scenes().sceneOf(sceneId) : null;
        return ((sc && sc.lines) || []).length;
    }

    function currentText(state) {
        const line = lineOf(state && state.sceneId, Number(state && state.line) || 0);
        return (line && line.en) || '';
    }

    function copy(state) {
        const src = state && typeof state === 'object' ? state : {};
        const next = {};
        Object.keys(src).forEach(function (key) { next[key] = src[key]; });
        return next;
    }

    function withLineTiming(state) {
        const next = copy(state);
        const text = currentText(next);
        next.recordLimitMs = recordLimitMs(text);
        next.intervalMs = intervalMs(text, { mode: 'smart' });
        return next;
    }

    function startLoop(sceneId) {
        return withLineTiming({
            sceneId: String(sceneId || 'greet'),
            line: 0,
            pass: 1,
            passesTarget: PASSES_TARGET,
            phase: 'playingPrompt',
            remainingMs: 0,
            lastStars: 0,
            lastScore: 0,
            lastRating: '',
            bestStars: 0,
            reason: ''
        });
    }

    function onPromptEnd(state) {
        const next = withLineTiming(state);
        next.phase = 'recording';
        next.remainingMs = next.recordLimitMs;
        next.reason = '';
        return next;
    }

    function onRecordFail(state) {
        const next = copy(state);
        next.phase = 'waitingForUser';
        next.reason = 'recordingFailed';
        return next;
    }

    function onUserResume(state) {
        const next = withLineTiming(state);
        next.phase = 'recording';
        next.remainingMs = next.recordLimitMs;
        next.reason = '';
        return next;
    }

    function starsOf(ev) {
        const match = global.SpeechMatch || {};
        if (ev && typeof ev.stars === 'number') return ev.stars;
        if (match.starsFromRating) return match.starsFromRating(ev && ev.rating);
        return ev && ev.pass ? 1 : 0;
    }

    function onRecordResult(state, ev) {
        const next = withLineTiming(state);
        const stars = starsOf(ev);
        next.lastStars = stars;
        next.lastScore = Number(ev && ev.score) || 0;
        next.lastRating = String((ev && ev.rating) || '');
        next.bestStars = Math.max(Number(next.bestStars) || 0, stars);
        next.phase = 'waitingInterval';
        next.remainingMs = next.intervalMs;
        next.reason = '';
        return next;
    }

    function onIntervalEnd(state) {
        const next = withLineTiming(state);
        const target = Number(next.passesTarget) || PASSES_TARGET;
        if ((Number(next.pass) || 1) < target) {
            next.pass = (Number(next.pass) || 1) + 1;
            next.phase = 'playingPrompt';
            next.remainingMs = 0;
            return next;
        }
        const total = lineCount(next.sceneId);
        const nxt = (Number(next.line) || 0) + 1;
        if (nxt >= total) {
            next.phase = 'done';
            next.done = true;
            next.remainingMs = 0;
            return next;
        }
        next.line = nxt;
        next.pass = 1;
        next.bestStars = 0;
        next.lastStars = 0;
        next.phase = 'playingPrompt';
        next.remainingMs = 0;
        return withLineTiming(next);
    }

    function skipWait(state) {
        const next = copy(state);
        next.remainingMs = SKIP_WAIT_MS;
        return next;
    }

    function again(state) {
        const next = withLineTiming(state);
        next.pass = (Number(next.pass) || 1) + 1;
        next.phase = 'playingPrompt';
        next.remainingMs = 0;
        next.reason = '';
        next.done = false;
        return next;
    }

    function sentenceKey(sceneId, line) {
        return String(sceneId || '') + ':' + String(Math.max(0, Math.round(Number(line) || 0)));
    }

    function stampSentence(progress, sceneId, line, extra) {
        const next = progress && typeof progress === 'object' ? progress : {};
        if (!next.sceneSentences || typeof next.sceneSentences !== 'object') next.sceneSentences = {};
        const key = sentenceKey(sceneId, line);
        const cur = next.sceneSentences[key] && typeof next.sceneSentences[key] === 'object'
            ? next.sceneSentences[key]
            : { stars: 0, attempts: 0, lastAt: '' };
        const stars = Math.max(0, Math.round(Number(extra && extra.stars) || 0));
        next.sceneSentences[key] = {
            stars: Math.max(Number(cur.stars) || 0, stars),
            attempts: (Number(cur.attempts) || 0) + 1,
            lastAt: String((extra && extra.now) || '')
        };
        return next;
    }

    global.BlockLegendSceneLoop = {
        PASSES_TARGET: PASSES_TARGET,
        recordLimitMs: recordLimitMs,
        intervalMs: intervalMs,
        startLoop: startLoop,
        onPromptEnd: onPromptEnd,
        onRecordFail: onRecordFail,
        onUserResume: onUserResume,
        onRecordResult: onRecordResult,
        onIntervalEnd: onIntervalEnd,
        skipWait: skipWait,
        again: again,
        stampSentence: stampSentence,
        sentenceKey: sentenceKey
    };
})(typeof window !== 'undefined' ? window : globalThis);
