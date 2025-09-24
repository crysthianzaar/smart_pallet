'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppLayout } from '../../../components/layout/AppLayout'
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
  Clock,
  User,
  MapPin,
  Building
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
  };
  items: PalletItem[];
  photos: PalletPhoto[];
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

  const { pallet, items, photos } = palletDetails
  const totalItems = items.reduce((sum, item) => sum + item.quantity_origin, 0)
  const totalValue = items.reduce((sum, item) => sum + (item.total_value || 0), 0)

  return (
    <AppLayout 
      title={pallet.id.startsWith('CTX-') ? `Pallet ${pallet.id}` : `Pallet ${pallet.id}`}
      subtitle="Detalhes completos do pallet"
      headerActions={
        <div className="flex gap-3">
          <Link
            href="/pallets"
            className="inline-flex items-center px-4 py-2 bg-slate-700/50 border border-slate-600/50 text-white rounded-lg hover:bg-slate-600/50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
          <button className="inline-flex items-center px-4 py-2 bg-slate-700/50 border border-slate-600/50 text-white rounded-lg hover:bg-slate-600/50 transition-colors">
            <Share className="h-4 w-4 mr-2" />
            Compartilhar
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-slate-700/50 border border-slate-600/50 text-white rounded-lg hover:bg-slate-600/50 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Relatório
          </button>
          {pallet.status === 'ativo' && (
            <Link
              href={`/pallets/${pallet.id}/edit`}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-lg hover:from-blue-600 hover:to-cyan-500 transition-all duration-200"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header com ID e Status */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center space-x-3 mb-2">
                {pallet.id.startsWith('CTX-') ? (
                  <>
                    <span className="bg-blue-500/30 text-blue-300 px-3 py-1 rounded-md font-mono text-lg">CTX</span>
                    <span className="font-mono">{pallet.id.replace('CTX-', '')}</span>
                  </>
                ) : (
                  <span>{pallet.id}</span>
                )}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getStatusColor(pallet.status)}`}>
                  {getStatusIcon(pallet.status)}
                  {getStatusLabel(pallet.status)}
                </div>
                {pallet.requires_manual_review && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-400 border border-red-500/30">
                    <AlertTriangle className="h-4 w-4" />
                    Revisão Necessária
                  </div>
                )}
                {pallet.qr_code && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <QrCode className="h-4 w-4" />
                    {pallet.qr_code}
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
                <p className="text-2xl font-bold text-white">{totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">SKUs Diferentes</p>
                <p className="text-2xl font-bold text-white">{items.length}</p>
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
          
          {pallet.ai_confidence && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Confiança IA</p>
                  <p className={`text-2xl font-bold ${
                    pallet.ai_confidence >= 85 ? 'text-green-400' :
                    pallet.ai_confidence >= 65 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {pallet.ai_confidence}%
                  </p>
                </div>
                <CheckCircle className={`h-8 w-8 ${
                  pallet.ai_confidence >= 85 ? 'text-green-400' :
                  pallet.ai_confidence >= 65 ? 'text-yellow-400' :
                  'text-red-400'
                }`} />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700/50">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Visão Geral', icon: Eye },
              { id: 'items', name: 'Itens', icon: Package },
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
                    <p className="text-slate-400 text-sm">Local de Destino</p>
                    <p className="text-white font-medium">{pallet.destination_name || 'Não definido'}</p>
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
            {pallet.ai_confidence && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  Análise da IA
                </h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${
                      pallet.ai_confidence >= 85 ? 'text-green-400' :
                      pallet.ai_confidence >= 65 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {pallet.ai_confidence}%
                    </div>
                    <p className="text-slate-400">Confiança Geral</p>
                  </div>

                  {pallet.ai_confidence < 65 && (
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
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-400" />
              Itens do Pallet ({items.length})
            </h3>
            {items.length > 0 ? (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div className="md:col-span-2">
                        <h4 className="font-medium text-white">{item.sku_name}</h4>
                        <p className="text-sm text-slate-400 font-mono">{item.sku_code}</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">{item.quantity_origin}</p>
                        <p className="text-xs text-slate-400">Quantidade</p>
                      </div>
                      
                      {item.ai_confidence && (
                        <div className="text-center">
                          <p className={`text-lg font-bold ${
                            item.ai_confidence >= 85 ? 'text-green-400' :
                            item.ai_confidence >= 65 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {item.ai_confidence}%
                          </p>
                          <p className="text-xs text-slate-400">Confiança IA</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Nenhum item cadastrado neste pallet</p>
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
            {photos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {photos.map((photo) => (
                  <div key={photo.id} className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
                    <div className="aspect-square bg-slate-600/50 rounded-lg mb-3 flex items-center justify-center">
                      <Camera className="h-12 w-12 text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-white capitalize">
                        {photo.photo_type} - {photo.stage}
                      </p>
                      <p className="text-xs text-slate-400 mb-3">
                        {new Date(photo.uploaded_at).toLocaleString('pt-BR')}
                      </p>
                      <button className="inline-flex items-center px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors text-sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Foto
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Camera className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Nenhuma foto capturada para este pallet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
