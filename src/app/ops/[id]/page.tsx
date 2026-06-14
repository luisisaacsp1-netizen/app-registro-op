import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import AppShell from '@/components/AppShell'
import AccionesOP from './AccionesOP'

export const dynamic = 'force-dynamic'

export default async function DetalleOPPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: roleData } = await supabase.from('user_roles').select('role').single()
  const role = roleData?.role ?? 'terreno'

  const { data: op } = await supabase
    .from('ordenes_produccion')
    .select('*, op_series(*), op_adicionales(*)')
    .eq('id', id)
    .single()

  if (!op) notFound()

  const puedeRevisar = ['ot','admin'].includes(role) && op.estado === 'PENDIENTE'

  const ESTADO_COLORS: Record<string, string> = {
    PENDIENTE:     'bg-yellow-100 text-yellow-800 border-yellow-200',
    APROBADA:      'bg-green-100 text-green-800 border-green-200',
    RECHAZADA:     'bg-red-100 text-red-800 border-red-200',
    EN_PRODUCCION: 'bg-blue-100 text-blue-800 border-blue-200',
    COMPLETADA:    'bg-gray-100 text-gray-700 border-gray-200',
  }

  return (
    <AppShell>
      <div className="p-6 max-w-4xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">OP {op.numero_op}</h1>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${ESTADO_COLORS[op.estado] ?? ''}`}>
                {op.estado}
              </span>
            </div>
            <p className="text-sm text-gray-500">{op.tipo_op} — {op.cliente_nombre}</p>
          </div>
        </div>

        {/* Datos generales */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos generales</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div><span className="text-gray-500">NV:</span> <span className="font-medium">{op.numero_nv ?? '—'}</span></div>
            <div><span className="text-gray-500">Vendedor:</span> <span className="font-medium">{op.vendedor ?? '—'}</span></div>
            <div><span className="text-gray-500">Modelo:</span> <span className="font-medium">{op.modelo ?? '—'}</span></div>
            <div><span className="text-gray-500">Distribución:</span> <span className="font-medium">{op.distribucion ?? '—'}</span></div>
            {op.fecha_entrega && (
              <div><span className="text-gray-500">F. Entrega:</span> <span className="font-medium">
                {new Date(op.fecha_entrega + 'T12:00:00').toLocaleDateString('es-CL')}
              </span></div>
            )}
            {op.direccion_entrega && (
              <div className="col-span-2"><span className="text-gray-500">Dirección:</span> <span className="font-medium">{op.direccion_entrega}</span></div>
            )}
            {op.contacto_nombre && (
              <div><span className="text-gray-500">Contacto:</span> <span className="font-medium">{op.contacto_nombre}</span></div>
            )}
            {op.contacto_telefono && (
              <div><span className="text-gray-500">Teléfono:</span> <span className="font-medium">{op.contacto_telefono}</span></div>
            )}
          </div>
        </div>

        {/* Series */}
        {op.op_series?.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Series / Contenedores ({op.op_series.length})
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-2 text-gray-500 font-medium">Serie</th>
                  <th className="text-left pb-2 text-gray-500 font-medium">Modelo</th>
                  <th className="text-left pb-2 text-gray-500 font-medium">Descripción del trabajo</th>
                </tr>
              </thead>
              <tbody>
                {op.op_series.map((s: any) => (
                  <tr key={s.id} className="border-b border-gray-50">
                    <td className="py-2 font-medium">{s.serie || '—'}</td>
                    <td className="py-2 text-gray-600">{s.modelo || '—'}</td>
                    <td className="py-2 text-gray-700">{s.descripcion_trabajo || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Adicionales */}
        {op.op_adicionales?.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Adicionales ({op.op_adicionales.length})
            </h2>
            <div className="space-y-1">
              {op.op_adicionales.map((a: any) => (
                <div key={a.id} className="flex gap-3 text-sm">
                  <span className="text-gray-500 w-8">{a.cantidad}×</span>
                  <span>{a.descripcion_corta}</span>
                  {a.serie_ref && <span className="text-gray-400 text-xs">({a.serie_ref})</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado rechazo */}
        {op.estado === 'RECHAZADA' && op.observaciones_ot && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h2 className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Motivo de rechazo</h2>
            <p className="text-sm text-red-800">{op.observaciones_ot}</p>
          </div>
        )}

        {/* Acciones OT */}
        {puedeRevisar && <AccionesOP opId={op.id} numeroOp={op.numero_op} />}
      </div>
    </AppShell>
  )
}
