# -*- coding: utf-8 -*-
"""6-5 静电场的能量 能量密度（第六章）网页版幻灯片创作脚本。

源 PPT：第06章/6-5 静电场的能量 能量密度.ppt（10 页）
解析产物：work/p65/png/
生成: python courses_web/kin6-5/author.py  →  slides.json
构建: python build_web.py courses_web/kin6-5
"""

import json, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from web_author import *

pages = []

# ---------------- 第 1 页：封面 ----------------
pages.append({
 "id": 1,
 "narration": "[[1]]6-5，静电场的能量与能量密度。[[2]]给电容器充电要消耗能量，这些能量存在哪里？[[3]]答案是：存在电场里。[[4]]这个观念很重要——它把「能量」从电荷身上转移到了场上。[[5]]后面讲电磁波、讲场的能量，都是从这里出发的。",
 "elements": [
  text(0, 560, 292, 800, [R("第 六 章", 56)], h=100, align="center"),
  text(1, 280, 420, 1360, [R("6-5　静电场的能量", 62, RED, True)], h=150, align="center"),
  text(2, 220, 630, 1480, [R("能量不在电荷上，在场上", 40, BLUE, True)], h=110, align="center"),
  text(3, 220, 790, 1480, [R("w = ½ ε₀εr E²", 40, "#666")], h=90, align="center"),
 ]})

# ---------------- 第 2 页：一 充电过程做功 ----------------
pages.append({
 "id": 2,
 "narration": "[[1]]一，先算充电要多少功。[[2]]设电容为 C，某时刻极板带电 q、电压 u 等于 q 除以 C。[[3]]再搬一小块电荷 dq 过去，要克服电压做功，dW 等于 u dq。[[4]]从零充到 Q，把 dW 积起来：W 等于 q 除以 C 从零积到 Q，得 Q 平方除以二 C。[[5]]这个功全部储存在电容器里，成为电场能。[[6]]所以电容器的储能，就是充电过程中外力做的功。",
 "elements": [
  text(0, 170, 137, 1580, [R("一　充电要多少功", 48, RED, True)]),
  text(1, 170, 244, 1580, [R("某时刻带电 $q$、电压 $u=q/C$；再搬 $\\mathrm dq$ 过去：", 31)], h=52, align="center"),
  tex(2, 170, 320, 1580, r"\mathrm dW=u\,\mathrm dq=\dfrac{q}{C}\mathrm dq", size=34, h=130, align="center"),
  tex(3, 170, 470, 1580, r"W=\int_0^Q\dfrac{q}{C}\mathrm dq=\dfrac{Q^{2}}{2C}", size=36, h=140,
      color=RED, align="center"),
  text(4, 170, 630, 1580, [R("这个功全部储存在电容器里 ⇒ 电场能．", 31)], h=52, align="center"),
  text(5, 170, 712, 1580, [R("所以电容器储能 = 充电过程中外力做的功．", 31, "#666")], h=50, align="center"),
 ]})

# ---------------- 第 3 页：三个等价式 ----------------
pages.append({
 "id": 3,
 "narration": "[[1]]把 Q 等于 CU 代进去，可以得到三种写法。[[2]]第一种：W 等于 Q 平方除以二 C。[[3]]第二种：W 等于二分之一 Q U。[[4]]第三种：W 等于二分之一 C U 平方。[[5]]三式等价，看已知量选一个用。[[6]]要注意：这三个式子只对线性电容器成立（C 为常数）。如果介质非线性，就得回到积分式。",
 "elements": [
  text(0, 170, 137, 1580, [R("三种等价写法", 48, RED, True)]),
  tex(1, 170, 250, 1580, r"W=\dfrac{Q^{2}}{2C}", size=40, h=130, color=RED, align="center"),
  tex(2, 170, 420, 1580, r"W=\dfrac{1}{2}QU", size=40, h=130, color=RED, align="center"),
  tex(3, 170, 590, 1580, r"W=\dfrac{1}{2}CU^{2}", size=40, h=130, color=RED, align="center"),
  text(4, 170, 760, 1580, [R("三式等价：由 $Q=CU$ 互相代入即得．", 31)], h=50, align="center"),
  text(5, 170, 840, 1580, [R("只对线性电容器成立（$C$ 为常数）．", 30, "#666")], h=48, align="center"),
 ]})

