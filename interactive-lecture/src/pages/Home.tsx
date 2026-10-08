import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChapterNav, HotspotList, QuizCard, Sidebar, SlideStage } from '@/components/lecture'
import QaRunner from '@/components/lecture/QaRunner'
import { aiAnswer } from '@/lib/qa'
import type { AskContext } from '@/lib/qa'
import { stripMath } from '@/lib/lecture'
import type { Active, Bullet, Msg, Pose, Slide, Sub, Timeline } from '@/lib/lecture'
import type { WebLec, WebPage, WebQuiz } from '@/lib/weblec'
import { COURSE_BASE, COURSE_ID } from '@/lib/course'
import CourseMenu from '@/pages/CourseMenu'

export default function Home() {
  if (!COURSE_ID) {
    // 课前基础、专题和第九章各用独立清单，课程数据仍按 ?course=<id> 加载。
    const menu = new URLSearchParams(window.location.search).get('menu')
    if (menu === 'foundation') {
      return <CourseMenu title="课前数学基础" subtitle="进入正式课程前先复习常用数学工具"
        src="/weblec/courses_foundation.json"
        backLink={{ href: '/', label: '← 第九章课程' }} />
    }
    if (menu === 'special') {
      return <CourseMenu title="教学节段专题" subtitle="选择一讲进入"
        src="/weblec/courses_special.json"
        backLink={{ href: '/', label: '← 第九章课程' }} />
    }
    return <CourseMenu extraLinks={[
      { href: '/?menu=foundation', label: '课前数学基础 →' },
      { href: '/?menu=special', label: '专题系列 →' },
    ]} />
  }
  if (/^sp[1-8]$/.test(COURSE_ID)) return <SpecialLecture />
  return <Lecture />
}

interface SpecialCourseStatus {
  id: string
  title: string
  desc?: string
  lectureAvailable?: boolean
  slidesUrl?: string
}

/** Check the same status as the menu before mounting an unfinished classroom. */
function SpecialLecture() {
  const [course, setCourse] = useState<SpecialCourseStatus | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    fetch('/weblec/courses_special.json', { cache: 'no-store', signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error('Course status unavailable')
        return r.json() as Promise<SpecialCourseStatus[]>
      })
      .then(courses => {
        const current = courses.find(c => c.id === COURSE_ID)
        if (!current) throw new Error('Course status missing')
        setCourse(current)
      })
      .catch(() => { if (!controller.signal.aborted) setFailed(true) })
    return () => controller.abort()
  }, [])

  if (course && course.lectureAvailable !== false) return <Lecture />
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#0b1f38] px-6 text-center text-slate-100">
      <h1 className="text-2xl font-bold">{course?.title ?? '教学节段专题'}</h1>
      <p className="max-w-xl text-slate-300">
        {course ? course.desc ?? '本课有声课堂尚待验收，可先查看静态课件。'
          : failed ? '暂时无法读取课程状态，请刷新后重试。' : '正在读取课程状态…'}
      </p>
      {course && <a href={course.slidesUrl ?? `/slides.html?course=${course.id}`}
        className="rounded-lg bg-[#ffb703] px-4 py-2 font-bold text-[#0b1f38]">
        查看静态审阅稿
      </a>}
      <a href="/?menu=special" className="text-slate-400 hover:text-slate-200">← 专题系列</a>
    </div>
  )
}

