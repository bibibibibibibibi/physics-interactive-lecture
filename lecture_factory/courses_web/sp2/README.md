# sp2 电磁感应定律

2026-10-07 教学复审版已完成真实配音、私有候选构建及技术验收：**21 页、222 句，21 分 03.5 秒**。状态为 `technical_checks_complete_human_listening_pending`，`technical_ready=true`；人工听感仍待确认。旧公共发布与本次候选隔离，尚未生成最终放行标记。

已从父聊天的人类消息核实本课修订讲稿发送至现有 Microsoft Edge 神经语音服务的授权，答复为“授权，按现有配音流程补齐”。目的地为 `speech.platform.bing.com`；本次只发送批准的讲稿句子。授权记录见 `work/special-series/sp2/authorization-compatibility-preflight.json`。该授权已经取得；人工听感属于独立的质量验收事项。

## 本次教学改进

- **逻辑清晰**：用“开关变化—相对运动—面积变化—磁通量”逐层统一实验，再由变化率进入计算，由定向进入负号，最后用铜管和无线充电检验迁移。
- **讲解生动**：将开头悬念、操作前预测、两图比较和条件变化题串成可参与的课堂；学生先说理由，再核对解析。
- **情绪起伏**：从好奇、意外现象到规律汇合，再到负号与能量的贯通，最后回到应用与开放追问。配音采用分段语速；实际重音、停顿与音色仍须听检。
- **价值教育**：P4、P14 强调尊重事实、依据证据修正；P16 区分模型与真实测量；P17—18 联系节能、可靠设计与工程责任；P20—21 从扎实基础和解决实际问题落到科技自立自强、服务国家与人民生活。

候选元数据时长为 **1263.50 秒**；整课 MP3 完整解码时长为 **1263.44 秒**，两者相差 0.06 秒。按页面实际起止时刻，新授（P4—14）709.79 秒，应用（P15—19）318.69 秒，约 **2.23:1**；导入、总结及页间停顿另计。

## 候选入口与隔离目录

- 完整课堂：`http://127.0.0.1:8123/?course=sp2`。
- 教师静态放映：`http://127.0.0.1:8123/sp2-slides.html`。
- 真实课件与音频：`work/special-series/sp2/public/weblec/sp2/`。
- 私有应用构建：`work/special-series/sp2/app-stage/`；静态构建与导出位于本课 `slides-stage/`、`slides-export/`。
- `8122/sp2-visual.html` 为此前无配音的手动视觉预览，不作为新版音画同步证据。

候选服务启动后使用上述入口。HTTP 静态导出内联图片、公式、字体与播放器，视频和模拟从同一候选的 `/weblec/sp2/` 加载，不能作为完全离线单文件分发。课程清单、公共 `public`、共享 `dist` 和正式发布由父任务统一整合。

## 文件与重建

- `author.py`、`slides.json`：当前批准的教学源稿。21 页、222 句已与批准 payload 逐句核对；旁白没有改动；中央验收后已补回 P20/P21 的独立初答、真实 AI 追问、恒定直流核查及修订记录屏显任务。
- `source/media/`：源 PPT 嵌入媒体；来源映射见 `source/source-provenance.json`。
- `assets/`：可编辑 SVG、H.264 静音视频及 `sim_induction.html`。
- `make_audio_neural.py`：使用 `zh-CN-YunxiNeural`，24 kHz、96 kbps、单声道；先生成真实句音频，再按页面节奏处理。普通讲解 1.08 倍，探究、推导与收束 1.02—1.05 倍。逐句时间由最终 PCM 采样长度产生，普通句间保留 0.4／0.65 秒停顿，四道题完整邀答句后单独保留 1.2 秒。`--cache-only` 缺句即失败，不访问在线服务。
- `pageN.times.json`、`pageN.neural.json`、`audio/pageN.mp3`：同步更新的真实配音、逐句时间及生成配方记录；缓存与中间文件位于本课 work 目录。
- `finalize_audio.py`：先完整核对所有页的句子、配方、真实音频解码时长，再备份和复制，调用既有构建器生成私有候选。页间 MP3 静音按实测长度校准，不修改共享构建器。
- `candidate_vite.mjs`：通过本课独立 public、cache、输出目录构建；关闭共享配置加载与 Jiti 磁盘缓存，`emptyOutDir:false`。`app` 构建双入口候选，`slides` 支持静态导出。
- `export_http_slides.py`：构建、课件读取、导出及 HTTP 后处理均指向本课隔离目录。

