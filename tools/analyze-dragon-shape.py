# -*- coding: utf-8 -*-
"""读 academy-dragon-rig.glb 顶点，打三视角 ASCII 密度图，用来定骨骼位置。"""
import json
import struct
import numpy as np

SRC = r"G:\StudyCode\blocklegend\assets\models\academy-dragon-rig.glb"

raw = open(SRC, "rb").read()
json_len = struct.unpack_from("<I", raw, 12)[0]
gltf = json.loads(raw[20:20 + json_len].decode("utf-8"))
bin_start = 20 + json_len + 8
binbuf = raw[bin_start:]

prim = gltf["meshes"][0]["primitives"][0]
acc = gltf["accessors"][prim["attributes"]["POSITION"]]
view = gltf["bufferViews"][acc["bufferView"]]
off = view.get("byteOffset", 0) + acc.get("byteOffset", 0)
stride = view.get("byteStride", 12)
n = acc["count"]
flat = np.frombuffer(binbuf, dtype=np.uint8, count=stride * n, offset=off)
pos = np.lib.stride_tricks.as_strided(
    flat.view(np.float32), shape=(n, 3), strides=(stride, 4)
).copy()

print("verts", len(pos))
print("local min", pos.min(axis=0).round(3), "max", pos.max(axis=0).round(3))

# 节点带旋转：世界 y = -本地 z，世界 z = 本地 y
world = np.stack([pos[:, 0], -pos[:, 2], pos[:, 1]], axis=1)
pos = world
print("world min", pos.min(axis=0).round(3), "max", pos.max(axis=0).round(3))


def ascii_map(a, b, name, la, lb, W=64, H=26):
    ga = ((a - a.min()) / (np.ptp(a) + 1e-9) * (W - 1)).astype(int)
    gb = ((b - b.min()) / (np.ptp(b) + 1e-9) * (H - 1)).astype(int)
    grid = np.zeros((H, W), dtype=int)
    np.add.at(grid, (gb, ga), 1)
    chars = " .:-=+*#%@"
    mx = grid.max()
    print(f"\n[{name}] 横={la} 竖={lb} (竖轴向上)")
    for row in grid[::-1]:
        print("".join(chars[min(9, int(v / mx * 9 + (0 if v == 0 else 1)))] for v in row))


ascii_map(pos[:, 0], pos[:, 1], "正视 front", "x", "y")
ascii_map(pos[:, 2], pos[:, 1], "侧视 side", "z", "y")
ascii_map(pos[:, 0], pos[:, 2], "俯视 top", "x", "z")

# 上半部（世界 y>0.45）分布，找翅根
hi = pos[pos[:, 1] > 0.45]
print("\n世界y>0.45 的 x 分位:", np.percentile(hi[:, 0], [5, 25, 50, 75, 95]).round(3))
print("世界y>0.45 的 z 分位:", np.percentile(hi[:, 2], [5, 25, 50, 75, 95]).round(3))
lo = pos[pos[:, 1] < 0.25]
print("世界y<0.25 的 z 分位:", np.percentile(lo[:, 2], [5, 25, 50, 75, 95]).round(3))
