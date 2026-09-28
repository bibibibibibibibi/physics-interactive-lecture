# -*- coding: utf-8 -*-
"""简谐振动的能量（9-4）网页版幻灯片创作脚本。

坐标系 1920×1080，对照原版 PPT（ppt94_slides/ 逐页图 + ppt94_structure.json 点击步序）。
原 PPT 共 12 页：1-4 动能/势能/机械能与能量图，5 例1，6 能量导出方程，7-9 例2，10-12 例3。
生成: python courses_web/energy/author.py  →  slides.json
构建: python build_web.py courses_web/energy
"""
import json, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from web_author import *

pages = []

# ---------------- 第 1 页：动能 ----------------
pages.append({
 "id": 1,
 "narration": "前面三节，我们描述了简谐振动「怎么动」。这一节换个角度，看它「带多少能」。[[1]]先看动能，以弹簧振子为例。动能 E k 等于二分之一 m v 方，把速度 v 等于负 ω A sin 括号 ω t 加 φ 代进去，[[2]]整理后得到：E k 等于二分之一 m ω 方 A 方 sin 方括号 ω t 加 φ。动能随时间按 sin 方变化，在平衡位置最大，在端点为零。[[3]]这里 ω 方等于 k 比 m，待会儿要用它做一件大事。",
 "elements": [
  text(0, 144, 144, 900, [R("（1）　动能", 58, RED, True), R("（以弹簧振子为例）", 44)]),
  tex(1, 290, 290, 950, "E_k=\\dfrac{1}{2}mv^2=\\dfrac{1}{2}m\\,[-\\omega A\\sin(\\omega t+\\varphi)]^2", 46,
      hotspot=True, label="动能的定义式代入 v",
      qa=[{"q": "动能表达式里的 v 是什么？",
           "a": "振子的速度 v=−ωA·sin(ωt+φ)，由振动方程 x=Acos(ωt+φ) 对时间求导得到。"}]),
  box(2, 290, 470, 730, 170, GREEN_FILL, GREEN_LINE,
      tex_f="E_k=\\dfrac{1}{2}m\\omega^2A^2\\sin^2(\\omega t+\\varphi)", size=46,
      important=True, hotspot=True, label="动能 Ek=½mω²A²sin²(ωt+φ)",
      qa=[{"q": "动能何时最大、何时为零？",
           "a": "sin²=1 时（过平衡位置）动能最大；sin²=0 时（两端点）动能为零。"}]),
  tex(3, 290, 720, 500, "\\omega^2=\\dfrac{k}{m}", 50, RED),
  diagram(0, 1210, 280, 640, 480, "spring_anim", hotspot=True,
          label="弹簧振子模型",
          qa=[{"q": "弹簧振子经过平衡位置时速度如何？",
               "a": "速率最大，等于 ωA，所以动能在平衡位置取最大值。"}]),
 ]})

