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

    // 1s → 2s → 4s
    const delayMs = 1000 * 2 ** attempt
    console.warn(`[${label}] ${response.status}，${delayMs}ms 後重試 (${attempt + 1}/${retries})`)
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  return lastResponse!
}
