# 方块传奇 · Block Legend

在 3D 方块世界里学英语：碰到怪物先做题，说对单词才能暴击、破罩。

当前版本：**0.8.3**（2026-08-18）  
仓库：https://github.com/nonomil/blocklegend

## 这版有什么

- 12 关 384 世界，597 张核心英语词卡按气候切开
- 第一次四选一；同一词第二次：短词拼写，长词跟读或选英文
- 错过或只选过的词，后几波和远处金块会再见到
- 沙漠 / 星空 / 海洋锁定现存世界词（hot、snow、water…）
- 拼写卡有读音支架；有音频则朗读
- Boss 三阶段技能（头骨/火球/音波/冲撞），破罩必须说或拼

详见 [CHANGELOG.md](CHANGELOG.md)。

## 浏览器里玩

```powershell
npm start
```

打开 http://127.0.0.1:4173/ 。仓库根目录就是游戏本身。

操作：WASD 移动，鼠标看，左键挖/打，V 说单词，T 拼写，1–4 换工具。平板自动出现左边方向键和右边「放 / 打 / 跳」。

## 在线编译 APK

推送到 `main`，或在 GitHub Actions 里手动运行 **Build Android APK**。

- 工作流：[.github/workflows/android-apk.yml](.github/workflows/android-apk.yml)
- 产物：Actions artifact `blocklegend-apk-<branch>`
- 打 `v*` 标签时，APK 会附到 Release
- 仓库 Secrets 配齐 `ANDROID_KEYSTORE_BASE64` / `ANDROID_KEYSTORE_PASSWORD` / `ANDROID_KEY_ALIAS` / `ANDROID_KEY_PASSWORD` 后打签名包；没配则打 Debug 包

本地（需要 Node 22、Java 21、Android SDK）：

```powershell
npm install
npm run android:init
npm run android:build
```

APK 在 `android/app/build/outputs/apk/debug/app-debug.apk`。

## 目录

仓库根目录就是工作台 `prj/games/blocklegend`（`index.html`、`game.js`、`assets/atlas`、`assets/sky`、`assets/ui` 都在这一层）。另外带上它原来要跨目录加载的依赖：

| 路径 | 对应工作台 |
| --- | --- |
| `./`（游戏文件） | `prj/games/blocklegend/` |
| `shared/` | `prj/games/shared/` |
| `vocab/core-english-2026.08.15/` | `prj/assets/vocab/core-english-2026.08.15/` |
| `generated/blocklegend-roster/` | `prj/assets/generated/blocklegend-roster/` |
| `preschool-english-vocab.js` | `prj/preschool-english-vocab.js` |
| `child-courses.js` | `prj/child-courses.js` |

从工作台再同步：

```powershell
node scripts/sync-from-workbench.mjs "G:\StudyCode\个人工作台"
```

`VERSION` 写入 APK `versionName`。编 APK 时会再生成不入库的 `www/`。
