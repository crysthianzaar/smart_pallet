'use client'

import Link from 'next/link'
import { AppLayout } from '../../components/layout/AppLayout'
import { 
  Package, 
  FileText, 
  Truck, 
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  ArrowRight,
  Calendar,
  Filter,
  QrCode,
  Eye,
  Users,
  Settings
} from 'lucide-react'

// Mock data - será substituído por dados reais da API
const dashboardData = {
  kpis: {
    totalPallets: 1247,
    palletsInTransit: 89,
    manifestsToday: 23,
    receiptsToday: 18,
    criticalDifferences: 5,
    avgConfidence: 87.3
  },
  recentActivity: [
    {
      id: 1,
      type: 'pallet_created',
      description: 'Pallet PAL-2024-001 criado',
      timestamp: '2024-01-20 14:30',
      status: 'success'
    },
    {
      id: 2,
      type: 'manifest_loaded',
      description: 'Manifesto MAN-2024-005 carregado',
      timestamp: '2024-01-20 13:45',
      status: 'success'
    },
    {
      id: 3,
      type: 'comparison_critical',
      description: 'Diferença crítica detectada em PAL-2024-003',
      timestamp: '2024-01-20 12:15',
      status: 'error'
    }
  ],
  pendingTasks: [
    {
      id: 1,
      title: 'Revisar contagem manual',
      description: 'Pallet PAL-2024-001 - Confiança IA: 62%',
      priority: 'high',
      dueDate: '2024-01-20'
    },
    {
      id: 2,
      title: 'Confirmar recebimento',
      description: 'Manifesto MAN-2024-004 aguardando confirmação',
      priority: 'medium',
      dueDate: '2024-01-21'
    }
  ]
}

export default function DashboardPage() {
  const { kpis, recentActivity, pendingTasks } = dashboardData

  const headerActions = (
    <>
      <button className="p-2 text-slate-400 hover:text-white transition-colors hidden md:block">
        <Filter className="h-5 w-5" />
      </button>
      <button className="p-2 text-slate-400 hover:text-white transition-colors hidden md:block">
        <Calendar className="h-5 w-5" />
      </button>
    </>
  )

  return (
    <AppLayout 
      title="Dashboard" 
      subtitle="Visão geral do sistema"
      headerActions={headerActions}
    >
        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Total de Pallets</h3>
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg shadow-lg shadow-blue-500/25">
                <Package className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{kpis.totalPallets.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-400">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% em relação ao mês passado
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Em Trânsito</h3>
              <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg shadow-lg shadow-yellow-500/25">
                <Truck className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{kpis.palletsInTransit}</div>
            <div className="flex items-center text-xs text-yellow-400">
              <Clock className="h-3 w-3 mr-1" />
              Aguardando recebimento
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Manifestos Hoje</h3>
              <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg shadow-lg shadow-purple-500/25">
                <FileText className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{kpis.manifestsToday}</div>
            <div className="flex items-center text-xs text-green-400">
              <TrendingUp className="h-3 w-3 mr-1" />
              +3 desde ontem
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Recebimentos Hoje</h3>
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg shadow-green-500/25">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{kpis.receiptsToday}</div>
            <div className="flex items-center text-xs text-green-400">
              <BarChart3 className="h-3 w-3 mr-1" />
              78% de taxa de recebimento
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Diferenças Críticas</h3>
              <div className="p-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg shadow-lg shadow-red-500/25">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-red-400 mb-2">{kpis.criticalDifferences}</div>
            <div className="flex items-center text-xs text-red-400">
              <XCircle className="h-3 w-3 mr-1" />
              Requer atenção imediata
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Confiança IA Média</h3>
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg shadow-lg shadow-cyan-500/25">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{kpis.avgConfidence}%</div>
            <div className="flex items-center text-xs text-green-400">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2.1% esta semana
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Activity */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white mb-2">Atividade Recente</h2>
              <p className="text-sm text-slate-400">Últimas ações realizadas no sistema</p>
            </div>
            <div className="space-y-4 mb-6">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-700/50 transition-all duration-300">
                  <div className={`mt-1.5 h-2 w-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      {activity.description}
                    </p>
                    <p className="text-xs text-slate-400">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link 
              href="/activity" 
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-slate-700/50 text-slate-300 font-medium rounded-lg hover:bg-slate-600/50 transition-all duration-200"
            >
              Ver todas as atividades
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {/* Pending Tasks */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white mb-2">Tarefas Pendentes</h2>
              <p className="text-sm text-slate-400">Itens que requerem sua atenção</p>
            </div>
            <div className="space-y-4 mb-6">
              {pendingTasks.map((task) => (
                <div key={task.id} className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 hover:bg-slate-700/50 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white mb-1">
                        {task.title}
                      </h4>
                      <p className="text-xs text-slate-400 mb-2">
                        {task.description}
                      </p>
                      <p className="text-xs text-slate-500">
                        Prazo: {task.dueDate}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.priority === 'high' 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {task.priority === 'high' ? 'Alta' : 'Média'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Link 
              href="/tasks" 
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-slate-700/50 text-slate-300 font-medium rounded-lg hover:bg-slate-600/50 transition-all duration-200"
            >
              Ver todas as tarefas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white mb-2">Ações Rápidas</h2>
            <p className="text-sm text-slate-400">Acesso rápido às funcionalidades mais utilizadas</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/pallets/new" className="flex flex-col items-center justify-center h-20 bg-slate-700/30 border border-slate-600/50 rounded-lg hover:bg-slate-700/50 hover:border-blue-500/50 transition-all duration-300 group">
              <Package className="h-6 w-6 text-slate-400 group-hover:text-blue-400 transition-colors" />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors mt-2">Novo Pallet</span>
            </Link>
            <Link href="/manifests/new" className="flex flex-col items-center justify-center h-20 bg-slate-700/30 border border-slate-600/50 rounded-lg hover:bg-slate-700/50 hover:border-purple-500/50 transition-all duration-300 group">
              <FileText className="h-6 w-6 text-slate-400 group-hover:text-purple-400 transition-colors" />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors mt-2">Criar Manifesto</span>
            </Link>
            <Link href="/receipts/new" className="flex flex-col items-center justify-center h-20 bg-slate-700/30 border border-slate-600/50 rounded-lg hover:bg-slate-700/50 hover:border-green-500/50 transition-all duration-300 group">
              <Truck className="h-6 w-6 text-slate-400 group-hover:text-green-400 transition-colors" />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors mt-2">Receber Pallet</span>
            </Link>
            <Link href="/reports" className="flex flex-col items-center justify-center h-20 bg-slate-700/30 border border-slate-600/50 rounded-lg hover:bg-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 group">
              <BarChart3 className="h-6 w-6 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors mt-2">Relatórios</span>
            </Link>
          </div>
        </div>
    </AppLayout>
  )
}
