# 大学物理课程视频工厂

> **归档说明（2026-09-27）**：旧「视频渲染」方案（`build.py` / `new_course.py` / `courses/` /
> `script_template.json`、网页端 `VideoStage` + `video.mp4` + `lecture.json` + `timeline.json`）
> 已整体归档到 `../待处理/旧视频方案/`，下文「一致性的来源」「做新一集的步骤」两节描述的是该旧方案，
> 仅作风格沿革参考。**当前生产方案是「网页版课件管线」**，见本文「网页版课件」一节起。

把「简谐运动」那一集的所有风格要素固化成模板，之后每集只需换一个 `script.json`，
即可产出完全同风格的讲授视频。

## 一致性的来源（不要改）

| 要素 | 固化位置 |
| --- | --- |
| 白底黑字幻灯片、金黄/亮蓝点缀色、浅灰页眉、字号、要点排版 | `style.json` 的 `colors`/`layout` |
| 卡通讲师形象（可切换） | 角色目录 `assets/characters/<id>/pose_*.png`，显示名在 `assets/characters/characters.json`；视频用哪个角色由 `style.json` 的 `character` 或 `script.json` 的同名字段决定；网页端点击小人即可在角色间切换并记住选择。当前：「阿强」`aqiang`（参考图 `assets/character_ref_aqiang.png`）、「博士讲师」`professor`、「中山装先生」`zhongshan`（参考图 `assets/character_ref_zhongshan.png`）。六姿态统一 1200×1500 画布、人物同高 1320px：`pose_wave`（开场挥手）、`pose_point_up`（页首强调）、`pose_explain`（讲解）、`pose_laser`（激光笔平指）加方向变体 `pose_laser_up` / `pose_laser_down`（网页端按小人与光点的相对方位自动选用，配合水平镜像共覆盖 6 个指向；视频内小人固定右下角，只用平指）、`pose_think`（收尾思考）、`pose_emphasis`（强调）；加新角色时给参考图批量生成这八张姿态即可 |
| 讲师动作编排（与交互网页同一状态机） | 第一页前 6 秒挥手 → 每页开头 2.5 秒举手 → 12%~88% 激光逐条指点 → 最后 4 秒思考，其余讲解/强调每 8 秒交替 |
| 激光笔指点动画 | 小红点（36px）由 `build.py` 按要点位置自动计算，落在该行文字下方附近、固定不晃悠；网页端红点会在要点间平滑移动 |
| 重要知识点下划红线 | 仅 `script.json` 里标了 `"important": true` 的要点（每页最多 3 条，只标最核心的）：被激光指点时文字下方出现红线，持续 10 秒；视频完整版与网页端规则一致 |
| 交互层数据 | 构建时输出 `timeline.json`（每页起止时间 + 激光时间表）和 `lecture.json`（句级字幕时间轴 + 要点问答），并自动同步到 `../interactive-lecture/public/`（网页端已有 lecture.json 时不覆盖，避免丢掉手工补充的问答） |
| 配音（逐句 TTS + 句间停顿） | `gen_audio.py`：讲稿按句拆分逐句配音，句号后停 0.4s、？！后停 0.65s，并写出 `audio/vo<n>.json` 句级真实时间轴（字幕按它精确对齐语音）。音色按角色选择：`style.json` 的 `voices` 映射（阿强=活力青年男声，博士/中山装=沉稳中年男声，`voice_id` 为兜底）；改讲稿或换音色后删掉 `audio/vo<n>.mp3` 和 `vo<n>.json` 重跑即可（逐句缓存 `_s*.mp3` 可保留以省 TTS 调用） |
| 1920×1080 / 30fps / H.264+AAC | `style.json` + `build.py` |
| 片头规则（大标题 + 副标题 + 余弦曲线 + 英文名） | `build.py` 的 title 页逻辑 |

## 做新一集的步骤

1.  scaffold 建目录：

   ```
   python new_course.py 光的干涉
   ```

