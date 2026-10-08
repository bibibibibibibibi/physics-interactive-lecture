# sp8 康普顿散射

22 页大学物理专题课，主题样式为 `special`。章节从第 4、7、12、16、21 页开始；封面和学习路线不使用内容页页眉。

## 文件

- `author.py`：讲稿、逐步元素、公式、热点和四道迁移选择题的唯一创作入口。
- `slides.json`：由创作入口生成的课程输入。
- `assets/`：原课图片、历史光谱原图、矢量示意和本地交互模拟。
- `sources.json`：物理条件、历史读数、吴有训材料和 POLAR 的可追溯来源。
- `make_audio_neural.py`：将本课逐句文字交给已授权的微软 Edge 神经语音服务，生成云希配音及实际句时钟。中间产物与句缓存只写入本课 `work` 目录。
- `finalize_audio.py`：先核对全部 MP3、逐句时轴与讲稿签名，再复制到本课音频输入。
- `audio/pageN.mp3`、`pageN.times.json`、`pageN.neural.json`：实际声音、实际句时钟和合成参数。

源 PPT/PDF 的全部页面、形状、OMML 公式、动画、备注、隐藏状态与媒体解析保存在 `work/special-series/sp8/source/`，原页到新课映射在 `source-page-map.json`。没有把整张 PPT 截图用作网页幻灯片。

## 模拟与证据

`sim_compton.html` 支持光谱、散射极角、方位几何和偏振统计四种模式。手动与演示共用参数更新过程，课堂演示以父页面真实音频时间为基准；拖回相同时刻得到相同状态。极角 0°/180°时方位角未定义；偏振统计固定极角 90°。谱峰高度、线宽和偏振响应常数均为明确标注的教学假设。

第 13 页区分现代常数的理论预测与康普顿 1923 年的原始光谱。历史图 4 的读数为 70.8→73.0 pm；原课中缺乏原始测量支持的 73.1 pm 不再作为实测展示。材料检验以吴有训 1926 年原论文记录的材料为准。

## 隔离候选构建

本课使用 `work/special-series/sp8/tooling/` 的隔离包装器。它们读取现有渲染器，全部构建输出写入本课 `work`，不改写共享课程目录或课程队列。

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -B lecture_factory/courses_web/sp8/author.py
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -B lecture_factory/courses_web/sp8/make_audio_neural.py --tempo 1.2
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -B lecture_factory/courses_web/sp8/finalize_audio.py
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -B work/special-series/sp8/tooling/build_candidate.py
node work/special-series/sp8/tooling/candidate_vite.mjs app
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -B work/special-series/sp8/tooling/export_candidate.py
```

课程含交互 iframe，导出采用 HTTP 方式并同时提供 `/weblec/sp8/` 媒体；不具备单文件 `file://` 完整离线能力。最终实际时长、浏览器检查、截图、候选映射和待验项以本课 `work` 中的验收报告及 `candidate-manifest.json` 为准。配音听感须由人试听确认。
