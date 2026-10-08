# -*- coding: utf-8 -*-
"""0-1 矢量代数：大学物理课程前的数学基础交互课堂。

依据《物理学（第七版）》电子教案的可见页 3–21 重编。原页 1–2 是教师
欢迎与联系方式，这里改为课程封面和学习目标；原页 6、11、15、21 的
投票题改为课堂互动题。PPT 没有讲稿备注，narration 为本课新写的口语讲解。

生成：python lecture_factory/courses_web/pre_vector/author.py
配音：python lecture_factory/courses_web/pre_vector/make_audio_mac.py
构建：python lecture_factory/build_web.py lecture_factory/courses_web/pre_vector
"""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from web_author import *

INK = "#16283F"
ACCENT = "#244B88"
MUTED = "#52647A"
RULE = "#D8E0EA"
SANS = "Microsoft YaHei, PingFang SC, sans-serif"


def heading(number, title):
    """与专题课一致的轻页眉，正文留出 190–980 的空间。"""
    return [
        text(0, 105, 40, 1500, [R(f"{number}　{title}", 44, INK, True, font=SANS)], h=64),
        box(0, 105, 118, 96, 6, ACCENT, ACCENT, lw=0, radius=3, pad=0),
        box(0, 105, 160, 1710, 2, RULE, RULE, lw=0, pad=0),
    ]


def body(step, y, runs, x=120, w=820, h=105, size=40, **kw):
    if isinstance(runs, str):
        runs = [R(runs, size)]
    return text(step, x, y, w, runs, h=h, valign="top", **kw)


def eq(step, y, formula, x=1070, w=730, h=125, size=49, **kw):
    return tex(step, x, y, w, formula, size=size, h=h, **kw)


def add_page(source_page, section, title, narration, elements, interactions=None):
    """按当前课程序号编号；source_page 保留原教案页码作创作线索。"""
    page = {
        "id": len(pages) + 1,
        "heading": title,
        "narration": narration,
        "elements": [*heading(section, title), *elements],
    }
    if interactions:
        page["interactions"] = interactions
    pages.append(page)


pages = []

# 1–2：封面与路线。原课件的教师联系页不属于教学内容。
pages.append({
    "id": 1,
    "heading": "矢量代数",
    "narration": "欢迎来到大学物理课前的数学基础节。[[1]]今天我们用一节课把矢量代数中最常用的工具串起来：矢量怎样相加和分解，点积与叉积各表示什么，以及一个随时间变化的矢量怎样求导、怎样积分。后面研究运动、电场和力矩时，这些方法都会反复出现。",
    "elements": [
        text(0, 120, 245, 820, [R("0-1　矢量代数", 94, ACCENT, True, font=SANS)], h=145),
        text(0, 124, 390, 820, [R("大学物理 · 课前数学基础", 43, MUTED, font=SANS)], h=78),
        body(1, 545, "从箭头看方向，从分量算结果。", x=125, w=790, size=47),
        tex(1, 130, 645, 800, r"\vec A+\vec B\quad\vec A\cdot\vec B\quad\vec A\times\vec B", size=47, h=110),
        body(1, 805, "位移 · 速度 · 力 · 电场", x=130, w=800, size=38),
        img(1, 980, 205, 825, 685, "hero_vectors.svg"),
    ],
})

