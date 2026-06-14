import { createClient } from '@/lib/supabase/server'
import TablaPrograma from '@/app/(app)/programa/TablaPrograma'
import AppShell from '@/components/AppShell'

export const dynamic = 'force-dynamic'

export default async function ProgramaPage() {
  const supabase = await createClient()

  const [{ data: rows }, { data: roleData }, { data: responsables }] = await Promise.all([
    supabase
      .from('programa_produccion')
      .select('*')
      .order('fecha_despacho', { ascending: true, nullsFirst: false }),
    supabase.from('user_roles').select('role').single(),
    supabase.from('maestro_responsables').select('nombre').order('nombre'),
  ])

  const role = roleData?.role ?? 'terreno'

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Programa de Producción</h1>
            <p className="text-sm text-gray-500 mt-0.5">{rows?.length ?? 0} registros activos</p>
          </div>
        </div>
        <TablaPrograma
          rows={rows ?? []}
          role={role}
          responsables={responsables?.map(r => r.nombre) ?? []}
        />
      </div>
    </AppShell>
  )
}
