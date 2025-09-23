'use client'

import { useState, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Package, 
  FileText, 
  Truck, 
  BarChart3,
  QrCode,
  Users,
  Eye,
  Settings,
  Menu,
  X
} from 'lucide-react'

interface AppLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  headerActions?: ReactNode
}

// Menu items configuration
const menuItems = [
  { title: 'Dashboard', href: '/', icon: BarChart3 },
  { title: 'Pallets', href: '/pallets', icon: Package },
  { title: 'Manifestos (Saídas)', href: '/manifests', icon: FileText },
  { title: 'Recebimentos', href: '/receipts', icon: Truck },
  { title: 'Comparações', href: '/comparisons', icon: Eye },
  { title: 'Administração', href: '/admin', icon: Settings },
]

export function AppLayout({ children, title, subtitle, headerActions }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800/95 backdrop-blur-xl border-r border-slate-700/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg shadow-lg shadow-blue-500/25">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white">SmartPallet</h2>
                <p className="text-xs text-slate-400">Sistema Inteligente</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-slate-400 hover:text-white transition-colors lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-500/20 to-cyan-400/20 border border-blue-500/30 text-blue-400' 
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'}`} />
                  <span className="font-medium">{item.title}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 text-slate-400 hover:text-white transition-colors lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="hidden lg:block">
                  <h1 className="text-xl font-bold text-white">{title}</h1>
                  {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
                </div>
                <div className="lg:hidden">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg">
                      <Package className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-lg font-bold text-white">{title}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 md:space-x-4">
                {headerActions}
                <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm hidden md:block">
                  Voltar ao início
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {children}
        </div>
      </div>
    </div>
  )
}
