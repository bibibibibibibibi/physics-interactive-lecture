# 大学物理交互课堂

把传统 PPT 课件升级为**网页课件**：一次制作、两种产品——

- **交互课堂**：带配音、卡通讲师、激光笔指点、知识点热点与 AI 答疑的网页课堂；
- **静态幻灯片**：HTML 放映页，支持翻页笔逐步揭示、动画图示与课堂批注；第九章单文件可双击，special 八课和含嵌入实验的基础课使用本地 HTTP 服务。

两个产品共用同一份课件数据（`weblec.json`）与同一个渲染组件，版式、公式、步进顺序逐帧一致。
除内容创作外，构建、导出、校验等环节全部脚本化，**不消耗 AI token**（已有课程的在线 TTS 可能产生 API 费用；`pre_vector` 当前使用在线神经语音，也保留 Mac 系统语音离线配音脚本）。

> 正式的《制作方案》见 `docs/大学物理交互课堂制作方案.pdf`（LaTeX 源文件同目录）；
> 工厂脚本的细粒度约定见 `lecture_factory/README.md`。

---

## 产物说明（clone 下来什么能直接用）

| 目录 | 是什么 | 怎么用 |
| --- | --- | --- |
| `interactive-lecture/dist/` | **本地课堂部署版**（第九章八课、基础课 `pre_vector`、专题 sp1–sp8；菜单保留技术复核与人工核准的状态说明） | **Windows 双击 `启动交互课堂-win.bat`、Mac 双击 `启动交互课堂-mac.command`**，自动起本地服务并打开浏览器；也可整个拷到静态服务器。不能双击 index.html，课件 JSON 需走 HTTP |
| `interactive-lecture/slides-export/` | **静态幻灯片**（第九章8份单文件、专题8份HTTP媒体版及2份旧审阅兼容入口） | 第九章双击即开；专题媒体版需通过本地HTTP服务，支持翻页笔与课堂批注 |
| 其余全部（`src/`、`public/`、`lecture_factory/`、各配置文件） | 制作与开发体系 | 只有要做新课／改代码时才需要：`npm ci` 后进入开发模式 |

一句话：**用课 = 取 `dist/` 或 `slides-export/`；做课 = 全部**。

---

## 目录

