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
    <div className="mt-4 rounded-xl bg-[#0f2a4a] p-4 lg:mr-16">
      <div className="mb-2 text-sm font-semibold text-[#4cc9f0]">本页关键知识点 · 点击提问</div>
      <div className="space-y-1.5">
        {slide.bullets.filter(b => b.hotspot).map((b) => {
          const i = slide.bullets.indexOf(b)
          return (
            <button
              key={i}
              onClick={() => onOpenBullet(slide, b, i)}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-[#123a63] transition"
            >
              <span className="mr-2 text-[#ffb703]">●</span>
              <span dangerouslySetInnerHTML={{ __html: renderMath(b.text) }} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
