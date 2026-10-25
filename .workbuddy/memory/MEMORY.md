# 项目长期记忆（physics-interactive-lecture）

> 2026-10-21 第三轮压缩至 3KB 内。细节见各日 `YYYY-MM-DD.md`。

## 环境 / 交付
- 工厂脚本用**系统** Python：`C:\Users\Administrator\AppData\Local\Programs\Python\Python312\python.exe`
  （装 imageio-ffmpeg/Pillow/numpy/pywin32）；托管 3.13 缺依赖，不能跑 `build_web.py`。
- 本机自查端口要 `curl --noproxy '*'`（沙箱有 proxy）。
- 「PPT 设计」= **网页课件页**：`courses_web/<课>/author.py` → `slides.json` →
  `build_web.py` → `weblec.json`+`audio/*.mp3`（交互课堂 + 静态放映），非 .pptx。1920×1080。
- 图示库 `src/components/lecture/diagrams.tsx`（`DIAGRAMS`）；新增用
  `python work/add_diagrams.py <注册名>:work/new_diagrams/XXX.tsx`（幂等）。
- 新章登记**三处**：`public/weblec/courses_<章>.json`、`Home.tsx` groups、`make_slides_index.py` PAGES。

## 版式硬指标（用户定的规则）
- **内容不得越过页脚**：页脚顶边 **y=1015**；`table` 无 h → `rowh×行数` 估。
- 页眉 `nav`=「节号　节名」（全角空格、**不带章名**）；页脚 `footer`=「第九章　振动」。
- **封面三行**：章号 → **章名**（字间空格、大号 RED）→ `X-Y　节名`（BLUE）。第二行绝不是节名。
- 页内标题 `text(0,170,137,…,52,RED,True)`，h=90 → 紧跟图 y≥247；**正文起笔不早于 236**。
- **左侧页边距 170**；正文 31~32（注释 28~29），标题 46~52。老课 1~7 章 26~30 待整改。
- 左文右图：左栏宽 = 图 x −40 −170；**图示盒子宽高比 = viewBox 宽高比**
  （`h = 765 ÷ (viewBox宽/高)`，否则 letterbox 图小一半）。`tex` 真实高由 KaTeX 定（`\frac`≈4×字号）。
- **`table()` 单元格纯文本**，`$...$` 会原样显示 → 只用 Unicode；行高≈size×2+7。
- 课程不放目录页，末页「选择进入下一节」。

## 完工体检
```
python lecture_factory/inspect_course.py <课>                     # 静态
node work/inspect_dom.cjs "http://127.0.0.1:3000/?course=<课>"    # DOM（需 npm run dev）
```
- 失衡 = `1750−maxR > 240` 且 (右空−左空)>90；3×3 空白格量**真实墨迹**（别把字写宽）。
- **全宽元素必须排在右栏图示底边之下**（V5 只看矩形相交，12-2 P8 踩过）。
- 单项/批修：`footer_check` `margin_check` `overflow_check` `right_gap_check` `dia_probe_batch`
  `audit_diagram_ratio.py` `fix_diagram_ratio.py` `fix_overflow.py` `fix_h.py` `reflow.py` `shift_margin.py`。
- `--apply` 跑完必须 grep 源文件确认；判版面看数字不看缩略图。

## 构建 / 配音
- 配音 edge `zh-CN-YunxiNeural`。**改讲稿必须删** `audio/pageN.mp3`+`pageN.times.json`；
  只改版式 → 缓存复用（秒级）。断连就整条重跑。
- **步进铁律**：讲稿 `[[n]]` 数 = 该页 `max(step)`；两句标记不能落同一句。
- **改 `diagrams.tsx` 必须 `npm run build:slides` 再 export**（否则图空白）；
  `winapi error #5` = esbuild.exe `Mandatory Label Low` → `icacls ... /setintegritylevel Medium`。
  杀 esbuild 会带走 dev 编译服务。
- `tsc --noEmit` 通过 ≠ 能构建/能转换：esbuild 对 `-x ** 2` 报错；孤立 `</text>` 让 vite 500 白屏。
  判据 `curl -o /dev/null -w "%{http_code}" .../src/components/lecture/diagrams.tsx` 必须 200。
- 改 `Element` props 要同时改**类型注解与解构**，漏一处 `ReferenceError` 白屏而 tsc 仍 0。
- 主题在 `src/lib/theme.ts`；新主题要同步 `validate_weblec.py` 的 `KNOWN_THEMES`（现有 special/wave）。
- `vite.config.ts` 需 `server.host:true`；地址必带 `?course=`（否则回退 shm）。讲稿禁 ASCII 双引号。

## 图示规范
- **SVG 里永不写 LaTeX**；下标 `<tspan dy="5" fontSize="0.66em">`；**主标签+下标同一 `<text>`**
  （两个 text 的 bbox 必相交 → 一直报重叠）。图内只放记号，长句回页面。
- 单字母量（l/d/p/a）**italic+SERIF**（正体 l 与 1 分不出）；`VecN` 撇号走上标通道。
- 坐标必须写数字（字符串会让 `left+w` 变拼接 → 横贯红线）；普通函数不能 `<Fn />` 调用。
- 贴边标注必被裁 → 居中放线上方；尺寸线延长线从轮廓极点起。
- 「无规」散布**不能用黄金角**（成环）→ 散列伪随机 `sin(k*12.9898+4.1414)*43758.5453`。
- 曲线上的 v/a 由 `B(t)/B′(t)/B″(t)` 解析生成；同一量多处出现必须等长同比例尺。
- 自检脚本正则从源码读几何参数，抓不到就 throw；角度容差 1e-4 度。
- **动画只服务物理过程**（讲稿讲「随时间变」才有）；判是否在动靠两次采样 SVG 哈希；
  `animatedDiagrams.ts` 由 `work/gen_anim_list.py` 生成，加了动画图要重跑。
- **出图顺序＝讲稿首次提及**（图 step=1，开头「看右图…」）。
- 面积微元画**梯形**（两端各取高）；多个量只差几十像素 → 彩虚线 + 轴下图例。

## 常见坑
- **章节编号以官方教案为准**：`C:/Users/Administrator/Desktop/物理学（第七版）电子教案/第N章 .../`，
  文件名即节号（第十二章曾把压强公式编成 12-2，实为 12-3）。
- 改名一节课 = 改目录名（course id 即目录名）：按「目标先空出」顺序 mv →
  `rm -rf public/weblec/<新id>` 重建 → 改 4 处文本（title/nav/封面节名/封面讲稿）→ 删 audio/page1.*
  → 重写注册表 → 删旧导出件。
- 单文件交付在 `interactive-lecture/slides-export/`，导出新课后必须重跑 `make_slides_index.py`。
- 源 PPT 在 `E:/2022 大学物理/马六版 ppt/`（4:3 .ppt）：本机只装 WPS，需 pywin32
  `gencache.EnsureDispatch` 早绑定，先 `taskkill /F /IM wpp.exe`。
