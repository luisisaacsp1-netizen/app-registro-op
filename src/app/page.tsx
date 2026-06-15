import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { ClipboardList, Truck, Wrench, AlertCircle, FileCheck2 } from 'lucide-react'
import AppShell from '@/components/AppShell'

export const dynamic = 'force-dynamic'

// Estilos inline reutilizables (mismo patrón que app de referencia)
const card: React.CSSProperties = {
  background: '#fff', borderRadius: 8, border: '1px solid #d4dae6',
  padding: '13px 15px', boxShadow: '0 2px 12px rgba(13,27,46,.10)',
}
const cardTitle: React.CSSProperties = {
  fontFamily: 'Montserrat, sans-serif', fontSize: 9, fontWeight: 700,
  color: '#637388', letterSpacing: '1.2px', textTransform: 'uppercase',
  paddingBottom: 11, borderBottom: '1px solid #d4dae6', marginBottom: 13,
  display: 'flex', alignItems: 'center', gap: 6,
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const hoy = format(new Date(), 'yyyy-MM-dd')

  const [
    { data: opsPendientes },
    { data: programaPendientes },
    { data: programaEnProceso },
    { data: despachosHoy },
  ] = await Promise.all([
    supabase.from('ordenes_produccion').select('id, numero_op, cliente_nombre, tipo_op, created_at')
      .eq('estado', 'PENDIENTE').order('created_at', { ascending: false }).limit(5),
    supabase.from('programa_produccion').select('id').eq('estado', 'PENDIENTE'),
    supabase.from('programa_produccion').select('id').eq('estado', 'EN_PROCESO'),
    supabase.from('programa_produccion').select('id, op_pv, cliente, modelo, serie, descripcion, ejecuta')
      .or(`fecha_despacho.eq.${hoy},fecha_termino.eq.${hoy}`)
      .in('estado', ['EN_PROCESO', 'COORDINADO', 'PENDIENTE']),
  ])

  const stats = [
    { label: 'OPs por revisar',  value: opsPendientes?.length ?? 0,     color: '#c97a00', bg: '#fff3cd', href: '/ops' },
    { label: 'Pendientes prod.', value: programaPendientes?.length ?? 0, color: '#c97a00', bg: '#fff3cd', href: '/programa' },
    { label: 'En proceso',       value: programaEnProceso?.length ?? 0,  color: '#0d1b2e', bg: '#e8edf5', href: '/programa' },
    { label: 'Despachos hoy',    value: despachosHoy?.length ?? 0,       color: '#1a7a4a', bg: '#d4edda', href: '/programa' },
  ]

  return (
    <AppShell>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 20px 50px' }}>

        {/* Page header */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 700, color: '#0d1b2e', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 4, height: 16, background: '#e63329', borderRadius: 2, flexShrink: 0, display: 'inline-block' }} />
            Dashboard
          </div>
          <p style={{ fontSize: 11, color: '#637388', marginTop: 3, paddingLeft: 12 }}>
            {format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
          {stats.map(stat => (
            <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
              <div style={{ ...card, cursor: 'pointer', transition: 'all .2s' }}
                className="kpi-hover">
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 22, fontWeight: 700, color: '#0d1b2e', lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 10, color: '#637388', marginTop: 4 }}>{stat.label}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* OPs pendientes de revisión */}
        {(opsPendientes?.length ?? 0) > 0 && (
          <div style={{ ...card, marginBottom: 12, padding: 0, overflow: 'hidden' }}>
            <div style={{ ...cardTitle, margin: 0, padding: '10px 16px', borderBottom: '1px solid #d4dae6' }}>
              <span style={{ width: 5, height: 5, background: '#e63329', borderRadius: '50%', flexShrink: 0, display: 'inline-block' }} />
              <AlertCircle size={12} style={{ color: '#c97a00' }} />
              OPs pendientes de revisión
            </div>
            <div>
              {opsPendientes!.map((op, idx) => (
                <Link key={op.id} href={`/ops/${op.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 16px',
                    borderBottom: idx < opsPendientes!.length - 1 ? '1px solid #d4dae6' : 'none',
                    background: '#fff', transition: 'background .12s', textDecoration: 'none',
                    color: '#1a2535',
                  }}
                  className="row-hover"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontFamily: 'Montserrat, sans-serif', fontSize: 9, fontWeight: 700,
                      background: '#0d1b2e', color: '#fff', padding: '2px 6px', borderRadius: 3,
                    }}>OP {op.numero_op}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#1a2535' }}>{op.cliente_nombre}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, fontWeight: 700, background: '#fff3cd', color: '#856404', padding: '2px 6px', borderRadius: 4 }}>{op.tipo_op}</span>
                    <span style={{ fontSize: 10, color: '#637388' }}>{new Date(op.created_at).toLocaleDateString('es-CL')}</span>
                    <span style={{ fontSize: 10, color: '#e63329', fontWeight: 700 }}>Revisar →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Despachos hoy */}
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{ ...cardTitle, margin: 0, padding: '10px 16px', borderBottom: '1px solid #d4dae6' }}>
            <span style={{ width: 5, height: 5, background: '#e63329', borderRadius: '50%', flexShrink: 0, display: 'inline-block' }} />
            Despachos / Entregas hoy — {format(new Date(), 'dd-MM-yyyy')}
          </div>
          <div style={{ padding: '12px 16px' }}>
            {!despachosHoy?.length ? (
              <p style={{ fontSize: 12, color: '#637388' }}>No hay despachos programados para hoy.</p>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #d4dae6' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr>
                      {['OP', 'Cliente', 'Modelo / Serie', 'Descripción', 'Ejecuta'].map(h => (
                        <th key={h} style={{
                          background: '#0d1b2e', color: '#fff', padding: '7px 9px',
                          textAlign: 'left', fontFamily: 'Montserrat, sans-serif',
                          fontSize: 9, fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {despachosHoy.map((row, i) => (
                      <tr key={row.id} style={{ background: i % 2 === 1 ? '#f8f9fc' : '#fff' }}
                        className="row-hover">
                        <td style={{ padding: '7px 9px', borderBottom: '1px solid #d4dae6', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 11, color: '#0d1b2e' }}>{row.op_pv}</td>
                        <td style={{ padding: '7px 9px', borderBottom: '1px solid #d4dae6' }}>{row.cliente}</td>
                        <td style={{ padding: '7px 9px', borderBottom: '1px solid #d4dae6', color: '#637388' }}>{row.modelo}{row.serie && ` · ${row.serie}`}</td>
                        <td style={{ padding: '7px 9px', borderBottom: '1px solid #d4dae6', color: '#637388', maxWidth: 240 }} className="truncate">{row.descripcion}</td>
                        <td style={{ padding: '7px 9px', borderBottom: '1px solid #d4dae6', color: '#637388' }}>{row.ejecuta ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <Link href="/ops/nueva" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 16px', background: '#0d1b2e', color: '#fff',
              border: 'none', borderRadius: 6,
              fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700,
              letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer',
            }}>
              <span style={{ width: 3, height: 10, background: '#e63329', borderRadius: 2 }} />
              <ClipboardList size={13} />
              Ingresar OP
            </button>
          </Link>
          <Link href="/programa" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 16px', background: 'transparent', color: '#0d1b2e',
              border: '1.5px solid #d4dae6', borderRadius: 6,
              fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700,
              letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer',
            }}>
              Ver Programa
            </button>
          </Link>
        </div>

      </div>

      <style>{`
        .kpi-hover:hover { border-color: #0d1b2e !important; box-shadow: 0 4px 24px rgba(13,27,46,.15) !important; transform: translateY(-2px); }
        .row-hover:hover td, .row-hover:hover { background: #edf1f8 !important; }
      `}</style>
    </AppShell>
  )
}
