'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
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
  Download,
  Eye,
  Package,
  Calendar,
  Loader2,
  FileText,
  Truck,
  MapPin,
  User,
  ArrowLeft,
  QrCode
} from 'lucide-react'

interface Comparison {
  id: string
  receipt_id: string
  pallet_id: string
  sku_id: string
  quantity_origin: number
  quantity_destination: number
  difference: number
  difference_type?: 'falta' | 'sobra' | 'avaria' | 'troca'
  reason?: string
  evidence_photos?: string
  created_at?: string
  sku_name?: string
  sku_code?: string
  sku_description?: string
  sku_unit?: string
  qr_tag_id?: string
  qr_code?: string
}

interface ComparisonStats {
  total: number
  totalDifferences: number
  criticalCount: number
  byDifferenceType: Record<string, number>
  totalQuantityOrigin: number
  totalQuantityDestination: number
  totalDifference: number
}

interface GeneralStats {
  total: number
  criticalCount: number
  avgDifference: number
  byDifferenceType: Record<string, number>
  topSkusWithDifferences: Array<{
    sku_id: string
    sku_name: string
    sku_code: string
    difference_count: number
    total_difference: number
  }>
}

interface ReceiptInfo {
  id: string
  manifest_id?: string
  pallet_id?: string
  location_id: string
  received_by: string
  status: string
  notes?: string
  received_at: string
  manifest_number?: string
  driver_name?: string
  vehicle_plate?: string
  manifest_status?: string
  contract_name?: string
  contract_company?: string
  origin_location_name?: string
  origin_city?: string
  origin_state?: string
  destination_location_name?: string
  destination_city?: string
  destination_state?: string
}

interface PalletInfo {
  id: string
  qr_tag_id: string
  pallet_status: string
  qr_code: string
  comparison_count: number
}

interface ComparisonDetails {
  receipt: ReceiptInfo
  comparisons: Comparison[]
  stats: ComparisonStats
  pallets: PalletInfo[]
}

