import { readFileSync } from 'fs'
import { Pool } from 'pg'

const env = readFileSync('.env', 'utf8')
const dbLine = env.split('\n').find((l) => l.startsWith('DATABASE_URL='))
const DATABASE_URL = dbLine?.slice('DATABASE_URL='.length).trim()
if (!DATABASE_URL) {
  console.error('No DATABASE_URL in .env')
  process.exit(1)
}

const pool = new Pool({ connectionString: DATABASE_URL })

try {
  const ping = await pool.query('SELECT 1 AS ok')
  console.log('connect:', ping.rows[0])

  const schema = await pool.query(`
    SELECT
      to_regclass('public.documents') AS documents_table,
      EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'match_documents'
      ) AS has_match_documents
  `)
  console.log('schema:', schema.rows[0])

  const count = await pool.query('SELECT COUNT(*)::int AS n FROM documents')
  console.log('documents count:', count.rows[0]?.n)
} catch (err) {
  console.error('ERROR:', err.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
