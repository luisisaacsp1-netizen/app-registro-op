'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'

export default function CambiarPassword() {
  const supabase = createClient()
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [verNueva, setVerNueva] = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (nueva.length < 8) { toast.error('La contraseña debe tener al menos 8 caracteres'); return }
    if (nueva !== confirmar) { toast.error('Las contraseñas no coinciden'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: nueva })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Contraseña actualizada correctamente')
    setNueva(''); setConfirmar('')
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Cambiar contraseña</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label>Nueva contraseña</Label>
          <div className="relative">
            <Input
              type={verNueva ? 'text' : 'password'}
              value={nueva}
              onChange={e => setNueva(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="pr-10"
            />
            <button type="button" onClick={() => setVerNueva(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {verNueva ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <Label>Confirmar contraseña</Label>
          <div className="relative">
            <Input
              type={verConfirmar ? 'text' : 'password'}
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              placeholder="Repite la contraseña"
              className="pr-10"
            />
            <button type="button" onClick={() => setVerConfirmar(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {verConfirmar ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        {nueva && confirmar && nueva !== confirmar && (
          <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
        )}
        <Button type="submit" disabled={loading} className="bg-blue-700 hover:bg-blue-800">
          {loading ? 'Guardando...' : 'Actualizar contraseña'}
        </Button>
      </form>
    </div>
  )
}
