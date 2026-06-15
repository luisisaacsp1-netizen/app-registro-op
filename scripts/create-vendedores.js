const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

const envPath = path.join(__dirname, '..', '.env.local')
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=')
  if (k && v.length) process.env[k.trim()] = v.join('=').trim()
})

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const vendedores = [
  { nombre: 'Brezzy Soto',        email: 'ventas1@conpatagonia.cl' },
  { nombre: 'Juan Orellana',      email: 'ventas7@conpatagonia.cl' },
  { nombre: 'Debora Riquelme',    email: 'ventas6@conpatagonia.cl' },
  { nombre: 'Javiera Robles',     email: 'ventas8@conpatagonia.cl' },
  { nombre: 'Monica Estay',       email: 'ventas9@conpatagonia.cl' },
  { nombre: 'Carolina Peña',      email: 'asistentecomercial@conpatagonia.cl' },
  { nombre: 'Suleika Vera',       email: 'gerencia@conpatagonia.cl' },
  { nombre: 'Michael Roman',      email: 'ventas4@conpatagonia.cl' },
  { nombre: 'Thania Villalobos',  email: 'ventas5@conpatagonia.cl' },
  { nombre: 'Vanessa Le-Quesne', email: 'GerenteProduccion@conpatagonia.cl' },
]

async function main() {
  for (const v of vendedores) {
    const { data, error } = await s.auth.admin.createUser({
      email: v.email,
      password: 'Patagonia2026!',
      email_confirm: true,
      user_metadata: { nombre_completo: v.nombre }
    })

    if (error) {
      console.log(`❌ ${v.nombre} (${v.email}): ${error.message}`)
      continue
    }

    const { error: e2 } = await s.from('user_roles').insert({
      user_id: data.user.id,
      role: 'ventas'
    })

    if (e2) console.log(`⚠️  ${v.nombre}: usuario creado pero rol falló: ${e2.message}`)
    else console.log(`✅ ${v.nombre} (${v.email}) — rol ventas OK`)
  }
}

main().catch(console.error)
