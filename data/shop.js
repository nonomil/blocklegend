/**
 * blocklegend · 薄商店（纯函数）
 * 4 件儿童可达商品：三件装备占槽，药水只回血。
 */
(function (global) {
    'use strict';

    const ITEMS = [
        { id: 'leather-cap', en: 'Leather Cap', zh: '皮帽', slot: 'helm', def: 2, atk: 0, heal: 0, cost: 20 },
        { id: 'cloth-robe', en: 'Cloth Robe', zh: '布袍', slot: 'armor', def: 3, atk: 0, heal: 0, cost: 35 },
        { id: 'iron-blade', en: 'Iron Blade', zh: '铁刃', slot: 'weapon', def: 0, atk: 4, heal: 0, cost: 40 },
        { id: 'hp-potion', en: 'HP Potion', zh: '生命药水', slot: 'consumable', def: 0, atk: 0, heal: 8, cost: 12 }
    ];
    const UNLOCK_STOCK = [
        { id: 'torch-pack', en: 'Torch Pack', zh: '火把×8', slot: 'bag', bagId: 'torch', qty: 8, cost: 8, unlock: 1 },
        { id: 'stone-pick', en: 'Stone Pick', zh: '石镐', slot: 'bag', bagId: 'stone_pick', qty: 1, cost: 18, unlock: 1 },
        { id: 'arrow-pack', en: 'Arrows', zh: '箭×12', slot: 'bag', bagId: 'arrow', qty: 12, cost: 15, unlock: 2 },
        { id: 'bow-kit', en: 'Bow', zh: '木弓', slot: 'bag', bagId: 'wood_bow', qty: 1, cost: 28, unlock: 2 },
        { id: 'iron-ingot-pack', en: 'Iron Ingots', zh: '铁锭×2', slot: 'bag', bagId: 'iron_ingot', qty: 2, cost: 24, unlock: 3 },
        { id: 'shears-kit', en: 'Shears', zh: '剪刀', slot: 'bag', bagId: 'shears', qty: 1, cost: 22, unlock: 3 },
        { id: 'bucket-kit', en: 'Bucket', zh: '桶', slot: 'bag', bagId: 'bucket', qty: 1, cost: 16, unlock: 4 },
        { id: 'iron-sword-kit', en: 'Iron Sword', zh: '铁剑', slot: 'bag', bagId: 'iron_sword', qty: 1, cost: 48, unlock: 5 }
    ];

    function itemOf(id) {
        return ITEMS.concat(UNLOCK_STOCK).find(function (it) { return it.id === id; }) || null;
    }

    function catalogOf(opts) {
        const o = opts || {};
        const unlocked = Math.max(1, Number(o.unlockedLevel) || 1);
        const cleared = (o.clearedLevels || []).map(Number);
        let progress = unlocked;
        cleared.forEach(function (n) {
            if (n + 1 > progress) progress = n + 1;
        });
        return ITEMS.concat(UNLOCK_STOCK.filter(function (it) {
            return (Number(it.unlock) || 1) <= progress;
        }));
    }

    function statsOf(gear) {
        const g = gear || {};
        let atk = 0, def = 0;
        ['helm', 'armor', 'weapon'].forEach(function (slot) {
            const it = itemOf(g[slot]);
            if (!it) return;
            atk += Number(it.atk) || 0;
            def += Number(it.def) || 0;
        });
        return { atk: atk, def: def };
    }

    function mitigate(contact, def) {
        return Math.max(1, (Number(contact) || 1) - (Number(def) || 0));
    }

    function buy(state, itemId, opts) {
        const item = itemOf(itemId);
        const coined = Number(state && state.coined) || 0;
        const gear = Object.assign({}, (state && state.gear) || {});
        const rate = opts && Number(opts.discount);
        const cost = (rate > 0 && rate < 1) ? Math.max(1, Math.round(item ? item.cost * rate : 0)) : (item ? item.cost : 0);
        if (!item) return { ok: false, reason: 'unknown', coined: coined, gear: gear, heal: 0 };
        if (coined < cost) return { ok: false, reason: 'poor', coined: coined, gear: gear, heal: 0 };
        if (item.slot === 'bag') {
            return {
                ok: true,
                coined: coined - cost,
                gear: gear,
                heal: 0,
                bagId: item.bagId,
                qty: Number(item.qty) || 1,
                item: item,
                cost: cost
            };
        }
        if (item.slot === 'consumable') {
            return { ok: true, coined: coined - cost, gear: gear, heal: item.heal, item: item, cost: cost };
        }
        const next = Object.assign({}, gear);
        next[item.slot] = item.id;
        return { ok: true, coined: coined - cost, gear: next, heal: 0, item: item, cost: cost };
    }

    global.BlockLegendShop = {
        ITEMS: ITEMS,
        UNLOCK_STOCK: UNLOCK_STOCK,
        catalogOf: catalogOf,
        itemOf: itemOf,
        statsOf: statsOf,
        mitigate: mitigate,
        buy: buy
    };
}(typeof window !== 'undefined' ? window : globalThis));
