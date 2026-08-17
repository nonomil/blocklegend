# Phase 5：不停战开口（按新附图修订）

> **给 Claude:** 用 executing-plans 逐任务做。代码节点可能已经部分出现，先跑 5.0 基线，再按未通过的验收门收口。不要加火/雷/冰技能栏，不要改 `UNLOCK_COST`，不要新 localStorage key。

**目标：** 孩子对准怪物时，世界还在动；按 V 念出词牌上的英文，立刻暴击或碎罩。四选一只在没麦克风或听不清时出现。

**依据：** `docs/参考项目/敢信！8岁小孩开发的学习英语游戏操作说明/敢信！8岁小孩开发的学习英语游戏操作说明.md` 2026-08-16 新附图。

**架构：** 识别仍走 `data/speech-input.js` 的 `matchHeard`。按 V 时从 `lookSubject()` 锁定 `{ mob, word }`，一次识别的结果只能结算到该目标；左下长期保留听写区域，但浏览器只在按 V 后启动单次监听。普通砍、Boss 语音窗口和两次失败后的四选一都不进入 `quiz-layer`，世界始终运行；`openQuiz` 只保留给词块、单词闸门和独立教学。

**技术栈：** 现有 Three.js r147、Web Speech API、`tests/blocklegend.test.mjs`

---

## 新图里的主方案（不要再按旧理解做）

原版是电脑网页，不是 APK 专用方案。帮助写明：

- 左键砍、右键魔法
- **V = Voice Challenge (Say monster name)**
- 准星词牌：英文大蓝字 + 中文金色（`lemon / 柠檬`、`rise / 上升`、`pack / 打包`）
- 左下麦克风旁**实时听写**：`"pardon"`、`"plane plane plane"`
- Boss 蓝罩；念对后黄字伤害、罩破
- 左下「词汇学习」五数；不念则「未跟读」+1
- 商人 `Merchant Leo`，F 对话
- T 是传送选关（年级主题），不是我们现在的打字吟唱

新图额外钉死的细节：

- 听写结果区域**常驻**，不是常驻录音；`"ear hundred"` 一类文本会保留到下一次识别
- 右上 Listening 是词表，不是单个词：`schoolbag key fast plane approximately`，下方还有 `My English: N words`
- 参考的 T = 传送。**我们的 T 仍是打字吟唱**，选关继续走现有关卡菜单，不要抢键

已有并可复用：词牌、五数、未跟读、碎罩规则、题卡麦克风、正前方出怪、`matchHeard`、通道倍率。工作区中可能已出现 V、听写节点和商人文案，但只有经过本计划全部自动与实机门槛后才能标完成。

---

### 任务 5.0：重跑基线，保护并行改动

**文件：**
- 只读：`prj/games/blocklegend/data/words.js`
- 只读：`prj/games/blocklegend/game.js`
- 只读：`prj/games/blocklegend/index.html`
- 只读：`prj/games/blocklegend/game.css`
- 只读：`tests/blocklegend.test.mjs`

**步骤 1：确认工作区状态**

从 `G:\StudyCode\个人工作台` 运行：

```text
git status --short -- prj/games/blocklegend tests/blocklegend.test.mjs
```

预期：允许存在用户或其他任务的改动；不得还原、覆盖或重新生成这些文件。

**步骤 2：运行 BlockLegend 基线**

```text
node --test --test-concurrency=1 tests/blocklegend.test.mjs
```

记录通过/失败数和失败测试名。已经通过的目标测试不重写；只为缺失行为补测试。

**步骤 3：搜索旧消费者**

```text
rg -n "requestHit|openQuiz|shouldAsk|shouldNudgeSpeak|startVoiceChallenge|paintHeard|heard-text|Each normal mob asks|A boss asks" prj/games/blocklegend tests/blocklegend.test.mjs
```

预期：能列出攻击、语音、帮助文案的全部相关位置。此步骤只建立清单，不改代码。

---

### 任务 5.1：砍怪不再暂停

**文件：**
- 修改：`prj/games/blocklegend/data/words.js:463` 附近（`shouldAsk` / `shouldNudgeSpeak`）
- 修改：`prj/games/blocklegend/game.js:1343` 附近（`requestHit`）
- 测试：`tests/blocklegend.test.mjs`

**步骤 1：确认纯逻辑测试已表达新合同**

应覆盖：

```js
assert.equal(W.shouldAsk({ firstHit: true }), false);
assert.equal(W.shouldAsk({ voiceFails: 1 }), false);
assert.equal(W.shouldAsk({ voiceFails: 2 }), true);
assert.equal(W.shouldNudgeSpeak({ firstHit: true }), true);
assert.equal(W.shouldNudgeSpeak({ boss: true, hp: 40, maxHp: 80, askedCount: 0 }), true);
```

`shouldAsk` 的名字为兼容旧调用保留，但语义变成“是否提供回退选择”，不再代表“是否暂停开题”。

