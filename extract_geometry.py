"""完整提取 pptx 每页形状：位置(EMU→1920x1080像素)、字号、颜色、对齐、加粗、动画步序"""
import zipfile, re, json
from xml.etree import ElementTree as ET

NS = {
    'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
}
P = '{%s}' % NS['p']
A = '{%s}' % NS['a']

EMU_W, EMU_H = 12192000, 6858000  # 16:9 标准页面（默认值，运行时按 pptx 实际 sldSz 覆盖）
PXW, PXH = 1920, 1080
def ex(v): return round(int(v) / EMU_W * PXW, 1)
def ey(v): return round(int(v) / EMU_H * PXH, 1)

def read_slide_size(path):
    """从 ppt/presentation.xml 读实际页面尺寸 sldSz（EMU），读不到用 16:9 默认"""
    global EMU_W, EMU_H
    try:
        with zipfile.ZipFile(path) as z:
            root = ET.fromstring(z.read('ppt/presentation.xml'))
        sz = root.find(f'{P}sldSz')
        if sz is not None and sz.get('cx') and sz.get('cy'):
            EMU_W, EMU_H = int(sz.get('cx')), int(sz.get('cy'))
    except Exception:
        pass
    return EMU_W, EMU_H

def runs_of(sp):
    """提取文本runs：[{text, size_px, color, bold, italic}]，保留段落分隔"""
    paras = []
    for para in sp.iter(A + 'p'):
        parts = []
        for r in para.findall(A + 'r'):
            rpr = r.find(A + 'rPr')
            size = color = None
            bold = italic = False
            if rpr is not None:
                if rpr.get('sz'): size = round(int(rpr.get('sz')) / 100 / 96 * 144, 1)  # pt→px@1080p 近似(页高10.8in? 实际7.5in→1080: 1pt=2px)
                size = round(int(rpr.get('sz')) / 100 * PXH / 540, 1) if rpr.get('sz') else None  # 7.5in=540pt 高度
                bold = rpr.get('b') == '1'
                italic = rpr.get('i') == '1'
                fill = rpr.find(f'{A}solidFill/{A}srgbClr')
                if fill is not None: color = '#' + fill.get('val')
            t = r.find(A + 't')
            if t is not None and t.text:
                parts.append({'t': t.text, 'size': size, 'color': color, 'b': bold, 'i': italic})
        if parts:
            paras.append(parts)
    return paras

def fill_of(sp):
    el = sp.find(f'{P}spPr/{A}solidFill/{A}srgbClr')
    return '#' + el.get('val') if el is not None else None

def line_of(sp):
    el = sp.find(f'{P}spPr/{A}ln/{A}solidFill/{A}srgbClr')
    return '#' + el.get('val') if el is not None else None

import sys, os
WS = os.path.dirname(os.path.abspath(__file__))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(WS, 'ppt_ref.pptx')
DST = sys.argv[2] if len(sys.argv) > 2 else os.path.join(WS, 'ppt_geometry.json')

out = {}
w, h = read_slide_size(SRC)
print(f'页面尺寸: {w}x{h} EMU ({w/914400:.2f}x{h/914400:.2f} in)')
with zipfile.ZipFile(SRC) as z:
    slides = sorted((n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml', n)),
                    key=lambda n: int(re.search(r'\d+', n.split('/')[-1]).group()))
    for idx, name in enumerate(slides, 1):
        root = ET.fromstring(z.read(name))
        # 动画：spid → 步序（点击序）
        step_of = {}
        step = 0
        timing = root.find(f'{P}timing')
        if timing is not None:
            for ctn in timing.iter(P + 'cTn'):
                if ctn.get('nodeType') == 'clickEffect':
                    step += 1
                    for st in ctn.iter(P + 'spTgt'):
                        if st.get('spid'): step_of[st.get('spid')] = step
        items = []
        for sp in root.iter(P + 'sp'):
            nv = sp.find(f'{P}nvSpPr/{P}cNvPr')
            if nv is None: continue
            sid = nv.get('id')
            xfrm = sp.find(f'{P}spPr/{A}xfrm')
            box = None
            if xfrm is not None:
                off, ext = xfrm.find(A + 'off'), xfrm.find(A + 'ext')
                if off is not None and ext is not None:
                    box = {'x': ex(off.get('x')), 'y': ey(off.get('y')),
                           'w': ex(ext.get('cx')), 'h': ey(ext.get('cy'))}
            items.append({
                'id': sid, 'name': nv.get('name'), 'step': step_of.get(sid, 0),
                'box': box, 'fill': fill_of(sp), 'line': line_of(sp),
                'paras': runs_of(sp),
            })
        out[idx] = items

with open(DST, 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=1)

# 打印第1页示例验证
for it in out[1]:
    txt = ''.join(r['t'] for p in it['paras'] for r in p)[:40]
    print(it['step'], it['name'], it['box'], it['fill'], txt)
