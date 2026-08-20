# Phase 3：关卡与沙盒收敛

> **给 Claude:** 本阶段已有部分实现。继续家园 edits 或关卡扩展前，必须先让 [Phase 5](./2026-08-16-05-voice-world-loop.md) 通过自动测试和 Chrome 实机验收。本阶段不要加新怪物模型，先做行为模板和关卡数据。

> **状态：部分实现。** 关卡数据、行为模板、前三关 Boss、配方可见性和回忆折扣已出现；家园 edits 未做。不要因为 Phase 2 有语音骨架就绕过 Phase 5 的不停战开口门槛。

**目标：** 任意两关的目标、战斗策略、题型可被玩家区分；可见配方都有用途；建造投入可回来看见。

---

### 任务 3.1：关卡数据扩展（BL-10）

扩展 `data/levels.js` 每关字段：

```js
{
  level: 2,
  climate: 'cherry',
  wordThemes: ['动物', '自然', '方位'],
  targetWords: 6,
  reviewRatio: 0.4,
  missionType: 'find-and-guide',
  bossId: 'mirror-fox',
  bossMechanic: 'direction-callout',
  unlock: { coins: 150, recallWords: 5 }
}
```

`game.js` 用配置而不是 `if (level === 2)`。

关卡体验（来自路线图 §7.3，只改数据+任务，不先做新模型）：

| 关 | 任务 | Boss 机制 |
|----|------|-----------|
| 1 | 砍树做剑找红花 | 说 3 词破盾 |
| 2 | 按英语线索找狐狸与花 | left/right/behind |
| 3 | 收集指定数量开遗迹 | 拼写钥匙词 |
| 4 | 夜间护送、用火把 | 动作句解药水 |
| 5 | 按属性排水晶 | 近音词听辨 |
| 6 | 混合复习选路线 | 多阶段回顾到期词 |

---

### 任务 3.2：四种怪物行为模板（BL-11）

在 `data/combat.js` 加 `behaviorOf(kind)`：`chase / ranged / shield / summon`。先映射现有 17 种，不必新 AI 文件。`game.js` tick 按模板分支。每模板单测。

---

### 任务 3.3：前三关 Boss 机制不同（BL-12）

至少改 `bossId` + `bossMechanic`。模型可暂复用 wither/fox，用符文颜色和阶段文案区分。不要为了不同去抄更多 MC 专有角色。

---

### 任务 3.4：配方有效性（BL-13）

原则：配方书里出现的物品必须影响一种决策。

本阶段最小集：

- 箱子：死亡不丢本关材料（先做数据标记）
- 熔炉：`smelt` 已在 Phase 0
- 火把：洞穴附近怪物减速（combat 纯函数）
- 门/栅栏：若本阶段做不完寻路，先从**可见**配方书隐藏 boat/shears/fishing_rod/bucket/bowl

加 `CR.isOffered(id)`，UI 只列 offered。

---

### 任务 3.5：家园 edits 存档（BL-14）

推荐：冒险关不持久 + 独立家园持久。本阶段若只做一种：按 `level + worldSeed` 存 `world.edits` 差量，带数量上限和「重置世界」。`schemaVersion` 写入 progress。

---

### 任务 3.6：双路径解锁（BL-15）

`tryUnlock` 增加：本关 5 词达 recall → 金币 70% 折扣或免票。避免只刷金币或被学习卡死。

---

**状态：进行中（2026-08-16）** 3.1–3.4、3.6 已落地。3.5 家园 edits 未做。

## Phase 3 验收

- 两关任务文案与 Boss 阶段不同
- 配方书无「合成了不能用」的可见项
- 重开后家园或 edits 仍在
- 测试全绿