add_page("2–3", "00", "本节路线：四把工具",
    "把这节课看成四步。[[1]]先辨认标量和矢量：一个数能否说明物理量，还是必须交代方向？[[2]]接着学会画箭头、合成与分解，并用坐标分量计算。[[3]]然后区分点积和叉积：前者得到数，后者得到垂直矢量。[[4]]最后处理随时间变化的矢量，求变化率和累计变化量。后面的运动、电场和力矩会反复用到这四把工具。",
    [
        box(1, 120, 230, 800, 275, "#E9F1FB", "#BCD0EC",
            paras=[[R("01　标量与矢量", 49, ACCENT, True, font=SANS)],
                   [R("大小够不够？还需要交代空间方向吗？", 36, INK, font=SANS)],
                   [R("速率 ↔ 速度", 36, MUTED, font=SANS)]], radius=20, pad="20px 30px"),
        box(2, 1000, 230, 800, 275, "#EAF6F2", "#B7DECf",
            paras=[[R("02　合成与分解", 49, "#146F58", True, font=SANS)],
                   [R("从箭头到坐标，再逐个分量完成运算", 36, INK, font=SANS)],
                   [R("加法 · 减法 · 投影", 36, MUTED, font=SANS)]], radius=20, pad="20px 30px"),
        box(3, 120, 565, 800, 275, "#FFF2E8", "#EAC8AB",
            paras=[[R("03　标积与矢积", 49, "#A75A25", True, font=SANS)],
                   [R("点积看投影，叉积看面积与方向", 36, INK, font=SANS)],
                   [R("结果是数，还是矢量？", 36, MUTED, font=SANS)]], radius=20, pad="20px 30px"),
        box(4, 1000, 565, 800, 275, "#F0ECF8", "#CDC3E5",
            paras=[[R("04　导数与积分", 49, "#7049A0", True, font=SANS)],
                   [R("变化有多快？累积变化是多少？", 36, INK, font=SANS)],
                   [R("轨迹 · 速度 · 位移", 36, MUTED, font=SANS)]], radius=20, pad="20px 30px"),
    ])

# 第一段：标量与矢量。原第 4、5 页改为一个对照视图。
add_page("4–5", "01", "标量与矢量：差一个方向",
    "一个量只给出数值够不够，要看它描述什么。[[1]]说路程三米或速率每秒三米，只说明多少，不回答朝哪边；负温度的负号也不是空间方向，这些是标量。[[2]]若说位移三米向东或速度每秒三米向东，大小和方向要一起给，才是矢量。速度、位移、力和电场强度都是矢量。[[3]]图中两个箭头平移后重合，表示相同的自由矢量；位置矢量则必须从选定原点出发。判断时先问：只改变朝向，物理量会不会变？",
    [
        box(1, 120, 240, 790, 235, "#EFF3F8", "#CCD7E6",
            paras=[[R("标量　只有大小", 50, ACCENT, True, font=SANS)],
                   [R("路程 3 m · 速率 3 m/s · 质量 2 kg", 38, INK, font=SANS)],
                   [R("负号不等于空间方向", 32, MUTED, font=SANS)]], radius=20,
            hotspot=True, label="标量的定义",
            qa=[{"q": "温度为负，为什么仍是标量？", "a": "负号表示相对零点的数值，不表示空间方向。"}]),
        box(2, 120, 510, 790, 235, "#EAF6F2", "#B7DCCF",
            paras=[[R("矢量　大小 + 方向", 50, "#146F58", True, font=SANS)],
                   [R("位移 3 m 向东 · 速度 3 m/s 向东", 35, INK, font=SANS)],
                   [R("换方向，就换了矢量", 32, MUTED, font=SANS)]], radius=20,
            hotspot=True, label="矢量的定义",
            qa=[{"q": "怎样判断两个自由矢量相等？", "a": "模相等且方向相同，平移箭头不影响它们相等。"}]),
        eq(3, 810, r"\vec A=A\hat e_A,\qquad |\vec A|=A", x=180, w=755, h=95, size=48),
        img(2, 1000, 230, 800, 655, "scalar_vector.svg"),
    ])

add_page(6, "01", "辨认矢量",
    "来做一道辨认题。[[1]]速度、速率、位移、路程、电场强度、温度、质量，这七个量里哪些必须同时给出大小和方向？先自己选。[[2]]答案是速度、位移和电场强度。速率与路程只说多少，不说朝向；温度、质量也没有空间方向。尤其要把速度和速率分开，它们不是同一个量。",
    [
        body(1, 215, [R("下面七个物理量，哪些是矢量？", 52, RED, True)], w=1500),
        *[box(1, x, 340, 350, 125, "#EDF3FA", "#C5D6E9",
              paras=[[R(label, 47, INK, True, font=SANS)]],
              radius=20, pad="26px 24px")
          for x, label in zip((120, 565, 1010, 1455),
                              ("速度", "速率", "位移", "路程"))],
        *[box(1, x, 520, 350, 125, "#EDF3FA", "#C5D6E9",
              paras=[[R(label, 47, INK, True, font=SANS)]],
              radius=20, pad="26px 24px")
          for x, label in zip((340, 785, 1230),
                              ("电场强度", "温度", "质量"))],
        box(2, 485, 730, 950, 150, "#EAF6F2", "#A9D7C6",
            paras=[[R("答案：速度 · 位移 · 电场强度", 48, "#146F58", True, font=SANS)],
                   [R("速率是速度的大小，所以是标量。", 34, MUTED, font=SANS)]],
            radius=20, pad="20px 30px", hotspot=True, label="矢量辨认",
            qa=[{"q": "速度与速率有什么区别？", "a": "速度是矢量，包含方向；速率是速度的大小，是标量。"}]),
    ],
    [quiz(1, "以下哪一组全是矢量？",
          options=["速度、位移、电场强度", "速率、位移、温度",
                   "速度、路程、质量", "速率、路程、电场强度"],
          answer=0, explain="速度、位移、电场强度都有大小和方向；速率、路程、温度和质量没有空间方向。")])

