# -*- coding: utf-8 -*-
"""电磁振荡（9-7）网页版幻灯片创作脚本。

坐标系 1920×1080，对照原版 PPT（ppt97_slides/ 逐页图，共 8 页）：
一、振荡电路与无阻尼自由电磁振荡；二、振荡方程；三、能量；例题（1）~（5）。
生成: python courses_web/emosc/author.py  →  slides.json
构建: python build_web.py courses_web/emosc
"""
import json, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from web_author import *

pages = []

# ---------------- 第 1 页：振荡电路 ----------------
pages.append({
 "id": 1,
 "narration": "前面六节研究的都是机械振动。这一节换个领域：电和磁也能振荡。[[1]]左边是 LC 振荡电路：先合上开关，电源给电容充电到 Q 零，然后断开，电路里只剩电感和电容。[[2]]右边四个画面是一个周期里的四个状态：A，电容满电，电场最强，电流为零；B，电容放空，电流最大，磁场最强；C，电容反向充满；D，电流反向最大，然后回到 A。[[3]]所以，电荷、电流、电场、磁场都在周期性地变化——这就是无阻尼自由电磁振荡。想一想，它跟弹簧振子是不是很像？",
 "elements": [
  text(0, 170, 110, 1500, [R("一　振荡电路　无阻尼自由电磁振荡", 52, RED, True)]),
  diagram(1, 130, 230, 720, 560, "lc_circuit", hotspot=True,
          label="LC 电磁振荡电路",
          qa=[{"q": "振荡开始前电路经历了什么？",
               "a": "合上开关 S，电源 ε 把电容充电到 Q₀；断开 S 后只剩 L 和 C 构成闭合回路，振荡开始。"}]),
  diagram(2, 900, 200, 950, 720, "lc_cycle", hotspot=True,
          label="一周期四状态 A/B/C/D",
          qa=[{"q": "A、B、C、D 四个状态各有什么特点？",
               "a": "A：电容满电、电场最强、电流为零；B：电容放空、电流最大、磁场最强；C：电容反向充满；D：电流反向最大。然后回到 A。"},
              {"q": "哪个状态磁场最强？",
               "a": "B 和 D：电容放空，全部能量转化为线圈中的磁场能，电流最大。"}]),
 ]})

