import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? 'Patagonia Producción <onboarding@resend.dev>'

function splitEmails(env?: string): string[] {
  return (env ?? '').split(',').map(e => e.trim()).filter(Boolean)
}

export async function emailOPAprobada({
  vendedorEmail,
  vendedorNombre,
  numeroOp,
  clienteNombre,
  tipoOp,
  fechaEntrega,
}: {
  vendedorEmail: string
  vendedorNombre: string
  numeroOp: number
  clienteNombre: string
  tipoOp: string
  fechaEntrega?: string | null
}) {
  const toExtra = splitEmails(process.env.NOTIFY_APROBADA_TO)
  const cc = splitEmails(process.env.NOTIFY_APROBADA_CC)

  const fechaStr = fechaEntrega
    ? new Date(fechaEntrega + 'T12:00:00').toLocaleDateString('es-CL')
    : '—'

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto">
      <div style="background:#1e40af;color:white;padding:18px 24px;border-radius:8px 8px 0 0">
        <h2 style="margin:0;font-size:18px">Patagonia — Gestión de Producción</h2>
      </div>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-top:none;padding:20px 24px">
        <h3 style="color:#166534;margin-top:0">✅ OP Aprobada e ingresada a Producción</h3>
        <p>La siguiente Orden de Producción fue <strong>aprobada</strong> por Oficina Técnica.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
          <tr style="background:#dcfce7"><td style="padding:8px 12px;font-weight:600;width:160px">N° OP</td><td style="padding:8px 12px">${numeroOp}</td></tr>
          <tr><td style="padding:8px 12px;color:#6b7280">Cliente</td><td style="padding:8px 12px">${clienteNombre}</td></tr>
          <tr style="background:#f0fdf4"><td style="padding:8px 12px;color:#6b7280">Tipo</td><td style="padding:8px 12px">${tipoOp}</td></tr>
          <tr><td style="padding:8px 12px;color:#6b7280">F. Entrega</td><td style="padding:8px 12px">${fechaStr}</td></tr>
          <tr style="background:#f0fdf4"><td style="padding:8px 12px;color:#6b7280">Ingresada por</td><td style="padding:8px 12px">${vendedorNombre}</td></tr>
        </table>
        <a href="https://app-registro-op.vercel.app/programa"
           style="display:inline-block;background:#1e40af;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">
          Ver en Programa →
        </a>
      </div>
      <div style="background:#f9fafb;padding:12px 24px;border-radius:0 0 8px 8px;font-size:12px;color:#9ca3af;border:1px solid #e5e7eb;border-top:none">
        Contenedores Patagonia SpA — Sistema de Gestión de Producción
      </div>
    </div>`

  await resend.emails.send({
    from: FROM,
    to: [vendedorEmail, ...toExtra],
    cc: cc.length > 0 ? cc : undefined,
    subject: `✅ OP ${numeroOp} aprobada — ${clienteNombre}`,
    html,
  })
}

export async function emailOPRechazada({
  vendedorEmail,
  vendedorNombre,
  numeroOp,
  clienteNombre,
  tipoOp,
  motivo,
}: {
  vendedorEmail: string
  vendedorNombre: string
  numeroOp: number
  clienteNombre: string
  tipoOp: string
  motivo: string
}) {
  const cc = splitEmails(process.env.NOTIFY_RECHAZADA_CC)

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto">
      <div style="background:#1e40af;color:white;padding:18px 24px;border-radius:8px 8px 0 0">
        <h2 style="margin:0;font-size:18px">Patagonia — Gestión de Producción</h2>
      </div>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-top:none;padding:20px 24px">
        <h3 style="color:#991b1b;margin-top:0">❌ OP Rechazada — Requiere corrección</h3>
        <p>Hola <strong>${vendedorNombre}</strong>, la siguiente OP fue <strong>rechazada</strong> por Oficina Técnica. Por favor revisa el motivo y reingresa la OP corregida.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
          <tr style="background:#fee2e2"><td style="padding:8px 12px;font-weight:600;width:160px">N° OP</td><td style="padding:8px 12px">${numeroOp}</td></tr>
          <tr><td style="padding:8px 12px;color:#6b7280">Cliente</td><td style="padding:8px 12px">${clienteNombre}</td></tr>
          <tr style="background:#fef2f2"><td style="padding:8px 12px;color:#6b7280">Tipo</td><td style="padding:8px 12px">${tipoOp}</td></tr>
        </table>
        <div style="background:#fff;border-left:4px solid #ef4444;padding:14px 16px;margin:16px 0;border-radius:0 6px 6px 0">
          <p style="margin:0 0 6px;font-size:12px;color:#6b7280;text-transform:uppercase;font-weight:700;letter-spacing:.05em">Motivo de rechazo</p>
          <p style="margin:0;color:#374151;font-size:14px">${motivo}</p>
        </div>
        <a href="https://app-registro-op.vercel.app/ops"
           style="display:inline-block;background:#dc2626;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">
          Ver OP y reingresar →
        </a>
      </div>
      <div style="background:#f9fafb;padding:12px 24px;border-radius:0 0 8px 8px;font-size:12px;color:#9ca3af;border:1px solid #e5e7eb;border-top:none">
        Contenedores Patagonia SpA — Sistema de Gestión de Producción
      </div>
    </div>`

  await resend.emails.send({
    from: FROM,
    to: [vendedorEmail],
    cc: cc.length > 0 ? cc : undefined,
    subject: `❌ OP ${numeroOp} rechazada — ${clienteNombre}`,
    html,
  })
}

export async function emailNuevaOP({
  numeroOp,
  clienteNombre,
  tipoOp,
  vendedorNombre,
  otEmails,
}: {
  numeroOp: number
  clienteNombre: string
  tipoOp: string
  vendedorNombre: string
  otEmails: string[]
}) {
  if (otEmails.length === 0) return

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto">
      <div style="background:#1e40af;color:white;padding:18px 24px;border-radius:8px 8px 0 0">
        <h2 style="margin:0;font-size:18px">Patagonia — Gestión de Producción</h2>
      </div>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-top:none;padding:20px 24px">
        <h3 style="color:#92400e;margin-top:0">🔔 Nueva OP pendiente de revisión</h3>
        <p>Se ha ingresado una nueva OP que requiere revisión y aprobación de Oficina Técnica.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
          <tr style="background:#fef9c3"><td style="padding:8px 12px;font-weight:600;width:160px">N° OP</td><td style="padding:8px 12px">${numeroOp}</td></tr>
          <tr><td style="padding:8px 12px;color:#6b7280">Cliente</td><td style="padding:8px 12px">${clienteNombre}</td></tr>
          <tr style="background:#fffbeb"><td style="padding:8px 12px;color:#6b7280">Tipo</td><td style="padding:8px 12px">${tipoOp}</td></tr>
          <tr><td style="padding:8px 12px;color:#6b7280">Ingresada por</td><td style="padding:8px 12px">${vendedorNombre}</td></tr>
        </table>
        <a href="https://app-registro-op.vercel.app/ops"
           style="display:inline-block;background:#1e40af;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">
          Revisar OP →
        </a>
      </div>
      <div style="background:#f9fafb;padding:12px 24px;border-radius:0 0 8px 8px;font-size:12px;color:#9ca3af;border:1px solid #e5e7eb;border-top:none">
        Contenedores Patagonia SpA — Sistema de Gestión de Producción
      </div>
    </div>`

  await resend.emails.send({
    from: FROM,
    to: otEmails,
    subject: `🔔 Nueva OP ${numeroOp} pendiente — ${clienteNombre}`,
    html,
  })
}