# 第二段：合成、分解与分量
add_page(7, "02", "矢量的加法与减法",
    "两个矢量怎样相加？[[1]]把 B 的起点接到 A 的终点，从 A 的起点指向 B 的终点，就是 A 加 B。也可以从同一个起点画平行四边形，取对角线。[[2]]减去 B 等于加上反向的 B，即 A 减 B 等于 A 加负 B。拖动右边两个箭头，观察和矢量、差矢量如何变化。",
    [
        body(1, 235, "首尾相接：从第一个起点指向最后一个终点。", w=810, size=39),
        eq(1, 390, r"\vec C=\vec A+\vec B", x=150, w=780, size=58,
           hotspot=True, label="矢量首尾相接求和",
           qa=[{"q": "多段矢量首尾相接后，总和从哪里指向哪里？", "a": "从第一段的起点指向最后一段的终点。"}]),
        eq(2, 565, r"\vec A-\vec B=\vec A+(-\vec B)", x=145, w=790, size=48),
        html(1, 1010, 235, 790, 690, "sim_vectors.html?mode=add&embed=1", label="拖动矢量观察和与差"),
    ])

add_page(8, "02", "矢量分解",
    "合成反过来就是分解。[[1]]只规定 A 等于 B 加 C 时，分解并不唯一；你可以选出无穷多对 B、C。[[2]]一旦指定两条相互垂直的坐标轴，沿 x 和 y 轴的分量便确定了。拖动右侧的 A，看看它在两个轴上的投影如何跟着变化。",
    [
        eq(1, 245, r"\vec A=\vec B+\vec C", x=170, w=780, size=58),
        body(1, 390, "不指定分解方向：有无穷多种分法。", w=780, size=38),
        eq(2, 560, r"\vec A=A_x\hat{\imath}+A_y\hat{\jmath}", x=150, w=800, size=50,
           hotspot=True, label="直角坐标分解",
           qa=[{"q": "为什么正交分量是确定的？", "a": "坐标轴方向一旦指定，投影 Ax 和 Ay 都唯一确定。"}]),
        html(2, 1010, 235, 790, 690, "sim_vectors.html?mode=components&embed=1",
             label="拖动矢量观察正交分量"),
    ])

add_page(9, "02", "三维正交分解",
    "把刚才的二维坐标扩展到三维。[[1]]矢量 A 等于它在 x、y、z 三个轴上的分量之和。[[2]]模长由三维勾股关系求得。[[3]]方向余弦把三个分量和方向联系起来：每个分量除以模长，就等于它与该轴夹角的余弦。注意模长为零时不能这样除。",
    [
        eq(1, 235, r"\vec A=A_x\hat{\imath}+A_y\hat{\jmath}+A_z\hat{k}",
           x=125, w=835, size=48, hotspot=True, label="三维矢量的分量表达",
           qa=[{"q": "三维矢量怎样用单位基矢表示？",
                "a": "A=Ax î+Ay ĵ+Az k̂，系数就是各轴方向的分量。"}]),
        eq(2, 430, r"A=\sqrt{A_x^2+A_y^2+A_z^2}", x=160, w=770, size=55,
           important=True),
        eq(3, 615, r"\cos\alpha=\frac{A_x}{A},\quad\cos\beta=\frac{A_y}{A},\quad\cos\gamma=\frac{A_z}{A}",
           x=105, w=860, size=43,
           hotspot=True, label="方向余弦",
           qa=[{"q": "方向余弦的分母是什么？", "a": "矢量的模 A；只有非零矢量才有确定方向。"}]),
        body(3, 805, "因此 cos²α + cos²β + cos²γ = 1。", x=125, w=830, size=37),
        img(1, 1005, 235, 785, 650, "axes3d.svg"),
    ])