# ---------------- 第 2 页：振荡方程 ----------------
pages.append({
 "id": 2,
 "narration": "[[1]]列方程。电感的自感电动势平衡电容两极板的电压：负 L 乘 d i 比 d t，等于 V A 减 V B，等于 q 比 C。[[2]]代入 i 等于 d q 比 d t，得到 q 对 t 的二阶导数等于负的 L C 分之 q。[[3]]写成标准形：q 二阶导等于负 ω 方 q，其中 ω 方等于 L C 分之一——这和简谐振动的方程一模一样！所以 q 等于 Q 零 cos 括号 ω t 加 φ，周期 T 等于 2 π 根号 L C。[[4]]电流是电荷的导数：i 等于负 ω Q 零 sin 括号 ω t 加 φ，也就是 I 零 cos 括号 ω t 加 φ 加 2 分之 π——电流比电荷超前四分之一个周期。",
 "elements": [
  text(0, 170, 105, 1300, [R("二　无阻尼电磁振荡的方程", 52, RED, True)]),
  diagram(0, 130, 210, 640, 498, "lc_circuit"),
  tex(1, 840, 200, 1000, "-L\\dfrac{di}{dt}=V_A-V_B=\\dfrac{q}{C}", 46, hotspot=True,
      label="电感电动势 = 电容电压",
      qa=[{"q": "这个等式是哪条定律？",
           "a": "回路电压定律（基尔霍夫第二定律）：电感上的自感电动势 −L·di/dt 等于电容极板间电压 q/C。"}]),
  tex(2, 840, 340, 1000, "i=\\dfrac{dq}{dt}\\ \\Rightarrow\\ \\dfrac{d^2q}{dt^2}=-\\dfrac{1}{LC}\\,q", 46,
      hotspot=True, label="代入 i=dq/dt",
      qa=[{"q": "为什么 i=dq/dt？",
           "a": "电流定义为单位时间通过的电荷量；极板电荷 q 的变化率就是回路电流。"}]),
  box(3, 840, 490, 800, 150, GREEN_FILL, GREEN_LINE,
      tex_f="\\omega^2=\\dfrac{1}{LC},\\quad \\dfrac{d^2q}{dt^2}=-\\omega^2 q", size=44,
      important=True, hotspot=True, label="振荡方程标准形",
      qa=[{"q": "LC 振荡和简谐振动方程有何关系？",
           "a": "形式完全相同：q″=−ω²q 对应 x″=−ω²x，ω²=1/LC 对应 ω²=k/m。q 对应 x，L 对应 m，1/C 对应 k。"}]),
  tex(3, 260, 700, 800, "q=Q_0\\cos(\\omega t+\\varphi)", 48),
  tex(3, 1000, 700, 700, "T=2\\pi\\sqrt{LC}", 48, hotspot=True, label="振荡周期",
      qa=[{"q": "LC 振荡的周期由什么决定？",
           "a": "T=2π√(LC)，只由电感 L 和电容 C 决定，与充电多少无关。"}]),
  box(4, 260, 830, 1400, 150, PINK_FILL, PINK_LINE,
      tex_f="i=\\dfrac{dq}{dt}=-\\omega Q_0\\sin(\\omega t+\\varphi)=I_0\\cos\\Big(\\omega t+\\varphi+\\dfrac{\\pi}{2}\\Big)",
      size=44, important=True, hotspot=True, label="电流超前电荷 π/2",
      qa=[{"q": "电流和电荷的相位关系？",
           "a": "i 比 q 超前 π/2：电荷最大时电流为零，电荷为零时电流最大。"}]),
 ]})

# ---------------- 第 3 页：q、i 曲线 ----------------
pages.append({
 "id": 3,
 "narration": "[[1]]把电荷和电流画在一起看：蓝色是 q，红色是 i。[[2]]q 到峰值时，i 恰好过零；q 过零时，i 到峰值——电流比电荷超前 2 分之 π。想一想，这像不像简谐振动里位移和速度的关系？[[3]]为什么会这样？电容存电多的时候，电场能大，电流必须小；电容放空，能量全变成磁场能，电流最大。两者此起彼伏，总量不变。",
 "elements": [
  text(0, 260, 105, 1500, [R("无阻尼自由振荡中的电荷和电流随时间的变化", 50)]),
  diagram(1, 260, 230, 1400, 660, "lc_qi", hotspot=True,
          label="q、i 随时间变化曲线",
          qa=[{"q": "图中红蓝曲线谁领先？",
               "a": "红色 i 领先蓝色 q 四分之一个周期（π/2）：q 到峰时 i 过零，q 过零时 i 到峰。"}]),
  text(2, 300, 920, 700, [[R("$q=Q_0\\cos(\\omega t+\\varphi)$", 46, BLUE)]]),
  text(2, 1010, 920, 900, [[R("$i=I_0\\cos(\\omega t+\\varphi+\\dfrac{\\pi}{2})$", 46, RED)]]),
 ]})

