# BlockLegend 体素角色管线（强制）

来源：`G:\StudyCode\小游戏项目\docs\游戏资产开发工具`
- `文档/GPT生图-小游戏资产全流程.md` 体素六步
- `skills/gpt-game-asset-pipeline/SKILL.md` 四向对照门
- `文档/体素角色管线调研-2026-08.md` 第四节

本目录**所有**角色（已有、本轮新增、后续新增）都必须走这条路。
禁止通用 image-to-3D 网格当运行时资产。禁止人眼估盒坐标。禁止单角度验收。
禁止手写噪点贴图当成品。工厂只委托 `fourViewModel.js` 吃 atlas/spec。

## 六步（不要跳）

1. 调研公开盒尺寸（ModelRenderer / MCreator）+ 身份参考。不抄官方皮肤。
2. 写角色 Bible + 四视图 prompt：`source/prompts/<id>-4view.txt`
   布局固定：左上前 / 右上右 / 左下后 / 右下左。真正交，禁止 3/4、禁止俯视。
3. GPT 出 2×2：`four-view/<id>-4view.png`。**用户过目后才编译。**
4. 公开盒写入 `four-view/specs.json`，禁止目测坐标。
5. `python prj/games/blocklegend/tools/fourview-to-atlas.py --model <id>`
   再写/改工厂，头部必须 `BlockLegendFourView.build(THREE, '<id>')`。
   接到 `index.html` / `review-roster.html` / `compare-four-view.html` / `mobs.js` / `words.js` / `roster.json`。
6. `compare-four-view.html#<id>` 四向并排逐格对。
   通过后截图存 `review/<id>-4view-compare.png`，`roster.json` 才可改 `verified_atlas`。
   不对就改 spec/投射再编译，禁止只看一个好看角度。

## 每角色工作夹（2026-08-19 已迁 40 个）

工作树在 `characters/<id>/`，按技能建夹。游戏运行时仍读扁平路径（`four-view/`、`review/`、`atlas4v/`），不要删原文件。

```text
characters/<id>/
  character.json
  refs/refs.json              # 调研门，迁夹时仍空
  four-view/prompt.txt
  four-view/<id>-4view.png    # 硬链接到扁平四视图
  four-view/{front,right,back,left}.png
  model/spec.json
  model/links.json
  model-vs-fourview/compare.png
  review.md
```

重建：`python -X utf8 prj/assets/generated/blocklegend-roster/source/migrate_to_character_folders.py`

`migrated-legacy` 不是 `verified`。还缺：下载参考图、生图 vs 参考门、模型四向截图、`gate.json`。

## 每角色必有文件（运行时扁平路径）

| 产物 | 路径 |
|---|---|
| 工作夹 | `characters/<id>/` |
| 提示词 | `source/prompts/<id>-4view.txt` |
| 四视图 | `four-view/<id>-4view.png` |
| 盒规格 | `four-view/specs.json` → `models.<id>` |
| 图集 | `prj/games/blocklegend/assets/atlas4v/<id>-atlas.{png,js}` |
| 工厂 | `img2threejs/create*Model.js` 或 `createProps3d.js` 委托 |
| 对照证据 | `review/<id>-4view-compare.png`（过门后才有） |

未过第 6 步只能写 `atlas_compiled`。没有对照截图不得写 `verified_atlas`。

## 检查命令

```powershell
python -X utf8 prj/assets/generated/blocklegend-roster/source/check_pipeline.py
```

后续新 id（Godot 原创怪、床/单词屋/商人屋、地貌地标）先写入 `roster.json` 的 `planned`，再从第 1 步开始，不得直接手写盒子进游戏。
