# -*- coding: utf-8 -*-
"""annotate_bullets.py — 给「没打知识点标记」的课件批量补标 hotspot / label / qa。

背景：build_web.py 只从带 hotspot/important/qa 标记的元素生成 bullets（网页端
「本页关键知识点」与可点击提问热区的数据源）。后期批量做的课件（kin4~kin16 等）
author.py 阶段没打标记，导致 bullets 为空、前端不显示知识点。本脚本用 LLM 读
每页讲稿+元素，自动补标；之后重跑 build_web.py 即恢复知识点显示。

用法: python annotate_bullets.py courses_web/kin5-1 [courses_web/kin10-1 ...]

注意：标记写在 slides.json 里。slides.json 由 author.py 生成——若重跑 author.py
标记会被覆盖，届时重跑本脚本即可恢复（幂等：已标注的元素不会重复标）。
"""
import json
import os
import re
import sys
import time
import urllib.request

FACTORY = os.path.dirname(os.path.abspath(__file__))
ENV_FILE = os.path.join(FACTORY, "..", "interactive-lecture", ".env.local")

# 每页最多标注的知识点数 / important 数（与 README 约定一致：important 只标最核心的）
MAX_MARKS_PER_PAGE = 4
MAX_IMPORTANT_PER_PAGE = 2


def load_env(path):
    env = {}
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            m = re.match(r"\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$", line)
            if m:
                env[m.group(1)] = m.group(2)
    return env


ENV = load_env(ENV_FILE)
API_KEY = ENV.get("AI_API_KEY", "")
BASE_URL = ENV.get("AI_BASE_URL", "https://api.moonshot.cn/v1").rstrip("/")
MODEL = ENV.get("AI_MODEL", "moonshot-v1-8k")


def element_text(el):
    """提取元素纯文本：text 元素取 paras 各 run，tex 元素取 tex 串。"""
    if el.get("tex"):
        return str(el["tex"])
    parts = []
    for para in el.get("paras") or []:
        for run in para:
            parts.append(run.get("t", ""))
    return "".join(parts).strip()


def font_size(el):
    sizes = [r.get("size", 0) for p in el.get("paras") or [] for r in p]
    return max(sizes) if sizes else 0


def candidates(pg, nav_text, footer_text):
    """候选元素：有可提取文本、未标注过的 text/tex；按字号从大到小，至多 15 个。"""
    out = []
    for i, el in enumerate(pg.get("elements") or []):
        if el.get("hotspot") or el.get("qa"):
            continue
        t = element_text(el)
        if len(t) < 4 or len(t) > 100:
            continue
        if t in (nav_text, footer_text):  # 页眉/页脚行
            continue
        out.append({"i": i, "size": font_size(el), "text": t})
    out.sort(key=lambda c: -c["size"])
    return out[:15]


PROMPT = """你在给大学物理课件标注「知识点热点」。这是第 {n} 页「{heading}」。
本页讲稿：{narration}

页面元素（编号: 文字内容）：
{items}

任务：从中选 0~{max_marks} 个承载核心知识点的元素（定义、定律、公式、关键结论），
跳过封面装饰、章节导航、页脚页码、纯过渡性文字。为每个选中的元素给出：
- el: 元素编号（整数）
- label: 知识点名称（不超过 10 个字）
- qa: 1~2 条预设问答，q 是学生最可能问的问题，a 紧扣本页内容回答（不超过 60 字，公式用 LaTeX $...$ 行内语法）
- important: 布尔值，本页最重要的知识点标 true（至多 {max_important} 个）

只返回 JSON 数组，不要任何其他文字。没有值得标注的元素就返回 []。"""


def ask_llm(pg, nav_text, footer_text):
    cands = candidates(pg, nav_text, footer_text)
    if not cands:
        return []
    items = "\n".join(f'{c["i"]}: {c["text"]}' for c in cands)
    narration = re.sub(r"\[\[\d+\]\]", "", pg.get("narration", ""))
    body = json.dumps({
        "model": MODEL,
        "messages": [{"role": "user", "content": PROMPT.format(
            n=pg.get("id", "?"), heading=pg.get("heading", ""), narration=narration,
            items=items, max_marks=MAX_MARKS_PER_PAGE, max_important=MAX_IMPORTANT_PER_PAGE)}],
        "temperature": 0.3,
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}/chat/completions", data=body,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    content = data["choices"][0]["message"]["content"].strip()
    content = re.sub(r"^```(?:json)?\s*|\s*```$", "", content, flags=re.S)
    m = re.search(r"\[.*\]", content, flags=re.S)
    if not m:
        return []
    marks = json.loads(m.group(0))
    valid_ids = {c["i"] for c in cands}
    return [mk for mk in marks if isinstance(mk, dict) and mk.get("el") in valid_ids]


def annotate(course_dir):
    slides_path = os.path.join(course_dir, "slides.json")
    doc = json.load(open(slides_path, encoding="utf-8"))
    pages = doc.get("pages") or doc.get("slides") or []
    nav_text, footer_text = doc.get("nav", ""), doc.get("footer", "")

    # 备份原始 slides.json（只在首次备份，重跑不覆盖）
    bak = slides_path + ".prebullets.bak"
    if not os.path.exists(bak):
        with open(bak, "w", encoding="utf-8") as f:
            json.dump(doc, f, ensure_ascii=False, indent=1)

    total = 0
    for pg in pages:
        try:
            marks = ask_llm(pg, nav_text, footer_text)
        except Exception as e:
            print(f"  page {pg.get('id', '?')}: LLM 失败，跳过（{e}）")
            continue
        marks = marks[:MAX_MARKS_PER_PAGE]
        n_important = 0
        for mk in marks:
            el = pg["elements"][mk["el"]]
            el["hotspot"] = True
            el["label"] = str(mk.get("label", ""))[:12] or element_text(el)[:12]
            qa = mk.get("qa") or []
            el["qa"] = [{"q": str(x.get("q", "")), "a": str(x.get("a", ""))}
                        for x in qa[:2] if x.get("q") and x.get("a")]
            if mk.get("important") and n_important < MAX_IMPORTANT_PER_PAGE:
                el["important"] = True
                n_important += 1
        total += len(marks)
        print(f"  page {pg.get('id', '?')}: 标了 {len(marks)} 个知识点")
        time.sleep(0.3)

    with open(slides_path, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
    print(f"{os.path.basename(course_dir)}: 共标注 {total} 个知识点，slides.json 已更新（原件备份 .prebullets.bak）")


if __name__ == "__main__":
    if not API_KEY:
        sys.exit(f"未找到 AI_API_KEY（{ENV_FILE}）")
    if len(sys.argv) < 2:
        sys.exit("用法: python annotate_bullets.py courses_web/<课名> [...]")
    for d in sys.argv[1:]:
        annotate(d)
