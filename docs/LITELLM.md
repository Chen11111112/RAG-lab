# LiteLLM 串接技術文件

本文件說明如何將 RAG-lab 專案連接至 [LiteLLM Proxy](https://chatapi.ntubimdbirc.tw/)（OpenAI-compatible API）。

## 1. 架構概覽

```
Next.js App
  ├── lib/litellm.ts        → API 設定與重試邏輯
  ├── lib/embeddings.ts     → 向量化（/v1/embeddings）
  └── app/actions/ai-chat.ts → 對話（/v1/chat/completions）
         │
         ▼
  LiteLLM Proxy (https://chatapi.ntubimdbirc.tw/v1)
         │
         ├── Gemma4-31B        → 聊天模型
         └── Qwen3-Embedding   → 嵌入模型（4096 維）
         │
         ▼
  PostgreSQL + pgvector（documents 表）
```

LiteLLM 以 **OpenAI API 格式** 提供統一入口，客戶端只需替換 `baseURL` 與 `Authorization` 即可串接。

## 2. 環境變數

在專案根目錄建立 `.env.local`（可複製 `.env.example`）：

```env
LITELLM_BASE_URL=https://chatapi.ntubimdbirc.tw/v1
LITELLM_API_KEY=sk-your-api-key
LITELLM_CHAT_MODEL=Gemma4-31B
LITELLM_EMBED_MODEL=Qwen3-Embedding
DATABASE_URL=postgresql://postgres:password@localhost:5432/scrum_rag_db
```

| 變數 | 說明 |
|------|------|
| `LITELLM_BASE_URL` | Proxy 根路徑，結尾含 `/v1` |
| `LITELLM_API_KEY` | 管理員核發的 Bearer Token |
| `LITELLM_CHAT_MODEL` | 聊天模型 ID（見 `/v1/models`） |
| `LITELLM_EMBED_MODEL` | 嵌入模型 ID |
| `DATABASE_URL` | 本地 PostgreSQL 連線字串 |

## 3. 可用模型

查詢已部署模型：

```bash
curl -H "Authorization: Bearer $LITELLM_API_KEY" \
  https://chatapi.ntubimdbirc.tw/v1/models
```

目前 Proxy 提供：

| 模型 ID | 用途 | 備註 |
|---------|------|------|
| `Gemma4-31B` | 聊天／RAG 回答 | 支援 reasoning，需足夠 `max_tokens` |
| `Qwen3-Embedding` | 文件向量化 | 輸出 **4096 維** |

Swagger 文件：<https://chatapi.ntubimdbirc.tw/>（OpenAPI 3.1）

## 4. API 端點

### 4.1 Chat Completions

```http
POST /v1/chat/completions
Authorization: Bearer sk-xxx
Content-Type: application/json

{
  "model": "Gemma4-31B",
  "messages": [
    { "role": "system", "content": "你是助理。" },
    { "role": "user", "content": "什麼是 Sprint？" }
  ],
  "temperature": 0.3,
  "max_tokens": 2048
}
```

回應格式與 OpenAI 相同。`Gemma4-31B` 可能同時回傳 `content` 與 `reasoning_content`；本專案優先使用 `content`，若為空則 fallback 至 `reasoning_content`。

### 4.2 Embeddings

```http
POST /v1/embeddings
Authorization: Bearer sk-xxx
Content-Type: application/json

{
  "model": "Qwen3-Embedding",
  "input": ["要嵌入的文字"],
  "encoding_format": "float"
}
```

回應中 `data[0].embedding` 為長度 4096 的浮點陣列。

## 5. 專案整合方式

### 5.1 設定模組（`lib/litellm.ts`）

集中管理 Base URL、模型名稱、API Key 讀取，以及 429/503 指數退避重試。

### 5.2 嵌入（`lib/embeddings.ts`）

使用 `openai` SDK 的 `OpenAI` client，指定 `baseURL` 指向 LiteLLM：

```typescript
const client = new OpenAI({
  apiKey: process.env.LITELLM_API_KEY,
  baseURL: 'https://chatapi.ntubimdbirc.tw/v1',
})
await client.embeddings.create({ model: 'Qwen3-Embedding', input: texts })
```

`LiteLLMEmbeddings` 實作 `embedDocuments` / `embedQuery`，供 RAG 索引與檢索使用。

### 5.3 聊天（`app/actions/ai-chat.ts`）

1. 以 `searchRag()` 從 PostgreSQL 檢索相關段落
2. 將段落注入 system / user prompt
3. 呼叫 `${LITELLM_BASE_URL}/chat/completions`
4. 解析回應並回傳給前端

## 6. 資料庫維度

`Qwen3-Embedding` 輸出 **4096 維**，PostgreSQL 的 `documents.embedding` 必須設為 `vector(4096)`。

**新環境**：執行 `db/query.sql` 或 `db/LocalQuery.sql`。

**從 NVIDIA NIM（2048 維）遷移**：

```sql
TRUNCATE documents;
ALTER TABLE documents ALTER COLUMN embedding TYPE vector(4096);
-- 重建 match_documents 函式（見 db/query.sql）
```

接著重新建立索引：

```bash
node scripts/reingest.mjs
```

## 7. 快速驗證

```bash
# 1. 列出模型
node -e "fetch(process.env.LITELLM_BASE_URL+'/models',{headers:{Authorization:'Bearer '+process.env.LITELLM_API_KEY}}).then(r=>r.json()).then(console.log)"

# 2. 測試嵌入維度
node scripts/diag-rag.mjs

# 3. 啟動開發伺服器
npm run dev
```

## 8. 常見問題

| 問題 | 原因 | 解法 |
|------|------|------|
| `Missing LITELLM_API_KEY` | 未設定環境變數 | 建立 `.env.local` 並重啟 `npm run dev` |
| `401 Unauthorized` | API Key 無效或過期 | 向管理員重新申請 Key |
| 聊天回傳空內容 | `max_tokens` 過小，推理佔滿配額 | 提高 `max_tokens`（本專案設 2048） |
| `vector dimension mismatch` | DB 仍為 2048 維 | 執行第 6 節遷移並 reingest |
| 429 / 503 | 限流或服務忙碌 | 內建重試；稍後再試 |

## 9. 在其他專案串接 LiteLLM

任何支援 OpenAI SDK 的語言皆可沿用相同模式：

```python
# Python 範例
from openai import OpenAI

client = OpenAI(
    api_key="sk-xxx",
    base_url="https://chatapi.ntubimdbirc.tw/v1",
)

chat = client.chat.completions.create(
    model="Gemma4-31B",
    messages=[{"role": "user", "content": "Hello"}],
)

emb = client.embeddings.create(
    model="Qwen3-Embedding",
    input=["Hello world"],
)
```

核心原則：**只改 base URL 與 API Key，請求／回應格式與 OpenAI 完全一致。**
