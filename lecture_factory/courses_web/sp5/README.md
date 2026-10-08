# sp5：圆孔衍射与光学仪器的分辨本领

本目录保存本课 23 页候选源码及本地素材。具体的在线神经语音发送授权已收到，真实音频已完成生成及离线重组；全课运行验收仍待完成，候选尚未发布。离线实际 PCM 解码测得冻结合并音轨为 1313.893708 秒，约 21 分 54 秒；该实测时长不等同于完整课堂运行或听检验收。

直接人工授权原话为“授权，按现有配音流程补齐”，消息 ID 为 `01a116e0-3372-7791-8142-4e30462f1e58`，来源线程为 `01a11514-9987-7812-8304-52b4b032d4a2`。具体问题、接收方 `speech.platform.bing.com`、授权记录及本课讲稿/payload 哈希见 [speech-request.json](../../../work/special-series/integration/speech-request.json)。授权范围为本课旁白句子，缺句按现有 Microsoft Edge 神经配音流程补齐；图片、PPT/PDF、密钥、私密聊天及其他项目文件不在发送范围内。

## 文件与工作范围

- `author.py`：本课页面、讲稿、步骤及原生公式的生成源；`slides.json`：23 页候选数据。
- `assets/`：本课图片、SVG 教学示意、`sim_aperture.html` 和本地 `vendor/`。正式公式由 KaTeX 排版，未用原 PPT 公式截图替代。
- `make_audio_neural.py`：采用 `zh-CN-YunxiNeural` 的本课音频生成脚本，依据上述具体授权继续既有流程；实际调用只发送旁白句子，并复用精确匹配的真实句缓存。
- [work/special-series/sp5](../../../work/special-series/sp5/)：源材料证据、模拟适配、音频暂存、布局预览、构建与导出候选。工作产物不等同于发布产物。

本课构建使用记录中共享播放器的统一 `timelineSync` 协议，输出留在 sp5 的隔离目录。共享源码已包含独立模拟消息步，因此记录中的私有 Vite 未应用额外 transform；辅助代码仅保存在 `sim/patches/presentation-steps.ts`；旧版 `SlideStage.tsx`、`SlidesOnly.tsx` 整文件 shadow 不参与加载。共享协议整合由根代理统一管理，本课私有构建不写共享 `public`、全局 `dist`、课程列表或队列。构建会记录共享渲染源、本课 transform、辅助代码与课程数据的实际版本哈希。

## 原始材料及页码映射

原始材料为用户提供的 [15 页 PPTX](</Users/xm/Documents/青教赛筑基/青教赛提交材料/04_八套教学节段PPT/05_学时05/PPT/大学物理+第5学时节段.pptx>) 和 [同名 PDF](</Users/xm/Documents/青教赛筑基/青教赛提交材料/04_八套教学节段PPT/05_学时05/PPT/大学物理+第5学时节段.pdf>)。15 页均非隐藏页。源解析记录形状几何、公式对象、动画 XML、媒体关系和备注；PDF 15 页已逐页渲染并作视觉检查。动画记录来自 PPTX XML，不能据此宣称已在 PowerPoint 中逐条播放。

下表对应当前 `slides.json` 的 `source_pages`；扩展页用于拆分观察、推导、判断与应用，没有引入其他学时内容。

| 候选页 | 内容 | 原 PPT 页 |
|---:|---|---|
| 1 | 圆孔衍射与光学仪器的分辨本领 | 1 |
| 2 | 学习路线 | 3 |
| 3 | 两盏车灯与中国天眼 | 2 |
| 4 | 改变孔径，先看图样 | 4 |
| 5 | 艾里图样与艾里斑 | 5 |
| 6 | 角半径与屏上半径 | 6 |
| 7 | 子波如何叠加 | 6 |
| 8 | 轴对称积分与强度分布 | 6 |
| 9 | 第一零点与小角度近似 | 6 |
| 10 | 孔径扫描与模型计算 | 7 |
| 11 | 角度与长度的迁移判断 | 6、7 |
| 12 | 双点像：先寻找临界 | 8 |
| 13 | 双峰靠近，凹陷变浅 | 9 |
| 14 | 瑞利判据的几何意义 | 10、11 |
| 15 | 角分辨率与空间分辨率 | 10、12、14 |
| 16 | 孔径还是放大倍率 | 12、13 |
| 17 | 车灯能在多远处分开 | 2、14 |
| 18 | 中国天眼：有效口径与波长 | 12 |
| 19 | 观察距离也属于设计条件 | 12、14 |
| 20 | 工程改进与规律的边界 | 13 |
| 21 | 小结：逐一回答引入的问题 | 2、12、13 |
| 22 | 作业与探究 | 14 |
| 23 | 下次课见 | 15 |

