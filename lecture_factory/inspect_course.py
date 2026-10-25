"""课件制作体检（静态部分）—— 把「通病」逐条变成可判定项。

用法：
    python inspect_course.py <课|all> [--verbose]

覆盖的判据（每条都能给出页码与元素定位）：

  S1 结构校验          validate_weblec 0 错误
  T1 折行风险（WARN）  估宽折行后所需高度 > 声明 h；真实是否压字由浏览器 B6 判定
  T2 字号过小          正文 run size < MIN_SIZE，投影上看不清
  T3 文案超宽（仅提示）est > avail，但 h 装得下 —— 允许，只做记录
  T4 横向越界          x + w > 1750（版心右界）
  F1 页脚越界          y + h > FOOTER_TOP（1015）
  F2 首屏留白          标题下方 120px 内没有任何后续元素
  M1 步骤数            step 最大值 与 narration 的 [[n]] 个数不符
  M2 图注缺失          diagram 有图但同页没有任何文字解释

退出码：0 无 ERROR；1 有 ERROR。
"""
import json, math, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from validate_weblec import est_paras_width, validate

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, 'interactive-lecture', 'public', 'weblec')
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'courses_web')

VW_LEFT, VW_RIGHT = 170, 1750
FOOTER_TOP = 1015
MIN_SIZE = 24   # 1920 设计坐标下 24px ≈ 1080p 的 13.5px，再小投影看不清
LINE_H = 1.45
FIG = ('diagram', 'img', 'html', 'video')


def avail_width(e, els):
    """文字可用宽度：只有与它纵向相交且在右侧的图才算限制。"""
    ey0, ey1 = e['y'], e['y'] + (e.get('h') or 100)
    avail = VW_RIGHT - e['x']
    for f in els:
        if f.get('type') not in FIG or f['x'] <= e['x']:
            continue
        fy0, fy1 = f['y'], f['y'] + (f.get('h') or 120)
        if fy1 > ey0 + 8 and fy0 < ey1 - 8:
            avail = min(avail, f['x'] - 40 - e['x'])
    return max(avail, 60)


def check_page(p):
    """返回该页的问题列表 [(级别, 代码, 说明)]。"""
    out = []
    els = p['elements']
    pid = p['id']

    for e in els:
        t = e.get('type')
        if t == 'text':
            est = est_paras_width(e.get('paras'), 40)
            avail = avail_width(e, els)
            h = e.get('h') or 0
            sizes = [r.get('size', 40) for para in (e.get('paras') or []) for r in para]
            mx = max(sizes or [40])
            mn = min(sizes or [40])
            n = max(1, math.ceil(est / avail)) if avail > 0 else 1
            # 单行实测高度 ≈ 1.25em；每多一行再叠一个行距 1.45em
            need = mx * 1.25 + (n - 1) * mx * LINE_H
            if h and need > h * 1.10:
                # 估宽偏保守（CJK 按 1.0em），是否真压字由浏览器实测 B6 判定
                out.append(('WARN', 'T1',
                            'P%d y%d 折 %d 行需 %dpx > h=%d（est=%d avail=%d）'
                            % (pid, e['y'], n, need, h, est, avail)))
            if mn < MIN_SIZE:
                out.append(('WARN', 'T2',
                            'P%d y%d 字号 %d < %d，投影偏小' % (pid, e['y'], mn, MIN_SIZE)))
            if est > avail + 2 and (not h or need <= h * 1.06):
                out.append(('INFO', 'T3',
                            'P%d y%d 折行但 h 容得下（est=%d avail=%d h=%d）'
                            % (pid, e['y'], est, avail, h)))
            if e['x'] + (e.get('w') or 0) > VW_RIGHT + 2:
                lv = 'INFO' if t in FIG else 'WARN'
                out.append((lv, 'T4',
                            'P%d y%d 横向越界 x+w=%d > %d'
                            % (pid, e['y'], e['x'] + e['w'], VW_RIGHT)))

        bottom = e.get('y', 0) + (e.get('h') or e.get('rowh') or 0)
        if t == 'table':
            bottom = e.get('y', 0) + (e.get('rowh') or 60) * len(e.get('rows') or [])
        # 封面页的整幅背景图（h≥900 或 y=0 起满版）不算越界
        full_page_fig = t in ('img', 'html', 'video') and e.get('y', 0) <= 40 \
            and (e.get('h') or 0) >= 900
        if t in ('text', 'box', 'table', 'tex', 'diagram', 'img', 'html', 'video') \
                and not full_page_fig and bottom > FOOTER_TOP:
            out.append(('ERROR', 'F1', 'P%d %s 底边 %d > 页脚 %d' % (pid, t, bottom, FOOTER_TOP)))

    # F2 首屏留白：标题（y≈137）之后 200px 空白
    texts = sorted([e for e in els if e.get('type') == 'text'], key=lambda e: e['y'])
    if texts and texts[0]['y'] < 200:
        nxt = [e for e in els if e.get('type') != 'text' or e['y'] > texts[0]['y'] + 40]
        if nxt:
            gap = min(e['y'] for e in nxt) - (texts[0]['y'] + (texts[0].get('h') or 60))
            if gap > 200:
                out.append(('WARN', 'F2', 'P%d 标题下空 %dpx' % (pid, gap)))

    # M1 步进一致性由 validate_weblec 负责（stepTimes 与 step 的对应），此处不重复。

    # M2 有图但无解释文字
    if any(e.get('type') in FIG for e in els) and not [e for e in els if e.get('type') == 'text']:
        out.append(('WARN', 'M2', 'P%d 只有图、没有文字' % pid))

    return out


def inspect(course, verbose=False, collect=None):
    path = os.path.join(PUB, course, 'weblec.json')
    if not os.path.exists(path):
        print(f'· {course}: 无 weblec.json（评审目录，跳过）')
        return 0
    d = json.load(open(path, encoding='utf-8'))
    rep = validate(path)
    rows = []
    for m in rep.errors:
        rows.append(('ERROR', 'S1', m))
    for p in d['slides']:
        rows += check_page(p)

    err = [r for r in rows if r[0] == 'ERROR']
    warn = [r for r in rows if r[0] == 'WARN']
    info = [r for r in rows if r[0] == 'INFO']
    flag = '✗' if err else '✓'
    print(f'{flag} {course}: {len(d["slides"])} 页 · ERROR {len(err)} · WARN {len(warn)} · INFO {len(info)}')
    if verbose:
        for lv, code, msg in rows:
            if lv == 'INFO' and not verbose:
                continue
            print(f'   [{lv}] {code} {msg}')
    elif err:
        for lv, code, msg in err[:8]:
            print(f'   [ERROR] {code} {msg}')
    if collect is not None:
        collect.append((course, len(err), len(warn), len(info), rows))
    return 0 if not err else 1


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    verbose = '--verbose' in sys.argv or '-v' in sys.argv
    if not args:
        print(__doc__)
        return 2
    if args[0] == 'all':
        courses = sorted(x for x in os.listdir(PUB) if os.path.isdir(os.path.join(PUB, x)))
    else:
        courses = args
    bad = 0
    for c in courses:
        bad += inspect(c, verbose)
    print(f'\n=== 共 {len(courses)} 节，{bad} 节有 ERROR ===')
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