# ---------------- 第 2 页：势能与机械能 ----------------
pages.append({
 "id": 2,
 "narration": "[[1]]再看势能。弹簧的弹性势能 E p 等于二分之一 k x 方，把 x 等于 A cos 括号 ω t 加 φ 代入，得到二分之一 k A 方 cos 方括号 ω t 加 φ。[[2]]动能加势能就是机械能。大家算一算：sin 方加 cos 方等于一，m ω 方又等于 k，所以总机械能 E 等于二分之一 k A 方——竟然是一个常量！[[3]]想一想，这偶然吗？不偶然。线性回复力是保守力，保守力作用下机械能必然守恒。所以，作简谐振动的系统，机械能守恒。",
 "elements": [
  text(0, 144, 144, 700, [R("（2）　势能", 58, RED, True)]),
  tex(1, 290, 280, 900, "E_p=\\dfrac{1}{2}kx^2=\\dfrac{1}{2}kA^2\\cos^2(\\omega t+\\varphi)", 46,
      hotspot=True, label="势能 Ep=½kA²cos²(ωt+φ)",
      qa=[{"q": "势能何时最大？",
           "a": "cos²=1 时（两端点，位移最大处）势能最大；过平衡位置时势能为零。"}]),
  text(2, 144, 490, 700, [R("（3）　机械能", 58, RED, True)]),
  box(2, 290, 620, 890, 170, GREEN_FILL, GREEN_LINE,
      tex_f="E=E_k+E_p=\\dfrac{1}{2}m\\omega^2A^2=\\dfrac{1}{2}kA^2", size=46,
      important=True, hotspot=True, label="机械能 E=½kA²（常量）",
      qa=[{"q": "总机械能为什么是常量？",
           "a": "Ek 含 sin²、Ep 含 cos²，sin²+cos²=1，且 mω²=k，两项之和正好抵消时间依赖，等于 ½kA²。"}]),
  box(3, 290, 840, 860, 160, PINK_FILL, PINK_LINE,
      paras=[[R("线性回复力是", 44), R("保守力", 44, RED, True),
              R("，简谐振动系统", 44), R("机械能守恒", 44, RED, True), R("。", 44)]],
      important=True, hotspot=True, label="机械能守恒的物理原因",
      qa=[{"q": "机械能守恒的根本原因是什么？",
           "a": "线性回复力 F=−kx 是保守力，保守力做功只与位置有关，系统机械能必然守恒。"}]),
 ]})

# ---------------- 第 3 页：能量-时间图 ----------------
pages.append({
 "id": 3,
 "narration": "[[1]]把能量随时间的变化画出来，一目了然。取 φ 等于零：上面是位移和速度曲线，x 是余弦、v 是负正弦。[[2]]下面看能量：势能按 cos 方变化，红色；动能按 sin 方变化，蓝色。两条曲线此起彼伏——位移最大处势能登顶、动能为零；平衡位置动能登顶、势能为零。[[3]]而两条曲线每一时刻相加，都正好顶上那条绿线，E 等于二分之一 k A 方，纹丝不动。这就是机械能守恒的图像。",
 "elements": [
  diagram(1, 100, 90, 860, 900, "energy_t", hotspot=True,
          label="简谐振动能量图（φ=0）",
          qa=[{"q": "动能曲线和势能曲线有什么关系？",
               "a": "此起彼伏、相位互补：一个取最大时另一个为零，两者之和始终等于总能量 E。"},
              {"q": "能量曲线的周期和振动周期一样吗？",
               "a": "不一样。sin²、cos² 的周期是振动周期的一半，所以能量每半个振动周期循环一次。"}]),
  text(2, 940, 140, 980, [R("$\\varphi=0$", 48),
                            R("　$x=A\\cos\\omega t$", 48),
                            R("　$v=-A\\omega\\sin\\omega t$", 48)]),
  box(3, 1080, 280, 480, 175, GREEN_FILL, GREEN_LINE,
      tex_f="E=\\dfrac{1}{2}kA^2", size=48,
      important=True, hotspot=True, label="总能量绿线 E=½kA²",
      qa=[{"q": "绿线为什么是平的？",
           "a": "机械能守恒，总能量 E=½kA² 不随时间变化，所以是一条水平直线。"}]),
  box(3, 1080, 480, 560, 150, PINK_FILL, PINK_LINE,
      tex_f="E_p=\\dfrac{1}{2}kA^2\\cos^2\\omega t", size=44),
  box(3, 1080, 680, 600, 150, PINK_FILL, PINK_LINE,
      tex_f="E_k=\\dfrac{1}{2}m\\omega^2A^2\\sin^2\\omega t", size=44),
 ]})