**步骤 2：运行目标测试**

```text
node --test --test-concurrency=1 --test-name-pattern "regular first hit" tests/blocklegend.test.mjs
```

预期：未实现时失败；实现后通过。

**步骤 3：收口 `requestHit`**

- 普通怪每次左键都直接走 `applyResolvedHit(..., { answered: false, correct: false })`。
- 第一次命中只调用 `shouldNudgeSpeak` 点亮词牌/提示 `按 V 说 <word>`，不调用 `openQuiz`。
- Boss 到血量门槛只更新 `nudgeCount` 和开口提示，不写 `session.pending`，不改 `session.paused`。
- `voiceFails` 只由 V 识别失败更新，不由普通攻击消费，避免玩家第二次砍击时突然弹层。

**步骤 4：验证持续普通攻击仍可赢**

普通伤害保持 1.0×；不说、不拼也能磨死普通怪和 Boss，只是护盾阶段更慢。不要把语音变成硬门槛。

通关不依赖语音：一直砍也能赢，只是慢。

---

### 任务 5.2：V 键开口 + 听写回显

**文件：**
- 修改：`prj/games/blocklegend/index.html`（`#heard-box`、`#heard-text`，默认 `""`）
- 修改：`prj/games/blocklegend/game.js:258-325` 附近（V 键合同）
- 修改：`prj/games/blocklegend/game.js:1968` 附近（`paintHeard`、`startVoiceChallenge`、单次识别）
- 修改：`prj/games/blocklegend/game.css`（听写状态，不遮挡准星词牌）
- 测试：`tests/blocklegend.test.mjs`

**步骤 1：锁定按键瞬间的目标**

V 只接受 `lookSubject().type === 'mob'` 且存在 `mob.word.text` 的目标。启动监听时保存不可变快照：

```js
{
  mob: sub.mob,
  word: sub.mob.word,
  targetKey: wordKey(sub.mob.word),
  startedAt: Date.now()
}
```

识别回调不得再次调用 `nearestLookMob()` 决定受击对象。玩家等待识别时即使转向另一只怪，结果也只能作用于最初锁定的怪；目标已死亡、超距或换词时，显示“目标已离开”，不伤害其他对象。

**步骤 2：建立单实例语音状态**

会话内至少区分：`idle / listening / matched / not-matched / mic-blocked / timeout / unsupported`。同一时刻只允许一个 `SpeechRecognition`；监听中再次按 V 应忽略或取消后重启，不能并行创建多个实例。

听写区保持可见，但只有 `listening` 状态显示声波动画。常驻区域不等于持续录音。

**步骤 3：结算成功**

- `paintHeard(alts[0])` 显示带引号的最终文本。
- `matchHeard(locked.word.text, heard).ok` 为真时，调用 `noteWordSpoken(locked.word)`。
- 普通怪走 `channel: 'speak'` 暴击；Boss 先走 `shieldChipOf('speak')`，再同步护罩、黄字伤害、音效和任务进度。
- 一个普通怪的绑定词在其存活期间保持稳定；不要因成功一次就在识别回调里换成别的词。

**步骤 4：结算失败**

- `not-matched`：显示实际听到的文本，第一次只提示“再按 V”。
- `mic-blocked`：显示权限说明，不重复触发系统授权框。
- `timeout/no-speech`：写“没有听清”，不要算成发音错误。
- `unsupported`：直接提供非暂停四选一，同时保留 T 打字吟唱。

**步骤 5：帮助合同**

加入：`V — Voice Challenge (say the word on the plaque). The world does not pause.`

删除“Each normal mob asks one 4-choice word card”和“A boss asks 2–3 times”一类过时战斗说明。词块/闸门的题卡说明可以保留。

---

### 任务 5.3：两次失败后的非暂停四选一

**文件：**
- 修改：`prj/games/blocklegend/index.html`（在准星词牌/听写区附近增加轻量回退容器，不使用 `.bl-layer`）
- 修改：`prj/games/blocklegend/game.js`（`showVoiceFallback` / `resolveVoiceFallback`）
- 修改：`prj/games/blocklegend/game.css`
- 测试：`tests/blocklegend.test.mjs`

**交互合同：**

- 第一次 `not-matched`：只显示听到的词和“再按 V”。
- 同一怪物连续第二次 `not-matched`：在准星附近显示四个中文含义，可点击或按 1–4。
- 没有麦克风/浏览器不支持：第一次按 V 就显示同一套四选一；T 仍可进入打字吟唱。
- 回退出现时不得调用 `openQuiz`、`toggleLayer('quiz-layer', true)` 或 `engine.setUiMode(true)`；`session.paused` 必须保持 `false`。
- 回退只绑定当前锁定怪，玩家切换目标、目标死亡或选择完成后立即收起。
- 世界、怪物 AI 和普通攻击继续运行；玩家不选择也能继续砍。

**测试最少覆盖：**

