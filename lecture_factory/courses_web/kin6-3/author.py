# -*- coding: utf-8 -*-
"""6-3 电位移 有介质时的高斯定理（第六章）网页版幻灯片创作脚本。

源 PPT：第06章/6-3 电位移 有介质时的高斯定理.ppt（9 页）
解析产物：work/p63/png/
生成: python courses_web/kin6-3/author.py  →  slides.json
构建: python build_web.py courses_web/kin6-3
"""

import json, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from web_author import *

pages = []

# ---------------- 第 1 页：封面 ----------------
pages.append({
 "id": 1,
 "narration": "[[1]]6-3，电位移与有介质时的高斯定理。[[2]]上一节最后留下一个问题：介质里的高斯定理，右边除了自由电荷，还有束缚电荷。[[3]]束缚电荷不好测、也不好算，能不能把它从式子里赶出去？[[4]]能。办法是引入一个新的矢量，叫电位移 D。",
 "elements": [
  text(0, 560, 292, 800, [R("第 六 章", 56)], h=100, align="center"),
  text(1, 250, 420, 1420, [R("6-3　电位移　有介质的高斯定理", 56, RED, True)], h=150,
       align="center"),
  text(2, 220, 630, 1480, [R("把束缚电荷「藏」起来", 40, BLUE, True)], h=110, align="center"),
  text(3, 220, 790, 1480, [R("∮ D · dS = Σ q₀（只算自由电荷）", 36, "#666")], h=90,
       align="center"),
 ]})

# ---------------- 第 2 页：一 问题的提出 ----------------
pages.append({
 "id": 2,
 "narration": "[[1]]先把问题摆清楚。[[2]]真空中的高斯定理很干净：通量等于面内电荷除以 epsilon 零。[[3]]有介质时，高斯面内除了自由电荷，还有束缚电荷——极化以后表面出现的那一层。[[4]]于是式子变成：通量等于自由电荷加束缚电荷，再除以 epsilon 零。[[5]]麻烦在于，束缚电荷取决于介质的极化和形状，很难事先知道。[[6]]所以要进行改造，让式子右边只剩自由电荷。",
 "elements": [
  text(0, 170, 137, 1580, [R("一　问题在哪里", 46, RED, True)]),
  text(1, 170, 240, 1580, [R("真空中：$\\oint\\vec E\\cdot\\mathrm d\\vec S=\\dfrac{1}{\\varepsilon_0}\\sum q$", 31),
                           R("——很干净", 30, "#666")], h=54),
  text(2, 170, 322, 1580, [R("有介质时，面内多了", 31), R("束缚电荷", 32, RED, True), R("：", 31)], h=52),
  tex(3, 170, 396, 1300, r"\oint\vec E\cdot\mathrm d\vec S=\dfrac{1}{\varepsilon_0}\left(\sum q_0+\sum q'\right)",
      size=32, h=130, color=BLUE),
  text(4, 170, 556, 1580, [R("束缚电荷 $q'$ 取决于介质极化与形状，", 31), R("很难事先知道", 31, RED, True), R("．", 31)],
       h=52),
  text(5, 170, 640, 1580, [R("目标：改造高斯定理，让右边", 31), R("只剩自由电荷 $q_0$", 31, RED, True), R("．", 31)],
       h=52),
  box(6, 170, 730, 1580, 160, GREEN_FILL, GREEN_LINE,
      [[R("办法：引入一个新矢量", 31, BLUE, True)],
       [R("让「束缚电荷」在数学上被吸收掉", 29)]], align="center"),
 ]})

