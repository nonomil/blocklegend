/**
 * blocklegend · 合成纯函数
 * 默认 3×3 合成台，配方可一键或按格子匹配。不读写 DOM。
 */
(function (global) {
    'use strict';

    const ITEM_NAME = {
        'oak-log': '原木', plank: '木板', stick: '木棍', table: '合成台', cobble: '圆石',
        dirt: '泥土', coal: '煤炭', string: '线', gold: '金粒', gold_ingot: '金锭', diamond: '钻石',
        iron_ore: '铁矿', iron_ingot: '铁锭',
        wood_sword: '木剑', wood_pick: '木镐', wood_axe: '木斧', wood_shovel: '木铲', wood_hoe: '木锄',
        wood_bow: '木弓', wood_shield: '木盾', arrow: '箭',
        stone_sword: '石剑', stone_pick: '石镐', stone_axe: '石斧', stone_shovel: '石铲', stone_hoe: '石锄',
        iron_sword: '铁剑', iron_pick: '铁镐', iron_axe: '铁斧', iron_shovel: '铁铲', iron_hoe: '铁锄',
        gold_sword: '金剑', gold_pick: '金镐', gold_axe: '金斧', gold_shovel: '金铲',
        diamond_sword: '钻石剑', diamond_pick: '钻石镐', diamond_axe: '钻石斧', diamond_shovel: '钻石铲',
        torch: '火把', chest: '箱子', furnace: '熔炉', door: '木门',
        fence: '栅栏', ladder: '梯子', bowl: '碗', boat: '船',
        shears: '剪刀', fishing_rod: '钓竿', bucket: '桶', lead: '拴绳', 'slime-gel': '史莱姆胶',
        sand: '沙子', glass: '玻璃', wool: '羊毛', bed: '床', lantern: '灯笼',
        tnt: 'TNT', flint_and_steel: '打火石', flint: '燧石', feather: '羽毛',
        gravel: '砂砾', clay: '粘土', sandstone: '砂岩', stone_brick: '石砖',
        brick: '砖', bricks: '砖块', carpet: '地毯', stone: '石头',
        slab: '木台阶', stairs: '木楼梯', trapdoor: '活板门',
        pressure_plate: '压力板', button: '按钮', fence_gate: '栅栏门',
        sign: '告示牌', painting: '画', flower_pot: '花盆', campfire: '营火',
        coal_block: '煤炭块', iron_block: '铁块', gold_block: '金块', diamond_block: '钻石块',
        snowball: '雪球', snow_block: '雪块', ice: '冰', packed_ice: '浮冰',
        quartz: '石英', quartz_block: '石英块',
        wheat: '小麦', bread: '面包', cookie: '饼干', cake: '蛋糕', hay: '干草块',
        apple: '苹果', golden_apple: '金苹果', milk: '牛奶',
        cooked_pork: '熟猪肉', cooked_beef: '熟牛肉', cooked_mutton: '熟羊肉', cooked_chicken: '熟鸡肉',
        pork: '猪肉', beef: '牛肉', mutton: '羊肉', chicken: '鸡肉', egg: '鸡蛋', fish: '鱼',
        cooked_fish: '熟鱼'
    };

    const RECIPES = [
        { id: 'plank', name: '橡木板', zh: '1 原木 → 4 木板', inputs: { 'oak-log': 1 }, outputs: { plank: 4 }, grid: 2, shapeless: ['oak-log'] },
        { id: 'stick', name: '木棍', zh: '2 木板 → 4 木棍', inputs: { plank: 2 }, outputs: { stick: 4 }, grid: 2, shape: [1, 2], cells: ['plank', 'plank'] },
        { id: 'table', name: '合成台', zh: '4 木板 → 1 合成台', inputs: { plank: 4 }, outputs: { table: 1 }, grid: 2, shape: [2, 2], cells: ['plank', 'plank', 'plank', 'plank'] },
        { id: 'torch', name: '火把', zh: '1 煤炭 + 1 木棍 → 4 火把', inputs: { coal: 1, stick: 1 }, outputs: { torch: 4 }, grid: 2, shape: [1, 2], cells: ['coal', 'stick'] },
        { id: 'wood_sword', name: '木剑', zh: '2 木板 + 1 木棍', inputs: { plank: 2, stick: 1 }, outputs: { wood_sword: 1 }, grid: 3, shape: [1, 3], cells: ['plank', 'plank', 'stick'] },
        { id: 'wood_pick', name: '木镐', zh: '3 木板 + 2 木棍', inputs: { plank: 3, stick: 2 }, outputs: { wood_pick: 1 }, grid: 3, shape: [3, 3], cells: ['plank', 'plank', 'plank', null, 'stick', null, null, 'stick', null] },
        { id: 'wood_axe', name: '木斧', zh: '3 木板 + 2 木棍', inputs: { plank: 3, stick: 2 }, outputs: { wood_axe: 1 }, grid: 3, shape: [2, 3], cells: ['plank', 'plank', 'plank', 'stick', null, 'stick'] },
        { id: 'wood_shovel', name: '木铲', zh: '1 木板 + 2 木棍', inputs: { plank: 1, stick: 2 }, outputs: { wood_shovel: 1 }, grid: 3, shape: [1, 3], cells: ['plank', 'stick', 'stick'] },
        { id: 'wood_hoe', name: '木锄', zh: '2 木板 + 2 木棍', inputs: { plank: 2, stick: 2 }, outputs: { wood_hoe: 1 }, grid: 3, shape: [2, 3], cells: ['plank', 'plank', null, 'stick', null, 'stick'] },
        { id: 'wood_bow', name: '木弓', zh: '3 木棍 + 3 线', inputs: { stick: 3, string: 3 }, outputs: { wood_bow: 1 }, grid: 3, shape: [3, 3], cells: [null, 'stick', 'string', 'stick', null, 'string', null, 'stick', 'string'] },
        { id: 'arrow', name: '箭', zh: '1 木棍 + 1 圆石 → 4 箭', inputs: { stick: 1, cobble: 1 }, outputs: { arrow: 4 }, grid: 3, shapeless: ['stick', 'cobble'] },
        { id: 'wood_shield', name: '木盾', zh: '6 木板 + 1 铁锭', inputs: { plank: 6, iron_ingot: 1 }, outputs: { wood_shield: 1 }, grid: 3, shape: [3, 3], cells: ['plank', 'plank', 'plank', 'plank', 'iron_ingot', 'plank', null, 'plank', null] },
        { id: 'stone_sword', name: '石剑', zh: '2 圆石 + 1 木棍', inputs: { cobble: 2, stick: 1 }, outputs: { stone_sword: 1 }, grid: 3, shape: [1, 3], cells: ['cobble', 'cobble', 'stick'] },
        { id: 'stone_pick', name: '石镐', zh: '3 圆石 + 2 木棍', inputs: { cobble: 3, stick: 2 }, outputs: { stone_pick: 1 }, grid: 3, shape: [3, 3], cells: ['cobble', 'cobble', 'cobble', null, 'stick', null, null, 'stick', null] },
        { id: 'stone_axe', name: '石斧', zh: '3 圆石 + 2 木棍', inputs: { cobble: 3, stick: 2 }, outputs: { stone_axe: 1 }, grid: 3, shape: [2, 3], cells: ['cobble', 'cobble', 'cobble', 'stick', null, 'stick'] },
        { id: 'stone_shovel', name: '石铲', zh: '1 圆石 + 2 木棍', inputs: { cobble: 1, stick: 2 }, outputs: { stone_shovel: 1 }, grid: 3, shape: [1, 3], cells: ['cobble', 'stick', 'stick'] },
        { id: 'stone_hoe', name: '石锄', zh: '2 圆石 + 2 木棍', inputs: { cobble: 2, stick: 2 }, outputs: { stone_hoe: 1 }, grid: 3, shape: [2, 3], cells: ['cobble', 'cobble', null, 'stick', null, 'stick'] },
        { id: 'iron_sword', name: '铁剑', zh: '2 铁锭 + 1 木棍', inputs: { iron_ingot: 2, stick: 1 }, outputs: { iron_sword: 1 }, grid: 3, shape: [1, 3], cells: ['iron_ingot', 'iron_ingot', 'stick'] },
        { id: 'iron_pick', name: '铁镐', zh: '3 铁锭 + 2 木棍', inputs: { iron_ingot: 3, stick: 2 }, outputs: { iron_pick: 1 }, grid: 3, shape: [3, 3], cells: ['iron_ingot', 'iron_ingot', 'iron_ingot', null, 'stick', null, null, 'stick', null] },
        { id: 'iron_axe', name: '铁斧', zh: '3 铁锭 + 2 木棍', inputs: { iron_ingot: 3, stick: 2 }, outputs: { iron_axe: 1 }, grid: 3, shape: [2, 3], cells: ['iron_ingot', 'iron_ingot', 'iron_ingot', 'stick', null, 'stick'] },
        { id: 'iron_shovel', name: '铁铲', zh: '1 铁锭 + 2 木棍', inputs: { iron_ingot: 1, stick: 2 }, outputs: { iron_shovel: 1 }, grid: 3, shape: [1, 3], cells: ['iron_ingot', 'stick', 'stick'] },
        { id: 'iron_hoe', name: '铁锄', zh: '2 铁锭 + 2 木棍', inputs: { iron_ingot: 2, stick: 2 }, outputs: { iron_hoe: 1 }, grid: 3, shape: [2, 3], cells: ['iron_ingot', 'iron_ingot', null, 'stick', null, 'stick'] },
        { id: 'gold_sword', name: '金剑', zh: '2 金锭 + 1 木棍', inputs: { gold_ingot: 2, stick: 1 }, outputs: { gold_sword: 1 }, grid: 3, shape: [1, 3], cells: ['gold_ingot', 'gold_ingot', 'stick'] },
        { id: 'gold_pick', name: '金镐', zh: '3 金锭 + 2 木棍', inputs: { gold_ingot: 3, stick: 2 }, outputs: { gold_pick: 1 }, grid: 3, shape: [3, 3], cells: ['gold_ingot', 'gold_ingot', 'gold_ingot', null, 'stick', null, null, 'stick', null] },
        { id: 'gold_axe', name: '金斧', zh: '3 金锭 + 2 木棍', inputs: { gold_ingot: 3, stick: 2 }, outputs: { gold_axe: 1 }, grid: 3, shape: [2, 3], cells: ['gold_ingot', 'gold_ingot', 'gold_ingot', 'stick', null, 'stick'] },
        { id: 'gold_shovel', name: '金铲', zh: '1 金锭 + 2 木棍', inputs: { gold_ingot: 1, stick: 2 }, outputs: { gold_shovel: 1 }, grid: 3, shape: [1, 3], cells: ['gold_ingot', 'stick', 'stick'] },
        { id: 'diamond_sword', name: '钻石剑', zh: '2 钻石 + 1 木棍', inputs: { diamond: 2, stick: 1 }, outputs: { diamond_sword: 1 }, grid: 3, shape: [1, 3], cells: ['diamond', 'diamond', 'stick'] },
        { id: 'diamond_pick', name: '钻石镐', zh: '3 钻石 + 2 木棍', inputs: { diamond: 3, stick: 2 }, outputs: { diamond_pick: 1 }, grid: 3, shape: [3, 3], cells: ['diamond', 'diamond', 'diamond', null, 'stick', null, null, 'stick', null] },
        { id: 'diamond_axe', name: '钻石斧', zh: '3 钻石 + 2 木棍', inputs: { diamond: 3, stick: 2 }, outputs: { diamond_axe: 1 }, grid: 3, shape: [2, 3], cells: ['diamond', 'diamond', 'diamond', 'stick', null, 'stick'] },
        { id: 'diamond_shovel', name: '钻石铲', zh: '1 钻石 + 2 木棍', inputs: { diamond: 1, stick: 2 }, outputs: { diamond_shovel: 1 }, grid: 3, shape: [1, 3], cells: ['diamond', 'stick', 'stick'] },
        { id: 'chest', name: '箱子', zh: '8 木板', inputs: { plank: 8 }, outputs: { chest: 1 }, grid: 3, shape: [3, 3], cells: ['plank', 'plank', 'plank', 'plank', null, 'plank', 'plank', 'plank', 'plank'], keepOnDeath: true },
        { id: 'furnace', name: '熔炉', zh: '8 圆石', inputs: { cobble: 8 }, outputs: { furnace: 1 }, grid: 3, shape: [3, 3], cells: ['cobble', 'cobble', 'cobble', 'cobble', null, 'cobble', 'cobble', 'cobble', 'cobble'] },
        { id: 'door', name: '木门', zh: '6 木板', inputs: { plank: 6 }, outputs: { door: 1 }, grid: 3, shape: [2, 3], cells: ['plank', 'plank', 'plank', 'plank', 'plank', 'plank'] },
        { id: 'fence', name: '栅栏', zh: '4 木板 + 2 木棍 → 2', inputs: { plank: 4, stick: 2 }, outputs: { fence: 2 }, grid: 3, shape: [3, 2], cells: ['plank', 'stick', 'plank', 'plank', 'stick', 'plank'] },
        { id: 'ladder', name: '梯子', zh: '7 木棍 → 3', inputs: { stick: 7 }, outputs: { ladder: 3 }, grid: 3, shape: [3, 3], cells: ['stick', null, 'stick', 'stick', 'stick', 'stick', 'stick', null, 'stick'] },
        { id: 'bowl', name: '碗', zh: '3 木板', inputs: { plank: 3 }, outputs: { bowl: 1 }, grid: 3, shape: [3, 2], cells: ['plank', null, 'plank', null, 'plank', null] },
        { id: 'boat', name: '船', zh: '5 木板', inputs: { plank: 5 }, outputs: { boat: 1 }, grid: 3, shape: [3, 2], cells: ['plank', null, 'plank', 'plank', 'plank', 'plank'] },
        { id: 'shears', name: '剪刀', zh: '2 铁锭', inputs: { iron_ingot: 2 }, outputs: { shears: 1 }, grid: 3, shape: [2, 2], cells: [null, 'iron_ingot', 'iron_ingot', null] },
        { id: 'bucket', name: '桶', zh: '3 铁锭', inputs: { iron_ingot: 3 }, outputs: { bucket: 1 }, grid: 3, shape: [3, 2], cells: ['iron_ingot', null, 'iron_ingot', null, 'iron_ingot', null] },
        { id: 'fishing_rod', name: '钓竿', zh: '3 木棍 + 2 线', inputs: { stick: 3, string: 2 }, outputs: { fishing_rod: 1 }, grid: 3, shape: [3, 3], cells: [null, null, 'stick', null, 'stick', 'string', 'stick', null, 'string'] },
        { id: 'lead', name: '拴绳', zh: '4 线 + 1 史莱姆胶', inputs: { string: 4, 'slime-gel': 1 }, outputs: { lead: 1 }, grid: 3, shapeless: ['string', 'string', 'string', 'string', 'slime-gel'] },
        { id: 'lantern', name: '灯笼', zh: '1 火把 + 1 铁锭', inputs: { torch: 1, iron_ingot: 1 }, outputs: { lantern: 1 }, grid: 2, shapeless: ['torch', 'iron_ingot'] },
        { id: 'wool', name: '羊毛', zh: '4 线 → 1 羊毛', inputs: { string: 4 }, outputs: { wool: 1 }, grid: 2, shape: [2, 2], cells: ['string', 'string', 'string', 'string'] },
        { id: 'bed', name: '床', zh: '3 羊毛 + 3 木板', inputs: { wool: 3, plank: 3 }, outputs: { bed: 1 }, grid: 3, shape: [3, 2], cells: ['wool', 'wool', 'wool', 'plank', 'plank', 'plank'] },
        { id: 'sandstone', name: '砂岩', zh: '4 沙子 → 1 砂岩', inputs: { sand: 4 }, outputs: { sandstone: 1 }, grid: 2, shape: [2, 2], cells: ['sand', 'sand', 'sand', 'sand'] },
        { id: 'stone_brick', name: '石砖', zh: '4 圆石 → 1 石砖', inputs: { cobble: 4 }, outputs: { stone_brick: 1 }, grid: 2, shape: [2, 2], cells: ['cobble', 'cobble', 'cobble', 'cobble'] },
        { id: 'bricks', name: '砖块', zh: '4 砖 → 1 砖块', inputs: { brick: 4 }, outputs: { bricks: 1 }, grid: 2, shape: [2, 2], cells: ['brick', 'brick', 'brick', 'brick'] },
        { id: 'flint', name: '燧石', zh: '3 砂砾 → 1 燧石', inputs: { gravel: 3 }, outputs: { flint: 1 }, grid: 2, shapeless: ['gravel', 'gravel', 'gravel'] },
        { id: 'carpet', name: '地毯', zh: '2 羊毛 → 3 地毯', inputs: { wool: 2 }, outputs: { carpet: 3 }, grid: 2, shape: [2, 1], cells: ['wool', 'wool'] },
        { id: 'arrow_fletch', name: '箭', zh: '1 燧石 + 1 木棍 + 1 羽毛 → 4 箭', inputs: { flint: 1, stick: 1, feather: 1 }, outputs: { arrow: 4 }, grid: 3, shape: [1, 3], cells: ['flint', 'stick', 'feather'] },
        { id: 'tnt', name: 'TNT', zh: '2 沙子 + 1 煤炭', inputs: { sand: 2, coal: 1 }, outputs: { tnt: 1 }, grid: 3, shapeless: ['sand', 'sand', 'coal'] },
        { id: 'flint_and_steel', name: '打火石', zh: '1 铁锭 + 1 煤炭', inputs: { iron_ingot: 1, coal: 1 }, outputs: { flint_and_steel: 1 }, grid: 2, shapeless: ['iron_ingot', 'coal'] },
        { id: 'slab', name: '木台阶', zh: '3 木板 → 6 台阶', inputs: { plank: 3 }, outputs: { slab: 6 }, grid: 2, shapeless: ['plank', 'plank', 'plank'] },
        { id: 'stairs', name: '木楼梯', zh: '6 木板 → 4 楼梯', inputs: { plank: 6 }, outputs: { stairs: 4 }, grid: 3, shape: [3, 3], cells: ['plank', null, null, 'plank', 'plank', null, 'plank', 'plank', 'plank'] },
        { id: 'trapdoor', name: '活板门', zh: '6 木板 → 2', inputs: { plank: 6 }, outputs: { trapdoor: 2 }, grid: 3, shape: [3, 2], cells: ['plank', 'plank', 'plank', 'plank', 'plank', 'plank'] },
        { id: 'pressure_plate', name: '压力板', zh: '2 木板', inputs: { plank: 2 }, outputs: { pressure_plate: 1 }, grid: 2, shape: [2, 1], cells: ['plank', 'plank'] },
        { id: 'button', name: '按钮', zh: '1 木板', inputs: { plank: 1 }, outputs: { button: 1 }, grid: 2, shapeless: ['plank'] },
        { id: 'fence_gate', name: '栅栏门', zh: '2 木板 + 4 木棍', inputs: { plank: 2, stick: 4 }, outputs: { fence_gate: 1 }, grid: 3, shape: [3, 2], cells: ['stick', 'plank', 'stick', 'stick', 'plank', 'stick'] },
        { id: 'sign', name: '告示牌', zh: '6 木板 + 1 木棍 → 3', inputs: { plank: 6, stick: 1 }, outputs: { sign: 3 }, grid: 3, shape: [3, 3], cells: ['plank', 'plank', 'plank', 'plank', 'plank', 'plank', null, 'stick', null] },
        { id: 'painting', name: '画', zh: '8 木棍 + 1 羊毛', inputs: { stick: 8, wool: 1 }, outputs: { painting: 1 }, grid: 3, shape: [3, 3], cells: ['stick', 'stick', 'stick', 'stick', 'wool', 'stick', 'stick', 'stick', 'stick'] },
        { id: 'flower_pot', name: '花盆', zh: '3 砖', inputs: { brick: 3 }, outputs: { flower_pot: 1 }, grid: 3, shape: [3, 2], cells: ['brick', null, 'brick', null, 'brick', null] },
        { id: 'campfire', name: '营火', zh: '3 木棍 + 1 煤炭 + 3 原木', inputs: { stick: 3, coal: 1, 'oak-log': 3 }, outputs: { campfire: 1 }, grid: 3, shape: [3, 3], cells: [null, 'stick', null, 'stick', 'coal', 'stick', 'oak-log', 'oak-log', 'oak-log'] },
        { id: 'coal_block', name: '煤炭块', zh: '9 煤炭', inputs: { coal: 9 }, outputs: { coal_block: 1 }, grid: 3, shape: [3, 3], cells: ['coal', 'coal', 'coal', 'coal', 'coal', 'coal', 'coal', 'coal', 'coal'] },
        { id: 'iron_block', name: '铁块', zh: '9 铁锭', inputs: { iron_ingot: 9 }, outputs: { iron_block: 1 }, grid: 3, shape: [3, 3], cells: ['iron_ingot', 'iron_ingot', 'iron_ingot', 'iron_ingot', 'iron_ingot', 'iron_ingot', 'iron_ingot', 'iron_ingot', 'iron_ingot'] },
        { id: 'gold_block', name: '金块', zh: '9 金锭', inputs: { gold_ingot: 9 }, outputs: { gold_block: 1 }, grid: 3, shape: [3, 3], cells: ['gold_ingot', 'gold_ingot', 'gold_ingot', 'gold_ingot', 'gold_ingot', 'gold_ingot', 'gold_ingot', 'gold_ingot', 'gold_ingot'] },
        { id: 'diamond_block', name: '钻石块', zh: '9 钻石', inputs: { diamond: 9 }, outputs: { diamond_block: 1 }, grid: 3, shape: [3, 3], cells: ['diamond', 'diamond', 'diamond', 'diamond', 'diamond', 'diamond', 'diamond', 'diamond', 'diamond'] },
        { id: 'coal_uncraft', name: '拆煤炭块', zh: '1 煤炭块 → 9 煤炭', inputs: { coal_block: 1 }, outputs: { coal: 9 }, grid: 2, shapeless: ['coal_block'] },
        { id: 'iron_uncraft', name: '拆铁块', zh: '1 铁块 → 9 铁锭', inputs: { iron_block: 1 }, outputs: { iron_ingot: 9 }, grid: 2, shapeless: ['iron_block'] },
        { id: 'gold_uncraft', name: '拆金块', zh: '1 金块 → 9 金锭', inputs: { gold_block: 1 }, outputs: { gold_ingot: 9 }, grid: 2, shapeless: ['gold_block'] },
        { id: 'diamond_uncraft', name: '拆钻石块', zh: '1 钻石块 → 9 钻石', inputs: { diamond_block: 1 }, outputs: { diamond: 9 }, grid: 2, shapeless: ['diamond_block'] },
        { id: 'snow_block', name: '雪块', zh: '4 雪球', inputs: { snowball: 4 }, outputs: { snow_block: 1 }, grid: 2, shape: [2, 2], cells: ['snowball', 'snowball', 'snowball', 'snowball'] },
        { id: 'packed_ice', name: '浮冰', zh: '4 冰', inputs: { ice: 4 }, outputs: { packed_ice: 1 }, grid: 2, shape: [2, 2], cells: ['ice', 'ice', 'ice', 'ice'] },
        { id: 'quartz_block', name: '石英块', zh: '4 石英', inputs: { quartz: 4 }, outputs: { quartz_block: 1 }, grid: 2, shape: [2, 2], cells: ['quartz', 'quartz', 'quartz', 'quartz'] },
        { id: 'bread', name: '面包', zh: '3 小麦 → 1 面包', inputs: { wheat: 3 }, outputs: { bread: 1 }, grid: 2, shapeless: ['wheat', 'wheat', 'wheat'] },
        { id: 'cookie', name: '饼干', zh: '2 小麦 + 1 鸡蛋 → 8 饼干', inputs: { wheat: 2, egg: 1 }, outputs: { cookie: 8 }, grid: 3, shape: [3, 1], cells: ['wheat', 'egg', 'wheat'] },
        { id: 'cake', name: '蛋糕', zh: '3 小麦 + 1 鸡蛋 + 1 牛奶', inputs: { wheat: 3, egg: 1, milk: 1 }, outputs: { cake: 1 }, grid: 3, shapeless: ['wheat', 'wheat', 'wheat', 'egg', 'milk'] },
        { id: 'hay', name: '干草块', zh: '9 小麦', inputs: { wheat: 9 }, outputs: { hay: 1 }, grid: 3, shape: [3, 3], cells: ['wheat', 'wheat', 'wheat', 'wheat', 'wheat', 'wheat', 'wheat', 'wheat', 'wheat'] },
        { id: 'golden_apple', name: '金苹果', zh: '1 苹果 + 8 金锭', inputs: { apple: 1, gold_ingot: 8 }, outputs: { golden_apple: 1 }, grid: 3, shape: [3, 3], cells: ['gold_ingot', 'gold_ingot', 'gold_ingot', 'gold_ingot', 'apple', 'gold_ingot', 'gold_ingot', 'gold_ingot', 'gold_ingot'] }
    ];

    const HIDDEN = {
        slab: true, stairs: true, trapdoor: true, pressure_plate: true, button: true,
        fence_gate: true, sign: true, painting: true, flower_pot: true,
        coal_block: true, iron_block: true, gold_block: true, diamond_block: true,
        coal_uncraft: true, iron_uncraft: true, gold_uncraft: true, diamond_uncraft: true,
        packed_ice: true, quartz_block: true,
        bread: true, cookie: true, cake: true, hay: true, golden_apple: true
    };

    function isOffered(id) {
        return !HIDDEN[id];
    }

    function keepsBagOnDeath(bag) {
        return countOf(bag, 'chest') > 0;
    }

    function recipeOf(id) {
        for (let i = 0; i < RECIPES.length; i += 1) {
            if (RECIPES[i].id === id) return RECIPES[i];
        }
        return null;
    }

    function countOf(bag, kind) {
        return Number(bag && bag[kind]) || 0;
    }

    function itemName(id) {
        return ITEM_NAME[id] || id;
    }

    const ITEM_EN = {
        plank: 'plank', stick: 'stick', table: 'table', torch: 'torch',
        glass: 'glass', sand: 'sand', cobble: 'cobble', chest: 'chest',
        tnt: 'tnt', flint_and_steel: 'flint',
        furnace: 'furnace', door: 'door', fence: 'fence', ladder: 'ladder',
        arrow: 'arrow', wool: 'wool', bed: 'bed', lantern: 'lantern',
        iron_ingot: 'iron', gold_ingot: 'gold',
        gravel: 'gravel', clay: 'clay', sandstone: 'sandstone',
        stone_brick: 'stone brick', bricks: 'bricks', carpet: 'carpet',
        flint: 'flint', feather: 'feather', brick: 'brick',
        slab: 'slab', stairs: 'stairs', trapdoor: 'trapdoor',
        pressure_plate: 'pressure plate', button: 'button', fence_gate: 'fence gate',
        sign: 'sign', painting: 'painting', flower_pot: 'flower pot', campfire: 'campfire',
        coal_block: 'coal block', iron_block: 'iron block', gold_block: 'gold block',
        diamond_block: 'diamond block', snow_block: 'snow block', packed_ice: 'packed ice',
        quartz_block: 'quartz block', snowball: 'snowball', ice: 'ice', quartz: 'quartz',
        wheat: 'wheat', bread: 'bread', cookie: 'cookie', cake: 'cake', hay: 'hay',
        apple: 'apple', golden_apple: 'golden apple', milk: 'milk',
        cooked_pork: 'cooked pork', cooked_beef: 'cooked beef',
        cooked_mutton: 'cooked mutton', cooked_chicken: 'cooked chicken',
        fish: 'fish', cooked_fish: 'cooked fish',
        wood_sword: 'sword', wood_pick: 'pickaxe', wood_axe: 'axe', wood_shovel: 'shovel', wood_hoe: 'hoe',
        wood_bow: 'bow', wood_shield: 'shield',
        stone_sword: 'sword', stone_pick: 'pickaxe', stone_axe: 'axe', stone_shovel: 'shovel', stone_hoe: 'hoe',
        iron_sword: 'sword', iron_pick: 'pickaxe', iron_axe: 'axe', iron_shovel: 'shovel', iron_hoe: 'hoe',
        gold_sword: 'sword', gold_pick: 'pickaxe', gold_axe: 'axe', gold_shovel: 'shovel',
        diamond_sword: 'sword', diamond_pick: 'pickaxe', diamond_axe: 'axe', diamond_shovel: 'shovel',
        lead: 'lead', 'slime-gel': 'slime'
    };
    const ITEM_ALIASES = {
        wood_pick: ['pickaxe', 'pick', 'wood pickaxe'],
        stone_pick: ['pickaxe', 'pick', 'stone pickaxe'],
        iron_pick: ['pickaxe', 'pick', 'iron pickaxe'],
        gold_pick: ['pickaxe', 'pick', 'gold pickaxe'],
        diamond_pick: ['pickaxe', 'pick', 'diamond pickaxe'],
        wood_sword: ['sword', 'wood sword'],
        stone_sword: ['sword', 'stone sword'],
        iron_sword: ['sword', 'iron sword'],
        wood_axe: ['axe', 'wood axe'],
        wood_shovel: ['shovel', 'wood shovel'],
        wood_hoe: ['hoe', 'wood hoe'],
        stone_hoe: ['hoe', 'stone hoe'],
        iron_hoe: ['hoe', 'iron hoe'],
        lead: ['lead', 'leash'],
        table: ['table', 'crafting table'],
        wood_bow: ['bow', 'wood bow'],
        wood_shield: ['shield', 'wood shield'],
        bed: ['bed'],
        lantern: ['lantern', 'lamp'],
        campfire: ['campfire'],
        iron_ingot: ['iron', 'iron ingot'],
        gold_ingot: ['gold', 'gold ingot'],
        wool: ['wool'],
        glass: ['glass'],
        tnt: ['tnt'],
        flint_and_steel: ['flint and steel'],
        sandstone: ['sandstone'],
        stone_brick: ['stone brick', 'stonebrick'],
        bricks: ['bricks', 'brick block'],
        flint: ['flint'],
        carpet: ['carpet'],
        gravel: ['gravel'],
        clay: ['clay'],
        slab: ['slab', 'wooden slab'],
        stairs: ['stairs', 'wooden stairs'],
        trapdoor: ['trapdoor'],
        pressure_plate: ['pressure plate', 'plate'],
        button: ['button'],
        fence_gate: ['fence gate', 'gate'],
        sign: ['sign'],
        painting: ['painting'],
        flower_pot: ['flower pot', 'pot'],
        campfire: ['campfire'],
        coal_block: ['coal block'],
        snow_block: ['snow block'],
        packed_ice: ['packed ice'],
        quartz_block: ['quartz block'],
        bread: ['bread'],
        cookie: ['cookie'],
        cake: ['cake'],
        hay: ['hay', 'hay bale'],
        apple: ['apple'],
        golden_apple: ['golden apple', 'gold apple'],
        boat: ['boat']
    };

    function itemEn(id) {
        return ITEM_EN[id] || String(id || '').replace(/_/g, ' ');
    }

    function craftWord(id) {
        const recipe = recipeOf(id);
        const outId = recipe ? (Object.keys(recipe.outputs)[0] || id) : id;
        const key = recipe ? recipe.id : id;
        return {
            id: key,
            text: itemEn(outId),
            zh: itemName(outId),
            aliases: ITEM_ALIASES[key] || ITEM_ALIASES[outId] || [itemEn(outId)]
        };
    }

    function normCraft(s) {
        return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
    }

    function checkCraftWord(id, typed) {
        const word = craftWord(id);
        const got = normCraft(typed);
        if (!got) return false;
        if (got === normCraft(word.text)) return true;
        return (word.aliases || []).some(function (a) { return normCraft(a) === got; });
    }

    function needsCraftSpell(id, known) {
        return !(known && known[id]);
    }

    function shuffleSeed(list, seed) {
        const out = (list || []).slice();
        let s = (Number(seed) || 1) >>> 0;
        if (!s) s = 1;
        for (let i = out.length - 1; i > 0; i -= 1) {
            s ^= s << 13; s >>>= 0;
            s ^= s >> 17; s ^= s << 5; s >>>= 0;
            const j = s % (i + 1);
            const tmp = out[i];
            out[i] = out[j];
            out[j] = tmp;
        }
        return out;
    }

    function craftQuiz(id) {
        const word = craftWord(id);
        const seen = {};
        const pool = [word.text];
        seen[normCraft(word.text)] = 1;
        RECIPES.forEach(function (r) {
            if (!isOffered(r.id) || r.id === id) return;
            const en = itemEn(Object.keys(r.outputs)[0] || r.id);
            if (!en || seen[normCraft(en)]) return;
            seen[normCraft(en)] = 1;
            pool.push(en);
        });
        ['apple', 'tree', 'water', 'stone'].forEach(function (en) {
            if (seen[normCraft(en)]) return;
            seen[normCraft(en)] = 1;
            pool.push(en);
        });
        const picks = [pool[0]];
        for (let i = 1; i < pool.length && picks.length < 4; i += 1) picks.push(pool[i]);
        let seed = 0;
        const key = String(id || '');
        for (let i = 0; i < key.length; i += 1) seed = (seed * 31 + key.charCodeAt(i)) >>> 0;
        return {
            mode: 'enpick',
            word: word,
            prompt: '看中文，选英文',
            hidePromptWord: true,
            typed: false,
            choices: shuffleSeed(picks, seed || 1),
            answer: word.text
        };
    }

    const ITEM_ICON = {
        'oak-log': 'log', plank: 'plank', stick: 'stick', table: 'table',
        cobble: 'cobble', dirt: 'dirt', coal: 'coal', string: 'string',
        gold: 'gold', gold_ingot: 'gold-ingot', diamond: 'diamond',
        iron_ore: 'iron-ore', iron_ingot: 'ingot',
        wood_sword: 'sword-wood', stone_sword: 'sword-stone', iron_sword: 'sword-iron',
        gold_sword: 'sword-gold', diamond_sword: 'sword-diamond',
        wood_pick: 'pick-wood', stone_pick: 'pick-stone', iron_pick: 'pick-iron',
        gold_pick: 'pick-gold', diamond_pick: 'pick-diamond',
        wood_axe: 'axe-wood', stone_axe: 'axe-stone', iron_axe: 'axe-iron',
        gold_axe: 'axe-gold', diamond_axe: 'axe-diamond',
        wood_shovel: 'shovel-wood', stone_shovel: 'shovel-stone',
        iron_shovel: 'shovel-iron', gold_shovel: 'shovel-gold', diamond_shovel: 'shovel-diamond',
        wood_hoe: 'shovel-wood', stone_hoe: 'shovel-stone', iron_hoe: 'shovel-iron',
        wood_bow: 'bow', wood_shield: 'shield', arrow: 'arrow', arrow_fletch: 'arrow',
        torch: 'torch', chest: 'chest', furnace: 'furnace', door: 'door',
        fence: 'fence', ladder: 'ladder', bowl: 'bowl', boat: 'boat',
        shears: 'shears', fishing_rod: 'rod', bucket: 'bucket', lead: 'string', 'slime-gel': 'string',
        sand: 'dirt', glass: 'gold', wool: 'string', bed: 'plank', lantern: 'torch',
        tnt: 'gold', flint_and_steel: 'ingot', flint: 'cobble', feather: 'string',
        gravel: 'cobble', clay: 'dirt', sandstone: 'dirt', stone_brick: 'cobble',
        brick: 'cobble', bricks: 'cobble', carpet: 'string', stone: 'cobble',
        slab: 'plank', stairs: 'plank', trapdoor: 'door', pressure_plate: 'plank',
        button: 'plank', fence_gate: 'fence', sign: 'plank', painting: 'string',
        flower_pot: 'cobble', campfire: 'coal',
        coal_block: 'coal', iron_block: 'ingot', gold_block: 'gold-ingot', diamond_block: 'diamond',
        coal_uncraft: 'coal', iron_uncraft: 'ingot', gold_uncraft: 'gold-ingot', diamond_uncraft: 'diamond',
        snowball: 'string', snow_block: 'string', ice: 'gold', packed_ice: 'gold',
        quartz: 'cobble', quartz_block: 'cobble',
        wheat: 'dirt', bread: 'dirt', cookie: 'dirt', cake: 'plank', hay: 'dirt',
        apple: 'dirt', golden_apple: 'gold', milk: 'string',
        cooked_pork: 'dirt', cooked_beef: 'dirt', cooked_mutton: 'dirt', cooked_chicken: 'dirt',
        pork: 'dirt', beef: 'dirt', mutton: 'dirt', chicken: 'dirt', egg: 'dirt', fish: 'dirt',
        cooked_fish: 'dirt'
    };

    function itemIcon(id) {
        return ITEM_ICON[id] || 'unknown';
    }

    function itemArt(id) {
        const key = String(id || '');
        if (/sword/.test(key)) return './assets/ui/sword.png';
        if (/pick/.test(key)) return './assets/ui/pickaxe.png';
        if (/axe/.test(key)) return './assets/ui/axe.png';
        if (/shovel/.test(key)) return './assets/ui/shovel.png';
        if (key === 'wood_bow') return './assets/ui/bow.png';
        if (key === 'arrow') return './assets/ui/arrow.png';
        if (key === 'dirt') return './assets/atlas/dirt.png';
        if (key === 'cobble') return './assets/atlas/stone.png';
        if (key === 'oak-log') return './assets/atlas/oak_side.png';
        if (key === 'plank' || key === 'table' || key === 'bed') return './assets/atlas/oak_top.png';
        if (key === 'sand' || key === 'sandstone') return './assets/atlas/sand.png';
        if (key === 'glass' || key === 'ice' || key === 'packed_ice') return './assets/atlas/ice.png';
        if (key === 'tnt' || key === 'gravel' || key === 'stone_brick' || key === 'brick' || key === 'bricks' || key === 'flint' || key === 'stone') return './assets/atlas/stone.png';
        if (key === 'clay') return './assets/atlas/dirt.png';
        if (key === 'wool' || key === 'carpet') return './assets/atlas/oak_top.png';
        if (key === 'flint_and_steel') return './assets/ui/axe.png';
        return '';
    }

    function recipesFor() {
        return RECIPES.filter(function (r) {
            return isOffered(r.id);
        });
    }

    function canCraft(bag, id) {
        const recipe = recipeOf(id);
        if (!recipe || !isOffered(id)) return false;
        const keys = Object.keys(recipe.inputs);
        for (let i = 0; i < keys.length; i += 1) {
            if (countOf(bag, keys[i]) < recipe.inputs[keys[i]]) return false;
        }
        return true;
    }

    function maxCraft(bag, id) {
        const recipe = recipeOf(id);
        if (!recipe || !isOffered(id)) return 0;
        const keys = Object.keys(recipe.inputs);
        let n = Infinity;
        for (let i = 0; i < keys.length; i += 1) {
            const need = recipe.inputs[keys[i]] || 0;
            if (need <= 0) continue;
            n = Math.min(n, Math.floor(countOf(bag, keys[i]) / need));
        }
        return n === Infinity ? 0 : n;
    }

    function ingredientStatus(bag, id) {
        const recipe = recipeOf(id);
        if (!recipe) return [];
        return Object.keys(recipe.inputs).map(function (k) {
            const need = recipe.inputs[k];
            const have = countOf(bag, k);
            return { id: k, need: need, have: have, ok: have >= need };
        });
    }

    function previewCells(recipe, size) {
        const n = (size || 3) * (size || 3);
        const view = [];
        for (let i = 0; i < n; i += 1) view.push(null);
        if (!recipe) return view;
        if (recipe.shapeless) {
            recipe.shapeless.forEach(function (k, i) {
                if (i < n) view[i] = k;
            });
            return view;
        }
        if (!recipe.shape || !recipe.cells) return view;
        const w = recipe.shape[0], h = recipe.shape[1];
        const grid = size || 3;
        const x0 = Math.floor((grid - w) / 2);
        const y0 = 0;
        for (let y = 0; y < h; y += 1) {
            for (let x = 0; x < w; x += 1) {
                view[(y0 + y) * grid + (x0 + x)] = recipe.cells[y * w + x] || null;
            }
        }
        return view;
    }

    function toolBonus(bag, toolId) {
        const bonus = { mine: 1, melee: 1 };
        if (toolId === 'pickaxe') {
            if (countOf(bag, 'wood_pick') > 0) bonus.mine = 1.4;
            if (countOf(bag, 'stone_pick') > 0) bonus.mine = 1.55;
            if (countOf(bag, 'gold_pick') > 0) bonus.mine = 1.68;
            if (countOf(bag, 'iron_pick') > 0) bonus.mine = 1.75;
            if (countOf(bag, 'diamond_pick') > 0 || countOf(bag, 'diamond_pickaxe') > 0) bonus.mine = 2;
        }
        if (toolId === 'axe') {
            if (countOf(bag, 'wood_axe') > 0) bonus.mine = 1.35;
            if (countOf(bag, 'stone_axe') > 0) bonus.mine = 1.5;
            if (countOf(bag, 'gold_axe') > 0) bonus.mine = 1.62;
            if (countOf(bag, 'iron_axe') > 0) bonus.mine = 1.7;
            if (countOf(bag, 'diamond_axe') > 0) bonus.mine = 1.95;
        }
        if (toolId === 'shovel') {
            if (countOf(bag, 'wood_shovel') > 0) bonus.mine = 1.35;
            if (countOf(bag, 'stone_shovel') > 0) bonus.mine = 1.5;
            if (countOf(bag, 'gold_shovel') > 0) bonus.mine = 1.62;
            if (countOf(bag, 'iron_shovel') > 0) bonus.mine = 1.7;
            if (countOf(bag, 'diamond_shovel') > 0) bonus.mine = 1.95;
        }
        if (toolId === 'sword') {
            if (countOf(bag, 'wood_sword') > 0) bonus.melee = 1.3;
            if (countOf(bag, 'gold_sword') > 0) bonus.melee = 1.36;
            if (countOf(bag, 'stone_sword') > 0) bonus.melee = 1.42;
            if (countOf(bag, 'iron_sword') > 0) bonus.melee = 1.55;
            if (countOf(bag, 'diamond_sword') > 0) bonus.melee = 1.75;
        }
        if (countOf(bag, 'wood_bow') > 0) bonus.bolt = 1.25;
        if (countOf(bag, 'wood_shield') > 0) bonus.def = 1;
        return bonus;
    }

    function craft(bag, id, opts) {
        const recipe = recipeOf(id);
        if (!recipe) return { ok: false, bag: Object.assign({}, bag || {}), reason: '没有这个配方' };
        if (!canCraft(bag, id, opts)) return { ok: false, bag: Object.assign({}, bag || {}), reason: '材料不够' };
        const next = Object.assign({}, bag || {});
        Object.keys(recipe.inputs).forEach(function (k) {
            next[k] = countOf(next, k) - recipe.inputs[k];
            if (next[k] < 0) next[k] = 0;
        });
        Object.keys(recipe.outputs).forEach(function (k) {
            next[k] = countOf(next, k) + recipe.outputs[k];
        });
        return { ok: true, bag: next, recipe: recipe };
    }

    function cellAt(cells, size, x, y) {
        return cells[y * size + x] || null;
    }

    function flipH(cells, w, h) {
        const out = [];
        for (let y = 0; y < h; y += 1) {
            for (let x = 0; x < w; x += 1) {
                out.push(cells[y * w + (w - 1 - x)] || null);
            }
        }
        return out;
    }

    function matchShapedOnce(view, size, recipe, cells) {
        const w = recipe.shape[0], h = recipe.shape[1];
        if (w > size || h > size) return null;
        for (let yoff = 0; yoff <= size - h; yoff += 1) {
            for (let xoff = 0; xoff <= size - w; xoff += 1) {
                let ok = true;
                for (let y = 0; y < size && ok; y += 1) {
                    for (let x = 0; x < size && ok; x += 1) {
                        const inPat = x >= xoff && x < xoff + w && y >= yoff && y < yoff + h;
                        const want = inPat ? (cells[(y - yoff) * w + (x - xoff)] || null) : null;
                        if ((view[y * size + x] || null) !== want) ok = false;
                    }
                }
                if (ok) return { recipe: recipe, xoff: xoff, yoff: yoff, cells: cells };
            }
        }
        return null;
    }

    function matchShaped(view, size, recipe) {
        const hit = matchShapedOnce(view, size, recipe, recipe.cells);
        if (hit || recipe.noMirror) return hit;
        return matchShapedOnce(view, size, recipe, flipH(recipe.cells, recipe.shape[0], recipe.shape[1]));
    }

    function matchShapeless(view, recipe) {
        const need = (recipe.shapeless || []).slice().sort();
        const have = view.filter(function (k) { return k; }).sort();
        if (need.length && need.length === have.length && need.every(function (k, i) { return k === have[i]; })) {
            return { recipe: recipe, xoff: 0, yoff: 0 };
        }
        return null;
    }

    function matchGrid(cells, size) {
        const n = size * size;
        if (!Array.isArray(cells)) return null;
        const view = [];
        for (let i = 0; i < n; i += 1) view.push(cells[i] || null);
        let found = null;
        for (let i = 0; i < RECIPES.length; i += 1) {
            const r = RECIPES[i];
            if (!isOffered(r.id)) continue;
            if ((r.grid || 2) > size) continue;
            const hit = r.shape ? matchShaped(view, size, r) : (r.shapeless ? matchShapeless(view, r) : null);
            if (!hit) continue;
            if (!found || (r.shape && !found.recipe.shape)) found = hit;
        }
        return found;
    }

    function consumeGrid(cells, size, hit) {
        const next = cells.slice();
        const r = hit.recipe;
        if (r.shape) {
            const w = r.shape[0], h = r.shape[1];
            const pat = hit.cells || r.cells;
            for (let y = 0; y < h; y += 1) {
                for (let x = 0; x < w; x += 1) {
                    if (pat[y * w + x]) next[(hit.yoff + y) * size + (hit.xoff + x)] = null;
                }
            }
            return next;
        }
        const need = (r.shapeless || []).slice();
        for (let i = 0; i < next.length; i += 1) {
            const idx = need.indexOf(next[i]);
            if (idx >= 0) {
                need.splice(idx, 1);
                next[i] = null;
            }
        }
        return next;
    }

    function emptyGrid(size) {
        const n = (size || 3) * (size || 3);
        const cells = [];
        for (let i = 0; i < 9; i += 1) cells.push(i < n ? null : null);
        return cells;
    }

    function dumpGrid(bag, cells) {
        const next = Object.assign({}, bag || {});
        (cells || []).forEach(function (k) {
            if (!k) return;
            next[k] = countOf(next, k) + 1;
        });
        return next;
    }

    const SMELTS = {
        iron_ingot: { inputs: { iron_ore: 1, coal: 1 }, outputs: { iron_ingot: 1 } },
        gold_ingot: { inputs: { gold: 1, coal: 1 }, outputs: { gold_ingot: 1 } },
        glass: { inputs: { sand: 1, coal: 1 }, outputs: { glass: 1 } },
        brick: { inputs: { clay: 1, coal: 1 }, outputs: { brick: 1 } },
        stone: { inputs: { cobble: 1, coal: 1 }, outputs: { stone: 1 } },
        cooked_pork: { inputs: { pork: 1, coal: 1 }, outputs: { cooked_pork: 1 } },
        cooked_beef: { inputs: { beef: 1, coal: 1 }, outputs: { cooked_beef: 1 } },
        cooked_mutton: { inputs: { mutton: 1, coal: 1 }, outputs: { cooked_mutton: 1 } },
        cooked_chicken: { inputs: { chicken: 1, coal: 1 }, outputs: { cooked_chicken: 1 } },
        cooked_fish: { inputs: { fish: 1, coal: 1 }, outputs: { cooked_fish: 1 } }
    };

    function smelt(bag, id) {
        const recipe = SMELTS[id];
        const copy = Object.assign({}, bag || {});
        if (!recipe) return { ok: false, bag: copy, reason: '没有这个熔炼' };
        const keys = Object.keys(recipe.inputs);
        for (let i = 0; i < keys.length; i += 1) {
            if (countOf(copy, keys[i]) < recipe.inputs[keys[i]]) {
                return { ok: false, bag: copy, reason: '材料不够' };
            }
        }
        const next = Object.assign({}, copy);
        keys.forEach(function (k) {
            next[k] = countOf(next, k) - recipe.inputs[k];
            if (next[k] < 0) next[k] = 0;
        });
        Object.keys(recipe.outputs).forEach(function (k) {
            next[k] = countOf(next, k) + recipe.outputs[k];
        });
        return { ok: true, bag: next, recipe: recipe };
    }

    function smeltNext(bag, prefer) {
        const ids = Object.keys(SMELTS);
        function tryId(id) {
            const r = smelt(bag, id);
            return r.ok ? r : null;
        }
        if (prefer) {
            if (SMELTS[prefer]) {
                const hit = tryId(prefer);
                if (hit) return hit;
            }
            for (let i = 0; i < ids.length; i += 1) {
                if (SMELTS[ids[i]].inputs[prefer]) {
                    const hit = tryId(ids[i]);
                    if (hit) return hit;
                }
            }
        }
        for (let i = 0; i < ids.length; i += 1) {
            const hit = tryId(ids[i]);
            if (hit) return hit;
        }
        return { ok: false, bag: Object.assign({}, bag || {}), reason: '材料不够' };
    }

    const SMELT_WORD = {
        iron_ingot: { text: 'iron', zh: '铁', aliases: ['iron', 'iron ingot'] },
        gold_ingot: { text: 'gold', zh: '金', aliases: ['gold', 'gold ingot'] },
        glass: { text: 'glass', zh: '玻璃', aliases: ['glass'] },
        brick: { text: 'brick', zh: '砖', aliases: ['brick'] },
        stone: { text: 'stone', zh: '石头', aliases: ['stone'] },
        cooked_pork: { text: 'pork', zh: '猪肉', aliases: ['pork', 'cooked pork'] },
        cooked_beef: { text: 'beef', zh: '牛肉', aliases: ['beef', 'cooked beef'] },
        cooked_mutton: { text: 'mutton', zh: '羊肉', aliases: ['mutton', 'cooked mutton'] },
        cooked_chicken: { text: 'chicken', zh: '鸡肉', aliases: ['chicken', 'cooked chicken'] },
        cooked_fish: { text: 'fish', zh: '鱼', aliases: ['fish', 'cooked fish'] }
    };

    const COOKS = {
        cooked_pork: 'pork',
        cooked_beef: 'beef',
        cooked_mutton: 'mutton',
        cooked_chicken: 'chicken',
        cooked_fish: 'fish'
    };

    function smeltWord(id) {
        const row = SMELT_WORD[id] || { text: itemEn(id), zh: itemName(id), aliases: [itemEn(id)] };
        return { id: id, text: row.text, zh: row.zh, aliases: row.aliases || [row.text] };
    }

    function checkSmeltWord(id, typed) {
        const word = smeltWord(id);
        const got = normCraft(typed);
        if (!got) return false;
        if (got === normCraft(word.text)) return true;
        return (word.aliases || []).some(function (a) { return normCraft(a) === got; });
    }

    function needsSmeltSpell(id, known) {
        return !(known && known[id]);
    }

    function smeltQuiz(id) {
        const word = smeltWord(id);
        const seen = {};
        const pool = [word.text];
        seen[normCraft(word.text)] = 1;
        Object.keys(SMELT_WORD).forEach(function (k) {
            const en = SMELT_WORD[k].text;
            if (!en || seen[normCraft(en)]) return;
            seen[normCraft(en)] = 1;
            pool.push(en);
        });
        ['sand', 'stone', 'apple', 'water'].forEach(function (en) {
            if (seen[normCraft(en)]) return;
            seen[normCraft(en)] = 1;
            pool.push(en);
        });
        const picks = [pool[0]];
        for (let i = 1; i < pool.length && picks.length < 4; i += 1) picks.push(pool[i]);
        let seed = 0;
        const key = String(id || '');
        for (let i = 0; i < key.length; i += 1) seed = (seed * 31 + key.charCodeAt(i)) >>> 0;
        return {
            mode: 'enpick',
            word: word,
            prompt: '看中文，选英文',
            hidePromptWord: true,
            typed: false,
            choices: shuffleSeed(picks, seed || 7),
            answer: word.text
        };
    }

    function cookNext(bag, prefer) {
        const copy = Object.assign({}, bag || {});
        const ids = Object.keys(COOKS);
        function tryFrom(raw) {
            for (let i = 0; i < ids.length; i += 1) {
                if (COOKS[ids[i]] !== raw) continue;
                if (countOf(copy, raw) < 1) return null;
                const next = Object.assign({}, copy);
                next[raw] = countOf(next, raw) - 1;
                if (next[raw] < 0) next[raw] = 0;
                next[ids[i]] = countOf(next, ids[i]) + 1;
                const outs = {};
                outs[ids[i]] = 1;
                return { ok: true, bag: next, recipe: { outputs: outs, from: raw }, out: ids[i] };
            }
            return null;
        }
        if (prefer) {
            if (COOKS[prefer]) {
                const hit = tryFrom(COOKS[prefer]);
                if (hit) return hit;
            }
            const byRaw = tryFrom(prefer);
            if (byRaw) return byRaw;
        }
        for (let i = 0; i < ids.length; i += 1) {
            const hit = tryFrom(COOKS[ids[i]]);
            if (hit) return hit;
        }
        return { ok: false, bag: copy, reason: '没有能烤的肉' };
    }

    function chestKey(x, y, z) {
        return Math.floor(Number(x) || 0) + ',' + Math.floor(Number(y) || 0) + ',' + Math.floor(Number(z) || 0);
    }

    function moveStack(from, to, id, n) {
        const src = Object.assign({}, from || {});
        const dst = Object.assign({}, to || {});
        const have = countOf(src, id);
        const take = n == null ? have : Math.floor(Number(n) || 0);
        if (!id || take <= 0 || have < take) {
            return { ok: false, bag: src, chest: dst, reason: '没有这个' };
        }
        src[id] = have - take;
        if (src[id] < 0) src[id] = 0;
        dst[id] = countOf(dst, id) + take;
        return { ok: true, bag: src, chest: dst };
    }

    function deposit(bag, chest, id, n) {
        const r = moveStack(bag, chest, id, n);
        return { ok: r.ok, bag: r.bag, chest: r.chest, reason: r.reason };
    }

    function withdraw(bag, chest, id, n) {
        const r = moveStack(chest, bag, id, n);
        return { ok: r.ok, bag: r.chest, chest: r.bag, reason: r.reason };
    }

    global.BlockLegendCraft = {
        RECIPES: RECIPES,
        ITEM_NAME: ITEM_NAME,
        SMELTS: SMELTS,
        isOffered: isOffered,
        keepsBagOnDeath: keepsBagOnDeath,
        recipeOf: recipeOf,
        recipesFor: recipesFor,
        canCraft: canCraft,
        maxCraft: maxCraft,
        ingredientStatus: ingredientStatus,
        previewCells: previewCells,
        toolBonus: toolBonus,
        craft: craft,
        smelt: smelt,
        smeltNext: smeltNext,
        smeltWord: smeltWord,
        smeltQuiz: smeltQuiz,
        checkSmeltWord: checkSmeltWord,
        needsSmeltSpell: needsSmeltSpell,
        cookNext: cookNext,
        chestKey: chestKey,
        deposit: deposit,
        withdraw: withdraw,
        itemName: itemName,
        itemEn: itemEn,
        craftWord: craftWord,
        checkCraftWord: checkCraftWord,
        needsCraftSpell: needsCraftSpell,
        craftQuiz: craftQuiz,
        itemIcon: itemIcon,
        itemArt: itemArt,
        ITEM_ICON: ITEM_ICON,
        matchGrid: matchGrid,
        consumeGrid: consumeGrid,
        emptyGrid: emptyGrid,
        dumpGrid: dumpGrid
    };
}(typeof window !== 'undefined' ? window : globalThis));
