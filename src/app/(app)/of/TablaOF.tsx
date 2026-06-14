'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { OrdenFabricacion } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Search, Pencil } from 'lucide-react'

const ESTADOS_OF = ['Planificada', 'Liberada', 'Cerrada']
const PLANO_ESTADOS = ['OK', 'Pendiente', 'EN PROCESO', 'NA']
const STATUS_EJECUCION = ['EN PROCESO', 'EJECUTADA']

const ESTADO_COLORS: Record<string, string> = {
  Planificada: 'bg-yellow-100 text-yellow-800',
  Liberada:    'bg-blue-100 text-blue-800',
  Cerrada:     'bg-gray-100 text-gray-600',
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  const [y, m, dia] = d.split('-')
  return `${dia}-${m}-${y}`
}

interface Props {
  rows: OrdenFabricacion[]
  role: string
}

export default function TablaOF({ rows: initialRows, role }: Props) {
  const supabase = createClient()
  const [rows, setRows] = useState<OrdenFabricacion[]>(initialRows)
  const [search, setSearch] = useState('')
  const [editRow, setEditRow] = useState<OrdenFabricacion | null>(null)
  const [saving, setSaving] = useState(false)

  const esOT = role === 'ot' || role === 'admin'

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return rows
    return rows.filter(r =>
      [r.op_pv, r.nv, r.serie, r.descripcion, r.tipo_objeto, r.status_ejecucion]
        .some(v => v?.toLowerCase().includes(q))
    )
  }, [rows, search])

  async function handleSave() {
    if (!editRow) return
    setSaving(true)
    try {
      const { error } = await supabase.from('ordenes_fabricacion').update({
        estado_of: editRow.estado_of,
        modalidad: editRow.modalidad,
        tipo_trabajo: editRow.tipo_trabajo,
        tipo_objeto: editRow.tipo_objeto,
        descripcion: editRow.descripcion,
        plano_estado: editRow.plano_estado,
        ot_estado: editRow.ot_estado,
        accion_requerida: editRow.accion_requerida,
        status_ejecucion: editRow.status_ejecucion,
        observacion: editRow.observacion,
        serie: editRow.serie,
      }).eq('id', editRow.id)

      if (error) throw error
      setRows(prev => prev.map(r => r.id === editRow.id ? { ...r, ...editRow } : r))
      toast.success('OF actualizada')
      setEditRow(null)
    } catch (err: any) {
      toast.error(err.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          <Input placeholder="Buscar OF, OP, NV, serie..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">OF#</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">OP</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">NV</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Serie</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">F. Liberación</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Estado</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Modalidad</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Tipo Trabajo</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Tipo Objeto</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 min-w-[200px]">Descripción</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Plano</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">OT</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Acción</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={15} className="py-8 text-center text-gray-400">Sin registros</td></tr>
            ) : filtered.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-mono font-bold text-gray-800">{row.of_numero}</td>
                <td className="px-3 py-2 text-blue-700 font-semibold">{row.op_pv ?? '—'}</td>
                <td className="px-3 py-2 text-gray-600">{row.nv ?? '—'}</td>
                <td className="px-3 py-2 font-mono text-xs">{row.serie ?? '—'}</td>
                <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{fmtDate(row.fecha_liberacion)}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className={cn('text-xs px-2 py-0.5 rounded font-medium', ESTADO_COLORS[row.estado_of] ?? 'bg-gray-100 text-gray-600')}>
                    {row.estado_of}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-600">{row.modalidad ?? '—'}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{row.tipo_trabajo ?? '—'}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{row.tipo_objeto ?? '—'}</td>
                <td className="px-3 py-2 text-xs text-gray-600 max-w-[220px]">
                  <span className="line-clamp-2">{row.descripcion ?? '—'}</span>
                </td>
                <td className="px-3 py-2 text-xs">
                  <span className={cn('px-1.5 py-0.5 rounded', row.plano_estado === 'OK' ? 'bg-green-100 text-green-700' : row.plano_estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-400')}>
                    {row.plano_estado ?? '—'}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs">
                  <span className={cn('px-1.5 py-0.5 rounded', row.ot_estado === 'OK' ? 'bg-green-100 text-green-700' : row.ot_estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-400')}>
                    {row.ot_estado ?? '—'}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-600">{row.accion_requerida ?? '—'}</td>
                <td className="px-3 py-2 text-xs">
                  {row.status_ejecucion && (
                    <span className={cn('px-1.5 py-0.5 rounded font-medium', row.status_ejecucion === 'EJECUTADA' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700')}>
                      {row.status_ejecucion}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {esOT && (
                    <button onClick={() => setEditRow({ ...row })} className="text-gray-400 hover:text-blue-600">
                      <Pencil size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editRow} onOpenChange={open => !open && setEditRow(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar OF #{editRow?.of_numero}</DialogTitle>
          </DialogHeader>
          {editRow && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Serie</Label>
                  <Input value={editRow.serie ?? ''} onChange={e => setEditRow({ ...editRow, serie: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Estado OF</Label>
                  <Select value={editRow.estado_of} onValueChange={v => v && setEditRow({ ...editRow, estado_of: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ESTADOS_OF.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Estado Plano</Label>
                  <Select value={editRow.plano_estado ?? ''} onValueChange={v => setEditRow({ ...editRow, plano_estado: v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{PLANO_ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Estado OT</Label>
                  <Select value={editRow.ot_estado ?? ''} onValueChange={v => setEditRow({ ...editRow, ot_estado: v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{PLANO_ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Status Ejecución</Label>
                  <Select value={editRow.status_ejecucion ?? ''} onValueChange={v => setEditRow({ ...editRow, status_ejecucion: v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{STATUS_EJECUCION.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>F. Liberación</Label>
                  <Input type="date" value={editRow.fecha_liberacion ?? ''} onChange={e => setEditRow({ ...editRow, fecha_liberacion: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Descripción</Label>
                  <Textarea value={editRow.descripcion ?? ''} onChange={e => setEditRow({ ...editRow, descripcion: e.target.value })} rows={2} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Acción Requerida</Label>
                  <Input value={editRow.accion_requerida ?? ''} onChange={e => setEditRow({ ...editRow, accion_requerida: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Observación</Label>
                  <Textarea value={editRow.observacion ?? ''} onChange={e => setEditRow({ ...editRow, observacion: e.target.value })} rows={2} />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSave} disabled={saving} className="bg-blue-700 hover:bg-blue-800">
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button variant="outline" onClick={() => setEditRow(null)}>Cancelar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
