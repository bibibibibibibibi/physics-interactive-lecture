import { useEffect, useState } from 'react'

interface CourseEntry {
  id: string
  title: string
  desc?: string
  /** 静态候选尚未配音时不显示交互课堂入口；旧清单默认可播放。 */
  lectureAvailable?: boolean
  /** 本课独立静态候选的入口；正式课程沿用公共放映器。 */
  slidesUrl?: string
}

/** 一个章：绑定一份课程清单 */
interface MenuChapter {
  title?: string
  src?: string
  note?: string
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

interface RenderedChapter {
  title?: string
  note?: string
  courses: CourseEntry[]
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
  /** 章默认收起（61 节全展开太长），显式展开才记录；学科默认展开，显式收起才记录。 */
  const [chOpen, setChOpen] = useState<Record<string, boolean>>({})
  const [subjClosed, setSubjClosed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const subjects: MenuSubject[] = groups ?? [{ name: '', src: src ?? '/weblec/courses.json' }]
    // 展开成 (学科, 章) 扁平任务，便于并发取数
    const jobs: { si: number; ch: MenuChapter }[] = []
    subjects.forEach((s, si) => {
      const chs = s.chapters ?? [{ src: s.src, note: s.note }]
      chs.forEach(ch => jobs.push({ si, ch }))
    })
    Promise.all(jobs.map(({ ch }) => {
      if (!ch.src) return Promise.resolve([] as CourseEntry[])
      const sep = ch.src.includes('?') ? '&' : '?'
      return fetch(`${ch.src}${sep}t=${Date.now()}`, { cache: 'no-store' })
        .then(r => r.json())
        .catch(() => [])
    })).then(res => {
      setSections(subjects.map((s, si) => ({
        name: s.name,
        chapters: jobs
          .map((j, i) => ({ j, i }))
          .filter(({ j }) => j.si === si)
          .map(({ j, i }) => ({ title: j.ch.title, note: j.ch.note, courses: res[i] ?? [] })),
      })))
    })
  }, [src, JSON.stringify(groups ?? null)])   // eslint-disable-line react-hooks/exhaustive-deps

  const total = sections?.reduce((n, s) => n + s.chapters.reduce((m, c) => m + c.courses.length, 0), 0) ?? 0
  const extras = extraLinks ?? (extraLink ? [extraLink] : [])

  const chapterKey = (si: number, ci: number) => `${si}:${ci}`
  const isSubjOpen = (si: number) => subjClosed[String(si)] !== true
  // 默认：章收起；但学科下只有一章时（分析力学 / 教学节段专题）默认展开
  const isChOpen = (si: number, ci: number) => {
    const k = chapterKey(si, ci)
    if (k in chOpen) return chOpen[k]
    return (sections?.[si]?.chapters.length ?? 0) === 1
  }

  const toggleSubj = (si: number) =>
    setSubjClosed(p => ({ ...p, [String(si)]: !p[String(si)] }))
  const toggleCh = (si: number, ci: number) =>
    setChOpen(p => ({ ...p, [chapterKey(si, ci)]: !isChOpen(si, ci) }))

