const fs = require('fs')
const path = require('path')
const https = require('https')

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local')
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=')
  if (k && v.length) process.env[k.trim()] = v.join('=').trim()
})

const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase_schema.sql'), 'utf8')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const PROJECT_REF = SUPABASE_URL.replace('https://', '').split('.')[0]

async function runSQL(query) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`
  const body = JSON.stringify({ sql: query })

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// Alternative: use pg-meta query endpoint
async function runSQLviaQuery(query) {
  const url = `${SUPABASE_URL}/pg/query`
  const body = JSON.stringify({ query })

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve({ status: res.statusCode, body: data.slice(0, 200) }))
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function main() {
  console.log('PROJECT_REF:', PROJECT_REF)

  // Test simple query first
  const test = await runSQLviaQuery('SELECT 1 as test')
  console.log('Test result:', JSON.stringify(test))

  if (test.status === 200) {
    console.log('pg/query endpoint works! Running schema...')
    const result = await runSQLviaQuery(sql)
    console.log('Schema result:', JSON.stringify(result))
  } else {
    console.log('pg/query failed, trying rpc/exec_sql...')
    const result = await runSQL('SELECT 1')
    console.log('rpc result:', JSON.stringify(result))
  }
}

main().catch(console.error)
