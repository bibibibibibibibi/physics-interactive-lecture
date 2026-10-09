# 课后选读与条件化练习

本文件对应新版《第二章 拉格朗日方程.pptx》中未进入主课的内容。它是供教师审核、学生选读与练习的补充材料，**没有配音，不进入主课 50 分钟时间轴，也没有宣称额外的讲授时长**。本轮未修改原始 PPT，未作原生 PowerPoint 逐页视觉复查；核验方法和源页纠错记录见 [source-audit.md](source-audit.md)。

有些原题缺少足以确定全程模型的条件。下面将缺失条件与“在明确补充条件后得到的结果”分开列出；条件化计算不代表已经恢复了原题的唯一答案。

## 1. 上端水平受力的圆形截面刚体（原页 15–16）

系统为质量 $m$、圆形截面半径 $a$ 的刚体，绕质心平行于截面法线的转动惯量为 $I$。选地面近似惯性系，质心向右位置为 $X$，顺时针转角为 $\phi$。光滑水平面仅限制质心高度，平动与转动仍然独立，具有两个自由度。

原题“其上端 A 处受到水平力 F”存在两种不同的全程解释：

- A 是**初始位于顶部的固定物质点**，力始终水平向右并作用于该物质点。
- 力始终在**当前顶部**水平切向作用，需要另说明能实现这种持续作用的装置；当前顶部并不是始终同一个物质点。

此外，第 16 页直接使用 $I=ma^2/2$，而第 15 页只给一般圆形截面刚体，未规定均质圆盘/圆柱。没有这些补充，不能把两页的公式当作一般系统唯一的全程运动方程。

### 固定物质点的解释

令 $\phi=0$ 时 A 位于顶部，地面为 $y=0$，则

$$
\mathbf r_A=(X+a\sin\phi)\mathbf e_x+(a+a\cos\phi)\mathbf e_y,
\qquad \mathbf F=F\mathbf e_x.
$$

允许虚功为

$$
\delta W=F\delta X+Fa\cos\phi\,\delta\phi,
\qquad Q_X=F,\quad Q_\phi=Fa\cos\phi.
$$

若 $F$ 为恒定水平力、平面光滑、质心高度不变，取重力势能常数，把该作用力单独作为广义力计入，则

$$
T=\frac12m\dot X^2+\frac12I\dot\phi^2,
\qquad m\ddot X=F,\quad I\ddot\phi=Fa\cos\phi.
$$

原页的 $Q_\phi=Fa$ 仅在 A 正处顶部的瞬间成立；不能在物质点转离顶部后仍全程使用。也可将恒定力写入势能 $V_F=-F(X+a\sin\phi)$，得到相同方程；采用这一写法时不能再把该力重复放到右端。

### 持续顶部水平切向力的解释

在明确采用持续顶部作用后，顶部处当前物质点的瞬时允许位移满足

$$
\delta x_{\rm top}=\delta X+a\delta\phi,
\qquad Q_X=F,\quad Q_\phi=Fa.
$$

这是一条**瞬时运动学关系**，不是不断更换的当前顶部点的全程位置函数。光滑时

$$
m\ddot X=F,\qquad I\ddot\phi=Fa.
$$

若地面足够粗糙，使刚体持续无滑滚动，$\dot X=a\dot\phi$，可在此一维运动中积分为 $X-a\phi=C$。于是只有一个独立坐标，

$$
T=\frac12\left(m+\frac{I}{a^2}\right)\dot X^2,
\qquad Q_X=2F,
\qquad
\ddot X=\frac{2F}{m+I/a^2}.
$$

令地面对刚体的静摩擦力向右为正，回代平动与转动定律：

$$
F+f=m\ddot X,
\qquad a(F-f)=I\frac{\ddot X}{a},
\qquad
f=F\frac{ma^2-I}{ma^2+I}.
$$

只有额外给定均质实心圆盘/圆柱，才有

