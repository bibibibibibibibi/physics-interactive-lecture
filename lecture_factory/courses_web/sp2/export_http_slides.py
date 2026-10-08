"""Export sp2 with the shared renderer; embedded media require a local HTTP server.

Vite writes to work with emptyOutDir=false, preserving every existing build.
"""
import sys, subprocess, argparse, shutil, time
from pathlib import Path
sys.dont_write_bytecode=True
C=Path(__file__).resolve().parent;ROOT=C.parents[2];APP=ROOT/'interactive-lecture'
WORK=ROOT/'work/special-series/sp2'
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--visual-only',action='store_true',help='Export the explicitly untimed manual visual review, with no narration audio.')
args=parser.parse_args()
BASE=WORK/'visual-preview' if args.visual_only else WORK
STAGE=BASE/'slides-stage'
WEBLEC=BASE/'public/weblec'
OUT_DIR=BASE/'slides-export'
if not (WEBLEC/'sp2/weblec.json').is_file():
    raise SystemExit(f'Candidate data missing: {WEBLEC}/sp2/weblec.json; no shared data fallback.')
OUT_DIR.mkdir(parents=True,exist_ok=True)
subprocess.run(['node',str(C/'candidate_vite.mjs'),'slides',*(['--visual-only'] if args.visual_only else [])],cwd=ROOT,check=True)
sys.path.insert(0,str(ROOT/'lecture_factory'))
import export_slides
export_slides.DIST=STAGE
export_slides.WEBLEC=WEBLEC
export_slides.OUT_DIR=OUT_DIR
name='大学物理-电磁感应定律-手动审阅.html' if args.visual_only else '大学物理-电磁感应定律-幻灯片-HTTP.html'
out=OUT_DIR/name
if out.exists():
    backup=WORK/'export-replaced'/str(time.time_ns())/name;backup.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(out,backup)
sys.argv=['export_slides.py','--course','sp2','--out',name]
if export_slides.main():raise SystemExit(1)
s=out.read_text()
boot='<script>if(location.protocol!=="file:"){const u=new URL(location.href);u.searchParams.set("course","sp2");history.replaceState(null,"",u)}else{addEventListener("DOMContentLoaded",()=>{const n=document.createElement("div");n.textContent="本课含模拟与视频，请通过本地 HTTP 服务放映：slides.html?course=sp2";n.style.cssText="position:fixed;top:0;left:0;right:0;z-index:100;background:#fff0c7;color:#16283f;padding:10px;text-align:center;font:16px sans-serif";document.body.append(n)})}</script>'
s=s.replace('<head>','<head>'+boot,1)
out.write_text(s)
shutil.copy2(out,STAGE/'sp2-visual.html' if args.visual_only else STAGE/'sp2-slides.html')
print(f'候选导出：{out}。模拟与视频由同一候选的 /weblec/sp2/ 提供，未写共享导出目录。')
