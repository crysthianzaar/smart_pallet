'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppLayout } from '../../../components/layout/AppLayout'
import { PalletPhotosGallery } from '../../../components/PalletPhotosGallery'
import { 
  ArrowLeft, 
  Package, 
  QrCode, 
  Camera, 
  Edit, 
  Truck, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Download,
  Share,
  FileText,
  Tag,
  Building,
  Brain,
  Layers,
  Grid3X3,
  Zap,
  Info,
  Lightbulb
} from 'lucide-react'

interface PalletItem {
  id: string;
  sku_id: string;
  sku_name: string;
  sku_code: string;
  quantity_origin: number;
  quantity_destination?: number;
  unit_price?: number;
  total_value?: number;
  ai_confidence?: number;
  unit?: string;
  weight?: number;
  dimensions?: string;
  description?: string;
}

interface PalletPhoto {
  id: string;
  photo_type: 'frontal' | 'lateral' | 'superior';
  stage: 'origem' | 'destino';
  file_path: string;
  uploaded_at: string;
}

interface PalletDetails {
  pallet: {
    id: string;
    qr_tag_id: string;
    qr_code?: string;
    contract_id: string;
    contract_name?: string;
    contract_company?: string;
    origin_location_id: string;
    origin_name?: string;
    destination_location_id?: string;
    destination_name?: string;
    status: 'ativo' | 'em_manifesto' | 'em_transito' | 'recebido' | 'finalizado';
    ai_confidence?: number;
    requires_manual_review: boolean;
    manifest_id?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    estimated_item_count?: number;
    vision_confidence?: number;
    selected_skus?: any[];
    total_expected_items?: number;
  };
  items: PalletItem[];
  photos: PalletPhoto[];
  selectedSkus?: any[];
  visionAnalysis?: {
    item_count: number;
    confidence: number;
    item_count_by_layer?: Array<{
      layer_index: number;
      rows?: number;
      columns?: number;
      count: number;
    }>;
    rationale?: string;
    suggestions?: string[];
    debug?: {
      grid_detected?: boolean;
      rows_detected?: number;
      columns_detected?: number;
      bounding_boxes_detected?: number;
      contours_detected?: number;
    };
  };
}

