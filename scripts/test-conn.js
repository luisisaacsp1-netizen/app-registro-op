const { Client } = require('pg')
const path = require('path')
const fs = require('fs')

const envPath = path.join(__dirname, '..', '.env.local')
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=')
  if (k && v.length) process.env[k.trim()] = v.join('=').trim()
})

const configs = [
  // Session mode pooler
  { host: 'aws-0-sa-east-1.pooler.supabase.com', port: 5432, user: process.env.DB_USER, label: 'pooler-session' },
  // Transaction mode pooler
  { host: 'aws-0-sa-east-1.pooler.supabase.com', port: 6543, user: process.env.DB_USER, label: 'pooler-tx' },
  // Direct host
  { host: `db.npmirpgebvdxuxtlybkz.supabase.co`, port: 5432, user: 'postgres', label: 'direct' },
]

async function tryConn(cfg) {
  const c = new Client({ ...cfg, database: 'postgres', password: process.env.DB_PASS, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 })
  try {
    await c.connect()
    const r = await c.query('SELECT current_database()')
    console.log(`✅ ${cfg.label}: connected! DB=${r.rows[0].current_database}`)
    await c.end()
    return true
  } catch (e) {
    console.log(`❌ ${cfg.label}: ${e.message.slice(0, 80)}`)
    return false
  }
}

async function main() {
  for (const cfg of configs) {
    const ok = await tryConn(cfg)
    if (ok) {
      console.log(`\nUse ${cfg.label} for schema execution`)
      break
    }
  }
}
main()
