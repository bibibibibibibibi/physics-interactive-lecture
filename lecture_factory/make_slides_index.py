#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""make_slides_index.py —— 为 slides-export/ 生成课程目录页（三大板块各占一页）。

  index.html           大学物理课程   （学科：力学 / 振动与波 / 热学 / 光学 / 电磁学 / 数学基础）
  index-analysis.html  分析力学       （学科：拉格朗日力学）
  index-special.html   教学节段专题   （学科：示范课节段）

分析力学、教学节段不属于大学物理，所以**不放同一页**；三页顶部有互相切换的导航。

每页的层级：学科 → 章 → 节。课节清单以**课程注册表为准**（courses_*.json），
不依赖"扫到哪个文件列哪个"，未导出过的课节也会出现（按钮标注「未导出」）。
学科尚无课节时显示「课节尚未制作」占位——目录反映的是完整课程体系，
不是"已经做了什么"。

配对幻灯片文件时用该课 weblec.json 的 title 反推文件名（导出命名就是它），
比字符串模糊匹配精确；万一改名过，再回退到目录扫描。
页数就是课程数据的页数（课程里已不再放「章节目录页」，跨节导航由本目录承担）。

用法：
  python lecture_factory/make_slides_index.py                      # 本地预览地址
  python lecture_factory/make_slides_index.py --site https://xxx   # 部署后指向线上
