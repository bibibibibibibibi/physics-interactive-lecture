import type { Bullet, Lecture, Slide, Sub } from '@/lib/lecture'

/** 网页版课件的元素（1920×1080 设计坐标，引擎负责缩放） */
export interface WebRun { t: string; size?: number; color?: string; b?: boolean; font?: string }
export interface WebElement {
  type: 'text' | 'tex' | 'box' | 'table' | 'diagram' | 'img' | 'html' | 'video'
  step: number
  x: number; y: number; w: number; h?: number
  paras?: WebRun[][]
  align?: 'left' | 'center'
  valign?: 'top' | 'center'
  tex?: string
  size?: number
  color?: string
  fill?: string
  line?: string
  lw?: number
  radius?: number
  rows?: string[][]
  rowh?: number
  name?: string
  src?: string
  /** 自包含放映导出可内联模拟文档，避免 file:// 下请求外部资源。 */
  srcDoc?: string
  /** 图片在框内的显示方式；cover 可按框的比例裁切边缘 */
  fit?: 'contain' | 'cover'
  /** 图片裁切时保留哪一侧，例如 'right center' */
  objectPosition?: string
  hotspot?: boolean
  important?: boolean
  /** 故意的图上叠加标注：与图重叠属设计意图，质检跳过 */
  overlay?: boolean
  /** 只作卡片底色的 box；质检不把内部文字/公式视为与底色重叠 */
  decorative?: boolean
  /** box 内边距覆盖（默认 '8px 20px'；装饰条等零内容 box 传 0） */
  pad?: number | string
  /** html 元素：步进揭示时向 iframe postMessage({type: 消息})（键为步号） */
  msgs?: Record<string, string>
  /** Opt-in deterministic iframe clock: lecture-state on time/step/seek/load. */
  timelineSync?: boolean
  qa?: { q: string; a: string }[]
  label?: string
}

export interface WebBullet extends Bullet { elIdx: number }

/** 随堂互动答题卡：全局时钟 t 越过该时刻自动暂停弹出，作答后点「继续」恢复。
    有 options 为选择题（answer=正确项下标）；无 options 为开放题（answer=参考解答文字） */
export interface WebQuiz {
  t: number
  q: string
  /** 活动题先记录预测，再收起卡片允许 iframe 操作，查看解释后才恢复讲解。 */
  type?: 'activity'
  options?: string[]
  answer: number | string
  explain?: string
  /** 与 options 顺序一致的理由；普通题立即反馈，活动题完成操作后反馈。 */
  feedbackPerOption?: string[]
  /** 活动操作任务和应观察的量；计时是教学安排参考，不自动放行。 */
  task?: string
  observe?: string
  plannedSeconds?: number
}

export interface WebPage extends Omit<Slide, 'bullets'> {
  elements: WebElement[]
  bullets: WebBullet[]
  /** 步进揭示的绝对时刻（秒），键为步号 */
  stepTimes: Record<string, number>
  t_start: number
  t_end: number
  duration: number
  /** 激光指点时刻（绝对秒） */
  laser: { bullet: number; start: number; end: number }[]
  /** 随堂互动题（可选；旧课件无此字段） */
  interactions?: WebQuiz[]
}

export interface WebLec extends Omit<Lecture, 'slides'> {
  nav: string
  footer: string
  /** 可选：页面版式主题（见 lib/theme.ts；缺省=default，第九章样式） */
  theme?: string
  /** 可选：大段导航（页码按钮显示段名、章节导航按段列出、进度条画分段刻度）；
      page = 该段第一页的页 id */
  sections?: { title: string; page: number }[]
  /** 可选：构建时间戳（前端给音频/图片做缓存戳） */
  build_ts?: number
  /** 可选：课程 logo 缩放（默认 1，作者脚本 doc.logoScale 透传） */
  logoScale?: number
  /** 特定课程可给图示和推导留出空间；缺省保留现有课程讲师。 */
  showTeacher?: boolean
  /** 全屏投影时在舞台下方显示当前句字幕；缺省不影响既有全屏布局。 */
  projectedSubtitles?: boolean
  duration: number
  slides: WebPage[]
  subtitles: Sub[]
}
