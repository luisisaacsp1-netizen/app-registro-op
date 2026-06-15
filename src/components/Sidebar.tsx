'use client'

import Link from 'next/link'
import LogoPatagonia from '@/components/LogoPatagonia'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  ClipboardList,
  Table2,
  Wrench,
  LogOut,
  FileCheck2,
  UserCircle,
  ShieldCheck,
} from 'lucide-react'

interface SidebarProps {
  role: string
  userEmail: string
  nombreCompleto?: string
}

const navItems = [
  { href: '/',          label: 'Dashboard',              icon: LayoutDashboard, roles: ['ot','terreno','admin','ventas'] },
  { href: '/ops',       label: 'Órdenes de Producción',  icon: FileCheck2,      roles: ['ot','terreno','admin','ventas'] },
  { href: '/ingreso',   label: 'Ingreso directo OP',     icon: ClipboardList,   roles: ['ot','admin'] },
  { href: '/ops/nueva', label: 'Ingresar OP',            icon: ClipboardList,   roles: ['ventas'] },
  { href: '/programa',  label: 'Programa',               icon: Table2,          roles: ['ot','terreno','admin'] },
  { href: '/of',        label: 'Órdenes de Fabricación', icon: Wrench,          roles: ['ot','admin'] },
  { href: '/admin',     label: 'Usuarios',               icon: ShieldCheck,     roles: ['admin'] },
  { href: '/perfil',    label: 'Mi perfil',              icon: UserCircle,      roles: ['ot','terreno','admin','ventas'] },
]

function getInitials(email: string, nombre?: string) {
  if (nombre) {
    const parts = nombre.trim().split(' ')
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

export default function Sidebar({ role, userEmail, nombreCompleto }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const visibleItems = navItems.filter(i => i.roles.includes(role))
  const initials     = getInitials(userEmail, nombreCompleto)

  return (
    <aside style={{
      width: 52, minWidth: 52,
      background: '#0d1b2e',
      borderRight: '2px solid #e63329',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '8px 0', zIndex: 300, flexShrink: 0,
    }}>

      {/* Logo */}
      <div style={{ width: 36, height: 36, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LogoPatagonia variant="icon" height={34} />
      </div>

      {/* Separador */}
      <div style={{ width: 28, height: 1, background: 'rgba(255,255,255,.1)', margin: '4px 0 6px', flexShrink: 0 }} />

      {/* Items nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1, width: '100%', padding: '0 6px' }}>
        {visibleItems.map(item => {
          const Icon   = item.icon
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <div key={item.href} style={{ position: 'relative', width: '100%' }} className="group">
              <Link
                href={item.href}
                style={{
                  position: 'relative',
                  width: 40, height: 40,
                  borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: active ? 'rgba(230,51,41,.18)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,.45)',
                  transition: 'background .15s, color .15s',
                  border: 'none',
                  margin: '0 auto',
                }}
                className="sb-link"
              >
                {/* Indicador rojo izquierda */}
                {active && (
                  <span style={{
                    position: 'absolute', left: 0, top: 8, bottom: 8,
                    width: 3, borderRadius: '0 3px 3px 0', background: '#e63329',
                  }} />
                )}
                <Icon size={18} />
              </Link>

              {/* Tooltip */}
              <div
                className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  position: 'absolute', left: 52, top: '50%', transform: 'translateY(-50%)',
                  background: '#132338', color: '#fff',
                  fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 600,
                  padding: '5px 10px', borderRadius: 6, whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(0,0,0,.4)',
                  border: '1px solid rgba(255,255,255,.1)',
                  zIndex: 500,
                }}
              >
                {item.label}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Separador */}
      <div style={{ width: 28, height: 1, background: 'rgba(255,255,255,.1)', margin: '4px 0', flexShrink: 0 }} />

      {/* Avatar + logout */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingBottom: 6 }}>

        {/* Avatar */}
        <div style={{ position: 'relative' }} className="group">
          <Link href="/perfil"
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: '#1a3050', color: '#fff',
              fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid rgba(255,255,255,.15)',
              transition: 'border-color .15s',
            }}
            className="sb-avatar"
          >
            {initials}
          </Link>
          <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              position: 'absolute', left: 52, top: '50%', transform: 'translateY(-50%)',
              background: '#132338', color: '#fff', fontSize: 11,
              fontFamily: 'Montserrat, sans-serif', fontWeight: 600,
              padding: '5px 10px', borderRadius: 6, whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,.4)', border: '1px solid rgba(255,255,255,.1)', zIndex: 500,
            }}>
            {nombreCompleto ?? userEmail}
          </div>
        </div>

        {/* Logout */}
        <div style={{ position: 'relative' }} className="group">
          <button
            onClick={handleLogout}
            style={{
              width: 36, height: 36, borderRadius: 8, border: 'none',
              background: 'transparent', color: 'rgba(255,255,255,.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'background .15s, color .15s',
            }}
            className="sb-logout"
          >
            <LogOut size={15} />
          </button>
          <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              position: 'absolute', left: 52, top: '50%', transform: 'translateY(-50%)',
              background: '#132338', color: '#fff', fontSize: 11,
              fontFamily: 'Montserrat, sans-serif', fontWeight: 600,
              padding: '5px 10px', borderRadius: 6, whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,.4)', border: '1px solid rgba(255,255,255,.1)', zIndex: 500,
            }}>
            Cerrar sesión
          </div>
        </div>

      </div>

      <style>{`
        .sb-link:hover { background: #132338 !important; color: #fff !important; }
        .sb-avatar:hover { border-color: #e63329 !important; }
        .sb-logout:hover { background: #132338 !important; color: #e63329 !important; }
      `}</style>
    </aside>
  )
}