# ---------------- 第 3 页：二 电位移矢量 ----------------
pages.append({
 "id": 3,
 "narration": "[[1]]二，定义电位移矢量。[[2]]令 D 等于 epsilon 零 E 加 P。[[3]]P 是极化强度，epsilon 零 E 是真空部分的贡献。[[4]]这样定义的 D，单位是库仑每平方米——和 P 一样，也和面密度一样。[[5]]对线性各向同性介质，P 正比于 E，于是 D 可以写成 epsilon 零 epsilon r E，简写为 epsilon E。[[6]]epsilon 叫介质的绝对介电常数，等于 epsilon 零乘 epsilon r。这样 D 和 E 就同向且成正比了。",
 "elements": [
  text(0, 170, 137, 1580, [R("二　电位移矢量 $\\vec D$", 48, RED, True)]),
  tex(1, 170, 250, 1580, r"\vec D=\varepsilon_0\vec E+\vec P", size=42, h=150, color=RED, align="center"),
  text(2, 170, 420, 1580, [R("$\\varepsilon_0\\vec E$：真空部分的贡献；$\\vec P$：介质的极化贡献．", 30)], h=50, align="center"),
  text(3, 170, 500, 1580, [R("单位：$\\mathrm{C/m^{2}}$（与 $P$、面密度同）．", 31)], h=50, align="center"),
  tex(4, 170, 578, 1580, r"\vec D=\varepsilon_0\varepsilon_r\vec E=\varepsilon\vec E", size=36, h=140,
      color=BLUE, align="center"),
  text(5, 170, 730, 1580, [R("$\\varepsilon=\\varepsilon_0\\varepsilon_r$ 叫", 31), R("绝对介电常数", 32, RED, True),
                           R("．", 31)], h=54, align="center"),
  text(6, 170, 814, 1580, [R("线性各向同性介质中，$\\vec D$ 与 $\\vec E$ 同向且成正比．", 30, "#666")], h=48, align="center"),
 ]})

# ---------------- 第 4 页：有介质的高斯定理 ----------------
pages.append({
 "id": 4,
 "narration": "[[1]]有了 D，高斯定理就变干净了。[[2]]穿过任意闭合曲面的电位移通量，等于该曲面所包围的自由电荷的代数和。[[3]]注意右边只有自由电荷，束缚电荷完全不出现。[[4]]这就是它的价值：做题时只要数自由电荷，不用管介质极化成什么样。[[5]]但要注意：D 的通量与自由电荷的关系，只在有介质的高斯定理这个形式下成立；D 本身并不是「场强」，它不直接给出力。[[6]]真正对电荷施力的是 E。",
 "elements": [
  text(0, 170, 137, 1400, [R("三　有介质时的高斯定理", 46, RED, True)]),
  tex(1, 170, 240, 1300, r"\oint_S\vec D\cdot\mathrm d\vec S=\sum_{S\text{内}}q_0", size=42,
      h=150, color=RED),
  text(2, 170, 420, 1580, [R("右边", 31), R("只有自由电荷", 32, RED, True),
                           R("，束缚电荷完全不出现．", 31)], h=54),
  text(3, 170, 504, 1580, [R("价值：做题只数自由电荷，不用管极化细节．", 31)], h=50),
  text(4, 170, 588, 1580, [R("但 $\\vec D$ 不是「场强」：它对电荷不直接施力，", 30),
                           R("施力的是 $\\vec E$", 31, RED, True), R("．", 30)], h=52),
  text(5, 170, 672, 1580, [R("所以两条式子要配套用：先用 $D$ 求 $D$，再由 $D=\\varepsilon E$ 求 $E$．", 30, "#666")],
       h=48),
  box(6, 170, 760, 1580, 160, GREEN_FILL, GREEN_LINE,
      [[R("记忆法", 31, BLUE, True)],
       [R("D 是「自由电荷的账」，E 是「真正施力的场」", 29, RED, True)]], align="center"),
 ]})

