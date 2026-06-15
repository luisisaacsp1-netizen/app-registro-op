'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { resetPasswordAdmin } from './actions'

const ROLE_COLORS: Record<string, string> = {
  admin:   'bg-purple-100 text-purple-800',
  ot:      'bg-blue-100 text-blue-800',
  terreno: 'bg-green-100 text-green-800',
  ventas:  'bg-orange-100 text-orange-800',
}
const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin', ot: 'OT', terreno: 'Terreno', ventas: 'Ventas',
}

interface Usuario {
  id: string; email: string; nombre: string; role: string; created_at: string
}

function FilaUsuario({ u }: { u: Usuario }) {
  const [nueva, setNueva] = useState('')
  const [ver, setVer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editando, setEditando] = useState(false)

  async function handleReset() {
    if (nueva.length < 8) { toast.error('Mínimo 8 caracteres'); return }
    setLoading(true)
    const result = await resetPasswordAdmin(u.id, nueva)
    setLoading(false)
    if (result.error) { toast.error(result.error); return }
    toast.success(`Contraseña de ${u.nombre || u.email} actualizada`)
    setNueva(''); setEditando(false)
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900 text-sm">{u.nombre || '—'}</div>
        <div className="text-xs text-gray-400">{u.email}</div>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
          {ROLE_LABELS[u.role] ?? u.role}
        </span>
      </td>
      <td className="px-4 py-3">
        {!editando ? (
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => setEditando(true)}>
            <KeyRound size={13} /> Cambiar contraseña
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                type={ver ? 'text' : 'password'}
                value={nueva}
                onChange={e => setNueva(e.target.value)}
                placeholder="Nueva contraseña"
                className="h-8 text-sm pr-8 w-48"
                onKeyDown={e => e.key === 'Enter' && handleReset()}
              />
              <button type="button" onClick={() => setVer(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                {ver ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            <Button size="sm" className="h-8 text-xs bg-blue-700 hover:bg-blue-800" disabled={loading} onClick={handleReset}>
              {loading ? '...' : 'Guardar'}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setEditando(false); setNueva('') }}>
              Cancelar
            </Button>
          </div>
        )}
      </td>
    </tr>
  )
}

export default function GestionUsuarios({ usuarios }: { usuarios: Usuario[] }) {
  const grupos = ['admin','ot','terreno','ventas']

  return (
    <div className="space-y-6">
      {grupos.map(rol => {
        const lista = usuarios.filter(u => u.role === rol)
        if (lista.length === 0) return null
        return (
          <div key={rol} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className={`px-4 py-2.5 border-b border-gray-200 flex items-center gap-2`}>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[rol]}`}>
                {ROLE_LABELS[rol]}
              </span>
              <span className="text-xs text-gray-400">{lista.length} usuario{lista.length !== 1 ? 's' : ''}</span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {lista.map(u => <FilaUsuario key={u.id} u={u} />)}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
