# special 专题系列交付清单与制作复盘

更新日期：2026-10-08。统筹复盘根据本轮制作聊天、原PPT覆盖证据、当前源码、实际文件、候选交接与原失败记录形成。现场核查补充了用户实际IAB页面，以及8081服务、端口、目录和HTTP字节对照。本文记录事实与根因；可执行的阶段规则、单课验收、子任务交接和中央集成模板统一放在 [专题课件制作经验.md](../lecture_factory/专题课件制作经验.md)，不建立第二套规范。

取证快照：第1–8学时均已有真实配音和范围明确的统一技术验收，8个交互课堂入口已开放。第1学时修订版17页、170句/4850字、真实PCM1155.108秒（19分15.108秒）；169个唯一Yunxi请求均一次成功，重复句复用，布局/模型/共享字幕修复及最终组装没有新增外发。逐原页、媒体和物理内容已独立核准，五题、三模拟、两视频、全部热点、17页/9关键全屏、两静态入口及批注已闭环。实际用户原有IAB刷新确认8项/8课堂，从菜单进入sp1，ready4/19:15，真实播放到33.154519秒、第2页后暂停。第3学时184句/25页/1243.436秒及其原实际浏览器局部检查仍保留原版本范围。机器技术、原用户局部可用、完整人工听感、最终教师核准分别登记；后两项全部pending，不能概括为全部教学交付。

文中 `integration/` 相对 `work/special-series/integration/`；`spN/` 相对 `work/special-series/spN/`。证据档案位于忽略的work目录，未默认上传；本文保留关键字段、路径与SHA以便回到本地证据。日期为本地日期，JSON中带Z的时间为UTC。未亲自执行的历史检查注明其适用范围，不回填为本轮新测。 本次整理只核查证据、更新规则及当前登记，没有再发配音、改正式课件或重跑课程矩阵。下文“已修”须连同对应报告范围阅读；未有失败现场网络来源的缓存机制、未执行的人工听审/教师核准/新环境场景仍属待核实或待完成。

## 1. 能确认的事实与证据边界

必须分别判定以下状态，不能用聊天状态代替产物状态：材料提取完成 → 内容审阅完成 → 静态可查看 → 真音轨候选完成 → 统一播放器技术通过 → 用户入口实际可用 → 人工听感确认。一个静态候选可以有真实选择题、模拟和视频，但仍不具备有声课堂的字幕、步进、题卡自然触发和音轨同步。

### 1.1 逐课当前交付清单

以下逐课内容及完整技术矩阵截至规范整理时；共享UI3917是维护前绑定。后续加载补丁只在维护增量中登记影响范围与差异复验，不把旧报告改SHA当作新完整矩阵。

以下“统一技术通过”由原报告、精确无影响范围复用和本轮改变范围的新测组成，不能声称重新执行八课整套矩阵。当前八课public/dist JSON和完整MP3字节逐课一致；sp1为本轮新修音轨及独立矩阵，sp2–8保留原数据/音轨/报告身份，共享字幕变化已十课专项回归及正式八课局部播放补验；实际文件 SHA 与各 release、runtime_report 对应。sp6 正式 slides 的序列化字节不同于原快照，但 release 明确登记 formal_source_equivalent_sha256，当前字节等于该字段；对象等价有单独证据，不能误报成未绑定或假称原字节相同。

本次只读复核8份原PPT实际SHA均匹配learning-activities-audit/original-input-refresh.json（e46e3a9aec10d927e06a484a38a010e167ebd25d094dca2f3e4f51a3ed98fd82），原页数依次17/24/21/22/15/16/27/17。这证明输入身份未变，不是重新完成八课人工物理审阅。sp5的static-current-task-visible-review仅证明06ac私有静态P22；sp8的static-source-task-review仅证明私有两页，不能独自称正式课堂全页验收。sp7旧source/course-source-coverage.md绑定953de，其有效范围须经final-media-delta-review、final-delta-review及quiz-gap-source-delta.json（d51b5389…）追到当前38a2，逐段限定媒体/内容/题时和P23增量，不把旧报告改成当前整课通过。此类范围复用按唯一规范第四节登记。

| 课 | 内容和物理复核 / 原 PPT 意图保留 | 静态 | 真配音、字幕、步进、题卡 | 视频、模拟、热点 | 统一集成及用户环境 | 尚未完成或未证明 |
|---|---|---|---|---|---|---|
| sp1 角动量守恒，17页 | 定轴/矢量守恒、非刚体、CMG/飞轮/角动量卸载、自由航天员系统、理想恒星缩放边界均已纠正；原17页XML/notes及逐页PDF独立复核，栅格内AI作业和§4.4–4.7/§4-5预习恢复；滑雪实为2023北京世界杯，对接片明确模拟动画 | 当前sp1 live/export及旧纠错两书签；17页/五题/三模型/批注通过，正式两视频控件补验通过 | 170句/4850字；169唯一Yunxi一次成功+重复句复用；PCM1155.108秒；五题1×/2.5×正误自然触发、锁播/继续及原生ended恢复通过 | 三模型、两视频、34热点；P4收臂初态跳出错误已最小修复并自然复验；新授/应用实际1.666:1，未假称2:1或凑静音 | 正式3dfd/6655/d06/b895/70dd与维护前3917共享版接入；原IAB刷新8/8并菜单进入、19:15新轨真实播放至第2页后暂停 | 全课人工听审、最终教师节奏核准；在线AI/原平台提交及新系统/服务重启未验；旧失败和旧音轨保留，原119报告仍failed、115有效项+4定向替代明确 |
| sp2 电磁感应，21页 | 独立复核全文、公式、法向/回路定向、磁通与磁通链、楞次定律、铜管及无线充电；源映射及原作业/预习恢复有记录 | 统一静态路线与最终HTTP导出 | 222句，真实PCM1263.440秒；4题1×/2.5×正误自然跨触发、锁播/继续通过 | 实拍视频、2模拟和全部热点有实际范围；视频漂移、侧栏收起已修复并补测 | public/dist/audio/source/release/runtime_report当前一致；统一技术通过；实际用户只确认目录和入口可见，不能声称用户听完 | 全课人工读音/听感、在线AI及原平台提交未验；末页保持已在当前统一版实际回归 |
| sp3 共振，25页 | 原21页重编25页；受迫完整解/象限/峰位条件/能量/MRI与Higgs类比边界有独立证据，三计算、单位、平台、≥3轮/150字/学生独立判断及双时刻波形任务保留；新MRI已按原帧选择并核准 | 当前sp3两静态入口、全部页/关键步、4题及批注备注通过；旧sp3-static-review保留历史身份 | 175原句+3历史修订缓存+6直接授权233字均完成；184句，PCM1243.436秒；新授721.086秒/应用310.192秒=2.325:1，无凑时长静音；4题最高速正误自然触发与字幕步进通过 | 7模拟上下文、6视频包装器、20热点；当前MRI/两页模型和热点、12静态原生控件及结尾补验通过，其余按精确等价复用。手调标签、教师遮挡和static seek真实失败均已闭环 | 正式f854/4f71数据与音轨已通过；原复核绑定48158，维护前3917按字幕差异新验与精确复用，入口已开放；实际用户从目录进入、ready4/20:43/新版本，真实UI播放暂停确认 | 完整人工听感、最终教师教学核准；在线平台/AI/提交未验；真实后台visibility与跨环境范围有限。不得将旧报告改hash充新测 |
| sp4 驻波，23页 | 原22页映射；余弦和、幅相/节点、边界、能流及HIAF物理；原作业≥3轮/实验记录/150字/平台曾遗漏，已恢复屏显并实看P23 | 两入口及23页多视口，题/批注操作通过 | 185句，1309.806083秒，5题1×/2.5×正误/全屏/锁播/继续 | 5模拟上下文及21热点，通过绑定报告；没有视频资产，不应为凑清单强加 | 当前public/dist精确一致，技术通过。首次中央矩阵曾加载两代UI，后明确复用/补测 | 人工听感、外部原平台/在线AI未验；末页保持已在当前统一版实际回归 |
| sp5 圆孔衍射，23页 | 原源文本/推导/单位和Airy/瑞利模型边界复核；原AI只追问≥3轮、一次提示、提交记录、原平台曾需要补，当前屏显恢复 | 两路线、全部页及重点16:9窗口/全屏；笔迹/备注/导出/重载有实际证据 | 199句，1313.893708秒；3题补真实句后留白，新轴正误/最高速通过 | 4模拟上下文、22热点、实际播放中点击热点暂停、collapsed侧栏复测 | 当前正式69个分页音频及来源文件与冻结新轨字节相同；public/dist/current report一致，技术通过 | 人工听感、平台讨论/提交和在线AI未验；末页保持已在当前统一版实际回归；音轨时长不含人为答题/讨论时间 |
| sp6 衍射光栅，22页 | 原16页内容复核，衍射因子/包络、缺级整数、归一化亮度限制、标定及分辨本领；独立后审查发现源任务力度被削弱，P5学生记录、P22必做/选做/200字/费曼/预习/平台后恢复 | 两入口和22页已验，当前屏显修项有独立证明 | 192句，1298.986秒；5题新真实留白、正误/最高速通过 | 3模拟、全部热点；源内state为count/ratio，早期脚本N/r误读已修 | 正式author再生对象等于已审快照，slides格式SHA差异明确登记；public/dist/current report一致，技术通过 | 人工听感；原平台访问失败不代表全球停服，提交未验；末页保持已在当前统一版实际回归 |
| sp7 气液相变，23页 | 原27页映射+备注关系/媒体身份核实；修历史年份、稳定/亚稳、成核、尾迹冰晶、云室/泡室和Maxwell推导；拓展保持模型边界；源回南天活动和原平台恢复 | 两静态入口、23页与5题操作通过 | 165句，1178.385792秒；新轨5题最高速正误通过；制作聊天另有1×整条自然播放ended成功记录，但静音机器运行不是人工听审 | 4模拟上下文、8视频实例、全部热点；旧private视频残差不可冒充新shared通过 | 当前public/dist/current report一致，技术通过；实际用户目录可见 | 人工听感/在线AI/原平台未验；历史真实ended末页清空本轮已复现并最小修复，当前结尾/上一页/回拖/重播回归通过 |
| sp8 康普顿散射，22页 | 原17页映射，消元、角定义/实验图数据/模型边界及POLAR几何复核；原≥3轮/小组推理链/讨论记录屏显后补 | 两入口，22页/4题及当前P16/P22修项实看 | 229句，1318.240秒；4题新留白、新轴最高速通过 | 4模拟、热点与默认上下文；P16元素插入改变elIdx，相关上下文重新测 | 当前public/dist/current report一致，技术通过；旧1×pre-gap报告明确只历史 | 人工听感；讨论要求增加墙钟总时，不能说21:58含全部讨论；在线AI/平台提交未验；末页保持已在当前统一版实际回归 |

