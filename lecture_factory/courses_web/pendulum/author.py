# -*- coding: utf-8 -*-
"""单摆和复摆（9-3）网页版幻灯片创作脚本。

坐标系 1920×1080，对照原版 PPT（ppt93_slides/ 逐页图 + ppt93_structure.json 点击步序）。
原 PPT 第 10、11 页为本章目录导航页，不制作。
生成: python courses_web/pendulum/author.py  →  slides.json
构建: python build_web.py courses_web/pendulum
"""
import json, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from web_author import *

pages = []

# ---------------- 第 1 页：单摆 · 动力学分析 ----------------
pages.append({
 "id": 1,
 "narration": "前两节，我们用弹簧振子建立了简谐振动的图像。这一节看两个真实世界里的振动系统：单摆和复摆。[[1]]先看单摆：一根不可伸长的轻绳，上端固定于 A 点，下端挂一个质点 m，拉开一个小角度放手，它就在竖直面内来回摆动。[[2]]做动力学分析：当摆角 θ 小于 5 度时，sin θ 约等于 θ，这是全部讨论的前提。[[3]]重力对悬点的力矩 M 等于负 m g l sin θ，小角度下约等于负 m g l θ，负号表示它总是把摆球拉回平衡位置。[[4]]由转动定律，负 m g l θ 等于转动惯量 J 乘 θ 对时间的二阶导数，而质点的 J 等于 m l 方。[[5]]两边消去 m 和 l，整理得到：θ 的二阶导数，等于负的 l 分之 g 乘 θ。",
 "elements": [
  text(0, 144, 144, 700, [R("一　单摆", 58, RED, True)]),
  text(1, 272, 250, 700, [R("动力学分析：", 48)]),
  tex(2, 290, 370, 800, "\\theta<5^\\circ\\ \\text{时},\\ \\sin\\theta\\approx\\theta", 46,
      hotspot=True, label="小角近似 sinθ≈θ",
      qa=[{"q": "为什么要求 θ<5°？",
           "a": "只有小角度下 sinθ≈θ 才成立，方程才能线性化；角度大了单摆不再是简谐振动。"}]),
  tex(3, 290, 500, 800, "M=-mgl\\sin\\theta\\approx -mgl\\theta", 46,
      hotspot=True, label="重力矩 M≈−mglθ",
      qa=[{"q": "力矩表达式里的负号是什么意思？",
           "a": "负号表示重力矩的方向总与角位移 θ 相反，把摆球拉回平衡位置，是回复力矩。"}]),
  tex(4, 290, 630, 800, "-mgl\\theta=J\\dfrac{d^2\\theta}{dt^2}", 46),
  box(5, 290, 780, 620, 125, GREEN_FILL, GREEN_LINE,
      tex_f="\\dfrac{d^2\\theta}{dt^2}=-\\dfrac{g}{l}\\,\\theta", size=48,
      important=True, hotspot=True, label="单摆运动方程 θ″=−(g/l)θ",
      qa=[{"q": "单摆的运动方程是什么？",
           "a": "θ″=−(g/l)θ，加速度（角）与位移（角）成正比而方向相反，与弹簧振子同构。"}]),
  diagram(1, 1160, 110, 690, 890, "pendulum_anim", hotspot=True,
          label="单摆模型图",
          qa=[{"q": "单摆模型有哪些理想化假设？",
               "a": "绳不可伸长且质量忽略，摆球视为质点，忽略空气阻力，摆角小于 5°。"},
              {"q": "图中 J=ml² 是什么？",
               "a": "摆球（质点）对悬点 A 的转动惯量，等于质量乘摆长的平方。"}]),
 ]})

