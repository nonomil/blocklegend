# -*- coding: utf-8 -*-
"""Project a 2x2 four-view sheet (TL front, TR right, BL back, BR left)
onto cuboid parts from specs.json, packing per-face crops into a texture
atlas + JS manifest. This is the mechanical image->model texture channel:
no hand-eye transcription.

Usage:
  python fourview-to-atlas.py --model golem
  python fourview-to-atlas.py --model villager --exclude body
"""
import argparse
import json
import math
import os

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..', '..'))
SHEET_DIR = os.path.join(ROOT, 'prj', 'assets', 'generated', 'blocklegend-roster', 'four-view')
OUT_DIR = os.path.join(ROOT, 'prj', 'games', 'blocklegend', 'assets', 'atlas4v')

SCALE = 4  # texture pixels per model pixel-unit
# Corner bg noise is ~3..7 across sheets; pale white wool / light iron gray
# can be as close as ~12..25 to the beige background. Threshold 12 reliably
# separates subject pixels without eating pale character details.
BG_THRESHOLD = 12


def color_dist(a, b):
    return math.sqrt(sum((a[i] - b[i]) ** 2 for i in range(3)))


def subject_bbox(img):
    """Bounding box of non-background pixels; bg color taken from average of 4 corners.
    Requires at least 3 pixels in a row/col to exceed threshold to prevent noise."""
    px = img.load()
    w, h = img.size
    corners = [(4, 4), (w - 5, 4), (4, h - 5), (w - 5, h - 5)]
    bg = tuple(sum(px[c[0], c[1]][i] for c in corners) // 4 for i in range(3))

    y0, y1 = 0, h - 1
    for y in range(h):
        cnt = sum(1 for x in range(0, w, 2) if color_dist(px[x, y][:3], bg) > BG_THRESHOLD)
        if cnt >= 2:
            y0 = y
            break
    for y in range(h - 1, -1, -1):
        cnt = sum(1 for x in range(0, w, 2) if color_dist(px[x, y][:3], bg) > BG_THRESHOLD)
        if cnt >= 2:
            y1 = y
            break

    x0, x1 = 0, w - 1
    for x in range(w):
        cnt = sum(1 for y in range(y0, y1 + 1, 2) if color_dist(px[x, y][:3], bg) > BG_THRESHOLD)
        if cnt >= 2:
            x0 = x
            break
    for x in range(w - 1, -1, -1):
        cnt = sum(1 for y in range(y0, y1 + 1, 2) if color_dist(px[x, y][:3], bg) > BG_THRESHOLD)
        if cnt >= 2:
            x1 = x
            break

    if x1 <= x0 or y1 <= y0:
        raise SystemExit('no subject found in view')
    return (x0, y0, x1 + 1, y1 + 1)


def band_extent(view, bg, y0, y1, fallback):
    """Horizontal extent of non-background pixels within an image row band.
    GPT views are not perfectly orthographic, so each height band is aligned
    to its own silhouette instead of the global bbox."""
    px = view.load()
    w = view.size[0]
    x0, x1 = w, 0
    for y in range(max(0, int(y0)), min(view.size[1], int(y1))):
        for x in range(0, w, 2):
            if color_dist(px[x, y][:3], bg) > BG_THRESHOLD:
                if x < x0:
                    x0 = x
                if x > x1:
                    x1 = x
    if x1 <= x0:
        return fallback
    return (x0, x1 + 1)


def crop_rect(view, bbox, bg, h_span_boxes, v_span, part_h_range, part_v_range, occluders=None):
    """Map part ranges (model units) onto the view. Vertical mapping uses the
    global subject bbox; horizontal mapping is re-measured per height band.
    h_span_boxes: spec horizontal extent of all boxes sharing this band.
    occluders: [(h_range, v_range)] of boxes nearer to the camera; their
    projected area is repainted with the bg color so clean_bg refills it with
    the part's own dominant color (prevents e.g. the villager nose pixels
    from being baked into the head face and rendered twice)."""
    bx0, by0, bx1, by1 = bbox
    bh = by1 - by0
    (v_min, v_max) = v_span
    (ph0, ph1) = part_h_range
    (pv0, pv1) = part_v_range

    def img_y(v):
        # image y grows downward; model v (height) grows upward
        return by1 - (v - v_min) / (v_max - v_min) * bh

    y0, y1 = img_y(pv1), img_y(pv0)
    (h_min, h_max) = h_span_boxes
    # measure only the middle 60% of the band so neighbouring parts that
    # barely poke into this band do not widen the measured silhouette
    my0 = y0 + (y1 - y0) * 0.2
    my1 = y1 - (y1 - y0) * 0.2
    ex0, ex1 = band_extent(view, bg, my0, my1, (bx0, bx1))
    ew = ex1 - ex0

    def img_u(h):
        return ex0 + (h - h_min) / (h_max - h_min) * ew

    u0, u1 = sorted((img_u(ph0), img_u(ph1)))
    crop = view.crop((int(round(u0)), int(round(y0)), int(round(u1)), int(round(y1))))
    if occluders:
        px = crop.load()
        cw, ch = crop.size
        for (oh, ov) in occluders:
            ou0, ou1 = sorted((img_u(oh[0]), img_u(oh[1])))
            oy0, oy1 = img_y(ov[1]), img_y(ov[0])
            cx0 = max(0, int(round(ou0 - u0)))
            cx1 = min(cw, int(round(ou1 - u0)))
            cy0 = max(0, int(round(oy0 - y0)))
            cy1 = min(ch, int(round(oy1 - y0)))
            for yy in range(cy0, cy1):
                for xx in range(cx0, cx1):
                    px[xx, yy] = bg
    return crop


def band_span(boxes, part, axis):
    """Spec horizontal extent (x or z) of boxes overlapping the part's
    y band by more than 20% of the part's height."""
    y0 = part['y'] - part['h'] / 2
    y1 = part['y'] + part['h'] / 2
    lo, hi = None, None
    for b in boxes:
        b0 = b['y'] - b['h'] / 2
        b1 = b['y'] + b['h'] / 2
        overlap = min(y1, b1) - max(y0, b0)
        if overlap <= 0.2 * (y1 - y0):
            continue
        half = b[axis == 'x' and 'w' or 'd'] / 2
        c = b[axis]
        lo = c - half if lo is None else min(lo, c - half)
        hi = c + half if hi is None else max(hi, c + half)
    return (lo, hi)


def avg_color(img):
    small = img.convert('RGB').resize((1, 1))
    return small.getpixel((0, 0))


def hex_color(s):
    s = s.lstrip('#')
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def clean_bg(img, bg, fallback):
    """Replace background-colored pixels with the crop's dominant non-bg
    color, so misaligned crops never leak the sheet background onto faces.
    Returns (img, coverage) where coverage is the non-background ratio."""
    px = img.load()
    w, h = img.size
    counts = {}
    nonbg = 0
    for y in range(h):
        for x in range(w):
            p = px[x, y][:3]
            if color_dist(p, bg) > BG_THRESHOLD:
                nonbg += 1
                q = (p[0] // 16, p[1] // 16, p[2] // 16)
                counts[q] = counts.get(q, 0) + 1
    ratio = nonbg / float(w * h) if w * h else 0.0
    if counts and ratio >= 0.25:
        q = max(counts, key=counts.get)
        fill = (q[0] * 16 + 8, q[1] * 16 + 8, q[2] * 16 + 8)
    else:
        fill = fallback
        for y in range(h):
            for x in range(w):
                px[x, y] = fill
        return img, ratio
    for y in range(h):
        for x in range(w):
            if color_dist(px[x, y][:3], bg) <= BG_THRESHOLD:
                px[x, y] = fill
    return img, (nonbg / float(w * h) if w * h else 0.0)


def build(model_id, exclude):
    spec_path = os.path.join(SHEET_DIR, 'specs.json')
    with open(spec_path, 'r', encoding='utf-8') as f:
        specs = json.load(f)
    boxes = [b for b in specs['models'][model_id]['boxes'] if b['name'] not in exclude]

    sheet = Image.open(os.path.join(SHEET_DIR, model_id + '-4view.png')).convert('RGB')
    sw, sh = sheet.size
    half_w, half_h = sw // 2, sh // 2
    m = 12  # inset so quadrant divider lines never count as subject pixels
    views = {
        'front': sheet.crop((m, m, half_w - m, half_h - m)),
        'right': sheet.crop((half_w + m, m, sw - m, half_h - m)),
        'back': sheet.crop((m, half_h + m, half_w - m, sh - m)),
        'left': sheet.crop((half_w + m, half_h + m, sw - m, sh - m)),
    }
    bboxes = {k: subject_bbox(v) for k, v in views.items()}
    bg_colors = {
        k: tuple(
            sum(v.load()[c[0], c[1]][i] for c in [(4, 4), (v.size[0] - 5, 4), (4, v.size[1] - 5), (v.size[0] - 5, v.size[1] - 5)]) // 4
            for i in range(3)
        )
        for k, v in views.items()
    }

    min_x = min(b['x'] - b['w'] / 2 for b in boxes)
    max_x = max(b['x'] + b['w'] / 2 for b in boxes)
    min_y = min(b['y'] - b['h'] / 2 for b in boxes)
    max_y = max(b['y'] + b['h'] / 2 for b in boxes)
    min_z = min(b['z'] - b['d'] / 2 for b in boxes)
    max_z = max(b['z'] + b['d'] / 2 for b in boxes)

    crops = []  # (part_index, face, PIL image)
    for i, b in enumerate(boxes):
        xr = (b['x'] - b['w'] / 2, b['x'] + b['w'] / 2)
        yr = (b['y'] - b['h'] / 2, b['y'] + b['h'] / 2)
        zr = (b['z'] - b['d'] / 2, b['z'] + b['d'] / 2)
        tw = max(1, int(round(b['w'] * SCALE)))
        th = max(1, int(round(b['h'] * SCALE)))
        td = max(1, int(round(b['d'] * SCALE)))

        fb = hex_color(b.get('color', '#808080'))
        x_band = band_span(boxes, b, 'x')
        z_band = band_span(boxes, b, 'z')

        def occs(depth_fn, h_fn):
            """Small boxes that genuinely protrude in front of part b in this
            view (e.g. the nose, >1.2 px proud). Their pixels are lifted out of
            b's face so they are not rendered twice. Flat decals (brow, eyes,
            vines, flower, < 1.2 px proud) stay baked into the base face
            because their own boxes are too thin to read at game scale."""
            out = []
            for q in boxes:
                if q is b or depth_fn(q) <= depth_fn(b) + 1.2:
                    continue
                qh = h_fn(q)
                q_area = abs(qh[1] - qh[0]) * q['h']
                b_area = abs(h_fn(b)[1] - h_fn(b)[0]) * b['h']
                if q_area > 0.15 * b_area:
                    continue
                out.append((qh, (q['y'] - q['h'] / 2, q['y'] + q['h'] / 2)))
            return out

        # front view: image x = model +x to the right; camera at +z
        pz, pz_cov = clean_bg(crop_rect(views['front'], bboxes['front'], bg_colors['front'],
                                        x_band, (min_y, max_y), xr, yr,
                                        occs(lambda q: q['z'] + q['d'] / 2,
                                             lambda q: (q['x'] - q['w'] / 2, q['x'] + q['w'] / 2))),
                              bg_colors['front'], fb)
        # back view: camera at -z, image x = model -x to the right -> mirror x range
        nz, nz_cov = clean_bg(crop_rect(views['back'], bboxes['back'], bg_colors['back'],
                                        (-x_band[1], -x_band[0]), (min_y, max_y),
                                        (-xr[1], -xr[0]), yr,
                                        occs(lambda q: -(q['z'] - q['d'] / 2),
                                             lambda q: (-(q['x'] + q['w'] / 2), -(q['x'] - q['w'] / 2)))),
                              bg_colors['back'], fb)
        # right view (camera at +x): image x = model -z to the right
        pxf, px_cov = clean_bg(crop_rect(views['right'], bboxes['right'], bg_colors['right'],
                                         (-z_band[1], -z_band[0]), (min_y, max_y),
                                         (-zr[1], -zr[0]), yr,
                                         occs(lambda q: q['x'] + q['w'] / 2,
                                              lambda q: (-(q['z'] + q['d'] / 2), -(q['z'] - q['d'] / 2)))),
                               bg_colors['right'], fb)
        # left view (camera at -x): image x = model +z to the right
        nxf, nx_cov = clean_bg(crop_rect(views['left'], bboxes['left'], bg_colors['left'],
                                         z_band, (min_y, max_y), zr, yr,
                                         occs(lambda q: -(q['x'] - q['w'] / 2),
                                              lambda q: (q['z'] - q['d'] / 2, q['z'] + q['d'] / 2))),
                               bg_colors['left'], fb)

        # GPT views are not perfectly orthographic; when a side crop is mostly
        # background, mirror the opposite side (or reuse the front) instead of
        # a flat fill.
        COV = 0.35
        if px_cov < COV and nx_cov < COV:
            pxf = pz.copy()
            nxf = pz.copy()
        elif px_cov < COV:
            pxf = nxf.transpose(Image.FLIP_LEFT_RIGHT)
        elif nx_cov < COV:
            nxf = pxf.transpose(Image.FLIP_LEFT_RIGHT)
        if nz_cov < COV:
            nz = pz.copy()

        faces = {
            'pz': pz.resize((tw, th), Image.NEAREST),
            'nz': nz.resize((tw, th), Image.NEAREST),
            'px': pxf.resize((td, th), Image.NEAREST),
            'nx': nxf.resize((td, th), Image.NEAREST),
        }
        # top/bottom: not visible in orthographic side views -> flat fill
        top = Image.new('RGB', (tw, td), avg_color(faces['pz'].crop((0, 0, tw, max(1, th // 4)))))
        bottom = Image.new('RGB', (tw, td), avg_color(faces['pz'].crop((0, th - max(1, th // 4), tw, th))))
        faces['py'] = top
        faces['ny'] = bottom
        # Forward zombie-style arms: underside shows in the side shot.
        # Use the side-face texture instead of a flat front-strip fill.
        if b['name'].startswith('arm') and b['d'] > b['h'] + 0.5:
            side = faces['px']
            if tw == th:
                faces['ny'] = side.transpose(Image.ROTATE_90)
                faces['py'] = faces['ny'].copy()
            else:
                fill = avg_color(side)
                faces['ny'] = Image.new('RGB', (tw, td), fill)
                faces['py'] = Image.new('RGB', (tw, td), fill)
        for face, img in faces.items():
            crops.append((i, face, img))

    # shelf packing
    crops.sort(key=lambda c: -c[2].size[1])
    atlas_w = 512
    pad = 2
    x, y, row_h = pad, pad, 0
    placements = {}
    for i, face, img in crops:
        w, h = img.size
        if x + w + pad > atlas_w:
            x = pad
            y += row_h + pad
            row_h = 0
        placements[(i, face)] = (x, y)
        x += w + pad
        row_h = max(row_h, h)
    atlas_h = 1
    while atlas_h < y + row_h + pad:
        atlas_h *= 2
    atlas = Image.new('RGB', (atlas_w, atlas_h), (20, 20, 20))
    for i, face, img in crops:
        atlas.paste(img, placements[(i, face)])

    parts = []
    for i, b in enumerate(boxes):
        rects = {}
        for face in ('px', 'nx', 'py', 'ny', 'pz', 'nz'):
            pos = placements[(i, face)]
            img = next(c[2] for c in crops if c[0] == i and c[1] == face)
            rects[face] = [pos[0], pos[1], img.size[0], img.size[1]]
        parts.append({
            'name': b['name'],
            'size': [b['w'], b['h'], b['d']],
            'pos': [b['x'], b['y'], b['z']],
            'faces': rects,
        })

    os.makedirs(OUT_DIR, exist_ok=True)
    png_name = model_id + '-atlas.png'
    atlas.save(os.path.join(OUT_DIR, png_name))
    manifest = {
        'texture': png_name,
        'size': [atlas_w, atlas_h],
        'units': 'model pixel units, 16 = 1 block',
        'source': model_id + '-4view.png',
        'parts': parts,
    }
    js = ('window.BlockLegendAtlas4V = window.BlockLegendAtlas4V || {};\n'
          "window.BlockLegendAtlas4V['" + model_id + "'] = "
          + json.dumps(manifest, separators=(',', ':')) + ';\n')
    with open(os.path.join(OUT_DIR, model_id + '-atlas.js'), 'w', encoding='utf-8') as f:
        f.write(js)
    print('OK', model_id, 'parts:', len(parts), 'atlas:', atlas_w, 'x', atlas_h)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', required=True)
    ap.add_argument('--exclude', nargs='*', default=[])
    args = ap.parse_args()
    build(args.model, set(args.exclude))