add_page(10, "02", "分量法求和与差",
    "画图帮我们理解，算题时分量法更直接。[[1]]A 加 B，就让对应的 x、y、z 分量分别相加；A 减 B，则逐项相减。[[2]]例如 A 是三、二、负一，B 是负一、四、二，和就是二、六、一，差是四、负二、负三。[[3]]若要求和矢量的模，再把二、六、一代入三维勾股关系，得到根号四十一。先算分量，再求模，通常比在空间里量角度更稳。",
    [
        eq(1, 218, r"\vec A\pm\vec B=(A_x\pm B_x)\hat{\imath}+(A_y\pm B_y)\hat{\jmath}+(A_z\pm B_z)\hat{k}",
           x=130, w=1660, size=44, h=145,
           hotspot=True, label="矢量和差逐分量计算",
           qa=[{"q": "三维矢量相加时 z 分量怎么处理？", "a": "和 x、y 分量一样，两个矢量的 z 分量直接相加。"}]),
        box(2, 125, 420, 790, 170, "#E9F1FB", "#BCD0EC",
            paras=[[R("给定", 35, ACCENT, True, font=SANS)],
                   [R("A = (3, 2, −1)   B = (−1, 4, 2)", 37, INK, font=SANS)]],
            radius=18, pad="17px 26px"),
        box(2, 1025, 420, 750, 170, "#EAF6F2", "#B7DCCF",
            paras=[[R("逐项运算", 35, "#146F58", True, font=SANS)],
                   [R("和 (2, 6, 1)   差 (4, −2, −3)", 37, INK, font=SANS)]],
            radius=18, pad="17px 26px"),
        eq(3, 665, r"|\vec A+\vec B|=\sqrt{2^2+6^2+1^2}=\sqrt{41}",
           x=200, w=1500, size=56, important=True),
        body(3, 820, "先求分量，再按需要求模或方向。", x=340, w=1250, size=42),
    ])

add_page(11, "02", "判断差矢量方向",
    "再用一道题检查你是否真的会减法。[[1]]让 A 和 B 从同一个起点出发。A 减 B，应该从哪个箭头的终点指向哪个终点？先选。[[2]]因为 A 减 B 加上 B 等于 A，差矢量必须从 B 的终点指向 A 的终点。方向反过来得到的是 B 减 A。",
    [
        body(1, 235, "同起点的 A、B：差矢量怎样画？", w=900, size=42),
        eq(2, 485, r"\vec A-\vec B:\quad B\text{ 的终点}\longrightarrow A\text{ 的终点}",
           x=105, w=900, size=40, important=True,
           hotspot=True, label="差矢量的几何方向",
           qa=[{"q": "同起点时 A−B 的箭头怎样画？",
                "a": "从 B 的终点画到 A 的终点；反向箭头是 B−A。"}]),
        img(2, 1005, 235, 785, 650, "difference.svg"),
    ],
    [quiz(1, "A 与 B 有同一个起点。哪个箭头表示 A−B？",
          options=["从 A 终点指向 B 终点", "从共同起点指向两终点中点",
                   "从 B 终点指向 A 终点", "与 A 和 B 都垂直"],
          answer=2, explain="(A−B)+B=A，因此从 B 的终点接上差矢量应到达 A 的终点。")])

