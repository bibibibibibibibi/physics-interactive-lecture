# -*- coding: utf-8 -*-
"""网页版课件创作共享库（web 管线模板）。

每门课的 courses_web/<课名>/author.py 开头：
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
    from web_author import *

坐标系 1920×1080，与原 PPT 页面对应。
讲稿 narration 里的 [[n]] 表示「讲到此处揭示第 n 步元素」，
标记放在关键词**紧前面**，引擎按句内字符比例插值出揭示/激光/划线时刻。

元素通用约定（本轮打磨固化）：
- 所有元素带 step（0=页面常驻），hotspot=可点击提问，important=激光下划红线
- img 元素会充满 w×h 框（objectFit contain），尺寸直接按想要的显示大小给
- 图片白底建议转透明（见 README「座钟 gif 白底透明化」）
- 图示在 interactive-lecture/src/components/lecture/diagrams.tsx 的 DIAGRAMS 里加，
  矢量符号用 Vec 组件（不要写 ⃗ 组合字符，缺字体会显方框）
"""

RED = "#C00000"; BLUE = "#0000CD"; BLACK = "#111111"; MAGENTA = "#C000C0"
GREEN_FILL = "#CCFFCC"; GREEN_LINE = "#2E8B57"
PINK_FILL = "#FDF2F5"; PINK_LINE = "#C000C0"
BLUE_FILL = "#EFF6FF"; BLUE_LINE = "#0000CD"


def text(step, x, y, w, runs, h=90, align="left", valign="center", **kw):
    """runs: 段落列表，每段是 run 列表；run = {t, size, color, b}（t 里可用 $...$ 公式）"""
    if isinstance(runs[0], dict):
        runs = [runs]
    return {"type": "text", "step": step, "x": x, "y": y, "w": w, "h": h,
            "align": align, "valign": valign, "paras": runs, **kw}


def tex(step, x, y, w, formula, size=40, color=BLACK, h=110, align="left", **kw):
    return {"type": "tex", "step": step, "x": x, "y": y, "w": w, "h": h,
            "tex": formula, "size": size, "color": color, "align": align, **kw}


def box(step, x, y, w, h, fill, line, paras=None, tex_f=None, size=40,
        align="center", color=BLACK, lw=3, radius=0, **kw):
    return {"type": "box", "step": step, "x": x, "y": y, "w": w, "h": h,
            "fill": fill, "line": line, "lw": lw, "radius": radius,
            "paras": paras, "tex": tex_f, "size": size, "align": align,
            "color": color, **kw}


def diagram(step, x, y, w, h, name, **kw):
    return {"type": "diagram", "step": step, "x": x, "y": y, "w": w, "h": h,
            "name": name, **kw}


def img(step, x, y, w, h, src, **kw):
    return {"type": "img", "step": step, "x": x, "y": y, "w": w, "h": h,
            "src": src, **kw}


def table(step, x, y, w, rows, rowh=90, size=40, fill=GREEN_FILL, **kw):
    return {"type": "table", "step": step, "x": x, "y": y, "w": w,
            "rows": rows, "rowh": rowh, "size": size, "fill": fill, **kw}


def R(t, size=40, color=BLACK, b=False):
    return {"t": t, "size": size, "color": color, "b": b}
