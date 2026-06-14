import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FormIngresoOP from '@/app/(app)/ingreso/FormIngresoOP'
import AppShell from '@/components/AppShell'

export const dynamic = 'force-dynamic'

export default async function IngresoPage() {
  const supabase = await createClient()

  const [{ data: roleData }, { data: responsables }, { data: vendedores }] = await Promise.all([
    supabase.from('user_roles').select('role').single(),
    supabase.from('maestro_responsables').select('nombre').order('nombre'),
    supabase.from('maestro_vendedores').select('nombre').order('nombre'),
  ])

  if (roleData?.role === 'terreno') redirect('/')

  return (
    <AppShell>
      <div className="p-6 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Ingreso de OP</h1>
        <p className="text-sm text-gray-500 mb-6">Registro de nueva orden en el programa de producción</p>
        <FormIngresoOP
          responsables={responsables?.map(r => r.nombre) ?? []}
          vendedores={vendedores?.map(v => v.nombre) ?? []}
        />
      </div>
    </AppShell>
  )
}
