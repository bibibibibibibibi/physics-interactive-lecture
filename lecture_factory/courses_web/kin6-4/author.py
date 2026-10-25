# -*- coding: utf-8 -*-
"""6-4 电容 电容器（第六章）网页版幻灯片创作脚本。

源 PPT：第06章/6-4 电容 电容器.ppt（17 页）
解析产物：work/p64/png/
生成: python courses_web/kin6-4/author.py  →  slides.json
构建: python build_web.py courses_web/kin6-4
"""

import json, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from web_author import *

pages = []

# ---------------- 第 1 页：封面 ----------------
pages.append({
 "id": 1,
 "narration": "[[1]]6-4，电容与电容器。[[2]]电容描述一个导体或一组导体「储存电荷的本领」。[[3]]它只由几何形状和介质决定，与带多少电、加多少压无关。[[4]]这一节把三种常见电容器的公式推一遍，再讲串联并联——后者在做题时用得最多。",
 "elements": [
  text(0, 560, 292, 800, [R("第 六 章", 56)], h=100, align="center"),
  text(1, 320, 420, 1280, [R("6-4　电容　电容器", 62, RED, True)], h=150, align="center"),
  text(2, 220, 630, 1480, [R("储存电荷的本领，只由几何与介质决定", 38, BLUE, True)], h=110,
       align="center"),
  text(3, 220, 790, 1480, [R("C = Q / U", 42, "#666")], h=90, align="center"),
 ]})

# ---------------- 第 2 页：一 孤立导体的电容 ----------------
pages.append({
 "id": 2,
 "narration": "[[1]]一，孤立导体的电容。[[2]]给一个孤立导体带电 Q，它的电势会升高到 V。[[3]]实验和理论都表明：Q 与 V 成正比，比值是一个常数。[[4]]这个比值定义为电容：C 等于 Q 除以 V。[[5]]它只与导体的形状、大小有关，与 Q、V 无关。[[6]]单位是法拉，一法拉等于一库仑每伏特。法拉太大了，实际常用微法、皮法。",
 "elements": [
  text(0, 170, 137, 1200, [R("一　孤立导体的电容", 48, RED, True)]),
  text(1, 170, 244, 1580, [R("导体带 $Q$，电势为 $V$；实验表明 $Q\\propto V$．", 32)], h=52, align="center"),
  tex(2,170,322,1580,r"C=\dfrac{Q}{V}",size=44,h=150,color=RED, align="center"),
  text(3, 170, 494, 1580, [R("只与形状、大小有关，与 $Q$、$V$ 无关．", 32)], h=52, align="center"),
  text(4, 170, 578, 1580, [R("单位：法拉 $\\mathrm{F}=\\mathrm{C/V}$．", 31)], h=50, align="center"),
  text(5, 170, 658, 1580, [R("法拉太大：常用 $\\mu\\mathrm F$、$\\mathrm{pF}$（$1\\ \\mu\\mathrm F=10^{-6}\\ \\mathrm F$）．", 30, "#666")],
       h=50, align="center"),
  box(6, 170, 748, 1580, 160, GREEN_FILL, GREEN_LINE,
      [[R("关键词：比值", 31, BLUE, True)],
       [R("电容是「每伏特能装多少电荷」，不是「装了多少电荷」", 28)]], align="center"),
 ]})

