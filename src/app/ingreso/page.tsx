import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import FormIngresoDirecto from './FormIngresoDirecto'

export const dynamic = 'force-dynamic'

export default async function IngresoPage() {
  const supabase = await createClient()
  const { data: roleData } = await supabase.from('user_roles').select('role').single()
  const role = roleData?.role ?? ''

  if (!['ot', 'admin'].includes(role)) redirect('/')

  const [{ data: vendedores }, { data: responsables }] = await Promise.all([
    supabase.from('maestro_vendedores').select('nombre').order('nombre'),
    supabase.from('maestro_responsables').select('nombre').order('nombre'),
  ])

  return (
    <AppShell>
      <FormIngresoDirecto
        vendedores={vendedores?.map(v => v.nombre) ?? []}
        responsables={responsables?.map(r => r.nombre) ?? []}
      />
    </AppShell>
  )
}
