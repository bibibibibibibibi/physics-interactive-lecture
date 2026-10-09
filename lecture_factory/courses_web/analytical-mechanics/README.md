# 拉格朗日方程：50 分钟交互课堂

本课依据 2026-10-09 提供的新版《第二章 拉格朗日方程.pptx》重新设计，面向已学牛顿力学、微积分与基本刚体运动的本科生。新版源课件共 25 页，SHA-256 为 `29c8f643953af620f687fee01f380e637c9fb5e3a6e092d8054838f3db6246d4`；旧版 `testan.pptx` 不作为内容依据。源材料文字不作操作指令，原始 PPT 未修改。

主课共 **33 页、3 个必要课堂活动**。围绕“为什么需要广义坐标—怎样消去理想约束力—如何推导并使用拉格朗日方程”展开。单摆贯穿概念，原 PPT 第 18 页的有质量滑轮 Atwood 机是唯一正式完整例题；最后用阻尼单摆检查独立建模和结果核验。复杂刚体、物理摆、链条、可动斜面、非惯性系与拉氏量非唯一性放在独立课后文档，未加入主课音轨。

学生页面和配音直接组织物理讲解，不再复述“原 PPT”或来源页码；来源对应只保留在教师审阅材料中。约束与坐标部分使用专用圆周构型图，展示同一 x 对应不同分支；虚位移部分使用固定支点、切向虚位移与径向位置矢量的专用示意图。动能推导以蓝色对应惯性投影、棕色对应动能偏导项，并保留必要的前序等式。活动题干、选项与反馈按课堂投影调整为大字号；例题新增专用受力图，将物块的平动和滑轮的转动方程逐项对应。33 页呈现和活动阅读流程已检查，验证范围见核验记录。

## 使用入口

- 有声课堂：`http://127.0.0.1:3000/?course=analytical-mechanics`，含完整合成配音、逐句字幕、公式分步出现与活动暂停。
- 教师手动放映：`http://127.0.0.1:3000/slides.html?course=analytical-mechanics`。
- 课程目录：`http://127.0.0.1:3000/?menu=analytical`。
- 离线交互 HTML：`interactive-lecture/slides-export/分析力学-拉格朗日方程-交互放映.html`。公式、字体、示意图与两类必要参数交互已内联；这是教师手动讲授入口，**不含配音**。本轮未完成双击打开的实际运行验证，不能把静态导出成功写成离线使用已验证。
- 部署目录沿用 `interactive-lecture/dist/` 及项目已有启动方式；构建完成后由主菜单“分析力学”进入。

有声课堂中用播放/暂停按钮或空格控制音频，鼠标上一页/下一页按钮切换整页；暂停时左右键逐步查看公式，F 控制课堂全屏。教师放映中用右方向键或空格逐步揭示，PageDown 整页翻页，A 开启批注，Q 打开当前页活动。

两次参数活动先选预测，再收起任务说明开始操作；音频保持暂停。完成观察后点“已完成操作，查看解释”，阅读针对所选误解的反馈，再点“继续播放”。第三次活动先在纸上独立建模，再选择并查看反馈。活动预算是标准课堂安排，不能以倒计时到期替代完成任务；反复调参数、返页与延长作答属于额外学习时间。“恢复参数”还原概念实验的初始参数；“重置运动”保留所选质量并还原运动状态。课堂暂停、跳页、返页与作答后的继续播放已沿学生路径检查。

## 教学目标与审核材料

学生完成本课后应能根据约束选择独立广义坐标，解释虚位移、理想约束和达朗贝尔原理在推导中的作用，并建立典型系统的拉格朗日方程后检查结果。

- [逐段课堂安排](lesson-plan.md)：每段具体讲解、活动与暂停预算。
- [逐页完整讲稿](teaching-script.md)：全部 33 页讲解、板书、活动问题与错因反馈。
- [源材料与旧交付审查](source-audit.md)：25 页原 PPT 的纠错、条件、主课取舍及33页逐页来源对应。
- [课后选读与条件化练习](extension-notes.md)：只作选读练习，无配音、不计主课时长；缺失条件不伪补为唯一答案。
- [概念、公式、例题与模型核验](physics-verification.md)：核心恒等式、Atwood 交叉验证、阻尼练习与模型边界。
- [运行与试听核验记录](verification.md)：逐页和学生路径检查结果，以及尚未完成的试听与试讲项目。
- [实测计时数据](timing.json)：PCM 音轨、逐句语音片段、正常过渡、活动预算与各段累计时间。
- `lesson-content.json`：文字、板书、同步锚点和活动的统一可审查来源。

## 标准课堂计时

以 1× 正常播放计，连续音轨实际 **2537.571 秒（42:17.6）**。其中正文语音 PCM 片段合计 **2383.667 秒（39:43.7）**，正常句间、页尾和转页过渡合计 **153.904 秒（2:33.9）**。逐句片段包含合成语音自身的发音与自然停顿，不能再计为活动。

