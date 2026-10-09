# -*- coding: utf-8 -*-
"""Build with the shared pipeline, then align this course to one continuous PCM clock.
Page MP3 frame padding must not accumulate across formula/subtitle cues.
"""
import hashlib,json,shutil,subprocess,sys,wave
from pathlib import Path
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2]
sys.path.insert(0,str(ROOT/'lecture_factory'))
import build_web
import imageio_ffmpeg
FF=imageio_ffmpeg.get_ffmpeg_exe();RATE=24000

def main():
 source=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else HERE
 public=ROOT/'interactive-lecture/public/weblec/analytical-mechanics';public.mkdir(parents=True,exist_ok=True)
 # All independent reviewed input must have complete audio before replacing final output.
 doc=json.loads((source/'slides.json').read_text());build_web.check_cached_transcripts(str(source),doc)
 manifests=[json.loads((source/f"page{p['id']}.voice.json").read_text()) for p in doc['pages']]
 for p,m in zip(doc['pages'],manifests):
  if hashlib.sha256((source/'audio'/f"page{p['id']}.mp3").read_bytes()).hexdigest()!=m['audio_sha256']:raise ValueError('audio signature mismatch')
 for file in (HERE/'assets').iterdir():
  if file.is_file():shutil.copy2(file,public/file.name)
 args=sys.argv;sys.argv=['build_web.py',str(source)];build_web.main();sys.argv=args
 web=json.loads((public/'weblec.json').read_text())
 work=ROOT/'work/analytical-mechanics/continuous-audio';work.mkdir(parents=True,exist_ok=True)
 totalframes=0
 with wave.open(str(work/'lecture.wav'),'wb') as full:
  full.setnchannels(1);full.setsampwidth(2);full.setframerate(RATE)
  for pg,m in zip(web['slides'],manifests):
   mp3=source/'audio'/f"page{pg['id']}.mp3";pcm=work/f"page{pg['id']}.wav"
   original=Path(m.get('pcm_path',''))
   if original.is_file():shutil.copy2(original,pcm)
   else:subprocess.run([FF,'-v','error','-y','-i',str(mp3),'-ac','1','-ar',str(RATE),'-c:a','pcm_s16le',str(pcm)],check=True)
   with wave.open(str(pcm),'rb') as f:frames=f.readframes(f.getnframes())
   expected=round(m['pcm_seconds']*RATE)
   if abs(len(frames)//2-expected)>1:raise ValueError(f'page {pg["id"]}: PCM frames {len(frames)//2} vs signed {expected}')
   start=totalframes/RATE;dur=len(frames)/2/RATE;offset=start-pg['t_start']
   pg['t_start']=round(start,3);pg['t_end']=round(start+dur,3);pg['duration']=round(dur,3)
   pg['stepTimes']={k:round(v+offset,3) for k,v in pg['stepTimes'].items()}
   for cue in pg['laser']:cue.update(start=round(cue['start']+offset,3),end=round(cue['end']+offset,3))
   for q in pg.get('interactions',[]):q['t']=round(q['t']+offset,3)
   for sub in web['subtitles']:
    if sub['slide']==pg['id']:sub.update(start=round(sub['start']+offset,3),end=round(sub['end']+offset,3))
   full.writeframes(frames);totalframes+=len(frames)//2
   if pg['id']!=web['slides'][-1]['id']:
    full.writeframes(b'\0\0'*round(doc.get('pageGap',.5)*RATE));totalframes+=round(doc.get('pageGap',.5)*RATE)
 subprocess.run([FF,'-v','error','-y','-i',str(work/'lecture.wav'),'-codec:a','libmp3lame','-b:a','96k',str(public/'audio.mp3')],check=True)
 web['duration']=round(totalframes/RATE,3);web['audioTiming']='single-PCM-clock';web['plannedActivitySeconds']=sum(q.get('plannedSeconds',0) for p in web['slides'] for q in p.get('interactions',[]))
 (public/'weblec.json').write_text(json.dumps(web,ensure_ascii=False,indent=1)+'\n')
 # Publish canonical signed per-page files only after the complete build succeeds.
 if source!=HERE:
  shutil.copy2(source/'slides.json',HERE/'slides.json');(HERE/'audio').mkdir(exist_ok=True)
  for p in doc['pages']:
   n=p['id'];shutil.copy2(source/'audio'/f'page{n}.mp3',HERE/'audio'/f'page{n}.mp3')
   for kind in ('times','voice'):shutil.copy2(source/f'page{n}.{kind}.json',HERE/f'page{n}.{kind}.json')
 import validate_weblec
 if not validate_weblec.run(str(public/'weblec.json')):raise ValueError('Course validation failed')
 print('continuous PCM duration',web['duration'],'seconds; activity',web['plannedActivitySeconds'],'seconds')
if __name__=='__main__':main()