# ---------------- 第 5 页：三者的关系 ----------------
pages.append({
 "id": 5,
 "narration": "[[1]]把 D、E、P 三者的关系整理一下。[[2]]定义式是 D 等于 epsilon 零 E 加 P，这是根本。[[3]]对线性介质，P 等于 chi e epsilon 零 E，代进去得 D 等于 epsilon 零（一加 chi e）E。[[4]]而一加 chi e 就是相对介电常数 epsilon r，所以 D 等于 epsilon 零 epsilon r E。[[5]]这三条要能随手写出。[[6]]还要注意：只有各向同性线性介质才有这么简单的正比关系；各向异性晶体里，D 与 E 不同向，要用张量描述。",
 "elements": [
  text(0, 170, 137, 1580, [R("$\\vec D$、$\\vec E$、$\\vec P$ 三者关系", 44, RED, True)]),
  text(1, 170, 240, 1580, [R("定义式（根本）：", 33, BLUE, True),
                           R("$\\vec D=\\varepsilon_0\\vec E+\\vec P$", 32, RED, True)], h=54, align="center"),
  text(2, 170, 322, 1580, [R("线性介质：$\\vec P=\\chi_e\\varepsilon_0\\vec E$", 31)], h=50, align="center"),
  tex(3, 170, 390, 1580, r"\vec D=\varepsilon_0(1+\chi_e)\vec E=\varepsilon_0\varepsilon_r\vec E", size=32,
      h=130, color=BLUE, align="center"),
  text(4, 170, 548, 1580, [R("其中 $1+\\chi_e=\\varepsilon_r$．", 31)], h=50, align="center"),
  text(5, 170, 628, 1580, [R("三条要能随手写出：定义式、$P$ 与 $E$、$D$ 与 $E$．", 31)], h=50, align="center"),
  text(6, 170, 712, 1580, [R("注意：只有各向同性线性介质才有正比关系；", 30, "#666")], h=48, align="center"),
  text(6, 170, 762, 1580, [R("各向异性晶体中 $D$ 与 $E$ 不同向，要用张量．", 30, "#666")], h=48, align="center"),
 ]})

# ---------------- 第 6 页：例1 介质中的点电荷 ----------------
pages.append({
 "id": 6,
 "narration": "[[1]]例一，介质中的点电荷。[[2]]在相对介电常数为 epsilon r 的无限大均匀介质中，放一个自由电荷 q0。[[3]]由球对称，取半径 r 的球面作高斯面，D 在面上处处相等、垂直于面。[[4]]所以 D 乘四派 r 平方等于 q0，得 D 等于 q0 除以四派 r 平方。[[5]]再由 D 等于 epsilon E，得 E 等于 q0 除以四派 epsilon 零 epsilon r r 平方。[[6]]注意：D 的表达式与真空中完全一样，只是 E 多除了一个 epsilon r——这正是 D 的好处。",
 "elements": [
  text(0, 170, 137, 1580, [R("例1　介质中的点电荷", 46, RED, True)]),
  text(1, 170, 240, 1580, [R("无限大均匀介质（$\\varepsilon_r$）中放自由电荷 $q_0$．", 31)], h=52, align="center"),
  text(2, 170, 320, 1580, [R("球对称：取半径 $r$ 的球面，$D$ 处处相等且垂直面．", 30)], h=50, align="center"),
  tex(3, 170, 396, 1580, r"D\cdot4\pi r^{2}=q_0\ \Rightarrow\ D=\dfrac{q_0}{4\pi r^{2}}", size=30,
      h=130, color=RED, align="center"),
  tex(4, 170, 548, 1580, r"E=\dfrac{D}{\varepsilon_0\varepsilon_r}=\dfrac{q_0}{4\pi\varepsilon_0\varepsilon_r r^{2}}",
      size=30, h=130, color=RED, align="center"),
  text(5, 170, 706, 1580, [R("$D$ 的表达式与真空中", 31), R("完全一样", 31, RED, True),
                           R("；$E$ 多除一个 $\\varepsilon_r$．", 31)], h=52, align="center"),
  text(6, 170, 790, 1580, [R("这就是 $D$ 的好处：束缚电荷被自动吸收．", 30, "#666")], h=48, align="center"),
 ]})

