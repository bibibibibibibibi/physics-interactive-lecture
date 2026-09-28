# 大学物理交互课堂

把传统 PPT 课件升级为**网页课件**：一次制作、两种产品——

- **交互课堂**：带配音、卡通讲师、激光笔指点、知识点热点与 AI 答疑的网页课堂；
- **静态幻灯片**：自包含单文件 HTML，双击即开，支持翻页笔逐步揭示、动画图示与课堂批注。

两个产品共用同一份课件数据（`weblec.json`）与同一个渲染组件，版式、公式、步进顺序逐帧一致。
除内容创作外，构建、导出、校验等环节全部脚本化，**不消耗 AI token**（TTS 配音只产生 API 费用）。

> 正式的《制作方案》见 `docs/大学物理交互课堂制作方案.pdf`（LaTeX 源文件同目录）；
> 工厂脚本的细粒度约定见 `lecture_factory/README.md`。

---

## 目录

- [快速开始](#快速开始)
- [目录结构](#目录结构)
- [做一门新课的完整流程](#做一门新课的完整流程)
- [日常使用命令](#日常使用命令)
- [课件数据规范](#课件数据规范)
- [已固化的视觉/交互标准](#已固化的视觉交互标准)
- [规范校验器](#规范校验器)
- [多课并存与课程参数化](#多课并存与课程参数化)
- [批注闭环](#批注闭环)
- [环境准备与迁移](#环境准备与迁移)
- [版本控制约定](#版本控制约定)
- [故障排查](#故障排查)

---

## 快速开始

```bash
# 1. 启动网页应用（开发模式）
cd interactive-lecture
npm install          # 首次
npm run dev          # → http://localhost:3000（本机由 Kimi Work 托管时映射为 7100）

# 2. 浏览器打开
#    http://localhost:7100/                    课程列表
#    http://localhost:7100/?course=shm        交互课堂（简谐振动）
#    http://localhost:7100/slides.html?course=shm   静态幻灯片

# 3. 导出单文件幻灯片（双击即开，可拷给学生）
python lecture_factory/export_slides.py --build --course shm
#    → interactive-lecture/slides-export/大学物理-<标题>-幻灯片.html
```

现有课程：**shm**（9-1 简谐振动）、**rotvec**（9-2 旋转矢量）、**pendulum**（9-3 单摆和复摆）、
**energy**（9-4 简谐振动的能量）、**compose**（9-5 简谐振动的合成）、
**damping**（9-6 阻尼振动 受迫振动 共振）、**emosc**（9-7 电磁振荡）、
**nonlinear**（9-8 简述非线性系统，11 页，约 6 分钟）。第九章完结。

## 目录结构

```
.
├── interactive-lecture/          # 网页应用（React + Vite + Tailwind）
│   ├── public/
│   │   ├── weblec/<课名>/        # 课件产物：weblec.json / audio.mp3 / logo.png / 插图
│   │   ├── weblec/courses.json   # 课程清单（课程列表页数据源）
│   │   └── poses/<角色>/         # 卡通讲师姿态图（全部课程共用）
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx          # 交互课堂主页（无 ?course= 时显示课程列表）
│   │   │   ├── CourseMenu.tsx    # 课程列表页
│   │   │   └── SlidesOnly.tsx    # 静态幻灯片页（含批注系统）
│   │   ├── components/lecture/   # 渲染组件库（两个产品共用）
│   │   │   ├── SlideStage.tsx    # 舞台引擎 + Element 渲染器
│   │   │   ├── diagrams.tsx      # SVG 图示库（弹簧振子、三曲线等）
│   │   │   ├── Teacher.tsx       # 卡通讲师（可切换/可拖动/姿态机）
│   │   │   └── Sidebar.tsx 等    # 右栏字幕 + AI 答疑
│   │   └── lib/
│   │       ├── course.ts         # 课程参数化（?course=<课名>）
│   │       ├── weblec.ts         # 课件数据类型定义
│   │       └── qa.ts             # 答疑（在线 AI + 离线预设库）
│   ├── slides.html               # 静态幻灯片入口
│   └── vite.slides.config.ts     # 单文件构建配置（单 chunk + 字体内联）
│
├── lecture_factory/              # 课程工厂（全部脚本，0 token）
│   ├── new_webcourse.py          # 新课骨架脚手架
│   ├── web_author.py             # 创作共享库（元素函数/配色/约定）
│   ├── build_web.py              # 构建：TTS + 音频合并 + weblec.json + 自动校验
│   ├── validate_weblec.py        # 规范校验器（构建后自动跑，也可独立用）
│   ├── export_slides.py          # 单文件幻灯片导出（--build 一条命令）
│   ├── gen_audio.py              # 逐句 TTS + 句级时间轴
│   ├── style.json                # 音色/角色配置
│   ├── courses_web/<课名>/       # 单课创作目录：author.py + assets/ + audio/（TTS 缓存）
│   └── README.md                 # 工厂细粒度约定
│
├── docs/                         # 《大学物理交互课堂制作方案》.tex/.pdf（Tectonic 编译）
├── tools/tectonic.exe            # LaTeX 编译器（.gitignore 排除，需自行安放）
├── export_ppt.ps1 / parse_pptx.py / extract_geometry.py   # PPT 解析三件套（新课复用）
└── 待处理/                       # 归档区（.gitignore 排除）：旧视频方案、中间产物、
                                #   调试图、9-1~9-4 源 PPT 与分析产物、logo 源图
```

## 做一门新课的完整流程

以「9-2 旋转矢量」为例，八环链路（◆=AI 教学判断环节，其余全脚本）：

### 第 1 环：PPT 解析（0 token）

```powershell
# 原 PPT 逐页导出 PNG（调本机 PowerPoint）
powershell -File export_ppt.ps1 <PPT路径>
```

```bash
python parse_pptx.py <PPT路径>        # 点击动画步序 → ppt_structure.json
python extract_geometry.py <PPT路径>  # 形状坐标尺寸 → ppt_geometry.json
```

目的：得到「视觉基准」——网页版 1:1 贴着原 PPT 复刻，包括点击出现顺序。

### 第 2 环：脚手架建课（0 token）

```bash
python lecture_factory/new_webcourse.py 旋转矢量
# → courses_web/旋转矢量/author.py（带示例页与约定注释）+ assets/
```

### 第 3 环：内容创作（◆ 唯一大量耗 token 环节）

编辑 `courses_web/旋转矢量/author.py`，每页写两块：

- **elements**：用 `web_author.py` 的函数摆元素（`text/tex/box/table/img/diagram`），
  坐标参考第 1 环的 PPT 几何，每个元素定 `step`（对应 PPT 点击动画的第几步）；
- **narration**：口语讲稿，`[[n]]` 标记放在关键词**紧前面**；**不同步骤拆到不同句子**
  （同句多标记会共享配音时刻导致步进重合）。

三个教学决策：每页挑 2–4 个核心知识点设 `hotspot` + 预设问答（学生点击提问）；
每页至多 3 个最重要概念标 `important`（激光红线）；复制 `logo.png` 到
`interactive-lecture/public/weblec/旋转矢量/`。

新物理场景的图示（如旋转矢量）在 `diagrams.tsx` 加 SVG 组件——一次性投入，进库复用。

```bash
python courses_web/旋转矢量/author.py   # 生成 slides.json
```

### 第 4 环：构建（0 token，花 TTS API 费）

```bash
python lecture_factory/build_web.py courses_web/旋转矢量
```

自动完成：逐句 TTS（音色按 `style.json` 角色配置；缓存到 `课程/audio/`，**改稿只重配改动页**）
→ `[[n]]` 按句内字符比例换算成 `stepTimes` 绝对时刻 → ffmpeg 合并 `audio.mp3`
→ 输出 `weblec.json` 到 `public/weblec/旋转矢量/` → **末尾自动跑规范校验**。

### 第 5 环：登记课程（0 token）

`interactive-lecture/public/weblec/courses.json` 加一行：

```json
{ "id": "旋转矢量", "title": "9-2 旋转矢量", "desc": "第九章 振动 · 约 X 分钟" }
```

### 第 6 环：双产品验收（◆）

1. **版式质检（0 token，必做）**：交互课堂地址栏加 `&qa=1` 自动巡检全部页面
   （重叠/出界/文字进图区/框体松紧），**修到 0 个问题才算过**；
   「文本框过宽(参考)」不影响显示（已自适应），可选收；
2. 交互课堂 `/?course=<课名>`：逐页核对版式、公式、步进节奏、激光点位置、
   红线条数、字幕、小人姿态；点热点试 AI 答疑；
3. 静态页 `/slides.html?course=<课名>`：步进、动画图示在动、批注可用；
4. 发现问题回 `author.py` 改 → 重跑第 4 环（TTS 缓存保证只重配改动页）→
   再跑 qa=1 确认清零。

### 第 7 环：单文件导出（0 token）

```bash
python lecture_factory/export_slides.py --build --course 旋转矢量
# → interactive-lecture/slides-export/大学物理-<标题>-幻灯片.html
```

### 第 8 环：交付与课后闭环

交付课堂链接 + 单文件。课上用静态页批注（A 键）→ 课后「导出批注」得到 JSON
（每笔自动标注圈住了哪个元素）→ 回改数据源 → 重跑第 4、7 环。

## 日常使用命令

| 目的 | 命令 |
| --- | --- |
| 启动开发服务 | `cd interactive-lecture && npm run dev` |
| 构建/重建某课 | `python lecture_factory/build_web.py courses_web/<课名>` |
| 校验某课 | `python lecture_factory/validate_weblec.py <课名>` |
| 导出单文件幻灯片 | `python lecture_factory/export_slides.py --build --course <课名>` |
| 类型检查 | `cd interactive-lecture && npx tsc --noEmit -p tsconfig.app.json` |
| 生产构建（应用） | `cd interactive-lecture && npm run build` |
| 编译方案文档 | `cd docs && ../tools/tectonic.exe -X compile 大学物理交互课堂制作方案.tex` |

**改讲稿的正确姿势**：改 `author.py` → 运行它重新生成 `slides.json` →
删掉该课的 `audio/page<n>.mp3` 和 **课程根目录**的 `page<n>.times.json`（只删改动页）→ 重跑 `build_web.py`。
重配时构建器会自动清掉该页旧句音频，不会按旧下标错配。
注意 sidecar 在 `courses_web/<课>/page<n>.times.json`（不在 audio/ 下）；若只删 mp3 漏删 sidecar，
构建器会因两个文件不同时存在而整体重配该页，仍能自愈；但句数失配的陈旧 sidecar + 旧 mp3 并存时会
IndexError——拿不准就把该页两个文件一起删。

**讲稿写作的语义词约定**（小人姿态由讲稿文本驱动，见「课件数据规范」小人姿态行）：
设问句结尾写「？」、结论句写「所以/得到/也就是说」、引导句写「想一想/不妨」、推演句写「推导/代入/写成」。
校验器对四类语义词设下限（提问≥2、结论≥3、思考≥2、推演≥1，按整课字幕统计），
不足即 WARN 提醒补写——新课过完校验器若出现语义词警告，回 author.py 补词后按上面的姿势重配。

## 课件数据规范

`weblec.json` 是唯一数据源，顶层字段：

| 字段 | 说明 |
| --- | --- |
| `title/nav/footer` | 课程标题、页眉导航、页脚 |
| `character/characters` | 默认卡通讲师与可切换角色表 |
| `logoScale` | 可选：logo 缩放（默认 1；9-1/9-2 均用 0.67），author.py 的 doc 里设置、构建时透传 |
| `duration` | 整课时长（秒），由合并音频实测 |
| `slides[]` | 页面数组：`elements`（元素 + `step` 步序）、`bullets`（要点 + 热点/问答）、`stepTimes`、`t_start/t_end`、`laser` |
| `subtitles[]` | 句级字幕（起止时刻 + 文本） |

页面为 1920×1080 设计坐标，元素类型：`text`（富文本，行内公式 `$...$`）、
`tex`（KaTeX 整行公式）、`box`（色块容器）、`table`（网格表格）、
`diagram`（SVG 图示组件，动画由时钟推导相位）、`img`（图片）。
放映时只显示 `step ≤ 当前步` 的元素，与 PPT 点击动画一一对应。

## 已固化的视觉/交互标准

做新课**不要回退**（细节见 `lecture_factory/README.md`）：

| 标准 | 规则 |
| --- | --- |
| 步进标记 | `[[n]]` 放关键词紧前面；不同步拆不同句 |
| 激光点 | 知识点元素底边往下 12px（正下方紧邻） |
| 下划红线 | `important` 元素被指点时起 10 秒，每页最多 3 条 |
| 时间轴效果 | **一律纯派生**：由当前播放时刻直接算出（如红线 = 激光时刻起 10 秒窗口），禁止状态累积——否则拖进度条/回跳/重放必出残留错乱 |
| 矢量符号 | 用 `diagrams.tsx` 的 `Vec` 组件；禁止组合字符（缺字体显方框） |
| 曲线图 | 关于横轴对称，A/−A 虚线贴波峰波谷，周期标注落在一个周期正下方 |
| 图片元素 | 充满 w×h 框（contain）；白底图先转透明 |
| 页脚/页码 | z-index 20 + 白底圆角衬，任何内容遮不住 |
| 文字颜色 | 舞台容器默认 `#111` |
| logo | 每课 `logo.png`，左上角 270×116 乘以 `logoScale`（默认 1，现有课程 0.67） |
| 图上叠加标注 | 故意的图内文字/公式标注（如图角公式牌）加 `overlay=True`，质检器跳过它与图的重叠检查 |
| SVG 图示坐标 | 所有绘制内容必须收在 viewBox 内（质检按未裁剪几何量测，越界即报「文字进图区」）；`OmegaArrow`/`ArcLine` 用**负角度**画上方（屏幕坐标 y 向下） |
| 章节导航 | 默认收起；页码指示器是可点按钮（点它展开/收起，跳页后自动收起）。其文本格式 `id/总数 标题` 被质检器 `pageShown` 依赖，不能改格式 |
| 小人姿态 | 9 基础 + 7 激光变体，立绘在 `public/poses/<角色>/pose_<名>.png`（1200×1500 透明底，三角色同名同义）。**入库前必须归一大小**：新姿态图用 `tools/normalize_poses.py` 的缩放表统一（脚底对齐角色基线 aqiang/zhongshan=1410、professor=1499，比例用 `tools/pose_compare.py` 的红绿叠图人工核定）——不同批次的立绘原始比例不同，不归一会换姿态忽大忽小。激光变体按方位/距离确定性选择（`Teacher.tsx`：高低位按 dy 五档、远指 dx>舞台宽一半、同点指 4 秒画圈——**全部纯派生，禁止组件内定时器**）；新角色按同名 16 张补齐即可即插即用。**姿态语义驱动，不做强制轮换**：没有语义触发时保持讲解姿态，非语义动作只有激光指点、页尾收束（思考/点头）。**语义映射**（`Home.tsx`）：语义词按句内字符位置比例插值出「被说出的时刻」（与构建器步进时刻同算法），说到才换动作不抢拍，句尾剩余 >1.5s 才触发。摊手=提出问题（句尾问号整句触发，或含 为什么/怎么办/如何 等）、指天=得出结论（含 所以/因此/得到/可见/也就是说/结论 等，优先级高于板书）、思考=引导思考（含 想一想/不妨/考虑 等）、板书=推导演算（含 推导/公式/代入/展开/写成 等）；讲稿写作时让语气词落在对应句子里，小人动作自然贴合内容。**emphasis（双手举过头）不进常规轮换**，只在特殊节点出现：整课收尾最后 6 秒，或 important 难点激光刚收笔的 1.8 秒内。激光光点与画圈姿态联动：同一 `elapsed>4` 信号下光点绕目标点转小圈（CSS rotate，半径 34 设计坐标、1.6s 周期），姿态画圈时光点必在画圈 |
| 框体宽度 | `box` 容器内边距 20px/边（共 40）：**声明宽 = 文字净宽 + 40 + 视觉余量（≥30）**。文字净宽估算：汉字/全角标点按 **1.0em**（44 号 ≈44px/字，曾按 34px 估导致 9-1 P5 溢出返工两次），ASCII ≈0.5em、空格 ≈0.3em、行内公式按字符 0.6em；拿不准就浏览器实测。校验器已按「估宽→换行→估高 > 声明 h」自动拦截（ERROR）；播放器 box 高度自适应（`minHeight`）兜底，估窄了也只是框微增高，不再露底 |
| 框体高度 | display 公式（`tex_f`/`tex`）的 `.katex-display` 外边距已全局收紧为 **0.25em**（原 1em 会把框撑高撞下一元素，9-1 P8/P9/P15 教训），**声明 h 按公式真实高度写**（分式 ≈3em、根号套分式 ≈3.5em，或浏览器实测）；box 高度自适应以声明 h 为下限，写小了框会微增并可能与下方元素相撞——质检器按边框盒抓 box 重叠 |
| 质检可见性 | `?qa=1` 必须在**用户正看着的（可见）标签页**里跑：隐藏标签页布局为 0，量出来的全是空盒/假重叠；跑的时候确认「正在检查第 N 页」进度稳定推进，卡住即说明页被切到后台了 |

## 规范校验器

`validate_weblec.py` 把创作约定变成程序约束（构建后自动跑，有 ERROR 即非零退出）：

- 结构：顶层字段、页 id 连续、页面时刻不倒置；
- 步进：`stepTimes` 键集 == 元素 step 集（除基底 0）、时刻在页面区间内、
  相邻间隔 <0.8s 警告（抓同句多 `[[n]]`）；
- 红线：每页 `important` >3 警告；
- 框体：text/box 文字自然宽度估算（CJK 1.0em / ASCII 0.5em / 行内公式 0.6em）——
  box 换行后估高超过声明 h 报 **ERROR**（防 9-1 P5 式溢出），text 估宽超声明宽报 WARN；
- 热点：`elIdx` 有效、热点要点缺预设问答警告；
- 激光/字幕：下标有效、时刻合法、字幕覆盖整课；
- 媒体：img 图片存在、`logo.png`、`audio.mp3` 实测时长与 `duration` 匹配。

## 版式质检器（?qa=1）

数据校验管「字段对不对」，版式质检管「画面好不好看」。交互课堂地址栏加
`&qa=1` 即自动翻完所有页并停在最终步，**在真实浏览器里实测每个元素的渲染框**
（不是声明框），全程本地零 token：

- 出界 / 文-文重叠 / 文字进图区（文-图相交；`overlay=True` 的标注除外）——
  **box 按边框盒、text/tex/diagram 按墨迹盒**判定（box 的背景边框本身就是视觉边界，
  不量边框盒就抓不到 box 撞 box，9-1 P15 教训）；
- 墨迹盒 = 逐文本节点 Range ∪ 无文本视觉 span（KaTeX 分式线/根号线）∪ 内嵌 SVG，
  剔除 `.strut/.pstrut` 撑行杆与 `.katex-mathml` 隐藏源文本——只看「叶子 span」会把
  混排 run 里的裸文本节点丢掉导致虚窄，只取 `.katex-display` 边框盒又带 1em 外边距导致虚撞；
- 每页测量前 `await document.fonts.ready`（KaTeX 字体异步加载，未就绪量公式必偏窄）；
- 框过紧（内容贴边，**纵横双向**：上下余量 <3 或左右余量 <8 即报；左右余量为负
  说明公式已溢出框外——KaTeX 宽度服务端估不准，声明 w 必须靠本检查兜底，9-4 教训）/
  框过松（余量 >70×160，建议收框到余量 20~40×10~25）；
- 「文本框过宽(参考)」只是提示 author 声明宽度比实测大很多——显示端已按
  真实内容宽度自适应（热区/红线/激光都按实测画），不属问题；
- 跳页等 `seeked` 事件并核对页码指示器，音频未缓冲不会拿错页面元数据
  （命中失败会记「质检未命中」警告，该页结果作废）；
- 它能量出 SVG 图示被裁剪的越界绘制（曾抓到 ω 箭头画出 viewBox 导致整段不可见）。

面板「复制报告」可整份贴回给 AI 逐条修。

## 多课并存与课程参数化

- 课件按 `public/weblec/<课名>/` 分目录；URL 带 `?course=<课名>` 加载对应课程；
- 根路径无参数 → 课程列表页（数据源 `courses.json`，新课手动加一行）；
- 批注的浏览器本地存储按课程隔离（`slides-annotations-<课名>`）；
- 单文件导出不依赖 URL 参数（数据内联注入）。

## 批注闭环

1. 课上：静态页按 **A** 进入画笔模式（三色笔、撤销、清除本页、每页文字备注、Esc 退出）；
2. 课后：「导出批注」下载 JSON——每笔自动标注与哪些页面元素重叠（页码 + 元素编号 + 包围盒）；
3. 回改：按 JSON 定位元素，修改 `author.py` 或 `weblec.json`，重跑构建与导出。

批注持久化在浏览器 localStorage，刷新不丢；导出前建议先下载备份。

## 环境准备与迁移

**本机已就绪**：Node.js、Python（含 imageio-ffmpeg，ffmpeg 内置）、
Kimi 桌面端配音插件（TTS 通道，密钥在 Kimi 运行时）、Tectonic（`tools/`）。

**迁移到新机器**：

1. 克隆本仓库；
2. `cd interactive-lecture && npm install`；
3. 安装 Python 依赖：`pip install imageio-ffmpeg`（TTS 走 Kimi 配音插件，
   或自行替换 `gen_audio.py` 的 `tts()` 通道）；
4. AI 答疑：新建 `interactive-lecture/.env.local`（**不入库**）：
   ```
   AI_API_KEY=sk-...
   AI_BASE_URL=https://api.moonshot.cn/v1   # 可选
   AI_MODEL=moonshot-v1-8k                  # 可选
   ```
   不配 key 时答疑自动退回离线预设库，不影响放映；
5. 需要编译方案文档时，安放 Tectonic 到 `tools/tectonic.exe`
   （<https://github.com/tectonic-typesetting/tectonic/releases>）。

**已提交的产物**：四门课的 `public/weblec/<课名>/`（含合并音频）、TTS 缓存、
姿态图——克隆后无需重新构建即可运行现有课程。
**未入库**：`node_modules/`、`dist*/`、`待处理/`（旧方案与各课源 PPT 归档）、`.env.local`、`tools/tectonic.exe`。

## 版本控制约定

- **提交粒度**：一门新课 / 一次视觉标准调整 / 一个脚手架改动，各一次提交；
- **提交信息**：`课程: <课名> <改动>` 或 `工厂: <改动>` / `应用: <改动>`；
- **author.py 与 weblec.json 一起提交**（数据源与产物同步，便于回溯）；
- **大返工前先打标签**：如 `git tag shm-v1`（某课定稿）；
- `.gitignore` 已排除依赖、构建产物、密钥与归档目录，勿强行 `git add -f`。

## 故障排查

| 症状 | 排查 |
| --- | --- |
| 页面空白/一直加载 | 终端确认 dev server 在跑；浏览器控制台看 `weblec.json` 是否 404（多为 `?course=` 与目录名不一致） |
| 步进重合/一跳多步 | 讲稿同句有多个 `[[n]]`，拆句后删该页音频缓存重跑构建 |
| 公式显示方框/源码 | 用了组合字符矢量符号（改用 `Vec`）；或 KaTeX 语法错误（控制台有告警） |
| 配音没更新 | 忘了删 `课程/audio/` 缓存；删后重跑 `build_web.py` |
| 构建末尾报错退出 | 读 `validate_weblec.py` 的 ERROR 列表逐条修（WARN 不阻塞） |
| 单文件里图片裂了 | 图片没放进 `public/weblec/<课名>/` 或文件名与元素 `src` 不一致 |
| 答疑 503 | `.env.local` 未配 `AI_API_KEY`（已自动退回离线答疑库，属正常降级） |
