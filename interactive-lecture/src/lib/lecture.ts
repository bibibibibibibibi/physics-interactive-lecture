import katex from 'katex'
import 'katex/dist/katex.min.css'

export interface LaserMark { bullet: number; start: number; end: number }
export interface SlideTime { id: number; duration: number; laser: LaserMark[]; t_start: number; t_end: number }
export interface Timeline {
  slides: SlideTime[]
  bullet_layout?: { x: number; y_top: number; dy: number }
}
export interface QA { q: string; a: string }
export interface Bullet { text: string; x: number; y: number; qa: QA[]; hotspot?: boolean; important?: boolean }
export interface Slide { id: number; kind: string; heading: string; narration: string; bullets: Bullet[] }
export interface Sub { slide: number; start: number; end: number; text: string }
export interface Lecture {
  title: string
  slides: Slide[]
  subtitles: Sub[]
  characters?: { id: string; name: string }[]
  character?: string
}
export interface Msg { role: 'user' | 'ai'; text: string }
export type Active =
  | { kind: 'bullet'; slide: Slide; bullet: Bullet; bulletIdx: number }
  | { kind: 'subtitle'; slide: Slide; sub: Sub }

export const VIDEO_W = 1920
export const VIDEO_H = 1080
export const RATES = [1, 1.5, 2, 2.5]

export type Pose = 'wave' | 'explain' | 'laser' | 'emphasis' | 'think' | 'point_up'

/** 小人立绘清单：六姿态 + 激光笔的斜上/斜下两个方向变体 */
export const TEACHER_IMGS = ['wave', 'explain', 'laser', 'laser_up', 'laser_down', 'emphasis', 'think', 'point_up'] as const
export type TeacherImg = typeof TEACHER_IMGS[number]

/** 激光点指向目标（视频像素坐标）与要点下标 */
export interface LaserTarget { x: number; y: number; idx: number }

/** 把文本里的 $...$ 渲染成公式，其余保持纯文本并转义，换行转 <br>，返回 HTML */
export function renderMath(text: string): string {
  return text.split(/(\$[^$]+\$)/g).map(part => {
    if (part.startsWith('$') && part.endsWith('$')) {
      return katex.renderToString(part.slice(1, -1), { throwOnError: false, output: 'html' })
    }
    return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>')
  }).join('')
}

export function stripMath(text: string): string {
  return text.replace(/\$([^$]+)\$/g, '$1')
}

/** 估算要点文字渲染宽度(px)，与视频模板 build.py 的 est_text_width 保持一致 */
export function estTextWidth(text: string): number {
  const plain = text.replace(/\$[^$]+\$/g, m => '　'.repeat(Math.max(Math.floor(m.length / 3), 2)))
  let cjk = 0
  for (const ch of plain) if (ch.codePointAt(0)! > 0x2e80) cjk++
  return Math.min(Math.max(cjk * 38 + (plain.length - cjk) * 19, 60), 1000)
}

export function bigrams(s: string): Set<string> {
  const clean = stripMath(s).replace(/[\s\p{P}]/gu, '')
  const set = new Set<string>()
  for (let i = 0; i < clean.length - 1; i++) set.add(clean.slice(i, i + 2))
  return set
}

export function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0
  a.forEach(x => { if (b.has(x)) n++ })
  return n
}
