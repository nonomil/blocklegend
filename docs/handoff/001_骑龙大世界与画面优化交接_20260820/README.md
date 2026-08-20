# 001 · 骑龙大世界与画面优化交接（2026-08-20）

> 交接主题：blocklegend（Three.js r147 体素英语学习游戏）在 2026-08-20 一个会话周期内的全部优化工作——已完成 8 大项、验证方法、环境事故、以及下一步"骑龙大世界"三阶段方案。
> 接手者：新 Claude Code 会话 / Codex / 子代理。

## 一、当前目标与已完成边界

**总目标**：参考小红书笔记 6a7404da《方块传奇 BlockLegend》（骑龙高广视野、精致树木贴图、画面氛围）持续优化本项目。

### 本周期已完成（全部落盘 + 验证）

| # | 项 | 状态 | 关键位置 |
|---|---|---|---|
| 1 | 模块化：抽 `data/world-gen.js`（2161 行，~69 导出，global.BlockLegendWorld） | ✅ | index.html:496 先于 engine.js 加载 |
| 2 | 测试基线：world-gen 6 条 + atlas 5 条起步 → 现 **28/28 绿** | ✅ | `node --test "test/*.test.mjs"`（必须 glob，`test/` 不行） |
| 3 | 树木贴图：橡叶 5 色上亮下暗 + 叶顶点色第二种子+clamp + 橡树冠 3 层 | ✅ | atlas-paint.js / engine.js blockColor / world-gen eachTreeVoxel |
| 4 | 地形 tile 无缝化：dirt/stone/sand/oak_top 垂直接缝 0 | ✅ | atlas-paint.js TILES |
| 5 | 画面氛围：CLIMATE_LIGHT 15 气候全配（雾色/能见度/光色/云色） | ✅ | engine.js:740-756 applySky |
| 6 | 体素云层：InstancedMesh 1 draw call，y=42，漂移，按气候上色 | ✅ | engine.js ensureCloudLayer/tickClouds |
| 7 | 骑龙全套：R 急速 1.7×、Q/E 回旋 ±360°、左键龙息、尾迹粒子、Q/E 键冲突修复、HUD 提示 | ✅ | engine.js updateMountPhysics:1091 / game.js tryDragonBreath:1275 |
| 8 | grok 审查问题修复：W 空值守卫、?v= 戳、常量去重、叶色 clamp | ✅ | 见 docs/优化方案/2026-08-20-模块化+树木贴图-供grok审查.md |

### 明确未做/延后（勿误认为遗漏）

- **game.js 拆分**：BL-21 延后项，本周期不拆 session/tick 闭包（计划明确）
- **mobs.js window→global**：评估后决定不改（浏览器内等价 + 30+ THREE 引用回归风险）
- **独立仓 `G:\StudyCode\blocklegend` 未同步**拆分与全部优化（仍是旧 engine.js）

## 二、关键产物路径与建议阅读顺序

1. `docs/骑龙大世界方案-20260820/README.md` —— **下一步执行的方案**（三阶段）
2. 本交接包 `背景上下文/关键发现.md` + `行动项/下一步行动.md`
3. `docs/优化方案/blocklegend-全方位优化分析与迭代路线图.md` —— 中长期路线（§9 美术、§11 工程、§13 Phase）
4. `docs/优化方案/2026-08-20-模块化+树木贴图-供grok审查.md` —— 模块边界与已知风险记录
5. `docs/参考项目/敢信！8岁小孩开发的学习英语游戏操作说明/` —— 姊妹参考笔记（6a705f71）全片转写；骑龙参考 6a7404da 未缓存，操作集已提炼

## 三、禁区（不碰）

- **性能红线**：每区块一次 draw call、无阴影、无 bloom、pixelRatio≤1.5、低模（MuMu WebView 手机）
- **`global.BlockLegendEngine` 导出契约面**：game.js 大量 `ENG.*` 直读，名字逐字保留
- **15 气候区划分逻辑**：只加振幅/色彩参数，不改划分（保种子确定性）
- **不拆** engine 合批闭包（collectChunkFaces/buildChunkGeometry/vertexAO）、create() 物理闭包、game.js session 状态机
- **不接**外部 mesh 生成器（TRELLIS/Hunyuan3D 等）做运行时资产（PROMPTS.md 红线）
- **API key 铁律**：CliproxAPI 密钥只从 `G:\StudyCode\宠物积分系统\docs\生图\生图接口资源key\cliprox.local.env` 读，绝不写入文档/脚本/命令历史

## 四、接手确认协议

1. 先复述你理解的"下一步第一步"（建议：骑龙大世界 Phase 1 三常量）给用户确认
2. 确认后才动代码；每步跑 `node --check` + `node --test "test/*.test.mjs"`
3. 改 world-gen 振幅**会破 heights 测试基线**——同步更新测试期望是正当的，不许偷偷绕过断言

## 五、回溯入口

- **transcript（终极回溯，禁止整读，rg 关键词 + offset/limit≤80）**：
  `C:\Users\No'mi'l\.claude\projects\g--UserCode-------\04f0f8ea-d5cd-4dc4-8bfd-c16c4e18f02c.jsonl`
- **凝蜕状态**：blocklegend 无 `.claude/state/`，🔲 待确认（以本包 + git 无锚为准确认现状靠测试基线）
- 优先级链：本交接包 → 方案文档 → 冲突时定向查 transcript

## 六、完整度与下一跳

- 完整度：**完整**（普通任务交接 A 型）
- 下一跳建议：执行 `docs/骑龙大世界方案-20260820/README.md` 第三节 Phase 1（三常量：HEIGHT_MAX 48 / 飞行上限 90 / 云层 72），先浏览器看效果再动 rawHeight
