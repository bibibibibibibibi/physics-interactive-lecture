# 第三方软件与素材说明

更新日期：2026-10-09。项目原创成果声明见 [copyright.md](copyright.md)。

本文件区分本项目的原创成果与第三方权利。第三方组件和素材依各自许可或授权处理，不因本项目保留原创成果权利而改变；来源记录也不代表取得新的传播许可。

## 已识别的运行软件

| 组件 | 本次核对版本 | 使用范围 | 许可文本 |
| --- | --- | --- | --- |
| React、React DOM、Scheduler | 19.2.3、19.2.3、0.27.0 | 当前应用生产构建 | [MIT](licenses/react-mit.txt)；三个包的许可文本字节相同，统一保留。 |
| React Router | 7.18.4 | 当前应用生产构建 | [MIT](licenses/react-router-mit.txt)。 |
| KaTeX JavaScript、CSS 与自动渲染组件 | 0.18.9 | 当前应用与 sp1/sp5 本地 vendor | [MIT](licenses/katex-mit.txt)。 |
| KaTeX 公式字体 | 随上述组件分发的字体 | 公式排版；字体内的许可元数据保持原样 | [SIL OFL 1.1](licenses/katex-fonts-ofl.txt)，另保留版权与 Reserved Font Names。 |
| Three.js、OrbitControls、RoomEnvironment | r164 | sp1/sp5 本地 vendor | [MIT](licenses/three-mit.txt)。 |

应用版本及实际纳入构建的包已按锁定依赖和生产 bundle 的模块清单核对；本地 vendor 的版本按文件内容核对。React 系列、React Router 与 KaTeX 的全文复制自已安装包；Three.js 文本取自 [r164 官方 LICENSE](https://github.com/mrdoob/three.js/blob/r164/LICENSE)。后续升级或增加组件时应同步更新版本和适用许可，不能仅修改包版本号。

公式字体的单独许可按随附 TTF 文件的 name 表核对，版权人为 Design Science, Inc. 与 Khan Academy；OFL 全文取自 [SIL 官方文本](https://openfontlicense.org/open-font-license-official-text/)。KaTeX 软件的 MIT 许可不用于覆盖字体的单独许可。

开发工具及未纳入生产包的依赖仍适用各自随附的许可。上述表格是本次已识别的运行软件清单，不是全部源码、素材和服务条款已完成法律审查的声明。

## 图片、视频、源课件与合成语音

各课来源、文件哈希、修改方式与已知署名继续保留在课程来源文档中。例如，sp3 的 [来源说明](https://github.com/bibibibibibibibi/physics-interactive-lecture/blob/main/lecture_factory/courses_web/sp3/README.md) 和 [素材记录](https://github.com/bibibibibibibibi/physics-interactive-lecture/blob/main/lecture_factory/courses_web/sp3/assets/source-media.json) 已记录：

- 部分现场、桥梁及实验视频没有查明具体开放许可，不能仅凭来自源 PPT 或用于教学而认定允许公开再分发。
- MRI 源页注明 NIBIB/NIH 的 CC BY 3.0，以及 Biomedizinische NMR Forschungs GmbH 的 CC BY-SA 3.0；须结合原始来源核对适用片段，并保留署名、许可链接、修改说明及适用的相同方式共享要求。
- Higgs 图片保留 ATLAS Experiment © CERN 署名；该署名本身不替代具体使用条件。

源课件、人物形象、其他图片及合成语音的权属和使用条件，按实际创作、原许可、授权及适用服务条款分别判断。AI 或 TTS 服务生成的结果不因被纳入本仓库而自动成为本人独占的原创成果。

需要再分发素材时，应核实对应许可和授权范围；许可未明的内容应取得授权、以具有明确许可的材料替换，或排除公开分发。项目的构建、打包和技术核验不替代这项判断。

## 随包保留

发布 ZIP 必须包含根目录 LICENSE、本项目版权说明、本文件和上表中的完整许可文本。打包工具在运行依赖之外显式保留这些文件，缺失时停止打包；不以许可文本没有被网页引用为由排除。