已有真实配音的本地重建命令（仓库根目录）：

```sh
.venv/bin/python -B lecture_factory/courses_web/sp2/finalize_audio.py --check-only
.venv/bin/python -B lecture_factory/courses_web/sp2/finalize_audio.py
.venv/bin/python -B lecture_factory/validate_weblec.py "$PWD/work/special-series/sp2/public/weblec/sp2/weblec.json"
.venv/bin/python -B lecture_factory/courses_web/sp2/export_http_slides.py
node lecture_factory/courses_web/sp2/candidate_vite.mjs app
```

不要使用共享构建器的缺失配音再生分支，不运行旧 `safe_deploy.py`，也不直接执行全站构建／导出 CLI。继续改稿时应同步更新批准文本与真实配音匹配关系，不能沿用旧稿音频或把配方签名当成音频文件指纹。

## 输出时序适配与版本证据

`finalize_audio.py` 在共享构建器完成后只转换候选 `weblec.json`，记录在 `work/special-series/sp2/candidate-transforms.json`：

1. P5、P16 的 HTML 元素设置 `timelineSync:true`。模拟接收同源父窗口的 `lecture-state`，使用页内 `pageTime` 与 `steps[2]`／`steps[3]` 计算状态；不依据墙钟猜测课堂倍速。暂停和静态放映保持该时刻，手动实验可用；播放恢复、换步或 seek 后恢复默认参数并跟随课堂。旧 reset/demo、audio 轮询和 fetch 只作为未接入新协议时的兼容路径。
2. P3 的列车、P6 的两个实验、P7 的导体棒共 4 个视频设置 `timelineSync:true`，让暂停与播放倍速跟随课堂音频。
3. P10、P14、P16、P19 的选择题在完整邀答句结束后 0.02 秒触发。2.5 倍速实测发现原 0.4 秒间隔可能让 P19 的答案句先于题卡暂停，因此仅以 `--cache-only` 重拼既有真实句音频，将四题读后停顿统一扩为 1.2 秒；讲稿未改动，也未再次外发。最终音频的四题已在新版主课堂 2.5 倍速下通过题干结束后暂停、锁定及判分／解析检查。

候选共记录 **10 项输出转换**：2 个模拟、4 个视频的同步开关，以及 4 个题目触发时刻。句后停顿则属于本地音频配方变化，逐句时轴按重拼后的真实音频重新生成。

当前源稿 `slides.json` SHA-256 为 `d422c7f140b9a28b0a65b53af983b0def3f5b936694d43b628afc03a1b49fa34`；批准 speech payload SHA-256 为 `9d3616659e8f055fa4a1ff5af2f653b1af48180e45c38f4a761bb906b9ee5626`。

`pageN.neural.json.sha256` 是页面生成配方 hash，包含语速与停顿配置；原始句缓存文件名中的 hash 对应句子文本、音色、音量、编码等原始合成配方。**两者都不是 MP3 字节 hash。** 验收须另记实际音频字节 SHA-256，并把截图、题目、热点和同步证据绑定到实际候选与构建版本。当前候选数据的 SHA-256 为 `13e27a595b032f674d212401a5103b282b062490977b94035dbb6b491fe14162`；整课 MP3 字节 SHA-256 为 `166b95cf7e6b8679169813c3d65c3d4c3388980a5e0845a76d6dce938b40d57f`。

批准 speech payload 未变；P20/P21 的屏显任务及位置已补齐，源稿版本随之更新。最终数据与音频版本以上述指纹为准；app 与 slides 构建已匹配最新共享 UI，其中 `SlidesOnly.tsx` SHA-256 为 `213d27b84e951811169b7b14c597a5acb5d8dd457d89a5c747159c9622546c09`。最终统一证据版本为 `9d485bf0de98da9ef3db94e75dfc934516f5d3f7632701aa83f3059fc3efec05`，绑定记录见 `acceptance-plan.json` 及 app／slides 的 `renderer-build.json`。

原运行记录保留各自实际观察到的 renderer 字节与时间。独立 `renderer-continuity-review.json` 核实最后一次主课堂入口变化仅为依赖文件名，依赖内容字节相同；这些已测结果通过该连续性记录关联最终构建，没有改写成“所有项目在最终构建又执行了一遍”。静态 Q 快捷键、翻页题目上下文与按钮淡出的实际变化已另行复验。

## 内容与模型边界

