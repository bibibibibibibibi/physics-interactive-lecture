import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Element } from '@/components/lecture/SlideStage'
import QuizCard from '@/components/lecture/QuizCard'
import { stripMath, VIDEO_H, VIDEO_W } from '@/lib/lecture'
import { resolveTheme } from '@/lib/theme'
import type { WebElement, WebLec, WebPage } from '@/lib/weblec'
import { COURSE_BASE, COURSE_ID, DEFAULT_COURSE } from '@/lib/course'

declare global {
  interface Window {
    /** 单文件导出时由 export_slides.py 直接注入的课件数据（免去 fetch） */
    __WEBLEC__?: WebLec
    /** 单文件导出时注入的图片 data URL 表：文件名 → data:image/... */
    __WEBLEC_MEDIA__?: Record<string, string>
  }
}

/** Only opt-in iframe commands add otherwise invisible presentation steps. */
function presentationSteps(page: WebPage): number[] {
  const values = page.elements.map(el => el.step)
  page.elements.forEach(el => {
    if (el.type !== 'html' || !el.timelineSync || !el.msgs) return
    Object.keys(el.msgs).forEach(key => {
      if (/^\d+$/.test(key)) values.push(Number(key))
    })
  })
  return [...new Set(values.filter(step => Number.isSafeInteger(step) && step >= 0))]
    .sort((a, b) => a - b)
}

/** 把 img 元素的 src 替换成内联 data URL（仅在单文件导出包里生效） */
function inlineMedia(lec: WebLec): WebLec {
  const media = window.__WEBLEC_MEDIA__
  if (!media) return lec
  return {
    ...lec,
    slides: lec.slides.map(p => ({
      ...p,
      elements: p.elements.map(el =>
        el.type === 'img' && el.src && media[el.src] ? { ...el, src: media[el.src] } : el,
      ),
    })),
  }
}

/* ---------- 批注 ---------- */

interface Stroke { color: string; pts: [number, number][] }
interface AnnStore { strokes: Record<string, Stroke[]>; notes: Record<string, string[]> }

const LS_KEY = `slides-annotations-${COURSE_ID ?? DEFAULT_COURSE}`
const PEN_COLORS = ['#e03131', '#1971c2', '#212529']

function loadAnn(): AnnStore {
  try {
    const d = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}')
    return { strokes: d.strokes ?? {}, notes: d.notes ?? {} }
  } catch {
    return { strokes: {}, notes: {} }
  }
}

/** 元素的短标签（导出批注时定位用） */
function elLabel(el: WebElement, idx: number): string {
  const raw = el.tex
    ?? el.paras?.flat().map(r => r.t).join('')
    ?? el.name ?? el.src
    ?? el.rows?.flat().join(' | ')
    ?? ''
  return `#${idx} ${el.type}: ${stripMath(raw).slice(0, 40)}`
}

function strokeBBox(s: Stroke): [number, number, number, number] {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9
  for (const [x, y] of s.pts) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y)
    x1 = Math.max(x1, x); y1 = Math.max(y1, y)
  }
  return [x0, y0, x1, y1]
}

/**
 * 纯幻灯片静态页：无配音/小人/侧边栏/激光，白底全页，
 * 键盘或点击逐步揭示，可脱离交互课堂独立投影使用。
 * → / 空格 / 单击：下一步（步尽翻页）   ← / 右键：上一步（页首回上页）
 * PgDn / PgUp：整页跳   Home / End：首尾页   F：全屏   A：批注模式
 * 动画图示（弹簧振子等）由自由时钟驱动，放映时持续运动。
 */
