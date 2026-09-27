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
  duration: number
  slides: WebPage[]
  subtitles: Sub[]
}