源 PPT/PDF 为《大学物理+第2学时节段》，共 24 页。保留原教学主线，补充磁通量定义、定向、斜率算例、多匝磁通链和条件迁移题；不纳入与本节推理关系较弱的宇宙起源内容。法拉第卒年由源稿的 1861 修正为 1867。

法拉第负号配合法向及右手回路正向使用；N 极靠近和远离图的原磁场都向下。铜管模拟采用低速线性阻力 `F=kv`，完整铜管 `k=0.15 kg/s`，塑料管／开缝铜管理想化为零阻尼；它展示模型趋势，不是真实测量。开关模拟采用短时间指数过渡，等效单匝 `Φ=0.6I`。无线充电链包含交变发射电流、接收磁通量、感应电动势以及整流／稳压／充电管理。

物理核对参考：[OpenStax 法拉第定律](https://openstax.org/books/university-physics-volume-2/pages/13-1-faradays-law)、[楞次定律](https://openstax.org/books/university-physics-volume-2/pages/13-2-lenzs-law)、[WPC 感应供电原理](https://www.wirelesspowerconsortium.com/knowledge-base/magnetic-induction/principle-of-inductive-power/)、[威斯康星大学铜管实验](https://www.physics.wisc.edu/ingersollmuseum/exhibits/EM/lenzlaw/)。

## 验收状态

真实音频与源稿预检通过；转换后的候选数据校验为 **0 错误／0 警告**。整课浮点解码峰值为 **−0.668 dBFS**，NaN、Inf、满幅及越界样本均为 0；这不是听感或真峰值验收。模拟的 **25 项受控时钟测试通过**，保留原 8 项兼容测试，并覆盖新协议与边界状态。

绑定最终媒体数据的浏览器记录已确认：新版主课堂四题 2.5 倍速暂停与锁定通过；四视频 1 倍速暂停稳定、2 倍速跟随音频；两种模拟在相同课堂时刻重放结果一致且暂停不漂移；21 页全部达到预期元素数、图片正常、最终步采样对应字幕可见。对应记录为 `current-quiz-browser.json`、`current-browser-media.json`、`current-browser-sim.json`、`current-capture-audit.json`；最后的等价依赖更名按上述连续性记录关联。

静态放映已实测：P14 按 Q 打开正确题目并判分，翻至 P16 后在全屏中按 Q 仍显示当前页题目并判分；互动题按钮已上移，隐藏时容器 `opacity=0`、`pointer-events:none`。P14 文字批注保存正确，实际下载的批注 JSON 已读取核实。该文件只有文字备注、没有笔迹，不据此宣称验证了笔迹导出。记录见 `current-static-browser.json`。

用户已授权的共享启动器 Range 补丁在源码和部署副本共 4 个文件中实际匹配，Mac 7 项协议测试通过；证据见 `shared-launcher-manifest.json` 与 `range-patch-tests.json`。Windows 原生运行未在本次 macOS 环境验证。

技术运行汇总使用 `work/special-series/sp2/current-runtime-acceptance.json`；具体证据见 `candidate-report.md`、`candidate-transforms.json`、`acceptance-plan.json`、`renderer-continuity-review.json` 和本轮 `current-*.json`。此前 `acceptance-report.md`、`quality-manifest.json` 等描述旧版候选，不自动继承为新版通过结论。技术就绪不等于人工听感已通过；在该项补齐前不生成 `release-approved.json`。HTTP 静态导出仍依赖同源媒体目录。

## 2026-10-08 中央整合状态

当前公共入口为 `http://127.0.0.1:8081/?course=sp2`，静态入口为 `/slides.html?course=sp2` 及菜单指向的 HTTP 导出。中央采用 JSON `a591656d71a46d31f561e105d6171e0ab38bd5ce6fa8bc310b646eb8ede69302`、原音频 `166b95cf7e6b8679169813c3d65c3d4c3388980a5e0845a76d6dce938b40d57f`，最终导出 `65774e561e8416a0c7c63068b5da8d79ae1b7da36bc763be3c759b3ff2bbd5f5`。源稿与 author 已成对更新，222句配音、字幕、公式、题目和时轴保持原样。

统一播放器实际入口为 `main-CT4BOHvP.js`，共享组件包为 `QuizCard-pL_Mdn0P.js`。最终技术报告 `work/special-series/integration/sp2-browser-qa/final-browser-review.json` 精确区分旧范围复用、视频修复及新增屏显/收起侧栏回归；本课技术检查通过，人工全课听感仍待确认。上文私有候选指纹作为阶段证据保留，不能覆盖当前中央版本。
