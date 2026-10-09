# -*- coding: utf-8 -*-
"""Render the reviewed lesson-content.json; teaching-script remains fully auditable."""
import json,re,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[1]))
from web_author import text,tex,box,img,html,R
INK='#172B45';MUTED='#52647A';BLUE='#244B88';SANS='PingFang SC, Microsoft YaHei, sans-serif'
FOCUS=['从牛顿方程中寻找独立运动变量','用约束选择局部独立的坐标','固定时间，沿约束允许的方向比较构型','把主动力和惯性项分别化为广义量','约束 → 坐标 → 动能与势能 → 方程 → 检验','独立建模；把阻尼作为非保守广义力保留','回顾方法，并检查方程的适用条件']
BOARD_LABELS={16:['已知：速度链式法则','定义系统动能','① 固定 q、t，对广义速度求偏导','② 对动能使用链式法则'],17:['保留速度表达','从左侧沿真实运动求时间导数','从右侧固定广义速度求坐标偏导','光滑性使混合偏导相等'],18:['前两页得到的两个恒等式','乘积求导：速度和投影方向都会变化','第二项识别为动能的坐标偏导',''],19:['将第二项移到等号右侧','用单摆核对长度、量纲和符号',''],25:['两个物块平动 + 滑轮转动','合并：转动惯量成为这个坐标下的等效质量','重力势能的斜率给出驱动方向']}

def tx(s,x,y,w,h,c,size=38,color=INK):
 return text(s,x,y,w,[[R(line,size,color,font=SANS)] for line in c.split('\n')],h=h,valign='top')

def script(doc):
 out=['# 逐页完整讲稿\n\n','新版源课件为主要依据；`lesson-content.json` 是文字、板书、同步锚点及活动的统一来源。以下隐藏 `[[n]]` 技术锚点。配音读中文符号及含义，不读LaTeX。所有关键解释均已写入，不另留未说明的教师补充时间。\n']
 for p in doc['pages']:
  out += [f"\n## 第{p['id']}页：{p['heading']}\n\n",f"原PPT：{','.join(map(str,p['source_pages']))}页；教学段：{p['segment']+1}。\n\n板书：\n"]
  for typ,c in p['boards']:out.append('\n$$\n'+c+'\n$$\n' if typ=='e' else '\n'+c+'\n')
  out+=['\n完整讲稿：\n\n',re.sub(r'\[\[\d+\]\]','',p['narration'])+'\n']
  if p.get('activity'):
   a=p['activity'];out+=['\n暂停活动：\n\n',f"- 教师问题：{a['q']}\n",f"- 操作/作答：{a.get('task','在纸上写q、T、V、Qnc、方程与能量检查后再选择。')}\n",f"- 观察与检查：{a.get('observe','量纲、b=0极限和机械能变化率。')}\n",f"- 暂停预算：{a['plannedSeconds']}秒，含预测/操作/阅读反馈；恢复后的讲评计入配音。\n",f"- 理论反馈：{a['explain']}\n\n"]
   for o,f in zip(a['options'],a['feedbackPerOption']):out.append(f'- {o}：{f}\n')
 (HERE/'teaching-script.md').write_text(''.join(out),encoding='utf-8')