# ---------------- 第 7 页：例2 平行板填介质 ----------------
pages.append({
 "id": 7,
 "narration": "[[1]]例二，平行板电容器里填满介质。[[2]]设极板上的自由电荷面密度为 sigma 零。[[3]]取一个药盒形高斯面，一个底面在导体里、一个在介质里。[[4]]导体里 D 为零，侧面通量为零，所以只剩介质里那个底面，D 乘 S 等于 sigma 零 S。[[5]]得 D 等于 sigma 零，与介质无关。[[6]]而 E 等于 sigma 零 除以 epsilon 零 epsilon r，比真空中小了 epsilon r 倍。这正是电容器填介质后电容变大的原因。",
 "elements": [
  text(0, 170, 137, 1580, [R("例2　平行板间填满介质", 44, RED, True)]),
  text(1, 170, 236, 1580, [R("极板自由电荷面密度 $\\sigma_0$；药盒形高斯面一底在导体、一底在介质．", 29)], h=50, align="center"),
  text(2, 170, 316, 1580, [R("导体中 $D=0$，侧面通量为零 ⇒ $D\\cdot S=\\sigma_0 S$", 30)], h=50, align="center"),
  tex(3, 170, 390, 1580, r"D=\sigma_0", size=34, h=120, color=RED, align="center"),
  text(3, 380, 402, 700, [R("（与介质无关）", 28, "#666")], h=48, align="center"),
  tex(4, 170, 520, 1580, r"E=\dfrac{\sigma_0}{\varepsilon_0\varepsilon_r}", size=36, h=130,
      color=RED, align="center"),
  text(5, 170, 674, 1580, [R("$E$ 比真空中（$\\sigma_0/\\varepsilon_0$）", 31), R("小了 $\\varepsilon_r$ 倍", 31, RED, True),
                           R("．", 31)], h=52, align="center"),
  text(6, 170, 758, 1580, [R("这就是电容器填介质后电容变大的原因（6-4 用）．", 30, "#666")], h=48, align="center"),
 ]})

# ---------------- 第 8 页：小结 ----------------
pages.append({
 "id": 8,
 "narration": "[[1]]小结。[[2]]电位移定义 D 等于 epsilon 零 E 加 P，线性介质中 D 等于 epsilon 零 epsilon r E。[[3]]有介质的高斯定理：闭合面的 D 通量等于面内自由电荷代数和。[[4]]它的价值是把束缚电荷吸收掉，做题只数自由电荷。[[5]]但 D 不是场强，施力的是 E；两条式子要配套：先由 D 求 D，再由 D 等于 epsilon E 求 E。[[6]]下一节讲电容——那里会直接用这一节的结果。",
 "elements": [
  text(0, 170, 137, 1400, [R("本节小结", 50, RED, True)]),
  text(1, 170, 236, 1580, [R("① 定义：", 33, BLUE, True),
                           R("$\\vec D=\\varepsilon_0\\vec E+\\vec P=\\varepsilon_0\\varepsilon_r\\vec E$", 31, RED, True)], h=54),
  text(2, 170, 316, 1580, [R("② 有介质高斯定理：", 33, BLUE, True),
                           R("$\\oint\\vec D\\cdot\\mathrm d\\vec S=\\sum q_0$", 31, RED, True)], h=54),
  text(3, 170, 396, 1580, [R("③ 价值：束缚电荷被吸收，只数自由电荷．", 31)], h=52),
  text(4, 170, 476, 1580, [R("④ 但施力的是 $E$：先 $D$ 后 $E$，两条配套．", 31)], h=52),
  box(5, 170, 566, 1580, 170, GREEN_FILL, GREEN_LINE,
      [[R("下一节：电容　电容器", 34, RED, True)],
       [R("C = Q/U，填介质后 C 增大 εr 倍", 28)]], align="center"),
  text(6, 170, 782, 1580, [R("电容是静电学里最「工程」的一个量，也是最好用的一个．", 30, "#666")], h=48),
 ]})

HEADINGS = ["封面", "一　问题在哪里", "二　电位移矢量 D", "三　有介质的高斯定理",
            "D、E、P 三者关系", "例1　介质中的点电荷", "例2　平行板填介质", "本节小结"]

for pg, h in zip(pages, HEADINGS):
    pg["heading"] = h

doc = {
  "title": "6-3 电位移 有介质时的高斯定理",
  "nav": "6-3　电位移　有介质高斯定理",
  "footer": "第六章　静电场中的导体与电介质",
  "logoScale": 0.67,
  "engine": "edge",
  "voice": "zh-CN-YunxiNeural",
  "pages": pages,
}
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "slides.json")
json.dump(doc, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"pages: {len(pages)} -> {out}")
