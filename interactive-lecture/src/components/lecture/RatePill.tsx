import { useState } from 'react'
import type { RefObject } from 'react'
import { RATES } from '@/lib/lecture'

interface Props {
  rate: number
  onChange: (r: number) => void
  /** 视频舞台内层容器，拖动范围限制在它以内 */
  containerRef: RefObject<HTMLDivElement | null>
}

/** 倍速控制：浮动条，初始在视频上方正中，按住可拖到任意位置 */
export default function RatePill({ rate, onChange, containerRef }: Props) {
  const [ratePos, setRatePos] = useState<{ x: number; y: number } | null>(null)

  /** 拖动倍速浮条：初始在视频上方正中，可自由拖动（限制在视频画面范围内） */
  function startRateDrag(e: React.MouseEvent) {
    e.preventDefault()
    const stage = containerRef.current
    const pill = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (!stage) return
    const sr = stage.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    const base = ratePos ?? { x: pill.left - sr.left, y: pill.top - sr.top }
    let moved = false
    function onMove(ev: MouseEvent) {
      moved = true
      setRatePos({
        x: Math.min(sr.width - pill.width, Math.max(0, base.x + ev.clientX - startX)),
        y: Math.min(sr.height - pill.height, Math.max(0, base.y + ev.clientY - startY)),
      })
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      if (!moved) return
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div
      onMouseDown={startRateDrag}
      className="absolute z-20 flex cursor-move gap-1 rounded-lg bg-black/50 p-1 backdrop-blur-sm select-none"
      style={ratePos
        ? { left: ratePos.x, top: ratePos.y }
        : { left: '50%', top: 8, transform: 'translateX(-50%)' }}
      title="拖动可移动位置"
    >
      {RATES.map(r => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`rounded px-2 py-0.5 text-xs transition ${
            rate === r ? 'bg-[#ffb703] text-[#0b1f38] font-bold' : 'text-slate-300 hover:bg-white/15'
          }`}
        >
          {r}x
        </button>
      ))}
    </div>
  )
}
