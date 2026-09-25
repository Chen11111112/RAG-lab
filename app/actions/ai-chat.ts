'use server'

import { searchRag } from '@/app/actions/ragActions'
import {
  fetchWithRetry,
  getLiteLLMApiKey,
  LITELLM_BASE_URL,
  LITELLM_CHAT_MODEL,
} from '@/lib/litellm'

const CHAT_MODELS = [LITELLM_CHAT_MODEL]

/*
 * AI 聊天 Server Action（含 RAG）
 * 流程：問題 → 檢索 rag.md 相關段落 → 注入 prompt → 呼叫 LLM
 */
export async function getAIResponse(prompt: string) {
  let apiKey: string
  try {
    apiKey = getLiteLLMApiKey()
  } catch {
    return { success: false as const, error: 'Missing LITELLM_API_KEY' }
  }

  try {
    const matches = await searchRag(prompt, 4)

    const context = matches
      .map((m, i) => `[來源 ${i + 1}]\n${m.content}`)
      .join('\n\n')

    const messages = context
      ? [
          {
            role: 'system' as const,
            content:
              '你是 Sprint 工作手冊助理。請只根據「參考資料」回答；若資料不足請明確說明。用繁體中文回答。',
          },
          {
            role: 'user' as const,
            content: `參考資料：\n${context}\n\n使用者問題：${prompt}`,
          },
        ]
      : [
          {
            role: 'system' as const,
            content:
              '你是 Sprint 工作手冊助理。目前沒有找到相關參考資料，請告知使用者並用繁體中文簡短回應。',
          },
          { role: 'user' as const, content: prompt },
        ]

    let lastError = ''
    for (const model of CHAT_MODELS) {
      let response

      try {
        response = await fetchWithRetry(
          `${LITELLM_BASE_URL}/chat/completions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages,
              temperature: 0.3,
              max_tokens: 2048,
            }),
          },
          { retries: 3, label: `chat:${model}` }
        )
      } catch (err) {
        lastError = `${model} 請求發生例外: ${err instanceof Error ? err.message : String(err)}`
        continue
      }

      const raw = await response.text()

      if (response.status === 503 || response.status === 429) {
        lastError = `${model} 目前忙碌／限流 (${response.status})`
        continue
      }

      if (!response.ok) {
        return {
          success: false as const,
          error: `LiteLLM API Error: ${response.status} ${raw.slice(0, 300)}`,
        }
      }

      const data = JSON.parse(raw) as {
        choices?: Array<{
          message?: {
            content?: string | null
            reasoning_content?: string | null
          }
        }>
      }
      const choice = data.choices?.[0]?.message
      const message = (
        choice?.content?.trim() ||
        choice?.reasoning_content?.trim() ||
        ''
      )

      if (!message) {
        lastError = `${model} 回傳空內容`
        continue
      }

      return { success: true as const, message }
    }

    return {
      success: false as const,
      error: `LiteLLM 暫時額滿或限流，請稍後再試。${lastError}`,
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return { success: false as const, error: detail }
  }
}