# 第三段：数乘、标积与矢积
add_page(12, "03", "标量乘矢量",
    "先看最简单的乘法：用一个数 m 乘矢量 A。[[1]]模长乘上 m 的绝对值；m 为正时方向不变，m 为负时方向反过来，m 为零时得到零矢量。[[2]]例如 A 的分量是二、一，乘二变成四、二，乘负一变成负二、负一。[[3]]数乘满足分配律，因此 m 乘括号 A 加 B，可以分别乘再相加。",
    [
        eq(1, 220, r"\vec B=m\vec A,\qquad B=|m|A", x=135, w=830, size=50,
           hotspot=True, label="矢量的数乘",
           qa=[{"q": "负数乘矢量会发生什么？", "a": "模按该数的绝对值缩放，方向反向。"}]),
        body(1, 375, "m > 0：同向", x=145, w=730, size=42),
        body(1, 455, "m < 0：反向", x=145, w=730, size=42),
        body(1, 535, "m = 0：零矢量", x=145, w=730, size=42),
        eq(2, 665, r"(2,1)\xrightarrow{\times 2}(4,2),\quad(2,1)\xrightarrow{\times(-1)}(-2,-1)",
           x=130, w=860, size=40),
        eq(3, 790, r"m(\vec A+\vec B)=m\vec A+m\vec B", x=135, w=845, size=44),
        img(1, 1005, 235, 785, 650, "scale.svg"),
    ])

add_page(13, "03", "标积：得到一个数",
    "两矢量之间还可以做标积，也叫点积。[[1]]A 点乘 B 等于两个模相乘，再乘夹角的余弦，结果是一个数。它衡量一个矢量沿另一个方向的投影有多少。[[2]]直角坐标里，对应分量相乘后相加就行。A 点乘自己等于模长的平方，点积也对加法满足分配律。两非零矢量互相垂直时，标积为零。拖动右边箭头，观察夹角变化时点积怎样变号。",
    [
        eq(1, 235, r"\vec A\cdot\vec B=AB\cos\theta", x=130, w=790, size=56,
           important=True, hotspot=True, label="标积的几何定义",
           qa=[{"q": "A·B 为什么可能是负数？", "a": "夹角大于 90° 时 cosθ 为负，点积就为负。"}]),
        eq(2, 415, r"\vec A\cdot\vec B=A_xB_x+A_yB_y+A_zB_z",
           x=130, w=820, size=43),
        body(2, 595, "非零矢量垂直时，点积为 0。", w=850, size=38),
        eq(2, 685, r"\vec A\cdot\vec A=A^2", x=140, w=820, h=90, size=45),
        eq(2, 790, r"\vec A\cdot(\vec B+\vec C)=\vec A\cdot\vec B+\vec A\cdot\vec C",
           x=120, w=860, h=100, size=37),
        html(1, 1010, 235, 790, 690, "sim_vectors.html?mode=products&embed=1",
             label="拖动矢量比较点积与叉积"),
    ])

add_page(14, "03", "矢积：得到垂直矢量",
    "叉积与点积不同。[[1]]A 叉乘 B 的结果是矢量，模等于 A 乘 B 乘夹角的正弦。叉积非零时，它的方向同时垂直于 A 和 B，用右手定则判定。[[2]]交换 A、B 的次序会使方向反向，因此叉积不满足交换律。三维坐标计算时，把两矢量的分量排成行列式。两非零矢量平行时，叉积是零矢量；它的模也对应两矢量张成的平行四边形面积。",
    [
        eq(1, 230, r"|\vec A\times\vec B|=AB\sin\theta", x=135, w=840, size=55,
           important=True, hotspot=True, label="矢积的模与方向",
           qa=[{"q": "叉积方向怎么判断？",
                "a": "右手四指从 A 弯向 B，拇指所指是 A×B 的方向。"}]),
        eq(2, 420, r"\vec B\times\vec A=-(\vec A\times\vec B)",
           x=135, w=860, size=48),
        eq(2, 620, r"\vec A\times\vec B=\begin{vmatrix}\hat{\imath}&\hat{\jmath}&\hat{k}\\A_x&A_y&A_z\\B_x&B_y&B_z\end{vmatrix}",
           x=125, w=860, h=195, size=40),
        body(2, 845, "模长 = 平行四边形面积；非零结果有方向。", w=850, h=75, size=31),
        html(1, 1010, 235, 790, 690, "sim_vectors.html?mode=products&embed=1",
             label="拖动矢量比较点积与叉积"),
    ])

