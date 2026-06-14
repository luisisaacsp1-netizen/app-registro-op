import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ClipboardList, Truck, Wrench, AlertCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const hoy = format(new Date(), 'yyyy-MM-dd')

  const [{ data: pendientes }, { data: enProceso }, { data: despachosHoy }, { data: pendientesOf }] =
    await Promise.all([
      supabase.from('programa_produccion').select('id').eq('estado', 'PENDIENTE'),
      supabase.from('programa_produccion').select('id').eq('estado', 'EN_PROCESO'),
      supabase.from('programa_produccion').select('id, op_pv, cliente, modelo, serie, descripcion, ejecuta')
        .or(`fecha_despacho.eq.${hoy},fecha_termino.eq.${hoy}`)
        .in('estado', ['EN_PROCESO', 'COORDINADO', 'PENDIENTE']),
      supabase.from('programa_produccion').select('id').eq('genera_of', true).is('of_id', null),
    ])

  const stats = [
    { label: 'Pendientes', value: pendientes?.length ?? 0, icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'En Proceso', value: enProceso?.length ?? 0, icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Despachos Hoy', value: despachosHoy?.length ?? 0, icon: Truck, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'OF Pendientes', value: pendientesOf?.length ?? 0, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
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
            <Card key={stat.label}>
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
          )
        })}
      </div>

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
        <Link href="/ingreso" className="inline-flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-800 transition-colors">
          <ClipboardList size={16} />
          Ingresar OP
        </Link>
        <Link href="/programa" className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
          Ver Programa
        </Link>
      </div>
    </div>
  )
}
