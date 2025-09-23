'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppLayout } from '../../components/layout/AppLayout'
import { 
  Plus, 
  Search, 
  Filter, 
  Truck, 
  Package,
  Eye,
  Camera,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Calendar,
  User
} from 'lucide-react'

// Mock data
const receipts = [
  {
    id: 'REC-2024-001',
    palletId: 'PAL-2024-003',
    manifestId: 'MAN-2024-003',
    status: 'pending',
    contractName: 'Cliente A',
    originLocation: 'Armazém B - Setor 1',
    destinationLocation: 'Filial Norte',
    expectedItems: 450,
    receivedItems: null,
    differences: null,
    receivedAt: null,
    receivedBy: null,
    scheduledDate: '2024-01-20',
    photos: 0,
    observations: null
  },
  {
    id: 'REC-2024-002',
    palletId: 'PAL-2024-002',
    manifestId: 'MAN-2024-002',
    status: 'completed',
    contractName: 'Cliente B',
    originLocation: 'Armazém A - Setor 2',
    destinationLocation: 'Centro de Distribuição Sul',
    expectedItems: 1200,
    receivedItems: 1195,
    differences: [
      { skuName: 'Produto X', expected: 100, received: 95, difference: -5 }
    ],
    receivedAt: '2024-01-20 14:30',
    receivedBy: 'Ana Costa',
    scheduledDate: '2024-01-20',
    photos: 4,
    observations: 'Pequena diferença no Produto X, dentro da margem aceitável'
  },
  {
    id: 'REC-2024-003',
    palletId: 'PAL-2024-001',
    manifestId: 'MAN-2024-001',
    status: 'completed',
    contractName: 'Cliente A',
    originLocation: 'Armazém A - Setor 1',
    destinationLocation: 'Armazém B - Setor 2',
    expectedItems: 750,
    receivedItems: 750,
    differences: [],
    receivedAt: '2024-01-19 16:45',
    receivedBy: 'Carlos Silva',
    scheduledDate: '2024-01-19',
    photos: 3,
    observations: 'Recebimento sem divergências'
  },
  {
    id: 'REC-2024-004',
    palletId: 'PAL-2024-004',
    manifestId: 'MAN-2024-004',
    status: 'critical',
    contractName: 'Cliente C',
    originLocation: 'Armazém C - Setor 1',
    destinationLocation: 'Loja Centro',
    expectedItems: 300,
    receivedItems: 285,
    differences: [
      { skuName: 'Produto Y', expected: 50, received: 35, difference: -15 }
    ],
    receivedAt: '2024-01-19 15:20',
    receivedBy: 'Maria Santos',
    scheduledDate: '2024-01-19',
    photos: 5,
    observations: 'Diferença crítica detectada - requer investigação'
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'completed': return 'success'
    case 'critical': return 'critical'
    default: return 'secondary'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'Pendente'
    case 'completed': return 'Concluído'
    case 'critical': return 'Crítico'
    default: return status
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return Clock
    case 'completed': return CheckCircle
    case 'critical': return AlertTriangle
    default: return Clock
  }
}

export default function ReceiptsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = receipt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.palletId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || receipt.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: receipts.length,
    pending: receipts.filter(r => r.status === 'pending').length,
    completed: receipts.filter(r => r.status === 'completed').length,
    withDifferences: receipts.filter(r => r.status === 'completed' && r.differences && r.differences.length > 0).length,
    criticalDifferences: receipts.filter(r => r.status === 'completed' && r.differences && r.differences.length > 10).length
  }

  const headerActions = (
    <Link 
      href="/receipts/new"
      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-400 text-white font-semibold rounded-lg shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 transition-all duration-200 flex items-center"
    >
      <Plus className="h-4 w-4 mr-2" />
      Novo Recebimento
    </Link>
  )

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
                placeholder="Buscar por ID, pallet ou cliente..."
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
          <option value="pending">Pendentes</option>
          <option value="completed">Concluídos</option>
        </select>
        <button className="px-4 py-3 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-all duration-200 flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </button>
      </div>

      {/* Stats Cards */}
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
              <p className="text-sm text-slate-400">Pendentes</p>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
            </div>
            <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Concluídos</p>
              <p className="text-2xl font-bold text-white">{stats.completed}</p>
            </div>
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-400 rounded-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Diferenças Críticas</p>
              <p className="text-2xl font-bold text-white">{stats.criticalDifferences}</p>
            </div>
            <div className="p-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

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
              const hasDifferences = receipt.differences && receipt.differences.length > 0
              
              return (
                <div key={receipt.id} className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 hover:bg-slate-700/50 transition-all duration-300">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        receipt.status === 'pending' ? 'bg-yellow-500/20 border border-yellow-500/30' :
                        receipt.status === 'completed' ? 'bg-green-500/20 border border-green-500/30' :
                        'bg-red-500/20 border border-red-500/30'
                      }`}>
                        <StatusIcon className={`h-6 w-6 ${
                          receipt.status === 'pending' ? 'text-yellow-400' :
                          receipt.status === 'completed' ? 'text-green-400' :
                          'text-red-400'
                        }`} />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white">{receipt.id}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            receipt.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            receipt.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {getStatusLabel(receipt.status)}
                          </span>
                          {hasDifferences && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                              {receipt.differences.length} diferença(s)
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-2">
                          <span className="flex items-center">
                            <Package className="h-4 w-4 mr-1" />
                            {receipt.palletId}
                          </span>
                          <span>{receipt.contractName}</span>
                          <span>Esperado: {receipt.expectedItems} itens</span>
                          {receipt.receivedItems && (
                            <span>Recebido: {receipt.receivedItems} itens</span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-2">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {receipt.originLocation} → {receipt.destinationLocation}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Agendado: {receipt.scheduledDate}
                          </span>
                          {receipt.receivedAt && (
                            <span>Recebido: {receipt.receivedAt}</span>
                          )}
                        </div>
                        
                        {receipt.observations && (
                          <div className="text-xs text-slate-400 italic">
                            {receipt.observations}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                      {receipt.status === 'pending' && (
                        <button className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all duration-200 flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirmar
                        </button>
                      )}
                      
                      {receipt.photos > 0 && (
                        <button className="px-3 py-2 bg-slate-600/50 text-slate-300 border border-slate-500/50 rounded-lg hover:bg-slate-500/50 transition-all duration-200 flex items-center text-sm">
                          <Camera className="h-4 w-4 mr-1" />
                          {receipt.photos} foto(s)
                        </button>
                      )}
                      
                      <Link 
                        href={`/receipts/${receipt.id}`}
                        className="px-3 py-2 bg-slate-600/50 text-slate-300 border border-slate-500/50 rounded-lg hover:bg-slate-500/50 transition-all duration-200 flex items-center text-sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Link>
                      
                      {hasDifferences && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg flex items-center text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Diferenças
                        </span>
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
                  Tente ajustar os filtros ou aguardar novos recebimentos.
                </p>
              </div>
            )}
          </div>
        </div>
    </AppLayout>
  )
}
