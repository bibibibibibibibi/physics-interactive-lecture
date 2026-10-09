# 大学物理网页课堂

本目录是交互课堂与教师静态放映页共用的 React、TypeScript、Vite 应用。项目入口、环境准备和课程说明见[根目录 README](../README.md)；special 专题的制作、分工、交接与验收统一执行[专题课件制作规范](../lecture_factory/专题课件制作经验.md)。

## 使用已构建课堂

- 在线使用版：[打开 Demo 课程列表](http://8.134.180.157:8080/)，无需下载或启动本地服务。在线答疑使用内置离线库，发布范围见[在线发布说明](../docs/repository-storage.md)。
- 已有发布附件时，从 GitHub Releases 下载并解压课堂 ZIP；源码克隆可用 `npm ci`、`npm run build` 生成本机部署版。
- Windows：双击 `dist/启动交互课堂-win.bat`。
- Mac：双击 `dist/启动交互课堂-mac.command`；首次运行的系统许可处理见根目录 README。
- 启动器提供本地 HTTP 服务。交互课堂需要通过服务访问，不能用 `file://` 或双击 `dist/index.html`。
- special 八个学时的静态课件含媒体或模拟，统一通过 HTTP 放映；菜单里的 `slidesUrl` 指向对应入口。旧书签和静态审阅入口保留其兼容用途。

技术入口可用与范围明确的技术验收，不能代替完整人工听审和最终教师教学核准。逐课完成情况及证据边界见[专题系列复盘](../docs/special-series-review.md)。

## 文件归属

| 路径 | 用途与保留要求 |
| --- | --- |
| `src/` | 正式应用代码，共用播放器及目录页面。 |
| `public/` | 应用构建输入，含正式课件数据、媒体和讲师素材；与单课创作源码的职责不同。 |
| `dist/` | 本地部署产品，退出 Git，通过 Release ZIP 分发。 |
| `slides-export/` | 本地静态导出，退出 Git，可随发布包分发；专题 HTTP 版本依赖同源课件媒体。 |
| `dist-slides/` | 静态导出的中间构建目录，由 `.gitignore` 排除。 |
| `scripts/` | 启动器复制与检查等应用工具。 |
| `../lecture_factory/` | 课程创作源码、素材及制作工具。 |
| `../work/` | 本机候选、授权记录、缓存、历史证据与临时构建，默认不随 Git 同步。 |

默认构建配置仍使用 `emptyOutDir: false`，原有本地文件可恢复；发布 ZIP 只选取检查过的运行依赖，不整目录携带旧 chunks 和闲置媒体。默认只含课堂部署版与共享教师放映页；独立 HTML 导出必须用 `--include-export <文件路径>` 明确指定。旧审阅书签映射到正式课程。special 的候选晋级和中央发布须按专题规范执行，当前仓库存储规则见[仓库资源与发布包](../docs/repository-storage.md)。

在仓库根目录运行 `python -B interactive-lecture/scripts/package-release.py --build`，可在 `work/releases/` 中构建和打包，不覆盖当前 `dist/`，不自动上传。正式模式同时检查 Git 源码输入；开发候选需显式添加 `--no-git-check`，ZIP 会标记为 development。

## 分析力学 demo

《第二章 拉格朗日方程》：33 页主课，3 次暂停活动；实测音轨 42:17.6，加 8 分钟活动，标准流程约 50:17.6。

- 在线交互课堂：[直接打开](http://8.134.180.157:8080/?course=analytical-mechanics)。
- 在线教师放映：[网页版幻灯片](http://8.134.180.157:8080/slides.html?course=analytical-mechanics)，供手动放映，不带配音。
- 课程目录：`/?menu=analytical`。
- 有声课堂：`/?course=analytical-mechanics`。
- 教师放映：`/slides.html?course=analytical-mechanics`。
- 完整讲稿、安排、来源审查、物理核验与重建说明：[本课文档](../lecture_factory/courses_web/analytical-mechanics/README.md)。

运行与逐页呈现检查已经完成，完整人工听审、连续播放和教师试讲尚未完成。离线 HTML 的双击执行尚未验证。

## 本机开发

在本机安装符合 `package.json` 要求的 Node.js 后，在本目录执行：

```bash
npm ci
npm run dev
```

开发地址以终端实际输出为准。`node_modules/` 与项目根目录 `.venv/` 是本机依赖环境，不复制到其他电脑，也不提交 Git；Python 制作环境按根目录 README 安装。

部分 special 的重建仍依赖本机 `work/` 中的管线、有效配音授权及精确缓存。正式产物可直接运行，不表示所有课程已能在新克隆中完整重建；缺失输入时应停止并由中央补齐，不能上传整个临时目录或重复发送配音来替代交接。
