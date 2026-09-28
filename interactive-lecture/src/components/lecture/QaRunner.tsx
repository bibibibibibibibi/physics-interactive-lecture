import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { stripMath, VIDEO_W } from '@/lib/lecture'
import { measureContentRect } from '@/components/lecture/SlideStage'
import type { WebLec } from '@/lib/weblec'

export interface QaIssue {
  page: number
  kind: '出界' | '重叠' | '文字进图区' | '框过紧' | '框过松' | '文本框过宽(参考)' | '质检未命中'
  detail: string
}

interface Rect { x: number; y: number; w: number; h: number }

/** 版式质检：地址栏加 ?qa=1 触发。自动翻完所有页并停在最终步，
    测量每个元素的「真实内容框」，检查重叠/出界/文字进图区/框体松紧。
    全程本地浏览器内运行，零 token；报告可复制。 */
export default function QaRunner({ mediaRef, weblec }: {
  mediaRef: RefObject<HTMLAudioElement | null>
  weblec: WebLec | null
}) {
  const [issues, setIssues] = useState<QaIssue[] | null>(null)
  const [progress, setProgress] = useState('')

  useEffect(() => {
    const a = mediaRef.current
    if (!weblec || !a) return
    let cancelled = false
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

    function contentRect(outer: Element, dr: DOMRect, sc: number): Rect | null {
      const rc = measureContentRect(outer)
      if (!rc) return null
      return {
        x: (rc.left - dr.left) / sc, y: (rc.top - dr.top) / sc,
        w: rc.width / sc, h: rc.height / sc,
      }
    }

    function inspectPage(pageId: number): QaIssue[] {
      const design = document.querySelector('.aspect-video > div')
      const page = weblec!.slides.find(s => s.id === pageId)
      if (!design || !page) return []
      const dr = design.getBoundingClientRect()
      const sc = dr.width / VIDEO_W
      if (!sc) return []
      const items: { i: number; type: string; label: string; rect: Rect; crect: Rect | null; overlay: boolean }[] = []
      page.elements.forEach((el, i) => {
        const outer = design.querySelector(`[data-elidx="${i}"]`)?.firstElementChild
        if (!outer) return
        /** box 的重叠/出界用边框盒（背景/边框本身就是视觉边界，box-box 重叠必须能被抓到）；
            松紧度仍用内容盒（文字/公式的真实墨迹范围） */
        const crect = contentRect(outer, dr, sc)
        let rect: Rect | null
        if (el.type === 'box') {
          const br = outer.getBoundingClientRect()
          rect = { x: (br.left - dr.left) / sc, y: (br.top - dr.top) / sc, w: br.width / sc, h: br.height / sc }
        } else {
          rect = crect
        }
        if (!rect || rect.w < 4) return
        const raw = el.label || el.tex ||
          (el.paras ? el.paras.flat().map(r => r.t).join('') : '') || el.name || el.type
        items.push({ i, type: el.type, label: stripMath(raw).slice(0, 22), rect, crect, overlay: !!el.overlay })
      })
      const out: QaIssue[] = []
      const textish = (t: string) => t === 'text' || t === 'tex' || t === 'box'
      const picish = (t: string) => t === 'diagram' || t === 'img'
      /** 出界：内容超出 1920×1080 舞台（留 10 容差） */
      for (const it of items) {
        const r = it.rect
        if (r.x < -10 || r.x + r.w > VIDEO_W + 10 || r.y < -10 || r.y + r.h > 1090) {
          out.push({
            page: pageId, kind: '出界',
            detail: `「${it.label}」内容越出舞台 (${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.w)}×${Math.round(r.h)})`,
          })
        }
      }
      /** 两两相交：文-文=重叠，文-图=文字进图区 */
      for (let m = 0; m < items.length; m++) {
        for (let n = m + 1; n < items.length; n++) {
          const A = items[m], B = items[n]
          const ox = Math.min(A.rect.x + A.rect.w, B.rect.x + B.rect.w) - Math.max(A.rect.x, B.rect.x)
          const oy = Math.min(A.rect.y + A.rect.h, B.rect.y + B.rect.h) - Math.max(A.rect.y, B.rect.y)
          if (ox <= 30 || oy <= 20) continue
          const pair = `「${A.label}」×「${B.label}」相交 ${Math.round(ox)}×${Math.round(oy)}` +
            `（A ${Math.round(A.rect.x)},${Math.round(A.rect.y)} ${Math.round(A.rect.w)}×${Math.round(A.rect.h)}；` +
            `B ${Math.round(B.rect.x)},${Math.round(B.rect.y)} ${Math.round(B.rect.w)}×${Math.round(B.rect.h)}）`
          if ((textish(A.type) && picish(B.type)) || (picish(A.type) && textish(B.type))) {
            /** overlay 白名单：author 里显式标记的图上叠加标注，不报 */
            const txt = textish(A.type) ? A : B
            if (!txt.overlay) out.push({ page: pageId, kind: '文字进图区', detail: pair })
          } else if (textish(A.type) && textish(B.type))
            out.push({ page: pageId, kind: '重叠', detail: pair })
        }
      }
      /** 框体松紧：内容 vs 声明边框（纵横两个方向都查——横向过窄即公式顶边/溢出框外） */
      for (const it of items) {
        const el = page.elements[it.i]
        if (it.type === 'box' && it.crect) {
          const padV = ((el.h ?? 90) - it.crect.h) / 2
          const padH = (el.w - it.crect.w) / 2
          if (padV < 3)
            out.push({ page: pageId, kind: '框过紧', detail: `「${it.label}」上下余量 ${padV.toFixed(0)}（建议 ≥10）` })
          else if (padH < 8)
            out.push({ page: pageId, kind: '框过紧', detail: `「${it.label}」左右余量 ${padH.toFixed(0)}（建议 ≥10；负值=公式已溢出框外，加宽声明 w）` })
          else if (padV > 70 || padH > 160)
            out.push({ page: pageId, kind: '框过松', detail: `「${it.label}」余量 ${Math.round(padH)}×${Math.round(padV)}（建议 20~40×10~25）` })
        }
        if ((el.type === 'text' || el.type === 'tex') && (el.hotspot || el.important)) {
          const spare = el.w - it.rect.w
          if (spare > 250)
            out.push({ page: pageId, kind: '文本框过宽(参考)', detail: `「${it.label}」声明宽 ${el.w} 实际 ${Math.round(it.rect.w)}（显示已自适应，可收回 author 宽度）` })
        }
      }
      return out
    }

    async function run() {
      a!.pause()
      const all: QaIssue[] = []
      /** 页面指示器（SlideStage 右下角「id/总数 标题」按钮）是否已翻到目标页 */
      const pageShown = (pageId: number) => {
        const marker = `${pageId}/${weblec!.slides.length} `
        return Array.from(document.querySelectorAll('span,button')).some(s => s.textContent?.startsWith(marker))
      }
      for (const p of weblec!.slides) {
        setProgress(`正在检查第 ${p.id} / ${weblec!.slides.length} 页…`)
        const sts = Object.values(p.stepTimes)
        const last = sts.length ? Math.max(...sts) : p.t_start
        /** seek 后等 seeked 事件（音频未缓冲时 3s 兜底），再留 500ms 让 DOM 稳定 */
        await new Promise<void>(resolve => {
          const done = () => { clearTimeout(to); a!.removeEventListener('seeked', done); resolve() }
          const to = setTimeout(done, 3000)
          a!.addEventListener('seeked', done)
          a!.currentTime = Math.min(last + 0.4, p.t_end - 0.05)
        })
        await sleep(500)
        /** KaTeX/中文字体异步加载，未就绪就量会把公式量窄（框过松紧全失真） */
        await document.fonts.ready
        if (cancelled) return
        /** 页码指示器没翻过来：再等一次，仍不对就记警告（防止用错页面元数据测量） */
        if (!pageShown(p.id)) await sleep(800)
        if (cancelled) return
        if (!pageShown(p.id))
          all.push({ page: p.id, kind: '质检未命中', detail: `页面指示器未显示 ${p.id}/${weblec!.slides.length}，本页测量可能不可靠` })
        all.push(...inspectPage(p.id))
      }
      if (!cancelled) { setIssues(all); setProgress('') }
    }
    run()
    return () => { cancelled = true }
  }, [weblec, mediaRef])

  if (issues == null && !progress) return null
  const errs = (issues ?? []).filter(i => i.kind !== '文本框过宽(参考)')
  const infos = (issues ?? []).filter(i => i.kind === '文本框过宽(参考)')

  return (
    <div className="fixed bottom-4 left-4 z-50 max-h-[70vh] w-[520px] overflow-y-auto rounded-xl border border-[#ffb703]/60 bg-[#0b1f38]/95 p-4 shadow-2xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-[#ffb703]">
          版式质检 {issues == null ? '进行中' : `完成：${errs.length} 个问题 / ${infos.length} 条参考`}
        </span>
        {issues != null && (
          <button
            onClick={() => navigator.clipboard.writeText(JSON.stringify(issues, null, 1))}
            className="rounded bg-[#123a63] px-2 py-1 text-xs text-slate-300 hover:bg-[#1a4a7a]">
            复制报告
          </button>
        )}
      </div>
      {progress && <div className="text-xs text-slate-400 animate-pulse">{progress}</div>}
      {issues != null && issues.length === 0 && (
        <div className="text-sm text-emerald-400">全部页面通过，未发现版式问题。</div>
      )}
      {errs.map((it, i) => (
        <div key={i} className="mt-1 rounded bg-[#123a63]/70 px-2 py-1 text-xs text-slate-200">
          <span className="mr-2 rounded bg-[#ef476f]/80 px-1.5 py-0.5 text-[10px] font-bold">P{it.page} {it.kind}</span>
          {it.detail}
        </div>
      ))}
      {infos.map((it, i) => (
        <div key={`i${i}`} className="mt-1 rounded bg-[#123a63]/40 px-2 py-1 text-xs text-slate-400">
          <span className="mr-2 rounded bg-slate-600 px-1.5 py-0.5 text-[10px]">P{it.page} {it.kind}</span>
          {it.detail}
        </div>
      ))}
    </div>
  )
}