保留源 p4 与 p8 备注的教学顺序：先拖动孔径 D 或双点间距参数 c，描述现象，再呈现公式或瑞利判据。

## 素材出处及本地复用

| 当前素材 | 来源与用途 |
|---|---|
| `assets/fast.jpg` | 原 PPT p2、p12 的嵌入媒体 `ppt/media/image4.jpg`，1920×922；用于 FAST 引入和工程应用。与提取原媒体的 SHA-256 一致。 |
| `assets/headlights.png` | 原 PPT p2 的嵌入媒体 `ppt/media/image3.png`，1672×941；用于车灯情景。与提取原媒体的 SHA-256 一致。 |
| `airy-hero.svg`、`airy-label.svg`、`airy-curve.svg`、`profile-*.svg` | 本课理想圆孔模型生成的教学图及线性强度剖面，属于模型示意。 |
| `angle-geometry.svg` | 本课重绘的角度与屏上长度几何示意，配合原生公式使用。 |

两张照片的可核实出处是用户提供 PPT 的嵌入媒体；所给材料没有记录摄影者或首次发表网页，不能补写未经核实的署名或网络出处。原媒体编号、原页用途、哈希及提取路径见 [source-map.json](../../../work/special-series/sp5/source/source-map.json)。整页 PDF 图仅用于证据和视觉复核，没有充当正式课件页。

