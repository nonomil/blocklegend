# Phase 0：冻结基线

> **给 Claude:** 必需子技能：使用 executing-plans 逐任务实施此计划。

> **历史状态：已完成。** 本文件保留基线修复记录，不是当前入口；当前执行入口见 [plans README](./README.md) 与 [Phase 5](./2026-08-16-05-voice-world-loop.md)。

**目标：** 把当前可运行版本锁成绿测试基线，并修掉会污染后续学习闭环的已知缺陷。

**架构：** 不改玩法导演。只修装配层错误、合成数据、HUD 空壳，以及审查页测试与实现不同步。

**技术栈：** Node test runner、现有 IIFE `data/*.js`、`game.js`、`index.html`

---

### 任务 0.1：确认测试基线（BL-08）

**文件：**
- 测试：`tests/blocklegend.test.mjs`（约 L970「review roster」）
- 只读：`prj/games/blocklegend/review-roster.html`

**步骤 1：跑现有套件**

```text
node --test --test-concurrency=1 tests/blocklegend.test.mjs
```

**步骤 2：若失败是 `data-kind="pig"` 静态断言**

把断言改成匹配数据源，不要改回静态 HTML：

```js
assert.match(review, /id: 'pig'/);
assert.match(review, /review-grid/);
```

不要要求静态 `data-kind="pig"`。

**步骤 3：再跑，期望全绿或只剩本阶段将改的断言**

记录失败条数。后续任务不得引入新失败。

---

### 任务 0.2：返回链接指回方块传奇

**文件：**
- 修改：`prj/games/blocklegend/game.js`（`boot` 里 `backHref('voxel-adventure')`）
- 测试：`tests/blocklegend.test.mjs`

**步骤 1：写失败测试**

```js
test('blocklegend back link uses blocklegend theme, not voxel-adventure', () => {
  const game = fs.readFileSync(path.join(repoRoot, 'prj', 'games', 'blocklegend', 'game.js'), 'utf8');
  assert.match(game, /backHref\('blocklegend'\)/);
  assert.doesNotMatch(game, /backHref\('voxel-adventure'\)/);
});
```

**步骤 2：跑该测试，期望失败（仍指向 voxel-adventure）**

**步骤 3：最小实现**

`game.js` 中改为：

```js
back.href = bridge.backHref('blocklegend');
```

**步骤 4：再跑该测试，期望通过**

---

### 任务 0.3：连击 HUD 显示真实 combo

**文件：**
- 修改：`prj/games/blocklegend/game.js` `paintFood`
- 测试：`tests/blocklegend.test.mjs`

**步骤 1：写失败测试**

```js
test('food pips paint combo instead of a frozen full row', () => {
  const game = fs.readFileSync(path.join(repoRoot, 'prj', 'games', 'blocklegend', 'game.js'), 'utf8');
  assert.match(game, /function paintFood/);
  assert.match(game, /session\.combo/);
  assert.doesNotMatch(game, /if \(box\.childElementCount === 10\) return;/);
});
```

**步骤 2：跑测试，期望失败**

**步骤 3：最小实现**

`paintFood` 按 `session.combo`（0–5 有意义，最多画 10 格）点亮格子；`aria-label` 保持「连击」。

**步骤 4：再跑，期望通过**

---

### 任务 0.4：补 MP 条节点

**文件：**
- 修改：`prj/games/blocklegend/index.html`（`bl-xp` 旁）
- 只读：`game.js` `syncHud` 已写 `mp-fill` / `mp-num`
- 测试：`tests/blocklegend.test.mjs`

**步骤 1：写失败测试**

```js
test('hud has mp fill nodes that syncHud already writes', () => {
  const html = fs.readFileSync(path.join(repoRoot, 'prj', 'games', 'blocklegend', 'index.html'), 'utf8');
  assert.match(html, /id="mp-fill"/);
  assert.match(html, /id="mp-num"/);
});
```

**步骤 2：跑测试，期望失败**

**步骤 3：在 `bl-xp` 后加一条 MP 条，结构与 XP 相同，id 为 `mp-fill` / `mp-num`**

**步骤 4：再跑，期望通过**

---

### 任务 0.5：铁器配方改用铁锭，矿石掉落接通

**文件：**
- 修改：`prj/games/blocklegend/data/craft.js` 铁器三条配方
- 修改：`prj/games/blocklegend/data/tools.js` `DROPS.coal` / `DROPS.iron`
- 修改：`tests/blocklegend.test.mjs` 里 `iron_sword` 用圆石就能合成的旧断言
- 测试：同一文件新增用例

**步骤 1：写失败测试（先改旧断言会让现有测试先红，这是预期）**

新增：

```js
test('iron tools need iron_ingot; ore smelts with coal', () => {
  assert.equal(CR.craft({ cobble: 2, stick: 1 }, 'iron_sword', { atTable: true }).ok, false);
  assert.equal(CR.craft({ iron_ingot: 2, stick: 1 }, 'iron_sword', { atTable: true }).ok, true);
  assert.equal(CR.craft({ iron_ingot: 3, stick: 2 }, 'iron_pick', { atTable: true }).ok, true);
  assert.equal(CR.craft({ iron_ingot: 3, stick: 2 }, 'iron_axe', { atTable: true }).ok, true);
  assert.equal(typeof CR.smelt, 'function');
  const smelted = CR.smelt({ iron_ore: 1, coal: 1 }, 'iron_ingot');
  assert.equal(smelted.ok, true);
  assert.equal(smelted.bag.iron_ingot, 1);
  assert.equal(T.dropOf('iron'), 'iron_ore');
  assert.equal(T.dropOf('coal'), 'coal');
});
```

并把旧测试里这行：

```js
assert.equal(CR.craft({ cobble: 2, stick: 1 }, 'iron_sword', { atTable: true }).bag.iron_sword, 1);
```

改成期望 `ok === false`，或删掉（由新测试覆盖）。

**步骤 2：跑新测试，期望失败（无 smelt / 仍吃圆石）**

**步骤 3：最小实现**

- `ITEM_NAME` 加 `iron_ore`、`iron_ingot`
- 铁剑/镐/斧 `inputs` 改为 `iron_ingot` + `stick`，文案同步
- `smelt(bag, id)`：`iron_ore + coal → iron_ingot`
- `DROPS.iron = 'iron_ore'`，`DROPS.coal = 'coal'`

**步骤 4：跑 `tests/blocklegend.test.mjs`，期望全绿**

---

### 任务 0.6：bridge 默认进度补 gear

**文件：**
- 修改：`prj/games/shared/workbench-bridge.js` `defaultProgress('blocklegend')`
- 测试：`tests/blocklegend.test.mjs` 或现有 bridge 测试

**步骤 1：** 断言 `defaultProgress` / 读出的 blocklegend 进度含 `gear: {}`

**步骤 2：** 失败后在默认对象加 `gear: {}`

**步骤 3：** 全绿

---

## Phase 0 验收

- `node --test --test-concurrency=1 tests/blocklegend.test.mjs` 全绿
- 返回工作台链接带 `theme=blocklegend`
- 铁剑不能再用圆石合成
- 连击格子会随 combo 变化
- HTML 存在 `mp-fill` / `mp-num`

完成后进入 Phase 1，不要开始语音或关卡重构。
