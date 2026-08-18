/**
 * blocklegend · 词卡纯函数（T20260815-blocklegend-3d S3）
 * 词池切分 + 四选一同 theme 干扰项 + 出题节奏。
 */
(function (global) {
    'use strict';

    const SKIP_COMBO = 3;
    const BOSS_ASK_HP = 170;
    const QUIZ_MS = 12000;
    const PACK_BASE = './vocab/core-english-2026.08.15';
    const CAT_ORDER = ['颜色', '家人', '身体', '自然', '食物', '动物', '动作', '表达', '物品', '描述', '高频词', '生活', '学校'];
    const FALLBACK_BANK = [
        { id: 'tree', text: 'tree', zh: '树', theme: '自然' },
        { id: 'dirt', text: 'dirt', zh: '泥土', theme: '自然' },
        { id: 'sword', text: 'sword', zh: '剑', theme: '物品' },
        { id: 'slime', text: 'slime', zh: '史莱姆', theme: '动物' },
        { id: 'apple', text: 'apple', zh: '苹果', theme: '食物' }
    ];

    const BLOCK_FILLER = {
        grass: 1, dirt: 1, log: 1, leaf: 1, leaves: 1, plank: 1,
        cobble: 1, water: 1, snow: 1
    };

    function isBlockFiller(text) {
        return !!BLOCK_FILLER[String(text || '').toLowerCase()];
    }

    function shuffle(list) {
        const out = (list || []).slice();
        for (let i = out.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = out[i];
            out[i] = out[j];
            out[j] = tmp;
        }
        return out;
    }

    function byId(a, b) {
        return String(a.id || a.text) < String(b.id || b.text) ? -1 : 1;
    }

    function catRank(theme) {
        const i = CAT_ORDER.indexOf(theme);
        return i < 0 ? 99 : i;
    }

    const KID_SAY = {
        hot: 'h-ot', water: 'wa-ter', snow: 'sn-oh', cold: 'c-old', white: 'wh-ite',
        sun: 's-un', wind: 'w-ind', warm: 'w-arm', fish: 'f-ish', boat: 'b-oat',
        swim: 'sw-im', tree: 'tr-ee', apple: 'ap-ple', black: 'bl-ack'
    };

    function hyphenateWord(text) {
        const t = String(text || '').toLowerCase().replace(/[^a-z]/g, '');
        if (!t) return '';
        if (t.length <= 4) return t.split('').join('-');
        const suf = ['tion', 'ing', 'er', 'ly', 'ed', 'es'];
        for (let i = 0; i < suf.length; i += 1) {
            const s = suf[i];
            if (t.length > s.length + 2 && t.slice(-s.length) === s) {
                return t.slice(0, -s.length) + '-' + s;
            }
        }
        const mid = Math.ceil(t.length / 2);
        return t.slice(0, mid) + '-' + t.slice(mid);
    }

    function phoneticOf(word) {
        const w = word || {};
        if (w.phonetic) return String(w.phonetic);
        const t = String(w.text || '').trim().toLowerCase();
        return KID_SAY[t] || hyphenateWord(t);
    }

    function cardsToBank(catalog, base) {
        const root = String(base || PACK_BASE).replace(/\/$/, '');
        const cards = (catalog && catalog.cards) || [];
        return cards.map(function (card) {
            const image = card.image ? root + '/' + card.image : '';
            const audio = card.audio ? root + '/' + card.audio : '';
            return {
                id: card.id,
                text: card.word,
                zh: card.translation,
                theme: card.category || '',
                level: card.curriculumLevel || 'L1',
                phrase: card.example || card.phrase || '',
                phraseZh: card.exampleZh || card.phraseTranslation || '',
                phonetic: card.phonetic || phoneticOf({ text: card.word }),
                distractors: Array.isArray(card.distractors) ? card.distractors.slice() : [],
                media: { image: image, audio: audio }
            };
        }).filter(function (w) { return w.text && w.zh; });
    }

    function loadCatalog(done, opts) {
        const o = opts || {};
        const base = o.base || PACK_BASE;
        if (o.catalog) {
            done(null, cardsToBank(o.catalog, base));
            return;
        }
        if (typeof fetch !== 'function') {
            done(new Error('no fetch'));
            return;
        }
        fetch(base + '/catalog.json').then(function (res) {
            if (!res.ok) throw new Error('catalog ' + res.status);
            return res.json();
        }).then(function (json) {
            done(null, cardsToBank(json, base));
        }).catch(function (err) {
            done(err);
        });
    }

    function chapterCount(opts) {
        const fromOpts = Number(opts && opts.chapters);
        if (fromOpts > 0) return Math.floor(fromOpts);
        const L = global.BlockLegendLevels;
        const fromLevels = L && Number(L.LEVEL_TOTAL);
        if (fromLevels > 0) return Math.floor(fromLevels);
        return 12;
    }

    function themesForLevel(level, opts) {
        if (opts && Array.isArray(opts.themes) && opts.themes.length) return opts.themes;
        const L = global.BlockLegendLevels;
        const row = L && L.levelOf && L.levelOf(level);
        return (row && Array.isArray(row.wordThemes) && row.wordThemes.length) ? row.wordThemes : [];
    }

    function seedsOf(level) {
        const Lvl = global.BlockLegendLevels;
        const row = Lvl && Lvl.levelOf && Lvl.levelOf(level);
        const keys = [];
        (row && row.climateWords || []).forEach(function (k) {
            const t = normAnswer(k);
            if (t && keys.indexOf(t) < 0) keys.push(t);
        });
        return keys;
    }

    function claimListed(list, keys, usedIds, out, limit) {
        (keys || []).forEach(function (key) {
            if (out.length >= limit) return;
            const hit = findBankWord(list, key);
            if (!hit) return;
            const id = hit.id || hit.text;
            if (!id || usedIds[id]) return;
            usedIds[id] = true;
            out.push(hit);
        });
    }

    function fillListed(list, usedIds, out, limit, ok) {
        (list || []).forEach(function (w) {
            if (out.length >= limit) return;
            if (!w || !ok(w)) return;
            const id = w.id || w.text;
            if (!id || usedIds[id]) return;
            usedIds[id] = true;
            out.push(w);
        });
    }

    function buildChapters(list, chapters) {
        const used = {};
        const packs = [];
        for (let lv = 1; lv <= chapters; lv += 1) {
            const want = lv === chapters ? list.length : Math.ceil(list.length / chapters);
            const out = [];
            claimListed(list, seedsOf(lv), used, out, want);
            packs.push({ out: out, want: want, themes: themesForLevel(lv, {}) });
        }
        for (let lv = 1; lv <= chapters; lv += 1) {
            const rec = packs[lv - 1];
            (rec.themes || []).forEach(function (theme) {
                fillListed(list, used, rec.out, rec.want, function (w) { return w.theme === theme; });
            });
            if (lv < chapters) fillListed(list, used, rec.out, rec.want, function () { return true; });
        }
        fillListed(list, used, packs[chapters - 1].out, list.length, function () { return true; });
        return packs.map(function (p) { return p.out; });
    }

    function takeThemedChapter(list, lv, chapters, themes, usedIds) {
        const remain = (list || []).filter(function (w) {
            return w && !usedIds[w.id || w.text];
        });
        const want = lv === chapters ? remain.length : Math.ceil((list || []).length / chapters);
        const out = [];
        function take(ok) {
            remain.forEach(function (w) {
                if (out.length >= want) return;
                const id = w.id || w.text;
                if (!id || usedIds[id] || !ok(w)) return;
                usedIds[id] = true;
                out.push(w);
            });
        }
        (themes || []).forEach(function (theme) {
            take(function (w) { return w.theme === theme; });
        });
        take(function () { return true; });
        return out;
    }

    function poolForLevel(bank, level, opts) {
        const list = (Array.isArray(bank) ? bank.slice() : []).sort(function (a, b) {
            const d = catRank(a.theme) - catRank(b.theme);
            return d !== 0 ? d : byId(a, b);
        });
        if (!list.length) return [];
        const chapters = chapterCount(opts);
        const lv = Math.max(1, Math.min(chapters, Number(level) || 1));
        const hasTable = !!(global.BlockLegendLevels && global.BlockLegendLevels.levelOf);
        if (hasTable) {
            return buildChapters(list, chapters)[lv - 1] || [];
        }
        const themes = themesForLevel(lv, opts);
        if (!themes.length) {
            const size = Math.ceil(list.length / chapters);
            const start = (lv - 1) * size;
            return list.slice(start, lv === chapters ? list.length : start + size);
        }
        const used = {};
        for (let i = 1; i < lv; i += 1) {
            takeThemedChapter(list, i, chapters, themesForLevel(i, {}), used);
        }
        return takeThemedChapter(list, lv, chapters, themes, used);
    }

    function pickWaveTheme(pool, usedKeys, preferred) {
        const used = {};
        (usedKeys || []).forEach(function (k) { used[normAnswer(k)] = true; });
        const counts = {};
        (pool || []).forEach(function (w) {
            if (!w || !w.theme) return;
            if (used[normAnswer(w.text)] || used[normAnswer(w.id)]) return;
            counts[w.theme] = (counts[w.theme] || 0) + 1;
        });
        const wants = (preferred || []).filter(function (t) { return (counts[t] || 0) > 0; });
        if (wants.length) return wants[0];
        let best = '';
        let n = 0;
        Object.keys(counts).forEach(function (t) {
            if (counts[t] > n) {
                best = t;
                n = counts[t];
            }
        });
        return best;
    }

    function dueThemeAwards(pool, familiarIds, awarded) {
        const done = awarded || {};
        const hits = {};
        const map = {};
        (pool || []).forEach(function (w) {
            if (w && (w.id || w.text)) map[String(w.id || w.text)] = w;
            if (w && w.text) map[String(w.text).toLowerCase()] = w;
        });
        (familiarIds || []).forEach(function (id) {
            const w = map[String(id)] || map[String(id).toLowerCase()];
            const theme = w && w.theme;
            if (!theme) return;
            hits[theme] = (hits[theme] || 0) + 1;
        });
        const out = [];
        Object.keys(hits).forEach(function (theme) {
            const have = hits[theme];
            const already = Number(done[theme]) || 0;
            THEME_STEPS.forEach(function (need) {
                if (have >= need && already < need) {
                    const pack = THEME_PACKS[need] || THEME_PACKS[4];
                    out.push({
                        theme: theme,
                        need: need,
                        coins: pack.coins,
                        loot: pack.loot
                    });
                }
            });
        });
        return out;
    }

    function uniqueZh(list) {
        const seen = {};
        const out = [];
        (list || []).forEach(function (w) {
            const zh = w && w.zh;
            if (!zh || seen[zh]) return;
            seen[zh] = true;
            out.push(zh);
        });
        return out;
    }

    function pickN(arr, n) {
        const copy = arr.slice();
        const out = [];
        while (copy.length && out.length < n) {
            const i = Math.floor(Math.random() * copy.length);
            out.push(copy.splice(i, 1)[0]);
        }
        return out;
    }

    function shuffle(arr) {
        const copy = arr.slice();
        for (let i = copy.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = copy[i]; copy[i] = copy[j]; copy[j] = t;
        }
        return copy;
    }

    function quizFor(word, bank) {
        const src = word || {};
        const answer = src.zh || '';
        const list = bank || [];
        let fallback = false;
        let picks = [];
        (src.distractors || []).forEach(function (en) {
            const hit = list.find(function (w) { return w && w.text === en && w.zh && w.zh !== answer; });
            if (hit && picks.indexOf(hit.zh) === -1) picks.push(hit.zh);
        });
        if (picks.length < 3) {
            const same = uniqueZh(list.filter(function (w) {
                return w && w.theme === src.theme && w.zh && w.zh !== answer;
            }));
            same.forEach(function (zh) {
                if (picks.length < 3 && picks.indexOf(zh) === -1) picks.push(zh);
            });
        }
        if (picks.length < 3) {
            fallback = true;
            uniqueZh(list.filter(function (w) { return w && w.zh && w.zh !== answer; })).forEach(function (zh) {
                if (picks.length < 3 && picks.indexOf(zh) === -1) picks.push(zh);
            });
        }
        picks = picks.slice(0, 3);
        return {
            mode: 'choice',
            word: src,
            answer: answer,
            choices: shuffle([answer].concat(picks)),
            phrase: src.phrase || '',
            phraseZh: src.phraseZh || '',
            fallback: fallback
        };
    }

    const QUIZ_MODES = ['choice', 'enpick', 'listen', 'picture', 'fill', 'spell', 'letters', 'phrase', 'sentence', 'enphrase'];
    const THEME_STEPS = [4, 8, 12];
    const THEME_PACKS = {
        4: { coins: 8, loot: { 'oak-log': 2, stick: 2 } },
        8: { coins: 12, loot: { plank: 2, coal: 2 } },
        12: { coins: 16, loot: { torch: 3, iron_ore: 1 } }
    };
    const HARD_MISS = 3;
    const PHRASE_EVERY = 4;
    const SHORT_SPELL = 5;

    function normAnswer(s) {
        return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
    }

    function escapeRe(s) {
        return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function blankPhrase(word) {
        const phrase = String((word && word.phrase) || '').trim();
        const text = String((word && word.text) || '').trim();
        if (!phrase || !text) return '';
        const re = new RegExp(escapeRe(text), 'i');
        if (!re.test(phrase)) return '';
        return phrase.replace(re, '____');
    }

    function availableModes(word) {
        const w = word || {};
        const modes = ['choice', 'enpick'];
        if (w.media && (w.media.audio || w.text)) modes.push('listen');
        if (w.media && w.media.image) modes.push('picture');
        if (blankPhrase(w)) modes.push('fill');
        if ((w.text || '').length >= 2 && (w.text || '').length <= 12) modes.push('spell');
        if ((w.text || '').length >= 3 && (w.text || '').length <= 12) modes.push('letters');
        if ((w.phrase || '').length >= 4 && w.phraseZh) {
            modes.push('phrase');
            modes.push('sentence');
            modes.push('enphrase');
        }
        return modes;
    }

    function missCount(mastery) {
        const m = mastery || {};
        return Math.max(0, (Number(m.attempts) || 0) - (Number(m.correct) || 0));
    }

    function missStreakOf(opts) {
        const o = opts || {};
        if (o.missStreak != null) return Math.max(0, Number(o.missStreak) || 0);
        if (o.misses != null) return Math.max(0, Number(o.misses) || 0);
        return missCount(o.mastery);
    }

    function needsHardMode(word, opts) {
        return missStreakOf(opts) >= HARD_MISS;
    }

    function hasSentence(word) {
        const w = word || {};
        return !!(w.phrase && w.phraseZh);
    }

    function shouldJoinPhrase(word, opts) {
        const o = opts || {};
        if (o.showPhrase === true) return hasSentence(word);
        if (o.showPhrase === false || o.gate) return false;
        const turn = Number(o.turn) || 0;
        return hasSentence(word) && turn > 0 && turn % PHRASE_EVERY === 2;
    }

    function modeForStage(stage, word) {
        const modes = availableModes(word);
        function first(ids) {
            for (let i = 0; i < ids.length; i += 1) {
                if (modes.indexOf(ids[i]) >= 0) return ids[i];
            }
            return 'choice';
        }
        if (stage === 'familiar') return first(['enpick', 'choice']);
        if (stage === 'due' || stage === 'mastered') return first(['listen', 'fill', 'enpick']);
        if (stage === 'spoken' || stage === 'recall') return first(['fill', 'spell', 'enpick']);
        return 'choice';
    }

    function isShortWord(word) {
        const t = String((word && word.text) || '').replace(/\s+/g, '');
        return t.length > 0 && t.length <= SHORT_SPELL;
    }

    function recallProduceMode(word) {
        const modes = availableModes(word);
        function first(ids) {
            for (let i = 0; i < ids.length; i += 1) {
                if (modes.indexOf(ids[i]) >= 0) return ids[i];
            }
            return 'enpick';
        }
        if (isShortWord(word)) return first(['spell', 'letters', 'enpick']);
        return first(['enpick', 'letters', 'spell']);
    }

    function pickQuizMode(word, opts) {
        const o = opts || {};
        if (o.mode && QUIZ_MODES.indexOf(o.mode) >= 0) return o.mode;
        if (needsHardMode(word, o)) {
            const modes = availableModes(word);
            if (modes.indexOf('spell') >= 0) return 'spell';
            if (modes.indexOf('fill') >= 0) return 'fill';
            return 'choice';
        }
        if (o.seen != null) {
            const n = Math.max(0, Number(o.seen) || 0);
            if (n <= 0) return 'choice';
            return recallProduceMode(word);
        }
        if (o.stage && o.stage !== 'new') return modeForStage(o.stage, word);
        const turn = Number(o.turn) || 0;
        if (!o.gate && hasSentence(word) && turn > 0 && turn % PHRASE_EVERY === 0) return 'sentence';
        if (turn > 0 && turn % 4 === 3) {
            const modes = availableModes(word);
            const mix = ['enpick', 'listen', 'fill', 'spell'].filter(function (id) {
                return modes.indexOf(id) >= 0;
            });
            if (mix.length) return mix[Math.floor(Math.random() * mix.length)];
        }
        return 'choice';
    }

    function englishChoices(word, bank) {
        const src = word || {};
        const list = bank || [];
        const picks = [];
        (src.distractors || []).forEach(function (en) {
            if (en && en !== src.text && picks.indexOf(en) === -1) picks.push(en);
        });
        list.filter(function (w) { return w && w.theme === src.theme && w.text && w.text !== src.text; }).forEach(function (w) {
            if (picks.length < 3 && picks.indexOf(w.text) === -1) picks.push(w.text);
        });
        list.forEach(function (w) {
            if (picks.length < 3 && w && w.text && w.text !== src.text && picks.indexOf(w.text) === -1) picks.push(w.text);
        });
        return shuffle([src.text].concat(picks.slice(0, 3)));
    }

    function uniquePhraseZh(list) {
        const seen = {};
        const out = [];
        (list || []).forEach(function (w) {
            const zh = w && w.phraseZh;
            if (!zh || seen[zh]) return;
            seen[zh] = true;
            out.push(zh);
        });
        return out;
    }

    function uniquePhraseEn(list) {
        const seen = {};
        const out = [];
        (list || []).forEach(function (w) {
            const en = w && w.phrase;
            if (!en || seen[en]) return;
            seen[en] = true;
            out.push(en);
        });
        return out;
    }

    function letterBlank(text) {
        const t = String(text || '').trim();
        if (t.length < 3) {
            return { blank: (t.charAt(0) || '') + '_', answer: t };
        }
        const hide = t.length >= 6 ? 2 : 1;
        const start = Math.max(1, Math.floor((t.length - hide) / 2));
        return {
            blank: t.slice(0, start) + new Array(hide + 1).join('_') + t.slice(start + hide),
            answer: t
        };
    }

    function enphraseQuiz(word, bank) {
        const src = word || {};
        const answer = src.phrase || '';
        const list = bank || [];
        const picks = [];
        uniquePhraseEn(list.filter(function (w) {
            return w && w.theme === src.theme && w.phrase && w.phrase !== answer;
        })).forEach(function (en) {
            if (picks.length < 3) picks.push(en);
        });
        uniquePhraseEn(list).forEach(function (en) {
            if (picks.length < 3 && en !== answer && picks.indexOf(en) < 0) picks.push(en);
        });
        return {
            choices: shuffle(answer ? [answer].concat(picks.slice(0, 3)) : picks.slice(0, 4)),
            fallback: picks.length < 3
        };
    }

    function sentenceQuiz(word, bank) {
        const src = word || {};
        const answer = src.phraseZh || '';
        const list = bank || [];
        const picks = [];
        uniquePhraseZh(list.filter(function (w) {
            return w && w.theme === src.theme && w.phraseZh && w.phraseZh !== answer;
        })).forEach(function (zh) {
            if (picks.length < 3) picks.push(zh);
        });
        uniquePhraseZh(list).forEach(function (zh) {
            if (picks.length < 3 && zh !== answer && picks.indexOf(zh) < 0) picks.push(zh);
        });
        return {
            choices: shuffle(answer ? [answer].concat(picks.slice(0, 3)) : picks.slice(0, 4)),
            fallback: picks.length < 3
        };
    }

    function makeQuiz(word, bank, opts) {
        const src = word || {};
        const mode = pickQuizMode(src, opts);
        const choice = quizFor(src, bank);
        const quiz = {
            mode: mode,
            word: src,
            phrase: src.phrase || '',
            phraseZh: src.phraseZh || '',
            blank: blankPhrase(src),
            prompt: '选出中文',
            choices: choice.choices,
            answer: src.zh || '',
            typed: false,
            fallback: choice.fallback,
            showPhrase: false,
            showPhraseZh: false,
            limitMs: QUIZ_MS
        };
        if (mode === 'listen') {
            quiz.prompt = '听单词，选出意思';
            quiz.hidePromptWord = true;
        } else if (mode === 'picture') {
            quiz.prompt = '看图选单词';
            quiz.hidePromptWord = true;
            quiz.choices = englishChoices(src, bank);
            quiz.answer = src.text;
        } else if (mode === 'fill') {
            quiz.prompt = '补全句子';
            quiz.hidePromptWord = true;
            quiz.typed = true;
            quiz.answer = src.text;
            quiz.limitMs = 18000;
        } else if (mode === 'spell') {
            quiz.prompt = '拼出单词';
            quiz.hidePromptWord = true;
            quiz.typed = true;
            quiz.answer = src.text;
            quiz.limitMs = 18000;
        } else if (mode === 'phrase') {
            quiz.prompt = '写出英文句子';
            quiz.hidePromptWord = true;
            quiz.typed = true;
            quiz.answer = src.phrase;
            quiz.limitMs = 22000;
        } else if (mode === 'sentence') {
            const sent = sentenceQuiz(src, bank);
            quiz.prompt = '英文句子，选中文';
            quiz.choices = sent.choices;
            quiz.answer = src.phraseZh || '';
            quiz.showPhrase = true;
            quiz.showPhraseZh = false;
            quiz.fallback = sent.fallback;
        } else if (mode === 'enphrase') {
            const sent = enphraseQuiz(src, bank);
            quiz.prompt = '中文句子，选英文';
            quiz.hidePromptWord = true;
            quiz.choices = sent.choices;
            quiz.answer = src.phrase || '';
            quiz.showPhrase = false;
            quiz.showPhraseZh = true;
            quiz.fallback = sent.fallback;
        } else if (mode === 'letters') {
            const gap = letterBlank(src.text);
            quiz.prompt = '补全缺的字母';
            quiz.hidePromptWord = true;
            quiz.typed = true;
            quiz.blank = gap.blank;
            quiz.answer = gap.answer;
            quiz.limitMs = 18000;
        } else if (mode === 'enpick') {
            quiz.prompt = '看中文，选英文';
            quiz.hidePromptWord = true;
            quiz.choices = englishChoices(src, bank);
            quiz.answer = src.text;
            quiz.showPhrase = Number(opts && opts.seen) >= 2 && !!(src.phrase);
            quiz.showPhraseZh = !!(src.phraseZh);
        } else if (mode === 'choice') {
            quiz.showPhrase = shouldJoinPhrase(src, opts);
            quiz.showPhraseZh = false;
        }
        return quiz;
    }

    function bindCastWord(pool, usedIds, opts) {
        const o = opts || {};
        const used = {};
        (usedIds || []).forEach(function (id) { if (id) used[id] = true; });
        const list = (pool || []).filter(function (w) { return w && w.text; });
        function findText(text) {
            const want = normAnswer(text);
            if (!want) return null;
            return list.find(function (w) { return normAnswer(w.text) === want; }) || null;
        }
        const preferred = findText(o.prefer);
        if (preferred && !o.reviewFirst) return preferred;
        if (o.reviewFirst) {
            const reviewHits = (Array.isArray(o.review) ? o.review : []).map(findText).filter(function (hit) {
                return hit && !used[hit.id || hit.text] && !isBlockFiller(hit.text);
            });
            if (reviewHits.length) return reviewHits[0];
        }
        if (preferred) return preferred;
        if (o.theme) {
            const themed = list.filter(function (w) {
                return w && w.theme === o.theme && !used[w.id || w.text] && !isBlockFiller(w.text);
            });
            if (themed.length) return themed[Math.floor(Math.random() * themed.length)];
        }
        if (o.kind) {
            const label = labelFor(o.kind, list);
            const known = !!KIND_ALIASES[o.kind];
            const word = (label && label.word) || (known && label && label.en
                ? { id: label.en, text: label.en, zh: label.zh || '', theme: '动物' }
                : null);
            const id = word && (word.id || word.text);
            if (word && id && !used[id] && !isBlockFiller(word.text)) return word;
        }
        const focusHits = (Array.isArray(o.focus) ? o.focus : []).map(findText).filter(function (hit) {
            return hit && !used[hit.id || hit.text] && !isBlockFiller(hit.text);
        });
        if (focusHits.length) return focusHits[Math.floor(Math.random() * focusHits.length)];
        const fresh = list.filter(function (w) {
            return w && !used[w.id || w.text] && !isBlockFiller(w.text);
        });
        if (fresh.length) return fresh[Math.floor(Math.random() * fresh.length)];
        const nonFill = list.filter(function (w) { return w && !isBlockFiller(w.text); });
        if (nonFill.length) return nonFill[Math.floor(Math.random() * nonFill.length)];
        return list[0] || null;
    }

    function matchCast(typed, targets) {
        const needle = normAnswer(typed);
        if (!needle) return null;
        const list = targets || [];
        for (let i = 0; i < list.length; i += 1) {
            const t = list[i];
            const word = t && (t.word || t);
            if (word && normAnswer(word.text) === needle) return t;
        }
        return null;
    }

    function checkQuiz(quiz, input) {
        const q = quiz || {};
        if (q.word && normAnswer(input) === normAnswer(q.word.text)) return true;
        if (q.typed || q.mode === 'spell' || q.mode === 'fill' || q.mode === 'letters' || q.mode === 'enphrase') {
            return normAnswer(input) === normAnswer(q.answer);
        }
        return String(input) === String(q.answer);
    }

    function channelOf(quiz, input) {
        const q = quiz || {};
        if (q.mode === 'listen') return 'listen';
        if (q.mode === 'enpick' || q.mode === 'enphrase') return 'enpick';
        if (q.word && normAnswer(input) === normAnswer(q.word.text)) return 'spell';
        if (q.typed || q.mode === 'spell' || q.mode === 'fill' || q.mode === 'letters' || q.mode === 'phrase') return 'spell';
        return 'choice';
    }

    function canTypeCast(opts) {
        const o = opts || {};
        if (o.boss) return true;
        return needsHardMode(o.word, { missStreak: o.missStreak });
    }

    function noteId(list, id) {
        const out = Array.isArray(list) ? list.slice() : [];
        const key = String(id || '');
        if (key && out.indexOf(key) < 0) out.push(key);
        return out;
    }

    function unreadSpeakCount(shownIds, spokenIds) {
        const spoken = {};
        (spokenIds || []).forEach(function (id) { if (id) spoken[id] = true; });
        let n = 0;
        (shownIds || []).forEach(function (id) { if (id && !spoken[id]) n += 1; });
        return n;
    }

    function resolveAttempt(quiz, input, opts) {
        const correct = checkQuiz(quiz, input);
        const retried = !!(opts && opts.retried);
        if (correct) {
            return {
                correct: true,
                retry: false,
                record: true,
                crit: true,
                comboKeep: !retried,
                reveal: (quiz && quiz.answer) || ''
            };
        }
        if (!retried) {
            return {
                correct: false,
                retry: true,
                record: false,
                crit: false,
                comboKeep: false,
                reveal: (quiz && quiz.answer) || '',
                speak: true
            };
        }
        return {
            correct: false,
            retry: false,
            record: true,
            crit: false,
            comboKeep: false,
            reveal: (quiz && quiz.answer) || ''
        };
    }

    function findBankWord(list, key) {
        const want = normAnswer(key);
        if (!want) return null;
        return list.find(function (w) {
            return w && (normAnswer(w.text) === want || normAnswer(w.id) === want);
        }) || null;
    }

    function collectReviewKeys(opts) {
        const o = opts || {};
        const keys = [];
        function push(key) {
            const k = String(key || '').trim();
            if (k && keys.indexOf(k) < 0) keys.push(k);
        }
        (o.review || []).forEach(push);
        (o.missed || []).forEach(push);
        const mastery = o.mastery || {};
        Object.keys(mastery).forEach(function (id) {
            if (masteryStage(mastery[id], o.today) === 'due') push(id);
        });
        return keys;
    }

    function layoutWorldWords(pool, reviewKeys) {
        const keys = {};
        (reviewKeys || []).forEach(function (key) {
            const k = normAnswer(key);
            if (k) keys[k] = true;
        });
        const near = [];
        const far = [];
        (pool || []).forEach(function (w) {
            if (!w || !w.text) return;
            if (keys[normAnswer(w.text)] || keys[normAnswer(w.id)]) far.push(w);
            else near.push(w);
        });
        return near.concat(far);
    }

    function rebindWorldReviewWords(wordCells, pool, reviewKeys, opts) {
        const cells = wordCells || {};
        const o = opts || {};
        const cx = Number(o.cx) || 0;
        const cz = Number(o.cz) || 0;
        const list = (pool || []).filter(function (w) { return w && w.text; });
        function findText(text) {
            const want = normAnswer(text);
            if (!want) return null;
            return list.find(function (w) {
                return w && (normAnswer(w.text) === want || normAnswer(w.id) === want);
            }) || null;
        }
        const wantKeys = [];
        (reviewKeys || []).forEach(function (key) {
            const k = normAnswer(key);
            if (k && wantKeys.indexOf(k) < 0) wantKeys.push(k);
        });
        const occupied = {};
        Object.keys(cells).forEach(function (cellKey) {
            const w = cells[cellKey];
            if (!w) return;
            occupied[normAnswer(w.text)] = true;
            occupied[normAnswer(w.id)] = true;
        });
        const need = wantKeys.map(findText).filter(function (hit) {
            return hit && !occupied[normAnswer(hit.text)] && !occupied[normAnswer(hit.id)];
        });
        if (!need.length) return cells;
        const slots = Object.keys(cells).map(function (cellKey) {
            const parts = cellKey.split(',');
            const w = cells[cellKey];
            const isReview = !!(w && (wantKeys.indexOf(normAnswer(w.text)) >= 0 || wantKeys.indexOf(normAnswer(w.id)) >= 0));
            return {
                cellKey: cellKey,
                dist: Math.hypot((Number(parts[0]) || 0) - cx, (Number(parts[2]) || 0) - cz),
                isReview: isReview
            };
        }).filter(function (slot) { return !slot.isReview; }).sort(function (a, b) {
            return b.dist - a.dist;
        });
        need.forEach(function (word, i) {
            if (!slots[i]) return;
            cells[slots[i].cellKey] = word;
        });
        return cells;
    }

    function focusPool(bank, level, opts) {
        const o = opts || {};
        const prefer = o.prefer || [];
        const list = Array.isArray(bank) ? bank : [];
        const chapter = poolForLevel(list, level, o);
        const reviewRatio = Math.max(0, Number(o.reviewRatio) || 0);
        let size = Math.max(1, Number(o.size) || chapter.length || 5);
        if (o.coverChapter) {
            const extra = Math.round(chapter.length * reviewRatio);
            size = Math.max(size, chapter.length + extra);
        }
        const out = [];
        const used = {};
        function add(hit, allowFiller) {
            if (!hit || out.length >= size) return;
            if (!allowFiller && isBlockFiller(hit.text)) return;
            const id = hit.id || hit.text;
            if (!id || used[id]) return;
            used[id] = true;
            out.push(hit);
        }
        const reviewN = o.coverChapter
            ? Math.max(0, size - chapter.length)
            : Math.min(size, Math.round(size * reviewRatio));
        if (reviewN) {
            collectReviewKeys(o).forEach(function (key) {
                if (out.length < reviewN) add(findBankWord(list, key), true);
            });
        }
        prefer.forEach(function (text) {
            add(findBankWord(list, text), false);
        });
        (o.coverChapter ? chapter : shuffle(chapter)).forEach(function (hit) { add(hit, !!o.coverChapter); });
        if (out.length < size) shuffle(list).forEach(function (hit) { add(hit, false); });
        return shuffle(out).slice(0, size);
    }

    function bossAskTimes(maxHp) {
        return (Number(maxHp) || 0) >= BOSS_ASK_HP ? 3 : 2;
    }

    function bossAskMarks(maxHp) {
        return bossAskTimes(maxHp) === 3 ? [0.75, 0.5, 0.25] : [0.5, 0.25];
    }

    const REASK_HITS = 4;

    function shouldAsk(opts) {
        const o = opts || {};
        if (o.force) return true;
        if (o.bossShielded) return true;
        if (o.quizPassed) return false;
        if (o.firstHit) return true;
        if (o.lastQuizWrong && (Number(o.hitsSinceQuiz) || 0) >= REASK_HITS) return true;
        return false;
    }

    function shouldNudgeSpeak(opts) {
        const o = opts || {};
        if (o.boss) {
            const maxHp = Number(o.maxHp) || 80;
            const hp = o.hp == null ? maxHp : Number(o.hp);
            const asked = Number(o.askedCount) || 0;
            const marks = bossAskMarks(maxHp);
            if (asked >= marks.length) return false;
            return hp <= maxHp * marks[asked];
        }
        return !!o.firstHit;
    }

    const KIND_ALIASES = {
        grass: ['grass'],
        dirt: ['dirt'],
        sand: ['sand'],
        snow: ['snow'],
        stone: ['stone'],
        water: ['water'],
        coal: ['coal'],
        iron: ['iron'],
        gold: ['gold'],
        diamond: ['diamond'],
        villager: ['villager'],
        trader: ['wandering trader', 'trader'],
        teacher: ['teacher'],
        house: ['home', 'house'],
        wordhouse: ['home', 'word house'],
        traderhouse: ['home', 'trader house'],
        pig: ['pig'],
        cow: ['cow'],
        sheep: ['sheep'],
        chicken: ['chicken'],
        wolf: ['wolf'],
        bee: ['bee'],
        chest: ['chest'],
        furnace: ['furnace'],
        torch: ['torch'],
        dragon: ['ender dragon', 'dragon'],
        storm: ['wither storm', 'storm'],
        bed: ['bed'],
        wheat: ['wheat'],
        tree: ['tree'],
        flower: ['flower'],
        golem: ['iron golem', 'golem'],
        gate: ['gate'],
        plank: ['plank'],
        table: ['crafting table', 'table'],
        log: ['log'],
        leaf: ['leaves', 'leaf'],
        slime: ['slime'],
        cube: ['mob'],
        husk: ['husk'],
        ravager: ['ravager'],
        phantom: ['phantom'],
        vex: ['vex'],
        drowned: ['drowned'],
        snowgolem: ['snow golem', 'snowgolem'],
        shulker: ['shulker'],
        guardian: ['guardian'],
        pufferfish: ['pufferfish'],
        spore_bug: ['spore bug', 'spore_bug'],
        fire_spirit: ['fire spirit', 'fire_spirit'],
        sculk_worm: ['sculk worm', 'sculk_worm'],
        shadow_stalker: ['shadow stalker', 'shadow_stalker'],
        creeper: ['creeper'],
        zombie: ['zombie'],
        skeleton: ['skeleton'],
        spider: ['spider'],
        enderman: ['enderman'],
        piglin: ['piglin'],
        witch: ['witch'],
        fox: ['fox'],
        magma: ['magma cube', 'magma'],
        blaze: ['blaze'],
        ghast: ['ghast'],
        warden: ['warden'],
        bow: ['bow'],
        arrow: ['arrow'],
        shield: ['shield'],
        boss: ['wither'],
        wither: ['wither', 'sword'],
        merchant: ['villager'],
        sword: ['sword'],
        axe: ['axe'],
        pickaxe: ['pickaxe'],
        shovel: ['shovel']
    };
    const KIND_FALLBACK_ZH = {
        grass: '草方块',
        dirt: '泥土',
        sand: '沙子',
        snow: '雪',
        stone: '石头',
        water: '水',
        coal: '煤矿',
        iron: '铁矿',
        gold: '金矿',
        diamond: '钻石矿',
        villager: '村民',
        trader: '流浪商人',
        teacher: '老师',
        house: '家',
        wordhouse: '单词屋',
        traderhouse: '商人屋',
        pig: '猪',
        cow: '牛',
        sheep: '羊',
        chicken: '鸡',
        wolf: '狼',
        bee: '蜜蜂',
        chest: '箱子',
        furnace: '熔炉',
        torch: '火把',
        dragon: '末影龙',
        storm: '凋灵风暴',
        bed: '床',
        wheat: '小麦',
        tree: '树',
        flower: '花',
        golem: '铁傀儡',
        gate: '单词闸门',
        plank: '木板',
        table: '合成台',
        log: '原木',
        leaf: '树叶',
        slime: '史莱姆',
        cube: '方块兽',
        husk: '尸壳',
        ravager: '劫掠兽',
        phantom: '幻翼',
        vex: '恼鬼',
        drowned: '溺尸',
        snowgolem: '雪傀儡',
        shulker: '潜影贝',
        guardian: '守卫者',
        pufferfish: '河豚',
        spore_bug: '孢子虫',
        fire_spirit: '火灵',
        sculk_worm: '幽匿虫',
        shadow_stalker: '影行者',
        creeper: '苦力怕',
        zombie: '僵尸',
        skeleton: '骷髅',
        spider: '蜘蛛',
        enderman: '末影人',
        piglin: '猪灵',
        witch: '女巫',
        fox: '狐狸',
        magma: '岩浆怪',
        blaze: '烈焰人',
        ghast: '恶魂',
        warden: '监守者',
        boss: '凋灵',
        wither: '凋灵',
        merchant: '村民',
        word: '单词方块',
        bow: '弓',
        arrow: '箭',
        shield: '盾牌'
    };

    const QUIET_LOOK = {
        grass: 1, dirt: 1, sand: 1, snow: 1, stone: 1,
        log: 1, leaf: 1, water: 1, plank: 1, coal: 1, iron: 1
    };

    function shouldAutoSpeak(kind, type) {
        if (type === 'mob' || type === 'npc' || type === 'animal') return true;
        if (kind === 'word') return true;
        return !QUIET_LOOK[String(kind || '')];
    }

    function shouldShowLookLabel(kind, type) {
        if (type === 'mob' || type === 'npc' || type === 'animal' || type === 'prop') return true;
        if (kind === 'word' || kind === 'gate') return true;
        return !QUIET_LOOK[String(kind || '')];
    }

    function shouldRevealLookZh(opts) {
        const o = opts || {};
        if (o.type === 'mob') return !!o.asked;
        return true;
    }

    function labelFor(kind, bank) {
        const key = String(kind || '');
        const aliases = KIND_ALIASES[key] || [key];
        const list = Array.isArray(bank) ? bank : [];
        for (let i = 0; i < aliases.length; i += 1) {
            const hit = list.find(function (w) { return w && w.text === aliases[i]; });
            if (hit) return { en: hit.text, zh: hit.zh || '', word: hit };
        }
        return { en: aliases[0] || key, zh: KIND_FALLBACK_ZH[key] || '', word: null };
    }

    function sayStrip(pool, n) {
        const take = Math.max(1, Number(n) || 8);
        const words = (pool || []).slice(0, take).map(function (w) { return w && w.text; }).filter(Boolean);
        return 'Say: ' + words.join(' ');
    }

    const WORD_COINS = 3;
    const WORD_HEAL = 4;

    function collectWordBlock(state, word) {
        const s = state || {};
        const w = word || {};
        return {
            pendingQuiz: true,
            coins: Number(s.coins) || 0,
            hp: Number(s.hp) || 0,
            hpMax: Number(s.hpMax) || 20,
            learnedIds: (s.learnedIds || []).slice(),
            word: w,
            coinsGain: 0,
            heal: 0
        };
    }

    function commitWordBlock(state, word) {
        const s = state || {};
        const w = word || {};
        const hpMax = Number(s.hpMax) || 20;
        const hp = Math.min(hpMax, (Number(s.hp) || 0) + WORD_HEAL);
        const coins = (Number(s.coins) || 0) + WORD_COINS;
        const learnedIds = (s.learnedIds || []).slice();
        const id = w.id || w.text;
        if (id && learnedIds.indexOf(id) < 0) learnedIds.push(id);
        return {
            pendingQuiz: false,
            coins: coins,
            hp: hp,
            hpMax: hpMax,
            learnedIds: learnedIds,
            word: w,
            coinsGain: WORD_COINS,
            heal: WORD_HEAL
        };
    }

    function masteryStage(record, today) {
        const r = record || {};
        const correct = Number(r.correct) || 0;
        const spoken = Number(r.spoken) || Number(r.quiz && r.quiz.speak && r.quiz.speak.correct) || 0;
        const spell = Number(r.quiz && r.quiz.spell && r.quiz.spell.correct) || 0;
        const listen = Number(r.quiz && r.quiz.listen && r.quiz.listen.correct) || 0;
        const recallHits = spell + listen;
        const dates = Array.isArray(r.dates) ? r.dates : [];
        const day = String(today || '');
        const nextReview = String(r.nextReview || '');
        if (!correct && !spoken && !recallHits) return 'new';
        if (day && nextReview && nextReview <= day) return 'due';
        if (r.state === 'maintenance' || (dates.length >= 3 && spoken >= 1 && recallHits >= 1)) {
            return 'mastered';
        }
        if (spoken >= 1) return 'spoken';
        if (recallHits >= 2 || correct >= 2) return 'recall';
        if (correct >= 1) return 'familiar';
        return 'new';
    }

    function countFamiliar(ids, mastery, today) {
        const map = mastery || {};
        return (ids || []).filter(function (id) {
            const rec = map[id] || map[String(id).toLowerCase()];
            if (!rec) return true;
            return masteryStage(rec, today) !== 'new';
        }).length;
    }

    function nextWord(pool, learnedIds) {
        const known = {};
        (learnedIds || []).forEach(function (id) { known[id] = true; });
        const fresh = (pool || []).filter(function (w) { return w && !known[w.id]; });
        const src = fresh.length ? fresh : (pool || []);
        if (!src.length) return null;
        return src[Math.floor(Math.random() * src.length)];
    }

    global.BlockLegendWords = {
        SKIP_COMBO: SKIP_COMBO,
        BOSS_ASK_HP: BOSS_ASK_HP,
        bossAskTimes: bossAskTimes,
        bossAskMarks: bossAskMarks,
        QUIZ_MS: QUIZ_MS,
        PACK_BASE: PACK_BASE,
        CAT_ORDER: CAT_ORDER,
        FALLBACK_BANK: FALLBACK_BANK,
        cardsToBank: cardsToBank,
        loadCatalog: loadCatalog,
        chapterCount: chapterCount,
        poolForLevel: poolForLevel,
        quizFor: quizFor,
        makeQuiz: makeQuiz,
        checkQuiz: checkQuiz,
        channelOf: channelOf,
        canTypeCast: canTypeCast,
        noteId: noteId,
        unreadSpeakCount: unreadSpeakCount,
        resolveAttempt: resolveAttempt,
        letterBlank: letterBlank,
        pickWaveTheme: pickWaveTheme,
        dueThemeAwards: dueThemeAwards,
        THEME_STEPS: THEME_STEPS,
        collectReviewKeys: collectReviewKeys,
        layoutWorldWords: layoutWorldWords,
        rebindWorldReviewWords: rebindWorldReviewWords,
        focusPool: focusPool,
        pickQuizMode: pickQuizMode,
        phoneticOf: phoneticOf,
        isShortWord: isShortWord,
        SHORT_SPELL: SHORT_SPELL,
        availableModes: availableModes,
        QUIZ_MODES: QUIZ_MODES,
        HARD_MISS: HARD_MISS,
        PHRASE_EVERY: PHRASE_EVERY,
        hasSentence: hasSentence,
        shouldJoinPhrase: shouldJoinPhrase,
        missCount: missCount,
        needsHardMode: needsHardMode,
        bindCastWord: bindCastWord,
        matchCast: matchCast,
        REASK_HITS: REASK_HITS,
        shouldAsk: shouldAsk,
        shouldNudgeSpeak: shouldNudgeSpeak,
        nextWord: nextWord,
        masteryStage: masteryStage,
        countFamiliar: countFamiliar,
        labelFor: labelFor,
        shouldAutoSpeak: shouldAutoSpeak,
        shouldShowLookLabel: shouldShowLookLabel,
        shouldRevealLookZh: shouldRevealLookZh,
        sayStrip: sayStrip,
        collectWordBlock: collectWordBlock,
        commitWordBlock: commitWordBlock,
        WORD_COINS: WORD_COINS,
        WORD_HEAL: WORD_HEAL
    };
}(typeof window !== 'undefined' ? window : globalThis));
