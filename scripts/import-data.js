const { createClient } = require('@supabase/supabase-js')
const ExcelJS = require('exceljs')
const path = require('path')
const fs = require('fs')

const envPath = path.join(__dirname, '..', '.env.local')
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=')
  if (k && v.length) process.env[k.trim()] = v.join('=').trim()
})

const EXCEL = 'C:\\Users\\Produccion\\Desktop\\Oficina Tecnica\\Precios\\Nuevo Reporte Costos\\Mayo\\Mayo 2\\bases de datos\\PROGRAMA UNIFICADA DE PRODUCCION 2026.xlsm'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function toDate(v) {
  if (!v) return null
  if (v instanceof Date) return v.toISOString().split('T')[0]
  return null
}

function toStr(v) {
  if (v === null || v === undefined) return null
  return String(v).trim() || null
}

async function importPrograma(wb) {
  const ws = wb.getWorksheet('Programa')
  const rows = []

  ws.eachRow((row, rowNum) => {
    if (rowNum <= 6) return
    const vals = row.values // 1-indexed
    const op = vals[1]
    if (!op) return

    rows.push({
      op_pv: toStr(op),
      nv: toStr(vals[2]),
      tipo: toStr(vals[3]) ?? 'VENTA',
      vendedor: toStr(vals[4]),
      cliente: toStr(vals[6]) ?? '-',
      modelo: toStr(vals[7]),
      serie: toStr(vals[8]),
      descripcion: toStr(vals[9]),
      requiere_montaje: toStr(vals[10]) === 'SI',
      fecha_ingreso: toDate(vals[11]?.result ?? vals[11]),
      fecha_despacho: toDate(vals[12]?.result ?? vals[12]),
      fecha_reprograma: toDate(vals[13]?.result ?? vals[13]),
      ejecuta: toStr(vals[16]),
      fecha_inicio: toDate(vals[17]?.result ?? vals[17]),
      fecha_termino: toDate(vals[18]?.result ?? vals[18]),
      estado: toStr(vals[22]) ?? 'PENDIENTE',
    })
  })

  console.log(`Programa: ${rows.length} filas a importar`)

  // Insert in batches of 200
  let ok = 0
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200)
    const { error } = await supabase.from('programa_produccion').insert(batch)
    if (error) {
      console.error(`Batch ${i}-${i+200} error:`, error.message.slice(0, 120))
    } else {
      ok += batch.length
      process.stdout.write(`\r  Insertadas: ${ok}/${rows.length}`)
    }
  }
  console.log(`\nPrograma OK: ${ok} filas`)
  return ok
}

async function importOF(wb) {
  const ws = wb.getWorksheet('OF')
  const rows = []

  ws.eachRow((row, rowNum) => {
    if (rowNum <= 1) return
    const vals = row.values // 1-indexed
    if (!vals[5] && !vals[8]) return // sin OP ni OF número

    rows.push({
      op_pv: toStr(vals[5]),
      nv: toStr(vals[6]),
      serie: toStr(vals[7]),
      fecha_liberacion: toDate(vals[9]?.result ?? vals[9]),
      estado_of: toStr(vals[10]) ?? 'Planificada',
      observacion: toStr(vals[11]),
      modalidad: toStr(vals[12]),
      tipo_trabajo: toStr(vals[13]),
      accion_requerida: toStr(vals[1]),
      status_ejecucion: toStr(vals[2]),
      plano_estado: toStr(vals[3]),
      ot_estado: toStr(vals[4]),
      descripcion: toStr(vals[14]),
    })
  })

  console.log(`OF: ${rows.length} filas a importar`)

  let ok = 0
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200)
    const { error } = await supabase.from('ordenes_fabricacion').insert(batch)
    if (error) {
      console.error(`OF Batch error:`, error.message.slice(0, 120))
    } else {
      ok += batch.length
    }
  }
  console.log(`OF OK: ${ok} filas`)
}

async function main() {
  console.log('Cargando Excel...')
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(EXCEL)
  console.log('Hojas:', wb.worksheets.map(w => w.name).join(', '))

  await importPrograma(wb)
  await importOF(wb)
  console.log('\nImportación completa.')
}

main().catch(console.error)
