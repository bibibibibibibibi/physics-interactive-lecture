import courseLogo from '@/assets/gewu-header.svg'
import '@/chrome.css'

export interface ChromeNavItem {
  href: string
  label: string
  current?: boolean
}

interface PageChromeProps {
  /** 课节标题（课程行左侧，衬线） */
  title: string
  /** 标题旁的灰字提示 */
  hint?: string
  /** 返回所属目录页 */
  back?: { href: string; label: string }
  /** 课程行右侧自定义操作区（如上一节/下一节），存在时替代 back 按钮 */
  actions?: React.ReactNode
  /** 顶部三个板块导航 */
  nav?: ChromeNavItem[]
  children: React.ReactNode
}

/** 内页共享外框：页头（品牌 + 板块导航 + 课程行）+ 内容区。
    交互课堂、静态幻灯片、课程门页都套这一层，保证风格一致。 */
export default function PageChrome({ title, hint, back, actions, nav, children }: PageChromeProps) {
  return (
    <div className="chrome min-h-screen">
      <header className="chrome-head">
        <div className="chrome-bar">
          <a className="chrome-brand" href="/" aria-label="格物 · 物理课堂首页">
            <img src={courseLogo} alt="" width={416} height={207} />
            <span className="chrome-brand-caption">
              <span className="chrome-brand-name">物理课堂</span>
              <span className="chrome-brand-dept">暨南大学物理学系</span>
            </span>
          </a>
          {nav && <nav className="chrome-nav" aria-label="课程板块">
            {nav.map(n => <a key={n.href} href={n.href} aria-current={n.current ? 'page' : undefined}>{n.label}</a>)}
          </nav>}
        </div>
        <div className="chrome-course">
          <h1 className="chrome-course-title">{title}</h1>
          {hint && <span className="chrome-course-hint">{hint}</span>}
          <span className="ml-auto flex items-center gap-2">
            {actions ?? (back && <a href={back.href} className="chrome-btn px-3 py-1.5 text-xs">{back.label}</a>)}
          </span>
        </div>
      </header>
      {children}
    </div>
  )
}