$$
I=\frac12ma^2,
\qquad \ddot X=\frac{4F}{3m},\qquad f=\frac F3.
$$

需要检查 $N=mg>0$、$|f|\leq\mu_sN$、接触持续存在。静摩擦的方向由接触处相对滑动趋势决定，不能事先一律设为向左。实际力作用装置与材料摩擦能力未给定时，以上只是明确假设下的模型解。

练习：分别说明“固定 A 点”与“持续顶部作用”的角广义力为什么不同；再用牛顿方程核验均质盘结果，列出无滑滚动失效条件。

## 2. 物理摆：惯量、初值与小角度（原页 17）

系统为绕固定水平轴 O 转动的刚体，质量 $m$，质心到轴距离 $l>0$，关于 **O 轴**的转动惯量为 $I_O$。取固定支点参考系为近似惯性系，忽略轴阻力，$\theta$ 从竖直向下量起；刚体只绕 O 转动，只有一个自由度。这里的 $I_O$ 不能直接用质心转动惯量代替；若已知后者，需用平行轴定理。

以 O 高度为零重力势能位置，

$$
y_C=-l\cos\theta,\qquad
T=\frac12I_O\dot\theta^2,\qquad V=-mgl\cos\theta,
\qquad L=T-V.
$$

由 $Q_\theta^{nc}=0$ 得精确方程

$$
I_O\ddot\theta+mgl\sin\theta=0.
$$

只有振幅满足 $\max|\theta|<5^\circ$ 等小角度条件时，才用 $\sin\theta\simeq\theta$；式中角度按弧度计算。线性化以后

$$
\ddot\theta+\omega_0^2\theta=0,
\qquad \omega_0=\sqrt{\frac{mgl}{I_O}}.
$$

给定 $\theta(0)=\theta_0$、$\dot\theta(0)=\Omega_0$，完整初值解是

$$
\theta(t)=\theta_0\cos(\omega_0t)
+\frac{\Omega_0}{\omega_0}\sin(\omega_0t).
$$

线性解振幅 $\sqrt{\theta_0^2+(\Omega_0/\omega_0)^2}$ 也要落在近似允许范围，不能只检查初始角度。量纲 $mgl/I_O$ 为 $\mathrm{s}^{-2}$；若质量集中为距轴 l 的质点，$I_O=ml^2$，恢复单摆频率 $\sqrt{g/l}$。精确方程的机械能 $I_O\dot\theta^2/2-mgl\cos\theta$ 守恒，直接对时间求导即可核验。若 $l=0$，重力不提供回复力矩，不能用该装置解释非零频率的重力摆。

练习：已知质心惯量与初值，写出频率、解及近似适用范围；说明为什么本题使用支点惯量。

## 3. 桌边链条：起动与滑动必须分开（原页 19）

系统为总长 $l$、总质量 $m$ 的均匀不可伸长链条。地面参考系近似惯性，桌边平滑且不另引入绕角摩擦，桌面部分保持接触；悬垂部分长 $x$，向下增加为正，讨论 $0<x<l$ 且链条持续向下滑动的阶段。链条各段速率相同。

原题只给滑动摩擦系数，不能单独判定“从静止释放后一定滑下”。若需判断起动，还必须给静摩擦系数 $\mu_s$，或者明确说明已由外力启动。静止时悬垂重力和桌面最大静摩擦分别为

$$
F_g=\frac{mgx}{l},\qquad
f_{s,\max}=\mu_s\frac{mg(l-x)}{l}.
$$

从悬垂长 $l_0$ 静止释放，自行开始下滑需

$$
l_0>\mu_s(l-l_0).
$$

等号是临界平衡，不能保证起动；原题未给 $\mu_s$，这一判断仍有缺失条件。

已持续向下滑动后，使用滑动摩擦系数 $\mu_k$：

$$
T=\frac12m\dot x^2,\qquad
V=-\frac{mg}{2l}x^2,\qquad
Q_x^{nc}=-\mu_k\frac{mg(l-x)}l.
$$