互动模型复用本地原 HTML：[圆孔衍射-3D模拟.html](</Users/xm/Documents/青教赛筑基/PPT风格统一试改/圆孔衍射与分辨本领/网页演示/圆孔衍射-3D模拟.html>)。同目录的 `圆孔衍射-原理推导.html` 用于核对六步推导，推导内容在本课页面重新排版。源 PPT 给出的线上入口为 [3D 模拟](https://up.physxuanmin.cloud/assets/interactives/circular-aperture-diffraction-3d.html) 和 [原理推导 s4](https://up.physxuanmin.cloud/assets/interactives/circular-aperture-diffraction-principles.html#s4)；本课候选实际使用本地适配资产，不依赖上述网页运行。

`assets/vendor/` 保留 Three.js r164、OrbitControls、RoomEnvironment、KaTeX 0.16.11 的 JS/CSS 和字体。主体依赖只读复制自项目现有本地资产；补齐的 KaTeX 字体及许可证来自项目已安装包。模拟导入和 KaTeX 字体引用均指向本地文件，不使用 CDN。HTML、vendor 和图片需一起由 HTTP 提供；不能据此宣称已获得包含 iframe 与依赖的离线单 HTML 成品。

## 模型约定、纠错及物理依据

圆孔图样采用均匀照明、无中心遮挡的理想圆孔与标量夫琅禾费模型：`I(θ)/I(0) = [2J₁(u)/u]²`，`u = πD sinθ/λ`，在 `u=0` 取连续极限 1。第一零点为 `u≈3.831706`，因此 `sinθ₀≈1.21967λ/D`；只有小角度时才写 `θ₀≈1.22λ/D`，角度单位为弧度。推导与近似依据为 [MIT 8.03 Lecture 22](https://ocw.mit.edu/courses/8-03sc-physics-iii-vibrations-and-waves-fall-2016/142257222aea3d11e530b9dcb0631857_MIT8_03SCF16_Lec22.pdf) 和 [Biswas 等的夫琅禾费推导，II.2–II.2.2](https://arxiv.org/html/2104.08073)。独立数值复核使用 [NIST DLMF 的 Bessel 积分表示](https://dlmf.nist.gov/10.9#E2)。

瑞利判据在本课限定为等强、相互非相干点源的理想圆孔成像：一个图样中心落在另一个第一暗环上，边界为 `Δθ=θ₀`。它是此模型下的判别约定，不能扩展为所有成像与参数估计的绝对界限。几何定义见 [Arizona OPTI 517，Optical Quality，slide 118](https://wp.optics.arizona.edu/jsasian/wp-content/uploads/sites/33/2016/02/Opti517-Optical-Quality-2016.pdf)，非相干点源与分辨问题见 [arXiv:2011.07897](https://arxiv.org/abs/2011.07897)。

本课对原材料和 HTML 作如下修正：

- 原 p7 的记录值直接由 `θ₀=1.22λ/D` 生成，现标为“模型计算”，去掉容易误认为独立实验验证的拟合优度和偏差展示。
- c 定义为 `Δθ/θ₀`。固定 λ、D 而减小 c 表示两点靠近；演示 `1.6→1.0→0.6` 时中间凹陷变浅并消失，修正原 p9 的相反描述。c=0.6 已为中央峰，不再称“鞍点变深”。量化显示使用“中点/叠加峰值”。
- 区分角半径与长度：远屏上 `r₁≈Lθ₀`，透镜焦平面上 `r₁≈fθ₀`。当前无透镜模拟中的 1 m 是屏距参数，不能称为透镜焦距。
- 当前 `λ=550 nm`、`D≤0.6 mm`、屏距 1 m 的几何画面明确标为“理想远场模型”，装置已放大示意。最大孔径下 `a²/(λL)≈0.164`，不把该画面当作全参数均严格远场的实测实验。
- 弱环采用亮度增强以便观察；定量读数来自未作亮度变换的线性强度剖面。颜色和表面高度不能直接用于量取相对强度。原 D 大于约 0.43 mm 后孔口截断的问题也已修正。
- 保留增大孔径改善角分辨率的应用讨论；放大倍率只改变像的显示尺度，不能凭空增加物体细节。未沿用缺少依据的 Sparrow“除以 1.4”或原理页中的混合口径 FAST 数值。

FAST 的总体反射面约 500 m，常规照明抛物面口径约 300 m，见 [FAST 官方托管的主动反射面论文](https://fast.bao.ac.cn/static/uploadfiles/FastPaper/Adapting%20active%20reflector%20technology%20for%20greater%20sensitivity%20and%20sky-coverage%20in%20FAST-like%20telescopes.pdf)。使用 `λ≈0.21 m、D≈300 m` 得到理想均匀圆孔的瑞利角估算约 `2.94′`。这一估算 **不等于 FAST 实测半功率波束宽度 HPBW/FWHM**；真实照明分布和宽度定义不同。[FAST 团队 Jiang 等，2020，II.2.4 与 Table 2](https://arxiv.org/html/2002.01786) 报告 1420 MHz 中心波束 HPBW 约 `2.82′`，并区分照明模型。数值接近不能用来互相替代物理定义。

## 隔离构建与当前验收状态

从项目根目录使用下列本课隔离入口；不要直接调用默认共享构建、默认导出或全局 `npm run build`：

```sh
python3 -B lecture_factory/courses_web/sp5/author.py
.venv/bin/python -B work/special-series/sp5/build_candidate.py
node work/special-series/sp5/vite_candidate.mjs
python3 -B work/special-series/sp5/export_candidate.py
```

`build_candidate.py` 要求本课 `work/special-series/sp5/neural-stage/audio/` 中的真实 MP3、句子时间文件及神经语音元数据完整匹配当前讲稿，缺失时应停止，不使用占位音频替代。具体授权、199 句原始缓存与 23 页音轨的离线数据检查已通过，全课运行验收仍待完成。所有 Python 操作使用 `-B`，避免向共享模块写 `__pycache__`。

构建以 `work/special-series/sp5/build-input/sp5/` 为私有输入镜像，共享生成器的静音、列表和其他中间文件留在该镜像。页面偏移使用真实 MP3 解码采样时长；最终合并轨由真实逐页音频解码为 PCM、追加既定 0.8 s 页间隔后单次编码，避免逐段 MP3 padding 累积。真实句时间用于补全所有讲稿标记与模拟消息的 `stepTimes`，包括 p12 独立演示步 2；本课模拟以 `timelineSync` 显式启用统一时间协议。

首版真实音轨超过 22 分钟后，普通页只在本地将 tempo 从 1.03 调至 1.08，p7、p8、p9、p14、p15 保持 1.00；复用同一 199 条原始句 MP3，不改讲稿或授权 payload。原分页文件保留在 `cache-history/pre-pace-tuning/`，重组后的句时间重新按 PCM 测量。生成 recipe 签名与 MP3 实际字节 SHA 分开记录，详见 [音频来源审计](../../../work/special-series/sp5/preflight/audio-provenance.json)。

构建输出分别为 `work/special-series/sp5/public/weblec/sp5/`、`deploy-stage/`、`slides-stage/` 和 `slides-export/`；Vite 缓存也在本课 work。布局预览可使用 `prepare_layout_preview.py`，其状态明确为 `layout-only-no-audio`、`not_deliverable: true`。隔离预览服务入口为 `node work/special-series/sp5/vite_candidate.mjs --serve`，端口 8085。

已有证据包括 [源材料复核](../../../work/special-series/sp5/source/source-review.md)、[PDF 接触图](../../../work/special-series/sp5/source/pdf-contact.png)、[独立物理计算](../../../work/special-series/sp5/source/physics-checks.json)、[模拟适配报告](../../../work/special-series/sp5/sim/adaptation-report.md) 以及局部数值、浏览器与回退检查。[只读音频审计脚本](../../../work/special-series/sp5/preflight/audit_audio.py) 区分 MP3 实际字节哈希、生成 recipe 签名和逐句文本哈希；[运行验收清单](../../../work/special-series/sp5/preflight/acceptance-checklist.md) 记录真实音频到位后的三道 quiz、22 个热点、全屏和 seek 检查要求。上述局部证据不等同于全课课堂播放器、静态放映、真实音频及导出产品的完整验收；本目录不声明听检通过或正式发布已批准。

## 当前冻结媒体与实测范围

最后一次调整完全在本地使用已有 199 条原始句 MP3，全部 raw 文件前后字节 SHA 一致，没有发送新文字。普通叙述 tempo 为 1.12；关键推导 p7/p8/p9/p14/p15 与应用 p16–20 为 1.00。完整实际 PCM 总时长 1313.893708 秒；新授 p4–15 为 725.599833 秒，应用 p16–20 为 332.544000 秒，均含各自 0.8 秒页间停顿，比值为 2.181966:1。三题完整邀请句末加 0.1 秒后触发，到下一句口播保留约 1.25 秒；局部静音策略进入配方哈希。

只修改了三题 `after_sentence` / `pause_offset` 元数据、p21 车灯短句的距离方向和 p22 原平台 AI 作业流程的屏显文字；23 页旁白与标记、199 句批准 payload 保持逐字相同。原源码与音轨及旧验收均留在本课 work 的历史目录。

新 JSON 为 ff0310497e2c39882959028b60dfec9ab4d83925f11eb205e1fab81ed6de7e12，新音轨为 ff593071cfd9e1ff38e34f236f9894367166e1a5599fdad21780f2161a7012ff；模型字体资产为 0bb974da16452d3d90ff0b3694a638a009e7885a4eea826e2fe988126190d4ea。正式 69 个页缓存文件已与新 stage 逐字节匹配。

新媒体的私有课堂实测已覆盖 23 页、22 个热点、三题判对/判错×1倍/2.5倍共12次自然暂停、锁定、全屏和继续播放；14 个模拟时间轴记录通过严格断言，版式巡检 0 问题。课堂 UI 使用记录中不可变通用 bundle 动态读取新版媒体，详见 [媒体绑定记录](../../../work/special-series/sp5/media-update-provenance.json)。共享静态 UI 后续变动的最新导出和 8081 整合验收由中央根代理完成，不把旧私有静态截图当作新版共享静态 UI 通过。

完整单次连续播放新音轨、人工听检和最终发布仍待验。旧音轨连续播放至 895.316 秒后的记录仅证明旧版范围，不移用于新版。[交接清单](../../../work/special-series/sp5/candidate-manifest.json) 保持 accepted=false、release_ready=false，媒体 ready=true。
