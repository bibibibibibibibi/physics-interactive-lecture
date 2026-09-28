# -*- coding: utf-8 -*-
"""生成姿态对比叠图：红=pose_explain 基准，绿=目标姿态（脚底+腿质心对齐）。
用于人工判定每个姿态的缩放因子。输出 tools/pose_cmp/<role>_<pose>.png（2x2 网格另拼）。
用法: python tools/pose_compare.py
"""
import os
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..",
                    "interactive-lecture", "public", "poses")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pose_cmp")
os.makedirs(OUT, exist_ok=True)
W, H = 1200, 1500


def alpha(p):
    return np.array(Image.open(p).convert("RGBA"))[:, :, 3] > 10


def bbox(a):
    rows = a.any(axis=1); cols = a.any(axis=0)
    return int(np.argmax(rows)), H - int(np.argmax(rows[::-1])), \
           int(np.argmax(cols)), W - int(np.argmax(cols[::-1]))


def leg_cx(a, y1):
    band = a[max(0, y1 - 300):y1, :]
    cols = np.where(band.any(axis=0))[0]
    return float(cols.mean()) if len(cols) else W / 2


def shift(a, dy, dx):
    """把内容平移 (dy, dx)（正=向下/向右）"""
    out = np.zeros_like(a)
    sy0, dy0 = max(0, -dy), max(0, dy)
    sx0, dx0 = max(0, -dx), max(0, dx)
    h = min(a.shape[0] - sy0, H - dy0); w = min(a.shape[1] - sx0, W - dx0)
    if h > 0 and w > 0:
        out[dy0:dy0 + h, dx0:dx0 + w] = a[sy0:sy0 + h, sx0:sx0 + w]
    return out


for role in ["aqiang", "professor", "zhongshan"]:
    d = os.path.join(ROOT, role)
    ref = alpha(os.path.join(d, "pose_explain.png"))
    ry0, ry1, _, _ = bbox(ref)
    rcx = leg_cx(ref, ry1)
    for f in sorted(os.listdir(d)):
        if not f.endswith(".png") or f == "pose_explain.png":
            continue
        a = alpha(os.path.join(d, f))
        y0, y1, _, _ = bbox(a)
        cx = leg_cx(a, y1)
        t = shift(a, ry1 - y1, int(rcx - cx))
        img = np.full((H, W, 3), 255, dtype=np.uint8)
        img[ref] = [220, 0, 0]
        img[t] = [0, 150, 0]
        img[ref & t] = [60, 60, 60]
        # 网格线：基准头顶行
        img[ry0 - 2:ry0 + 2, :] = [0, 0, 255]
        img[ry1 - 2:ry1 + 2, :] = [0, 0, 255]
        Image.fromarray(img).resize((W // 2, H // 2)).save(
            os.path.join(OUT, f"{role}_{f}"))
print("done ->", OUT)
