# -*- coding: utf-8 -*-
"""新建网页版课件课程骨架。

用法: python new_webcourse.py 光的干涉
产物: courses_web/光的干涉/author.py（示例页 + 创作约定）、assets/
之后: 编辑 author.py → python courses_web/光的干涉/author.py → python build_web.py courses_web/光的干涉
"""
import os, sys

FACTORY = os.path.dirname(os.path.abspath(__file__))

SKELETON = '''# -*- coding: utf-8 -*-
"""%(title)s 网页版幻灯片创作脚本。

坐标系 1920×1080。讲稿 narration 里的 [[n]] 表示「讲到此处揭示第 n 步元素」，
标记放在关键词紧前面（引擎按句内字符比例插值出揭示/激光/划线时刻）。
元素通用参数：hotspot=可点击提问、important=激光下划红线（每页≤3）、qa=预设问答。
生成: python courses_web/%(name)s/author.py  →  slides.json
构建: python build_web.py courses_web/%(name)s
"""
import json, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from web_author import *

pages = []

# ---------------- 第 1 页：示例（换成你的内容） ----------------
pages.append({
 "id": 1,
 # 讲稿：口语化、第二人称、公式读法展开（如「ω 方等于 k 比 m」）；
 # 同一步的多个元素共用一个 [[n]]；不同步的标记要拆到不同句，避免时刻重合
 "narration": "开场白。[[1]]第一个知识点的讲解。[[2]]第二个知识点的讲解。",
 "elements": [
  text(0, 36, 137, 1044, [R("一　章节标题", 52, RED, True)]),
  text(1, 108, 300, 1400, [R("第一个知识点正文", 44)], hotspot=True,
       label="第一个知识点",
       qa=[{"q": "什么是第一个知识点？", "a": "……"}]),
  box(2, 600, 550, 700, 110, GREEN_FILL, GREEN_LINE,
      [[R("重点结论", 40, RED, True)]], hotspot=True, important=True,
      label="重点结论",
      qa=[{"q": "结论是什么？", "a": "……"}]),
  # tex(2, 300, 700, 800, "x=A\\\\cos(\\\\omega t+\\\\varphi)", 44),
  # diagram(2, 300, 700, 800, 300, "spring_o"),
  # img(2, 1200, 500, 500, 400, "example.png"),   # 图片先放 assets/ 并复制到 public/weblec/<课名>/
  # table(2, 400, 700, 1000, [["列1", "列2"], ["甲", "1"]]),
 ]})

HEADINGS = ["第1页短名"]   # 每页一个 2~4 字短名，用于章节导航
for pg, h in zip(pages, HEADINGS):
    pg["heading"] = h

doc = {
  "title": "%(title)s",
  "nav": "章节号　%(title)s",          # 页面顶部导航条文字
  "footer": "第九章　振动",             # 页脚（浮于内容之上，不会被遮）
  # "character": "aqiang",             # 可选：覆盖默认出镜角色
  "pages": pages,
}
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "slides.json")
json.dump(doc, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"pages: {len(pages)} -> {out}")
'''


def main():
    if len(sys.argv) < 2:
        print("用法: python new_webcourse.py <课程名>")
        return
    name = sys.argv[1]
    cdir = os.path.join(FACTORY, "courses_web", name)
    if os.path.exists(cdir):
        print(f"已存在: {cdir}")
        return
    os.makedirs(os.path.join(cdir, "assets"))
    with open(os.path.join(cdir, "author.py"), "w", encoding="utf-8") as f:
        f.write(SKELETON % {"name": name, "title": name})
    print(f"已创建 {cdir}")
    print("下一步:")
    print(f"  1. 编辑 courses_web/{name}/author.py（对照 PPT 写页面元素与讲稿）")
    print(f"  2. python courses_web/{name}/author.py")
    print(f"  3. python build_web.py courses_web/{name}")


if __name__ == "__main__":
    main()