# ---------------- 第 4 页：振荡的能量 ----------------
pages.append({
 "id": 4,
 "narration": "[[1]]再看能量。电场能 W e 等于 q 方比 2 C，代入 q 的表达式，等于 Q 零方比 2 C 乘 cos 方。[[2]]磁场能 W m 等于二分之一 L i 方，代入 i 的表达式，等于 Q 零方比 2 C 乘 sin 方。[[3]]两项相加，cos 方加 sin 方等于一，所以总能量 W 等于二分之一 L I 零方，等于 Q 零方比 2 C——是一个常量！[[4]]结论：无阻尼自由电磁振荡中，电场能和磁场能不断相互转化，总和保持不变。这和 9-4 弹簧振子的机械能守恒，是同一条物理规律的两个身影。",
 "elements": [
  text(0, 170, 105, 1300, [R("三　无阻尼电磁振荡的能量", 52, RED, True)]),
  tex(1, 420, 210, 1100, "W_e=\\dfrac{q^2}{2C}=\\dfrac{Q_0^2}{2C}\\cos^2(\\omega t+\\varphi)", 48,
      hotspot=True, label="电场能量",
      qa=[{"q": "电场能何时最大？",
           "a": "cos²=1 时（q=±Q₀，电容满充），We=Q₀²/2C 全部能量都是电场能。"}]),
  tex(2, 420, 370, 1400, "W_m=\\dfrac{1}{2}Li^2=\\dfrac{1}{2}LI_0^2\\sin^2(\\omega t+\\varphi)=\\dfrac{Q_0^2}{2C}\\sin^2(\\omega t+\\varphi)", 46,
      hotspot=True, label="磁场能量",
      qa=[{"q": "磁场能何时最大？",
           "a": "sin²=1 时（q=0，电流最大），Wm=½LI₀²，全部能量都是磁场能。"}]),
  box(3, 420, 560, 980, 175, GREEN_FILL, GREEN_LINE,
      tex_f="W=W_e+W_m=\\dfrac{1}{2}LI_0^2=\\dfrac{Q_0^2}{2C}", size=48,
      important=True, hotspot=True, label="总能量守恒",
      qa=[{"q": "总能量为什么是常量？",
           "a": "We∝cos²、Wm∝sin²，cos²+sin²=1，两者之和恒等于 Q₀²/2C=½LI₀²。"}]),
  box(4, 240, 780, 1440, 190, BLUE_FILL, BLUE_LINE,
      paras=[[R("无阻尼自由电磁振荡中，", 46), R("电场能和磁场能不断相互转化", 46, RED, True),
              R("，", 46), R("总和保持不变", 46, RED, True), R("。", 46)]],
      important=True, hotspot=True, label="能量守恒结论",
      qa=[{"q": "电磁振荡中能量如何转化？",
           "a": "电场能（电容器）与磁场能（电感线圈）周期性相互转化，无电阻耗散时总量守恒。"}]),
 ]})

# ---------------- 第 5 页：例题题干 ----------------
pages.append({
 "id": 5,
 "narration": "[[1]]来道例题，把公式用一遍。L C 电路中，已知 L 等于 260 微亨，C 等于 120 皮法；初始时两极板间的电势差 U 零等于 1 伏，并且电流为零。[[2]]一共五问：振荡频率、最大电流、电场能量随时间的变化、磁场能量随时间的变化，最后证明：任意时刻电场能量与磁场能量之和，总等于初始时的电场能量。",
 "elements": [
  text(1, 240, 140, 1520,
       [[R("例　", 52, RED, True),
         R("在 $LC$ 电路中，已知 $L=260\\ \\mu\\mathrm{H}$，$C=120\\ \\mathrm{pF}$。", 44)],
        [R("初始时两极板间的电势差 $U_0=1\\ \\mathrm{V}$，且电流为零。", 44)],
        [R("求：", 44, RED, True), R("（1）振荡频率；（2）最大电流；", 44)],
        [R("（3）电容器两极板间的电场能量随时间变化的关系；", 44)],
        [R("（4）自感线圈中的磁场能量随时间变化的关系；", 44)],
        [R("（5）证明在任意时刻电场能量与磁场能量之和总是等于初始时的电场能量。", 44)]],
       h=620, valign="top", hotspot=True, label="例题 题意",
       qa=[{"q": "例题给了什么、求什么？",
            "a": "给 L=260 μH、C=120 pF、初始 U₀=1 V、i₀=0；求频率、最大电流、两种能量随时间的变化，并证明总能量守恒。"}]),
 ]})

