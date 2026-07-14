import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

// rag.md 原始知識庫路徑
const RAG_FILE = path.join(process.cwd(), 'rag.md')

const CHUNK_SIZE = 800 // 單一片段最大字元數
const CHUNK_OVERLAP = 150 // 相鄰片段重疊，避免句子被切斷失義

// 檢索結果（資料來自 Supabase）
export type RagMatch = {
  id: number
  content: string
  similarity: number
}

// 用 SHA-256 偵測 rag.md 是否變更
export function hashText(text: string) {
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

  const sections = cleaned
    .split(/\n(?=# )/)
    .map((s) => s.trim())
    .filter(Boolean)

  const chunks: string[] = []

  for (const section of sections) {
    if (section.length <= CHUNK_SIZE) {
      chunks.push(section)
      continue
    }

    let start = 0
    while (start < section.length) {
      const end = Math.min(start + CHUNK_SIZE, section.length)
      chunks.push(section.slice(start, end).trim())
      if (end >= section.length) break
      start = Math.max(end - CHUNK_OVERLAP, start + 1)
    }
  }

  return chunks.filter((c) => c.length > 40)
}

/**
 * 餘弦相似度（RPC 尚未建立時，在應用層備援計算用）
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

// 解析 Supabase / pgvector 回傳的 embedding（可能是 number[] 或字串）
export function parseEmbedding(value: unknown): number[] {
  if (Array.isArray(value)) return value as number[]
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as number[]
    } catch {
      return value
        .replace(/[\[\]]/g, '')
        .split(',')
        .map((n) => Number(n.trim()))
        .filter((n) => !Number.isNaN(n))
    }
  }
  return []
}

export async function readRagMarkdown() {
  return fs.readFile(RAG_FILE, 'utf8')
}

export async function getRagSourceHash() {
  const text = await readRagMarkdown()
  return { text, hash: hashText(text) }
}
