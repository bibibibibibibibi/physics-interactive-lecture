#!/usr/bin/env python3
"""Preflight all sentence-aligned real caches, then copy only sp8 audio inputs."""
import hashlib
import json
from pathlib import Path
import shutil
import sys
import time

sys.dont_write_bytecode = True
COURSE = Path(__file__).resolve().parent
ROOT = COURSE.parents[2]
WORK = ROOT / 'work/special-series/sp8'
STAGE = WORK / 'neural-stage'
sys.path.insert(0, str(COURSE.parents[1]))
from build_web import split_sentences
from gen_audio import probe

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    doc = json.loads((COURSE/'slides.json').read_text())
    checked=[]
    for page in doc['pages']:
        n=page['id']
        paths=[STAGE/f'audio/page{n}.mp3',STAGE/f'page{n}.times.json',STAGE/f'page{n}.neural.json']
        if any(not p.is_file() for p in paths):raise RuntimeError(f'Page {n}: complete caches required before any copy')
        segments=json.loads(paths[1].read_text());recipe=json.loads(paths[2].read_text())
        sentences,_=split_sentences(page['narration'])
        unsigned={k:v for k,v in recipe.items() if k!='sha256'}
        signed=hashlib.sha256(json.dumps(unsigned,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
        if recipe['sha256']!=signed or recipe['sentences']!=sentences or [s['text'] for s in segments]!=sentences:
            raise RuntimeError(f'Page {n}: stale narration or invalid recipe signature')
        if recipe['voice']!='zh-CN-YunxiNeural' or recipe['engine']!='node-edge-tts':raise RuntimeError('Unexpected voice engine')
        duration=probe(str(paths[0]));previous=0
        for seg in segments:
            if not previous<=seg['start']<seg['end']<=duration+0.1:raise RuntimeError(f'Page {n}: invalid sentence clock')
            if '[[' in seg['text'] or '\\' in seg['text']:raise RuntimeError(f'Page {n}: markup in spoken text')
            previous=seg['end']
        checked.append({'page':n,'duration':duration,'sentences':len(segments),'paths':paths})
    # Every page has passed above; preserve older formal caches before copying.
    backup=WORK/'audio-input-versions'/str(time.time_ns())
    for entry in checked:
        n=entry['page']
        for source,target in zip(entry['paths'],[COURSE/f'audio/page{n}.mp3',COURSE/f'page{n}.times.json',COURSE/f'page{n}.neural.json']):
            target.parent.mkdir(parents=True,exist_ok=True)
            if target.exists() and sha(source)!=sha(target):
                saved=backup/target.relative_to(COURSE);saved.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(target,saved)
            shutil.copy2(source,target)
    report={'course':'sp8','status':'all-page-preflight-passed','source':str(STAGE),'target':str(COURSE),
      'pages':[{'page':x['page'],'duration':x['duration'],'sentences':x['sentences'],
                'sha256':{p.name:sha(p) for p in x['paths']}} for x in checked],
      'total_page_audio_seconds':sum(x['duration'] for x in checked),'all_inputs_checked_before_copy':True,
      'auditory_review':'pending-human-confirmation'}
    (WORK/'audio-preflight.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(f"{len(checked)} pages, {sum(x['sentences'] for x in checked)} real sentences, {report['total_page_audio_seconds']:.2f}s page audio")

if __name__=='__main__':main()
