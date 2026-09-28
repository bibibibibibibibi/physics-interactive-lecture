# -*- coding: utf-8 -*-
"""姿态图归一化：按人工核定的缩放表统一人物大小，脚底对齐角色基线。

缩放以腿部质心为水平锚点，脚底（内容底边）对齐各角色 pose_explain 的基线。
缩放表来自叠图比对（tools/pose_compare.py 的红绿叠图）+ 身体高度/脚长测量。
用法: python tools/normalize_poses.py
"""
import os

import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..",
                    "interactive-lecture", "public", "poses")
W, H = 1200, 1500

# 角色基线 = pose_explain 内容底边
BASELINE = {"aqiang": 1410, "professor": 1499, "zhongshan": 1410}

# 缩放因子表（1.0 = 不动）；未列出的姿态保持原样
SCALE = {
    "aqiang": {
        "pose_laser_circle": 0.94, "pose_laser_far": 0.98, "pose_laser_high": 0.90,
        "pose_laser_lean": 0.89, "pose_laser_low": 0.86, "pose_nod": 0.94,
        "pose_shrug": 0.92, "pose_write": 0.90,
    },
    "professor": {
        "pose_laser_circle": 0.85, "pose_laser_far": 0.87, "pose_laser_high": 0.87,
        "pose_laser_lean": 0.86, "pose_laser_low": 0.86, "pose_nod": 0.88,
        "pose_shrug": 0.88, "pose_write": 0.87,
        "pose_laser_down": 1.06, "pose_laser_up": 1.06,
    },
    "zhongshan": {
        "pose_laser_circle": 0.94, "pose_laser_far": 0.88, "pose_laser_high": 0.94,
        "pose_laser_lean": 0.95, "pose_laser_low": 0.94, "pose_nod": 0.94,
        "pose_shrug": 0.92, "pose_write": 0.93,
        "pose_laser_down": 1.015, "pose_laser_up": 1.02,
    },
}


def bbox(a):
    rows = a.any(axis=1)
    cols = a.any(axis=0)
    h, w = a.shape
    return (int(np.argmax(cols)), int(np.argmax(rows)),
            w - int(np.argmax(cols[::-1])), h - int(np.argmax(rows[::-1])))


def leg_cx(a, y1):
    band = a[max(0, y1 - 300):y1, :]
    cols = np.where(band.any(axis=0))[0]
    return float(cols.mean()) if len(cols) else W / 2


def main():
    for role, table in SCALE.items():
        d = os.path.join(ROOT, role)
        base_y = BASELINE[role]
        for name, s in table.items():
            p = os.path.join(d, name + ".png")
            if not os.path.exists(p):
                print("missing:", p)
                continue
            im = Image.open(p).convert("RGBA")
            nw, nh = max(1, round(W * s)), max(1, round(H * s))
            sa = np.array(im.resize((nw, nh), Image.LANCZOS))
            x0, y0, x1, y1 = bbox(sa[:, :, 3] > 10)
            content = sa[y0:y1, x0:x1]
            cx = leg_cx(sa[:, :, 3] > 10, y1)   # 缩放后的腿质心
            out = np.zeros((H, W, 4), dtype=np.uint8)
            # 水平保持缩放后的原位置；竖直：脚底（内容底边）对齐基线
            px = x0
            py = int(round(base_y - (y1 - y0)))
            cw = min(content.shape[1], W - px)
            ch = min(content.shape[0], H - py)
            if px < 0 or py < 0 or cw <= 0 or ch <= 0:
                print("!! 越界", p)
                continue
            out[py:py + ch, px:px + cw] = content[:ch, :cw]
            Image.fromarray(out).save(p)
            print(f"{role}/{name}: s={s} feetY={y1}->{base_y} (原 {y1})")
    print("done")


if __name__ == "__main__":
    main()