# ---------------- 第 2 页：单摆的周期 ----------------
pages.append({
 "id": 2,
 "narration": "[[1]]令 ω 方等于 l 分之 g，[[2]]方程就写成 θ 的二阶导数等于负 ω 方 θ——这正是简谐振动的标准形式。[[3]]所以摆角随时间按余弦规律变化：θ 等于 θ m 乘 cos 括号 ω t 加 φ，小角度单摆做的是角谐振动。[[4]]周期 T 等于 2 π 乘根号下 g 分之 l。请注意：周期只由摆长和重力加速度决定，与摆球的质量、振幅都没有关系。",
 "elements": [
  tex(0, 240, 160, 800, "\\dfrac{d^2\\theta}{dt^2}=-\\dfrac{g}{l}\\,\\theta", 46),
  text(1, 240, 300, 130, [R("令", 48, RED, True)]),
  tex(1, 390, 290, 700, "\\omega^2=\\dfrac{g}{l}", 48),
  tex(2, 240, 440, 800, "\\dfrac{d^2\\theta}{dt^2}=-\\omega^2\\theta", 46),
  tex(3, 240, 590, 850, "\\theta=\\theta_m\\cos(\\omega t+\\varphi)", 46,
      hotspot=True, label="角谐振动 θ=θm·cos(ωt+φ)",
      qa=[{"q": "为什么说单摆做角谐振动？",
           "a": "因为角位移 θ 随时间按余弦规律变化，与线位移的简谐振动完全同构，只是变量换成了角度。"}]),
  box(4, 370, 708, 380, 220, GREEN_FILL, GREEN_LINE,
      tex_f="T=2\\pi\\sqrt{\\dfrac{l}{g}}", size=50,
      important=True, hotspot=True, label="单摆周期 T=2π√(l/g)",
      qa=[{"q": "单摆周期与哪些因素有关？",
           "a": "只与摆长 l 和重力加速度 g 有关，与摆球质量、振幅均无关——这就是摆的等时性。"}]),
  diagram(0, 1160, 110, 690, 890, "pendulum_anim", hotspot=True,
          label="单摆模型图",
          qa=[{"q": "摆长变长，周期怎么变？",
               "a": "T=2π√(l/g)，摆长变长周期变大，摆动变慢。"}]),
 ]})

# ---------------- 第 3 页：复摆 · 动力学方程 ----------------
pages.append({
 "id": 3,
 "narration": "[[1]]再看复摆：绕固定水平轴自由摆动的任意刚体，就是一个复摆。图中 O 是悬点，C 是质心，l 是悬点到质心的距离，同样在 θ 小于 5 度下讨论。[[2]]力矩的矢量式：M 等于 l 叉乘 F。[[3]]写出来，M 等于负 m g l sin θ。[[4]]由转动定律，它等于 J β，即 J 乘 θ 的二阶导数。[[5]]小角度近似后，负 m g l θ 等于 J 乘 θ 的二阶导数。[[6]]令 ω 方等于 J 分之 m g l，[[7]]又一次得到标准形式：θ 的二阶导数等于负 ω 方 θ。",
 "elements": [
  text(0, 240, 120, 900, [R("二　复摆（", 56, RED, True),
                          R("$\\theta<5^\\circ$", 50, RED, True), R("）", 56, RED, True)]),
  tex(1, 240, 250, 800, "\\vec{M}=\\vec{l}\\times\\vec{F}", 46),
  tex(2, 240, 400, 500, "M=-mgl\\sin\\theta", 46,
      hotspot=True, label="复摆的回复力矩",
      qa=[{"q": "复摆的回复力矩由什么提供？",
           "a": "由重力对转轴 O 的力矩提供，大小 mgl·sinθ，方向总指向平衡位置。"}]),
  tex(3, 760, 400, 380, "=J\\beta=J\\dfrac{d^2\\theta}{dt^2}", 46),
  tex(4, 240, 580, 800, "-mgl\\theta=J\\dfrac{d^2\\theta}{dt^2}", 46),
  text(5, 240, 750, 130, [R("令", 48, RED, True)]),
  tex(5, 390, 740, 700, "\\omega^2=\\dfrac{mgl}{J}", 48,
      hotspot=True, label="复摆 ω²=mgl/J",
      qa=[{"q": "复摆的 ω² 由什么决定？",
           "a": "ω²=mgl/J：分子是重力矩的强弱（mgl），分母是转动惯量 J。"}]),
  box(6, 240, 840, 640, 145, GREEN_FILL, GREEN_LINE,
      tex_f="\\dfrac{d^2\\theta}{dt^2}=-\\omega^2\\theta", size=48,
      important=True, hotspot=True, label="复摆运动方程 θ″=−ω²θ",
      qa=[{"q": "复摆的运动方程？",
           "a": "θ″=−ω²θ，ω²=mgl/J，与单摆、弹簧振子同一标准形式。"}]),
  diagram(1, 1160, 110, 690, 890, "compound_pendulum", hotspot=True,
          label="复摆模型图",
          qa=[{"q": "复摆和单摆的区别是什么？",
               "a": "单摆质量集中在摆球（质点），复摆是任意形状的刚体，质量分布在质心 C 周围，转动惯量不再是 ml²。"}]),
 ]})

