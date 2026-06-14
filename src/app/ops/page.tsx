import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE:     'bg-yellow-100 text-yellow-800',
  APROBADA:      'bg-green-100 text-green-800',
  RECHAZADA:     'bg-red-100 text-red-800',
  EN_PRODUCCION: 'bg-blue-100 text-blue-800',
  COMPLETADA:    'bg-gray-100 text-gray-700',
}

export default async function OpsPage() {
  const supabase = await createClient()
  const { data: roleData } = await supabase.from('user_roles').select('role').single()
  const role = roleData?.role ?? 'terreno'

  const { data: ops } = await supabase
    .from('ordenes_produccion')
    .select('id, numero_op, numero_nv, tipo_op, cliente_nombre, vendedor, estado, fecha_entrega, created_at')
    .order('created_at', { ascending: false })

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Órdenes de Producción</h1>
            <p className="text-sm text-gray-500 mt-0.5">Revisión y aprobación de OPs recibidas</p>
          </div>
          {['ot','admin'].includes(role) && (
            <Link href="/ops/nueva">
              <Button className="bg-blue-700 hover:bg-blue-800 gap-2">
                <Plus size={16} /> Nueva OP
              </Button>
            </Link>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-600">OP</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">NV</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Cliente</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Vendedor</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">F. Entrega</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {(ops ?? []).map(op => (
                <tr key={op.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-blue-700">{op.numero_op}</td>
                  <td className="px-4 py-3 text-gray-600">{op.numero_nv ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {op.tipo_op}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 max-w-[200px] truncate">{op.cliente_nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{op.vendedor ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {op.fecha_entrega
                      ? new Date(op.fecha_entrega + 'T12:00:00').toLocaleDateString('es-CL')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${ESTADO_COLORS[op.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                      {op.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/ops/${op.id}`} className="text-blue-600 hover:underline text-xs font-medium">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
              {(ops ?? []).length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    No hay órdenes de producción registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