add_page(15, "03", "检验叉积运算",
    "现在把点积和叉积放在一起辨析。[[1]]下面四个等式，哪一个是错的？先看运算符：点积可以交换次序，叉积交换次序却要加负号。[[2]]所以 A 叉 B 等于 B 叉 A 是错式。其余三式分别是点积交换律、混合积的循环关系和叉积对加法的分配律。",
    [
        body(1, 230, [R("判断错误的等式", 52, RED, True)], w=880),
        eq(1, 360, r"\vec A\cdot\vec B=\vec B\cdot\vec A", x=125, w=850, size=46),
        eq(1, 485, r"\vec A\times\vec B=\vec B\times\vec A\quad\text{?}",
           x=125, w=850, size=44),
        eq(2, 705, r"\vec A\times\vec B=-(\vec B\times\vec A)",
           x=105, w=900, size=42, important=True,
           hotspot=True, label="叉积反交换律",
           qa=[{"q": "为什么交换叉积次序要变号？",
                "a": "模不变，右手定则给出的垂直方向反向，因此向量整体取负。"}]),
        img(2, 1005, 235, 785, 650, "products_compare.svg"),
    ],
    [quiz(1, "以下哪个等式通常不成立？",
          options=[r"$\vec A\cdot\vec B=\vec B\cdot\vec A$",
                   r"$\vec A\times\vec B=\vec B\times\vec A$",
                   r"$(\vec A\times\vec B)\cdot\vec C=(\vec C\times\vec A)\cdot\vec B$",
                   r"$\vec C\times(\vec A+\vec B)=\vec C\times\vec A+\vec C\times\vec B$"],
          answer=1, explain="叉积满足反交换律：A×B=−(B×A)。")])

# 第四段：矢量函数、导数与积分
add_page(16, "04", "矢量函数",
    "物理中的位移、速度和力往往随时间变。[[1]]当矢量 A 的分量或方向依赖于时间 t，就写成 A 括号 t，称为矢量函数。[[2]]例如位置矢量 r 括号 t 从选定的原点出发，可以用三个随时间变化的坐标分量表示。它的端点随时间移动，描出物体的轨迹。",
    [
        box(1, 120, 235, 820, 230, "#EDF4FD", "#C8D8EF", radius=18, decorative=True),
        eq(1, 265, r"\vec A=\vec A(t)", x=170, w=735, h=105, size=61,
           hotspot=True, label="矢量函数的定义",
           qa=[{"q": "矢量函数随时间变化，可能变的是什么？",
                "a": "模、方向，或两者都可以随时间改变。"}]),
        body(1, 395, "大小、方向，或两者都可以随时间改变。", x=165, w=730,
             h=65, size=32),
        eq(2, 555, r"\vec r(t)=x(t)\hat{\imath}+y(t)\hat{\jmath}+z(t)\hat{k}",
           x=140, w=810, size=43),
        body(2, 735, "端点的位置连续变化，就构成一条轨迹。", w=825, size=39),
        img(2, 1000, 220, 800, 680, "trajectory.svg"),
    ])

add_page(17, "04", "矢量函数的导数",
    "怎样给一个变化中的矢量求导？[[1]]比较时刻 t 和 t 加 Δt 的两个矢量，后者减前者得到 ΔA。[[2]]先用 ΔA 除以 Δt，再让 Δt 越来越小，得到瞬时导数。注意，ΔA 的方向不一定沿着原来的 A；矢量即使模不变，只要方向转动，导数也可能不为零。",
    [
        eq(1, 245, r"\Delta\vec A=\vec A(t+\Delta t)-\vec A(t)",
           x=130, w=820, size=44),
        eq(2, 440, r"\frac{d\vec A}{dt}=\lim_{\Delta t\to0}\frac{\Delta\vec A}{\Delta t}",
           x=145, w=815, size=52, important=True,
           hotspot=True, label="矢量导数的定义",
           qa=[{"q": "矢量模不变，导数一定是零吗？",
                "a": "不一定。方向改变也会产生非零的矢量变化量与导数。"}]),
        body(2, 680, "例：圆周运动中，速度大小不变，方向仍在变。",
             w=820, size=34, h=145),
        box(2, 230, 835, 600, 82, "#FFF1E8", "#E9CCB6",
            paras=[[R("模不变，不代表导数为零", 37, "#98501D", True, font=SANS)]],
            radius=16),
        img(1, 1000, 220, 800, 680, "tangent.svg"),
    ])