# ---------------- 第 4 页：复摆的周期 · 角谐振动 ----------------
pages.append({
 "id": 4,
 "narration": "[[1]]于是复摆的角频率 ω 等于根号下 J 分之 m g l。[[2]]周期 T 等于 2 π 比 ω，也就是 2 π 乘根号下 m g l 分之 J。转动惯量越大、质心离轴越近，周期怎么变化，从公式里一眼就能读出来。[[3]]摆角 θ 等于 θ m cos 括号 ω t 加 φ——复摆在小角度下同样做角谐振动。",
 "elements": [
  tex(0, 240, 150, 800, "\\dfrac{d^2\\theta}{dt^2}=-\\omega^2\\theta", 46),
  tex(1, 240, 300, 800, "\\omega=\\sqrt{\\dfrac{mgl}{J}}", 48),
  tex(2, 240, 460, 1000,
      "\\Rightarrow\\ T=\\dfrac{2\\pi}{\\omega}=2\\pi\\sqrt{\\dfrac{J}{mgl}}", 50, BLACK, 140,
      important=True, hotspot=True, label="复摆周期 T=2π√(J/mgl)",
      qa=[{"q": "复摆周期公式？",
           "a": "T=2π√(J/mgl)：J 越大周期越长，质心离轴越远（l 越大）周期越短。"},
          {"q": "复摆周期公式能退化到单摆吗？",
           "a": "能。单摆 J=ml²，代入得 T=2π√(ml²/mgl)=2π√(l/g)，正是单摆公式。"}]),
  tex(3, 240, 680, 800, "\\theta=\\theta_m\\cos(\\omega t+\\varphi)", 46),
  text(3, 1080, 680, 300, [R("角谐振动", 48, RED, True)]),
  diagram(0, 1160, 110, 690, 890, "compound_pendulum", hotspot=True,
          label="复摆模型图",
          qa=[{"q": "质心 C 在转轴 O 正下方时是什么位置？",
               "a": "稳定平衡位置，θ=0，回复力矩为零。"}]),
 ]})

# ---------------- 第 5 页：例题（球壳内纯滚动） ----------------
pages.append({
 "id": 5,
 "narration": "[[1]]来一个综合例题。一个半径为 r 的匀质球，可以沿半径为 R 的固定大球壳的内表面作纯滚动，如图所示。试求：圆球绕平衡位置作微小振动的运动方程，以及它的周期。[[2]]先看图：小球球心 C 绕大球壳的球心 O 来回摆动，受三个力——重力 m g、支持力 F N，还有接触处的摩擦力 F。注意纯滚动意味着这个摩擦是静摩擦，正是它提供了小球自转的力矩。",
 "elements": [
  text(1, 240, 200, 860,
       [[R("例　", 52, RED, True),
         R("一半径为 ", 48), R("$r$", 48), R(" 的匀质球，可沿半径为 ", 48), R("$R$", 48),
         R(" 的固定大球壳的内表面作", 48), R("纯滚动", 48, RED, True),
         R("（如图所示）。", 48)],
        [R("试求圆球绕平衡位置作", 48), R("微小振动", 48, RED, True),
         R("的运动方程及其周期。", 48)]],
       h=620, valign="top", hotspot=True, label="例题条件",
       qa=[{"q": "这道题给了哪些条件？",
            "a": "匀质球半径 r，球壳内表面半径 R，纯滚动，绕平衡位置微小振动；求运动方程和周期。"},
           {"q": "纯滚动是什么意思？",
            "a": "接触点无相对滑动，球心速度与自转角速度满足 v=rω；摩擦力为静摩擦，不做功但提供自转力矩。"}]),
  diagram(2, 1130, 130, 740, 900, "rolling_ball", hotspot=True,
          label="球壳内纯滚动受力图",
          qa=[{"q": "小球受哪几个力？",
               "a": "重力 mg（竖直向下）、支持力 F_N（沿 CO 指向 O）、静摩擦力 F（沿接触点切线）。"}]),
 ]})

