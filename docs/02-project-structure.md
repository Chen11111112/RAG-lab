# Project structure and organization

> Last updated Sep. 22, 2026


This section will help you understand the folder and file conventions in this project, and how to find the right file when something breaks.


## Top-level folders

| Folder | 用途 |
| --- | --- |
| `app/` | Next.js App Router：頁面、layout、Server Actions |
| `lib/` | 共用後端模組：資料庫、embedding、LiteLLM、切塊 |
| `db/` | PostgreSQL schema（`LocalQuery.sql`） |


專案根目錄還有知識來源 `rag.md`。向量資料不在 Git 裡，存在本機 PostgreSQL。

```txt
RAG-lab/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── actions/
│   │   ├── ai-chat.ts
│   │   └── ragActions.ts
│   └── ai-chat/
│       ├── page.tsx
│       ├── ChatInterface.tsx
│       └── MarkdownMessage.tsx
├── lib/
│   ├── db.ts
│   ├── embeddings.ts
│   ├── litellm.ts
│   └── rag.ts
├── db/
│   └── LocalQuery.sql
├── rag.md
├── package.json
└── .env          ← 本機建立，不進 Git
```


## Top-level files

| File | 用途 |
| --- | --- |
| `rag.md` | RAG 唯一知識來源 |
| `package.json` | 依賴與 `npm run dev` |
| `next.config.ts` | Next.js 設定 |
| `tsconfig.json` | TypeScript；`@/*` 對應專案根目錄 |
| `.env` | 環境變數（見 [Quick Start](./01-quick-start.md)） |
| `.gitignore` | 忽略 `.env*`、`.next/`、`node_modules/` |


## Routing files

Next.js 用資料夾對應 URL。這個專案只有兩條公開路由：

| Path | URL |
| --- | --- |
| `app/page.tsx` | `/` |
| `app/ai-chat/page.tsx` | `/ai-chat` |
| `app/layout.tsx` | 包住所有頁面（header / footer） |

`app/actions/` 不是路由。裡面的檔案以 `'use server'` 匯出函式，給 Client Component 直接呼叫，沒有 `/api/...` 路徑。


## 1. `app/` — UI and Server Actions

### 頁面

- `app/page.tsx`：首頁，連到 `/ai-chat`
- `app/ai-chat/page.tsx`：聊天頁，只負責掛上 `ChatInterface`
- `app/ai-chat/ChatInterface.tsx`：`'use client'`。送出問題時呼叫 `getAIResponse`，頁面掛載不會發請求
- `app/ai-chat/MarkdownMessage.tsx`：把模型回傳的 Markdown 渲染成畫面

### Server Actions

| File | export | 做什麼 |
| --- | --- | --- |
| `app/actions/ai-chat.ts` | `getAIResponse` | 檢索 → 組 prompt → 呼叫 LiteLLM |
| `app/actions/ragActions.ts` | `searchRag`、`ingestRagMd` | 確保 `rag.md` 已索引，再向量搜尋 |


## 2. `lib/` — shared server code

這些模組只應在伺服器端使用（Server Action、腳本），不要從 Client Component 直接 import。

| File | 做什麼 |
| --- | --- |
| `lib/rag.ts` | 讀 `rag.md`、切塊、`source_hash`、餘弦相似度 |
| `lib/embeddings.ts` | 透過 LiteLLM 做 document / query embedding |
| `lib/litellm.ts` | Base URL、模型名稱、API Key、429/503 重試 |
| `lib/db.ts` | PostgreSQL connection pool、`vector` 字面值 |



## 3. How a request maps to files

送出一題之後，呼叫鏈對應這些檔案：

```txt
ChatInterface.tsx
  → getAIResponse          (app/actions/ai-chat.ts)
    → searchRag            (app/actions/ragActions.ts)
      → ingestRagMd        （必要時讀 rag.md、寫 PostgreSQL）
      → embedQuery         (lib/embeddings.ts)
      → match_documents    (PostgreSQL / lib/db.ts)
    → LiteLLM chat         (lib/litellm.ts)
  → 畫面顯示回答
```
![Gemini_Generated_Image_ial6lzial6lzial6 (1)](https://hackmd.io/_uploads/HySGzo1cGg.jpg)


