import OpenAI from 'openai'
import {
  EMBEDDING_DIM,
  getLiteLLMApiKey,
  LITELLM_BASE_URL,
  LITELLM_EMBED_MODEL,
} from '@/lib/litellm'

export { EMBEDDING_DIM }

type EmbeddingsOptions = {
  apiKey?: string
  baseURL?: string
  model?: string
  batchSize?: number
}

/**
 * 透過 OpenAI-compatible API 呼叫 LiteLLM Proxy 產生向量。
 */
export class LiteLLMEmbeddings {
  private client: OpenAI
  private model: string
  batchSize: number

  constructor(fields?: EmbeddingsOptions) {
    const apiKey = fields?.apiKey ?? getLiteLLMApiKey()
    this.model = fields?.model ?? LITELLM_EMBED_MODEL
    this.batchSize = fields?.batchSize ?? 16
    this.client = new OpenAI({
      apiKey,
      baseURL: fields?.baseURL ?? LITELLM_BASE_URL,
    })
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const results: number[][] = []
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize)
      const embeddings = await this.embedBatch(batch)
      results.push(...embeddings)
    }
    return results
  }

  async embedQuery(text: string): Promise<number[]> {
    const [embedding] = await this.embedBatch([text])
    return embedding
  }

  private async embedBatch(texts: string[]): Promise<number[][]> {
    const retries = 3
    let lastError: unknown

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.client.embeddings.create({
          model: this.model,
          input: texts,
          encoding_format: 'float',
        })

        return response.data
          .slice()
          .sort((a, b) => a.index - b.index)
          .map((item) => item.embedding)
      } catch (err) {
        lastError = err
        const status = err instanceof OpenAI.APIError ? err.status : undefined
        const retriable = status === 429 || status === 503
        if (!retriable || attempt === retries) {
          throw err
        }

        const delayMs = 1000 * 2 ** attempt
        console.warn(
          `[embeddings] ${status}，${delayMs}ms 後重試 (${attempt + 1}/${retries})`
        )
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    throw lastError
  }
}

let shared: LiteLLMEmbeddings | null = null

export function getEmbeddings(): LiteLLMEmbeddings {
  if (!shared) {
    shared = new LiteLLMEmbeddings()
  }
  return shared
}
