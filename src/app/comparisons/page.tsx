'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppLayout } from '../../components/layout/AppLayout'
import { 
  Search, 
  Filter, 
  BarChart3, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Download,
  Eye,
  Package,
  Calendar
} from 'lucide-react'

// Mock data
const comparisons = [
  {
    id: 'COMP-2024-001',
    palletId: 'PAL-2024-003',
    skuCode: 'PROD-A-001',
    skuName: 'Produto A Premium',
    expectedQty: 75,
    receivedQty: 73,
    difference: -2,
    status: 'ok',
    percentage: -2.67,
    contractName: 'Cliente A',
    location: 'Armazém B - Setor 2',
    comparedAt: '2024-01-20 14:30',
    comparedBy: 'Ana Costa',
    reason: 'Variação dentro da margem aceitável'
  },
  {
    id: 'COMP-2024-002',
    palletId: 'PAL-2024-004',
    skuCode: 'PROD-B-002',
    skuName: 'Produto B Standard',
    expectedQty: 100,
    receivedQty: 85,
    difference: -15,
    status: 'critico',
    percentage: -15.0,
    contractName: 'Cliente C',
    location: 'Loja Centro',
    comparedAt: '2024-01-19 15:20',
    comparedBy: 'Maria Santos',
    reason: 'Diferença significativa - possível avaria durante transporte'
  },
  {
    id: 'COMP-2024-003',
    palletId: 'PAL-2024-002',
    skuCode: 'PROD-C-003',
    skuName: 'Produto C Deluxe',
    expectedQty: 50,
    receivedQty: 55,
    difference: 5,
    status: 'alerta',
    percentage: 10.0,
    contractName: 'Cliente B',
    location: 'Centro de Distribuição Sul',
    comparedAt: '2024-01-20 13:45',
    comparedBy: 'Carlos Silva',
    reason: 'Quantidade superior ao esperado - verificar origem'
  },
  {
    id: 'COMP-2024-004',
    palletId: 'PAL-2024-001',
    skuCode: 'PROD-D-004',
    skuName: 'Produto D Basic',
    expectedQty: 200,
    receivedQty: 200,
    difference: 0,
    status: 'ok',
    percentage: 0,
    contractName: 'Cliente A',
    location: 'Armazém A - Setor 1',
    comparedAt: '2024-01-19 16:45',
    comparedBy: 'João Silva',
    reason: 'Quantidade exata conforme esperado'
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ok': return 'success'
    case 'alerta': return 'warning'
    case 'critico': return 'critical'
    default: return 'secondary'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'ok': return 'OK'
    case 'alerta': return 'Alerta'
    case 'critico': return 'Crítico'
    default: return status
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ok': return CheckCircle
    case 'alerta': return AlertTriangle
    case 'critico': return XCircle
    default: return CheckCircle
  }
}

export default function ComparisonsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredComparisons = comparisons.filter(comparison => {
    const matchesSearch = comparison.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comparison.palletId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comparison.skuCode.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || comparison.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: comparisons.length,
    ok: comparisons.filter(c => c.status === 'ok').length,
    critical: comparisons.filter(c => c.status === 'critical').length,
    warning: comparisons.filter(c => c.status === 'warning').length,
    avgDifference: comparisons.reduce((acc, c) => acc + Math.abs(c.percentage), 0) / comparisons.length
  }

  const headerActions = (
    <button className="px-4 py-2 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-all duration-200 flex items-center">
      <Download className="h-4 w-4 mr-2" />
      Exportar Relatório
    </button>
  )

  const exportReport = () => {
    // TODO: Implement export functionality
    console.log('Exporting comparison report...')
  }

  return (
    <AppLayout 
      title="Comparações" 
      subtitle="Análise de diferenças entre esperado e recebido"
      headerActions={headerActions}
    >
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ID, pallet, SKU ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="all">Todos os status</option>
            <option value="ok">OK</option>
            <option value="warning">Alerta</option>
            <option value="critical">Crítico</option>
          </select>
          <button className="px-4 py-3 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-all duration-200 flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">OK</p>
                <p className="text-2xl font-bold text-white">{stats.ok}</p>
              </div>
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-400 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Alertas</p>
                <p className="text-2xl font-bold text-white">{stats.warning}</p>
              </div>
              <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Críticos</p>
                <p className="text-2xl font-bold text-white">{stats.critical}</p>
              </div>
              <div className="p-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg">
                <XCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Diferença Média</p>
                <p className="text-2xl font-bold text-white">{stats.avgDifference.toFixed(1)}%</p>
              </div>
              <div className="p-2 bg-gradient-to-r from-slate-600 to-slate-500 rounded-lg">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Comparisons List */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl">
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-lg font-bold text-white">Lista de Comparações</h2>
            <p className="text-sm text-slate-400 mt-1">Análise detalhada das diferenças encontradas</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {filteredComparisons.map((comparison) => {
                const StatusIcon = getStatusIcon(comparison.status)
                
                return (
                  <div key={comparison.id} className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 hover:bg-slate-700/50 transition-all duration-300">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start space-x-4">
                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          comparison.status === 'ok' ? 'bg-green-500/20 border border-green-500/30' :
                          comparison.status === 'warning' ? 'bg-yellow-500/20 border border-yellow-500/30' :
                          'bg-red-500/20 border border-red-500/30'
                        }`}>
                          <StatusIcon className={`h-6 w-6 ${
                            comparison.status === 'ok' ? 'text-green-400' :
                            comparison.status === 'warning' ? 'text-yellow-400' :
                            'text-red-400'
                          }`} />
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-semibold text-white">{comparison.id}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              comparison.status === 'ok' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                              comparison.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                              'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {comparison.status === 'ok' ? 'OK' : comparison.status === 'warning' ? 'Alerta' : 'Crítico'}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-2">
                            <span className="flex items-center">
                              <Package className="h-4 w-4 mr-1" />
                              {comparison.palletId}
                            </span>
                            <span>{comparison.skuCode}</span>
                            <span className="font-medium text-slate-300">{comparison.skuName}</span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-2">
                            <span>Esperado: {comparison.expectedQty}</span>
                            <span>Recebido: {comparison.receivedQty}</span>
                            <span className={`font-medium ${
                              comparison.difference > 0 ? 'text-green-400' :
                              comparison.difference < 0 ? 'text-red-400' :
                              'text-slate-400'
                            }`}>
                              Diferença: {comparison.difference > 0 ? '+' : ''}{comparison.difference} ({comparison.percentage > 0 ? '+' : ''}{comparison.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          
                          <div className="text-xs text-slate-500 mb-1">
                            {comparison.location} • Comparado por {comparison.comparedBy} em {comparison.comparedAt}
                          </div>
                          
                          {comparison.reason && (
                            <div className="text-xs text-slate-400 italic">
                              {comparison.reason}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className={`text-sm px-3 py-1 rounded-full font-medium ${
                          comparison.percentage > 5 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          comparison.percentage < -5 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          Math.abs(comparison.percentage) > 2 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                          {comparison.percentage > 0 ? '+' : ''}{comparison.percentage.toFixed(1)}%
                        </div>
                        
                        <button className="px-3 py-2 bg-slate-600/50 text-slate-300 border border-slate-500/50 rounded-lg hover:bg-slate-500/50 transition-all duration-200 flex items-center text-sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {filteredComparisons.length === 0 && (
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Nenhuma comparação encontrada
                </h3>
                <p className="text-slate-400 mb-6">
                  Tente ajustar os filtros ou aguardar novas comparações.
                </p>
              </div>
            )}
          </div>
        </div>
    </AppLayout>
  )
}
