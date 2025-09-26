'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppLayout } from '../../../components/layout/AppLayout'
import { 
  FileText, 
  Truck, 
  Package,
  MapPin,
  User,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  AlertCircle,
  Download,
  Edit3,
  Save,
  X,
  QrCode,
  Building,
  Phone,
  Mail
} from 'lucide-react'

interface ManifestDetails {
  manifest: {
    id: string
    manifest_number: string
    contract_id: string
    origin_location_id: string
    destination_location_id: string
    driver_name: string
    vehicle_plate: string
    status: 'rascunho' | 'carregado' | 'em_transito' | 'entregue'
    pdf_path?: string
    loaded_at?: string
    created_by: string
    created_at: string
    updated_at: string
  }
  pallets: Array<{
    manifestPallet: {
      id: string
      manifest_id: string
      pallet_id: string
      loaded_at?: string
      created_at: string
    }
    pallet: {
      id: string
      qr_tag_id: string
      contract_id: string
      origin_location_id: string
      destination_location_id?: string
      status: string
      ai_confidence?: number
      requires_manual_review: boolean
      sealed_at?: string
      sealed_by?: string
      created_by: string
      created_at: string
      updated_at: string
    }
  }>
  contract?: {
    id: string
    name: string
    company: string
    contact_email?: string
    contact_phone?: string
    status: string
  }
  originLocation?: {
    id: string
    name: string
    type: string
    address?: string
    city?: string
    state?: string
    postal_code?: string
  }
  destinationLocation?: {
    id: string
    name: string
    type: string
    address?: string
    city?: string
    state?: string
    postal_code?: string
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'rascunho': return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    case 'carregado': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'em_transito': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'entregue': return 'bg-green-500/20 text-green-400 border-green-500/30'
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'rascunho': return 'Rascunho'
    case 'carregado': return 'Carregado'
    case 'em_transito': return 'Em Trânsito'
    case 'entregue': return 'Entregue'
    default: return status
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'rascunho': return Edit3
    case 'carregado': return Package
    case 'em_transito': return Truck
    case 'entregue': return CheckCircle
    default: return Clock
  }
}

const getNextStatus = (currentStatus: string) => {
  switch (currentStatus) {
    case 'rascunho': return 'carregado'
    case 'carregado': return 'em_transito'
    case 'em_transito': return 'entregue'
    default: return null
  }
}

const getNextStatusLabel = (currentStatus: string) => {
  switch (currentStatus) {
    case 'rascunho': return 'Marcar como Carregado'
    case 'carregado': return 'Iniciar Transporte'
    case 'em_transito': return 'Marcar como Entregue'
    default: return null
  }
}