# ---------------- 第 6 页：解 · 四个方程联立 ----------------
pages.append({
 "id": 6,
 "narration": "[[1]]解：先对球心 C 列切向运动方程。取摆角增大的方向为正，重力的切向分量和摩擦力都指向平衡位置：负的括号 m g sin θ 加 F，等于 m a t，这是第一式。[[2]]再对小球的自转列转动方程：F 乘 r 等于五分之二 m r 方乘 α——匀质球对球心的转动惯量是五分之二 m r 方，这是第二式。[[3]]球心绕 O 点摆动，切向加速度 a t 等于括号 R 减 r 乘 θ 的二阶导数，第三式。[[4]]纯滚动约束：a t 又等于 r 乘 β，第四式。[[5]]联立这四个方程，消去 F 和 a t，得到运动方程：五分之七括号 R 减 r 乘 θ 的二阶导数，等于负 g sin θ。",
 "elements": [
  text(0, 240, 120, 400, [R("解：", 52, RED, True)]),
  tex(1, 240, 230, 950, "-(mg\\sin\\theta+F)=ma_t\\ \\ (1)", 44,
      hotspot=True, label="（1）质心切向方程",
      qa=[{"q": "（1）式的物理意义？",
           "a": "球心 C 沿切线方向的牛顿第二定律：重力切向分量 −mgsinθ 与摩擦力 −F 的合力等于 ma_t。"}]),
  tex(2, 240, 360, 950, "Fr=\\dfrac{2}{5}mr^2\\alpha\\qquad\\ (2)", 44,
      hotspot=True, label="（2）自转转动方程",
      qa=[{"q": "（2）式中的 2/5 从哪来？",
           "a": "匀质实心球对过球心轴的转动惯量 J=(2/5)mr²。"}]),
  tex(3, 240, 490, 950, "a_t=(R-r)\\dfrac{d^2\\theta}{dt^2}\\ \\ (3)", 44),
  tex(4, 240, 620, 950, "a_t=r\\beta\\qquad\\qquad\\ \\ (4)", 44),
  text(5, 240, 750, 1000, [R("联立（1）、（2）、（3）、（4）式，得运动方程", 42)]),
  box(5, 240, 860, 900, 125, GREEN_FILL, GREEN_LINE,
      tex_f="\\dfrac{7}{5}(R-r)\\dfrac{d^2\\theta}{dt^2}=-g\\sin\\theta", size=44,
      important=True, hotspot=True, label="滚球运动方程",
      qa=[{"q": "联立后的运动方程是什么？",
           "a": "(7/5)(R−r)·θ″=−g·sinθ，系数 7/5 来自平动与转动的耦合（1+2/5）。"}]),
  diagram(0, 1180, 130, 690, 900, "rolling_ball", hotspot=True,
          label="球壳内纯滚动受力图",
          qa=[{"q": "为什么球心摆动半径是 R−r？",
               "a": "球心 C 到壳心 O 的距离等于球壳半径减去小球半径，即 R−r。"}]),
 ]})