2. 编辑生成的 `courses/光的干涉/script.json`：
   - 每页 `heading` / `nav_title`（网页章节短名）/ `bullets`（3~4 条）/ `narration`（讲稿，80~150 字）
   - 要点可以写成 `{text, qa, hotspot, important}` 字典：`qa`/`hotspot` 决定网页上的可点击提问热点；`important` 决定激光指点时的下划红线（每页最多 3 条，只标最核心的）
   - 可选图示 `diagram`：`spring`、`cosine`、`energy`、`spring+pendulum`、`cosine+formula`（也可省略）
   - 可选 `character`：视频出镜角色（`aqiang` / `professor` / `zhongshan`），省略用 `style.json` 默认
3. 运行：

   ```
   python build.py "courses/光的干涉"
   ```

   自动生成幻灯片 → 逐句配音（已存在的 mp3 会跳过，改讲稿后删掉对应 `audio/vo*.mp3` 和 `vo*.json` 即可重配）→ 合成视频。
4. 成品在课程目录下：完整版 `<filename>.mp4`（烧录小人，可单独分发）和净版 `<filename>_clean.mp4`（网页交互层用）；`timeline.json` / `lecture.json` 自动同步到网页端。

## 交互网页层（`../interactive-lecture/`，与视频同一套状态机）

以下行为已固化在网页端，所有集共用，不需要逐集配置：

| 行为 | 规则 |
| --- | --- |
| 字幕栏 | 右栏可滚动完整字幕 + 自动跟随当前句；点击字幕句可带着上下文提问 |
| 知识点热点 | 与幻灯片行首黄点重合的隐形热区，悬停显描边，点击自动提问「请讲解这个知识点」 |
| AI 助教 | 接入 DeepSeek（`/api/ask` 代理，key 在 `.env.local`）；答不上时给出「你是不是想问」候选 |
| 激光小光点 | 网页层按 `lecture.json` 坐标渲染，要点间平滑滑行，不晃悠 |
| 下划红线 | `important` 要点被指点时起 10 秒，每页最多 3 条 |
| 小人 | 16 姿态（9 基础 + 7 激光变体）：点击切换角色（记住选择）；按住可全网页拖动；激光指点时按方位/距离自动选变体（高举/斜上/平指/远指/侧身/俯身/画圈）并镜像；反问句摊手、页末思考/点头轮换、讲解/强调/板书 8 秒轮换；全屏切换时回到默认右下角 |
| 倍速 | 1/1.5/2/2.5 浮动条，初始视频上方正中，可拖动 |
| 全屏 | 自定义按钮（在小人脚下），对整个容器全屏，小人/光点/红线/倍速都保留 |
| 章节导航 | **默认收起**；点进度条右侧页码指示器（`8/9 振动特征`）展开/收起，跳页后自动收起；一行排列，超长省略号 |

### 网页组件包（`../interactive-lecture/src/`）

上述行为已按模块拆成可复用组件，做新页面时直接组装即可：

| 文件 | 内容 |
| --- | --- |
| `lib/lecture.ts` | 全部数据类型（Timeline/Lecture/Bullet/Sub…）、`VIDEO_W/H`、`RATES`、姿态清单、公式渲染与离线匹配工具函数 |
| `lib/qa.ts` | 答疑逻辑：`aiAnswer`（`/api/ask` 代理，失败自动退回）+ `offlineAnswer`（预设问答 → 讲解原文 → 候选问题） |
| `components/lecture/VideoStage.tsx` | 视频舞台：容器级全屏、热点热区、激光点、红线、倍速浮条、全屏按钮、小人的挂载点 |
| `components/lecture/Teacher.tsx` | 卡通讲师：姿态图切换、点击换角色、全网页拖动（6px 阈值区分点击/拖动）、激光朝向自适应 |
| `components/lecture/RatePill.tsx` | 倍速浮动条 |
| `components/lecture/ChapterNav.tsx` | 章节导航 |
| `components/lecture/HotspotList.tsx` | 「本页关键知识点」列表面板 |
| `components/lecture/SubtitlePanel.tsx` | 字幕滚动列表（自动跟随当前句） |
| `components/lecture/TutorPanel.tsx` | AI 助教聊天区（上下文标签、候选问题、输入框） |
| `components/lecture/Sidebar.tsx` | 右栏容器：宽度/字幕高度拖拽、整体收起展开 |
| `pages/Home.tsx` | 组合根：拉取数据、时间轴状态机（姿态/激光/红线）、提问上下文与对话状态 |