export default function PalletDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [palletDetails, setPalletDetails] = useState<PalletDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const palletId = params.id as string

  useEffect(() => {
    fetchPalletDetails()
  }, [palletId])

  const fetchPalletDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/pallets/${palletId}`)
      if (!response.ok) {
        throw new Error('Pallet não encontrado')
      }
      const data = await response.json()
      setPalletDetails(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pallet')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      ativo: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      em_manifesto: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      em_transito: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      recebido: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      finalizado: 'bg-green-500/20 text-green-400 border border-green-500/30'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      ativo: 'Ativo',
      em_manifesto: 'Em Manifesto',
      em_transito: 'Em Trânsito',
      recebido: 'Recebido',
      finalizado: 'Finalizado'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      ativo: Package,
      em_manifesto: FileText,
      em_transito: Truck,
      recebido: CheckCircle,
      finalizado: Tag
    }
    const Icon = icons[status as keyof typeof icons] || Package
    return <Icon className="h-5 w-5" />
  }

  if (loading) {
    return (
      <AppLayout title="Carregando..." subtitle="Detalhes do pallet">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Carregando detalhes do pallet...</div>
        </div>
      </AppLayout>
    )
  }

  if (error || !palletDetails) {
    return (
      <AppLayout title="Erro" subtitle="Detalhes do pallet">
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
          <p className="text-red-400 text-lg mb-4">{error || 'Pallet não encontrado'}</p>
          <Link
            href="/pallets"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Pallets
          </Link>
        </div>
      </AppLayout>
    )
  }

  const { pallet, items, photos, visionAnalysis, selectedSkus } = palletDetails
  const totalItems = items.reduce((sum, item) => sum + item.quantity_origin, 0)
  const totalValue = items.reduce((sum, item) => sum + (item.total_value || 0), 0)

  return (
    <AppLayout 
      title={pallet.id.startsWith('CTX-') ? `Pallet ${pallet.id}` : `Pallet ${pallet.id}`}
      subtitle="Detalhes completos do pallet"
      headerActions={
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Primeira linha - Voltar e Editar */}
          <div className="flex gap-2">
            <Link
              href="/pallets"
              className="inline-flex items-center px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-white rounded-lg hover:bg-slate-600/50 transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Voltar</span>
            </Link>
            {pallet.status === 'ativo' && (
              <Link
                href={`/pallets/${pallet.id}/edit`}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-lg hover:from-blue-600 hover:to-cyan-500 transition-all duration-200 text-sm"
              >
                <Edit className="h-4 w-4 mr-1 sm:mr-2" />
                Editar
              </Link>
            )}
          </div>
          
          {/* Segunda linha - Ações secundárias */}
          <div className="flex gap-2 sm:hidden">
            <button className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-white rounded-lg hover:bg-slate-600/50 transition-colors text-sm">
              <Share className="h-4 w-4 mr-1" />
              Compartilhar
            </button>
            <button className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-white rounded-lg hover:bg-slate-600/50 transition-colors text-sm">
              <Download className="h-4 w-4 mr-1" />
              Relatório
            </button>
          </div>
          
          {/* Desktop - Ações secundárias */}
          <div className="hidden sm:flex gap-3">
            <button className="inline-flex items-center px-4 py-2 bg-slate-700/50 border border-slate-600/50 text-white rounded-lg hover:bg-slate-600/50 transition-colors">
              <Share className="h-4 w-4 mr-2" />
              Compartilhar
            </button>
            <button className="inline-flex items-center px-4 py-2 bg-slate-700/50 border border-slate-600/50 text-white rounded-lg hover:bg-slate-600/50 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Relatório
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header com ID e Status */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center space-x-2 sm:space-x-3 mb-3">
                {pallet.id.startsWith('CTX-') ? (
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="bg-blue-500/30 text-blue-300 px-2 sm:px-3 py-1 rounded-md font-mono text-sm sm:text-lg flex-shrink-0">CTX</span>
                    <span className="font-mono text-lg sm:text-2xl truncate">{pallet.id.replace('CTX-', '')}</span>
                  </div>
                ) : (
                  <span className="truncate">{pallet.id}</span>
                )}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getStatusColor(pallet.status)}`}>
                  {getStatusIcon(pallet.status)}
                  {getStatusLabel(pallet.status)}
                </div>
                {pallet.requires_manual_review && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-400 border border-red-500/30">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="hidden sm:inline">Revisão Necessária</span>
                    <span className="sm:hidden">Revisão</span>
                  </div>
                )}
                {pallet.qr_code && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <QrCode className="h-4 w-4" />
                    <span className="font-mono text-xs sm:text-sm">{pallet.qr_code}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total de Itens</p>
                <p className="text-2xl font-bold text-white">{pallet.estimated_item_count || 0}</p>
              </div>
              <Package className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">SKUs Selecionados</p>
                <p className="text-2xl font-bold text-white">{selectedSkus?.length || 0}</p>
              </div>
              <Tag className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Fotos Capturadas</p>
                <p className="text-2xl font-bold text-white">{photos.length}</p>
              </div>
              <Camera className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700/50">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', name: 'Visão Geral', icon: Eye },
              { id: 'items', name: 'Itens', icon: Package },
              { id: 'vision', name: 'Análise IA', icon: Brain },
              { id: 'photos', name: 'Fotos', icon: Camera },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-400" />
                Informações Básicas
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Contrato</p>
                    <p className="text-white font-medium">
                      {pallet.contract_name || pallet.contract_id}
                    </p>
                    {pallet.contract_company && (
                      <p className="text-slate-400 text-xs">{pallet.contract_company}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">QR Tag ID</p>
                    <p className="text-white font-medium font-mono text-sm">{pallet.qr_tag_id}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Local de Origem</p>
                    <p className="text-white font-medium">{pallet.origin_name || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Criado por</p>
                    <p className="text-white font-medium">{pallet.created_by}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Data de Criação</p>
                    <p className="text-white font-medium">
                      {new Date(pallet.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                {pallet.manifest_id && (
                  <div>
                    <p className="text-slate-400 text-sm">Manifesto</p>
                    <Link 
                      href={`/manifests/${pallet.manifest_id}`}
                      className="text-blue-400 hover:text-blue-300 font-medium underline"
                    >
                      {pallet.manifest_id}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Análise da IA */}
            {(pallet.vision_confidence || pallet.estimated_item_count) && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  Análise da IA
                </h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${
                      (pallet.vision_confidence || 0) >= 0.85 ? 'text-green-400' :
                      (pallet.vision_confidence || 0) >= 0.65 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {Math.round((pallet.vision_confidence || 0) * 100)}%
                    </div>
                    <p className="text-slate-400">Confiança Geral</p>
                  </div>

                  {(pallet.vision_confidence || 0) < 0.65 && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                        <p className="text-red-400 font-medium">Revisão Manual Necessária</p>
                      </div>
                      <p className="text-red-300 text-sm mt-1">
                        A confiança da IA está abaixo do limite de 65%. É necessária uma revisão manual.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'items' && (
          <div className="space-y-6">
            {/* SKUs Selecionados */}
            {pallet.selected_skus && pallet.selected_skus.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-cyan-400" />
                  SKUs Selecionados ({pallet.selected_skus.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pallet.selected_skus.map((sku: any, index: number) => (
                    <div key={index} className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-white">{sku.name}</h4>
                          <p className="text-sm text-slate-400 font-mono">{sku.code}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-400">Esperado</p>
                          <p className="text-lg font-bold text-cyan-400">{sku.expected_quantity || '-'}</p>
                        </div>
                      </div>
                      
                      {sku.description && (
                        <p className="text-xs text-slate-300 mb-2">{sku.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        {sku.dimensions && (
                          <div>
                            <p className="text-slate-400">Dimensões</p>
                            <p className="text-slate-300">{sku.dimensions}</p>
                          </div>
                        )}
                        {sku.weight && (
                          <div>
                            <p className="text-slate-400">Peso</p>
                            <p className="text-slate-300">{sku.weight}kg</p>
                          </div>
                        )}
                        {sku.unit && (
                          <div>
                            <p className="text-slate-400">Unidade</p>
                            <p className="text-slate-300">{sku.unit}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Itens Detectados */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-400" />
                Itens Selecionados ({selectedSkus?.length || 0})
              </h3>
              {selectedSkus && selectedSkus.length > 0 ? (
                <div className="space-y-4">
                  {selectedSkus.map((sku) => (
                    <div key={sku.id} className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{sku.sku_name}</h4>
                          <p className="text-sm text-slate-400 font-mono">{sku.sku_code}</p>
                          {sku.sku_description && (
                            <p className="text-xs text-slate-300 mt-1">{sku.sku_description}</p>
                          )}
                        </div>
                        
                        {sku.sku_dimensions && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-300">{sku.sku_dimensions}</p>
                            <p className="text-xs text-slate-400">Dimensões</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Nenhum SKU selecionado para este pallet</p>
                  <p className="text-slate-500 text-sm mt-2">
                    Os SKUs são selecionados durante a criação do pallet
                  </p>
                </div>
              )}
            </div>

            {/* Resumo Comparativo */}
            {pallet.selected_skus && pallet.selected_skus.length > 0 && items.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  Resumo Comparativo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400 mb-2">
                      {pallet.total_expected_items || pallet.selected_skus.reduce((sum: number, sku: any) => sum + (sku.expected_quantity || 0), 0)}
                    </div>
                    <p className="text-slate-400">Itens Esperados</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-2">
                      {totalItems}
                    </div>
                    <p className="text-slate-400">Itens Detectados</p>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-2xl font-bold mb-2 ${
                      totalItems === (pallet.total_expected_items || 0) ? 'text-green-400' :
                      Math.abs(totalItems - (pallet.total_expected_items || 0)) <= 2 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {totalItems - (pallet.total_expected_items || 0) > 0 ? '+' : ''}{totalItems - (pallet.total_expected_items || 0)}
                    </div>
                    <p className="text-slate-400">Diferença</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'vision' && (
          <div className="space-y-6">
            {/* Análise de Visão Computacional */}
            {palletDetails.visionAnalysis ? (
              <>
                {/* Resultado Principal */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-400" />
                    Análise de Visão Computacional
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-400 mb-2">
                        {palletDetails.visionAnalysis.item_count}
                      </div>
                      <p className="text-slate-400">Itens Detectados</p>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-3xl font-bold mb-2 ${
                        palletDetails.visionAnalysis.confidence >= 0.8 ? 'text-green-400' :
                        palletDetails.visionAnalysis.confidence >= 0.6 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {(palletDetails.visionAnalysis.confidence * 100).toFixed(0)}%
                      </div>
                      <p className="text-slate-400">Confiança</p>
                    </div>
                    
                    {palletDetails.visionAnalysis.debug?.grid_detected && (
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-400 mb-2">
                          <Grid3X3 className="h-8 w-8 mx-auto" />
                        </div>
                        <p className="text-slate-400">Grade Detectada</p>
                      </div>
                    )}
                  </div>

                  {palletDetails.visionAnalysis.rationale && (
                    <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 mb-6">
                      <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-400" />
                        Análise Detalhada
                      </h4>
                      <p className="text-slate-300 text-sm">{palletDetails.visionAnalysis.rationale}</p>
                    </div>
                  )}
                </div>

                {/* Contagem por Camadas */}
                {palletDetails.visionAnalysis.item_count_by_layer && palletDetails.visionAnalysis.item_count_by_layer.length > 0 && (
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Layers className="h-5 w-5 text-blue-400" />
                      Contagem por Camadas
                    </h3>
                    <div className="space-y-3">
                      {palletDetails.visionAnalysis.item_count_by_layer.map((layer) => (
                        <div key={layer.layer_index} className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium">Camada {layer.layer_index}</span>
                            <span className="text-xl font-bold text-white">{layer.count} itens</span>
                          </div>
                          {layer.rows && layer.columns && (
                            <div className="flex items-center gap-4 text-sm text-slate-300">
                              <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-400 rounded"></div>
                                {layer.rows} linhas
                              </span>
                              <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-400 rounded"></div>
                                {layer.columns} colunas
                              </span>
                              <span className="text-slate-400">
                                ({layer.rows} × {layer.columns} = {layer.count})
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Métodos de Detecção */}
                {palletDetails.visionAnalysis.debug && (
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-400" />
                      Métodos de Detecção
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {palletDetails.visionAnalysis.debug.bounding_boxes_detected && (
                        <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-400 mb-2">
                            {palletDetails.visionAnalysis.debug.bounding_boxes_detected}
                          </div>
                          <p className="text-slate-400 text-sm">Bounding Boxes</p>
                        </div>
                      )}
                      
                      {palletDetails.visionAnalysis.debug.contours_detected && (
                        <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-400 mb-2">
                            {palletDetails.visionAnalysis.debug.contours_detected}
                          </div>
                          <p className="text-slate-400 text-sm">Contornos</p>
                        </div>
                      )}
                      
                      {palletDetails.visionAnalysis.debug.rows_detected && palletDetails.visionAnalysis.debug.columns_detected && (
                        <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-purple-400 mb-2">
                            {palletDetails.visionAnalysis.debug.rows_detected}×{palletDetails.visionAnalysis.debug.columns_detected}
                          </div>
                          <p className="text-slate-400 text-sm">Grade Detectada</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sugestões */}
                {palletDetails.visionAnalysis.suggestions && palletDetails.visionAnalysis.suggestions.length > 0 && (
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-400" />
                      Sugestões de Melhoria
                    </h3>
                    <div className="space-y-2">
                      {palletDetails.visionAnalysis.suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-slate-300 text-sm">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <div className="text-center py-12">
                  <Brain className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Nenhuma análise de visão computacional disponível</p>
                  <p className="text-slate-500 text-sm mt-2">
                    A análise de IA será executada automaticamente durante a criação do pallet
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Camera className="h-5 w-5 text-green-400" />
              Fotos do Pallet ({photos.length})
            </h3>
            <PalletPhotosGallery photos={photos} palletId={pallet.id} />
          </div>
        )}
      </div>
    </AppLayout>
  )
}
