/**
 * Standalone progress bridge for 方块传奇.
 * Keeps the WorkbenchGameBridge surface used by game.js, without the preschool workbench.
 */
(function (global) {
    'use strict';

    const STORAGE_KEY = 'blocklegend_standalone_v1';
    const DAILY_SUN_CAP = 80;

    function today() {
        const d = new Date();
        const m = String(d.getMonth() + 1);
        const day = String(d.getDate());
        return d.getFullYear() + '-' + (m.length < 2 ? '0' + m : m) + '-' + (day.length < 2 ? '0' + day : day);
    }

    function addDays(iso, n) {
        const parts = String(iso || today()).split('-').map(Number);
        const d = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
        d.setDate(d.getDate() + (Number(n) || 0));
        const m = String(d.getMonth() + 1);
        const day = String(d.getDate());
        return d.getFullYear() + '-' + (m.length < 2 ? '0' + m : m) + '-' + (day.length < 2 ? '0' + day : day);
    }

    function emptyState() {
        return {
            progress: {},
            courseProgress: { minecraft: { mastery: {} } },
            growth: { sunlight: 0, totalSunlightEarned: 0, awardedIds: [] }
        };
    }

    function readState() {
        try {
            const raw = global.localStorage && localStorage.getItem(STORAGE_KEY);
            if (!raw) return emptyState();
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return emptyState();
            if (!parsed.progress || typeof parsed.progress !== 'object') parsed.progress = {};
            if (!parsed.courseProgress || typeof parsed.courseProgress !== 'object') {
                parsed.courseProgress = { minecraft: { mastery: {} } };
            }
            if (!parsed.courseProgress.minecraft) parsed.courseProgress.minecraft = { mastery: {} };
            if (!parsed.courseProgress.minecraft.mastery) parsed.courseProgress.minecraft.mastery = {};
            if (!parsed.growth || typeof parsed.growth !== 'object') {
                parsed.growth = { sunlight: 0, totalSunlightEarned: 0, awardedIds: [] };
            }
            return parsed;
        } catch (e) {
            return emptyState();
        }
    }

    function writeState(state) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            return true;
        } catch (e) {
            return false;
        }
    }

    function recordWordAnswer(word, correct) {
        const key = String(word || '').toLowerCase().trim();
        if (!key) return null;
        const state = readState();
        const mastery = state.courseProgress.minecraft.mastery;
        const rec = mastery[key] || { correct: 0, attempts: 0, dates: [] };
        rec.attempts = (Number(rec.attempts) || 0) + 1;
        if (correct) rec.correct = (Number(rec.correct) || 0) + 1;
        const day = today();
        if (!Array.isArray(rec.dates)) rec.dates = [];
        if (rec.dates.indexOf(day) < 0) rec.dates.push(day);
        rec.nextReview = addDays(day, correct ? 3 : 1);
        mastery[key] = rec;
        writeState(state);
        return rec;
    }

    function getProgress(gameId) {
        const state = readState();
        const id = String(gameId || 'blocklegend');
        return { state: state, progress: state.progress[id] || {} };
    }

    function saveProgress(gameId, progress) {
        const state = readState();
        state.progress[String(gameId || 'blocklegend')] = progress || {};
        writeState(state);
        return progress;
    }

    function awardSunlight(options) {
        const opts = options || {};
        const gameId = String(opts.gameId || 'blocklegend');
        const eventKey = String(opts.eventKey || opts.reason || 'reward');
        const want = Math.max(0, Math.min(40, Math.floor(Number(opts.amount) || 0)));
        const date = opts.date || today();
        const state = readState();
        const growth = state.growth;
        if (!Array.isArray(growth.awardedIds)) growth.awardedIds = [];
        const eventId = 'game:' + gameId + ':' + eventKey;
        if (growth.awardedIds.indexOf(eventId) >= 0) {
            return { ok: false, awarded: false, amount: 0 };
        }
        const already = growth.awardedIds.filter(function (id) {
            return String(id).indexOf('game-sun:' + date + ':') === 0;
        }).reduce(function (sum, id) {
            const parts = String(id).split(':');
            return sum + (Number(parts[parts.length - 1]) || 0);
        }, 0);
        const amount = Math.min(want, Math.max(0, DAILY_SUN_CAP - already));
        if (amount <= 0) return { ok: false, awarded: false, amount: 0 };
        growth.awardedIds.push(eventId);
        growth.awardedIds.push('game-sun:' + date + ':' + amount);
        growth.sunlight = (Number(growth.sunlight) || 0) + amount;
        growth.totalSunlightEarned = (Number(growth.totalSunlightEarned) || 0) + amount;
        writeState(state);
        return { ok: true, awarded: true, amount: amount };
    }

    global.WorkbenchGameBridge = {
        readState: readState,
        getProgress: getProgress,
        saveProgress: saveProgress,
        recordWordAnswer: recordWordAnswer,
        awardSunlight: awardSunlight
    };
}(typeof window !== 'undefined' ? window : globalThis));