# ---------------- 第 6 页：例解（1）（2） ----------------
pages.append({
 "id": 6,
 "narration": "[[1]]解。第一问，振荡频率 ν 等于 2 π 根号 L C 分之一，代入数值，等于 9.01 乘 10 的 5 次方赫兹——接近一兆赫，是无线电波的频段。[[2]]第二问求最大电流。t 等于零时，q 零等于 Q 零 cos φ 等于 C U 零，i 零等于负 ω Q 零 sin φ 等于零——两个条件推出 φ 等于零、Q 零等于 C U 零。[[3]]所以最大电流 I 零等于 ω Q 零，等于 ω C U 零，也就是根号 C 比 L 乘 U 零，等于 0.679 毫安。",
 "elements": [
  text(0, 240, 105, 1500, [[R("已知：", 44, RED, True),
       R("$L=260\\ \\mu\\mathrm{H}$，$C=120\\ \\mathrm{pF}$，$t=0$ 时 $U_0=1\\ \\mathrm{V}$，$i_0=0$", 44)]]),
  text(1, 240, 220, 600, [R("解（1）振荡频率", 46, RED, True)]),
  box(1, 300, 320, 800, 175, GREEN_FILL, GREEN_LINE,
      tex_f="\\nu=\\dfrac{1}{2\\pi\\sqrt{LC}}=9.01\\times10^{5}\\ \\mathrm{Hz}", size=46,
      important=True, hotspot=True, label="（1）振荡频率",
      qa=[{"q": "振荡频率怎么算？",
           "a": "ν=1/(2π√(LC))=1/(2π√(260×10⁻⁶×120×10⁻¹²))≈9.01×10⁵ Hz。"}]),
  text(2, 240, 580, 600, [R("（2）最大电流", 46, RED, True)]),
  tex(2, 300, 670, 1250,
      "t=0:\\ \\ q_0=Q_0\\cos\\varphi=CU_0,\\ \\ i_0=-\\omega Q_0\\sin\\varphi=0\\ \\Rightarrow\\ \\varphi=0",
      42, hotspot=True, label="初始条件定 φ",
      qa=[{"q": "为什么 φ=0？",
           "a": "t=0 时 i₀=−ωQ₀sinφ=0 要求 sinφ=0；q₀=CU₀>0 要求 cosφ>0，所以 φ=0。"}]),
  box(3, 300, 810, 1150, 160, GREEN_FILL, GREEN_LINE,
      tex_f="I_0=\\omega Q_0=\\omega CU_0=\\sqrt{\\dfrac{C}{L}}\\,U_0=0.679\\ \\mathrm{mA}",
      size=44, important=True, hotspot=True, label="（2）最大电流",
      qa=[{"q": "最大电流怎么求？",
           "a": "I₀=ωQ₀=ωCU₀=√(C/L)·U₀=√(120×10⁻¹²/260×10⁻⁶)×1≈0.679 mA。"}]),
 ]})

# ---------------- 第 7 页：例解（3）（4） ----------------
pages.append({
 "id": 7,
 "narration": "[[1]]第三问，电场能量。W e 等于二分之一 C U 零方乘 cos 方 ω t，数值系数是 0.60 乘 10 的负 10 次方焦。[[2]]第四问，磁场能量。W m 等于二分之一 L I 零方乘 sin 方 ω t——注意系数：二分之一 L I 零方，正好也等于 0.60 乘 10 的负 10 次方焦。[[3]]这不是巧合：I 零等于根号 C 比 L 乘 U 零，平方之后乘上 L，C 就翻了上来，两者必然相等。",
 "elements": [
  text(0, 240, 105, 1500, [[R("已知：", 44, RED, True),
       R("$L=260\\ \\mu\\mathrm{H}$，$C=120\\ \\mathrm{pF}$，$U_0=1\\ \\mathrm{V}$，$i_0=0$", 44)]]),
  text(1, 240, 230, 700, [R("（3）电场能量随时间的变化", 46, RED, True)]),
  box(1, 300, 330, 1350, 155, PINK_FILL, PINK_LINE,
      tex_f="W_e=\\dfrac{1}{2}CU_0^2\\cos^2\\omega t=(0.60\\times10^{-10}\\ \\mathrm{J})\\cos^2\\omega t",
      size=44, hotspot=True, label="电场能量 We(t)",
      qa=[{"q": "We 的系数怎么算？",
           "a": "½CU₀²=½×120×10⁻¹²×1²=0.60×10⁻¹⁰ J；电场能按 cos²ωt 变化（φ=0）。"}]),
  text(2, 240, 560, 700, [R("（4）磁场能量随时间的变化", 46, RED, True)]),
  box(2, 300, 660, 1350, 155, PINK_FILL, PINK_LINE,
      tex_f="W_m=\\dfrac{1}{2}LI_0^2\\sin^2\\omega t=(0.60\\times10^{-10}\\ \\mathrm{J})\\sin^2\\omega t",
      size=44, hotspot=True, label="磁场能量 Wm(t)",
      qa=[{"q": "Wm 的系数为什么和 We 相同？",
           "a": "½LI₀²=½L·(C/L)U₀²=½CU₀²=0.60×10⁻¹⁰ J，由 I₀=√(C/L)U₀ 保证。"}]),
  text(3, 300, 880, 1400, [[R("两系数相等不是巧合：", 44),
       R("$\\dfrac{1}{2}LI_0^2=\\dfrac{1}{2}CU_0^2$", 44, BLUE)]], h=130, valign="top"),
 ]})