  const expandAll = () => {
    if (!sections) return
    const next: Record<string, boolean> = {}
    sections.forEach((s, si) => s.chapters.forEach((_, ci) => { next[chapterKey(si, ci)] = true }))
    setChOpen(next)
    setSubjClosed({})
  }
  const collapseAll = () => {
    const ch: Record<string, boolean> = {}
    const sj: Record<string, boolean> = {}
    sections?.forEach((s, si) => {
      sj[String(si)] = true
      s.chapters.forEach((_, ci) => { ch[chapterKey(si, ci)] = false })
    })
    setChOpen(ch)
    setSubjClosed(sj)
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#0b1f38] px-6 py-12 text-slate-100">
      {nav && nav.length > 0 && (
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {nav.map(n => n.current
            ? <span key={n.href} className="rounded-full bg-[#ffb703] px-4 py-1.5 text-sm font-bold text-[#0b1f38]">{n.label}</span>
            : <a key={n.href} href={n.href}
                className="rounded-full bg-[#123a63] px-4 py-1.5 text-sm font-bold text-slate-300 ring-1 ring-[#24456c] hover:bg-[#1a4a7a] hover:text-white">
                {n.label}
              </a>
          )}
        </div>
      )}

      <div className="flex w-full max-w-3xl items-center justify-between">
        <div className="w-28">
          {backLink && (
            <a href={backLink.href} className="text-sm text-slate-400 hover:text-slate-200">
              {backLink.label}
            </a>
          )}
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
        </div>
        <div className="flex min-w-28 flex-col items-end gap-1 text-right">
          {extras.map(link => (
            <a key={link.href} href={link.href}
              className="text-sm font-bold text-[#ffb703] hover:brightness-110">
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div className="mt-10 w-full max-w-3xl">
        {sections === null && <p className="text-center text-slate-500">加载中…</p>}
        {sections !== null && total === 0 && <p className="text-center text-slate-500">暂无课程</p>}

        {sections !== null && total > 0 && (
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <button type="button" onClick={expandAll}
                className="rounded-lg bg-[#123a63] px-3 py-1.5 text-sm font-bold text-slate-200 ring-1 ring-[#24456c] hover:bg-[#1a4a7a]">
                全部展开
              </button>
              <button type="button" onClick={collapseAll}
                className="rounded-lg bg-[#123a63] px-3 py-1.5 text-sm font-bold text-slate-200 ring-1 ring-[#24456c] hover:bg-[#1a4a7a]">
                全部收起
              </button>
            </div>
            <span className="text-xs text-slate-500">
              点学科或章标题可收起 / 展开 · 共 {total} 节
            </span>
          </div>
        )}

        {sections?.map((sec, si) => {
          const nCh = sec.chapters.length
          const nCourse = sec.chapters.reduce((m, c) => m + c.courses.length, 0)
          const sOpen = isSubjOpen(si)
          return (
            <section key={si}>
              <button type="button" onClick={() => toggleSubj(si)} aria-expanded={sOpen}
                className="mt-7 flex w-full items-center justify-between gap-3 border-l-4 border-[#ffb703] pl-3 text-left">
                <span className="text-xl font-bold leading-tight">{sec.name || '课程目录'}</span>
                <span className="shrink-0 rounded-full bg-[#16304f] px-2.5 py-1 text-xs font-bold text-slate-400">
                  {nCourse === 0 ? '未制作' : `${nCh} 章 · ${nCourse} 节`}
                  <span className="ml-1.5 inline-block w-3 text-[#ffb703]">{sOpen ? '▾' : '▸'}</span>
                </span>
              </button>

              {sOpen && sec.chapters.map((ch, ci) => {
                const cOpen = isChOpen(si, ci)
                const empty = ch.courses.length === 0
                return (
                  <div key={ci} className="ml-4">
                    {ch.title && (
                      <button type="button" onClick={() => !empty && toggleCh(si, ci)}
                        aria-expanded={empty ? undefined : cOpen}
                        disabled={empty}
                        className={`mb-3 mt-4 flex w-full items-center justify-between gap-3 rounded-md bg-[#16304f] px-3 py-2 text-left ${empty ? 'cursor-default opacity-70' : 'hover:bg-[#1c3d64]'}`}>
                        <span className="text-base font-bold text-[#d7e6f7]">{ch.title}</span>
                        <span className="shrink-0 text-xs text-slate-400">
                          {empty ? '未制作' : `${ch.courses.length} 节`}
                          {!empty && (
                            <span className="ml-1.5 inline-block w-3 text-[#ffb703]">{cOpen ? '▾' : '▸'}</span>
                          )}
                        </span>
                      </button>
                    )}

                    {empty && (
                      <p className="ml-3 rounded-xl border border-dashed border-[#23405f] bg-[#0f2438] px-4 py-3 text-sm text-slate-500">
                        {ch.note ?? '课节尚未制作'}
                      </p>
                    )}

                    {!empty && cOpen && (
                      <div className="grid gap-4">
                        {ch.courses.map(c => (
                          <div key={c.id}
                            className="flex flex-wrap items-center gap-4 rounded-xl bg-[#0f2a4a] p-5 ring-1 ring-[#ffb703]/30">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-lg font-bold leading-relaxed">{c.title}</h4>
                              {c.desc && <p className="mt-1 text-sm text-slate-400">{c.desc}</p>}
                            </div>
                            {c.lectureAvailable !== false && <a href={`/?course=${c.id}`}
                              className="rounded-lg bg-[#ffb703] px-4 py-2 text-sm font-bold text-[#0b1f38] hover:brightness-110">
                              交互课堂
                            </a>}
                            <a href={c.slidesUrl ?? `/slides.html?course=${c.id}`}
                              className="rounded-lg bg-[#123a63] px-4 py-2 text-sm text-slate-200 hover:bg-[#1a4a7a]">
                              静态幻灯片
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </section>
          )
        })}
      </div>
    </div>
  )
}