- [产物说明](#产物说明clone-下来什么能直接用)
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
- [Windows 与 Mac 共用项目](#windows-与-mac-共用项目)
- [版本控制约定](#版本控制约定)
- [故障排查](#故障排查)

---

## 快速开始

```bash
# 1. 启动网页应用（开发模式）
cd interactive-lecture
npm ci               # 首次，按锁文件安装当前系统所需的依赖
npm run dev          # → http://localhost:3000（本机由 Kimi Work 托管时映射为 7100）

# 2. 浏览器打开
#    http://localhost:7100/                    课程列表
#    http://localhost:7100/?course=shm        交互课堂（简谐振动）
#    http://localhost:7100/slides.html?course=shm   静态幻灯片

# 3. 导出单文件幻灯片（双击即开，可拷给学生）
cd ..               # 回到仓库根目录；python 使用下文的虚拟环境
python lecture_factory/export_slides.py --build --course shm
#    → interactive-lecture/slides-export/大学物理-<标题>-幻灯片.html
```

现有课程：**shm**（9-1 简谐振动）、**rotvec**（9-2 旋转矢量）、**pendulum**（9-3 单摆和复摆）、
**energy**（9-4 简谐振动的能量）、**compose**（9-5 简谐振动的合成）、
**damping**（9-6 阻尼振动 受迫振动 共振）、**emosc**（9-7 电磁振荡）、
**nonlinear**（9-8 简述非线性系统，11 页，约 6 分钟）。第九章完结。
专题系列入口为 `/?menu=special`，清单在 `public/weblec/courses_special.json`，包含 **sp1–sp8** 八个学时，**8个交互课堂入口均已开放**。各课已有真实配音及范围明确的统一技术复核；全课人工完整听感和最终教师教学核准仍待确认。**sp1修订版**为17页、170句Yunxi配音，真实音轨19分15.108秒；原PPT内容/任务、物理与媒体已独立复核，字幕、5题、3模拟、2视频、热点、全屏和两静态入口已验；用户原有浏览器已刷新，从目录进入并真实播放/暂停。**sp3**为25页、20分43.436秒，原用户环境的局部播放记录仍保留其原范围。不能把菜单可见、技术通过或局部播放等同于完整人工教学交付。逐课事实、根因和下一批方案见 [专题系列复盘](docs/special-series-review.md)；执行规则、单课清单与子任务/中央模板统一见 [专题制作规范](lecture_factory/专题课件制作经验.md)。各课静态入口由 `slidesUrl` 指定，含模拟/视频使用本地HTTP服务；sp1旧纠错静态书签也已接到当前修订稿，原文件保留。
sp2 修订版为 21 页、实测 21 分 03 秒，包含 4 道随堂选择题、源课件实验视频和开关／铜管两个可操作模拟；交互入口 `/?course=sp2`，教师放映入口 `slides.html?course=sp2`。导出文件 `slides-export/大学物理-电磁感应定律-幻灯片-HTTP.html` 内联公式、字体和图片，视频及模拟通过 `/weblec/sp2/` 加载，须走 HTTP。创作与重建说明见 `lecture_factory/courses_web/sp2/README.md`。
课前数学基础另有 **pre_vector**《0-1 矢量代数》（19 页），入口 `/?menu=foundation`；第 5、6、11、12 页带可拖动矢量实验，第 4、9、13、19 页有课堂互动题。目前交互课堂使用 `zh-CN-YunxiNeural` 配音。嵌入实验依赖 HTTP 服务，静态放映请打开 `slides.html?course=pre_vector`。

修改讲稿后，先运行 `lecture_factory/courses_web/pre_vector/author.py`，再从项目根目录运行 `.venv/bin/python lecture_factory/courses_web/pre_vector/make_audio_neural.py --pages 1`（把 `1` 换成改动页；省略 `--pages` 则生成全部 19 页）。需先在 `interactive-lecture/` 运行 `npm ci`，并保持联网。脚本把 24 kHz／96 kbps 单声道 MP3、逐句时间轴暂存到 `.local-backups/pre-vector-neural-stage/`，不会直接覆盖当前课堂；可用 `--volume '+30%'` 和 `--output-dir` 调整。试听后，备份并将暂存目录内对应页的 `audio/page<n>.mp3` 和 `page<n>.times.json` **一起**复制到 `lecture_factory/courses_web/pre_vector/`，再运行 `.venv/bin/python lecture_factory/build_web.py lecture_factory/courses_web/pre_vector`，最后在 `interactive-lecture/` 运行 `npm run build`。原 Mac 系统语音脚本 `make_audio_mac.py` 可用于离线配音，但音色不同。

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
│   ├── dist/                     # 已构建产品：含 -win.bat/-mac.command 两个启动入口
│   ├── scripts/copy-launchers.mjs # 两个平台共用的启动器复制脚本
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
│   ├── courses_web/<课名>/       # author.py、slides.json、assets、页音频与逐句时间/来源元数据
│   └── README.md                 # 工厂细粒度约定
│
├── docs/                         # 制作方案.tex/.pdf、special系列证据复盘
├── .github/workflows/             # Windows/macOS自动验证配置
├── work/                         # 候选、构建缓存、QA证据、整理保留记录和服务PID（不入Git）
├── tools/                        # 可放本机 Tectonic：Windows .exe、Mac 无后缀
├── export_ppt_win.ps1            # Windows PowerPoint COM 导出原 PPT 的图片/备注/PPTX
├── export_pdf_mac.py             # Mac 流程：PowerPoint 导出 PDF 后转逐页 PNG
├── parse_pptx.py / extract_geometry.py  # 两个平台共用的 PPTX 动画与形状解析
└── 待处理/                       # 归档区（.gitignore 排除）：旧视频方案、中间产物、
                                #   调试图、9-1~9-4 源 PPT 与分析产物、logo 源图
```

## 做一门新课的完整流程

本节九环是常规课的既有接口说明。**special专题执行[11阶段制作、分工与验收规则](lecture_factory/专题课件制作经验.md)**：配音前独立冻结、私有候选隔离、中央串行集成及实际用户/人工核准；本节直接build/public登记、qa巡页、默认npm构建和入库命令不能代替专题晋级。`qa=1`只作诊断，不与普通课堂自然播放/手动验收并跑；`qa=0`也会开启当前自动巡页。

以「9-2 旋转矢量」为例，九环链路（◆=AI 教学判断环节，其余全脚本）：

### 第 1 环：PPT 解析（0 token）

```powershell
# Windows：原 PPT 逐页导出 PNG（调本机 PowerPoint）
powershell -File export_ppt_win.ps1 <PPT路径>
```

Mac：先在 PowerPoint 中把源文件导出为 **PDF，布局选择幻灯片（非讲义或备注页）**，
再运行以下命令。需要 Poppler 的 `pdftoppm`；若使用 Homebrew，可通过
`brew install poppler` 安装，也可用 `--pdftoppm /完整路径/pdftoppm` 指定已有工具。

```bash
python export_pdf_mac.py "课程.pdf" "课程图片"
# → 课程图片/slide_01.png、slide_02.png …；宽 1920，保持原比例
```

默认拒绝覆盖已有图片；确认需要重导出时加 `--overwrite`，若旧目录有多余页请改用新目录。
PDF 只提供静态视觉基准，不包含动画步序和备注。若原文件是 `.ppt`，请先在 PowerPoint
另存为 `.pptx`，再在两种系统上运行相同的解析命令：

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

### 第 8 环：产品同步入库（0 token）

两种最终产品**有意纳入 git 跟踪**，每次课程定稿（含任何版式/讲稿修改）后都要重建并提交，
GitHub同步以本次核准的正式产品为准；不得以重建或提交代替课程教学验收：

```bash
cd interactive-lecture && npm run build && cd ..   # 重建 dist/（交互课堂部署版）
python lecture_factory/export_slides.py --build    # 重导出 slides-export/（静态幻灯片）
python -B interactive-lecture/scripts/check-release.py --no-git-check
# 核对改动清单后只暂存本次正式范围
git add <核准的路径>
python -B interactive-lecture/scripts/check-release.py --check-index
git commit -m "课程: …"
git push origin main
```

- `interactive-lecture/dist/`：交互课堂部署版，拷到任意静态服务器即跑；
- `interactive-lecture/slides-export/`：单文件幻灯片，GitHub 上直接下载分发；
- 注意 `interactive-lecture/.gitignore`（Vite 模板）原有的 `dist` 忽略已移除，
  新增课程/应用模板时不要再把 `dist`、`slides-export` 加回忽略；
- 本地启动器母版在 `lecture_factory/assets/launcher/`：Windows 使用 `启动交互课堂-win.bat` + `serve-win.ps1`，
  Mac 使用 `启动交互课堂-mac.command` + `serve-mac.py`。`npm run build` 后由 Node `postbuild` 脚本统一拷入 dist，
  无需 Windows 的 `xcopy`；发布时保留全部启动器文件。Vite设置 `emptyOutDir:false`，启动器复制保留旧名称，避免构建永久删除旧资源；这不等于整课多文件事务或统一发布锁，专题仍须隔离候选、串行集成和失败回滚。

### 第 9 环：交付与课后闭环

交付课堂链接 + 单文件。课上用静态页批注（A 键）→ 课后「导出批注」得到 JSON
（每笔自动标注圈住了哪个元素）→ 回改数据源 → 重跑第 4、7 环。

## 日常使用命令

下表是常规接口速查；专题按唯一规范核对实际入口的授权守卫、暂存输出与保留策略，未审默认构建不用于专题发布。既有可用课堂维持到修订候选验收替换，不以改稿开始为下架条件。

| 目的 | 命令 |
| --- | --- |
| 启动开发服务 | `cd interactive-lecture && npm run dev` |
| 构建/重建某课 | `python lecture_factory/build_web.py courses_web/<课名>` |
| 校验某课 | `python lecture_factory/validate_weblec.py <课名>` |
| 导出单文件幻灯片 | `python lecture_factory/export_slides.py --build --course <课名>` |
| 类型检查 | `cd interactive-lecture && npx tsc --noEmit -p tsconfig.app.json` |
| 生产构建（应用） | `cd interactive-lecture && npm run build` |
| 编译方案文档 | `cd docs && ../tools/tectonic.exe -X compile 大学物理交互课堂制作方案.tex` |

**改讲稿的正确姿势**：先保留当前候选及其版本绑定，再改 `author.py` 并生成 `slides.json`。
逐句核对讲稿、声音参数、MP3 与 times 的签名；在本课暂存目录重配确有变化的句子，
同步重建受影响页、整轨、字幕、步进和题卡时刻。缓存不成对、文字不符或实际留白不足时应拒绝复用，
不能按旧页码或句下标强行套用，也不能以删除缓存代替版本检查。
网页课程的 times 通常位于 `courses_web/<课>/page<n>.times.json`，以本课实际管线为准。
暂存候选验收后由集成负责人增量替换正式成果；确需删除文件时使用系统回收站。
专题课按 [专题制作规则与交接清单](lecture_factory/专题课件制作经验.md) 执行，外发配音先核对已有授权范围。

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

仅播放已有课件无需安装 Node 或配音工具。Mac 的 `.command` 启动器需要 Python 3.8+，
从 8080 开始寻找可用端口（最多到 8090），服务启动后打开浏览器，只监听本机。
ZIP 解压后若丢失执行权限，在 `interactive-lecture/dist/` 下执行
`chmod +x 启动交互课堂-mac.command`。Windows 双击 `启动交互课堂-win.bat`，固定调用 Windows 自带 PowerShell 5.1，无需 Python、Node 或管理员权限。启动器仅监听本机，支持媒体分段读取、拖动和并行加载；从8080寻找可用端口至8090。启动器与完整dist保持在一起，路径可含中文和空格。

开发环境：Node.js `^20.19.0 || >=22.12.0`、Python 3.9+。
Windows 和 Mac 分别安装本机依赖，**不要互相复制 `node_modules/` 或 `.venv/`**。

```bash
# Mac：在仓库根目录建立独立 Python 环境
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

```powershell
# Windows PowerShell：在仓库根目录执行
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
# 后续 python 命令可替换为 .\.venv\Scripts\python.exe，无需修改执行策略
```

```bash
# 两种系统的前端命令一致
cd interactive-lecture
npm ci
npm run dev          # http://localhost:3000
# 发布前运行 npm run build（TypeScript 检查 + Vite + 双平台启动器）
```

配音继续使用 Kimi 的 `audio_generation_tool.py`，通过环境变量指定，项目不再绑定某位
Windows 用户的目录。Mac 在运行构建的同一个终端设置：

```bash
export KIMI_AUDIO_TOOL="/实际安装路径/audio_generation_tool.py"
# 可选：插件需要独立运行环境时，指定该环境的 Python
export KIMI_AUDIO_PYTHON="/实际安装路径/python3"
```

Windows PowerShell 对应设置 `$env:KIMI_AUDIO_TOOL = 'C:\实际路径\audio_generation_tool.py'`；
`KIMI_AUDIO_PYTHON` 同理。未配置路径时，Windows 会尝试当前用户 `%APPDATA%` 下原有 Kimi
插件目录。默认用运行工厂脚本的 Python。工具及其依赖、认证需在本机可用；**设置路径本身
不等于已安装配音服务**。完整页面音频缓存可直接复用，无需配置 TTS；需要重配时会先检查
配置，再处理句音频缓存。以上环境变量由终端提供，不会自动读取 `.env.local`。

AI 答疑：新建 `interactive-lecture/.env.local`（**不入库**）：

```dotenv
AI_API_KEY=sk-...
AI_BASE_URL=https://api.moonshot.cn/v1   # 可选
AI_MODEL=moonshot-v1-8k                  # 可选
```

不配 key 时答疑自动退回离线预设库，不影响放映。

编译方案文档时使用对应系统的 Tectonic：Windows 可用 `tools/tectonic.exe`，Mac 使用
已安装的 `tectonic` 或 `tools/tectonic`，在 `docs/` 下执行
`tectonic -X compile 大学物理交互课堂制作方案.tex`。该工具不参与课件播放或网页构建。

字体：课件含宋体（SimSun）设置；Mac 若缺该字体会使用回退字体，可能改变换行。
导入 PPT、换机器制作或换字体后应在 `?course=<课名>&qa=1` 下检查版式，勿仅凭构建成功验收排版。

**已提交的产物**：各课的 `public/weblec/<课名>/`（含合并音频）、TTS 缓存、
姿态图，以及**最终产品** `interactive-lecture/dist/`（交互课堂部署版）与
`interactive-lecture/slides-export/`（第九章8份单文件、专题8份HTTP版及2份旧审阅兼容入口）——克隆后无需重新构建即可运行、部署、分发。
**未入库**：`node_modules/`、`.venv/`、`.local-backups/`、`work/`、`dist-slides/`（幻灯片中间构建产物）、
`待处理/`（旧方案与各课源 PPT 归档）、`.env.local`、Tectonic 本机可执行文件。

## Windows 与 Mac 共用项目

`main` 是两种系统共用的项目分支。课程源文件、课件数据、音频、React 页面与构建命令
保持一份；新增课程时改一次并提交到 `main`，两台电脑各自拉取更新与安装本机依赖。
仅启动课件和从 PowerPoint 提取图片需要选择系统入口：

| 操作 | Windows | Mac |
| --- | --- | --- |
| 播放 `dist/` | `启动交互课堂-win.bat`（始终调用 `serve-win.ps1`） | `启动交互课堂-mac.command`（调用 `serve-mac.py`） |
| 从 PPT 得到逐页 PNG | `export_ppt_win.ps1`，直接调用 Windows PowerPoint | 先在 PowerPoint 导出 PDF，再运行 `export_pdf_mac.py`；需要 `pdftoppm` |
| 前端构建 | `npm ci && npm run build` | `npm ci && npm run build` |
| 生成新配音 | Kimi 插件默认从当前用户 `APPDATA` 查找，或设置 `KIMI_AUDIO_TOOL` | 设置 `KIMI_AUDIO_TOOL` 指向 Mac 上可运行的插件 |

两台电脑不要互相复制 `node_modules/` 或 `.venv/`。`export_pdf_mac.py` 的 PDF 转 PNG
功能本身也能在 Windows 运行；文件名标明它在本项目中的 Mac PPT 工作流程。若需跨平台
运行该工具，仍可以使用同一个文件，不需要复制实现。

适配检查命令（Python 使用上述虚拟环境；PDF 渲染测试需 Poppler）：

```bash
python -B -m unittest discover -s tests -v
python -B interactive-lecture/scripts/test-launchers.py
cd interactive-lecture
npm run test:launchers
npm run build
npm run build:slides
```

此前在Mac完成的检查保留原有范围。当前跨平台验收入口如下；Windows测试在Mac会明确跳过，不能计为Windows通过。CI结果以对应提交的GitHub Actions记录为准。

**2026-10-08实测通过**：[提交283c7d2的Windows/macOS验证](https://github.com/bibibibibibibibi/physics-interactive-lecture/actions/runs/37721897581)。Windows使用PowerShell5.1和Edge153：中文/空格路径启动、端口回退、媒体Range传输、八课目录/音轨元数据、special及普通入口首次持续播放、迟载/读取失败重试、第1学时首题2.5倍暂停与继续、原生视频和WebGL回拖通过。首次播放换源竞态已定位并最小修复，原失败保留于既有复盘。用课只需双击`dist/启动交互课堂-win.bat`，无需Python、Node或管理员权限；开发和测试才需要安装上述依赖。此范围不代替八课全套用户操作、完整听审及教师核准。

```powershell
# 真实Windows：PowerShell5.1、中文/空格路径、端口回退、206/HEAD/416和并发
py -3 -B interactive-lecture/scripts/test-windows-launcher.py
# 两系统均可：正式资源、数据/音频一致性与Git跟踪完整性
py -3 -B interactive-lecture/scripts/check-release.py
# Windows Edge课堂冒烟；先在interactive-lecture执行npm ci
node interactive-lecture/scripts/test-windows-browser.mjs
```

浏览器测试只证明指定提交的目录、课堂播放/暂停和媒体加载/seek技术行为，不能代替完整人工听审、教师核准或全部真实操作。PowerPoint COM、外发TTS和完整重新制作仍需本机工具、素材和有效授权。部分special重建依赖被忽略的work脚本/缓存，sp2历史素材脚本仍有Mac来源路径；正式播放产物与公共开发工具随Git提供，八课一键完整重建尚未实现。

## 版本控制约定

- **提交粒度**：一门新课 / 一次视觉标准调整 / 一个脚手架改动，各一次提交；
- **提交信息**：`课程: <课名> <改动>` 或 `工厂: <改动>` / `应用: <改动>`；
- **author.py 与 weblec.json 一起提交**（数据源与产物同步，便于回溯）；
- **大返工前先打标签**：如 `git tag shm-v1`（某课定稿）；
- `.gitignore` 排除依赖、中间产物、密钥、work与归档；dist、slides-export是正式交付例外，继续跟踪，不强行 `git add -f`。
- 整理前保存Git差异及待移文件的可恢复记录。FFmpeg清单归入work，不提交陈旧本机绝对路径；页音频、句缓存、times和来源元数据按制作需要保留。
- 提交前核对真实入口、public/dist、导出及旧书签依赖；旧哈希资源保留兼容，不凭文件名或mtime删除。前置检查失败即停止后续动作，避免全量候选误入库。
- `.github/workflows/portability.yml` 在Windows/macOS检查正式资源、构建和启动器；Windows使用PowerShell5.1及真实Edge。技术结果与人工听审、教师核准分开记录。

## 故障排查

| 症状 | 排查 |
| --- | --- |
| 页面空白/一直加载 | 终端确认 dev server 在跑；浏览器控制台看 `weblec.json` 是否 404（多为 `?course=` 与目录名不一致） |
| 步进重合/一跳多步 | 讲稿同句有多个 `[[n]]`；拆句后保留旧候选，在本课暂存目录重配并同步重建音频、逐句时间和步进 |
| 公式显示方框/源码 | 用了组合字符矢量符号（改用 `Vec`）；或 KaTeX 语法错误（控制台有告警） |
| 配音没更新 | 检查当前讲稿与 times 的逐句全文和声音参数；保留旧缓存，在本课暂存目录重配。`build_web.py` 会拒绝复用文字不符或不成对的页缓存 |
| 构建末尾报错退出 | 读 `validate_weblec.py` 的 ERROR 列表逐条修（WARN 不阻塞） |
| 单文件里图片裂了 | 图片没放进 `public/weblec/<课名>/` 或文件名与元素 `src` 不一致 |
| 答疑 503 | `.env.local` 未配 `AI_API_KEY`（已自动退回离线答疑库，属正常降级） |
