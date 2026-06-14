'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { aprobarOP, rechazarOP } from '../actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle } from 'lucide-react'

const CHECKLIST_ITEMS = [
  { key: 'campos_completos', label: 'Todos los campos obligatorios están completados' },
  { key: 'fechas_coherentes', label: 'Fechas coherentes (inicio < entrega)' },
  { key: 'series_informadas', label: 'Series informadas (si aplica)' },
  { key: 'especificacion_suficiente', label: 'Especificación técnica suficiente para producir' },
  { key: 'precios_validados', label: 'Precios validados contra lista de precios' },
]

export default function AccionesOP({ opId, numeroOp }: { opId: string; numeroOp: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})
  const [rechazando, setRechazando] = useState(false)
  const [motivo, setMotivo] = useState('')

  function toggleCheck(key: string) {
    setChecklist(p => ({ ...p, [key]: !p[key] }))
  }

  const todosMarcados = CHECKLIST_ITEMS.every(item => checklist[item.key])

  async function handleAprobar() {
    if (!todosMarcados) {
      toast.error('Debes marcar todos los ítems del checklist antes de aprobar')
      return
    }
    setLoading(true)
    const result = await aprobarOP(opId, checklist)
    setLoading(false)
    if (result.error) { toast.error(result.error); return }
    toast.success(`OP ${numeroOp} aprobada — registrada en programa`)
    router.push('/programa')
  }

  async function handleRechazar() {
    if (!motivo.trim()) {
      toast.error('Debes ingresar el motivo de rechazo')
      return
    }
    setLoading(true)
    const result = await rechazarOP(opId, motivo.trim())
    setLoading(false)
    if (result.error) { toast.error(result.error); return }
    toast.success(`OP ${numeroOp} rechazada`)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Revisión OT — Checklist</h2>

      <div className="space-y-3 mb-6">
        {CHECKLIST_ITEMS.map(item => (
          <div key={item.key} className="flex items-center gap-3">
            <Checkbox
              id={item.key}
              checked={!!checklist[item.key]}
              onCheckedChange={() => toggleCheck(item.key)}
            />
            <Label htmlFor={item.key} className="cursor-pointer text-sm">{item.label}</Label>
          </div>
        ))}
      </div>

      {!rechazando ? (
        <div className="flex gap-3">
          <Button
            className="bg-green-600 hover:bg-green-700 gap-2"
            disabled={loading || !todosMarcados}
            onClick={handleAprobar}
          >
            <CheckCircle2 size={16} />
            {loading ? 'Procesando...' : 'Aprobar OP'}
          </Button>
          <Button
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 gap-2"
            disabled={loading}
            onClick={() => setRechazando(true)}
          >
            <XCircle size={16} />
            Rechazar OP
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-sm font-medium text-red-700">Motivo de rechazo <span className="text-red-500">*</span></Label>
            <Textarea
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Describe el motivo del rechazo para que ventas pueda corregir la OP..."
              rows={3}
              className="border-red-200 focus:border-red-400"
            />
          </div>
          <div className="flex gap-3">
            <Button
              className="bg-red-600 hover:bg-red-700 gap-2"
              disabled={loading || !motivo.trim()}
              onClick={handleRechazar}
            >
              <XCircle size={16} />
              {loading ? 'Procesando...' : 'Confirmar rechazo'}
            </Button>
            <Button variant="outline" onClick={() => setRechazando(false)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  )
}
