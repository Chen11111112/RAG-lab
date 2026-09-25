# searchRag

> Last updated Sep. 24, 2026

This section will help you understand **`searchRag`**: how a question becomes a vector, how `match_documents` ranks chunks, and what happens when the **RPC** (Remote Procedure Call) is missing.

After completing this section, you should be able to tell whether empty or off-topic matches come from ingest, query embedding, the similarity threshold, or the fallback path.

`searchRag` is located in `app/actions/ragActions.ts`. `getAIResponse` calls `searchRag(prompt, 4)`。



## Where it sits

```txt
getAIResponse(prompt)
  → searchRag(prompt, 4)
      → ingestRagMd()           見 [ingestRagMd](./04-ingestRagMd.md)
      → embedQuery(query)       ← 這章
      → searchInDatabase(...)   ← 這章
  → 段落塞進 prompt
```
`searchRag` 只回傳段落，不呼叫聊天模型。這章從 ingest 結束後，回到 `searchRag` 之後開始。
## 1. Always ingest first

```tsx
// app/actions/ragActions.ts / searchRag()
export async function searchRag(query: string, topK = 4): Promise<RagMatch[]> {
  await ingestRagMd()
  const queryEmbedding = await getEmbeddings().embedQuery(query)
  return searchInDatabase(queryEmbedding, topK)
}
```

開頭**一定**先 `await ingestRagMd()`，確保 `documents` 裡的 `rag.md` 索引是現況。

> **getEmbeddings**、**embedQuery**函式皆寫於 lib/embeddings.ts，將於下一章節說明。

## 2. Query embedding

```tsx
const queryEmbedding = await getEmbeddings().embedQuery(query)
```

`embedQuery`（`lib/embeddings.ts`）把**使用者問題**做成一條 4096 維向量，同樣走 LiteLLM `/embeddings`、`Qwen3-Embedding`。

| | ingest（第 4 章） | search（這章） |
| --- | --- | --- |
| 函式 | `embedDocuments(parts)` | `embedQuery(query)` |
| 輸入 | `rag.md` 的每個 chunk | 使用者輸入的問題文字 |
| 輸出 | `number[][]` | `number[]` |
| 何時打 API | 僅在索引過期或尚未建立 | **每一次使用者輸入問題按下送出後** |

若 `rag.md` 未被修改，會跳過 document embedding，但**不會**跳過 query embedding，因為問題每次都不同。


## 3. `searchInDatabase`

`searchInDatabase` 優先呼叫 PostgreSQL 函式`match_documents`（定義在 `db/LocalQuery.sql`）：

`match_documents`會去算「語意相似度」，並回傳「最相關的文件片段」。
```tsx
// app/actions/ragActions.ts / searchInDatabase()
const { rows } = await pool.query<{
  id: string
  content: string
  similarity: number
}>(
  `SELECT id, content, similarity
   FROM match_documents($1::vector, $2, $3)`,
  [toVectorLiteral(queryEmbedding), 0.2, topK]
)
```
:::info
### RPC, Remote Procedure Call
遠端程序呼叫, 
在傳統的架構中，透過 RESTful API 發送請求要寫 HTTP 請求還要處理一堆網址、Method（GET/POST）、Status Code 很麻煩，所以使用RPC，在客戶端呼叫，把資料送到遠端伺服器，伺服器把結果再包裝好傳回給客戶端。

在此應用中 `match_documents` 即為一種RPC。
:::
三個參數：

| 參數 | 值 | 意義 |
| --- | --- | --- |
| `$1` | 問題向量 | `toVectorLiteral` 轉成 `[0.1,0.2,...]` |
| `$2` | `0.2` | 相似度須 **大於** 此值 |
| `$3` | `topK` | 最多回傳幾段 |
:::info 
### Top-K
一種演算法，會計算出所有可能字詞的機率分佈。

如果設定 Top-K = $x$，意思是 AI 在決定下一個字時，只會從機率最高的前 $x$ 個字當中去隨機挑選，而把其他機率太低、可能亂扯的字全部排除。

如果 $K$ 值很小（1 ~ 5）：AI 的回答會非常保守、固定，每次問都一樣。
如果 $K$ 值適中（40 ~ 50）：AI 回答會稍為有隨機性、創造力
:::

```sql
-- db/LocalQuery.sql
select
  documents.id,
  documents.content,
  (1 - (documents.embedding <=> query_embedding))::float as similarity
from documents
where documents.source = 'rag.md' and 1 - (documents.embedding <=> query_embedding) > match_threshold
order by documents.embedding <=> query_embedding
limit match_count;
```

`<=>` 是 pgvector 的餘弦距離（愈小愈像）。相似度用 `1 - 距離`，所以愈接近 **1** 愈像。

> **`source` filter**
>
> `WHERE source = 'rag.md'` 強制指定資料來源只能是`rag.md` 避免有人用`embedAndStore` 寫入 `source = 'manual'` 的列，也可能被檢到。

成功時每一列對成：

```tsx
// lib/rag.ts
export type RagMatch = {
  id: number
  content: string
  similarity: number
}
```


## 4. Back to `getAIResponse`

```tsx
// app/actions/ai-chat.ts
const matches = await searchRag(prompt, 4)

const context = matches
  .map((m, i) => `[來源 ${i + 1}]\n${m.content}`)
  .join('\n\n')
```

| `matches` | 接下來 |
| --- | --- |
| 長度 > 0 | system 要求只根據「參考資料」回答；user 帶 context + 問題 |
| 空陣列 | system 改為告知沒有相關資料，仍用繁體中文短答 |

`similarity` **不會**進 prompt，也不會顯示在畫面上。前端最後只看到 LLM 文字。

空陣列常見原因：索引是空的（ingest 失敗）、問題與手冊太不相關（全低於 0.2）、或 embedding 維度／模型與寫入時不一致。



### What you should see

- 同一題連問兩次：第二題仍會打 **query** embedding，但不該再整批 `INSERT` `rag.md`
- 問手冊裡的內容：`matches.length` 應為 1–4，`similarity` > 0.2
- 問完全無關的問題：可能拿到空陣列，畫面會是「沒有相關參考資料」那條路徑
- 錯誤含 `PostgreSQL 搜尋失敗`：`match_documents` 與 `documents` 都有問題，先回到 [Quick Start](./01-quick-start.md) 套 schema
- 回答文不對題但請求成功：先查檢回了哪幾段，再查模型；不要先改切塊