"""
import argparse
import html
import json
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / 'interactive-lecture'
OUT_DIR = APP / 'slides-export'                  # 与单文件幻灯片同目录
WEBLEC = APP / 'public' / 'weblec'

DEFAULT_SITE = 'http://127.0.0.1:3000'           # 本地预览（npm run dev）

# ── 目录结构：一页 = 一个板块 ───────────────────────────────────────────────
# 学科写了 name 但没有 chapters → 该学科显示「课节尚未制作」占位。
# 做新学科/新章只改这里。
PAGES: list[dict] = [
    {
        'file': 'index.html',
        'nav': '大学物理课程',
        'title': '大学物理 · 课程目录',
        'subtitle': '力学 · 电磁学 · 振动与波 · 光学 · 热学',
        'subjects': [
            {'name': '力学', 'chapters': [
                {'title': '第一章　质点运动学', 'registry': 'courses_mechanics.json'},
                {'title': '第二章　牛顿定律', 'registry': 'courses_newton.json'},
                {'title': '第三章　动量守恒定律和能量守恒定律', 'registry': 'courses_momentum.json'},
                {'title': '第四章　刚体转动和流体运动', 'registry': 'courses_rotation.json'}]},
            {'name': '电磁学', 'chapters': [
                {'title': '第五章　静电场', 'registry': 'courses_electric.json'},
                {'title': '第六章　导体与电介质', 'registry': 'courses_conductor.json'},
                {'title': '第七章　恒定磁场', 'registry': 'courses_magnetic.json'},
                {'title': '第八章　电磁感应', 'registry': 'courses_induction.json'}]},
            {'name': '振动与波', 'chapters': [
                {'title': '第九章　振动', 'registry': 'courses.json'},
                {'title': '第十章　波动', 'registry': 'courses_wave.json'}]},
            {'name': '光学', 'chapters': [
                {'title': '第十一章　光学', 'registry': 'courses_optics.json'}]},
            {'name': '热学', 'chapters': [
                {'title': '第十二章　气体动理论', 'registry': 'courses_thermal.json'},
                {'title': '第十三章　热力学基础', 'registry': 'courses_thermo.json'}]},
            {'name': '相对论', 'chapters': [
                {'title': '第十四章　相对论', 'registry': 'courses_relativity.json'}]},
            {'name': '量子与粒子物理', 'chapters': [
                {'title': '第十五章　量子物理', 'registry': 'courses_quantum.json'},
                {'title': '第十六章　原子核与粒子物理', 'registry': 'courses_nuclear.json'}]},
            {'name': '数学基础（预备）', 'chapters': [
                {'title': '第零章　矢量代数', 'registry': 'courses_foundation.json'}]},
        ],
    },
    {
        'file': 'index-analysis.html',
        'nav': '分析力学',
        'title': '分析力学 · 课程目录',
        'subtitle': '从约束、虚功到拉格朗日方程',
        'subjects': [
            {'name': '拉格朗日力学', 'chapters': [
                {'title': '第二章　拉格朗日方程', 'registry': 'courses_analytical.json'}]},
        ],
    },
    {
        'file': 'index-special.html',
        'nav': '教学节段专题',
        'title': '教学节段专题 · 课程目录',
        'subtitle': '跨篇选讲：每讲一个主题，独立成节',
        'subjects': [
            {'name': '示范课节段', 'chapters': [
                {'title': '第 1–8 学时', 'registry': 'courses_special.json'}]},
        ],
    },
]

# 教学节段各讲所属学科（仅作标签提示；节段本身横跨多篇）
SP_SUBJECT = {'sp1': '力学', 'sp2': '电磁学', 'sp3': '振动', 'sp4': '波动',
              'sp5': '光学', 'sp6': '光学', 'sp7': '热学', 'sp8': '近代物理'}


def load_registry(name: str) -> list[dict]:
    p = WEBLEC / name
    if not p.exists():
        return []
    try:
        d = json.loads(p.read_text(encoding='utf-8'))
        return d if isinstance(d, list) else []
    except Exception:
        return []


def course_info(course_id: str) -> dict:
    """读课程数据：title、幻灯片形态页数、时长、是否有交互课堂。"""
    p = WEBLEC / course_id / 'weblec.json'
    info = {'title': None, 'pages': None, 'minutes': None, 'lecture': False}
    if not p.exists():
        return info
    try:
        d = json.loads(p.read_text(encoding='utf-8'))
    except Exception:
        return info
    slides = d.get('slides') or []
    if not slides:
        return info
    info['title'] = d.get('title')
    info['pages'] = len(slides)
    info['minutes'] = max(1, round(float(slides[-1].get('t_end') or 0) / 60))
    info['lecture'] = True
    return info


def slide_file_for(title: str | None, files: list[str]) -> str | None:
    """该课程对应的幻灯片文件。导出命名 = 大学物理-<weblec title>-幻灯片.html。"""
    if title:
        exact = f'大学物理-{title}-幻灯片.html'
        if exact in files:
            return exact
        for f in files:                                  # 回退：后缀匹配
            stem = f[:-len('.html')]
            t = stem[len('大学物理-'):] if stem.startswith('大学物理-') else stem
            if t.endswith('-幻灯片'):
                t = t[:-len('-幻灯片')]
            if t and (t == title or title.endswith(t)):
                return f
    return None


PAGE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<style>
  :root {{ color-scheme: dark; }}
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; background: #0b1f38; color: #e8eef7;
         font-family: "Microsoft YaHei", "PingFang SC", system-ui, sans-serif; }}
  .wrap {{ max-width: 940px; margin: 0 auto; padding: 40px 24px 40px; }}
  .sites {{ display: flex; gap: 8px; justify-content: center; margin-bottom: 34px;
            flex-wrap: wrap; }}
  .sites a, .sites span {{ font-size: 13px; font-weight: 700; text-decoration: none;
            padding: 7px 15px; border-radius: 999px; white-space: nowrap; }}
  .sites a {{ color: #b9cde4; background: #122a47; border: 1px solid #24456c; }}
  .sites a:hover {{ background: #19395c; color: #fff; }}
  .sites span {{ color: #14243a; background: #f5b400; }}
  h1 {{ font-size: 29px; margin: 0 0 10px; text-align: center; letter-spacing: .5px; }}
  .sub {{ text-align: center; color: #8fa6c4; font-size: 14px; line-height: 1.85;
          margin-bottom: 8px; }}
  /* 工具栏 */
  .tools {{ display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
           margin: 30px 0 6px; }}
  .tools button {{ font: inherit; font-size: 13px; font-weight: 700; color: #b9cde4;
            background: #122a47; border: 1px solid #24456c; border-radius: 8px;
            padding: 6px 13px; cursor: pointer; }}
  .tools button:hover {{ background: #19395c; color: #fff; }}
  .tools .hint {{ margin-left: auto; font-size: 12px; color: #6f8aab; }}
  /* 可折叠：学科 / 章 */
  details {{ margin: 0; }}
  summary {{ list-style: none; cursor: pointer; user-select: none; }}
  summary::-webkit-details-marker {{ display: none; }}
  .subj > summary {{ font-size: 21px; margin: 28px 0 4px; padding: 9px 14px 9px 14px;
        border-left: 5px solid #f5b400; line-height: 1.2; letter-spacing: 1px;
        display: flex; align-items: center; justify-content: space-between; gap: 14px;
        background: linear-gradient(90deg, #14304f 0%, rgba(20,48,79,0) 78%);
        border-radius: 0 8px 8px 0; }}
  .subj > summary:hover {{ background: linear-gradient(90deg, #1a3b5e 0%, rgba(20,48,79,0) 82%); }}
  .subj[open] > summary {{ margin-bottom: 10px; }}
  .chap > summary {{ font-size: 15px; color: #d7e6f7; font-weight: 700;
        margin: 16px 0 8px 16px; padding: 7px 14px; background: #16304f;
        border-radius: 8px; letter-spacing: .5px; display: flex; align-items: center;
        justify-content: space-between; gap: 14px; }}
  .chap > summary:hover {{ background: #1c3d64; }}
  .chap[open] > summary {{ margin-bottom: 10px; }}
  .cname {{ min-width: 0; }}
  .scount, .ccount {{ flex: 0 0 auto; font-size: 12px; font-weight: 700; color: #8fa6c4;
        background: #1b3a5f; border-radius: 999px; padding: 3px 11px; white-space: nowrap; }}
  .scount {{ background: #12324f; }}
  .arrow {{ color: #f5b400; font-size: 11px; margin-left: 6px; }}
  details > summary .arrow::before {{ content: "▸"; }}
  details[open] > summary .arrow::before {{ content: "▾"; }}
  .row {{ display: flex; align-items: center; justify-content: space-between; gap: 16px;
          background: #122a47; border: 1px solid #1e3c60; border-radius: 11px;
          padding: 13px 18px; margin: 0 0 10px 20px; }}
  .row:hover {{ background: #163356; border-color: #2b5885; }}
  .txt {{ min-width: 0; }}
  .t {{ font-size: 17px; font-weight: 700; }}
  .tag {{ display: inline-block; font-size: 11px; font-weight: 600; color: #a9c2e0;
          background: #1d3a5e; border-radius: 5px; padding: 1px 7px; margin-left: 8px;
          vertical-align: 2px; }}
  .d {{ color: #8fa6c4; font-size: 13px; margin-top: 4px; }}
  .btns {{ display: flex; gap: 8px; flex: 0 0 auto; }}
  a.b {{ display: inline-block; text-decoration: none; font-size: 14px; font-weight: 700;
         padding: 7px 14px; border-radius: 8px; white-space: nowrap; transition: .16s; }}
  a.live {{ background: #f5b400; color: #14243a; }}
  a.live:hover {{ filter: brightness(1.08); }}
  a.deck {{ background: #2a4a72; color: #dfe9f6; }}
  a.deck:hover {{ background: #345b8b; }}
  span.off {{ background: #1b3050; color: #62789a; font-size: 14px; font-weight: 700;
              padding: 7px 14px; border-radius: 8px; white-space: nowrap; }}
  .empty {{ color: #62789a; font-size: 14px; margin: 8px 0 10px 20px;
            padding: 13px 18px; background: #0f2438; border: 1px dashed #23405f;
            border-radius: 11px; }}
  footer {{ margin-top: 46px; color: #6f8aab; font-size: 12px; line-height: 1.9;
            border-top: 1px solid #1c3453; padding-top: 18px; }}
  footer b {{ color: #9fb4d0; }}
</style>
</head>
<body>
<div class="wrap">
  <div class="sites">{sites}</div>
  <h1>{title}</h1>
  <p class="sub">{subtitle}<br>
    <b>交互课堂</b>需要预览服务运行中（<code>npm run dev</code>，本站点 {site}）；
    <b>幻灯片</b>是同目录的单文件 HTML，双击即开。
  </p>
  <div class="tools">
    <button type="button" onclick="setAll(true)">全部展开</button>
    <button type="button" onclick="setAll(false)">全部收起</button>
    <span class="hint">点学科或章标题可收起 / 展开</span>
  </div>
  {body}
  <footer>
    幻灯片键盘操作：<b>→ / 空格 / 单击</b> 下一步 · <b>← / 右键</b> 上一步 ·
    <b>PgUp / PgDn</b> 翻页 · <b>F</b> 全屏 · <b>A</b> 批注 · <b>P</b> 暂停动画<br>
    图示动画可暂停、可拖相位定格、可按 ↺ 重演。<br>
    本页 {count} 节（幻灯片已导出 {exported} 节）· 生成时间 {now}
  </footer>
</div>
<script>
  function setAll(v) {{
    document.querySelectorAll('details').forEach(function (d) {{ d.open = v }})
  }}
</script>
</body>
</html>
"""


