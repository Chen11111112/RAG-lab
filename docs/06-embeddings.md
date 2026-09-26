# embeddings.ts

> Last updated Sep. 24, 2026

This section will help you understand **`lib/embeddings.ts`**: how text becomes a 4096-dimension vector, and why ingest and search must share the same client.

After completing this section, you should be able to tell whether a failure is a missing API key, a LiteLLM `/embeddings` error, or a dimension mismatch with PostgreSQL.

第 4、5 章提到的 `getEmbeddings`、`embedDocuments`、`embedQuery` 都在這個檔。


## Where it sits

```txt
ingestRagMd()
  → getEmbeddings().embedDocuments(parts)   ← 這章（索引過期時）

searchRag()
  → getEmbeddings().embedQuery(query)       ← 這章（每一次問答）
```

兩邊必須用**同一個模型、同一套維度**，`match_documents` 的餘弦距離才有意義。


## 1. `getEmbeddings` — one shared client

```tsx
// lib/embeddings.ts
let shared: LiteLLMEmbeddings | null = null

export function getEmbeddings(): LiteLLMEmbeddings {
  if (!shared) {
    shared = new LiteLLMEmbeddings()
  }
  return shared
}
```

第一次被呼叫時才會 `new`LiteLLMEmbeddings() 。之後的呼叫， `ingestRagMd` 與 `searchRag` 會共用同一個 `LiteLLMEmbeddings`，不會每題重建 OpenAI client。

建構時讀 `lib/litellm.ts` 的設定：

```tsx
// lib/embeddings.ts / constructor
const apiKey = fields?.apiKey ?? getLiteLLMApiKey()
this.model = fields?.model ?? LITELLM_EMBED_MODEL
this.batchSize = fields?.batchSize ?? 16
this.client = new OpenAI({
  apiKey,
  baseURL: fields?.baseURL ?? LITELLM_BASE_URL,
})
```

| 來源 | 預設 |
| --- | --- |
| `LITELLM_API_KEY` | 無；缺了會丟 `Missing LITELLM_API_KEY` |
| `LITELLM_BASE_URL` | `https://chatapi.ntubimdbirc.tw/v1` |
| `LITELLM_EMBED_MODEL` | `Qwen3-Embedding` |
| `batchSize` | `16` |

`baseURL` 是指向 LiteLLM Proxy，不是直接指向 OpenAI 官方。

`LiteLLMEmbeddings` 提供 `embedDocuments` 與 `embedQuery`。RAG 流程只透過這兩個方法進 LiteLLM。


## 2. `embedDocuments` — index chunks

`chunkMarkdown` 把 rag.md 切段後
`embedDocuments` 會把這些段落透過 `embedBatch` 送給 Qwen3-Embedding，每 16 段打一次 API，回傳向量陣列。

```tsx
// app/actions/ragActions.ts / ingestRagMd()
const vectors = await embeddings.embedDocuments(parts)
```

```tsx
// lib/embeddings.ts
async embedDocuments(texts: string[]): Promise<number[][]> {
  const results: number[][] = []
  for (let i = 0; i < texts.length; i += this.batchSize) {
    const batch = texts.slice(i, i + this.batchSize)
    const embeddings = await this.embedBatch(batch)
    results.push(...embeddings)
  }
  return results
}
```

一次最多送 **16** 段，避免單次 request 太大。`vectors[i]` 對應 `parts[i]`，寫入 `documents.embedding`。

`rag.md` 的 hash 未變時，`ingestRagMd` 會 skip，這裡不會被呼叫。


## 3. `embedQuery` — embed the question

第 5 章每一題都會呼叫：

```tsx
// app/actions/ragActions.ts / searchRag()
const queryEmbedding = await getEmbeddings().embedQuery(query)
```

```tsx
// lib/embeddings.ts
async embedQuery(text: string): Promise<number[]> {
  const [embedding] = await this.embedBatch([text])
  return embedding
}
```

輸入是**這一題的文字**，輸出是一條 `number[]`（4096 維），再交給 `match_documents`。

| | `embedDocuments` | `embedQuery` |
| --- | --- | --- |
| 誰呼叫 | `ingestRagMd` | `searchRag` |
| 輸入 | chunk 陣列 | 單一問題 |
| 輸出 | `number[][]` | `number[]` |
| 何時打 API | 索引過期或尚未建立 | **每一次送出** |

底層都是 `embedBatch`。差別只是一批多段或一批一段。


## 4. `embedBatch` — the actual HTTP call

```tsx
// lib/embeddings.ts / embedBatch()
const response = await this.client.embeddings.create({
  model: this.model,
  input: texts,
  encoding_format: 'float',
})

return response.data
  .slice()
  .sort((a, b) => a.index - b.index)
  .map((item) => item.embedding)
```

對應 LiteLLM：

```http
POST /v1/embeddings
Authorization: Bearer <LITELLM_API_KEY>
```


回傳後依 `index` 排序，再取出 `embedding`，避免 API 打亂順序時 `vectors[i]` 對錯 `parts[i]`。

:::info
### Embedding
把一段文字編成固定長度的數字陣列（向量），語意接近的句子在空間裡距離較近。

本專案用 `Qwen3-Embedding`，每一條向量長度必須是 **4096**，與 `documents.embedding vector(4096)`、`match_documents(query_embedding vector(4096))` 一致。換模型或換維度，必須清空表並重跑 ingest，否則會 `vector dimension mismatch`。
:::


### What you should see

- 第一題（或剛改過 `rag.md`）：會打一批（或多批）`/embeddings`，再打一次問題的 `/embeddings`
- 同一份 `rag.md` 再問：只剩問題那一次 `/embeddings`
- 沒設 Key：錯誤出現在第一次 `getEmbeddings()` / `new LiteLLMEmbeddings()`，不是寫庫之後
