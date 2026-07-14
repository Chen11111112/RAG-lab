'use server'

import {
  chunkMarkdown,
  getRagSourceHash,
  loadIndex,
  rankChunks,
  saveIndex,
  type RagChunk,
} from '@/lib/rag'

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

  const response = await fetch('https://integrate.api.nvidia.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: texts,
      model: 'nvidia/nv-embedqa-e5-v5', // 專為 QA 檢索優化的 embedding 模型
      encoding_format: 'float',
      input_type: inputType, // 必須正確設定，否則檢索準度會大幅下降
      truncate: 'END', // 超長文字從尾端截斷
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Embedding API Error: ${response.status} ${errText}`)
  }

  const data = await response.json()
  // 依 index 排序，確保與輸入 texts 順序一致
  return (data.data as Array<{ index: number; embedding: number[] }>)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding)
}

// 單段文件向量（passage 模式）
async function getEmbedding(text: string): Promise<number[]> {
  const [embedding] = await createEmbeddings([text], 'passage')
  return embedding
}

// 使用者問題向量（query 模式）
async function getQueryEmbedding(text: string): Promise<number[]> {
  const [embedding] = await createEmbeddings([text], 'query')
  return embedding
}

/**
 * 將 rag.md 切塊、embedding 後寫入本地索引
 * 若來源雜湊未變則直接使用快取，避免重複呼叫 API
 */
export async function ingestRagMd() {
  const { text, hash } = await getRagSourceHash()
  const existing = await loadIndex()
  // rag.md 沒改過 → 重用既有索引
  if (existing?.sourceHash === hash && existing.chunks.length > 0) {
    return { success: true, chunkCount: existing.chunks.length, cached: true }
  }

  const parts = chunkMarkdown(text)
  const chunks: RagChunk[] = []
  const batchSize = 16 // 批次送出，減少 API round-trip

  for (let i = 0; i < parts.length; i += batchSize) {
    const batch = parts.slice(i, i + batchSize)
    const embeddings = await createEmbeddings(batch, 'passage')
    for (let j = 0; j < batch.length; j++) {
      chunks.push({ id: i + j, content: batch[j], embedding: embeddings[j] })
    }
  }

  await saveIndex({ sourceHash: hash, chunks })
  return { success: true, chunkCount: chunks.length, cached: false }
}

/**
 * RAG 檢索：確保索引最新 → 問題 embedding → 回傳最相關片段
 */
export async function searchRag(query: string, topK = 4) {
  await ingestRagMd()
  const index = await loadIndex()
  if (!index?.chunks.length) {
    return [] as Array<RagChunk & { similarity: number }>
  }

  const queryEmbedding = await getQueryEmbedding(query)
  return rankChunks(queryEmbedding, index.chunks, topK)
}

/**
 * 手動把一段文字 embedding 後追加進索引
 * （額外工具函式，聊天流程主要走 ingestRagMd）
 */
export async function embedAndStore(text: string) {
  const embedding = await getEmbedding(text)
  const index = (await loadIndex()) ?? { sourceHash: 'manual', chunks: [] as RagChunk[] }
  index.chunks.push({
    id: index.chunks.length,
    content: text,
    embedding,
  })
  await saveIndex(index)
  return { success: true }
}
