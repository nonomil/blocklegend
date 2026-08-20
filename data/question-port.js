/**
 * blocklegend · 多科题库适配（只整理资源与欠账，不进战斗）
 */
(function (global) {
    'use strict';

    const KINDS = ['english', 'literacy', 'pinyin', 'phonics', 'math'];

    function extraOf(row) {
        return row && row.extra && typeof row.extra === 'object' ? row.extra : {};
    }

    function kindOf(row) {
        const raw = String(row && row.kind || '').trim();
        if (KINDS.indexOf(raw) >= 0) return raw;
        if (row && (row.skillId || /^math-/.test(String(row.id || '')))) return 'math';
        return '';
    }

    function openIndex(raw) {
        const src = raw && typeof raw === 'object' ? raw : {};
        const subjects = Array.isArray(src.subjects) ? src.subjects.slice() : [];
        return {
            schemaVersion: Number(src.schemaVersion) || 1,
            updated: String(src.updated || ''),
            base: String(src.base || 'prj/assets/vocab'),
            subjects: subjects
        };
    }

    function subjectOf(index, id) {
        const list = index && Array.isArray(index.subjects) ? index.subjects : [];
        return list.find(function (row) { return row && row.id === id; }) || null;
    }

    function cardFromRow(row) {
        const src = row && typeof row === 'object' ? row : {};
        const extra = extraOf(src);
        const kind = kindOf(src);
        if (kind === 'literacy') {
            const stem = String(src.text || src.char || src.word || '').trim();
            return {
                id: String(src.id || ('literacy:' + stem)),
                kind: 'literacy',
                prompt: String(extra.explain || src.exampleZh || '认这个字'),
                stem: stem,
                speak: String(extra.pinyin || src.phonetic || stem),
                lang: 'zh-CN',
                answer: stem,
                masteryTrack: 'literacy',
                masteryKey: stem,
                band: String(src.level || src.curriculumLevel || 'L1')
            };
        }
        if (kind === 'pinyin') {
            const stem = String(src.text || extra.initial || src.word || '').trim();
            return {
                id: String(src.id || ('pinyin:' + stem)),
                kind: 'pinyin',
                prompt: String(src.zh || src.translation ? '这个音是哪个' : '认这个声母'),
                stem: stem,
                speak: String(extra.sample || src.example || src.translation || stem),
                lang: 'zh-CN',
                answer: stem,
                masteryTrack: 'pinyin',
                masteryKey: stem,
                band: String(src.level || src.curriculumLevel || 'L1')
            };
        }
        if (kind === 'phonics') {
            const stem = String(src.text || extra.letter || src.word || '').trim();
            return {
                id: String(src.id || ('phonics:' + stem)),
                kind: 'phonics',
                prompt: '读出这个',
                stem: stem,
                speak: stem,
                lang: 'en-US',
                answer: stem,
                masteryTrack: 'phonics',
                masteryKey: stem,
                band: String(src.level || src.curriculumLevel || 'L1')
            };
        }
        if (kind === 'math') {
            const id = String(src.id || '');
            const prompt = String(src.prompt || src.word || '');
            const left = Number(src.left);
            const right = Number(src.right);
            const op = String(src.op || '');
            const stem = prompt || (Number.isFinite(left) && Number.isFinite(right) && op ? (left + op + right) : id);
            const answer = src.answer != null ? Number(src.answer) : Number(src.translation);
            return {
                id: id,
                kind: 'math',
                prompt: prompt || '算出得数',
                stem: stem,
                speak: prompt || stem,
                lang: 'zh-CN',
                answer: answer,
                masteryTrack: 'math',
                masteryKey: id,
                band: String(src.level || src.curriculumLevel || 'L1')
            };
        }
        const stem = String(src.text || src.word || '').trim();
        return {
            id: String(src.id || ('english:' + stem)),
            kind: 'english',
            prompt: String(src.zh || src.translation || ''),
            stem: stem,
            speak: stem,
            lang: 'en-US',
            answer: stem,
            masteryTrack: 'minecraft',
            masteryKey: stem.toLowerCase(),
            band: String(src.level || src.curriculumLevel || 'L1')
        };
    }

    const KIND_LABEL = {
        literacy: '识字',
        pinyin: '拼音',
        phonics: '拼读',
        math: '口算'
    };
    const KIND_WHO = {
        literacy: '挖开认字',
        pinyin: '挖开认音',
        phonics: '挖开拼读',
        math: '算对九折'
    };
    const KIND_ORDER = ['literacy', 'pinyin', 'phonics', 'math'];

    function careerFamiliar(mastery) {
        const src = mastery && typeof mastery === 'object' ? mastery : {};
        let n = 0;
        Object.keys(src).forEach(function (key) {
            const state = src[key] && src[key].state;
            if (state === 'ready' || state === 'maintenance') n += 1;
        });
        return n;
    }

    function knownOf(track) {
        const mastery = track && track.mastery && typeof track.mastery === 'object' ? track.mastery : {};
        let n = 0;
        Object.keys(mastery).forEach(function (key) {
            const rec = mastery[key] || {};
            const state = rec.state;
            if (state === 'ready' || state === 'maintenance') n += 1;
            else if ((Number(rec.attempts) || 0) >= 1 || (Number(rec.correct) || 0) >= 1) n += 1;
        });
        return n;
    }

    function cardsFromCatalog(catalog) {
        return ((catalog && catalog.cards) || []).map(cardFromRow);
    }

    function owed(quota, known) {
        return Math.max(0, Math.floor(Number(quota) || 0) - Math.floor(Number(known) || 0));
    }

    function sideDue(opts) {
        const o = opts || {};
        const F = Math.max(0, Math.floor(Number(o.enFamiliar) || 0));
        const tracks = o.tracks && typeof o.tracks === 'object' ? o.tracks : {};
        return {
            literacy: owed(Math.floor(F / 4) * 2, knownOf(tracks.literacy)),
            pinyin: owed(Math.floor(F / 8), knownOf(tracks.pinyin)),
            phonics: owed(Math.floor(F / 12), knownOf(tracks.phonics)),
            math: owed(Math.floor(F / 16), knownOf(tracks.math))
        };
    }

    function rotate(list, salt) {
        const out = (list || []).slice();
        const n = out.length;
        if (n < 2) return out;
        const shift = Math.abs(Number(salt) || 0) % n;
        return out.slice(shift).concat(out.slice(0, shift));
    }

    function withChoices(card, pool, salt) {
        const others = (pool || []).filter(function (row) {
            return row && row.masteryKey !== card.masteryKey && String(row.answer) !== String(card.answer);
        }).map(function (row) {
            return card.kind === 'math' ? row.answer : row.stem;
        });
        const picks = [];
        rotate(others, salt).forEach(function (stem) {
            if (picks.length >= 3) return;
            if (stem !== '' && stem != null && picks.indexOf(stem) < 0) picks.push(stem);
        });
        const mixed = rotate([card.answer].concat(picks), salt + 1);
        return Object.assign({}, card, { mode: 'choice', choices: mixed });
    }

    function reviewKeys(track, today) {
        const mastery = track && track.mastery && typeof track.mastery === 'object' ? track.mastery : {};
        const day = String(today || '');
        return Object.keys(mastery).filter(function (key) {
            const next = mastery[key] && mastery[key].nextReview;
            return day && next && String(next) <= day;
        });
    }

    function literacyBand(known) {
        const n = Math.max(0, Math.floor(Number(known) || 0));
        if (n < 80) return 'L1';
        if (n < 160) return 'L2';
        if (n < 240) return 'L3';
        if (n < 320) return 'L4';
        return 'L5';
    }

    function sideMissSkip(n) {
        return (Number(n) || 0) >= 2;
    }

    function mathCards(opts) {
        const o = opts || {};
        const staticCards = (o.cards || []).map(function (row) {
            return row && row.kind === 'math' && row.stem ? row : cardFromRow(row);
        }).filter(function (row) {
            return row && row.kind === 'math';
        });
        if ((Number(o.enFamiliar) || 0) < 20) return staticCards;
        const built = typeof o.buildPracticePool === 'function' ? o.buildPracticePool('within20') : [];
        const extra = (built || []).map(cardFromRow).filter(function (row) {
            return row && row.kind === 'math';
        });
        return extra.length ? extra : staticCards;
    }

    function sittingLeft(opts) {
        const o = opts || {};
        const cap = Math.max(1, Math.floor(Number(o.cap) || 6));
        const done = Math.max(0, Math.floor(Number(o.done) || 0));
        return Math.max(0, cap - done);
    }

    function tabletReward() {
        return { coins: 3, heal: 0, familiar: false };
    }

    function canSpeakSide(side) {
        const kind = side && typeof side === 'object' ? side.kind : side;
        return kind === 'phonics';
    }

    function loadFailLine(kind) {
        return (KIND_LABEL[kind] || '识字') + '板暂时没有';
    }

    function pickTabletQuestions(due, opts) {
        const o = opts || {};
        const litBand = o.literacyBand || literacyBand(knownOf(o.tracks && o.tracks.literacy));
        const room = sittingLeft({ done: o.sittingDone, cap: o.sittingCap });
        const out = [];
        ['literacy', 'pinyin', 'phonics'].forEach(function (kind) {
            const need = Math.min(room - out.length, Math.max(0, Number(due && due[kind]) || 0));
            let i;
            for (i = 0; i < need; i += 1) {
                const q = nextDue(due, {
                    cards: o.cards,
                    kind: kind,
                    band: kind === 'literacy' ? litBand : o.band,
                    avoidKeys: (o.avoidKeys || []).concat(out.map(function (row) { return row.masteryKey; })),
                    dueKeys: o.dueKeys,
                    salt: (Number(o.salt) || 0) + out.length
                });
                if (!q) break;
                out.push(q);
            }
        });
        return out;
    }

    function merchantDeal(due, opts) {
        if ((Number(due && due.math) || 0) <= 0) return null;
        const raw = opts || {};
        const packed = raw.enFamiliar != null ? Object.assign({}, raw, { cards: mathCards(raw) }) : raw;
        const question = nextDue(due, Object.assign({}, packed, { kind: 'math' }));
        if (!question) return null;
        return { question: question, discount: 0.9 };
    }

    function sceneSideKind(due) {
        return (Number(due && due.phonics) || 0) > 0 ? 'phonics' : '';
    }

    function shopCost(cost, discount) {
        const rate = Number(discount);
        const n = Number(cost) || 0;
        if (!(rate > 0) || rate >= 1) return n;
        return Math.max(1, Math.round(n * rate));
    }

    function nextDue(due, opts) {
        const o = opts || {};
        const cards = (o.cards || []).map(function (row) {
            return row && row.stem && row.kind ? row : cardFromRow(row);
        });
        const kind = o.kind || KIND_ORDER.find(function (id) { return (Number(due && due[id]) || 0) > 0; });
        if (!kind || ((Number(due && due[kind]) || 0) <= 0 && !o.force)) return null;
        const avoid = {};
        (o.avoidKeys || []).forEach(function (key) { if (key) avoid[String(key)] = true; });
        const prefer = {};
        (o.dueKeys || []).forEach(function (key) { if (key) prefer[String(key)] = true; });
        const pool = cards.filter(function (card) {
            if (!card || card.kind !== kind || (o.band && card.band !== o.band) || avoid[card.masteryKey]) return false;
            if (kind === 'phonics' && String(card.stem || '').length < 3) return false;
            return true;
        });
        const duePool = pool.filter(function (card) { return prefer[card.masteryKey]; });
        const pickFrom = duePool.length ? duePool : pool;
        if (!pickFrom.length) return null;
        const salt = Math.abs(Number(o.salt) || 0);
        return withChoices(pickFrom[salt % pickFrom.length], pool, salt);
    }

    function grade(question, input) {
        if (!question) return { ok: false, kind: 'empty' };
        if (input == null || input === '') return { ok: false, kind: 'empty' };
        const got = String(input).trim();
        if (got === String(question.answer)) return { ok: true, kind: 'match' };
        if (question.kind === 'math' && Number(got) === Number(question.answer)) return { ok: true, kind: 'match' };
        const choices = Array.isArray(question.choices) ? question.choices : [];
        if (typeof input === 'number' && input >= 0 && input < choices.length && String(input) !== String(question.answer)) {
            const hit = String(choices[input]) === String(question.answer);
            return { ok: hit, kind: hit ? 'choice' : 'mismatch' };
        }
        return { ok: false, kind: 'mismatch' };
    }

    function quizFromSide(question) {
        const q = question || {};
        return {
            mode: q.mode || 'choice',
            prompt: q.prompt || '',
            choices: Array.isArray(q.choices) ? q.choices.slice() : [],
            typed: false,
            word: {
                id: q.id,
                text: q.stem,
                zh: KIND_LABEL[q.kind] || q.kind,
                phonetic: q.speak || '',
                side: q
            }
        };
    }

    function snapshotCell(cell) {
        if (!cell) return null;
        if (cell.base) return cell.base;
        if (cell.side) return null;
        return { id: cell.id, text: cell.text, zh: cell.zh };
    }

    function clearFarSideCells(wordCells) {
        const cells = wordCells || {};
        Object.keys(cells).forEach(function (key) {
            const cell = cells[key];
            if (!cell || !cell.side) return;
            if (cell.base) cells[key] = cell.base;
            else delete cells[key];
        });
        return cells;
    }

    function bindFarSideCells(wordCells, questions, opts) {
        const cells = clearFarSideCells(wordCells || {});
        const list = (questions || []).filter(Boolean);
        if (!list.length) return cells;
        const o = opts || {};
        const cx = Number(o.cx) || 0;
        const cz = Number(o.cz) || 0;
        const cap = Math.min(6, list.length, Math.max(1, Number(o.cap) || 6));
        const slots = Object.keys(cells).map(function (cellKey) {
            const parts = cellKey.split(',');
            return {
                cellKey: cellKey,
                dist: Math.hypot((Number(parts[0]) || 0) - cx, (Number(parts[2]) || 0) - cz)
            };
        }).sort(function (a, b) { return b.dist - a.dist; }).slice(0, cap);
        slots.forEach(function (slot, i) {
            const q = list[i];
            if (!q) return;
            const prev = cells[slot.cellKey];
            cells[slot.cellKey] = {
                id: q.id,
                text: q.stem,
                zh: KIND_LABEL[q.kind] || q.kind,
                side: q,
                kind: q.kind,
                base: snapshotCell(prev)
            };
        });
        return cells;
    }

    function lookLabel(cell) {
        if (!cell || !cell.side) return null;
        const kind = cell.side.kind || cell.kind;
        return {
            en: KIND_LABEL[kind] || kind,
            zh: String(cell.text || cell.side.stem || ''),
            who: KIND_WHO[kind] || '挖开认字',
            lang: cell.side.lang || (kind === 'phonics' ? 'en-US' : 'zh-CN'),
            speak: cell.side.speak || cell.text || ''
        };
    }

    function parentSideLine(opts) {
        const o = opts || {};
        const due = o.due || sideDue(o);
        const tracks = o.tracks || {};
        const dueTxt = hudDueLine(due);
        const practiced = KIND_ORDER.map(function (id) {
            const n = knownOf(tracks[id]);
            return n > 0 ? (KIND_LABEL[id] + '已练' + n) : '';
        }).filter(Boolean);
        if (dueTxt && practiced.length) return dueTxt + ' · ' + practiced.join(' ');
        if (dueTxt) return dueTxt;
        if (practiced.length) return practiced.join(' ');
        return '配菜还没开始 · 熟悉 4 个英语词后出识字';
    }

    function hudDueLine(due, opts) {
        const src = due || {};
        const parts = KIND_ORDER.map(function (id) {
            const n = Number(src[id]) || 0;
            return n > 0 ? (KIND_LABEL[id] + n) : '';
        }).filter(Boolean);
        const done = Math.max(0, Math.floor(Number(opts && opts.done) || 0));
        const sit = done > 0 ? ('本局 ' + Math.min(6, done) + '/6') : '';
        if (parts.length && sit) return '还欠 ' + parts.join(' ') + ' · ' + sit;
        if (parts.length) return '还欠 ' + parts.join(' ');
        return sit;
    }

    global.BlockLegendQuestionPort = {
        openIndex: openIndex,
        subjectOf: subjectOf,
        cardFromRow: cardFromRow,
        cardsFromCatalog: cardsFromCatalog,
        careerFamiliar: careerFamiliar,
        sideDue: sideDue,
        nextDue: nextDue,
        grade: grade,
        quizFromSide: quizFromSide,
        bindFarSideCells: bindFarSideCells,
        clearFarSideCells: clearFarSideCells,
        lookLabel: lookLabel,
        parentSideLine: parentSideLine,
        sittingLeft: sittingLeft,
        tabletReward: tabletReward,
        canSpeakSide: canSpeakSide,
        loadFailLine: loadFailLine,
        hudDueLine: hudDueLine,
        reviewKeys: reviewKeys,
        pickTabletQuestions: pickTabletQuestions,
        knownCount: knownOf,
        literacyBand: literacyBand,
        sideMissSkip: sideMissSkip,
        mathCards: mathCards,
        merchantDeal: merchantDeal,
        sceneSideKind: sceneSideKind,
        shopCost: shopCost
    };
}(typeof window !== 'undefined' ? window : globalThis));
