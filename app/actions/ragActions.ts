'use server'

import { getEmbeddings } from '@/lib/embeddings'
import {
  chunkMarkdown,
  cosineSimilarity,
  getRagSourceHash,
  parseEmbedding,
  type RagMatch,
} from '@/lib/rag'
import { getSupabaseAdmin } from '@/lib/supabase'

const SOURCE = 'rag.md'

/**
 * 將 rag.md 切塊、以 LangChain embedding 後寫入 Supabase documents
 * source_hash 相同則跳過，避免重複呼叫 Embedding API
 */
export async function ingestRagMd() {
  const supabase = getSupabaseAdmin()
  const embeddings = getEmbeddings()
  const { text, hash } = await getRagSourceHash()

  const { count, error: countError } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('source', SOURCE)
    .eq('source_hash', hash)

  if (countError) {
    throw new Error(
      `Supabase 查詢失敗（請先在 SQL Editor 執行 db/query.sql）: ${countError.message}`
    )
  }

  if ((count ?? 0) > 0) {
    return { success: true, chunkCount: count ?? 0, cached: true }
  }

  const { error: deleteError } = await supabase.from('documents').delete().eq('source', SOURCE)
  if (deleteError) {
    throw new Error(`Supabase 刪除舊索引失敗: ${deleteError.message}`)
  }

  const parts = chunkMarkdown(text)
  const vectors = await embeddings.embedDocuments(parts)

  const rows = parts.map((content, i) => ({
    content,
    embedding: vectors[i],
    source: SOURCE,
    source_hash: hash,
    chunk_index: i,
  }))

  const { error: insertError } = await supabase.from('documents').insert(rows)
  if (insertError) {
    throw new Error(`Supabase 寫入失敗: ${insertError.message}`)
  }

  return { success: true, chunkCount: rows.length, cached: false }
}

/** 優先用 match_documents RPC；若不存在則改為應用層餘弦相似度 */
async function searchInSupabase(
  queryEmbedding: number[],
  topK: number
): Promise<RagMatch[]> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: 0.2,
    match_count: topK,
  })

  if (!error) {
    return (data ?? []) as RagMatch[]
  }

  const { data: rows, error: selectError } = await supabase
    .from('documents')
    .select('id, content, embedding')

  if (selectError) {
    throw new Error(
      `Supabase 搜尋失敗: ${error.message}; 備援讀取也失敗: ${selectError.message}`
    )
  }

  return (rows ?? [])
    .map((row) => ({
      id: row.id as number,
      content: row.content as string,
      similarity: cosineSimilarity(queryEmbedding, parseEmbedding(row.embedding)),
    }))
    .filter((row) => row.similarity > 0.2)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
}

/** RAG 檢索：確保索引在 Supabase → LangChain query embedding → 回傳最相關片段 */
export async function searchRag(query: string, topK = 4): Promise<RagMatch[]> {
  await ingestRagMd()
  const queryEmbedding = await getEmbeddings().embedQuery(query)
  return searchInSupabase(queryEmbedding, topK)
}

/** 手動寫入單一段落到 Supabase */
export async function embedAndStore(text: string) {
  const supabase = getSupabaseAdmin()
  const embeddings = getEmbeddings()
  const [embedding] = await embeddings.embedDocuments([text])
  const { hash } = await getRagSourceHash()

  const { error } = await supabase.from('documents').insert({
    content: text,
    embedding,
    source: 'manual',
    source_hash: hash,
    chunk_index: 0,
  })

  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}
