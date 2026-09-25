'use server'

import { getEmbeddings } from '@/lib/embeddings'
import { getPool, toVectorLiteral } from '@/lib/db'
import { chunkMarkdown, getRagSourceHash, type RagMatch } from '@/lib/rag'

const SOURCE = 'rag.md'

/**
 * 將 rag.md 切塊、embedding 後寫入本地 PostgreSQL documents
 * source_hash 相同則跳過，避免重複呼叫 Embedding API
 */
export async function ingestRagMd() {
  const pool = getPool()
  const embeddings = getEmbeddings()
  const { text, hash } = await getRagSourceHash()
  const parts = chunkMarkdown(text)

  let count = 0
  try {
    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM documents WHERE source = $1 AND source_hash = $2`,
      [SOURCE, hash]
    )
    count = Number(countResult.rows[0]?.count ?? 0)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(
      `PostgreSQL 查詢失敗（請先在本地執行 db/LocalQuery.sql）: ${message}`
    )
  }

  if (count === parts.length && count > 0) {
    return { success: true, chunkCount: count, cached: true }
  }

  try {
    await pool.query(`DELETE FROM documents WHERE source = $1`, [SOURCE])
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`PostgreSQL 刪除舊索引失敗: ${message}`)
  }

  const vectors = await embeddings.embedDocuments(parts)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (let i = 0; i < parts.length; i++) {
      await client.query(
        `INSERT INTO documents (content, embedding, source, source_hash, chunk_index)
         VALUES ($1, $2::vector, $3, $4, $5)`,
        [parts[i], toVectorLiteral(vectors[i]), SOURCE, hash, i]
      )
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`PostgreSQL 寫入失敗: ${message}`)
  } finally {
    client.release()
  }

  return { success: true, chunkCount: parts.length, cached: false }
}

async function searchInDatabase(
  queryEmbedding: number[],
  topK: number
): Promise<RagMatch[]> {
  const pool = getPool()
  const { rows } = await pool.query<{
    id: string
    content: string
    similarity: number
  }>(
    `SELECT id, content, similarity
     FROM match_documents($1::vector, $2, $3)`,
    [toVectorLiteral(queryEmbedding), 0.2, topK]
  )

  return rows.map((row) => ({
    id: Number(row.id),
    content: row.content,
    similarity: row.similarity,
  }))
}

/** RAG 檢索：確保索引在 PostgreSQL → query embedding → 回傳最相關片段 */
export async function searchRag(query: string, topK = 4): Promise<RagMatch[]> {
  await ingestRagMd()
  const queryEmbedding = await getEmbeddings().embedQuery(query)
  return searchInDatabase(queryEmbedding, topK)
}

/** 手動寫入單一段落到 PostgreSQL */
export async function embedAndStore(text: string) {
  const pool = getPool()
  const embeddings = getEmbeddings()
  const [embedding] = await embeddings.embedDocuments([text])
  const { hash } = await getRagSourceHash()

  try {
    await pool.query(
      `INSERT INTO documents (content, embedding, source, source_hash, chunk_index)
       VALUES ($1, $2::vector, $3, $4, $5)`,
      [text, toVectorLiteral(embedding), 'manual', hash, 0]
    )
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}
