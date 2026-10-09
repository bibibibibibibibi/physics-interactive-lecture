# 仓库资源与发布包

更新日期：2026-10-09。

此次整理取消跟踪 1,855 个重复产品与本地制作文件。原提交文件总量约 1,324 MiB；本次加入已完成的分析力学 demo 后，当前版本文件总量约 517 MiB，减少约 61%。这是当前版本的文件字节总量，不是 Git 历史压缩体积。

源码仓库保留应用代码、课程源稿、正式 `public/` 资源、必要的可编辑素材，以及音频时间轴和来源元数据。课堂运行需要的合并音频继续随 `public/weblec/` 入库。

## 本地保留、退出 Git 的内容

| 路径 | 处理 |
| --- | --- |
| `interactive-lecture/dist/` | 本地部署产品，由源码构建，ZIP 通过 GitHub Releases 分发。 |
| `interactive-lecture/slides-export/` | 本地静态导出，可随发布包分发，不重复提交内联图片和字体。 |
| `lecture_factory/courses_web/*/audio/*.mp3` | 本地逐页配音与缓存；时间轴和生成元数据继续入库。 |
| `lecture_factory/courses_web/*/source/` 中的二进制 | 原 PPT、提取的图片／视频／模型等本地制作输入；JSON 来源记录、HTML 与 SVG 源码保留入库。 |
| `public/weblec/sp1-correction-review/`、`sp3-static-review/` | 历史素材可本地恢复，正式仓库只保留兼容跳转 `slides-preview.html`。旧 course 参数映射到 sp1/sp3。 |
| `public/weblec/sp1/` 中五个旧视频 | 正式课已使用 `snowboard-native.mp4` 和 `station-flight-native.mp4`。旧剪辑保留本地，不入库，不进入检查后的发布 ZIP。 |

五个旧视频为 `snowboard.mp4`、`BV16Z4y1F7Gm_merged.mp4`、`station_flight_30s.mp4`、`BV1VF411E7h7_merged.mp4`、`BV11c411S7a2_merged.mp4`。原始创作素材仍保留在课程 `assets/`。

`.gitignore` 不会自动取消已跟踪文件。此次整理已将明确列入范围的文件从 Git 索引移除，原文件仍在本地。取消跟踪记录随本次提交同步到 GitHub 当前目录。没有改写历史；历史中的大对象不会因下一次删除提交立即消失。

## 用课与开发

用课：已有 Release 附件时下载课堂 ZIP，解压后双击 `dist/` 中对应系统的启动器；教师放映使用 `/slides.html?course=<id>`。发布包不需要 Node.js。

开发：克隆源码，在 `interactive-lecture/` 中执行 `npm ci`、`npm run dev`。执行 `npm run build` 可生成本机 `dist/`，不需要重新制作音频。

源稿重新配音与原 PPT 提取另需本地制作输入、工具及有效授权。新克隆不包含逐页 MP3 与原始提取材料；需要继续制作时先恢复对应输入，不能因为缓存未随 Git 下载就自动调用在线 TTS。

## 发布检查与打包

```bash
# 已有本地部署包：核对运行文件与其源码来源
python -B interactive-lecture/scripts/check-release.py

# 新建独立构建并打包；不覆盖当前 dist，不上传
python -B interactive-lecture/scripts/package-release.py --build

# 开发中的未提交课程：明确标记为本地 development ZIP
python -B interactive-lecture/scripts/package-release.py --build --no-git-check

# 可选：只附加明确选定的本课独立放映 HTML
python -B interactive-lecture/scripts/package-release.py --build --include-export interactive-lecture/slides-export/分析力学-拉格朗日方程-交互放映.html

# 同时单独存档本地制作输入
python -B interactive-lecture/scripts/package-release.py --build --authoring-inputs
```

ZIP 默认放在忽略的 `work/releases/`。默认仅收录发布检查遍历到的部署运行依赖（含共享教师放映页），不自动加入本地历史静态导出。需要独立 HTML 时逐个用 `--include-export` 指定，并检查其依赖；不把旧 chunks、闲置媒体、本地制作输入或密钥整目录压入产品。每份 ZIP 包含字节数和 SHA-256 清单。制作输入存档为单独 ZIP，不混入用课产品，也不自动上传。

正式打包要求必要的源码输入已跟踪并与 Git 索引一致；部署包及静态导出无需被 Git 跟踪。CI 先构建再检查，跨平台检查结果作为 Actions artifact 保存。

GitHub 的 “Package classroom release” 工作流仅在人工触发、指定已有标签后运行，创建草稿 Release。此次整理没有触发该工作流，没有创建远程标签或发布 Release。

## 分析力学本次同步范围

入库：统一课程内容与生成脚本、课堂安排与完整讲稿、来源和物理核验、计时及音频签名元数据、33 页正式运行数据、单份合并 MP3、必要的 SVG 与交互模型，以及播放器改动和模型测试。

不入库：逐页 MP3、PCM/WAV、旧版候选、截图与巡检日志、原 PPT 提取材料、本地独立导出、ZIP 和依赖环境。旧版本仍可在本地工作记录中恢复；教学听审和试讲状态见课程核验文档，不因 GitHub 同步而改变。

## 回收与恢复

整理前备份、差异、索引、文件 SHA-256 和操作记录在 `work/repository-cleanup/`。恢复时先核对记录，不能用旧索引快照覆盖后续新工作。系统回收站不可用时保留原件；不使用永久删除。历史瘦身需要另行确定保留范围与协作迁移方案，本次不执行。

本次系统回收站接口曾在移动第一个目录后异常退出，macOS 又拒绝枚举回收站，无法确认实际回收位置。已从整理前备份按 SHA-256 完整恢复该目录，其他待清理原件保留在本地；Git 与发布包通过排除规则减重。操作与恢复记录均保留在上述工作目录。
