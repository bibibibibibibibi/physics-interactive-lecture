import { bigrams, overlap, stripMath } from '@/lib/lecture'
import type { Lecture, QA, Slide } from '@/lib/lecture'

/** 提问上下文：要点或字幕句，都归一到当前页 */
export interface AskContext {
  slide: Slide
  label: string
  qa: QA[]
  qaAll: QA[]
  contextText: string
}

/** 离线答疑库：先匹配预设问答，再退到讲解原文，最后给出候选问题 */
export function offlineAnswer(question: string, ctx: AskContext, lecture: Lecture): string {
  const qBg = bigrams(question)
  let best: { score: number; a: string } = { score: 0, a: '' }
  for (const s of lecture.slides) {
    for (const b of s.bullets) {
      for (const qa of b.qa) {
        let score = overlap(qBg, bigrams(qa.q + ' ' + b.text))
        if (s.id === ctx.slide.id) score *= 1.3
        if (score > best.score) best = { score, a: qa.a }
      }
    }
  }
  if (best.score >= 2) return best.a
  let bestS: { score: number; text: string } = { score: 0, text: '' }
  for (const s of lecture.slides) {
    for (const sent of s.narration.split(/[。！？]/)) {
      if (!sent.trim()) continue
      const score = overlap(qBg, bigrams(sent))
      if (score > bestS.score) bestS = { score, text: sent.trim() }
    }
  }
  if (bestS.score >= 2) {
    return `讲解中与此最相关的一段是：「${bestS.text}」。如果还有疑问，可以换个问法试试。`
  }
  // 答不上来时，给出学生可能想问的候选问题
  const cands = lecture.slides
    .flatMap(s => s.bullets.flatMap(b => b.qa.map(qa => ({
      q: qa.q,
      score: overlap(qBg, bigrams(qa.q + ' ' + b.text)) + (s.id === ctx.slide.id ? 0.5 : 0),
    }))))
    .sort((x, y) => y.score - x.score)
    .slice(0, 3)
    .map(x => x.q)
  if (cands.length === 0) return '这个问题超出了本节课答疑库的范围。'
  return '这个问题我暂时没能直接解答。你是不是想问：\n' + cands.map(q => `· ${q}`).join('\n')
}

/** 在线 AI 答疑（/api/ask 代理由 vite.config.ts 提供），失败时退回离线答疑库 */
export async function aiAnswer(question: string, ctx: AskContext, lecture: Lecture): Promise<{ text: string; online: boolean }> {
  try {
    const resp = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        context: {
          lecture: lecture.title,
          slide: ctx.slide.heading,
          bullet: stripMath(ctx.contextText),
          narration: ctx.slide.narration,
          qa: ctx.qaAll.map(x => `Q:${x.q} A:${x.a}`).join('；'),
        },
      }),
      signal: AbortSignal.timeout(35000),
    })
    if (!resp.ok) throw new Error(String(resp.status))
    const data = await resp.json()
    if (!data.answer) throw new Error('empty')
    return { text: data.answer, online: true }
  } catch {
    return { text: offlineAnswer(question, ctx, lecture), online: false }
  }
}
