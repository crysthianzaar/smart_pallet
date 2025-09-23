'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../../lib/utils'
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Truck, 
  Users, 
  Settings,
  BarChart3,
  QrCode
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pallets', href: '/pallets', icon: Package },
  { name: 'Manifestos', href: '/manifests', icon: FileText },
  { name: 'Recebimentos', href: '/receipts', icon: Truck },
  { name: 'Comparações', href: '/comparisons', icon: BarChart3 },
  { name: 'QR Scanner', href: '/scanner', icon: QrCode },
  { name: 'Usuários', href: '/admin/users', icon: Users },
  { name: 'Configurações', href: '/admin/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <Package className="h-8 w-8 text-blue-600" />
        <span className="ml-2 text-xl font-bold text-gray-900">SmartPallet</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-sm font-medium text-white">U</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">Usuário</p>
            <p className="text-xs text-gray-500">Conferente</p>
          </div>
        </div>
      </div>
    </div>
  )
}
