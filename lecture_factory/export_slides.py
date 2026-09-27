#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""export_slides.py —— 把 dist-slides/ 的构建产物打成「双击即开」的单文件幻灯片。

流程：
  1. 先在 interactive-lecture/ 执行  npm run build:slides （vite.slides.config.ts：
     单 chunk + KaTeX 字体内联为 data URL）
  2. 本脚本把 dist-slides/slides.html 引用的 JS/CSS 全部内联，
     并注入 window.__WEBLEC__（课件数据）与 window.__WEBLEC_MEDIA__
     （logo/插图转 base64 data URL），输出一个自包含 HTML——
     file:// 双击可开，无需服务器、无需联网。

用法（在仓库根或任意目录执行均可，路径按脚本位置推导）：
  python lecture_factory/export_slides.py --build   # 一条命令：构建 + 打包（日常就用这条）
  python lecture_factory/export_slides.py           # 只打包（dist-slides/ 已是最新时）
"""
import argparse
import base64
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent          # 工作区根
APP = ROOT / 'interactive-lecture'
DIST = APP / 'dist-slides'
WEBLEC = APP / 'public' / 'weblec'                      # 各课程目录（weblec/<课名>/）

# 需要内联进单文件的图片（img 元素 src 引用的文件名 → mime）
IMG_MIME = {'.png': 'image/png', '.gif': 'image/gif', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
            '.svg': 'image/svg+xml', '.webp': 'image/webp'}


def data_url(p: Path) -> str:
    mime = IMG_MIME.get(p.suffix.lower(), 'application/octet-stream')
    return f"data:{mime};base64,{base64.b64encode(p.read_bytes()).decode()}"


def main() -> int:
    ap = argparse.ArgumentParser(description='导出单文件静态幻灯片')
    ap.add_argument('--course', default='shm', help='课程目录名（public/weblec/<课名>/），默认 shm')
    ap.add_argument('--build', action='store_true',
                    help='先执行 npm run build:slides 再打包（日常一条命令走这个）')
    ap.add_argument('--out', default=None, help='输出文件名（默认 大学物理-<标题>-幻灯片.html，放 dist-slides/）')
    args = ap.parse_args()

    media_dir = WEBLEC / args.course
    if not (media_dir / 'weblec.json').exists():
        print(f'× 未找到课程数据 {media_dir}/weblec.json（--course 指定课程目录名）')
        return 1

    if args.build:
        r = subprocess.run('npm run build:slides', cwd=APP, shell=True)
        if r.returncode != 0:
            print('× npm run build:slides 失败')
            return 1

    html_path = DIST / 'slides.html'
    if not html_path.exists():
        print('× 未找到 dist-slides/slides.html，请先在 interactive-lecture/ 运行 npm run build:slides')
        return 1
    html = html_path.read_text(encoding='utf-8')

    # 1) 内联 JS（单 chunk，inlineDynamicImports 已保证无外部 import）
    m = re.search(r'<script type="module" crossorigin src="(\./assets/[^"]+)"></script>', html)
    if not m:
        print('× slides.html 中未找到入口 <script>，构建产物结构有变化')
        return 1
    js = (DIST / m.group(1)).read_text(encoding='utf-8')
    if '</script' in js.lower():
        js = re.sub(r'</script', r'<\\/script', js, flags=re.IGNORECASE)

    # 2) 内联 CSS（KaTeX 字体已是 data URL）
    mcss = re.search(r'<link rel="stylesheet" crossorigin href="(\./assets/[^"]+)">', html)
    if not mcss:
        print('× slides.html 中未找到 <link> 样式，构建产物结构有变化')
        return 1
    css = (DIST / mcss.group(1)).read_text(encoding='utf-8')

    # 3) 课件数据与媒体内联
    weblec = json.loads((media_dir / 'weblec.json').read_text(encoding='utf-8'))
    media: dict[str, str] = {}
    used = {e.get('src') for p in weblec['slides'] for e in p['elements'] if e['type'] == 'img'}
    used.add('logo.png')
    for name in sorted(u for u in used if u):
        f = media_dir / name
        if f.exists():
            media[name] = data_url(f)
        else:
            print(f'! 媒体文件缺失，跳过：{name}')
    inject = ('<script>window.__WEBLEC__=' + json.dumps(weblec, ensure_ascii=False)
              + ';window.__WEBLEC_MEDIA__=' + json.dumps(media, ensure_ascii=False) + ';</script>')

    # 4) 拼装：数据注入在最前，保证 React 启动前可用
    html = html.replace(m.group(0), inject + '\n    <script type="module">' + js + '</script>')
    html = html.replace(mcss.group(0), '<style>' + css + '</style>')

    out_name = args.out or f"大学物理-{weblec.get('title', '课件')}-幻灯片.html"
    out = DIST / out_name
    out.write_text(html, encoding='utf-8')
    size_mb = out.stat().st_size / 1024 / 1024
    print(f'√ 单文件幻灯片已导出：{out}')
    print(f'  大小 {size_mb:.1f} MB（含 {len(media)} 个内联媒体、KaTeX 字体）')
    return 0


if __name__ == '__main__':
    sys.exit(main())
