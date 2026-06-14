import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import FormNuevaOP from './FormNuevaOP'

export const dynamic = 'force-dynamic'

export default async function NuevaOPPage() {
  const supabase = await createClient()
  const { data: roleData } = await supabase.from('user_roles').select('role').single()
  if (!['ot','admin'].includes(roleData?.role ?? '')) redirect('/ops')

  const [{ data: vendedores }, { data: responsables }] = await Promise.all([
    supabase.from('maestro_vendedores').select('nombre').order('nombre'),
    supabase.from('maestro_responsables').select('nombre').order('nombre'),
  ])

  return (
    <AppShell>
      <FormNuevaOP
        vendedores={vendedores?.map(v => v.nombre) ?? []}
        responsables={responsables?.map(r => r.nombre) ?? []}
      />
    </AppShell>
  )
}
