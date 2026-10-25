import type { CSSProperties } from 'react'

/** 课程主题版式 token：页面版式（背景/logo/页眉/footer/页码）按课程 theme 切换。
    default = 第九章既有白底样式（逐像素不变）；special = 专题系列淡蓝渐变风格
    （对齐专题 PPT：淡蓝白渐变底、logo 右上、无通栏页眉字——小节标题由各页元素
    顶格自绘、无底部渐变线、小号深色页码）。 */
export interface PageTheme {
  /** 舞台背景（盖在 1920×1080 设计层容器上） */
  background: string
  /** logo 位置（尺寸仍按 270×116×logoScale） */
  logoStyle: CSSProperties
  /** 页眉 nav 容器与文字；navStyle = null 时整块不渲染（含装饰条） */
  navStyle: CSSProperties | null
  navText: CSSProperties
  /** nav 下方装饰条 */
  navBar: CSSProperties
  /** 页眉下缘横贯细线（默认无） */
  headerRule: CSSProperties | null
  /** 底部中央渐变细线开关（special 不渲染） */
  bottomLine: boolean
  /** footer 文字（加在外层居中容器上）与衬底 pill（null = 无衬底） */
  footerText: CSSProperties
  footerPill: CSSProperties | null
  /** 页码文字与衬底 pill */
  pageNumText: CSSProperties
  pageNumPill: CSSProperties | null
  /** 首页（封面）不标页码（对齐专题 PPT：封面无页码） */
  pageNumSkipFirst: boolean
  /** 图示外框：浅底 + 1px 细边 + 圆角 + 极淡投影，让插图读作「图版」而不是浮在纸上的线 */
  diagramCard?: boolean
  /** 页标题左侧的竖色条（内容页标题统一在 x=170 / y=137，所以能由主题统一定位） */
  titleAccent?: { color: string; width?: number } | null
  /** 提示框「软化」：圆角 + 细边 + 底色压淡，去掉 3px 硬边框的老课件感 */
  softBox?: boolean
}

const SERIF = 'SimSun, serif'
const SANS = "'Microsoft YaHei','PingFang SC',sans-serif"

const DEFAULT_THEME: PageTheme = {
  background: '#fff',
  logoStyle: { position: 'absolute', left: 24, top: 16 },
  navStyle: { position: 'absolute', right: 70, top: 26, textAlign: 'right' },
  navText: { fontSize: 40, color: '#0000CD', fontFamily: SERIF },
  navBar: { height: 5, marginTop: 10, background: 'linear-gradient(90deg, transparent, #0000CD 30%)' },
  headerRule: null,
  bottomLine: true,
  footerText: { fontSize: 26, color: '#0000CD', fontFamily: SERIF },
  footerPill: { background: 'rgba(255,255,255,0.92)', padding: '2px 26px', borderRadius: 14 },
  pageNumText: { fontSize: 26, color: '#0000CD', fontFamily: SERIF },
  pageNumPill: { background: 'rgba(255,255,255,0.92)', padding: '2px 12px', borderRadius: 10 },
  pageNumSkipFirst: false,
  diagramCard: false,
}

/** special：对齐专题 PPT——logo 右上、无通栏页眉字（小节标题顶格在页内自绘）、
    淡蓝渐变底、小号 footer/页码 */
const SPECIAL_THEME: PageTheme = {
  background: 'linear-gradient(180deg, #EAF0F8 0%, #F6F9FD 45%, #FFFFFF 100%)',
  logoStyle: { position: 'absolute', right: 24, top: 16 },
  navStyle: null,
  navText: {},
  navBar: {},
  headerRule: null,
  bottomLine: false,
  footerText: { fontSize: 24, fontFamily: SANS, color: '#556B8D' },
  footerPill: { background: 'rgba(234,240,248,0.85)', padding: '2px 26px', borderRadius: 14 },
  pageNumText: { fontSize: 24, fontFamily: SANS, color: '#273444' },
  pageNumPill: null,
  pageNumSkipFirst: true,
  diagramCard: false,
}

/** wave：第十章「波动」用的精修版式。
    与 default 的差别全是「降噪」：页眉细一号、导航条改细渐变、页脚去掉白底胶囊、
    页码改灰蓝、背景极淡的分层（白 → 冷白），并给插图套一层浅色图版。
    内容元素（红标题 / 正文 / 图示）一个像素都没动，所以不会溢出、不用重排版面。 */
const WAVE_THEME: PageTheme = {
  background: 'linear-gradient(180deg, #FFFFFF 0%, #FDFEFF 52%, #F6F9FD 100%)',
  logoStyle: { position: 'absolute', left: 24, top: 16 },
  navStyle: { position: 'absolute', right: 70, top: 28, textAlign: 'right' },
  navText: { fontSize: 37, color: '#2E4E7A', fontFamily: SERIF, letterSpacing: 1 },
  navBar: {
    height: 4, marginTop: 11,
    background: 'linear-gradient(90deg, rgba(46,78,122,0) 0%, rgba(46,78,122,0.9) 55%, rgba(46,78,122,0) 100%)',
  },
  headerRule: null,
  bottomLine: false,
  footerText: { fontSize: 23, color: '#5B7290', fontFamily: SERIF, letterSpacing: 3 },
  footerPill: null,
  pageNumText: { fontSize: 23, color: '#5B7290', fontFamily: SERIF },
  pageNumPill: null,
  pageNumSkipFirst: true,
  diagramCard: true,
  titleAccent: { color: '#C00000', width: 7 },
  softBox: true,
}

const THEMES: Record<string, PageTheme> = {
  special: SPECIAL_THEME,
  wave: WAVE_THEME,
}

/** 解析课程主题：缺省/未知值一律回落 default（第九章等旧课件零变化） */
export function resolveTheme(theme?: string): PageTheme {
  return (theme && THEMES[theme]) || DEFAULT_THEME
}
