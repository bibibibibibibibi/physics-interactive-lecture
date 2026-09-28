import type { Bullet, Lecture, Slide, Sub } from '@/lib/lecture'

/** 网页版课件的元素（1920×1080 设计坐标，引擎负责缩放） */
export interface WebRun { t: string; size?: number; color?: string; b?: boolean }
export interface WebElement {
  type: 'text' | 'tex' | 'box' | 'table' | 'diagram' | 'img'
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
  hotspot?: boolean
  important?: boolean
  /** 故意的图上叠加标注：与图重叠属设计意图，质检跳过 */
  overlay?: boolean
  qa?: { q: string; a: string }[]
  label?: string
}

export interface WebBullet extends Bullet { elIdx: number }

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
}

export interface WebLec extends Omit<Lecture, 'slides'> {
  nav: string
  footer: string
  /** 可选：构建时间戳（前端给音频/图片做缓存戳） */
  build_ts?: number
  /** 可选：课程 logo 缩放（默认 1，作者脚本 doc.logoScale 透传） */
  logoScale?: number
  duration: number
  slides: WebPage[]
  subtitles: Sub[]
}