# ---------------- 第 3 页：二 电容器 ----------------
pages.append({
 "id": 3,
 "narration": "[[1]]二，电容器。[[2]]孤立导体的电容太小，而且容易受周围影响。[[3]]把两个导体靠近，一个带正电、一个带负电，就构成电容器。[[4]]这时绝大部分电场集中在两导体之间，外界干扰就小了。[[5]]定义电容为 C 等于 Q 除以 U，Q 是一个极板电荷量的绝对值，U 是两板间的电势差。[[6]]注意 U 是两板之间的差，不是对无穷远的电势——所以电容器可以做得又小又大容量。",
 "elements": [
  text(0, 170, 137, 1580, [R("二　电容器", 48, RED, True)]),
  text(1, 170, 244, 1580, [R("孤立导体电容太小，且易受周围影响．", 32)], h=52, align="center"),
  text(2, 170, 326, 1580, [R("两个靠近的导体、带等量异号电荷 ⇒", 32), R("场集中在板间", 32, RED, True), R("．", 32)],
       h=54, align="center"),
  tex(3,170,408,1580,r"C=\dfrac{Q}{U}",size=44,h=150,color=RED, align="center"),
  text(4, 170, 580, 1580, [R("$Q$：一个极板电荷量的绝对值；$U$：两板电势差．", 31)], h=52, align="center"),
  text(5, 170, 664, 1580, [R("$U$ 是板间之差，不是对无穷远的电势．", 31, "#666")], h=50, align="center"),
  text(6, 170, 748, 1580, [R("所以电容器可以做得体积很小、容量很大．", 31, "#666")], h=50, align="center"),
 ]})

# ---------------- 第 4 页：平行板 ----------------
pages.append({
 "id": 4,
 "narration": "[[1]]三，平行板电容器。设板面积 S、间距 d，板间充满相对介电常数 eps_r 的介质，极板上的自由电荷面密度为 sigma 0。[[2]]由高斯定理，板间的场强 E 等于 sigma 0 除以 eps 0 eps r。[[3]]两板电势差 U 等于 E 乘 d。[[4]]代入电容的定义式 C 等于 Q 比 U，注意 Q 等于 sigma 0 乘 S。[[5]]约掉 sigma 0 和 d，得到 C 等于 eps 0 eps r S 除以 d。[[6]]结论很清楚：面积大、间距小、介电常数大，电容就大。所以实际的电容器都做成薄膜卷绕结构。",
 "elements": [
  text(0, 170, 137, 1000, [R("三　平行板电容器", 48, RED, True)]),
  text(1, 170, 248, 770, [R("面积 $S$、间距 $d$，介质 $\\varepsilon_r$，", 32)], h=50),
  text(1, 170, 302, 770, [R("板上面密度 $\\sigma_0$．", 32)], h=50),
  tex(2, 170, 382, 770, r"E=\dfrac{\sigma_0}{\varepsilon_0\varepsilon_r}", size=40, h=140,
      align="center"),
  tex(3, 170, 540, 770, r"U=Ed=\dfrac{\sigma_0 d}{\varepsilon_0\varepsilon_r}",
      size=32, h=130, align="center"),
  text(4, 170, 690, 770, [R("$C=\\dfrac{Q}{U}$，而 $Q=\\sigma_0 S$：", 31)], h=50),
  tex(5, 170, 754, 770, r"C=\dfrac{\varepsilon_0\varepsilon_r S}{d}", size=36, h=140,
      color=RED, align="center"),
  text(6, 170, 908, 770, [R("$S$ 大、$d$ 小、$\\varepsilon_r$ 大 ⇒ $C$ 大", 30)], h=48),
  diagram(1, 1010, 250, 760, 714, "cap_parallel"),
 ]})

# ---------------- 第 5 页：圆柱形 ----------------
pages.append({
 "id": 5,
 "narration": "[[1]]圆柱形电容器，就是同轴电缆。内半径 R1、外半径 R2，长度 l 远大于 R2，中间充满介质。[[2]]用高斯定理求板间场强：E 等于 lambda 除以 2 pi eps 0 eps r 再乘 r。[[3]]两导体间的电势差，是 E 从 R1 积到 R2。[[4]]积分得 U 等于 lambda 除以 2 pi eps 0 eps r，再乘 ln(R2/R1)。[[5]]代入 C 等于 Q 比 U，把 lambda l 当成 Q，得到 C 等于 2 pi eps 0 eps r l 除以 ln(R2/R1)。[[6]]同轴电缆就是这种结构，电容与长度成正比，单位长度电容是电缆的重要参数。",
 "elements": [
  text(0, 170, 137, 1100, [R("圆柱形电容器（同轴）", 46, RED, True)]),
  text(1, 170, 246, 770, [R("内半径 $R_1$、外半径 $R_2$、长 $l$", 31)], h=50),
  text(1, 170, 300, 770, [R("（$l\\gg R_2$），介质 $\\varepsilon_r$．", 31)], h=50),
  tex(2, 170, 376, 770, r"E=\dfrac{\lambda}{2\pi\varepsilon_0\varepsilon_r r}",
      size=32, h=130, align="center"),
  tex(3, 170, 528, 770, r"U=\int_{R_1}^{R_2}E\,\mathrm dr=\dfrac{\lambda}{2\pi\varepsilon_0\varepsilon_r}\ln\dfrac{R_2}{R_1}",
      size=26, h=140, align="center"),
  tex(4, 170, 690, 770, r"C=\dfrac{2\pi\varepsilon_0\varepsilon_r l}{\ln(R_2/R_1)}",
      size=30, h=140, color=RED, align="center"),
  text(5, 170, 856, 770, [R("同轴电缆就是这种结构：$C$ 与长度成正比．", 28)], h=46),
  text(6, 170, 916, 770, [R("单位长度电容 $C/l$ 是电缆的重要参数．", 27, "#666")], h=44),
  diagram(1, 1010, 250, 760, 669, "cap_cyl"),
 ]})

