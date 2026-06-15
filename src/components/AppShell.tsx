import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const role = roleData?.role ?? 'terreno'
  const nombreCompleto = user.user_metadata?.nombre_completo as string | undefined

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f4f6f9' }}>
      <Sidebar role={role} userEmail={user.email ?? ''} nombreCompleto={nombreCompleto} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Topbar */}
        <div style={{
          height: 44, background: '#fff',
          borderBottom: '1px solid #d4dae6',
          display: 'flex', alignItems: 'center',
          padding: '0 16px', flexShrink: 0,
          boxShadow: '0 1px 4px rgba(13,27,46,.06)',
          gap: 10,
        }}>
          <span style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 11, fontWeight: 700,
            color: '#0d1b2e', letterSpacing: '.5px',
          }}>
            CONTENEDORES PATAGONIA
          </span>
          <span style={{ fontSize: 10, color: '#637388' }}>Sistema de Gestión de Producción</span>
        </div>
        {/* Contenido */}
        <main style={{ flex: 1, overflowY: 'auto', background: '#f4f6f9' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