这里 $V$ 来自悬垂段各链节高度的积分；桌面段势能为零。代入方程得

$$
\ddot x=\frac gl[(1+\mu_k)x-\mu_kl].
$$

令 $x_*={\mu_kl}/({1+\mu_k})$、$\lambda=\sqrt{(1+\mu_k)g/l}$，对于滑动阶段开始时的 $x(0)=x_0$、$\dot x(0)=u_0$，

$$
x(t)=x_*+(x_0-x_*)\cosh(\lambda t)
+\frac{u_0}{\lambda}\sinh(\lambda t).
$$

原页从 $x_0=l_0,u_0=0$ 给出的双曲余弦解可由此得到，但它不能反过来替代静摩擦起动检查。若 $x_0>x_*$ 且 $u_0\geq0$，滑动方程给出持续向下加速；若低于 $x_*$ 而带初速度，需要检查是否先停住。到 $\dot x=0$ 时应切换为静摩擦判断，不能继续套用原方向的滑动摩擦；到 $x=l$ 时桌面摩擦模型终止。

核验机械能变化率：

$$
\frac{d(T+V)}{dt}
=Q_x^{nc}\dot x
=-\mu_k\frac{mg(l-x)}l\dot x\leq0
\qquad(\dot x>0).
$$

练习：给定 $\mu_s,\mu_k,l_0$，分别判断能否起动、起动后的加速度和解的终止条件。不要把两个摩擦系数混用。

## 4. 可动斜面：按原图方向建模（原页 20）

保留原图的坡面朝右上升方向。滑块质量 $m_1$，斜面质量 $m_2>0$，倾角 $0\leq\alpha<\pi/2$；地面与斜面均光滑。取地面为近似惯性系，水平 x 轴向右、竖直 y 轴向上。斜面向右的位置为 $x$，滑块从坡顶沿坡向左下的位移为 $s$，坡顶高度为 h。斜面仅作水平平移，滑块保持接触，独立坐标是 $(x,s)$。

位置与速度：

$$
x_1=x-s\cos\alpha,\qquad y_1=h-s\sin\alpha,
\qquad x_2=x,
$$
$$
\dot x_1=\dot x-\dot s\cos\alpha,
\qquad \dot y_1=-\dot s\sin\alpha.
$$

因此

$$
T=\frac12(m_1+m_2)\dot x^2
+\frac12m_1\dot s^2-m_1\dot x\dot s\cos\alpha,
\qquad V=-m_1gs\sin\alpha+C.
$$

系统支持力属于所声明的理想约束，$Q_x^{nc}=Q_s^{nc}=0$。对 $L=T-V$ 分别求导得到

$$
(m_1+m_2)\ddot x-m_1\ddot s\cos\alpha=0,
$$
$$
\ddot s-\ddot x\cos\alpha=g\sin\alpha.
$$

联立结果为

$$
\ddot s=\frac{(m_1+m_2)g\sin\alpha}
{m_2+m_1\sin^2\alpha},
\qquad
\ddot x=\frac{m_1g\sin\alpha\cos\alpha}
{m_2+m_1\sin^2\alpha}.
$$

斜面向右加速，滑块相对斜面向左下运动。把坡面镜像为向右下坡时可以采用另一套坐标，但必须同时改变位置关系与耦合项，不能把原图与镜像方程混用。

牛顿法核验持续接触：原坡面单位法向为 $(-\sin\alpha,\cos\alpha)$，滑块法向加速度为 $-\ddot x\sin\alpha$，故

$$
N=m_1(g\cos\alpha-\ddot x\sin\alpha)
=\frac{m_1m_2g\cos\alpha}
{m_2+m_1\sin^2\alpha}>0
$$

在所列质量、倾角范围内接触成立；滑块到达坡面端点后模型终止。$m_2\to\infty$ 时，$\ddot x\to0$、$\ddot s\to g\sin\alpha$，恢复固定斜面。

