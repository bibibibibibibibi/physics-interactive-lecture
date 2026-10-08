"""Build a private candidate from matched real sentence audio/time pairs.

No deletion is performed. Replaced sp2 pairs are preserved under work.
"""
import argparse, json, sys, shutil, time, math, hashlib
from pathlib import Path
sys.dont_write_bytecode=True
C=Path(__file__).resolve().parent;ROOT=C.parents[2]
WORK=ROOT/'work/special-series/sp2'
CANDIDATE=WORK/'public/weblec/sp2'
sys.path.insert(0,str(ROOT/'lecture_factory'))
from build_web import split_sentences
from make_audio_neural import digest, decoded_duration, ffmpeg_exe, VOICE, FORMAT, SAMPLE_RATE, GAP_NORMAL, GAP_EMOT, PAGE_TEMPO, gap_overrides, sentence_gap, QUIZ_INVITATIONS
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check-only',action='store_true',help='Validate all staged pairs and manifests without copying or building.')
args=parser.parse_args()
stage=ROOT/'work/special-series/sp2/neural-stage'
doc=json.loads((C/'slides.json').read_text())
backup=ROOT/'work/special-series/sp2/audio-replaced'/str(time.time_ns())
errors=[]
ffmpeg=ffmpeg_exe()
for pg in doc['pages']:
    n=pg['id'];sents,_=split_sentences(pg['narration'])
    ts=stage/f'page{n}.times.json';mp=stage/'audio'/f'page{n}.mp3'
    manifest_path=stage/f'page{n}.neural.json'
    if not all(p.is_file() for p in (ts,mp,manifest_path)):
        errors.append(f'page{n}: real audio/time/manifest set incomplete');continue
    times=json.loads(ts.read_text());manifest=json.loads(manifest_path.read_text())
    if [t['text'] for t in times]!=sents:errors.append(f'page{n}: audio/text mismatch')
    expected={'engine':'node-edge-tts','voice':VOICE,'volume':'+30%','format':FORMAT,
              'sample_rate':SAMPLE_RATE,'gaps':[GAP_NORMAL,GAP_EMOT],
              'tempo':PAGE_TEMPO.get(n,1.08),'sentences':sents}
    overrides=gap_overrides(n,sents)
    if overrides:expected['sentence_gap_overrides']=overrides
    matches=manifest.get('sha256')==digest(expected) and all(manifest.get(k)==v for k,v in expected.items())
    if not matches:errors.append(f'page{n}: stale synthesis/pace manifest')
    cursor=0
    for t in times:
        if not all(math.isfinite(t[k]) for k in ('start','end')) or not 0<=cursor<=t['start']<t['end']:
            errors.append(f'page{n}: invalid sentence time order');break
        cursor=t['end']
    if matches and times:
        try:
            actual=decoded_duration(ffmpeg,mp)
            tail=sentence_gap(times[-1]['text'],overrides)
            if abs(actual-times[-1]['end']-tail)>.08:errors.append(f'page{n}: audio duration does not match sentence times')
        except RuntimeError as exc:errors.append(f'page{n}: {exc}')
if errors:
    raise SystemExit('Candidate preflight failed; nothing copied:\n'+'\n'.join(errors))
if args.check_only:
    print('All staged narration, timing and pace manifests match the revised source.');raise SystemExit(0)
for pg in doc['pages']:
    n=pg['id']
    for src,dst in [(stage/f'page{n}.times.json',C/f'page{n}.times.json'),(stage/'audio'/f'page{n}.mp3',C/'audio'/f'page{n}.mp3')]:
        if dst.exists() and dst.read_bytes()!=src.read_bytes():
            old=backup/dst.relative_to(C);old.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(dst,old)
        dst.parent.mkdir(exist_ok=True);shutil.copy2(src,dst)
    src=stage/f'page{n}.neural.json';dst=C/f'page{n}.neural.json'
    if dst.exists() and dst.read_bytes()!=src.read_bytes():
        old=backup/dst.relative_to(C);old.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(dst,old)
    shutil.copy2(src,dst)
import build_web, gen_audio
# All assets and builder output remain in the course-owned work directory.
# The parent task alone may promote this candidate to shared public/dist.
build_web.WEB_PUBLIC=str(CANDIDATE.parent)
CANDIDATE.mkdir(parents=True,exist_ok=True)
for src in (C/'assets').rglob('*'):
    if not src.is_file():continue
    dst=CANDIDATE/src.relative_to(C/'assets')
    if dst.exists() and dst.read_bytes()!=src.read_bytes():
        old=backup/'candidate-assets'/dst.relative_to(CANDIDATE);old.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(dst,old)
    dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
for name in ('audio.mp3','weblec.json'):
    src=CANDIDATE/name
    if src.exists():
        dst=backup/'candidate'/name;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
# MP3 silence has encoded frame padding. Use its measured duration in the local
# adapter so successive page starts agree with the concatenated audio clock.
gap=C/'audio/_sil_p.mp3'
gen_audio.silence(str(gap),0.8)
build_web.PAGE_GAP=gen_audio.probe(str(gap))
sys.argv=['build_web.py',str(C)]
build_web.main()
# Keep the approved narration source byte-for-byte intact. These output-only
# adaptations opt the simulations/videos into the shared classroom clock and pause
# each quiz after its complete spoken invitation, before any answer narration.
path=CANDIDATE/'weblec.json'
before=hashlib.sha256(path.read_bytes()).hexdigest()
candidate=json.loads(path.read_text())
invitations=QUIZ_INVITATIONS
changes=[]
for page in candidate['slides']:
    n=page['id']
    for i,element in enumerate(page['elements']):
        synced_sim=n in (5,16) and element.get('type')=='html'
        synced_video=n in (3,6,7) and element.get('type')=='video'
        if synced_sim or synced_video:
            element['timelineSync']=True
            changes.append({'page':n,'element_index':i,'field':'timelineSync','before':None,'after':True})
    if n not in invitations:continue
    subs=[s for s in candidate['subtitles'] if s['slide']==n]
    hits=[(i,s) for i,s in enumerate(subs) if s['text']==invitations[n]]
    if len(hits)!=1 or len(page.get('interactions',[]))!=1:
        raise RuntimeError(f'P{n}: quiz invitation must match exactly one real sentence and quiz')
    i,sentence=hits[0]
    next_start=subs[i+1]['start'] if i+1<len(subs) else page['t_end']
    trigger=round(sentence['end']+.02,3)
    if not sentence['end']<trigger<next_start:
        raise RuntimeError(f'P{n}: no real silent interval after complete question')
    quiz=page['interactions'][0]
    changes.append({'page':n,'field':'interactions[0].t','before':quiz['t'],'after':trigger,
                    'sentence':sentence,'next_sentence_start':next_start,
                    'reason':'Pause after the complete spoken invitation, before the next sentence.'})
    quiz['t']=trigger
path.write_text(json.dumps(candidate,ensure_ascii=False,indent=2)+'\n')
from validate_weblec import validate
validation=validate(str(path))
if validation.errors or validation.warns:
    raise RuntimeError(f'Transformed candidate validation: {validation.errors}; {validation.warns}')
(WORK/'candidate-transforms.json').write_text(json.dumps({
    'source_sha256':hashlib.sha256((C/'slides.json').read_bytes()).hexdigest(),
    'builder_output_sha256':before,'candidate_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
    'changes':changes,'validator':{'errors':validation.errors,'warnings':validation.warns},
},ensure_ascii=False,indent=2)+'\n')
print(f'Isolated candidate: {CANDIDATE}; no shared publication performed.')
