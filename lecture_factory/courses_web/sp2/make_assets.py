"""Extracted source media plus course-native SVGs. No source files are modified."""
from pathlib import Path
import shutil, subprocess, json
import imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[3]; COURSE=Path(__file__).resolve().parent
A=COURSE/'assets';A.mkdir(exist_ok=True)
FF=imageio_ffmpeg.get_ffmpeg_exe()
SOURCE=COURSE/'source/media'
ORIGINAL_HTML=Path('/Users/xm/Documents/青教赛筑基/操宣敏-气液相变楞次定律/电磁感应交互实验室/index.html')
shutil.copy2(ORIGINAL_HTML,COURSE/'source/induction-lab-original.html')
shutil.copy2(SOURCE/'image8.png',A/'faraday.png');shutil.copy2(SOURCE/'image9.png',A/'diary.png')
shutil.copy2(ROOT/'lecture_factory/assets/logo_gewu.png',A/'logo.png')
for n,name,crop in [(1,'train',None),(2,'switch',None),(3,'move-coil','crop=952:720:0:60'),(4,'change-current','crop=952:720:0:60'),(5,'moving-rod','crop=1440:910:0:60')]:
    p=A/f'{name}.mp4'
    if not p.exists():
        vf=(crop+',' if crop else '')+'scale=min(1280\\,iw):-2,setsar=1'
        subprocess.run([FF,'-i',str(SOURCE/f'media{n}.mp4'),'-vf',vf,'-an','-c:v','libx264','-pix_fmt','yuv420p','-crf','22','-preset','fast','-movflags','+faststart',str(p)],capture_output=True,check=True)
INK='#16283f';BLUE='#244b88';RED='#bb3434';GREEN='#22865d'
def label(x,y,t,size=28,color=INK,anchor='start'):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" text-anchor="{anchor}">{t}</text>'
def arrow(x,y,xx,yy,color=BLUE):
    return f'<path d="M{x},{y} L{xx},{yy}" stroke="{color}" stroke-width="5" marker-end="url(#arrow)"/>'
def svg(name,body,w=900,h=600):
    head=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" font-family="PingFang SC,Microsoft YaHei,sans-serif"><defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10" fill="context-stroke"/></marker><linearGradient id="cu"><stop stop-color="#8a4926"/><stop offset=".45" stop-color="#edb779"/><stop offset="1" stop-color="#92542d"/></linearGradient></defs>'
    (A/f'{name}.svg').write_text(head+body+'</svg>')
def magnet(x,y):
    return f'<rect x="{x}" y="{y}" width="90" height="120" rx="9" fill="{BLUE}"/><path d="M{x},{y+60}h90v60h-90z" fill="{RED}"/>'+label(x+45,y+40,'S',34,'white','middle')+label(x+45,y+100,'N',34,'white','middle')
def tube(x,labeltxt,slit=False):
    return f'<rect x="{x}" y="150" width="125" height="335" rx="12" fill="url(#cu)"/><ellipse cx="{x+62}" cy="150" rx="62" ry="19" fill="#7c462a"/><ellipse cx="{x+62}" cy="150" rx="44" ry="12" fill="#eef5fb"/>'+(f'<path d="M{x+65},170 V480" stroke="#eef5fb" stroke-width="9"/>' if slit else '')+label(x+63,545,labeltxt,32,INK,'middle')
svg('cover','<circle cx="450" cy="300" r="235" fill="#e4edf9"/>'+''.join(f'<ellipse cx="450" cy="{260+i*17}" rx="170" ry="80" fill="none" stroke="#5788cd" stroke-width="10"/>' for i in range(7))+arrow(450,95,450,500)+label(480,135,'B',40,BLUE)+label(450,570,'变化的磁通量',32,BLUE,'middle'))
svg('tube-pair','<rect x="140" y="150" width="125" height="335" rx="12" fill="#d5e7f2" stroke="#8aa6bd" stroke-width="4"/>'+label(202,545,'塑料管',32,INK,'middle')+tube(570,'铜管')+magnet(157,330)+magnet(587,210)+arrow(295,275,295,435)+arrow(720,285,720,335)+label(450,25,'相同释放条件，经过相同时间（示意）',28,BLUE,'middle'))
rod='<rect x="140" y="150" width="570" height="300" fill="#e4edf9" stroke="#879fbc"/>'
for y in [220,300,380]:
    for x in [210,320,430,540,650]:rod+=label(x,y,'×',35,BLUE,'middle')
