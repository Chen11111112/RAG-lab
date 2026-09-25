# Quick Start

> Last updated Sep. 22, 2026


Welcome to the **Scrum-Assistant RAG system** documentation!

This Quick Start section will help you run your first Scrum-Assistant RAG system and learn the core concepts and workflows you'll use throughout the project.


## Prerequisites

Before getting started, please ensure your local development environment meets the prerequisites.

- [Node.js](https://nodejs.org/) **20.9** 或更新版本（Next.js 16 的最低要求）
- npm（隨 Node.js 安裝）
- [Docker](https://docs.docker.com/get-docker/)（用來啟動 PostgreSQL + pgvector）
- 一組 [LiteLLM Proxy](https://chatapi.ntubimdbirc.tw/) 的 API Key


## 1. Clone the repository

```bash
git clone https://github.com/Chen11111112/RAG-lab.git
cd RAG-lab
npm install
```
`.env` 不會進 Git。需要在專案根目錄建立 `.env`：

```bash
touch .env
```

寫入下列內容，並把 `LITELLM_API_KEY` 換成你的 Key：

```env
LITELLM_BASE_URL=https://chatapi.ntubimdbirc.tw/v1
LITELLM_API_KEY=sk-your-api-key
LITELLM_CHAT_MODEL=Gemma4-31B
LITELLM_EMBED_MODEL=Qwen3-Embedding
DATABASE_URL=postgresql://postgres:password@localhost:5432/scrum_rag_db
```

| 變數 | 必填 | 說明 |
| --- | --- | --- |
| `LITELLM_API_KEY` | 是 | Proxy 核發的 Bearer Token |
| `DATABASE_URL` | 是 | 本機 PostgreSQL 連線字串，須與第 4 步一致 |
| `LITELLM_BASE_URL` | 否 | 預設為 `https://chatapi.ntubimdbirc.tw/v1` |
| `LITELLM_CHAT_MODEL` | 否 | 預設為 `Gemma4-31B` |
| `LITELLM_EMBED_MODEL` | 否 | 預設為 `Qwen3-Embedding`（**4096** 維） |


## 2. Start PostgreSQL

本專案的向量欄位是 `vector(4096)`，資料庫必須啟用 pgvector。最快的方式是跑官方映像：

```bash
docker run -d \
  --name rag-lab-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=scrum_rag_db \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```
docker 指令不允許換行，實際輸入指令請全部都在同一行：
```bash
docker run -d --name rag-lab-pg -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=scrum_rag_db -p 5432:5432 pgvector/pgvector:pg16
```

確認容器在跑：

```bash
docker ps
```

你應該會看到 `rag-lab-pg`，埠號對應 `0.0.0.0:5432->5432/tcp`。

### 2.1 建立資料表
把 `db/LocalQuery.sql` 貼進該資料庫（psql、TablePlus 或其他 GUI 皆可），或：

```bash
docker exec -i rag-lab-pg psql -U postgres -d scrum_rag_db < db/LocalQuery.sql
```
這會啟用 pgvector、建立 `documents` 表與 `match_documents`。`documents` 此時是空的，索引會在你送出**第一題**時寫入。


## 3. Start the development server

```bash
npm run dev
```

打開 [http://localhost:3000](http://localhost:3000)。你應該會看到專案首頁，標題為 **HyC / Scrum 助理**。

點 **開始提問**，或直接打開 [http://localhost:3000/ai-chat](http://localhost:3000/ai-chat)。

頁面掛載**不會**發請求。送出問題之後，後端才會開始檢索。

## 4. Ask a question

在輸入框中輸入例如：

```txt
Scrum 的三大核心角色是什麼？
```

或從「常見問題」選一題，按 **送出**。

按鈕會變成「檢索中…」。

> **First request is slow?**
>
> 預期行為。第一次（或 `rag.md` 變更後）會把檔案切塊、呼叫 embedding、寫入 PostgreSQL，再搜尋並請模型回答。之後同一份 `rag.md` 會跳過重寫，只做問題 embedding 與檢索。

### What you should see

- 瀏覽器：繁體中文回答，內容對得上 Scrum 工作手冊
- 資料庫：第一題成功後，`documents` 列數大於 0

