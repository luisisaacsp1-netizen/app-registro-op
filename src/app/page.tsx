import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    { label: 'OPs por revisar', value: opsPendientes?.length ?? 0, icon: FileCheck2, color: 'text-yellow-600', bg: 'bg-yellow-50', href: '/ops' },
    { label: 'Pendientes prod.', value: programaPendientes?.length ?? 0, icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50', href: '/programa' },
    { label: 'En proceso', value: programaEnProceso?.length ?? 0, icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50', href: '/programa' },
    { label: 'Despachos hoy', value: despachosHoy?.length ?? 0, icon: Truck, color: 'text-green-600', bg: 'bg-green-50', href: '/programa' },
  ]

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(stat => {
            const Icon = stat.icon
            return (
              <Link key={stat.label} href={stat.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${stat.bg}`}>
                        <Icon size={20} className={stat.color} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-xs text-gray-500">{stat.label}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* OPs pendientes de revisión */}
        {(opsPendientes?.length ?? 0) > 0 && (
          <Card className="border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-yellow-800 flex items-center gap-2">
                <AlertCircle size={16} />
                OPs pendientes de revisión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {opsPendientes!.map(op => (
                  <Link key={op.id} href={`/ops/${op.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors">
                    <div>
                      <span className="font-semibold text-gray-900">OP {op.numero_op}</span>
                      <span className="text-gray-500 text-sm ml-3">{op.cliente_nombre}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{op.tipo_op}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(op.created_at).toLocaleDateString('es-CL')}
                      </span>
                      <span className="text-blue-600 text-xs font-medium">Revisar →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Despachos hoy */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Despachos / Entregas Hoy — {format(new Date(), 'dd-MM-yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!despachosHoy?.length ? (
              <p className="text-sm text-gray-400">No hay despachos programados para hoy.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-gray-500 text-xs uppercase">
                      <th className="text-left pb-2 pr-4 font-medium">OP</th>
                      <th className="text-left pb-2 pr-4 font-medium">Cliente</th>
                      <th className="text-left pb-2 pr-4 font-medium">Modelo / Serie</th>
                      <th className="text-left pb-2 pr-4 font-medium">Descripción</th>
                      <th className="text-left pb-2 font-medium">Ejecuta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {despachosHoy.map(row => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="py-2 pr-4 font-mono font-semibold text-blue-800">{row.op_pv}</td>
                        <td className="py-2 pr-4 text-gray-700">{row.cliente}</td>
                        <td className="py-2 pr-4 text-gray-600">{row.modelo} {row.serie && `· ${row.serie}`}</td>
                        <td className="py-2 pr-4 text-gray-600 max-w-xs truncate">{row.descripcion}</td>
                        <td className="py-2 text-gray-600">{row.ejecuta ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link href="/ops/nueva" className="inline-flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-800 transition-colors">
            <ClipboardList size={16} />
            Ingresar OP
          </Link>
          <Link href="/programa" className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
            Ver Programa
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
