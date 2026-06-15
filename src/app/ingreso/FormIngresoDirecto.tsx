'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'

const TIPOS_OP = ['ARRIENDO', 'VENTA', 'MONTAJE', 'INTERNO']
const MODELOS = ['CP2D','CP2S','CP4L','CP4R','CP1D','CP2F','CP2L','DRY20','DRY40','REEFER20','REEFER40','MESP','BP2M','BD2S','PL2S','OTROS']

type Item = {
  modelo: string
  serie: string
  descripcion: string
  fecha_ingreso: string
  fecha_despacho: string
}

const itemVacio = (): Item => ({
  modelo: '',
  serie: '',
  descripcion: '',
  fecha_ingreso: new Date().toISOString().split('T')[0],
  fecha_despacho: '',
})

interface Props {
  vendedores: string[]
  responsables: string[]
}

export default function FormIngresoDirecto({ vendedores }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  // Datos generales
  const [gral, setGral] = useState({
    op_pv: '',
    nv: '',
    tipo: '',
    vendedor: '',
    cliente: '',
  })

  // Ítems (filas del programa)
  const [items, setItems] = useState<Item[]>([itemVacio()])

  function setG(k: string, v: string) { setGral(p => ({ ...p, [k]: v })) }

  function setItem(i: number, k: keyof Item, v: string) {
    setItems(p => p.map((it, j) => j === i ? { ...it, [k]: v } : it))
  }

  function addItem() { setItems(p => [...p, itemVacio()]) }
  function removeItem(i: number) { setItems(p => p.filter((_, j) => j !== i)) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!gral.op_pv.trim()) { toast.error('Ingresa el número de OP / PV'); return }
    if (!gral.tipo) { toast.error('Selecciona el tipo de negocio'); return }
    if (!gral.cliente.trim()) { toast.error('Ingresa el nombre del cliente'); return }
    if (items.every(it => !it.descripcion.trim() && !it.modelo)) {
      toast.error('Agrega al menos un ítem con descripción o modelo'); return
    }

    setLoading(true)
    try {
      const filas = items
        .filter(it => it.descripcion.trim() || it.modelo || it.serie.trim())
        .map((it, i) => ({
          op_pv:         gral.op_pv.trim(),
          nv:            gral.nv.trim() || null,
          tipo:          gral.tipo,
          vendedor:      gral.vendedor || null,
          cliente:       gral.cliente.trim(),
          modelo:        it.modelo || null,
          serie:         it.serie.trim() || null,
          descripcion:   it.descripcion.trim() || null,
          fecha_ingreso: it.fecha_ingreso || null,
          fecha_despacho:it.fecha_despacho || null,
          estado:        'PENDIENTE',
          genera_of:     false,
        }))

      const { error } = await supabase.from('programa_produccion').insert(filas)
      if (error) throw error

      toast.success(`OP ${gral.op_pv} registrada — ${filas.length} ítem${filas.length !== 1 ? 's' : ''} en el Programa`)
      router.push('/programa')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message ?? 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ingreso directo de OP</h1>
        <p className="text-sm text-gray-500 mt-0.5">Los ítems se registran directamente en el Programa de Producción</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* DATOS GENERALES */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-100 bg-blue-900 rounded-t-lg">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Datos generales</h2>
          </div>
          <div className="p-5 grid grid-cols-5 gap-4">
            <div className="space-y-1">
              <Label>OP / PV <span className="text-red-500">*</span></Label>
              <Input value={gral.op_pv} onChange={e => setG('op_pv', e.target.value)} placeholder="ej: 6617" />
            </div>
            <div className="space-y-1">
              <Label>NV</Label>
              <Input value={gral.nv} onChange={e => setG('nv', e.target.value)} placeholder="ej: 31661" />
            </div>
            <div className="space-y-1">
              <Label>Tipo <span className="text-red-500">*</span></Label>
              <Select value={gral.tipo} onValueChange={v => setG('tipo', v)}>
                <SelectTrigger><SelectValue placeholder="Tipo..." /></SelectTrigger>
                <SelectContent>{TIPOS_OP.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Vendedor</Label>
              <Select value={gral.vendedor} onValueChange={v => setG('vendedor', v)}>
                <SelectTrigger><SelectValue placeholder="Vendedor..." /></SelectTrigger>
                <SelectContent>{vendedores.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-1 space-y-1">
              <Label>Cliente <span className="text-red-500">*</span></Label>
              <Input value={gral.cliente} onChange={e => setG('cliente', e.target.value)} placeholder="Nombre cliente" />
            </div>
          </div>
        </div>

        {/* ÍTEMS */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-100 bg-blue-900 rounded-t-lg flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
              Ítems — {items.length} fila{items.length !== 1 ? 's' : ''} en programa
            </h2>
            <Button type="button" size="sm" onClick={addItem}
              className="h-7 text-xs bg-blue-700 hover:bg-blue-600 gap-1 border border-blue-500">
              <Plus size={13} /> Agregar ítem
            </Button>
          </div>

          <div className="divide-y divide-gray-100">
            {/* Header columnas */}
            <div className="grid grid-cols-12 gap-3 px-5 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-1">#</div>
              <div className="col-span-2">Modelo</div>
              <div className="col-span-2">Serie Asig.</div>
              <div className="col-span-4">Descripción</div>
              <div className="col-span-1">Ingreso</div>
              <div className="col-span-1">Despacho</div>
              <div className="col-span-1"></div>
            </div>

            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 px-5 py-3 items-center hover:bg-gray-50">
                <div className="col-span-1 text-sm font-semibold text-gray-400 text-center">{i + 1}</div>

                <div className="col-span-2">
                  <Select value={it.modelo} onValueChange={v => setItem(i, 'modelo', v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Modelo" /></SelectTrigger>
                    <SelectContent>{MODELOS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Input className="h-8 text-sm" value={it.serie}
                    onChange={e => setItem(i, 'serie', e.target.value)}
                    placeholder="ej: CP2D1895" />
                </div>

                <div className="col-span-4">
                  <Input className="h-8 text-sm" value={it.descripcion}
                    onChange={e => setItem(i, 'descripcion', e.target.value)}
                    placeholder="ej: 1 CP2D C/ A/C 9000V + PINT EXT" />
                </div>

                <div className="col-span-1">
                  <Input className="h-8 text-sm" type="date" value={it.fecha_ingreso}
                    onChange={e => setItem(i, 'fecha_ingreso', e.target.value)} />
                </div>

                <div className="col-span-1">
                  <Input className="h-8 text-sm" type="date" value={it.fecha_despacho}
                    onChange={e => setItem(i, 'fecha_despacho', e.target.value)} />
                </div>

                <div className="col-span-1 flex justify-center">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)}
                      className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ACCIONES */}
        <div className="flex gap-3 pb-8">
          <Button type="submit" disabled={loading} className="bg-blue-800 hover:bg-blue-900 px-8">
            {loading ? 'Registrando...' : `Registrar OP (${items.filter(it => it.descripcion.trim() || it.modelo || it.serie.trim()).length} ítem${items.filter(it => it.descripcion.trim() || it.modelo || it.serie.trim()).length !== 1 ? 's' : ''})`}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        </div>

      </form>
    </div>
  )
}
