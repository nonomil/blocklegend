# 方块传奇 · Block Legend

在 3D 方块世界里学英语：碰到怪物先做题，说对单词才能暴击、破罩。

当前版本：**0.8.0**（2026-08-18）  
仓库：https://github.com/nonomil/blocklegend

## 这版有什么

- 6 关 3D 冒险，597 张核心英语词卡（例句、译文、部分音频）
- 先做题再击打；答错后打几下再出题
- 题型：中英互选、听音、补全、拼写、看句子
- 准星在答题前不显示中文
- 错过的词和下次到期词会再进入关卡词池
- 按 V 开口说词：暴击并破除防护罩

详见 [CHANGELOG.md](CHANGELOG.md)。

## 浏览器里玩

```powershell
npm start
```

打开 http://127.0.0.1:4173/ 。也可以把 `www/` 放到任意静态服务器。

操作：WASD 移动，鼠标看，左键挖/打，V 说单词，T 拼写，1–4 换工具。

## 在线编译 APK

推送到 `main`，或在 GitHub Actions 里手动运行 **Build Android APK**。

- 工作流：[.github/workflows/android-apk.yml](.github/workflows/android-apk.yml)
- 产物：Actions artifact `blocklegend-apk-<branch>`
- 打 `v*` 标签时，Debug APK 会附到 Release

本地（需要 Node 22、Java 21、Android SDK）：

```powershell
npm install
npm run android:init
npm run android:build
```

APK 在 `android/app/build/outputs/apk/debug/app-debug.apk`。

## 目录

| 路径 | 说明 |
| --- | --- |
| `www/` | 可运行的游戏和词库 |
| `templates/local-bridge.js` | 独立进度存储（不依赖幼儿工作台） |
| `scripts/pack-from-workbench.mjs` | 从个人工作台再导出一版 |
| `VERSION` | 当前版本号，写入 APK `versionName` |

本仓库是从个人工作台 `prj/games/blocklegend` 整理出的独立发行包，不包含工作台其它游戏和 80MB+ 参考文档。