# ---------------- 第 4 页：二 能量储在哪里 ----------------
pages.append({
 "id": 4,
 "narration": "[[1]]二，能量到底储在哪里？[[2]]一种说法是储在电荷上，另一种是储在场里。[[3]]哪个对？做个小实验就清楚了。[[4]]把电容器两极板拉开，电荷没有变，但电场占据的空间变大了。[[5]]结果能量变大了（因为 C 变小，W 等于 Q 平方除以二 C）。[[6]]电荷没变而能量变了，说明能量不在电荷上，而在它们之间的场里。这个结论是法拉第和麦克斯韦的关键一步。",
 "elements": [
  text(0, 170, 137, 1400, [R("二　能量储在哪里", 48, RED, True)]),
  text(1, 170, 244, 1580, [R("两种说法：储在", 31), R("电荷", 32, BLUE, True),
                           R("上？还是储在", 31), R("场", 32, RED, True), R("里？", 31)], h=54),
  text(2, 170, 330, 1580, [R("实验：把极板拉开——电荷不变，场占据的空间变大．", 31)], h=52),
  text(3, 170, 414, 1580, [R("$C$ 变小 ⇒ $W=Q^{2}/2C$", 31), R("变大", 32, RED, True), R("．", 31)], h=52),
  text(4, 170, 498, 1580, [R("电荷没变而能量变了 ⇒", 31), R("能量在场里", 32, RED, True), R("．", 31)], h=54),
  text(5, 170, 582, 1580, [R("这是法拉第、麦克斯韦的关键一步．", 31, "#666")], h=50),
  box(6, 170, 668, 1580, 160, GREEN_FILL, GREEN_LINE,
      [[R("由此可以定义「能量密度」", 31, BLUE, True)],
       [R("单位体积的场能有多少", 29)]], align="center"),
 ]})

# ---------------- 第 5 页：能量密度 ----------------
pages.append({
 "id": 5,
 "narration": "[[1]]既然能量在场里，就可以问：单位体积有多少能量？[[2]]这个量叫能量密度 w。[[3]]对平行板：W 等于二分之一 C U 平方，C 等于 epsilon 零 epsilon r S 除以 d，U 等于 E d。[[4]]代进去，S d 正好是板间体积，于是 W 等于二分之一 epsilon 零 epsilon r E 平方乘体积。[[5]]所以 w 等于 W 除以体积，等于二分之一 epsilon 零 epsilon r E 平方。[[6]]也可以写成二分之一 E D。这个式子是普适的，不限于平行板——任何静电场都适用。",
 "elements": [
  text(0, 170, 137, 1580, [R("能量密度", 48, RED, True)]),
  text(1, 170, 244, 1580, [R("平行板：$W=\\dfrac{1}{2}CU^{2}$，$C=\\dfrac{\\varepsilon_0\\varepsilon_r S}{d}$，$U=Ed$．", 30)], h=52, align="center"),
  tex(2, 170, 320, 1580, r"W=\dfrac{1}{2}\varepsilon_0\varepsilon_r E^{2}\,(Sd)", size=32, h=130, align="center"),
  text(3, 170, 470, 1580, [R("$Sd$ 正是板间体积 ⇒", 31)], h=50, align="center"),
  tex(4, 170, 540, 1580, r"w=\dfrac{W}{V}=\dfrac{1}{2}\varepsilon_0\varepsilon_r E^{2}=\dfrac{1}{2}ED", size=34,
      h=140, color=RED, align="center"),
  text(5, 170, 710, 1580, [R("普适：任何静电场都适用，不限于平行板．", 31, "#666")], h=50, align="center"),
  text(6, 170, 790, 1580, [R("能量密度 ∝ $E^{2}$：场强加倍，储能变四倍．", 30, "#666")], h=48, align="center"),
 ]})

# ---------------- 第 6 页：例 球形电容器 ----------------
pages.append({
 "id": 6,
 "narration": "[[1]]例，用能量密度算球形电容器的储能。[[2]]两球之间的场强是 Q 除以四派 epsilon 零 epsilon r r 平方。[[3]]能量密度 w 等于二分之一 epsilon 零 epsilon r E 平方，即 Q 平方除以三十二派平方 epsilon 零 epsilon r r 的四次方。[[4]]把它对两球之间的体积积分：体积元是四派 r 平方 dr。[[5]]积出来 W 等于 Q 平方除以八派 epsilon 零 epsilon r，乘以括号 R1 分之一减 R2 分之一。[[6]]这个结果和用 W 等于 Q 平方除以二 C 算出来的一致，说明两种方法自洽。",
 "elements": [
  text(0, 170, 137, 1580, [R("例　球形电容器的储能", 44, RED, True)]),
  tex(1, 170, 240, 1580, r"E=\dfrac{Q}{4\pi\varepsilon_0\varepsilon_r r^{2}}", size=30, h=120, align="center"),
  tex(2, 170, 380, 1580, r"w=\dfrac{1}{2}\varepsilon_0\varepsilon_r E^{2}=\dfrac{Q^{2}}{32\pi^{2}\varepsilon_0\varepsilon_r r^{4}}",
      size=28, h=140, align="center"),
  tex(3, 170, 540, 1580, r"W=\int w\cdot4\pi r^{2}\mathrm dr", size=30, h=120, align="center"),
  tex(4, 170, 676, 1580, r"W=\dfrac{Q^{2}}{8\pi\varepsilon_0\varepsilon_r}\left(\dfrac{1}{R_1}-\dfrac{1}{R_2}\right)",
      size=28, h=140, color=RED, align="center"),
  text(5, 170, 840, 1580, [R("与 $W=Q^{2}/2C$ 的结果一致 ⇒ 两种方法自洽．", 30, "#666")], h=48, align="center"),
  text(6, 170, 908, 1580, [R("场方法的好处：不用先求电容，直接积分即可．", 30, "#666")], h=46, align="center"),
 ]})

