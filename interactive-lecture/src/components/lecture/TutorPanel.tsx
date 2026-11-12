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
        <span className="text-sm chrome-label shrink-0">AI 助教</span>
        {contextLabel != null ? (
          <span className="flex-1 flex items-center gap-1 min-w-0 rounded-full bg-[#ecefe4] px-2.5 py-1 text-xs text-[#7a5d1e]">
            <span className="shrink-0">⏸ 已暂停提问：</span>
            <span className="truncate">{contextLabel}</span>
            <button
              onClick={onClearContext}
              className="shrink-0 text-[#8a948c] hover:text-[#3d4f48]"
              title="清除上下文并继续播放"
            >
              ✕
            </button>
          </span>
        ) : (
          <span className="text-xs truncate" style={{ color: 'var(--c-faint)' }}>默认围绕当前页提问</span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {messages.length === 0 && (
          <div className="text-sm" style={{ color: 'var(--c-mute)' }}>
            点击字幕句或金色知识点可带着上下文提问，也可以直接输入问题：
          </div>
        )}
        {suggestions.length > 0 && messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((qa, i) => (
              <button key={i} onClick={() => onAsk(qa.q)}
                className="rounded-full border border-[#47675b]/45 px-3 py-1 text-xs text-[#47675b] hover:bg-[#47675b] hover:text-[#faf8e9] transition">
                {qa.q}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
            <div className={`inline-block max-w-[90%] rounded-xl px-3 py-2 text-sm leading-relaxed text-left ${
              m.role === 'user' ? 'chrome-bubble-user' : 'chrome-bubble-ai'
            }`}
              dangerouslySetInnerHTML={{ __html: renderMath(m.text) }} />
          </div>
        ))}
        {thinking && (
          <div className="text-sm animate-pulse" style={{ color: 'var(--c-mute)' }}>AI 助教思考中…</div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--c-rule)' }}>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onAsk(input)}
            placeholder="输入你的问题…"
            className="chrome-input flex-1 px-4 py-3 text-base"
          />
          <button onClick={() => onAsk(input)} disabled={thinking}
            className="chrome-btn chrome-btn-gold px-4 py-3 text-base">
            提问
          </button>
        </div>
        <div className="mt-2 text-xs" style={{ color: 'var(--c-faint)' }}>支持知识点提问 · 优先使用本课预设问答</div>
      </div>
    </>
  )
}
