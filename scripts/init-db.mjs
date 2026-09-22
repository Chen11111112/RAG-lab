import { readFileSync } from 'fs'
import { Pool } from 'pg'

const env = readFileSync('.env', 'utf8')
const dbLine = env.split('\n').find((l) => l.startsWith('DATABASE_URL='))
const DATABASE_URL = dbLine?.slice('DATABASE_URL='.length).trim()
if (!DATABASE_URL) throw new Error('No DATABASE_URL in .env')

const target = new URL(DATABASE_URL)
const dbName = target.pathname.replace(/^\//, '')
target.pathname = '/postgres'

const admin = new Pool({ connectionString: target.toString() })

const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName])
if (exists.rowCount === 0) {
  await admin.query(`CREATE DATABASE ${JSON.stringify(dbName).slice(1, -1)}`)
  console.log(`created database: ${dbName}`)
} else {
  console.log(`database exists: ${dbName}`)
}

await admin.end()

const pool = new Pool({ connectionString: DATABASE_URL })
const sql = readFileSync('db/LocalQuery.sql', 'utf8')
try {
  await pool.query(sql)
  console.log('schema applied')
} catch (err) {
  const message = err instanceof Error ? err.message : String(err)
  if (message.includes('extension "vector" is not available')) {
    console.error(`
PostgreSQL 尚未安裝 pgvector 擴充功能。

請在本機 PostgreSQL 安裝 pgvector 後再執行一次：
  node scripts/init-db.mjs

Windows 可參考：https://github.com/pgvector/pgvector#installation
或使用 Docker：docker run -e POSTGRES_PASSWORD=... -p 5432:5432 pgvector/pgvector:pg16
`)
  }
  throw err
}

const check = await pool.query(`
  SELECT
    to_regclass('public.documents') AS documents_table,
    (SELECT COUNT(*)::int FROM documents) AS document_count
`)
console.log('check:', check.rows[0])
await pool.end()