## 建议约定

- 每集 5~7 页，总时长 3~4 分钟，节奏与第一集一致
- 讲稿口吻统一：第二人称、口语化、每页一个核心概念
- 新图示优先在 `build.py` 的 `DIAGRAMS` 里加可复用函数，而不是一次性画法
- 公式一律用 matplotlib 数学语法 `$...$`，避免特殊 Unicode 字符缺字形

## 网页版课件（PPT 直接转网页，`courses_web/`）

「简谐振动（振幅 周期和频率 相位）」一集走的新管线：不生成 mp4，幻灯片本身用
HTML/SVG/KaTeX 实时渲染，视觉上对齐老师真实 PPT 的版式与点击动画。

### 做新的一课

1. 脚手架建目录（含示例页与全部创作约定注释）：

   ```
   python new_webcourse.py 光的干涉
   ```

2. 编辑 `courses_web/光的干涉/author.py`：对照 PPT 逐页写 `elements`（辅助函数
   `text/tex/box/diagram/img/table/R` 来自共享库 `web_author.py`）与讲稿。
3. 生成 + 构建：

   ```
   python courses_web/光的干涉/author.py
   python build_web.py courses_web/光的干涉
   ```

### 各环节位置

| 环节 | 位置 |
| --- | --- |
| 创作共享库（元素辅助函数、配色常量、创作约定） | `web_author.py`（课程 author.py 顶部 `from web_author import *`） |
| 页面规格 + 讲稿 | `courses_web/shm/author.py`：16 页，每页 `elements`（1920×1080 设计坐标，元素带 `step` 步序对应 PPT 点击动画）+ `narration`（讲稿，用 `[[n]]` 标记第 n 步揭示时机） |
| 构建 | `build_web.py courses_web/shm`：逐句 TTS（缓存 `audio/page<n>.mp3` + `page<n>.times.json`，改讲稿后删这两个文件重跑；重配时自动清掉该页旧句音频，不会按旧下标错配）→ 合并 `audio.mp3` + 输出 `weblec.json`（含 `stepTimes` 步进时刻表）到 `../interactive-lecture/public/weblec/<课名>/`（课名=课程目录名）；末尾自动跑 `validate_weblec.py` 规范校验，有 ERROR 非零退出 |
| 校验 | `validate_weblec.py <课名>`：结构/步进时刻/红线规则/热点问答/激光/字幕/媒体 0-token 校验（独立可用，构建时已自动挂接） |
| 多课并存 | 课件按 `public/weblec/<课名>/` 分目录；URL 带 `?course=<课名>` 加载对应课程（`/?course=shm` 交互课堂、`/slides.html?course=shm` 静态页）；根路径无参数显示课程列表，清单在 `public/weblec/courses.json`（新课手动加一行） |
| 舞台引擎 | `src/components/lecture/SlideStage.tsx`：音频时钟驱动步进揭示、激光点、红线、热点；授课键盘控制（空格播放/暂停、←→ 暂停时按步进翻/播放时按页跳、B 黑屏、F 全屏，兼容翻页笔） |
| 图示库 | `src/components/lecture/diagrams.tsx`：SVG 图示；`spring_anim` 等动画由主时钟 `t` 推导相位（4.5s 一个周期），隐藏标签页/倍速/拖进度都不乱 |
| 视觉基准 | `ppt_ref_slides/slide_01..16.png`（原 PPT 导出图）、`ppt_structure.json`（动画步序）、`ppt_geometry.json`（形状几何） |

