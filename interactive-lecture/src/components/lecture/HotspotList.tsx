import { renderMath } from '@/lib/lecture'
import type { Bullet, Slide } from '@/lib/lecture'

interface Props {
  slide: Slide
  onOpenBullet: (slide: Slide, bullet: Bullet, idx: number) => void
}

/** 当前页关键知识点列表（仅列出标注 hotspot 的要点），点击即带着上下文提问 */
export default function HotspotList({ slide, onOpenBullet }: Props) {
  if (!slide.bullets.some(b => b.hotspot)) return null
  return (
    <div className="chrome-panel mt-4 p-4 lg:mr-16">
      <div className="mb-2 text-sm chrome-label">本页关键知识点 · 点击提问</div>
      <div className="space-y-1.5">
        {slide.bullets.filter(b => b.hotspot).map((b) => {
          const i = slide.bullets.indexOf(b)
          return (
            <button
              key={i}
              onClick={() => onOpenBullet(slide, b, i)}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#3d4f48] hover:bg-[#ecefe4] transition"
            >
              <span className="mr-2 text-[#b38e4f]">●</span>
              <span dangerouslySetInnerHTML={{ __html: renderMath(b.text) }} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