共性限制：人工完整听感和最终教师核准全部pending；八课whole_course_release_accepted=false、whole_series_complete=false。当前原用户IAB实际目录8项/8有声按钮，sp1新轨进入及播放/暂停已实测，sp3原局部证据另存。此范围不证明八课全部真实用户操作或教学效果；静音headless原生定点准备与局部自然跨触发不能称“完整连续听了20分钟”。

| 当前课 | 文件/候选 | 统一版 | 实际用户环境 | 人工/整体完成 |
|---|---|---|---|---|
| sp1 | 原任务/物理/媒体独立签署；170句真轨及冻结候选verified | technical_passed，正式课堂恢复；共享字幕与原书签已验 | 原IAB刷新8/8，实际菜单进入、加载1155.108秒并真实播放/暂停passed；全部操作非IAB整套认证 | pending / false |
| sp2/sp4/sp5/sp6/sp7/sp8（逐课分别适用） | 真音轨及候选verified/local_passed，各课hash见release | technical_passed，当前改变范围有补验 | 实际目录可见；各课完整用户操作pending | pending / false |
| sp3 | 真音轨与当前候选verified/local_passed | technical_passed，当前受影响范围有新测 | 实际菜单进入、新轨加载与播放/暂停passed；完整用户操作pending | pending / false |

本轮另以只读方式重新打开8份原PPT，按presentation关系取实际页序和XML文字，并核对原任务。当前原页数sp1–sp8依次为17/24/21/22/15/16/27/17；原材料未改动。原PPT字节、页序/隐藏页和原任务文字在integration/learning-activities-audit/original-input-refresh.json；这只确认输入身份与原文，不替代每课公式、实验、模型或教学映射的独立审阅。

### 1.2 关键绑定（用于回到证据，非漂亮数字）

| 证据 | SHA256 / 精确字段 |
|---|---|
| 最初目录提升历史 integration/promotion-report.json | 32fd43e0eeb278fa0785fe502f9c76df72be55e5cd9250361a6688e74264bde5；published_at=2026-10-07T14:56:17Z；static_only_courses=sp3/sp4/sp5/sp7；formal_release_approved=false |
| 最初队列 integration/before-integration/work/special-series/course-queue.json | 8615e7c2871cb366cb904efb116bd43c51fe87a6bfc11b513ecf30ae294a85d3；七课active、startup_dependencies=[]、wait_for_previous_release=false；sp3/4/5/7部分未列reported_pending_items |
| 当前八课总报告 integration/final-series-review.json | 606ab848d527aaeafdbac95dca5034791105a8af2e449e8e0773fdf09b0b40c2；原七课矩阵保持原SHA/范围，新增sp1独立签署及改变范围新测；原9d97七课报告完整保留，不能当当前8课结论 |
| sp1当前总复核 integration/sp1-final-review.json | e66da0c71490864d2c70bcf5cfe371208b290ac9ccdbf312e19774331b34fa71；source3dfd/data6655/音轨d06/模型b895/导出70dd/UI3917；明确115旧有效项+4替代、正式4视频、原IAB范围、human pending/whole false |
| sp3当前总复核 integration/sp3-final-review.json | d6f965234cfd029384c27fd86622c132b776820eb85cab0d1aab0fea34a15ba1；源1bc058…/dataf8541f…/音轨4f71…/MRI42f4…/wrapper2c66…/导出63ef…；human pending，whole false |
| 实际用户入口 integration/user-entry-final-review.json | ff3fba6f4ab611af89d0da5b40b20b1d5f1d3ac62f4ab7bb5a7a63982160e8b7；原tab1刷新8/8、sp1菜单进入、1155.108秒新轨与真实播放33.154519秒后暂停；旧sp3 b6ad范围与文件保留 |
| 维护前共享UI（原3917绑定） | 3917eca9c59b03b13dc5598fc4a199ed7e465874706503d987f42151293bcba2；实际mainc2cab与独立私有候选相同；仅Home输入字幕prop改变，spN只显示已开始句，普通shm/pre_vector保留完整列表；十课真实交互回归07d210…通过；原件保留于work/project-sync/2026-10-08/previous-process-binding/work/special-series/integration/shared-ui-build.json，当前加载差异另见维护段 |
| 当前控件定向回归 integration/shared-controls-qa/final-review.json | fc4b5381deff6b39048b0a058dea3a3ef6a372847d5fcb8362aaef62fd1752aa；16课堂场景、28静态场景/56末页状态；明确不包含sp3新候选和人工听审 |
| 目录修复 integration/menu-cache-review.json | 605dfc1ac1589add73002bef95d9104191f13d2b0526ce9fdfed4c910fea76b5；cause_limits明确disk provenance未采集 |
| 服务现场探针 integration/menu-service-retrospective-probe.json | 580702c43bc1514914faabb8933a821643c009c1fe0e297388e20e05ace97517；唯一PID67391监听8081、--directory当前dist，HTTP三入口等于dist；菜单也等于public |
| sp1当前静态及旧书签 integration/sp1-static-review-release.json | 6f200bb386b29445cf35e09dcec60c5bd753cc663aeb4c473b6c75187c3ebead；当前6655/70dd，旧sp1-correction-review两个静态入口实际任务通过；原fb1静态-only审阅身份保留，不借旧报告宣称新轨通过 |
| sp3历史静态候选 integration/sp3-static-review-release.json | 84053b5c948f76834d1a5cfaf4bf8cd5fc563583b9bc325c072259ff7881f5ea；source53b85…、payload2d67af…、runtime_qa=passed_static_only；不能代表当前有声课堂 |
| 最后清理与实际目录 integration/sp1-cleanup-final-review.json | 8c77325b549ff656d227db9c3e3b0aadf71ae02aee89f64619dd5cedb83bf32c；逐端口确认原8081/PID67391、8191/8192无监听；普通/nonce HTTP菜单均8/8、141270…。原tab1随后不可用，原因未核实；同一IAB新tab2实际目录8/8并保留，不替代ff3原tab1播放证据、不把新目录截图称完整用户操作验证 |
| sp2最终runtime_report | 7d0aa5ef477a872ddc00b6b44b4f849fa7d30b8eb4a6528cd3de4a90fab3900c |
| sp4最终runtime_report | 3ae0b844c43bfbead050e916434097ec0a0d20f6b2617b549936680cb4379133 |
| sp5最终runtime_report | b3544d2f6cec7b981843c2204b614549b72ab422f21923ce8557893eca43d41c |
| sp6最终runtime_report | 1a38426480bf6ec3d57a8fecb4e1fb48b4e9f14d9f72f42953b04ddd9e1f88f0 |
| sp7最终runtime_report | b400cad1c65695962b5d43c868d4b78069678bc2378c8fe0215bb6b8ffc39b7b |
| sp8最终runtime_report | 0473a549d3e6cf14841562cd79c72517527fa06a52d3b3c32a11faaf71c9f1e1 |

## 2. 问题、影响、原因及闭环

### R01 静态候选被当作进展终点，缺项没有追完

