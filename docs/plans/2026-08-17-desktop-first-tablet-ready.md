# 电脑优先，平板后接

> 2026-08-17 产品选择。不是新游戏，不换 Godot，不先做独立 exe。

**目标：** 先把电脑 Chrome 做成完整陪玩；平板只预留合同，等电脑稳了再接。

**架构：** 一份 prj/games/blocklegend/ HTML。听/说走 VoicePort，模型钥匙只活在家里电脑的 buddy-proxy。平板走现有工作台 APK，不新开 appId。

**技术栈：** Three.js 页内游戏、buddy-proxy（OpenAI 兼容 deepseek-v4-flash + 可选 edge-tts + 计划中 /v1/stt 网关识别）、Web Speech 作加分项（Edge=Azure 国内通，Chrome=Google 国内大概率不通）、后续 Capacitor 语音插件（仅平板阶段兜底）。语音识别方案详见 [Phase 8](./2026-08-17-08-voice-stt-gateway.md)。

---

## 已锁定

- 电脑 = 正式版。入口：打开方块传奇.bat + 可选 打开陪玩代理.bat + 游戏内「设」。
- 平板 = 后续。默认安卓平板 + 现有 Capacitor 工作台包，不是 iPad 独立 App，也不是 Godot。
- 模型钥匙放家里电脑网关，不进 APK，不写新的 l-buddy localStorage。
- 出门用的公网网关、Tauri/Electron exe、Godot 重写：本阶段都不做。

## 冻住的合同（平板不得推翻）

- 快照是文字：look / word / doing / heard。不传图。
- 伙伴句 <= 8 词；模型 2 秒失败回模板。
- 牌子命中走现有 matchHeard，战斗不停。
- 「设」只填 gateway 地址，不填上游 CCR/OpenCode 钥匙。
- 没有麦克风时：G 打字 + V 四选一（已有）。

## 电脑现在做什么

1. Chrome 里把 V / 按住 G / 模板伙伴 / 可选 flash 跑通。
2. 代理继续绑 127.0.0.1（小孩电脑本机）。不要为了平板提前改成对全局域网开放。
3. 「设」保持可粘贴任意 URL，这样以后平板只是换地址，不改游戏。

## 平板阶段才做（现在禁止开工）

1. VoicePort：优先复用网关 /v1/stt（Phase 8 落地后平板只是换地址）；网关不够再上 Capacitor SpeechRecognizer / sherpa-onnx + 系统 TTS。
2. 网关增加可选局域网绑定（`BUDDY_PROXY_HOST`），APK「设」只填这台电脑或家里反代。
3. 触摸：按住听、大号四选一。不重做第一人称键鼠。

## 明确不做

- 不为平板先分叉一份 blocklegend。
- 不把 edge-tts / Python / API key 打进 APK。
- 不上端侧大模型。
- 不把「准备平板」理解成现在改 engine / 关卡 / 词库。
