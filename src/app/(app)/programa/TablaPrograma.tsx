'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ProgramaRow } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Search, Pencil, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

const ESTADOS = ['PENDIENTE', 'EN_PROCESO', 'COORDINADO', 'DESPACHADO', 'REALIZADO', 'SIN_EFECTO']
const TIPOS = ['ARRIENDO', 'VENTA', 'MONTAJE', 'INTERNO']

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  EN_PROCESO:  'bg-blue-100 text-blue-800 border-blue-200',
  COORDINADO:  'bg-purple-100 text-purple-800 border-purple-200',
  DESPACHADO:  'bg-green-100 text-green-800 border-green-200',
  REALIZADO:   'bg-green-100 text-green-800 border-green-200',
  SIN_EFECTO:  'bg-gray-100 text-gray-500 border-gray-200',
}

interface Props {
  rows: ProgramaRow[]
  role: string
  responsables: string[]
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  const [y, m, dia] = d.split('-')
  return `${dia}-${m}-${y}`
}

export default function TablaPrograma({ rows: initialRows, role, responsables }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [rows, setRows] = useState<ProgramaRow[]>(initialRows)
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('TODOS')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [editRow, setEditRow] = useState<ProgramaRow | null>(null)
  const [saving, setSaving] = useState(false)

  const esOT = role === 'ot' || role === 'admin'
  const esTerreno = role === 'terreno' || role === 'admin'

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const q = search.toLowerCase()
      const matchSearch = !q || [r.op_pv, r.nv, r.cliente, r.modelo, r.serie, r.descripcion, r.ejecuta]
        .some(v => v?.toLowerCase().includes(q))
      const matchTipo = filtroTipo === 'TODOS' || r.tipo === filtroTipo
      const matchEstado = filtroEstado === 'TODOS' || r.estado === filtroEstado
      return matchSearch && matchTipo && matchEstado
    })
  }, [rows, search, filtroTipo, filtroEstado])

  async function handleSave() {
    if (!editRow) return
    setSaving(true)
    try {
      const updates: Partial<ProgramaRow> = {}

      if (esOT) {
        updates.op_pv = editRow.op_pv
        updates.nv = editRow.nv
        updates.tipo = editRow.tipo
        updates.vendedor = editRow.vendedor
        updates.cliente = editRow.cliente
        updates.modelo = editRow.modelo
        updates.serie = editRow.serie
        updates.descripcion = editRow.descripcion
        updates.fecha_despacho = editRow.fecha_despacho
        updates.fecha_reprograma = editRow.fecha_reprograma
      }

      if (esTerreno) {
        updates.ejecuta = editRow.ejecuta
        updates.fecha_inicio = editRow.fecha_inicio
        updates.fecha_termino = editRow.fecha_termino
        updates.estado = editRow.estado
        updates.avance_pct = editRow.avance_pct
        updates.observacion = editRow.observacion
      }

      const { error } = await supabase
        .from('programa_produccion')
        .update(updates)
        .eq('id', editRow.id)

      if (error) throw error

      setRows(prev => prev.map(r => r.id === editRow.id ? { ...r, ...updates } : r))
      toast.success('Registro actualizado')
      setEditRow(null)
    } catch (err: any) {
      toast.error(err.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleConvertirOF(row: ProgramaRow) {
    if (row.of_id) { toast.info('Ya tiene OF asociada'); return }
    const { data: of, error } = await supabase
      .from('ordenes_fabricacion')
      .insert({
        programa_id: row.id,
        op_pv: row.op_pv,
        nv: row.nv,
        serie: row.serie,
        descripcion: row.descripcion,
        estado_of: 'Planificada',
        modalidad: 'Nueva',
        tipo_trabajo: 'Productivo',
        tipo_objeto: 'Contenedor',
      })
      .select()
      .single()

    if (error) { toast.error('Error al crear OF'); return }

    await supabase.from('programa_produccion').update({ genera_of: true, of_id: of.id }).eq('id', row.id)
    setRows(prev => prev.map(r => r.id === row.id ? { ...r, genera_of: true, of_id: of.id } : r))
    toast.success(`OF creada para OP ${row.op_pv}`)
    router.refresh()
  }

  return (
    <>
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          <Input
            placeholder="Buscar OP, NV, cliente, serie..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={filtroTipo} onValueChange={v => setFiltroTipo(v ?? 'TODOS')}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos los tipos</SelectItem>
            {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroEstado} onValueChange={v => setFiltroEstado(v ?? 'TODOS')}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos los estados</SelectItem>
            {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Leyenda colores */}
      <div className="flex gap-4 mb-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-300 inline-block" /> Campos OT (azul)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block" /> Campos Terreno (verde)</span>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {/* Azul */}
              <th className="bg-blue-50 text-left px-3 py-2 font-semibold text-blue-800 text-xs whitespace-nowrap">OP / PV</th>
              <th className="bg-blue-50 text-left px-3 py-2 font-semibold text-blue-800 text-xs">NV</th>
              <th className="bg-blue-50 text-left px-3 py-2 font-semibold text-blue-800 text-xs">Tipo</th>
              <th className="bg-blue-50 text-left px-3 py-2 font-semibold text-blue-800 text-xs">Vendedor</th>
              <th className="bg-blue-50 text-left px-3 py-2 font-semibold text-blue-800 text-xs min-w-[180px]">Cliente</th>
              <th className="bg-blue-50 text-left px-3 py-2 font-semibold text-blue-800 text-xs">Modelo</th>
              <th className="bg-blue-50 text-left px-3 py-2 font-semibold text-blue-800 text-xs">Serie</th>
              <th className="bg-blue-50 text-left px-3 py-2 font-semibold text-blue-800 text-xs min-w-[220px]">Descripción</th>
              <th className="bg-blue-50 text-left px-3 py-2 font-semibold text-blue-800 text-xs whitespace-nowrap">F. Ingreso</th>
              <th className="bg-blue-50 text-left px-3 py-2 font-semibold text-blue-800 text-xs whitespace-nowrap">F. Despacho</th>
              {/* Verde */}
              <th className="bg-green-50 text-left px-3 py-2 font-semibold text-green-800 text-xs">Ejecuta</th>
              <th className="bg-green-50 text-left px-3 py-2 font-semibold text-green-800 text-xs whitespace-nowrap">F. Inicio</th>
              <th className="bg-green-50 text-left px-3 py-2 font-semibold text-green-800 text-xs whitespace-nowrap">F. Término</th>
              <th className="bg-green-50 text-left px-3 py-2 font-semibold text-green-800 text-xs">Estado</th>
              <th className="bg-green-50 text-left px-3 py-2 font-semibold text-green-800 text-xs">Avance</th>
              {/* Acciones */}
              <th className="text-left px-3 py-2 font-semibold text-gray-600 text-xs">OF</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-600 text-xs"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={17} className="py-8 text-center text-gray-400 text-sm">Sin registros</td></tr>
            ) : filtered.map(row => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2 font-mono font-semibold text-blue-800 whitespace-nowrap">{row.op_pv}</td>
                <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{row.nv ?? '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="text-xs font-medium text-gray-700">{row.tipo}</span>
                </td>
                <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{row.vendedor ?? '—'}</td>
                <td className="px-3 py-2 text-gray-700 font-medium">{row.cliente}</td>
                <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{row.modelo ?? '—'}</td>
                <td className="px-3 py-2 font-mono text-xs text-gray-600 whitespace-nowrap">{row.serie ?? '—'}</td>
                <td className="px-3 py-2 text-gray-600 max-w-[260px]">
                  <span className="line-clamp-2 text-xs">{row.descripcion ?? '—'}</span>
                </td>
                <td className="px-3 py-2 text-gray-500 whitespace-nowrap text-xs">{fmtDate(row.fecha_ingreso)}</td>
                <td className="px-3 py-2 text-gray-700 font-medium whitespace-nowrap text-xs">{fmtDate(row.fecha_despacho)}</td>
                <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{row.ejecuta ?? '—'}</td>
                <td className="px-3 py-2 text-gray-500 whitespace-nowrap text-xs">{fmtDate(row.fecha_inicio)}</td>
                <td className="px-3 py-2 text-gray-500 whitespace-nowrap text-xs">{fmtDate(row.fecha_termino)}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', ESTADO_COLORS[row.estado] ?? 'bg-gray-100 text-gray-600')}>
                    {row.estado}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${row.avance_pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{row.avance_pct}%</span>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {row.of_id ? (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded border border-orange-200 font-medium">OF</span>
                  ) : esOT ? (
                    <button
                      onClick={() => handleConvertirOF(row)}
                      className="text-xs text-gray-400 hover:text-orange-600 transition-colors"
                      title="Crear OF"
                    >
                      + OF
                    </button>
                  ) : null}
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => setEditRow({ ...row })}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dialog de edición */}
      <Dialog open={!!editRow} onOpenChange={open => !open && setEditRow(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar OP {editRow?.op_pv}</DialogTitle>
          </DialogHeader>

          {editRow && (
            <div className="space-y-5 mt-2">
              {/* Campos azules — solo OT */}
              {esOT && (
                <div>
                  <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-blue-200 inline-block" /> Campos OT
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>OP / PV</Label>
                      <Input value={editRow.op_pv} onChange={e => setEditRow({ ...editRow, op_pv: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>NV</Label>
                      <Input value={editRow.nv ?? ''} onChange={e => setEditRow({ ...editRow, nv: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>Tipo</Label>
                      <Select value={editRow.tipo} onValueChange={v => setEditRow({ ...editRow, tipo: v as any })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['ARRIENDO','VENTA','MONTAJE','INTERNO'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Vendedor</Label>
                      <Input value={editRow.vendedor ?? ''} onChange={e => setEditRow({ ...editRow, vendedor: e.target.value })} />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label>Cliente</Label>
                      <Input value={editRow.cliente} onChange={e => setEditRow({ ...editRow, cliente: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>Modelo</Label>
                      <Input value={editRow.modelo ?? ''} onChange={e => setEditRow({ ...editRow, modelo: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>Serie</Label>
                      <Input value={editRow.serie ?? ''} onChange={e => setEditRow({ ...editRow, serie: e.target.value })} />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label>Descripción</Label>
                      <Textarea value={editRow.descripcion ?? ''} onChange={e => setEditRow({ ...editRow, descripcion: e.target.value })} rows={2} />
                    </div>
                    <div className="space-y-1">
                      <Label>F. Despacho</Label>
                      <Input type="date" value={editRow.fecha_despacho ?? ''} onChange={e => setEditRow({ ...editRow, fecha_despacho: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>F. Reprograma</Label>
                      <Input type="date" value={editRow.fecha_reprograma ?? ''} onChange={e => setEditRow({ ...editRow, fecha_reprograma: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}

              {/* Campos verdes — Terreno */}
              {esTerreno && (
                <div>
                  <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-green-200 inline-block" /> Campos Terreno
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <Label>Ejecuta (responsable)</Label>
                      <Select value={editRow.ejecuta ?? ''} onValueChange={v => setEditRow({ ...editRow, ejecuta: v })}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          {responsables.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>F. Inicio</Label>
                      <Input type="date" value={editRow.fecha_inicio ?? ''} onChange={e => setEditRow({ ...editRow, fecha_inicio: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>F. Término</Label>
                      <Input type="date" value={editRow.fecha_termino ?? ''} onChange={e => setEditRow({ ...editRow, fecha_termino: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>Estado</Label>
                      <Select value={editRow.estado} onValueChange={v => setEditRow({ ...editRow, estado: v as any })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Avance (%)</Label>
                      <Input
                        type="number"
                        min={0} max={100}
                        value={editRow.avance_pct}
                        onChange={e => setEditRow({ ...editRow, avance_pct: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label>Observación</Label>
                      <Textarea value={editRow.observacion ?? ''} onChange={e => setEditRow({ ...editRow, observacion: e.target.value })} rows={2} />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving} className="bg-blue-700 hover:bg-blue-800">
                  {saving ? 'Guardando...' : 'Guardar cambios'}
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
