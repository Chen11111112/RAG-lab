import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

// rag.md 原始知識庫路徑
const RAG_FILE = path.join(process.cwd(), 'rag.md')
// 本地向量索引快取檔（避免每次都重新 embedding）
const INDEX_FILE = path.join(process.cwd(), 'data', 'rag-index.json')

const CHUNK_SIZE = 800 // 單一片段最大字元數
const CHUNK_OVERLAP = 150 // 相鄰片段重疊，避免句子被切斷失義
const TOP_K = 4 // 預設回傳最相似的前 N 筆

// 索引中單一段落：原文 + 向量
export type RagChunk = {
  id: number
  content: string
  embedding: number[]
}

// 整份索引：來源雜湊 + 所有片段
type RagIndex = {
  sourceHash: string
  chunks: RagChunk[]
}

// 用 SHA-256 偵測 rag.md 是否變更
function hashText(text: string) {
  return createHash('sha256').update(text).digest('hex')
}

/**
 * 將 Markdown 切成適合 embedding 的片段
 * 1. 清掉 Notion aside 標籤
 * 2. 依一級標題 (# ) 分段
 * 3. 過長段落再滑動視窗切分
 */
export function chunkMarkdown(text: string): string[] {
  const cleaned = text
    .replace(/<\/?aside>/g, '')
    .replace(/\r\n/g, '\n')
    .trim()

  // 在「換行 + # 空格」處切開，保留各大章節語意
  const sections = cleaned
    .split(/\n(?=# )/)
    .map((s) => s.trim())
    .filter(Boolean)

  const chunks: string[] = []

  for (const section of sections) {
    // 短段落直接整段當一個 chunk
    if (section.length <= CHUNK_SIZE) {
      chunks.push(section)
      continue
    }

    // 長段落：固定視窗 + overlap 滑動切分
    let start = 0
    while (start < section.length) {
      const end = Math.min(start + CHUNK_SIZE, section.length)
      chunks.push(section.slice(start, end).trim())
      if (end >= section.length) break
      start = Math.max(end - CHUNK_OVERLAP, start + 1)
    }
  }

  // 太短的片段通常沒有檢索價值，過濾掉
  return chunks.filter((c) => c.length > 40)
}

/**
 * 餘弦相似度：衡量兩個向量方向有多接近
 * 回傳值約在 -1 ~ 1，越大越相似
 */
export function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0
  let na = 0
  let nb = 0
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

// 讀取專案根目錄的 rag.md
export async function readRagMarkdown() {
  return fs.readFile(RAG_FILE, 'utf8')
}

// 載入本地索引；檔案不存在或損壞則回 null
export async function loadIndex(): Promise<RagIndex | null> {
  try {
    const raw = await fs.readFile(INDEX_FILE, 'utf8')
    return JSON.parse(raw) as RagIndex
  } catch {
    return null
  }
}

// 寫入索引前先確保 data/ 目錄存在
export async function saveIndex(index: RagIndex) {
  await fs.mkdir(path.dirname(INDEX_FILE), { recursive: true })
  await fs.writeFile(INDEX_FILE, JSON.stringify(index), 'utf8')
}

// 同時回傳原文與雜湊，供 ingest 比對是否需要重建索引
export async function getRagSourceHash() {
  const text = await readRagMarkdown()
  return { text, hash: hashText(text) }
}

/**
 * 依查詢向量對所有 chunk 打分，回傳相似度最高的 topK 筆
 */
export function rankChunks(
  queryEmbedding: number[],
  chunks: RagChunk[],
  topK = TOP_K
) {
  return chunks
    .map((chunk) => ({
      ...chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
}
