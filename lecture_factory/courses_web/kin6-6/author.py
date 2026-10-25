# -*- coding: utf-8 -*-
"""6-6 电容器的充放电（第六章）网页版幻灯片创作脚本。

源 PPT：第06章/6-6 电容器的充放电.ppt（5 页）
解析产物：work/p66/png/
生成: python courses_web/kin6-6/author.py  →  slides.json
构建: python build_web.py courses_web/kin6-6
"""

import json, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from web_author import *

pages = []

# ---------------- 第 1 页：封面 ----------------
pages.append({
 "id": 1,
 "narration": "[[1]]6-6，电容器的充放电。[[2]]前面讲电容、讲储能，都是「充好电」以后的状态。[[3]]这一节看过程：把电容器接上电源，电荷是怎么一点点上去的？[[4]]结论是指数规律，时间常数是 RC。[[5]]这个规律在电路里到处都是，闪光灯、定时器、滤波器都靠它。",
 "elements": [
  text(0, 560, 292, 800, [R("第 六 章", 56)], h=100, align="center"),
  text(1, 300, 420, 1320, [R("6-6　电容器的充放电", 60, RED, True)], h=150, align="center"),
  text(2, 220, 630, 1480, [R("指数规律，时间常数 τ = RC", 40, BLUE, True)], h=110, align="center"),
  text(3, 220, 790, 1480, [R("q = Cε (1 − e^(−t/RC))", 36, "#666")], h=90, align="center"),
 ]})

# ---------------- 第 2 页：一 充电电路 ----------------
pages.append({
 "id": 2,
 "narration": "[[1]]一，充电电路。[[2]]把电容 C、电阻 R、电源电动势 epsilon 和开关串成一个回路。[[3]]开关合上的瞬间，电容还没充电，电压为零，全部电动势都加在电阻上，所以电流最大，等于 epsilon 除以 R。[[4]]随着电荷积累，电容电压升高，电阻上的电压就减小，电流随之下降。[[5]]当电容电压等于电动势时，电流为零，充电结束。[[6]]所以这是个「越来越慢」的过程，不是线性的。",
 "elements": [
  text(0, 170, 137, 1400, [R("一　充电电路", 48, RED, True)]),
  text(1, 170, 244, 1580, [R("串联：电容 $C$、电阻 $R$、电动势 $\\varepsilon$、开关．", 31)], h=52),
  text(2, 170, 326, 1580, [R("合上瞬间：$u_C=0$ ⇒ 电流最大 $I_0=\\varepsilon/R$．", 31)], h=52),
  text(3, 170, 410, 1580, [R("随电荷积累：$u_C$ 升高 ⇒ $u_R$ 减小 ⇒ 电流下降．", 31)], h=52),
  text(4, 170, 494, 1580, [R("$u_C=\\varepsilon$ 时电流为零，充电结束．", 31, RED, True)], h=52),
  text(5, 170, 578, 1580, [R("所以是「越来越慢」的过程，不是线性．", 31, "#666")], h=50),
  box(6, 170, 664, 1580, 160, GREEN_FILL, GREEN_LINE,
      [[R("回路方程", 31, BLUE, True)],
       [R("ε = iR + u_C，其中 u_C = q/C", 30)]], align="center"),
 ]})

# ---------------- 第 3 页：充电规律 ----------------
pages.append({
 "id": 3,
 "narration": "[[1]]解这个回路方程，得到充电规律。[[2]]电荷随时间的变化是：q 等于 C epsilon 乘以括号一减 e 的负 t 比 RC 次方。[[3]]t 等于零时，指数项为一，q 为零，符合初始条件。[[4]]t 趋于无穷时，指数项趋于零，q 趋于 C epsilon，也就是充满。[[5]]电流是 q 的导数：i 等于 epsilon 除以 R 乘 e 的负 t 比 RC 次方，指数衰减。[[6]]注意 t 等于零时电流是最大值，之后单调下降——这与电荷的「先快后慢」正好呼应。",
 "elements": [
  text(0, 170, 137, 1580, [R("充电规律", 48, RED, True)]),
  tex(1, 170, 244, 1580, r"q=C\varepsilon\left(1-\mathrm e^{-t/RC}\right)", size=36, h=140,
      color=RED, align="center"),
  tex(2, 170, 410, 1580, r"i=\dfrac{\mathrm dq}{\mathrm dt}=\dfrac{\varepsilon}{R}\mathrm e^{-t/RC}", size=34,
      h=140, color=BLUE, align="center"),
  text(3, 170, 580, 1580, [R("$t=0$：$q=0$，$i=\\varepsilon/R$（最大）．", 31)], h=52, align="center"),
  text(4, 170, 662, 1580, [R("$t\\to\\infty$：$q\\to C\\varepsilon$（充满），$i\\to0$．", 31)], h=52, align="center"),
  text(5, 170, 744, 1580, [R("电荷「先快后慢」，电流单调衰减——两者正好呼应．", 30, "#666")], h=48, align="center"),
 ]})

