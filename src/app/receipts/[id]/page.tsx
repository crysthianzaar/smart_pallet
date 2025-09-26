'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppLayout } from '../../../components/layout/AppLayout'
import { 
  ArrowLeft, 
  Package, 
  Truck,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  MapPin,
  Building,
  Eye,
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
  created_at: string
  updated_at: string
  display_name?: string
  manifest_number?: string
}

interface ReceiptDetails {
  receipt: Receipt
  manifest?: {
    id: string
    manifest_number: string
    driver_name: string
    vehicle_plate: string
    status: string
    created_at: string
  }
  pallet?: {
    id: string
    qr_tag_id: string
    status: string
    created_at: string
  }
  contract?: {
    id: string
    name: string
    company: string
  }
  originLocation?: {
    id: string
    name: string
    city?: string
    state?: string
  }
  destinationLocation?: {
    id: string
    name: string
    city?: string
    state?: string
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ok': return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'alerta': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'critico': return 'bg-red-500/20 text-red-400 border-red-500/30'
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ok': return CheckCircle
    case 'alerta': return AlertTriangle
    case 'critico': return XCircle
    default: return FileText
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

export default function ReceiptDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const receiptId = params.id as string

  const [receiptDetails, setReceiptDetails] = useState<ReceiptDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReceiptDetails()
  }, [receiptId])

  const fetchReceiptDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/receipts/${receiptId}`)
      
      if (!response.ok) {
        throw new Error('Recebimento não encontrado')
      }
      
      const data = await response.json()
      setReceiptDetails(data)
    } catch (err) {
      console.error('Error loading receipt details:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes do recebimento')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Carregando..." subtitle="Carregando detalhes do recebimento">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
        </div>
      </AppLayout>
    )
  }

  if (error && !receiptDetails) {
    return (
      <AppLayout title="Erro" subtitle="Erro ao carregar recebimento">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-400 mb-2">Erro ao carregar recebimento</h2>
            <p className="text-red-300 mb-4">{error}</p>
            <Link
              href="/receipts"
              className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Recebimentos
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!receiptDetails) {
    return (
      <AppLayout title="Recebimento não encontrado" subtitle="O recebimento solicitado não foi encontrado">
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-400 mb-2">Recebimento não encontrado</h2>
          <p className="text-slate-500 mb-6">O recebimento que você está procurando não existe ou foi removido.</p>
          <Link
            href="/receipts"
            className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Recebimentos
          </Link>
        </div>
      </AppLayout>
    )
  }

  const { receipt, manifest, pallet, contract, originLocation, destinationLocation } = receiptDetails
  const StatusIcon = getStatusIcon(receipt.status)

  return (
    <AppLayout 
      title={receipt.display_name || receipt.id} 
      subtitle="Detalhes do recebimento"
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/receipts"
            className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Voltar</span>
          </Link>
          
          {receipt.status !== 'ok' && (
            <Link
              href={`/comparisons?receiptId=${receipt.id}`}
              className="flex items-center px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 rounded-lg transition-colors"
            >
              <Eye className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Ver Comparações</span>
            </Link>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`h-16 w-16 rounded-xl flex items-center justify-center ${getStatusColor(receipt.status)}`}>
                <StatusIcon className="h-8 w-8" />
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-white">{receipt.display_name || receipt.id}</h1>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(receipt.status)}`}>
                    {getStatusLabel(receipt.status)}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    Recebido por: {receipt.received_by}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(receipt.received_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {receipt.observations && (
            <div className="mt-4 p-4 bg-slate-700/30 border border-slate-600/50 rounded-lg">
              <h3 className="text-sm font-medium text-slate-300 mb-2">Observações</h3>
              <p className="text-slate-400 text-sm">{receipt.observations}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Manifest Information */}
          {manifest && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-purple-400" />
                Manifesto
              </h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400">Número do Manifesto</p>
                  <p className="text-white font-medium">{manifest.manifest_number}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-slate-400">Motorista</p>
                    <p className="text-white font-medium">{manifest.driver_name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-slate-400">Veículo</p>
                    <p className="text-white font-medium">{manifest.vehicle_plate}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-slate-400">Status do Manifesto</p>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    manifest.status === 'rascunho' ? 'bg-slate-500/20 text-slate-400' :
                    manifest.status === 'carregado' ? 'bg-blue-500/20 text-blue-400' :
                    manifest.status === 'em_transito' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {manifest.status}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-700/50">
                  <Link
                    href={`/manifests/${manifest.id}`}
                    className="inline-flex items-center text-purple-400 hover:text-purple-300 text-sm"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver detalhes do manifesto
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Pallet Information */}
          {pallet && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-blue-400" />
                Pallet
              </h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400">ID do Pallet</p>
                  <p className="text-white font-medium font-mono">{pallet.id}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-400">QR Tag</p>
                  <p className="text-white font-medium font-mono">{pallet.qr_tag_id}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-400">Status do Pallet</p>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    pallet.status === 'ativo' ? 'bg-blue-500/20 text-blue-400' :
                    pallet.status === 'em_manifesto' ? 'bg-purple-500/20 text-purple-400' :
                    pallet.status === 'em_transito' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {pallet.status}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-700/50">
                  <Link
                    href={`/pallets/${pallet.id}`}
                    className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver detalhes do pallet
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Contract Information */}
          {contract && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2 text-green-400" />
                Contrato
              </h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400">Nome do Contrato</p>
                  <p className="text-white font-medium">{contract.name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-400">Empresa</p>
                  <p className="text-white font-medium">{contract.company}</p>
                </div>
              </div>
            </div>
          )}

          {/* Route Information */}
          {(originLocation || destinationLocation) && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-cyan-400" />
                Rota
              </h2>
              
              <div className="space-y-4">
                {originLocation && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Origem</p>
                    <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3">
                      <p className="text-white font-medium">{originLocation.name}</p>
                      {originLocation.city && originLocation.state && (
                        <p className="text-sm text-slate-400">{originLocation.city}/{originLocation.state}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {destinationLocation && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Destino</p>
                    <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3">
                      <p className="text-white font-medium">{destinationLocation.name}</p>
                      {destinationLocation.city && destinationLocation.state && (
                        <p className="text-sm text-slate-400">{destinationLocation.city}/{destinationLocation.state}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-orange-400" />
            Timeline
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium">Recebimento Criado</p>
                <p className="text-sm text-slate-400">
                  {new Date(receipt.created_at).toLocaleString('pt-BR')} por {receipt.received_by}
                </p>
              </div>
            </div>
            
            {receipt.received_at !== receipt.created_at && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Recebimento Processado</p>
                  <p className="text-sm text-slate-400">
                    {new Date(receipt.received_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
