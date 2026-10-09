#!/usr/bin/env python3
"""Generate signed, sentence-aligned offline narration without deleting cache files."""
import argparse
import shutil
import time
import hashlib
import json
import subprocess
import sys
import wave
from pathlib import Path
import imageio_ffmpeg

COURSE=Path(__file__).resolve().parent
ROOT=COURSE.parents[2]
sys.path.insert(0,str(COURSE.parents[1]))
from build_web import split_sentences, sentence_gap_policy

FF=imageio_ffmpeg.get_ffmpeg_exe()
RATE=24000
VOICE='Tingting'
WORK=ROOT/'work'/'analytical-mechanics'/'audio-cache'

def run(args):
    r=subprocess.run(args,capture_output=True,text=True,timeout=120)
    if r.returncode: raise RuntimeError(r.stderr[-1000:])

def wav_frames(path):
    with wave.open(str(path),'rb') as f:
        if (f.getnchannels(),f.getsampwidth(),f.getframerate())!=(1,2,RATE):
            raise ValueError(f'Invalid PCM: {path}')
        frames=f.readframes(f.getnframes())
    if not frames: raise ValueError('macOS voice service returned empty audio')
    return frames

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--course',type=Path,default=COURSE)
    parser.add_argument('--rate',type=int,default=220)
    parser.add_argument('--pages',type=int,default=0)
    parser.add_argument('--refresh',action='store_true')
    args=parser.parse_args(); course=args.course.resolve(); speech_rate=args.rate
    doc=json.loads((course/'slides.json').read_text())
    WORK.mkdir(parents=True,exist_ok=True)
    (course/'audio').mkdir(exist_ok=True)
    for p in doc['pages'][:args.pages or None]:
        n=p['id'];sents,_=split_sentences(p['narration']);gaps=sentence_gap_policy(p,sents)
        metadata={'engine':'macOS say','voice':VOICE,'rate':speech_rate,'sample_rate':RATE,
                  'sentences':sents,'gaps':gaps,'normal_gap':.3,'question_gap':.5,'tail':.4}
        signature=hashlib.sha256(json.dumps(metadata,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
        output=course/'audio'/f'page{n}.mp3'; side=course/f'page{n}.times.json'; manifest=course/f'page{n}.voice.json'
        if output.exists() or side.exists():
            if not(output.exists() and side.exists() and manifest.exists()):raise ValueError(f'Incomplete page {n} cache')
            old=json.loads(manifest.read_text())
            if old['sha256']!=signature:
                if not args.refresh:raise ValueError(f'Page {n} changed: use --refresh to preserve and regenerate')
                backup=WORK/'replaced'/str(time.time_ns());backup.mkdir(parents=True)
                for path in [output,side,manifest]:shutil.copy2(path,backup/path.name)
            if old['audio_sha256']!=hashlib.sha256(output.read_bytes()).hexdigest():raise ValueError(f'Page {n} audio changed')
            if old['times_sha256']!=hashlib.sha256(side.read_bytes()).hexdigest():raise ValueError(f'Page {n} times changed')
            if old['sha256']==signature:
                print(f'page {n}: verified cache',flush=True);continue
        pagework=WORK/signature;pagework.mkdir(exist_ok=True)
        frames=[];times=[];cursor=0
        for i,s in enumerate(sents):
            digest=hashlib.sha256((VOICE+str(speech_rate)+s).encode()).hexdigest()
            sw=WORK/digest;sw.mkdir(exist_ok=True)
            txt=sw/'sentence.txt';aiff=sw/'sentence.aiff';pcm=sw/'sentence.wav'
            if not pcm.exists():
                txt.write_text(s,encoding='utf-8')
                run(['/usr/bin/say','-v',VOICE,'-r',str(speech_rate),'-f',str(txt),'-o',str(aiff)])
                run([FF,'-v','error','-y','-i',str(aiff),'-ac','1','-ar',str(RATE),'-c:a','pcm_s16le',str(pcm)])
            spoken=wav_frames(pcm);count=len(spoken)//2
            times.append({'start':round(cursor/RATE,3),'end':round((cursor+count)/RATE,3),'text':s})
            frames.append(spoken);cursor+=count
            gap=gaps.get(i,.5 if s.endswith(('？','！','?','!')) else .3)
            gapframes=round(gap*RATE);frames.append(b'\0\0'*gapframes);cursor+=gapframes
        frames.append(b'\0\0'*round(.4*RATE))
        full=pagework/'page.wav'
        with wave.open(str(full),'wb') as f:
            f.setnchannels(1);f.setsampwidth(2);f.setframerate(RATE);f.writeframes(b''.join(frames))
        pending=pagework/'page.mp3'
        run([FF,'-v','error','-y','-i',str(full),'-codec:a','libmp3lame','-b:a','96k',str(pending)])
        run([FF,'-v','error','-i',str(pending),'-f','null','-'])
        output.write_bytes(pending.read_bytes())
        side.write_text(json.dumps(times,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
        manifest.write_text(json.dumps({'sha256':signature,**metadata,
          'audio_sha256':hashlib.sha256(output.read_bytes()).hexdigest(),
          'times_sha256':hashlib.sha256(side.read_bytes()).hexdigest(),
          'spoken_seconds':round(sum(t['end']-t['start'] for t in times),3),
          'pcm_seconds':round(cursor/RATE+.4,6),
          'pcm_path':str(full)},ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
        print(f'page {n}: {len(sents)} sentences, {cursor/RATE+.4:.2f}s',flush=True)

if __name__=='__main__':main()
