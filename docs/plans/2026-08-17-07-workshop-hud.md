# Phase 7：工作台世界 HUD（Nick Workshop 合入）

> **给 Claude:** 用 executing-plans 逐任务做。不要加生活/家务模块，不要新 localStorage key，不要改 UNLOCK_COST，不要加钻石武器。

**目标：** 把「12岁小孩哥用AI手搓我的世界工作台」里能直接服务孩子开口打怪的世界手感合进 BlockLegend：今日任务、双语小卖部/合成台/背包、坐标与背包计数、低血/倒下提示、通关等级奖励。

**来源（只读）：** `G:/UserCode/跨平台采集器/notes/游戏设计/游戏化学习工作台/12岁小孩哥用AI手搓我的世界工作台/12岁小孩哥用AI手搓我的世界工作台.md`

**架构：** 只改 `index.html` 文案结构、`game.css` 工作台色块、`game.js` 的 `syncHud` / 商店行 / 倒下提示。不重写引擎，不把学前工作台的学习/生活/家务导航搬进战斗页。

**技术栈：** 现有 Three.js r147、`tests/blocklegend.test.mjs`

---

## 合入 / 不合入

| 笔记里的想法 | 合入？ | 落到哪里 |
|---|---|---|
| Nick's Workshop + Lv 徽章 + XP 条 | 合入文案 | 左上 Explorer Workshop，已有 Lv/XP |
| 今天要处理 / Today's Alerts | 合入 | 任务条改成红边今日提醒，仍用现有 quest |
| 学习 / Study · 百词斩式打卡 | 合入标题 | 词汇学习面板改双语，不接外部打卡 App |
| 世界 WASD / 跳 / 挖矿放置 | 已有，补提示 | 底栏：点击挖矿 · 右键放置 |
| 坐标 + 背包物品数 | 合入 | `#coord-label` `#bag-count` |
| 小卖部材料卡 + 购买 Buy | 合入样式 | F 商店改 小卖部 / Shop，商品英中 + Buy |
| 合成台 / Crafting Table + 背包格 | 合入文案 | C 合成层标题与 Inventory 改双语 |
| 没血 / 倒下有提示 | 合入 | HP<=3 出 Low HP 条；倒下 toast 英文在前 |
| 等级奖励 / Level Rewards | 合入 | 通关卡加奖励区标题 |
| 生活 / 家务模块 | 不合入 | 属于学前工作台，不是战斗世界 |
| 家长锁 | 不合入 | 禁止新存储 key；返回工作台即可 |
| 用 XP 买橡木板 | 不合入 | 现币是金币；材料继续挖/合成 |

---

### 任务 7.1：失败测试

**文件：** `tests/blocklegend.test.mjs`

应覆盖：`Today's Alerts`、`小卖部 / Shop`、`合成台 / Crafting Table`、`id="coord-label"`、`id="bag-count"`、`id="low-hp-tip"`、`Level Rewards`、`syncHud` 写坐标。保留旧合同 `词汇学习` 与 `id="quest-goal"`。

```text
node --test --test-concurrency=1 --test-name-pattern "workshop hud" tests/blocklegend.test.mjs
```

### 任务 7.2：HTML/CSS 工作台壳

**文件：** `index.html`、`game.css`

左上今日提醒、学习双语、世界坐标/背包数、低血条、小卖部/合成台/通关奖励标题。帮助加一行：`Click to mine · Right click to place`。

### 任务 7.3：装配 syncHud / 商店卡 / 倒下

**文件：** `game.js`

`syncHud` 写 `坐标 x, z` 与背包件数；HP<=3 显示 `#low-hp-tip`；商店行改成英中 + `购买 Buy`；倒下 toast：`You fainted · 回出生点`。

### 任务 7.4：验证

```text
node --test --test-concurrency=1 tests/blocklegend.test.mjs
node --test --test-concurrency=1 tests/world-games.test.mjs
```

**状态：实现中（2026-08-17）。**
