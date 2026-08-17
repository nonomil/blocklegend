"""Orthographic 4-view sheets from public voxel cuboid specs."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[4]
SPEC = ROOT / "prj/assets/generated/blocklegend-roster/four-view/specs.json"
OUT = SPEC.parent
SCALE = 7
PAD = 18
LABEL_H = 22
PANEL = 4


def hex_rgb(value: str) -> tuple[int, int, int]:
    v = value.lstrip("#")
    return int(v[0:2], 16), int(v[2:4], 16), int(v[4:6], 16)


def shade(color: str, amount: float) -> tuple[int, int, int]:
    r, g, b = hex_rgb(color)
    r = max(0, min(255, int(r * amount)))
    g = max(0, min(255, int(g * amount)))
    b = max(0, min(255, int(b * amount)))
    return r, g, b


def project(box: dict, view: str) -> tuple[float, float, float, float, float]:
    x, y, z = box["x"], box["y"], box["z"]
    w, h, d = box["w"], box["h"], box["d"]
    if view == "front":
        return x - w / 2, y - h / 2, w, h, z + d / 2
    if view == "back":
        return -(x + w / 2), y - h / 2, w, h, -(z - d / 2)
    if view == "left":
        return z - d / 2, y - h / 2, d, h, -(x - w / 2)
    return -(z + d / 2), y - h / 2, d, h, x + w / 2


def bounds(boxes: list[dict]) -> tuple[float, float, float, float]:
    xs: list[float] = []
    ys: list[float] = []
    for view in ("front", "back", "left", "right"):
        for box in boxes:
            px, py, pw, ph, _ = project(box, view)
            xs.extend([px, px + pw])
            ys.extend([py, py + ph])
    return min(xs), min(ys), max(xs), max(ys)


def draw_view(draw: ImageDraw.ImageDraw, boxes: list[dict], view: str, ox: int, oy: int, min_x: float, min_y: float) -> None:
    ordered = sorted(boxes, key=lambda b: project(b, view)[4])
    for box in ordered:
        px, py, pw, ph, _ = project(box, view)
        x0 = ox + int((px - min_x) * SCALE)
        y0 = oy + int((max_y_to_use - (py + ph)) * SCALE)
        x1 = x0 + max(1, int(pw * SCALE))
        y1 = y0 + max(1, int(ph * SCALE))
        fill = shade(box["color"], 0.92 if view in ("back", "left") else 1.0)
        draw.rectangle([x0, y0, x1 - 1, y1 - 1], fill=fill, outline=shade(box["color"], 0.62))


max_y_to_use = 0.0


def render_one(name: str, model: dict) -> Path:
    global max_y_to_use
    boxes = model["boxes"]
    min_x, min_y, max_x, max_y = bounds(boxes)
    max_y_to_use = max_y
    width = int((max_x - min_x) * SCALE) + PAD * 2
    height = int((max_y - min_y) * SCALE) + PAD * 2 + LABEL_H
    sheet = Image.new("RGBA", (width * PANEL, height), (20, 24, 30, 255))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("arial.ttf", 14)
    except OSError:
        font = ImageFont.load_default()
    labels = ("front", "right", "back", "left")
    for i, view in enumerate(labels):
        ox = i * width
        draw.rectangle([ox, 0, ox + width - 1, height - 1], outline=(70, 80, 96, 255))
        draw.text((ox + 8, 4), f"{model.get('zh', name)} {view}", fill=(244, 240, 230, 255), font=font)
        draw_view(draw, boxes, view, ox + PAD, PAD + LABEL_H, min_x, min_y)
    dest = OUT / f"{name}-4view.png"
    sheet.save(dest)
    return dest


def main() -> None:
    data = json.loads(SPEC.read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    for name, model in data["models"].items():
        path = render_one(name, model)
        print(path)


if __name__ == "__main__":
    main()
