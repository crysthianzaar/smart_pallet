'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppLayout } from '../../components/layout/AppLayout'
import { 
  Plus, 
  Search, 
  Filter, 
  Truck, 
  Package,
  Eye,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  User,
  Loader2
} from 'lucide-react'

interface Receipt {
  id: string
  pallet_id?: string
  manifest_id: string
  received_by: string
  status: 'ok' | 'alerta' | 'critico'
  observations?: string
  received_at: string
  display_name?: string
  manifest_number?: string
}

interface ReceiptStats {
  total: number
  byStatus: Record<string, number>
  todayCount: number
  avgConfidence: number
  criticalCount: number
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
    case 'critico': return AlertTriangle
    default: return Clock
  }
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [stats, setStats] = useState<ReceiptStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchReceipts()
    fetchStats()
  }, [])

  const fetchReceipts = async () => {
    try {
      const response = await fetch('/api/receipts')
      if (response.ok) {
        const data = await response.json()
        setReceipts(data)
      }
    } catch (error) {
      console.error('Error fetching receipts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/receipts/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching receipt stats:', error)
    }
  }

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = (receipt.display_name || receipt.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (receipt.pallet_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (receipt.manifest_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || receipt.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const headerActions = (
    <Link 
      href="/receipts/new"
      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-400 text-white font-semibold rounded-lg shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 transition-all duration-200 flex items-center"
    >
      <Plus className="h-4 w-4 mr-2" />
      Novo Recebimento
    </Link>
  )

  if (loading) {
    return (
      <AppLayout 
        title="Recebimentos" 
        subtitle="Gestão de recebimentos de pallets"
        headerActions={headerActions}
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-slate-400">Carregando recebimentos...</span>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout 
      title="Recebimentos" 
      subtitle="Gestão de recebimentos de pallets"
      headerActions={headerActions}
    >
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por ID ou pallet..."
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
          <option value="alerta">Alerta</option>
          <option value="critico">Crítico</option>
        </select>
        <button className="px-4 py-3 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-all duration-200 flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Hoje</p>
                <p className="text-2xl font-bold text-white">{stats.todayCount}</p>
              </div>
              <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">OK</p>
                <p className="text-2xl font-bold text-white">{stats.byStatus.ok || 0}</p>
              </div>
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-400 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Críticos</p>
                <p className="text-2xl font-bold text-white">{stats.byStatus.critico || 0}</p>
              </div>
              <div className="p-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipts List */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-bold text-white">Lista de Recebimentos</h2>
          <p className="text-sm text-slate-400 mt-1">Gerencie todos os recebimentos de pallets</p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {filteredReceipts.map((receipt) => {
              const StatusIcon = getStatusIcon(receipt.status)
              
              return (
                <div key={receipt.id} className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 hover:bg-slate-700/50 transition-all duration-300">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        receipt.status === 'ok' ? 'bg-green-500/20 border border-green-500/30' :
                        receipt.status === 'alerta' ? 'bg-yellow-500/20 border border-yellow-500/30' :
                        'bg-red-500/20 border border-red-500/30'
                      }`}>
                        <StatusIcon className={`h-6 w-6 ${
                          receipt.status === 'ok' ? 'text-green-400' :
                          receipt.status === 'alerta' ? 'text-yellow-400' :
                          'text-red-400'
                        }`} />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white">{receipt.display_name || receipt.id}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            receipt.status === 'ok' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            receipt.status === 'alerta' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {getStatusLabel(receipt.status)}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-2">
                          {receipt.pallet_id && (
                            <span className="flex items-center">
                              <Package className="h-4 w-4 mr-1" />
                              Pallet: {receipt.pallet_id}
                            </span>
                          )}
                          {receipt.manifest_number && (
                            <span className="flex items-center">
                              <Truck className="h-4 w-4 mr-1" />
                              Manifesto: {receipt.manifest_number}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-2">
                          {receipt.received_at && (
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(receipt.received_at).toLocaleString('pt-BR')}
                            </span>
                          )}
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {receipt.received_by}
                          </span>
                        </div>
                        
                        {receipt.observations && (
                          <div className="text-xs text-slate-400 italic mt-2">
                            {receipt.observations}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                      <Link 
                        href={`/receipts/${receipt.id}`}
                        className="px-3 py-2 bg-slate-600/50 text-slate-300 border border-slate-500/50 rounded-lg hover:bg-slate-500/50 transition-all duration-200 flex items-center text-sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Link>
                      
                      {receipt.status !== 'ok' && (
                        <Link
                          href={`/comparisons?receiptId=${receipt.id}`}
                          className="px-3 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg hover:bg-orange-500/30 transition-all duration-200 flex items-center text-sm"
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Ver Diferenças
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {filteredReceipts.length === 0 && (
            <div className="text-center py-12">
              <Truck className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Nenhum recebimento encontrado
              </h3>
              <p className="text-slate-400 mb-6">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Comece criando um novo recebimento.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
