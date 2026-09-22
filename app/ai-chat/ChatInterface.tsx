'use client'

import { FormEvent, useRef, useState } from 'react'
import { getAIResponse } from '@/app/actions/ai-chat'
import { MarkdownMessage } from '@/app/ai-chat/MarkdownMessage'

const SAMPLE_QUESTIONS = [
  {
    label: 'Scrum 的三大核心角色是什麼？各自職責為何？',
    text: 'Scrum 的三大核心角色是什麼？Product Owner、Scrum Master 與開發團隊各自的職責為何？',
  },
  {
    label: 'Scrum 的四大儀式有哪些？',
    text: 'Scrum 的四大儀式（Ceremonies）有哪些？各自的目的與 Timebox 限制為何？',
  },
  {
    label: '什麼是完成定義（DoD）？',
    text: '什麼是完成定義（Definition of Done, DoD）？為什麼它對敏捷交付很重要？',
  },
  {
    label: '五大敏捷因素團隊雷達的五大維度',
    text: '五大敏捷因素團隊雷達的五大核心維度是什麼？請分別說明定義。',
  },
  {
    label: 'Scrum Master 與專案經理有何不同？',
    text: 'Scrum Master 和傳統專案經理有什麼不同？SM 的核心職責是什麼？',
  },
  {
    label: '衝刺回顧會議應如何進行？',
    text: '什麼是衝刺回顧會議（Sprint Retrospective）？應該如何進行才能促成持續改進？',
  },
] as const

