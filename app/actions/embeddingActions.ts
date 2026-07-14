'use server'

import {
  chunkMarkdown,
  cosineSimilarity,
  getRagSourceHash,
  parseEmbedding,
  type RagMatch,
} from '@/lib/rag'
import { fetchWithRetry } from '@/lib/nvidia'
import { getSupabaseAdmin } from '@/lib/supabase'

const SOURCE = 'rag.md'

/**
 * 呼叫 NVIDIA NIM Embedding API
 * inputType:
 * - passage：建索引（文件段落）
 * - query：檢索時的問題向量
 */
async function createEmbeddings(
  texts: string[],
  inputType: 'passage' | 'query'
): Promise<number[][]> {
  const apiKey = process.env.NVIDIA_NIM_API_KEY
  if (!apiKey) {
    throw new Error('Missing NVIDIA_NIM_API_KEY')
  }

  const response = await fetchWithRetry(
    'https://integrate.api.nvidia.com/v1/embeddings',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: texts,
        model: 'nvidia/nv-embedqa-e5-v5',
        encoding_format: 'float',
        input_type: inputType,
        truncate: 'END',
      }),
    },
    { retries: 3, label: 'embedding' }
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Embedding API Error: ${response.status} ${errText}`)
  }

  const data = await response.json()
  return (data.data as Array<{ index: number; embedding: number[] }>)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding)
}

async function getEmbedding(text: string): Promise<number[]> {
  const [embedding] = await createEmbeddings([text], 'passage')
  return embedding
}

async function getQueryEmbedding(text: string): Promise<number[]> {
  const [embedding] = await createEmbeddings([text], 'query')
  return embedding
}

/**
 * 將 rag.md 切塊、embedding 後寫入 Supabase documents
 * source_hash 相同則跳過，避免重複呼叫 Embedding API
 */
export async function ingestRagMd() {
  const supabase = getSupabaseAdmin()
  const { text, hash } = await getRagSourceHash()

  const { count, error: countError } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('source', SOURCE)
    .eq('source_hash', hash)

  if (countError) {
    // 可能是舊表尚未加 source 欄位 → 提示執行 SQL
    throw new Error(
      `Supabase 查詢失敗（請先在 SQL Editor 執行 db/query.sql）: ${countError.message}`
    )
  }

  if ((count ?? 0) > 0) {
    return { success: true, chunkCount: count ?? 0, cached: true }
  }

  // 刪除同來源舊索引後重建
  const { error: deleteError } = await supabase.from('documents').delete().eq('source', SOURCE)
  if (deleteError) {
    throw new Error(`Supabase 刪除舊索引失敗: ${deleteError.message}`)
  }

  const parts = chunkMarkdown(text)
  const batchSize = 16
  const rows: Array<{
    content: string
    embedding: number[]
    source: string
    source_hash: string
    chunk_index: number
  }> = []

  for (let i = 0; i < parts.length; i += batchSize) {
    const batch = parts.slice(i, i + batchSize)
    const embeddings = await createEmbeddings(batch, 'passage')
    for (let j = 0; j < batch.length; j++) {
      rows.push({
        content: batch[j],
        embedding: embeddings[j],
        source: SOURCE,
        source_hash: hash,
        chunk_index: i + j,
      })
    }
  }

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

  // RPC 尚未建立時的備援：從 documents 讀出向量後在 Node 計算相似度
  const { data: rows, error: selectError } = await supabase
    .from('documents')
    .select('id, content, embedding')

  if (selectError) {
    throw new Error(`Supabase 搜尋失敗: ${error.message}; 備援讀取也失敗: ${selectError.message}`)
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

/**
 * RAG 檢索：確保索引在 Supabase → 問題 embedding → 回傳最相關片段
 */
export async function searchRag(query: string, topK = 4): Promise<RagMatch[]> {
  await ingestRagMd()
  const queryEmbedding = await getQueryEmbedding(query)
  return searchInSupabase(queryEmbedding, topK)
}

/** 手動寫入單一段落到 Supabase */
export async function embedAndStore(text: string) {
  const supabase = getSupabaseAdmin()
  const embedding = await getEmbedding(text)
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
