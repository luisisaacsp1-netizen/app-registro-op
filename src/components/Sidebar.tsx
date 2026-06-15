'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
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
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ot', 'terreno', 'admin', 'ventas'] },
  { href: '/ops', label: 'Órdenes de Producción', icon: FileCheck2, roles: ['ot', 'terreno', 'admin', 'ventas'] },
  { href: '/ingreso', label: 'Ingreso directo OP', icon: ClipboardList, roles: ['ot', 'admin'] },
  { href: '/ops/nueva', label: 'Ingresar OP', icon: ClipboardList, roles: ['ventas'] },
  { href: '/programa', label: 'Programa', icon: Table2, roles: ['ot', 'terreno', 'admin'] },
  { href: '/of', label: 'Órdenes de Fabricación', icon: Wrench, roles: ['ot', 'admin'] },
  { href: '/admin', label: 'Usuarios', icon: ShieldCheck, roles: ['admin'] },
  { href: '/perfil', label: 'Mi perfil', icon: UserCircle, roles: ['ot', 'terreno', 'admin', 'ventas'] },
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
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const visibleItems = navItems.filter(item => item.roles.includes(role))
  const initials = getInitials(userEmail, nombreCompleto)

  return (
    <aside
      className="flex flex-col items-center flex-shrink-0 border-r"
      style={{
        width: 52,
        minWidth: 52,
        background: '#1a2744',
        borderColor: '#2a3552',
      }}
    >
      {/* Logo */}
      <div className="flex items-center justify-center mt-2 mb-2" style={{ width: 36, height: 36 }}>
        <Image src="/logo.svg" alt="Patagonia" width={32} height={32} className="rounded" style={{ objectFit: 'contain', background: '#0d1b2e', borderRadius: 6 }} />
      </div>

      {/* Divider */}
      <div style={{ width: 28, height: 1, background: '#2a3552', margin: '4px 0 6px' }} />

      {/* Nav items */}
      <nav className="flex flex-col items-center gap-1 flex-1 w-full px-1.5">
        {visibleItems.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <div key={item.href} className="relative group w-full">
              <Link
                href={item.href}
                className={cn(
                  'relative flex items-center justify-center rounded-lg transition-colors',
                  'w-full h-10'
                )}
                style={{
                  background: active ? 'rgba(26,106,191,0.25)' : 'transparent',
                  color: active ? '#60a5fa' : '#64748b',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = '#243056'
                  if (!active) (e.currentTarget as HTMLElement).style.color = '#e2e8f0'
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
                  if (!active) (e.currentTarget as HTMLElement).style.color = '#64748b'
                }}
              >
                {/* Active indicator */}
                {active && (
                  <span
                    className="absolute left-0 rounded-r"
                    style={{ top: 8, bottom: 8, width: 3, background: '#60a5fa' }}
                  />
                )}
                <Icon size={18} />
              </Link>

              {/* Tooltip */}
              <div
                className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50
                  pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: '#1e293b',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '5px 10px',
                  borderRadius: 6,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(0,0,0,.4)',
                  border: '1px solid #2a3552',
                }}
              >
                {item.label}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Divider */}
      <div style={{ width: 28, height: 1, background: '#2a3552', margin: '6px 0 4px' }} />

      {/* Avatar + logout */}
      <div className="flex flex-col items-center gap-2 pb-3">
        <div className="relative group">
          <Link href="/perfil"
            className="flex items-center justify-center rounded-full text-white font-bold text-xs cursor-pointer transition-all"
            style={{
              width: 30, height: 30,
              background: '#1558a0',
              border: '2px solid transparent',
              fontSize: 11,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#60a5fa' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent' }}
          >
            {initials}
          </Link>
          {/* Tooltip avatar */}
          <div
            className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50
              pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: '#1e293b', color: '#fff', fontSize: 11, fontWeight: 600,
              padding: '5px 10px', borderRadius: 6, whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,.4)', border: '1px solid #2a3552',
            }}
          >
            {nombreCompleto ?? userEmail}
          </div>
        </div>

        <div className="relative group">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{ width: 36, height: 36, color: '#64748b', background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#243056'; (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748b' }}
          >
            <LogOut size={16} />
          </button>
          <div
            className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50
              pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: '#1e293b', color: '#fff', fontSize: 11, fontWeight: 600,
              padding: '5px 10px', borderRadius: 6, whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,.4)', border: '1px solid #2a3552',
            }}
          >
            Cerrar sesión
          </div>
        </div>
      </div>
    </aside>
  )
}