function Lecture() {
  const mediaRef = useRef<HTMLAudioElement>(null)
  /** Move one stable portal host so fullscreen changes preserve quiz answers. */
  const [quizHost] = useState(() => document.createElement('div'))
  useEffect(() => {
    const updateHost = () => {
      const parent = document.fullscreenElement ?? document.body
      if (quizHost.parentNode !== parent) parent.appendChild(quizHost)
    }
    updateHost()
    document.addEventListener('fullscreenchange', updateHost)
    return () => {
      document.removeEventListener('fullscreenchange', updateHost)
      quizHost.remove()
    }
  }, [quizHost])
  const [weblec, setWeblec] = useState<WebLec | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  /** 版式质检模式：地址栏带 ?qa=1 时自动巡检全部页面 */
  const qaMode = useMemo(() => new URLSearchParams(window.location.search).has('qa'), [])
  const [t, setT] = useState(0)
  const [active, setActive] = useState<Active | null>(null)
  const [chats, setChats] = useState<Record<string, Msg[]>>({})
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [rate, setRate] = useState(1)
  /** 章节导航默认收起，点进度条右侧页码指示器展开（跳页后自动收起） */
  const [navOpen, setNavOpen] = useState(false)

  /** 卡通讲师可切换：记住用户选择，默认用课程指定的角色 */
  const [character, setCharacter] = useState<string>(
    () => localStorage.getItem('teacher-character') || 'aqiang')
  useEffect(() => {
    if (!weblec?.characters?.length) return
    const valid = weblec.characters.some(c => c.id === character)
    if (!valid) setCharacter(weblec.character ?? weblec.characters[0].id)
  }, [weblec, character])
  function switchCharacter() {
    const list = weblec?.characters
    if (!list?.length) return
    const next = list[(list.findIndex(c => c.id === character) + 1) % list.length]
    setCharacter(next.id)
    localStorage.setItem('teacher-character', next.id)
  }
  const characterName = weblec?.characters?.find(c => c.id === character)?.name ?? ''

  function changeRate(r: number) {
    setRate(r)
    if (mediaRef.current) mediaRef.current.playbackRate = r
  }

  function seekTo(time: number) {
    if (activeQuiz) return
    if (mediaRef.current) {
      mediaRef.current.currentTime = time
      mediaRef.current.play()
    }
  }

  useEffect(() => {
    // Bind the version before mounting audio: changing its src interrupts playback.
    const controller = new AbortController()
    fetch(`${COURSE_BASE}weblec.json?t=${Date.now()}`, { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error('Course data unavailable')
        return r.json() as Promise<WebLec>
      })
      .then(setWeblec)
      .catch(() => { if (!controller.signal.aborted) setLoadFailed(true) })
    return () => controller.abort()
  }, [])

  /** 姿态/激光状态机用的时间轴（激光时刻转成页内相对值） */
  const timeline: Timeline | null = useMemo(() => weblec ? {
    slides: weblec.slides.map(p => ({
      id: p.id,
      duration: p.duration,
      t_start: p.t_start,
      t_end: p.t_end,
      laser: p.laser.map(m => ({
        bullet: m.bullet,
        start: m.start - p.t_start,
        end: m.end - p.t_start,
      })),
    })),
  } : null, [weblec])

  const finalTime = timeline?.slides.length ? timeline.slides[timeline.slides.length - 1] : null
  const curTime = timeline?.slides.find(s => t >= s.t_start && t < s.t_end)
    ?? (finalTime && t >= finalTime.t_end ? finalTime : null)
  const curPage: WebPage | null = weblec?.slides.find(s => s.id === curTime?.id) ?? null
  const curSub = weblec?.subtitles.find(s => t >= s.start && t < s.end) ?? null
  /** Reveal the lower hotspot list at the same time as its stage element. */
  const hotspotPage: WebPage | null = curPage ? {
    ...curPage,
    bullets: curPage.bullets.filter(b => {
      const el = curPage.elements[b.elIdx]
      if (!el) return false
      return el.step === 0 || t >= (curPage.stepTimes[String(el.step)] ?? Infinity)
    }),
  } : null
  const subs = useMemo(() => weblec?.subtitles ?? [], [weblec])

  /** 网页小人姿态与时间轴、讲稿语义联动。全部纯派生（由 t 与各时刻直接算出），
      重放/跳页/拖进度条结果一致。**不做强制轮换**：没有语义触发时保持讲解姿态，
      非语义动作只有激光指点、页尾收束（思考/点头）。语义映射（按词在句内位置插值
      出说出时刻，说到才触发；句尾剩余 >1.5s 才换）：
        摊手 shrug    = 提出问题（句尾问号，或含 为什么/怎么办/如何 等提问词）
        指天 point_up = 得出结论（含 所以/因此/得到/可见/也就是说/结论 等收束词）
        思考 think    = 引导思考（含 想一想/思考/不妨/回忆一下）
        板书 write    = 推导演算（含 推导/公式/代入/展开/写成/写为/整理）
      emphasis（双手举过头）只在特殊节点出现：
      整课收尾最后 6 秒，或 important 难点激光刚收笔的 1.8 秒内 */
  const pose: Pose = useMemo(() => {
    if (!curTime || !timeline || !curPage) return 'explain'
    if (curTime.id === 1 && t < 6) return 'wave'
    const rel = t - curTime.t_start
    if (curTime.laser.some(m => rel >= m.start && rel <= m.end)) return 'laser'
    const tEnd = timeline.slides[timeline.slides.length - 1].t_end
    if (t > tEnd - 6) return 'emphasis'
    if (curTime.laser.some(m => curPage.bullets[m.bullet]?.important && rel > m.end && rel <= m.end + 1.8)) return 'emphasis'
    /** 讲稿语义姿态：语义词按句内字符位置比例插值出「被说出的时刻」
        （与构建器步进时刻同一套算法），说到才换动作，不抢拍；
        句尾剩余太短就不换，避免刚淡入就切走的闪动感 */
    if (curSub && curSub.end - t > 1.5) {
      const txt = curSub.text
      /** 返回语义词被说出的绝对时刻；句尾问号整句皆为提问，从句首触发 */
      const cueAt = (re: RegExp, fromStart = false): number | null => {
        const m = txt.match(re)
        if (!m) return null
        const frac = fromStart ? 0 : (m.index ?? 0) / Math.max(txt.length, 1)
        return curSub.start + frac * (curSub.end - curSub.start)
      }
      const cues: [Pose, number | null][] = [
        ['shrug', cueAt(/[？?]\s*$/, true) ?? cueAt(/为什么|怎么办|如何|能不能|有没有/)],
        ['point_up', cueAt(/所以|因此|于是|得到|可见|也就是说|结论|即得|这就是/)],
        ['think', cueAt(/想一想|思考|不妨|回忆一下|考虑/)],
        ['write', cueAt(/推导|公式|代入|展开|写成|写为|整理/)],
      ]
      for (const [p, at] of cues) if (at !== null && t >= at) return p
    }
    if (rel > curTime.duration - 4) return curTime.id % 2 === 0 ? 'think' : 'nod'
    return 'explain'
  }, [t, curTime, curSub, timeline, curPage])

  /** 当前激光笔指向的知识点坐标（1920×1080 设计坐标）与要点下标 */
  const laserTarget = useMemo(() => {
    if (!curTime || !curPage) return null
    const rel = t - curTime.t_start
    const m = curTime.laser.find(m => rel >= m.start && rel <= m.end)
    if (!m) return null
    const b = curPage.bullets[m.bullet]
    return b ? { x: b.x, y: b.y, idx: m.bullet, elapsed: rel - m.start } : null
  }, [t, curTime, curPage])

  /** 重要知识点下划红线：脚本标注 important 的要点被激光指点时起持续 10 秒，每页最多 3 条。
      纯派生计算（fire ≤ t ≤ fire+10s），不存状态——跳页/回退/重放都自动正确 */
  const underlines = useMemo(() => {
    if (!curPage) return []
    const seen = new Set<number>()
    const out: { i: number; until: number }[] = []
    for (const m of curPage.laser) {
      if (out.length >= 3) break
      if (!curPage.bullets[m.bullet]?.important) continue
      if (t < m.start || t > m.start + 10) continue
      if (seen.has(m.bullet)) continue
      seen.add(m.bullet)
      out.push({ i: m.bullet, until: m.start + 10 })
    }
    return out
  }, [t, curPage])

  /** 姿势平滑过渡：两个非中立姿势之间先回到讲解姿势作中间态，再淡入新姿势 */
  const [shownPose, setShownPose] = useState<Pose>('explain')
  useEffect(() => {
    if (pose === shownPose) return
    if (pose === 'explain' || shownPose === 'explain') {
      setShownPose(pose)
      return
    }
    setShownPose('explain')
    const id = setTimeout(() => setShownPose(pose), 420)
    return () => clearTimeout(id)
  }, [pose, shownPose])

  /** 随堂互动题：t 越过当前页某题时刻且未作答过 → 自动暂停弹出答题卡。
      「已答/已跳过」集合按 `页id:题时刻` 键管理，seek 回退再播放到同一点不重复弹；
      拖进度条一次跨过多道未答题时只弹最后越过的那道，前面的记为跳过（视为不触发）。
      qa 质检模式（?qa=1）自动巡页时不触发，避免打断巡检。 */
  const [answeredQuiz, setAnsweredQuiz] = useState<Record<string, boolean>>({})
  const [activeQuiz, setActiveQuiz] = useState<{ pageId: number; quiz: WebQuiz } | null>(null)
  useEffect(() => {
    if (qaMode || activeQuiz || !curPage?.interactions?.length) return
    const due = curPage.interactions.filter(q => t >= q.t && !answeredQuiz[`${curPage.id}:${q.t}`])
    if (!due.length) return
    const quiz = due[due.length - 1]
    mediaRef.current?.pause()
    if (due.length > 1) {
      const skip: Record<string, boolean> = {}
      for (const q of due.slice(0, -1)) skip[`${curPage.id}:${q.t}`] = true
      setAnsweredQuiz(prev => ({ ...prev, ...skip }))
    }
    setActiveQuiz({ pageId: curPage.id, quiz })
  }, [t, curPage, activeQuiz, answeredQuiz, qaMode])

  /** 答题卡弹出期间：保持暂停（挡住空格键恢复）；换页则直接关卡车交给跳页动作 */
  useEffect(() => {
    if (!activeQuiz) return
    mediaRef.current?.pause()
    if (curPage && activeQuiz.pageId !== curPage.id) setActiveQuiz(null)
  }, [activeQuiz, curPage, t])

  /** 作答完成：记为已答、关掉答题卡、恢复播放 */
  function finishQuiz() {
    if (!activeQuiz) return
    setAnsweredQuiz(prev => ({ ...prev, [`${activeQuiz.pageId}:${activeQuiz.quiz.t}`]: true }))
    setActiveQuiz(null)
    mediaRef.current?.play()
  }

  /** 提问上下文：要点或字幕句，都归一到当前页 */
  function contextOf(a: Active): AskContext {
    const slidePage = weblec?.slides.find(page => page.id === a.slide.id)
    const slideQa = (slidePage?.bullets ?? []).filter(b => {
      const el = slidePage?.elements[b.elIdx]
      return !!el && (el.step === 0 || t >= (slidePage!.stepTimes[String(el.step)] ?? Infinity))
    }).flatMap(b => b.qa.map(x => ({ ...x, _b: b })))
    return {
      slide: a.slide,
      label: a.kind === 'bullet' ? a.bullet.text : a.sub.text,
      qa: a.kind === 'bullet' ? a.bullet.qa : slideQa.slice(0, 4),
      qaAll: slideQa,
      contextText: a.kind === 'bullet' ? a.bullet.text : a.sub.text,
    }
  }

  /** 未选中具体上下文时，默认围绕当前页/当前句提问 */
  const activeCtx: AskContext | null = active
    ? contextOf(active)
    : curPage
      ? {
          slide: curPage,
          label: curSub?.text ?? curPage.heading,
          qa: (hotspotPage?.bullets ?? []).flatMap(b => b.qa).slice(0, 4),
          qaAll: (hotspotPage?.bullets ?? []).flatMap(b => b.qa),
          contextText: curSub?.text ?? curPage.heading,
        }
      : null

  const chatKey = active
    ? (active.kind === 'bullet' ? `b-${active.slide.id}-${active.bulletIdx}` : `s-${active.sub.start}`)
    : `g-${curPage?.id ?? 0}`
  const messages = chats[chatKey] ?? []

  const [sidebarRevealVersion, setSidebarRevealVersion] = useState(0)

  /** The sidebar is outside the stage fullscreen subtree. Reveal it before asking. */
  function openInSidebar(open: () => void, pause = true) {
    setSidebarRevealVersion(version => version + 1)
    if (pause) mediaRef.current?.pause()
    if (document.fullscreenElement) {
      void document.exitFullscreen().then(open)
    } else {
      open()
    }
  }

  function openBullet(slide: Slide, bullet: Bullet, idx: number) {
    openInSidebar(() => {
      const a: Active = { kind: 'bullet', slide, bullet, bulletIdx: idx }
      setActive(a)
      const key = `b-${slide.id}-${idx}`
      if (!(chats[key]?.length)) {
        send(`请讲解这个知识点：${bullet.text}`, contextOf(a), key)
      }
    })
  }

  function openSubtitle(sub: Sub) {
    const slide = weblec?.slides.find(s => s.id === sub.slide)
    if (!slide) return
    openInSidebar(() => {
      const a: Active = { kind: 'subtitle', slide, sub }
      setActive(a)
      const key = `s-${sub.start}`
      if (!(chats[key]?.length)) {
        send(`请讲解这句话：${sub.text}`, contextOf(a), key)
      }
    })
  }

  function clearContext(resume: boolean) {
    setActive(null)
    if (resume && !activeQuiz) mediaRef.current?.play()
  }

  async function send(q: string, ctx: AskContext, key: string) {
    if (!q.trim() || thinking || !weblec) return
    setThinking(true)
    setChats(prev => ({ ...prev, [key]: [...(prev[key] ?? []), { role: 'user', text: q }] }))
    setInput('')
    const { text, online } = await aiAnswer(q, ctx, weblec)
    setChats(prev => ({
      ...prev,
      [key]: [...(prev[key] ?? []),
        { role: 'ai', text: text + (online ? '' : '\n\n（离线答疑库回答）') }],
    }))
    setThinking(false)
  }

  async function ask(q: string) {
    if (!activeCtx) return
    await send(q, activeCtx, chatKey)
  }

  /** 分段导航：slides 带 sections 时章节导航按大段列出（点段名跳该段首页），否则逐页 */
  const sections = weblec?.sections?.length ? weblec.sections : null
  const chapters = useMemo(() => {
    if (!weblec) return []
    if (sections) {
      return sections.map((s, i) => ({
        id: i + 1,
        t_start: weblec.slides.find(p => p.id === s.page)?.t_start ?? 0,
        heading: s.title,
      }))
    }
    return weblec.slides.map(p => ({ id: p.id, t_start: p.t_start, heading: p.heading }))
  }, [weblec, sections])
  /** 章节导航高亮：分段模式高亮当前段（序号），逐页模式高亮当前页 id */
  const navCurrentId = sections && curPage
    ? sections.reduce((acc, s, i) => (s.page <= curPage.id ? i + 1 : acc), 0)
    : curTime?.id

  if (!weblec) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#0b1f38] px-6 text-center text-slate-100">
      <h1 className="text-2xl font-bold">{loadFailed ? '课件读取失败' : '正在加载课件…'}</h1>
      {loadFailed && <button onClick={() => window.location.reload()}
        className="rounded bg-[#ffb703] px-4 py-2 font-bold text-[#0b1f38]">重新加载</button>}
      <a href="/" className="text-slate-400 hover:text-slate-200">← 课程列表</a>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0b1f38] text-slate-100">
      <header className="border-b border-[#ffb703]/40 bg-[#0f2a4a] px-6 py-4 flex items-baseline gap-4">
        <h1 className="text-xl font-bold">{weblec?.title ?? '加载中…'}</h1>
        <span className="text-sm text-slate-400">交互式课堂 · 点击知识点或字幕提问 · 空格播放 · B 黑屏 · F 全屏</span>
        <a href="/" className="ml-auto rounded bg-[#123a63] px-2.5 py-1 text-xs text-slate-300 hover:bg-[#1a4a7a]">课程列表</a>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_auto] lg:gap-16 gap-6">
        {/* 左侧：网页幻灯片 + 章节导航 + 本页关键知识点 */}
        <div>
          <SlideStage
            mediaRef={mediaRef}
            playbackLocked={!!activeQuiz}
            weblec={weblec}
            curPage={curPage}
            t={t}
            onTimeUpdate={setT}
            laserTarget={laserTarget}
            underlines={underlines}
            onOpenBullet={openBullet}
            rate={rate}
            onRateChange={changeRate}
            shownPose={shownPose}
            character={character}
            characterName={characterName}
            charactersSwitchable={!!weblec?.characters?.length}
            onSwitchCharacter={switchCharacter}
            navOpen={navOpen}
            onToggleNav={() => navOpen ? setNavOpen(false) : openInSidebar(() => setNavOpen(true), false)}
          />
          {navOpen && (
            <ChapterNav chapters={chapters} currentId={navCurrentId}
              onSeek={time => { seekTo(time); setNavOpen(false) }} cols={sections ? 4 : 8} />
          )}
          {curPage && hotspotPage && <HotspotList slide={hotspotPage}
            onOpenBullet={(_slide, bullet) => openBullet(curPage, bullet,
              curPage.bullets.findIndex(original => original === bullet))} />}
        </div>

        {/* 右侧：可滚动字幕列表 + 常驻聊天框 */}
        <Sidebar
          revealVersion={sidebarRevealVersion}
          subs={/^sp\d+$/.test(COURSE_ID ?? '') ? subs.filter(s => s.start <= t) : subs}
          curSubStart={curSub?.start ?? null}
          t={t}
          onOpenSubtitle={openSubtitle}
          messages={messages}
          thinking={thinking}
          input={input}
          onInputChange={setInput}
          onAsk={ask}
          suggestions={activeCtx?.qa ?? []}
          contextLabel={active && activeCtx ? stripMath(activeCtx.label) : null}
          onClearContext={() => clearContext(true)}
        />
      </main>
      {qaMode && <QaRunner mediaRef={mediaRef} weblec={weblec} />}
      {activeQuiz && curPage?.id === activeQuiz.pageId && createPortal(
        <QuizCard quiz={activeQuiz.quiz} onContinue={finishQuiz} />, quizHost
      )}
    </div>
  )
}
