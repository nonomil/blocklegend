# -*- coding: utf-8 -*-
"""Check every BlockLegend roster id against the six-step voxel pipeline."""
from __future__ import print_function
import json
from pathlib import Path

root = Path(__file__).resolve().parents[5]
roster_p = root / "prj/assets/generated/blocklegend-roster/roster.json"
specs_p = root / "prj/assets/generated/blocklegend-roster/four-view/specs.json"
roster = json.loads(roster_p.read_text(encoding="utf-8"))
specs = json.loads(specs_p.read_text(encoding="utf-8"))
spec_ids = set(specs["models"].keys()) if "models" in specs else {
    k for k, v in specs.items() if isinstance(v, dict) and "boxes" in v
}

prompt_dir = root / "prj/assets/generated/blocklegend-roster/source/prompts"
sheet_dir = root / "prj/assets/generated/blocklegend-roster/four-view"
review_dir = root / "prj/assets/generated/blocklegend-roster/review"
atlas_dir = root / "prj/games/blocklegend/assets/atlas4v"
factory_dir = root / "prj/games/blocklegend/assets/img2threejs"
compare = (root / "prj/games/blocklegend/compare-four-view.html").read_text(encoding="utf-8")
index = (root / "prj/games/blocklegend/index.html").read_text(encoding="utf-8")
review_html = (root / "prj/games/blocklegend/review-roster.html").read_text(encoding="utf-8")
mobs = (root / "prj/games/blocklegend/mobs.js").read_text(encoding="utf-8")
props_p = factory_dir / "createProps3d.js"
props = props_p.read_text(encoding="utf-8") if props_p.exists() else ""
words = (root / "prj/games/blocklegend/data/words.js").read_text(encoding="utf-8")

factory_map = {
    "golem": "createGolemModel.js",
    "creeper": "createCreeperModel.js",
    "zombie": "createZombieModel.js",
    "skeleton": "createSkeletonModel.js",
    "spider": "createSpiderModel.js",
    "enderman": "createEndermanModel.js",
    "piglin": "createPiglinModel.js",
    "witch": "createWitchModel.js",
    "slime": "createSlimeModel.js",
    "cube": "createSlimeModel.js",
    "magma": "createSlimeModel.js",
    "blaze": "createBlazeModel.js",
    "ghast": "createGhastModel.js",
    "warden": "createWardenModel.js",
    "fox": "createFoxModel.js",
    "wither": "createWitherModel.js",
    "dragon": "createDragonModel.js",
    "storm": "createStormModel.js",
    "husk": "createHuskModel.js",
    "ravager": "createRavagerModel.js",
    "phantom": "createPhantomModel.js",
    "vex": "createVexModel.js",
    "drowned": "createDrownedModel.js",
    "snowgolem": "createSnowGolemModel.js",
    "shulker": "createShulkerModel.js",
    "guardian": "createGuardianModel.js",
    "pufferfish": "createPufferfishModel.js",
    "spore_bug": "createSporeBugModel.js",
    "fire_spirit": "createFireSpiritModel.js",
    "sculk_worm": "createSculkWormModel.js",
    "shadow_stalker": "createShadowStalkerModel.js",
}
props_ids = {"villager", "pig", "cow", "sheep", "chicken", "wolf", "trader", "bee"}
boss_via_id = {"wither", "dragon", "storm"}

rows = []
for c in roster["characters"]:
    i = c["id"]
    fac = factory_map.get(i)
    in_props = ("build(THREE, '%s'" % i) in props
    factory_file = bool(fac and (factory_dir / fac).exists())
    factory_ok = factory_file or in_props
    via = "props3d" if in_props else (fac if factory_file else "missing")
    mobs_ok = ("kind === '%s'" % i) in mobs or i in props_ids or i in boss_via_id
    rows.append({
        "id": i,
        "zh": c.get("zh"),
        "roster_status": c.get("status"),
        "prompt": (prompt_dir / ("%s-4view.txt" % i)).exists(),
        "sheet": (sheet_dir / ("%s-4view.png" % i)).exists(),
        "spec": i in spec_ids,
        "atlas": (atlas_dir / ("%s-atlas.png" % i)).exists() and (atlas_dir / ("%s-atlas.js" % i)).exists(),
        "factory": factory_ok,
        "factory_via": via,
        "compare": ("id: '%s'" % i) in compare,
        "wired": ("%s-atlas.js" % i) in index and mobs_ok,
        "words": ("%s:" % i) in words,
        "review_png": (review_dir / ("%s-4view-compare.png" % i)).exists(),
    })

print(json.dumps({
    "characters": len(rows),
    "planned": roster.get("planned", []),
    "rows": rows,
}, ensure_ascii=False, indent=2))