# ---------------- 第 7 页：例 同轴电缆 ----------------
pages.append({
 "id": 7,
 "narration": "[[1]]再看同轴电缆。[[2]]单位长度的电容是二派 epsilon 零 epsilon r 除以 ln(R2 比 R1)。[[3]]加电压 U，单位长度的储能就是二分之一 C U 平方。[[4]]代入得 W 比 l 等于派 epsilon 零 epsilon r U 平方除以 ln(R2 比 R1)。[[5]]这个量在电缆设计里很关键：它决定了电缆的耐压和热损耗。[[6]]注意能量与电压平方成正比，所以高压电缆的绝缘要求特别高。",
 "elements": [
  text(0, 170, 137, 1580, [R("例　同轴电缆的储能", 44, RED, True)]),
  text(1, 170, 240, 1580, [R("单位长度电容 $C/l=\\dfrac{2\\pi\\varepsilon_0\\varepsilon_r}{\\ln(R_2/R_1)}$", 30)], h=52, align="center"),
  text(2, 170, 320, 1580, [R("加电压 $U$，单位长度储能：", 31)], h=50, align="center"),
  tex(3, 170, 392, 1580, r"\dfrac{W}{l}=\dfrac{1}{2}\dfrac{C}{l}U^{2}=\dfrac{\pi\varepsilon_0\varepsilon_r U^{2}}{\ln(R_2/R_1)}",
      size=30, h=140, color=RED, align="center"),
  text(4, 170, 570, 1580, [R("能量 $\\propto U^{2}$ ⇒ 高压电缆绝缘要求特别高．", 30)], h=50, align="center"),
  text(5, 170, 650, 1580, [R("这个量决定电缆的耐压与热损耗，是设计的关键参数．", 30, "#666")], h=48, align="center"),
  text(6, 170, 730, 1580, [R("也可以用 $w=\\frac12\\varepsilon E^{2}$ 对体积积分，结果相同．", 30, "#666")], h=48, align="center"),
 ]})

# ---------------- 第 8 页：小结 ----------------
pages.append({
 "id": 8,
 "narration": "[[1]]小结。[[2]]电容器储能 W 等于二分之一 Q U，等于二分之一 C U 平方，等于 Q 平方除以二 C。[[3]]这些能量不在电荷上，而在电场里。[[4]]能量密度 w 等于二分之一 epsilon 零 epsilon r E 平方，等于二分之一 E D，这是普适式。[[5]]求储能两条路：用 W 公式（要先知道 C），或用能量密度积分（直接积场）。[[6]]下一节讲电容器的充放电过程，那里会看到能量如何在电阻上耗散。",
 "elements": [
  text(0, 170, 137, 1400, [R("本节小结", 50, RED, True)]),
  text(1, 170, 236, 1580, [R("① 储能：$W=\\dfrac{1}{2}QU=\\dfrac{1}{2}CU^{2}=\\dfrac{Q^{2}}{2C}$", 31, RED, True)], h=54),
  text(2, 170, 316, 1580, [R("② 能量在", 31), R("场", 32, RED, True), R("里，不在电荷上（拉板实验）．", 31)], h=54),
  text(3, 170, 396, 1580, [R("③ 能量密度：$w=\\dfrac{1}{2}\\varepsilon_0\\varepsilon_r E^{2}=\\dfrac{1}{2}ED$（普适）．", 30)], h=54),
  text(4, 170, 476, 1580, [R("④ 两条路：$W$ 公式（需 $C$）；$\\int w\\,\\mathrm dV$（直接积场）．", 30)], h=50),
  box(5, 170, 566, 1580, 170, GREEN_FILL, GREEN_LINE,
      [[R("下一节：电容器的充放电", 34, RED, True)],
       [R("RC 电路的指数规律，以及能量去了哪里", 28)]], align="center"),
  text(6, 170, 782, 1580, [R("充电时电源做的功，一半储能、一半消耗在电阻上——这是下一节的反直觉结论．", 29, "#666")],
       h=48),
 ]})

HEADINGS = ["封面", "一　充电要多少功", "三种等价写法", "二　能量储在哪里", "能量密度",
            "例　球形电容器的储能", "例　同轴电缆的储能", "本节小结"]

for pg, h in zip(pages, HEADINGS):
    pg["heading"] = h

doc = {
  "title": "6-5 静电场的能量 能量密度",
  "nav": "6-5　静电场能量",
  "footer": "第六章　静电场中的导体与电介质",
  "logoScale": 0.67,
  "engine": "edge",
  "voice": "zh-CN-YunxiNeural",
  "pages": pages,
}
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "slides.json")
json.dump(doc, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"pages: {len(pages)} -> {out}")