def render_rows(chapter: dict, files: list[str], site: str) -> tuple[list[str], int, int]:
    """渲染一章下的课节行 → (html 行列表, 节数, 已导出数)"""
    rows, n, exp = [], 0, 0
    for c in load_registry(chapter['registry']):
        cid = c.get('id')
        ctitle = c.get('title') or cid or ''
        info = course_info(cid) if cid else {}
        n += 1
        bits = []
        if info.get('pages'):
            bits.append(f"{info['pages']} 页")
        if info.get('minutes'):
            bits.append(f"约 {info['minutes']} 分钟")
        desc = ' · '.join(bits) or (c.get('desc') or '')
        tag = SP_SUBJECT.get(str(cid))
        tag_html = f'<span class="tag">{html.escape(tag)}</span>' if tag else ''
        live = (f'<a class="b live" href="{html.escape(site, quote=True)}'
                f'/?course={quote(str(cid))}">交互课堂</a>'
                if info.get('lecture') and c.get('lectureAvailable') is not False
                else '<span class="off">交互课堂</span>')
        fname = slide_file_for(info.get('title'), files)
        if fname:
            exp += 1
            deck = f'<a class="b deck" href="{quote(fname)}">幻灯片</a>'
        else:
            deck = '<span class="off">幻灯片未导出</span>'
        rows.append(
            f'<div class="row"><div class="txt">'
            f'<div class="t">{html.escape(ctitle)}{tag_html}</div>'
            f'<div class="d">{html.escape(desc)}</div>'
            f'</div><div class="btns">{live}{deck}</div></div>')
    return rows, n, exp


