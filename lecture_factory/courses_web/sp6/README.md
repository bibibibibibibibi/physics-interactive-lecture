# sp6 · 衍射光栅

第 6 学时专题课，按原有网页课件流程制作。当前共 22 页，包含 5 道选择题、预设热点答疑，以及多缝干涉、包络缺级、双线分辨 3 组交互模拟。

## 当前状态

讲稿、公式、素材、22 页静态画面和真实配音候选已完成。云希神经语音保持语速 1.0，解码测得整课 **21 分 33.436 秒**。192 句字幕、76 个步骤及 5 道题的时间数据与真实音频侧车一致。全课浏览器版式质检为 0 个问题、49 条参考；五道题、热点离线答疑、全屏答题和三组模拟的音频驱动、暂停调参、回退重播已实际操作复核。

2026-10-07 用户明确批准本课配音，具体语音目的地授权已经解决，当前没有活动配音进程。人工试听、整课最终接受及主协调任务接入仍待完成，当前为可试听的独立候选，尚未正式发布。

按既定分类，新授为第 4–13、18 页，应用为第 14–17、19–20 页，导入/总结/作业单列。实际页面音频分别为 724.110、393.290、158.436 秒，新授与应用比为 **1.841∶1**；不将单列内容改类凑比例。整课另含 21 个 0.8 秒页间隔和 0.8 秒尾间隔。7 个句内步骤锚点按该句实测时长与字符比例插值，不能称逐词精确对齐。

## 文件

- `author.py`：课程讲稿、画面和互动内容的维护入口。
- `slides.json`：运行作者脚本生成的数据；修改内容时优先改作者脚本。
- `assets/`：原稿图片、推导图、测量图和自包含模拟源码。`resolution.svg` 为备用图，当前页面未引用。
- `make_audio_neural.py`：本课云希神经语音脚本，按讲稿和参数缓存句音频，使用解码 PCM 帧数建立时间轴。外部合成须有覆盖内容和目的地的授权；本次授权证据已保存。
- `work/special-series/sp6/`：来源分析、隔离构建脚本、临时候选、截图、复核报告和验收清单；构建产物保留在该目录。

## 来源和模型

原始材料为“大学物理+第6学时节段”的 16 页 PPTX/PDF，以及原光栅互动演示 HTML。来源路径、文件哈希及素材对应关系见 `work/special-series/sp6/source-analysis/asset-provenance.json` 与 `source-map.json`。原始材料没有改动。`cd-laser.png` 是原稿实验示意图，不能当作实际测量照片；CD 波长计算采用给定教学数据。

公式采用正入射、远场、等间距相同狭缝的理想模型。多缝比较使用归一化的独立干涉因子，有限缝宽的包络与缺级另行讨论。分辨率例子按理想瑞利判据处理，不能作为真实仪器的实测结果。原稿示意图中的微小注释不适合远距离投影；页面的大字问题和主图仍可读。

## 候选预览

当前独立候选使用本课端口 18767：

- [真实配音播放器](http://127.0.0.1:18767/?course=sp6)
- [手动幻灯片预览](http://127.0.0.1:18767/slides.html?course=sp6)
- [导出的 HTTP 幻灯片预览](http://127.0.0.1:18767/sp6-slides.html)

播放器以真实音频时间驱动画面，空格播放/暂停，暂停后左右键步进。手动幻灯片以方向键或空格推进步骤，PgUp/PgDn 翻页。导出文件依赖配套 HTTP 素材树中的模拟 HTML，不是完整离线文件。18766 的旧无配音预览仅保留作历史视觉证据，不能作为当前音频候选提升。

从项目根目录更新独立候选：

```sh
.venv/bin/python -B lecture_factory/courses_web/sp6/author.py
.venv/bin/python -B work/special-series/sp6/prepare_candidate.py
.venv/bin/python -B -u lecture_factory/courses_web/sp6/make_audio_neural.py
.venv/bin/python -B work/special-series/sp6/build_candidate.py
.venv/bin/python -B work/special-series/sp6/export_candidate.py
```

独立播放器构建及启动命令见 `work/special-series/sp6/pipeline-notes.md`；所有独立流程仅写本课目录和本课 work 目录。播放器的时轴同步、延后揭示热点、全屏答题补丁目前只在本课快照中应用，共享目录、课程清单和全站交付由主协调任务复核后处理。当前预览未连接实际 AI 后端，热点提问已验证离线库回退。

## 验收依据

- `work/special-series/sp6/independent-review.md`：内容、物理、静态视觉及真实音频时间数据的独立复核。
- `work/special-series/sp6/assets-review.md`：素材来源与模拟检查。
- `work/special-series/sp6/audio-measurement-final.json`：最终时长、固定分类、句音频与时点。
- `work/special-series/sp6/candidate-audit-report.json`：数据、素材、音频、导出副本一致性。
- `work/special-series/sp6/acceptance-report.md`：已通过的检查、剩余任务和阻碍。
- `work/special-series/sp6/candidate-manifest.json`：候选路径、文件哈希、证据和后续正式输出映射。

自动信号和时间轴检查不能替代人工试听；`accepted` 与 `releaseApproved` 保持为 false。


## 2026-10-08 中央整合候选

已成对更新 author 与 slides.json：保留192句旁白，恢复第5、22页实验记录、平台路径、手机/CD标定与估谱条件、拉曼选做、费曼阅读及偏振预习；题卡句间留白政策写入源稿，公共构建器会拒绝仍采用旧短间隙的缓存。当前媒体来自 `work/special-series/sp6/quiz-padding-review/public/weblec/sp6`，JSON `f3a2afe73108b21a9b0e23cf3b2cb9f760eefc59f2c62d25c3a1ad7329ac63f8`，音频 `88f2e507f11c1913ad2f227563399e9f1211c8f35893228dd42a9bf56ca63ed4`，时长21分38.986秒。该音轨由原旁白PCM加静音后本地重编码，无新增TTS。

公共入口 `http://127.0.0.1:8081/?course=sp6`，中央证据位于 `work/special-series/integration/sp6-browser-qa/`。原私有构建的“收起侧栏后热点答复隐藏”已在统一播放器修复，并由本课当前8081复验确认。原普通缓存和旧私有播放器记录保留；未来重建请按本课PCM构建流程及句间留白政策，不使用旧短间隙缓存。人工听感仍待确认。
