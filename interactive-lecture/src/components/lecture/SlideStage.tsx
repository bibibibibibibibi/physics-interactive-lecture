import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import katex from 'katex'
import DIAGRAMS from './diagrams'
import RatePill from './RatePill'
import Teacher from './Teacher'
import { renderMath, stripMath, VIDEO_H, VIDEO_W } from '@/lib/lecture'
import { resolveTheme } from '@/lib/theme'
import type { Bullet, LaserTarget, Pose, Slide } from '@/lib/lecture'
import type { WebElement, WebLec, WebPage } from '@/lib/weblec'
import { COURSE_BASE } from '@/lib/course'

interface Props {
  mediaRef: RefObject<HTMLAudioElement | null>
  weblec: WebLec | null
  curPage: WebPage | null
  t: number
  onTimeUpdate: (t: number) => void
  laserTarget: LaserTarget | null
  /** 当前页生效中的红线（bullet 下标 + 截止时刻） */
  underlines: { i: number; until: number }[]
  onOpenBullet: (slide: Slide, bullet: Bullet, idx: number) => void
  rate: number
  onRateChange: (r: number) => void
  shownPose: Pose
  character: string
  characterName: string
  charactersSwitchable: boolean
  onSwitchCharacter: () => void
  /** 章节导航展开状态与切换（点页码指示器展开/收起） */
  navOpen?: boolean
  onToggleNav?: () => void
}

