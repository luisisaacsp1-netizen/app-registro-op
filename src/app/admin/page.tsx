import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import GestionUsuarios from './GestionUsuarios'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: roleData } = await supabase.from('user_roles').select('role').single()
  if (roleData?.role !== 'admin') redirect('/')

  // Obtener todos los usuarios via service role
  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: { users } } = await service.auth.admin.listUsers({ perPage: 100 })
  const { data: roles } = await service.from('user_roles').select('user_id, role')

  const rolesMap = Object.fromEntries((roles ?? []).map(r => [r.user_id, r.role]))

  const usuariosConRol = users
    .filter(u => u.email && !u.email.endsWith('@patagonia.cl') || rolesMap[u.id])
    .map(u => ({
      id: u.id,
      email: u.email ?? '',
      nombre: u.user_metadata?.nombre_completo ?? '',
      role: rolesMap[u.id] ?? 'sin rol',
      created_at: u.created_at,
    }))
    .filter(u => u.role !== 'sin rol')
    .sort((a, b) => {
      const orden = ['admin','ot','terreno','ventas']
      return orden.indexOf(a.role) - orden.indexOf(b.role)
    })

  return (
    <AppShell>
      <div className="p-6 max-w-5xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Administración de usuarios</h1>
        <p className="text-sm text-gray-500 mb-6">{usuariosConRol.length} usuarios registrados</p>
        <GestionUsuarios usuarios={usuariosConRol} />
      </div>
    </AppShell>
  )
}