# ---------------- 第 7 页：滚球周期 ----------------
pages.append({
 "id": 7,
 "narration": "[[1]]令 ω 方等于 7 倍括号 R 减 r 分之 5 g。[[2]]微小振动，sin θ 约等于 θ，[[3]]方程立刻化为标准形式：θ 的二阶导数等于负 ω 方 θ。[[4]]所以周期 T 等于 2 π 乘根号下 5 g 分之 7 倍括号 R 减 r。和单摆比一比：相当于把摆长换成括号 R 减 r，再乘一个五分之七的修正因子——这个因子，正来自小球的滚动。",
 "elements": [
  tex(0, 240, 140, 1000, "\\dfrac{7}{5}(R-r)\\dfrac{d^2\\theta}{dt^2}=-g\\sin\\theta", 44),
  text(1, 240, 290, 130, [R("令", 48, RED, True)]),
  tex(1, 390, 280, 850, "\\omega^2=\\dfrac{5g}{7\\,(R-r)}", 48),
  tex(2, 240, 440, 700, "\\sin\\theta\\approx\\theta", 46),
  tex(3, 240, 580, 800, "\\dfrac{d^2\\theta}{dt^2}=-\\omega^2\\theta", 46),
  box(4, 360, 700, 560, 215, GREEN_FILL, GREEN_LINE,
      tex_f="T=2\\pi\\sqrt{\\dfrac{7\\,(R-r)}{5g}}", size=48,
      important=True, hotspot=True, label="滚球周期 T=2π√(7(R−r)/5g)",
      qa=[{"q": "滚球振动的周期？",
           "a": "T=2π√(7(R−r)/5g)，比同摆长单摆多一个 √(7/5) 因子，因为一部分能量分给了自转。"},
          {"q": "如果小球滑动而不滚动，周期一样吗？",
           "a": "不一样。不滚动就没有自转，相当于质点单摆，T=2π√((R−r)/g)，更短。"}]),
  diagram(0, 1180, 130, 690, 900, "rolling_ball", hotspot=True,
          label="球壳内纯滚动受力图",
          qa=[{"q": "7/5 的修正因子物理上怎么理解？",
               "a": "惯性中既有平动（贡献 1）又有自转（贡献 2/5），合计 7/5，滚动让振动变慢。"}]),
 ]})

# ---------------- 第 8 页：简谐振动的方程和特征 ----------------
pages.append({
 "id": 8,
 "narration": "[[1]]学到这里，总结一下简谐振动的方程和特征。第一，物体受线性回复力作用：F 等于负 k x，平衡位置在 x 等于零。[[2]]第二，动力学方程统一写成 x 的二阶导数等于负 ω 方 x。弹簧振子、单摆、复摆、滚动小球，殊途同归，都是这一个方程。[[3]]第三，运动学方程：x 等于 A cos 括号 ω t 加 φ；速度 v 等于负 A ω sin 括号 ω t 加 φ。[[4]]第四，加速度与位移成正比而方向相反：a 等于负 ω 方 x。这四条满足任何一条，就可以判定这个运动是简谐振动。",
 "elements": [
  text(0, 340, 90, 1250, [R("三　简谐振动的方程和特征", 56, RED, True)]),
  text(1, 340, 225, 900, [[R("（1）", 46, RED, True), R("物体受线性回复力作用", 46)]],
       hotspot=True, label="特征1：线性回复力",
       qa=[{"q": "什么是线性回复力？",
            "a": "大小与位移成正比、方向总指向平衡位置的力 F=−kx。"}]),
  box(1, 1330, 215, 340, 100, PINK_FILL, PINK_LINE, tex_f="F=-kx", size=46),
  text(1, 300, 370, 300, [R("平衡位置", 44)]),
  box(1, 580, 362, 220, 90, PINK_FILL, PINK_LINE, tex_f="x=0", size=44),
  text(2, 340, 510, 900, [[R("（2）", 46, RED, True), R("简谐振动的动力学方程", 46)]]),
  box(2, 1250, 495, 520, 125, PINK_FILL, PINK_LINE,
      tex_f="\\dfrac{d^2x}{dt^2}=-\\omega^2 x", size=46,
      important=True, hotspot=True, label="动力学方程 x″=−ω²x",
      qa=[{"q": "简谐振动的动力学方程是什么？",
           "a": "x″=−ω²x。弹簧振子、单摆、复摆在小角度下都归结为这一个方程。"}]),
  text(3, 340, 670, 900, [[R("（3）", 46, RED, True), R("简谐振动的运动学方程", 46)]]),
  box(3, 190, 780, 660, 110, PINK_FILL, PINK_LINE,
      tex_f="x=A\\cos(\\omega t+\\varphi)", size=44,
      hotspot=True, label="运动学方程 x=Acos(ωt+φ)",
      qa=[{"q": "运动学方程和动力学方程的关系？",
           "a": "x=Acos(ωt+φ) 是动力学方程 x″=−ω²x 的解，A 和 φ 由初始条件决定。"}]),
  box(3, 950, 780, 780, 110, PINK_FILL, PINK_LINE,
      tex_f="v=-A\\omega\\sin(\\omega t+\\varphi)", size=44),
  text(4, 340, 905, 900, [[R("（4）", 46, RED, True),
       R("加速度与位移成正比而方向相反", 46)]]),
  box(4, 1250, 895, 420, 100, PINK_FILL, PINK_LINE,
      tex_f="a=-\\omega^2 x", size=46,
      important=True, hotspot=True, label="a=−ω²x",
      qa=[{"q": "a=−ω²x 说明了什么？",
           "a": "加速度始终指向平衡位置、大小与位移成正比——这是简谐振动的判据之一。"}]),
 ]})

