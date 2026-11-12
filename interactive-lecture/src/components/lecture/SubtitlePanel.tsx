import { useEffect, useRef } from 'react'
import type { Sub } from '@/lib/lecture'

interface Props {
  subs: Sub[]
  /** 当前正在讲的句子 start 时刻，null=没有 */
  curSubStart: number | null
  t: number
  height: number
  onOpenSubtitle: (s: Sub) => void
}

/** 字幕区：完整列表，可滚动查看前后，自动跟随当前句，点击句子提问 */
export default function SubtitlePanel({ subs, curSubStart, t, height, onOpenSubtitle }: Props) {
  const subListRef = useRef<HTMLDivElement>(null)

  /** 字幕列表自动跟随当前句滚动（只滚容器自身，不带动整页） */
  useEffect(() => {
    if (curSubStart == null || !subListRef.current) return
    const box = subListRef.current
    const el = box.querySelector<HTMLElement>(`[data-sub="${curSubStart}"]`)
    if (!el) return
    const target = el.getBoundingClientRect().top - box.getBoundingClientRect().top
      + box.scrollTop - box.clientHeight / 2 + el.clientHeight / 2
    box.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
  }, [curSubStart])

  return (
    <div ref={subListRef} style={{ height }} className="overflow-y-auto px-3 py-2 space-y-1 shrink-0">
      {subs.map((s) => {
        const isCur = curSubStart === s.start
        const isPast = t > s.end
        return (
          <button
            key={s.start}
            data-sub={s.start}
            onClick={e => { e.currentTarget.blur(); onOpenSubtitle(s) }}
            className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm leading-snug transition ${
              isCur
                ? 'bg-[#e5ebdc] text-[#385545] border-l-2 border-[#47675b] font-medium'
                : isPast
                  ? 'text-[#8a948c] hover:bg-[#ecefe4] hover:text-[#3d4f48]'
                  : 'text-[#3d4f48] hover:bg-[#ecefe4]'
            }`}
          >
            {s.text}
          </button>
        )
      })}
    </div>
  )
}
