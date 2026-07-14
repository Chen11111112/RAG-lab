'use server'

import { searchRag } from '@/app/actions/ragActions'
import { fetchWithRetry } from '@/lib/nvidia'

// NVIDIA NIM 支援模型清單（依序嘗試）
const CHAT_MODELS = [
  'deepseek-ai/deepseek-v4-flash',
  'meta/llama-3.1-8b-instruct',
  'google/gemma-2-9b-it',
]

/**
 * AI 聊天 Server Action（含 RAG）
 * 流程：問題 → 檢索 rag.md 相關段落 → 注入 prompt → 呼叫 LLM
 */
export async function getAIResponse(prompt: string) {
  const apiKey = process.env.NVIDIA_NIM_API_KEY
  if (!apiKey) {
    return { success: false as const, error: 'Missing NVIDIA_NIM_API_KEY' }
  }

  try {
    // 1. 從 Supabase documents（rag.md 索引）找出最相關段落
    const matches = await searchRag(prompt, 4)
    const context = matches
      .filter((m) => m.similarity > 0.2)
      .map((m, i) => `[來源 ${i + 1}]\n${m.content}`)
      .join('\n\n')

    // 2. 組裝 messages：有檢索結果才注入參考資料
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

    // 3. 呼叫 NIM；503 時重試，並可換備援模型
    let lastError = ''
    for (const model of CHAT_MODELS) {
      const response = await fetchWithRetry(
        'https://integrate.api.nvidia.com/v1/chat/completions',
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
            max_tokens: 1024,
          }),
        },
        { retries: 3, label: `chat:${model}` }
      )

      const raw = await response.text()

      if (response.status === 503 || response.status === 429) {
        lastError = `${model} 目前忙碌／限流 (${response.status})`
        continue
      }

      if (!response.ok) {
        return {
          success: false as const,
          error: `NIM API Error: ${response.status} ${raw.slice(0, 300)}`,
        }
      }

      const data = JSON.parse(raw) as {
        choices?: Array<{ message?: { content?: string | null } }>
      }
      const message = data.choices?.[0]?.message?.content?.trim()

      if (!message) {
        lastError = `${model} 回傳空內容`
        continue
      }

      return { success: true as const, message }
    }

    return {
      success: false as const,
      error: `NVIDIA NIM 暫時額滿或限流，請稍後再試。${lastError}`,
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return { success: false as const, error: detail }
  }
}