```js
assert.equal(W.shouldAsk({ voiceFails: 1 }), false);
assert.equal(W.shouldAsk({ voiceFails: 2 }), true);
```

并对装配代码增加合同检查：语音失败分支调用 `showVoiceFallback`，不能直接调用 `openQuiz(mob, ...)`。不要删除 `openQuiz`，词块和闸门仍需要它。

---

### 任务 5.4：商人铭牌与 Listening 条

**文件：** `index.html`、`game.js`、`game.css`

- 商人头顶：`Merchant Leo · 商人雷奥`（英文在前）
- 走近：`Press F to talk to Merchant Leo`
- 右上 Listening：`Say:` 后跟本关 6–8 个 focus 词（已有 `sayStrip`）
- Listening 下方：`My English: N words`，N 复用当前 familiar/已学统计，不新增存储
- 不新开存储 key

---

### 任务 5.5：自动测试收口

**文件：**
- 测试：`tests/blocklegend.test.mjs`
- 回归：`tests/world-games.test.mjs`

**步骤 1：目标测试**

```text
node --test --test-concurrency=1 --test-name-pattern "regular first hit|voice challenge|quiz overlay" tests/blocklegend.test.mjs
```

预期：新战斗测试通过；旧 `quiz overlay` 测试只验证词块/闸门/独立题卡，不再要求普通怪调用它。

**步骤 2：完整 BlockLegend 测试**

```text
node --test --test-concurrency=1 tests/blocklegend.test.mjs
```

预期：0 fail。记录实际 tests/pass/fail，不能沿用文档中的历史数字。

**步骤 3：世界游戏回归**

```text
node --test --test-concurrency=1 tests/world-games.test.mjs
```

预期：0 fail；工作台入口、共享存档和其他世界游戏不受影响。

---

### 任务 5.6：桌面 Chrome 实机验收

Web Speech API、麦克风权限和识别延迟不能由 Node 静态测试代替。使用桌面 Chrome 逐项记录结果：

| 场景 | 操作 | 必须看到 | 禁止出现 |
|---|---|---|---|
| 普通砍 | 对准怪连续左击 | 怪持续移动、普通黄/白字伤害、词牌仍在 | `quiz-layer`、镜头解锁、世界冻结 |
| V 命中 | 对准 `lemon` 按 V 并念对 | 左下 `"lemon"`、暴击、未跟读减少 | 额外确认按钮、伤到别的怪 |
| V 锁目标 | 对怪 A 按 V 后转向怪 B | 结果只作用于 A，或 A 离开后安全取消 | 识别结果转移到 B |
| V 两次不匹配 | 连续念错两次 | 第二次出现准星旁四选一，世界仍动 | 全屏题卡、`session.paused=true` |
| 权限拒绝 | 拒绝麦克风后按 V | 直接出现回退选择；T 仍可打字 | 反复系统授权、卡死 |
| Boss | 对蓝罩 Boss 按 V 念对 | 护罩/状态文字/大伤害同步变化 | 只变数字不变罩、强制弹题 |
| 商人 | 靠近 Merchant Leo 按 F | 英文在前的铭牌与交易提示 | 抢占 T/V 键 |

验收时通过 `window.__blDebug.session.paused` 确认普通砍、监听和回退期间均为 `false`。建议保存 30–60 秒录屏作为完成证据。

---

### 刻意不做（新图有、本仓库不做）

| 新图有 | 为什么不做 |
|--------|------------|
| 火/雷/冰 1–3 技能栏 | 热键合同是 4 工具；Q 已是魔法 |
| 传送价 1万–10万、玩家 Lv11+ | `UNLOCK_COST` 已锁 0/50/150/300/500/800 |
| 家长报告整页 | 当前只复用已有统计；儿童/家长报告分层按 BL-09A 单独立项 |
| 原生 APK 语音插件 | 先验证桌面 Chrome 的 V；APK 另开 |

---

## 验收

- 进关正前方有怪；对准即出词牌，**不弹层**
- Chrome 按 V，左下出现听到的英文；对上则出黄字伤害
- Boss 念对或打对碎蓝罩
- 听错两次或没麦克风：出现非暂停四选一；T 打字仍可用；普通砍仍能通关
- V 键使用按下瞬间锁定的怪物/单词，不会因识别期间转视角而误伤
- 听写区域常驻、录音不常驻；权限拒绝后有明确恢复路径
- `Listening / Say / My English` 与商人铭牌英文在前，且不新增存储 key
- BlockLegend 和 world-games 两组测试均 0 fail
- Chrome 实机表全部通过并留下录屏/截图证据

**状态：实现与验证进行中（2026-08-16）。** 工作区已出现部分 V/听写/商人实现，但“代码节点存在”不等于完成。只有上述自动测试和 Chrome 实机验收同时通过，才能把本阶段改为完成。

做完实机验收再开 [Phase 6 过肩陪玩](./2026-08-16-06-ai-companion.md)。AI 先不写。