add_page(18, "04", "逐分量求导",
    "实际计算时，在固定的直角坐标系里最方便。[[1]]对 A 的 x、y、z 三个分量分别求导，再乘各自的单位基矢，就是矢量导数。[[2]]和差逐项求导；若数乘系数 m 也随时间变，先对 m 求导乘 A，再加 m 乘 A 的导数。点积和叉积也有乘积法则。叉积的两项不能换顺序，因为换序会变号。",
    [
        eq(1, 210, r"\frac{d\vec A}{dt}=\frac{dA_x}{dt}\hat{\imath}+\frac{dA_y}{dt}\hat{\jmath}+\frac{dA_z}{dt}\hat{k}",
           x=165, w=1580, size=48, important=True,
           hotspot=True, label="矢量逐分量求导",
           qa=[{"q": "固定直角坐标系中如何求 A 的导数？",
                "a": "Ax、Ay、Az 各自对 t 求导，再组合到三个固定基矢方向。"}]),
        box(2, 120, 410, 820, 495, "#EDF4FD", "#C9D8EB", radius=18, decorative=True),
        box(2, 980, 410, 820, 495, "#EAF6F2", "#BEDDCE", radius=18, decorative=True),
        body(2, 438, [R("和差与数乘", 37, ACCENT, True, font=SANS)],
             x=155, w=745, h=65),
        eq(2, 525, r"(\vec A\pm\vec B)'=\vec A'\pm\vec B'",
           x=155, w=755, h=86, size=38),
        eq(2, 650, r"(m\vec A)'=m'\vec A+m\vec A'",
           x=155, w=755, h=86, size=38),
        body(2, 780, "m=m(t)；如 m=t、A=(t,0,0)，则 (mA)′=(2t,0,0)。",
             x=155, w=745, h=100, size=30),
        body(2, 438, [R("点积与叉积", 37, "#146F58", True, font=SANS)],
             x=1015, w=745, h=65),
        eq(2, 525, r"(\vec A\cdot\vec B)'=\vec A'\cdot\vec B+\vec A\cdot\vec B'",
           x=1015, w=755, h=86, size=36),
        eq(2, 650, r"(\vec A\times\vec B)'=\vec A'\times\vec B+\vec A\times\vec B'",
           x=1015, w=755, h=86, size=35),
        body(2, 780, "叉积的两项保留原次序。", x=1015, w=745, size=32),
    ])

add_page(19, "04", "矢量函数的积分",
    "积分可以看成求导的逆过程。[[1]]如果 B 对 t 的导数等于 A，那么 B 是 A 的一个原函数。所有原函数只差一个常矢量 C，所以不定积分要写加 C。[[2]]物理里常用的定积分是：把速度矢量从 t 一到 t 二积分，得到这段时间的位置变化，也就是位移矢量。",
    [
        eq(1, 230, r"\frac{d\vec B}{dt}=\vec A(t)", x=160, w=805, size=52),
        eq(1, 365, r"\int\vec A(t)\,dt=\vec B(t)+\vec C",
           x=150, w=810, size=47, important=True,
           hotspot=True, label="矢量不定积分",
           qa=[{"q": "矢量不定积分为什么要加常矢量？",
                "a": "任意常矢量的导数都是零，所以同一被积函数有相差常矢量的原函数。"}]),
        box(1, 215, 505, 620, 90, "#EDF4FD", "#C9D8EB",
            paras=[[R("C 是不随时间变化的常矢量", 34, ACCENT, True, font=SANS)]],
            radius=14),
        eq(2, 625, r"\Delta\vec r=\int_{t_1}^{t_2}\vec v(t)\,dt",
           x=145, w=820, size=54),
        body(2, 805, "累积速度，得到有大小和方向的位移。", w=815, size=37),
        img(2, 1000, 220, 800, 680, "displacement.svg"),
    ])

