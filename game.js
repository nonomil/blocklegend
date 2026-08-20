/**
 * blocklegend · 装配层（T20260815-blocklegend-3d S2–S5）
 * 战斗 / 词卡暴击 / Boss 破防 / 结算解锁 / 商人 / 帮助
 */
(function () {
    'use strict';

    const GAME_ID = 'blocklegend';
    const LOOT_PRICE = {
        'slime-gel': 3, 'cube-shard': 5, 'husk-bone': 7,
        'oak-log': 2, 'stick': 1, 'dirt': 1, 'cobble': 2, 'plank': 2, 'table': 4,
        'fox-fur': 3, 'magma-cream': 4,
        'blaze-rod': 5, 'ghast-tear': 6, 'warden-horn': 8,
        gunpowder: 4, 'rotten-flesh': 3, bone: 4, string: 3,
        wood_sword: 6, wood_pick: 6, wood_axe: 6,
        wood_bow: 7, wood_shield: 7, arrow: 1, iron_sword: 10,
        wood_shovel: 5, stone_sword: 8, stone_pick: 8, stone_axe: 8, stone_shovel: 7,
        iron_pick: 10, iron_axe: 10, iron_shovel: 9, iron_ore: 3, iron_ingot: 6, coal: 2, torch: 1, chest: 8, furnace: 8,
        gold: 5, gold_ingot: 8, diamond: 12,
        gold_sword: 9, gold_pick: 9, gold_axe: 9, gold_shovel: 8,
        tnt: 6, flint_and_steel: 7,
        diamond_sword: 14, diamond_pick: 14, diamond_axe: 14, diamond_shovel: 13,
        door: 6, fence: 3, ladder: 3, bowl: 2, boat: 7, shears: 5, bucket: 5, fishing_rod: 7,
        'ender-pearl': 8, 'gold-nugget': 6, 'glow-dust': 5,
        'iron-ingot': 6, saddle: 8, 'phantom-membrane': 6, 'vex-wing': 6,
        'trident-shard': 7, snowball: 2, prismarine: 7,
        'puffer-spine': 4, 'spore-cap': 5, 'ember-core': 6, 'sculk-thread': 6, 'shadow-hood': 7,
        'crossbow-bolt': 6
    };
    const DROP_COLOR = {
        'oak-log': 0x6b4a28, 'stick': 0x8a6234, 'dirt': 0x8a6a3c, 'cobble': 0x7a7a80, 'plank': 0xe0b46a,
        sand: 0xe8d090, glass: 0xa8e0f0, tnt: 0xc44528, flint_and_steel: 0x8a929c, wool: 0xf4f0ea, pork: 0xe07070, beef: 0x8a3030, mutton: 0xc06060, chicken: 0xf0c080, egg: 0xf4e8c0
    };
    const CHAPTERS = [
        '',
        '第一层 · 初生神域 · Genesis',
        '第二层 · 密林猎场 · Forest',
        '第三层 · 沙海荒原 · Desert',
        '第四层 · 雪原寒径 · Snow',
        '第五层 · 深暗地穴 · Deep Dark',
        '第六层 · 下界熔岩 · Nether',
        '第七层 · 石丘矿场 · Quarry',
        '第八层 · 星空回廊 · Astral',
        '第九层 · 潮汐群岛 · Ocean',
        '第十层 · 晶簇森林 · Crystal',
        '第十一层 · 火山裂谷 · Volcano',
        '第十二层 · 末地虚空 · End'
    ];
    const bridge = window.WorkbenchGameBridge;
    const ENG = window.BlockLegendEngine;
    const C = window.BlockLegendCombat;
    const W = window.BlockLegendWords;
    const P = window.BlockLegendQuestionPort;
    const SIDE_PACK = {
        literacy: 'core-literacy-2026.08.19',
        pinyin: 'core-pinyin-2026.08.19',
        phonics: 'core-phonics-2026.08.19',
        math: 'core-math-2026.08.19'
    };
    const SP = window.BlockLegendSpeech;
    const SC = window.BlockLegendScenes;
    const SL = window.BlockLegendSceneLoop;
    const BU = window.BlockLegendCompanion;
    const L = window.BlockLegendLevels;
    const Q = window.BlockLegendQuests;
    const MOBS = window.BlockLegendMobs;
    const T = window.BlockLegendTools;
    const CR = window.BlockLegendCraft;
    const S = window.BlockLegendShop;
    const RS = window.BlockLegendReviewSchedule;
    const WM = window.BlockLegendWordMemory;
    const D = window.BlockLegendDifficulty;
    const sfx = window.WorkbenchGameSfx;
    const THEME_BGM = './assets/audio/minecraft-theme.mp3';
    const THREE = window.THREE;

    let engine = null;
    let viewModel = null;
    let progress = emptyProgress();
    let bank = [];
    let pool = [];
    const session = {
        level: 1,
        coins: 0,
        bag: {},
        combo: 0,
        lastMeleeAt: 0,
        lastBoltAt: 0,
        lastHitAt: 0,
        lastDamage: 0,
        lastCrit: false,
        wordAt: 0,
        monsters: [],
        bolts: [],
        bossShots: [],
        bossSkillAt: 0,
        bossDashUntil: 0,
        bossCryUntil: 0,
        bossSummoned: false,
        bossHits: 0,
        pickups: [],
        fx: [],
        wave: 0,
        wavesLeft: 0,
        boss: null,
        bossMob: null,
        merchant: null,
        nearMerchant: false,
        paused: false,
        pending: null,
        quiz: null,
        quizEndsAt: 0,
        casting: false,
        castBuf: '',
        voice: { state: 'idle', rec: null, lock: null, blocked: false, buddy: false },
        buddyAt: 0,
        buddyKey: '',
        buddyConfig: null,
        buddyPick: '',
        playMode: '',
        buddyTypeOnly: false,
        lastHeard: '',
        missByWord: {},
        tool: 'fist',
        mining: false,
        mine: null,
        lookKey: '',
        lookRow: null,
        lookSince: 0,
        lookSpoken: false,
        placeLoot: 'dirt',
        worldActs: 0,
        hotbar: T && T.emptyHotbar ? T.emptyHotbar() : ['fist', null, null, null, 'oak-log', 'plank', null, null, null],
        craftQuizOk: false,
        hotIndex: 0,
        tntFuses: [],
        invPick: null,
        helpPage: 0,
        atTable: false,
        craftCells: [null, null, null, null, null, null, null, null, null],
        craftSize: 3,
        quest: null,
        quizRetry: false,
        wordCorrect: 0,
        familiarIds: [],
        choiceOnly: {},
        seenByWord: {},
        themeAwarded: {},
        waveTheme: '',
        sideCards: [],
        sideByKind: {},
        sideAvoid: [],
        sideReady: false,
        mathDiscount: 0,
        mathAsked: false,
        sideBoundToast: false,
        sideMiss: {},
        sideDone: 0,
        sideSitToast: false,
        sideSkip: {},
        reviewRun: null,
        reviewCoinsStart: 0,
        debugNow: '',
        tier: 'default',
        secretRun: false,
        askedCount: 0,
        levelStartedAt: 0,
        bossNeed: 1,
        bossHitsOnShield: 0,
        todayShown: false,
        sceneLoop: null,
        sceneTimer: 0
    };

    function emptyProgress() {
        return {
            unlockedLevel: 1,
            coined: 0,
            learnedIds: [],
            shownWordIds: [],
            spokenWordIds: [],
            reviewWords: [],
            rightCount: 0,
            wrongCount: 0,
            clearedLevels: [],
            levelReview: {},
            hardWords: [],
            hardTally: {},
            wordMemory: {},
            memoryVersion: 1,
            clearedTiers: {},
            scrolls: [],
            campChest: 0,
            secretLooted: 0,
            stats: { inputWords: 0, outputWords: 0, sessionDensity: [] },
            sceneSentences: {},
            bag: {},
            craftKnown: {},
            gear: {},
            hotbar: null,
            playDates: [],
            speakCount: 0,
            speakByDay: {},
            dailyId: '',
            dailyDay: '',
            dailyDoneId: '',
            dailyDoneDay: '',
            wordPack: 'core'
        };
    }

    function boot() {
        window.__blErr = '';
        window.onerror = function (msg) {
            window.__blErr = String(msg).slice(0, 300);
            toast('出错了：' + window.__blErr);
            return false;
        };
        if (!window.THREE || !ENG || !C || !W || !L || !MOBS || !T || !S) {
            toast('引擎加载失败，请刷新重试');
            return;
        }
        loadProgress();
        const canvas = document.getElementById('world-canvas');
        engine = ENG.create(canvas, { seed: 7, climate: 'plains' });
        engine.onJump = function () { if (sfx && sfx.jump) sfx.jump(); };
        // 第一人称手臂+剑：挂到相机上（相机需入场景，子对象才会渲染）
        viewModel = MOBS.createViewModel();
        engine.scene.add(engine.camera);
        engine.camera.add(viewModel.group);
        const back = document.getElementById('back-link');
        if (back && bridge && bridge.backHref) back.href = bridge.backHref('blocklegend');
        session.buddyConfig = readBuddyConfig();
        bindChrome();
        bindCombatInput(canvas);
        bindFarmAnimals();
        bindTouchPad();
        spawnMerchant();
        engine.onTick(tick);
        maybeShowBuddyGate();
        startTheme();
        if (bridge && bridge.recordPlaySession) bridge.recordPlaySession(GAME_ID);
        bank = (W.FALLBACK_BANK || []).slice();
        W.loadCatalog(function (err, list) {
            if (err || !list || !list.length) {
                toast('词库稍后补上 · 先打面前的怪');
            } else {
                bank = list;
            }
            if (session.levelStarted) applyLoadedBank();
            else ensureLevelStarted();
            paintSayStrip();
            syncHud();
            maybeShowToday();
        }, { base: W.packBaseOf ? W.packBaseOf(progress.wordPack) : W.PACK_BASE });
        window.__blDebug = {
            player: engine.player,
            look: engine.look,
            world: function () { return engine.world; },
            fps: engine.fps,
            session: session,
            progress: progress,
            monsters: function () { return session.monsters; },
            coins: function () { return session.coins; },
            tool: function () { return session.tool; },
            playtest: isPlaytest,
            spawnKind: function (kind, x, z) {
                const p = engine.player;
                return spawnMonster(kind, x != null ? x : p.x + 3, z != null ? z : p.z + 2);
            },
            skipHours: function (hours) {
                const t = new Date(nowIso()).getTime() + Math.max(0, Number(hours) || 0) * 3600000;
                session.debugNow = new Date(t).toISOString();
                paintDoors();
                paintToday();
                return session.debugNow;
            },
            skipDays: function (days) {
                return window.__blDebug.skipHours(Math.max(0, Number(days) || 0) * 24);
            },
            seedBox: function (word, box) {
                const mem = memNow();
                const key = String(word || '').toLowerCase();
                if (!key) return null;
                mem.words[key] = Object.assign({}, mem.words[key] || {}, {
                    box: Math.max(1, Math.min(5, Number(box) || 1)),
                    streak: 0,
                    lastSeen: Date.parse(nowIso()),
                    dueAt: Date.parse(nowIso()) + 86400000
                });
                writeMem(mem);
                persist();
                return mem.words[key];
            },
            pickupScroll: function (levelId) {
                return tryPickupScroll(levelId || session.level);
            },
            memory: function () { return memNow(); },
            openDoors: function () { paintDoors(); toggleLayer('doors-layer', true); },
            openToday: function () { paintToday(); toggleLayer('today-layer', true); },
            openSettle: function () { toggleLayer('settle-layer', true); },
            startLevel: function (level, extra) { return startLevel(level, extra || {}); },
            finishLevel: function () { return finishLevel(); },
            openTrade: function () { return openTrade(); },
            askWord: function (text, extra) {
                const key = String(text || '').toLowerCase();
                const word = (pool || bank || []).filter(function (w) {
                    return w && String(w.text || '').toLowerCase() === key;
                })[0] || (pool || bank || [])[0];
                if (!word) return null;
                const quiz = nextLearnQuiz(word, extra || null);
                fillQuizCard(quiz, quiz.scaffold ? '难词支架' : ('梯度 · ' + (quiz.mode || '')));
                return { text: word.text, mode: quiz.mode, scaffold: !!quiz.scaffold, phonetic: quiz.phonetic || '', phraseZh: quiz.phraseZh || '' };
            },
            openGate: function (text) {
                const key = String(text || '').toLowerCase();
                const word = (pool || bank || []).filter(function (w) {
                    return w && String(w.text || '').toLowerCase() === key;
                })[0] || (pool || bank || [])[0];
                const gate = { x: 0, z: 0, word: word, opened: false };
                openGateQuiz(gate);
                return {
                    text: word && word.text,
                    limitMs: session.quiz && session.quiz.limitMs,
                    endsIn: session.quizEndsAt ? (session.quizEndsAt - Date.now()) : 0,
                    tier: session.tier
                };
            },
            now: nowIso,
            spawnBossId: function (bossId, x, z) {
                const p = engine.player;
                const id = bossId || 'wither';
                const spawnKind = (L.bossSpawnKind && L.bossSpawnKind(id)) || 'husk';
                return spawnMonster(spawnKind, x != null ? x : p.x + 4, z != null ? z : p.z + 3, { boss: true, bossId: id });
            },
            placeProp: function (kind, x, y, z) {
                return engine.placeProp ? engine.placeProp(kind, x, y, z) : { ok: false };
            }
        };
        selectTool(0);
        engine.startLoop();
        toast('空手开局 · 左键打猪牛羊鸡掉肉 · 走过去捡起来回血');
    }

    function loadProgress() {
        if (bridge && bridge.getProgress) {
            const got = bridge.getProgress(GAME_ID);
            progress = Object.assign(emptyProgress(), (got && got.progress) || {});
        }
        if (!Array.isArray(progress.learnedIds)) progress.learnedIds = [];
        if (!Array.isArray(progress.shownWordIds)) progress.shownWordIds = [];
        if (!Array.isArray(progress.spokenWordIds)) progress.spokenWordIds = [];
        if (!Array.isArray(progress.reviewWords)) progress.reviewWords = [];
        if (!Array.isArray(progress.clearedLevels)) progress.clearedLevels = [];
        if (!progress.levelReview || typeof progress.levelReview !== 'object') progress.levelReview = {};
        if (!Array.isArray(progress.hardWords)) progress.hardWords = [];
        if (!progress.hardTally || typeof progress.hardTally !== 'object') progress.hardTally = {};
        if (!progress.wordMemory || typeof progress.wordMemory !== 'object') progress.wordMemory = {};
        progress.memoryVersion = Number(progress.memoryVersion) || 1;
        if (!progress.clearedTiers || typeof progress.clearedTiers !== 'object') progress.clearedTiers = {};
        if (!Array.isArray(progress.scrolls)) progress.scrolls = [];
        progress.campChest = Number(progress.campChest) || 0;
        progress.secretLooted = Number(progress.secretLooted) || 0;
        if (!progress.stats || typeof progress.stats !== 'object') progress.stats = { inputWords: 0, outputWords: 0, sessionDensity: [] };
        if (!Array.isArray(progress.stats.sessionDensity)) progress.stats.sessionDensity = [];
        let hydratedMemory = false;
        if (WM && !Object.keys(progress.wordMemory).length && (progress.learnedIds || []).length) {
            WM.attachToProgress(progress, WM.hydrateFromLearned(progress.learnedIds, Date.now()));
            hydratedMemory = true;
        }
        if (!progress.sceneSentences || typeof progress.sceneSentences !== 'object') progress.sceneSentences = {};
        if (!Array.isArray(progress.playDates)) progress.playDates = [];
        progress.dailyId = progress.dailyId || '';
        progress.dailyDay = progress.dailyDay || '';
        progress.dailyDoneId = progress.dailyDoneId || '';
        progress.dailyDoneDay = progress.dailyDoneDay || '';
        if (!progress.speakByDay || typeof progress.speakByDay !== 'object') progress.speakByDay = {};
        progress.speakCount = Number(progress.speakCount) || 0;
        if (!progress.gear || typeof progress.gear !== 'object') progress.gear = {};
        if (!progress.craftKnown || typeof progress.craftKnown !== 'object') progress.craftKnown = {};
        progress.wordPack = progress.wordPack === 'mc' ? 'mc' : 'core';
        stampPlayDate();
        session.coins = Number(progress.coined) || 0;
        session.bag = Object.assign({}, progress.bag || C.emptyBag());
        if (!progress.hotbar || !progress.hotbar.length || (T.isLegacyLoadout && T.isLegacyLoadout(progress.hotbar))) {
            session.hotbar = T.emptyHotbar();
            const start = (T && T.START_BAG) || { 'oak-log': 3, plank: 4 };
            Object.keys(start).forEach(function (k) {
                if ((Number(session.bag[k]) || 0) < start[k]) session.bag[k] = start[k];
            });
        } else {
            session.hotbar = T.normalizeHotbar(progress.hotbar);
        }
        session.hotIndex = 0;
        session.invPick = null;
        if (hydratedMemory) persist();
    }

    function persist() {
        progress.coined = session.coins;
        progress.bag = session.bag;
        progress.hotbar = session.hotbar;
        progress.gear = progress.gear || {};
        if (bridge && bridge.saveProgress) bridge.saveProgress(GAME_ID, progress);
        syncHud();
    }

    function memNow() {
        return WM ? WM.memoryFromProgress(progress, nowIso()) : { words: {}, hardWords: progress.hardWords || [] };
    }

    function writeMem(mem) {
        if (WM && mem) WM.attachToProgress(progress, mem);
    }

    function recordWordMemory(word, correct) {
        if (!WM || !word || word.side) return;
        writeMem(WM.recordAnswer(memNow(), word.text || word.id, {
            correct: !!correct,
            context: session.reviewRun ? 'review' : 'play',
            meet: true
        }, nowIso()));
    }

    function startCamp() {
        startHub();
    }

    function startTheme() {
        if (sfx && sfx.playBgm) sfx.playBgm(THEME_BGM);
    }

    function paintAudioBtn() {
        const audioBtn = document.getElementById('audio-btn');
        if (!audioBtn) return;
        const muted = !!(sfx && sfx.isMuted && sfx.isMuted());
        audioBtn.textContent = muted ? '静音' : '音乐';
        audioBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
        audioBtn.setAttribute('aria-label', muted ? 'Unmute music' : 'Mute music');
    }

    function bindChrome() {
        const fullBtn = document.getElementById('fullscreen-btn');
        if (fullBtn) fullBtn.addEventListener('click', function () {
            const r = document.documentElement;
            if (!document.fullscreenElement) (r.requestFullscreen || function () {}).call(r);
            else if (document.exitFullscreen) document.exitFullscreen();
        });
        const craftOpen = document.getElementById('craft-btn');
        if (craftOpen) craftOpen.addEventListener('click', function () { toggleCraft(); });
        document.getElementById('help-btn').addEventListener('click', function () {
            showHelpPage(0);
            toggleLayer('help-layer', true);
        });
        document.getElementById('help-close').addEventListener('click', function () { toggleLayer('help-layer', false); });
        const helpPrev = document.getElementById('help-prev');
        const helpNext = document.getElementById('help-next');
        if (helpPrev) helpPrev.addEventListener('click', function () { showHelpPage(session.helpPage - 1); });
        if (helpNext) helpNext.addEventListener('click', function () { showHelpPage(session.helpPage + 1); });
        const hubPicks = document.getElementById('hub-picks');
        if (hubPicks) {
            hubPicks.addEventListener('click', function (e) {
                const btn = e.target.closest('[data-hub-level]');
                if (!btn) return;
                jumpHubLevel(Number(btn.getAttribute('data-hub-level')));
            });
        }
        const todayBtn = document.getElementById('today-btn');
        if (todayBtn) todayBtn.addEventListener('click', function () {
            toggleLayer('today-layer', false);
            startHub();
        });
        const todayClose = document.getElementById('today-close');
        if (todayClose) todayClose.addEventListener('click', function () { toggleLayer('today-layer', false); });
        const todayList = document.getElementById('today-list');
        if (todayList) {
            todayList.addEventListener('click', function (e) {
                const btn = e.target.closest('[data-today]');
                if (!btn) return;
                takeTodayItem(btn.getAttribute('data-today'), btn.getAttribute('data-level'));
            });
        }
        const campPad = document.getElementById('camp-pad');
        if (campPad) {
            campPad.addEventListener('click', function (e) {
                const btn = e.target.closest('[data-today]');
                if (!btn) return;
                takeTodayItem(btn.getAttribute('data-today'), btn.getAttribute('data-level'));
            });
        }
        const campMap = document.getElementById('camp-map');
        if (campMap) {
            campMap.addEventListener('click', function (e) {
                const extra = e.target.closest('[data-today]');
                if (extra) {
                    takeTodayItem(extra.getAttribute('data-today'), extra.getAttribute('data-level'));
                    return;
                }
                const btn = e.target.closest('[data-map-level]');
                if (!btn) return;
                if (btn.disabled || btn.getAttribute('data-state') === 'locked') {
                    toast('先通前面的关');
                    return;
                }
                const lv = Number(btn.getAttribute('data-map-level')) || 1;
                const state = btn.getAttribute('data-state');
                toggleLayer('today-layer', false);
                if (state === 'due') enterReviewDoor(lv);
                else startLevel(lv);
            });
        }
        const doorsBtn = document.getElementById('doors-btn');
        if (doorsBtn) doorsBtn.addEventListener('click', function () {
            paintDoors();
            toggleLayer('doors-layer', true);
        });
        const doorsClose = document.getElementById('doors-close');
        if (doorsClose) doorsClose.addEventListener('click', function () { toggleLayer('doors-layer', false); });
        const doorsList = document.getElementById('doors-list');
        if (doorsList) {
            doorsList.addEventListener('click', function (e) {
                const scrollBtn = e.target.closest('[data-scroll]');
                if (scrollBtn) {
                    tryPickupScroll(scrollBtn.getAttribute('data-scroll'));
                    return;
                }
                const secret = e.target.closest('[data-secret]');
                if (secret) {
                    toggleLayer('doors-layer', false);
                    startLevel(1, { secret: true });
                    return;
                }
                const tierBtn = e.target.closest('[data-tier]');
                if (tierBtn && !tierBtn.disabled) {
                    toggleLayer('doors-layer', false);
                    startLevel(Number(tierBtn.getAttribute('data-level')) || 1, {
                        tier: tierBtn.getAttribute('data-tier')
                    });
                    return;
                }
                const btn = e.target.closest('[data-door]');
                if (!btn || btn.disabled) return;
                enterReviewDoor(btn.getAttribute('data-door'));
            });
        }
        const campSkip = document.getElementById('camp-skip');
        if (campSkip) campSkip.addEventListener('click', function () {
            toggleLayer('today-layer', false);
            startLevel(progress.unlockedLevel || 1);
        });
        const dummyBtn = document.getElementById('dummy-btn');
        if (dummyBtn) dummyBtn.addEventListener('click', function () { askDummy(); });
        const tierClose = document.getElementById('tier-close');
        if (tierClose) tierClose.addEventListener('click', function () { toggleLayer('tier-layer', false); });
        const dexBtn = document.getElementById('dex-btn');
        if (dexBtn) dexBtn.addEventListener('click', function () {
            paintDex();
            toggleLayer('dex-layer', true);
        });
        const dexClose = document.getElementById('dex-close');
        if (dexClose) dexClose.addEventListener('click', function () { toggleLayer('dex-layer', false); });
        const sceneBtn = document.getElementById('scene-btn');
        if (sceneBtn) sceneBtn.addEventListener('click', function () { openSceneLayer(); });
        const sceneClose = document.getElementById('scene-close');
        if (sceneClose) sceneClose.addEventListener('click', function () { toggleLayer('scene-layer', false); });
        const sceneMic = document.getElementById('scene-mic');
        if (sceneMic) sceneMic.addEventListener('click', function () { listenScene(); });
        const sceneAgain = document.getElementById('scene-again');
        if (sceneAgain) sceneAgain.addEventListener('click', function () {
            if (!SL || !session.sceneLoop) return;
            session.sceneLoop = SL.again(session.sceneLoop);
            syncSceneFromLoop();
            playScenePrompt();
        });
        const sceneSkip = document.getElementById('scene-skip');
        if (sceneSkip) sceneSkip.addEventListener('click', function () {
            if (!SL || !session.sceneLoop) return;
            session.sceneLoop = SL.skipWait(session.sceneLoop);
            finishSceneWait(80);
        });
        const sceneForm = document.getElementById('scene-form');
        if (sceneForm) {
            sceneForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const input = document.getElementById('scene-type');
                const heard = input ? String(input.value || '').trim() : '';
                if (!heard) return;
                handleSceneHeard(heard);
                if (input) input.value = '';
            });
        }
        const scenePicks = document.getElementById('scene-picks');
        if (scenePicks) {
            scenePicks.addEventListener('click', function (e) {
                const btn = e.target.closest('[data-scene]');
                if (!btn || !SC) return;
                beginScene(btn.getAttribute('data-scene'));
            });
        }
        const parentBtn = document.getElementById('parent-btn');
        if (parentBtn) parentBtn.addEventListener('click', function () {
            paintParentReport();
            toggleLayer('parent-layer', true);
        });
        const parentClose = document.getElementById('parent-close');
        if (parentClose) parentClose.addEventListener('click', function () { toggleLayer('parent-layer', false); });
        const packBox = document.getElementById('word-pack');
        if (packBox) {
            packBox.addEventListener('click', function (e) {
                const btn = e.target.closest('[data-pack]');
                if (!btn) return;
                setWordPack(btn.getAttribute('data-pack'));
            });
        }
        const audioBtn = document.getElementById('audio-btn');
        if (audioBtn) {
            audioBtn.addEventListener('click', function () {
                const muted = !!(sfx && sfx.isMuted && sfx.isMuted());
                if (sfx && sfx.setMuted) sfx.setMuted(!muted);
                startTheme();
                paintAudioBtn();
            });
        }
        document.addEventListener('pointerdown', startTheme, { once: true });
        document.addEventListener('keydown', startTheme, { once: true });
        paintAudioBtn();
        const buddyBtn = document.getElementById('buddy-btn');
        if (buddyBtn) buddyBtn.addEventListener('click', function () { openBuddySettings(); });
        const buddyClose = document.getElementById('buddy-close');
        if (buddyClose) buddyClose.addEventListener('click', function () { toggleLayer('buddy-layer', false); });
        const buddyClear = document.getElementById('buddy-clear');
        if (buddyClear) buddyClear.addEventListener('click', function () { clearBuddySettings(); });
        const buddyRepick = document.getElementById('buddy-repick');
        if (buddyRepick) buddyRepick.addEventListener('click', function () { showBuddyGate(); });
        const gate = document.getElementById('buddy-gate');
        if (gate) {
            gate.addEventListener('click', function (e) {
                const btn = e.target.closest('[data-play-mode]');
                if (!btn) return;
                choosePlayMode(btn.getAttribute('data-play-mode'));
            });
        }
        const buddyForm = document.getElementById('buddy-form');
        if (buddyForm) {
            buddyForm.addEventListener('submit', function (e) {
                e.preventDefault();
                applyBuddySettings();
            });
        }
        document.getElementById('trade-close').addEventListener('click', function () { closeTrade(); });
        const craftClose = document.getElementById('craft-close');
        if (craftClose) craftClose.addEventListener('click', function () { toggleCraft(false); });
        const craftLayer = document.getElementById('craft-layer');
        if (craftLayer) {
            craftLayer.addEventListener('click', function (e) {
                const craftBtn = e.target.closest('[data-craft]');
                if (craftBtn) { doCraft(craftBtn.getAttribute('data-craft')); return; }
                const cell = e.target.closest('[data-cell]');
                if (cell) {
                    if (session.invPick && session.invPick.from === 'inv') {
                        putCraftItem(session.invPick.id);
                        session.invPick = null;
                        paintCraft();
                        return;
                    }
                    takeCraftCell(Number(cell.getAttribute('data-cell')));
                    return;
                }
                const hot = e.target.closest('[data-hot]');
                if (hot) { clickCraftHot(Number(hot.getAttribute('data-hot'))); return; }
                const inv = e.target.closest('[data-inv]');
                if (inv) { clickCraftInv(inv.getAttribute('data-inv')); return; }
                if (e.target.closest('#craft-out')) takeCraftResult();
            });
            craftLayer.addEventListener('contextmenu', function (e) {
                const inv = e.target.closest('[data-inv]');
                if (!inv) return;
                e.preventDefault();
                putCraftItem(inv.getAttribute('data-inv'));
            });
        }
        document.getElementById('trade-sell').addEventListener('click', sellAll);
        function replayQuizWord() {
            if (session.quiz) speakWord(session.quiz.word);
        }
        document.getElementById('quiz-speak').addEventListener('click', replayQuizWord);
        document.getElementById('quiz-en').addEventListener('click', replayQuizWord);
        const quizMic = document.getElementById('quiz-mic');
        if (quizMic) quizMic.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            listenOnce();
        });
        const voiceBox = document.getElementById('voice-fallback-choices');
        if (voiceBox) {
            voiceBox.addEventListener('click', function (e) {
                const btn = e.target.closest('[data-voice-choice]');
                if (!btn) return;
                e.preventDefault();
                resolveVoiceFallback(Number(btn.getAttribute('data-voice-choice')));
            });
        }
        const keys = document.getElementById('cast-keyboard');
        if (keys) {
            keys.addEventListener('pointerdown', function (e) {
                const btn = e.target.closest('[data-key], [data-action]');
                if (!btn || !session.casting) return;
                e.preventDefault();
                e.stopPropagation();
                const action = btn.getAttribute('data-action');
                if (action === 'backspace') {
                    session.castBuf = String(session.castBuf || '').slice(0, -1);
                    paintCastHud();
                    return;
                }
                if (action === 'clear') {
                    session.castBuf = '';
                    paintCastHud();
                    return;
                }
                if (action === 'enter') {
                    tryCastSubmit();
                    return;
                }
                const ch = btn.getAttribute('data-key');
                if (ch) appendCast(ch);
            });
        }
        const quizKeys = document.getElementById('quiz-keyboard');
        if (quizKeys) {
            quizKeys.addEventListener('pointerdown', function (e) {
                const btn = e.target.closest('[data-key], [data-action]');
                if (!btn || !session.quiz) return;
                e.preventDefault();
                e.stopPropagation();
                applyQuizKey(btn.getAttribute('data-action'), btn.getAttribute('data-key'));
            });
        }
        const lookSpeak = document.getElementById('look-speak');
        if (lookSpeak) lookSpeak.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const en = document.getElementById('look-en');
            if (en) speakWord({ text: en.textContent });
        });
        document.getElementById('unlock-btn').addEventListener('click', unlockNext);
        document.getElementById('replay-btn').addEventListener('click', function () {
            toggleLayer('settle-layer', false);
            startLevel(session.level);
        });
        const quizForm = document.getElementById('quiz-type');
        if (quizForm) {
            quizForm.addEventListener('submit', function (e) {
                e.preventDefault();
                submitTypedQuiz();
            });
        }
        const quizInput = document.getElementById('quiz-input');
        if (quizInput) {
            function maybeAutoSpell() {
                if (!session.quiz || !session.quiz.typed) return;
                if (W.checkQuiz && W.checkQuiz(session.quiz, quizInput.value)) submitTypedQuiz();
            }
            quizInput.addEventListener('input', function () {
                if (session.quiz) refreshQuizKeyPaint();
                maybeAutoSpell();
            });
            quizInput.addEventListener('compositionend', maybeAutoSpell);
        }
        document.addEventListener('keydown', function (e) {
            if (session.quiz) {
                if (e.key === 'v' || e.key === 'V') {
                    e.preventDefault();
                    listenOnce();
                    return;
                }
                const inType = e.target && e.target.id === 'quiz-input';
                if (session.quiz.typed || inType) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        submitTypedQuiz();
                        return;
                    }
                    if (!inType && e.key === 'Backspace') {
                        e.preventDefault();
                        applyQuizKey('backspace');
                        return;
                    }
                    if (!inType && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                        e.preventDefault();
                        applyQuizKey('', e.key);
                    }
                    return;
                }
                if (e.key >= '1' && e.key <= '4') {
                    e.preventDefault();
                    pickQuizChoice(Number(e.key) - 1);
                }
                return;
            }
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
                const wrap = e.target.closest('form, .bl-layer, .bl-buddy-type');
                const buried = !!(wrap && wrap.classList.contains('is-hidden'));
                if (buried) {
                    e.target.blur();
                } else {
                    if (e.key === 'Escape') {
                        showBuddyType(false);
                        toggleLayer('buddy-layer', false);
                    }
                    return;
                }
            }
            if (e.key === 'v' || e.key === 'V') {
                e.preventDefault();
                session.voice.buddy = false;
                startVoiceChallenge();
                return;
            }
            if (e.key === 'g' || e.key === 'G') {
                if (e.repeat) return;
                if (session.voice && session.voice.state === 'listening' && session.voice.lock && !session.voice.buddy) return;
                e.preventDefault();
                startBuddyListen();
                return;
            }
            if (session.voice && session.voice.lock && e.key >= '1' && e.key <= '4') {
                const box = document.getElementById('voice-fallback');
                if (box && !box.classList.contains('is-hidden')) {
                    e.preventDefault();
                    resolveVoiceFallback(Number(e.key) - 1);
                    return;
                }
            }
            if ((e.key === 't' || e.key === 'T') && !session.casting) {
                if (!overlayOpen()) {
                    e.preventDefault();
                    setCasting(true);
                    if (!session.casting) toast('先对准怪物或村民按 V / T');
                    else toast('Esc 取消 · 再按字母拼单词');
                    return;
                }
            }
            if (session.casting) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    setCasting(false);
                    return;
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    tryCastSubmit();
                    return;
                }
                if (e.key === 'Backspace') {
                    e.preventDefault();
                    session.castBuf = session.castBuf.slice(0, -1);
                    paintCastHud();
                    return;
                }
                if (e.key.length === 1 && /[a-zA-Z'\-]/.test(e.key)) {
                    e.preventDefault();
                    appendCast(e.key);
                }
                return;
            }
            if (e.key === 'f' || e.key === 'F') {
                if (tryMountToggle()) return;
                if (session.nearMerchant) openTrade();
            }
            if (e.key === 'c' || e.key === 'C') {
                e.preventDefault();
                toggleCraft();
                return;
            }
            if (session.paused) return;
            if (e.key >= '1' && e.key <= '9') selectSlot(Number(e.key));
            const riding = !!(engine && engine.player && engine.player.mounted);
            if ((e.key === 'q' || e.key === 'Q') && !riding) tryBolt();
            if ((e.key === 'e' || e.key === 'E') && !riding) tryEat();
            if (e.key === 'Escape') {
                const gateOpen = document.getElementById('buddy-gate');
                if (gateOpen && !gateOpen.classList.contains('is-hidden')) {
                    return;
                }
                toggleLayer('help-layer', false);
                closeTrade();
                toggleLayer('buddy-layer', false);
                toggleCraft(false);
                showBuddyType(false);
            }
        });
        document.addEventListener('keyup', function (e) {
            if (e.key === 'g' || e.key === 'G') {
                if (session.voice && session.voice.buddy) stopVoiceRec();
            }
        });
        const buddyTypeForm = document.getElementById('buddy-type');
        if (buddyTypeForm) {
            buddyTypeForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const input = document.getElementById('buddy-input');
                const heard = input ? String(input.value || '').trim() : '';
                if (input) input.value = '';
                showBuddyType(false);
                if (heard) handleBuddyHeard(heard, session.voice && session.voice.lock);
            });
        }
    }

    function nowMs() { return Date.now(); }

    function recordBridgeAnswer(word, correct) {
        try {
            const bridge = globalThis.WorkbenchGameBridge;
            if (word && word.side && bridge && bridge.recordSubjectAnswer) {
                bridge.recordSubjectAnswer(word.side.masteryTrack, word.side.masteryKey, correct);
                return;
            }
            if (word && word.text && bridge && bridge.recordWordAnswer) {
                bridge.recordWordAnswer(word.text, correct, { source: 'blocklegend' });
            }
        } catch (e) { /* 工作台桥接失败不能拦住本局出题/伤害 */ }
    }

    function overlayOpen() {
        return ['quiz-layer', 'settle-layer', 'trade-layer', 'help-layer', 'craft-layer', 'buddy-layer', 'buddy-gate', 'scene-layer', 'doors-layer', 'today-layer', 'tier-layer', 'dex-layer', 'parent-layer'].some(function (id) {
            const el = document.getElementById(id);
            return el && !el.classList.contains('is-hidden');
        });
    }

    function showHelpPage(n) {
        const pages = document.querySelectorAll('#help-pages .bl-help-page');
        const total = pages.length || 1;
        session.helpPage = ((Number(n) || 0) % total + total) % total;
        pages.forEach(function (page, idx) {
            page.classList.toggle('is-hidden', idx !== session.helpPage);
        });
        const lab = document.getElementById('help-page-label');
        if (lab) lab.textContent = (session.helpPage + 1) + ' / ' + total;
    }

    function toggleLayer(id, on) {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('is-hidden', !on);
        session.paused = overlayOpen();
        if (engine && engine.setUiMode) engine.setUiMode(session.paused);
        syncTouchHud();
        if (!on && id === 'quiz-layer' && !session.paused && engine && engine.resumeLook) {
            engine.resumeLook();
        }
    }

    function nearTable() {
        if (!engine || !ENG.voxelAt) return false;
        const hit = lookHit();
        if (hit && hit.hit && hit.kind === 'table') return true;
        const p = engine.player;
        const y0 = Math.floor(p.y);
        for (let dz = -2; dz <= 2; dz += 1) {
            for (let dx = -2; dx <= 2; dx += 1) {
                const x = Math.floor(p.x) + dx;
                const z = Math.floor(p.z) + dz;
                if (ENG.voxelAt(engine.world, x, y0, z) === 'table') return true;
                if (ENG.voxelAt(engine.world, x, y0 + 1, z) === 'table') return true;
            }
        }
        return false;
    }

    function toggleCraft(forceOn, atTable) {
        const el = document.getElementById('craft-layer');
        if (!el) return;
        const on = forceOn == null ? el.classList.contains('is-hidden') : !!forceOn;
        session.atTable = true;
        const nextSize = 3;
        if (!on || session.craftSize !== nextSize) {
            session.bag = CR.dumpGrid(session.bag, session.craftCells);
            session.craftCells = CR.emptyGrid(nextSize);
        }
        session.craftSize = nextSize;
        if (on) paintCraft();
        toggleLayer('craft-layer', on);
        if (!on) {
            session.bag = CR.dumpGrid(session.bag, session.craftCells);
            session.craftCells = CR.emptyGrid(session.craftSize);
            persist();
        }
    }

    function itemLabel(id) {
        return (CR && CR.itemName) ? CR.itemName(id) : id;
    }

    function itemIconHtml(id) {
        const key = (CR && CR.itemIcon) ? CR.itemIcon(id) : 'unknown';
        const src = CR && CR.itemArt ? CR.itemArt(id) : '';
        if (src) {
            return '<img class="bl-item bl-item-art bl-item-' + key + '" src="' + src + '" alt="">';
        }
        return '<i class="bl-item bl-item-iso bl-item-' + key + '" aria-hidden="true"></i>';
    }

    function slotInner(id, count) {
        if (!id) return '';
        const n = Number(count);
        const qty = Number.isFinite(n) && n > 1 ? '<em>×' + n + '</em>' : (Number.isFinite(n) && n === 1 ? '' : '');
        return itemIconHtml(id) + qty;
    }

    function paintCraft() {
        const tip = document.getElementById('craft-tip');
        if (tip) {
            tip.textContent = '点配方，拼出英文才能做出。同一件拼对过就记住了。点背包再点合成格放材料，再点物品栏装到 1–9。';
        }
        paintCraftGrid();
        paintCraftBook();
        paintCraftInv();
        paintCraftHotbar();
        paintHotbar();
        paintBagCounts();
    }

    function paintCraftGrid() {
        const grid = document.getElementById('craft-grid');
        const out = document.getElementById('craft-out');
        if (!grid || !CR) return;
        const size = session.craftSize;
        grid.className = 'bl-mc-grid size' + size;
        let html = '';
        for (let i = 0; i < size * size; i += 1) {
            const k = session.craftCells[i];
            html += '<button type="button" class="bl-mc-slot" data-cell="' + i + '"' +
                (k ? ' data-item="' + k + '" title="' + itemLabel(k) + '"' : '') + '>' +
                slotInner(k) + '</button>';
        }
        grid.innerHTML = html;
        const hit = CR.matchGrid(session.craftCells, size);
        if (out) {
            if (hit) {
                const outId = Object.keys(hit.recipe.outputs)[0];
                const n = hit.recipe.outputs[outId];
                out.innerHTML = slotInner(outId, n);
                out.setAttribute('data-item', outId);
                out.title = itemLabel(outId);
                out.disabled = false;
                out.setAttribute('data-ready', '1');
            } else {
                out.innerHTML = '';
                out.disabled = true;
                out.removeAttribute('data-ready');
                out.removeAttribute('data-item');
                out.removeAttribute('title');
            }
        }
    }

    function paintCraftBook() {
        const box = document.getElementById('craft-book');
        if (!box || !CR) return;
        const list = CR.recipesFor({ atTable: session.atTable });
        box.innerHTML = list.map(function (r) {
            const ready = CR.canCraft(session.bag, r.id, { atTable: session.atTable });
            const outId = Object.keys(r.outputs || {})[0] || r.id;
            const mats = Object.keys(r.inputs || {}).map(function (k) {
                return '<span class="bl-craft-mat" title="' + itemLabel(k) + '">' +
                    itemIconHtml(k) + '<em>' + r.inputs[k] + '</em></span>';
            }).join('');
            return '<button type="button" class="bl-craft-btn' + (ready ? '' : ' is-off') + '" data-craft="' + r.id + '">' +
                itemIconHtml(outId) +
                '<span class="bl-craft-copy"><b>' + r.name + '</b><span class="bl-craft-mats">' + mats + '</span></span></button>';
        }).join('');
    }

    const INV_SLOTS = 27;

    function paintCraftInv() {
        const box = document.getElementById('craft-inv');
        if (!box) return;
        const keys = Object.keys(session.bag).filter(function (k) { return (Number(session.bag[k]) || 0) > 0; });
        let html = '';
        for (let i = 0; i < INV_SLOTS; i += 1) {
            const k = keys[i];
            const pick = session.invPick && session.invPick.from === 'inv' && session.invPick.id === k;
            html += '<button type="button" class="bl-mc-slot' + (pick ? ' is-pick' : '') + '"' +
                (k ? ' data-inv="' + k + '" data-item="' + k + '" title="' + itemLabel(k) + '"' : '') + '>' +
                (k ? slotInner(k, session.bag[k]) : '') + '</button>';
        }
        box.innerHTML = html;
    }

    function paintCraftHotbar() {
        const box = document.getElementById('craft-hotbar');
        if (!box) return;
        const bar = session.hotbar || T.emptyHotbar();
        let html = '';
        for (let i = 0; i < 9; i += 1) {
            const id = bar[i];
            const pick = session.invPick && session.invPick.from === 'hot' && session.invPick.index === i;
            const n = id && !T.isHotTool(id) ? (Number(session.bag[id]) || 0) : 0;
            html += '<button type="button" class="bl-mc-slot' + (pick ? ' is-pick' : '') + (session.hotIndex === i ? ' is-on' : '') +
                '" data-hot="' + i + '"' + (id ? ' data-item="' + id + '" title="' + itemLabel(id) + '"' : '') + '>' +
                (id ? slotInner(id, n > 1 ? n : 0) : '') + '<em>' + (i + 1) + '</em></button>';
        }
        box.innerHTML = html;
    }

    function clickCraftInv(id) {
        if (!id) return;
        if (session.invPick && session.invPick.from === 'hot') {
            session.hotbar = T.assignHotbar(session.hotbar, session.invPick.index, id);
            session.invPick = null;
            persist();
            paintCraft();
            toast('已装到物品栏。按 ' + ((session.hotIndex || 0) + 1) + '–9 选用。');
            return;
        }
        if (session.invPick && session.invPick.from === 'inv' && session.invPick.id === id) {
            putCraftItem(id);
            return;
        }
        session.invPick = { from: 'inv', id: id };
        paintCraftInv();
        paintCraftHotbar();
        toast('再点下面物品栏格子装上去，或再点一次放进合成格。');
    }

    function clickCraftHot(index) {
        const i = Math.max(0, Math.min(8, Number(index) || 0));
        if (session.invPick && session.invPick.from === 'inv') {
            session.hotbar = T.assignHotbar(session.hotbar, i, session.invPick.id);
            session.invPick = null;
            persist();
            paintCraft();
            toast('已装到物品栏 ' + (i + 1) + '。关掉后按 ' + (i + 1) + ' 选用。');
            return;
        }
        if (session.invPick && session.invPick.from === 'hot') {
            session.hotbar = T.swapHotbar(session.hotbar, session.invPick.index, i);
            session.invPick = null;
            persist();
            paintCraft();
            return;
        }
        session.invPick = { from: 'hot', id: session.hotbar[i], index: i };
        paintCraftHotbar();
        toast('再点背包物品互换，或点另一个物品栏格子对调。');
    }

    function putCraftItem(kind) {
        if (!kind || (Number(session.bag[kind]) || 0) <= 0) return;
        const n = session.craftSize * session.craftSize;
        for (let i = 0; i < n; i += 1) {
            if (!session.craftCells[i]) {
                session.craftCells[i] = kind;
                session.bag = C.addLoot(session.bag, kind, -1);
                if ((Number(session.bag[kind]) || 0) < 0) session.bag[kind] = 0;
                paintCraft();
                return;
            }
        }
    }

    function takeCraftCell(i) {
        const k = session.craftCells[i];
        if (!k) return;
        session.craftCells[i] = null;
        session.bag = C.addLoot(session.bag, k, 1);
        paintCraft();
    }

    function takeCraftResult() {
        if (!CR) return;
        const hit = CR.matchGrid(session.craftCells, session.craftSize);
        if (!hit) return;
        askCraftSpell('grid', hit.recipe.id);
    }

    function finishTakeCraft() {
        const hit = CR.matchGrid(session.craftCells, session.craftSize);
        if (!hit) return;
        session.craftCells = CR.consumeGrid(session.craftCells, session.craftSize, hit);
        Object.keys(hit.recipe.outputs).forEach(function (k) {
            session.bag = C.addLoot(session.bag, k, hit.recipe.outputs[k]);
        });
        persist();
        paintCraft();
        if (sfx && sfx.craft) sfx.craft();
        toast(craftDoneTip(hit.recipe));
        if (hit.recipe && hit.recipe.id) noteQuest({ type: 'craft', id: hit.recipe.id });
    }

    function doCraft(id) {
        if (!CR) return;
        if (!CR.canCraft(session.bag, id, { atTable: session.atTable })) {
            toast('材料不够');
            return;
        }
        askCraftSpell('book', id);
    }

    function finishDoCraft(id) {
        const r = CR.craft(session.bag, id, { atTable: session.atTable });
        if (!r.ok) {
            toast(r.reason || '材料不够');
            return;
        }
        session.bag = r.bag;
        persist();
        paintCraft();
        if (sfx && sfx.craft) sfx.craft();
        toast(craftDoneTip(r.recipe || { id: id, name: id }));
        noteQuest({ type: 'craft', id: id });
    }

    function askCraftSpell(via, id) {
        if (CR.needsCraftSpell && !CR.needsCraftSpell(id, progress.craftKnown)) {
            if (via === 'grid') finishTakeCraft();
            else finishDoCraft(id);
            return;
        }
        const word = CR.craftWord ? CR.craftWord(id) : { id: id, text: id, zh: id };
        rememberBoundWord(word);
        session.pending = { craftItem: id, craftVia: via };
        fillQuizCard(nextLearnQuiz(word, { mode: 'spell' }), '合成 · 拼出 ' + (word.zh || word.text));
    }

    function craftDoneTip(recipe) {
        const id = recipe && recipe.id;
        const name = (recipe && recipe.name) || id || '物品';
        if (id === 'table' || id === 'chest' || id === 'furnace' || id === 'torch') {
            session.placeLoot = id;
            return '合成了' + name + '。点背包里的它，再点下面物品栏格子装上去，然后按 1–9 选用、右键放置。';
        }
        return '合成了 ' + name + '。点背包再点下面物品栏，就能装到 1–9。';
    }

    function uiBlocksWorld() {
        return !!(document.querySelector('.bl-layer:not(.is-hidden), .bl-quiz-layer:not(.is-hidden)'));
    }

    function tryAutoEat(id) {
        if (!id || !engine || !engine.player) return false;
        if (engine.player.hp >= engine.player.hpMax) return false;
        const plan = T.applyEat ? T.applyEat(engine.player.hp, engine.player.hpMax, id) : { ok: false };
        if (!plan.ok) return false;
        engine.player.hp = plan.hp;
        persist();
        paintHearts();
        if (sfx && sfx.eat) sfx.eat();
        toast('吃了' + itemLabel(id) + ' · +' + plan.heal + 'HP');
        return true;
    }

    function tryEat() {
        const id = session.hotbar && session.hotbar[session.hotIndex];
        const plan = T.applyEat ? T.applyEat(engine.player.hp, engine.player.hpMax, id) : { ok: false };
        if (!plan.ok) return false;
        const n = Number(session.bag[id]) || 0;
        if (n <= 0) {
            toast('没有' + itemLabel(id) + '了');
            return true;
        }
        session.bag[id] = n - 1;
        engine.player.hp = plan.hp;
        persist();
        paintHearts();
        paintHotbar();
        if (sfx && sfx.eat) sfx.eat();
        toast('吃了' + itemLabel(id) + ' · +' + plan.heal + 'HP');
        return true;
    }

    // —— 龙息：骑乘时左键从龙头喷火球，命中怪走 hurtMonster（HUD 伤害数字），冷却 1s ——
    function tryDragonBreath() {
        if (!engine || !engine.player || !engine.player.mounted) return false;
        const now = nowMs();
        if (session.breathAt && now - session.breathAt < 1000) return true;
        session.breathAt = now;
        const p = engine.player;
        const aim = nearestLookMob();
        // 龙头近似位置：玩家(骑手)前方一点
        const fx = -Math.sin(engine.look.yaw), fz = -Math.cos(engine.look.yaw);
        const head = { x: p.x + fx * 1.2, y: (p.y || 0) + 0.6, z: p.z + fz * 1.2, height: 0 };
        const target = aim || { x: p.x + fx * 8, z: p.z + fz * 8 };
        const dmg = C.breathDamage
            ? C.breathDamage({ now: now, wordAt: session.wordAt })
            : 4;
        fireBossShot(head, {
            aim: target,
            shot: 'fireball', color: 0xff6a2a, halo: 0xffd24a,
            track: !!aim, friendly: true, aimMob: aim || null,
            dmg: dmg
        });
        if (MOBS.spawnBurst) MOBS.spawnBurst(engine.scene, session.fx, head.x, head.y, head.z, dmg > 4 ? 0xffe27a : 0xff8a3a, dmg > 4 ? 9 : 6);
        if (sfx && sfx.fireball) sfx.fireball(); else if (sfx && sfx.shoot) sfx.shoot();
        toast(dmg > 4 ? '龙息暴击！说中了' : '龙息！');
        return true;
    }

    // —— 急速尾迹：骑乘且 boost(speedFactor>1.25)时在龙尾喷粒子流 ——
    function tickRideTrail(now) {
        const m = engine && engine.player && engine.player.mounted;
        if (!m || !(m.speedFactor > 1.25)) return;
        if (session.trailAt && now - session.trailAt < 90) return;
        session.trailAt = now;
        const fx = -Math.sin(engine.look.yaw), fz = -Math.cos(engine.look.yaw);
        const tx = m.x - fx * 2.2, tz = m.z - fz * 2.2, ty = (m.y != null ? m.y : 0) + 1.2;
        if (MOBS.spawnBurst) MOBS.spawnBurst(engine.scene, session.fx, tx, ty, tz, 0xbfd8ff, 3);
    }

    function beginMine() {
        hideLookTip();
        if (session.paused || uiBlocksWorld()) return;
        if (engine.player.mounted && tryDragonBreath()) return;
        if (overlappingFarm() || meleeTarget()) {
            session.mining = true;
            tryMelee();
            return;
        }
        if (tryEat()) return;
        session.mining = true;
    }

    function endMine() {
        stopMining();
    }

    function usePlace() {
        hideLookTip();
        if (session.paused || uiBlocksWorld()) return;
        if (tryInteract()) return;
        if (tryEat()) return;
        const hit = lookHit();
        if (hit && hit.hit && hit.kind === 'table') {
            toggleCraft(true, true);
            return;
        }
        if (session.tool === 'place') tryPlace();
    }

    function wantTouchPad() {
        if (/[?&]pad=0(?:&|$)/.test(location.search || '')) return false;
        if (/[?&]pad=1(?:&|$)/.test(location.search || '')) return true;
        if (session.playMode === 'tablet') return true;
        if (session.playMode === 'desktop' || session.playMode === 'web') return false;
        if (window.Capacitor) return true;
        if (window.matchMedia && (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches)) return true;
        return false;
    }

    function syncTouchHud() {
        const root = document.getElementById('touch-pad');
        document.body.classList.toggle('is-overlay', overlayOpen());
        if (!root) return;
        if (!wantTouchPad()) {
            root.hidden = true;
            return;
        }
        root.hidden = overlayOpen();
    }

    let touchPadBound = false;
    function bindTouchPad() {
        const root = document.getElementById('touch-pad');
        const dpad = document.getElementById('touch-dpad');
        if (!root || !engine || !engine.setHeld) return;
        if (!wantTouchPad()) return;
        root.hidden = false;
        document.body.classList.add('is-touch');
        if (touchPadBound) {
            syncTouchHud();
            return;
        }
        touchPadBound = true;
        const dirs = ['fwd', 'back', 'left', 'right'];
        let padId = null;

        function paintDirs(state) {
            if (engine.setMoveAxis) engine.setMoveAxis(state ? state.x : 0, state ? state.y : 0);
            dirs.forEach(function (dir) {
                engine.setHeld(dir, !!(state && state[dir]));
                const btn = dpad && dpad.querySelector('[data-dir="' + dir + '"]');
                if (btn) btn.classList.toggle('is-held', !!(state && state[dir]));
            });
        }

        function dirFromEvent(ev) {
            if (!dpad) return null;
            const box = dpad.getBoundingClientRect();
            const rx = (ev.clientX - (box.left + box.width / 2)) / Math.max(1, box.width / 2);
            const ry = (ev.clientY - (box.top + box.height / 2)) / Math.max(1, box.height / 2);
            const mag = Math.hypot(rx, ry);
            const dead = 0.18;
            if (mag < dead) return { x: 0, y: 0, fwd: false, back: false, left: false, right: false };
            const scale = Math.min(1, mag);
            const nx = (rx / mag) * scale;
            const ny = (ry / mag) * scale;
            return {
                x: nx,
                y: -ny,
                fwd: ny < -0.22,
                back: ny > 0.22,
                left: nx < -0.22,
                right: nx > 0.22
            };
        }

        function holdBtn(el, on) {
            if (el) el.classList.toggle('is-held', !!on);
        }

        if (dpad) {
            dpad.addEventListener('pointerdown', function (e) {
                e.preventDefault();
                e.stopPropagation();
                padId = e.pointerId;
                if (dpad.setPointerCapture) dpad.setPointerCapture(e.pointerId);
                paintDirs(dirFromEvent(e));
            });
            dpad.addEventListener('pointermove', function (e) {
                if (padId == null || e.pointerId !== padId) return;
                e.preventDefault();
                paintDirs(dirFromEvent(e));
            });
            function endPad(e) {
                if (padId == null || (e && e.pointerId !== padId)) return;
                padId = null;
                paintDirs(null);
            }
            dpad.addEventListener('pointerup', endPad);
            dpad.addEventListener('pointercancel', endPad);
        }

        const jump = document.getElementById('touch-jump');
        const attack = document.getElementById('touch-attack');
        const place = document.getElementById('touch-place');

        function bindHold(el, onDown, onUp) {
            if (!el) return;
            let id = null;
            el.addEventListener('pointerdown', function (e) {
                e.preventDefault();
                e.stopPropagation();
                id = e.pointerId;
                if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
                holdBtn(el, true);
                onDown();
            });
            function end(e) {
                if (id == null || (e && e.pointerId !== id)) return;
                id = null;
                holdBtn(el, false);
                onUp();
            }
            el.addEventListener('pointerup', end);
            el.addEventListener('pointercancel', end);
        }

        bindHold(jump, function () { engine.setHeld('jump', true); }, function () { engine.setHeld('jump', false); });
        bindHold(attack, beginMine, endMine);
        bindHold(place, usePlace, function () {});
        root.addEventListener('contextmenu', function (e) { e.preventDefault(); });
        syncTouchHud();
    }

    function bindCombatInput(canvas) {
        canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
        document.addEventListener('mousedown', function (e) {
            if (e.target && e.target.closest && e.target.closest('.bl-layer, .bl-touch, button, a')) return;
            hideLookTip();
            if (session.paused) return;
            if (e.button === 0) beginMine();
            if (e.button === 2) {
                e.preventDefault();
                usePlace();
            }
        });
        document.addEventListener('mouseup', function (e) {
            if (e.button === 0) endMine();
        });
        document.querySelectorAll('.bl-slot[data-key]').forEach(function (el) {
            el.addEventListener('click', function () {
                const n = Number(el.getAttribute('data-key'));
                if (n >= 1 && n <= 9) selectSlot(n);
            });
        });
    }

    function ensureLevelStarted() {
        if (session.levelStarted) return;
        session.levelStarted = true;
        if (isPlaytest()) startLevel(progress.unlockedLevel || session.level || 1);
        else startHub();
    }

    function reviewDueIds() {
        const doors = RS && RS.listReviewDoors ? RS.listReviewDoors(progress, nowIso()) : [];
        return doors.filter(function (d) {
            return d.canEnter || d.status === 'ready' || d.status === 'overdue';
        }).map(function (d) { return Number(d.levelId); });
    }

    function startHub() {
        clearEntities();
        session.hub = true;
        session.hubEntering = false;
        session.hubUnlocking = false;
        session.levelStarted = true;
        session.combo = 0;
        session.wave = 0;
        session.wavesLeft = 0;
        session.boss = null;
        session.bossMob = null;
        session.pending = null;
        session.gateAsked = null;
        session.reviewRun = null;
        session.secretRun = false;
        session.quiz = null;
        setCasting(false);
        toggleLayer('today-layer', false);
        toggleLayer('settle-layer', false);
        const cx = 192;
        const cz = 192;
        const portals = L.hubPortalsOf ? L.hubPortalsOf({
            unlockedLevel: progress.unlockedLevel || 1,
            clearedLevels: progress.clearedLevels || [],
            dueLevelIds: reviewDueIds(),
            secret: !!(D && D.secretUnlocked(progress.scrolls || [])),
            cx: cx,
            cz: cz
        }) : [];
        if (engine && engine.reloadWorld) {
            engine.reloadWorld(ENG.createWorld(3, {
                climate: 'plains',
                hub: true,
                portals: portals
            }));
            if (session.merchant && session.merchant.mesh) engine.scene.remove(session.merchant.mesh);
            spawnMerchant();
            refreshSideTablets();
        }
        if (engine) engine.player.hp = engine.player.hpMax;
        session.lastHitAt = 0;
        toast('小地图黄点 · 走过去就能解锁或进下一关');
        paintHubPicks(true);
        paintSayStrip();
        syncHud();
    }

    function applyLoadedBank() {
        refreshPool();
        session.usedWordKeys = {};
        session.monsters.forEach(function (m) {
            if (!m || m.asked || m.quizPassed) return;
            m.word = null;
            bindMobWord(m);
        });
        if (engine && engine.world && engine.world.wordCells && pool.length) {
            const used = {};
            Object.keys(engine.world.wordCells).forEach(function (key) {
                const hit = pool.filter(function (w) {
                    return w && w.text && !used[w.id || w.text];
                })[0] || pool[0];
                if (!hit) return;
                used[hit.id || hit.text] = true;
                engine.world.wordCells[key] = hit;
            });
        }
        paintSayStrip();
        bootDaily();
        syncHud();
    }

    function startLevel(level, extra) {
        clearEntities();
        session.hub = false;
        session.hubEntering = false;
        paintHubPicks(false);
        session.level = Math.max(1, Number(level) || 1);
        session.combo = 0;
        session.wave = 0;
        session.boss = null;
        session.bossMob = null;
        session.pending = null;
        session.gateAsked = null;
        session.quizTurn = 0;
        session.quizRetry = false;
        session.wordCorrect = 0;
        session.familiarIds = [];
        session.choiceOnly = {};
        session.seenByWord = {};
        session.usedWordKeys = {};
        session.worldActs = 0;
        session.themeAwarded = {};
        session.waveTheme = '';
        session.missByWord = {};
        session.reviewRun = null;
        session.reviewCoinsStart = session.coins;
        session.tier = (extra && extra.tier) || 'default';
        session.secretRun = !!(extra && extra.secret);
        session.askedCount = 0;
        session.levelStartedAt = nowMs();
        session.bossHitsOnShield = 0;
        session.bossNeed = (D && D.tierOf(session.tier).bossAnswers) || 1;
        setCasting(false);
        const cfg = L.levelOf(session.secretRun ? 1 : session.level);
        const review = !!(extra && extra.review);
        if (review && RS && RS.reviewRunConfig) {
            const entry = (progress.levelReview || {})[String(session.level)] || {};
            const run = RS.reviewRunConfig(cfg);
            session.reviewRun = { level: session.level, round: Number(entry.round) || 0 };
            session.wavesLeft = run.waves;
        } else if (session.secretRun && D) {
            session.wavesLeft = D.secretRunConfig().waves;
        } else {
            session.wavesLeft = cfg.waves;
        }
        session.quest = Q ? Q.create(session.secretRun ? 99 : session.level) : null;
        refreshPool();
        bootDaily();
        if (engine && engine.reloadWorld) {
            const seed = session.secretRun && D ? D.secretRunConfig().worldSeed : (cfg.worldSeed || (7 + session.level * 13));
            engine.reloadWorld(ENG.createWorld(seed, {
                climate: cfg.climate || 'plains',
                level: session.secretRun ? 99 : session.level,
                words: W.layoutWorldWords ? W.layoutWorldWords(pool || [], sessionReviewKeys()) : (pool || [])
            }));
            if (session.merchant && session.merchant.mesh) engine.scene.remove(session.merchant.mesh);
            spawnMerchant();
            refreshSideTablets();
        }
        if (engine) engine.player.hp = engine.player.hpMax;
        session.lastHitAt = 0;
        if (session.reviewRun) toast('复习之门 · ' + session.wavesLeft + ' 波后再打小 Boss');
        else if (session.secretRun) toast('词灵回廊 · 三波混怪，没有 Boss');
        else if (session.tier === 'adventure') toast('冒险档 · 只复习旧词');
        else if (session.tier === 'apocalypse') toast('天启档 · 词门限时，蓝罩要连答 3 题');
        maybeOfferScroll();
        if (isPlaytest()) spawnPlaytestRoster();
        else spawnWave();
        paintSayStrip();
        syncHud();
    }

    function todayStr() {
        const d = new Date();
        const m = String(d.getMonth() + 1);
        const day = String(d.getDate());
        return d.getFullYear() + '-' + (m.length < 2 ? '0' + m : m) + '-' + (day.length < 2 ? '0' + day : day);
    }

    function sessionMissed() {
        return Object.keys(session.missByWord || {}).filter(function (k) {
            return (Number(session.missByWord[k]) || 0) > 0;
        });
    }

    function sessionReviewKeys() {
        const keys = [];
        function push(key) {
            const k = String(key || '').trim();
            if (k && keys.indexOf(k) < 0) keys.push(k);
        }
        sessionMissed().forEach(push);
        Object.keys(session.choiceOnly || {}).forEach(push);
        (progress.reviewWords || []).forEach(push);
        return keys;
    }

    function noteFamiliarWord(word, channel) {
        const id = wordKey(word);
        const text = String((word && word.text) || '').toLowerCase();
        if (id && W.noteId) session.familiarIds = W.noteId(session.familiarIds || [], id);
        else if (id && (session.familiarIds || []).indexOf(id) < 0) {
            session.familiarIds = (session.familiarIds || []).concat([id]);
        }
        session.wordCorrect = (session.familiarIds || []).length;
        if (!session.choiceOnly) session.choiceOnly = {};
        if (text) {
            if (!channel || channel === 'choice') session.choiceOnly[text] = 1;
            else delete session.choiceOnly[text];
        }
        noteQuest({ type: 'word-correct', count: session.wordCorrect, unique: true });
        grantThemeAwards(word);
        rebindFarWordCubes();
    }

    function rebindFarWordCubes() {
        if (!engine || !engine.world || !engine.world.wordCells || !W.rebindWorldReviewWords) return;
        const n = Number(engine.world.size) || 512;
        W.rebindWorldReviewWords(engine.world.wordCells, pool || bank, sessionReviewKeys(), {
            cx: Math.floor(n / 2),
            cz: Math.floor(n / 2)
        });
        refreshSideTablets();
    }

    function readSubjectTracks() {
        try {
            const st = bridge && typeof bridge.readState === 'function' ? bridge.readState() : null;
            const root = (st && st.courseProgress) || {};
            return {
                literacy: root.literacy || { mastery: {} },
                pinyin: root.pinyin || { mastery: {} },
                phonics: root.phonics || { mastery: {} },
                math: root.math || { mastery: {} }
            };
        } catch (e) {
            return { literacy: { mastery: {} }, pinyin: { mastery: {} }, phonics: { mastery: {} }, math: { mastery: {} } };
        }
    }

    function enFamiliarCount() {
        const sessionN = (session.familiarIds || []).length;
        const mastery = readMastery();
        const career = P && P.careerFamiliar
            ? P.careerFamiliar(mastery)
            : Object.keys(mastery).filter(function (key) {
                const state = mastery[key] && mastery[key].state;
                return state === 'ready' || state === 'maintenance';
            }).length;
        return Math.max(sessionN, career);
    }

    function sittingDoneNow() {
        return Number(session.sideDone) || 0;
    }

    function sittingRoom() {
        return P && P.sittingLeft ? P.sittingLeft({ done: sittingDoneNow() }) : 6;
    }

    function noteSideSit() {
        session.sideDone = sittingDoneNow() + 1;
        paintSideDue(sideDueNow());
        if (sittingRoom() <= 0 && !session.sideSitToast) {
            session.sideSitToast = true;
            toast('配菜先到这儿 · 继续打英语');
        }
    }

    function paintSideDue(due) {
        const el = document.getElementById('side-due');
        if (el && P && P.hudDueLine) el.textContent = P.hudDueLine(due, { done: sittingDoneNow() });
        const n = ['literacy', 'pinyin', 'phonics', 'math'].reduce(function (sum, kind) {
            return sum + (Number(due && due[kind]) || 0);
        }, 0);
        if (n > 0 && sittingRoom() > 0 && !session.sideDebtToast) {
            session.sideDebtToast = true;
            toast('村里老师有新字卡 · 找他按 F');
        }
    }

    function sideDueNow() {
        return P && P.sideDue
            ? P.sideDue({ enFamiliar: enFamiliarCount(), tracks: readSubjectTracks() })
            : { literacy: 0, pinyin: 0, phonics: 0, math: 0 };
    }

    function allSideCards() {
        const by = session.sideByKind || {};
        return ['literacy', 'pinyin', 'phonics', 'math'].reduce(function (list, kind) {
            return list.concat(by[kind] || []);
        }, []);
    }

    function sideReviewKeys() {
        const tracks = readSubjectTracks();
        const today = todayIso();
        if (!P || !P.reviewKeys) return [];
        return P.reviewKeys(tracks.literacy, today)
            .concat(P.reviewKeys(tracks.pinyin, today))
            .concat(P.reviewKeys(tracks.phonics, today))
            .concat(P.reviewKeys(tracks.math, today));
    }

    function loadSideKinds(kinds, done) {
        const want = (kinds || []).filter(function (kind) {
            return SIDE_PACK[kind] && !(session.sideSkip && session.sideSkip[kind]);
        });
        if (!session.sideByKind) session.sideByKind = {};
        if (!session.sideSkip) session.sideSkip = {};
        const missing = want.filter(function (kind) {
            return !session.sideByKind[kind] || !session.sideByKind[kind].length;
        });
        if (!missing.length) {
            finishSideLoad(want, done);
            return;
        }
        if (typeof fetch !== 'function') {
            finishSideLoad(want, done);
            return;
        }
        Promise.all(missing.map(function (kind) {
            return fetch('../../assets/vocab/' + SIDE_PACK[kind] + '/catalog.json').then(function (res) {
                if (!res.ok) throw new Error(kind + ' catalog ' + res.status);
                return res.json();
            }).then(function (json) {
                session.sideByKind[kind] = P && P.cardsFromCatalog ? P.cardsFromCatalog(json) : [];
            }).catch(function () {
                session.sideSkip[kind] = true;
                toast(P && P.loadFailLine ? P.loadFailLine(kind) : '识字板暂时没有');
            });
        })).then(function () {
            finishSideLoad(want, done);
        });
    }

    function finishSideLoad(want, done) {
        loadLiteracyEngine(want, function () {
            session.sideReady = true;
            session.sideCards = allSideCards();
            if (done) done();
        });
    }

    function loadLiteracyEngine(want, done) {
        if (!want || want.indexOf('literacy') < 0) {
            if (done) done();
            return;
        }
        if (window.PersonalWorkbenchPreschoolLiteracy) {
            if (done) done();
            return;
        }
        const s = document.createElement('script');
        s.src = '../../preschool-literacy.js?v=20260819-bl-side7';
        s.onload = function () { if (done) done(); };
        s.onerror = function () { if (done) done(); };
        document.head.appendChild(s);
    }

    function refreshSideTablets() {
        if (!P || !engine || !engine.world || !engine.world.wordCells) return;
        const due = sideDueNow();
        paintSideDue(due);
        const kinds = ['literacy', 'pinyin', 'phonics'].filter(function (kind) {
            return (Number(due[kind]) || 0) > 0 && !(session.sideSkip && session.sideSkip[kind]);
        });
        if (!kinds.length || sittingRoom() <= 0) {
            P.bindFarSideCells(engine.world.wordCells, [], {
                cx: engine.player ? engine.player.x : 0,
                cz: engine.player ? engine.player.z : 0
            });
            return;
        }
        loadSideKinds(kinds, function () {
            const tracks = readSubjectTracks();
            const qs = P.pickTabletQuestions
                ? P.pickTabletQuestions(due, {
                    cards: allSideCards(),
                    avoidKeys: session.sideAvoid || [],
                    dueKeys: sideReviewKeys(),
                    tracks: tracks,
                    literacyBand: P.literacyBand
                        ? P.literacyBand(P.knownCount ? P.knownCount(tracks.literacy) : 0)
                        : 'L1',
                    sittingDone: sittingDoneNow(),
                    salt: 0
                })
                : [];
            P.bindFarSideCells(engine.world.wordCells, qs, {
                cx: engine.player ? engine.player.x : 0,
                cz: engine.player ? engine.player.z : 0,
                cap: 6
            });
            if (qs.length && !session.sideBoundToast) {
                session.sideBoundToast = true;
                toast('远处金块变成石碑了 · 看向挖开认字');
            }
        });
    }

    function grantHouseAwards() {
        if (!W.dueHouseAwards) return;
        let guard = 0;
        while (guard < 4) {
            guard += 1;
            const pack = W.dueHouseAwards(progress.rightCount, progress.houseAwarded || 0);
            if (!pack) return;
            progress.houseAwarded = pack.need;
            session.coins = (Number(session.coins) || 0) + (Number(pack.coins) || 0);
            Object.keys(pack.loot || {}).forEach(function (id) {
                session.bag = C.addLoot(session.bag, id, pack.loot[id]);
            });
            toast('单词小屋奖励 · ' + (pack.label || '材料'));
            if (sfx && sfx.reward) sfx.reward();
        }
        persist();
        paintBagCounts();
    }

    function grantThemeAwards() {
        if (!W.dueThemeAwards) return;
        const due = W.dueThemeAwards(pool, session.familiarIds, session.themeAwarded);
        if (!due.length) return;
        if (!session.themeAwarded) session.themeAwarded = {};
        due.forEach(function (pack) {
            session.themeAwarded[pack.theme] = Math.max(Number(session.themeAwarded[pack.theme]) || 0, pack.need);
            session.coins = (Number(session.coins) || 0) + (Number(pack.coins) || 0);
            Object.keys(pack.loot || {}).forEach(function (id) {
                session.bag = C.addLoot(session.bag, id, pack.loot[id]);
            });
            toast(pack.theme + ' ×' + pack.need + ' · +' + pack.coins + ' 金币和合成材料');
            if (sfx && sfx.reward) sfx.reward();
        });
        syncHud();
        paintBagCounts();
    }

    function refreshPool() {
        const cfg = L.levelOf(session.level);
        const src = (bank && bank.length) ? bank : (W.FALLBACK_BANK || []);
        const chapter = W.poolForLevel(src, session.level, { themes: (cfg && cfg.wordThemes) || [] });
        const focusN = Math.max(chapter.length, Number(cfg && cfg.targetWords) || 0);
        pool = (focusN && W.focusPool)
            ? W.focusPool(src, session.level, {
                size: focusN,
                coverChapter: true,
                themes: (cfg && cfg.wordThemes) || [],
                prefer: (cfg && cfg.focusWords) || [],
                reviewRatio: (cfg && cfg.reviewRatio) || 0,
                review: progress.reviewWords || [],
                missed: sessionMissed(),
                mastery: readMastery(),
                today: todayStr()
            })
            : chapter;
        if (WM && WM.buildWaveWords) {
            const mem = memNow();
            const cap = session.secretRun ? 1
                : (session.reviewRun ? 1
                    : (D && session.tier ? D.tierOf(session.tier).reviewCap : 0.6));
            const keys = WM.buildWaveWords({
                size: Math.max(8, (pool || []).length),
                mem: mem,
                now: nowIso(),
                levelWords: ((cfg && cfg.focusWords) || []).concat((cfg && cfg.climateWords) || []),
                otherDue: WM.dueWords(mem, nowIso()),
                reviewWords: progress.reviewWords || [],
                focusWords: (cfg && cfg.focusWords) || [],
                reviewCap: cap
            });
            if (keys.length) {
                const byText = {};
                src.forEach(function (item) {
                    const key = String((item && item.text) || '').toLowerCase();
                    if (key && !byText[key]) byText[key] = item;
                });
                const picked = keys.map(function (key) { return byText[key]; }).filter(Boolean);
                if (picked.length) {
                    const rest = (pool || []).filter(function (w) {
                        return w && keys.indexOf(String(w.text || '').toLowerCase()) < 0;
                    });
                    pool = cap >= 1 ? picked : picked.concat(rest);
                }
            }
        }
        if (session.reviewRun && RS && RS.buildReviewPool) {
            const keys = RS.buildReviewPool({
                hardWords: progress.hardWords || [],
                reviewWords: progress.reviewWords || [],
                dueWords: reviewDueWords()
            });
            if (keys.length) {
                const byText = {};
                src.forEach(function (item) {
                    const key = String((item && item.text) || '').toLowerCase();
                    if (key && !byText[key]) byText[key] = item;
                });
                const picked = keys.map(function (key) { return byText[key]; }).filter(Boolean);
                if (picked.length) pool = picked;
            }
        }
        if (!pool.length) pool = src.slice();
    }

    function reviewDueWords() {
        const fromMem = WM ? WM.dueWords(memNow(), nowIso()) : [];
        const mastery = readMastery();
        const cfg = L.levelOf(session.level);
        const focus = ((cfg && cfg.focusWords) || []).concat((cfg && cfg.climateWords) || []);
        const vocab = window.PersonalWorkbenchPreschoolEnglishVocab;
        const today = todayStr();
        const fromMastery = focus.map(function (word) {
            return String(word || '').toLowerCase();
        }).filter(function (word) {
            const item = mastery[word];
            if (!item) return false;
            if (vocab && typeof vocab.isDue === 'function') return vocab.isDue(item, today);
            return !!(item.nextReview && String(item.nextReview).slice(0, 10) <= today);
        });
        const seen = {};
        const out = [];
        fromMem.concat(fromMastery).forEach(function (w) {
            const k = String(w || '').toLowerCase();
            if (!k || seen[k]) return;
            seen[k] = true;
            out.push(k);
        });
        return out;
    }

    function nowIso() {
        return session.debugNow || new Date().toISOString();
    }

    function paintDoors() {
        const box = document.getElementById('doors-list');
        if (!box) return;
        if (!RS || typeof RS.listReviewDoors !== 'function') {
            box.innerHTML = '<p class="bl-door-empty">复习之门还没准备好</p>';
            return;
        }
        const doors = RS.listReviewDoors(progress, nowIso());
        if (!doors.length) {
            box.innerHTML = '<p class="bl-door-empty">先通关一关，就会出现复习之门</p>';
            return;
        }
        const apoOn = D ? D.apocalypseUnlocked({
            clearedTiers: progress.clearedTiers,
            levels: L.LEVELS
        }) : false;
        const apoCount = apoOn ? 3 : Object.keys(progress.clearedTiers || {}).filter(function (id) {
            return (progress.clearedTiers[id] || []).indexOf('adventure') >= 0;
        }).length;
        box.innerHTML = doors.map(function (door) {
            const lv = L.levelOf(door.levelId);
            const stars = WM ? WM.levelStars(memNow(), (lv && lv.focusWords) || []) : 0;
            const rec = D ? D.recommendTier({
                avgBox: WM ? WM.avgBox(memNow(), (lv && lv.focusWords) || []) : 0,
                unlocked: apoOn
            }) : 'default';
            const cleared = (progress.clearedTiers || {})[String(door.levelId)] || [];
            const defaultDone = (progress.clearedLevels || []).indexOf(Number(door.levelId)) >= 0
                || cleared.indexOf('default') >= 0;
            const tiers = ['default', 'adventure', 'apocalypse'].map(function (id) {
                const t = D ? D.tierOf(id) : { label: id };
                const locked = id === 'adventure' ? !defaultDone
                    : id === 'apocalypse' ? !apoOn : false;
                const recCls = rec === id ? ' is-rec' : '';
                return '<button type="button" class="bl-tier' + recCls + (locked ? ' is-locked' : '') + '" data-tier="' + id + '" data-level="' + door.levelId + '"' + (locked ? ' disabled' : '') + '>' + (t.label || id) + (rec === id ? ' ★' : '') + '</button>';
            }).join('');
            return '<div class="bl-door-wrap"><button type="button" class="bl-door is-' + door.status + (door.canEnter ? ' is-open' : '') + '" data-door="' + door.levelId + '"' + (door.canEnter ? '' : ' disabled') + '><strong>第' + door.levelId + '关 · ' + '★'.repeat(stars) + '</strong><span>' + door.label + '</span>' + (door.status === 'overdue' ? '<i>待复习</i>' : '') + '</button><div class="bl-tiers">' + tiers + '</div></div>';
        }).join('');
        box.innerHTML += doors.map(function (door) {
            const lv = L.levelOf(door.levelId);
            const line = D ? D.scrollLine({
                levelId: door.levelId,
                climateWords: (lv && lv.climateWords) || [],
                words: memNow().words,
                scrolls: progress.scrolls || []
            }) : { kind: 'gray', text: '' };
            if (!line.text) return '';
            const can = line.kind === 'ready';
            return '<button type="button" class="bl-scroll is-' + line.kind + '"' + (can ? ' data-scroll="' + door.levelId + '"' : ' disabled') + '><strong>第' + door.levelId + '关卷轴</strong><span>' + line.text + '</span></button>';
        }).join('');
        if (D && D.secretUnlocked(progress.scrolls || [])) {
            box.innerHTML += '<button type="button" class="bl-door is-ready is-open" data-secret="1"><strong>词灵回廊</strong><span>隐藏关 · 纯复习</span></button>';
        }
        const hint = document.getElementById('tier-hint');
        if (hint) hint.textContent = apoOn ? '天启已解锁' : ('冒险档通过 3 个不同 Boss 关（已 ' + apoCount + '/3）');
    }

    function paintToday() {
        const box = document.getElementById('today-list');
        if (!box) return;
        if (!RS || typeof RS.selectTodayAdventure !== 'function') {
            box.innerHTML = '<p class="bl-door-empty">今日冒险还没准备好</p>';
            return;
        }
        const picked = RS.selectTodayAdventure(progress, nowIso(), progress.unlockedLevel);
        const items = (picked && picked.items) || [];
        if (!items.length) {
            box.innerHTML = '<p class="bl-door-empty">今天先去推进新关</p>';
            return;
        }
        box.innerHTML = items.map(function (item) {
            return '<button type="button" class="bl-today-card is-' + item.kind + '" data-today="' + item.kind + '" data-level="' + item.levelId + '"><strong>' + item.label + '</strong><small>' + (item.kind === 'advance' ? ('第' + item.levelId + '关') : ('第' + item.levelId + '关 · ' + item.status)) + '</small></button>';
        }).join('');
        if (D && D.secretUnlocked(progress.scrolls || [])) {
            box.innerHTML += '<button type="button" class="bl-today-card is-secret" data-today="secret" data-level="99"><strong>词灵回廊</strong><small>隐藏关</small></button>';
        }
        box.innerHTML += '<button type="button" class="bl-today-card is-trade" data-today="trade" data-level="0"><strong>商人摊</strong><small>雷奥 · 买卖装备</small></button>';
        box.innerHTML += '<button type="button" class="bl-today-card is-dummy" data-today="dummy" data-level="0"><strong>训练假人</strong><small>难词本优先 · +1 金币</small></button>';
        if (Number(progress.campChest) > 0) {
            box.innerHTML += '<button type="button" class="bl-today-card is-chest" data-today="chest" data-level="0"><strong>营地奖励箱</strong><small>+' + progress.campChest + ' 金币</small></button>';
        }
        paintCampMap();
    }

    function paintCampMap() {
        const pad = document.getElementById('camp-pad');
        const map = document.getElementById('camp-map');
        if (!pad || !map || !L.campMapOf) return;
        const dueIds = reviewDueIds();
        const view = L.campMapOf({
            unlockedLevel: progress.unlockedLevel || 1,
            clearedLevels: progress.clearedLevels || [],
            dueLevelIds: dueIds,
            campChest: progress.campChest,
            secret: !!(D && D.secretUnlocked(progress.scrolls || []))
        });
        pad.style.left = view.camp.x + '%';
        pad.style.top = view.camp.y + '%';
        pad.innerHTML = '<span class="bl-camp-home">营地大门</span>';
        const pins = (view.camp.buildings || []).map(function (b) {
            if (b.id === 'chest' && !(view.camp.chest > 0)) return '';
            const extra = b.id === 'chest' ? (' +' + view.camp.chest) : '';
            return '<button type="button" class="bl-camp-pin is-' + b.id + '" data-today="' + b.id + '" data-level="0" style="left:' + b.x + '%;top:' + b.y + '%;">' + b.label + extra + '</button>';
        });
        view.nodes.forEach(function (n) {
            const locked = n.state === 'locked';
            const mark = n.state === 'due' ? '待复习' : n.state === 'cleared' ? '可重玩' : n.state === 'open' ? '去探险' : '未解锁';
            pins.push('<button type="button" class="bl-map-node is-' + n.climate + ' is-' + n.state + '" data-map-level="' + n.level + '" data-state="' + n.state + '"'
                + (locked ? ' disabled' : '') + ' style="left:' + n.x + '%;top:' + n.y + '%;">'
                + '<b>' + n.level + '</b><strong>' + n.title + '</strong><small>' + mark + '</small></button>');
        });
        if (view.camp.secret) {
            pins.push('<button type="button" class="bl-map-node is-secret is-open" data-today="secret" data-level="99" style="left:' + view.camp.secretX + '%;top:' + view.camp.secretY + '%;"><b>隐</b><strong>词灵回廊</strong><small>隐藏关</small></button>');
        }
        map.innerHTML = pins.join('');
        const road = document.getElementById('camp-path');
        if (road) {
            const byLv = {};
            view.nodes.forEach(function (n) { byLv[n.level] = n; });
            const spine = [1, 2, 5, 7, 10, 12];
            const pts = [[view.camp.x, view.camp.y]].concat(spine.map(function (lv) {
                const n = byLv[lv];
                return n ? [n.x, n.y] : null;
            }).filter(Boolean));
            road.setAttribute('points', pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' '));
        }
    }

    function maybeShowToday() {
        if (session.todayShown) return;
        session.todayShown = true;
        if (/[?&]map=1(?:&|$)/.test(window.location.search || '')) {
            paintToday();
            toggleLayer('today-layer', true);
        }
    }

    function takeTodayItem(kind, levelId) {
        toggleLayer('today-layer', false);
        if (kind === 'door') {
            enterReviewDoor(levelId);
            return;
        }
        if (kind === 'secret') {
            startLevel(1, { secret: true });
            return;
        }
        if (kind === 'trade') {
            openTrade();
            return;
        }
        if (kind === 'dummy') {
            askDummy();
            return;
        }
        if (kind === 'chest') {
            const n = Number(progress.campChest) || 0;
            if (n) {
                session.coins = (Number(session.coins) || 0) + n;
                progress.campChest = 0;
                persist();
                toast('打开奖励箱 · +' + n + ' 金币');
            }
            return;
        }
        startLevel(Number(levelId) || progress.unlockedLevel || 1);
    }

    function askDummy() {
        const key = D ? D.dummyWord({
            hardWords: progress.hardWords || [],
            dueWords: WM ? WM.dueWords(memNow(), nowIso()) : []
        }) : '';
        const word = (pool || bank || []).filter(function (w) {
            return w && String(w.text || '').toLowerCase() === key;
        })[0] || (pool || bank || [])[0];
        if (!word) {
            toast('假人还没词可练');
            return;
        }
        session.pending = { dummy: true };
        fillQuizCard(nextLearnQuiz(word, { mode: 'choice' }), '训练假人 · 答对 +1 金币');
    }

    function maybeOfferScroll() {
        if (!D) return;
        const cfg = L.levelOf(session.level);
        const line = D.scrollLine({
            levelId: session.level,
            climateWords: (cfg && cfg.climateWords) || [],
            words: memNow().words,
            scrolls: progress.scrolls || []
        });
        session.scrollHint = line.text || '';
        if (line.kind === 'gray') toast(line.text);
    }

    function tryPickupScroll(levelId) {
        if (!D) return false;
        const id = levelId || session.level;
        const cfg = L.levelOf(id);
        const line = D.scrollLine({
            levelId: id,
            climateWords: (cfg && cfg.climateWords) || [],
            words: memNow().words,
            scrolls: progress.scrolls || []
        });
        if (line.kind !== 'ready') {
            toast(line.text || '卷轴还不能捡');
            return false;
        }
        progress.scrolls = D.collectScroll(progress.scrolls, id);
        persist();
        toast(D.secretUnlocked(progress.scrolls)
            ? '卷轴齐了 · 词灵回廊开了'
            : ('捡到第' + id + '关卷轴 · 还差 ' + (3 - progress.scrolls.length) + ' 张'));
        paintDoors();
        paintToday();
        return true;
    }

    function enterReviewDoor(levelId) {
        const doors = RS && RS.listReviewDoors ? RS.listReviewDoors(progress, nowIso()) : [];
        const door = doors.filter(function (item) { return String(item.levelId) === String(levelId); })[0];
        if (!door || !door.canEnter) {
            toast('这扇门还没到时间');
            return;
        }
        toggleLayer('doors-layer', false);
        startLevel(Number(door.levelId), { review: true });
    }

    function isPlaytest() {
        try {
            return /(?:\?|&)playtest=1(?:&|$)/.test(String(window.location.search || ''));
        } catch (err) {
            return false;
        }
    }

    function spawnPlaytestRoster() {
        session.playtest = true;
        session.wavesLeft = 0;
        const p = engine.player;
        C.MONSTER_KINDS.forEach(function (kind, i) {
            const col = i % 8;
            const row = Math.floor(i / 8);
            const open = openMobSpot(p.x + 4 + col * 2.5, p.z + 3 + row * 3);
            const mob = spawnMonster(kind, open.x, open.z);
            mob.parked = true;
        });
        session.boss = L.createBoss(session.level);
        ['wither', 'dragon', 'storm', 'warden', 'ghast', 'ravager', 'blaze', 'night-phantom'].forEach(function (bossId, i) {
            const open = openMobSpot(p.x - 16, p.z + 18 + i * 4);
            const spawnKind = (L.bossSpawnKind && L.bossSpawnKind(bossId)) || 'husk';
            const mob = spawnMonster(spawnKind, open.x, open.z, { boss: true, bossId: bossId });
            mob.parked = true;
        });
        if (engine.placeProp) {
            const gx = Math.floor(p.x);
            const gz = Math.floor(p.z);
            const gy = engine.world.surfaceAt(gx + 1, gz - 2);
            engine.placeProp('chest', gx + 1, gy, gz - 2);
            engine.placeProp('furnace', gx + 2, engine.world.surfaceAt(gx + 2, gz - 2), gz - 2);
            engine.placeProp('torch', gx + 3, engine.world.surfaceAt(gx + 3, gz - 2), gz - 2);
        }
        toast('审查场：看每个生物的动作，走近才会追你。右键开箱/点熔炉。');
    }

    function clearEntities() {
        session.monsters.forEach(function (m) { if (m.mesh) engine.scene.remove(m.mesh); });
        session.bolts.forEach(function (b) { if (b.mesh) engine.scene.remove(b.mesh); });
        (session.bossShots || []).forEach(function (b) { if (b.mesh) engine.scene.remove(b.mesh); });
        session.bossShots = [];
        session.bossSkillAt = 0;
        session.bossDashUntil = 0;
        session.bossCryUntil = 0;
        session.bossSummoned = false;
        session.bossHits = 0;
        session.pickups.forEach(function (p) { if (p.mesh) engine.scene.remove(p.mesh); });
        session.fx.forEach(function (e) { engine.scene.remove(e.obj); });
        session.monsters = [];
        session.bolts = [];
        session.pickups = [];
        session.fx = [];
        clearSettleFlag();
        dropGuideBeacon();
        const hud = document.getElementById('boss-hud');
        if (hud) hud.classList.add('is-hidden');
        paintCastHud();
    }

    function spawnMonster(kind, x, z, extra) {
        const spec = C.monsterOf(kind);
        const isBoss = !!(extra && extra.boss);
        const bossId = (extra && extra.bossId) || 'wither';
        const behavior = C.behaviorOf ? C.behaviorOf(spec.kind) : 'chase';
        const modelKind = isBoss
            ? ((L.bossModelOf && L.bossModelOf(bossId)) || 'boss')
            : spec.kind;
        const model = MOBS.create(modelKind, {
            boss: isBoss,
            bossId: bossId
        });
        const mesh = model.group;
        const ground = engine.world.surfaceAt(Math.floor(x), Math.floor(z));
        const y = C.stanceAltitude
            ? C.stanceAltitude(spec.kind, ground, 0, { isBoss: isBoss, bossId: bossId })
            : ground;
        mesh.position.set(x, y, z);
        engine.scene.add(mesh);
        const scaledHp = (!isBoss && D) ? D.applyHpScale(spec.hp, session.tier) : spec.hp;
        const scaledCoins = (!isBoss && D) ? D.tierCoins(spec.coins, session.tier) : spec.coins;
        const mob = {
            id: 'm' + nowMs() + '-' + session.monsters.length,
            kind: spec.kind,
            hp: scaledHp,
            maxHp: scaledHp,
            coins: scaledCoins,
            contact: spec.contact,
            behavior: behavior,
            speed: spec.speed * (C.behaviorSpeedScale ? C.behaviorSpeedScale(behavior) : 1),
            loot: spec.loot,
            x: x, z: z, y: y,
            mesh: mesh,
            model: model,
            asked: false,
            isBoss: isBoss,
            bossId: isBoss ? ((extra && extra.bossId) || 'wither') : '',
            height: model.height || 1.6,
            hitRadius: isBoss ? 1.2 : (spec.hitRadius || 0.45),
            bossHits: 0,
            reviewFirst: !!(extra && extra.reviewFirst),
            gen: extra && extra.gen ? extra.gen : 0
        };
        if (extra && extra.hp) {
            mob.hp = extra.hp;
            mob.maxHp = extra.hp;
        }
        if (extra && extra.scale && mesh) mesh.scale.setScalar(extra.scale);
        if (extra && extra.coins != null) mob.coins = extra.coins;
        if (mob.isBoss) {
            if (session.boss) {
                mob.hp = session.boss.hp;
                mob.maxHp = session.boss.maxHp;
            }
            mob.coins = 20;
            if (model.setHp) model.setHp(1, true);
        }
        session.monsters.push(mob);
        bindMobWord(mob);
        paintCastHud();
        return mob;
    }

    function openMobSpot(px, pz) {
        const w = engine.world;
        const mid = Math.floor(w.size / 2);
        for (let r = 0; r < 8; r += 1) {
            for (let a = 0; a < 8; a += 1) {
                const x = px + Math.cos(a * Math.PI / 4) * r;
                const z = pz + Math.sin(a * Math.PI / 4) * r;
                const ix = Math.floor(x), iz = Math.floor(z);
                if (ix < 2 || iz < 2 || ix >= w.size - 2 || iz >= w.size - 2) continue;
                if (Math.abs(ix - mid) < 2 && Math.abs(iz - mid) < 2) continue;
                if (w.ponds && w.ponds[ix + ',' + iz]) continue;
                if (w.treeAt && w.treeAt(ix, iz)) continue;
                if (ENG.inHouse && ENG.inHouse(w, ix, iz)) continue;
                const y = w.surfaceAt(ix, iz);
                if (engine.columnBlocked && engine.columnBlocked(ix + 0.5, iz + 0.5, y)) continue;
                return { x: ix + 0.5, z: iz + 0.5 };
            }
        }
        return { x: px, z: pz };
    }

    function spawnWave() {
        session.wave += 1;
        session.wavesLeft = Math.max(0, session.wavesLeft - 1);
        const p = engine.player;
        const cfg = L.levelOf(session.level);
        const kinds = (session.wave === 1)
            ? ((L.firstWaveKinds && L.firstWaveKinds(session.level)) || ['slime', 'slime'])
            : ((cfg && cfg.waveKinds) || ['slime', 'cube', 'slime']);
        const count = session.wave === 1
            ? Math.max((L.FIRST_WAVE_COUNT || 6), kinds.length)
            : Math.min(8, Math.max((kinds.length || 3) + 2, 8));
        const offs = C.waveOffsets ? C.waveOffsets(engine.look.yaw, count) : [
            { dx: 0, dz: -4 }, { dx: -2.2, dz: -5.2 }, { dx: 2.2, dz: -5.2 }
        ];
        const liveUsed = session.monsters.map(function (m) {
            return m && m.word ? (m.word.id || m.word.text) : '';
        }).filter(Boolean);
        session.waveTheme = (W.pickWaveTheme && W.pickWaveTheme(pool, liveUsed.concat(sessionReviewKeys()), (cfg && cfg.wordThemes) || [])) || '';
        const reviewN = session.wave > 1 ? Math.min(3, sessionReviewKeys().length) : 0;
        offs.forEach(function (s, i) {
            const kind = kinds[Math.min(i, kinds.length - 1)] || 'slime';
            const open = openMobSpot(p.x + s.dx, p.z + s.dz);
            spawnMonster(kind, open.x, open.z, { reviewFirst: i < reviewN });
        });
        if (session.wave === 1) {
            toast((kinds[0] === 'slime' && kinds[1] === 'slime')
                ? '史莱姆在正前方，对准它再砍'
                : '前方有怪物，对准它再砍');
        } else if (session.waveTheme) toast('这一波 · ' + session.waveTheme + ' 词');
    }

    function spawnBoss() {
        if (session.secretRun) {
            finishLevel();
            return;
        }
        session.boss = L.createBoss(session.level);
        if (session.reviewRun && RS && RS.reviewRunConfig) {
            const run = RS.reviewRunConfig(L.levelOf(session.level));
            session.boss.hp = run.bossHp;
            session.boss.maxHp = run.bossHp;
            session.boss.shield = run.bossShield;
            session.boss.shieldMax = run.bossShield;
        }
        const p = engine.player;
        const open = openMobSpot(p.x + 16, p.z + 4);
        const cfg = L.levelOf(session.level);
        const bossId = (cfg && cfg.bossId) || 'wither';
        const spawnKind = (L.bossSpawnKind && L.bossSpawnKind(bossId)) || 'husk';
        session.bossMob = spawnMonster(spawnKind, open.x, open.z, {
            boss: true,
            bossId: bossId,
            reviewFirst: true
        });
        const hud = document.getElementById('boss-hud');
        if (hud) hud.classList.remove('is-hidden');
        const bossName = L.bossTitle ? L.bossTitle(bossId) : '凋灵';
        session.bossSkillAt = 0;
        session.bossDashUntil = 0;
        session.bossCryUntil = 0;
        session.bossSummoned = false;
        session.bossHits = 0;
        applyBossForm(session.bossMob, 1);
        toast(bossName + '来了！蓝罩要用说或拼才能破，乱砍打不穿。');
        syncBossHud();
    }

    function bindFarmAnimals() {
        if (!engine || !engine.world) return;
        (engine.world.animals || []).forEach(function (a) {
            const row = (C.worldAnimalOf && C.worldAnimalOf(a.kind)) || (C.animalOf && C.animalOf(a.kind));
            if (row) {
                a.hp = row.hp;
                a.maxHp = row.hp;
                a.coins = row.coins;
                a.loot = row.loot[0];
                a.peaceful = true;
                a.contact = 0;
                a.hitRadius = (C.animalBodyRadius && C.animalBodyRadius(a.kind)) || 1.1;
                a.height = a.kind === 'chicken' ? 0.7 : 1.35;
            }
            a.y = ENG.lifeAltitude ? ENG.lifeAltitude(a, engine.world)
                : engine.world.surfaceAt(Math.floor(a.x), Math.floor(a.z));
            bindMobWord(a);
        });
    }

    function spawnMerchant() {
        const mid = Math.floor(engine.world.size / 2);
        const x = mid + 4.5, z = mid - 6.5;
        const y = engine.world.surfaceAt(Math.floor(x), Math.floor(z));
        const model = MOBS.create('merchant');
        const g = model.group;
        g.position.set(x, y, z);
        g.rotation.y = Math.atan2((mid + 0.5) - x, (mid + 0.5) - z);
        engine.scene.add(g);
        session.merchant = { x: x, z: z, mesh: g, model: model };
    }

    function farmTargets() {
        return ((engine.world && engine.world.animals) || []).filter(function (a) {
            return !!(a && a.hp > 0 && C.isFarmAnimal && C.isFarmAnimal(a.kind));
        });
    }

    function overlappingFarm() {
        const p = engine && engine.player;
        if (!p) return null;
        let best = null;
        let bestSlack = 0;
        farmTargets().forEach(function (a) {
            const rad = (C.animalBodyRadius && C.animalBodyRadius(a.kind)) || a.hitRadius || 0.9;
            const d = Math.hypot(a.x - p.x, a.z - p.z);
            const slack = rad + 0.25 - d;
            if (slack > bestSlack) {
                best = a;
                bestSlack = slack;
            }
        });
        return best;
    }

    function separateFromAnimals() {
        const p = engine && engine.player;
        if (!p) return;
        farmTargets().forEach(function (a) {
            const min = ((C.animalBodyRadius && C.animalBodyRadius(a.kind)) || a.hitRadius || 0.9) + 0.35;
            const dx = p.x - a.x;
            const dz = p.z - a.z;
            const dist = Math.hypot(dx, dz);
            if (dist >= min) return;
            const nx = dist < 0.001 ? 1 : dx / dist;
            const nz = dist < 0.001 ? 0 : dz / dist;
            const push = min - dist;
            p.x += nx * push;
            p.z += nz * push;
        });
    }

    function regenOutOfCombat(dt) {
        const p = engine && engine.player;
        if (!p || p.hp >= p.hpMax) return;
        const since = session.lastHitAt ? (nowMs() - session.lastHitAt) : 99999;
        if (since < 6000) return;
        p.hp = Math.min(p.hpMax, p.hp + 0.35 * dt);
        paintHearts();
    }

    function meleeHits() {
        const overlap = overlappingFarm();
        if (overlap) return [overlap];
        const living = session.monsters.concat(farmTargets());
        const arc = living.filter(function (m) {
            return m.hp > 0 && C.inMeleeArc(engine.player, engine.look.yaw, m);
        });
        if (arc.length) return arc;
        const look = nearestLookMob();
        if (look && Math.hypot(look.x - engine.player.x, look.z - engine.player.z) <= C.MELEE_RANGE + (look.hitRadius || 0)) {
            return [look];
        }
        return [];
    }

    function meleeTarget() {
        return meleeHits()[0] || null;
    }

    function tryMelee() {
        if (!C.canAttack({ kind: 'melee', lastAt: session.lastMeleeAt, now: nowMs() })) return;
        session.lastMeleeAt = nowMs();
        if (viewModel) viewModel.triggerSwing();
        const hits = meleeHits();
        hits.forEach(function (m) { requestHit(m, 'melee'); });
        if (sfx && sfx.swing) sfx.swing();
    }

    function selectTool(index) {
        const id = T.SLOT_IDS[index];
        if (!id) return;
        session.tool = id;
        if (session.mine) session.mine.acc = 0;
        session.hotIndex = index;
        setHotbar(index + 1);
        if (viewModel && viewModel.setTool) viewModel.setTool(id);
        showUseTip();
    }

    function selectPlace(loot) {
        session.tool = 'place';
        if (loot) session.placeLoot = loot;
        setHotbar((session.hotIndex || 0) + 1);
        if (viewModel && viewModel.setTool) viewModel.setTool('place');
        if (viewModel && viewModel.setPlaceKind) viewModel.setPlaceKind(loot || session.placeLoot || 'dirt');
        showUseTip();
    }

    function selectSlot(n) {
        const slot = Math.max(1, Math.min(9, Number(n) || 1));
        session.hotIndex = slot - 1;
        const id = (session.hotbar && session.hotbar[slot - 1]) || null;
        setHotbar(slot);
        if (!id) {
            session.tool = 'fist';
            showUseTip();
            return;
        }
        if (T.isHotTool(id)) {
            const role = T.toolRole ? T.toolRole(id) : id;
            session.tool = role;
            if (session.mine) session.mine.acc = 0;
            if (viewModel && viewModel.setTool) viewModel.setTool(role === 'fist' ? 'sword' : role);
            showUseTip();
            return;
        }
        selectPlace(id);
        session.hotIndex = slot - 1;
        setHotbar(slot);
    }

    function paintHearts() {
        const box = document.getElementById('hearts');
        if (!box || !engine) return;
        const max = Number(engine.player.hpMax) || 10;
        const hp = Math.max(0, Number(engine.player.hp) || 0);
        const per = max / 10;
        let html = '';
        for (let i = 0; i < 10; i += 1) {
            const v = hp - i * per;
            const cls = v >= per - 0.01 ? 'is-full' : v >= per * 0.45 ? 'is-half' : 'is-empty';
            html += '<i class="bl-heart ' + cls + '"></i>';
        }
        const stamp = String(Math.round(hp * 10) / 10) + '/' + max;
        if (box.dataset.hp === stamp) return;
        box.dataset.hp = stamp;
        box.innerHTML = html;
    }

    function paintFood() {
        const box = document.getElementById('food-pips');
        if (!box) return;
        const combo = Math.max(0, Math.min(10, Number(session.combo) || 0));
        const stamp = String(combo);
        if (box.dataset.combo === stamp) return;
        box.dataset.combo = stamp;
        let html = '';
        for (let i = 0; i < 10; i += 1) {
            html += '<i class="bl-pip' + (i < combo ? ' is-full' : '') + '"></i>';
        }
        box.innerHTML = html;
    }

    function paintHotbar() {
        const bar = session.hotbar || (T.emptyHotbar && T.emptyHotbar()) || [];
        document.querySelectorAll('.bl-hotbar .bl-slot').forEach(function (el) {
            const n = Number(el.getAttribute('data-key')) || 0;
            const id = bar[n - 1] || '';
            if (id) {
                el.setAttribute('data-item', id);
                if (T.isHotTool(id)) {
                    el.setAttribute('data-tool', id);
                    el.removeAttribute('data-place');
                } else {
                    el.setAttribute('data-place', id);
                    el.removeAttribute('data-tool');
                }
            } else {
                el.removeAttribute('data-item');
                el.removeAttribute('data-tool');
                el.removeAttribute('data-place');
            }
            const nBag = id && !T.isHotTool(id) ? (Number(session.bag[id]) || 0) : 0;
            el.innerHTML = (id ? slotInner(id, nBag > 1 ? nBag : 0) : '') + '<em>' + n + '</em>' +
                (nBag > 0 ? '<b class="bl-count">' + nBag + '</b>' : '');
            el.classList.toggle('is-on', session.hotIndex === n - 1);
        });
    }

    function paintBagCounts() {
        paintHotbar();
    }

    function nextPlaceLoot() {
        const order = [session.placeLoot, 'dirt', 'cobble', 'sand', 'glass', 'tnt', 'oak-log', 'plank', 'table', 'chest', 'furnace', 'torch'];
        for (let i = 0; i < order.length; i += 1) {
            const loot = order[i];
            if (loot && (Number(session.bag[loot]) || 0) > 0) return loot;
        }
        return null;
    }

    function tryPlace() {
        const loot = nextPlaceLoot();
        if (!loot) {
            toast('背包里没有可放的方块。先挖土或砍树。');
            return;
        }
        const hit = lookHit();
        if (!hit.hit || !hit.prev) {
            toast('对着方块的邻面才能放。');
            return;
        }
        const kind = T.placeKindOf(loot);
        if (kind === 'chest' || kind === 'furnace' || kind === 'torch') {
            if (!engine.placeProp) {
                toast('这里放不下。');
                return;
            }
            const res = engine.placeProp(kind, hit.prev.x, hit.prev.y, hit.prev.z);
            if (!res || !res.ok) {
                toast('这里放不下。');
                return;
            }
            session.bag = C.addLoot(session.bag, loot, -1);
            if ((Number(session.bag[loot]) || 0) < 0) session.bag[loot] = 0;
            session.placeLoot = loot;
            persist();
            if (viewModel) viewModel.triggerSwing();
            if (sfx && sfx.place) sfx.place();
            spawnPlaceChips(hit.prev.x, hit.prev.y, hit.prev.z, kind);
            noteWorldAct();
            return;
        }
        const res = ENG.placeVoxel(engine.world, hit.prev.x, hit.prev.y, hit.prev.z, kind);
        if (!res || !res.ok) {
            toast('这里放不下。');
            return;
        }
        session.bag = C.addLoot(session.bag, loot, -1);
        if ((Number(session.bag[loot]) || 0) < 0) session.bag[loot] = 0;
        session.placeLoot = loot;
        if (engine.remeshAt) engine.remeshAt(res.x, res.z);
        persist();
        if (viewModel) viewModel.triggerSwing();
        if (sfx && sfx.place) sfx.place();
        spawnPlaceChips(res.x, res.y, res.z, kind);
        noteWorldAct();
    }

    function eyeOrigin() {
        return {
            x: engine.player.x,
            y: engine.player.y + ENG.EYE_HEIGHT,
            z: engine.player.z
        };
    }

    function lookHit() {
        const dir = T.lookDir(engine.look.yaw, engine.look.pitch);
        return T.voxelRay(eyeOrigin(), dir, 5.5, function (x, y, z) {
            return ENG.voxelAt(engine.world, x, y, z);
        });
    }

    function stopMining() {
        session.mining = false;
        session.mine = null;
        paintBreakBar(0, false);
        hideTarget();
        hideCrack();
    }

    function paintBreakBar(pct, on) {
        const bar = document.getElementById('break-bar');
        const fill = document.getElementById('break-fill');
        if (bar) bar.classList.toggle('is-hidden', !on);
        if (fill) fill.style.width = Math.max(0, Math.min(100, Math.round(pct))) + '%';
    }

    function ensureTarget() {
        if (session.targetBox) return session.targetBox;
        const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02));
        const box = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x111111 }));
        box.visible = false;
        engine.scene.add(box);
        session.targetBox = box;
        return box;
    }

    function hideTarget() {
        if (session.targetBox) session.targetBox.visible = false;
    }

    function applyTileUV(geo, index) {
        const corners = ENG.tileCornersUV(index);
        const uv = geo.getAttribute('uv');
        if (!uv) return;
        for (let face = 0; face < 6; face += 1) {
            const base = face * 4;
            uv.setXY(base + 0, corners[0][0], corners[0][1]);
            uv.setXY(base + 1, corners[3][0], corners[3][1]);
            uv.setXY(base + 2, corners[1][0], corners[1][1]);
            uv.setXY(base + 3, corners[2][0], corners[2][1]);
        }
        uv.needsUpdate = true;
    }

    function ensureCrack() {
        if (session.crackBox) return session.crackBox;
        const atlas = engine.atlas || (engine.chunkMeshes[0] && engine.chunkMeshes[0].material && engine.chunkMeshes[0].material.map);
        const mat = new THREE.MeshBasicMaterial({
            map: atlas || null,
            transparent: true,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2,
            alphaTest: 0.15
        });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.002, 1.002, 1.002), mat);
        mesh.visible = false;
        mesh.renderOrder = 2;
        engine.scene.add(mesh);
        session.crackBox = mesh;
        session.crackStage = -1;
        return mesh;
    }

    function hideCrack() {
        if (session.crackBox) session.crackBox.visible = false;
        session.crackStage = -1;
    }

    function showCrack(x, y, z, frac) {
        const mesh = ensureCrack();
        mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
        mesh.visible = true;
        const stage = Math.max(0, Math.min(3, Math.floor(frac * 4)));
        if (stage !== session.crackStage) {
            session.crackStage = stage;
            applyTileUV(mesh.geometry, ENG.tileIndex('crack', stage));
        }
    }

    function showTarget(x, y, z) {
        const box = ensureTarget();
        box.position.set(x + 0.5, y + 0.5, z + 0.5);
        box.visible = true;
    }

    function igniteTnt(hit) {
        if (!hit) return;
        session.tntFuses = session.tntFuses || [];
        const key = hit.x + ',' + hit.y + ',' + hit.z;
        if (session.tntFuses.some(function (f) { return f.key === key; })) return;
        session.tntFuses.push({ key: key, x: hit.x, y: hit.y, z: hit.z, life: 1.15 });
        toast('TNT 点燃了');
        if (viewModel) viewModel.triggerSwing();
    }

    function explodeTnt(f) {
        const r = 2;
        for (let y = f.y - r; y <= f.y + r; y += 1) {
            for (let z = f.z - r; z <= f.z + r; z += 1) {
                for (let x = f.x - r; x <= f.x + r; x += 1) {
                    if (Math.hypot(x - f.x, y - f.y, z - f.z) > r + 0.15) continue;
                    const kind = ENG.voxelAt(engine.world, x, y, z);
                    if (!kind || y <= 0) continue;
                    if (kind === 'tnt' && !(x === f.x && y === f.y && z === f.z)) {
                        igniteTnt({ x: x, y: y, z: z });
                        continue;
                    }
                    ENG.breakVoxel(engine.world, x, y, z);
                    if (engine.remeshAt) engine.remeshAt(x, z);
                }
            }
        }
        if (MOBS.spawnBurst) {
            MOBS.spawnBurst(engine.scene, session.fx, f.x + 0.5, f.y + 0.5, f.z + 0.5, 0xff7040, 16);
        }
        const dist = Math.hypot(engine.player.x - (f.x + 0.5), engine.player.y - f.y, engine.player.z - (f.z + 0.5));
        if (dist < 3.2) {
            engine.player.hp = Math.max(0, (Number(engine.player.hp) || 0) - (dist < 1.6 ? 4 : 2));
            paintHearts();
            if (engine.player.hp <= 0) respawn();
        }
        (session.monsters || []).forEach(function (m) {
            if (!m || m.hp <= 0) return;
            if (Math.hypot(m.x - f.x, m.z - f.z) < 3) m.hp = Math.max(0, m.hp - 6);
        });
    }

    function tickTnt(dt) {
        if (!session.tntFuses || !session.tntFuses.length) return;
        const keep = [];
        session.tntFuses.forEach(function (f) {
            f.life -= dt;
            if (f.life > 0) keep.push(f);
            else explodeTnt(f);
        });
        session.tntFuses = keep;
    }

    function stepMining(dt) {
        if (!session.mining || session.paused) {
            paintBreakBar(0, false);
            if (!session.mining) {
                hideTarget();
                hideCrack();
            }
            return;
        }
        const hit = lookHit();
        const lookMob = nearestLookMob();
        const lookDist = lookMob
            ? Math.hypot(lookMob.x - engine.player.x, lookMob.z - engine.player.z)
            : Infinity;
        const action = C.aimAction({
            mining: true,
            inMelee: !!meleeTarget(),
            lookMob: !!lookMob,
            lookDist: lookDist,
            meleeRange: C.MELEE_RANGE,
            hasBlock: !!(hit && hit.hit && hit.y > 0)
        });
        if (action === 'melee') {
            tryMelee();
            paintBreakBar(0, false);
            hideTarget();
            hideCrack();
            return;
        }
        if (action !== 'mine' || !hit.hit || hit.y <= 0) {
            session.mine = null;
            paintBreakBar(0, false);
            hideTarget();
            hideCrack();
            return;
        }
        if ((session.tool === 'flint' || session.tool === 'flint_and_steel') && hit.kind === 'tnt') {
            igniteTnt(hit);
            session.mine = null;
            paintBreakBar(0, false);
            hideTarget();
            hideCrack();
            return;
        }
        showTarget(hit.x, hit.y, hit.z);
        if (!session.mine || session.mine.x !== hit.x || session.mine.y !== hit.y || session.mine.z !== hit.z) {
            session.mine = { x: hit.x, y: hit.y, z: hit.z, kind: hit.kind, acc: 0, swingAt: 0 };
            if (viewModel) viewModel.triggerSwing();
        }
        session.mine.acc += dt * 1000;
        session.mine.swingAt = (session.mine.swingAt || 0) + dt;
        if (session.mine.swingAt > 0.36) {
            session.mine.swingAt = 0;
            if (viewModel) viewModel.triggerSwing();
            spawnMineChips(hit, 2);
        }
        const bonus = CR && CR.toolBonus ? CR.toolBonus(session.bag, session.tool) : { mine: 1 };
        const need = Math.max(80, Math.round(T.breakMs(session.tool, hit.kind) / (bonus.mine || 1)));
        const frac = session.mine.acc / need;
        paintBreakBar(frac * 100, true);
        showCrack(hit.x, hit.y, hit.z, frac);
        if (session.mine.acc < need) return;
        finishBreak(hit);
        session.mine = null;
        paintBreakBar(0, false);
        hideCrack();
    }

    function finishBreak(hit) {
        const result = ENG.breakVoxel(engine.world, hit.x, hit.y, hit.z);
        if (!result || !result.ok) return;
        if (engine.remeshAt) engine.remeshAt(result.x != null ? result.x : hit.x, result.z != null ? result.z : hit.z);
        if (viewModel) viewModel.triggerSwing();
        if (hit.kind === 'word') {
            const key = hit.x + ',' + hit.y + ',' + hit.z;
            const cell = engine.world.wordCells && engine.world.wordCells[key];
            if (engine.world.wordCells) delete engine.world.wordCells[key];
            W.collectWordBlock({
                coins: session.coins,
                hp: engine.player.hp,
                hpMax: engine.player.hpMax,
                learnedIds: progress.learnedIds
            }, cell || {});
            MOBS.spawnBurst(engine.scene, session.fx, hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, 0xf0c84a, 8);
            if (!cell || !cell.text) {
                toast('单词方块碎了');
                return;
            }
            session.pending = { wordBlock: { cell: cell, key: key } };
            const cubeQuiz = nextLearnQuiz(cell);
            fillQuizCard(cubeQuiz, cell.side
                ? ('石碑 · ' + (cell.zh || '认一认'))
                : cubeQuiz.mode === 'spell'
                ? '单词方块 · 拼出来'
                : cubeQuiz.mode === 'enpick'
                    ? '单词方块 · 跟读或选英文'
                    : '单词方块 · 答对才算学会');
            return;
        }
        if (T.placeKindOf(result.drop)) session.placeLoot = result.drop;
        session.bag = C.addLoot(session.bag, result.drop, 1);
        persist();
        toast('获得 ' + result.drop);
        spawnMineChips(hit, 6);
        noteWorldAct();
    }

    function noteWorldAct() {
        session.worldActs = (Number(session.worldActs) || 0) + 1;
    }

    function spawnMineChips(hit, n) {
        const FX = globalThis.BlockLegendFx;
        const color = FX && FX.debrisColor ? FX.debrisColor(hit.kind) : 0xc8b48a;
        const sfxKind = FX && FX.mineSfxKind ? FX.mineSfxKind(hit.kind) : 'dirt';
        MOBS.spawnBurst(engine.scene, session.fx, hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, color, n);
        if (sfx && sfx.mine) sfx.mine(sfxKind);
    }

    function spawnPlaceChips(x, y, z, kind) {
        const FX = globalThis.BlockLegendFx;
        const spec = FX && FX.placeBurst ? FX.placeBurst(kind) : { n: 5, color: 0xc8b48a };
        if (MOBS.spawnBurst) {
            MOBS.spawnBurst(engine.scene, session.fx, x + 0.5, y + 0.5, z + 0.5, spec.color, spec.n);
        }
    }

    function nearestLookMob() {
        const origin = eyeOrigin();
        const dir = T.lookDir(engine.look.yaw, engine.look.pitch);
        let best = null, bestDot = 0.74, bestDist = 7;
        session.monsters.concat(farmTargets()).forEach(function (m) {
            if (m.hp <= 0) return;
            const aim = C.aimPoint(m);
            const dx = aim.x - origin.x;
            const dy = aim.y - origin.y;
            const dz = aim.z - origin.z;
            const dist = Math.hypot(dx, dy, dz) || 1;
            if (dist > 7) return;
            const dot = (dx * dir.x + dy * dir.y + dz * dir.z) / dist;
            if (dot > bestDot && dist < bestDist) {
                best = m;
                bestDot = dot;
                bestDist = dist;
            }
        });
        return best;
    }

    function lookAim(origin, dir, x, y, z, maxDist, minDot) {
        const dx = x - origin.x;
        const dy = y - origin.y;
        const dz = z - origin.z;
        const dist = Math.hypot(dx, dy, dz) || 1;
        if (dist > (maxDist || 7)) return null;
        const dot = (dx * dir.x + dy * dir.y + dz * dir.z) / dist;
        if (dot < (minDot == null ? 0.74 : minDot)) return null;
        return { dist: dist, dot: dot };
    }

    function nearestLookLife() {
        const origin = eyeOrigin();
        const dir = T.lookDir(engine.look.yaw, engine.look.pitch);
        let best = null, bestDot = 0.7, bestDist = 6;
        function consider(row, type, kind, y, maxDist, minDot) {
            const aim = lookAim(origin, dir, row.x, y, row.z, maxDist || 6, minDot == null ? 0.7 : minDot);
            if (!aim) return;
            if (aim.dot > bestDot && aim.dist < bestDist) {
                best = { type: type, kind: kind, row: row, word: row.word };
                bestDot = aim.dot;
                bestDist = aim.dist;
            }
        }
        (engine.world.animals || []).forEach(function (a) {
            const y0 = a.y != null ? a.y : engine.world.surfaceAt(Math.floor(a.x), Math.floor(a.z));
            const lift = a.kind === 'dragon' ? 1.25 : 0.4;
            consider(a, 'animal', a.kind, y0 + lift, a.kind === 'dragon' ? 8 : 6, a.kind === 'dragon' ? 0.52 : 0.7);
        });
        (engine.world.villagers || []).forEach(function (v) {
            const npcKind = v.role === 'trader' ? 'trader'
                : v.role === 'teacher' ? 'teacher'
                    : v.role === 'farmer' ? 'farmer'
                        : 'villager';
            consider(v, 'npc', npcKind, engine.world.surfaceAt(Math.floor(v.x), Math.floor(v.z)) + 1.1);
        });
        (engine.world.golems || []).forEach(function (g) {
            consider(g, 'animal', g.kind === 'snowgolem' ? 'snowgolem' : 'golem', engine.world.surfaceAt(Math.floor(g.x), Math.floor(g.z)) + 1.4);
        });
        (engine.world.placedProps || []).forEach(function (p) {
            const row = { x: p.x + 0.5, z: p.z + 0.5, y: p.y, prop: p };
            consider(row, 'prop', p.kind, p.y + 0.4);
        });
        (engine.world.beds || []).forEach(function (b) {
            const y0 = b.y != null ? b.y : engine.world.surfaceAt(Math.floor(b.x), Math.floor(b.z));
            consider({ x: b.x + 0.5, z: b.z + 0.5, y: y0 }, 'prop', 'bed', y0 + 0.28);
        });
        (engine.world.houses || []).forEach(function (h) {
            const doorX = h.x + Math.floor((h.w || 4) / 2) + 0.5;
            const doorZ = h.z + (h.d || 4) - 0.15;
            const y0 = h.y0 != null ? h.y0 : engine.world.surfaceAt(Math.floor(h.x), Math.floor(h.z));
            const houseKind = h.role === 'word' ? 'wordhouse'
                : h.role === 'trader' ? 'traderhouse'
                    : h.role === 'farm' ? 'farmhouse'
                        : 'house';
            consider({ x: doorX, z: doorZ, y: y0 }, 'prop', houseKind, y0 + 1.15);
        });
        (engine.world.wells || []).forEach(function (w) {
            const y0 = engine.world.surfaceAt(Math.floor(w.x), Math.floor(w.z));
            consider({ x: w.x + 0.5, z: w.z + 0.5, y: y0 }, 'prop', 'well', y0 + 1.05);
        });
        (engine.world.pens || []).forEach(function (p) {
            const y0 = engine.world.surfaceAt(Math.floor(p.x + p.w / 2), Math.floor(p.z + p.d / 2));
            consider({
                x: p.x + (p.w || 3) / 2,
                z: p.z + (p.d || 3) / 2,
                y: y0
            }, 'prop', 'pen', y0 + 0.7);
        });
        Object.keys(engine.world.paths || {}).forEach(function (key) {
            const parts = key.split(',');
            const px = Number(parts[0]), pz = Number(parts[1]);
            const y0 = engine.world.surfaceAt(px, pz);
            consider({ x: px + 0.5, z: pz + 0.5, y: y0 }, 'prop', 'path', y0 + 0.12, 3.2, 0.88);
        });
        (engine.world.trees || []).forEach(function (t) {
            const y0 = engine.world.surfaceAt(t.x, t.z);
            consider({ x: t.x + 0.5, z: t.z + 0.5, y: y0 }, 'prop', 'tree', y0 + 1.5, 4.2, 0.84);
        });
        (engine.world.flowers || []).forEach(function (f) {
            const y0 = f.y != null ? f.y : engine.world.surfaceAt(f.x, f.z);
            consider({ x: f.x + 0.5, z: f.z + 0.5, y: y0 }, 'prop', 'flower', y0 + 0.25, 5, 0.8);
        });
        (engine.world.plants || []).forEach(function (p) {
            if (p.kind === 'wheat') {
                const y0 = p.y != null ? p.y : engine.world.surfaceAt(p.x, p.z);
                consider({ x: p.x + 0.5, z: p.z + 0.5, y: y0 }, 'prop', 'wheat', y0 + 0.3, 5, 0.8);
            }
        });
        if (best && best.row && best.row.prop) best.prop = best.row.prop;
        return best;
    }

    function isVillageLook(sub) {
        if (!sub || sub.type === 'mob') return false;
        const kind = String(sub.kind || '');
        return /^(villager|farmer|teacher|trader|well|house|farmhouse|wordhouse|traderhouse|pen|wheat|pig|cow|sheep|golem)$/.test(kind);
    }

    function villageLookWord(sub) {
        const label = W.labelFor((sub && sub.kind) || 'villager', bank);
        const text = String((label && label.en) || (sub && sub.kind) || 'villager');
        return { text: text, zh: (label && label.zh) || '', id: text };
    }

    function applyVillageSpeak(lock, heard) {
        const word = lock && lock.word;
        const sub = (lock && lock.look) || lookSubject();
        noteWordSpoken(word);
        if (typeof noteFamiliarWord === 'function') noteFamiliarWord(word, 'speak');
        if (typeof recordWordMemory === 'function') recordWordMemory(word, true);
        if (typeof recordBridgeAnswer === 'function') recordBridgeAnswer(word, true);
        blessVillageWord(word);
        if (sub && sub.type === 'npc' && sub.kind !== 'trader' && sub.kind !== 'merchant') {
            greetVillager(sub);
        } else {
            toast((heard || (word && word.text) || '') + ' · ' + ((word && word.zh) || ''));
            if (sub && sub.kind) noteQuest({ type: 'look', kind: sub.kind });
        }
        hideVoiceFallback();
        setVoiceState('matched');
        if (sfx && sfx.reward) sfx.reward();
    }

    function blessVillageWord(word) {
        const text = String((word && word.text) || '').toLowerCase();
        if (text === 'wheat' && engine && engine.world && ENG && typeof ENG.growWheat === 'function') {
            ENG.growWheat(engine.world);
        }
    }

    function startTeacherLesson(sub) {
        const due = sideDueNow();
        const kinds = ['literacy', 'pinyin', 'phonics'].filter(function (kind) {
            return (Number(due[kind]) || 0) > 0 && !(session.sideSkip && session.sideSkip[kind]);
        });
        if (!kinds.length || sittingRoom() <= 0 || !P || !P.nextDue) {
            greetVillager(sub);
            noteQuest({ type: 'teacher' });
            return;
        }
        loadSideKinds(kinds, function () {
            const kind = kinds[0];
            const tracks = readSubjectTracks();
            const q = P.nextDue(due, {
                cards: allSideCards(),
                kind: kind,
                band: kind === 'literacy' && P.literacyBand
                    ? P.literacyBand(P.knownCount ? P.knownCount(tracks.literacy) : 0)
                    : undefined,
                avoidKeys: session.sideAvoid || [],
                dueKeys: sideReviewKeys(),
                salt: sittingDoneNow()
            });
            if (!q) {
                greetVillager(sub);
                noteQuest({ type: 'teacher' });
                return;
            }
            const label = kind === 'literacy' ? '识字' : kind === 'pinyin' ? '拼音' : '拼读';
            session.pending = { teacherSide: q, look: sub };
            fillQuizCard(P.quizFromSide(q), '老师 · ' + label);
        });
    }

    function greetVillager(sub) {
        const kind = (sub && sub.kind) || 'villager';
        const label = W.labelFor(kind, bank);
        const hello = kind === 'farmer' ? 'Hello, farmer'
            : kind === 'teacher' ? 'Hello, teacher'
                : 'Hello, villager';
        const row = sub && (sub.row || (session.lookRow));
        if (row && row.mesh) {
            row.mesh.userData.waveUntil = nowMs() + 900;
            row.mesh.rotation.z = 0.18;
        }
        toast(hello + ' · ' + (label.zh || ''));
        noteQuest({ type: 'look', kind: kind });
    }

    function interactFarm(mob) {
        if (!mob || !(C.isFarmAnimal && C.isFarmAnimal(mob.kind))) return false;
        if (mob.kind === 'chicken') {
            const t = nowMs() / 1000;
            if (!mob.handEggAt || t - mob.handEggAt >= 8) {
                mob.handEggAt = t;
                mob.eggAt = t;
                if (tryAutoEat('egg')) return true;
                session.bag = C.addLoot(session.bag, 'egg', 1);
                persist();
                paintHotbar();
                toast('捡到鸡蛋 · 掉血时走过去会自动吃');
                return true;
            }
            toast('这只鸡刚下过蛋，等一会儿再摸');
            return true;
        }
        toast('左键打它掉肉，走过去捡起来就能回血');
        return true;
    }

    function nearestRideable(maxDist) {
        const lim = maxDist == null ? 4.2 : maxDist;
        let best = null, bestD = lim;
        (engine.world.animals || []).forEach(function (a) {
            if (!a || !a.rideable) return;
            const d = Math.hypot(engine.player.x - a.x, engine.player.z - a.z);
            if (d < bestD) {
                best = a;
                bestD = d;
            }
        });
        return best;
    }

    function toggleMount(row) {
        const FX = globalThis.BlockLegendFx;
        if (engine.player.mounted) {
            if (engine.dismount) engine.dismount();
            else {
                engine.player.mounted = null;
                engine.player.y = engine.world.surfaceAt(Math.floor(engine.player.x), Math.floor(engine.player.z));
                engine.player.vy = 0;
            }
            if (engine.fovKick && FX && FX.rideFov) engine.fovKick(FX.rideFov('down'));
            toast('从龙背下来了 · 右键或 F 还能再骑');
            return true;
        }
        const dragon = row || nearestRideable(4.6);
        if (!dragon) return false;
        engine.player.mounted = dragon;
        engine.player.x = dragon.x;
        engine.player.z = dragon.z;
        engine.player.y = (dragon.y != null ? dragon.y : engine.world.surfaceAt(Math.floor(dragon.x), Math.floor(dragon.z))) + 1.32;
        engine.player.vy = 0;
        if (engine.fovKick && FX && FX.rideFov) engine.fovKick(FX.rideFov('up'));
        toast('骑上龙了 · 空格升高 · Shift 或低头下降 · F 下来');
        noteQuest({ type: 'look', kind: 'dragon' });
        return true;
    }

    function tryMountToggle() {
        if (session.paused || uiBlocksWorld()) return false;
        if (engine.player.mounted) return toggleMount();
        const sub = lookSubject();
        if (sub && sub.row && sub.row.rideable) return toggleMount(sub.row);
        const near = nearestRideable(3.8);
        return near ? toggleMount(near) : false;
    }

    function tryInteract() {
        if (engine.player.mounted) return toggleMount();
        const sub = lookSubject();
        if (!sub) return false;
        if (sub.type === 'portal') {
            enterHubPortal(sub.portal);
            return true;
        }
        if (sub.type === 'npc') {
            if (sub.kind === 'trader' || sub.kind === 'merchant') {
                openTrade();
                return true;
            }
            if (sub.kind === 'teacher') {
                startTeacherLesson(sub);
                return true;
            }
            greetVillager(sub);
            return true;
        }
        if (sub.type === 'prop' && sub.prop && sub.prop.mesh && sub.prop.mesh.userData.toggle) {
            sub.prop.mesh.userData.toggle();
            toast(sub.kind === 'chest' ? (sub.prop.mesh.userData.open ? '箱子打开了' : '箱子关上了')
                : sub.kind === 'furnace' ? (sub.prop.mesh.userData.lit ? '熔炉点着了' : '熔炉熄了')
                    : '互动了');
            return true;
        }
        if (sub.type === 'animal' && sub.row && sub.row.rideable) {
            return toggleMount(sub.row);
        }
        if (sub.type === 'animal' || (sub.type === 'mob' && sub.mob && C.isFarmAnimal && C.isFarmAnimal(sub.mob.kind))) {
            const farm = sub.mob || sub.row;
            if (interactFarm(farm)) return true;
            const label = sub.word
                ? { en: sub.word.text, zh: sub.word.zh || '' }
                : W.labelFor(sub.kind, bank);
            toast((label.en || sub.kind) + ' · ' + (label.zh || ''));
            return true;
        }
        if (sub.type === 'mob' && C.barterOf) {
            const deal = C.barterOf(sub.kind, { gold: heldGold(), salt: nowMs() });
            if (deal) {
                if (!spendHeldGold()) return false;
                spawnPickup(sub.mob.x, sub.mob.z, 0, deal.give);
                persist();
                toast('猪灵换出了 ' + deal.give);
                return true;
            }
        }
        return false;
    }

    function lookSubject() {
        if (session.hub) {
            const portal = nearestLevelPortal(3.2);
            if (portal) {
                const st = portal.state === 'locked' ? '还锁着' : portal.state === 'due' ? '该复习了' : '走进去';
                const line = portal.line ? (portal.line + ' · ' + st) : st;
                return {
                    type: 'portal',
                    kind: portal.climate,
                    portal: portal,
                    word: { text: '第' + portal.level + '关 · ' + (portal.title || ''), zh: line }
                };
            }
        }
        const mob = nearestLookMob();
        if (mob) {
            const bossKind = L.bossModelOf ? L.bossModelOf(mob.bossId) : 'boss';
            return { type: 'mob', kind: mob.isBoss ? bossKind : mob.kind, mob: mob, word: mob.word };
        }
        if (session.merchant && session.nearMerchant) return { type: 'npc', kind: 'merchant' };
        const life = nearestLookLife();
        if (life) return life;
        const hit = lookHit();
        if (hit && hit.hit) {
            if (hit.kind === 'word' && engine.world.wordCells) {
                const cell = engine.world.wordCells[hit.x + ',' + hit.y + ',' + hit.z];
                if (cell) return { type: 'block', kind: 'word', word: cell, hit: hit };
            }
            if (hit.kind === 'gate') {
                const gate = nearestWordGate(2.8);
                return { type: 'block', kind: 'gate', word: gate && gate.word, hit: hit };
            }
            return { type: 'block', kind: hit.kind, hit: hit };
        }
        return null;
    }

    function ensureRing() {
        if (session.targetRing) return session.targetRing;
        const geo = new THREE.RingGeometry(0.52, 0.7, 28);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xff3a2a, side: THREE.DoubleSide, transparent: true, opacity: 0.78
        });
        const ring = new THREE.Mesh(geo, mat);
        ring.rotation.x = -Math.PI / 2;
        ring.visible = false;
        engine.scene.add(ring);
        session.targetRing = ring;
        return ring;
    }

    function paintSayStrip() {
        const el = document.getElementById('say-strip');
        if (el) el.textContent = W.sayStrip(pool, 12);
        const mine = document.getElementById('my-english');
        if (mine) {
            const n = W.countFamiliar
                ? W.countFamiliar(progress.learnedIds, readMastery())
                : (progress.learnedIds || []).length;
            mine.textContent = 'My English: ' + n + ' words';
        }
    }

    function hideLookTip() {
        const tip = document.getElementById('look-tip');
        if (tip) tip.classList.add('is-hidden');
    }

    function showUseTip() {
        const tip = document.getElementById('look-tip');
        if (!tip) return;
        if (session.tool === 'place') {
            tip.textContent = '右键对准方块邻面放置 · 左键仍是徒手敲 · 格子上的数字是背包数量';
        } else {
            tip.textContent = '左键挖/打猪牛羊鸡掉肉 · 走过去捡肉回血 · 右键摸鸡捡蛋 · E 吃手上的食物';
        }
        tip.classList.remove('is-hidden');
    }

    function updateLookCard(now) {
        const card = document.getElementById('look-card');
        if (!card) return;
        if (session.paused) {
            card.classList.add('is-hidden');
            if (session.targetRing) session.targetRing.visible = false;
            return;
        }
        const sub = lookSubject();
        if (!sub || (W.shouldShowLookLabel && !W.shouldShowLookLabel(sub.kind, sub.type) && !sub.word)) {
            card.classList.add('is-hidden');
            session.lookKey = '';
            session.lookRow = null;
            if (session.targetRing) session.targetRing.visible = false;
            hideVoiceFallback();
            return;
        }
        const sideLook = sub.word && sub.word.side && P && P.lookLabel ? P.lookLabel(sub.word) : null;
        const label = sideLook
            ? {
                en: sideLook.en,
                zh: sideLook.zh,
                who: sideLook.who,
                word: { text: sideLook.speak, lang: sideLook.lang, side: sub.word.side }
            }
            : (sub.word
                ? { en: sub.word.text, zh: sub.word.zh || '', word: sub.word }
                : W.labelFor(sub.kind, bank));
        const key = sub.type + ':' + sub.kind + (sub.mob ? ':' + sub.mob.x.toFixed(1) : '');
        const revealZh = !W.shouldRevealLookZh || W.shouldRevealLookZh({
            type: sub.type,
            asked: !!(sub.mob && sub.mob.asked)
        });
        document.getElementById('look-en').textContent = label.en;
        document.getElementById('look-zh').textContent = revealZh ? (label.zh || '') : '？';
        const lookImg = document.getElementById('look-img');
        const pic = revealZh && label.word && label.word.media && label.word.media.image;
        if (lookImg) {
            if (pic) {
                lookImg.src = pic;
                lookImg.alt = label.en || '';
                lookImg.classList.remove('is-hidden');
            } else {
                lookImg.removeAttribute('src');
                lookImg.alt = '';
                lookImg.classList.add('is-hidden');
            }
        }
        const meta = document.getElementById('look-meta');
        const who = document.getElementById('look-who');
        const hpBar = document.getElementById('look-hp');
        const hpFillLook = document.getElementById('look-hp-fill');
        if (sub.mob) {
            const hp = Math.max(0, sub.mob.hp);
            const hpMax = Math.max(1, sub.mob.maxHp || sub.mob.hp);
            meta.textContent = Math.ceil(hp) + '/' + Math.ceil(hpMax);
            if (who) {
                who.textContent = sub.mob.isBoss
                    ? ('BOSS · ' + ((L.bossTitle && L.bossTitle(sub.mob.bossId)) || 'Boss'))
                    : ('The Monster: ' + label.en);
            }
            if (hpBar) hpBar.classList.remove('is-hidden');
            if (hpFillLook) hpFillLook.style.width = Math.round(hp / hpMax * 100) + '%';
            const ring = ensureRing();
            ring.position.set(sub.mob.x, sub.mob.y + 0.04, sub.mob.z);
            ring.visible = true;
            if (C.lookBlink && C.lookBlink(sub.mob.kind, true) && (!sub.mob.lookBlinkAt || now - sub.mob.lookBlinkAt >= 1600)) {
                sub.mob.lookBlinkAt = now;
                blinkMob(sub.mob);
            }
        } else {
            if (who) {
                who.textContent = sub.type === 'portal'
                    ? (sub.portal && sub.portal.state === 'locked' ? '传送门 · 还锁着'
                        : sub.portal && sub.portal.state === 'due' ? '传送门 · 复习'
                            : '传送门 · 走进去')
                    : (sub.row && sub.row.rideable
                        ? (engine.player.mounted ? '骑着 · 左键龙息 / Q·E 回旋 / R 急速 / F 下来' : '坐骑 · 右键或 F 骑上去')
                        : (sub.type === 'npc' ? 'Merchant Leo · 商人雷奥' : (label.who || '')));
            }
            if (hpBar) hpBar.classList.add('is-hidden');
            meta.textContent = '';
            if (sub.kind === 'word' && D) {
                const cfg = L.levelOf(session.level);
                const line = D.scrollLine({
                    levelId: session.level,
                    climateWords: (cfg && cfg.climateWords) || [],
                    words: memNow().words,
                    scrolls: progress.scrolls || []
                });
                meta.textContent = line.text || '';
                if (who && line.kind === 'gray') who.textContent = '灰卷轴';
                if (who && line.kind === 'ready') who.textContent = '发光卷轴';
            }
            if (session.targetRing) session.targetRing.visible = false;
        }
        card.classList.remove('is-hidden');
        session.lookRow = sub.row || sub.mob || null;
        hideLookTip();
        if (session.lookKey !== key) {
            session.lookKey = key;
            session.lookSince = now;
            session.lookSpoken = false;
            if (sub.kind) noteQuest({ type: 'look', kind: sub.kind });
            if (sub.mob && sub.mob.word) noteWordShown(sub.mob.word);
            if (session.voice && session.voice.lock && session.voice.lock.mob !== sub.mob) {
                hideVoiceFallback();
            }
            if (sub.type === 'mob') maybeBuddyCue({ doing: 'look' });
        } else if (!session.lookSpoken && now - session.lookSince > 480) {
            session.lookSpoken = true;
            if (!W.shouldAutoSpeak(sub.kind, sub.type)) return;
            const last = session.lookSpokenAt || {};
            if (last[sub.kind] && now - last[sub.kind] < 16000) return;
            last[sub.kind] = now;
            session.lookSpokenAt = last;
            speakWord(label.word || { text: label.en });
        }
    }

    function launchBoltToward(mob, opts) {
        const cosmetic = !!(opts && opts.cosmetic);
        session.lastBoltAt = nowMs();
        if (viewModel) viewModel.triggerCast();
        const f = C.forwardXZ(engine.look.yaw);
        let vx = f.x * C.BOLT_SPEED;
        let vz = f.z * C.BOLT_SPEED;
        if (mob) {
            const dx = mob.x - engine.player.x;
            const dz = mob.z - engine.player.z;
            const len = Math.hypot(dx, dz) || 1;
            vx = dx / len * C.BOLT_SPEED;
            vz = dz / len * C.BOLT_SPEED;
        }
        const hasBow = CR && (Number(session.bag.wood_bow) || 0) > 0;
        const hasArrow = (Number(session.bag.arrow) || 0) > 0;
        let mesh;
        if (hasBow && MOBS.arrowMesh && (hasArrow || cosmetic)) {
            if (!cosmetic && hasArrow) {
                session.bag = C.addLoot(session.bag, 'arrow', -1);
                if ((Number(session.bag.arrow) || 0) < 0) session.bag.arrow = 0;
            }
            mesh = MOBS.arrowMesh();
        } else {
            mesh = MOBS.boltMesh((opts && opts.glow) || (cosmetic ? 'word' : 'bolt'));
        }
        const y = engine.player.y + ENG.EYE_HEIGHT * 0.7;
        mesh.position.set(engine.player.x + f.x * 0.6, y, engine.player.z + f.z * 0.6);
        mesh.rotation.y = Math.atan2(vx, vz);
        engine.scene.add(mesh);
        session.bolts.push({
            x: mesh.position.x, z: mesh.position.z, y: y,
            vx: vx, vz: vz,
            life: C.BOLT_LIFE, mesh: mesh, trailAt: 0,
            cosmetic: cosmetic,
            home: mob || null
        });
        if (sfx && sfx.bolt) sfx.bolt();
    }

    function tryBolt() {
        if (!C.canAttack({ kind: 'bolt', lastAt: session.lastBoltAt, now: nowMs() })) return;
        launchBoltToward(nearestLookMob());
    }

    function requestHit(mob, kind) {
        if (session.pending) return;
        if (mob.peaceful && C.isFarmAnimal && C.isFarmAnimal(mob.kind)) {
            applyResolvedHit(mob, kind, { answered: false, correct: false });
            return;
        }
        if (mob.isBoss) mob.bossHits = (Number(mob.bossHits) || 0) + 1;
        if (W.shouldAsk({
            firstHit: !mob.asked,
            quizPassed: !!mob.quizPassed,
            lastQuizWrong: !!mob.lastQuizWrong,
            hitsSinceQuiz: Number(mob.hitsSinceQuiz) || 0,
            bossShielded: !!(mob.isBoss && session.boss && session.boss.state === 'shielded')
        })) {
            openQuiz(mob, kind);
            return;
        }
        const askedCount = Number(mob.nudgeCount) || 0;
        if (!mob.vHinted || (mob.isBoss && W.shouldNudgeSpeak && W.shouldNudgeSpeak({
            firstHit: false,
            boss: true,
            hp: mob.hp,
            maxHp: mob.maxHp,
            askedCount: askedCount
        }))) {
            mob.vHinted = true;
            if (mob.isBoss) mob.nudgeCount = askedCount + 1;
            const label = mob.word || W.labelFor(mob.kind, bank);
            const en = (label && (label.text || label.en)) || '';
            if (en) toast('按 V 说 ' + en + ' · 暴击并破除防护罩');
        }
        if (mob.lastQuizWrong) mob.hitsSinceQuiz = (Number(mob.hitsSinceQuiz) || 0) + 1;
        applyResolvedHit(mob, kind, { answered: false, correct: false });
    }

    function fillQuizCard(quiz, kicker) {
        const word = quiz.word || {};
        const mode = quiz.mode || 'choice';
        const kick = document.querySelector('.bl-quiz-kicker');
        if (kick) kick.textContent = kicker || quiz.prompt || '暴击咒语';
        const enBtn = document.getElementById('quiz-en');
        enBtn.textContent = quiz.hidePromptWord
            ? (mode === 'listen' ? '🎧 听单词'
                : mode === 'picture' ? '看图选词'
                    : mode === 'phrase' ? '写出英文句子'
                        : mode === 'enpick' ? (word.zh || '看中文，选英文')
                            : mode === 'enphrase' ? (word.zh || '中文句子，选英文')
                                : mode === 'letters' ? (quiz.blank || '____')
                                    : '____')
            : (mode === 'sentence' ? (quiz.phrase || word.text) : word.text);
        const zhHint = document.getElementById('quiz-zh');
        if (zhHint) {
            const ipaRaw = W.phoneticOf ? W.phoneticOf(word) : (word.phonetic || '');
            const ipa = ipaRaw ? (' /' + ipaRaw + '/') : '';
            if (mode === 'enpick' || mode === 'enphrase') zhHint.textContent = ipa.trim();
            else if (mode === 'spell' || mode === 'fill' || mode === 'letters') zhHint.textContent = (word.zh || '') + ipa;
            else if (mode === 'choice' || mode === 'listen' || mode === 'sentence') zhHint.textContent = ipa.trim();
            else zhHint.textContent = '';
        }
        const img = document.getElementById('quiz-img');
        if (img) {
            const showImg = !!(word.media && word.media.image) && (mode === 'picture' || mode === 'spell' || mode === 'choice');
            if (showImg) {
                img.src = word.media.image;
                img.alt = word.text;
                img.classList.remove('is-hidden');
            } else {
                img.removeAttribute('src');
                img.alt = '';
                img.classList.add('is-hidden');
            }
        }
        const phrase = document.getElementById('quiz-phrase');
        const phraseZh = document.getElementById('quiz-phrase-zh');
        const phraseText = mode === 'fill'
            ? (quiz.blank || '')
            : (mode === 'sentence' || mode === 'listen' || mode === 'enphrase' || mode === 'letters' ? '' : (quiz.phrase || word.phrase || ''));
        const phraseZhText = (mode === 'sentence' || mode === 'choice' || mode === 'listen' || mode === 'letters')
            ? ''
            : (quiz.phraseZh || word.phraseZh || '');
        if (phrase) {
            phrase.textContent = phraseText;
            phrase.classList.toggle('is-hidden', !phraseText);
        }
        if (phraseZh) {
            phraseZh.textContent = phraseZhText;
            phraseZh.classList.toggle('is-hidden', !phraseZhText);
        }
        const box = document.getElementById('quiz-choices');
        const typeBox = document.getElementById('quiz-type');
        const input = document.getElementById('quiz-input');
        box.innerHTML = '';
        const bossType = !!(session.pending && session.pending.mob && session.pending.mob.isBoss);
        if (quiz.typed) {
            box.classList.add('is-hidden');
            if (typeBox) typeBox.classList.remove('is-hidden');
            if (input) {
                input.value = '';
                input.readOnly = false;
                setTimeout(function () { input.focus(); }, 30);
            }
        } else {
            box.classList.remove('is-hidden');
            if (typeBox) typeBox.classList.toggle('is-hidden', !bossType);
            if (input && bossType) {
                input.value = '';
                input.placeholder = 'type the English word';
                input.readOnly = false;
                setTimeout(function () { input.focus(); }, 30);
            }
            (quiz.choices || []).forEach(function (choice, i) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.setAttribute('data-quiz-i', String(i));
                btn.textContent = (i + 1) + '  ' + choice;
                btn.addEventListener('click', function () { attemptQuiz(choice); });
                box.appendChild(btn);
            });
        }
        paintQuizKeyboard();
        session.quiz = quiz;
        session.quizRetry = false;
        session.quizEndsAt = nowMs() + (quiz.limitMs || W.QUIZ_MS);
        session.paused = true;
        setCasting(false);
        toggleLayer('quiz-layer', true);
        noteWordShown(word);
        persist();
        const mic = document.getElementById('quiz-mic');
        const hideMic = (word && word.side && !(P && P.canSpeakSide && P.canSpeakSide(word.side)))
            || !(SP && SP.canSpeak && SP.canSpeak());
        if (mic) mic.classList.toggle('is-hidden', hideMic);
        if (mode !== 'picture') speakWord(word);
        if (kick && bossType) kick.textContent = '说出来或打英文打碎蓝罩 · 点中文也能过';
        if (quiz.scaffold && kick) {
            kick.textContent = (quiz.phonetic ? ('难词支架 · ' + quiz.phonetic) : '难词支架') + (quiz.phraseZh ? (' · ' + quiz.phraseZh) : '');
        }
        if (session.pending && session.pending.gate && D && session.tier) {
            const gateMs = D.tierOf(session.tier).gateMs;
            if (gateMs) {
                quiz.limitMs = gateMs;
                session.quizEndsAt = nowMs() + gateMs;
            }
        }
    }

    function histMisses(word) {
        const key = String((word && word.text) || '').toLowerCase();
        if (!key || !bridge || typeof bridge.readState !== 'function') return 0;
        try {
            const st = bridge.readState();
            const item = st && st.courseProgress && st.courseProgress.minecraft
                && st.courseProgress.minecraft.mastery && st.courseProgress.minecraft.mastery[key];
            return W.missCount(item);
        } catch (e) {
            return 0;
        }
    }

    function missStreakOf(word) {
        const key = String((word && word.text) || '').toLowerCase();
        if (!key) return 0;
        if (session.missByWord && session.missByWord[key] != null) return Number(session.missByWord[key]) || 0;
        const hist = histMisses(word);
        return hist >= W.HARD_MISS ? hist : 0;
    }

    function noteWordResult(word, correct) {
        const key = String((word && word.text) || '').toLowerCase();
        if (!key) return;
        if (!session.missByWord) session.missByWord = {};
        session.missByWord[key] = correct ? 0 : missStreakOf(word) + 1;
        rebindFarWordCubes();
    }

    function nextLearnQuiz(word, extra) {
        if (word && word.side && P && P.quizFromSide) return P.quizFromSide(word.side);
        session.quizTurn = (Number(session.quizTurn) || 0) + 1;
        session.askedCount = (Number(session.askedCount) || 0) + 1;
        if (WM && WM.needsScaffold(memNow(), word) && !(extra && extra.mode)) {
            const built = W.makeQuiz(word, bank, { mode: 'choice' });
            const sc = WM.scaffoldQuiz({
                text: word && word.text,
                zh: word && word.zh,
                phraseZh: word && word.phraseZh,
                phonetic: W.phoneticOf ? W.phoneticOf(word) : ''
            }, memNow());
            built.phraseZh = sc.phraseZh;
            built.phonetic = sc.phonetic;
            built.scaffold = true;
            return built;
        }
        const mastery = readMastery();
        const key = String((word && word.text) || '').toLowerCase();
        const rec = mastery[key] || mastery[(word && (word.id || word.text)) || ''] || {};
        if (D && session.tier && D.tierOf(session.tier).questionTier >= 2 && !(extra && extra.mode) && !session.reviewRun) {
            extra = Object.assign({
                mode: (W.isShortWord && W.isShortWord(word)) ? 'spell' : 'enpick'
            }, extra || {});
        }
        const quiz = W.makeQuiz(word, bank, Object.assign({
            turn: session.quizTurn,
            missStreak: missStreakOf(word),
            seen: Number((session.seenByWord || {})[key]) || 0,
            stage: W.masteryStage ? W.masteryStage(rec, todayStr()) : 'new'
        }, extra || {}));
        if (session.reviewRun && RS && RS.bumpQuestionKind && !(extra && extra.mode)) {
            const mode = RS.bumpQuestionKind(quiz.mode);
            if (mode !== quiz.mode) {
                return W.makeQuiz(word, bank, Object.assign({
                    turn: session.quizTurn,
                    missStreak: missStreakOf(word),
                    seen: Number((session.seenByWord || {})[key]) || 0,
                    stage: W.masteryStage ? W.masteryStage(rec, todayStr()) : 'new',
                    mode: mode
                }, extra || {}));
            }
        }
        return quiz;
    }

    function openQuiz(mob, kind) {
        const word = (mob && mob.word) || W.nextWord(pool, progress.learnedIds) || pool[0];
        if (!word) {
            applyResolvedHit(mob, kind, { answered: false, correct: false });
            return;
        }
        session.pending = { mob: mob, kind: kind };
        const bossShielded = !!(mob.isBoss && session.boss && session.boss.state === 'shielded');
        const quiz = nextLearnQuiz(word, bossShielded && L.bossQuizMode
            ? { mode: L.bossQuizMode(session.boss.mechanic, word) }
            : null);
        const hard = W.needsHardMode(word, { missStreak: missStreakOf(word) });
        const seen = Number((session.seenByWord || {})[String((word && word.text) || '').toLowerCase()]) || 0;
        const kick = bossShielded && L.bossQuizKicker
            ? L.bossQuizKicker(session.boss.mechanic)
            : quiz.mode === 'spell'
            ? (seen >= 1 ? '这个词再见了，拼出来' : '拼出单词')
            : quiz.mode === 'enpick'
            ? (seen >= 1 ? '跟读或选英文' : '看中文，选英文')
            : quiz.mode === 'sentence'
                ? '英文句子，选中文'
                : quiz.mode === 'enphrase'
                    ? '中文句子，选英文'
                    : quiz.mode === 'letters'
                        ? '补全缺的字母'
                        : (hard ? '这个词错过几次了，拼出来' : (quiz.prompt || '先做题才能打'));
        fillQuizCard(quiz, kick);
    }

    function openGateQuiz(gate) {
        const word = gate.word || W.nextWord(pool, progress.learnedIds) || pool[0];
        if (!word) {
            ENG.openWordGate(engine.world, gate);
            if (engine.remeshAt) engine.remeshAt(gate.x, gate.z);
            return;
        }
        session.pending = { gate: gate };
        fillQuizCard(nextLearnQuiz(word, { gate: true }), W.needsHardMode(word, { missStreak: missStreakOf(word) }) ? '单词闸门 · 这个词错过几次了，拼出来' : '单词闸门 · 选出中文');
    }

    function pickQuizChoice(index) {
        if (!session.quiz || session.quiz.typed) return;
        const choice = session.quiz.choices && session.quiz.choices[index];
        if (!choice) return;
        attemptQuiz(choice);
    }

    function submitTypedQuiz() {
        if (!session.quiz || !session.quiz.typed) return;
        const input = document.getElementById('quiz-input');
        const value = input && input.value;
        if (!String(value || '').trim()) return;
        attemptQuiz(value);
    }

    function letterKeyboardHtml(opts) {
        opts = opts || {};
        const next = String(opts.next || '').toLowerCase();
        const typed = String(opts.typed || '').toLowerCase();
        const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
        return rows.map(function (row) {
            return '<div class="bl-keys">' + row.split('').map(function (ch) {
                const cls = ch === next ? ' is-next' : (typed.indexOf(ch) >= 0 ? ' is-done' : '');
                return '<button type="button" class="bl-key' + cls + '" data-key="' + ch + '">' + ch + '</button>';
            }).join('') + '</div>';
        }).join('') + '<div class="bl-keys bl-keys-actions">'
            + '<button type="button" class="bl-key is-action" data-action="backspace">⌫</button>'
            + '<button type="button" class="bl-key is-action" data-key=" ">空格</button>'
            + '<button type="button" class="bl-key is-action" data-action="clear">清空</button>'
            + '<button type="button" class="bl-key is-action" data-action="enter">确认</button>'
            + '</div>';
    }

    function paintQuizKeyboard() {
        const box = document.getElementById('quiz-keyboard');
        const typeBox = document.getElementById('quiz-type');
        if (!box) return;
        const show = !!(session.quiz && typeBox && !typeBox.classList.contains('is-hidden'));
        box.classList.toggle('is-hidden', !show);
        if (!show) {
            box.innerHTML = '';
            return;
        }
        const input = document.getElementById('quiz-input');
        const typed = String((input && input.value) || '');
        const aim = String((session.quiz.word && session.quiz.word.text) || session.quiz.answer || '').toLowerCase();
        box.innerHTML = letterKeyboardHtml({
            typed: typed,
            next: aim.charAt(typed.length)
        });
    }

    function applyQuizKey(action, ch) {
        const input = document.getElementById('quiz-input');
        if (!input || !session.quiz) return;
        if (action === 'backspace') {
            input.value = String(input.value || '').slice(0, -1);
        } else if (action === 'clear') {
            input.value = '';
        } else if (action === 'enter') {
            submitTypedQuiz();
            return;
        } else if (ch != null && ch !== '') {
            input.value = String(input.value || '') + ch;
        }
        refreshQuizKeyPaint();
    }

    function refreshQuizKeyPaint() {
        const box = document.getElementById('quiz-keyboard');
        const input = document.getElementById('quiz-input');
        if (!box || !session.quiz) return;
        if (!box.querySelector('.bl-key')) {
            paintQuizKeyboard();
            return;
        }
        const typed = String((input && input.value) || '').toLowerCase();
        const aim = String((session.quiz.word && session.quiz.word.text) || session.quiz.answer || '').toLowerCase();
        const next = aim.charAt(typed.length);
        const btns = box.querySelectorAll('[data-key]');
        for (let i = 0; i < btns.length; i += 1) {
            const ch = btns[i].getAttribute('data-key');
            btns[i].classList.toggle('is-next', ch === next);
            btns[i].classList.toggle('is-done', typed.indexOf(ch) >= 0);
        }
    }

    function liveCastTargets() {
        const mobs = session.monsters.filter(function (m) {
            return m && m.hp > 0 && m.word && m.word.text
                && W.canTypeCast({
                    boss: !!m.isBoss,
                    word: m.word,
                    missStreak: missStreakOf(m.word)
                });
        });
        const sub = lookSubject();
        if (isVillageLook(sub)) {
            const word = villageLookWord(sub);
            if (word && word.text) {
                mobs.unshift({
                    village: true,
                    look: sub,
                    word: word,
                    hp: 1
                });
            }
        }
        return mobs;
    }

    function wordKey(word) {
        return String((word && (word.id || word.text)) || '');
    }

    function noteWordShown(word) {
        const id = wordKey(word);
        if (!id || !W.noteId) return;
        progress.shownWordIds = W.noteId(progress.shownWordIds, id);
    }

    function noteWordSpoken(word) {
        const id = wordKey(word);
        if (id && W.noteId) progress.spokenWordIds = W.noteId(progress.spokenWordIds, id);
        if (W.bumpSpeak) {
            const next = W.bumpSpeak(progress, todayIso());
            progress.speakCount = next.speakCount;
            progress.speakByDay = next.speakByDay;
        }
        maybeCompleteDaily(word, 'speak');
    }

    function rememberBoundWord(word) {
        if (!session.usedWordKeys) session.usedWordKeys = {};
        const text = String((word && word.text) || '').toLowerCase();
        const id = String((word && word.id) || '').toLowerCase();
        if (text) session.usedWordKeys[text] = 1;
        if (id) session.usedWordKeys[id] = 1;
    }

    function sessionSkipKeys() {
        const keys = [];
        function push(key) {
            const k = String(key || '').trim().toLowerCase();
            if (k && keys.indexOf(k) < 0) keys.push(k);
        }
        Object.keys(session.usedWordKeys || {}).forEach(push);
        Object.keys(session.seenByWord || {}).forEach(push);
        (progress.shownWordIds || []).forEach(push);
        return keys;
    }

    function bindMobWord(mob) {
        if (!mob) return;
        const used = [];
        function takeUsed(m) {
            if (!m || m === mob || !m.word) return;
            if (m.word.id) used.push(m.word.id);
            if (m.word.text) used.push(m.word.text);
        }
        session.monsters.forEach(takeUsed);
        ((engine && engine.world && engine.world.animals) || []).forEach(takeUsed);
        const kind = mob.isBoss
            ? ((L.bossModelOf && L.bossModelOf(mob.bossId)) || 'boss')
            : mob.kind;
        const cfg = L.levelOf ? L.levelOf(session.level) : null;
        const src = (pool && pool.length) ? pool : bank;
        mob.word = W.bindCastWord(src, used, {
            kind: kind,
            focus: (cfg && cfg.focusWords) || [],
            prefer: mob.word && mob.word.text,
            review: sessionReviewKeys(),
            reviewFirst: !!mob.isBoss && !!mob.reviewFirst && !(mob.word && mob.word.text),
            skip: sessionSkipKeys(),
            theme: (!mob.reviewFirst && session.waveTheme) || ''
        });
        if (!mob.word) {
            const label = W.labelFor(kind, bank);
            mob.word = label.word || { id: label.en, text: label.en, zh: label.zh };
        }
        rememberBoundWord(mob.word);
    }

    function paintCastHud() {
        const hud = document.getElementById('cast-hud');
        const list = document.getElementById('cast-words');
        const input = document.getElementById('cast-input');
        const kick = document.getElementById('cast-kicker');
        const targets = liveCastTargets();
        if (!hud) return;
        hud.classList.toggle('is-hidden', !targets.length);
        hud.classList.toggle('is-casting', !!session.casting);
        if (kick) {
            const hasBoss = targets.some(function (m) { return m.isBoss; });
            kick.textContent = session.casting
                ? (hasBoss ? '拼出英文打碎蓝罩' : '这些词错过几次了 · 拼英文，怪物还会走近')
                : (hasBoss ? 'Boss · T 打字破罩' : '顽固词 · T 吟唱拼英文');
        }
        if (list) {
            list.innerHTML = '';
            const typed = String(session.castBuf || '').trim().toLowerCase();
            targets.forEach(function (m) {
                const chip = document.createElement('span');
                chip.className = 'bl-cast-chip';
                const en = String((m.word && m.word.text) || '').toLowerCase();
                if (typed && en.indexOf(typed) === 0) chip.classList.add('is-hot');
                chip.textContent = ((m.word && m.word.text) || '') + (m.word && m.word.zh ? ' · ' + m.word.zh : '');
                list.appendChild(chip);
            });
        }
        if (input) {
            input.value = session.castBuf || '';
            input.placeholder = session.casting ? 'type the word' : 'T 开始拼写';
        }
        const ghost = document.getElementById('cast-ghost');
        if (ghost) {
            const aim = targets[0] && targets[0].word ? String(targets[0].word.text || '') : '';
            const typed = String(session.castBuf || '');
            ghost.innerHTML = aim
                ? ('<b>' + typed + '</b><em>' + aim.slice(typed.length) + '</em>')
                : '';
        }
        paintCastKeyboard(targets);
        if (session.casting && !targets.length) setCasting(false);
    }

    function paintCastKeyboard(targets) {
        const box = document.getElementById('cast-keyboard');
        if (!box) return;
        box.classList.toggle('is-hidden', !session.casting);
        if (!session.casting) {
            box.innerHTML = '';
            return;
        }
        const aim = String((targets[0] && targets[0].word && targets[0].word.text) || '').toLowerCase();
        const typed = String(session.castBuf || '').toLowerCase();
        const next = aim.charAt(typed.length);
        box.innerHTML = letterKeyboardHtml({ typed: typed, next: next });
    }

    function setCasting(on) {
        const want = !!on && liveCastTargets().length > 0;
        session.casting = want;
        if (!want) session.castBuf = '';
        if (engine && engine.setCastMode) engine.setCastMode(want);
        paintCastHud();
    }

    function appendCast(ch) {
        session.castBuf = String(session.castBuf || '') + ch;
        paintCastHud();
        const hit = W.matchCast(session.castBuf, liveCastTargets());
        if (hit) fireCast(hit);
    }

    function tryCastSubmit() {
        const hit = W.matchCast(session.castBuf, liveCastTargets());
        if (hit) {
            fireCast(hit);
            return;
        }
        if (String(session.castBuf || '').trim()) {
            progress.wrongCount = (Number(progress.wrongCount) || 0) + 1;
            persist();
            toast('再拼一次');
        }
        session.castBuf = '';
        paintCastHud();
    }

    function fireCast(mob) {
        if (mob && mob.village) {
            const word = mob.word;
            session.castBuf = '';
            if (word && word.id && progress.learnedIds.indexOf(word.id) === -1) progress.learnedIds.push(word.id);
            progress.rightCount = (Number(progress.rightCount) || 0) + 1;
            if (typeof noteFamiliarWord === 'function') noteFamiliarWord(word, 'spell');
            persist();
            applyVillageSpeak({ look: mob.look, word: word }, word && word.text);
            setCasting(false);
            return;
        }
        const word = mob && mob.word;
        session.castBuf = '';
        if (word && word.id && progress.learnedIds.indexOf(word.id) === -1) progress.learnedIds.push(word.id);
        progress.rightCount = (Number(progress.rightCount) || 0) + 1;
        noteFamiliarWord(word, 'spell');
        noteWordResult(word, true);
        recordWordMemory(word, true);
        recordBridgeAnswer(word, true);
        persist();
        if (sfx && sfx.reward) sfx.reward();
        if (viewModel) viewModel.triggerCast();
        session.combo = C.nextCombo({ answered: true, correct: true, combo: session.combo });
        if (mob.isBoss && session.boss) {
            chipBossShield('spell', 1);
        }
        mob.asked = true;
        mob.lastQuizWrong = false;
        mob.quizPassed = !(mob.isBoss && session.boss && session.boss.state === 'shielded');
        mob.voiceFails = 0;
        launchBoltToward(mob, { cosmetic: true });
        applyResolvedHit(mob, 'bolt', { answered: true, correct: true, channel: 'spell' });
        paintCastHud();
        toast((word && word.text) || 'Hit!');
    }

    function attemptQuiz(input) {
        if (!session.quiz || !session.pending) return;
        if (session.quiz.word && session.quiz.word.side && P && P.grade) {
            const sideHit = P.grade(session.quiz.word.side, input);
            resolveQuiz(!!sideHit.ok, { record: true, crit: false, comboKeep: false, channel: 'choice' });
            return;
        }
        const result = W.resolveAttempt
            ? W.resolveAttempt(session.quiz, input, { retried: !!session.quizRetry })
            : { correct: W.checkQuiz(session.quiz, input), retry: false, record: true, crit: true, comboKeep: true };
        if (result.retry) {
            session.quizRetry = true;
            toast('再听一次 · ' + (result.reveal || ''));
            if (session.quiz.word) speakWord(session.quiz.word);
            const box = document.getElementById('quiz-choices');
            if (box) {
                Array.prototype.forEach.call(box.children, function (btn) {
                    const text = String(btn.textContent || '').replace(/^\d+\s+/, '');
                    if (text === String(result.reveal)) btn.classList.add('is-reveal');
                });
            }
            return;
        }
        session.quizRetry = false;
        resolveQuiz(!!result.correct, Object.assign({}, result, {
            channel: W.channelOf ? W.channelOf(session.quiz, input) : (session.quiz && session.quiz.typed ? 'spell' : 'choice')
        }));
    }

    function resolveQuiz(correct, result) {
        if (!session.pending) return;
        const pending = session.pending;
        const word = session.quiz && session.quiz.word;
        const rec = result || { record: true, crit: correct, comboKeep: correct };
        session.pending = null;
        session.quiz = null;
        toggleLayer('quiz-layer', false);
        paintQuizKeyboard();
        if (rec.record) {
            const seenKey = String((word && word.text) || '').toLowerCase();
            if (seenKey && !(word && word.side)) {
                if (!session.seenByWord) session.seenByWord = {};
                session.seenByWord[seenKey] = (Number(session.seenByWord[seenKey]) || 0) + 1;
            }
            if (correct) {
                session.wordAt = nowMs();
                progress.rightCount = (Number(progress.rightCount) || 0) + 1;
                if (word && word.side && word.side.masteryKey) {
                    noteSideResult(word, true);
                } else {
                    if (word && word.id && progress.learnedIds.indexOf(word.id) === -1) progress.learnedIds.push(word.id);
                    noteFamiliarWord(word, rec.channel);
                }
                if (sfx && sfx.celebrate) sfx.celebrate();
            } else {
                progress.wrongCount = (Number(progress.wrongCount) || 0) + 1;
                if (word && word.side) noteSideResult(word, false);
            }
            noteWordResult(word && word.side ? null : word, correct);
            recordWordMemory(word && word.side ? null : word, correct);
            if (RS && RS.noteHardWord && word && !word.side) {
                RS.noteHardWord(progress, word.text, correct, {
                    now: nowIso(),
                    inReview: !!session.reviewRun
                });
            }
            if (RS && RS.noteHearSpeak && rec.channel) RS.noteHearSpeak(progress, rec.channel);
            recordBridgeAnswer(word, correct);
            if (word && word.side) {
                refreshSideTablets();
                if (correct) noteQuest({ type: 'side', kind: word.side.kind });
            }
            if (correct && rec.channel === 'spell' && !(word && word.side)) maybeCompleteDaily(word, 'spell');
            if (correct && !(word && word.side)) grantHouseAwards();
        }
        persist();
        paintCastHud();
        if (pending.dummy) {
            if (correct) {
                session.coins = (Number(session.coins) || 0) + 1;
                persist();
                toast('假人倒下 · +1 金币');
            } else {
                toast('再打一次假人');
            }
            return;
        }
        if (pending.merchantMath) {
            if (correct) {
                session.mathDiscount = pending.merchantMath.discount || 0.9;
                toast('算对了 · 本单九折');
            } else {
                toast('原价也能买');
            }
            openTrade();
            return;
        }
        if (pending.teacherSide) {
            if (correct) {
                const pay = P && P.tabletReward ? P.tabletReward() : { coins: 3 };
                session.coins = (Number(session.coins) || 0) + (Number(pay.coins) || 0);
                persist();
                syncHud();
                greetVillager(pending.look);
                noteQuest({ type: 'teacher' });
            } else {
                toast('老师：再试一张');
            }
            return;
        }
        if (pending.sceneSide) {
            toast(correct ? '拼读做到了' : '再听一次');
            return;
        }
        if (pending.wordBlock) {
            const cell = pending.wordBlock.cell || {};
            if (cell.side) {
                if (correct) {
                    const pay = P && P.tabletReward ? P.tabletReward() : { coins: 3 };
                    session.coins = (Number(session.coins) || 0) + (Number(pay.coins) || 0);
                    persist();
                    syncHud();
                    toast((cell.zh || '石碑') + ' · +' + (pay.coins || 0) + '金币');
                } else {
                    toast('再挖一块石碑试试');
                }
                return;
            }
            if (correct && W.commitWordBlock) {
                const r = W.commitWordBlock({
                    coins: session.coins,
                    hp: engine.player.hp,
                    hpMax: engine.player.hpMax,
                    learnedIds: progress.learnedIds
                }, cell);
                session.coins = r.coins;
                engine.player.hp = r.hp;
                progress.learnedIds = r.learnedIds;
                persist();
                toast((cell.text || '') + ' · ' + (cell.zh || '') + '  +' + r.coinsGain + '金币 +' + r.heal + 'HP');
            } else {
                toast('再挖一块金色词块试试');
            }
            return;
        }
        if (pending.gate) {
            if (correct) {
                ENG.openWordGate(engine.world, pending.gate);
                if (engine.remeshAt) engine.remeshAt(pending.gate.x, pending.gate.z);
                toast('闸门开了！');
            } else {
                toast('再试试才能过门');
                session.gateAsked = null;
            }
            return;
        }
        if (pending.craftItem) {
            if (correct) {
                if (!progress.craftKnown) progress.craftKnown = {};
                progress.craftKnown[pending.craftItem] = 1;
                persist();
                if (pending.craftVia === 'grid') finishTakeCraft();
                else finishDoCraft(pending.craftItem);
                toggleCraft(true);
            } else {
                toast('再拼一次 ' + ((word && word.text) || '') + ' 才能合成');
                toggleCraft(true);
            }
            return;
        }
        pending.mob.asked = true;
        pending.mob.lastQuizWrong = !correct;
        pending.mob.hitsSinceQuiz = 0;
        pending.mob.voiceFails = 0;
        if (correct && rec.channel === 'speak') noteWordSpoken(word);
        if (correct && pending.mob.isBoss && session.boss) {
            session.bossHitsOnShield = (Number(session.bossHitsOnShield) || 0) + 1;
            if (session.bossHitsOnShield >= (session.bossNeed || 1)) {
                chipBossShield(rec.channel, rec.channel === 'speak' ? 2 : 1);
                session.bossHitsOnShield = 0;
            } else {
                toast('再答 ' + ((session.bossNeed || 1) - session.bossHitsOnShield) + ' 题破这层罩');
            }
        }
        const stillShield = !!(pending.mob.isBoss && session.boss && session.boss.state === 'shielded');
        if (correct) pending.mob.quizPassed = !stillShield;
        if (correct && stillShield) {
            toast((L.bossQuizKicker && L.bossQuizKicker(session.boss.mechanic)) || '蓝罩还在 · 按提示说或拼');
        }
        if (!(correct && rec.comboKeep === false)) {
            session.combo = C.nextCombo({ answered: true, correct: correct, combo: session.combo });
        }
        applyResolvedHit(pending.mob, pending.kind, {
            answered: true,
            correct: correct,
            channel: rec.channel
        });
    }

    function noteQuest(ev) {
        if (!Q || !session.quest) return;
        session.quest = Q.apply(session.quest, ev);
        paintQuest();
    }

    function paintQuest() {
        const goal = document.getElementById('quest-goal');
        const hint = document.getElementById('quest-hint');
        const mark = session.guideMark || currentGuideMark();
        if (mark) {
            if (goal) goal.textContent = mark.label;
            if (hint) hint.textContent = mark.hint;
            return;
        }
        if (!Q || !session.quest) return;
        const cur = Q.current(session.quest);
        if (goal) goal.textContent = cur.title || '';
        if (hint) hint.textContent = cur.hint || '';
    }

    function applyResolvedHit(mob, kind, verdict) {
        let dmg = C.damage({
            kind: kind,
            answered: verdict.answered,
            correct: verdict.correct,
            combo: session.combo
        });
        if (verdict.correct && verdict.channel && C.channelMultiplier) {
            const channel = session.combo >= 3 ? 'combo' : verdict.channel;
            const base = kind === 'bolt' ? C.BASE_BOLT : C.BASE_MELEE;
            dmg = base * C.channelMultiplier(channel);
        }
        if (kind === 'melee') {
            const bonus = CR && CR.toolBonus ? CR.toolBonus(session.bag, session.tool) : { melee: 1 };
            dmg = Math.max(1, Math.round(dmg * T.meleeScale(session.tool) * (bonus.melee || 1)));
            dmg += S.statsOf(progress.gear).atk;
        } else if (kind === 'bolt') {
            const bonus = CR && CR.toolBonus ? CR.toolBonus(session.bag, session.tool) : {};
            dmg = Math.max(1, Math.round(dmg * (bonus.bolt || 1)));
        }
        const crit = !!(verdict.answered && verdict.correct);
        if (verdict.correct) session.wordAt = nowMs();
        if (mob.isBoss && session.boss) {
            const r = L.applyBossDamage(session.boss, dmg, { now: nowMs(), channel: verdict.channel });
            session.boss = r.boss;
            if (r.blocked && !verdict.answered) {
                toast((L.bossQuizKicker && L.bossQuizKicker(session.boss.mechanic)) || '蓝罩挡住了 · 说或拼才能破');
            }
            if (verdict.correct || (verdict.answered && !r.blocked)) {
                session.bossHits = (Number(session.bossHits) || 0) + 1;
                const kit = L.kitOf && L.kitOf(session.boss.id);
                if (kit && kit.cryHits && session.bossHits % kit.cryHits === 0) {
                    session.bossCryUntil = nowMs() + 5000;
                    toast('它哭了 · 5 秒输出窗');
                }
            }
            if (r.boss && r.boss.phaseChanged) {
                toast((L.bossFormLine && L.bossFormLine(session.boss)) || ('进入阶段 ' + session.boss.phase));
                applyBossForm(mob, session.boss.phase);
            }
            mob.hp = session.boss.hp;
            session.lastDamage = r.dealt;
            session.lastCrit = crit;
            MOBS.spawnDamageText(engine.scene, session.fx, mob, r.dealt, crit);
            spawnCombatHitFx(mob, {
                correct: verdict.correct,
                shield: session.boss.state === 'broken'
            });
            flashMesh(mob.mesh);
            mob.hurtFlash = 0.1;
            if (mob.model) mob.model.setHp(session.boss.hp / (session.boss.maxHp || 1), true);
            paintBossShield();
            syncBossHud();
            if (session.boss.dead) killBoss(mob);
            playCombatHit(crit);
            return;
        }
        hurtMonster(mob, dmg, crit);
    }

    function spawnCombatHitFx(mob, opts) {
        const o = opts || {};
        const FX = globalThis.BlockLegendFx;
        if (o.correct && MOBS.spawnWordFlash) {
            const wordKind = o.shield ? 'shield' : 'word';
            MOBS.spawnWordFlash(engine.scene, session.fx, mob, wordKind);
            const comboOn = (Number(session.combo) || 0) >= 3;
            if (comboOn && MOBS.spawnHitFlash) {
                MOBS.spawnHitFlash(engine.scene, session.fx, mob, 'combo');
            }
            const punchKind = o.shield ? 'shield' : (comboOn ? 'combo' : 'word');
            const punch = FX && FX.hitPunch ? FX.hitPunch(punchKind) : null;
            if (punch && engine.punch) engine.punch(punch);
            if (MOBS.spawnHitLight) MOBS.spawnHitLight(engine.scene, session.fx, mob, punchKind);
            wordFlash();
            return;
        }
        if (MOBS.spawnHitFlash) {
            MOBS.spawnHitFlash(engine.scene, session.fx, mob, 'hit');
        }
        if (MOBS.spawnHitLight) MOBS.spawnHitLight(engine.scene, session.fx, mob, 'hit');
    }

    function playCombatHit(crit) {
        if (!sfx) return;
        if (crit && sfx.crit) sfx.crit();
        else if (sfx.hit) sfx.hit();
    }

    function chipBossShield(channel, fallbackChip) {
        if (!session.boss) return;
        if (L.canChipShield && !L.canChipShield(session.boss.mechanic, channel)) return;
        const before = session.boss.state;
        const chip = L.shieldChipOf
            ? L.shieldChipOf(channel, session.boss.shield, session.boss.mechanic)
            : fallbackChip;
        session.boss = L.chipShield(session.boss, chip, { now: nowMs() }).boss;
        if (before !== 'broken' && session.boss.state === 'broken') {
            noteQuest({ type: 'boss-shield-break' });
            if (sfx && sfx.shieldBreak) sfx.shieldBreak();
        }
    }

    function fireBossShot(mob, opts) {
        if (!mob || !engine || !MOBS) return;
        const o = opts || {};
        const aim = (opts && opts.aim) || engine.player;
        const p = engine.player;
        const dx = aim.x - mob.x;
        const dz = aim.z - mob.z;
        const len = Math.hypot(dx, dz) || 1;
        let ux = dx / len, uz = dz / len;
        const ang = Number(o.angle) || 0;
        if (ang) {
            const c = Math.cos(ang), s = Math.sin(ang);
            const nx = ux * c - uz * s;
            uz = ux * s + uz * c;
            ux = nx;
        }
        const speed = o.track ? 5.2 : (o.shot === 'sonic' ? 7.2 : 6.4);
        const mesh = MOBS.skillShotMesh
            ? MOBS.skillShotMesh(o.shot || 'bolt', o.color, o.halo)
            : MOBS.boltMesh();
        const y = (mob.y || 0) + (mob.height || 1.6) * 0.55;
        mesh.position.set(mob.x, y, mob.z);
        engine.scene.add(mesh);
        session.bossShots = session.bossShots || [];
        session.bossShots.push({
            x: mob.x, z: mob.z, y: y,
            vx: ux * speed, vz: uz * speed,
            life: 2.8, mesh: mesh, track: !!o.track, dmg: Number(o.dmg) || 1,
            friendly: !!o.friendly,
            aimMob: o.aimMob || null
        });
    }

    function playBossSkillPose(fx, now) {
        session.bossAnim = {
            lean: (fx && fx.lean) || 'forward',
            until: now + 520
        };
    }

    function spawnBossRing(mob, fx) {
        if (!MOBS.skillRingMesh || !engine) return;
        const ring = MOBS.skillRingMesh(fx.color);
        const y = (mob.y || 0) + 0.12;
        ring.position.set(mob.x, y, mob.z);
        engine.scene.add(ring);
        session.fx.push({
            kind: 'ring', obj: ring, life: 0.7, maxLife: 0.7,
            r0: fx.radius || 1.6, grow: fx.grow || 3.4
        });
    }

    function playBossSkill(mob, act, now) {
        const fx = L.bossSkillFx ? L.bossSkillFx(act.skill, act.phase, session.boss.id) : { kind: 'shot', color: 0xff6a2a };
        playBossSkillPose(fx, now);
        if (MOBS.spawnBurst) {
            MOBS.spawnBurst(engine.scene, session.fx, mob.x, mob.y + 1.1, mob.z, fx.color, fx.burst || 8);
        }
        if (fx.kind === 'dash') {
            session.bossDashUntil = now + (fx.dashMs || 900);
            toast(act.label);
            return;
        }
        if (fx.kind === 'ring') {
            spawnBossRing(mob, fx);
            const dist = Math.hypot(engine.player.x - mob.x, engine.player.z - mob.z);
            if (dist < (fx.radius || 2) + 1.4) {
                const hit = C.applyContact({ hp: engine.player.hp, lastHitAt: session.lastHitAt }, { contact: 2 }, now);
                if (hit.hit) {
                    engine.player.hp = hit.hp;
                    session.lastHitAt = hit.lastHitAt;
                    hurtFlash();
                    toast(act.label + '！HP ' + Math.ceil(engine.player.hp));
                    if (engine.player.hp <= 0) respawn();
                    return;
                }
            }
            toast(act.label);
            return;
        }
        if (fx.kind === 'summon') {
            if (session.bossSummoned) return;
            session.bossSummoned = true;
            const kind = act.minion || 'blaze';
            spawnMonster(kind, mob.x + 2.4, mob.z + 1.2);
            spawnMonster(kind, mob.x - 2.2, mob.z + 1.6);
            toast(act.label);
            return;
        }
        const n = Number(act.count) || 1;
        if (fx.ring) spawnBossRing(mob, { color: fx.color, radius: 1.2, grow: 2.4 });
        if (n <= 1) fireBossShot(mob, fx);
        else {
            for (let i = 0; i < n; i += 1) {
                fireBossShot(mob, Object.assign({}, fx, { angle: (i - (n - 1) / 2) * 0.32 }));
            }
        }
    }

    function tickBossCombat(now) {
        if (!session.boss || !session.bossMob || session.boss.dead || session.bossMob.hp <= 0) return;
        if (!L.nextBossAction) return;
        const mob = session.bossMob;
        const act = L.nextBossAction(session.boss, {
            now: now,
            lastAt: session.bossSkillAt || 0,
            cryUntil: session.bossCryUntil || 0
        });
        if (session.boss.phase !== act.phase) session.boss.phase = act.phase;
        if (!act.ready) return;
        session.bossSkillAt = now;
        playBossSkill(mob, act, now);
    }

    function moveBossShots(dt) {
        if (!session.bossShots || !session.bossShots.length) return;
        const p = engine.player;
        const keep = [];
        session.bossShots.forEach(function (b) {
            b.life -= dt;
            if (b.track) {
                const hunt = (b.aimMob && b.aimMob.hp > 0) ? b.aimMob : p;
                const dx = hunt.x - b.x, dz = hunt.z - b.z;
                const len = Math.hypot(dx, dz) || 1;
                b.vx += (dx / len) * 4.2 * dt;
                b.vz += (dz / len) * 4.2 * dt;
                const spd = Math.hypot(b.vx, b.vz) || 1;
                if (spd > 6.2) {
                    b.vx = b.vx / spd * 6.2;
                    b.vz = b.vz / spd * 6.2;
                }
            }
            b.x += b.vx * dt;
            b.z += b.vz * dt;
            if (b.mesh) {
                b.mesh.position.set(b.x, b.y, b.z);
                b.mesh.rotation.y = Math.atan2(b.vx, b.vz);
            }
            if (b.aimMob && b.aimMob.hp > 0 && Math.hypot(b.aimMob.x - b.x, b.aimMob.z - b.z) < 0.8) {
                hurtMonster(b.aimMob, 4, false);
                if (b.mesh) engine.scene.remove(b.mesh);
                return;
            }
            if (!b.friendly && Math.hypot(p.x - b.x, p.z - b.z) < 0.7) {
                const hit = C.applyContact({ hp: p.hp, lastHitAt: session.lastHitAt }, { contact: b.dmg || 1 }, nowMs());
                if (hit.hit) {
                    p.hp = hit.hp;
                    session.lastHitAt = hit.lastHitAt;
                    hurtFlash();
                    if (sfx && sfx.hurt) sfx.hurt();
                    toast('中弹了！HP ' + Math.ceil(p.hp));
                    if (p.hp <= 0) respawn();
                }
                if (b.mesh) engine.scene.remove(b.mesh);
                return;
            }
            if (b.life <= 0) {
                if (b.mesh) engine.scene.remove(b.mesh);
                return;
            }
            keep.push(b);
        });
        session.bossShots = keep;
    }

    function applyBossForm(mob, phase) {
        if (!mob || !mob.mesh || !L.bossFormOf) return;
        const form = L.bossFormOf((session.boss && session.boss.id) || mob.bossId, phase);
        mob.mesh.scale.setScalar(form.scale);
        mob.mesh.traverse(function (n) {
            const name = String(n.name || '').toLowerCase();
            if (!n.material || !n.material.emissive) return;
            if (name.indexOf('eye') < 0 && name.indexOf('core') < 0 && name.indexOf('heart') < 0 && name.indexOf('glow') < 0 && name.indexOf('mouth') < 0) return;
            n.material.emissive.setHex(form.glow);
            if (n.material.color) n.material.color.setHex(form.glow);
        });
    }

    function paintBossShield() {
        if (!session.bossMob || !session.bossMob.mesh || !session.boss) return;
        session.bossMob.mesh.traverse(function (n) {
            if (n.name === 'boss-shield' && n.material) {
                n.material.color.setHex(session.boss.color === 'red' ? 0xff4a3a : 0x3d7dff);
                n.material.opacity = session.boss.state === 'broken' ? 0.16 : 0.32;
            }
        });
        const hud = document.getElementById('boss-hud');
        if (hud) hud.classList.toggle('is-broken', session.boss.state === 'broken');
    }

    function showSwing() {
        if (viewModel) viewModel.triggerSwing();
    }

    function blinkMob(mob) {
        if (!mob || !C.blinkOffset) return false;
        const hop = C.blinkOffset(mob.x, mob.z, nowMs());
        const nx = mob.x + hop.dx, nz = mob.z + hop.dz;
        if (mobBlocked(nx, nz, mob.y || 0, true, mob.kind)) return false;
        mob.x = nx;
        mob.z = nz;
        if (mob.mesh) mob.mesh.position.set(mob.x, mob.y || 0, mob.z);
        if (MOBS.spawnBurst) MOBS.spawnBurst(engine.scene, session.fx, mob.x, (mob.y || 0) + 1.1, mob.z, 0x201828, 5);
        return true;
    }

    function hurtMonster(mob, dmg, crit) {
        const res = C.applyHit(mob.hp, dmg);
        mob.hp = res.hp;
        session.lastDamage = dmg;
        session.lastCrit = !!crit;
        MOBS.spawnDamageText(engine.scene, session.fx, mob, dmg, crit);
        spawnCombatHitFx(mob, { correct: !!crit });
        flashMesh(mob.mesh);
        mob.hurtFlash = 0.1;
        if (mob.kind === 'spider') mob.provoked = true;
        if (C.thornTouch && C.thornTouch(mob.kind, { melee: true }) && engine && engine.player) {
            const p = engine.player;
            const hit = C.applyContact({ hp: p.hp, lastHitAt: session.lastHitAt }, { contact: 1 }, nowMs());
            if (hit.hit) {
                p.hp = hit.hp;
                session.lastHitAt = hit.lastHitAt;
                hurtFlash();
                if (sfx && sfx.hurt) sfx.hurt();
                toast('守卫者刺到了你！HP ' + Math.ceil(p.hp));
                if (p.hp <= 0) respawn();
            }
        }
        if (C.signatureOf && !mob.isBoss) {
            const sig = C.signatureOf(mob.kind);
            if (sig.onHurt === 'blink') blinkMob(mob);
        }
        if (mob.model) mob.model.setHp(mob.hp / (mob.maxHp || 1), true);
        if (res.dead) {
            if (mob.peaceful) killAnimal(mob);
            else killMonster(mob);
        }
        playCombatHit(crit);
        paintCastHud();
    }

    function killMonster(mob) {
        mob.hp = 0;
        const spec = C.monsterOf(mob.kind);
        const burst = C.deathBurstOf ? C.deathBurstOf(mob.kind) : { count: 12, ring: false, color: spec.color };
        MOBS.spawnBurst(engine.scene, session.fx, mob.x, mob.y, mob.z, burst.color, burst.count);
        if (burst.ring) spawnBossRing(mob, { color: burst.color, radius: 1.1, grow: 2.8 });
        if (mob.mesh && MOBS.beginDeath) MOBS.beginDeath(engine.scene, session.fx, mob.mesh);
        else if (mob.mesh) engine.scene.remove(mob.mesh);
        session.monsters = session.monsters.filter(function (m) { return m !== mob; });
        const split = C.splitChildOf ? C.splitChildOf(mob.kind, mob.gen || 0) : null;
        if (split && !mob.isBoss) {
            for (let i = 0; i < split.count; i += 1) {
                spawnMonster(split.kind, mob.x + (i ? 0.55 : -0.55), mob.z + (i ? -0.4 : 0.4), {
                    gen: split.gen,
                    hp: Math.max(6, Math.round(spec.hp * split.hpScale)),
                    scale: split.size,
                    coins: 1
                });
            }
        }
        spawnPickup(mob.x, mob.z, mob.coins, mob.loot);
        const extra = C.bonusBuildDrop && C.bonusBuildDrop(mob.kind);
        if (extra) spawnPickup(mob.x + 0.35, mob.z, 0, extra);
        paintCastHud();
        noteQuest({ type: 'kill', kind: mob.kind, quizCorrect: !!mob.asked });
        if (!session.boss && session.monsters.length === 0) {
            if (session.wavesLeft > 0) spawnWave();
            else if (session.secretRun) finishLevel();
            else spawnBoss();
        }
    }

    function killAnimal(mob) {
        mob.hp = 0;
        if (mob.mesh && MOBS.beginDeath) MOBS.beginDeath(engine.scene, session.fx, mob.mesh);
        else if (mob.mesh) engine.scene.remove(mob.mesh);
        if (engine.world && engine.world.animals) {
            engine.world.animals = engine.world.animals.filter(function (a) { return a !== mob; });
        }
        const drops = (C.animalLoot && C.animalLoot(mob.kind)) || [mob.loot];
        spawnPickup(mob.x, mob.z, mob.coins || 0, drops[0]);
        for (let i = 1; i < drops.length; i += 1) {
            spawnPickup(mob.x + 0.3 * i, mob.z, 0, drops[i]);
        }
        paintCastHud();
        noteQuest({ type: 'kill', kind: mob.kind, quizCorrect: !!mob.asked });
    }

    function killBoss(mob) {
        MOBS.spawnBurst(engine.scene, session.fx, mob.x, mob.y, mob.z, 0x8a5ca0, 26);
        MOBS.spawnBurst(engine.scene, session.fx, mob.x, mob.y + 1, mob.z, 0xf0d890, 14);
        if (mob.mesh && MOBS.beginDeath) MOBS.beginDeath(engine.scene, session.fx, mob.mesh);
        else if (mob.mesh) engine.scene.remove(mob.mesh);
        session.monsters = session.monsters.filter(function (m) { return m !== mob; });
        spawnPickup(mob.x, mob.z, 20, 'cube-shard');
        spawnSettleFlag(mob.x, mob.z);
    }

    function finishLevel() {
        const reviewing = !!(session.reviewRun && RS);
        const secret = !!session.secretRun;
        const tier = session.tier || 'default';
        if (!reviewing && !secret && progress.clearedLevels.indexOf(session.level) === -1) {
            progress.clearedLevels.push(session.level);
        }
        if (D && !reviewing && !secret) {
            progress.clearedTiers = D.markClearedTier(progress.clearedTiers, session.level, tier);
        }
        const minutes = Math.max(1, Math.round((nowMs() - (session.levelStartedAt || nowMs())) / 60000));
        if (WM) {
            progress.stats.sessionDensity = WM.pushSessionDensity(progress.stats.sessionDensity, {
                asked: session.askedCount || 0,
                minutes: minutes
            });
        }
        let sun = L.SUN_PER_LEVEL;
        let capped = false;
        if (secret && D) {
            const earned = Math.max(0, (Number(session.coins) || 0) - (Number(session.reviewCoinsStart) || 0));
            session.coins = (Number(session.reviewCoinsStart) || 0) + D.tierCoins(earned, 'apocalypse');
            if (bridge && bridge.awardSunlight) {
                const res = bridge.awardSunlight({
                    gameId: GAME_ID,
                    eventKey: 'bl-secret-1',
                    amount: L.SUN_PER_LEVEL,
                    reason: '我的方块学园词灵回廊'
                });
                sun = res && res.awarded === false ? 0 : (res && res.amount) || L.SUN_PER_LEVEL;
                capped = !!(res && res.awarded === false);
            }
            if (!capped && !progress.secretLooted) {
                session.bag = C.addLoot(session.bag, 'diamond', 1);
                progress.secretLooted = 1;
            }
        } else if (reviewing) {
            const earned = Math.max(0, (Number(session.coins) || 0) - (Number(session.reviewCoinsStart) || 0));
            session.coins = (Number(session.reviewCoinsStart) || 0) + RS.reviewCoins(earned);
            if (bridge && bridge.awardSunlight) {
                const res = bridge.awardSunlight({
                    gameId: GAME_ID,
                    eventKey: RS.reviewSunlightKey(session.level, session.reviewRun.round),
                    amount: Math.max(1, Math.floor(L.SUN_PER_LEVEL / 2)),
                    reason: '我的方块学园复习第' + session.level + '关第' + (session.reviewRun.round + 1) + '轮'
                });
                sun = res && res.awarded === false ? 0 : (res && res.amount) || Math.max(1, Math.floor(L.SUN_PER_LEVEL / 2));
                capped = !!(res && res.awarded === false);
            } else {
                sun = Math.max(1, Math.floor(L.SUN_PER_LEVEL / 2));
            }
            RS.advanceAfterReview(progress, session.level, nowIso());
        } else if (bridge && bridge.awardSunlight) {
            const key = D ? D.tierSunlightKey(tier, session.level) : L.eventKey(session.level);
            const res = bridge.awardSunlight({
                gameId: GAME_ID,
                eventKey: key,
                amount: L.SUN_PER_LEVEL,
                reason: '我的方块学园通关第' + session.level + '关' + (tier === 'default' ? '' : ('·' + (D.tierOf(tier).label || tier)))
            });
            sun = res && res.awarded === false ? 0 : (res && res.amount) || L.SUN_PER_LEVEL;
            capped = !!(res && res.awarded === false);
        }
        const reviewWords = sessionMissed();
        progress.reviewWords = reviewWords;
        if (!reviewing && RS && RS.stampFirstClear) {
            RS.stampFirstClear(progress, session.level, nowIso());
        }
        session.reviewRun = null;
        session.secretRun = false;
        if (!reviewing) progress.campChest = Math.max(Number(progress.campChest) || 0, 20);
        stampPlayDate();
        persist();
        const lines = L.buildSettlement({
            level: session.level,
            sunAwarded: sun,
            sunCapped: capped,
            newWords: session.wordCorrect || 0,
            reviewWords: reviewWords
        });
        const settleTitle = document.querySelector('#settle-layer h2');
        if (settleTitle) settleTitle.textContent = secret ? '词灵回廊完成' : (reviewing ? '复习完成' : '通关啦');
        document.getElementById('settle-gain').textContent = lines.gain;
        document.getElementById('settle-progress').textContent = lines.progressLabel;
        document.getElementById('settle-next').textContent = reviewing ? '这扇门下次到期才会再亮' : lines.nextGoal;
        const densityEl = document.getElementById('settle-density');
        if (densityEl && WM) {
            densityEl.textContent = WM.densityLine({ asked: session.askedCount || 0, minutes: minutes });
        }
        const tierEl = document.getElementById('settle-tier');
        if (tierEl) {
            const lab = secret ? '词灵回廊' : ((D && D.tierOf(tier).label) || '默认');
            tierEl.textContent = '本局档位 · ' + lab + (sun ? (capped ? ' · 阳光已领过' : ' · 阳光 +' + sun) : '');
        }
        const next = session.level + 1;
        const unlockState = { unlockedLevel: progress.unlockedLevel, coined: session.coins, recallWords: recallWordCount() };
        const can = L.tryUnlock(unlockState, next);
        const unlockBtn = document.getElementById('unlock-btn');
        unlockBtn.style.display = next <= L.LEVEL_TOTAL ? '' : 'none';
        unlockBtn.disabled = !can.ok && next > progress.unlockedLevel;
        const listPrice = L.UNLOCK_COST[next - 1] || 0;
        const paid = listPrice && can.ok ? (session.coins - can.coined) : listPrice;
        unlockBtn.textContent = next <= progress.unlockedLevel
            ? '进入下一关'
            : ('解锁第 ' + next + ' 关（' + paid + ' 金币）');
        toggleLayer('settle-layer', true);
        if (sfx && sfx.levelClear) sfx.levelClear();
        else if (sfx && sfx.clear) sfx.clear();
    }

    function unlockNext() {
        const next = session.level + 1;
        if (next > L.LEVEL_TOTAL) return;
        if (next > progress.unlockedLevel) {
            const res = L.tryUnlock({
                unlockedLevel: progress.unlockedLevel,
                coined: session.coins,
                recallWords: recallWordCount()
            }, next);
            if (!res.ok) {
                toast('金币不够，先打怪或去商人那儿卖战利品。');
                return;
            }
            progress.unlockedLevel = res.unlockedLevel;
            session.coins = res.coined;
            persist();
        }
        toggleLayer('settle-layer', false);
        startHub();
        toast(next <= L.LEVEL_TOTAL ? ('第 ' + next + ' 关的门开了 · 回营地找传送门') : '全部关卡都打完啦');
    }

    function spawnPickup(x, z, coins, loot) {
        const y = engine.world.surfaceAt(Math.floor(x), Math.floor(z)) + 0.35;
        const mesh = DROP_COLOR[loot]
            ? new THREE.Mesh(
                new THREE.BoxGeometry(0.28, 0.28, 0.28),
                new THREE.MeshLambertMaterial({ color: DROP_COLOR[loot] })
            )
            : MOBS.coinMesh();
        mesh.position.set(x, y, z);
        engine.scene.add(mesh);
        session.pickups.push({ x: x, z: z, y: y, coins: coins || 0, loot: loot, mesh: mesh, bob: Math.random() * 6.28 });
    }

    function flashMesh(mesh) {
        if (!mesh) return;
        mesh.traverse(function (n) {
            if (n.material && n.material.emissive) {
                n.material.emissive.setHex(0xffffff);
                setTimeout(function () { if (n.material) n.material.emissive.setHex(0x000000); }, 80);
            }
        });
    }

    function popDamage(amount, crit, mob) {
        if (mob) MOBS.spawnDamageText(engine.scene, session.fx, mob, amount, crit);
    }

    function speakLangOf(word) {
        if (!word) return 'en-US';
        if (word.lang) return word.lang;
        if (word.side && word.side.lang) return word.side.lang;
        return 'en-US';
    }

    function speakTextOf(word) {
        if (word && word.side && word.side.speak) return word.side.speak;
        return word && word.text;
    }

    function speakWord(word) {
        if (!word) return;
        if (session.speakTimer) {
            clearTimeout(session.speakTimer);
            session.speakTimer = 0;
        }
        const spoken = { text: speakTextOf(word) || word.text };
        const lang = speakLangOf(word);
        const queue = W.speakQueue ? W.speakQueue(spoken) : [{ text: spoken.text, delayMs: 0 }];
        const first = queue[0];
        if (!first) return;
        const rest = queue.slice(1);
        function speakRest() {
            rest.forEach(function (item) {
                session.speakTimer = setTimeout(function () {
                    speakFallback(item.text, lang);
                }, item.delayMs || 900);
            });
        }
        const src = word.media && word.media.audio;
        if (src) {
            const href = (/^(https?:|\/|\.)/.test(src)) ? src : '../../' + src;
            const audio = new Audio(href);
            audio.addEventListener('ended', speakRest);
            const p = audio.play();
            if (p && p.catch) p.catch(function () {
                speakFallback(first.text, lang);
                speakRest();
            });
            return;
        }
        speakFallback(first.text, lang);
        speakRest();
    }

    function speakFallback(text, lang) {
        try {
            if (!window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = lang || 'en-US';
            window.speechSynthesis.speak(u);
        } catch (e) { /* 静音不阻塞 */ }
    }

    function escapeHtml(s) {
        return String(s || '').replace(/[&<>"']/g, function (ch) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
        });
    }

    function paintSegments(el, segments, fallback) {
        if (!el) return;
        if (!segments || !segments.length) {
            el.textContent = fallback || '';
            return;
        }
        el.innerHTML = segments.map(function (seg) {
            const t = escapeHtml(seg.text);
            return seg.isMatched ? ('<em class="bl-hit">' + t + '</em>') : t;
        }).join('');
    }

    function paintHeard(text, ev) {
        const el = document.getElementById('heard-text');
        if (el) {
            if (ev && ev.transcriptSegments && ev.transcriptSegments.length && text && text !== '…') {
                el.innerHTML = '"' + ev.transcriptSegments.map(function (seg) {
                    const t = escapeHtml(seg.text);
                    return seg.isMatched ? ('<em class="bl-hit">' + t + '</em>') : t;
                }).join('') + '"';
            } else {
                el.textContent = text ? ('"' + text + '"') : '""';
            }
        }
        const quizHeard = document.getElementById('quiz-heard');
        if (quizHeard) {
            if (text === '…') quizHeard.textContent = '正在听…';
            else quizHeard.textContent = text ? ('听到：' + text) : '';
            quizHeard.classList.toggle('is-hidden', !text);
        }
        if (text && text !== '…') session.lastHeard = text;
        if (ev) session.lastSpeechEval = ev;
    }

    function readBuddyConfig() {
        if (!BU || !BU.resolveBuddyConfig) return { enabled: false };
        const q = {};
        try {
            const usp = new URLSearchParams(window.location.search);
            q.buddyEndpoint = usp.get('buddyEndpoint') || '';
            q.buddyModel = usp.get('buddyModel') || '';
            q.buddyTts = usp.get('buddyTts') || '';
            q.buddyStt = usp.get('buddyStt') || '';
        } catch (e) { /* ignore */ }
        return BU.resolveBuddyConfig({ query: q, window: window });
    }

    function fieldVal(id) {
        const el = document.getElementById(id);
        return el ? String(el.value || '').trim() : '';
    }

    function setField(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = value == null ? '' : String(value);
    }

    function paintBuddyHint() {
        const el = document.getElementById('buddy-hint');
        if (!el) return;
        const rec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const android = /Android/i.test(navigator.userAgent || '');
        const on = session.buddyConfig && session.buddyConfig.enabled;
        const native = !!capacitorSpeech();
        const bits = [
            on ? 'Model on this session.' : 'Template buddy. Paste a model URL to upgrade.',
            android
                ? (native || rec
                    ? 'Mic ready. Tap 说出来 or V.'
                    : 'Android WebView usually has no speech. Type with G. 127.0.0.1 is this phone.')
                : (rec ? 'Mic ready. Hold G to talk.' : 'No speech API. Type with G.')
        ];
        el.textContent = bits.join(' ');
    }

    function maybeShowBuddyGate() {
        const search = window.location.search || '';
        if (BU && BU.shouldSkipBuddyGate && BU.shouldSkipBuddyGate(search)) {
            toggleLayer('buddy-gate', false);
            ensureLevelStarted();
            return;
        }
        toggleLayer('buddy-gate', true);
    }

    function showBuddyGate() {
        toggleLayer('buddy-layer', false);
        toggleLayer('buddy-gate', true);
    }

    function syncPlayControls() {
        const root = document.getElementById('touch-pad');
        if (wantTouchPad()) {
            bindTouchPad();
            return;
        }
        if (root) root.hidden = true;
        document.body.classList.remove('is-touch');
        if (engine && engine.setMoveAxis) engine.setMoveAxis(0, 0);
        if (engine && engine.setHeld) {
            ['fwd', 'back', 'left', 'right', 'jump'].forEach(function (dir) {
                engine.setHeld(dir, false);
            });
        }
    }

    function choosePlayMode(pick) {
        const plan = BU && BU.applyPlayMode ? BU.applyPlayMode(pick) : {
            mode: 'desktop', pad: false, lockLook: true, label: '电脑模式 · 键鼠'
        };
        session.playMode = plan.mode;
        toggleLayer('buddy-gate', false);
        if (engine && engine.setLookLock) engine.setLookLock(!!plan.lockLook);
        syncPlayControls();
        ensureLevelStarted();
        startTheme();
        toast(plan.label);
    }

    function chooseBuddy(pick) {
        const plan = BU && BU.applyBuddyPick ? BU.applyBuddyPick(pick) : {
            pick: 'play', typeOnly: false, openForm: false, clearModel: true
        };
        session.buddyPick = plan.pick;
        session.buddyTypeOnly = !!plan.typeOnly;
        if (plan.clearModel) {
            window.BLOCKLEGEND_BUDDY = {};
            session.buddyConfig = readBuddyConfig();
        }
        toggleLayer('buddy-gate', false);
        ensureLevelStarted();
        startTheme();
        if (plan.openForm) {
            openBuddySettings();
            return;
        }
        toast(plan.typeOnly ? '只打字 · Type only' : '先玩 · Template buddy');
    }

    function openBuddySettings() {
        const cfg = session.buddyConfig || readBuddyConfig();
        const pasted = (window.BLOCKLEGEND_BUDDY) || {};
        setField('buddy-endpoint', cfg.endpoint || '');
        setField('buddy-model', cfg.model || (BU && BU.DEFAULT_MODEL) || 'llama3.2:3b');
        setField('buddy-api-key', pasted.apiKey || cfg.apiKey || '');
        setField('buddy-tts', cfg.ttsUrl || '');
        setField('buddy-stt', cfg.sttUrl || '');
        paintBuddyHint();
        toggleLayer('buddy-layer', true);
    }

    function applyBuddySettings() {
        window.BLOCKLEGEND_BUDDY = {
            endpoint: fieldVal('buddy-endpoint'),
            model: fieldVal('buddy-model') || (BU && BU.DEFAULT_MODEL) || 'llama3.2:3b',
            apiKey: fieldVal('buddy-api-key'),
            ttsUrl: fieldVal('buddy-tts'),
            sttUrl: fieldVal('buddy-stt')
        };
        session.buddyPick = 'home';
        session.buddyTypeOnly = false;
        session.buddyConfig = readBuddyConfig();
        paintBuddyHint();
        toggleLayer('buddy-layer', false);
        startTheme();
        toast(session.buddyConfig.enabled ? '已连家里电脑' : '没填地址，先玩模板');
    }

    function clearBuddySettings() {
        window.BLOCKLEGEND_BUDDY = {};
        setField('buddy-endpoint', '');
        setField('buddy-api-key', '');
        setField('buddy-tts', '');
        setField('buddy-stt', '');
        setField('buddy-model', (BU && BU.DEFAULT_MODEL) || 'llama3.2:3b');
        session.buddyPick = 'play';
        session.buddyTypeOnly = false;
        session.buddyConfig = readBuddyConfig();
        paintBuddyHint();
        toggleLayer('buddy-layer', false);
        toast('先玩 · Template buddy');
    }

    function collectSnapshot() {
        const sub = lookSubject();
        const word = sub && (sub.word || (sub.mob && sub.mob.word));
        return {
            look: sub ? {
                type: sub.type,
                kind: sub.kind,
                word: word && (word.text || word.en || word)
            } : null,
            doing: session.casting ? 'type'
                : (session.voice && session.voice.buddy ? 'talk'
                    : (session.nearMerchant ? 'walk-merchant' : 'look')),
            heard: session.lastHeard || '',
            unread: W.unreadSpeakCount
                ? W.unreadSpeakCount(progress.shownWordIds || [], progress.spokenWordIds || [])
                : 0,
            shield: session.boss ? session.boss.state : '',
            nearMerchant: !!session.nearMerchant,
            lastCueAt: session.buddyAt || 0,
            now: nowMs()
        };
    }

    function maybeBuddyCue(extra) {
        if (!BU || !BU.decideCue) return;
        const snap = Object.assign(collectSnapshot(), extra || {});
        const key = [
            snap.look && snap.look.word,
            snap.doing,
            snap.heard,
            snap.shield,
            extra && extra.heardHit ? 'hit' : ''
        ].join('|');
        if (key === session.buddyKey && !(extra && extra.force)) return;
        session.buddyKey = key;
        const cue = BU.decideCue(snap);
        if (!cue || cue.kind === 'silent') return;
        session.buddyAt = snap.now;
        showBuddy(cue.say);
    }

    function showBuddy(text) {
        const el = document.getElementById('buddy-say');
        if (el) {
            el.textContent = text || '';
            el.classList.toggle('is-on', !!text);
            clearTimeout(showBuddy._t);
            if (text) showBuddy._t = setTimeout(function () { el.classList.remove('is-on'); }, 3200);
        }
        speakBuddy(text);
    }

    function speakBuddy(text) {
        if (!BU || !BU.planSpeak || !text) return;
        const plan = BU.planSpeak(text, {
            voices: window.speechSynthesis ? window.speechSynthesis.getVoices() : [],
            ttsUrl: session.buddyConfig && session.buddyConfig.ttsUrl
        });
        if (plan.method === 'edge-tts') {
            fetch(plan.url, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ text: plan.text, voice: plan.voice })
            }).then(function (res) {
                if (!res.ok) throw new Error('tts');
                return res.blob();
            }).then(function (blob) {
                const audio = new Audio(URL.createObjectURL(blob));
                audio.play();
            }).catch(function () {
                speakSynth(plan.text, plan.voice);
            });
            return;
        }
        if (plan.method === 'speechSynthesis') speakSynth(plan.text, plan.voice);
    }

    function speakSynth(text, voiceName) {
        if (!window.speechSynthesis) return;
        try {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'en-US';
            const voices = window.speechSynthesis.getVoices() || [];
            const picked = voices.filter(function (v) { return v.name === voiceName; })[0]
                || (BU && BU.pickTtsVoice ? BU.pickTtsVoice(voices) : null);
            if (picked) u.voice = picked;
            window.speechSynthesis.speak(u);
        } catch (e) { /* 静音不阻塞 */ }
    }

    function showBuddyType(on) {
        const form = document.getElementById('buddy-type');
        if (!form) return;
        form.classList.toggle('is-hidden', !on);
        const input = document.getElementById('buddy-input');
        if (on) {
            if (input) setTimeout(function () { input.focus(); }, 30);
        } else if (input) {
            input.blur();
        }
    }

    function startBuddyListen() {
        const sub = lookSubject();
        const word = sub && sub.mob && sub.mob.word;
        session.voice.buddy = true;
        session.voice.lock = word ? {
            mob: sub.mob,
            word: word,
            targetKey: wordKey(word),
            startedAt: nowMs()
        } : null;
        if (session.buddyTypeOnly || (!canListen())) {
            setVoiceState('unsupported');
            showBuddyType(true);
            return;
        }
        listenOnce({ lock: session.voice.lock, buddy: true });
    }

    function askBuddyModel(heard, snap) {
        const req = BU.buildChatRequest({
            snapshot: snap,
            heard: heard,
            config: session.buddyConfig || {}
        });
        const ctrl = new AbortController();
        const timer = setTimeout(function () { ctrl.abort(); }, 2000);
        return fetch(req.url, {
            method: 'POST',
            headers: req.headers,
            body: JSON.stringify(req.body),
            signal: ctrl.signal
        }).then(function (res) {
            return res.json();
        }).then(function (json) {
            return BU.parseChatReply(json);
        }).finally(function () {
            clearTimeout(timer);
        });
    }

    function handleBuddyHeard(heard, lock) {
        paintHeard(heard);
        const snap = collectSnapshot();
        const ask = session.buddyConfig && session.buddyConfig.enabled
            ? function () { return askBuddyModel(heard, snap); }
            : null;
        BU.runBuddyTurn({
            heard: heard,
            snapshot: snap,
            matchHeard: SP && SP.matchHeard,
            askModel: ask,
            speak: showBuddy
        }).then(function (turn) {
            if (turn && turn.hit && lock && lock.mob) applySpeakHit(lock, heard);
        });
    }

    function setVoiceState(state) {
        if (!session.voice) session.voice = { state: 'idle', rec: null, lock: null, blocked: false };
        session.voice.state = state;
        const box = document.getElementById('heard-box');
        if (box) box.classList.toggle('is-listening', state === 'listening');
    }

    function stopVoiceRec() {
        const rec = session.voice && session.voice.rec;
        if (rec) {
            try { rec.abort(); } catch (e) { /* ignore */ }
            session.voice.rec = null;
        }
        const SR = capacitorSpeech();
        if (SR && SR.stop) {
            try { SR.stop(); } catch (e) { /* ignore */ }
        }
        if (session.voice && session.voice.state === 'listening') setVoiceState('idle');
    }

    function voiceLockAlive(lock) {
        if (lock && lock.look) {
            const sub = lookSubject();
            return !!(sub && sub.kind === lock.kind);
        }
        const mob = lock && lock.mob;
        if (!mob || mob.hp <= 0) return false;
        if (wordKey(mob.word) !== lock.targetKey) return false;
        const dist = Math.hypot(mob.x - engine.player.x, mob.z - engine.player.z);
        return dist <= 18;
    }

    function startVoiceChallenge() {
        const sub = lookSubject();
        if (isVillageLook(sub)) {
            const word = villageLookWord(sub);
            const lock = {
                look: sub,
                kind: sub.kind,
                word: word,
                targetKey: wordKey(word),
                startedAt: nowMs()
            };
            session.voice.lock = lock;
            if (session.buddyTypeOnly || session.voice.blocked || !canListen()) {
                setVoiceState('unsupported');
                showVoiceFallback(lock, { reason: 'unsupported' });
                return;
            }
            listenOnce({ lock: lock });
            return;
        }
        if (!sub || sub.type !== 'mob' || !sub.mob || !sub.mob.word || !sub.mob.word.text) {
            toast('先对准怪物或村民');
            return;
        }
        const lock = {
            mob: sub.mob,
            word: sub.mob.word,
            targetKey: wordKey(sub.mob.word),
            startedAt: nowMs()
        };
        session.voice.lock = lock;
        if (session.buddyTypeOnly || session.voice.blocked || !canListen()) {
            setVoiceState('unsupported');
            showVoiceFallback(lock, { reason: 'unsupported' });
            return;
        }
        listenOnce({ lock: lock });
    }

    function applySpeakHit(lock, heard) {
        if (lock && lock.look) {
            if (!voiceLockAlive(lock)) {
                setVoiceState('idle');
                toast('目标已离开');
                return;
            }
            applyVillageSpeak(lock, heard);
            return;
        }
        const mob = lock && lock.mob;
        const word = lock && lock.word;
        if (!voiceLockAlive(lock)) {
            setVoiceState('idle');
            toast('目标已离开');
            return;
        }
        noteWordSpoken(word);
        if (mob.isBoss && session.boss) {
            chipBossShield('speak', 2);
        }
        mob.voiceFails = 0;
        mob.asked = true;
        mob.lastQuizWrong = false;
        mob.quizPassed = !(mob.isBoss && session.boss && session.boss.state === 'shielded');
        session.combo = C.nextCombo({ answered: true, correct: true, combo: session.combo });
        applyResolvedHit(mob, 'melee', { answered: true, correct: true, channel: 'speak' });
        hideVoiceFallback();
        setVoiceState('matched');
        toast((heard || (word && word.text) || '') + ' · 暴击');
        maybeBuddyCue({ doing: 'speak-hit', heardHit: true, force: true });
    }

    function showVoiceFallback(lock, opts) {
        const o = opts || {};
        const box = document.getElementById('voice-fallback');
        const list = document.getElementById('voice-fallback-choices');
        const kick = document.getElementById('voice-fallback-kicker');
        if (!box || !list || !lock || !lock.word) return;
        session.voice.lock = lock;
        const quiz = W.makeQuiz(lock.word, pool.length ? pool : bank, { mode: 'choice' });
        session.voice.choices = (quiz && quiz.choices) || [];
        list.innerHTML = '';
        session.voice.choices.forEach(function (zh, i) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('data-voice-choice', String(i));
            btn.textContent = (i + 1) + ' ' + zh;
            list.appendChild(btn);
        });
        if (kick) {
            kick.textContent = o.reason === 'unsupported'
                ? '没有麦克风 · 点中文或按 T'
                : '选中文 · 世界不停';
        }
        box.classList.remove('is-hidden');
        session.paused = false;
        if (engine && engine.setUiMode) engine.setUiMode(false);
    }

    function hideVoiceFallback() {
        const box = document.getElementById('voice-fallback');
        if (box) box.classList.add('is-hidden');
        if (session.voice) session.voice.choices = null;
    }

    function resolveVoiceFallback(index) {
        const lock = session.voice && session.voice.lock;
        const choices = (session.voice && session.voice.choices) || [];
        const picked = choices[index];
        if (!lock || picked == null) return;
        const ok = String(picked) === String(lock.word.zh);
        hideVoiceFallback();
        if (!voiceLockAlive(lock)) {
            toast('目标已离开');
            return;
        }
        if (ok) {
            if (lock.mob && lock.mob.isBoss && session.boss && L.canChipShield
                && !L.canChipShield(session.boss.mechanic, 'speak')) {
                toast('没有麦克风 · 按 T 拼出来破罩');
                return;
            }
            applySpeakHit(lock, lock.word.text);
        } else {
            toast('再按 V 或按 T 打字');
        }
    }

    function hasWebSpeech() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }

    function hasGatewayStt() {
        return !!(session.buddyConfig && session.buddyConfig.sttUrl);
    }

    function capacitorSpeech() {
        try {
            const cap = window.Capacitor;
            if (!cap) return null;
            const plugins = cap.Plugins || {};
            return plugins.SpeechRecognition || cap.SpeechRecognition || null;
        } catch (e) {
            return null;
        }
    }

    function canListen() {
        return hasWebSpeech() || !!capacitorSpeech() || hasGatewayStt();
    }

    function voiceHoldQuiz() {
        const holding = !!(session.voice && session.voice.state === 'listening');
        if (holding && session.quiz && session.quizEndsAt) {
            const minEnd = nowMs() + 6500;
            if (session.quizEndsAt < minEnd) session.quizEndsAt = minEnd;
        }
        return holding;
    }

    function heardMatchOpts(lock) {
        const word = (lock && lock.word) || (session.quiz && session.quiz.word) || null;
        return { zh: word && word.zh };
    }

    function heardHits(target, heard, lock) {
        return !!(SP && SP.matchHeard && SP.matchHeard(target, heard, heardMatchOpts(lock)).ok);
    }

    function finishListen(heard, o, lock, inQuiz, target) {
        paintHeard(heard);
        if (o.scene) {
            handleSceneHeard(heard);
            return;
        }
        const hit = heardHits(target, heard, lock);
        if (o.buddy) {
            setVoiceState(hit ? 'matched' : 'not-matched');
            handleBuddyHeard(heard, lock);
            return;
        }
        if (hit) {
            if (inQuiz) {
                if (!(session.quiz.word && session.quiz.word.side)) noteWordSpoken(session.quiz.word);
                resolveQuiz(true, { record: true, crit: true, comboKeep: true, channel: 'speak' });
                setVoiceState('matched');
            } else {
                applySpeakHit(lock, heard || target);
            }
            return;
        }
        setVoiceState('not-matched');
        if (lock && lock.mob) lock.mob.voiceFails = (Number(lock.mob.voiceFails) || 0) + 1;
        if (lock && W.shouldAsk({ voiceFails: lock.mob && lock.mob.voiceFails })) {
            showVoiceFallback(lock, { reason: 'not-matched' });
            return;
        }
        toast('没听清，再按 V');
    }

    function listenViaGateway(opts) {
        const o = opts || {};
        const lock = o.lock || (session.voice && session.voice.lock);
        const inQuiz = !!(session.quiz && session.pending);
        const target = (lock && lock.word && lock.word.text)
            || (session.quiz && session.quiz.word && session.quiz.word.text)
            || '';
        const url = session.buddyConfig && session.buddyConfig.sttUrl;
        if (!url || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setVoiceState('unsupported');
            if (o.buddy) showBuddyType(true);
            else if (lock) showVoiceFallback(lock, { reason: 'unsupported' });
            return;
        }
        setVoiceState('listening');
        voiceHoldQuiz();
        paintHeard('…');
        toast(o.buddy ? '跟陪玩说英语' : ('说：' + target));
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
            const rec = new MediaRecorder(stream);
            const chunks = [];
            rec.ondataavailable = function (ev) {
                if (ev.data && ev.data.size) chunks.push(ev.data);
            };
            rec.onstop = function () {
                stream.getTracks().forEach(function (t) { t.stop(); });
                const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
                fetch(url, {
                    method: 'POST',
                    headers: { 'x-prompt': String(target || '').slice(0, 80) },
                    body: blob
                }).then(function (res) {
                    if (!res.ok) throw new Error('stt');
                    return res.json();
                }).then(function (json) {
                    finishListen(String((json && json.text) || '').trim(), o, lock, inQuiz, target);
                }).catch(function () {
                    setVoiceState('unsupported');
                    if (o.buddy) showBuddyType(true);
                    else if (lock) showVoiceFallback(lock, { reason: 'unsupported' });
                    else toast('没听清，按 T 打字');
                });
            };
            rec.start();
            setTimeout(function () {
                try { rec.stop(); } catch (e) { /* ignore */ }
            }, 2500);
        }).catch(function () {
            session.voice.blocked = true;
            setVoiceState('mic-blocked');
            if (o.buddy) showBuddyType(true);
            else if (lock) showVoiceFallback(lock, { reason: 'unsupported' });
            toast('没有麦克风权限，点中文或按 T');
        });
    }

    function listenOnce(opts) {
        const o = opts || {};
        const lock = o.lock || (session.voice && session.voice.lock);
        const inQuiz = !!(session.quiz && session.pending);
        const target = (lock && lock.word && lock.word.text)
            || (session.quiz && session.quiz.word && session.quiz.word.text)
            || '';
        if (inQuiz && session.quiz.word && session.quiz.word.side
            && !(P && P.canSpeakSide && P.canSpeakSide(session.quiz.word.side))) {
            return;
        }
        if (!target && !o.buddy && !o.scene) return;
        if (o.scene && !canListen() && SL && session.sceneLoop && SL.onRecordFail) {
            session.sceneLoop = SL.onRecordFail(session.sceneLoop);
            paintScene();
            return;
        }
        if (session.voice && session.voice.rec) stopVoiceRec();
        try {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
        } catch (e) { /* ignore */ }
        const quizInput = document.getElementById('quiz-input');
        if (quizInput) quizInput.blur();
        if (hasGatewayStt()) {
            listenViaGateway(o);
            return;
        }
        if (capacitorSpeech()) {
            listenViaNative(o, lock, inQuiz, target);
            return;
        }
        listenViaWeb(o, lock, inQuiz, target);
    }

    function listenViaNative(o, lock, inQuiz, target) {
        const SR = capacitorSpeech();
        if (!SR || !SR.start) {
            listenViaWeb(o, lock, inQuiz, target);
            return;
        }
        setVoiceState('listening');
        voiceHoldQuiz();
        paintHeard('…');
        toast(o.buddy ? '跟陪玩说英语' : ('说：' + target));
        const begin = function () {
            return SR.start({
                language: 'en-US',
                maxResults: 5,
                partialResults: false,
                popup: false
            });
        };
        const go = SR.requestPermissions ? SR.requestPermissions() : Promise.resolve({});
        go.then(function (perm) {
            const status = perm && (perm.speechRecognition || perm.record_audio || perm.granted);
            if (status === 'denied') {
                const err = new Error('not-allowed');
                err.error = 'not-allowed';
                throw err;
            }
            return begin();
        }).then(function (res) {
            const matches = (res && (res.matches || res.results)) || [];
            const alts = Array.isArray(matches) ? matches.map(String) : [];
            const heard = alts[0] || '';
            const hitLine = alts.filter(function (line) { return heardHits(target, line, lock); })[0];
            finishListen(hitLine || heard, o, lock, inQuiz, target);
        }).catch(function (err) {
            const msg = String((err && (err.error || err.message)) || '');
            if (/not-allowed|denied|permission/i.test(msg)) {
                session.voice.blocked = true;
                setVoiceState('mic-blocked');
                if (lock) showVoiceFallback(lock, { reason: 'unsupported' });
                toast('没有麦克风权限，点中文或按 T');
                return;
            }
            if (hasWebSpeech()) {
                listenViaWeb(o, lock, inQuiz, target);
                return;
            }
            setVoiceState('not-matched');
            toast('没听清，再按 V 或按 T 打字');
        });
    }

    function listenViaWeb(o, lock, inQuiz, target) {
        const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Rec) {
            setVoiceState('unsupported');
            if (o.buddy) showBuddyType(true);
            else if (lock) showVoiceFallback(lock, { reason: 'unsupported' });
            else toast('这台设备没有语音识别，请打字');
            return;
        }
        const rec = new Rec();
        rec.lang = 'en-US';
        rec.interimResults = false;
        rec.maxAlternatives = 5;
        session.voice.rec = rec;
        setVoiceState('listening');
        voiceHoldQuiz();
        let done = false;
        rec.onresult = function (ev) {
            if (done) return;
            const alts = [];
            const row = ev.results && ev.results[0];
            if (row) {
                for (let i = 0; i < row.length; i += 1) alts.push(row[i].transcript);
            }
            done = true;
            session.voice.rec = null;
            const heard = alts[0] || '';
            const hitLine = alts.filter(function (line) { return heardHits(target, line, lock); })[0];
            finishListen(hitLine || heard, o, lock, inQuiz, target);
        };
        rec.onerror = function (ev) {
            if (done) return;
            done = true;
            session.voice.rec = null;
            const err = ev && ev.error;
            if (err === 'not-allowed') {
                session.voice.blocked = true;
                setVoiceState('mic-blocked');
                if (lock) showVoiceFallback(lock, { reason: 'unsupported' });
                toast('没有麦克风权限，点中文或按 T');
                return;
            }
            if (err === 'no-speech') {
                if (!o._retried) {
                    listenOnce(Object.assign({}, o, { _retried: true, lock: lock }));
                    return;
                }
                setVoiceState('timeout');
                toast('没有听清');
                return;
            }
            if (hasGatewayStt() && err !== 'aborted') {
                listenViaGateway(o);
                return;
            }
            setVoiceState('not-matched');
            toast('没听清，再按 V 或按 T 打字');
        };
        rec.onend = function () {
            if (session.voice) session.voice.rec = null;
            if (session.voice && session.voice.state === 'listening') setVoiceState('idle');
        };
        try {
            rec.start();
            paintHeard('…');
            toast(o.buddy ? '跟陪玩说英语' : ('说：' + target));
        } catch (e) {
            session.voice.rec = null;
            setVoiceState('unsupported');
            if (lock) showVoiceFallback(lock, { reason: 'unsupported' });
            else toast('这台设备没有语音识别，请打字');
        }
    }

    function tick(dt) {
        const t = nowMs();
        // 渲染诊断（只读调试，供 E2E 排查）
        if (engine && engine.renderer && window.__blDebug) {
            const ri = engine.renderer.info.render;
            window.__blDebug.info = {
                calls: ri.calls,
                triangles: ri.triangles,
                sceneChildren: engine.scene.children.length,
                sceneGroups: engine.scene.children.filter(function (n) { return n.type === 'Group'; }).length
            };
        }
        if (session.quiz && t >= session.quizEndsAt && !voiceHoldQuiz()) resolveQuiz(false);
        if (session.quiz) {
            const left = Math.max(0, session.quizEndsAt - t);
            const bar = document.getElementById('quiz-timer');
            if (bar) bar.style.width = Math.round(left / ((session.quiz && session.quiz.limitMs) || W.QUIZ_MS) * 100) + '%';
        }
        if (session.boss) {
            session.boss = L.tickBoss(session.boss, t);
            paintBossShield();
            syncBossHud();
        }
        if (!session.paused) {
            stepMining(dt);
            tickTnt(dt);
            updateLookCard(t);
            moveMonsters(dt, t);
            tickMonsterSkills(t);
            tickVillageGolems(t, dt);
            tickBossCombat(t);
            moveBolts(dt);
            moveBossShots(dt);
            tickRideTrail(t);
            collectPickups();
            separateFromAnimals();
            regenOutOfCombat(dt);
        }
        MOBS.stepFx(engine.scene, session.fx, dt);
        if (session.merchant && session.merchant.model) {
            session.merchant.model.update(dt, false, t / 1000);
        }
        if (viewModel) {
            const inp = engine.input;
            const moving = !!(inp.fwd || inp.back || inp.left || inp.right);
            if (viewModel.setOffhand) viewModel.setOffhand((Number(session.bag.wood_shield) || 0) > 0);
            if (viewModel.setToolTiers) {
                viewModel.setToolTiers({
                    sword: toolTierOf('sword'),
                    axe: toolTierOf('axe'),
                    pickaxe: toolTierOf('pickaxe'),
                    shovel: toolTierOf('shovel')
                });
            } else if (viewModel.setBladeKind) {
                viewModel.setBladeKind(toolTierOf('sword'));
            }
            viewModel.update(dt, moving);
            if (viewModel.group) viewModel.group.visible = !engine.player.mounted;
        }
        updateMerchantTip();
        updateWordGate();
        updateHubPortal();
        updateGuideReach();
        syncHud();
        drawMinimap();
    }

    function setHotbar(n) {
        document.querySelectorAll('.bl-slot').forEach(function (el) {
            el.classList.toggle('is-on', el.getAttribute('data-key') === String(n));
        });
    }

    function drawMinimap() {
        const c = document.getElementById('mini-map');
        if (!c || !engine) return;
        const ctx = c.getContext('2d');
        const w = engine.world;
        const scale = c.width / w.size;
        ctx.fillStyle = '#3d8a38';
        ctx.fillRect(0, 0, c.width, c.height);
        for (let z = 0; z < w.size; z += 2) {
            for (let x = 0; x < w.size; x += 2) {
                const h = w.surfaceAt(x, z);
                ctx.fillStyle = 'rgb(' + (48 + h * 6) + ',' + (90 + h * 16) + ',' + (36 + h * 4) + ')';
                ctx.fillRect(x * scale, z * scale, scale * 2 + 0.4, scale * 2 + 0.4);
            }
        }
        (w.trees || []).forEach(function (t) {
            ctx.fillStyle = '#1c4a16';
            ctx.fillRect(t.x * scale, t.z * scale, 2.2, 2.2);
        });
        session.monsters.forEach(function (m) {
            if (m.hp <= 0) return;
            ctx.fillStyle = m.isBoss ? '#3d7dff' : '#e23ad0';
            ctx.fillRect(m.x * scale - 1.2, m.z * scale - 1.2, 3, 3);
        });
        (w.levelPortals || []).forEach(function (p) {
            ctx.fillStyle = p.state === 'locked' ? '#3a3a3a' : p.state === 'due' ? '#7ec8ff' : '#f4c542';
            ctx.fillRect(p.x * scale - 1.4, p.z * scale - 1.4, 3, 3);
        });
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(engine.player.x * scale, engine.player.z * scale, 2.2, 0, Math.PI * 2);
        ctx.fill();
        const mark = session.guideMark || currentGuideMark();
        if (mark) {
            const mx = mark.x * scale;
            const mz = mark.z * scale;
            const pulse = 11 + Math.sin(Date.now() / 140) * 3;
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 225, 74, 0.85)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(mx, mz, pulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = '#ff2a2a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(mx, mz - 16);
            ctx.lineTo(mx, mz + 16);
            ctx.moveTo(mx - 16, mz);
            ctx.lineTo(mx + 16, mz);
            ctx.stroke();
            ctx.fillStyle = '#ffe14a';
            ctx.beginPath();
            ctx.moveTo(mx, mz - 9);
            ctx.lineTo(mx + 7, mz);
            ctx.lineTo(mx, mz + 9);
            ctx.lineTo(mx - 7, mz);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#7a2200';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
    }

    function mobBlocked(x, z, y, flyer, kind) {
        if (C.phaseGhost && C.phaseGhost(kind)) return false;
        if (ENG.inHouse && ENG.inHouse(engine.world, x, z)
            && !(C.canEnterHouse && C.canEnterHouse(kind))) return true;
        if (flyer) return false;
        const r = 0.32;
        return engine.columnBlocked(x, z, y)
            || engine.columnBlocked(x + r, z, y)
            || engine.columnBlocked(x - r, z, y)
            || engine.columnBlocked(x, z + r, y)
            || engine.columnBlocked(x, z - r, y);
    }

    function pulseGlow(mesh, hex, tSec) {
        if (!mesh || !hex) return;
        const wave = 0.45 + 0.35 * (0.5 + 0.5 * Math.sin((tSec || 0) * 4));
        mesh.traverse(function (n) {
            if (!n.material || !n.material.emissive) return;
            const name = String(n.name || '').toLowerCase();
            if (name && name.indexOf('eye') < 0 && name.indexOf('core') < 0 && name.indexOf('glow') < 0
                && name.indexOf('flame') < 0 && name.indexOf('rod') < 0 && name.indexOf('mouth') < 0) return;
            n.material.emissive.setHex(hex);
            n.material.emissive.multiplyScalar(wave);
        });
    }

    function applyPresence(m, dist, tSec) {
        if (!m.mesh || !C.signatureOf || m.isBoss) return;
        const sig = C.signatureOf(m.kind);
        if (sig.anim === 'swell') {
            const s = C.swellScale(dist);
            m.mesh.scale.setScalar(s);
        } else if (sig.anim === 'peek') {
            const open = m.aggro ? 1 : 0.35;
            m.mesh.scale.set(1, 0.5 + open * 0.5, 1);
        } else if (C.inflateScale && C.inflateScale(m.kind, dist) > 1) {
            const s = C.inflateScale(m.kind, dist);
            m.mesh.scale.setScalar(s);
        }
        if (m.kind === 'shadow_stalker' || m.kind === 'sculk_worm') {
            const fade = m.burrowHidden ? 0.12 : (m.kind === 'shadow_stalker' ? (dist > 6 ? 0.38 : 0.92) : 1);
            m.mesh.traverse(function (n) {
                if (!n.material || n.material.opacity == null) return;
                n.material.transparent = fade < 1;
                n.material.opacity = fade;
            });
        }
        if (sig.glow) {
            const charge = C.chargeGlow ? C.chargeGlow(m.kind, (tSec || 0) * 1000, m.skillAt || 0) : 0;
            pulseGlow(m.mesh, sig.glow, tSec);
            if (charge > 0) m.mesh.scale.setScalar(1 + charge * 0.12);
        }
    }

    function tickMonsterSkills(now) {
        if (!C.signatureOf || !engine) return;
        const p = engine.player;
        session.monsters.forEach(function (m) {
            if (m.hp <= 0 || m.peaceful || m.isBoss) return;
            if (C.goldPeace && C.goldPeace(m.kind, { gold: heldGold() })) return;
            const sig = C.signatureOf(m.kind);
            const dist = Math.hypot(p.x - m.x, p.z - m.z);
            const stopAt = C.behaviorStopRange
                ? C.behaviorStopRange(m.behavior || 'chase', C.CONTACT_RANGE)
                : C.CONTACT_RANGE;
            if (C.canFireSkill(sig, now, m.skillAt || 0, dist, stopAt)) {
                m.skillAt = now;
                const n = sig.count || 1;
                if (n <= 1) fireBossShot(m, { shot: sig.shot, color: sig.color, halo: sig.halo, dmg: 1 });
                else {
                    for (let i = 0; i < n; i += 1) {
                        fireBossShot(m, {
                            shot: sig.shot, color: sig.color, halo: sig.halo, dmg: 1,
                            angle: (i - (n - 1) / 2) * 0.28
                        });
                    }
                }
                if (sig.anim === 'puff' && MOBS.spawnBurst) {
                    MOBS.spawnBurst(engine.scene, session.fx, m.x, (m.y || 0) + 1, m.z, sig.color, 6);
                }
            }
            if (m.kind === 'warden' && dist < 3.2 && (!m.boomAt || now - m.boomAt >= 2800)) {
                m.boomAt = now;
                spawnBossRing(m, { color: 0x4ad4e0, radius: 1.3, grow: 3.2 });
            }
            if (sig.anim === 'stomp' && dist < 2.6 && (!m.stompAt || now - m.stompAt >= 1800)) {
                m.stompAt = now;
                spawnBossRing(m, { color: 0x6a5a48, radius: 1.2, grow: 2.6 });
            }
            if (sig.anim === 'swell' && dist < 1.75 && (!m.popAt || now - m.popAt >= 1600)) {
                m.popAt = now;
                spawnBossRing(m, { color: 0x6fbf45, radius: 1.1, grow: 2.2 });
                const hit = C.applyContact({ hp: p.hp, lastHitAt: session.lastHitAt }, { contact: 2 }, now);
                if (hit.hit) {
                    p.hp = hit.hp;
                    session.lastHitAt = hit.lastHitAt;
                    hurtFlash();
                    if (sfx && sfx.hurt) sfx.hurt();
                    toast('苦力怕炸开了！HP ' + Math.ceil(p.hp));
                    if (p.hp <= 0) respawn();
                }
            }
            if (C.sipHeal) {
                const heal = C.sipHeal(m.kind, m.hp, m.maxHp);
                if (heal > 0 && (!m.sipAt || now - m.sipAt >= 4000)) {
                    m.sipAt = now;
                    m.hp = Math.min(m.maxHp, m.hp + heal);
                    if (MOBS.spawnBurst) MOBS.spawnBurst(engine.scene, session.fx, m.x, (m.y || 0) + 1.15, m.z, 0x7a3ce0, 6);
                    if (m.model) m.model.setHp(m.hp / m.maxHp, true);
                }
            }
            if (C.sporePuff && C.sporePuff(m.kind, dist) && (!m.sporeAt || now - m.sporeAt >= 1600)) {
                m.sporeAt = now;
                spawnBossRing(m, { color: 0xb4543a, radius: 1.0, grow: 2.1 });
                const hit = C.applyContact({ hp: p.hp, lastHitAt: session.lastHitAt }, { contact: 1 }, now);
                if (hit.hit) {
                    p.hp = hit.hp;
                    session.lastHitAt = hit.lastHitAt;
                    hurtFlash();
                    if (sfx && sfx.hurt) sfx.hurt();
                    toast('孢子扑面！HP ' + Math.ceil(p.hp));
                    if (p.hp <= 0) respawn();
                }
            }
        });
    }

    function moveMonsters(dt, t) {
        const p = engine.player;
        const tSec = t / 1000;
        session.monsters.forEach(function (m) {
            if (m.hp <= 0) return;
            const dx = p.x - m.x;
            const dz = p.z - m.z;
            const dist = Math.hypot(dx, dz) || 1;
            const loc = C.locomotionOf
                ? C.locomotionOf(m.kind, { isBoss: m.isBoss, bossId: m.bossId })
                : { mode: 'walk', flyer: false, hover: 0, hop: 0 };
            const flyer = !!loc.flyer;
            const blocked = function (x, z, y, fly) {
                return mobBlocked(x, z, y, fly, m.kind);
            };
            let moving = false;
            const ox = m.x, oz = m.z;
            m.aggro = C.tickAggro ? C.tickAggro(!!m.aggro, dist) : dist <= 8;
            if (C.goldPeace && C.goldPeace(m.kind, { gold: heldGold() })) m.aggro = false;
            if (C.dayCalm && C.dayCalm(m.kind, { exposed: skyExposed(m.x, m.z) }) && !m.provoked) m.aggro = false;
            const stanceY = function () {
                const ground = engine.world.surfaceAt(Math.floor(m.x), Math.floor(m.z));
                return C.stanceAltitude
                    ? C.stanceAltitude(m.kind, ground, tSec, { isBoss: m.isBoss, bossId: m.bossId })
                    : (flyer ? ground + (loc.hover || 1.35) : ground);
            };
            if (loc.mode === 'anchor' || (m.parked && !m.aggro) || !m.aggro) {
                if (m.parked && m.aggro && loc.mode !== 'anchor') m.parked = false;
                else {
                    m.y = stanceY();
                    if (m.mesh) m.mesh.position.set(m.x, m.y, m.z);
                    if (m.hurtFlash) m.hurtFlash = Math.max(0, m.hurtFlash - dt);
                    if (m.model) {
                        m.model.update(dt, false, tSec);
                        m.model.faceHpBarTo(engine.camera);
                    }
                    applyPresence(m, dist, tSec);
                    return;
                }
            }
            if (m.parked && m.aggro) m.parked = false;
            const stopAt = C.behaviorStopRange
                ? C.behaviorStopRange(m.behavior || 'chase', C.CONTACT_RANGE)
                : C.CONTACT_RANGE;
            if (dist > 6) m.wasFar = true;
            let pose = C.poseStep
                ? C.poseStep(m.kind, {
                    dist: dist,
                    aggro: !!m.aggro,
                    blocked: false,
                    playerAbove: p.y - (m.y || 0)
                })
                : { dash: 1, lift: 0, climb: 0, lean: 0 };
            if (C.shadowLunge && m.aggro) {
                const sl = C.shadowLunge(m.kind, { dist: dist, wasFar: !!m.wasFar });
                if (sl.dash > 1) {
                    pose.dash = sl.dash;
                    pose.lean = 0.28;
                    if (dist <= 3.2) m.wasFar = false;
                }
            }
            m.pose = pose;
            if (C.sunBurn && C.sunBurn(m.kind, { exposed: skyExposed(m.x, m.z) })) {
                pose.dash = (pose.dash || 1) * 0.68;
            }
            if (C.strafeStep && m.aggro) {
                const st = C.strafeStep(m.kind, { dist: dist, aggro: true, dx: dx, dz: dz, t: tSec });
                if (st.sx || st.sz) {
                    const sx = m.x + st.sx * dt;
                    const sz = m.z + st.sz * dt;
                    if (!blocked(sx, m.z, m.y, flyer)) m.x = sx;
                    if (!blocked(m.x, sz, m.y, flyer)) m.z = sz;
                }
            }
            if (C.retreatStep && m.aggro) {
                const rt = C.retreatStep(m.kind, { dist: dist, aggro: true, dx: dx, dz: dz });
                if (rt.sx || rt.sz) {
                    const rx = m.x + rt.sx * dt;
                    const rz = m.z + rt.sz * dt;
                    if (!blocked(rx, m.z, m.y, flyer)) m.x = rx;
                    if (!blocked(m.x, rz, m.y, flyer)) m.z = rz;
                }
            }
            let burrow = { sx: 0, sz: 0, lift: 0, hidden: false };
            if (C.burrowStep && m.aggro) {
                burrow = C.burrowStep(m.kind, { dist: dist, aggro: true, t: tSec, dx: dx, dz: dz });
                if (burrow.sx || burrow.sz) {
                    const bx = m.x + burrow.sx * dt;
                    const bz = m.z + burrow.sz * dt;
                    const ghost = !!burrow.hidden;
                    if (!blocked(bx, m.z, m.y, ghost || flyer)) m.x = bx;
                    if (!blocked(m.x, bz, m.y, ghost || flyer)) m.z = bz;
                    if (burrow.hidden) moving = true;
                }
                if (m.burrowHidden && !burrow.hidden && MOBS.spawnBurst) {
                    MOBS.spawnBurst(engine.scene, session.fx, m.x, (m.y || 0) + 0.2, m.z, 0x1a3a40, 8);
                }
                m.burrowHidden = !!burrow.hidden;
            }
            if (dist > stopAt && !burrow.hidden) {
                moving = true;
                const surface = engine.world.surfaceAt(Math.floor(engine.player.x), Math.floor(engine.player.z));
                const inCave = engine.player.y < surface - 2.2;
                const slow = C.torchSlow
                    ? C.torchSlow({ hasTorch: (session.bag.torch || 0) > 0, inCave: inCave })
                    : 1;
                const dash = (m.isBoss && session.bossDashUntil && nowMs() < session.bossDashUntil) ? 2.35 : 1;
                const step = Math.max(1.05, m.speed) * dt * slow * dash * (pose.dash || 1);
                const ux = dx / dist, uz = dz / dist;
                const nx = m.x + ux * step;
                const nz = m.z + uz * step;
                if (!blocked(nx, m.z, m.y, flyer)) m.x = nx;
                if (!blocked(m.x, nz, m.y, flyer)) m.z = nz;
                if (m.x === ox && m.z === oz) {
                    const lx = -uz * step, lz = ux * step;
                    if (!blocked(m.x + lx, m.z + lz, m.y, flyer)) {
                        m.x += lx; m.z += lz;
                    } else if (!blocked(m.x - lx, m.z - lz, m.y, flyer)) {
                        m.x -= lx; m.z -= lz;
                    } else {
                        for (let a = 0; a < 8; a += 1) {
                            const sx = m.x + Math.cos(a * Math.PI / 4) * 0.7;
                            const sz = m.z + Math.sin(a * Math.PI / 4) * 0.7;
                            if (!blocked(sx, sz, m.y, flyer)) { m.x = sx; m.z = sz; break; }
                        }
                    }
                    if (m.x === ox && m.z === oz && C.poseStep) {
                        pose = C.poseStep(m.kind, {
                            dist: dist,
                            aggro: !!m.aggro,
                            blocked: true,
                            playerAbove: p.y - (m.y || 0)
                        });
                        m.pose = pose;
                        if (pose.climb > 0 && !blocked(nx, nz, m.y + pose.climb, true)) {
                            m.x = nx;
                            m.z = nz;
                        }
                    }
                }
            } else if (!burrow.hidden) {
                const wall = ENG.wallBetween
                    ? ENG.wallBetween(engine.world, m.x, m.y + 1.1, m.z, p.x, p.y + 1.1, p.z)
                    : false;
                const canHit = C.canTouch(p, m, {
                    playerSheltered: !!(ENG.inHouse && ENG.inHouse(engine.world, p.x, p.z)),
                    mobSheltered: !!(ENG.inHouse && ENG.inHouse(engine.world, m.x, m.z)),
                    wallBetween: wall
                });
                if (canHit) {
                    const gearDef = S.statsOf(progress.gear).def;
                    const shieldDef = CR && CR.toolBonus ? (CR.toolBonus(session.bag, session.tool).def || 0) : 0;
                    const hit = C.applyContact({ hp: p.hp, lastHitAt: session.lastHitAt }, {
                        contact: S.mitigate(m.contact, gearDef + shieldDef)
                    }, t);
                    if (hit.hit) {
                        p.hp = hit.hp;
                        session.lastHitAt = hit.lastHitAt;
                        hurtFlash();
                        if (sfx && sfx.hurt) sfx.hurt();
                        if (p.hp <= 0) {
                            respawn();
                        } else {
                            toast('被碰到了！HP ' + Math.ceil(p.hp));
                        }
                    }
                }
            }
            m.y = stanceY() + (pose.lift || 0) + (pose.climb || 0) + (burrow.lift || 0);
            if (m.isBoss && session.bossAnim && nowMs() < session.bossAnim.until) {
                const lean = session.bossAnim.lean;
                if (lean === 'up') m.y += 0.42;
                if (lean === 'down') m.y -= 0.18;
            }
            if (m.mesh) {
                m.mesh.position.set(m.x, m.y, m.z);
                if (m.isBoss && session.bossAnim && nowMs() < session.bossAnim.until) {
                    const lean = session.bossAnim.lean;
                    if (lean === 'forward' || lean === 'down') m.mesh.rotation.x = lean === 'down' ? 0.55 : 0.28;
                    else if (lean === 'spin') m.mesh.rotation.y += dt * 8;
                    else if (lean === 'up') m.mesh.rotation.x = -0.22;
                } else if (m.isBoss) {
                    m.mesh.rotation.x = 0;
                } else if (pose.lean) {
                    m.mesh.rotation.x = pose.lean;
                } else {
                    m.mesh.rotation.x = 0;
                }
                const movedX = m.x - ox, movedZ = m.z - oz;
                if (Math.hypot(movedX, movedZ) > 0.0008) {
                    m.mesh.rotation.y = Math.atan2(movedX, movedZ);
                } else {
                    m.mesh.rotation.y = Math.atan2(dx, dz);
                }
            }
            if (m.hurtFlash) m.hurtFlash = Math.max(0, m.hurtFlash - dt);
            if (m.model) {
                m.model.update(dt, moving, tSec, m.hurtFlash > 0);
                if (m.hp < m.maxHp) m.model.setHp(m.hp / m.maxHp, true);
                m.model.faceHpBarTo(engine.camera);
            }
            if ((m.kind === 'magma' || m.kind === 'blaze' || m.kind === 'fire_spirit' || m.kind === 'spore_bug') && moving && MOBS.spawnBurst) {
                m.trailAt = (m.trailAt || 0) - dt;
                if (m.trailAt <= 0) {
                    m.trailAt = 0.18;
                    const col = m.kind === 'spore_bug' ? 0xb4543a : 0xff6a2a;
                    MOBS.spawnBurst(engine.scene, session.fx, m.x, (m.y || 0) + 0.35, m.z, col, 2);
                }
            }
            if (C.sunBurn && C.sunBurn(m.kind, { exposed: skyExposed(m.x, m.z) })) {
                if (MOBS.spawnBurst && (m.trailAt || 0) <= 0) {
                    m.trailAt = 0.2;
                    MOBS.spawnBurst(engine.scene, session.fx, m.x, (m.y || 0) + 1.1, m.z, 0xffc04a, 2);
                } else {
                    m.trailAt = (m.trailAt || 0) - dt;
                }
                if (!m.burnAt || t - m.burnAt >= 1800) {
                    m.burnAt = t;
                    hurtMonster(m, 2, false);
                }
            }
            if (C.heatMelt && C.heatMelt(m.kind, { climate: engine.world.climate, wet: footWet(m.x, m.z) })) {
                if (MOBS.spawnBurst && (m.trailAt || 0) <= 0) {
                    m.trailAt = 0.22;
                    MOBS.spawnBurst(engine.scene, session.fx, m.x, (m.y || 0) + 0.85, m.z, 0xe8f4ff, 3);
                } else {
                    m.trailAt = (m.trailAt || 0) - dt;
                }
                if (!m.meltAt || t - m.meltAt >= 1800) {
                    m.meltAt = t;
                    hurtMonster(m, 2, false);
                }
            } else if (m.kind === 'snowgolem' && moving && MOBS.spawnBurst) {
                m.trailAt = (m.trailAt || 0) - dt;
                if (m.trailAt <= 0) {
                    m.trailAt = 0.32;
                    MOBS.spawnBurst(engine.scene, session.fx, m.x, (m.y || 0) + 0.12, m.z, 0xf4f8ff, 2);
                }
            }
            const inside = !!(ENG.inHouse && ENG.inHouse(engine.world, m.x, m.z));
            if (C.canEnterHouse && C.canEnterHouse(m.kind) && inside && !m.houseIn) {
                m.houseIn = true;
                if (MOBS.spawnBurst) MOBS.spawnBurst(engine.scene, session.fx, m.x, (m.y || 0) + 0.85, m.z, 0x8a6a48, 7);
            }
            if (!inside) m.houseIn = false;
            if (C.waterBlink && C.waterBlink(m.kind, { wet: footWet(m.x, m.z) })) {
                m.aggro = false;
                if (!m.wetBlinkAt || t - m.wetBlinkAt >= 900) {
                    m.wetBlinkAt = t;
                    blinkMob(m);
                }
            }
            applyPresence(m, dist, tSec);
        });
    }

    function heldGold() {
        let n = (Number(session.bag['gold-nugget']) || 0) + (Number(session.bag.gold) || 0);
        (session.hotbar || []).forEach(function (id) {
            if (id === 'gold-nugget' || id === 'gold') n += 1;
        });
        return n;
    }

    function spendHeldGold() {
        if ((Number(session.bag['gold-nugget']) || 0) > 0) {
            session.bag = C.addLoot(session.bag, 'gold-nugget', -1);
            return true;
        }
        if ((Number(session.bag.gold) || 0) > 0) {
            session.bag = C.addLoot(session.bag, 'gold', -1);
            return true;
        }
        const bar = session.hotbar || [];
        for (let i = 0; i < bar.length; i += 1) {
            if (bar[i] === 'gold-nugget' || bar[i] === 'gold') {
                bar[i] = null;
                return true;
            }
        }
        return false;
    }

    function skyExposed(x, z) {
        if (!engine || !engine.world) return false;
        if (ENG.inHouse && ENG.inHouse(engine.world, x, z)) return false;
        const c = engine.world.climate;
        return c !== 'nether' && c !== 'end' && c !== 'deep_dark';
    }

    function footWet(x, z) {
        return !!(engine && engine.world && engine.world.ponds
            && engine.world.ponds[Math.floor(x) + ',' + Math.floor(z)]);
    }

    function nearestHostileTo(x, z, hostiles) {
        let target = null;
        let best = 99;
        hostiles.forEach(function (m) {
            const d = Math.hypot(m.x - x, m.z - z);
            if (d < best) {
                best = d;
                target = m;
            }
        });
        return { target: target, dist: best };
    }

    function tickVillageGolems(now, dt) {
        if (!engine || !engine.world || !C.signatureOf) return;
        const hostiles = session.monsters.filter(function (m) {
            return m.hp > 0 && !m.peaceful && !m.isBoss;
        });
        (engine.world.golems || []).forEach(function (g) {
            const near = nearestHostileTo(g.x, g.z, hostiles);
            const target = near.target;
            const best = near.dist;
            g.guarding = !!(target && best <= 12);
            if (!target) return;
            if (g.kind === 'snowgolem') {
                if (C.heatMelt && C.heatMelt('snowgolem', { climate: engine.world.climate, wet: footWet(g.x, g.z) })) {
                    if (MOBS.spawnBurst && (!g.meltFx || now - g.meltFx >= 220)) {
                        g.meltFx = now;
                        MOBS.spawnBurst(engine.scene, session.fx, g.x, (g.y || 0) + 0.85, g.z, 0xe8f4ff, 3);
                    }
                } else if (MOBS.spawnBurst && (!g.trailAt || now - g.trailAt >= 320)) {
                    g.trailAt = now;
                    MOBS.spawnBurst(engine.scene, session.fx, g.x, (g.y || 0) + 0.12, g.z, 0xf4f8ff, 2);
                }
                if (best > 10) return;
                const sig = C.signatureOf('snowgolem');
                if (!C.canFireSkill(sig, now, g.skillAt || 0, best, 8)) return;
                g.skillAt = now;
                fireBossShot(g, {
                    shot: sig.shot,
                    color: sig.color,
                    halo: sig.halo,
                    dmg: 1,
                    friendly: true,
                    aim: target,
                    aimMob: target
                });
                return;
            }
            if (g.kind !== 'golem') return;
            if (best > 12) return;
            const dx = target.x - g.x;
            const dz = target.z - g.z;
            const len = Math.hypot(dx, dz) || 1;
            if (best > 1.8 && dt) {
                g.x += (dx / len) * 1.15 * dt;
                g.z += (dz / len) * 1.15 * dt;
                g.yaw = Math.atan2(dx, dz);
                g.y = engine.world.surfaceAt(Math.floor(g.x), Math.floor(g.z));
                if (g.mesh) {
                    g.mesh.position.set(g.x, g.y, g.z);
                    g.mesh.rotation.y = g.yaw;
                }
            }
            if (best <= 2.2 && (!g.stompAt || now - g.stompAt >= 1400)) {
                g.stompAt = now;
                hurtMonster(target, 6, false);
                spawnBossRing(g, { color: 0x6a5a48, radius: 1.3, grow: 2.8 });
            }
        });
        (engine.world.villagers || []).forEach(function (v) {
            const near = nearestHostileTo(v.x, v.z, hostiles);
            const dx = near.target ? near.target.x - v.x : 0;
            const dz = near.target ? near.target.z - v.z : 1;
            let step = C.homeStep
                ? C.homeStep('villager', {
                    threat: !!near.target,
                    dist: near.dist,
                    x: v.x,
                    z: v.z,
                    homeX: v.homeX,
                    homeZ: v.homeZ
                })
                : { sx: 0, sz: 0 };
            if (!(step.sx || step.sz) && C.fleeStep) {
                step = C.fleeStep('villager', { dist: near.dist, threat: !!near.target, dx: dx, dz: dz });
            }
            v.fleeing = !!(step.sx || step.sz);
            if (!v.fleeing || !dt) return;
            v.x += step.sx * dt;
            v.z += step.sz * dt;
            v.yaw = Math.atan2(step.sx, step.sz);
            v.y = engine.world.surfaceAt(Math.floor(v.x), Math.floor(v.z));
            if (v.mesh) {
                v.mesh.position.set(v.x, v.y, v.z);
                v.mesh.rotation.y = v.yaw;
            }
        });
        (engine.world.animals || []).forEach(function (a) {
            const near = nearestHostileTo(a.x, a.z, hostiles);
            const tdx = near.target ? near.target.x - a.x : 0;
            const tdz = near.target ? near.target.z - a.z : 1;
            if (a.kind === 'wolf') {
                const step = C.packHunt
                    ? C.packHunt('wolf', { dist: near.dist, ally: !!near.target, dx: tdx, dz: tdz })
                    : { sx: 0, sz: 0 };
                a.hunting = !!(step.sx || step.sz);
                a.fleeing = false;
                if (a.hunting) nudgeLife(a, step.sx, step.sz, dt);
                if (near.target && near.dist <= 1.6 && (!a.biteAt || now - a.biteAt >= 900)) {
                    a.biteAt = now;
                    hurtMonster(near.target, 3, false);
                }
                return;
            }
            if (C.isFarmAnimal && C.isFarmAnimal(a.kind)) {
                const step = C.fleeStep
                    ? C.fleeStep(a.kind, { dist: near.dist, threat: !!near.target, dx: tdx, dz: tdz })
                    : { sx: 0, sz: 0 };
                a.fleeing = !!(step.sx || step.sz);
                a.hunting = false;
                if (a.fleeing) nudgeLife(a, step.sx, step.sz, dt);
                if (C.layEgg && C.layEgg(a.kind, { t: now / 1000, lastAt: a.eggAt || 0 })) {
                    a.eggAt = now / 1000;
                    spawnPickup(a.x, a.z, 0, 'egg');
                }
                if (C.grazeOf && C.grazeOf(a.kind, { t: now / 1000, lastAt: a.grazeAt || 0 })) {
                    a.grazeAt = now / 1000;
                    if (MOBS.spawnBurst) MOBS.spawnBurst(engine.scene, session.fx, a.x, (a.y || 0) + 0.2, a.z, 0x6fbf4a, 5);
                }
                return;
            }
            if (a.kind === 'bee' && C.stingDive) {
                if (session.lookRow === a) a.angryUntil = now + 4500;
                const hurt = a.maxHp != null && a.hp < a.maxHp;
                const angry = hurt || now < (a.angryUntil || 0);
                const p = engine.player;
                const pdx = p.x - a.x;
                const pdz = p.z - a.z;
                const pdist = Math.hypot(pdx, pdz);
                const dive = C.stingDive('bee', { dist: pdist, angry: angry, dx: pdx, dz: pdz });
                a.hunting = !!(dive.sx || dive.sz);
                a.fleeing = false;
                if (a.hunting) nudgeLife(a, dive.sx, dive.sz, dt);
                if (angry && pdist < 1.15 && (!a.stingAt || now - a.stingAt >= 1400)) {
                    a.stingAt = now;
                    const hit = C.applyContact({ hp: p.hp, lastHitAt: session.lastHitAt }, { contact: 1 }, now);
                    if (hit.hit) {
                        p.hp = hit.hp;
                        session.lastHitAt = hit.lastHitAt;
                        hurtFlash();
                        if (sfx && sfx.hurt) sfx.hurt();
                        toast('蜜蜂蛰了一下！HP ' + Math.ceil(p.hp));
                        if (p.hp <= 0) respawn();
                    }
                    if (MOBS.spawnBurst) MOBS.spawnBurst(engine.scene, session.fx, a.x, (a.y || 0) + 0.4, a.z, 0xffd54f, 4);
                }
            }
        });
    }

    function nudgeLife(actor, sx, sz, dt) {
        if (!actor || !dt || !(sx || sz)) return;
        actor.x += sx * dt;
        actor.z += sz * dt;
        actor.yaw = Math.atan2(sx, sz);
        actor.y = ENG.lifeAltitude
            ? ENG.lifeAltitude(actor, engine.world)
            : engine.world.surfaceAt(Math.floor(actor.x), Math.floor(actor.z));
        if (actor.mesh) {
            actor.mesh.position.set(actor.x, actor.y, actor.z);
            actor.mesh.rotation.y = actor.yaw;
        }
    }

    function moveBolts(dt) {
        const keep = [];
        session.bolts.forEach(function (b) {
            b.life -= dt;
            const target = (b.home && b.home.hp > 0)
                ? b.home
                : C.nearestMonster(b, session.monsters);
            const steered = C.steerBolt(b, target, dt);
            b.x = steered.x; b.z = steered.z; b.vx = steered.vx; b.vz = steered.vz;
            if (b.mesh) {
                b.mesh.position.set(b.x, b.y, b.z);
                b.mesh.rotation.y = Math.atan2(b.vx, b.vz);
                const spin = b.mesh.userData.spin;
                const stretch = b.mesh.userData.stretch || 1;
                if (stretch > 1) b.mesh.scale.set(1, 1, stretch);
                if (spin) {
                    spin.core.rotation.y += dt * 9;
                    spin.halo.rotation.y -= dt * 5;
                    spin.halo.scale.setScalar(1 + Math.sin(Date.now() / 90) * 0.14);
                }
                if (b.mesh.userData.trail !== false) {
                    b.trailAt = (b.trailAt || 0) - dt;
                    if (b.trailAt <= 0) {
                        b.trailAt = 0.07;
                        MOBS.spawnBurst(engine.scene, session.fx, b.x, b.y, b.z, 0x9a5ce8, 1);
                    }
                }
            }
            let hit = null;
            if (target && Math.hypot(target.x - b.x, target.z - b.z) < 0.55) hit = target;
            if (hit) {
                if (!b.cosmetic) requestHit(hit, 'bolt');
                engine.scene.remove(b.mesh);
                return;
            }
            if (b.life <= 0) {
                engine.scene.remove(b.mesh);
                return;
            }
            keep.push(b);
        });
        session.bolts = keep;
    }

    function collectPickups() {
        const p = engine.player;
        const tSec = Date.now() / 1000;
        const keep = [];
        session.pickups.forEach(function (item) {
            if (Math.hypot(item.x - p.x, item.z - p.z) < 1.15) {
                if (item.coins) {
                    session.coins = C.pickupCoins(session.coins, item.coins);
                    if (sfx && sfx.coin) sfx.coin();
                }
                if (item.loot && tryAutoEat(item.loot)) {
                    engine.scene.remove(item.mesh);
                    MOBS.spawnBurst(engine.scene, session.fx, item.x, item.y, item.z, 0xffd24a, 5);
                    persist();
                    if (sfx && sfx.pickup) sfx.pickup();
                    return;
                }
                session.bag = C.addLoot(session.bag, item.loot, 1);
                engine.scene.remove(item.mesh);
                MOBS.spawnBurst(engine.scene, session.fx, item.x, item.y, item.z, 0xffd24a, 5);
                persist();
                toast(item.coins ? ('金币 +' + item.coins) : ('获得 ' + item.loot));
                if (sfx && sfx.pickup) sfx.pickup();
                return;
            }
            if (item.mesh) {
                item.mesh.rotation.y += 0.06;
                item.mesh.position.y = item.y + Math.sin(tSec * 3 + item.bob) * 0.08;
            }
            keep.push(item);
        });
        session.pickups = keep;
    }

    function currentGuideMark() {
        if (!L.guideMarkOf || !engine || !engine.world) return null;
        return L.guideMarkOf({
            hub: !!session.hub,
            unlockedLevel: progress.unlockedLevel || 1,
            clearedLevels: progress.clearedLevels || [],
            coins: session.coins,
            portals: engine.world.levelPortals || [],
            unlockPost: engine.world.unlockPost,
            settleAt: session.settleAt,
            bossMob: session.bossMob && session.bossMob.hp > 0 ? session.bossMob : null,
            monsters: session.monsters,
            player: engine.player
        });
    }

    function dropGuideBeacon() {
        if (session.guideBeacon && engine && engine.scene) engine.scene.remove(session.guideBeacon);
        session.guideBeacon = null;
    }

    function ensureGuideBeacon() {
        if (session.guideBeacon) return session.guideBeacon;
        const g = new THREE.Group();
        g.name = 'guide-beacon';
        const beam = new THREE.Mesh(
            new THREE.BoxGeometry(0.9, 64, 0.9),
            new THREE.MeshBasicMaterial({ color: 0xffe14a, transparent: true, opacity: 0.58 })
        );
        beam.position.y = 32;
        beam.name = 'guide-beacon-beam';
        const core = new THREE.Mesh(
            new THREE.BoxGeometry(0.28, 64, 0.28),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
        );
        core.position.y = 32;
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.4, 1.8),
            new THREE.MeshBasicMaterial({ color: 0xf4c542 })
        );
        base.position.y = 0.22;
        g.add(base);
        g.add(beam);
        g.add(core);
        g.visible = false;
        engine.scene.add(g);
        session.guideBeacon = g;
        return g;
    }

    function syncGuideBeacon(mark) {
        const g = ensureGuideBeacon();
        if (!mark) {
            g.visible = false;
            return;
        }
        const y = engine.world.surfaceAt(Math.floor(mark.x), Math.floor(mark.z));
        g.position.set(mark.x, y, mark.z);
        g.visible = true;
        const beam = g.getObjectByName('guide-beacon-beam');
        if (beam && beam.material) {
            beam.material.opacity = 0.4 + 0.32 * (0.5 + 0.5 * Math.sin(Date.now() / 160));
        }
    }

    function clearSettleFlag() {
        if (session.settleFlag && engine && engine.scene) engine.scene.remove(session.settleFlag);
        session.settleFlag = null;
        session.settleAt = null;
    }

    function spawnSettleFlag(x, z) {
        clearSettleFlag();
        session.settleAt = { x: x, z: z };
        const y = engine.world.surfaceAt(Math.floor(x), Math.floor(z));
        const mesh = new THREE.Group();
        const pole = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 2.4, 0.18),
            new THREE.MeshLambertMaterial({ color: 0xc4a574 })
        );
        pole.position.y = 1.2;
        const flag = new THREE.Mesh(
            new THREE.BoxGeometry(0.92, 0.56, 0.08),
            new THREE.MeshLambertMaterial({ color: 0xf4c542, emissive: 0x553300 })
        );
        flag.position.set(0.46, 2.1, 0);
        mesh.add(pole);
        mesh.add(flag);
        mesh.position.set(x, y, z);
        engine.scene.add(mesh);
        session.settleFlag = mesh;
        toast('小地图黄点 · 走过去结算金币、开下一关');
    }

    function tryCampUnlock() {
        if (session.hubUnlocking) return;
        const next = (progress.unlockedLevel || 1) + 1;
        if (next > L.LEVEL_TOTAL) return;
        const res = L.tryUnlock({
            unlockedLevel: progress.unlockedLevel || 1,
            coined: session.coins,
            recallWords: recallWordCount()
        }, next);
        if (!res.ok) {
            if (session.hubUnlockTold === next) return;
            session.hubUnlockTold = next;
            toast('金币不够 · 先再打一关或去商人卖东西');
            return;
        }
        session.hubUnlocking = true;
        progress.unlockedLevel = res.unlockedLevel;
        session.coins = res.coined;
        persist();
        startHub();
        toast('第 ' + next + ' 关开了 · 跟着小地图黄点走进门');
    }

    function updateGuideReach() {
        const mark = currentGuideMark();
        session.guideMark = mark;
        syncGuideBeacon(mark);
        if (!mark || session.paused || session.quiz) return;
        const d = Math.hypot(engine.player.x - mark.x, engine.player.z - mark.z);
        if (mark.kind === 'settle' && d < 1.7) {
            clearSettleFlag();
            finishLevel();
            return;
        }
        if (mark.kind === 'unlock' && d < 1.7) tryCampUnlock();
    }

    function nearestLevelPortal(range) {
        const list = engine.world && engine.world.levelPortals;
        if (!list || !list.length) return null;
        const p = engine.player;
        const max = range == null ? 2.2 : range;
        let best = null, bestD = max;
        list.forEach(function (g) {
            const d = Math.hypot(p.x - g.x, p.z - g.z);
            if (d < bestD) {
                best = g;
                bestD = d;
            }
        });
        return best;
    }

    function paintHubPicks(show) {
        const el = document.getElementById('hub-picks');
        if (!el) return;
        const on = show == null ? !!session.hub : !!show;
        el.classList.toggle('is-hidden', !on);
        if (!on) return;
        const nodes = L.campMapOf ? L.campMapOf({
            unlockedLevel: progress.unlockedLevel || 1,
            clearedLevels: progress.clearedLevels || [],
            dueLevelIds: reviewDueIds()
        }).nodes : [];
        el.innerHTML = nodes.map(function (n) {
            const lock = n.state === 'locked';
            const mark = n.state === 'due' ? '复习' : n.state === 'cleared' ? '已通' : lock ? '锁' : '进';
            return '<button type="button" class="bl-hub-pick" data-hub-level="' + n.level
                + '" data-state="' + n.state + '"' + (lock ? ' aria-disabled="true"' : '')
                + '>' + n.level + ' ' + n.title + ' · ' + mark + '</button>';
        }).join('');
    }

    function jumpHubLevel(level) {
        const gate = L.canJumpHub ? L.canJumpHub({
            unlockedLevel: progress.unlockedLevel || 1,
            clearedLevels: progress.clearedLevels || [],
            dueLevelIds: reviewDueIds()
        }, level) : { ok: Number(level) <= (progress.unlockedLevel || 1), reason: 'open' };
        if (!gate.ok) {
            toast(gate.message || '先通前面的关');
            return;
        }
        if (gate.reason === 'due') {
            enterReviewDoor(level);
            return;
        }
        startLevel(level);
    }

    function enterHubPortal(portal) {
        if (!portal) return;
        jumpHubLevel(portal.level);
    }

    function updateHubPortal() {
        if (!session.hub || session.paused || session.quiz) return;
        const portal = nearestLevelPortal(1.15);
        if (!portal || portal.state === 'locked') return;
        if (session.hubEntering) return;
        session.hubEntering = true;
        enterHubPortal(portal);
    }

    function nearestWordGate(range) {
        const gates = engine.world && engine.world.wordGates;
        if (!gates || !gates.length) return null;
        const p = engine.player;
        const max = range == null ? 2.3 : range;
        let best = null, bestD = max;
        gates.forEach(function (g) {
            if (g.open) return;
            const d = Math.hypot(p.x - (g.x + 0.5), p.z - (g.z + 0.5));
            if (d < bestD) {
                best = g;
                bestD = d;
            }
        });
        return best;
    }

    function updateWordGate() {
        if (session.paused || session.quiz) return;
        const gate = nearestWordGate(2.3);
        if (!gate) {
            session.gateAsked = null;
            return;
        }
        if (session.gateAsked === gate) return;
        session.gateAsked = gate;
        openGateQuiz(gate);
    }

    function toolTierOf(tool) {
        const bag = session.bag || {};
        function n(id) { return Number(bag[id]) || 0; }
        if (tool === 'sword') {
            if (n('diamond_sword') > 0) return 'diamond';
            if (n('iron_sword') > 0) return 'iron';
            if (n('gold_sword') > 0) return 'gold';
        }
        if (tool === 'axe') {
            if (n('diamond_axe') > 0) return 'diamond';
            if (n('iron_axe') > 0) return 'iron';
            if (n('gold_axe') > 0) return 'gold';
        }
        if (tool === 'pickaxe') {
            if (n('diamond_pick') > 0 || n('diamond_pickaxe') > 0) return 'diamond';
            if (n('iron_pick') > 0) return 'iron';
            if (n('gold_pick') > 0) return 'gold';
        }
        if (tool === 'shovel') {
            if (n('diamond_shovel') > 0) return 'diamond';
            if (n('iron_shovel') > 0) return 'iron';
            if (n('gold_shovel') > 0) return 'gold';
        }
        return 'wood';
    }

    function updateMerchantTip() {
        let near = false;
        if (session.merchant) {
            const d = Math.hypot(engine.player.x - session.merchant.x, engine.player.z - session.merchant.z);
            near = d < 2.2;
        }
        (engine.world.villagers || []).forEach(function (v) {
            if (v.role !== 'trader') return;
            if (Math.hypot(engine.player.x - v.x, engine.player.z - v.z) < 2.2) near = true;
        });
        session.nearMerchant = near;
        const tip = document.getElementById('trade-tip');
        if (tip) {
            tip.textContent = 'Press F to talk to Merchant Leo (商人雷奥)';
            tip.classList.toggle('is-hidden', !session.nearMerchant || session.paused);
        }
    }

    function loadMathPractice(done) {
        if (enFamiliarCount() < 20) {
            if (done) done();
            return;
        }
        if (window.PersonalWorkbenchPreschoolMathBank) {
            if (done) done();
            return;
        }
        const s = document.createElement('script');
        s.src = '../../preschool-math-bank.js?v=20260819-bl-side4';
        s.onload = function () { if (done) done(); };
        s.onerror = function () { if (done) done(); };
        document.head.appendChild(s);
    }

    function noteSideResult(word, correct) {
        const key = word && word.side && word.side.masteryKey;
        if (!key) return;
        if (!session.sideAvoid) session.sideAvoid = [];
        if (!session.sideMiss) session.sideMiss = {};
        if (correct) {
            session.sideMiss[key] = 0;
            if (session.sideAvoid.indexOf(key) < 0) session.sideAvoid.push(key);
            noteSideSit();
            return;
        }
        session.sideMiss[key] = (Number(session.sideMiss[key]) || 0) + 1;
        if (P && P.sideMissSkip && P.sideMissSkip(session.sideMiss[key])) {
            if (session.sideAvoid.indexOf(key) < 0) session.sideAvoid.push(key);
            noteSideSit();
            toast('换一道');
        }
    }

    function maybeAskMerchantMath() {
        if (!P || !P.merchantDeal || session.mathAsked || sittingRoom() <= 0) return false;
        if (session.sideSkip && session.sideSkip.math) return false;
        const due = sideDueNow();
        if ((Number(due.math) || 0) <= 0) return false;
        session.mathAsked = true;
        loadSideKinds(['math'], function () {
            loadMathPractice(function () {
                const M = window.PersonalWorkbenchPreschoolMathBank;
                const deal = P.merchantDeal(due, {
                    cards: (session.sideByKind && session.sideByKind.math) || [],
                    enFamiliar: enFamiliarCount(),
                    buildPracticePool: M && M.buildPracticePool,
                    avoidKeys: session.sideAvoid || [],
                    dueKeys: sideReviewKeys(),
                    salt: 0
                });
                if (!deal) {
                    paintTrade();
                    return;
                }
                session.pending = { merchantMath: deal };
                fillQuizCard(P.quizFromSide(deal.question), '商人 · 算对九折');
            });
        });
        return true;
    }

    function paintTrade() {
        const lines = Object.keys(session.bag).filter(function (k) { return session.bag[k] > 0; });
        const copy = document.getElementById('trade-copy');
        const rate = session.mathDiscount || 1;
        if (!lines.length) copy.textContent = 'Sell loot, or buy gear below. Coins: ' + session.coins + (rate < 1 ? ' · 九折' : '');
        else copy.textContent = lines.map(function (k) {
            return k + ' ×' + session.bag[k] + ' = ' + ((LOOT_PRICE[k] || 2) * session.bag[k]) + ' coins';
        }).join(' · ') + ' · wallet ' + session.coins + (rate < 1 ? ' · 九折' : '');
        const list = document.getElementById('shop-list');
        if (list) {
            list.innerHTML = '';
            S.ITEMS.forEach(function (it) {
                const worn = progress.gear && progress.gear[it.slot] === it.id;
                const price = P && P.shopCost ? P.shopCost(it.cost, rate) : it.cost;
                const row = document.createElement('button');
                row.type = 'button';
                row.className = 'bl-shop-row bl-shop-card';
                row.innerHTML = '<b>' + it.en + '</b><em>' + it.zh + ' · $' + price + (worn ? ' (on)' : '') + '</em><span class="bl-shop-buy">购买 Buy</span>';
                row.addEventListener('click', function () { buyItem(it.id); });
                list.appendChild(row);
            });
        }
        toggleLayer('trade-layer', true);
    }

    function openTrade() {
        if (maybeAskMerchantMath()) return;
        paintTrade();
    }

    function buyItem(id) {
        const res = S.buy({ coined: session.coins, gear: progress.gear }, id, {
            discount: session.mathDiscount || 1
        });
        if (!res.ok) {
            toast(res.reason === 'poor' ? '金币不够。' : '买不了这个。');
            return;
        }
        session.coins = res.coined;
        progress.gear = res.gear;
        if (sfx && sfx.buy) sfx.buy();
        if (res.heal && engine) {
            engine.player.hp = Math.min(engine.player.hpMax, engine.player.hp + res.heal);
            if (sfx && sfx.eat) sfx.eat();
            toast('HP +' + res.heal);
        } else {
            toast('Bought ' + ((res.item && res.item.en) || id));
        }
        persist();
        openTrade();
    }

    function sellAll() {
        let gain = 0;
        Object.keys(session.bag).forEach(function (k) {
            const n = Number(session.bag[k]) || 0;
            gain += n * (LOOT_PRICE[k] || 2);
            session.bag[k] = 0;
        });
        session.coins = C.pickupCoins(session.coins, gain);
        persist();
        toast(gain ? ('卖出战利品，金币 +' + gain) : '没有可卖的东西');
        closeTrade();
    }

    function closeTrade() {
        toggleLayer('trade-layer', false);
        if (!session.mathDiscount) session.mathAsked = false;
    }

    function syncBossHud() {
        if (!session.boss) return;
        const hp = document.getElementById('boss-hp');
        const fill = document.getElementById('boss-fill');
        if (hp) hp.textContent = Math.ceil(session.boss.hp) + '/' + session.boss.maxHp;
        if (fill) fill.style.width = Math.max(0, Math.round(session.boss.hp / session.boss.maxHp * 100)) + '%';
        const shield = document.getElementById('boss-shield');
        if (shield) {
            shield.textContent = session.boss.state === 'broken'
                ? '破罩'
                : ('蓝罩 ' + (session.boss.shield || 0));
        }
        const phase = document.getElementById('boss-phase');
        if (phase) {
            const form = L.bossFormLine ? L.bossFormLine(session.boss) : '';
            const learn = L.bossPhase ? L.bossPhase(session.boss) : '';
            phase.textContent = session.boss.state === 'shielded'
                ? ((form ? form + ' · ' : '') + learn)
                : (form || learn);
        }
        const nameEl = document.getElementById('boss-name');
        if (nameEl) nameEl.textContent = (L.bossTitle && L.bossTitle(session.boss.id)) || '凋灵';
    }

    function readMastery() {
        try {
            const st = bridge && typeof bridge.readState === 'function' ? bridge.readState() : null;
            return (st && st.courseProgress && st.courseProgress.minecraft && st.courseProgress.minecraft.mastery) || {};
        } catch (e) {
            return {};
        }
    }

    function todayIso() {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function playDatesOf() {
        if (!Array.isArray(progress.playDates)) progress.playDates = [];
        try {
            if (bridge && bridge.getProgress) {
                const got = bridge.getProgress(GAME_ID);
                const meta = got && got.state && got.state.growth && got.state.growth.worldGames && got.state.growth.worldGames.meta;
                if (meta && Array.isArray(meta.playDates)) {
                    meta.playDates.forEach(function (d) {
                        if (d && progress.playDates.indexOf(d) === -1) progress.playDates.push(d);
                    });
                }
            }
        } catch (e) { /* 工作台 meta 读不到时用本局 progress.playDates */ }
        return progress.playDates;
    }

    function stampPlayDate(day) {
        const date = day || todayIso();
        if (!Array.isArray(progress.playDates)) progress.playDates = [];
        if (progress.playDates.indexOf(date) === -1) progress.playDates.push(date);
    }

    const DEX_STAGE_LABEL = {
        new: '生疏',
        familiar: '见过',
        recall: '能写',
        spoken: '说过',
        mastered: '会了',
        due: '该复习'
    };

    function paintDex() {
        const list = document.getElementById('word-dex');
        if (!list || !W.dexRows) return;
        const rows = W.dexRows(pool.length ? pool : bank, readMastery(), todayIso());
        list.textContent = '';
        if (!rows.length) {
            const empty = document.createElement('li');
            empty.textContent = '还没有词';
            list.appendChild(empty);
            return;
        }
        rows.forEach(function (r) {
            const li = document.createElement('li');
            li.setAttribute('data-stage', r.stage || 'new');
            const en = document.createElement('b');
            en.textContent = r.text || r.id || '';
            const zh = document.createElement('span');
            zh.textContent = r.zh || '';
            const stage = document.createElement('em');
            stage.textContent = DEX_STAGE_LABEL[r.stage] || r.stage || '生疏';
            const phrase = document.createElement('small');
            phrase.className = 'bl-dex-phrase';
            phrase.textContent = (r.phrase || '') + (r.phraseZh ? ' / ' + r.phraseZh : '');
            li.appendChild(en);
            li.appendChild(zh);
            li.appendChild(stage);
            if (r.phrase || r.phraseZh) li.appendChild(phrase);
            li.addEventListener('click', function () {
                const open = li.classList.toggle('is-open');
                if (open) playDexPhrase(r);
            });
            list.appendChild(li);
        });
    }

    function playDexPhrase(row) {
        const text = (row && (row.phrase || row.text)) || '';
        if (row && row.audio) {
            try {
                const audio = new Audio(row.audio);
                audio.play().catch(function () { speakWord({ text: text }); });
                return;
            } catch (err) { /* fall through to TTS */ }
        }
        speakWord({ text: text });
    }

    function paintOpsHud() {
        const today = todayIso();
        const dates = playDatesOf();
        const streakEl = document.getElementById('streak-label');
        if (streakEl && L.streakFromDates) {
            const n = L.streakFromDates(dates, today);
            streakEl.textContent = n ? ('连续 ' + n + ' 天') : '今天还没打卡';
        }
        const three = document.getElementById('parent-three');
        if (three && W.parentThree && W.dexRows) {
            const rows = W.dexRows(pool.length ? pool : bank, readMastery(), today);
            const lines = W.parentThree({
                speakCount: Number(progress.speakCount) || (progress.spokenWordIds || []).length,
                rows: rows
            });
            three.textContent = [lines.speak, lines.learned, lines.review].join(' · ');
        }
        paintDailyHud();
    }

    function bootDaily() {
        if (!W.pickDailyWord || !W.ensureDaily) return;
        const today = todayIso();
        const cfg = L.levelOf ? L.levelOf(session.level) : null;
        const word = W.pickDailyWord({
            pool: pool.length ? pool : bank,
            mastery: readMastery(),
            today: today,
            focus: (cfg && cfg.focusWords) || []
        });
        W.ensureDaily(progress, word, today);
        paintDailyHud();
    }

    function maybeCompleteDaily(word, channel) {
        if (!W.completeDaily) return;
        if (channel && channel !== 'speak' && channel !== 'spell') return;
        const id = word && (word.id || word.text);
        if (!id) return;
        W.completeDaily(progress, id, todayIso());
        persist();
    }

    function openSceneLayer() {
        if (sittingRoom() <= 0) {
            openEnglishScene();
            return;
        }
        if (P && P.sceneSideKind && P.sceneSideKind(sideDueNow()) === 'phonics') {
            loadSideKinds(['phonics'], function () {
                const q = P.nextDue(sideDueNow(), {
                    cards: (session.sideByKind && session.sideByKind.phonics) || [],
                    kind: 'phonics',
                    avoidKeys: session.sideAvoid || [],
                    dueKeys: sideReviewKeys(),
                    salt: 0
                });
                if (!q) {
                    openEnglishScene();
                    return;
                }
                session.pending = { sceneSide: true };
                fillQuizCard(P.quizFromSide(q), '练一句 · 读出这个');
            });
            return;
        }
        openEnglishScene();
    }

    function openEnglishScene() {
        if (!SC) return;
        beginScene((session.scene && session.scene.sceneId) || 'greet');
        toggleLayer('scene-layer', true);
    }

    function clearSceneTimer() {
        if (session.sceneTimer) {
            clearTimeout(session.sceneTimer);
            session.sceneTimer = 0;
        }
    }

    function syncSceneFromLoop() {
        if (!SC || !session.sceneLoop) return;
        const loop = session.sceneLoop;
        session.scene = session.scene || SC.start(loop.sceneId);
        session.scene.sceneId = loop.sceneId;
        session.scene.line = loop.line;
        session.scene.done = loop.phase === 'done';
    }

    function beginScene(id) {
        if (!SC) return;
        session.scene = SC.start(id);
        if (SL && SL.startLoop) {
            session.sceneLoop = SL.startLoop(id);
            playScenePrompt();
            return;
        }
        paintScene();
    }

    function playScenePrompt() {
        syncSceneFromLoop();
        paintScene();
        const line = SC && session.scene ? SC.currentLine(session.scene) : null;
        if (!line) return;
        speakWord({ text: line.en });
        if (!SL || !session.sceneLoop) return;
        const wait = Math.max(800, Math.round(String(line.en || '').split(/\s+/).length * 450));
        clearSceneTimer();
        session.sceneTimer = setTimeout(function () {
            session.sceneLoop = SL.onPromptEnd(session.sceneLoop);
            paintScene();
            listenScene();
        }, wait);
    }

    function scenePhaseLabel(phase) {
        if (phase === 'recording') return '该你说';
        if (phase === 'waitingInterval') return '听下一遍';
        if (phase === 'waitingForUser') return '没听清，再点听我说';
        if (phase === 'done') return '场景完成';
        return '听原句';
    }

    function paintScene() {
        if (!SC || !session.scene) return;
        const sc = SC.sceneOf(session.scene.sceneId);
        const line = SC.currentLine(session.scene);
        const loop = session.sceneLoop;
        const title = document.getElementById('scene-title');
        const hint = document.getElementById('scene-hint');
        const en = document.getElementById('scene-en');
        const phaseEl = document.getElementById('scene-phase');
        const countEl = document.getElementById('scene-count');
        if (title) title.textContent = sc.title;
        if (hint) {
            const pass = loop ? ('第' + (loop.pass || 1) + '/' + (loop.passesTarget || 3) + '遍') : '';
            hint.textContent = (line ? (sc.hint + ' · ' + line.hint) : sc.hint) + (pass ? (' · ' + pass) : '');
        }
        if (en) en.textContent = line ? line.en : '场景完成';
        if (phaseEl) phaseEl.textContent = scenePhaseLabel(loop && loop.phase);
        if (countEl) {
            const show = !!(loop && loop.remainingMs && (loop.phase === 'recording' || loop.phase === 'waitingInterval'));
            countEl.hidden = !show;
            countEl.textContent = show ? ('还要 ' + Math.max(1, Math.round(loop.remainingMs / 1000)) + ' 秒') : '';
        }
        const picks = document.getElementById('scene-picks');
        if (picks && !picks.childNodes.length) {
            SC.SCENES.forEach(function (item) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'bl-btn';
                btn.setAttribute('data-scene', item.id);
                btn.textContent = item.title;
                picks.appendChild(btn);
            });
        }
        const starsEl = document.getElementById('scene-stars');
        const stars = loop ? (loop.lastStars || loop.bestStars) : (session.scene && session.scene.stars);
        if (starsEl) {
            starsEl.hidden = !stars;
            starsEl.textContent = stars ? ('★'.repeat(stars) + '☆'.repeat(Math.max(0, 3 - stars))) : '';
        }
    }

    function finishSceneWait(delayMs) {
        if (!SL || !session.sceneLoop) return;
        clearSceneTimer();
        session.sceneTimer = setTimeout(function () {
            const before = session.sceneLoop;
            session.sceneLoop = SL.onIntervalEnd(before);
            if (before && SL.stampSentence) {
                SL.stampSentence(progress, before.sceneId, before.line, {
                    stars: before.bestStars || before.lastStars || 0,
                    now: nowIso()
                });
            }
            syncSceneFromLoop();
            if (session.sceneLoop.phase === 'done') {
                toast((session.sceneLoop.lastStars ? ('★'.repeat(session.sceneLoop.lastStars) + ' ') : '') + '场景完成');
                noteQuest({ type: 'scene-done', id: session.sceneLoop.sceneId });
                persist();
                paintScene();
                return;
            }
            persist();
            playScenePrompt();
        }, Math.max(80, Number(delayMs) || 0));
    }

    function handleSceneHeard(heard) {
        if (!SC || !session.scene) return;
        if (SL && session.sceneLoop) {
            const line = SC.currentLine(session.scene) || { en: '', key: '' };
            const ev = (window.SpeechMatch && window.SpeechMatch.evaluate)
                ? window.SpeechMatch.evaluate(line.en, heard, 'sentence')
                : { pass: false, score: 0, rating: 'KeepGoing' };
            session.lastSpeechEval = ev;
            session.sceneLoop = SL.onRecordResult(session.sceneLoop, ev);
            if (RS && RS.noteHearSpeak) RS.noteHearSpeak(progress, 'speak');
            if (ev.pass && line.key) recordBridgeAnswer({ id: line.key, text: line.key }, true);
            paintScene();
            if (ev.referenceSegments) {
                paintSegments(document.getElementById('scene-en'), ev.referenceSegments, line.en || '');
            }
            toast(ev.pass ? ('★'.repeat(session.sceneLoop.lastStars || 1) + ' 记下了') : '评分低也继续，再说或等下一遍');
            persist();
            finishSceneWait(session.sceneLoop.remainingMs || 5000);
            return;
        }
        const next = SC.apply(session.scene, {
            heard: heard,
            matchHeard: SP && SP.matchHeard,
            matchPhrase: SP && SP.matchPhrase
        });
        session.scene = next;
        if (next.ok) {
            recordBridgeAnswer({ id: next.key, text: next.key }, true);
            if (next.done) {
                toast((next.stars ? ('★'.repeat(next.stars) + ' ') : '') + '场景完成');
                noteQuest({ type: 'scene-done', id: next.sceneId });
            } else {
                toast((next.stars ? ('★'.repeat(next.stars) + ' ') : '') + '下一句');
            }
        } else {
            toast('再说一次，或打关键词');
        }
        paintScene();
        const ev = session.lastSpeechEval;
        if (!next.ok && ev && ev.referenceSegments) {
            paintSegments(document.getElementById('scene-en'), ev.referenceSegments, (SC.currentLine(next) || {}).en || '');
        }
        persist();
    }

    function listenScene() {
        const line = SC && session.scene ? SC.currentLine(session.scene) : null;
        listenOnce({
            scene: true,
            lock: { word: { text: (line && (line.key || line.en)) || 'hello' } }
        });
    }

    function paintDailyHud() {
        const el = document.getElementById('daily-word');
        if (!el) return;
        const today = todayIso();
        const label = progress.dailyId || '—';
        const done = W.dailyDone && W.dailyDone({
            dailyId: progress.dailyId,
            doneId: progress.dailyDoneId,
            doneDay: progress.dailyDoneDay,
            today: today
        });
        const n = L.streakFromDates ? L.streakFromDates(playDatesOf(), today) : 0;
        el.textContent = done
            ? ('今日 ' + label + ' 做到了 · 连续 ' + n + ' 天')
            : ('今日：' + label + ' · 说一次或拼一次');
    }

    function paintParentReport() {
        if (!W.parentReport) return;
        const today = todayIso();
        const R = W.parentReport({
            today: today,
            playDates: playDatesOf(),
            speakCount: Number(progress.speakCount) || 0,
            speakByDay: progress.speakByDay || {},
            pool: pool.length ? pool : bank,
            mastery: readMastery(),
            levels: (L && L.LEVELS) || []
        });
        const streak = document.getElementById('parent-streak');
        const speak = document.getElementById('parent-speak');
        const learned = document.getElementById('parent-learned');
        const due = document.getElementById('parent-due');
        const levels = document.getElementById('parent-levels');
        const advice = document.getElementById('parent-advice');
        if (streak) streak.textContent = '连续 ' + R.streak + ' 天';
        if (speak) {
            speak.textContent = '开口 ' + R.speakCount + ' 次'
                + (R.speakToday ? '（今天 ' + R.speakToday + '）' : '');
        }
        const ratio = document.getElementById('parent-ratio');
        if (ratio) {
            ratio.textContent = RS && RS.hearSpeakLine
                ? RS.hearSpeakLine(progress.stats)
                : '听说比 还没开始';
        }
        if (learned) learned.textContent = '已学 ' + R.learned + ' 词';
        if (due) {
            due.textContent = R.dueTexts.length
                ? ('明天复习：' + R.dueTexts.join('、'))
                : '明天没有到期复习';
        }
        if (levels) {
            levels.textContent = '';
            (R.byLevel || []).forEach(function (row) {
                const li = document.createElement('li');
                li.textContent = '第' + row.level + '关 ' + row.have + '/' + row.want;
                levels.appendChild(li);
            });
        }
        if (advice) advice.textContent = R.advice || '今天可以开口一个新词';
        const side = document.getElementById('parent-side');
        if (side && P && P.parentSideLine) {
            side.textContent = P.parentSideLine({
                due: sideDueNow(),
                tracks: readSubjectTracks()
            });
        }
        paintWordPack();
    }

    function paintWordPack() {
        const pack = progress.wordPack === 'mc' ? 'mc' : 'core';
        const box = document.getElementById('word-pack');
        if (!box) return;
        const btns = box.querySelectorAll('[data-pack]');
        for (let i = 0; i < btns.length; i += 1) {
            const on = btns[i].getAttribute('data-pack') === pack;
            btns[i].classList.toggle('is-on', on);
            btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
        }
    }

    function setWordPack(pack) {
        const next = pack === 'mc' ? 'mc' : 'core';
        if (progress.wordPack === next) return;
        progress.wordPack = next;
        persist();
        paintWordPack();
        toast('下局生效 · 先关掉再进');
    }

    function recallWordCount() {
        const mastery = readMastery();
        let n = 0;
        Object.keys(mastery).forEach(function (id) {
            const stage = W.masteryStage ? W.masteryStage(mastery[id]) : '';
            if (stage === 'recall' || stage === 'spoken' || stage === 'mastered' || stage === 'due') n += 1;
        });
        return n;
    }

    function syncHud() {
        const coin = document.getElementById('coin-label');
        if (coin) coin.textContent = String(session.coins);
        const lv = document.getElementById('level-label');
        if (lv) lv.textContent = String(session.level);
        paintHearts();
        paintFood();
        paintBagCounts();
        paintQuest();
        const learned = document.getElementById('stat-learned');
        const total = document.getElementById('stat-total');
        const bankEl = document.getElementById('stat-bank');
        const unread = document.getElementById('stat-unread');
        const right = document.getElementById('stat-right');
        const wrong = document.getElementById('stat-wrong');
        const mastery = readMastery();
        const inPool = progress.learnedIds.filter(function (id) {
            return pool.some(function (w) { return w.id === id; });
        });
        const known = W.countFamiliar ? W.countFamiliar(inPool, mastery) : inPool.length;
        if (learned) learned.textContent = String(known);
        if (total) total.textContent = String(pool.length || 0);
        if (bankEl) bankEl.textContent = String(bank.length || pool.length || 0);
        if (unread) {
            unread.textContent = String(W.unreadSpeakCount
                ? W.unreadSpeakCount(progress.shownWordIds, progress.spokenWordIds)
                : Math.max(0, (pool.length || 0) - known));
        }
        if (right) right.textContent = String(progress.rightCount || 0);
        if (wrong) wrong.textContent = String(progress.wrongCount || 0);
        const atk = document.getElementById('atk-label');
        const def = document.getElementById('def-label');
        const gear = S.statsOf(progress.gear);
        const bonus = CR && CR.toolBonus ? CR.toolBonus(session.bag, session.tool) : { melee: 1 };
        if (atk) atk.textContent = String(Math.max(1, Math.round(C.BASE_MELEE * T.meleeScale(session.tool) * (bonus.melee || 1))) + gear.atk);
        const shieldDef = CR && CR.toolBonus ? (CR.toolBonus(session.bag, session.tool).def || 0) : 0;
        if (def) def.textContent = String(1 + session.level + gear.def + shieldDef);
        const xpFill = document.getElementById('xp-fill');
        const xpNum = document.getElementById('xp-num');
        const poolN = pool.length || 1;
        if (xpFill) xpFill.style.width = Math.round(known / poolN * 100) + '%';
        if (xpNum) xpNum.textContent = known + '/' + (pool.length || 0);
        const xpFillSide = document.getElementById('xp-fill-side');
        const xpNumSide = document.getElementById('xp-num-side');
        if (xpFillSide) xpFillSide.style.width = Math.round(known / poolN * 100) + '%';
        if (xpNumSide) xpNumSide.textContent = known + '/' + (pool.length || 0);
        const mpFill = document.getElementById('mp-fill');
        const mpNum = document.getElementById('mp-num');
        if (mpFill) mpFill.style.width = Math.min(100, session.combo * 25) + '%';
        if (mpNum) mpNum.textContent = 'combo ' + session.combo;
        const mpFillSide = document.getElementById('mp-fill-side');
        const mpNumSide = document.getElementById('mp-num-side');
        if (mpFillSide) mpFillSide.style.width = Math.min(100, session.combo * 25) + '%';
        if (mpNumSide) mpNumSide.textContent = 'combo ' + session.combo;
        paintSayStrip();
        const hpFill = document.getElementById('hp-fill');
        const hpNum = document.getElementById('hp-num');
        if (engine && engine.player) {
            const hp = Math.max(0, engine.player.hp);
            const hpMax = Math.max(1, engine.player.hpMax);
            if (hpFill) hpFill.style.width = Math.round(hp / hpMax * 100) + '%';
            if (hpNum) hpNum.textContent = Math.ceil(hp) + '/' + Math.ceil(hpMax);
        }
        const chapter = document.getElementById('chapter-label');
        if (chapter) {
            chapter.textContent = session.secretRun
                ? '隐藏关 · 词灵回廊 · Secret'
                : (CHAPTERS[session.level] || CHAPTERS[1]);
        }
        const power = document.getElementById('word-power');
        if (power && WM) power.textContent = '词力 ' + WM.wordPower(memNow());
        const coord = document.getElementById('coord-label');
        if (coord && engine && engine.player) {
            coord.textContent = '坐标 ' + Math.floor(engine.player.x) + ', ' + Math.floor(engine.player.z);
        }
        const bagEl = document.getElementById('bag-count');
        if (bagEl) {
            let n = 0;
            Object.keys(session.bag || {}).forEach(function (k) { n += Number(session.bag[k]) || 0; });
            bagEl.textContent = '背包 ' + n;
        }
        const low = document.getElementById('low-hp-tip');
        if (low && engine && engine.player) {
            low.classList.toggle('is-hidden', engine.player.hp > 3);
        }
        paintOpsHud();
    }

    function toast(msg) {
        const el = document.getElementById('toast');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('is-on');
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { el.classList.remove('is-on'); }, 2400);
    }

    /** 受击红闪（画面边缘） */
    function hurtFlash() {
        const el = document.getElementById('hurt-flash');
        if (!el) return;
        el.classList.add('is-on');
        clearTimeout(hurtFlash._t);
        hurtFlash._t = setTimeout(function () { el.classList.remove('is-on'); }, 130);
    }

    function wordFlash() {
        const el = document.getElementById('word-flash');
        if (!el) return;
        el.classList.add('is-on');
        clearTimeout(wordFlash._t);
        wordFlash._t = setTimeout(function () { el.classList.remove('is-on'); }, 140);
    }

    /** 倒地复活：回出生点、满血、连击清零 */
    function respawn() {
        const w = engine.world;
        const cx = Math.floor(w.size / 2), cz = Math.floor(w.size / 2);
        engine.player.x = cx + 0.5;
        engine.player.z = cz + 0.5;
        engine.player.y = w.surfaceAt(cx, cz);
        engine.player.vy = 0;
        engine.player.hp = engine.player.hpMax;
        session.combo = 0;
        session.lastHitAt = nowMs();
        MOBS.spawnBurst(engine.scene, session.fx, engine.player.x, engine.player.y + 1, engine.player.z, 0x54d43c, 14);
        if (sfx && sfx.death) sfx.death();
        toast('You fainted · 回出生点，连击清零');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
}());
