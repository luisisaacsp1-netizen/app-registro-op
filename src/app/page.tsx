import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { ClipboardList, Truck, Wrench, AlertCircle, FileCheck2 } from 'lucide-react'
import AppShell from '@/components/AppShell'

export const dynamic = 'force-dynamic'

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
    { label: 'OPs por revisar',  value: opsPendientes?.length ?? 0,    icon: FileCheck2,   color: '#f59e0b', href: '/ops' },
    { label: 'Pendientes prod.', value: programaPendientes?.length ?? 0, icon: ClipboardList, color: '#f97316', href: '/programa' },
    { label: 'En proceso',       value: programaEnProceso?.length ?? 0,  icon: Wrench,        color: '#60a5fa', href: '/programa' },
    { label: 'Despachos hoy',    value: despachosHoy?.length ?? 0,       icon: Truck,         color: '#4ade80', href: '/programa' },
  ]

  return (
    <AppShell>
      <div className="p-6 space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>Dashboard</h1>
          <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
            {format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(stat => {
            const Icon = stat.icon
            return (
              <Link key={stat.label} href={stat.href}>
                <div
                  className="rounded-lg p-4 flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.02]"
                  style={{ background: '#1a2235', border: '1px solid #2a3552' }}
                >
                  <div className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ width: 38, height: 38, background: `${stat.color}18` }}>
                    <Icon size={19} style={{ color: stat.color }} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>{stat.value}</div>
                    <div className="text-xs" style={{ color: '#64748b' }}>{stat.label}</div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* OPs pendientes de revisión */}
        {(opsPendientes?.length ?? 0) > 0 && (
          <div className="rounded-lg overflow-hidden" style={{ background: '#1a2235', border: '1px solid #2a3552' }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: '#2a3552' }}>
              <AlertCircle size={15} style={{ color: '#f59e0b' }} />
              <span className="text-sm font-semibold" style={{ color: '#fbbf24' }}>OPs pendientes de revisión</span>
            </div>
            <div className="divide-y" style={{ borderColor: '#2a3552' }}>
              {opsPendientes!.map(op => (
                <Link key={op.id} href={`/ops/${op.id}`}
                  className="flex items-center justify-between px-4 py-3 transition-colors"
                  style={{ color: '#e2e8f0' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#243056' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <div>
                    <span className="font-semibold text-sm">OP {op.numero_op}</span>
                    <span className="text-xs ml-3" style={{ color: '#94a3b8' }}>{op.cliente_nombre}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{ background: '#232e45', color: '#94a3b8' }}>{op.tipo_op}</span>
                    <span className="text-xs" style={{ color: '#64748b' }}>
                      {new Date(op.created_at).toLocaleDateString('es-CL')}
                    </span>
                    <span className="text-xs font-medium" style={{ color: '#60a5fa' }}>Revisar →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Despachos hoy */}
        <div className="rounded-lg overflow-hidden" style={{ background: '#1a2235', border: '1px solid #2a3552' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: '#2a3552' }}>
            <span className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
              Despachos / Entregas hoy — {format(new Date(), 'dd-MM-yyyy')}
            </span>
          </div>
          <div className="p-4">
            {!despachosHoy?.length ? (
              <p className="text-sm" style={{ color: '#64748b' }}>No hay despachos programados para hoy.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2a3552' }}>
                      {['OP', 'Cliente', 'Modelo / Serie', 'Descripción', 'Ejecuta'].map(h => (
                        <th key={h} className="text-left pb-2 pr-4 font-semibold uppercase tracking-wide"
                          style={{ color: '#64748b', fontSize: 10 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {despachosHoy.map(row => (
                      <tr key={row.id} style={{ borderBottom: '1px solid #1e2d4a' }}
                        className="transition-colors hover:bg-[#232e45]">
                        <td className="py-2 pr-4 font-mono font-bold text-xs" style={{ color: '#60a5fa' }}>{row.op_pv}</td>
                        <td className="py-2 pr-4" style={{ color: '#e2e8f0' }}>{row.cliente}</td>
                        <td className="py-2 pr-4" style={{ color: '#94a3b8' }}>{row.modelo} {row.serie && `· ${row.serie}`}</td>
                        <td className="py-2 pr-4 max-w-xs truncate" style={{ color: '#94a3b8' }}>{row.descripcion}</td>
                        <td className="py-2" style={{ color: '#94a3b8' }}>{row.ejecuta ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3">
          <Link href="/ops/nueva"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors"
            style={{ background: '#1558a0', color: '#fff' }}>
            <ClipboardList size={15} /> Ingresar OP
          </Link>
          <Link href="/programa"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{ background: '#232e45', color: '#94a3b8', border: '1px solid #2a3552' }}>
            Ver Programa
          </Link>
        </div>

      </div>
    </AppShell>
  )
}
