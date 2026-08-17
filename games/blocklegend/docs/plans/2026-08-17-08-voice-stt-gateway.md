# Phase 8 · 语音识别引擎：网关 STT 主力，Web Speech 加分项

> **给 Claude:** 必需子技能：使用 executing-plans 逐任务实施。先写失败测试，再写最少实现。

**目标：** 孩子按 V / 按住 G 说英文单词，在国内网络、无 Google 的条件下也能被识别命中。

**架构：** 识别引擎与钥匙一样放家里电脑——buddy-proxy 加 `/v1/stt`（faster-whisper）。浏览器 MediaRecorder 录短音 POST 给网关，返回文本走现有 `matchHeard`。Web Speech 可用时优先白嫖（Edge=Azure 国内通，Chrome=Google 国内大概率 `network` 错）。降级链不变：识别 → 四选一 / 打字。

**技术栈：** MediaRecorder、faster-whisper（`py` 调用，同 edge-tts 模式）、可选 Vosk grammar 受限词表。

---

## 背景判断（2026-08-17）

- 现状引擎只有 `window.SpeechRecognition`：Chrome 走 Google 服务器，国内大概率不可用；安卓 WebView 没有。这是「语音功能没实现」的最可能根因。
- 本游戏按 V 时目标词已锁定，问题是「说的是不是 slime」，受限词表识别比通用 ASR 更适合儿童发音。
- 网关 STT 与已冻结架构一致：电脑与平板走同一接口，平板阶段零新决策。

## 任务

### T8.0 决定性测试（人工，5 分钟）

状态：自动化已验网关 STT，真人麦克风未测。

2026-08-17 本机证据：`faster-whisper` 已装；默认 `tiny.en` 会卡在 HuggingFace 下载。改为默认 `tiny` + `local_files_only` 后，edge-tts 合成的 `slime.mp3` 经 `POST /v1/stt` 返回 `{"text":"slime"}`（约 5–7s）。游戏页 `buddyEndpoint=http://127.0.0.1:4210/v1` 时 `sttUrl` 自动为 `/v1/stt`，`matchHeard('slime','slime').ok === true`，世界 `paused === false`。真人按 V 说话仍待验收。

家里网络下 Edge 与 Chrome 分别打开游戏按 V，记录错误种类（`network` / `not-allowed` / 正常识别）。结论写回本文件。Edge 可用 → 电脑默认浏览器改 Edge；都不可用 → 网关 STT 升为唯一主力。

### T8.1 buddy-proxy 加 /v1/stt — 已落地

- 修改：`prj/games/blocklegend/tools/buddy-proxy.mjs`
- `POST /v1/stt` 收音频（webm/opus），落临时文件，`py` 调 faster-whisper（`tiny.en`，`initial_prompt` 喂当前关卡词表），返回 `{ text }`；无 faster-whisper 时 501，游戏自动降级。
- `GET /health` 增加 `stt` 字段。
- 测试：`tests/blocklegend.test.mjs` 静态断言 `/v1/stt` 与 501 分支存在（不起服务）。

### T8.2 游戏端网关听分支（VoicePort）— 已落地

- 修改：`game.js` `listenOnce`；`data/companion.js` 配置层加 `sttUrl`（同 `ttsUrl` 模式，query `buddyStt`）。
- 顺序：Web Speech 可用且未失败 → 用；否则 `sttUrl` 存在 → MediaRecorder 录 ≤2.5s → POST → 文本进 `matchHeard`；都没有 → 现有打字 / 四选一。
- 「连家里电脑」表单高级选项加 STT URL；**不写新 localStorage**。
- 测试：resolveBuddyConfig 解析 sttUrl；listenOnce 分支静态断言。

### T8.3 收紧 matchHeard — 已落地

- 修改：`data/speech-input.js`
- 词长 ≤3 要求全等（`red` ≠ `bed`）；≥4 才容编辑距离 1。
- 逐词匹配：`"a slime"` / `"the slime"` 拆词后命中 `slime`（对齐 companion.heardHits）。

### T8.4 平板复用 — 调研后开工（不自造引擎）

依据：[语音识别轮子调研](../优化方案/2026-08-17-语音识别轮子调研.md)。

第一刀只复用现有 `/v1/stt`，不嵌入新模型：

- 代理加 `BUDDY_PROXY_HOST`（默认仍 `127.0.0.1`），平板「设」填电脑局域网 IP。
- CORS / 明文 HTTP / WebView 麦权要一起开，否则换引擎也听不到。
- 网关不通再试 `@capacitor-community/speech-recognition`（系统听写，国内可能仍走 Google）。
- 仍听不到才接现成 [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx)（Android 或 WASM），文本仍进 `matchHeard`。
- 禁止：自训 ASR、APK 打 Python、游戏页塞 Whisper 大包。

## 验收

- Google 不可达条件下（或直接在 Chrome 里）：按 V 说词能命中（走网关 STT），世界不停。
- `node --test --test-concurrency=1 tests/blocklegend.test.mjs` 全绿。
- 不新增 localStorage key；音频只进 127.0.0.1 网关，识别完即删，不保留录音。

## 开源参考

- faster-whisper（SYSTRAN）— 网关 STT 首选
- vosk-api / vosk-browser（alphacep）— grammar 受限词表、纯浏览器 WASM 兜底
- sherpa-onnx（k2-fsa）— WASM + Android 原生，平板离线候选
- whisper-web（xenova）— 浏览器内 Whisper 参考
- @capacitor-community/speech-recognition — APK 系统识别
