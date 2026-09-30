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
}

const THEMES: Record<string, PageTheme> = {
  special: SPECIAL_THEME,
}

/** 解析课程主题：缺省/未知值一律回落 default（第九章等旧课件零变化） */
export function resolveTheme(theme?: string): PageTheme {
  return (theme && THEMES[theme]) || DEFAULT_THEME
}