# ---------------- 第 4 页：势能曲线 ----------------
pages.append({
 "id": 4,
 "narration": "[[1]]换一个坐标再看：把势能画成位置的函数，E p 等于二分之一 k x 方，是一条抛物线。[[2]]总能量 E 是一条水平绿线，和抛物线交于正负 A 两点。想一想，交点意味着什么？[[3]]在交点处，势能等于全部能量，动能为零——所以振子在这里掉头，正负 A 就是振幅。在 O 和端点之间任意位置 x，曲线到 x 轴是势能，绿线到曲线是动能，两段之和恒等于 E。[[4]]所以，简谐振动能量守恒，振幅不变。",
 "elements": [
  box(1, 240, 110, 620, 175, GREEN_FILL, GREEN_LINE,
      paras=[[R("简谐振动", 48, BLACK, True), R("能量守恒", 48, RED, True),
              R("，", 48), R("振幅不变", 48, RED, True)]],
      important=True, hotspot=True, label="能量守恒 ↔ 振幅不变",
      qa=[{"q": "为什么能量守恒意味着振幅不变？",
           "a": "E=½kA²，E 不变则 A 不变——振幅由总能量唯一决定。"}]),
  box(1, 1000, 120, 420, 175, GREEN_FILL, GREEN_LINE,
      tex_f="E=\\dfrac{1}{2}kA^2", size=48),
  diagram(2, 420, 290, 1080, 720, "ep_x", hotspot=True,
          label="势能曲线 Ep−x",
          qa=[{"q": "绿线和抛物线的交点 B、C 物理意义？",
               "a": "交点处 Ep=E、Ek=0，振子瞬时静止并掉头，对应最大位移 ±A。"},
              {"q": "振子能跑到 |x|>A 的区域吗？",
               "a": "不能。那里 Ep>E，动能得为负，不可能；所以振子被限制在 −A 到 +A 之间。"}]),
 ]})

# ---------------- 第 5 页：例1（Ek−x 图求 ω） ----------------
pages.append({
 "id": 5,
 "narration": "[[1]]来一个例题。弹簧振子的动能 E k 与位移 x 的关系如图所示，最大动能 32 焦，质量 1 千克，求角频率 ω。大家先想一想，从图上能读出什么？[[2]]解：曲线在正负 2 米处归零，所以振幅 A 等于 2 米。最大动能出现在平衡位置，那里全部能量都是动能：二分之一 m 括号 ω A 方等于 32 焦。[[3]]代入 m 等于 1、A 等于 2，解得 ω 等于 4 弧度每秒。",
 "elements": [
  text(1, 240, 140, 1060,
       [[R("例1　", 52, RED, True),
         R("弹簧振子的动能 $E_k$ 与位移 $x$ 关系如图，", 46)],
        [R("$E_{k,\\max}=32\\,\\mathrm{J}$，$m=1\\,\\mathrm{kg}$，求角频率 $\\omega$。", 46)]],
       h=220, valign="top", hotspot=True, label="例1 题意",
       qa=[{"q": "例1 给了什么、求什么？",
            "a": "给出 Ek−x 图像（最大动能 32 J）和质量 m=1 kg，求角频率 ω。"}]),
  diagram(1, 900, 420, 800, 560, "ek_x", hotspot=True,
          label="Ek−x 关系图",
          qa=[{"q": "为什么 Ek−x 图是倒抛物线？",
               "a": "Ek=E−Ep=½kA²−½kx²=½k(A²−x²)，是开口向下的抛物线，x=±A 处为零。"}]),
  text(2, 240, 420, 860, [R("解　", 48, RED, True),
                          R("由图读出振幅 $A=2\\,\\mathrm{m}$", 46)]),
  tex(2, 290, 540, 700, "\\dfrac{1}{2}m(\\omega A)^2=E_{k,\\max}", 48,
      hotspot=True, label="平衡位置：全部能量都是动能",
      qa=[{"q": "为什么 ½m(ωA)² 等于最大动能？",
           "a": "平衡位置速率最大 v_max=ωA，故最大动能 ½mv_max²=½m(ωA)²，也等于总能量。"}]),
  box(3, 290, 700, 400, 130, GREEN_FILL, GREEN_LINE,
      tex_f="\\omega=4\\ \\mathrm{rad\\cdot s^{-1}}", size=48,
      important=True, hotspot=True, label="例1 结果 ω=4 rad/s",
      qa=[{"q": "例1 的角频率是多少？",
           "a": "由 ½×1×(ω×2)²=32 解得 ω²=16，ω=4 rad/s。"}]),
 ]})