# ---------------- 第 8 页：例解（5）+ 收束 ----------------
pages.append({
 "id": 8,
 "narration": "[[1]]第五问，证明能量守恒。W e 加 W m，提出来公因子，cos 方加 sin 方等于一，所以任意时刻两者之和恒等于 0.60 乘 10 的负 10 次方焦，正是初始时的电场能量二分之一 C U 零方。证毕。[[2]]到这里，第九章振动全部学完：从弹簧振子到电磁振荡，方程相同，图像相同，能量守恒相同——物理学的美感，就藏在这种统一里。下一章，我们去看振动在空间中的传播——波动。",
 "elements": [
  text(1, 240, 140, 1520, [[R("（5）", 50, RED, True),
       R("证明：在任意时刻电场能量与磁场能量之和总是等于初始时的电场能量。", 44)]],
       h=140, valign="top", hotspot=True, label="（5）证明能量守恒",
       qa=[{"q": "第（5）问要证什么？",
            "a": "证明 We+Wm 恒等于初始电场能 ½CU₀²——即 LC 振荡能量守恒。"}]),
  box(2, 260, 340, 1400, 160, GREEN_FILL, GREEN_LINE,
      tex_f="W_e+W_m=(0.60\\times10^{-10}\\ \\mathrm{J})\\,(\\cos^2\\omega t+\\sin^2\\omega t)=\\dfrac{1}{2}CU_0^2",
      size=44, important=True, hotspot=True, label="能量守恒证明",
      qa=[{"q": "证明的关键一步是什么？",
           "a": "提出公因子 0.60×10⁻¹⁰ J 后用 cos²+sin²=1，与时间无关，恒等于 ½CU₀²。"}]),
  box(2, 260, 590, 1420, 200, BLUE_FILL, BLUE_LINE,
      paras=[[R("第九章小结：", 46, RED, True),
              R("从弹簧振子到电磁振荡——", 46)],
             [R("方程相同、图像相同、能量守恒相同", 46, RED, True),
              R("；下一章进入波动。", 46)]],
      hotspot=True, label="章末小结",
      qa=[{"q": "第九章的主线是什么？",
           "a": "简谐振动的描述（9-1~9-2）、单摆（9-3）、能量（9-4）、合成（9-5）、阻尼与受迫振动（9-6）、电磁振荡（9-7）——同一套数学贯穿始终。"}]),
 ]})

HEADINGS = ["振荡电路", "振荡方程", "电荷电流", "振荡能量", "例题",
            "例解一二", "例解三四", "例解五"]
for pg, h in zip(pages, HEADINGS):
    pg["heading"] = h

doc = {
  "title": "电磁振荡",
  "nav": "9-7　电磁振荡",
  "footer": "第九章　振动",
  "character": "aqiang",
  "logoScale": 0.67,
  "pages": pages,
}
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "slides.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(doc, f, ensure_ascii=False, indent=1)
print("pages:", len(pages), "->", out)