export default function SlidesOnly() {
  const [weblec, setWeblec] = useState<WebLec | null>(null)
  const [pageIdx, setPageIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [scale, setScale] = useState(0.5)
  const [animT, setAnimT] = useState(0)
  const [quizIdx, setQuizIdx] = useState<number | null>(null)
  const htmlRefs = useRef(new Map<number, HTMLIFrameElement>())

  /* 批注状态 */
  const [annotate, setAnnotate] = useState(false)
  const [penColor, setPenColor] = useState(PEN_COLORS[0])
  const [ann, setAnn] = useState<AnnStore>(loadAnn)
  const [cur, setCur] = useState<Stroke | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [noteDraft, setNoteDraft] = useState<string | null>(null)
  const noteDialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = noteDialogRef.current
    if (!dialog) return
    if (noteDraft !== null && !dialog.open) dialog.showModal()
    else if (noteDraft === null && dialog.open) dialog.close()
  }, [noteDraft])

  /* 底部操作提示：浮动显示——动鼠标时出现，静止 2.6 秒后自动隐去，不遮挡页脚 */
  const [hintOn, setHintOn] = useState(true)
  const hintTimer = useRef<number | undefined>(undefined)
  useEffect(() => {
    const wake = () => {
      setHintOn(true)
      window.clearTimeout(hintTimer.current)
      hintTimer.current = window.setTimeout(() => setHintOn(false), 2600)
    }
    wake()
    window.addEventListener('mousemove', wake)
    return () => {
      window.removeEventListener('mousemove', wake)
      window.clearTimeout(hintTimer.current)
    }
  }, [])

  useEffect(() => {
    if (window.__WEBLEC__) {
      setWeblec(inlineMedia(window.__WEBLEC__))
      return
    }
    fetch(`${COURSE_BASE}weblec.json`)
      .then(r => r.json())
      .then((d: WebLec) => setWeblec(inlineMedia(d)))
  }, [])

  useEffect(() => {
    if (weblec?.title) document.title = `${weblec.title} · 幻灯片`
  }, [weblec])

  useEffect(() => {
    const onResize = () =>
      setScale(Math.min(window.innerWidth / VIDEO_W, window.innerHeight / VIDEO_H))
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  /** 自由动画时钟：驱动弹簧振子等动画图示（20fps；用 setInterval 而非 rAF，
      在嵌入/投屏等 rAF 被节流的浏览器环境里也能稳定走时） */
  useEffect(() => {
    const t0 = performance.now()
    const id = setInterval(() => setAnimT((performance.now() - t0) / 1000), 50)
    return () => clearInterval(id)
  }, [])

  /** 批注持久化到浏览器本地 */
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(ann))
  }, [ann])

  const pages = useMemo(() => weblec?.slides ?? [], [weblec])
  const page: WebPage | null = pages[pageIdx] ?? null
  const pageKey = page ? String(page.id) : ''
  const steps = useMemo(
    () => (page ? presentationSteps(page) : [0]),
    [page],
  )
  const curStep = steps[Math.min(stepIdx, steps.length - 1)] ?? 0
  const activeQuiz = quizIdx === null ? null : page?.interactions?.[quizIdx] ?? null

  /** Static presentation uses the chosen step, never a free-running demo clock. */
  function sendHtmlTimeline(elIdx: number, el: WebElement) {
    if (el.type !== 'html' || !el.timelineSync || !page) return
    htmlRefs.current.get(elIdx)?.contentWindow?.postMessage({
      type: 'lecture-state', mode: 'static', pageId: page.id,
      pageTime: Math.max(0, (page.stepTimes[String(curStep)] ?? page.t_start) - page.t_start),
      step: curStep, playing: false,
      steps: Object.fromEntries(Object.entries(page.stepTimes)
        .map(([k, v]) => [k, v - page.t_start])),
    }, window.location.origin)
  }
  useEffect(() => {
    page?.elements.forEach((el, i) => sendHtmlTimeline(i, el))
  }, [page, curStep])

  /** 步进：前进先走当前页的步，步尽翻下一页；后退对称，页首回上一页最后一步 */
  const nav = useCallback(
    (d: number) => {
      if (!page) return
      if (d > 0) {
        if (stepIdx < steps.length - 1) setStepIdx(stepIdx + 1)
        else if (pageIdx < pages.length - 1) {
          setPageIdx(pageIdx + 1)
          setStepIdx(0)
        }
      } else {
        if (stepIdx > 0) setStepIdx(stepIdx - 1)
        else if (pageIdx > 0) {
          const prev = pages[pageIdx - 1]
          const ps = presentationSteps(prev)
          setPageIdx(pageIdx - 1)
          setStepIdx(ps.length - 1)
        }
      }
    },
    [page, stepIdx, steps, pageIdx, pages],
  )

  /** 整页跳（PgDn/PgUp）：落到目标页初始步 */
  const jumpPage = useCallback(
    (d: number) => {
      const ni = Math.min(Math.max(pageIdx + d, 0), pages.length - 1)
      if (ni !== pageIdx) {
        setPageIdx(ni)
        setStepIdx(0)
      }
    },
    [pageIdx, pages.length],
  )

  const toggleFs = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen()
    else document.documentElement.requestFullscreen()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (noteDraft !== null) return
      if (activeQuiz) {
        if (e.key === 'Escape') setQuizIdx(null)
        if (e.key === ' ' || e.key.startsWith('Arrow') || ['PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) e.preventDefault()
        return
      }
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        nav(1)
      } else if (e.key === 'ArrowLeft') nav(-1)
      else if (e.key === 'PageDown') jumpPage(1)
      else if (e.key === 'PageUp') jumpPage(-1)
      else if (e.key === 'Home') {
        setPageIdx(0)
        setStepIdx(0)
      } else if (e.key === 'End') {
        setPageIdx(pages.length - 1)
        setStepIdx(0)
      } else if (e.key === 'f' || e.key === 'F') toggleFs()
      else if ((e.key === 'q' || e.key === 'Q') && page?.interactions?.length) setQuizIdx(0)
      else if (e.key === 'a' || e.key === 'A') setAnnotate(v => !v)
      else if (e.key === 'Escape') setAnnotate(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nav, jumpPage, pages.length, toggleFs, noteDraft, activeQuiz, page])

  /* ---------- 批注绘制 ---------- */

  /** 重画当前页全部笔迹（含进行中的一笔） */
  useEffect(() => {
    const c = canvasRef.current
    if (!c || !page) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, VIDEO_W, VIDEO_H)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const all = [...(ann.strokes[pageKey] ?? []), ...(cur ? [cur] : [])]
    for (const s of all) {
      if (s.pts.length === 0) continue
      ctx.strokeStyle = s.color
      ctx.lineWidth = 7
      ctx.beginPath()
      s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
      if (s.pts.length === 1) ctx.lineTo(s.pts[0][0] + 0.1, s.pts[0][1] + 0.1)
      ctx.stroke()
    }
  })

  const toDesign = (e: React.PointerEvent): [number, number] => {
    const r = canvasRef.current!.getBoundingClientRect()
    return [
      ((e.clientX - r.left) / r.width) * VIDEO_W,
      ((e.clientY - r.top) / r.height) * VIDEO_H,
    ]
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    setCur({ color: penColor, pts: [toDesign(e)] })
  }
  function onPointerMove(e: React.PointerEvent) {
    setCur(c => (c ? { ...c, pts: [...c.pts, toDesign(e)] } : c))
  }
  function onPointerUp() {
    if (!cur || !page) return
    if (cur.pts.length > 0) {
      setAnn(a => ({
        ...a,
        strokes: { ...a.strokes, [pageKey]: [...(a.strokes[pageKey] ?? []), cur] },
      }))
    }
    setCur(null)
  }

  const undoStroke = () =>
    setAnn(a => ({
      ...a,
      strokes: { ...a.strokes, [pageKey]: (a.strokes[pageKey] ?? []).slice(0, -1) },
    }))
  const clearPage = () =>
    setAnn(a => ({ ...a, strokes: { ...a.strokes, [pageKey]: [] } }))
  const addNote = () => setNoteDraft('')
  const saveNote = () => {
    const text = noteDraft?.trim()
    if (text) {
      setAnn(a => ({
        ...a,
        notes: { ...a.notes, [pageKey]: [...(a.notes[pageKey] ?? []), text] },
      }))
    }
    setNoteDraft(null)
  }

  /** 导出批注 JSON：每笔自动标注与哪些页面元素重叠，直接指导后续修改 weblec.json */
  function exportAnnotations() {
    if (!weblec) return
    const out = {
      type: 'slides-annotations',
      course: weblec.title,
      exportedAt: new Date().toISOString(),
      pages: weblec.slides
        .map(p => {
          const k = String(p.id)
          const ss = ann.strokes[k] ?? []
          const ns = ann.notes[k] ?? []
          return {
            page: p.id,
            heading: p.heading,
            notes: ns,
            strokes: ss.map(s => {
              const [x0, y0, x1, y1] = strokeBBox(s)
              return {
                color: s.color,
                bbox: [Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1)],
                overlaps: p.elements
                  .map((el, i) => ({ el, i }))
                  .filter(({ el }) =>
                    x0 < el.x + el.w && x1 > el.x &&
                    y0 < el.y + (el.h ?? 90) && y1 > el.y)
                  .map(({ el, i }) => elLabel(el, i)),
                pts: s.pts.map(([x, y]) => [Math.round(x), Math.round(y)]),
              }
            }),
          }
        })
        .filter(p => p.strokes.length > 0 || p.notes.length > 0),
    }
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `幻灯片批注-${weblec.title}-${new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const logoSrc = window.__WEBLEC_MEDIA__?.['logo.png'] ?? `${COURSE_BASE}logo.png`
  const pageStrokeCount = (ann.strokes[pageKey] ?? []).length
  const pageNoteCount = (ann.notes[pageKey] ?? []).length

  if (!weblec || !page) {
    return <div className="flex h-screen items-center justify-center bg-white text-slate-400">加载中…</div>
  }
  /** 页面版式主题：缺省/未知回落 default（与交互课堂同一套 token） */
  const th = resolveTheme(weblec.theme)

  return (
    <div
      className="flex h-screen w-screen select-none items-center justify-center overflow-hidden bg-white"
      style={{ cursor: annotate ? 'crosshair' : 'pointer' }}
      onClick={() => !annotate && !activeQuiz && nav(1)}
      onContextMenu={e => {
        e.preventDefault()
        if (!annotate && !activeQuiz) nav(-1)
      }}
    >
      <style>{`
        @keyframes wl-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .wl-in{animation:wl-in .5s ease-out}
      `}</style>
      {/* 缩放后的可视框 */}
      <div
        className="relative shadow-[0_0_40px_rgba(0,0,0,0.08)]"
        style={{ width: VIDEO_W * scale, height: VIDEO_H * scale }}
        onClick={e => e.stopPropagation()}
      >
        {/* 1920×1080 设计坐标舞台 */}
        <div
          style={{
            position: 'absolute', width: VIDEO_W, height: VIDEO_H,
            transform: `scale(${scale})`, transformOrigin: 'top left',
            color: '#111', background: th.background, overflow: 'hidden',
          }}
          onClick={() => !annotate && !activeQuiz && nav(1)}
        >
          {/* 页面版式：课程 logo / 顶部导航 / 页脚 / 页码（与交互课堂一致，按课程 theme 渲染） */}
          <img src={logoSrc} alt="" style={{
            ...th.logoStyle,
            height: 116 * (weblec.logoScale ?? 1), width: 270 * (weblec.logoScale ?? 1),
            objectFit: 'contain',
          }} />
          {th.navStyle && (
            <div style={th.navStyle}>
              <span style={th.navText}>{weblec.nav}</span>
              <div style={th.navBar} />
            </div>
          )}
          {th.headerRule && <div style={th.headerRule} />}
          {th.bottomLine && (
            <div style={{
              position: 'absolute', left: 700, right: 700, bottom: 18, height: 3,
              background: 'linear-gradient(90deg, transparent, #0000CD, transparent)',
            }} />
          )}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 26, textAlign: 'center',
            zIndex: 20, pointerEvents: 'none', ...th.footerText,
          }}>
            <span style={th.footerPill ?? undefined}>{weblec.footer}</span>
          </div>
          {!(th.pageNumSkipFirst && page.id === 1) && (
            <div style={{
              position: 'absolute', right: 40, bottom: 22,
              zIndex: 20, pointerEvents: 'none',
              ...th.pageNumText, ...(th.pageNumPill ?? {}),
            }}>{page.id}</div>
          )}

          {/* 页面元素：按步揭示（与交互课堂同一渲染组件，t 驱动动画图示） */}
          {page.elements.map((el, i) =>
            el.step <= curStep
              ? <div key={`${page.id}-${i}`} className="wl-in"><Element el={el} t={animT}
                  iframeRef={node => { if (node) htmlRefs.current.set(i, node); else htmlRefs.current.delete(i) }}
                  onIframeLoad={() => sendHtmlTimeline(i, el)} /></div>
              : null,
          )}

          {/* 批注画布：覆盖整页，设计坐标 1920×1080 */}
          {annotate && (
            <canvas
              ref={canvasRef}
              width={VIDEO_W}
              height={VIDEO_H}
              style={{
                position: 'absolute', inset: 0, width: VIDEO_W, height: VIDEO_H,
                zIndex: 30, touchAction: 'none',
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
          )}
        </div>
      </div>

      {/* Teacher-operated questions remain available without narration. */}
      {!annotate && !activeQuiz && !!page.interactions?.length && (
        <div className="fixed bottom-16 right-3 z-40 flex gap-2 transition-opacity"
          style={{ opacity: hintOn ? 1 : 0, pointerEvents: hintOn ? 'auto' : 'none' }}
          onClick={e => e.stopPropagation()}>
          {page.interactions.map((_, i) => (
            <button key={i} onClick={() => setQuizIdx(i)}
              className="rounded-full bg-[#0b1f38] px-4 py-2 text-sm text-white shadow-lg">
              互动题{page.interactions!.length > 1 ? ` ${i + 1}` : ''}
            </button>
          ))}
        </div>
      )}
      {activeQuiz && (
        <div onClick={e => e.stopPropagation()} onContextMenu={e => { e.preventDefault(); e.stopPropagation() }}>
          <QuizCard key={`${pageKey}-${quizIdx}`} quiz={activeQuiz}
            continueLabel="返回幻灯片" onContinue={() => setQuizIdx(null)} />
        </div>
      )}

      {/* 批注工具条 */}
      {annotate && (
        <div
          className="fixed left-1/2 top-3 z-50 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-white/95 px-4 py-1.5 text-sm shadow-lg ring-1 ring-slate-200"
          onClick={e => e.stopPropagation()}
        >
          <span className="font-medium text-slate-600">🖊 批注</span>
          {PEN_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setPenColor(c)}
              className="h-5 w-5 rounded-full ring-offset-1 transition"
              style={{
                background: c,
                boxShadow: penColor === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : 'none',
              }}
              title={c}
            />
          ))}
          <button onClick={undoStroke} className="rounded px-2 py-0.5 text-slate-600 hover:bg-slate-100">撤销</button>
          <button onClick={clearPage} className="rounded px-2 py-0.5 text-slate-600 hover:bg-slate-100">清除本页</button>
          <button onClick={addNote} className="rounded px-2 py-0.5 text-slate-600 hover:bg-slate-100">
            备注{pageNoteCount > 0 ? `(${pageNoteCount})` : ''}
          </button>
          <button onClick={exportAnnotations} className="rounded bg-[#1971c2] px-2.5 py-0.5 text-white hover:brightness-110">导出批注</button>
          <button onClick={() => setAnnotate(false)} className="rounded px-2 py-0.5 text-slate-400 hover:bg-slate-100" title="退出批注（A / Esc）">退出</button>
        </div>
      )}

      {/* HTML dialog remains inspectable when the host suppresses window.prompt. */}
      <dialog ref={noteDialogRef}
        aria-labelledby="slide-note-title"
        onCancel={e => { e.preventDefault(); setNoteDraft(null) }}
        onClick={e => e.stopPropagation()}
        onContextMenu={e => e.stopPropagation()}
        style={{ width: 'min(560px,92vw)', borderRadius: 12, padding: 24, color: '#111', background: '#fff' }}>
        <form onSubmit={e => { e.preventDefault(); saveNote() }}>
          <h2 id="slide-note-title" style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>第 {pageKey} 页备注</h2>
          <label htmlFor="slide-note-text" style={{ display: 'block', marginBottom: 8 }}>备注文字（随批注导出）</label>
          <textarea id="slide-note-text" autoFocus value={noteDraft ?? ''}
            onChange={e => setNoteDraft(e.target.value)}
            style={{ width: '100%', minHeight: 120, border: '1px solid #94a3b8', borderRadius: 6, padding: 8, fontSize: 16, userSelect: 'text' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <button type="button" onClick={() => setNoteDraft(null)} style={{ padding: '8px 16px' }}>取消</button>
            <button type="submit" style={{ padding: '8px 16px', borderRadius: 6, background: '#1971c2', color: '#fff' }}>保存备注</button>
          </div>
        </form>
      </dialog>

      {/* 底部操作提示：浮动胶囊，静止时自动隐去 */}
      <div
        className="pointer-events-none fixed bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-4 py-0 text-[11px] leading-[14px] text-slate-500 shadow-md ring-1 ring-slate-200 transition-opacity duration-500"
        style={{ opacity: hintOn ? 1 : 0 }}
      >
        → / 空格 / 单击 下一步 · ← / 右键 上一步 · PgUp / PgDn 翻页 · F 全屏 · A 批注
        {!!page.interactions?.length && <span> · Q 互动题</span>}
        {pageStrokeCount > 0 && <span className="ml-2 text-[#e03131]">●{pageStrokeCount} 笔</span>}
        <span className="ml-3 text-slate-500">{pageIdx + 1} / {pages.length}</span>
      </div>
    </div>
  )
}