rod+='<path d="M140 150V450H710 M140 150H710" stroke="#56677c" stroke-width="8" fill="none"/><rect x="585" y="130" width="18" height="340" rx="8" fill="url(#cu)"/>'+arrow(605,100,760,100)+label(720,75,'v',34,BLUE)+label(615,310,'ℓ',38,INK)+label(155,510,'B 向里；棒向右；回路面积增大',26,INK)
svg('rod',rod)
svg('flux','<path d="M120 420L580 470L770 250L310 200Z" fill="#dce9f8" stroke="#8ca9cd" stroke-width="4"/>'+arrow(445,335,445,80)+arrow(445,335,650,115)+'<path d="M445 200Q490 205 520 245" fill="none" stroke="#bb3434" stroke-width="4"/>'+label(455,75,'n̂',36,BLUE)+label(665,115,'B',38,BLUE)+label(495,200,'θ',34,RED)+label(185,530,'θ 是 B 与法向的夹角',30,BLUE))
graph='<path d="M120 470H790 M120 470V85" fill="none" stroke="#546b88" stroke-width="3"/>'+label(70,65,'Φ / Wb',26,BLUE)+label(750,525,'t / s',26,BLUE)+'<path d="M120 470L320 150H620L720 470" fill="none" stroke="#244b88" stroke-width="6"/>'
for x,t in [(120,'0'),(320,'0.2'),(620,'0.5'),(720,'0.6')]: graph+=label(x,510,t,25,INK,'middle')
graph+='<path d="M120 150H620" stroke="#9ab1ce" stroke-width="2" stroke-dasharray="8 7"/>'+label(25,160,'0.04',26,INK)+label(230,290,'①',36,BLUE)+label(460,125,'②',36,BLUE)+label(695,290,'③',36,BLUE)
svg('flux-graph',graph)
svg('orientation','<ellipse cx="450" cy="320" rx="225" ry="130" fill="#e8f1fb" stroke="#405e85" stroke-width="8"/><circle cx="450" cy="320" r="38" fill="none" stroke="#244b88" stroke-width="5"/><circle cx="450" cy="320" r="10" fill="#244b88"/><path d="M600 218Q445 140 300 235" stroke="#bb3434" stroke-width="6" fill="none" marker-end="url(#arrow)"/>'+label(450,95,'从纸面前方看',30,INK,'middle')+label(450,535,'法向向外 ⊙　正向逆时针',30,BLUE,'middle')+label(580,170,'正向',28,RED))
pair=''
for x,near in [(100,True),(1000,False)]:
    pair+=magnet(x+230,100)+f'<ellipse cx="{x+275}" cy="400" rx="180" ry="50" fill="#eef4fb" stroke="#667e9d" stroke-width="7"/>'
    pair+=arrow(x+275,240,x+275,335,BLUE) if near else arrow(x+380,300,x+380,210,BLUE)
    pair+=arrow(x+70,420,x+70,290,RED) if near else arrow(x+70,300,x+70,430,RED)
    pair+=label(x+410 if not near else x+295,275 if near else 250,'v',30,BLUE)+label(x+30,70,'N极靠近' if near else 'N极远离',34,BLUE)+label(x+60,525,'感应场向上，逆时针' if near else '感应场向下，顺时针',29,RED)+label(x+280,490,'线圈上面：N' if near else '线圈上面：S',27,INK,'middle')
pair+=label(880,590,'两图原场均向下；蓝箭头v表示运动；电流均从上方看',28,INK,'middle')
svg('lenz-pair',pair,1800,640)
flow=''
for i,t in enumerate(['原磁场方向','磁通量增减','感应场方向','感应电流方向']):
    x=20+i*425;flow+=f'<rect x="{x}" y="50" width="350" height="115" rx="15" fill="#eef4fc" stroke="#8ea9cc" stroke-width="3"/>'+label(x+175,118,t,31,BLUE,'middle')
    if i<3:flow+=arrow(x+365,108,x+410,108)