### 已固化的视觉/交互标准（本轮打磨结论，做新课时不要回退）

| 标准 | 规则 |
| --- | --- |
| 步进标记位置 | `[[n]]` 放在关键词**紧前面**（不是句首）；引擎按句内字符比例插值时刻，激光/红线在知识点正好被念到时出现 |
| 讲稿断句 | 不同步的标记拆到不同句，避免同句多标记共享时刻 |
| 激光点 | 知识点元素底边往下 12px（正下方紧邻，文字/公式/图片同一规则） |
| 下划红线 | `important` 元素被指点时起 10 秒，每页最多 3 条 |
| 时间轴效果 | **一律纯派生**：由当前播放时刻直接算出（红线 = 激光时刻起 10 秒窗口、动画相位 = 主时钟推导），禁止状态累积——否则拖进度条/回跳/重放必出残留错乱 |
| 矢量符号 | 用 diagrams.tsx 的 `Vec` 组件（字母+手绘箭头）；禁止 `⃗` 组合字符（缺字体显方框） |
| 曲线图 | 曲线必须关于横轴对称，A/−A 虚线贴波峰波谷，周期标注落在一个周期正下方 |
| 图片元素 | `img` 元素充满 w×h 框（objectFit contain），w/h 直接按显示大小给；白底图片先转透明（参考 clock.gif 处理：近白像素 alpha=0） |
| 页脚/页码 | z-index 20 + 白底圆角衬，任何内容遮不住 |
| 文字颜色 | 舞台容器默认 `#111`，表格等不设色的元素不会继承深色页面的浅色字 |
| logo | `public/weblec/<课名>/logo.png`（格物图标，左上角 270×116 × `logoScale`，doc 里可选设置、默认 1，9-1/9-2 用 0.67）；原图存课程目录 `logo_src.png` |
| 章节导航 | **默认收起**，保持播放区干净；页码指示器是可点按钮（点它展开/收起章节条，跳页后自动收起）。改动注意：质检器 `pageShown` 靠它核对翻页，文本格式 `id/总数 标题` 不能变 |

讲稿断句约定：同一句里的多个 `[[n]]` 标记会共享同一个配音时刻导致步进重合，
要把不同步骤拆到不同句子里。`weblec.json` 与 `lecture.json` 结构同形
（slides/subtitles/bullets），右栏、助教、小人等组件零改动复用。

### 导出纯幻灯片单文件（无配音/小人/侧栏，双击即开）

```bash
python lecture_factory/export_slides.py --build            # 一条命令：构建 + 打包（默认 shm）
python lecture_factory/export_slides.py --build --course <课名>   # 导出其他课程
# → ../interactive-lecture/slides-export/大学物理-<标题>-幻灯片.html
```

产物是一个自包含 HTML（约 2 MB）：JS/CSS/KaTeX 字体/logo/插图全部内联，
`window.__WEBLEC__` 直接注入课件数据（不走 fetch），file:// 双击可开、可拷给学生。
操作：→ / 空格 / 单击下一步，← / 右键上一步，PgUp/PgDn 整页跳，Home/End 首尾页，F 全屏，A 批注。
动画图示（弹簧振子等）由自由时钟驱动（setInterval 20fps，比 rAF 在投屏/嵌入环境更稳），放映时持续运动。
批注：A 进入画笔模式（红/蓝/黑三色、撤销、清除本页、每页文字备注、Esc 退出），
笔迹存浏览器 localStorage（`shm-slides-annotations`），「导出批注」下载 JSON——
每笔自动标注与哪些页面元素重叠（overlaps），可直接交给 AI 指导修改 weblec.json。
静态页代码在 `src/pages/SlidesOnly.tsx`（复用 SlideStage 的 Element 渲染与页面版式，
元素 `step ≤ 当前步` 逐步揭示，与视频版的步序完全一致）。