# ---------------- 第 4 页：时间常数 ----------------
pages.append({
 "id": 4,
 "narration": "[[1]]指数里的 RC 有时间的量纲，叫时间常数，记作 tau。[[2]]它的意义是：经过一个 tau，电荷达到最终值的一减 e 分之一，也就是约百分之六十三。[[3]]经过三个 tau，达到百分之九十五；五个 tau，达到百分之九十九点三。[[4]]工程上通常认为五个 tau 就充满。[[5]]tau 越大，充得越慢。所以大电阻、大电容都会让过程变慢。[[6]]这也是为什么电源滤波要用大电容——它能把电压的波动「抹平」。",
 "elements": [
  text(0, 170, 137, 1580, [R("时间常数 $\\tau=RC$", 48, RED, True)]),
  text(1, 170, 244, 1580, [R("RC 有时间量纲：$\\Omega\\cdot\\mathrm F=\\mathrm s$．", 31)], h=52, align="center"),
  text(2, 170, 326, 1580, [R("经过一个 $\\tau$：$q$ 达到终值的 $1-1/\\mathrm e\\approx63\\%$．", 30)], h=52, align="center"),
  table(3, 170, 400, 1100, [
      ["时间", "达到终值的比例"],
      ["1 τ", "63.2%"],
      ["3 τ", "95.0%"],
      ["5 τ", "99.3%"],
  ], rowh=66, size=29),
  text(4, 170, 700, 1580, [R("工程上认为 $5\\tau$ 就充满．", 31, RED, True)], h=52, align="center"),
  text(5, 170, 782, 1580, [R("$\\tau$ 越大，充得越慢：大电阻、大电容都使过程变慢．", 30, "#666")], h=48, align="center"),
  text(6, 170, 862, 1580, [R("电源滤波用大电容，就是靠它把电压波动「抹平」．", 30, "#666")], h=48, align="center"),
 ]})

# ---------------- 第 5 页：放电 ----------------
pages.append({
 "id": 5,
 "narration": "[[1]]再看放电。[[2]]把电源断开，让电容通过电阻放电。[[3]]此时回路方程变成 u_C 等于 iR，也就是 q 除以 C 等于负 R 乘 dq 比 dt。[[4]]解出来：q 等于 Q0 乘 e 的负 t 比 RC 次方。[[5]]电荷从初始值 Q0 开始指数衰减，时间常数还是 RC。[[6]]电流方向与充电时相反，大小也是指数衰减。注意放电时能量全部消耗在电阻上，变成热——这就是为什么大电容放电会打火、会烫。",
 "elements": [
  text(0, 170, 137, 1580, [R("放电", 48, RED, True)]),
  text(1, 170, 244, 1580, [R("断开电源，电容通过电阻放电：$q/C=-R\\,\\mathrm dq/\\mathrm dt$．", 30)], h=52, align="center"),
  tex(2, 170, 320, 1580, r"q=Q_0\,\mathrm e^{-t/RC}", size=38, h=140, color=RED, align="center"),
  tex(3, 170, 490, 1580, r"i=-\dfrac{Q_0}{RC}\mathrm e^{-t/RC}", size=32, h=130, color=BLUE, align="center"),
  text(4, 170, 654, 1580, [R("电荷指数衰减，时间常数仍是 $RC$．", 31)], h=52, align="center"),
  text(5, 170, 736, 1580, [R("能量全部消耗在电阻上，变成热．", 31, RED, True)], h=52, align="center"),
  text(6, 170, 818, 1580, [R("所以大电容放电会打火、会烫——不要直接短接．", 30, "#666")], h=48, align="center"),
 ]})