const getDifferenceStatus = (difference: number) => {
  if (difference === 0) return 'ok'
  if (Math.abs(difference) >= 5) return 'critico'
  return 'alerta'
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
  const searchParams = useSearchParams()
  const receiptId = searchParams.get('receiptId')
  
  // Estados para listagem geral
  const [comparisons, setComparisons] = useState<Comparison[]>([])
  const [generalStats, setGeneralStats] = useState<GeneralStats | null>(null)
  
  // Estados para visualização detalhada
  const [comparisonDetails, setComparisonDetails] = useState<ComparisonDetails | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (receiptId) {
      fetchComparisonDetails(receiptId)
    } else {
      fetchComparisons()
      fetchStats()
    }
  }, [receiptId])

  const fetchComparisons = async () => {
    try {
      setError(null)
      const response = await fetch('/api/comparisons')
      if (response.ok) {
        const data = await response.json()
        setComparisons(data)
      } else {
        setError('Erro ao carregar comparações')
      }
    } catch (error) {
      console.error('Error fetching comparisons:', error)
      setError('Erro ao carregar comparações')
    } finally {
      setLoading(false)
    }
  }

  const generateSampleComparisons = async () => {
    try {
      setGenerating(true)
      setError(null)
      
      const response = await fetch('/api/comparisons/generate-sample', {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Sample comparisons generated:', data)
        // Recarregar dados
        await fetchComparisons()
        await fetchStats()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erro ao gerar comparações de exemplo')
      }
    } catch (error) {
      console.error('Error generating sample comparisons:', error)
      setError('Erro ao gerar comparações de exemplo')
    } finally {
      setGenerating(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/comparisons/stats')
      if (response.ok) {
        const data = await response.json()
        setGeneralStats(data)
      }
    } catch (error) {
      console.error('Error fetching comparison stats:', error)
    }
  }

  const fetchComparisonDetails = async (receiptId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/comparisons/${receiptId}`)
      if (response.ok) {
        const data = await response.json()
        setComparisonDetails(data)
      } else {
        console.error('Failed to fetch comparison details')
      }
    } catch (error) {
      console.error('Error fetching comparison details:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredComparisons = comparisons.filter(comparison => {
    const status = getDifferenceStatus(comparison.difference)
    const matchesSearch = comparison.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comparison.pallet_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (comparison.sku_code?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesFilter = filterStatus === 'all' || status === filterStatus
    return matchesSearch && matchesFilter
  })

  const headerActions = (
    <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-200 flex items-center">
      <Download className="h-4 w-4 mr-2" />
      Exportar Relatório
    </button>
  )

  if (loading) {
    return (
      <AppLayout title="Comparações" subtitle="Análise de diferenças entre origem e destino">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-slate-400">Carregando comparações...</span>
        </div>
      </AppLayout>
    )
  }

  // Renderização detalhada para um recebimento específico
  if (receiptId && comparisonDetails) {
    return (
      <AppLayout 
        title={`Comparações - ${comparisonDetails.receipt.manifest_number || 'Recebimento'}`}
        subtitle="Detalhes das diferenças encontradas"
        headerActions={
          <Link 
            href="/comparisons"
            className="px-4 py-2 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-all duration-200 flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        }
      >
        <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
          
          {/* Receipt and Manifest Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Receipt Info */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-green-400" />
                Informações do Recebimento
              </h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400">Recebido por</p>
                  <p className="text-white font-medium">{comparisonDetails.receipt.received_by}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    comparisonDetails.receipt.status === 'ok' ? 'bg-green-500/20 text-green-400' :
                    comparisonDetails.receipt.status === 'alerta' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {getStatusLabel(comparisonDetails.receipt.status)}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm text-slate-400">Data do Recebimento</p>
                  <p className="text-white font-medium">
                    {new Date(comparisonDetails.receipt.received_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                
                {comparisonDetails.receipt.notes && (
                  <div>
                    <p className="text-sm text-slate-400">Observações</p>
                    <p className="text-white font-medium">{comparisonDetails.receipt.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Manifest Info */}
            {comparisonDetails.receipt.manifest_number && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-400" />
                  Informações do Manifesto
                </h2>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-400">Número do Manifesto</p>
                    <p className="text-white font-medium">{comparisonDetails.receipt.manifest_number}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-slate-400">Motorista</p>
                    <p className="text-white font-medium flex items-center">
                      <User className="h-4 w-4 mr-1 text-slate-400" />
                      {comparisonDetails.receipt.driver_name}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-slate-400">Veículo</p>
                    <p className="text-white font-medium flex items-center">
                      <Truck className="h-4 w-4 mr-1 text-slate-400" />
                      {comparisonDetails.receipt.vehicle_plate}
                    </p>
                  </div>
                  
                  {comparisonDetails.receipt.contract_name && (
                    <div>
                      <p className="text-sm text-slate-400">Contrato</p>
                      <p className="text-white font-medium">{comparisonDetails.receipt.contract_name}</p>
                      {comparisonDetails.receipt.contract_company && (
                        <p className="text-sm text-slate-400">{comparisonDetails.receipt.contract_company}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">Total de Itens</p>
                  <p className="text-2xl font-bold text-white">{comparisonDetails.stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-yellow-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">Com Diferenças</p>
                  <p className="text-2xl font-bold text-white">{comparisonDetails.stats.totalDifferences}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">Críticas</p>
                  <p className="text-2xl font-bold text-white">{comparisonDetails.stats.criticalCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-purple-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">Pallets</p>
                  <p className="text-2xl font-bold text-white">{comparisonDetails.pallets.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Comparisons Table */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-700/50">
              <h2 className="text-lg font-bold text-white">Comparações Detalhadas</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Origem</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Destino</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Diferença</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {comparisonDetails.comparisons.map((comparison) => {
                    const status = getDifferenceStatus(comparison.difference)
                    const StatusIcon = getStatusIcon(status)
                    
                    return (
                      <tr key={comparison.id} className="hover:bg-slate-700/20">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">{comparison.sku_name}</div>
                            <div className="text-sm text-slate-400">{comparison.sku_code}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {comparison.quantity_origin} {comparison.sku_unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {comparison.quantity_destination} {comparison.sku_unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            comparison.difference > 0 ? 'text-green-400' : 
                            comparison.difference < 0 ? 'text-red-400' : 'text-slate-400'
                          }`}>
                            {comparison.difference > 0 ? '+' : ''}{comparison.difference}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {comparison.difference_type && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-700/50 text-slate-300">
                              {comparison.difference_type}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <StatusIcon className={`h-4 w-4 mr-2 ${
                              status === 'ok' ? 'text-green-400' :
                              status === 'alerta' ? 'text-yellow-400' : 'text-red-400'
                            }`} />
                            <span className="text-sm text-slate-300">{getStatusLabel(status)}</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Renderização da listagem geral
  return (
    <AppLayout 
      title="Comparações" 
      subtitle="Análise de diferenças entre origem e destino"
      headerActions={headerActions}
    >
      <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ID, pallet ou SKU..."
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
        </div>

        {/* Statistics Cards */}
        {generalStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">Total</p>
                  <p className="text-2xl font-bold text-white">{generalStats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">Críticas</p>
                  <p className="text-2xl font-bold text-white">{generalStats.criticalCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">Diferença Média</p>
                  <p className="text-2xl font-bold text-white">{generalStats.avgDifference}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-purple-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">SKUs Afetados</p>
                  <p className="text-2xl font-bold text-white">{generalStats.topSkusWithDifferences.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-300 font-medium">Erro</p>
            </div>
            <p className="text-red-400 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Comparisons Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Lista de Comparações</h2>
            {comparisons.length === 0 && !loading && (
              <button
                onClick={generateSampleComparisons}
                disabled={generating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Gerar Dados de Exemplo
                  </>
                )}
              </button>
            )}
          </div>
          
          {filteredComparisons.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Pallet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Diferença</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredComparisons.map((comparison) => {
                    const status = getDifferenceStatus(comparison.difference)
                    const StatusIcon = getStatusIcon(status)
                    
                    return (
                      <tr key={comparison.id} className="hover:bg-slate-700/20">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {comparison.id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">{comparison.sku_name || 'N/A'}</div>
                            <div className="text-sm text-slate-400">{comparison.sku_code || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {comparison.pallet_id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            comparison.difference > 0 ? 'text-green-400' : 
                            comparison.difference < 0 ? 'text-red-400' : 'text-slate-400'
                          }`}>
                            {comparison.difference > 0 ? '+' : ''}{comparison.difference}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <StatusIcon className={`h-4 w-4 mr-2 ${
                              status === 'ok' ? 'text-green-400' :
                              status === 'alerta' ? 'text-yellow-400' : 'text-red-400'
                            }`} />
                            <span className="text-sm text-slate-300">{getStatusLabel(status)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/comparisons?receiptId=${comparison.receipt_id}`}
                            className="text-blue-400 hover:text-blue-300 flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Detalhes
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <BarChart3 className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Nenhuma comparação encontrada</h3>
              <p className="text-slate-400 mb-6">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Nenhuma comparação corresponde aos filtros aplicados.' 
                  : 'Ainda não há comparações registradas no sistema.'}
              </p>
              {!searchTerm && filterStatus === 'all' && comparisons.length === 0 && (
                <p className="text-slate-500 text-sm">
                  As comparações são geradas automaticamente quando há diferenças entre as quantidades de origem e destino dos pallets.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
