'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function resetPasswordAdmin(userId: string, newPassword: string) {
  const supabase = await createClient()
  const { data: roleData } = await supabase.from('user_roles').select('role').single()
  if (roleData?.role !== 'admin') return { error: 'Sin permisos' }
  if (newPassword.length < 8) return { error: 'Mínimo 8 caracteres' }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error } = await service.auth.admin.updateUserById(userId, { password: newPassword })
  if (error) return { error: error.message }
  return { ok: true }
}