# ---------------- 第 6 页：应用 ----------------
pages.append({
 "id": 6,
 "narration": "[[1]]这个规律的应用很多。[[2]]相机闪光灯：先用高压把大电容充满，需要几秒；然后瞬间放电，几十微秒内放出全部能量，形成强闪光。[[3]]定时电路：用 RC 的充电时间做延时，改变 R 或 C 就能改时间。[[4]]滤波：大电容把整流后的脉动电压抹平，输出接近直流。[[5]]还有消抖、复位电路，都是同一个道理。[[6]]要注意：RC 充放电的「慢」是相对的，微秒到小时都可以，取决于 RC 的大小。",
 "elements": [
  text(0, 170, 137, 1400, [R("这些规律用在哪里", 48, RED, True)]),
  text(1, 170, 240, 1580, [R("① 闪光灯：", 33, BLUE, True),
                           R("几秒充满，几十微秒放完 ⇒ 强闪光．", 31)], h=54),
  text(2, 170, 322, 1580, [R("② 定时电路：", 33, BLUE, True),
                           R("用 RC 充电时间做延时，改 $R$ 或 $C$ 即可调节．", 30)], h=54),
  text(3, 170, 404, 1580, [R("③ 滤波：", 33, BLUE, True),
                           R("大电容把脉动电压抹平，输出接近直流．", 31)], h=54),
  text(4, 170, 486, 1580, [R("④ 消抖、复位电路：同一个道理．", 33, BLUE, True)], h=54),
  box(5, 170, 578, 1580, 170, GREEN_FILL, GREEN_LINE,
      [[R("注意「慢」是相对的", 31, BLUE, True)],
       [R("RC 可以从微秒到小时，全看选多大的电阻和电容", 28)]], align="center"),
  text(6, 170, 796, 1580, [R("充电时电源做功 $C\\varepsilon^{2}$，储能只有一半，另一半耗在电阻上．", 28, "#666")],
       h=48),
 ]})

# ---------------- 第 7 页：小结 ----------------
pages.append({
 "id": 7,
 "narration": "[[1]]小结。[[2]]充电：q 等于 C epsilon 乘一减 e 的负 t 比 RC，电流指数衰减。[[3]]放电：q 等于 Q0 乘 e 的负 t 比 RC。[[4]]时间常数 tau 等于 RC，一个 tau 到百分之六十三，五个 tau 基本充满。[[5]]能量方面：充电时电源做功 C epsilon 平方，一半储能、一半耗在电阻上。[[6]]这个「一半」是个反直觉但很重要的结论，做题时常考。",
 "elements": [
  text(0, 170, 137, 1400, [R("本节小结", 50, RED, True)]),
  text(1, 170, 236, 1580, [R("① 充电：$q=C\\varepsilon(1-\\mathrm e^{-t/RC})$，$i=\\dfrac{\\varepsilon}{R}\\mathrm e^{-t/RC}$", 29)], h=54),
  text(2, 170, 316, 1580, [R("② 放电：$q=Q_0\\mathrm e^{-t/RC}$", 31, RED, True)], h=52),
  text(3, 170, 396, 1580, [R("③ 时间常数 $\\tau=RC$；$1\\tau\\to63\\%$，$5\\tau\\to99\\%$．", 30)], h=52),
  text(4, 170, 476, 1580, [R("④ 充电能量：电源做功 $C\\varepsilon^{2}$，储能 $\\frac12C\\varepsilon^{2}$，", 30)], h=50),
  text(4, 220, 526, 1560, [R("另一半消耗在电阻上（与 $R$ 无关）．", 30, RED, True)], h=48),
  box(5, 170, 612, 1580, 170, GREEN_FILL, GREEN_LINE,
      [[R("一个反直觉的结论", 31, BLUE, True)],
       [R("不管电阻多大，充电效率都只有 50%", 29, RED, True)]], align="center"),
  text(6, 170, 830, 1580, [R("这也是开关电源要用电感而不是电阻限流的原因之一．", 29, "#666")], h=48),
 ]})

HEADINGS = ["封面", "一　充电电路", "充电规律", "时间常数 τ = RC", "放电",
            "这些规律用在哪里", "本节小结"]

for pg, h in zip(pages, HEADINGS):
    pg["heading"] = h

doc = {
  "title": "6-6 电容器的充放电",
  "nav": "6-6　电容器的充放电",
  "footer": "第六章　静电场中的导体与电介质",
  "logoScale": 0.67,
  "engine": "edge",
  "voice": "zh-CN-YunxiNeural",
  "pages": pages,
}
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "slides.json")
json.dump(doc, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"pages: {len(pages)} -> {out}")
