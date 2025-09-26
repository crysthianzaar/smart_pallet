'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '../../../components/layout/AppLayout'
import { 
  Package, 
  Save,
  ArrowLeft,
  MapPin,
  CheckCircle,
  AlertCircle,
  Search,
  QrCode,
  User,
  FileText,
  Camera,
  Plus
} from 'lucide-react'

interface Manifest {
  id: string
  manifest_number: string
  contract_id: string
  origin_location_id: string
  destination_location_id: string
  driver_name: string
  vehicle_plate: string
  status: string
  created_at: string
  contract_name?: string
  origin_location_name?: string
  destination_location_name?: string
  pallet_count?: number
}

interface Location {
  id: string
  name: string
  type: string
  city?: string
  state?: string
}

export default function NewReceiptPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  
  // Data states
  const [availableManifests, setAvailableManifests] = useState<Manifest[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  
  // Form data
  const [formData, setFormData] = useState({
    manifestId: '',
    receivedBy: '',
    notes: '',
    status: 'ok' as 'ok' | 'alerta' | 'critico'
  })
  
  const [manifestSearchTerm, setManifestSearchTerm] = useState('')
  const [selectedManifest, setSelectedManifest] = useState<Manifest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoadingData(true)
      
      // Load manifests that are in transit (em_transito)
      const manifestsRes = await fetch('/api/manifests?status=em_transito')
      if (manifestsRes.ok) {
        const manifestsData = await manifestsRes.json()
        setAvailableManifests(manifestsData.data || manifestsData || [])
      }

      // Load destination locations
      const locationsRes = await fetch('/api/locations?type=destino')
      if (locationsRes.ok) {
        const locationsData = await locationsRes.json()
        setLocations(locationsData.data || locationsData || [])
      }
    } catch (err) {
      console.error('Error loading initial data:', err)
      setError('Erro ao carregar dados iniciais. Verifique sua conexão.')
    } finally {
      setLoadingData(false)
    }
  }

  const handleManifestSelect = (manifest: Manifest) => {
    setSelectedManifest(manifest)
    setFormData(prev => ({
      ...prev,
      manifestId: manifest.id
    }))
    setManifestSearchTerm('')
  }

  const canSubmit = () => {
    return formData.manifestId !== '' && 
           formData.receivedBy !== ''
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const submitData = {
        manifest_id: formData.manifestId,
        received_by: formData.receivedBy,
        status: formData.status,
        observations: formData.notes || undefined
      }

      console.log('Submitting receipt data:', submitData)

      const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`Erro ao criar recebimento: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('Success result:', result)
      
      setSuccess('Recebimento criado com sucesso!')
      
      // Redirect after a short delay to show success message
      setTimeout(() => {
        router.push('/receipts')
      }, 2000)
      
    } catch (err) {
      console.error('Submit error:', err)
      setError(err instanceof Error ? err.message : 'Erro ao criar recebimento')
    } finally {
      setLoading(false)
    }
  }

  const filteredManifests = availableManifests.filter(manifest => 
    manifest.manifest_number.toLowerCase().includes(manifestSearchTerm.toLowerCase()) ||
    manifest.driver_name.toLowerCase().includes(manifestSearchTerm.toLowerCase()) ||
    manifest.vehicle_plate.toLowerCase().includes(manifestSearchTerm.toLowerCase()) ||
    (manifest.contract_name && manifest.contract_name.toLowerCase().includes(manifestSearchTerm.toLowerCase()))
  )

  return (
    <AppLayout 
      title="Novo Recebimento" 
      subtitle="Registrar recebimento de manifesto"
    >
      <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
        
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

        {/* Manifest Selection */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-blue-400" />
            Selecionar Manifesto
          </h2>
          
          {!selectedManifest ? (
            <>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={manifestSearchTerm}
                  onChange={(e) => setManifestSearchTerm(e.target.value)}
                  placeholder="Buscar manifesto por número, motorista, placa ou contrato..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredManifests.map(manifest => (
                  <div
                    key={manifest.id}
                    onClick={() => handleManifestSelect(manifest)}
                    className="p-4 border border-slate-600/50 rounded-lg cursor-pointer hover:border-slate-500/50 hover:bg-slate-700/30 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-blue-400 mr-2" />
                        <span className="text-white font-medium text-sm">{manifest.manifest_number}</span>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                        Em Trânsito
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-xs text-slate-400">
                      <p className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {manifest.driver_name}
                      </p>
                      
                      <p className="flex items-center">
                        <Package className="h-3 w-3 mr-1" />
                        {manifest.vehicle_plate}
                      </p>
                      
                      {manifest.contract_name && (
                        <p>{manifest.contract_name}</p>
                      )}
                      
                      {manifest.pallet_count && (
                        <p>{manifest.pallet_count} pallet(s)</p>
                      )}
                      
                      <p>Criado: {new Date(manifest.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                ))}
              </div>

              {filteredManifests.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">
                    {manifestSearchTerm ? 'Nenhum manifesto encontrado para a busca' : 'Nenhum manifesto disponível para recebimento'}
                  </p>
                  <p className="text-slate-500 text-sm mt-2">
                    Apenas manifestos com status "Em Trânsito" podem ser recebidos
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center mb-2">
                    <FileText className="h-5 w-5 text-blue-400 mr-2" />
                    <span className="text-white font-semibold">{selectedManifest.manifest_number}</span>
                    <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      Em Trânsito
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-slate-400">
                    <p className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {selectedManifest.driver_name}
                    </p>
                    
                    <p className="flex items-center">
                      <Package className="h-4 w-4 mr-1" />
                      {selectedManifest.vehicle_plate}
                    </p>
                    
                    {selectedManifest.contract_name && (
                      <p>{selectedManifest.contract_name}</p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setSelectedManifest(null)
                    setFormData(prev => ({ ...prev, manifestId: '' }))
                  }}
                  className="px-3 py-2 bg-slate-600/50 text-slate-300 border border-slate-500/50 rounded-lg hover:bg-slate-500/50 transition-all duration-200 text-sm"
                >
                  Alterar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Receipt Information */}
        {selectedManifest && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-green-400" />
              Informações do Recebimento
            </h2>
            
            <div className="space-y-6">

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Recebido por *
                </label>
                <input
                  type="text"
                  value={formData.receivedBy}
                  onChange={(e) => setFormData(prev => ({ ...prev, receivedBy: e.target.value }))}
                  className="w-full px-3 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Nome da pessoa que recebeu o pallet"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Status do Recebimento *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'ok' | 'alerta' | 'critico' }))}
                  className="w-full px-3 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                >
                  <option value="ok">OK - Sem problemas</option>
                  <option value="alerta">Alerta - Pequenas diferenças</option>
                  <option value="critico">Crítico - Problemas significativos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  placeholder="Observações sobre o recebimento (opcional)"
                  rows={3}
                />
              </div>

              {canSubmit() && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-green-400 text-sm font-medium">
                    ✅ Informações completas - Pronto para criar recebimento
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
          <button
            onClick={() => router.push('/receipts')}
            className="w-full sm:w-auto px-4 py-3 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-all duration-200 flex items-center justify-center font-medium"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || !canSubmit()}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-400 text-white font-semibold rounded-lg shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[48px]"
          >
            <Save className="h-5 w-5 mr-2" />
            {loading ? 'Criando...' : 'Criar Recebimento'}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
