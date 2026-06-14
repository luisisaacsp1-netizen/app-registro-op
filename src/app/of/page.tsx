import { createClient } from '@/lib/supabase/server'
import TablaOF from '@/app/(app)/of/TablaOF'
import AppShell from '@/components/AppShell'

export const dynamic = 'force-dynamic'

export default async function OFPage() {
  const supabase = await createClient()

  const { data: rows } = await supabase
    .from('ordenes_fabricacion')
    .select('*')
    .order('of_numero', { ascending: false })

  const { data: roleData } = await supabase.from('user_roles').select('role').single()
  const role = roleData?.role ?? 'terreno'

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Órdenes de Fabricación</h1>
          <p className="text-sm text-gray-500 mt-0.5">{rows?.length ?? 0} registros</p>
        </div>
        <TablaOF rows={rows ?? []} role={role} />
      </div>
    </AppShell>
  )
}