- 现象：用户指出3/4/5/7只有静态，要求补齐。初次提升确实static_only_courses四课，sp2新修旁白也未提升，菜单总数8并不代表8成课。
- 影响：用户必须亲自发现完整课堂缺失；静态检查再多也不能产生音轨同步能力。
- 证据：promotion-report.json上述字段；integration/releases/1791393662820251000-before-process-retrospective/special-series-review.md保留先前统筹记录；旧queue七课无启动依赖、同时active，阶段字段不能成为完整交付。
- 聊天核对：sp4初轮（聊天01a11525-406c-7d70-8e6d-5955f7f0f111，turn01a1168e-1cd1-7f11-9881-a20169cbbbd1）明确“配音授权问题仍待回答，因此实测时长、完整时间轴及正式双产品尚未生成”；sp5初轮（聊天01a11525-5214-7ce1-9367-725c18f7d0f5，turn01a1168e-2bf0-75b0-a71b-1e09f458bfb6）明确accepted=false、音频和音画同步未验。before-integration/work/special-series/course-queue.json（8615e7c2…）中四课无reported_pending_items字段。已上报缺项未成为中央关闭任务，不能概括为子任务都假称整课完成。
- 直接原因：配音服务/授权受阻，候选只有静态，但统筹先完成目录可见后没有维护到交付的明确关闭条件。
- 流程根因：交接没有逐项缺口、下一执行者和完成证据；“聊天结束/有产物/已加入”几种语言混用。不能从现有证据推出“并行必然降质量”或“推理强度不足”。
- 已修：当前queue分开formal_release_complete、classroom_available、human_listening；Home门禁阻止未验课堂；3/4/5/7配音按授权继续，3/4/5/7已统一技术验收。
- 残留：状态schema仍是自由字符串、多份JSON/Markdown手工更新会漂移；后续记录需区分授权等待与已授权的执行/验收等待，不得继续沿用sp3“待授权”的旧状态。

- 本轮sp1闭环：旧有声因实质物理错误被状态门禁暂时关闭，但替代稿未立即完成，用户发现原课堂消失。临时下线不能解除统筹完成替代和告知缺项的责任；仅发布纠错静态且队列停在“待授权”不足以交付。本轮按独立内容核准→exact载荷有效授权→真实音轨→冻结技术验收→root串行晋级→原用户刷新完成技术替代，入口已恢复；完整人工核准仍单列。

- 预防规则：静态通过只更新candidate对应范围；本课制作人逐项交出音轨、同步、导出、入口等缺项，中央在原queue追到复验关闭。普通修订保持已验旧课堂可访问，新候选未通过不撤旧版；已证实旧版关键教学错误需限制时，中央登记证据、替代入口、下一处理人及关闭条件。

### R02 内容冻结太晚，授权与实际语音载荷未作为独立合同

- 现象：配音开始后修物理/公式/单位/作业，出现原稿授权、当前稿、旧缓存、补充授权交错；自动审批拒绝把原授权扩大到新增措辞。sp3旧报告还写原批准175句/另3句已生成/6句待批；sp1最早修订提案167句，原任务与媒体独立复核后最终载荷为170句/4850字，不能继续沿用旧待授权提案。
- 影响：重复等待、版本回退、重建；错误复用会得到“当前字幕+旧口播”。授权范围不清时额外外发既不能擅自执行，也不能不断把已有效授权当不存在。
- 证据：sp3/review-report.md:7–13；sp3/source-revisions/speech-amendments-2026-10-07/review-report-before.md:31–39；sp1/physical-revision-review.txt:35–37；integration/speech-amendments-request.json、sp3-six-sentence-consent.json。
- 直接原因：内容改动晚于TTS，原registry整稿SHA与当前稿不同；音句cache最初更偏文件名/recipe，对实际字节、句时及外发差集约束不统一。
- 流程根因：内容审阅、物理审阅、源任务覆盖未组成配音前冻结闸门；“本地合成/组装来源绑定”与“允许实际送出的句子集合”未分开设计。
- 已修：当前逐句签名绑定文本/声线/参数/实际MP3 SHA；sp3 dedicated six guard在每次网络尝试前绑定exact6/233字/固定Yunxi/consent/178cache；generic make_audio_neural已cache_only；新外发不以整稿登记推断。旧文件和未改缓存保留。
- 残留：各课私有音频管线不同，主工具通用recipe还需统一明确授权差集接口；合成守卫不等于正确读音，人工听感待确认。

- 本轮sp1：初次自动审批拒绝发生在执行/外发之前，根随后只请求一次具体170句/e097载荷、固定Bing服务与Yunxi的补充授权，用户明确同意；169唯一句一次成功、重复句复用。逐尝试守卫、有限预算/超时、失败可恢复和来源缓存已在本课管线实修。P11坐标、P4模拟初态及共享字幕仅本地改动，逐字/时轴/音轨证据证明可复用，后续0外发；旧run保留其实际原scope，当前local-only scope另记，不伪改原网络记录。此为本课和sp3具体实现，通用全项目接口仍待统一。

- 预防规则：按规范第二节先独立内容冻结再配音；整稿组装绑定、授权允许文本、逐句缓存身份分开。只汇总未覆盖差集，实际发送每次检查；改句才重配，成功音句不重发。

### R03 物理正确审查与原PPT教学任务覆盖混在一起

- 现象：sp1原“已定稿经验”含CMG机制等实质物理错；sp2线圈箭头/磁通链混淆、重复测验；sp4理想振幅单位/瞬时功率与净获能、重复迁移题；sp6归一化亮度、包络峰位置、CD标定、任务削弱；sp3口播公式结合/单位/弱阻尼初态；sp8任务轮数、记录提交遗漏。
- 影响：功能/版式通过仍可能教错物理、暗示假实时学生后台，或丢失教师原定课堂/作业要求。
- 证据：sp1/physical-revision-review.txt:5–33；sp2/independent-review.md:25–36；sp4/physics-review.json.findings[PHY-01..06,SOURCE-HW-01]；sp6/independent-review.md:18–44；integration/learning-activities-audit/review.md:5–34；sp8/physics-review/current-course-audit-notes.md:20–38。
- 直接原因：以“核心概念都有/原页source_pages全覆盖”代替对每个推导前提、实验观察、学生行动、提交物/轮数/字数/必选要求的审查。
- 流程根因：源覆盖表只在制作中零散形成，缺“原页要求→当前元素/讲稿→保留或改变理由→独立审核”可执行记录。修物理时削弱作业没有记变更，随后才补屏显。
- 已修：恢复原任务、平台与学生记录，原科学模型边界保持；屏显纯补项不改 narration，精确证明语音可复用后重新检查变化页/导出；伪学生/AI后台移除并说明。
- 残留：平台当前可用/登录/提交未验。文本给出原网址不等于已实现后台或AI讨论。sp1本轮已完成这一层原任务审阅；完整参考仍须全课人工听审和最终教师节奏核准。

- 本轮sp1源覆盖：XML文字不能读取原P11/P16栅格图中的AI任务/预习要求，制作方初次“已冻结”也曾误把源滑雪视频称冬奥会。独立逐17页PDF与媒体语义核查确认实际2023北京世界杯、对接模拟动画，配音前撤回错误冻结并修正。原苏格拉底AI对话/物理核对/平台和§4.4–4.7、§4-5接地点参考系问题已保留；原稿没有的3轮/150字/提交要求不凭其他课复制。公式和数字另有独立物理签署，57.4J/34.1J按实际模型结果取位。证据：sp1/source-review/source-coverage-review.md、content-freeze.json及independent-review三份原内容/布局/模型补充签核。

- 预防规则：原页、备注、动画、栅格内文字、媒体和学生任务逐项对应到新元素/活动，物理公式另行独立验算；原任务力度有改变须说明和核准，不把source_pages或XML抽取成功当教学覆盖。

### R04 字幕、步进和题卡共用锚点造成提问被截断

- 现象：sp5题干同step1一整句第4句，原生成按句首暂停，截条件/邀请；sp8四题早于完整作答指令末；sp7仅0.4/0.65秒空白在2.5×自然运行曾晚于下一句约0.108/0.200秒。文本时间表正确不能抵抗实际timeupdate调度延迟。
- 影响：用户听不到完整问题或答案先泄露；所有后续字幕/模拟/视频同步可能沿旧轴。
- 证据：sp5/review/quiz-pause-review.md:3、13–27、55–80；sp8/physics-review/current-course-audit-notes.md:7–18；sp7/handoff.md:47–48、76；sp1/peer-media-audit-summary.md“可推广范围与缺口”列各课实际原gap。
- 直接原因：visual at marker定位到句内或句首却也用于quiz pause；以“下一句时间大于trigger”太弱条件放行；重建后旧pagecache仍被接受。
- 流程根因：教学锚点没有单独语义；最高倍速/完整提问/答案未抢入不是配音和播放器的共同交接条件。
- 已修：after_sentence唯一匹配真实完整句末、pause_margin与sentence_pause_overrides进入共享build_web检查；真实句后留白及后续所有时轴重建；自然1×/2.5×正误/锁播/继续实测。sp3私有gap policy按4题邀请句取PCM末端，P6需要跨页下一句，不得脚本硬认同页有后句。
- 残留：句内动画/激光时间仍有按字符比例插值，时表一致不代表逐词声学对齐；应人工检查关键公式/图示关键词。不得靠大量无意义静音凑18–22分钟。

- 本轮新增真实默认答案泄露：P11/P12未来解答虽未揭示在舞台，却在完整右栏字幕预先可读。根最初按theme=special过滤还错误影响pre_vector普通数学课；最终仅按COURSE_ID spN过滤Sidebar输入subs，字幕点击/滚动/自然跟随/2.5倍及普通完整列表十课真实回归通过。精确逆向一行恢复原Home，其他21已捕获模块保持。原泄露与theme失败保留；机器时间表一致不能证明默认所有可见渠道不泄题。

