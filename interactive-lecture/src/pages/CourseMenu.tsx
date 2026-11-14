import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUpRight, BookOpen, Play, Search, TriangleAlert, X, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import SubjectCard, { type CourseEntry, type RenderedChapter } from '@/components/SubjectCard'
import textbookMap from '@/lib/textbook-map.json'
import courseLogo from '@/assets/gewu-header.svg'
import minghu from '@/assets/jnu-minghu.webp'
import './course-menu.css'
import AqiangHero from '@/components/AqiangHero'

const personalSite = 'https://phys.caoxuanmin.chatgpt.site/'
/** 一个章：绑定一份课程清单 */
interface MenuChapter {
  title?: string
  src?: string
  note?: string
  /** 该章配套的交互实验（移植自学习平台，整页模拟） */
  labs?: { href: string; label: string }[]
}

/** 一个学科：下面挂若干章（章暂无课节时留空 → 显示占位） */
interface MenuSubject {
  name: string
  chapters?: MenuChapter[]
  /** 兼容旧写法：直接给 src 表示「该学科下只有一个无名章」 */
  src?: string
  note?: string
}

/** 顶部板块切换（大学物理课程 / 分析力学 / 教学节段专题 三页平级） */
interface MenuNavItem {
  href: string
  label: string
  current?: boolean
}

interface CourseMenuProps {
  /** 页面主标题 */
  title?: string
  /** 副标题 */
  subtitle?: string
  /** 学科 → 章 → 课节（三级） */
  groups?: MenuSubject[]
  /** 兼容旧写法：单份清单 */
  src?: string
  /** 顶部板块切换导航 */
  nav?: MenuNavItem[]
  /** 头部右侧的系列入口链接 */
  extraLink?: { href: string; label: string }
  extraLinks?: { href: string; label: string }[]
  /** 头部左侧的返回链接 */
  backLink?: { href: string; label: string }
}

/** 课程列表页：根路径无 ?course= 参数时显示。
 *  层级与 slides-export 的目录页一致：**学科 → 章 → 节**。 */
