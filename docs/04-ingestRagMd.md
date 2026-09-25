# ingestRagMd

> Last updated Sep. 23, 2026

This section will help you understand **`ingestRagMd`**: when it skips, when it rewrites the index, and which files it touches. 

After completing this section, you should be able to diagnose issues—whether in file reading, chunking, embedding, or database insertion—by inspecting error messages or the row count in `documents`.

`ingestRagMd` is located in `app/actions/ragActions.ts`. `searchRag` **always** executes it at the very beginning, though `ingestRagMd` itself does not perform query searches.


## Where it sits

```txt
searchRag(query)
  → ingestRagMd()          ← 這章
  → embedQuery(query)
  → searchInDatabase(...)
```

知識來源只有專案根目錄的 `rag.md`。寫入目標是 PostgreSQL 的 `documents` 表，`source` 固定為 `'rag.md'`。


## 1. Read `rag.md` and hash

```tsx
// app/actions/ragActions.ts / ingestRagMd()
const pool = getPool()
const embeddings = getEmbeddings()
const { text, hash } = await getRagSourceHash()
const parts = chunkMarkdown(text)
```

`getRagSourceHash`（`lib/rag.ts`）讀檔並做 SHA-256：
> 透過 SHA-256 計算雜湊值 用來當 rag.md 的指紋，判斷索引能不能沿用（是否有被更改），避免每次提問都重跑 embedding。


```tsx
// lib/rag.ts
export async function getRagSourceHash() {
  const text = await readRagMarkdown()
  return { text, hash: hashText(text) }
}
```
## 2. Chunk

`chunkMarkdown`（`lib/rag.ts`）把全文切成 `parts`。因為目前的 `rag.md` 已用 `### [CHUNK-xxx]` 分段，因此走第一條規則：

```tsx
// lib/rag.ts / chunkMarkdown()
if (/^### \[CHUNK-/m.test(cleaned)) {
  return cleaned
    .split(/\n(?=### \[CHUNK-)/)
    .map((s) => s.trim())
    .filter((c) => c.length > 40)
}
```

若檔案沒有 `[CHUNK-` 標記，才改依H1 `# ` 分段；單段超過 **800** 字再滑動視窗切（重疊 **150**），並丟掉長度 ≤ 40 的碎片。

`parts.length` 就是「這次應該寫進資料庫的列數」。cache 判斷會拿它跟資料庫比。


## 3. Compare with the database

```tsx
// app/actions/ragActions.ts / ingestRagMd()
const countResult = await pool.query<{ count: string }>(
  `SELECT COUNT(*)::text AS count FROM documents WHERE source = $1 AND source_hash = $2`,
  [SOURCE, hash]
)
count = Number(countResult.rows[0]?.count ?? 0)
```

會COUNT **同一個 source 且 hash 對得上目前檔案** 的列。表不存在或還沒跑 `db/LocalQuery.sql` 時，會丟錯誤：

```txt
PostgreSQL 查詢失敗（請先在本地執行 db/LocalQuery.sql）
```


## 4. Skip or rewrite

```tsx
// app/actions/ragActions.ts / ingestRagMd()
if (count === parts.length && count > 0) {
  return { success: true, chunkCount: count, cached: true }
}
```

| 條件 | 結果 |
| --- | --- |
| `count === parts.length` 且 `count > 0` | **跳過** embedding 與寫入，回傳 `cached: true` |
| 表是空的、hash 對不上、或列數 ≠ 切塊數 | 刪舊資料 → 重新 embedding → `INSERT` |

`if` 為 false 時，先刪掉 **所有** `source = 'rag.md'` 的列（不看舊 hash），避免新舊混在一起：

```tsx
await pool.query(`DELETE FROM documents WHERE source = $1`, [SOURCE])
```

刪除失敗會丟 `PostgreSQL 刪除舊索引失敗`。



## 5. Embed and insert

```tsx
const vectors = await embeddings.embedDocuments(parts)
```

`lib/embeddings.ts` 透過 LiteLLM `/embeddings`（預設 `Qwen3-Embedding`，**4096** 維），每批最多 16 段。`vectors[i]` 對應 `parts[i]`。

然後用**同一條連線、同一個 transaction** 寫入：

```tsx
await client.query('BEGIN')
for (let i = 0; i < parts.length; i++) {
  await client.query(
    `INSERT INTO documents (content, embedding, source, source_hash, chunk_index)
     VALUES ($1, $2::vector, $3, $4, $5)`,
    [parts[i], toVectorLiteral(vectors[i]), SOURCE, hash, i]
  )
}
await client.query('COMMIT')
```

`toVectorLiteral`（`lib/db.ts`）把 `number[]` 轉成 pgvector 字面值：`[0.1,0.2,...]`。

任一筆 `INSERT` 失敗會 `ROLLBACK`，並丟 `PostgreSQL 寫入失敗`。成功則：

```tsx
return { success: true, chunkCount: parts.length, cached: false }
```

`searchRag` 不使用這個回傳值；它只是 `await ingestRagMd()` 之後繼續做 query embedding。


## What gets stored

| Column | 值 |
| --- | --- |
| `content` | 一個 chunk 的原文 |
| `embedding` | `vector(4096)` |
| `source` | `'rag.md'` |
| `source_hash` | 這次讀到的檔案 SHA-256 |
| `chunk_index` | `0 … parts.length - 1` |

`DELETE` 只針對 `source = 'rag.md'`。若有人用 `embedAndStore` 寫入 `source = 'manual'` 的列，ingest 不會刪它們。


:::info
### [Defensive Function](https://ithelp.ithome.com.tw/articles/10410820/edit)

`ingestRagMd` 把資料庫例外拆成「增刪查」：

- 查 `COUNT` 失敗 → 多半還沒套用 `db/LocalQuery.sql`，或 `DATABASE_URL` 指錯實例
- `DELETE` 失敗 → 連得上但寫入權限／表狀態有問題
- `INSERT` / transaction 失敗 → 常見是 embedding 維度不是 4096（`vector dimension mismatch`），或 LiteLLM embedding 已成功、寫庫中斷
:::

