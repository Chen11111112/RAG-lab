/** LiteLLM Proxy（OpenAI-compatible）設定 */

export const LITELLM_BASE_URL =
  process.env.LITELLM_BASE_URL ?? 'https://chatapi.ntubimdbirc.tw/v1'

export const LITELLM_CHAT_MODEL =
  process.env.LITELLM_CHAT_MODEL ?? 'Gemma4-31B'

export const LITELLM_EMBED_MODEL =
  process.env.LITELLM_EMBED_MODEL ?? 'Qwen3-Embedding'

/** Qwen3-Embedding 輸出維度，需與 PostgreSQL vector(N) 一致 */
export const EMBEDDING_DIM = 4096

export function getLiteLLMApiKey(): string {
  const apiKey = process.env.LITELLM_API_KEY
  if (!apiKey) {
    throw new Error('Missing LITELLM_API_KEY')
  }
  return apiKey
}

/** 遇 429 / 503（限流）時指數退避重試 */
export async function fetchWithRetry(
  input: string,
  init: RequestInit,
  options?: { retries?: number; label?: string }
): Promise<Response> {
  const retries = options?.retries ?? 3
  const label = options?.label ?? 'API'
  let lastResponse: Response | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(input, init)
    lastResponse = response

    const retriable = response.status === 429 || response.status === 503
    if (!retriable || attempt === retries) {
      return response
    }

    const delayMs = 1000 * 2 ** attempt
    console.warn(
      `[${label}] ${response.status}，${delayMs}ms 後重試 (${attempt + 1}/${retries})`
    )
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  return lastResponse!
}