- 预防规则：完整问题/前提/邀请句末独立锚定；最终真实PCM与最高倍速自然跨题检查，等待作答时同时查舞台、整列表字幕、热点和默认答疑。字幕时表与自身source相同不能代替联合呈现验收。

### R05 模拟和视频没有统一的状态所有权

- 现象：旧demo/reset单次消息在回拖/跳入/迟载不能重现绝对状态，暂停手调可能被同父快照覆盖；sp3 video-wrapper VM初测43/55失败，有静态manual被playing=false的重复快照强制复位、anchor前0.02秒提前播放；sp3参数重启后按钮仍“开始”。旧native视频React时间快照导致活动视频漂移，rate/loop/seek边界未完整处理。
- 影响：口播、画面、参数、按钮语义不同步，用户回退与播放下行为不同；“数学公式正确”不能证实交互可用。
- 证据：sp7/review/final-delta-review.md:12–20；sp5/sim/protocol-migration.md:47–66；sp3/sim/video-wrapper-validation-first-failure.md:5–13；sp3-browser-qa/manual-label-probe.json(8/8真实复现)；sp3/review/manual-play-button-label-fix.md；sp7/review/final-video-measurement-checks.md；sp2-browser-qa/train-final-clock-review.json。
- 直接原因：演示命令作为推进器而非当前音轨绝对状态；手动/自动控制边界不清；native视频读旧render time、频繁seek和环绕误差；参数running修改未同步按钮。
- 流程根因：每课协议自建，播放器与模拟之间无正式输入、状态读数、人工覆盖/恢复规则，测试又使用stub证明内部一致。
- 已修：timelineSync opt-in lecture-state绝对时钟、迟载补状态、静态确定快照、暂停手动及恢复规则；native SyncedVideo读取live audio.currentTime并处理rate/loop/inflight seek；修单一button label branch。
- 残留：sp3真音轨同步统一复验已按当前scope闭环，标签私有真实8例有独立历史证据；不同manual设计必须逐模式声明，不能把“暂停父音轨后参数重启本地demo”误报成非法自动播放。

- 本轮sp1 P4真实边界错误：收臂cue前r=0.80，cue启动却从1.00开始，实际先伸臂/减速，与旁白相反；仅看公式、终态或发消息成功会漏掉。根只将P4 lecture-state收臂初值改0.80，保持7秒/模型公式/讲稿音轨，独立1×/2.5×自然跨cue、回拖重进及真实HUD独立I/L/ω/K验算通过，P9/P11另验。时钟诊断允许本课慢7秒模型最多0.4秒实测墙钟滞后，暂停和最新真实消息须≤0.02秒；并非帧精确或通用放宽。原WebGL绘制跨帧样本未保存，不能把该历史失败武断归因某一调度机制。

- 预防规则：每模型/视频先声明真实字段、自动/手动控制权和cue前态/方向；独立物理预期检查自然跨cue、回拖重入、迟载/恢复，并以实际原生媒体时钟及真实读数采样。

### R06 全屏、侧栏、批注和末端状态是实际使用缺陷

- 现象：题卡放在body而fullscreen子树只见stage，或切换portal宿主重建组件丢picked；答题时stage键盘/progress能越过；点击热点退出全屏但Sidebar仍collapsed，重复热点不能强制展开；静态window.prompt被宿主抑制且输入时箭头/空格可能翻页；互动题按钮压页码；sp7 ended后末页正文清空。
- 影响：用户看不到题/答复、丢选择、跳过题、无法记笔记、末页作业消失。前端DOM计数或截图存在不能确认这些行为。
- 证据：sp6/independent-review.md:201–224（全屏、选择状态、真实回显边界）；sp4 final-browser-review.json中的sidebar-only范围及6回归；sp5-browser-qa/visual/review.md/collapsed-result-manifest.json/pause-transition-result-manifest.json；当前Home.tsx:83–96稳定portal宿主、132锁播、324–340侧栏，SlidesOnly.tsx:107–110原生HTMLdialog/233题锁/469互动题位置/518备注dialog；sp7/handoff.md:69–72。
- 直接原因：fullscreen DOM边界、组件局部状态、不同入口事件处理、侧栏状态与父选择相互独立；末页查找使用t<t_end而最后gap/ended落区间外。
- 流程根因：把“放大/点击/回复成功”拆成独立测试，未覆盖完整用户动作链与端点；私有preview改Teacher或Home规避视觉问题，不能作为当前公共UI证明。
- 已修：稳定portal host移动、统一答题锁、revealVersion、真实dialog、button bottom-16与Q唤醒；变化范围新测并保留旧绑定。
- 本轮新增闭环：取证时的Home17f91d…半开区间在当前正式六课均真实复现末页清空/上一页无效。中央只补三行末页fallback，Home变为f057d942…，其它组件与静态/共享JS/CSS字节保持；f38e8e56…历史绑定下六专题+shm/pre_vector八课16次原生trusted ended、上一页/回拖/重播及普通首题锁播通过。证据为 integration/end-of-course-qa/baseline/verified-baseline-manifest.json（019bdd8a…）、regression/final-integrated-manifest.json（d80ea3de…）、end-page-source-proof.json及end-page-final-review.json（d35ac51b…）。这证明最小修复的实际范围，不等于人工连续听审；sp3新音轨另有两次原生trusted ended及恢复通过，当前版本的定向验收与精确复用范围见integration/sp3-final-review.json。

- 预防规则：按规范关键风险矩阵验完整用户链，分别记录默认教师/全屏、题卡锁播、热点展开侧栏、批注退出和真实ended末页；未执行过的入口/模式不据DOM数量授予通过。

### R07 候选、公用源码和dist同时变动，验收没有稳定窗口

- 现象：sp4中央矩阵期间根提升sidebar-only，同一次报告实际加载CFD和CT4两代main；独立候选renderer为dc4/06ac等，公共UI后又修0cc38，原报告仍指旧源码；sp6 reviewed snapshot与正式source序列化不同；public和dist/导出各有一份。
- 影响：通过报告无法直接回答用户实际执行哪组文件；“source hash相同”不能证明编译阶段没有私有转换；旧截图也不能凭新配音名字升级。
- 证据：sp4 final-browser-review.json.explicit_reuse_and_resolved_failures（initial_whole_batch_passed=false、mixed_UI_modules、fatal Dist entry differs）；sp7/handoff.md:59–61、76–78；sp5/current-task-visible-review.md:7、55；sp1/peer-media-audit-summary.md“可推广范围”；sp6-formal-source-review-latest.json。
- 直接原因：shared promotion与central QA交错；版本绑定范围不够精细；当前字段和历史字段不分。
- 流程根因：公共写者虽集中，仍缺“冻结构建→集中复核→状态发布”短事务；私有候选不是正式集成版本却常被拿来支持全课结论。
- 已修：root增量快照/实际HTTP资源before-after SHA、原编译模块identity、源码重建证明、变化范围专门复测；releases保留旧失败；sp6格式差异formal equivalent明确。
- 残留：多个文件手工同步、没有通用release ID和发布锁；不应再增加互相竞争的manifest。下一批复用现有release文件，补固定schema/闸门。

- 本轮发布按已签署私有候选→UI和课件隐藏晋级→完整PCM/逐句/资源/导出核查→目录开放→正式入口与原IAB顺序执行。正式导出70dd与私有ecb8字节不同：内嵌完整DATA/8图片相同，正式JS/CSS另绑central static stage并新验两视频×两入口；没有把旧导出hash换名当新验。候选a898的dist_entry描述字段仍残留e470，根第一道“描述字典应相等”检查失败后未继续别名写入；实际完整stage表、独立输入HTTP/index42af及mainc2cab稳定，正式也是42af，root proof8f3a明确排除旧描述字段，原候选不改身份。这是manifest字段更新不完整，通用schema/发布锁仍需先修。原用户页从mainBm6更新DX9并看到8/8，服务PID67391保持。

- 六份原始sp2/4/5/6/7/8-release仍有final_series_review活动路径配历史30a038 SHA；此为原发布时记录，不指当前606ab8。该SHA从当前总报告prior_six_course_report的保留文件精确可追溯；当前global的逐课复用范围与新测引用另行闭环。保持raw身份，不将其SHA改成新总报告；下一批通用schema必须把历史引用直接写到不可变快照。

- 预防规则：单课候选隔离，公共主写/发布/正式验收串行；候选源、真实音轨、字幕、素材、live chunk和导出内嵌chunk全绑定。历史SHA指不可变保留快照；只按差异证明复用旧报告，不能重签旧记录。

### R08 中央8项目录与用户1项：已证明的原因层次