add_page(20, "04", "逐分量积分",
    "和求导一样，矢量积分也可以逐分量算。[[1]]A 加 B 的积分，等于两个积分相加；常数可以提出积分号。[[2]]在固定坐标系中，分别积分 Ax、Ay、Az，再按三个基矢合成。对于定积分，若 C 是不随时间变化的常矢量，它也可以从点积或叉积的积分号中提出。",
    [
        box(1, 120, 205, 820, 300, "#EDF4FD", "#C9D8EB", radius=18, decorative=True),
        box(1, 980, 205, 820, 300, "#EAF6F2", "#BEDDCE", radius=18, decorative=True),
        body(1, 230, [R("和的积分：逐项拆开", 35, ACCENT, True, font=SANS)],
             x=155, w=750),
        body(1, 230, [R("常数因子：提出积分号", 35, "#146F58", True, font=SANS)],
             x=1015, w=750),
        eq(1, 340, r"\int(\vec A+\vec B)\,dt=\int\vec A\,dt+\int\vec B\,dt",
           x=150, w=760, h=120, size=37),
        eq(1, 340, r"\int m\vec A\,dt=m\int\vec A\,dt\quad(m\text{ 为常数})",
           x=1010, w=760, h=120, size=37),
        eq(2, 550, r"\int\vec A\,dt=\left(\int A_xdt\right)\hat{\imath}+\left(\int A_ydt\right)\hat{\jmath}+\left(\int A_zdt\right)\hat{k}+\vec C",
           x=155, w=1610, size=42, important=True,
           hotspot=True, label="矢量逐分量积分",
           qa=[{"q": "矢量积分怎样拆成普通积分？",
                "a": "在固定坐标系中分别积分 Ax、Ay、Az，再按各基矢方向相加。"}]),
        box(2, 120, 740, 820, 165, "#F5F8FC", "#D4DEEA", radius=16, decorative=True),
        box(2, 980, 740, 820, 165, "#F5F8FC", "#D4DEEA", radius=16, decorative=True),
        eq(2, 770, r"\int_{t_1}^{t_2}(\vec C\cdot\vec A)dt=\vec C\cdot\int_{t_1}^{t_2}\vec A\,dt",
           x=150, w=760, h=110, size=33),
        eq(2, 770, r"\int_{t_1}^{t_2}(\vec C\times\vec A)dt=\vec C\times\int_{t_1}^{t_2}\vec A\,dt",
           x=1010, w=760, h=110, size=33),
    ])

add_page(21, "04", "检查导数方向",
    "最后用一个判断题收束。[[1]]矢量函数 A 的导数，方向是否总沿 A？是否一定垂直 A？都不一定。先选择你认为最准确的说法。[[2]]导数取决于矢量随时间怎样变化：模变会带来沿 A 的分量，方向变会带来转向的分量。只看某一时刻的 A，不能直接确定导数。",
    [
        body(1, 235, [R("矢量导数的方向由什么决定？", 48, RED, True)], w=850),
        eq(1, 415, r"\frac{d\vec A}{dt}=\lim_{\Delta t\to0}\frac{\Delta\vec A}{\Delta t}",
           x=150, w=810, size=52),
        box(2, 120, 690, 820, 195, "#EDF4FD", "#C9D8EB", radius=18, decorative=True),
        body(2, 715, "关键：导数由模和方向的变化共同决定。",
             x=155, w=755, h=145, size=33, hotspot=True, important=True,
             label="矢量导数方向的判断",
             qa=[{"q": "若 A 的模不变但方向改变，导数是什么情况？",
                  "a": "导数一般不为零，方向由 A 的转向决定；在模恒定时，导数与 A 垂直。"}]),
        img(1, 1000, 220, 800, 680, "direction.svg"),
    ],
    [quiz(1, "关于矢量函数 A(t) 的导数方向，哪项最准确？",
          options=["一定与 A 同向", "一定与 A 垂直", "只取决于 A 此刻的方向",
                   "取决于 A 的模和方向怎样随时间变化"],
          answer=3, explain="导数是变化量的极限；模的变化和方向的变化都可能作出贡献。")])

doc = {
    "title": "0-1 矢量代数",
    "nav": "课前数学基础　0-1 矢量代数",
    "footer": "课前数学基础　矢量代数",
    "character": "aqiang",
    "logoScale": 0.67,
    "theme": "special",
    "sections": [
        {"title": "导入", "page": 1},
        {"title": "标量与矢量", "page": 3},
        {"title": "合成与分解", "page": 5},
        {"title": "标积与矢积", "page": 10},
        {"title": "导数与积分", "page": 14},
    ],
    "pages": pages,
}

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "slides.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(doc, f, ensure_ascii=False, indent=1)
print(f"pages: {len(pages)} -> {out}")