export default function CourseMenu({
  title = '大学物理 · 课程目录',
  subtitle = '选择一节课程进入',
  groups,
  src,
  nav,
  extraLink,
  extraLinks,
  backLink,
}: CourseMenuProps) {
  const [sections, setSections] = useState<{ name: string; chapters: RenderedChapter[] }[] | null>(null)
  const [failedCount, setFailedCount] = useState(0)
  const [retryKey, setRetryKey] = useState(0)
  const catalogRef = useRef<HTMLElement>(null)
  const [subjectIndex, setSubjectIndex] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const term = query.trim().toLowerCase()
  // 搜索单独记录开合状态，清空关键词即可恢复目录的展开状态。
  const [browseOpen, setBrowseOpen] = useState<Record<string, boolean>>({})
  const [searchOpen, setSearchOpen] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = term ? [searchOpen, setSearchOpen] : [browseOpen, setBrowseOpen]

  useEffect(() => {
    let active = true
    const subjects: MenuSubject[] = groups ?? [{ name: '', src: src ?? '/weblec/courses.json' }]
    // 展开成 (学科, 章) 扁平任务，便于并发取数
    const jobs: { si: number; ch: MenuChapter }[] = []
    subjects.forEach((s, si) => {
      const chs = s.chapters ?? [{ src: s.src, note: s.note }]
      chs.forEach(ch => jobs.push({ si, ch }))
    })
    Promise.all(jobs.map(({ ch }) => {
      if (!ch.src) return Promise.resolve({ ok: true, courses: [] as CourseEntry[] })
      const sep = ch.src.includes('?') ? '&' : '?'
      return fetch(`${ch.src}${sep}t=${Date.now()}`, { cache: 'no-store' })
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return r.json()
        })
        .then((courses: CourseEntry[]) => ({ ok: true, courses }))
        .catch(() => ({ ok: false, courses: [] as CourseEntry[] }))
    })).then(res => {
      if (!active) return
      setFailedCount(res.filter(r => !r.ok).length)
      setSections(subjects.map((s, si) => ({
        name: s.name,
        chapters: jobs
          .map((j, i) => ({ j, i }))
          .filter(({ j }) => j.si === si)
          .map(({ j, i }, index) => ({
            index, title: j.ch.title, note: j.ch.note, labs: j.ch.labs,
            courses: (res[i]?.courses ?? []).map(c =>
              textbookMap[c.id as keyof typeof textbookMap]
                ? { ...c, textbookUrl: textbookMap[c.id as keyof typeof textbookMap] }
                : c),
          })),
      })))
    })
    return () => { active = false }
  }, [src, retryKey, JSON.stringify(groups ?? null)])   // eslint-disable-line react-hooks/exhaustive-deps

  const total = sections?.reduce((n, s) => n + s.chapters.reduce((m, c) => m + c.courses.length, 0), 0) ?? 0
  /** 首屏「进入交互课堂」：指向当前板块第一节可播放的课节，数据未就绪时不渲染 */
  const firstCourse = sections
    ?.flatMap(s => s.chapters)
    .flatMap(ch => ch.courses)
    .find(c => c.lectureAvailable !== false)
  const extras = extraLinks ?? (extraLink ? [extraLink] : [])

  const mainMenu = nav?.find(item => item.current)?.href === '/'
  const specialMenu = nav?.find(item => item.current)?.href === '/?menu=special'
  const visible = (sections ?? []).map((subject, index) => {
    const chapters = subject.chapters.flatMap(ch => {
      if (!term || subject.name.toLowerCase().includes(term) || ch.title?.toLowerCase().includes(term)) return [ch]
      const courses = ch.courses.filter(c => c.title.toLowerCase().includes(term))
      return courses.length ? [{ ...ch, courses }] : []
    })
    return { ...subject, index, chapters }
  }).filter(s => s.chapters.length > 0 && (term || subjectIndex === null || s.index === subjectIndex))

  function changeQuery(value: string) {
    setQuery(value)
    setSearchOpen({})
  }
  function selectSubject(index: number | null) {
    changeQuery('')
    setSubjectIndex(index)
    if (index !== null) setBrowseOpen(prev => ({ ...prev, [index]: true }))
    const catalog = catalogRef.current
    if (catalog && catalog.getBoundingClientRect().top < 0) catalog.scrollIntoView({ block: 'start' })
  }

  function setAll(open: boolean) {
    const next: Record<string, boolean> = {}
    visible.forEach(s => {
      next[s.index] = open
      s.chapters.forEach(ch => { next[`${s.index}:${ch.index}`] = open })
    })
    setExpanded(prev => ({ ...prev, ...next }))
  }
  const chapterCount = sections?.reduce((sum, s) => sum + s.chapters.length, 0)
  const matchCount = visible.reduce((n, s) => n + s.chapters.reduce((m, ch) => m + ch.courses.length, 0), 0)
  return (
    <div className="atlas" id="top">
      <header className="atlas-header">
        <div className="atlas-wrap atlas-bar">
          <a className="atlas-brand" href="/" aria-label="格物 · 物理课堂首页">
            <img src={courseLogo} alt="" width={416} height={207} />
            <span className="atlas-brand-caption">
              <span className="atlas-brand-name">物理课堂</span>
              <span className="atlas-brand-dept">暨南大学物理学系</span>
            </span>
          </a>
          <nav className="atlas-nav" aria-label="课程板块">
            {nav?.map(n => <a key={n.href} href={n.href} aria-current={n.current ? 'page' : undefined}>{n.label}</a>)}
          </nav>
        </div>
      </header>
      <main>
        <section className={`atlas-wrap atlas-intro ${mainMenu ? 'atlas-intro-photo' : 'atlas-intro-compact'} ${specialMenu ? 'atlas-intro-special' : ''}`} aria-labelledby="atlas-title">
          {mainMenu && <img className="atlas-campus" src={minghu} alt="" fetchPriority="high" />}
          <div className="atlas-opening">
            <div className="atlas-intro-copy">
              <div className="atlas-kicker"><i />{mainMenu ? 'UNIVERSITY PHYSICS' : 'COURSE COLLECTION'}</div>
              <h1 id="atlas-title">{title}</h1>
              <p>{subtitle}</p>
              <div className="atlas-hero-actions">
                <a href="#catalog" className="atlas-cta">浏览课程 <ArrowDown size={16} /></a>
                {firstCourse && <a href={`/?course=${firstCourse.id}`} className="atlas-cta-secondary">
                  <Play size={15} aria-hidden="true" />进入交互课堂
                </a>}
                {(backLink || extras.length > 0) && <div className="atlas-extra">
                  {backLink && <a href={backLink.href}>{backLink.label}</a>}
                  {extras.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}
                </div>}
              </div>
            </div>
            {specialMenu && <AqiangHero />}
          </div>
          {mainMenu && <a className="atlas-campus-credit" href="https://www.jnu.edu.cn/36429/list.htm">明湖 · 暨南大学官网原图 · AI 清晰度增强 ↗</a>}
        </section>

        <div className="atlas-wrap atlas-workspace">
          <section ref={catalogRef} id="catalog" aria-labelledby="catalog-heading" className="atlas-catalog">
            <div className="atlas-catalog-bar">
              <h2 id="catalog-heading">{term ? '搜索结果' : mainMenu ? '学科目录' : '课程目录'}</h2>
              <div className="atlas-search">
                <Search size={18} aria-hidden="true" />
                <input type="search" aria-label="搜索学科、章节或课节" placeholder={mainMenu ? '搜索学科、章节或课节' : '搜索本系列课程'} value={query} onChange={e => changeQuery(e.target.value)} />
                {query && <button type="button" aria-label="清除搜索" onClick={() => changeQuery('')}><X size={16} /></button>}
              </div>
            </div>
            {failedCount > 0 && <div className="atlas-error" role="alert">
              <TriangleAlert size={16} aria-hidden="true" />
              <p>有 {failedCount} 份课程清单加载失败，部分课程暂未显示。</p>
              <button type="button" onClick={() => setRetryKey(k => k + 1)}>重试</button>
            </div>}
            <div className="atlas-tools">
              <div className="atlas-count" role="status">{sections === null ? '正在加载课程…' : term ? `找到 ${matchCount} 节匹配课程` :
                mainMenu && subjectIndex === null ? `${sections.length} 个学科 · ${chapterCount} 章 · ${total} 节课` : `共 ${matchCount} 节课`}</div>
              {visible.length > 0 && <div className="atlas-controls">
                <button type="button" onClick={() => setAll(true)}><ChevronsUpDown size={14} />全部展开</button>
                <button type="button" onClick={() => setAll(false)}><ChevronsDownUp size={14} />全部收起</button>
              </div>}
            </div>
            {mainMenu && <div className="atlas-subjects" role="group" aria-label="按学科浏览">
              <div className="atlas-filters">
                <button type="button" aria-pressed={subjectIndex === null || !!term}
                  onClick={() => selectSubject(null)}>
                  <BookOpen size={14} />全部学科
                </button>
                {sections?.map((s, i) => <button type="button" key={s.name} aria-pressed={!term && i === subjectIndex}
                  onClick={() => selectSubject(i)}>{s.name}</button>)}
              </div>
            </div>}
            {sections && visible.length === 0 && <div className="atlas-empty">
              <Search size={24} />
              <p>{term ? '没有找到匹配课程' : '暂无课程'}</p>
              {term && <button type="button" onClick={() => changeQuery('')}>清除搜索，返回目录</button>}
            </div>}
            <div className={`atlas-list ${visible.length === 1 ? 'atlas-list-single' : ''}`}>
              {visible.map(s => {
                const subjectOpen = expanded[s.index] ?? true
                const defaultOpen = !!term || !mainMenu
                const isChapterOpen = (ci: number) => expanded[`${s.index}:${ci}`] ?? defaultOpen
                return <SubjectCard key={s.index} index={s.index} name={s.name} chapters={s.chapters}
                  open={subjectOpen} onToggle={() => setExpanded(prev => ({ ...prev, [s.index]: !(prev[s.index] ?? true) }))}
                  isChapterOpen={isChapterOpen} onToggleChapter={ci => {
                    const k = `${s.index}:${ci}`
                    setExpanded(prev => ({ ...prev, [k]: !(prev[k] ?? defaultOpen) }))
                  }} />
              })}
            </div>
          </section>
        </div>
      </main>
      <footer className="atlas-wrap atlas-footer"><span>物理课堂 · 暨南大学物理学系</span><a href={personalSite}>操宣敏的个人主页 <ArrowUpRight size={13} /></a></footer>
    </div>
  )
}
