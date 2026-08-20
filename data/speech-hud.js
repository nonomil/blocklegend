/**
 * 语音 HUD 文案：状态 → 孩子看得见的一行。
 * 浏览器挂 window.BlockLegendSpeechHud，node 可 import。
 */
(function (global) {
    'use strict';

    const STATES = [
        'idle', 'listening', 'processing', 'matched',
        'not-matched', 'timeout', 'mic-blocked', 'unsupported'
    ];

    function hudOf(state, payload) {
        const p = payload || {};
        const heard = String(p.heard || '').replace(/^[""]|[""]$/g, '').trim();
        const want = String(p.want || '').trim();
        if (state === 'listening') {
            return {
                cls: 'is-listening',
                line: want ? ('听你说… ' + want) : '听你说…',
                want: want,
                heard: '',
                pause: false
            };
        }
        if (state === 'processing') {
            return { cls: 'is-processing', line: '想一下…', want: want, heard: '', pause: false };
        }
        if (state === 'matched') {
            const word = want || heard;
            return {
                cls: 'is-matched',
                line: word ? ('✅ ' + word) : '✅',
                want: want,
                heard: heard || want,
                pause: false
            };
        }
        if (state === 'not-matched') {
            return {
                cls: 'is-miss',
                line: heard ? ('听到：' + heard) : '听到了，但不对',
                want: want,
                heard: heard,
                pause: false
            };
        }
        if (state === 'timeout') {
            return { cls: 'is-timeout', line: '没听清，再试一次', want: want, heard: '', pause: false };
        }
        if (state === 'mic-blocked') {
            return { cls: 'is-blocked', line: '麦克风被禁 · 按 T 拼写', want: want, heard: '', pause: false };
        }
        if (state === 'unsupported') {
            return { cls: 'is-blocked', line: '没有麦克风 · 按 T 拼写', want: want, heard: '', pause: false };
        }
        return { cls: 'is-idle', line: '按 V 说话', want: '', heard: '', pause: false };
    }

    function suggestSpell(voiceFails) {
        return Number(voiceFails) >= 2;
    }

    global.BlockLegendSpeechHud = {
        STATES: STATES,
        hudOf: hudOf,
        suggestSpell: suggestSpell
    };
})(typeof globalThis !== 'undefined' ? globalThis : window);