svg('lenz-flow',flow,1700,220)
weak='<ellipse cx="450" cy="310" rx="220" ry="145" fill="#edf3fc" stroke="#587394" stroke-width="6"/>'
for x,y in [(330,250),(460,250),(580,250),(330,355),(460,355),(580,355)]:weak+=label(x,y,'×',42,BLUE,'middle')
weak+=label(450,525,'B 向里，正在减弱',34,BLUE,'middle')+label(450,65,'回路保持固定',30,INK,'middle')
svg('weak-field',weak)
slices=tube(110,'导电铜管')+magnet(560,210)+'<ellipse cx="605" cy="170" rx="160" ry="22" fill="#d7ab74" stroke="#8e623a" stroke-width="5"/><ellipse cx="605" cy="435" rx="160" ry="22" fill="#d7ab74" stroke="#8e623a" stroke-width="5"/>'+arrow(820,310,820,420,BLUE)+label(840,365,'v',34,BLUE)+arrow(520,310,520,240,RED)+arrow(680,310,680,240,RED)+label(350,55,'圆环对磁铁的力均向上',29,RED)+label(380,90,'上方环：吸引',29,RED)+label(380,520,'下方环：排斥',29,RED)
svg('tube-slices',slices)
svg('energy','<rect x="80" y="100" width="720" height="110" rx="16" fill="#e3ecfa"/>'+label(440,168,'重力势能减少',40,BLUE,'middle')+arrow(330,230,260,330)+arrow(580,230,650,330)+'<rect x="70" y="350" width="310" height="125" rx="16" fill="#e9f5ee"/><rect x="500" y="350" width="310" height="125" rx="16" fill="#fbe9e6"/>'+label(225,425,'动能增加',38,GREEN,'middle')+label(655,425,'焦耳热',38,RED,'middle')+label(440,565,'总能量守恒',32,INK,'middle'))
wire='<rect x="35" y="40" width="1700" height="320" rx="20" fill="#e8f0fb"/>'
for x in [240,780]:
    for i in range(6):wire+=f'<ellipse cx="{x+i*12}" cy="195" rx="40" ry="115" fill="none" stroke="#557dac" stroke-width="7"/>'
for y in [145,195,245]:wire+=arrow(365,y,655,y,BLUE)
wire+=label(240,355,'发射线圈',34,BLUE,'middle')+label(780,355,'接收线圈',34,BLUE,'middle')+label(510,90,'变化磁场耦合',30,BLUE,'middle')+arrow(920,195,1040,195)+'<rect x="1070" y="115" width="350" height="155" rx="14" fill="white" stroke="#839abd" stroke-width="3"/>'+label(1245,175,'整流、稳压',31,INK,'middle')+label(1245,230,'充电管理',31,INK,'middle')+arrow(1440,195,1530,195)+'<rect x="1560" y="135" width="95" height="130" rx="10" fill="#91c8aa"/>'+label(1605,325,'电池',30,GREEN,'middle')+label(240,410,'电源供能',30,INK,'middle')+label(790,410,'产生感应电动势',30,INK,'middle')
svg('wireless',wire,1800,470)
(COURSE/'source/source-provenance.json').write_text(json.dumps({'pptx':'/Users/xm/Documents/青教赛筑基/青教赛提交材料/04_八套教学节段PPT/02_学时02/PPT/大学物理+第2学时节段.pptx','pdf_pages':24,'html_original':str(ORIGINAL_HTML),'media_mapping':{'media1.mp4':'P2,P17 → train.mp4','media2.mp4':'P7 → switch.mp4','media3.mp4':'P8 → move-coil.mp4','media4.mp4':'P9,P10 → change-current.mp4','media5.mp4':'P11 → moving-rod.mp4'},'svg':'Course-native vector reauthoring, not flattened slide screenshots'},ensure_ascii=False,indent=2))
print('sp2 assets prepared')