def site_nav(cur_file: str) -> str:
    out = []
    for p in PAGES:
        if p['file'] == cur_file:
            out.append(f'<span>{html.escape(p["nav"])}</span>')
        else:
            out.append(f'<a href="{quote(p["file"])}">{html.escape(p["nav"])}</a>')
    return '\n    '.join(out)


def main() -> int:
    ap = argparse.ArgumentParser(description='生成 slides-export/ 的课程目录页（三页）')
    ap.add_argument('--site', default=DEFAULT_SITE,
                    help=f'交互课堂站点基址（默认 {DEFAULT_SITE}）')
    args = ap.parse_args()
    site = args.site.rstrip('/')

    files = sorted(p.name for p in OUT_DIR.glob('*.html')
                   if p.name not in {p2['file'] for p2 in PAGES})
    total = 0
    for pg in PAGES:
        subj_blocks, count, exported = [], 0, 0
        for subj in pg['subjects']:
            inner, nch, ncourse = [], 0, 0
            chs = subj.get('chapters') or []
            # 学科下只有一章时，章默认展开（少一次点击）
            chap_open = ' open' if len(chs) == 1 else ''
            for ch in chs:
                rows, n, exp = render_rows(ch, files, site)
                if not rows:
                    continue
                count += n
                exported += exp
                nch += 1
                ncourse += n
                inner.append(
                    f'<details class="chap"{chap_open}>\n'
                    f'    <summary><span class="cname">{html.escape(ch["title"])}</span>'
                    f'<span class="ccount">{n} 节<span class="arrow"></span></span></summary>\n    '
                    + '\n    '.join(rows) + '\n  </details>')
            name = f'<span class="sname">{html.escape(subj["name"])}</span>'
            if inner:
                badge = (f'<span class="scount">{nch} 章 · {ncourse} 节'
                         f'<span class="arrow"></span></span>')
                subj_blocks.append(
                    f'<details class="subj" open>\n  <summary>{name}{badge}</summary>\n    '
                    + '\n    '.join(inner) + '\n</details>')
            else:
                subj_blocks.append(
                    f'<details class="subj" open>\n  <summary>{name}'
                    f'<span class="scount">未制作<span class="arrow"></span></span></summary>\n  '
                    f'<div class="empty">课节尚未制作</div>\n</details>')
        out = OUT_DIR / pg['file']
        out.write_text(
            PAGE.format(sites=site_nav(pg['file']), title=html.escape(pg['title']),
                        subtitle=html.escape(pg['subtitle']), body='\n  '.join(subj_blocks),
                        site=html.escape(site), count=count, exported=exported,
                        now=datetime.now().strftime('%Y-%m-%d %H:%M')),
            encoding='utf-8')
        total += count
        print(f'√ {pg["file"]:20s} {pg["title"]}：{count} 节（已导出幻灯片 {exported}）')
    print(f'  合计 {total} 节')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
