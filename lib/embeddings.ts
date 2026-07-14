import { Embeddings, type EmbeddingsParams } from '@langchain/core/embeddings'
import { OpenAI } from 'openai'

const MODEL = 'nvidia/nv-embedqa-e5-v5'
const BASE_URL = 'https://integrate.api.nvidia.com/v1'

type InputType = 'passage' | 'query'

/**
 * LangChain Embeddings，透過 OpenAI-compatible API 呼叫 NVIDIA NIM。
 * embedDocuments → input_type=passage；embedQuery → input_type=query
 */
export class NvidiaEmbeddings extends Embeddings {
  private client: OpenAI
  private model: string
  batchSize: number

  constructor(
    fields?: EmbeddingsParams & {
      apiKey?: string
      model?: string
      batchSize?: number
    }
  ) {
    super(fields ?? {})
    const apiKey = fields?.apiKey ?? process.env.NVIDIA_NIM_API_KEY
    if (!apiKey) {
      throw new Error('Missing NVIDIA_NIM_API_KEY')
    }
    this.model = fields?.model ?? MODEL
    this.batchSize = fields?.batchSize ?? 16
    this.client = new OpenAI({ apiKey, baseURL: BASE_URL })
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const results: number[][] = []
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize)
      const embeddings = await this.embedBatch(batch, 'passage')
      results.push(...embeddings)
    }
    return results
  }

  async embedQuery(text: string): Promise<number[]> {
    const [embedding] = await this.embedBatch([text], 'query')
    return embedding
  }

  private async embedBatch(
    texts: string[],
    inputType: InputType
  ): Promise<number[][]> {
    return this.caller.call(async () => {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: texts,
        encoding_format: 'float',
        // NVIDIA NIM 擴充欄位
        ...({ input_type: inputType, truncate: 'END' } as Record<string, string>),
      })

      return response.data
        .slice()
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding)
    })
  }
}

let shared: NvidiaEmbeddings | null = null

export function getEmbeddings(): NvidiaEmbeddings {
  if (!shared) {
    shared = new NvidiaEmbeddings()
  }
  return shared
}
