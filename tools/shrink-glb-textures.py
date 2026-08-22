# -*- coding: utf-8 -*-
"""把 GLB 里的贴图缩到 1024 并重打包（gltf-transform resize 对 16 位 PNG 会挂）。"""
import io
import json
import struct
import sys
from PIL import Image

SRC = r"G:\StudyCode\blocklegend\assets\models\_tmp-simplified.glb"
DST = r"G:\StudyCode\blocklegend\assets\models\academy-dragon-rig.glb"
MAX_SIZE = 1024


def align4(n, pad=b"\x00"):
    r = n % 4
    return 0 if r == 0 else 4 - r


def main():
    raw = open(SRC, "rb").read()
    assert raw[:4] == b"glTF"
    json_len = struct.unpack_from("<I", raw, 12)[0]
    gltf = json.loads(raw[20:20 + json_len].decode("utf-8"))
    bin_start = 20 + json_len + 8
    binbuf = raw[bin_start:]

    views = gltf["bufferViews"]
    images = gltf.get("images", [])
    image_views = {img["bufferView"]: i for i, img in enumerate(images)}

    # 逐 bufferView 重建二进制，图像视图换成缩小后的编码
    new_bin = bytearray()
    for vi, view in enumerate(views):
        off = view.get("byteOffset", 0)
        length = view["byteLength"]
        data = binbuf[off:off + length]
        if vi in image_views:
            img_idx = image_views[vi]
            im = Image.open(io.BytesIO(bytes(data)))
            im.load()
            if im.mode not in ("RGB", "RGBA"):
                im = im.convert("RGB")
            if max(im.size) > MAX_SIZE:
                im = im.resize((MAX_SIZE, MAX_SIZE), Image.LANCZOS)
            name = images[img_idx].get("name", "")
            buf = io.BytesIO()
            if "normal" in name:
                im.convert("RGB").save(buf, "PNG", optimize=True)
                images[img_idx]["mimeType"] = "image/png"
            else:
                im.convert("RGB").save(buf, "JPEG", quality=86)
                images[img_idx]["mimeType"] = "image/jpeg"
            data = buf.getvalue()
            print(f"image {img_idx} ({name}): {length} -> {len(data)} bytes")
        pad = align4(len(new_bin))
        new_bin.extend(b"\x00" * pad)
        view["byteOffset"] = len(new_bin)
        view["byteLength"] = len(data)
        new_bin.extend(data)

    gltf["buffers"][0]["byteLength"] = len(new_bin)
    js = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    js += b" " * align4(len(js), b" ")
    pad_bin = align4(len(new_bin))
    new_bin.extend(b"\x00" * pad_bin)
    total = 12 + 8 + len(js) + 8 + len(new_bin)
    with open(DST, "wb") as f:
        f.write(b"glTF" + struct.pack("<II", 2, total))
        f.write(struct.pack("<I", len(js)) + b"JSON" + js)
        f.write(struct.pack("<I", len(new_bin)) + b"BIN\x00" + bytes(new_bin))
    print("wrote", DST, total, "bytes")


if __name__ == "__main__":
    main()