# ---------------- 第 6 页：能量守恒导出振动方程 ----------------
pages.append({
 "id": 6,
 "narration": "[[1]]能量守恒还能倒过来用：从它导出振动方程。E 等于二分之一 m v 方加二分之一 k x 方，是常量。[[2]]常量对时间求导等于零，d 比 d t 括号二分之一 m v 方加二分之一 k x 方等于零。[[3]]求出来：m v 乘 d v 比 d t，加 k x 乘 d x 比 d t，等于零。注意 d x 比 d t 就是 v，两边消去 v。[[4]]于是得到：x 对 t 的二阶导数加 m 分之 k 乘 x 等于零——这正是简谐振动的微分方程！不用受力分析，从能量也能走出来，物理学的美妙就在这里。",
 "elements": [
  text(0, 240, 120, 1500, [R("能量守恒", 56, RED, True),
                          R("　$\\xrightarrow{\\ \\ 导出\\ \\ }$　", 52, RED, True),
                          R("简谐振动方程", 56, BLUE, True)]),
  tex(1, 290, 280, 800, "E=\\dfrac{1}{2}mv^2+\\dfrac{1}{2}kx^2=\\text{常量}", 50,
      hotspot=True, label="能量守恒式",
      qa=[{"q": "为什么从能量守恒能导出运动方程？",
           "a": "E 为常量，dE/dt=0；对 ½mv²+½kx² 求导会自然出现 v 与 a 的关系，化简即运动方程。"}]),
  tex(2, 290, 440, 800, "\\dfrac{d}{dt}\\Big(\\dfrac{1}{2}mv^2+\\dfrac{1}{2}kx^2\\Big)=0", 50),
  tex(3, 290, 610, 800, "mv\\dfrac{dv}{dt}+kx\\dfrac{dx}{dt}=0", 50),
  box(4, 290, 780, 700, 185, GREEN_FILL, GREEN_LINE,
      tex_f="\\dfrac{d^2x}{dt^2}+\\dfrac{k}{m}\\,x=0", size=52,
      important=True, hotspot=True, label="导出简谐振动方程",
      qa=[{"q": "从 mv·dv/dt+kx·dx/dt=0 怎么到最终方程？",
           "a": "dx/dt=v，代入消去 v；dv/dt=d²x/dt²，两边除以 m 即得 x″+(k/m)x=0。"}]),
 ]})

# ---------------- 第 7 页：例2 题意 ----------------
pages.append({
 "id": 7,
 "narration": "[[1]]再看一道综合题。轻质弹簧劲度系数为 k，一端固定，另一端连着质量 m 撇的容器，容器可在光滑水平面上运动，弹簧原长时容器位于 O 点。现在让容器从 O 点左端 l 处由静止开始运动，并且每经过 O 点一次，就从上方滴管滴入一滴质量为 m 的油滴。[[2]]想一想，油滴落入容器后，系统的什么量变了、什么量守恒？[[3]]问题一：滴入 n 滴油滴后，容器离 O 点的最远距离 A 是多少？问题二：从滴入第 n 滴到第 n 加 1 滴，经历的时间 t 是多少？",
 "elements": [
  text(1, 240, 130, 820,
       [[R("例2　", 52, RED, True),
         R("轻弹簧（劲度系数 $k$）一端固定，另一端连质量 $m'$ 的容器，", 44)],
        [R("容器在光滑水平面上运动，原长时位于 $O$。容器自 $O$ 左端 $l$ 处", 44)],
        [R("由静止开始运动，每经过 $O$ 一次，滴入一滴质量 $m$ 的油滴。", 44)],
        [R("求：", 44, RED, True),
         R("（1）滴入 $n$ 滴后最远距离 $A$；（2）滴入第 $n{+}1$ 滴的时刻 $t$。", 44)]],
       h=520, valign="top", hotspot=True, label="例2 题意",
       qa=[{"q": "例2 的装置和过程是什么？",
            "a": "弹簧振子（容器 m′）从 O 左侧 l 处静止释放，每次经过 O 点滴入一滴质量 m 的油滴。"},
           {"q": "油滴滴入瞬间，什么物理量守恒？",
            "a": "水平方向动量守恒（油滴竖直落下，水平初速度为零）；机械能在滴入瞬间不守恒（完全非弹性）。"}]),
  diagram(2, 1100, 380, 720, 520, "dropper", hotspot=True,
          label="例2 装置图",
          qa=[{"q": "图中 l 是什么距离？",
               "a": "容器释放点到平衡位置 O 的距离，即初始振幅。"}]),
 ]})

