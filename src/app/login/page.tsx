'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Credenciales incorrectas')
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f1623' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/logo.svg" alt="Contenedores Patagonia" width={240} height={57} priority />
        </div>

        {/* Card login */}
        <div className="rounded-xl p-8" style={{ background: '#1a2235', border: '1px solid #2a3552' }}>
          <div className="text-center mb-6">
            <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>Sistema de Gestión de Producción</p>
            <p className="text-xs mt-1" style={{ color: '#64748b' }}>Ingresa con tu cuenta corporativa</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#94a3b8' }}>
                Correo
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="usuario@patagonia.cl"
                required
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: '#0f1623',
                  border: '1px solid #2a3552',
                  color: '#e2e8f0',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#1a6abf' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#2a3552' }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#94a3b8' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: '#0f1623',
                  border: '1px solid #2a3552',
                  color: '#e2e8f0',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#1a6abf' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#2a3552' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all mt-2"
              style={{
                background: loading ? '#1e3a6e' : '#1558a0',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: '#334155' }}>
          Contenedores Patagonia SpA · Sistema interno
        </p>
      </div>
    </div>
  )
}