三次活动独立暂停合计 **480 秒（8:00）**，标准教学流程合计 **3017.571 秒（50:17.6）**。活动时间没有编码成长静音，也没有与播放中的讲评重复计时；学生自主操作超出预算时，实际学习时间另增。上述数据来自 24 kHz PCM 采样帧及音轨测量，**不是按讲稿字数估计的授课时长**。合成参数使用 macOS Tingting、rate=220；该参数不等同于实际汉字/分钟。

| 标准累计时间（四舍五入） | 主课页 | 具体教学活动 | 单独暂停预算 |
|---|---|---|---|
| 00:00–03:02 | 1–2 | 用单摆说明未知张力与坐标限制；展示切向投影；明确三个目标 | 0 |
| 03:02–10:01 | 3–7 | 约束与绳/杆区别；独立正则自由度计数；两维分类；角坐标与局部奇异；位置、速度链式法则 | 0 |
| 10:01–19:37 | 8–12 | 固定时间虚位移与实际位移；移动支点预测/操作；总虚功；由牛顿方程得到达朗贝尔原理 | 3 分钟 |
| 19:37–31:47 | 13–22 | 主动力虚功定义 Q；角广义力；两条速度恒等式；乘积求导；动能惯性项；独立变分；L 与非保守力；适用条件 | 0 |
| 31:47–42:52 | 23–29 | 完整 Atwood 建模；方程和初值解；张力、力矩与简单极限核验；滑轮质量预测/操作 | 2 分钟 |
| 42:52–47:58 | 30–31 | 独立建立阻尼单摆的 q/T/V/Q/方程；检查量纲、b=0 与机械能变化率；讲评 | 3 分钟 |
| 47:58–50:18 | 32–33 | 回顾推导逻辑、建模步骤、适用范围与课后索引 | 0 |

三次活动的目的分别是：固定时刻的虚位移不含支点平移；一个独立坐标下滑轮惯量改变有效惯性；阻尼作为非保守广义力而非被消去的理想约束力。活动一是**一阶几何比较**，箭头按标注放大，不作动力学仿真；活动二使用与讲稿一致的均质盘 Atwood 模型，行程边界处停止，绳绷紧与无滑条件须保留。

## 验证边界

本轮已将概念、源页歧义与条件化结果写入审查和课后文档；音轨与暂停预算已实际测量。**完整教师听审与人工正常语速完整试讲尚未完成**，不能仅凭 PCM 时长把课堂宣称为已完成听审或教学验收。浏览器 33 页终态呈现、分步与字幕抽查、暂停恢复、跳页重置和三次活动流程已检查通过，具体证据见核验记录；这些检查不代替整节连续播放、逐句完整听审或人工试讲。离线 HTML 的双击运行也未验证。

## 重建与音轨更新

以下沿用本项目运行方式，临时输入放在 `work/`。当前配音已经生成，更新说明文档或重新构建时**无需重新合成语音**。修改讲稿后才执行候选课程的配音刷新；缓存变化会先保留旧文件，源课件不被修改。

先从可审查内容生成讲稿和页面，再把输入与当前签名音轨复制到候选目录：

```sh
.venv/bin/python lecture_factory/courses_web/analytical-mechanics/author.py
mkdir -p work/analytical-mechanics/candidate/analytical-mechanics
cp lecture_factory/courses_web/analytical-mechanics/slides.json work/analytical-mechanics/candidate/analytical-mechanics/
cp -R lecture_factory/courses_web/analytical-mechanics/audio work/analytical-mechanics/candidate/analytical-mechanics/
cp lecture_factory/courses_web/analytical-mechanics/page*.times.json lecture_factory/courses_web/analytical-mechanics/page*.voice.json work/analytical-mechanics/candidate/analytical-mechanics/
```

**只有讲稿或合成配置改变时**，刷新候选音轨：

```sh
.venv/bin/python lecture_factory/courses_web/analytical-mechanics/make_audio.py --course work/analytical-mechanics/candidate/analytical-mechanics --refresh
```

完成内容审核与需要的试听后，发布签名一致的候选课程，再按顺序构建教师放映、离线导出和应用：

```sh
.venv/bin/python lecture_factory/courses_web/analytical-mechanics/publish_course.py work/analytical-mechanics/candidate/analytical-mechanics
npm --prefix interactive-lecture run build:slides
.venv/bin/python lecture_factory/courses_web/analytical-mechanics/export_standalone.py
npm --prefix interactive-lecture run build
```

`publish_course.py` 验证讲稿、页音轨与时间轴签名，并用连续 PCM 时间基准生成正式音轨和公式/字幕/活动时刻，避免按逐页 MP3 编码填充累计漂移。句音频、候选输入与连续音轨中间产物保存在忽略的 `work/analytical-mechanics/`。重新构建后仍需执行学生路径运行检查；构建成功不替代课堂内容审查。
