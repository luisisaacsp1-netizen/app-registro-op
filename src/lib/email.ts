import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? 'Patagonia Producción <onboarding@resend.dev>'

export async function emailOPAprobada({
  vendedorEmail,
  vendedorNombre,
  numeroOp,
  clienteNombre,
  observaciones,
}: {
  vendedorEmail: string
  vendedorNombre: string
  numeroOp: number
  clienteNombre: string
  observaciones?: string
}) {
  await resend.emails.send({
    from: FROM,
    to: [vendedorEmail],
    subject: `✅ OP ${numeroOp} aprobada — ${clienteNombre}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:#1e40af;color:white;padding:16px 24px;border-radius:8px 8px 0 0">
          <h2 style="margin:0;font-size:18px">Patagonia — Gestión de Producción</h2>
        </div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:20px 24px">
          <h3 style="color:#166534;margin-top:0">✅ OP Aprobada</h3>
          <p>Hola <strong>${vendedorNombre}</strong>,</p>
          <p>Tu Orden de Producción fue <strong>aprobada</strong> por Oficina Técnica y ha sido ingresada al programa de producción.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:6px 0;color:#6b7280;width:140px">N° OP:</td><td style="font-weight:bold">${numeroOp}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Cliente:</td><td>${clienteNombre}</td></tr>
            ${observaciones ? `<tr><td style="padding:6px 0;color:#6b7280">Observaciones:</td><td>${observaciones}</td></tr>` : ''}
          </table>
          <p style="color:#374151">Puedes revisar el estado en: <a href="https://app-registro-op.vercel.app/ops" style="color:#1d4ed8">app-registro-op.vercel.app</a></p>
        </div>
        <div style="background:#f9fafb;padding:12px 24px;border-radius:0 0 8px 8px;font-size:12px;color:#9ca3af">
          Contenedores Patagonia SpA — Sistema de Gestión de Producción
        </div>
      </div>
    `,
  })
}

export async function emailOPRechazada({
  vendedorEmail,
  vendedorNombre,
  numeroOp,
  clienteNombre,
  motivo,
}: {
  vendedorEmail: string
  vendedorNombre: string
  numeroOp: number
  clienteNombre: string
  motivo: string
}) {
  await resend.emails.send({
    from: FROM,
    to: [vendedorEmail],
    subject: `❌ OP ${numeroOp} rechazada — ${clienteNombre}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:#1e40af;color:white;padding:16px 24px;border-radius:8px 8px 0 0">
          <h2 style="margin:0;font-size:18px">Patagonia — Gestión de Producción</h2>
        </div>
        <div style="background:#fef2f2;border:1px solid #fecaca;padding:20px 24px">
          <h3 style="color:#991b1b;margin-top:0">❌ OP Rechazada</h3>
          <p>Hola <strong>${vendedorNombre}</strong>,</p>
          <p>Tu Orden de Producción fue <strong>rechazada</strong> por Oficina Técnica. Por favor revisa el motivo y corrige la OP.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:6px 0;color:#6b7280;width:140px">N° OP:</td><td style="font-weight:bold">${numeroOp}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Cliente:</td><td>${clienteNombre}</td></tr>
          </table>
          <div style="background:#fff;border-left:4px solid #ef4444;padding:12px 16px;margin:16px 0;border-radius:0 4px 4px 0">
            <p style="margin:0;font-size:13px;color:#6b7280;text-transform:uppercase;font-weight:600">Motivo de rechazo</p>
            <p style="margin:8px 0 0;color:#374151">${motivo}</p>
          </div>
          <p style="color:#374151">Ingresa a la app para corregir y reingresar la OP: <a href="https://app-registro-op.vercel.app/ops" style="color:#1d4ed8">app-registro-op.vercel.app</a></p>
        </div>
        <div style="background:#f9fafb;padding:12px 24px;border-radius:0 0 8px 8px;font-size:12px;color:#9ca3af">
          Contenedores Patagonia SpA — Sistema de Gestión de Producción
        </div>
      </div>
    `,
  })
}

export async function emailNuevaOP({
  numeroOp,
  clienteNombre,
  tipoOp,
  vendedorNombre,
  otEmail,
}: {
  numeroOp: number
  clienteNombre: string
  tipoOp: string
  vendedorNombre: string
  otEmail: string
}) {
  await resend.emails.send({
    from: FROM,
    to: [otEmail],
    subject: `🔔 Nueva OP ${numeroOp} pendiente de revisión`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:#1e40af;color:white;padding:16px 24px;border-radius:8px 8px 0 0">
          <h2 style="margin:0;font-size:18px">Patagonia — Gestión de Producción</h2>
        </div>
        <div style="background:#fffbeb;border:1px solid #fde68a;padding:20px 24px">
          <h3 style="color:#92400e;margin-top:0">🔔 Nueva OP pendiente de revisión</h3>
          <p>Se ha ingresado una nueva Orden de Producción que requiere tu revisión.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:6px 0;color:#6b7280;width:140px">N° OP:</td><td style="font-weight:bold">${numeroOp}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Cliente:</td><td>${clienteNombre}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Tipo:</td><td>${tipoOp}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Ingresada por:</td><td>${vendedorNombre}</td></tr>
          </table>
          <a href="https://app-registro-op.vercel.app/ops"
             style="display:inline-block;background:#1e40af;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
            Revisar OP →
          </a>
        </div>
        <div style="background:#f9fafb;padding:12px 24px;border-radius:0 0 8px 8px;font-size:12px;color:#9ca3af">
          Contenedores Patagonia SpA — Sistema de Gestión de Producción
        </div>
      </div>
    `,
  })
}
