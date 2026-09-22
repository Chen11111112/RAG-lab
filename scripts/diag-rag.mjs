import { readFileSync } from 'fs'

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



async function embed(input) {

  const res = await fetch(`${BASE_URL}/embeddings`, {

    method: 'POST',

    headers: {

      'Content-Type': 'application/json',

      Authorization: `Bearer ${process.env.LITELLM_API_KEY}`,

    },

    body: JSON.stringify({

      model: EMBED_MODEL,

      input: [input],

      encoding_format: 'float',

    }),

  })

  const body = await res.text()

  if (!res.ok) throw new Error(`${res.status} ${body.slice(0, 200)}`)

  return JSON.parse(body).data[0].embedding

}



const pool = new Pool({ connectionString: process.env.DATABASE_URL })



const stats = await pool.query(`

  SELECT

    COUNT(*)::int AS total,

    COUNT(*) FILTER (WHERE source = 'rag.md')::int AS rag_md,

    COUNT(DISTINCT source_hash)::int AS hashes

  FROM documents

`)

console.log('documents:', stats.rows[0])



const sample = await pool.query(`

  SELECT id, source, source_hash, chunk_index, LEFT(content, 80) AS preview,

         vector_dims(embedding) AS dims

  FROM documents

  ORDER BY id

  LIMIT 5

`)

console.log('samples:', sample.rows)



const query = '什麼是 Sprint'

const qvec = await embed(query)

console.log('query embedding dim:', qvec.length)



const rpc = await pool.query(

  `SELECT id, LEFT(content, 60) AS preview, similarity

   FROM match_documents($1::vector, $2, $3)`,

  [`[${qvec.join(',')}]`, 0.0, 5]

)

console.log('match_documents threshold=0:', rpc.rows)



const rpc2 = await pool.query(

  `SELECT id, LEFT(content, 60) AS preview, similarity

   FROM match_documents($1::vector, $2, $3)`,

  [`[${qvec.join(',')}]`, 0.2, 5]

)

console.log('match_documents threshold=0.2:', rpc2.rows)



await pool.end()

