'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { emailOPAprobada, emailOPRechazada, emailNuevaOP } from '@/lib/email'

export async function aprobarOP(opId: string, checklist: Record<string, boolean>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: op } = await supabase
    .from('ordenes_produccion')
    .select('*, op_series(*)')
    .eq('id', opId)
    .single()

  if (!op) return { error: 'OP no encontrada' }

  const { error: errUpd } = await supabase
    .from('ordenes_produccion')
    .update({
      estado: 'APROBADA',
      checklist,
      fecha_revision: new Date().toISOString(),
      revisado_por: user.id,
    })
    .eq('id', opId)

  if (errUpd) return { error: errUpd.message }

  // Generar filas en programa_produccion
  const series: any[] = op.op_series ?? []
  const filas = series.length > 0
    ? series.map((s: any) => ({
        op_id: opId,
        op_pv: String(op.numero_op),
        nv: op.numero_nv ? String(op.numero_nv) : null,
        tipo: op.tipo_op,
        cliente: op.cliente_nombre,
        vendedor: op.vendedor,
        modelo: s.modelo ?? op.modelo,
        serie: s.serie,
        descripcion: s.descripcion_trabajo,
        fecha_despacho: op.fecha_entrega,
        estado: 'PENDIENTE',
        genera_of: false,
      }))
    : [{
        op_id: opId,
        op_pv: String(op.numero_op),
        nv: op.numero_nv ? String(op.numero_nv) : null,
        tipo: op.tipo_op,
        cliente: op.cliente_nombre,
        vendedor: op.vendedor,
        modelo: op.modelo,
        fecha_despacho: op.fecha_entrega,
        estado: 'PENDIENTE',
        genera_of: false,
      }]

  const { error: errProg } = await supabase.from('programa_produccion').insert(filas)
  if (errProg) return { error: 'OP aprobada pero error al crear programa: ' + errProg.message }

  // Notificar al vendedor por email
  if (op.created_by) {
    try {
      const { data: { user: vendedor } } = await supabase.auth.admin.getUserById(op.created_by)
      if (vendedor?.email) {
        const nombre = vendedor.user_metadata?.nombre_completo ?? vendedor.email
        await emailOPAprobada({
          vendedorEmail: vendedor.email,
          vendedorNombre: nombre,
          numeroOp: op.numero_op,
          clienteNombre: op.cliente_nombre,
        })
      }
    } catch { /* email no crítico */ }
  }

  revalidatePath('/ops')
  revalidatePath('/programa')
  return { ok: true }
}

export async function rechazarOP(opId: string, observaciones: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: op } = await supabase
    .from('ordenes_produccion')
    .select('numero_op, cliente_nombre, created_by')
    .eq('id', opId)
    .single()

  const { error } = await supabase
    .from('ordenes_produccion')
    .update({
      estado: 'RECHAZADA',
      observaciones_ot: observaciones,
      fecha_revision: new Date().toISOString(),
      revisado_por: user.id,
    })
    .eq('id', opId)

  if (error) return { error: error.message }

  // Notificar al vendedor por email
  if (op?.created_by) {
    try {
      const { data: { user: vendedor } } = await supabase.auth.admin.getUserById(op.created_by)
      if (vendedor?.email) {
        const nombre = vendedor.user_metadata?.nombre_completo ?? vendedor.email
        await emailOPRechazada({
          vendedorEmail: vendedor.email,
          vendedorNombre: nombre,
          numeroOp: op.numero_op,
          clienteNombre: op.cliente_nombre,
          motivo: observaciones,
        })
      }
    } catch { /* email no crítico */ }
  }

  revalidatePath('/ops')
  return { ok: true }
}

export async function crearOP(data: {
  numero_op: number
  numero_nv?: number | null
  tipo_op: string
  cliente_nombre: string
  vendedor?: string | null
  modelo?: string | null
  distribucion?: string | null
  fecha_inicio?: string | null
  fecha_entrega?: string | null
  contacto_nombre?: string | null
  contacto_telefono?: string | null
  direccion_entrega?: string | null
  series: { serie: string; modelo: string; descripcion_trabajo: string }[]
  adicionales: { serie_ref?: string; descripcion_corta: string; cantidad: number }[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { series, adicionales, ...opData } = data

  const { data: op, error: errOp } = await supabase
    .from('ordenes_produccion')
    .insert({ ...opData, created_by: user.id })
    .select()
    .single()

  if (errOp || !op) return { error: errOp?.message ?? 'Error creando OP' }

  if (series.length > 0) {
    const seriesValidas = series.filter(s => s.serie.trim() || s.descripcion_trabajo.trim())
    if (seriesValidas.length > 0) {
      await supabase.from('op_series').insert(
        seriesValidas.map((s, i) => ({ ...s, op_id: op.id, orden_fila: i + 1 }))
      )
    }
  }

  if (adicionales.length > 0) {
    const adicionalesValidos = adicionales.filter(a => a.descripcion_corta.trim())
    if (adicionalesValidos.length > 0) {
      await supabase.from('op_adicionales').insert(
        adicionalesValidos.map((a, i) => ({ ...a, op_id: op.id, numero_item: i + 1 }))
      )
    }
  }

  // Notificar a OT
  try {
    const otEmails = (process.env.NOTIFY_OT_EMAIL ?? '').split(',').map(e => e.trim()).filter(Boolean)
    if (otEmails.length > 0) {
      const nombre = user.user_metadata?.nombre_completo ?? user.email ?? 'Vendedor'
      for (const otEmail of otEmails) {
        await emailNuevaOP({
          numeroOp: op.numero_op,
          clienteNombre: op.cliente_nombre,
          tipoOp: op.tipo_op,
          vendedorNombre: nombre,
          otEmail,
        })
      }
    }
  } catch { /* email no crítico */ }

  revalidatePath('/ops')
  return { ok: true, id: op.id }
}
