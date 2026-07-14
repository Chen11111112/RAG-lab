'use client'

import { FormEvent, useState } from 'react'
import { getAIResponse } from '@/app/actions/ai-chat'

export default function ChatInterface() {
  const [prompt, setPrompt] = useState('')
  const [lastQuestion, setLastQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = prompt.trim()
    if (!q || loading) return

    setLoading(true)
    setIsError(false)
    setLastQuestion(q)
    setResponse('')

    const result = await getAIResponse(q)

    if (result.success) {
      setResponse(result.message)
      setIsError(false)
    } else {
      setResponse(result.error ?? '無法取得 AI 回應')
      setIsError(true)
    }
    setLoading(false)
  }

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
            Sprint 手冊助理
          </h1>
          <p
            className="mt-3 max-w-md text-[0.95rem] leading-relaxed"
            style={{ color: 'var(--chat-muted)' }}
          >
            依工作手冊內容回答問題，找不到依據時會明白告訴你。
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
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            placeholder="例如：Sprint 規劃要準備什麼？"
            className="w-full resize-y rounded-xl border px-4 py-3 text-[0.95rem] leading-relaxed outline-none transition focus:ring-2 disabled:opacity-60"
            style={{
              borderColor: 'var(--chat-border)',
              background: 'rgba(255,255,255,0.9)',
              color: 'var(--chat-ink)',
              fontFamily: 'var(--font-body), sans-serif',
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
              Enter 換行 · 點送出提問
            </span>
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-45"
              style={{
                background: loading
                  ? 'var(--chat-accent-hover)'
                  : 'var(--chat-accent)',
                fontFamily: 'var(--font-body), sans-serif',
              }}
              onMouseEnter={(e) => {
                if (!loading && prompt.trim()) {
                  e.currentTarget.style.background = 'var(--chat-accent-hover)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--chat-accent)'
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
          <section
            className="chat-rise flex flex-col gap-4"
            aria-live="polite"
          >
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
                  <span
                    className="chat-pulse-dot inline-block h-1.5 w-1.5 rounded-full"
                    style={{
                      background: 'var(--chat-accent)',
                      animationDelay: '0.2s',
                    }}
                  />
                  <span
                    className="chat-pulse-dot inline-block h-1.5 w-1.5 rounded-full"
                    style={{
                      background: 'var(--chat-accent)',
                      animationDelay: '0.4s',
                    }}
                  />
                  <span
                    className="ml-2 text-sm"
                    style={{ color: 'var(--chat-muted)' }}
                  >
                    正在對照工作手冊…
                  </span>
                </div>
              ) : (
                <p
                  className="whitespace-pre-wrap text-[0.98rem] leading-relaxed"
                  style={{ color: isError ? '#7a2e28' : 'var(--chat-ink)' }}
                >
                  {response}
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
