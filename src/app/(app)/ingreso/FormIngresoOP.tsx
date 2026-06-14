'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const TIPOS_OP = ['ARRIENDO', 'VENTA', 'MONTAJE', 'INTERNO']
const MODELOS = ['CP2D', 'CP2S', 'CP4L', 'CP4R', 'CP1D', 'CP2F', 'CP2L', 'DRY20', 'DRY40', 'REEFER20', 'REEFER40', 'MESP', 'BP2M', 'BD2S', 'PL2S', 'OTROS']
const MODALIDADES_OF = ['Nueva', 'Antigua']
const TIPOS_TRABAJO_OF = ['Productivo', 'Transformacion Antigua', 'Pruebas']
const TIPOS_OBJETO_OF = ['Contenedor', 'Escalera', 'Caballete', 'Peineta', 'Base Madera', 'Otro']

interface Props {
  responsables: string[]
  vendedores: string[]
}

export default function FormIngresoOP({ responsables, vendedores }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    op_pv: '',
    nv: '',
    tipo: '',
    vendedor: '',
    cliente: '',
    modelo: '',
    serie: '',
    descripcion: '',
    requiere_montaje: false,
    fecha_ingreso: new Date().toISOString().split('T')[0],
    fecha_despacho: '',
    genera_of: false,
    modalidad: 'Nueva',
    tipo_trabajo: 'Productivo',
    tipo_objeto: 'Contenedor',
    descripcion_of: '',
  })

  function set(field: string, value: string | boolean | null) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.op_pv || !form.tipo || !form.cliente) {
      toast.error('Completa los campos obligatorios: OP, Tipo y Cliente')
      return
    }
    setLoading(true)
    try {
      // 1. Insertar en programa_produccion
      const { data: programa, error: errProg } = await supabase
        .from('programa_produccion')
        .insert({
          op_pv: form.op_pv.trim(),
          nv: form.nv.trim() || null,
          tipo: form.tipo,
          vendedor: form.vendedor || null,
          cliente: form.cliente.trim(),
          modelo: form.modelo || null,
          serie: form.serie.trim() || null,
          descripcion: form.descripcion.trim() || null,
          requiere_montaje: form.requiere_montaje,
          fecha_ingreso: form.fecha_ingreso || null,
          fecha_despacho: form.fecha_despacho || null,
          genera_of: form.genera_of,
        })
        .select()
        .single()

      if (errProg) throw errProg

      // 2. Si genera OF, crear registro en ordenes_fabricacion
      if (form.genera_of && programa) {
        const { data: of, error: errOf } = await supabase
          .from('ordenes_fabricacion')
          .insert({
            programa_id: programa.id,
            op_pv: form.op_pv.trim(),
            nv: form.nv.trim() || null,
            serie: form.serie.trim() || null,
            modalidad: form.modalidad,
            tipo_trabajo: form.tipo_trabajo,
            tipo_objeto: form.tipo_objeto,
            descripcion: form.descripcion_of.trim() || form.descripcion.trim() || null,
            estado_of: 'Planificada',
          })
          .select()
          .single()

        if (errOf) throw errOf

        // Vincular OF al registro del programa
        await supabase
          .from('programa_produccion')
          .update({ of_id: of.id })
          .eq('id', programa.id)
      }

      toast.success(`OP ${form.op_pv} registrada correctamente`)
      router.push('/programa')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message ?? 'Error al registrar la OP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Datos Generales
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="op_pv">OP / Ticket PV <span className="text-red-500">*</span></Label>
            <Input
              id="op_pv"
              value={form.op_pv}
              onChange={e => set('op_pv', e.target.value)}
              placeholder="ej: 6617"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="nv">Nota de Venta (NV)</Label>
            <Input
              id="nv"
              value={form.nv}
              onChange={e => set('nv', e.target.value)}
              placeholder="ej: 31661"
            />
          </div>

          <div className="space-y-1">
            <Label>Tipo de Negocio <span className="text-red-500">*</span></Label>
            <Select value={form.tipo} onValueChange={v => set('tipo', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_OP.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Vendedor</Label>
            <Select value={form.vendedor} onValueChange={v => set('vendedor', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {vendedores.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-1">
            <Label htmlFor="cliente">Cliente <span className="text-red-500">*</span></Label>
            <Input
              id="cliente"
              value={form.cliente}
              onChange={e => set('cliente', e.target.value)}
              placeholder="Nombre del cliente"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Especificación Técnica
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Modelo</Label>
            <Select value={form.modelo} onValueChange={v => set('modelo', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {MODELOS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="serie">Serie</Label>
            <Input
              id="serie"
              value={form.serie}
              onChange={e => set('serie', e.target.value)}
              placeholder="ej: CP2D1895 / FCIU326960-5"
            />
          </div>

          <div className="col-span-2 space-y-1">
            <Label htmlFor="descripcion">Descripción del trabajo</Label>
            <Textarea
              id="descripcion"
              value={form.descripcion}
              onChange={e => set('descripcion', e.target.value)}
              placeholder="ej: 1 CP2D C/ A/C 9000V + PINT EXT RAL7010"
              rows={3}
            />
          </div>

          <div className="col-span-2 flex items-center gap-2">
            <Checkbox
              id="requiere_montaje"
              checked={form.requiere_montaje}
              onCheckedChange={v => set('requiere_montaje', !!v)}
            />
            <Label htmlFor="requiere_montaje" className="cursor-pointer">Requiere montaje en terreno</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Fechas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="fecha_ingreso">Fecha Ingreso</Label>
            <Input
              id="fecha_ingreso"
              type="date"
              value={form.fecha_ingreso}
              onChange={e => set('fecha_ingreso', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fecha_despacho">Fecha Despacho Programada</Label>
            <Input
              id="fecha_despacho"
              type="date"
              value={form.fecha_despacho}
              onChange={e => set('fecha_despacho', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className={form.genera_of ? 'border-orange-300' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Checkbox
              id="genera_of"
              checked={form.genera_of}
              onCheckedChange={v => set('genera_of', !!v)}
            />
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide cursor-pointer" onClick={() => set('genera_of', !form.genera_of)}>
              Genera Orden de Fabricación (OF)
            </CardTitle>
          </div>
        </CardHeader>

        {form.genera_of && (
          <CardContent className="grid grid-cols-2 gap-4 pt-0">
            <div className="space-y-1">
              <Label>Modalidad</Label>
              <Select value={form.modalidad} onValueChange={v => set('modalidad', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODALIDADES_OF.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Tipo de Trabajo</Label>
              <Select value={form.tipo_trabajo} onValueChange={v => set('tipo_trabajo', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_TRABAJO_OF.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Tipo de Objeto</Label>
              <Select value={form.tipo_objeto} onValueChange={v => set('tipo_objeto', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_OBJETO_OF.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1">
              <Label htmlFor="descripcion_of">Descripción OF (si difiere de la OP)</Label>
              <Textarea
                id="descripcion_of"
                value={form.descripcion_of}
                onChange={e => set('descripcion_of', e.target.value)}
                placeholder="Dejar vacío para usar la misma descripción de la OP"
                rows={2}
              />
            </div>
          </CardContent>
        )}
      </Card>

      <div className="flex gap-3 pb-6">
        <Button type="submit" disabled={loading} className="bg-blue-700 hover:bg-blue-800">
          {loading ? 'Guardando...' : 'Registrar en Programa'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