export default function ChatInterface() {
  const [prompt, setPrompt] = useState('')
  const [sampleIndex, setSampleIndex] = useState(0)
  const [lastQuestion, setLastQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const inFlightRef = useRef(false)

  const runQuery = async (raw: string) => {
    const q = raw.trim()
    if (!q || inFlightRef.current) return
    if (/^\d+$/.test(q)) {
      setIsError(true)
      setResponse('請在下方輸入完整問題，或重新從「常見問題」選一題（勿只送出數字）。')
      return
    }

    inFlightRef.current = true
    setLoading(true)
    setIsError(false)
    setLastQuestion(q)
    setResponse('')

    try {
      const result = await getAIResponse(q)
      if (result.success) {
        setResponse(result.message)
        setIsError(false)
      } else {
        setResponse(result.error ?? '無法取得 AI 回應')
        setIsError(true)
      }
    } finally {
      inFlightRef.current = false
      setLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await runQuery(prompt)
  }

  const handleSamplePick = (index: number) => {
    setSampleIndex(index)
    if (index <= 0) {
      setPrompt('')
      return
    }
    const item = SAMPLE_QUESTIONS[index - 1]
    if (item) setPrompt(item.text)
  }

  const canSubmit = !loading && prompt.trim().length > 0

  return (
    <main className="relative min-h-[70vh] overflow-hidden px-4 py-10 sm:px-8">
      <div
        aria-hidden
        className="shell-grid pointer-events-none absolute inset-0 opacity-[0.28]"
      />

      <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-8">
        <header className="chat-rise text-center sm:text-left">
          <p
            className="mb-2 text-[0.7rem] font-semibold tracking-[0.22em] uppercase"
            style={{ color: 'var(--chat-accent)', fontFamily: 'var(--font-body), sans-serif' }}
          >
            HyC · RAG
          </p>
          <h1
            className="text-4xl leading-none tracking-tight sm:text-5xl"
            style={{
              color: 'var(--chat-ink)',
              fontFamily: 'var(--font-display), sans-serif',
              fontWeight: 800,
            }}
          >
            Scrum 助理
          </h1>
          <p
            className="mt-3 max-w-md text-[0.95rem] leading-relaxed"
            style={{ color: 'var(--chat-muted)' }}
          >
            依工作手冊內容回答問題。
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="chat-rise-delay flex flex-col gap-3"
          style={{
            background: 'var(--chat-surface)',
            border: '1px solid var(--chat-border)',
            backdropFilter: 'blur(12px)',
            borderRadius: '1.25rem',
            padding: '1.1rem',
            boxShadow: '0 18px 40px rgba(18, 32, 24, 0.06)',
          }}
        >
          <label
            htmlFor="sample-question"
            className="text-xs font-semibold tracking-wide uppercase"
            style={{ color: 'var(--chat-muted)' }}
          >
            常見問題
          </label>
          <select
            id="sample-question"
            value={sampleIndex}
            disabled={loading}
            onChange={(e) => handleSamplePick(Number(e.currentTarget.value))}
            className="w-full rounded-xl border px-4 py-2.5 text-[0.95rem] outline-none transition focus:ring-2 disabled:opacity-60"
            style={{
              borderColor: 'var(--chat-border)',
              background: 'rgba(255,255,255,0.9)',
              color: 'var(--chat-ink)',
              fontFamily: 'var(--font-body), sans-serif',
            }}
          >
            <option value={0}>選擇常見問題…</option>
            {SAMPLE_QUESTIONS.map((q, i) => (
              <option key={q.label} value={i + 1}>
                {q.label}
              </option>
            ))}
          </select>

          <label
            htmlFor="prompt"
            className="text-xs font-semibold tracking-wide uppercase"
            style={{ color: 'var(--chat-muted)' }}
          >
            你的問題
          </label>
          <textarea
            id="prompt"
            name="prompt"
            rows={3}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value)
              setSampleIndex(0)
            }}
            disabled={loading}
            placeholder="例如：Scrum 是什麼? 五大敏捷因素有哪五大?"
            className="w-full resize-y rounded-xl border px-4 py-3 text-[0.95rem] leading-relaxed outline-none transition focus:ring-2 disabled:opacity-60"
            style={{
              borderColor: 'var(--chat-border)',
              background: 'rgba(255,255,255,0.9)',
              color: 'var(--chat-ink)',
              fontFamily: 'var(--font-body), sans-serif',
              resize: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(11, 110, 79, 0.18)'
              e.currentTarget.style.borderColor = 'var(--chat-accent)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = 'var(--chat-border)'
            }}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs" style={{ color: 'var(--chat-muted)' }}>
              輸入問題後按送出即可
            </span>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-45"
              style={{
                background: loading
                  ? 'var(--chat-accent-hover)'
                  : 'var(--chat-accent)',
                fontFamily: 'var(--font-body), sans-serif',
              }}
            >
              {loading ? '檢索中…' : '送出'}
            </button>
          </div>
          {loading && (
            <div className="chat-loading-bar mt-1 h-0.5 w-full rounded-full" />
          )}
        </form>

        {(loading || response || lastQuestion) && (
          <section className="chat-rise flex flex-col gap-4" aria-live="polite">
            {lastQuestion && (
              <div>
                <p
                  className="mb-1.5 text-[0.65rem] font-semibold tracking-[0.18em] uppercase"
                  style={{ color: 'var(--chat-muted)' }}
                >
                  問題
                </p>
                <p
                  className="text-[1.05rem] font-medium leading-snug"
                  style={{
                    color: 'var(--chat-ink)',
                    fontFamily: 'var(--font-display), sans-serif',
                  }}
                >
                  {lastQuestion}
                </p>
              </div>
            )}

            <div
              className="rounded-2xl px-5 py-4"
              style={{
                background: isError
                  ? 'rgba(180, 60, 50, 0.08)'
                  : 'rgba(255,255,255,0.55)',
                border: `1px solid ${isError ? 'rgba(180, 60, 50, 0.25)' : 'var(--chat-border)'}`,
              }}
            >
              <p
                className="mb-2 text-[0.65rem] font-semibold tracking-[0.18em] uppercase"
                style={{ color: isError ? '#9b3a32' : 'var(--chat-accent)' }}
              >
                {isError ? '錯誤' : '助理回覆'}
              </p>

              {loading && !response ? (
                <div className="flex items-center gap-2 py-2">
                  <span
                    className="chat-pulse-dot inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: 'var(--chat-accent)' }}
                  />
                  <span className="ml-2 text-sm" style={{ color: 'var(--chat-muted)' }}>
                    正在對照工作手冊…
                  </span>
                </div>
              ) : (
                <MarkdownMessage
                  content={response}
                  variant={isError ? 'error' : 'default'}
                />
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
