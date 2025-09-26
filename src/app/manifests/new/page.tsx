'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '../../../components/layout/AppLayout'
import { SuccessModal } from '../../../components/ui/SuccessModal'
import { 
  FileText, 
  Plus, 
  Truck, 
  Save,
  ArrowLeft,
  MapPin,
  Package,
  CheckCircle,
  AlertCircle,
  X,
  Search
} from 'lucide-react'

interface Contract {
  id: string
  name: string
  company: string
}

interface Location {
  id: string
  name: string
  type: string
  city?: string
  state?: string
}

interface Pallet {
  id: string
  qr_tag_id: string
  contract_id: string
  origin_location_id: string
  status: string
  created_at: string
}

export default function NewManifestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Info, 2: Pallets
  
  // Data states
  const [contracts, setContracts] = useState<Contract[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [availablePallets, setAvailablePallets] = useState<Pallet[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  // Form data
  const [formData, setFormData] = useState({
    contractId: '',
    originLocationId: '',
    destinationLocationId: '',
    driverName: '',
    vehiclePlate: ''
  })
  
  const [selectedPallets, setSelectedPallets] = useState<string[]>([])
  const [palletSearchTerm, setPalletSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [createdManifestId, setCreatedManifestId] = useState<string | null>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoadingData(true)
      
      // Load contracts
      const contractsRes = await fetch('/api/contracts')
      if (contractsRes.ok) {
        const contractsData = await contractsRes.json()
        setContracts(contractsData.data || contractsData || [])
      }

      // Load locations
      const locationsRes = await fetch('/api/locations')
      if (locationsRes.ok) {
        const locationsData = await locationsRes.json()
        setLocations(locationsData.data || locationsData || [])
      }

      // Load active pallets
      const palletsRes = await fetch('/api/pallets?status=ativo')
      if (palletsRes.ok) {
        const palletsData = await palletsRes.json()
        console.log('Loaded pallets:', palletsData)
        setAvailablePallets(palletsData.data || palletsData || [])
      } else {
        console.error('Failed to load pallets:', palletsRes.status, palletsRes.statusText)
      }
    } catch (err) {
      console.error('Error loading initial data:', err)
      setError('Erro ao carregar dados iniciais. Verifique sua conexão.')
    } finally {
      setLoadingData(false)
    }
  }

  const canProceedToNext = () => {
    switch (step) {
      case 1:
        return formData.contractId !== '' && 
               formData.originLocationId !== '' && 
               formData.destinationLocationId !== '' &&
               formData.driverName !== '' &&
               formData.vehiclePlate !== ''
      case 2:
        return selectedPallets.length > 0
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      const submitData = {
        contract_id: formData.contractId,
        origin_location_id: formData.originLocationId,
        destination_location_id: formData.destinationLocationId,
        driver_name: formData.driverName,
        vehicle_plate: formData.vehiclePlate,
        pallet_ids: selectedPallets,
        status: 'rascunho',
        created_by: 'user-001' // TODO: Get from auth context
      }

      console.log('Submitting manifest data:', submitData)

      const response = await fetch('/api/manifests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`Erro ao criar manifesto: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('Success result:', result)
      
      // Show success toast
      setCreatedManifestId(result.id || result.manifest?.id)
      setShowSuccessToast(true)
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/manifests')
      }, 3000)
      
    } catch (err) {
      console.error('Submit error:', err)
      setError(err instanceof Error ? err.message : 'Erro ao criar manifesto')
    } finally {
      setLoading(false)
    }
  }

  const togglePalletSelection = (palletId: string) => {
    setSelectedPallets(prev => 
      prev.includes(palletId) 
        ? prev.filter(id => id !== palletId)
        : [...prev, palletId]
    )
  }

  const filteredPallets = availablePallets.filter(pallet => 
    pallet.id.toLowerCase().includes(palletSearchTerm.toLowerCase()) ||
    pallet.qr_tag_id.toLowerCase().includes(palletSearchTerm.toLowerCase())
  )

  const originLocations = locations.filter(loc => loc.type === 'origem')
  const destinationLocations = locations.filter(loc => loc.type === 'destino')

  const renderStepIndicator = () => (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
      {/* Mobile: Vertical layout */}
      <div className="block sm:hidden">
        <div className="flex items-center justify-center mb-4">
          <span className="text-sm text-slate-400">Etapa {step} de 2</span>
        </div>
        <div className="flex items-center justify-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
            step >= step 
              ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/25' 
              : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
          }`}>
            {[FileText, Package][step - 1] && 
              React.createElement([FileText, Package][step - 1], { className: "h-6 w-6" })
            }
          </div>
        </div>
        <div className="text-center mt-3">
          <span className="text-white font-medium">
            {['Informações', 'Paletes'][step - 1]}
          </span>
        </div>
      </div>

      {/* Desktop: Horizontal layout */}
      <div className="hidden sm:flex items-center justify-between">
        {[
          { num: 1, title: 'Informações', icon: FileText },
          { num: 2, title: 'Paletes', icon: Package }
        ].map(({ num, title, icon: Icon }) => (
          <div key={num} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
              step >= num 
                ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/25' 
                : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
            }`}>
              {step > num ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            </div>
            <span className={`ml-3 font-medium ${step >= num ? 'text-white' : 'text-slate-400'}`}>
              {title}
            </span>
            {num < 2 && (
              <div className={`w-16 h-0.5 mx-4 ${step > num ? 'bg-blue-400' : 'bg-slate-600'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <AppLayout 
      title="Novo Manifesto" 
      subtitle="Criar um novo manifesto de transporte"
    >
      <div className="max-w-4xl mx-auto space-y-4 px-4 sm:px-6 lg:px-8">
        {renderStepIndicator()}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-300 font-medium">Erro</p>
            </div>
            <p className="text-red-400 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Step 1: Manifest Information */}
        {step === 1 && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Informações do Manifesto</h2>
            
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Contrato *
                </label>
                <select
                  value={formData.contractId}
                  onChange={(e) => setFormData(prev => ({ ...prev, contractId: e.target.value }))}
                  className="w-full px-3 py-3 sm:py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-base sm:text-sm"
                  required
                  disabled={loadingData}
                >
                  <option value="">
                    {loadingData ? 'Carregando contratos...' : 'Selecione um contrato'}
                  </option>
                  {contracts.map(contract => (
                    <option key={contract.id} value={contract.id}>
                      {contract.name} - {contract.company}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Local de Origem *
                  </label>
                  <select
                    value={formData.originLocationId}
                    onChange={(e) => setFormData(prev => ({ ...prev, originLocationId: e.target.value }))}
                    className="w-full px-3 py-3 sm:py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-base sm:text-sm"
                    required
                    disabled={loadingData}
                  >
                    <option value="">
                      {loadingData ? 'Carregando origens...' : 'Selecione origem'}
                    </option>
                    {originLocations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name} {location.city && `- ${location.city}/${location.state}`}
                      </option>
                    ))}
                  </select>
                  
                  {originLocations.length === 0 && !loadingData && (
                    <p className="text-xs text-yellow-400 mt-1">
                      ⚠️ Nenhum local de origem encontrado. Verifique se existem locais cadastrados.
                    </p>
                  )}
                  
                  {originLocations.length > 0 && (
                    <p className="text-xs text-green-400 mt-1">
                      ✅ {originLocations.length} origem(ns) disponível(is)
                    </p>
                  )}
                  
                  {formData.originLocationId && (
                    <p className="text-xs text-blue-400 mt-1">
                      ✅ Origem selecionada
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Local de Destino *
                  </label>
                  <select
                    value={formData.destinationLocationId}
                    onChange={(e) => setFormData(prev => ({ ...prev, destinationLocationId: e.target.value }))}
                    className="w-full px-3 py-3 sm:py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-base sm:text-sm"
                    required
                    disabled={loadingData}
                  >
                    <option value="">
                      {loadingData ? 'Carregando destinos...' : 'Selecione destino'}
                    </option>
                    {destinationLocations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name} {location.city && `- ${location.city}/${location.state}`}
                      </option>
                    ))}
                  </select>
                  
                  {destinationLocations.length === 0 && !loadingData && (
                    <p className="text-xs text-yellow-400 mt-1">
                      ⚠️ Nenhum local de destino encontrado. Verifique se existem locais cadastrados.
                    </p>
                  )}
                  
                  {destinationLocations.length > 0 && (
                    <p className="text-xs text-green-400 mt-1">
                      ✅ {destinationLocations.length} destino(s) disponível(is)
                    </p>
                  )}
                  
                  {formData.destinationLocationId && (
                    <p className="text-xs text-blue-400 mt-1">
                      ✅ Destino selecionado
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nome do Motorista *
                  </label>
                  <input
                    type="text"
                    value={formData.driverName}
                    onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value }))}
                    className="w-full px-3 py-3 sm:py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-base sm:text-sm"
                    placeholder="Nome completo do motorista"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Placa do Veículo *
                  </label>
                  <input
                    type="text"
                    value={formData.vehiclePlate}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehiclePlate: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-3 sm:py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-base sm:text-sm"
                    placeholder="ABC-1234"
                    maxLength={8}
                    required
                  />
                </div>
              </div>

              {canProceedToNext() && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-green-400 text-sm font-medium">
                    ✅ Informações completas - Pronto para próxima etapa
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Select Pallets */}
        {step === 2 && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Selecionar Paletes</h2>
            <p className="text-slate-400 text-sm mb-6">
              Selecione os paletes com status &quot;ativo&quot; que serão incluídos neste manifesto
            </p>
            
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={palletSearchTerm}
                onChange={(e) => setPalletSearchTerm(e.target.value)}
                placeholder="Buscar paletes por ID ou QR..."
                className="w-full pl-10 pr-4 py-3 sm:py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-base sm:text-sm"
              />
            </div>

            {/* Selected count and available count */}
            <div className="mb-4 flex flex-wrap gap-2">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                selectedPallets.length > 0
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
              }`}>
                {selectedPallets.length} palete(s) selecionado(s)
              </div>
              
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                {availablePallets.length} palete(s) disponível(is)
              </div>
              
              {filteredPallets.length !== availablePallets.length && (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                  {filteredPallets.length} palete(s) filtrado(s)
                </div>
              )}
            </div>

            {/* Pallets grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPallets.map(pallet => (
                <div
                  key={pallet.id}
                  onClick={() => togglePalletSelection(pallet.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedPallets.includes(pallet.id)
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600/50 hover:border-slate-500/50 hover:bg-slate-700/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Package className="h-4 w-4 text-blue-400 mr-2" />
                        <span className="text-white font-medium text-sm">{pallet.id}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-1">QR: {pallet.qr_tag_id}</p>
                      <p className="text-xs text-slate-500">
                        Criado: {new Date(pallet.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {selectedPallets.includes(pallet.id) && (
                      <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredPallets.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  {palletSearchTerm ? 'Nenhum palete encontrado para a busca' : 'Nenhum palete com status "ativo" disponível'}
                </p>
              </div>
            )}

            {selectedPallets.length > 0 && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mt-6">
                <p className="text-green-400 text-sm font-medium">
                  ✅ {selectedPallets.length} palete(s) selecionado(s) - Pronto para criar manifesto
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : router.push('/manifests')}
            className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-all duration-200 flex items-center justify-center text-base sm:text-sm font-medium"
          >
            <ArrowLeft className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
            {step > 1 ? 'Anterior' : 'Cancelar'}
          </button>

          <div className="w-full sm:w-auto">
            {step < 2 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceedToNext()}
                className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm min-h-[48px] flex items-center justify-center"
              >
                Próximo
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !canProceedToNext()}
                className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-gradient-to-r from-green-500 to-emerald-400 text-white font-semibold rounded-lg shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-base sm:text-sm min-h-[48px]"
              >
                <Save className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                {loading ? 'Criando...' : 'Criar Manifesto'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessToast}
        onClose={() => {
          setShowSuccessToast(false)
          router.push('/manifests')
        }}
        title="Manifesto Criado com Sucesso! 🎉"
        message="Seu manifesto foi criado e os pallets foram adicionados automaticamente."
        details={createdManifestId ? `ID: ${createdManifestId}` : undefined}
        autoCloseDelay={3000}
        primaryAction={{
          label: "Ver Manifestos",
          onClick: () => {
            setShowSuccessToast(false)
            router.push('/manifests')
          }
        }}
        secondaryAction={createdManifestId ? {
          label: "Ver Detalhes",
          onClick: () => {
            setShowSuccessToast(false)
            router.push(`/manifests/${createdManifestId}`)
          }
        } : undefined}
      />
    </AppLayout>
  )
}
