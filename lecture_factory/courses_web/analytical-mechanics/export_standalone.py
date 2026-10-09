#!/usr/bin/env python3
"""Export shared presentation renderer with fully inlined interactive experiments."""
import copy
import json
import shutil
import sys
from pathlib import Path
from urllib.parse import urlsplit

COURSE=Path(__file__).resolve().parent
ROOT=COURSE.parents[2]
APP=ROOT/'interactive-lecture'
STAGE=ROOT/'work'/'analytical-mechanics'/'standalone-stage'
PUBLIC=APP/'public'/'weblec'/'analytical-mechanics'
sys.path.insert(0,str(ROOT/'lecture_factory'))
import export_slides

def main():
    target=STAGE/'analytical-mechanics';target.mkdir(parents=True,exist_ok=True)
    doc=copy.deepcopy(json.loads((PUBLIC/'weblec.json').read_text()))
    physics=(COURSE/'assets'/'sim-physics.js').read_text()
    template=(COURSE/'assets'/'sim-mechanics.html').read_text()
    for p in doc['slides']:
        for e in p['elements']:
            if e['type']=='html':
                query=urlsplit(e['src']).query
                inline=template.replace('<script src="sim-physics.js"></script>','<script>'+physics+'</script>')
                inline=inline.replace('new URLSearchParams(location.search)','new URLSearchParams('+json.dumps(query)+')')
                e['srcDoc']=inline
    (target/'weblec.json').write_text(json.dumps(doc,ensure_ascii=False),encoding='utf-8')
    shutil.copy2(PUBLIC/'logo.png',target/'logo.png')
    for asset in (COURSE/'assets').glob('*.svg'):
        shutil.copy2(PUBLIC/asset.name,target/asset.name)
    export_slides.WEBLEC=STAGE
    sys.argv=['export_slides.py','--course','analytical-mechanics','--out','分析力学-拉格朗日方程-交互放映.html']
    return export_slides.main()

if __name__=='__main__':raise SystemExit(main())