因无水平外力，

$$
p_x=(m_1+m_2)\dot x-m_1\dot s\cos\alpha
$$

为常数；只有给定初始总水平动量为零，才可以将它设为零。实际运动由 $(x_0,s_0,\dot x_0,\dot s_0)$ 补足初值；常加速度阶段分别有 $x=x_0+\dot x_0t+\ddot x\,t^2/2$、$s=s_0+\dot s_0t+\ddot s\,t^2/2$。

练习：从位置关系独立计算 T 的交叉项，用水平动量和固定斜面极限检查符号，再说明接触与行程边界。

## 5. 非惯性系的适用界限（原页 22）

原页将非惯性系中的 T、惯性力势能 V 和惯性广义力作了概括，应补充处理方式与避免重复计入的条件。普通位置势能 $V(q,t)$ 不能统一表示所有惯性作用，科里奥利力依赖相对速度，欧拉惯性力一般也不是位置势能的梯度。

一种直接办法是仍从惯性系的真实动能出发。若原点位置为 $\mathbf b(t)$，旋转矩阵为 $\mathsf A(t)$，相对坐标为 $\mathbf r'$，则

$$
\mathbf r=\mathbf b+\mathsf A\mathbf r',
\qquad
\mathbf v=\dot{\mathbf b}
+\mathsf A\left(\dot{\mathbf r}'
+\boldsymbol\Omega\times\mathbf r'\right),
$$

其中 $\boldsymbol\Omega$ 用旋转基矢分量表示。将此真实速度写成 $q,\dot q,t$ 的函数代入惯性系 T，再减真实势能，允许显式时间依赖后使用拉格朗日方程。

另一种办法使用相对动能，但必须在相对方程中完整计入平移、离心、科里奥利与欧拉惯性力的广义力。能用合适势能表示的项可以移入势能；同一作用不能既进入 V 又保留在右端。采用惯性系真实动能重写时，也不能再额外加同一组惯性力。方程形式可复用，记账条件必须先说清。

此专题未进入主课，也没有在本文件宣称已完成一般非惯性系完整授课或模拟。

## 6. 水平圆环绕环上一点匀速旋转（原页 23）

本例专指图示的**水平**光滑圆环，半径 R，大环绕圆周上一点的竖直轴以恒定角速度 $\omega$ 转动；小环质量 m，忽略阻力并保持套在圆环上。选随大环转动的坐标，$\theta$ 从环心指向远离转轴的直径方向量起，角度增加方向在平面中取逆时针；相对有向切向速度为 $u=R\dot\theta$，相对速率为 $v=|u|$。

在旋转基矢中，转轴到小环的位置为

$$
\mathbf r'=R(1+\cos\theta,\sin\theta),
\qquad |\mathbf r'|^2=2R^2(1+\cos\theta).
$$

离心力为 $m\omega^2\mathbf r'$，投影到允许切向得

$$
Q_\theta^{\rm cen}
=m\omega^2\mathbf r'\cdot\frac{\partial\mathbf r'}{\partial\theta}
=-m\omega^2R^2\sin\theta.
$$

科里奥利力垂直于相对切向速度，其与同一切向虚位移的点积为零，所以**只在本模型的这个广义坐标上**没有相应广义力；不能据此从一般旋转系方程中删去科里奥利作用。水平环的重力无沿环切向分量。用相对动能 $mR^2\dot\theta^2/2$ 得

$$
\ddot\theta=-\omega^2\sin\theta.
$$

也可以重写惯性系真实动能来交叉核验：

$$
T_{\rm inertial}
=\frac12mR^2\dot\theta^2
+mR^2\omega(1+\cos\theta)\dot\theta
+mR^2\omega^2(1+\cos\theta).
$$

恒定 $\omega$ 时中间项是 $d[mR^2\omega(\theta+\sin\theta)]/dt$，在局部角坐标中不改变方程。去掉该全导数与无关常数，得到

