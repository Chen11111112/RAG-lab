import { readFileSync } from 'fs'

import { createHash } from 'crypto'

import { Pool } from 'pg'



for (const file of ['.env', '.env.local']) {
  try {
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const i = line.indexOf('=')
      if (i > 0 && !line.trimStart().startsWith('#')) {
        process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim()
      }
    }
  } catch {
    /* optional */
  }
}



const BASE_URL = process.env.LITELLM_BASE_URL ?? 'https://chatapi.ntubimdbirc.tw/v1'

const EMBED_MODEL = process.env.LITELLM_EMBED_MODEL ?? 'Qwen3-Embedding'



function chunkMarkdown(text) {

  const cleaned = text.replace(/<\/?aside>/g, '').replace(/\r\n/g, '\n').trim()

  if (/^### \[CHUNK-/m.test(cleaned)) {

    return cleaned.split(/\n(?=### \[CHUNK-)/).map((s) => s.trim()).filter((c) => c.length > 40)

  }

  return [cleaned]

}



async function embedBatch(texts) {

  const res = await fetch(`${BASE_URL}/embeddings`, {

    method: 'POST',

    headers: {

      'Content-Type': 'application/json',

      Authorization: `Bearer ${process.env.LITELLM_API_KEY}`,

    },

    body: JSON.stringify({

      model: EMBED_MODEL,

      input: texts,

      encoding_format: 'float',

    }),

  })

  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)

  const data = await res.json()

  return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding)

}



const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const text = readFileSync('rag.md', 'utf8')

const hash = createHash('sha256').update(text).digest('hex')

const parts = chunkMarkdown(text)

console.log('chunks:', parts.length)



await pool.query(`DELETE FROM documents WHERE source = 'rag.md'`)



for (let i = 0; i < parts.length; i += 8) {

  const batch = parts.slice(i, i + 8)

  const vectors = await embedBatch(batch)

  for (let j = 0; j < batch.length; j++) {

    await pool.query(

      `INSERT INTO documents (content, embedding, source, source_hash, chunk_index)

       VALUES ($1, $2::vector, $3, $4, $5)`,

      [batch[j], `[${vectors[j].join(',')}]`, 'rag.md', hash, i + j]

    )

  }

  console.log(`inserted ${Math.min(i + 8, parts.length)}/${parts.length}`)

}



const query = await embedBatch(['什麼是 Sprint'])

const { rows } = await pool.query(

  `SELECT LEFT(content, 70) AS preview, similarity

   FROM match_documents($1::vector, $2, $3)`,

  [`[${query[0].join(',')}]`, 0.2, 4]

)

console.log('top matches:', rows)

await pool.end()