# ---------------- 第 6 页：球形 ----------------
pages.append({
 "id": 6,
 "narration": "[[1]]球形电容器，两个同心球面，半径 R1 和 R2，中间是介质。[[2]]板间场强仍按点电荷处理：E 等于 Q 除以 4 pi eps 0 eps r r 方。[[3]]电势差由 E 从 R1 积到 R2 得到。[[4]]代入定义式，得到 C 等于 4 pi eps 0 eps r R1 R2 除以 R2 减 R1。[[5]]两个极限可以检验：外半径趋于无穷，退化为孤立球，C 等于 4 pi eps 0 eps r R1。[[6]]而 R2 减 R1 趋于零、两球面贴近时，退化为平行板。这两个极限都和我们前面的结果一致。",
 "elements": [
  text(0, 170, 137, 1000, [R("球形电容器", 46, RED, True)]),
  text(1, 170, 246, 770, [R("同心球面 $R_1$、$R_2$，介质 $\\varepsilon_r$．", 31)], h=50),
  tex(2, 170, 322, 770, r"E=\dfrac{Q}{4\pi\varepsilon_0\varepsilon_r r^{2}}",
      size=32, h=130, align="center"),
  tex(3, 170, 474, 770, r"U=\dfrac{Q}{4\pi\varepsilon_0\varepsilon_r}\\left(\dfrac{1}{R_1}-\dfrac{1}{R_2}\right)",
      size=25, h=140, align="center"),
  tex(4, 170, 636, 770, r"C=\dfrac{4\pi\varepsilon_0\varepsilon_r R_1R_2}{R_2-R_1}",
      size=28, h=140, color=RED, align="center"),
  text(5, 170, 802, 770, [R("$R_2\\to\\infty$ ⇒ 孤立球", 28)], h=46),
  text(5, 170, 854, 770, [R("$C=4\\pi\\varepsilon_0\\varepsilon_r R_1$", 28, RED, True)], h=46),
  text(6, 170, 918, 770, [R("$R_2-R_1\\to0$ ⇒ 退化为平行板", 27, "#666")], h=44),
  diagram(1, 1010, 250, 760, 669, "cap_sph"),
 ]})