def main():
 doc=json.loads((HERE/'lesson-content.json').read_text());script(doc)
 output={k:v for k,v in doc.items() if k!='pages'};output['pages']=[]
 steps={16:[0,1,2,3],17:[0,1,2,3],18:[0,1,2,3],1:[0,1,2],5:[1,2,1,3],13:[0,0,1],14:[1,1,2],15:[1,1,2],20:[1,2,3],21:[1,2,2],24:[1,2,3,3],26:[1,2,3],29:[0,1,1],30:[0,2,2],32:[1,1,2],33:[1,1,2]}
 for p in doc['pages']:
  n=p['id'];dia={3:'coordinate',6:'coordinate',8:'virtual-diagram',28:'atwood-forces'}.get(n,p.get('diagram'));activity=p.get('activity');hasfig=bool(dia);x=115;w=840 if hasfig else 1660
  segment=p['segment'];section=doc['sections'][segment]['title']
  elements=[tx(0,105,25,1300,40,f'{segment+1:02d} / {section}',23,BLUE),tx(0,105,69,1540,72,p['heading'],48),box(0,105,155,1710,2,'#D8E0EA','#D8E0EA',lw=0,decorative=True),tx(0,110,976,1500,45,'预测与操作时讲解暂停；完成理论核对后继续' if activity else FOCUS[segment],25,MUTED)]
  boards=p['boards'];count=len(boards);ys=[230,430,675] if count==3 else [210,385,560,750]
  if activity and dia:
   w=495;ys=[240,480,725]
  if n==24:ys=[205,465,650,915]
  if n==18:ys=[205,425,735,910]
  for i,(typ,c) in enumerate(boards):
   step=steps.get(n,[min(k+1,3) for k in range(count)])[i]
   label=BOARD_LABELS.get(n,['']*count)[i]
   if label:elements.append(tx(step,x,ys[i]-34,w,30,label,23,MUTED))
   if typ=='e':
    # Long derivations use multiline boards rather than small text.
    c={
     (24,0):r'\begin{aligned}y_1&=y_{10}+x,\quad y_2=y_{20}-x\\ \phi&=\phi_0+\frac{x}{R}\end{aligned}',
     (13,2):r'\begin{aligned}\sum_{j=1}^{n}\Big[&\sum_{i=1}^{N}\mathbf F_i\cdot\frac{\partial\mathbf r_i}{\partial q_j}\\[-1pt]&-\sum_{i=1}^{N}m_i\ddot{\mathbf r}_i\cdot\frac{\partial\mathbf r_i}{\partial q_j}\Big]\delta q_j=0\end{aligned}',
     (18,1):r'\frac d{dt}\frac{\partial T}{\partial\dot q_j}={\color{#244B88}\underbrace{\sum_i m_i\ddot{\mathbf r}_i\cdot\frac{\partial\mathbf r_i}{\partial q_j}}_{\text{惯性投影}}}+{\color{#B15D16}\underbrace{\sum_i m_i\mathbf v_i\cdot\frac d{dt}\frac{\partial\mathbf r_i}{\partial q_j}}_{\text{投影方向的变化}}}',
     (18,2):r'{\color{#B15D16}\sum_i m_i\mathbf v_i\cdot\frac{\partial\mathbf v_i}{\partial q_j}=\frac{\partial T}{\partial q_j}}',
     (26,1):r'\begin{aligned}\frac d{dt}\frac{\partial\mathcal L}{\partial\dot x}&=\left(m_1+m_2+\frac{I_p}{R^2}\right)\ddot x\\ \frac{\partial\mathcal L}{\partial x}&=(m_2-m_1)g\end{aligned}',
     (26,2):r'\boxed{a=\ddot x=\frac{(m_2-m_1)g}{m_1+m_2+I_p/R^2}}\quad\xrightarrow{I_p=MR^2/2}\quad a=\frac{(m_2-m_1)g}{m_1+m_2+M/2}',
     (19,0):r'\boxed{{\color{#244B88}\sum_i m_i\ddot{\mathbf r}_i\cdot\frac{\partial\mathbf r_i}{\partial q_j}}=\frac d{dt}\frac{\partial T}{\partial\dot q_j}-{\color{#B15D16}\frac{\partial T}{\partial q_j}}}',
     (10,0):r'\begin{aligned}\delta x&=l\cos\theta\,\delta\theta\\dx&=\delta x+u\,dt\end{aligned}',
     (29,0):r'a=\frac{(m_2-m_1)g}{m_1+m_2+M/2}',
     (28,0):r'\begin{aligned}T_1&=m_1(g+a)\\T_2&=m_2(g-a)\end{aligned}',
    }.get((n,i),c)
    size=44 if len(c)<110 else 39
    if hasfig:size=36 if len(c)>60 else 43
    if activity and dia:size=38
    height=175 if '\\begin{aligned}' in c else 155
    if n==18 and i==1:height=260
    if n==18 and i==2:height=130
    if n==24 and i in (0,2):height=230
    elements.append(tex(step,x,ys[i],w,c,size=size,h=height,color=INK))
   else:
    elements.append(tx(step,x,ys[i],w,70 if (n==24 and i==3 or n==18 and i==3) else 155,c,32 if (n==24 and i==3 or n==18 and i==3) else 35 if hasfig else 41))
  if dia in ('virtual','atwood'):
   elements.append(html(0,645,208,1170,713,f'sim-mechanics.html?mode={dia}&embed=1',timelineSync=True,label='虚位移几何比较' if dia=='virtual' else '有质量滑轮参数实验'))
  elif hasfig:elements.append(img(0,1015,215,770,685,{'atwood-diagram':'atwood-diagram.svg','atwood-forces':'atwood-forces.svg','coordinate':'coordinate-diagram.svg','virtual-diagram':'virtual-diagram.svg'}.get(dia,'pendulum-diagram.svg')))
  page={k:p[k] for k in ['id','heading','source_pages','narration']};page['elements']=elements
  if activity:
   a=activity.copy();a.update(after_sentence='现在暂停讲解，完成建模和作答后继续。' if n==30 else '现在暂停讲解，完成预测和操作后继续。',pause_offset=.1,pause_margin=.65)
   page['interactions']=[a];page['sentence_gap_overrides']=[dict(after_sentence=a['after_sentence'],gap_seconds=.9)]
  output['pages'].append(page)
 (HERE/'slides.json').write_text(json.dumps(output,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
 print('rendered',len(output['pages']),'pages; complete script updated')
if __name__=='__main__':main()
