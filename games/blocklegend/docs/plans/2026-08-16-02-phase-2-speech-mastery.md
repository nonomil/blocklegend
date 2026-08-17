# Phase 2：语音与掌握闭环 MVP

> **给 Claude:** 先完成 Phase 0 和 Phase 1。本阶段才允许加麦克风。

> **状态：部分实现，验收未通过。** 本文件保留可复用的数据骨架；凡涉及战斗触发、V 键、听写回显、Boss 开口窗口和四选一回退的描述，均以 [Phase 5](./2026-08-16-05-voice-world-loop.md) 为准。

**目标：** 说出或拼出单词能改变战局；麦克风失败两步内落到拼写/选择；HUD 不再把「答对一次」叫掌握。

**架构：** 新纯函数 `data/speech-input.js` 只做结果归一化（成功 / 无权限 / 不支持 / 超时 / 噪声 / 不匹配）。浏览器 `SpeechRecognition` 适配放 `game.js` 薄封装。掌握阶段映射复用工作台 `courseProgress.minecraft.mastery`，不另造库。

**技术栈：** Web Speech API（可选）、现有 `speechSynthesis`、Node 单测只测纯函数

---

### 任务 2.1：语音结果归一化（BL-04）

**文件：**
- 创建：`prj/games/blocklegend/data/speech-input.js`
- 测试：`tests/blocklegend.test.mjs`

```js
test('speech matcher accepts close child pronunciations and five failure kinds', () => {
  const S = globalThis.BlockLegendSpeech;
  assert.equal(S.matchHeard('tree', 'tree').ok, true);
  assert.equal(S.matchHeard('tree', 'tre').ok, true); // edit distance 1
  assert.equal(S.matchHeard('tree', 'flower').ok, false);
  ['no-permission', 'unsupported', 'timeout', 'noise', 'mismatch'].forEach((k) => {
    assert.ok(S.fail(k).kind === k);
  });
});
```

不持久化录音。不上传第三方。

---

### 任务 2.2：拼写/选择回退（BL-05）

本任务只保留四选一/拼写的数据通道：`canSpeak()` 为 false 时，非战斗题卡不渲染麦克风按钮。战斗中的无麦克风回退由 Phase 5 放在准星旁，不能打开全屏题卡或暂停世界。通关路径不得依赖语音。

伤害档位（写入 `data/combat.js`，保持可测）：

| 通道 | 倍率 | 备注 |
|------|------|------|
| 普通命中 | 1.0× | 可慢慢赢 |
| 选择正确 | 2.0× | 入门 |
| 拼写正确 | 3.0× | 主动回忆 |
| 发音通过 | 3.0× + 护盾额外 -1 | 开口 |
| 连击 3 不同词 | 4.0× | 现有 combo 上限可复用 |

现有测试绑死 `CRIT_MULT = 3`。**先加 `channelMultiplier(channel)`，不要改旧 `critMultiplier` 默认值**，避免全盘红。`game.js` 新通道走新函数。

---

### 任务 2.3：掌握阶段映射（BL-09）

阶段：`new / familiar / recall / spoken / mastered / due`

纯函数 `W.masteryStage(record)`：

- 从未答：new
- 识别对 1 次：familiar
- 拼写或听力对 2 次：recall
- 发音过 1 次：spoken
- 跨 3 天且混合题型稳定：mastered
- 到达复习日：due

HUD「已学」改为 familiar+ 数量，不要把一次正确当 mastered。

---

### 任务 2.4：普通怪不停战快速挑战（旧方案作废）

旧方案曾设想“普通怪准星旁两选一、Boss 继续大题卡”。新版附图证明主路径应统一为：准星对怪显示其绑定词，按 V 开口，成功后直接暴击/碎罩；普通攻击、监听过程和回退选择都不冻结世界。

本任务不再在 Phase 2 内执行。不要以 `engine.setUiMode('quiz')` 或 Boss 大题卡完成战斗语音；转由 Phase 5 实现。词块、单词闸门和独立教学仍可使用原有题卡。

---

**实现边界（2026-08-16）：** `data/speech-input.js`、通道倍率、Boss 碎罩和掌握阶段属于已出现的骨架；这不等于 Phase 2 完成。只有 Phase 5 的真实 Chrome 主路径通过后，Phase 2 才能关闭。

## Phase 2 验收（重新打开）

- 无麦克风设备能通关
- 安静环境 20 常用词匹配（含编辑距离 1）可测
- 原始录音不落盘
- 掌握阶段单测全绿
- 普通砍、V 监听、Boss 语音窗口和四选一回退均保持 `session.paused === false`
- 对准怪 A 按 V 后，即使视角转向怪 B，识别结果也只能结算到按键瞬间锁定的怪 A
- `openQuiz` 不再由普通怪首击、Boss 血量门槛或语音失败直接触发

以上任一项缺少自动化或 Chrome 实机证据时，本阶段状态保持“部分实现”。
