import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import SubtitlePanel from './SubtitlePanel'
import TutorPanel from './TutorPanel'
import type { Msg, QA, Sub } from '@/lib/lecture'

interface Props {
  /** Increment for every external request, including an already selected hotspot. */
  revealVersion?: number
  subs: Sub[]
  curSubStart: number | null
  t: number
  onOpenSubtitle: (s: Sub) => void
  messages: Msg[]
  thinking: boolean
  input: string
  onInputChange: (v: string) => void
  onAsk: (q: string) => void
  suggestions: QA[]
  contextLabel: string | null
  onClearContext: () => void
}

/** 右侧栏：可滚动字幕列表 + 常驻聊天框，宽度与分区高度均可拖拽，可整体收起 */
export default function Sidebar({
  revealVersion = 0, subs, curSubStart, t, onOpenSubtitle,
  messages, thinking, input, onInputChange, onAsk, suggestions, contextLabel, onClearContext,
}: Props) {
  const [sideW, setSideW] = useState(380)
  const [subH, setSubH] = useState(240)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (revealVersion > 0) setCollapsed(false)
  }, [revealVersion])

  /** 拖拽调整侧栏宽度 / 字幕区高度 */
  function startDrag(e: React.MouseEvent, mode: 'width' | 'subH') {
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const startW = sideW
    const startH = subH
    function onMove(ev: MouseEvent) {
      if (mode === 'width') setSideW(Math.min(600, Math.max(280, startW - (ev.clientX - startX))))
      else setSubH(Math.min(420, Math.max(120, startH + ev.clientY - startY)))
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <aside
      className={`chrome-panel relative flex flex-col sticky top-6 overflow-hidden w-full lg:w-[var(--sidew)] transition-[width] duration-200 ${collapsed ? 'h-auto lg:h-[620px]' : 'h-[620px]'}`}
      style={{ '--sidew': collapsed ? '44px' : `${sideW}px` } as CSSProperties}
    >
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="flex-1 flex flex-col items-center gap-3 py-4 transition"
          style={{ color: 'var(--c-mute)' }}
          title="展开侧栏"
        >
          <span className="text-lg leading-none">«</span>
          <span className="text-xs tracking-widest [writing-mode:vertical-rl]">讲解字幕 · AI 助教</span>
        </button>
      ) : (
        <>
          {/* 左缘宽度拖拽手柄 */}
          <div
            onMouseDown={e => startDrag(e, 'width')}
            className="hidden lg:block absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize z-10 hover:bg-[#47675b]/25 active:bg-[#47675b]/40"
            title="拖动调整侧栏宽度"
          />
          <div className="px-4 py-2 flex items-baseline justify-between shrink-0" style={{ borderBottom: '1px solid var(--c-rule)' }}>
            <span className="text-sm chrome-label">讲解字幕</span>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--c-faint)' }}>点击句子提问</span>
              <button
                onClick={() => setCollapsed(true)}
                className="text-sm leading-none px-1"
                style={{ color: 'var(--c-faint)' }}
                title="收起侧栏"
              >
                »
              </button>
            </div>
          </div>
          <SubtitlePanel
            subs={subs}
            curSubStart={curSubStart}
            t={t}
            height={subH}
            onOpenSubtitle={onOpenSubtitle}
          />
          {/* 高度拖拽分隔条 */}
          <div
            onMouseDown={e => startDrag(e, 'subH')}
            className="h-1.5 shrink-0 cursor-ns-resize hover:bg-[#47675b]/30 active:bg-[#47675b]/50"
            style={{ background: 'var(--c-rule)' }}
            title="拖动调整字幕区高度"
          />
          <TutorPanel
            messages={messages}
            thinking={thinking}
            input={input}
            onInputChange={onInputChange}
            onAsk={onAsk}
            suggestions={suggestions}
            contextLabel={contextLabel}
            onClearContext={onClearContext}
          />
        </>
      )}
    </aside>
  )
}
