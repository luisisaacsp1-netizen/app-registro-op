'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { crearOP } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react'

const TIPOS_OP = ['ARRIENDO', 'VENTA', 'MONTAJE', 'INTERNO']
const MODELOS = ['CP2D','CP2S','CP4L','CP4R','CP1D','CP2F','CP2L','DRY20','DRY40','REEFER20','REEFER40','MESP','BP2M','BD2S','PL2S','OTROS']

const SOLICITANTES = [
  'Brezzy Soto','Juan Orellana','Debora Riquelme','Javiera Robles','Monica Estay',
  'Carolina Peña','Suleika Vera','Michael Roman','Thania Villalobos','Vanessa Le-Quesne',
  'Luis Sanchez','Yamila Silva','Luis Diaz',
]

type Serie = { serie: string; modelo: string; descripcion_trabajo: string }
type Adicional = { serie_ref: string; descripcion_corta: string; cantidad: number }

interface Props {
  vendedores: string[]
  responsables: string[]
}

export default function FormNuevaOP({ vendedores }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Paso 1 — datos básicos
  const [datos, setDatos] = useState({
    numero_op: '',
    numero_nv: '',
    tipo_op: '',
    cliente_nombre: '',
    vendedor: '',
    solicitante: '',
    modelo: '',
    distribucion: '',
    fecha_inicio: '',
    fecha_entrega: '',
    contacto_nombre: '',
    contacto_telefono: '',
    direccion_entrega: '',
  })

  // Paso 2 — series y adicionales
  const [series, setSeries] = useState<Serie[]>([{ serie: '', modelo: '', descripcion_trabajo: '' }])
  const [adicionales, setAdicionales] = useState<Adicional[]>([])

  function setD(k: string, v: string) { setDatos(p => ({ ...p, [k]: v })) }

  function addSerie() { setSeries(p => [...p, { serie: '', modelo: '', descripcion_trabajo: '' }]) }
  function removeSerie(i: number) { setSeries(p => p.filter((_, j) => j !== i)) }
  function setSerie(i: number, k: keyof Serie, v: string) {
    setSeries(p => p.map((s, j) => j === i ? { ...s, [k]: v } : s))
  }

  function addAdicional() { setAdicionales(p => [...p, { serie_ref: '', descripcion_corta: '', cantidad: 1 }]) }
  function removeAdicional(i: number) { setAdicionales(p => p.filter((_, j) => j !== i)) }
  function setAdicional(i: number, k: keyof Adicional, v: string | number) {
    setAdicionales(p => p.map((a, j) => j === i ? { ...a, [k]: v } : a))
  }

  function validarPaso1() {
    if (!datos.numero_op || isNaN(Number(datos.numero_op))) {
      toast.error('Ingresa un número de OP válido'); return false
    }
    if (!datos.tipo_op) { toast.error('Selecciona el tipo de negocio'); return false }
    if (!datos.cliente_nombre.trim()) { toast.error('Ingresa el nombre del cliente'); return false }
    return true
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const seriesValidas = series.filter(s => s.serie.trim() || s.descripcion_trabajo.trim())
      const adicionalesValidos = adicionales.filter(a => a.descripcion_corta.trim())

      const result = await crearOP({
        numero_op: Number(datos.numero_op),
        numero_nv: datos.numero_nv ? Number(datos.numero_nv) : null,
        tipo_op: datos.tipo_op,
        cliente_nombre: datos.cliente_nombre.trim(),
        vendedor: datos.vendedor || null,
        solicitante: datos.solicitante || null,
        modelo: datos.modelo || null,
        distribucion: datos.distribucion || null,
        fecha_inicio: datos.fecha_inicio || null,
        fecha_entrega: datos.fecha_entrega || null,
        contacto_nombre: datos.contacto_nombre || null,
        contacto_telefono: datos.contacto_telefono || null,
        direccion_entrega: datos.direccion_entrega || null,
        series: seriesValidas,
        adicionales: adicionalesValidos,
      })

      if (result.error) { toast.error(result.error); return }
      toast.success(`OP ${datos.numero_op} ingresada — pendiente de revisión`)
      router.push(`/ops/${result.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Steps */}
      <div className="flex items-center gap-2 mb-6">
        {[1,2,3].map(n => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold
              ${step === n ? 'bg-blue-700 text-white' : step > n ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step > n ? '✓' : n}
            </div>
            <span className={`text-sm ${step === n ? 'font-semibold text-blue-700' : 'text-gray-400'}`}>
              {n === 1 ? 'Datos básicos' : n === 2 ? 'Series y trabajos' : 'Revisión'}
            </span>
            {n < 3 && <ChevronRight size={14} className="text-gray-300 mx-1" />}
          </div>
        ))}
      </div>

      {/* PASO 1 */}
      {step === 1 && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Nueva OP — Datos básicos</h1>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Identificación</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>N° OP <span className="text-red-500">*</span></Label>
                <Input value={datos.numero_op} onChange={e => setD('numero_op', e.target.value)} placeholder="ej: 6617" />
              </div>
              <div className="space-y-1">
                <Label>N° NV</Label>
                <Input value={datos.numero_nv} onChange={e => setD('numero_nv', e.target.value)} placeholder="ej: 31661" />
              </div>
              <div className="space-y-1">
                <Label>Tipo de negocio <span className="text-red-500">*</span></Label>
                <Select value={datos.tipo_op} onValueChange={v => setD('tipo_op', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>{TIPOS_OP.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Vendedor</Label>
                <Select value={datos.vendedor} onValueChange={v => setD('vendedor', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>{vendedores.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Solicitante</Label>
                <Select value={datos.solicitante} onValueChange={v => setD('solicitante', v)}>
                  <SelectTrigger><SelectValue placeholder="¿Quién solicita la OP?" /></SelectTrigger>
                  <SelectContent>{SOLICITANTES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <p className="text-xs text-gray-400">Si es distinto a quien ingresa</p>
              </div>

              <div className="col-span-2 space-y-1">
                <Label>Cliente <span className="text-red-500">*</span></Label>
                <Input value={datos.cliente_nombre} onChange={e => setD('cliente_nombre', e.target.value)} placeholder="Nombre del cliente" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Especificación</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Modelo</Label>
                <Select value={datos.modelo} onValueChange={v => setD('modelo', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>{MODELOS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Distribución</Label>
                <Select value={datos.distribucion} onValueChange={v => setD('distribucion', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ESTANDAR">ESTÁNDAR</SelectItem>
                    <SelectItem value="SEG. CROQUIS">SEG. CROQUIS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Dirección de entrega</Label>
                <Input value={datos.direccion_entrega} onChange={e => setD('direccion_entrega', e.target.value)} placeholder="Calle, comuna, ciudad" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Fechas y contacto</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Fecha inicio</Label>
                <Input type="date" value={datos.fecha_inicio} onChange={e => setD('fecha_inicio', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Fecha entrega</Label>
                <Input type="date" value={datos.fecha_entrega} onChange={e => setD('fecha_entrega', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Contacto nombre</Label>
                <Input value={datos.contacto_nombre} onChange={e => setD('contacto_nombre', e.target.value)} placeholder="Nombre contacto cliente" />
              </div>
              <div className="space-y-1">
                <Label>Contacto teléfono</Label>
                <Input value={datos.contacto_telefono} onChange={e => setD('contacto_telefono', e.target.value)} placeholder="+56 9 ..." />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button className="bg-blue-700 hover:bg-blue-800 gap-1" onClick={() => { if (validarPaso1()) setStep(2) }}>
              Siguiente <ChevronRight size={16} />
            </Button>
            <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* PASO 2 */}
      {step === 2 && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Series y trabajos</h1>

          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Contenedores / Unidades
              </CardTitle>
              <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={addSerie}>
                <Plus size={12} /> Agregar
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {series.map((s, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start border border-gray-100 rounded-md p-3 bg-gray-50">
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Serie</Label>
                    <Input className="h-8 text-sm" value={s.serie} onChange={e => setSerie(i, 'serie', e.target.value)} placeholder="CP2D1895" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Modelo</Label>
                    <Select value={s.modelo} onValueChange={v => setSerie(i, 'modelo', v)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Modelo" /></SelectTrigger>
                      <SelectContent>{MODELOS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-6 space-y-1">
                    <Label className="text-xs">Descripción del trabajo</Label>
                    <Input className="h-8 text-sm" value={s.descripcion_trabajo} onChange={e => setSerie(i, 'descripcion_trabajo', e.target.value)} placeholder="ej: 1 CP2D C/ A/C 9000V" />
                  </div>
                  <div className="col-span-1 flex items-end pb-0.5">
                    {series.length > 1 && (
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-600" onClick={() => removeSerie(i)}>
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Adicionales / Accesorios
              </CardTitle>
              <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={addAdicional}>
                <Plus size={12} /> Agregar
              </Button>
            </CardHeader>
            {adicionales.length > 0 && (
              <CardContent className="space-y-2">
                {adicionales.map((a, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-start border border-gray-100 rounded-md p-3 bg-gray-50">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Serie ref.</Label>
                      <Input className="h-8 text-sm" value={a.serie_ref} onChange={e => setAdicional(i, 'serie_ref', e.target.value)} placeholder="Opcional" />
                    </div>
                    <div className="col-span-1 space-y-1">
                      <Label className="text-xs">Cant.</Label>
                      <Input className="h-8 text-sm" type="number" min={1} value={a.cantidad} onChange={e => setAdicional(i, 'cantidad', Number(e.target.value))} />
                    </div>
                    <div className="col-span-8 space-y-1">
                      <Label className="text-xs">Descripción</Label>
                      <Input className="h-8 text-sm" value={a.descripcion_corta} onChange={e => setAdicional(i, 'descripcion_corta', e.target.value)} placeholder="ej: A/C 9000 BTU" />
                    </div>
                    <div className="col-span-1 flex items-end pb-0.5">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-600" onClick={() => removeAdicional(i)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className="gap-1" onClick={() => setStep(1)}>
              <ChevronLeft size={16} /> Atrás
            </Button>
            <Button className="bg-blue-700 hover:bg-blue-800 gap-1" onClick={() => setStep(3)}>
              Siguiente <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* PASO 3 — Resumen */}
      {step === 3 && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Resumen y confirmación</h1>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Datos de la OP</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div><span className="text-gray-500">OP:</span> <span className="font-semibold">{datos.numero_op}</span></div>
              <div><span className="text-gray-500">NV:</span> <span className="font-semibold">{datos.numero_nv || '—'}</span></div>
              <div><span className="text-gray-500">Tipo:</span> <span className="font-semibold">{datos.tipo_op}</span></div>
              <div><span className="text-gray-500">Vendedor:</span> <span className="font-semibold">{datos.vendedor || '—'}</span></div>
              {datos.solicitante && <div><span className="text-gray-500">Solicitante:</span> <span className="font-semibold">{datos.solicitante}</span></div>}
              <div className="col-span-2"><span className="text-gray-500">Cliente:</span> <span className="font-semibold">{datos.cliente_nombre}</span></div>
              {datos.direccion_entrega && <div className="col-span-2"><span className="text-gray-500">Dirección:</span> {datos.direccion_entrega}</div>}
              {datos.fecha_entrega && <div><span className="text-gray-500">F. Entrega:</span> {new Date(datos.fecha_entrega + 'T12:00:00').toLocaleDateString('es-CL')}</div>}
            </CardContent>
          </Card>

          {series.filter(s => s.serie || s.descripcion_trabajo).length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Series ({series.filter(s => s.serie || s.descripcion_trabajo).length})</CardTitle></CardHeader>
              <CardContent>
                {series.filter(s => s.serie || s.descripcion_trabajo).map((s, i) => (
                  <div key={i} className="flex gap-3 text-sm py-1 border-b border-gray-100 last:border-0">
                    <span className="font-medium w-28 shrink-0">{s.serie || '(sin serie)'}</span>
                    <span className="text-gray-500 text-xs">{s.modelo}</span>
                    <span className="text-gray-700">{s.descripcion_trabajo}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
            La OP quedará en estado <strong>PENDIENTE</strong> hasta que OT la revise y apruebe o rechace.
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="gap-1" onClick={() => setStep(2)}>
              <ChevronLeft size={16} /> Atrás
            </Button>
            <Button className="bg-blue-700 hover:bg-blue-800" disabled={loading} onClick={handleSubmit}>
              {loading ? 'Guardando...' : 'Ingresar OP'}
            </Button>
            <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  )
}