function fmt(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

/** 实测元素内容的墨迹边框盒（屏幕 px）。三部分并集：
    1) 逐文本节点的 Range（必须按文本节点走：「文字+行内公式」混排的 run span
       因为有子元素（.katex）不是叶子，只看叶子 span 会把裸文本节点丢掉导致虚窄；
       .katex-mathml 是屏幕阅读器用的隐藏 MathML 源文本，跳过）；
    2) 无文本但有面积的 span——KaTeX 用 CSS 画的分式线/根号线/上划线；
    3) 内嵌 SVG（如 \\vec 箭头）。
    不取 .katex-display 边框盒（带 1em 外边距，用于重叠判定会虚报相撞）。 */
export function measureContentRect(outer: Element) {
  let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity
  const add = (rc: DOMRect) => {
    l = Math.min(l, rc.left); t = Math.min(t, rc.top)
    r = Math.max(r, rc.right); b = Math.max(b, rc.bottom)
  }
  const walker = document.createTreeWalker(outer, NodeFilter.SHOW_TEXT)
  let node: Node | null
  while ((node = walker.nextNode())) {
    if (!node.textContent || !node.textContent.trim()) continue
    if ((node as Text).parentElement?.closest('.katex-mathml')) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    const rc = range.getBoundingClientRect()
    if (rc.width < 0.5 && rc.height < 0.5) continue
    add(rc)
  }
  outer.querySelectorAll('span').forEach(s => {
    if ((s.textContent ?? '').trim()) return
    if (s.classList.contains('strut') || s.classList.contains('pstrut')) return  // KaTeX 撑行杆不是墨迹
    const rc = s.getBoundingClientRect()
    if (rc.width >= 0.5 && rc.height >= 0.5) add(rc)
  })
  outer.querySelectorAll('svg').forEach(g => add(g.getBoundingClientRect()))
  if (r <= l) {
    const range = document.createRange()
    range.selectNodeContents(outer)
    add(range.getBoundingClientRect())
  }
  if (r <= l) return null
  return { left: l, top: t, right: r, bottom: b, width: r - l, height: b - t }
}

/** 单个元素渲染（SlidesOnly 静态导出也复用） */
export function Element({ el, t, iframeRef, onIframeLoad }: {
  el: WebElement; t: number
  /** html 元素用：iframe 引用回调与加载完成回调（步进消息补发兜底） */
  iframeRef?: (node: HTMLIFrameElement | null) => void
  onIframeLoad?: () => void
}) {
  const base: React.CSSProperties = {
    position: 'absolute', left: el.x, top: el.y, width: el.w,
    height: el.h, display: 'flex', flexDirection: 'column',
    justifyContent: el.valign === 'top' ? 'flex-start' : 'center',
    alignItems: el.align === 'center' ? 'center' : 'flex-start',
  }
  if (el.type === 'diagram') {
    const D = DIAGRAMS[el.name ?? '']
    return D ? <div style={base}><D t={t} /></div> : null
  }
  if (el.type === 'img') {
    return (
      <div style={base}>
        <img src={el.src?.startsWith('data:') ? el.src : `${COURSE_BASE}${el.src}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" />
      </div>
    )
  }
  if (el.type === 'video') {
    /** 嵌入短视频：静音自动循环，cover 充满；muted 无自动播放限制，随 step 挂载即播 */
    return (
      <div style={base}>
        <video src={`${COURSE_BASE}${el.src}`} autoPlay muted loop playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
      </div>
    )
  }
  if (el.type === 'html') {
    /** 嵌入交互模拟页（iframe 自带事件边界，内部拖拽/缩放不会触发播放器手势） */
    return (
      <div style={base}>
        <iframe ref={iframeRef} onLoad={onIframeLoad}
          src={`${COURSE_BASE}${el.src}`} loading="lazy" title={el.label ?? '交互模拟'}
          style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12, background: '#fff' }} />
      </div>
    )
  }
  if (el.type === 'table') {
    const cols = el.rows?.[0]?.length ?? 1
    return (
      <div style={{ ...base, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {el.rows?.flat().map((c, i) => (
          <div key={i} style={{
            background: el.fill, border: '2px solid #4472C4',
            height: el.rowh, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: el.size, fontFamily: 'SimSun, serif', margin: -1,
          }}>{c}</div>
        ))}
      </div>
    )
  }
  const inner = el.tex != null
    ? <span style={{ fontSize: el.size, color: el.color }}
        dangerouslySetInnerHTML={{ __html: katex.renderToString(el.tex, { throwOnError: false, displayMode: true }) }} />
    : (el.paras ?? []).map((p, pi) => (
        <div key={pi} style={{ textAlign: el.align === 'center' ? 'center' : 'left', width: '100%' }}>
          {p.map((r, ri) => (
            <span key={ri} style={{
              fontSize: r.size ?? 40, color: r.color ?? '#111',
              fontWeight: r.b ? 'bold' : 'normal',
              fontFamily: r.font ?? 'SimSun, "Times New Roman", serif', lineHeight: 1.4,
            }} dangerouslySetInnerHTML={{ __html: renderMath(r.t) }} />
          ))}
        </div>
      ))
  if (el.type === 'box') {
    return (
      <div style={{
        ...base, height: 'auto', minHeight: el.h, background: el.fill, border: `${el.lw ?? 3}px solid ${el.line}`,
        borderRadius: el.radius ?? 0, padding: el.pad ?? '8px 20px',
        alignItems: el.align === 'left' ? 'flex-start' : 'center',
      }}>{inner}</div>
    )
  }
  return <div style={base}>{inner}</div>
}

/** 网页版课件舞台：HTML 幻灯片 + 音频时钟 + 步进揭示 + 激光/红线/热点 + 授课键盘控制 */
export default function SlideStage({
  mediaRef, weblec, curPage, t, onTimeUpdate, laserTarget, underlines, onOpenBullet,
  rate, onRateChange, shownPose, character, characterName, charactersSwitchable, onSwitchCharacter,
  navOpen, onToggleNav,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [fs, setFs] = useState(false)
  const [blackout, setBlackout] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [scale, setScale] = useState(0.5)

  /** 全屏圆钮：鼠标在舞台上活动时显示，空闲 3s 自动收起（不挡页码/画面） */
  const [fsBtnOn, setFsBtnOn] = useState(true)
  const fsBtnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pokeFsBtn = useCallback(() => {
    setFsBtnOn(true)
    if (fsBtnTimer.current) clearTimeout(fsBtnTimer.current)
    fsBtnTimer.current = setTimeout(() => setFsBtnOn(false), 3000)
  }, [])
  useEffect(() => {
    pokeFsBtn()
    return () => { if (fsBtnTimer.current) clearTimeout(fsBtnTimer.current) }
  }, [pokeFsBtn])

  /** 整体容器全屏（小人/激光点/倍速条在全屏时仍然可见） */
  function toggleFs() {
    if (document.fullscreenElement) document.exitFullscreen()
    else stageRef.current?.requestFullscreen()
  }
  useEffect(() => {
    const onFs = () => setFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  /** 幻灯片缩放：1920×1080 设计坐标 → 容器宽度 */
  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setScale(el.clientWidth / VIDEO_W))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /** 当前步序：最后一个揭示时刻 ≤ t 的步 */
  const curStep = useMemo(() => {
    if (!curPage) return 0
    let s = 0
    for (const [k, v] of Object.entries(curPage.stepTimes)) {
      if (t >= v - 0.05 && +k > s) s = +k
    }
    return s
  }, [curPage, t])

  /** html 元素的步进消息：步 reveal 时向 iframe postMessage({type})。
      已发集合按「页:元素:步」记账，换页清空；seek 回退到该步之前则销账，
      重放到该步会再发一次（模拟侧自行处理重复演示）。 */
  const htmlRefs = useRef(new Map<number, HTMLIFrameElement>())
  const firedMsgs = useRef(new Set<string>())
  useEffect(() => { firedMsgs.current.clear() }, [curPage?.id])
  useEffect(() => {
    if (!curPage) return
    curPage.elements.forEach((el, i) => {
      if (el.type !== 'html' || !el.msgs) return
      for (const [k, msg] of Object.entries(el.msgs)) {
        const key = `${curPage.id}:${i}:${k}`
        if (curStep >= +k) {
          if (firedMsgs.current.has(key)) continue
          firedMsgs.current.add(key)
          htmlRefs.current.get(i)?.contentWindow?.postMessage({ type: msg }, '*')
        } else {
          firedMsgs.current.delete(key)
        }
      }
    })
  }, [curPage, curStep])
  /** iframe 加载完成兜底：补发当前已 reveal 步的消息（懒加载晚于步进的场景） */
  function flushHtmlMsgs(elIdx: number, el: WebElement) {
    if (el.type !== 'html' || !el.msgs) return
    const win = htmlRefs.current.get(elIdx)?.contentWindow
    if (!win) return
    for (const [k, msg] of Object.entries(el.msgs)) {
      if (curStep >= +k) win.postMessage({ type: msg }, '*')
    }
  }

  /** 文本/公式实测内容宽度（设计坐标）：热区/红线/激光按真实内容画，
      忽略 author 里拍的宽盒子；box/图/表保持声明尺寸（边框本身就是视觉边界） */
  const [fit, setFit] = useState<Record<number, { x: number; w: number }>>({})
  useEffect(() => {
    const host = innerRef.current
    if (!host || !curPage) { setFit({}); return }
    const design = host.querySelector('.aspect-video > div')
    if (!design) return
    const dr = design.getBoundingClientRect()
    const sc = dr.width / VIDEO_W
    if (!sc) return
    const next: Record<number, { x: number; w: number }> = {}
    curPage.elements.forEach((el, i) => {
      if (el.step > curStep) return
      if (el.type !== 'text' && el.type !== 'tex') return
      const outer = design.querySelector(`[data-elidx="${i}"]`)?.firstElementChild
      if (!outer) return
      const rc = measureContentRect(outer)
      if (!rc || rc.width < 4) return
      next[i] = { x: Math.round((rc.left - dr.left) / sc), w: Math.round(rc.width / sc) }
    })
    setFit(next)
  }, [curPage, curStep, scale])

  /** 元素的显示几何：文本/公式用实测宽度，其余用声明宽度 */
  function geoOf(elIdx: number, el: { x: number; w: number }) {
    const f = fit[elIdx]
    return f ? { x: f.x, w: f.w } : { x: el.x, w: el.w }
  }

  const pages = weblec?.slides ?? []
  const pageIdx = curPage ? pages.findIndex(p => p.id === curPage.id) : -1
  /** 页面版式主题：缺省/未知回落 default（第九章逐像素不变） */
  const th = resolveTheme(weblec?.theme)

  /** 分段导航：slides 带 sections 时，页码按钮改为显示当前所在大段（如「02 · 角动量守恒定律」），
      否则保持「页/总数 短名」逐页行为 */
  const sections = weblec?.sections?.length ? weblec.sections : null
  const curSectionIdx = sections && curPage
    ? sections.reduce((acc, s, i) => (s.page <= curPage.id ? i : acc), -1)
    : -1
  const curSection = sections && curSectionIdx >= 0 ? sections[curSectionIdx] : null
  function seekTo(time: number, autoplay = false) {
    const a = mediaRef.current
    if (!a) return
    a.currentTime = time
    if (autoplay) a.play()
  }
  function goPage(d: number) {
    const p = pages[pageIdx + d]
    if (p) seekTo(p.t_start + 0.01, playing)
  }
  /** 暂停时 ←/→ 按步进翻（翻页笔逻辑），播放时按页跳 */
  function stepNav(d: number) {
    if (!curPage) return
    if (playing) { goPage(d); return }
    const sts = Object.values(curPage.stepTimes).sort((a, b) => a - b)
    if (d > 0) {
      const nx = sts.find(s => s > t + 0.1)
      if (nx != null) seekTo(nx + 0.01)
      else goPage(1)
    } else {
      const pv = [...sts].reverse().find(s => s < t - 1.2)
      if (pv != null) seekTo(pv + 0.01)
      else if (t - curPage.t_start > 1.5) seekTo(curPage.t_start + 0.01)
      else goPage(-1)
    }
  }
  function togglePlay() {
    const a = mediaRef.current
    if (!a) return
    if (a.paused) a.play(); else a.pause()
  }

  /** 授课模式键盘控制：空格播放/暂停，←→翻页/步进，B 黑屏，F 全屏 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); togglePlay() }
      else if (e.key === 'ArrowRight') stepNav(1)
      else if (e.key === 'ArrowLeft') stepNav(-1)
      else if (e.key === 'b' || e.key === 'B') setBlackout(b => !b)
      else if (e.key === 'f' || e.key === 'F') toggleFs()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div ref={stageRef} className={fs ? 'flex h-screen w-screen flex-col items-center justify-center bg-black' : ''}>
      <style>{`
        @keyframes wl-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .wl-in{animation:wl-in .5s ease-out}
        @keyframes ul-in{from{transform:scaleX(0);opacity:0}to{transform:scaleX(1);opacity:1}}
        .anim-ul{animation:ul-in .4s ease-out;transform-origin:left center}
        @keyframes laser-orbit{to{transform:rotate(360deg)}}
        .laser-orbit{animation:laser-orbit 1.6s linear infinite;transform-origin:0 0}
      `}</style>
      <div ref={innerRef} className="group relative"
        onMouseMove={pokeFsBtn} onMouseEnter={pokeFsBtn} onTouchStart={pokeFsBtn}
        style={fs ? { width: 'min(100vw, calc((100vh - 64px) * 16 / 9))' } : undefined}>
        <div className={`relative w-full aspect-video overflow-hidden ${fs ? '' : 'rounded-xl shadow-2xl'}`}
          style={{ background: th.background }}>
          <audio ref={mediaRef} src={`${COURSE_BASE}audio.mp3${weblec?.build_ts ? `?v=${weblec.build_ts}` : ''}`} preload="auto"
            onTimeUpdate={e => onTimeUpdate((e.target as HTMLAudioElement).currentTime)}
            onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
          {/* 1920×1080 设计坐标舞台 */}
          <div style={{
            position: 'absolute', width: VIDEO_W, height: VIDEO_H,
            transform: `scale(${scale})`, transformOrigin: 'top left',
            color: '#111',
          }}>
            {/* 页面版式：课程 logo / 顶部导航 / 页脚（按课程 theme 渲染） */}
            <img src={`${COURSE_BASE}logo.png${weblec?.build_ts ? `?v=${weblec.build_ts}` : ''}`} alt="" style={{
              ...th.logoStyle,
              height: 116 * (weblec?.logoScale ?? 1), width: 270 * (weblec?.logoScale ?? 1),
              objectFit: 'contain',
            }} />
            {th.navStyle && (
              <div style={th.navStyle}>
                <span style={th.navText}>{weblec?.nav}</span>
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
              <span style={th.footerPill ?? undefined}>{weblec?.footer}</span>
            </div>
            {!(th.pageNumSkipFirst && curPage?.id === 1) && (
              <div style={{
                position: 'absolute', right: 40, bottom: 22,
                zIndex: 20, pointerEvents: 'none',
                ...th.pageNumText, ...(th.pageNumPill ?? {}),
              }}>{curPage?.id}</div>
            )}

            {/* 页面元素：按步揭示 */}
            {curPage?.elements.map((el, i) => (
              el.step <= curStep
                ? <div key={`${curPage.id}-${i}`} data-elidx={i} className="wl-in">
                    <Element el={el} t={t}
                      iframeRef={el.type === 'html' ? (n => { n ? htmlRefs.current.set(i, n) : htmlRefs.current.delete(i) }) : undefined}
                      onIframeLoad={el.type === 'html' && el.msgs ? () => flushHtmlMsgs(i, el) : undefined} />
                  </div>
                : null
            ))}

            {/* 热点：要点元素上的隐形热区，暂停时悬停显描边（播放中不打扰） */}
            {curPage?.bullets.map((b, bi) => {
              if (!b.hotspot) return null
              const el = curPage.elements[b.elIdx]
              if (!el || el.step > curStep) return null
              const g = geoOf(b.elIdx, el)
              return (
                <button key={bi}
                  onClick={e => { e.currentTarget.blur(); onOpenBullet(curPage, b, bi) }}
                  className="absolute group"
                  style={{
                    left: g.x, top: el.y, width: g.w, height: el.h ?? 90,
                  }}
                  title={stripMath(b.text)}>
                  {!playing && (
                    <span className="absolute inset-0 rounded ring-2 ring-transparent transition group-hover:ring-[#4cc9f0]/70 group-hover:bg-[#4cc9f0]/10" />
                  )}
                </button>
              )
            })}

            {/* 激光笔小光点：横向对准内容真实中心；同点指 >4s 时与小人「画圈强调」
                姿态联动（同一 elapsed 信号），光点真的绕目标点画小圈 */}
            {laserTarget && (() => {
              const b = curPage?.bullets[laserTarget.idx]
              const el = b ? curPage?.elements[b.elIdx] : null
              const g = el ? geoOf(b!.elIdx, el) : null
              const lx = g ? g.x + g.w / 2 : laserTarget.x
              const circling = (laserTarget.elapsed ?? 0) > 4
              return (
                <div className="absolute pointer-events-none transition-all duration-700 ease-in-out"
                  style={{ left: lx, top: laserTarget.y, transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                  {circling ? (
                    <div className="laser-orbit relative h-0 w-0">
                      <span className="absolute block h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_3px_rgba(239,68,68,0.7)]"
                        style={{ left: 30, top: -4 }} />
                    </div>
                  ) : (
                    <div className="relative h-2 w-2">
                      <span className="absolute inset-0 rounded-full bg-red-500 shadow-[0_0_10px_3px_rgba(239,68,68,0.7)]" />
                    </div>
                  )}
                </div>
              )
            })()}

            {/* 重要知识点下划红线：落在内容下沿、与内容同宽，10 秒，每页最多 3 条 */}
            {curPage && underlines.filter(u => u.until > t).map(u => {
              const b = curPage.bullets[u.i]
              const el = b ? curPage.elements[b.elIdx] : null
              if (!el) return null
              const g = geoOf(b.elIdx, el)
              const eh = el.h ?? 90
              return (
                <div key={`${u.i}-${u.until}`}
                  className="anim-ul absolute pointer-events-none"
                  style={{
                    left: g.x, top: el.y + eh + 8, width: g.w, height: 5, zIndex: 10,
                    background: '#ef476f', borderRadius: 3,
                    boxShadow: '0 0 8px 2px rgba(239,71,111,0.6)',
                  }} />
              )
            })}
          </div>

          {/* 黑屏（授课模式 B 键） */}
          {blackout && (
            <div className="absolute inset-0 z-40 bg-black cursor-pointer"
              title="按 B 或点击恢复" onClick={() => setBlackout(false)} />
          )}
        </div>

        <RatePill rate={rate} onChange={onRateChange} containerRef={innerRef} />
        {/* 全屏按钮：鼠标活动时显示，空闲 3s 自动收起 */}
        <button onClick={toggleFs}
          className={`absolute z-20 rounded-full bg-black/45 px-1.5 py-0.5 text-base leading-none text-slate-100 backdrop-blur-sm transition-opacity duration-300 hover:bg-black/70 ${
            fs ? 'bottom-24 right-1' : 'bottom-0.5 -right-1'
          } ${fsBtnOn ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          title={fs ? '退出全屏（F）' : '全屏（F），含讲师与标注'}>
          {fs ? '⤡' : '⛶'}
        </button>
        <Teacher
          character={character} characterName={characterName}
          switchable={charactersSwitchable} onSwitch={onSwitchCharacter}
          shownPose={shownPose} laserTarget={laserTarget} stageRef={innerRef} fs={fs}
        />
      </div>

      {/* 播放控制条 */}
      <div className={`mt-3 flex items-center gap-3 ${fs ? 'w-full px-6' : ''}`}
        style={fs ? { maxWidth: 'min(100vw, calc((100vh - 64px) * 16 / 9))' } : undefined}>
        <button onClick={() => goPage(-1)} className="rounded bg-[#123a63] px-2.5 py-1.5 text-sm text-slate-200 hover:bg-[#1a4a7a]" title="上一页（←）">⏮</button>
        <button onClick={togglePlay}
          className="rounded bg-[#ffb703] px-3.5 py-1.5 text-sm font-bold text-[#0b1f38] hover:brightness-110"
          title="播放/暂停（空格）">
          {playing ? '⏸' : '▶'}
        </button>
        <button onClick={() => goPage(1)} className="rounded bg-[#123a63] px-2.5 py-1.5 text-sm text-slate-200 hover:bg-[#1a4a7a]" title="下一页（→）">⏭</button>
        <div className="relative h-2.5 flex-1 cursor-pointer rounded-full bg-[#123a63]"
          onClick={e => {
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
            const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
            if (weblec) seekTo(ratio * weblec.duration, playing)
          }}>
          <div className="absolute left-0 top-0 h-full rounded-full bg-[#ffb703]"
            style={{ width: `${weblec ? (t / weblec.duration) * 100 : 0}%` }} />
          {/* 分段刻度：大段起点（= 该段第一页 t_start）处画竖刻线 */}
          {weblec?.sections?.map(s => {
            const pg = pages.find(p => p.id === s.page)
            if (!pg || !weblec.duration) return null
            return (
              <div key={s.page} className="absolute top-[-2px] h-[14px] w-[2px] rounded bg-white/70"
                style={{ left: `${(pg.t_start / weblec.duration) * 100}%` }}
                title={`${s.title}`} />
            )
          })}
        </div>
        <span className="shrink-0 text-xs text-slate-400 tabular-nums">
          {fmt(t)} / {fmt(weblec?.duration ?? 0)}
        </span>
        {curPage && (
          <button onClick={onToggleNav}
            className={`shrink-0 rounded px-2 py-1 text-xs transition ${
              navOpen ? 'bg-[#ffb703] text-[#0b1f38] font-semibold' : 'bg-[#123a63] text-slate-300 hover:bg-[#1a4a7a]'
            }`}
            title={navOpen ? '收起章节导航' : '展开章节导航'}>
            {curSection
              ? `${String(curSectionIdx + 1).padStart(2, '0')} · ${curSection.title}`
              : `${curPage.id}/${pages.length} ${curPage.heading}`}
          </button>
        )}
      </div>
    </div>
  )
}
