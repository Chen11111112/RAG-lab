import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

// rag.md 原始知識庫路徑
const RAG_FILE = path.join(process.cwd(), 'rag.md')

const CHUNK_SIZE = 800 // 單一片段最大字元數
const CHUNK_OVERLAP = 150 // 相鄰片段重疊，避免句子被切斷失義

// 檢索結果（資料來自 PostgreSQL）
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

  // rag.md 已預先以 [CHUNK-xxx] 切塊時，直接沿用語意段落
  if (/^### \[CHUNK-/m.test(cleaned)) {
    return cleaned
      .split(/\n(?=### \[CHUNK-)/)
      .map((s) => s.trim())
      .filter((c) => c.length > 40)
  }

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

export async function readRagMarkdown() {
  return fs.readFile(RAG_FILE, 'utf8')
}

export async function getRagSourceHash() {
  const text = await readRagMarkdown()
  return { text, hash: hashText(text) }
}
