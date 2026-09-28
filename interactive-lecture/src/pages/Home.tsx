import { useEffect, useMemo, useRef, useState } from 'react'
import { ChapterNav, HotspotList, Sidebar, SlideStage } from '@/components/lecture'
import QaRunner from '@/components/lecture/QaRunner'
import { aiAnswer } from '@/lib/qa'
import type { AskContext } from '@/lib/qa'
import { stripMath } from '@/lib/lecture'
import type { Active, Bullet, Msg, Pose, Slide, Sub, Timeline } from '@/lib/lecture'
import type { WebLec, WebPage } from '@/lib/weblec'
import { COURSE_BASE, COURSE_ID } from '@/lib/course'
import CourseMenu from '@/pages/CourseMenu'

export default function Home() {
  if (!COURSE_ID) return <CourseMenu />
  return <Lecture />
}

function Lecture() {
  const mediaRef = useRef<HTMLAudioElement>(null)
  const [weblec, setWeblec] = useState<WebLec | null>(null)
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
    () => localStorage.getItem('teacher-character') ?? '')
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
    if (mediaRef.current) {
      mediaRef.current.currentTime = time
      mediaRef.current.play()
    }
  }

  useEffect(() => {
    // 加时间戳防旧缓存：weblec.json 拿到 build_ts 后，音频/图片再按 build_ts 戳
    fetch(`${COURSE_BASE}weblec.json?t=${Date.now()}`).then(r => r.json()).then(setWeblec)
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

  const curTime = timeline?.slides.find(s => t >= s.t_start && t < s.t_end) ?? null
  const curPage: WebPage | null = weblec?.slides.find(s => s.id === curTime?.id) ?? null
  const curSub = weblec?.subtitles.find(s => t >= s.start && t < s.end) ?? null
  const subs = useMemo(() => weblec?.subtitles ?? [], [weblec])

  /** 网页小人姿态与时间轴联动：开场挥手→指点→思考/点头→强调/板书，穿插讲解。
      全部纯派生（由 t 与各时刻直接算出），重放/跳页/拖进度条结果一致 */
  const pose: Pose = useMemo(() => {
    if (!curTime) return 'explain'
    if (curTime.id === 1 && t < 6) return 'wave'
    const rel = t - curTime.t_start
    if (curTime.laser.some(m => rel >= m.start && rel <= m.end)) return 'laser'
    if (rel > curTime.duration - 4) return curTime.id % 2 === 0 ? 'think' : 'nod'
    if (rel < 2.5) return 'point_up'
    /** 讲稿抛出反问句时摊手启发（激光间隙才轮得到这里） */
    if (curSub && /[？?]\s*$/.test(curSub.text)) return 'shrug'
    return (['explain', 'emphasis', 'write'] as const)[Math.floor(rel / 8) % 3]
  }, [t, curTime, curSub])

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

  /** 提问上下文：要点或字幕句，都归一到当前页 */
  function contextOf(a: Active): AskContext {
    const slideQa = a.slide.bullets.flatMap(b => b.qa.map(x => ({ ...x, _b: b })))
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
          qa: curPage.bullets.flatMap(b => b.qa).slice(0, 4),
          qaAll: curPage.bullets.flatMap(b => b.qa),
          contextText: curSub?.text ?? curPage.heading,
        }
      : null

  const chatKey = active
    ? (active.kind === 'bullet' ? `b-${active.slide.id}-${active.bulletIdx}` : `s-${active.sub.start}`)
    : `g-${curPage?.id ?? 0}`
  const messages = chats[chatKey] ?? []

  function openBullet(slide: Slide, bullet: Bullet, idx: number) {
    mediaRef.current?.pause()
    const a: Active = { kind: 'bullet', slide, bullet, bulletIdx: idx }
    setActive(a)
    const key = `b-${slide.id}-${idx}`
    if (!(chats[key]?.length)) {
      send(`请讲解这个知识点：${bullet.text}`, contextOf(a), key)
    }
  }

  function openSubtitle(sub: Sub) {
    const slide = weblec?.slides.find(s => s.id === sub.slide)
    if (!slide) return
    mediaRef.current?.pause()
    const a: Active = { kind: 'subtitle', slide, sub }
    setActive(a)
    const key = `s-${sub.start}`
    if (!(chats[key]?.length)) {
      send(`请讲解这句话：${sub.text}`, contextOf(a), key)
    }
  }

  function clearContext(resume: boolean) {
    setActive(null)
    if (resume) mediaRef.current?.play()
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

  const chapters = useMemo(() => {
    if (!weblec) return []
    return weblec.slides.map(p => ({ id: p.id, t_start: p.t_start, heading: p.heading }))
  }, [weblec])

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
            onToggleNav={() => setNavOpen(o => !o)}
          />
          {navOpen && (
            <ChapterNav chapters={chapters} currentId={curTime?.id}
              onSeek={time => { seekTo(time); setNavOpen(false) }} cols={8} />
          )}
          {curPage && <HotspotList slide={curPage} onOpenBullet={openBullet} />}
        </div>

        {/* 右侧：可滚动字幕列表 + 常驻聊天框 */}
        <Sidebar
          subs={subs}
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
    </div>
  )
}