# ---------------- 第 7 页：例 平行板（半填介质） ----------------
pages.append({
 "id": 7,
 "narration": "[[1]]例，平行板电容器一半厚度填介质。[[2]]板面积 S、间距 d，介质的相对介电常数 epsilon r，厚度 d 比二。[[3]]这种「分层」结构可以看成两个电容器串联：一层是厚度 d 比二的真空，另一层是厚度 d 比二的介质。[[4]]两个电容分别是二 epsilon 零 S 除以 d，和二 epsilon 零 epsilon r S 除以 d。[[5]]串联公式算出总电容是二 epsilon 零 epsilon r S 除以（一加 epsilon r）d。[[6]]检验：epsilon r 等于一时，得 epsilon 零 S 除以 d，正确。",
 "elements": [
  text(0, 170, 137, 1000, [R("例　一半厚度填介质", 44, RED, True)]),
  text(1, 170, 246, 770, [R("板面积 $S$、间距 $d$；介质 $\\varepsilon_r$，", 30)], h=48),
  text(1, 170, 298, 770, [R("厚度 $d/2$．", 30)], h=48),
  text(2, 170, 380, 770, [R("分层结构 ⇒ 看成两个电容器", 30), R("串联", 31, RED, True), R("．", 30)], h=52),
  tex(3, 170, 462, 770, r"C_1=\dfrac{2\varepsilon_0 S}{d},\quad C_2=\dfrac{2\varepsilon_0\varepsilon_r S}{d}",
      size=24, h=130, align="center"),
  tex(4, 170, 606, 770, r"C=\dfrac{C_1C_2}{C_1+C_2}", size=30, h=120, align="center"),
  tex(4, 170, 736, 770, r"C=\dfrac{2\varepsilon_0\varepsilon_r S}{(1+\varepsilon_r)d}",
      size=28, h=130, color=RED, align="center"),
  text(5, 170, 890, 770, [R("检验：$\\varepsilon_r=1$ ⇒ $C=\\varepsilon_0 S/d$", 27, "#666")], h=44),
  text(6, 170, 934, 770, [R("一半面积填介质则并联，结果不同．", 26, "#666")], h=42),
  diagram(1, 1010, 250, 760, 623, "cap_half_dielectric"),
 ]})

# ---------------- 第 8 页：串联 ----------------
pages.append({
 "id": 8,
 "narration": "[[1]]四，串联。两个电容器首尾相接，中间那两块极板由导线连通，原来不带电，所以感应之后它们带等量异号电荷。[[2]]结果是：每个电容器带的电荷量 Q 都相同。[[3]]总电压等于各段电压之和。[[4]]把 U 等于 Q 比 C 代进去，得到 1 比 C 等于 1 比 C1 加 1 比 C2 一直加下去。[[5]]所以串联以后电容变小，比任何一个都小。[[6]]可以类比电阻并联：串联相当于把间距拉大，电容自然变小。好处是耐压提高，电压被分摊到各个电容器上。",
 "elements": [
  text(0, 170, 137, 900, [R("四　串联", 48, RED, True)]),
  text(1, 170, 250, 770, [R("串联：中间极板感应 ⇒", 31)], h=50),
  text(1, 170, 304, 770, [R("每个电容器带相同的 $Q$．", 31)], h=50),
  text(2, 170, 386, 770, [R("总电压：$U=U_1+U_2+\\cdots$", 31)], h=50),
  tex(3, 170, 462, 770, r"\dfrac{1}{C}=\dfrac{1}{C_1}+\dfrac{1}{C_2}+\cdots",
      size=34, h=140, align="center"),
  text(4, 170, 630, 770, [R("所以 $C$ 比任何一个都", 31), R("小", 34, RED, True), R("．", 31)], h=52),
  text(5, 170, 716, 770, [R("与电阻并联类似：", 29, "#666")], h=46),
  text(5, 170, 768, 770, [R("串联「拉大距离」⇒ 电容变小．", 29, "#666")], h=46),
  text(6, 170, 852, 770, [R("好处：", 30, BLUE, True), R("耐压提高（电压被分摊）．", 30)], h=48),
  diagram(1, 1010, 300, 760, 368, "cap_series"),
 ]})