export default function ManifestDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const manifestId = params.id as string
  
  const [manifestDetails, setManifestDetails] = useState<ManifestDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (manifestId) {
      loadManifestDetails()
    }
  }, [manifestId])

  const loadManifestDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/manifests/${manifestId}`)
      if (!response.ok) {
        throw new Error(`Erro ao carregar manifesto: ${response.status}`)
      }
      
      const data = await response.json()
      setManifestDetails(data)
    } catch (err) {
      console.error('Error loading manifest details:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes do manifesto')
    } finally {
      setLoading(false)
    }
  }

  const updateManifestStatus = async (newStatus: string) => {
    try {
      setUpdating(true)
      setError(null)
      setSuccess(null)

      const response = await fetch(`/api/manifests/${manifestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Erro ao atualizar status: ${response.status}`)
      }

      setSuccess(`Status atualizado para "${getStatusLabel(newStatus)}" com sucesso!`)
      
      // Recarregar os detalhes
      await loadManifestDetails()
      
    } catch (err) {
      console.error('Error updating status:', err)
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status do manifesto')
    } finally {
      setUpdating(false)
    }
  }

  const exportToPdf = async () => {
    try {
      setError(null)
      
      const response = await fetch(`/api/manifests/${manifestId}/export-pdf`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error(`Erro ao exportar PDF: ${response.status}`)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `manifesto-${manifestDetails?.manifest.manifest_number}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (err) {
      console.error('Error exporting PDF:', err)
      setError(err instanceof Error ? err.message : 'Erro ao exportar PDF')
    }
  }

  if (loading) {
    return (
      <AppLayout title="Carregando..." subtitle="Carregando detalhes do manifesto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-slate-400">Carregando manifesto...</span>
        </div>
      </AppLayout>
    )
  }

  if (error && !manifestDetails) {
    return (
      <AppLayout title="Erro" subtitle="Erro ao carregar manifesto">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-300 mb-2">Erro ao carregar manifesto</h3>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/manifests')}
            className="px-4 py-2 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-all duration-200"
          >
            Voltar para Manifestos
          </button>
        </div>
      </AppLayout>
    )
  }

  if (!manifestDetails) {
    return (
      <AppLayout title="Manifesto não encontrado" subtitle="O manifesto solicitado não foi encontrado">
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Manifesto não encontrado</h3>
          <p className="text-slate-400 mb-6">O manifesto solicitado não existe ou foi removido.</p>
          <button
            onClick={() => router.push('/manifests')}
            className="px-4 py-2 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-all duration-200"
          >
            Voltar para Manifestos
          </button>
        </div>
      </AppLayout>
    )
  }

  const { manifest, pallets, contract, originLocation, destinationLocation } = manifestDetails
  const StatusIcon = getStatusIcon(manifest.status)
  const nextStatus = getNextStatus(manifest.status)
  const nextStatusLabel = getNextStatusLabel(manifest.status)

  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        onClick={exportToPdf}
        className="px-4 py-2 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-all duration-200 flex items-center"
      >
        <Download className="h-4 w-4 mr-2" />
        Exportar PDF
      </button>
      
      {nextStatus && (
        <button
          onClick={() => updateManifestStatus(nextStatus)}
          disabled={updating}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          {updating ? 'Atualizando...' : nextStatusLabel}
        </button>
      )}
    </div>
  )

  return (
    <AppLayout 
      title={manifest.manifest_number}
      subtitle="Detalhes do manifesto"
      headerActions={headerActions}
    >
      <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-300 font-medium">Erro</p>
            </div>
            <p className="text-red-400 text-sm mt-1">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <p className="text-green-300 font-medium">Sucesso</p>
            </div>
            <p className="text-green-400 text-sm mt-1">{success}</p>
          </div>
        )}

        {/* Manifest Header */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className={`h-16 w-16 rounded-xl flex items-center justify-center ${getStatusColor(manifest.status)}`}>
                <StatusIcon className="h-8 w-8" />
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-white">{manifest.manifest_number}</h1>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(manifest.status)}`}>
                    {getStatusLabel(manifest.status)}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {manifest.driver_name}
                  </span>
                  <span className="flex items-center">
                    <Truck className="h-4 w-4 mr-1" />
                    {manifest.vehicle_plate}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(manifest.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contract Information */}
          {contract && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-400" />
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
                
                {contract.contact_email && (
                  <div>
                    <p className="text-sm text-slate-400">Email</p>
                    <p className="text-white font-medium flex items-center">
                      <Mail className="h-4 w-4 mr-1 text-slate-400" />
                      {contract.contact_email}
                    </p>
                  </div>
                )}
                
                {contract.contact_phone && (
                  <div>
                    <p className="text-sm text-slate-400">Telefone</p>
                    <p className="text-white font-medium flex items-center">
                      <Phone className="h-4 w-4 mr-1 text-slate-400" />
                      {contract.contact_phone}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Route Information */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-green-400" />
              Rota
            </h2>
            
            <div className="space-y-4">
              {originLocation ? (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Origem</p>
                  <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3">
                    <p className="text-white font-medium">{originLocation.name}</p>
                    {originLocation.address && (
                      <p className="text-sm text-slate-400">{originLocation.address}</p>
                    )}
                    {originLocation.city && originLocation.state && (
                      <p className="text-sm text-slate-400">{originLocation.city}/{originLocation.state}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Origem</p>
                  <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3">
                    <p className="text-slate-500 italic">Informação de origem não disponível</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-center">
                <ArrowRight className="h-6 w-6 text-slate-500" />
              </div>
              
              {destinationLocation ? (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Destino</p>
                  <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3">
                    <p className="text-white font-medium">{destinationLocation.name}</p>
                    {destinationLocation.address && (
                      <p className="text-sm text-slate-400">{destinationLocation.address}</p>
                    )}
                    {destinationLocation.city && destinationLocation.state && (
                      <p className="text-sm text-slate-400">{destinationLocation.city}/{destinationLocation.state}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Destino</p>
                  <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3">
                    <p className="text-slate-500 italic">Informação de destino não disponível</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pallets List */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center">
              <Package className="h-5 w-5 mr-2 text-purple-400" />
              Pallets ({pallets.length})
            </h2>
          </div>
          
          {pallets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pallets.map((item: any) => (
                <div key={item.id || item.pallet?.id} className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-purple-400 mr-2" />
                      <span className="text-white font-medium text-sm">{item.id || item.pallet?.id}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      (item.status || item.pallet?.status) === 'ativo' ? 'bg-blue-500/20 text-blue-400' :
                      (item.status || item.pallet?.status) === 'em_manifesto' ? 'bg-purple-500/20 text-purple-400' :
                      (item.status || item.pallet?.status) === 'em_transito' ? 'bg-yellow-500/20 text-yellow-400' :
                      (item.status || item.pallet?.status) === 'recebido' ? 'bg-green-500/20 text-green-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {item.status || item.pallet?.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex items-center">
                      <QrCode className="h-4 w-4 text-cyan-400 mr-2" />
                      <span className="font-mono">{item.qr_code || item.pallet?.qr_code || 'N/A'}</span>
                    </div>
                    {(item.added_at || item.manifestPallet?.created_at) && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-slate-400 mr-2" />
                        <span>Adicionado: {new Date(item.added_at || item.manifestPallet?.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Nenhum pallet encontrado neste manifesto</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-orange-400" />
            Timeline
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mr-4">
                <Edit3 className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium">Manifesto Criado</p>
                <p className="text-sm text-slate-400">{new Date(manifest.created_at).toLocaleString('pt-BR')}</p>
              </div>
            </div>
            
            {manifest.loaded_at && (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center mr-4">
                  <Package className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Carregado</p>
                  <p className="text-sm text-slate-400">{new Date(manifest.loaded_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            )}
            
            {manifest.status === 'em_transito' && (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-500/20 border border-yellow-500/30 rounded-full flex items-center justify-center mr-4">
                  <Truck className="h-4 w-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Em Trânsito</p>
                  <p className="text-sm text-slate-400">Status atual</p>
                </div>
              </div>
            )}
            
            {manifest.status === 'entregue' && (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mr-4">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Entregue</p>
                  <p className="text-sm text-slate-400">Manifesto finalizado</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
