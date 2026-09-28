"""解析 pptx：每页的形状清单 + 动画顺序（点击步进/自动跟随、效果类型、目标形状）"""
import zipfile, re, json
from xml.etree import ElementTree as ET

NS = {
    'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
}
P = '{%s}' % NS['p']
A = '{%s}' % NS['a']

def shape_text(sp):
    return ''.join(t.text or '' for t in sp.iter(A + 't')).strip()

def parse_slide(z, idx):
    xml = z.read(f'ppt/slides/slide{idx}.xml')
    root = ET.fromstring(xml)
    # 形状清单：spid -> {name, text}
    shapes = {}
    for sp in root.iter(P + 'sp'):
        nv = sp.find(f'{P}nvSpPr/{P}cNvPr')
        if nv is None:
            continue
        sid = nv.get('id')
        shapes[sid] = {'name': nv.get('name'), 'text': shape_text(sp)[:60]}
    for pic in root.iter(P + 'pic'):
        nv = pic.find(f'{P}nvPicPr/{P}cNvPr')
        if nv is not None:
            shapes[nv.get('id')] = {'name': nv.get('name'), 'text': '[图片]'}
    for gf in root.iter(P + 'graphicFrame'):
        nv = gf.find(f'{P}nvGraphicFramePr/{P}cNvPr')
        if nv is not None:
            shapes[nv.get('id')] = {'name': nv.get('name'), 'text': '[表格/对象]'}
    for grp in root.iter(P + 'grpSp'):
        nv = grp.find(f'{P}nvGrpSpPr/{P}cNvPr')
        if nv is not None:
            shapes[nv.get('id')] = {'name': nv.get('name'), 'text': '[组合]'}
    # 动画时间树：按文档顺序找 clickEffect / afterEffect 节点
    anims = []
    timing = root.find(f'{P}timing')
    if timing is None:
        return shapes, anims
    for ctn in timing.iter(P + 'cTn'):
        nt = ctn.get('nodeType')
        if nt not in ('clickEffect', 'afterEffect', 'withEffect'):
            continue
        # 该节点下的效果与目标
        eff = None
        spid = None
        for ae in ctn.iter(P + 'animEffect'):
            eff = ae.get('filter') or 'appear'
        for st in ctn.iter(P + 'spTgt'):
            spid = st.get('spid')
        for st in ctn.iter(P + 'set'):
            pass
        if eff is None:
            # set 效果（出现/消失）
            for s in ctn.iter(P + 'set'):
                eff = 'set(appear/disappear)'
        anims.append({'trigger': nt, 'effect': eff or 'appear', 'spid': spid,
                      'target': shapes.get(spid, {}).get('name'),
                      'text': shapes.get(spid, {}).get('text')})
    return shapes, anims

import sys, os
WS = os.path.dirname(os.path.abspath(__file__))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(WS, '待处理', 'ppt91源文件与分析', 'ppt_ref.pptx')
DST = sys.argv[2] if len(sys.argv) > 2 else os.path.join(WS, 'ppt_structure.json')

out = {}
with zipfile.ZipFile(SRC) as z:
    slide_files = sorted(
        (n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml', n)),
        key=lambda n: int(re.search(r'\d+', n.split('/')[-1]).group()))
    for i, _ in enumerate(slide_files, 1):
        shapes, anims = parse_slide(z, i)
        out[i] = {'shapes': shapes, 'animations': anims}

with open(DST, 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=1)

# 打印每页动画概览
for i, d in out.items():
    clicks = [a for a in d['animations'] if a['trigger'] == 'clickEffect']
    afters = [a for a in d['animations'] if a['trigger'] == 'afterEffect']
    withs = [a for a in d['animations'] if a['trigger'] == 'withEffect']
    print(f"--- slide {i}: shapes={len(d['shapes'])} clicks={len(clicks)} after={len(afters)} with={len(withs)}")
    for a in d['animations']:
        tgt = (a['text'] or a['target'] or '?')[:30]
        print(f"    [{a['trigger'][:5]}] {a['effect']:<28} -> {tgt}")
