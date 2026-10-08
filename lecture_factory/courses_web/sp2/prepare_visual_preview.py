"""Create a manual-only preview of the revised pages, without audio or timings.

This is not a releasable lecture. SlidesOnly uses element.step directly, so no
synthetic timestamps or stale narration audio are needed for visual review.
"""
import json
import shutil
from pathlib import Path

C = Path(__file__).resolve().parent
ROOT = C.parents[2]
OUT = ROOT / 'work/special-series/sp2/visual-preview/public/weblec/sp2'
OUT.mkdir(parents=True, exist_ok=True)
doc = json.loads((C / 'slides.json').read_text())
pages = []
for page in doc['pages']:
    pages.append({**page, 'kind': 'page', 'stepTimes': {}, 'bullets': [], 'laser': [],
                  't_start': 0, 't_end': 0, 'duration': 0})
preview = {k: v for k, v in doc.items() if k != 'pages'}
preview.update({'footer': doc['footer'] + '　·　手动审阅／配音待同步',
                'slides': pages, 'subtitles': [], 'duration': 0, 'characters': [],
                'preview_mode': 'manual_visual_only_no_audio', 'audio_verified': False})
(OUT / 'weblec.json').write_text(json.dumps(preview, ensure_ascii=False, indent=1))
for source in (C / 'assets').rglob('*'):
    if source.is_file():
        target = OUT / source.relative_to(C / 'assets')
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
print(f'Manual visual preview only: {OUT}; no audio and no fabricated timeline.')
