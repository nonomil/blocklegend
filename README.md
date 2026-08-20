# 我的方块学园 · Blockschool

地下城闯关，边打边学。在 3D 方块世界里砍挖、合成、打怪；到期的单词会再拦路。

当前版本：**0.9.1**（2026-08-20）  
仓库：https://github.com/nonomil/blocklegend  
协议：[AGPL-3.0](LICENSE)

## 这版有什么

- 512 格世界，地形高到 48；雪地/火山有山脊和山谷，骑龙能穿云
- 说中单词会金闪、金环、短震；念对后 8 秒龙息翻倍
- 每气候一座 30 格地标，飞高了能对着找路
- 空手开局：没有现成铁剑铁镐，背包里只有一点木头，先合成木棍、木镐
- 红心不会自己回：打猪牛羊鸡做单词题，掉猪肉、牛肉、羊肉、鸡肉、羊毛；把肉放到热键栏点一下回血
- 进合成台先做一题
- 沙子能挖，沙子+煤炭合成玻璃；打怪也会掉圆石、沙子、玻璃等材料
- 答对 6 / 12 / 18 题，单词小屋发建筑材料
- 进游戏选电脑 / 网页 / 平板三种操作
- 12 关、597 张核心英语词卡

详见 [CHANGELOG.md](CHANGELOG.md)。

## 网页版

推送 `main` 后发布到 GitHub Pages：

https://nonomil.github.io/blocklegend/

工作流：[.github/workflows/github-pages.yml](.github/workflows/github-pages.yml)

## 浏览器里玩

```powershell
npm start
```

打开 http://127.0.0.1:4173/ 。仓库根目录就是游戏本身。

操作：进游戏先选模式。电脑 WASD + 鼠标锁定；网页按住拖着看；平板用左下摇杆。左键挖/打/吃，右键放方块或开合成台（先做题），V 说单词，T 拼写。靠近龙按 F 骑上（第三人称），空格升高，左键龙息。

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

## 协议

本仓库以 GNU Affero General Public License v3.0 发布。改过再通过网页提供服务时，也要把对应源码公开。完整条文见 [LICENSE](LICENSE)。

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