- 现象：真实IAB旧页面只有sp1，直接HTTP当前JSON8项，普通reload仍1项；部署CourseMenu每次t=Date.now与cache=no-store后同IAB8项，未重启服务。
- 影响：中央fresh headless通过不能代表用户正在打开的旧页；用户感知未交付。
- 证据：menu-cache-review.json.problem/cause_limits/change/actual_user_IAB_verified；menu-cache-before.json；menu-cache-fixed.png；根本次menu-service-retrospective-probe.json。
- 能确定的直接原因：用户页面目录状态与当时直接HTTP取回的目录状态不一致；目录fetch缺cache策略，修后该具体用户页恢复。失败时缓存来源或服务瞬态未记录。
- 不能推出：不能把浏览器磁盘缓存、内存cache、旧React状态、304协商、错误端口/目录/服务重启中的任一种写成已核定历史唯一原因。当前唯一路径/PID/HTTP==dist证明当前服务正确，不能回填历史缺失的request/response provenance。
- 流程根因：验收没有采集真实user tab URL、实际资源请求/response来源以及当前DOM；只查本地文件或fresh browser。服务无Cache-Control/ETag但正确Last-Modified仅是当前事实，不是失败时自动因果证明。
- 已修：CourseMenu t+no-store和当前真实IAB8项通过；根Probe确认唯一8081/PID67391/currentdist，index/slides/menu served SHA==dist，menu public==dist。
- 残留：服务重启/旧书签/更旧bundle/异常目录加载未全测试。规则应要求真实入口受控更新并记录失败网络来源，不作“缓存全解决”保证。

- 预防规则：故障时先采实际URL、DOM、请求来源、HTTP字节、PID/端口/服务目录，再分环境和产品原因。普通刷新、直链、旧书签及重启按真实环境分别验证；未知历史缓存机制继续标待核实。

### R09 子任务交接没有显式指明下一执行者

- 新事实：sp3/pipeline/operational-status.json:4/28/51在17:12:58Z写pending-root-tool-approval、actual_network_execution_owner='root with actual tool approval'，但最近制作聊天只说修标签，根仍以为制作方在配音。178cache和专用sixrunner已齐，网络调用未发生；根直到看精确status才接管，并按已有效直接授权一次生成六句。
- 影响：授权已齐仍无谓等待；用户可能再次质疑第三节段为何无课堂。
- 直接原因：状态文件有责任信息，但交接未显式上报“请根执行命令及理由/我已完成什么”。
- 流程根因：请求/负责人与下一步实际工具执行者不明确，统筹没有及时读取并响应责任转移；不能单归责子任务，也不能写用户未授权。
- 已修：根已执行exact-six，制作方后续组装；此修复只是本次交接，不是自动流程普遍完成。
- 预防规则：交接必须有下一执行者、精确命令/输入版本、网络/本地行为、已有效授权、需要根处理的具体事项；统筹收到blocking或handoff即明确ack并更新queue，不靠下一轮普通commentary推断。

- 收尾复核还发现主speech-request当前字段残留sp3 proposed/pending/blocked，虽有效six授权及当前产物已完成，仍会误导下一执行者。本轮保全原完整字节与拒绝事实，将旧amendment记录明确为历史，当前字段绑定已完成sp3/sp4、exact6和sp1独立exact170；baseline授权数组、原许可及six载荷不改，0新外发。证据：integration/speech-request-status-resolution.json（2166b8b3344d48d58103689555c3287384bfa2edf4b4574c44d0066aa3943c8d）。元数据修正不是新增或扩大授权，也不能追改原网络报告。

### R10 首尾视频抽帧与几何通过不能证明媒体教学正确或无遮挡

- 现象：独立实际视觉复核在sp3 P11/P20全屏发现默认教师覆盖相位图末端与红字；普通全屏按钮局部压页码，静态提示条压页脚。root进一步逐帧读原MRI视频，0–5秒为心脏、5–10秒为RF激发示意、10–15秒回心脏；既有旁白和source-media却声称不含RF动画。
- 影响：几何和时间同步报告通过，用户仍会遇到实际图文遮挡或画面与讲稿相矛盾。后者是教学错误，不能用readyState/帧推进通过抵消。
- 证据：integration/sp3-browser-qa/visual-independent/review.json（65b22221…）保留原失败图；media-content-diagnostic/frames.json、source-mri-t09.png、asset-mri-t09.png及15帧语义sheet。原媒体SHA4d108ff6…、正式派生旧SHA660b8bba…均含RF中段。原抽帧仅0、2、14.4秒，遗漏5–10秒。
- 直接原因：未将默认教师透明墨迹与实际正文/图轴纳入几何范围；只看媒体首尾并将描述metadata当画面事实。静态视频spinner还需区别捕获瞬态和持续加载：独立视频实测readyState=4、seeking=false与干净decoded画面，原黑圈截图不能独自判播放故障。
- 流程根因：视觉复核与机器检查职责混用，配音前媒体各语义段未核准。统筹接受了未覆盖中段的媒体结论；source metadata与讲稿之间自洽不等于真实源画面正确。
- 已修措施与范围：P11模拟宽度1700→1470；P20两段文字x1300→1220、宽500→360、字号保持，派生热点x1550→1400。MRI从30fps原视频选帧[0,140)与[314,450)，排除RF和转场，共276帧/9.2秒；保留原720高画面并加128高黑边供原生控件使用，原片和旧派生片完整保留。P21独立MRI模型承接RF教学意图。独立逐帧映射与四张全尺寸边界图已审，184句及音轨字节保持；源1bc058…最终保持，当前f8541f…候选/课堂已定向技术验收；原0300截图仍保留其真实身份，按仅build_ts和静态wrapper差异精确投影。公共控件三处CSS已实修：全屏按钮上移避页码，静态提示条置页脚下，按钮z20→z40解除opacity=0教师图仍拦指针；该次冻结48158共享版16课堂场景及28静态场景真实控件回归通过。z层修复保持题卡z50。
- 残留风险：sp3当前两页布局、实际新媒体、相关热点和字幕已定向验收；其他23页/184句等依精确等价证明复用。默认阿强16姿态是原图全边界推算加实际姿态截图，非16姿态新截图、其他角色或用户任意拖动后的验证；普通页码区域有alpha1/255极微透明残余，未见可见盖号，报告如实保留。源、媒体和UI改变分别决定失效范围，不能把旧报告简单改hash。规则已加媒体各语义段/转场、全部有效姿态边界、真实指针点击、导出内嵌renderer依赖检查。全课人工听感仍待确认。

- 预防规则：配音前由独立人审媒体每个教学语义段、转场、字幕、实拍/模拟身份及图片内字；正式视觉审查包括默认教师、可见有效姿态、图轴/署名/原生控件，机器几何检查不能代签。

### R11 中央前置检查失败后仍执行本地晋级

- 现象：最终sp3 handoff字段new_external_requests_needed是整数0，中央错误要求其身份为布尔false，断言失败；同次shell用换行连接后续命令，没有失败即停止，本地integrate.py继续执行。
- 影响：前置闸门与真实动作脱节；即使本次正确，也不能把有独立检查的流程当作fail-closed。没有新网络调用。
- 证据：integration/sp3-promotion-preflight-correction.json；当前handoff SHA265d3c…；最终晋级release记录0300f4…/1bc058…/4f71…。旧release精确字节已恢复并核对等于历史视频/字幕报告所绑5158c6…。
- 直接原因：count/state字段类型不一致，调用方错误身份比较；未检查前一步返回码。
- 流程根因：状态合同未分型，工具前置检查与执行的依赖关系未写成强制接口；此处是中央执行错误，不归责子任务或授权。
- 已修措施：本次再次逐字段、源、晋级JSON/音轨核查；integrate.py自身稳定snapshot、源/字幕/完整PCM校验实际通过，因此当前产物正确。后续本轮检查与变更分工具调用、先读结果再执行；规范已写整数/布尔分型及失败即停止。
- 残留：通用handoff schema、统一发布锁及工具强制fail-closed尚待最小实现，不把操作纠正说成全项目代码已修。

- 预防规则：前置失败与后续发布分步、失败即停止；字段按整数/布尔真实合同判断。工具返回码结合输出与预期状态，关闭端口无监听可为成功；不得用错误断言修改课程或放松要求。

### R12 静态视频的原生进度条绕过页面指针事件

- 现象：最终sp3两个静态入口真实点击MRI native进度条，trusted seeking/seeked到6.0396秒，随后canplay再次sync并seek回0、pause。父静态step1/pageTime=anchor/target0未变。
- 影响：用户无法从任意视频位置观察；“Play/Pause正常”和视频readyState=4不能证明手动seek可用。
- 证据：sp3-browser-qa/model-media/final-current/native-static-controls-confirmed-failure-evidence.json及manifest两入口明确failed；前面的probe采集报告passed仅表示诊断采集完成，不能算功能通过。旧wrapper e44009…/data0300…已保留。
- 直接原因：static manual ownership仅依赖video pointerdown，而浏览器UA原生controls吞掉这个事件；canplay将真实用户seek当作尚未手调，抢回父锚点。
- 流程根因：VM用主动pointerdown stub证明自身一致，没有覆盖真实原生控件事件；真实浏览器旧范围只核对播放/暂停。控制权合同没有明确暂停和播放中native seek保持这一项。
- 已修措施：本课wrapper删除pointerdown依赖；static仅在明确step/mode改变及loadedmetadata对齐，同step重复快照/canplay交给原生控制；hide暂停，static可见恢复保持用户位置。当前wrapper2c66a2…、dataf8541f…，仅build_ts语义变化；该次源1bc、音轨4f71、MRI42f4、共享48158保持；维护前3917的static/media分支按精确无影响证明复用。修复已正式晋级并开放；六视频上下文×两静态入口的真实Play/Pause、paused与playing seek及canplay位置保持、真实父页下一步/上一步重新锚定12项通过，MRI课堂1/2.5/loop/seek/迟载对照通过。证据：model-media/final-current/final-current-model-media-manifest.json，SHA d1fb3cd0d9ec95973bc511e88abd98ef4fd8161410f60aa04b20a6b737d1f1b5。未将新代码存在算通过。
- 残留：真实visibility事件以执行环境能产生的范围记录；无事件的headless切页不能证明真实桌面后台恢复。课堂交互逻辑按精确分支等价复用并加MRI最高速对照；不伪造TTS或为此改音轨。

