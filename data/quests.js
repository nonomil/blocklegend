/**
 * blocklegend · 关卡任务纯函数（Phase 1）
 * 第一关五步引导；其他关先视为已完成，避免挡住旧流程。
 */
(function (global) {
    'use strict';

    const LEVEL1 = [
        { id: 'look-tree', title: '找到会发光的橡树', hint: 'WASD 走到树前，对准它' },
        { id: 'make-sword', title: '砍 1 块原木，做一把木剑', hint: '按 2 用斧砍树，再按 C 合成' },
        { id: 'hit-slime', title: '听懂并击败史莱姆', hint: '对准 slime，答对意思再打' },
        { id: 'learn-five', title: '熟悉 8 个不同的词', hint: '答对 8 个不一样的词，重复不算' },
        { id: 'break-boss', title: '用 3 个词击破 Boss 护盾', hint: '对 Boss 答对，蓝罩变红' }
    ];
    const LEVEL2 = [
        { id: 'find-fox', title: '按英语线索找到狐狸', hint: '听 left / right / behind，走到狐狸旁边' },
        { id: 'pick-flower', title: '采一朵会发光的花', hint: '对准花或树叶，看英文名字' },
        { id: 'learn-six', title: '熟悉 10 个不同的词', hint: '答对 10 个不一样的词，重复不算' },
        { id: 'break-boss', title: '对镜子狐狸喊出方位破盾', hint: '说 left / right / behind' }
    ];
    const LEVEL3 = [
        { id: 'collect-loot', title: '收集材料打开遗迹', hint: '挖沙石、打怪，凑齐钥匙材料' },
        { id: 'spell-key', title: '拼出钥匙词打开门', hint: '对着闸门把英文拼出来' },
        { id: 'break-boss', title: '拼写钥匙词击破守卫', hint: '拼对才能削罩' }
    ];
    const LEVEL4 = [
        { id: 'look', kind: 'skeleton', title: '在暮色里找到骷髅', hint: '对准 skeleton，看英文' },
        { id: 'kill', kind: 'phantom', title: '答对并打掉一只幻翼', hint: '对准 phantom，答对再打' },
        { id: 'learn', need: 16, title: '熟悉 16 个不同的夜间词', hint: '答对 16 个不一样的词，重复不算' },
        { id: 'break-boss', title: '对末影龙说对词破罩', hint: '对准 Boss 答对，蓝罩变红' }
    ];
    const LEVEL5 = [
        { id: 'look', kind: 'witch', title: '在深暗找到女巫', hint: '对准 witch，看英文' },
        { id: 'look', kind: 'golem', title: '去村子看铁傀儡', hint: '对准 iron golem' },
        { id: 'learn', need: 16, title: '熟悉 16 个不同的描述词', hint: '答对 16 个不一样的词，重复不算' },
        { id: 'break-boss', title: '听近音击破监守者', hint: '对准 Boss 答对破罩' }
    ];
    const LEVEL6 = [
        { id: 'look', kind: 'blaze', title: '看清下界的烈焰人', hint: '对准 blaze' },
        { id: 'kill', kind: 'magma', title: '答对并打掉岩浆怪', hint: '对准 magma cube，答对再打' },
        { id: 'learn', need: 16, title: '熟悉 16 个不同的高频词', hint: '答对 16 个不一样的词，重复不算' },
        { id: 'break-boss', title: '用复习词击破恶魂', hint: '对准 Boss 答对破罩' }
    ];
    const LEVEL7 = [
        { id: 'look', kind: 'husk', title: '在采石场找到尸壳', hint: '对准 husk' },
        { id: 'kill', kind: 'creeper', title: '答对并打掉苦力怕', hint: '对准 creeper，答对再打' },
        { id: 'learn', need: 16, title: '熟悉 16 个不同的矿区词', hint: '答对 16 个不一样的词，重复不算' },
        { id: 'break-boss', title: '说对词击破劫掠兽', hint: '对准 Boss 答对破罩' }
    ];
    const LEVEL8 = [
        { id: 'look', kind: 'phantom', title: '在星空找到幻翼', hint: '对准 phantom' },
        { id: 'look', kind: 'vex', title: '看见一只恼鬼', hint: '对准 vex' },
        { id: 'learn', need: 16, title: '熟悉 16 个不同的星空词', hint: '答对 16 个不一样的词，重复不算' },
        { id: 'break-boss', title: '听近音击破风暴', hint: '对准 Boss 答对破罩' }
    ];
    const LEVEL9 = [
        { id: 'look', kind: 'drowned', title: '在岸边找到溺尸', hint: '对准 drowned' },
        { id: 'look', kind: 'pufferfish', title: '去水塘看河豚', hint: '对准水里的 pufferfish' },
        { id: 'learn', need: 16, title: '熟悉 16 个不同的海洋词', hint: '答对 16 个不一样的词，重复不算' },
        { id: 'break-boss', title: '拼写击破潮汐守卫', hint: '对准 Boss 拼对破罩' }
    ];
    const LEVEL10 = [
        { id: 'look', kind: 'slime', title: '在蘑菇谷找到史莱姆', hint: '对准 slime' },
        { id: 'look', kind: 'bee', title: '看见一只蜜蜂', hint: '对准 bee' },
        { id: 'learn', need: 16, title: '熟悉 16 个不同的颜色词', hint: '答对 16 个不一样的词，重复不算' },
        { id: 'break-boss', title: '喊方位击破镜子狐狸', hint: '对准 Boss 答对破罩' }
    ];
    const LEVEL11 = [
        { id: 'look', kind: 'blaze', title: '看清火山里的烈焰人', hint: '对准 blaze' },
        { id: 'kill', kind: 'magma', title: '答对并打掉岩浆怪', hint: '对准 magma cube，答对再打' },
        { id: 'learn', need: 16, title: '熟悉 16 个不同的热词', hint: '答对 16 个不一样的词，重复不算' },
        { id: 'break-boss', title: '用复习词击破烈焰人', hint: '对准 Boss 答对破罩' }
    ];
    const LEVEL12 = [
        { id: 'look', kind: 'enderman', title: '在虚空找到末影人', hint: '对准 enderman' },
        { id: 'look', kind: 'shulker', title: '找到潜影贝塔', hint: '对准 shulker' },
        { id: 'learn', need: 20, title: '熟悉 20 个不同的末地词', hint: '答对 20 个不一样的词，重复不算' },
        { id: 'break-boss', title: '对末影龙说对词破罩', hint: '对准 Boss 答对破罩' }
    ];
    const BY_LEVEL = {
        1: LEVEL1, 2: LEVEL2, 3: LEVEL3, 4: LEVEL4, 5: LEVEL5, 6: LEVEL6,
        7: LEVEL7, 8: LEVEL8, 9: LEVEL9, 10: LEVEL10, 11: LEVEL11, 12: LEVEL12
    };

    function create(level) {
        const lv = Math.max(1, Number(level) || 1);
        const steps = BY_LEVEL[lv];
        if (!steps) {
            return { level: lv, step: 0, steps: [], complete: true, wordCorrect: 0 };
        }
        return { level: lv, step: 0, steps: steps.slice(), complete: false, wordCorrect: 0 };
    }

    function current(q) {
        const s = q || create(1);
        if (s.complete || !s.steps || !s.steps.length || s.step >= s.steps.length) {
            return { id: 'done', title: '本关完成', hint: '', complete: true };
        }
        return s.steps[s.step];
    }

    function matches(step, ev) {
        if (!step || !ev) return false;
        if (step.id === 'look-tree') return ev.type === 'look' && ev.kind === 'log';
        if (step.id === 'make-sword') return ev.type === 'craft' && ev.id === 'wood_sword';
        if (step.id === 'hit-slime') {
            return ev.type === 'kill' && ev.kind === 'slime' && !!ev.quizCorrect;
        }
        if (step.id === 'learn-five') {
            return ev.type === 'word-correct' && (Number(ev.count) || 0) >= 8;
        }
        if (step.id === 'find-fox') return ev.type === 'look' && ev.kind === 'fox';
        if (step.id === 'pick-flower') {
            return ev.type === 'look' && (ev.kind === 'leaf' || ev.kind === 'flower' || ev.kind === 'grass');
        }
        if (step.id === 'learn-six') {
            return ev.type === 'word-correct' && (Number(ev.count) || 0) >= 10;
        }
        if (step.id === 'collect-loot') return ev.type === 'collect' || ev.type === 'mine';
        if (step.id === 'spell-key') {
            return ev.type === 'gate-open' || (ev.type === 'word-correct' && ev.channel === 'spell');
        }
        if (step.id === 'break-boss') return ev.type === 'boss-shield-break';
        if (step.id === 'look') return ev.type === 'look' && ev.kind === step.kind;
        if (step.id === 'kill') return ev.type === 'kill' && ev.kind === step.kind && !!ev.quizCorrect;
        if (step.id === 'learn') return ev.type === 'word-correct' && (Number(ev.count) || 0) >= (Number(step.need) || 8);
        return false;
    }

    function apply(q, ev) {
        const src = q || create(1);
        const next = {
            level: src.level,
            step: src.step,
            steps: (src.steps || []).slice(),
            complete: !!src.complete,
            wordCorrect: Number(src.wordCorrect) || 0
        };
        if (ev && ev.type === 'word-correct') {
            next.wordCorrect = Math.max(next.wordCorrect, Number(ev.count) || 0);
        }
        if (next.complete) return next;
        if (!matches(next.steps[next.step], ev)) return next;
        next.step += 1;
        if (next.step >= next.steps.length) next.complete = true;
        return next;
    }

    global.BlockLegendQuests = {
        create: create,
        current: current,
        apply: apply,
        LEVEL1: LEVEL1,
        LEVEL2: LEVEL2,
        LEVEL3: LEVEL3,
        BY_LEVEL: BY_LEVEL
    };
}(typeof window !== 'undefined' ? window : globalThis));
