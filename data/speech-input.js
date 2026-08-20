/**
 * blocklegend · 语音结果归一化（Phase 2）
 * 不保存录音，不上传。浏览器适配在 game.js。
 */
(function (global) {
    'use strict';

    const FAIL_KINDS = ['no-permission', 'unsupported', 'timeout', 'noise', 'mismatch'];

    function normHeard(s) {
        return String(s || '').trim().toLowerCase().replace(/[^a-z']/g, '');
    }

    function editDistance(a, b) {
        const left = String(a || '');
        const right = String(b || '');
        const rows = left.length + 1;
        const cols = right.length + 1;
        const grid = [];
        for (let i = 0; i < rows; i += 1) {
            grid[i] = [i];
        }
        for (let j = 0; j < cols; j += 1) grid[0][j] = j;
        for (let i = 1; i < rows; i += 1) {
            for (let j = 1; j < cols; j += 1) {
                const cost = left[i - 1] === right[j - 1] ? 0 : 1;
                grid[i][j] = Math.min(
                    grid[i - 1][j] + 1,
                    grid[i][j - 1] + 1,
                    grid[i - 1][j - 1] + cost
                );
            }
        }
        return grid[left.length][right.length];
    }

    function tokensOf(s) {
        return String(s || '').toLowerCase().split(/[^a-z']+/).filter(Boolean);
    }

    const STT_ALIASES = {
        tree: ['three', 'tee', 'free'],
        bee: ['be'],
        sea: ['see', 'c'],
        see: ['sea', 'c'],
        sun: ['son'],
        one: ['won'],
        two: ['to', 'too'],
        four: ['for'],
        eight: ['ate'],
        no: ['know'],
        know: ['no'],
        night: ['knight'],
        knight: ['night'],
        right: ['write'],
        write: ['right'],
        flower: ['flour'],
        flour: ['flower'],
        bear: ['bare'],
        blue: ['blew'],
        red: ['read'],
        read: ['red']
    };

    function aliasHit(want, got) {
        const list = STT_ALIASES[want];
        return !!(list && list.indexOf(got) >= 0);
    }

    function cjkOf(s) {
        return String(s || '').replace(/[^\u4e00-\u9fff]/g, '');
    }

    function matchZh(wantZh, heard) {
        const want = String(wantZh || '').replace(/\s+/g, '');
        const got = cjkOf(heard);
        if (!want || !got) return false;
        return got === want || got.indexOf(want) !== -1 || want.indexOf(got) !== -1;
    }

    function closeEnough(want, got) {
        if (!want || !got) return false;
        if (want === got) return true;
        if (want.length <= 3) return false;
        return editDistance(want, got) <= 1;
    }

    const PHRASE_STOP = { the: 1, and: 1, you: 1 };
    const PHRASE_ANTI = { left: 'right', right: 'left' };

    function stripPhrase(s) {
        return String(s || '').toLowerCase().replace(/[^a-z\s']/g, ' ');
    }

    function speechMatch() {
        return (typeof global !== 'undefined' && global.SpeechMatch) || null;
    }

    function applyAliases(heard, want) {
        const parts = tokensOf(heard);
        const mapped = parts.map(function (part) {
            return aliasHit(want, part) ? want : part;
        });
        return mapped.join(' ');
    }

    function withEval(ok, kind, ev) {
        return { ok: !!ok, kind: kind, eval: ev || null };
    }

    function matchPhrase(target, heard, extra) {
        extra = extra || {};
        const want = stripPhrase(target);
        const got = stripPhrase(heard);
        if (!want || !got) return withEval(false, 'mismatch');
        const wantToks = tokensOf(want);
        const gotToks = tokensOf(got);
        let i = 0;
        for (i = 0; i < wantToks.length; i += 1) {
            const anti = PHRASE_ANTI[wantToks[i]];
            if (anti && gotToks.indexOf(anti) >= 0 && gotToks.indexOf(wantToks[i]) < 0) {
                return withEval(false, 'antonym');
            }
        }
        if (extra.key) {
            const keyHit = matchHeard(extra.key, heard);
            if (keyHit.ok) return withEval(true, 'key', keyHit.eval);
        }
        const SM = speechMatch();
        if (SM && SM.evaluate) {
            const ev = SM.evaluate(target, heard, extra.scene || 'sentence');
            if (ev.pass) return withEval(true, ev.rating || 'match', ev);
        }
        const content = wantToks.filter(function (t) {
            return t.length >= 3 && !PHRASE_STOP[t];
        });
        for (i = 0; i < content.length; i += 1) {
            const hit = matchHeard(content[i], heard);
            if (hit.ok) return withEval(true, 'content', hit.eval);
        }
        return withEval(false, 'mismatch');
    }

    function matchHeard(target, heard, extra) {
        const want = normHeard(target);
        if (!want) return withEval(false, 'mismatch');
        extra = extra || {};
        if (matchZh(extra.zh, heard)) return withEval(true, 'zh');
        const SM = speechMatch();
        if (SM && SM.evaluate) {
            const rewritten = applyAliases(heard, want) || heard;
            const ev = SM.evaluate(target, rewritten, extra.scene || 'word');
            if (ev.pass) return withEval(true, ev.rating || 'match', ev);
        }
        const parts = tokensOf(heard);
        let i = 0;
        for (i = 0; i < parts.length; i += 1) {
            if (closeEnough(want, parts[i]) || aliasHit(want, parts[i])) {
                return withEval(true, parts[i] === want ? 'match' : 'close');
            }
        }
        const got = normHeard(heard);
        if (closeEnough(want, got) || aliasHit(want, got)) {
            return withEval(true, want === got ? 'match' : 'close');
        }
        return withEval(false, 'mismatch');
    }

    function fail(kind) {
        const k = FAIL_KINDS.indexOf(kind) >= 0 ? kind : 'mismatch';
        return { ok: false, kind: k };
    }

    function canSpeak(host) {
        const env = host || (typeof window !== 'undefined' ? window : null);
        if (!env) return false;
        if (env.SpeechRecognition || env.webkitSpeechRecognition) return true;
        return !!env.Capacitor;
    }

    global.BlockLegendSpeech = {
        FAIL_KINDS: FAIL_KINDS,
        normHeard: normHeard,
        editDistance: editDistance,
        matchHeard: matchHeard,
        matchPhrase: matchPhrase,
        fail: fail,
        canSpeak: canSpeak
    };
}(typeof window !== 'undefined' ? window : globalThis));