$$
L_{\rm eff}=\frac12mR^2\dot\theta^2+mR^2\omega^2\cos\theta,
$$

仍给出同一运动方程。这说明两种处理一致；使用该 L 时不能再在右端加一次离心广义力。

对方程乘 $\dot\theta$，得旋转系有效积分

$$
E_{\rm eff}=\frac12mR^2\dot\theta^2-mR^2\omega^2\cos\theta
=\text{常数}.
$$

若初态为 $\theta_{\rm init}$、速率 $v_{\rm init}$，则

$$
v^2=v_{\rm init}^2
+2\omega^2R^2(\cos\theta-\cos\theta_{\rm init}).
$$

原页的式子对应 $\theta_{\rm init}=0$。平方根只给速率大小；有向速度 u 在转向时必须跟踪符号。右端达到零可形成转向点，不能继续取负数的平方根。$E_{\rm eff}$ 不是惯性系的机械能 T+V；外部驱动大环匀速转动的装置可以与小环交换能量。若圆环不水平或 $\omega$ 不是常数，要重新考虑重力切向项或欧拉作用，不能直接沿用本例结果。

练习：独立验证离心广义力和惯性系动能，指出原页速度式所用的初态，并解释相对有效能量与惯性系机械能的区别。

## 7. 拉格朗日函数加全导数（原页 25）

命题为：令 $G(q_1,\ldots,q_n,t)$ 至少二阶连续可微，定义

$$
L'=L+\frac{dG}{dt},
\qquad
\frac{dG}{dt}
=\sum_{j=1}^{n}\frac{\partial G}{\partial q_j}\dot q_j
+\frac{\partial G}{\partial t}.
$$

则 L 与 L′ 给出相同的运动方程。本节把原页的函数 F 改记 G，避免与力 F 混淆。q、$\dot q$、t 在偏导中作为独立自变量。

先对广义速度求偏导：

$$
\frac{\partial}{\partial\dot q_i}\left(\frac{dG}{dt}\right)
=\frac{\partial G}{\partial q_i}.
$$

再沿实际轨迹对时间求导：

$$
\frac{d}{dt}\left[
\frac{\partial}{\partial\dot q_i}\left(\frac{dG}{dt}\right)
\right]
=\sum_{j=1}^{n}\frac{\partial^2G}{\partial q_i\partial q_j}\dot q_j
+\frac{\partial^2G}{\partial q_i\partial t}.
$$

另一方面，保持全部广义速度与 t 不变，对 $q_i$ 求偏导：

$$
\frac{\partial}{\partial q_i}\left(\frac{dG}{dt}\right)
=\sum_{j=1}^{n}\frac{\partial^2G}{\partial q_i\partial q_j}\dot q_j
+\frac{\partial^2G}{\partial q_i\partial t}.
$$

二者相同，故

$$
\frac{d}{dt}\left[
\frac{\partial}{\partial\dot q_i}\left(\frac{dG}{dt}\right)
\right]
-\frac{\partial}{\partial q_i}\left(\frac{dG}{dt}\right)=0.
$$

加到拉格朗日方程中的贡献为零，运动方程不变。原页证明末行的正项将 $\dot q_j$ 写成了 $\ddot q_j$，负项 q_j 上也缺一阶时间导数点；两处都应是 $\dot q_j$。这里完整改正，不能把错误末行的抵消当作有效证明。

“运动方程相同”不等于所有派生量的表达完全相同。例如广义动量变为 $p'_i=p_i+G_{q_i}$；若定义能量函数 $E=\sum_i\dot q_ip_i-L$，则 $E'=E-G_t$。因此不能仅从全导数命题推断新旧能量函数恒等，或在有显式时间依赖时无条件宣称守恒。

练习：选 $G=Aq^2$（A 为常数）显式算出两项并相减，再解释为什么偏导和时间导数的先后步骤不能混淆。
