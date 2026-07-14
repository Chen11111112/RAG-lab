'use server'

import { searchRag } from '@/app/actions/embeddingActions'

/**
 * AI 聊天 Server Action（含 RAG）
 * 流程：問題 → 檢索 rag.md 相關段落 → 注入 prompt → 呼叫 LLM
 * UI 不需改動，仍只呼叫此函式
 */
export async function getAIResponse(prompt: string) {
  const apiKey = process.env.NVIDIA_NIM_API_KEY
  if (!apiKey) {
    throw new Error('Missing NVIDIA_NIM_API_KEY')
  }

  try {
    // 1. 從 rag.md 索引找出最相關的段落
    const matches = await searchRag(prompt, 4)
    // 過濾低相似度結果，再組成「參考資料」區塊
    const context = matches
      .filter((m) => m.similarity > 0.2)
      .map((m, i) => `[來源 ${i + 1}]\n${m.content}`)
      .join('\n\n')

    // 2. 有上下文：要求模型只依手冊回答；無上下文：簡短說明找不到資料
    const messages = context
      ? [
          {
            role: 'system',
            content:
              '你是 Sprint 工作手冊助理。請只根據「參考資料」回答；若資料不足請明確說明。用繁體中文回答。',
          },
          {
            role: 'user',
            content: `參考資料：\n${context}\n\n使用者問題：${prompt}`,
          },
        ]
      : [
          {
            role: 'system',
            content:
              '你是 Sprint 工作手冊助理。目前沒有找到相關參考資料，請告知使用者並用繁體中文簡短回應。',
          },
          { role: 'user', content: prompt },
        ]

    // 3. 呼叫 NVIDIA NIM Chat Completions
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-ai/deepseek-v4-flash',
        messages,
        temperature: 0.3, // 偏低溫度：回答更貼近參考資料、較穩定
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      throw new Error(`NIM API Error: ${response.statusText}`)
    }

    const data = await response.json()
    return { success: true, message: data.choices[0].message.content }
  } catch {
    return { success: false, error: '無法取得 AI 回應' }
  }
}
