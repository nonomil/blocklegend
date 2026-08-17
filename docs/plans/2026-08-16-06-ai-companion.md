# Phase 6：过肩陪玩（看见 + 提醒 + 语音对话）

> **给 Claude:** 用 executing-plans 逐任务做。只有 Phase 5 自动测试、非暂停回退和 Chrome 麦克风实测全部通过后，才做 6.1–6.3。不要加会走路的 NPC，不要截图视觉，不要新 localStorage key，不要改 `UNLOCK_COST`。

**目标：** 陪玩能看见主角在看什么、刚做了什么；用短英语提醒开口；按住 G 可以语音对话。没模型也能玩。

**架构：** 纯函数 `data/companion.js` 吃快照、吐一句台词。`game.js` 只装配：采集快照、TTS、G 键听写。模型是可选升级，超时回落模板。识别复用 Phase 5 的单实例语音控制和目标锁定机制，不能为 G 再创建一套并行 `SpeechRecognition`。

**技术栈：** 现有 Three.js r147、Web Speech API、`tests/blocklegend.test.mjs`

**产品说明：** [AI接入方案-过肩陪玩-20260816.md](../AI接入方案/AI接入方案-过肩陪玩-20260816.md)

**硬依赖门：** [Phase 5 不停战开口](./2026-08-16-05-voice-world-loop.md) 的 V 键锁目标、非暂停四选一、权限回退和 Chrome 实机表全部通过。任何一项未通过时，本阶段保持“只写方案、不写代码”。

---

### 任务 6.1：快照 + 模板提醒（无网络）

**文件：**
- 创建：`prj/games/blocklegend/data/companion.js`
- 测试：`tests/blocklegend.test.mjs`

**步骤 1：写失败测试**

```js
test('companion reminds say-word when look target is a new mob', () => {
  const P = globalThis.BlockLegendCompanion;
  const cue = P.decideCue({
    look: { type: 'mob', kind: 'slime', word: 'lemon' },
    doing: 'look',
    heard: '',
    unread: 1,
    lastCueAt: 0,
    now: 5000
  });
  assert.equal(cue.kind, 'remind');
  assert.match(cue.say, /lemon/i);
});

test('companion stays silent inside cooldown', () => {
  const P = globalThis.BlockLegendCompanion;
  const cue = P.decideCue({
    look: { type: 'mob', kind: 'slime', word: 'lemon' },
    doing: 'look',
    lastCueAt: 9000,
    now: 10000
  });
  assert.equal(cue.kind, 'silent');
});
```

**步骤 2：** `node --test --test-concurrency=1 tests/blocklegend.test.mjs` 应红在 `BlockLegendCompanion` 未定义。

**步骤 3：** 实现 `decideCue` / `replyTo`。台词 ≤ 8 词。冷却默认 4000ms。Boss 罩用 `Shield. Say <word>.`。听写命中用 `Yes! Big hit.`。

**步骤 4：** 再跑同一测试，应绿。

---

### 任务 6.2：气泡 + TTS 提醒

**文件：**
- 修改：`prj/games/blocklegend/index.html`（`#buddy-say`）
- 修改：`prj/games/blocklegend/game.css`
- 修改：`prj/games/blocklegend/game.js`（`collectSnapshot`、变化时 `decideCue`、`speechSynthesis`）
- 修改：`index.html` 帮助：`G — Talk to buddy`

只在 `lookKey` / `doing` / `heard` / 罩状态变化时问一次。不要每帧打模型。无 `speechSynthesis` 就只显示气泡。

---

### 任务 6.3：G 键语音对话

**文件：**
- 修改：`game.js`：按住 G 请求 Phase 5 的语音控制器（不打开 quiz-layer）；松开停止
- 复用：`speech-input.js` 的 `matchHeard` 与 Phase 5 的 `idle/listening/...` 状态
- 测试：`replyTo({ heard, snapshot })` 纯函数

规则：

- V 优先于 G。
- V 正在监听时按 G 不新建识别实例；G 正在监听时按 V，先安全取消 G，再启动锁定怪物的 V 挑战。
- `matchHeard(当前词牌, heard).ok` 为真 → 走战斗 `channel: 'speak'`，陪玩仍回 `Yes!`
- 否则 → `replyTo` 模板（`I see the slime.` / `Try again.`）
- 无识别：G 打开一行输入，回车发送

---

### 任务 6.4：可选模型（可后做）

仅当本局能读到 OpenAI 兼容 endpoint（工作台已有配置或本局粘贴）。**不新开存储 key。** 超时 2 秒回落 6.1。请求体只有快照 + 听写文本，不带音频、不带截图。

---

### 刻意不做

| 不做 | 原因 |
|------|------|
| 会走路的伙伴模型 | 身体不是眼睛；眼睛是快照 |
| Canvas 视觉模型 | 状态已有标准答案 |
| Player2 / Forge / Minecraft Gateway | 网页不需要 |
| 新 localStorage key | 合同禁止 |
| 火/雷/冰技能树 | 热键合同 |

---

## 验收

- 对准新怪，气泡出现 `Say <word>`，不暂停
- V 念对：陪玩 `Yes!`，伤害或碎罩生效
- 按住 G 说话：陪玩英语回复并 TTS
- 对陪玩说出词牌：怪掉血
- 没模型、没麦克风：模板 + 打字仍通关
- `node --test tests/blocklegend.test.mjs tests/world-games.test.mjs` 全绿
