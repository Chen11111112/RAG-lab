import { Embeddings, type EmbeddingsParams } from '@langchain/core/embeddings'
import { OpenAI } from 'openai'
import {
  EMBEDDING_DIM,
  getLiteLLMApiKey,
  LITELLM_BASE_URL,
  LITELLM_EMBED_MODEL,
} from '@/lib/litellm'

export { EMBEDDING_DIM }

/**
 * LangChain Embeddings，透過 OpenAI-compatible API 呼叫 LiteLLM Proxy。
 */
export class LiteLLMEmbeddings extends Embeddings {
  private client: OpenAI
  private model: string
  batchSize: number

  constructor(
    fields?: EmbeddingsParams & {
      apiKey?: string
      baseURL?: string
      model?: string
      batchSize?: number
    }
  ) {
    super(fields ?? {})
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
    return this.caller.call(async () => {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: texts,
        encoding_format: 'float',
      })

      return response.data
        .slice()
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding)
    })
  }
}

let shared: LiteLLMEmbeddings | null = null

export function getEmbeddings(): LiteLLMEmbeddings {
  if (!shared) {
    shared = new LiteLLMEmbeddings()
  }
  return shared
}
