import { useId, useState } from 'react'
import { renderMath } from '@/lib/lecture'
import type { WebQuiz } from '@/lib/weblec'

interface Props {
  quiz: WebQuiz
  /** 作答完成后点「继续播放」：恢复播放并记为已答 */
  onContinue: () => void
  continueLabel?: string
  /** 仅课程显式启用时使用适合课堂投影的大字号；窄屏沿用原排版。 */
  largeDisplay?: boolean
}

/** 普通题在弹层作答；活动题依次经历预测、任务、操作、解释。
    操作阶段只留紧凑浮条，不遮挡 iframe，父组件始终锁住讲解音频。 */
export default function QuizCard({ quiz, onContinue, continueLabel = '继续播放 ▶', largeDisplay = false }: Props) {
  const isChoice = Array.isArray(quiz.options)
  const isActivity = quiz.type === 'activity'
  const titleId = useId()
  const [picked, setPicked] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [operating, setOperating] = useState(false)
  const predictionDone = isChoice ? picked !== null : revealed
  const [operationDone, setOperationDone] = useState(false)
  const done = isActivity ? operationDone : predictionDone
  const showFeedback = predictionDone && (!isActivity || operationDone)
  const selectedFeedback = picked !== null ? quiz.feedbackPerOption?.[picked] : undefined
  const projectionStyles = largeDisplay ? <style>{`
    @media (min-width:900px) {
      [data-classroom-quiz="large"] .classroom-quiz-panel { width:min(820px,92vw);max-height:88vh;padding:28px; }
      [data-classroom-quiz="large"] .text-sm,
      [data-classroom-quiz="large"] .text-base { font-size:22px;line-height:1.45; }
      [data-classroom-quiz="large"] .text-xs,
      [data-classroom-quiz="large"] [data-quiz-secondary] { font-size:18px;line-height:1.45; }
      [data-classroom-quiz="large"] h2 { font-size:24px;line-height:1.4; }
      [data-classroom-quiz="large"].classroom-quiz-toolbar { font-size:20px;line-height:1.4;gap:12px; }
    }
  `}</style> : null

  if (isActivity && predictionDone && !operationDone) {
    if (operating) {
      return (
        <div className="classroom-quiz-toolbar fixed bottom-3 left-3 z-50 flex max-w-[calc(100vw-24px)] flex-wrap items-center gap-2 rounded-lg border border-[#d8dcd0] bg-[#fdfdf9] p-3 text-sm text-[#273d3a] shadow-xl"
          data-classroom-quiz={largeDisplay ? 'large' : undefined}
          role="region" aria-label="课堂活动操作阶段">
          {projectionStyles}
          <span className="font-semibold text-[#47675b]">讲解已暂停 · 请完成操作</span>
          <button onClick={() => setOperating(false)}
            className="chrome-btn px-3 py-2">任务说明</button>
          <button onClick={() => setOperationDone(true)}
            className="chrome-btn chrome-btn-gold px-3 py-2">
            已完成操作，查看解释
          </button>
        </div>
      )
    }
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        data-classroom-quiz={largeDisplay ? 'large' : undefined}
        role="dialog" aria-modal="true" aria-labelledby={titleId}>
        {projectionStyles}
        <div className="classroom-quiz-panel w-[min(560px,92vw)] max-h-[80vh] overflow-y-auto rounded-xl border border-[#d8dcd0] bg-[#fdfdf9] p-6 shadow-2xl">
          <h2 id={titleId} className="mb-3 font-semibold text-[#b38e4f]">预测已记录 · 操作任务</h2>
          {picked !== null && <div className="mb-3 text-sm leading-relaxed text-[#3d4f48]">
            你的预测：<span dangerouslySetInnerHTML={{ __html: renderMath(quiz.options![picked]) }} />
          </div>}
          {quiz.task && <div className="mb-3 text-base leading-relaxed text-[#273d3a]"
            dangerouslySetInnerHTML={{ __html: renderMath(quiz.task) }} />}
          {quiz.observe && <div className="rounded-lg bg-[#f0f2e8] px-4 py-3 text-sm leading-relaxed text-[#3d4f48]">
            <div className="mb-1 font-semibold text-[#47675b]">需要观察的量</div>
            <span dangerouslySetInnerHTML={{ __html: renderMath(quiz.observe) }} />
          </div>}
          {quiz.plannedSeconds != null && <p className="mt-3 text-xs leading-relaxed text-[#8a948c]">
            操作时间约 {Math.round(quiz.plannedSeconds / 60 * 10) / 10} 分钟，完成预测、操作和结论整理后继续。
          </p>}
          <p data-quiz-secondary className="mt-3 text-sm text-[#3d4f48]">操作期间讲解保持暂停。完成后查看理论解释，再继续播放。</p>
          <button onClick={() => setOperating(true)}
            className="chrome-btn chrome-btn-gold mt-5 w-full py-2.5 text-base">
            开始操作（收起提示）
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      data-classroom-quiz={largeDisplay ? 'large' : undefined}
      role="dialog" aria-modal="true" aria-labelledby={titleId}>
      {projectionStyles}
      <div className="classroom-quiz-panel w-[min(560px,92vw)] max-h-[80vh] overflow-y-auto rounded-xl border border-[#d8dcd0] bg-[#fdfdf9] p-6 shadow-2xl">
        <div className="mb-1 text-xs font-semibold tracking-wider text-[#b38e4f]">
          随堂互动 · {isActivity ? operationDone ? '观察后的理论解释' : '操作前的预测' : isChoice ? '选择题' : '思考题'}
        </div>
        <div id={titleId} className="mb-4 text-base leading-relaxed text-[#273d3a]"
          dangerouslySetInnerHTML={{ __html: renderMath(quiz.q) }} />

        {isChoice ? (
          <div className="space-y-2">
            {quiz.options!.map((opt, i) => {
              let cls = 'border-[#d8dcd0] text-[#273d3a] hover:bg-[#ecefe4]'
              if (showFeedback) {
                if (i === quiz.answer) cls = 'border-emerald-500 bg-emerald-50 text-emerald-700'
                else if (i === picked) cls = 'border-[#ef476f] bg-[#ef476f]/10 text-[#c2274f]'
                else cls = 'border-[#e3e6da] text-[#8a948c]'
              }
              return (
                <button key={i} disabled={picked !== null} onClick={() => setPicked(i)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition ${cls}`}>
                  <span className="shrink-0 font-bold">{'ABCD'[i]}</span>
                  <span dangerouslySetInnerHTML={{ __html: renderMath(opt) }} />
                  {showFeedback && i === quiz.answer && <span className="ml-auto shrink-0">✓</span>}
                  {showFeedback && i === picked && i !== quiz.answer && <span className="ml-auto shrink-0">✗</span>}
                </button>
              )
            })}
            {showFeedback && (
              <div className={`pt-1 text-sm font-semibold ${picked === quiz.answer ? 'text-emerald-600' : 'text-[#c2274f]'}`}>
                {picked === quiz.answer ? '判断与参考结论一致。' : `参考结论是 ${'ABCD'[quiz.answer as number]}，请核对下面的理由。`}
              </div>
            )}
          </div>
        ) : (
          <div>
            {!revealed ? (
              <button onClick={() => setRevealed(true)}
                className="chrome-btn px-4 py-2 text-sm text-[#47675b]">
                {isActivity ? '已写下预测，查看操作任务' : '查看参考答案'}
              </button>
            ) : (
              <div className="rounded-lg bg-[#f0f2e8] px-4 py-3 text-sm leading-relaxed text-[#273d3a]">
                <div className="mb-1 text-xs font-semibold text-[#b38e4f]">参考答案</div>
                <span dangerouslySetInnerHTML={{ __html: renderMath(String(quiz.answer)) }} />
              </div>
            )}
          </div>
        )}

        {showFeedback && selectedFeedback && (
          <div className="mt-3 rounded-lg bg-[#f0f2e8] px-4 py-3 text-sm leading-relaxed text-[#3d4f48]">
            <div className="mb-1 text-xs font-semibold text-[#47675b]">你的选项对应的理由</div>
            <span dangerouslySetInnerHTML={{ __html: renderMath(selectedFeedback) }} />
          </div>
        )}

        {showFeedback && quiz.explain && (
          <div className="mt-3 rounded-lg bg-[#f0f2e8] px-4 py-3 text-sm leading-relaxed text-[#3d4f48]">
            <div className="mb-1 text-xs font-semibold text-[#47675b]">{isActivity ? '观察与理论的联系' : '解析'}</div>
            <span dangerouslySetInnerHTML={{ __html: renderMath(quiz.explain) }} />
          </div>
        )}

        <button onClick={onContinue} disabled={!done}
          className="chrome-btn chrome-btn-gold mt-5 w-full py-2.5 text-base">
          {continueLabel}
        </button>
      </div>
    </div>
  )
}