# ---------------- 第 9 页：三种系统的角频率对比 ----------------
pages.append({
 "id": 9,
 "narration": "[[1]]最后，把三种系统的角频率放在一起看。弹簧振子，ω 等于根号下 m 分之 k。[[2]]单摆，ω 等于根号下 l 分之 g。[[3]]复摆，ω 等于根号下 J 分之 m g l。看出来了吗？形式完全一致：分子代表回复作用的强度，分母代表惯性的大小。记住这个结构，以后遇到任何新的振动系统，只要能写出它的回复力或者回复力矩、找到它的惯性参数，角频率就能直接读出来。这一节就到这里。",
 "elements": [
  text(1, 340, 190, 420, [R("弹簧振子", 56, BLUE, True)], hotspot=True,
       label="弹簧振子 ω=√(k/m)",
       qa=[{"q": "弹簧振子的角频率？",
            "a": "ω=√(k/m)：k 是回复力强度，m 是惯性。"}]),
  tex(1, 850, 180, 700, "\\omega=\\sqrt{k/m}", 52),
  text(2, 340, 430, 420, [R("单摆", 56, BLUE, True)], hotspot=True,
       label="单摆 ω=√(g/l)",
       qa=[{"q": "单摆的角频率？",
            "a": "ω=√(g/l)：重力提供回复作用，摆长决定惯性大小。"}]),
  tex(2, 850, 420, 700, "\\omega=\\sqrt{g/l}", 52),
  text(3, 340, 670, 420, [R("复摆", 56, BLUE, True)], hotspot=True,
       label="复摆 ω=√(mgl/J)",
       qa=[{"q": "复摆的角频率？",
            "a": "ω=√(mgl/J)：重力矩 mgl 是回复作用，转动惯量 J 是惯性。"},
           {"q": "三个 ω 公式有什么共同结构？",
            "a": "都是「回复作用强度 ÷ 惯性大小」再开根号：k/m、g/l、mgl/J 一一对应。"}]),
  tex(3, 850, 660, 700, "\\omega=\\sqrt{mgl/J}", 52),
 ]})

HEADINGS = ["单摆", "单摆周期", "复摆", "复摆周期", "例题", "解方程",
            "滚球周期", "振动特征", "角频率"]
for pg, h in zip(pages, HEADINGS):
    pg["heading"] = h

doc = {
  "title": "单摆和复摆",
  "nav": "9-3　单摆和复摆",
  "footer": "第九章　振动",
  "character": "aqiang",
  "logoScale": 0.67,
  "pages": pages,
}
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "slides.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(doc, f, ensure_ascii=False, indent=1)
print("pages:", len(pages), "->", out)
