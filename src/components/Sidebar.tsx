'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  ClipboardList,
  Table2,
  Wrench,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  role: string
  userEmail: string
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ot', 'terreno', 'admin'] },
  { href: '/ingreso', label: 'Ingreso OP', icon: ClipboardList, roles: ['ot', 'admin'] },
  { href: '/programa', label: 'Programa', icon: Table2, roles: ['ot', 'terreno', 'admin'] },
  { href: '/of', label: 'Órdenes de Fabricación', icon: Wrench, roles: ['ot', 'admin'] },
]

export default function Sidebar({ role, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const visibleItems = navItems.filter(item => item.roles.includes(role))

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-4 py-5 border-b border-gray-200">
        <div className="text-lg font-bold text-blue-800 leading-tight">Patagonia</div>
        <div className="text-xs text-gray-500 mt-0.5">Gestión de Producción</div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {visibleItems.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-50 text-blue-800'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon size={16} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={14} className="text-blue-400" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-3 border-t border-gray-200">
        <div className="text-xs text-gray-500 truncate mb-1">{userEmail}</div>
        <div className="text-xs font-medium text-blue-700 uppercase mb-2">{role}</div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-gray-600 h-8 px-2" onClick={handleLogout}>
          <LogOut size={14} />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  )
}
