/**
 * blocklegend · 句型场景（Phase 12）
 * 4 个生活情景 × 3 句。剧本写死，不叫模型。
 */
(function (global) {
    'use strict';

    const SCENES = [
        {
            id: 'greet',
            title: '打招呼',
            hint: '你在跟人打招呼',
            lines: [
                { en: 'Hello.', hint: '先开口', key: 'hello' },
                { en: 'How are you?', hint: '问问对方', key: 'you' },
                { en: 'Nice to meet you.', hint: '第一次见面', key: 'meet' }
            ]
        },
        {
            id: 'food',
            title: '点餐',
            hint: '你在点餐',
            lines: [
                { en: 'I want an apple.', hint: '点一样吃的', key: 'apple' },
                { en: 'Water, please.', hint: '再要一杯水', key: 'water' },
                { en: 'Thank you.', hint: '说声谢谢', key: 'thank' }
            ]
        },
        {
            id: 'ask',
            title: '问路',
            hint: '你在问路',
            lines: [
                { en: 'Where is the tree?', hint: '问在哪里', key: 'where' },
                { en: 'Go left.', hint: '指出方向', key: 'left' },
                { en: 'Thank you.', hint: '说声谢谢', key: 'thank' }
            ]
        },
        {
            id: 'shop',
            title: '买东西',
            hint: '你在买东西',
            lines: [
                { en: 'How much?', hint: '先问价钱', key: 'much' },
                { en: 'I want a sword.', hint: '说出要买的', key: 'sword' },
                { en: 'Here you are.', hint: '把东西递过去', key: 'here' }
            ]
        }
    ];

    function sceneOf(id) {
        let i = 0;
        for (i = 0; i < SCENES.length; i += 1) {
            if (SCENES[i].id === id) return SCENES[i];
        }
        return SCENES[0];
    }

    function start(id) {
        const sc = sceneOf(id);
        return { sceneId: sc.id, line: 0, ok: false, done: false };
    }

    function currentLine(state) {
        const sc = sceneOf(state && state.sceneId);
        const idx = Math.max(0, Number(state && state.line) || 0);
        return sc.lines[idx] || null;
    }

    function apply(state, opts) {
        const o = opts || {};
        const src = state || start('greet');
        const sc = sceneOf(src.sceneId);
        const idx = Math.max(0, Number(src.line) || 0);
        const line = sc.lines[idx];
        if (!line) {
            return { sceneId: sc.id, line: idx, ok: false, done: true, key: '' };
        }
        const speech = global.BlockLegendSpeech || {};
        const match = global.SpeechMatch || {};
        const matchHeard = o.matchHeard || speech.matchHeard;
        const matchPhrase = o.matchPhrase || speech.matchPhrase;
        const heard = o.heard;
        const keyRes = matchHeard ? matchHeard(line.key, heard) : { ok: false };
        const phraseRes = matchPhrase ? matchPhrase(line.en, heard, { key: line.key, scene: 'sentence' }) : { ok: false };
        if (!keyRes.ok && !phraseRes.ok) {
            return { sceneId: sc.id, line: idx, ok: false, done: false, key: line.key, stars: 0 };
        }
        const ev = (phraseRes && phraseRes.eval) || (keyRes && keyRes.eval) || null;
        const rating = ev && ev.rating;
        const stars = match.starsFromRating
            ? match.starsFromRating(rating || (keyRes.ok ? 'Fair' : 'KeepGoing'))
            : (keyRes.ok || phraseRes.ok ? 1 : 0);
        const next = idx + 1;
        return {
            sceneId: sc.id,
            line: next,
            ok: true,
            done: next >= sc.lines.length,
            key: line.key,
            stars: stars,
            rating: rating || ''
        };
    }

    global.BlockLegendScenes = {
        SCENES: SCENES,
        sceneOf: sceneOf,
        start: start,
        currentLine: currentLine,
        apply: apply
    };
}(typeof window !== 'undefined' ? window : globalThis));