# ---------------- 第 9 页：并联 ----------------
pages.append({
 "id": 9,
 "narration": "[[1]]再看并联。两个电容器两端接在同一对节点上，所以各电容器两端的电压相同，都等于 U。[[2]]总电荷等于各电容器电荷之和。[[3]]把 Q 等于 CU 代进去，得到 C 等于 C1 加 C2 一直加下去。[[4]]所以并联以后电容变大，比任何一个都大。[[5]]可以类比电阻串联：并联相当于把极板面积加大，电容变大。[[6]]用法上很简单：要大容量就并联，要耐高压就串联。",
 "elements": [
  text(0, 170, 137, 900, [R("四　并联", 48, RED, True)]),
  text(1, 170, 250, 770, [R("并联：各电容器两端电压相同，", 31)], h=50),
  text(1, 170, 304, 770, [R("都等于 $U$．", 31)], h=50),
  text(2, 170, 386, 770, [R("总电荷：$Q=Q_1+Q_2+\\cdots$", 31)], h=50),
  tex(3, 170, 462, 770, r"C=C_1+C_2+\cdots", size=36, h=140, align="center"),
  text(4, 170, 630, 770, [R("所以 $C$ 比任何一个都", 31), R("大", 34, RED, True), R("．", 31)], h=52),
  text(5, 170, 716, 770, [R("与电阻串联类似：", 29, "#666")], h=46),
  text(5, 170, 768, 770, [R("并联「增大面积」⇒ 电容变大．", 29, "#666")], h=46),
  text(6, 170, 852, 770, [R("用法：", 30, BLUE, True), R("要大容量就并联，", 30)], h=48),
  text(6, 170, 904, 770, [R("要耐高压就串联．", 30)], h=48),
  diagram(1, 1010, 300, 760, 441, "cap_parallel2"),
 ]})

# ---------------- 第 10 页：小结 ----------------
pages.append({
 "id": 10,
 "narration": "[[1]]小结。[[2]]电容的定义是 C 等于 Q 比 U，U 是板间电势差。[[3]]三种典型电容器：平行板 C 等于 eps 0 eps r S 比 d；圆柱形与 l 成正比、与 ln(R2/R1) 成反比；球形由两个半径决定。[[4]]两个极限可以作为检验。[[5]]串联电容变小、耐压提高；并联电容变大。[[6]]下一节讲静电场的能量：电容器储能到底是存在电荷上，还是存在场里。",
 "elements": [
  text(0, 170, 137, 1400, [R("本节小结", 50, RED, True)]),
  text(1, 170, 250, 770, [R("① 定义", 32, BLUE, True)], h=48),
  text(1, 170, 306, 770, [R("$C=Q/U$（$U$ 为板间电势差）", 30)], h=48),
  text(2, 170, 386, 770, [R("② 平行板", 32, BLUE, True)], h=48),
  text(2, 170, 442, 770, [R("$C=\\varepsilon_0\\varepsilon_r S/d$", 30)], h=48),
  text(3, 170, 522, 770, [R("③ 圆柱", 32, BLUE, True)], h=48),
  text(3, 170, 578, 770, [R("$C=2\\pi\\varepsilon_0\\varepsilon_r l/\\ln(R_2/R_1)$", 25)], h=46),
  text(4, 170, 654, 770, [R("④ 球形", 32, BLUE, True)], h=48),
  text(4, 170, 710, 770, [R("$C=4\\pi\\varepsilon_0\\varepsilon_r R_1R_2/(R_2-R_1)$", 23)], h=46),
  box(5, 1010, 244, 740, 400, BLUE_FILL, BLUE_LINE,
      [[R("⑤ 串并联", 32, BLUE, True)],
       [R("串联：$1/C=\\sum 1/C_i$", 28)],
       [R("　变小、耐压提高", 26, "#666")],
       [R("并联：$C=\\sum C_i$", 28)],
       [R("　变大", 26, "#666")]], align="center"),
  box(6, 170, 790, 1580, 130, GREEN_FILL, GREEN_LINE,
      [[R("下一节：静电场的能量", 34, RED, True)],
       [R("储能究竟在电荷上，还是在场里？", 27)]], align="center"),
 ]})

HEADINGS = ["封面", "一　孤立导体的电容", "二　电容器", "三　平行板电容器",
            "圆柱形电容器", "球形电容器", "例　一半厚度填介质", "四　串联", "四　并联",
            "本节小结"]

for pg, h in zip(pages, HEADINGS):
    pg["heading"] = h

doc = {
  "title": "6-4 电容 电容器",
  "nav": "6-4　电容　电容器",
  "footer": "第六章　静电场中的导体与电介质",
  "logoScale": 0.67,
  "engine": "edge",
  "voice": "zh-CN-YunxiNeural",
  "pages": pages,
}
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "slides.json")
json.dump(doc, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"pages: {len(pages)} -> {out}")
