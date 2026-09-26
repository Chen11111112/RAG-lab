# ChatInterface

> Last updated Sep. 25, 2026

This section will help you understand **`ChatInterface`**: when the client sends a question, what it waits for, and what actually appears on screen.

After completing this section, you should be able to tell whether a blank screen, a stuck「檢索中…」, or an error box is a frontend guard, a Server Action failure, or just waiting for the model.

`ChatInterface` 在 `app/ai-chat/ChatInterface.tsx`，標了 `'use client'`。`app/ai-chat/page.tsx` 只負責把它掛上 `/ai-chat`。頁面掛載**不會**發請求。


## Where it sits

```txt
/ai-chat
  → page.tsx
      → ChatInterface          ← 這章
            → getAIResponse()  （Server Action，見 Overview）
            → MarkdownMessage  顯示回傳文字
```

前端只傳**問題字串**，只收 `{ success, message | error }`。切塊、向量、`similarity` 都不會進瀏覽器。


## 1. Client component, Server Action

```tsx
// app/ai-chat/page.tsx
import ChatInterface from '@/app/ai-chat/ChatInterface'

export default function AiChatPage() {
  return <ChatInterface />
}
```

```tsx
// app/ai-chat/ChatInterface.tsx
'use client'

import { getAIResponse } from '@/app/actions/ai-chat'
```

沒有 `/api/chat`。`getAIResponse` 是 `'use server'` 函式，Client 直接 `await`。DevTools → Network 會看到**一輪** Server Action，不是先寫入再搜尋兩支 API。

:::info
### `'use client'` vs `'use server'`
`ChatInterface` 需要 `useState`、表單事件，所以必須在瀏覽器跑。

`getAIResponse` 要讀 `.env`、連 PostgreSQL、打 LiteLLM，只能在伺服器跑。`'use client'` 檔可以**呼叫** Server Action，但不能 `import` `lib/db.ts`、`lib/embeddings.ts` 自己去連後端。
:::


## 2. State

| State | 做什麼 |
| --- | --- |
| `prompt` | 輸入框文字 |
| `sampleIndex` | 「常見問題」下拉；`0` = 沒選 |
| `lastQuestion` | 已送出的那一題，顯示在回覆上方 |
| `response` | 成功時是 LLM 文字，失敗時是錯誤字串 |
| `loading` | 按鈕變「檢索中…」，表單 disabled |
| `isError` | 回覆區改紅色「錯誤」樣式 |
| `inFlightRef` | 擋連點；不觸發 re-render |

`canSubmit = !loading && prompt.trim().length > 0`。空白或進行中時按鈕不能按。


## 3. `runQuery` — the only request

送出表單或（未來若接上）其他入口，最後都進 `runQuery`：

```tsx
// app/ai-chat/ChatInterface.tsx / runQuery()
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
```

| 情況 | 會不會打後端 |
| --- | --- |
| 空字串 / 只有空白 | 否 |
| 進行中又按一次 | 否（`inFlightRef`） |
| 整串都是數字 | 否；本地顯示錯誤 |
| 通過以上檢查 | **是**，`await getAIResponse(q)` |

`handleSubmit` 只做 `preventDefault` 再 `runQuery(prompt)`。選「常見問題」只把 `text` 填進輸入框，**不會**自動送出。使用者改 textarea 時 `sampleIndex` 會回到 `0`。


## 4. What the screen shows

回覆區在 `loading || response || lastQuestion` 任一為真才出現。

| 畫面 | 條件 |
| --- | --- |
| 「檢索中…」+「正在對照工作手冊…」 | `loading && !response` |
| 「助理回覆」+ Markdown | `result.success` |
| 「錯誤」+ 錯誤字串 | `result.success === false`，或本地擋下的數字題 |

```tsx
<MarkdownMessage
  content={response}
  variant={isError ? 'error' : 'default'}
/>
```

`MarkdownMessage` 用 `react-markdown` + `remark-gfm` 渲染。錯誤與成功走同一元件，只差 `variant`。

前端**不會**顯示：

- `[來源 1]` 原文列表
- `similarity`
- ingest 是否 `cached`


## 5. Back to the server

```tsx
const result = await getAIResponse(q)
```

| `result` | 畫面 |
| --- | --- |
| `{ success: true, message }` | 助理回覆 |
| `{ success: false, error }` | 錯誤（例如 `Missing LITELLM_API_KEY`） |

`message` 已是模型整理過的繁體中文。檢索與組 prompt 在 `getAIResponse` 裡，見 [Overview](./03-overview.md)、[searchRag](./05-searchRag.md)。


:::info
### 為什麼掛載不發請求
索引與 embedding 都綁在「送出一題」這條鏈上（`searchRag` → `ingestRagMd`）。打開 `/ai-chat` 只渲染表單，不預先切 `rag.md`、不預先打 LiteLLM。
:::


### What you should see

- 打開 [http://localhost:3000/ai-chat](http://localhost:3000/ai-chat)：Network 沒有聊天請求
- 按送出：一輪 Server Action；按鈕變「檢索中…」
- 成功：上方是你的問題，下方是 Markdown 回覆，不是 chunk 列表
- 只輸入 `123`：立即出現錯誤字串，Network **沒有**新的 Action
- 連點送出：第二下被 `inFlightRef` 吃掉
- 畫面已是 `Missing LITELLM_API_KEY` / `PostgreSQL …`：問題在 Server Action 或基礎設施，不是 `ChatInterface` 組錯 UI