# ---------------- 第 8 页：例2 解 ----------------
pages.append({
 "id": 8,
 "narration": "[[1]]解第一问。油滴竖直落下，水平方向动量守恒：m 撇 v 零等于括号 m 撇加 n m 乘 v n。[[2]]而容器从 l 处滑到 O，初始势能全部变成动能：二分之一 m 撇 v 零方等于二分之一 k l 方。[[3]]滴入 n 滴后，系统过 O 点的动能，到最远点又全部变成势能：二分之一 k A 方等于二分之一括号 m 撇加 n m 乘 v n 方。[[4]]三式联立，消去 v 零和 v n，所以得到 A 等于 l 乘根号下 m 撇比括号 m 撇加 n m。[[5]]第二问：两次滴油之间，容器从 O 出发再回到 O，恰好半个周期，所以 t 等于 π 乘根号下括号 m 撇加 n m 比 k。注意：质量变大了，周期也跟着变长。",
 "elements": [
  text(0, 240, 110, 500, [R("解　（1）", 52, RED, True)]),
  tex(1, 290, 220, 700, "m'v_0=(m'+nm)\\,v_n", 48,
      hotspot=True, label="水平动量守恒",
      qa=[{"q": "为什么这里用动量守恒而不用能量守恒？",
           "a": "油滴滴入是完全非弹性过程，机械能有损失；但水平方向无外力，动量守恒。"}]),
  tex(2, 290, 350, 700, "\\dfrac{1}{2}m'v_0^2=\\dfrac{1}{2}kl^2", 48),
  tex(3, 290, 480, 800, "\\dfrac{1}{2}kA^2=\\dfrac{1}{2}(m'+nm)\\,v_n^2", 48),
  box(4, 290, 640, 520, 175, GREEN_FILL, GREEN_LINE,
      tex_f="A=l\\sqrt{\\dfrac{m'}{m'+nm}}", size=50,
      important=True, hotspot=True, label="例2（1）最远距离",
      qa=[{"q": "滴入油滴后振幅怎么变？",
           "a": "A=l·√(m′/(m′+nm))<l：质量变大、过 O 点速率变小，振幅随之变小。"}]),
  text(5, 1000, 110, 500, [R("（2）", 52, RED, True)]),
  box(5, 1000, 220, 660, 170, GREEN_FILL, GREEN_LINE,
      tex_f="t=\\dfrac{T}{2}=\\pi\\sqrt{\\dfrac{m'+nm}{k}}", size=50,
      important=True, hotspot=True, label="例2（2）时间间隔",
      qa=[{"q": "为什么两滴油之间是半个周期？",
           "a": "容器每次沿同一方向经过 O 点才被滴油？不——每经过 O 一次滴一滴，相邻两次经过 O 相隔 T/2。"},
          {"q": "滴入油滴后周期怎么变？",
           "a": "T=2π√((m′+nm)/k)，质量变大，周期变长。"}]),
  text(5, 1000, 450, 700, [R("相邻两次过 $O$ 相隔半个周期", 42)]),
 ]})

