const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local')
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=')
  if (k && v.length) process.env[k.trim()] = v.join('=').trim()
})

const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase_schema.sql'), 'utf8')

// Try direct host first, fallback to pooler
const directHost = `db.${process.env.DB_USER?.split('.')[1] ?? 'npmirpgebvdxuxtlybkz'}.supabase.co`

const client = new Client({
  host: directHost,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.DB_PASS,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000
})

async function run() {
  await client.connect()
  console.log('Conectado a Supabase PostgreSQL (direct)')

  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  let ok = 0
  let skip = 0
  for (const stmt of statements) {
    try {
      await client.query(stmt)
      ok++
    } catch (e) {
      if (e.message.includes('already exists')) {
        skip++
      } else {
        console.warn('WARN:', e.message.substring(0, 120))
      }
    }
  }

  console.log(`Schema aplicado: ${ok} statements OK, ${skip} ya existían`)
  await client.end()
}

run().catch(e => {
  console.error('ERROR:', e.message)
  process.exit(1)
})
