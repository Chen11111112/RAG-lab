# Overview

> Last updated Sep. 23, 2026

This section will help you trace **a single question** through the entire stack. By the end, you'll be able to mental-map the full request path and pinpoint exactly when PostgreSQL is queried versus when LiteLLM is invoked.

The entire flow executes within a single `getAIResponse` call, rather than making a separate API call after document ingestion.


## The path at a glance

```txt
瀏覽器送出問題
  → getAIResponse            (app/actions/ai-chat.ts)
    → searchRag              (app/actions/ragActions.ts)
      → ingestRagMd          必要時：切 rag.md → embedding → 寫入 PostgreSQL
                             已索引且 hash 未變：跳過
      → embedQuery           把「問題」做成向量
      → match_documents      在 documents 裡找最像的段落（最多 4 段）
    → 段落塞進 prompt
    → LiteLLM /chat/completions
  → 畫面顯示模型整理後的回答
```

前端拿到的是 **LLM 文字**，不是切塊、也不是相似度分數。
![Gemini_Generated_Image_ial6lzial6lzial6 (1)](https://hackmd.io/_uploads/HySGzo1cGg.jpg)

## 1. Client submits the question

`app/ai-chat/ChatInterface.tsx` 會在使用者按 **送出**（或選常見問題）時呼叫 `getAIResponse(問題)`。

送出前會將空字串等不合法輸入擋掉。
成功送出後按鈕會變成「檢索中…」。

```tsx
// app/ai-chat/ChatInterface.tsx
  const runQuery = async (raw: string) => {
    const q = raw.trim()
    if (!q || inFlightRef.current) return
    if (/^\d+$/.test(q)) {
      setIsError(true)
      setResponse('請在下方輸入完整問題，或重新從「常見問題」選一題（勿只送出數字）。')
      return
    }

    inFlightRef.current = true
    setLoading(true)
    setIsError(false)
    setLastQuestion(q)
    setResponse('')

    try {
      const result = await getAIResponse(q)
      if (result.success) {
        setResponse(result.message)
        setIsError(false)
      } else {
        setResponse(result.error ?? '無法取得 AI 回應')
        setIsError(true)
      }
    } finally {
      inFlightRef.current = false
      setLoading(false)
    }
  }
```

## 2. `getAIResponse` → `searchRag`

`app/actions/ai-chat.ts` 先確認有 `LITELLM_API_KEY`

```tsx
// app/actions/ai-chat.ts
let apiKey: string
try {
  apiKey = getLiteLLMApiKey()
} catch {
  return { success: false as const, error: 'Missing LITELLM_API_KEY' }
}
```
接著開始執行搜索：
```tsx
// app/actions/ai-chat.ts
const matches = await searchRag(prompt, 4)
```
> searchRag(prompt, 4):用使用者的問題去向量庫找最相關的 4 段文字，結果放進 matches。



## 3. `searchRag`

接著進入在 `app/actions/ragActions.ts` 的`searchRag` ，`searchRag`的開頭會直接先呼叫 `ingestRagMd`。它會去讀取專案根目錄的知識來源 `rag.md`，用檔案內容的 hash 判斷要不要重寫資料庫索引。

```tsx
// app/actions/ragActions.ts/ingestRagMd()
if (count === parts.length && count > 0) {
    return { success: true, chunkCount: count, cached: true }
  }
```
- 如果if 判斷為false，表示rag.md文件已被修改，資料庫需要重新chunking 與 embedding。先刪除資料庫中舊索引：
    ```tsx
    await pool.query(`DELETE FROM documents WHERE source = $1`, [SOURCE])
    ```
    接著會重新建立索引：
    ```tsx
    const vectors = await embeddings.embedDocuments(parts)
    ```

> **First request is slow?**
>
> 第一次（或你改過 `rag.md` 之後）會走完整個切分到寫入資料庫的流程。所以會需要一點時間。



## 4. Query embedding and vector search

ingest 回來之後，回到 `searchRag` 繼續：

1. 把**使用者問題**做成 query embedding（`lib/embeddings.ts` → LiteLLM `/embeddings`，4096 維）
```tsx
// app/actions/ragActions.ts/searchRag()
 const queryEmbedding = await getEmbeddings().embedQuery(query)
```
2. 呼叫 PostgreSQL 的 `match_documents(向量, 0.2, 4)`
   - 相似度須 **> 0.2**
   - 最多 **4** 段，由近到遠

```tsx
// app/actions/ragActions.ts/searchInDatabase()
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

回傳的每一段帶 `content` 與 `similarity`。


## 5. Prompt and LiteLLM

回到`getAIResponse` ，它會把段落排成：

```txt
[來源 1]
……切塊文字……

[來源 2]
……
```

- **有段落**：system 要求「只根據參考資料回答；資料不足請說清楚；用繁體中文」。user 訊息是「參考資料 + 使用者問題」。
- **沒段落**：system 改為告知沒有相關資料，仍用繁體中文短答。

然後 `POST ${LITELLM_BASE_URL}/chat/completions`（預設模型 `Gemma4-31B`）。遇 429 / 503 會重試。回傳優先用 `content`，若為空再試 `reasoning_content`。

:::info
### [Defensive Function](https://ithelp.ithome.com.tw/articles/10410820/edit)

目前為止的所有函式都有非常多的try-catch等防禦型寫法。目前為止整個流程若順利，可以佷順利，但如果不順利，問題也可以有一大堆，我為以下例外狀況寫了防禦：

- 請求發生例外
- 目前忙碌／限流
- LiteLLM API Error
- PostgreSQL 搜尋失敗
- 刪除舊索引/寫入新索引 失敗
:::
## 6. Back to the browser

`getAIResponse` 回傳 `{ success: true, message }` 或 `{ success: false, error }`。

`ChatInterface` 把 `message` 交給 `MarkdownMessage` 顯示。錯誤時同一區塊改顯示錯誤字串（例如 `Missing LITELLM_API_KEY`）。



### What you should see

- DevTools → Network：送出後只有**一輪** Server Action，不會先打「寫入 API」再打「搜尋 API」
- 第一題成功後，`documents` 列數大於 0；同一份 `rag.md` 再問，列數不該再往上加
- 畫面是整理過的繁體中文，不是 `[來源 1]` 原文列表
- 改 `rag.md` 存檔後下一題會變慢一次，然後恢復
