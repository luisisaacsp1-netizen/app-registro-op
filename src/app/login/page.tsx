'use client'

import { useState } from 'react'
import LogoPatagonia from '@/components/LogoPatagonia'
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
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0d1b2e',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      {/* Logo real empresa */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Contenedores Patagonia"
        style={{ height: 70, objectFit: 'contain', marginBottom: 32 }} />

      {/* Card */}
      <div style={{
        background: '#fff', borderRadius: 10,
        padding: '28px 32px', width: '100%', maxWidth: 340,
        boxShadow: '0 8px 40px rgba(0,0,0,.35)',
      }}>
        <p style={{
          fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700,
          color: '#637388', letterSpacing: '1.5px', textTransform: 'uppercase',
          textAlign: 'center', marginBottom: 20,
        }}>
          Sistema de Producción
        </p>

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: '#637388', textTransform: 'uppercase', letterSpacing: '.4px' }}>
              Correo
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="usuario@patagonia.cl"
              required
              style={{
                background: '#f8f9fc', border: '1.5px solid #d4dae6',
                borderRadius: 6, padding: '9px 11px',
                fontFamily: 'Open Sans, sans-serif', fontSize: 14,
                color: '#1a2535', transition: 'border-color .15s',
                outline: 'none',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#1a3050'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,48,80,.1)' }}
              onBlur={e =>  { e.currentTarget.style.borderColor = '#d4dae6'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: '#637388', textTransform: 'uppercase', letterSpacing: '.4px' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                background: '#f8f9fc', border: '1.5px solid #d4dae6',
                borderRadius: 6, padding: '9px 11px',
                fontFamily: 'Open Sans, sans-serif', fontSize: 14,
                color: '#1a2535', transition: 'border-color .15s',
                outline: 'none',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#1a3050'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,48,80,.1)' }}
              onBlur={e =>  { e.currentTarget.style.borderColor = '#d4dae6'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: 11,
              background: loading ? '#637388' : '#0d1b2e',
              color: '#fff', border: 'none', borderRadius: 6,
              fontFamily: 'Montserrat, sans-serif', fontSize: 11,
              fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background .2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: 13, height: 13, border: '2px solid rgba(255,255,255,.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'spin .7s linear infinite', display: 'inline-block',
                }} />
                Ingresando...
              </>
            ) : (
              <>
                <span style={{ width: 3, height: 10, background: '#e63329', borderRadius: 2 }} />
                Ingresar
              </>
            )}
          </button>
        </form>
      </div>

      <p style={{ color: 'rgba(255,255,255,.25)', fontSize: 11, marginTop: 18, letterSpacing: '.8px' }}>
        CONTENEDORES PATAGONIA SpA
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