- 预防规则：真实浏览器分别检查两静态入口的原生Play/Pause、paused/playing seek、canplay位置保持和循环；先退出上一批注模式，记录可信事件实际落点，不用合成play/force掩盖问题。

## 3. 验收脚本自身的具体缺陷

| 缺陷与真实错误 | 影响/不能推出 | 已修文件与依据 | 后续规则 |
|---|---|---|---|
| sp4测试运行中UI混代，结束binding错误 | 单次45先通过不能称稳定最终batch全通过 | final-browser-review.json.explicit_reuse_and_resolved_failures；sidebar-reveal-source-binding.json精确复原旧Home/Sidebar；6当前sidebar与4失败case重测 | 公共提升和central QA串行；原报告不改身份，精确证明可复用再列新测范围 |
| sp4 P18 seek越页末、P19 reveal前进度量化、count1 ArrowLeft no-op、不存在mode1/2 | 测试期待的是虚构控件/状态，不能改模拟满足假断言 | auxiliary-simulation-final.mjs与上述JSON.harness_corrections；static-final-review.mjs重测 | 从实际UI读选项/范围；记录实际audio time而非目标；guard页面仍相同 |
| sp6沿用N/r，实际state是count/ratio | undefined失败属于harness schema错 | final-integrated-manifest.json.original_failed_runs_preserved；final-model-static/run.mjs:40、150–158 | simulation adapter必须有实际字段合同，独立模型验算读取数值控件/状态 |
| sp6静态步前后即时读，无render/message等待 | Static step2 not baseline不能证明产品错误 | final-model-static/run.mjs:196–199增加真实更新等待，原fail保留 | 等待有限UI条件；若超时收集DOM/iframe state/parent step，不不断加sleep掩盖 |
| sp6 observation标题N500来自常驻preset按钮，实际readout仍200；回拖样本早demo 45ms | 名字不是数值证明；pre-anchor不能说in-demo rewind | sp6/independent-review.md:205–214排除4错误记录、指明实际numeric/readout替代 | 数据断言与记录命名都来自实际数值、真实起点；保留被排除观察 |
| sp3静态脚本从其他课复制遗留audio metadata | 无声payload不能声称有声同步；dead helper也不能算执行coverage | sp3-static-review-qa/preflight-history/*unused-audio-metadata、当前run.mjs:20只executedSections=static、当前matrix与两路线复测 | 无关参数不得进入report；report需从实际executed cases和资源生成，静态和课堂分型 |
| sp8旧pre-gap/1×报告向新音轨推广，P16元素插入变elIdx | 旧时间/上下文不是当前证明 | new-media/final-integrated-manifest.json.old_ui_evidence_reuse：exclude old timing、P16上下文重测；旧final-current-scope-manifest保持历史 | 重配/静音变长=重算全后轴；screen-only内容索引变化也重新测热点context |
| sp7视频loadeddata/locator timeout与P8模型期待不匹配 | 失败需区分资源、reveal与时钟；“init passed”不能推出播放出帧 | final-integrated-manifest.original_failed_runs_preserved、video-final与simulation-p8-final替代case | readyState>=2+非零尺寸+实际time/frame；active误差用同JS原子audio/video快照及loop残差 |
| 版式检查只看顶层框/DOM数量、首轮在.wl-in淡入截屏 | 可通过却公式透明/iframe内部小字/实验图误标；截图存在不能证明实际逐张审查 | sp2/independent-review.md:36重拍opacity=1；sp7/source/course-source-coverage.md截图段；sp6review:222区分49reference notices | 固定动画稳定条件，关键iframe与图身份人工原图检查；学生操作链另验 |
| 本轮sp3播放热点补测等`.wl-in`包装层可见、结束探针等隐藏audio可见，实际绝对定位子元素有正文/音频本来隐藏 | 这是测试前提错误，不能报课件公式或音频丢失；结束探针JSON对象插入顺序还曾误报不稳定 | sp3-browser-qa/transitions/history-wrapper-visibility保留4失败；改验真实渲染子元素后4操作分支/5次播放到点击暂停通过。end-of-course-qa保留首轮失败并按稳定规范化资源对照 | 薄测试适配器声明实际DOM/字段，正控制与实际资源绑定；先分清harness与产品问题，再改最小必要处 |
| sp1普通布局误带qa参数，QaRunner同时推进音轨 | 原标P1实际P2、标P4实际P7，17页/FS截图均撤回，不能按文件名计验收；qa=0也开启 | 原失败与无效图保留，新无qa地址按实际native页区间+DOM唯一页号重验17页/9FS；七课引用链逐报告审计未发现当前题卡/模型证据依赖该错误链（sp1/source-review/rule-records/qa-url-audit.json，SHA0b4a0267464c7645d1e8834e7e41935541063821b8d19cd4838b9736a3926be5） | 普通验收禁止任何qa键；诊断自巡检单独等待结束，不能与手动/自然操作竞争；静态版式不能冒充课堂几何 |
| sp1异步分读父/子时钟与WebGL帧，固定700ms判断滚动 | 不是天然证明产品漂移/滚动坏；原6次response body异常缺URL/status也不能称确定缓存/重定向原因 | 同源真实clock样本/RAF-HUD配对、实际seek/滚动条件采集；bounded1500ms可见，0/100/300/800/1500采样保留；错误response需记录URL/status/final bytes | 保留原fail，按实际合同校准采样，记录真实事件；不任意放宽物理误差或用等待掩盖超时 |
| sp1批注测试留画布开启，下一测试native视频点击失败 | 画布实际正确拦截，不能报视频不能播放 | 原119整体failed保留；同点trusted canvas pointerdown无play、退出批注后trusted native play实进.503秒；115有效旧项+4定向补测另记，正式4视频再验 | 跨功能测试先记录/结束上一模式，采真实事件落点，不能用force或合成play绕过；规则仅documented，不冒称产品修复 |
| 根正式末页断言写4.5，真实源稿屏显§4-5 | 8课堂和两首末题已通过但整轮failed；不等于原任务丢失 | 四真实静态新/旧入口诊断保留完整任务，按独立源稿§4-5并加真实平台href/苏格拉底/物理核对/17页断言，正式整轮8课堂/14静态通过；原失败完整保留 | 教学预期来自原任务审阅，区分等价编号与缺内容；不修改课件迎合错误测试文字 |
| 最终清理探针同时查正式8081与已关闭8191/8192，却要求lsof总返回0 | 报错行6实际是端口检查，非行5目录断言；不能据此称课堂再次撤下 | integration/sp1-cleanup-failed-command.json保留实际命令与失败输出；重复合并查询仅列原PID67391而返回1。sp1_complete_update.py改为逐端口核对真实监听行、PID及正式目录，sp1-cleanup-final-review.json记录8/8菜单字节和临时端口为空；无产品改动、重启或新TTS | 返回码须结合工具语义和预期状态；关闭端口无监听是预期结果。失败先定位实际行和输出，不能误诊缓存、菜单或服务漂移 |

本轮另保留sp3媒体harness错误：拖进度条自动播放却假设暂停；缩放后静态原生视频控件坐标错误；迟载替身about:blank执行上下文与真实iframe不一致；2.5倍短暂seeking与稳定帧混同；题卡Continue实际推进0.109/0.152秒却未重新准备精确时刻；stage cue允许-0.05秒提前量而默认QA按准确阈值，二者误当同一闸门。这些原失败在model-media历史记录中保留，修正实际动作/条件后只计算明确有效case。透明教师拦截真实全屏按钮则是产品缺陷，不能归为harness错误。中央整数0/false误判和失败后继续执行见R11。

中央旧browser-check.mjs曾在sp6/sp8定点seek后手动dispatch timeupdate，再查DOM题卡；这只能是初始化smoke，不能用来证明原生自然题卡触发或教学节奏。旧脚本/报告已保留；本轮最终入口smoke去掉synthetic events与目录override，先从真实菜单进入，再由真实UI播放、原生seek准备后自然跨题点，与完整绑定矩阵分开。本轮最终脚本已执行通过8项/8课堂/14静态入口或末页任务检查（同路线的首/末页分别登记，不称14独立URL），以及sp1首末最高速题卡/真实ended和sp3最高速题卡/真实指针全屏/继续链；更完整的sp1自然矩阵由冻结独立报告另证。首次末页smoke只按End到step0却期待全部作业，属于harness前提错误；failed脚本与结果保留在releases/1791398654828618000-final-route-smoke-end-step-harness-failure/。按真实ArrowRight揭示完整末页并记录任务原文后重验通过。静态native控件矩阵首轮箭头焦点仍在iframe、被视频消费，也保留raw并改用父页真实点击；不能为这些错误修改课件。

共同的“实现与自身一致”风险：比较字幕文字与生成时同一source，只证明管线内部绑定，不证明源PPT意图或物理。模型browser expected从被测模型复制，最多证明时钟一致；必须另有独立公式、RK4/数值或原PPT约束。/api/ask abort后离线preset回显只证明offline fallback，不能假称在线AI服务；HTTP200不证明真实视频出帧，MP3解码/RMS不证明发音。

## 4. 已落实的经验与规则定位

执行标准只在[专题课件制作规范](../lecture_factory/专题课件制作经验.md)维护。本节指向该文件，不另立完成标准。以下均为本次已写入的文档规则；是否由工具自动执行，另看第6节的具体实现与验证。

| 真实经验 | 可直接执行的规则位置 | 解决的返工或漏交付 |
|---|---|---|
| R01/R03/R10：静态停步、源任务/图片内字遗漏、媒体中段漏审 | 第一节教学与媒体；第二节11阶段；第六节单课清单与教学覆盖表 | 配音前独立审物理/原任务/媒体；每阶段列产物、下一人及回退，静态完成不等于整课完成 |
| R02/R04：晚改讲稿、授权缓存错配、问题未问完或字幕先泄题 | 第四节冻结/授权/精确缓存与变更复用表；关键风险矩阵 | 未授权差集一次汇总；成功句不重发；实际PCM和所有默认呈现渠道共验 |
| R05/R06/R12：模型/视频控制权、全屏侧栏与上一批注模式残留 | 第一节模型媒体合同；第四节失败分型；第六节关键风险矩阵 | 真实用户动作链、独立物理预期、自然边界、原生控件与模式状态分别查 |
| R07/R11：混代、描述字段陈旧、前置失败仍发布 | 第四节证据失效；第五节公共组件/中央串行集成；第六节中央模板 | 稳定候选/实际chunk/导出绑定；失败即停；历史证据保留原身份且指可恢复快照 |
| R08：中央fresh会话替代真实旧页面 | 第二节用户环境验收；第六节风险矩阵与中央模板 | 真实目录/直链/旧书签/刷新/服务目录与已加载资源验证；不武断归因缓存 |
| R09：有效授权齐但双方等待，登记仍写旧阻塞 | 第五节容量、接手确认和升级；第六节子任务交接模板 | 每缺项有ID、证据、下一动作、实际负责人及确认；中央追到复验关闭 |
| sp1修订撤旧却未完成替换 | 第二节及第五节旧版保持/回滚规则 | 新候选隔离，验后中央替换；必要停用有证据、替代、责任与关闭条件 |

文档、机器、人工视觉、听审和教师核准分别签署，不能相互代替。规范中可填字段是执行合同，当前自由JSON并不会自动强制校验这些字段。现有技术报告仍有原范围：尤其sp2/4/5/6/7/8的真实用户证据只到目录可见，sp1/sp3也仅有原入口/局部播放操作；新增门槛不倒填为它们已经通过完整用户环境验收。

## 5. 下一批课程的具体实施方案

下一批尚未启动。本方案应用唯一规范，不创建新制作聊天、不外发配音、不批量重做sp1–8。当前8课继续按原技术范围开放；人工完整听审、教师最终核准和未覆盖的真实用户关键操作保留缺项，中央负责安排与跟踪，实际听审执行者尚未确认，不能代用户签署。

| 顺序 | 具体动作与负责人 | 本步产物和放行依据 | 失败或积压时 |
|---|---|---|---|
| 0. 关闭准入缺口 | 中央在原queue列现存缺项，指定真实接手人；工具维护者评估版本/发布保护、TTS差集接口和默认构建保留策略 | 现有证据、待办责任及接手确认；下一批将使用的实际工具入口核准。已有具体守卫/前检可按适用范围用；模板不是发布锁或原子切换代码 | 不能证明旧版隔离持续、写入与恢复安全，或实际外发无法守范围、复核人未承接时，不开放两课完整流水线；可安排单课隔离分析/候选，不能以降单课绕过发布或授权门槛 |
| 1. 批准一个完整参考 | 中央从sp1或sp2技术候选选一个；独立人核准原任务/物理，指定听审人听完整真实音轨，教师核准教学节奏，中央补真实入口关键操作 | 参考版本的原PPT、源、音轨、播放器、导出及五维状态绑定；人工听感与教学核准均有实际人/日期/范围 | 任何必需项未过，只称技术参考；不以ultra或机器数量代替完整核准 |
| 2. 决定批次 | 中央按规范第五节计算制作/独审/集成可承接能力、等待候选与共享缺项，填写实际人员和可用时间 | 有完整参考、两制作主写、一独审、一中央各明确职责且可用，才批准两课在制上限；这是上限，不是默认开两课 | 复核积压、中央待验超过一课、交接不完整或共享阻断：降单课并先清债；材料预登记不等于开工 |
| 3. 提取到冻结 | 每课主写在本课目录提取/设计/静态；独审轮流核准源任务、独立物理、图片内字和媒体语义；中央汇总真正未覆盖的外发差集 | 11阶段中接收、提取、设计、静态及内容冻结的签署产物；讲稿、题卡前提和实际教学节奏已审 | 回到出错阶段，只修受影响内容；授权等待继续不依赖配音的本地工作，不制造假时间轴 |
| 4. 配音与独立复核 | 各主写在隔离候选中按已有效范围生成改句、复用精确缓存并组装；独审按关键风险矩阵复核 | 实际音轨/PCM、字幕、步进、题卡、模型/视频/热点、静态双入口及人工听审的各自证据；每项缺口有下一人 | 旧缓存损坏或范围外文本停止外发；先分产品/环境/测试失败；精准补测，不无理由整课重发/整套重跑 |
| 5. 中央隔离集成与切换 | 中央独占公共写入，先保留旧版、前检、隔离构建/集成复验；在约定用户环境检查候选，再进入短串行窗口切换正式public/dist/export/菜单并立即核对原入口；必要共享补丁先清影响 | 切换前稳定候选技术/用户范围通过且旧版仍可访问；切换后served bytes及原入口一致、恢复方法明确；不能把逐文件copy或人工串行称整课原子切换 | 前置失败停止；未发布候选保持旧版，缺陷新版回滚已验旧版；无法证明持续访问/混版保护与恢复的路线不准发布，确需限制旧版按规范登记证据/替代/责任/关闭条件 |
| 6. 用户环境与正式交付 | 中央在实际用户入口验目录/直链/旧书签/刷新及关键操作；教师最终核准；原queue关闭缺项 | 单课清单五维均满足，原任务/物理、音轨听感、关键风险、正式字节和用户操作证据齐全，才设overall_complete | 未测环境/服务重启保持明确限制；人工或必需用户操作待定不称整体完成；当前技术开放与正式教学交付分开 |
| 7. 扩批决定 | 中央用前批实际制作、复核、集成耗时、等待和返工记录复核容量 | 前批必需缺项已关闭，共享版本稳定，独审和中央能接住才维持最多两课；不预设扩为八课 | 新共享问题或质量返工即降单课，重新分配接手；不以聊天结束、静态产出或通过数字扩批 |

速度来自早期独审、一个稳定参考、改句重配与精确缓存、按依赖补测、稳定薄适配器、输入未变不重复验证，以及缩短无人接手等待。下批课名、实际人员、时间和具体稿件在接收时填入，本文不编造开工或完成时间。

## 6. 工具链改进清单与实施状态

“必须先修”指下一批正式晋级前的门槛；已修代码给具体范围，尚未自动化的规则不得冒称工具已实现。 表中已有验证的修复是已关闭风险；未实现的发布保护、通用授权入口与构建审查是仍未通过的准入门槛，不能因排在同一优先级就称已全部完成。

| 优先级 | 项目 | 本轮状态 | 执行负责人、验收及边界 |
|---|---|---|---|
| 必须先修 | 末页真实ended/最后留白仍可查看与回退重播 | 代码已最小修复，当前八课实际回归通过；sp3新音轨两次真实ended及回退/回拖/重播也通过 | 中央先复现，再最小修共享选择逻辑；所有使用该逻辑的已开放课及普通课末端回归，不全面重写播放器 |
| 必须先修 | 候选冻结、晋级状态与旧版发布保护 | 文档规则已落地，包括typed字段/失败即停、隔离候选和旧版持续；现有integrate.py有稳定snapshot/PCM/source检查及逐文件保留替换，统一schema/发布锁、整课双版本/原子切换未实现。本次源码检查确认55–68行逐文件替换、158–171行循环写本课public/dist/export/menu，不能据其称整课无中断/无混版保障 | 下一批先评估并验证小型身份闸门、唯一写入保护和隔离切换/恢复方案；模板可执行人工前检但不是缺少代码保护的证明。未证明旧版持续、版本一致与恢复的路线不准发布；不另建竞争台账或全面重写播放器 |
| 必须先修 | 默认控件、媒体语义与嵌入导出依赖 | 默认教师遮挡已定位并作两页最小修补；MRI已9.2秒派生并逐帧核准；公共按钮/提示条/真实指针已修且定向回归；sp3两页视觉/媒体/热点/末端、static native seek已当前定向验收 | 制作前核准所有媒体语义段/转场，中央检查全部有效教师姿态边界和真实点击；live bundle与单文件内嵌bundle分别绑定；不因文件存在或几何通过放行 |
| 必须先修 | 实际TTS入口授权差集与签名缓存 | sp3 exact-six和sp1 exact170守卫实际执行通过，sp1每尝试许可/稳定有限预算/超时/缓存来源已实现；旧generic入口cache-only；全项目统一接口尚未实施 | 配音工具维护者先统一最小接口，发送范围/收件服务/文字/配方绑定，每次尝试拒绝未授权差集；现有有效许可继续沿用 |
| 必须先修 | 构建和缓存保留策略 | 中央build.mjs关闭永久删除并增量晋级；后续维护已实修两Vite配置emptyOutDir:false、copy-launchers无永久删除及build_web的FFmpeg临时文件归work；跨平台隔离构建、缓存单页真实FFmpeg和启动器保留测试已通过 | 这些修复只关闭具体删除/临时路径问题；完整重建的覆盖与保留审计、整课发布保护仍未完成，默认build不能替代专题晋级；实际删除按回收站 |
| 必须先修 | 题卡完整问题、真实留白与最高倍速 | build_web.py已修声明策略的实际cache检查；八课具体自然题卡报告和精确时轴复用有效；sp1新轨5题20自然正误/倍速例已验，默认未来字幕泄露已修并专项回归 | 完整问句独立核对，最终PCM以及1/2.5倍正误实测；只验时间表不放行，不给普通旧课强改时轴 |
| 必须先修 | 用户目录/直链与实际服务 | CourseMenu t+no-store、SpecialLecture状态门禁已代码修复并实际验当前IAB；后续Windows PS5.1/BAT真实传输已验，Edge发现首次播放换源竞态，修复及验证见下；历史目录故障原因仍待证 | 真实已有页、直接入口和新平台分开验证；加载迟到、首次持续播放、失败重试纳入发布风险；本次平台故障不追认历史目录问题也是同一原因 |
| 随后改进 | 原PPT教学覆盖表结构化 | 现有课程有各自映射/覆盖报告；本轮统一清单已写入规则，自动化未实施 | 模板逐项填原要求/当前元素或活动/改编理由/独立核准；不能仅source_pages覆盖率 |
| 随后改进 | 精简共享模拟协议及测试适配器 | timelineSync opt-in已存在，各模拟控制/字段仍不同 | 给各模型真实字段、控制权、恢复/rewind/迟载合同；保持物理独立验算，避免复制被测模型当真值 |
| 随后改进 | 报告分型、版本失效与真实页面诊断 | 旧失败保留、范围复用已有实例；所有脚本的通用schema未统一 | 静态/音轨/模型/用户环境分别出报告；原失败/无效截图/字段遗留和替代case原身份保留，按真实页号及上一模式核查；已知失败正控制；记录当前URL、资源版本、request来源，避免死字段和漂亮数字 |
| 随后改进 | 听审与节奏安排 | 人工听感全部pending；模板已给执行人、实际音轨与范围 | 教师真实听审重点推导/数字/单位/停顿并完整核准，机器只能查解码、组成、时轴和播放状态 |
| 可暂缓 | 全面重写播放器、批量重做已技术合格课、统一替换所有旧时轴 | 仅列为暂缓，不启动 | 先按实证最小修复和精确回归；未证实必要性不扩大工程范围 |
| 可暂缓 | 再复制多套视觉/DOM脚本、为演示效果伪造实时AI后台 | 不实施 | 复用一套风险矩阵与薄模型适配器；后台只有用户明确要求、真实权限/数据和验收时才做 |

## 7. 本次落地成果与未完成边界

- **文档已落地**：本复盘与逐课清单；既有专题规范内11阶段闸门、五状态、授权/缓存/版本规则、单课交付清单、子任务交接与中央集成模板；根README/工厂README不再建议直接删除缓存重跑。先前独立文档审阅6项产物定位通过（保留其原文档hash与范围，不代表本次更新自动通过）；“所有媒体/UI改动均重建时轴”的过宽句已按审阅意见改为依实际依赖失效，报告在integration/process-review-independent.json（90bb6927…）。本方案与优先级可以直接用于下一批的人工执行。
- **工具已有具体修复**：共享题卡/锁播/全屏、侧栏热点、静态备注/批注按钮、媒体时钟、Mac/Windows Range源码、目录加载与旧直链门禁；本轮新增三行末页保持、三处控件CSS、sp3 static视频所有权和MRI/两页几何修补、sp1物理/源任务/媒体修订与P4 cue/P11几何、special默认未来字幕过滤；范围以逐课运行报告及具体平台证据为准。Windows源码检查不能冒称真实Windows运行通过。
- **仍待实施或确认**：通用晋级schema/锁、全项目统一TTS差集守卫、完整生产重建的覆盖与保留审计；全部课程完整人工听感及最终教师教学核准；真实外部平台及在线AI、未测用户环境。末页缺陷本轮已真实复现、三行修复并验八课；全屏按钮、提示条及指针层最小CSS修复已定向回归；不据旧技术报告掩盖其曾被漏闭环的事实。

最主要的流程错误是完成标准混用、配音前教学内容冻结不足、交接缺项与下一执行者不明确，以及公共版本提升和验收交错。统筹对已上报缺项未追完、共享缺陷未关闭、真实用户旧页面未纳入交付验收及修订撤旧后未及时替换承担责任。下一批先批准完整参考，再按制作、独审和中央容量推进至多两课；不能承担复核时减为一课。质量按上述证据与边界判断，不承诺未经验证的零问题。

### 2026-10-08 后续项目整理与Windows验证

这是规范整理后的维护增量，不改写先前文档审阅的版本或范围。整理与双平台工具提交为 `e44193e`，原材料未移动删除，123份本机FFmpeg清单可恢复归入work，160份已被CSS引用的字体依赖补齐，旧哈希资源保留。维护清单与原失败保留于 `work/project-sync/2026-10-08/maintenance-report.json`；Git仅同步正式代码、课程产物和规则，不同步work、依赖环境及密钥。

| 现象 | 证据 | 直接原因 | 流程原因 | 修复状态 | 预防规则 |
|---|---|---|---|---|---|
| Windows目录和八音轨元数据通过，但首次单击课堂不能继续 | [首次CI](https://github.com/bibibibibibibibi/physics-interactive-lecture/actions/runs/37720193991)失败原件保留；[诊断CI](https://github.com/bibibibibibibibi/physics-interactive-lecture/actions/runs/37720917178)实际事件：286ms play，397ms src-change/abort/emptied，398ms AbortError，最终readyState=4却暂停/time=0；Mac仅延迟原JSON3秒也复现 | Home尚无课程数据时已挂无版本音轨和可点击按钮，build_ts到达后改src，中断播放 | 只验元数据/短启动，没有覆盖数据迟载与版本绑定；首版失败报告不保存媒体状态，不能立即归因 | Home先读取版本再挂播放器，HTTP/JSON错误可重试；隔离候选的special/普通入口、持续首播、503/无效JSON重试及2.5x首题锁播/继续已验；真实Windows修复后在提交283c7d2的CI中定向通过 | 迟载正控制、单击持续播放、失败重试；报告绑定目录/提交/入口SHA及src、媒体事件、错误；不以等待/二次点击掩盖产品竞态 |
| 新增题卡测试等不到已显示的正确反馈 | `work/project-sync/browser-smoke/2026-10-08T03-11-08-116Z/result.json`及失败截图保留 | 测试期待“✓ 回答正确”，实际组件为“回答正确！” | 未先核对真实反馈文案便写断言 | 只修测试文案，候选重验通过 | 先分产品/环境/测试；保留原失败、实际状态及测试修正，不把错误断言登记为播放器修复 |

真实Windows CI已通过PowerShell5.1/BAT的9项传输合同、中文/空格路径与端口回退，以及中文/空格/撇号路径的缓存单页FFmpeg构建；这不等于完整课程重建或教师交付。当前共享补丁只改Home的加载边界与交互入口，新JS先写入、验证后切换单个HTML入口，旧JS/CSS和课堂保持可用；静态入口、共享渲染chunk、课程音轨/JSON/导出字节相同，因此有条件复用其原技术/内容证据。此单入口切换不是整课发布事务或通用发布锁。八课完整人工听审、教师最终核准与未覆盖的真实用户操作仍pending，不启动下一批或重发配音。

修复后[Windows/macOS CI37721897581](https://github.com/bibibibibibibibi/physics-interactive-lecture/actions/runs/37721897581)两平台通过；Windows Edge153报告绑定commit283c7d2和入口a9c41562，实际浏览器错误为空。范围为八课菜单/音轨元数据、sp1及普通shm的首次持续播放/受控迟载、503和无效JSON的UI重试、sp1首题2.5倍自然暂停/空格锁定/正确反馈/继续、一个原生视频和转台WebGL回拖，不是八课全部互动或全课听审。现有shared-ui-build当前绑定为4f5a2b6919ecbefab72672f7312df6758ec7a93c7b2df0ed771b67f394f77e18，保留3917并逐字段记录新Home/index/main-Bzy与精确复用边界。现有8081服务在新IAB tab3中目录8/8、sp1单击播放至32.424962秒后暂停，实际返回入口/JS SHA与dist一致；当时tab列表为空，未重验历史tab1刷新或猜测其消失原因。一次默认urllib localhost探针503由环境代理路径引起，直连对照200且SHA一致，记录于user-service-byte-probe.json；不得把探针环境失败误报为课堂服务问题，未修改系统代理。