# ---------------- 第 9 页：例3 ----------------
pages.append({
 "id": 9,
 "narration": "[[1]]最后一道例题，把这一节串起来。质量 0.10 千克的物体，以振幅 1.0 乘 10 的负 2 次方米作简谐振动，最大加速度 4.0 米每二次方秒。四个问题：周期、过平衡位置的动能、总能量、何处动能势能相等。[[2]]解。第一问：最大加速度等于 A ω 方，所以 ω 等于根号下 A 分之 a 最大，等于 20 每秒，周期 T 等于 2 π 比 ω，约 0.314 秒。[[3]]第二问：平衡位置动能最大，二分之一 m ω 方 A 方，算出来 2.0 乘 10 的负 3 次方焦。[[4]]第三问最妙：总能量不用另算——机械能守恒，平衡位置全是动能，所以 E 就等于 2.0 乘 10 的负 3 次方焦。[[5]]第四问：动能势能相等时，势能占总能量的一半，二分之一 k x 方等于 1.0 乘 10 的负 3 次方焦，解得 x 等于正负 0.707 厘米。看出来了吗？正是二分之根号二倍振幅。这一节就到这里。",
 "elements": [
  text(1, 240, 110, 1560,
       [[R("例3　", 50, RED, True),
         R("质量 $m=0.10\\,\\mathrm{kg}$ 的物体以振幅 $A=1.0{\\times}10^{-2}\\,\\mathrm{m}$ 作简谐振动，最大加速度 $a_{\\max}=4.0\\,\\mathrm{m\\cdot s^{-2}}$。", 44)],
        [R("求：", 44, RED, True),
         R("（1）振动的周期；（2）通过平衡位置时的动能；（3）总能量；（4）物体在何处时动能和势能相等？", 44)]],
       h=260, valign="top", hotspot=True, label="例3 题意",
       qa=[{"q": "例3 给了哪些已知量？",
            "a": "质量 m=0.10 kg、振幅 A=1.0×10⁻² m、最大加速度 a_max=4.0 m/s²；求 T、Ekmax、E、动势能相等的位置。"}]),
  tex(2, 240, 410, 900, "(1)\\ a_{\\max}=A\\omega^2\\ \\Rightarrow\\ \\omega=\\sqrt{\\dfrac{a_{\\max}}{A}}=20\\ \\mathrm{s^{-1}},\\ \\ T=\\dfrac{2\\pi}{\\omega}=0.314\\ \\mathrm{s}", 44,
      hotspot=True, label="（1）由 a_max 求 ω 和 T",
      qa=[{"q": "为什么 a_max=Aω²？",
           "a": "a=−ω²x，位移最大（|x|=A）时加速度大小最大，a_max=ω²A。"}]),
  tex(3, 240, 580, 900, "(2)\\ E_{k,\\max}=\\dfrac{1}{2}m\\omega^2A^2=2.0\\times10^{-3}\\ \\mathrm{J}", 44),
  tex(4, 240, 740, 900, "(3)\\ E=E_{k,\\max}=2.0\\times10^{-3}\\ \\mathrm{J}", 44,
      hotspot=True, label="（3）总能量=最大动能",
      qa=[{"q": "为什么总能量直接等于最大动能？",
           "a": "机械能守恒，平衡位置处 Ep=0，全部能量表现为动能，E=Ekmax。"}]),
  box(5, 240, 890, 1250, 150, GREEN_FILL, GREEN_LINE,
      tex_f="(4)\\ E_k=E_p\\Rightarrow E_p=\\dfrac{E}{2},\\ \\ x=\\pm\\dfrac{A}{\\sqrt{2}}=\\pm0.707\\ \\mathrm{cm}", size=44,
      important=True, hotspot=True, label="（4）动势能相等的位置",
      qa=[{"q": "动能势能相等时 x 是多少？",
           "a": "Ep=½kx²=E/2=½·½kA²，得 x²=A²/2，x=±A/√2=±0.707 cm。"},
          {"q": "x=±A/√2 这个结果有普遍性吗？",
           "a": "有。对任何简谐振动，动能势能相等的位置都在 ±A/√2 处，与具体系统无关。"}]),
 ]})

HEADINGS = ["动能", "势能机械能", "能量图", "势能曲线", "例1",
            "导出方程", "例2", "例2解", "例3"]
for pg, h in zip(pages, HEADINGS):
    pg["heading"] = h

doc = {
  "title": "简谐振动的能量",
  "nav": "9-4　简谐振动的能量",
  "footer": "第九章　振动",
  "character": "aqiang",
  "logoScale": 0.67,
  "pages": pages,
}
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "slides.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(doc, f, ensure_ascii=False, indent=1)
print("pages:", len(pages), "->", out)
