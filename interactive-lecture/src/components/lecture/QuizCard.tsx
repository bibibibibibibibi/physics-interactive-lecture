import { useState } from 'react'
import { renderMath } from '@/lib/lecture'
import type { WebQuiz } from '@/lib/weblec'

interface Props {
  quiz: WebQuiz
  /** 作答完成后点「继续播放」：恢复播放并记为已答 */
  onContinue: () => void
  continueLabel?: string
}

/** 随堂互动答题卡弹层：选择题点选项后标对/错并显示解析；
    开放题先「查看参考答案」再显示解答；两种都答完才放行「继续播放」 */
export default function QuizCard({ quiz, onContinue, continueLabel = '继续播放 ▶' }: Props) {
  const isChoice = Array.isArray(quiz.options)
  const [picked, setPicked] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const done = isChoice ? picked !== null : revealed

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[min(560px,92vw)] max-h-[80vh] overflow-y-auto rounded-xl border border-[#ffb703]/60 bg-[#0b1f38] p-6 shadow-2xl">
        <div className="mb-1 text-xs font-semibold tracking-wider text-[#ffb703]">随堂互动 · {isChoice ? '选择题' : '思考题'}</div>
        <div className="mb-4 text-base leading-relaxed text-slate-100"
          dangerouslySetInnerHTML={{ __html: renderMath(quiz.q) }} />

        {isChoice ? (
          <div className="space-y-2">
            {quiz.options!.map((opt, i) => {
              let cls = 'border-[#4cc9f0]/50 text-slate-100 hover:bg-[#123a63]'
              if (picked !== null) {
                if (i === quiz.answer) cls = 'border-emerald-400 bg-emerald-400/15 text-emerald-300'
                else if (i === picked) cls = 'border-[#ef476f] bg-[#ef476f]/15 text-[#ef476f]'
                else cls = 'border-slate-700 text-slate-500'
              }
              return (
                <button key={i} disabled={picked !== null} onClick={() => setPicked(i)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition ${cls}`}>
                  <span className="shrink-0 font-bold">{'ABCD'[i]}</span>
                  <span dangerouslySetInnerHTML={{ __html: renderMath(opt) }} />
                  {picked !== null && i === quiz.answer && <span className="ml-auto shrink-0">✓</span>}
                  {picked !== null && i === picked && i !== quiz.answer && <span className="ml-auto shrink-0">✗</span>}
                </button>
              )
            })}
            {picked !== null && (
              <div className={`pt-1 text-sm font-semibold ${picked === quiz.answer ? 'text-emerald-400' : 'text-[#ef476f]'}`}>
                {picked === quiz.answer ? '回答正确！' : `答错了，正确答案是 ${'ABCD'[quiz.answer as number]}`}
              </div>
            )}
          </div>
        ) : (
          <div>
            {!revealed ? (
              <button onClick={() => setRevealed(true)}
                className="rounded-lg border border-[#4cc9f0]/50 px-4 py-2 text-sm text-[#4cc9f0] hover:bg-[#123a63] transition">
                查看参考答案
              </button>
            ) : (
              <div className="rounded-lg bg-[#123a63] px-4 py-3 text-sm leading-relaxed text-slate-100">
                <div className="mb-1 text-xs font-semibold text-[#ffb703]">参考答案</div>
                <span dangerouslySetInnerHTML={{ __html: renderMath(String(quiz.answer)) }} />
              </div>
            )}
          </div>
        )}

        {done && quiz.explain && (
          <div className="mt-3 rounded-lg bg-[#123a63]/60 px-4 py-3 text-sm leading-relaxed text-slate-300">
            <div className="mb-1 text-xs font-semibold text-[#4cc9f0]">解析</div>
            <span dangerouslySetInnerHTML={{ __html: renderMath(quiz.explain) }} />
          </div>
        )}

        <button onClick={onContinue} disabled={!done}
          className="mt-5 w-full rounded-lg bg-[#ffb703] py-2.5 text-base font-bold text-[#0b1f38] hover:brightness-110 disabled:opacity-40">
          {continueLabel}
        </button>
      </div>
    </div>
  )
}
