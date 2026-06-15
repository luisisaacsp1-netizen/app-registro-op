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
    <div className="flex h-screen overflow-hidden" style={{ background: '#0f1623' }}>
      <Sidebar role={role} userEmail={user.email ?? ''} nombreCompleto={nombreCompleto} />
      <main className="flex-1 overflow-auto" style={{ background: '#0f1623' }}>
        {children}
      </main>
    </div>
  )
}
