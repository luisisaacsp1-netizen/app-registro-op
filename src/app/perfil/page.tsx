import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import CambiarPassword from './CambiarPassword'

export const dynamic = 'force-dynamic'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: roleData } = await supabase.from('user_roles').select('role').single()

  const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador',
    ot: 'Oficina Técnica',
    terreno: 'Terreno',
    ventas: 'Ventas',
  }

  return (
    <AppShell>
      <div className="p-6 max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Mi perfil</h1>
        <p className="text-sm text-gray-500 mb-6">Administra tu cuenta</p>

        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Información</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Nombre</span>
              <span className="font-medium">{user?.user_metadata?.nombre_completo ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Rol</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {ROLE_LABELS[roleData?.role ?? ''] ?? roleData?.role}
              </span>
            </div>
          </div>
        </div>

        <CambiarPassword />
      </div>
    </AppShell>
  )
}
