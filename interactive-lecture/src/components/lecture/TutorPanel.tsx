import { useEffect, useRef } from 'react'
import { renderMath } from '@/lib/lecture'
import type { Msg, QA } from '@/lib/lecture'

interface Props {
  messages: Msg[]
  thinking: boolean
  input: string
  onInputChange: (v: string) => void
  onAsk: (q: string) => void
  /** 当前上下文相关的候选问题（消息为空时展示） */
  suggestions: QA[]
  /** 已选中的上下文标签；null=默认围绕当前页提问 */
  contextLabel: string | null
  onClearContext: () => void
}

/** AI 助教常驻聊天区：上下文标签 + 候选问题 + 对话记录 + 输入框 */
export default function TutorPanel({ messages, thinking, input, onInputChange, onAsk, suggestions, contextLabel, onClearContext }: Props) {
  const chatEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const box = chatEndRef.current?.parentElement
    box?.scrollTo({ top: box.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  return (
    <>
      <div className="px-4 py-2 shrink-0 flex items-center gap-2 min-h-[40px]">
        <span className="text-sm font-semibold text-[#4cc9f0] shrink-0">AI 助教</span>
        {contextLabel != null ? (
          <span className="flex-1 flex items-center gap-1 min-w-0 rounded-full bg-[#123a63] px-2.5 py-1 text-xs text-[#ffb703]">
            <span className="shrink-0">⏸ 已暂停提问：</span>
            <span className="truncate">{contextLabel}</span>
            <button
              onClick={onClearContext}
              className="shrink-0 text-slate-400 hover:text-slate-200"
              title="清除上下文并继续播放"
            >
              ✕
            </button>
          </span>
        ) : (
          <span className="text-xs text-slate-500 truncate">默认围绕当前页提问</span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-slate-400">
            点击字幕句或金色知识点可带着上下文提问，也可以直接输入问题：
          </div>
        )}
        {suggestions.length > 0 && messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((qa, i) => (
              <button key={i} onClick={() => onAsk(qa.q)}
                className="rounded-full border border-[#4cc9f0]/50 px-3 py-1 text-xs text-[#4cc9f0] hover:bg-[#4cc9f0] hover:text-[#0b1f38] transition">
                {qa.q}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
            <div className={`inline-block max-w-[90%] rounded-xl px-3 py-2 text-sm leading-relaxed text-left ${
              m.role === 'user' ? 'bg-[#4cc9f0] text-[#0b1f38]' : 'bg-[#123a63] text-slate-100'
            }`}
              dangerouslySetInnerHTML={{ __html: renderMath(m.text) }} />
          </div>
        ))}
        {thinking && (
          <div className="text-sm text-slate-400 animate-pulse">AI 助教思考中…</div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="border-t border-slate-700 p-3 shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onAsk(input)}
            placeholder="输入你的问题…"
            className="flex-1 rounded-lg bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 outline-none border border-slate-300 focus:border-[#4cc9f0] focus:ring-2 focus:ring-[#4cc9f0]/40"
          />
          <button onClick={() => onAsk(input)} disabled={thinking}
            className="rounded-lg bg-[#ffb703] px-4 py-3 text-base font-semibold text-[#0b1f38] hover:brightness-110 disabled:opacity-50">
            提问
          </button>
        </div>
        <div className="mt-2 text-xs text-slate-500">AI 助教已接入 · 未连通时使用离线答疑库</div>
      </div>
    </>
  )
}
