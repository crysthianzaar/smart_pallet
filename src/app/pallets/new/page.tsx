
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '../../../components/layout/AppLayout'
import { 
  Camera, 
  QrCode, 
  Plus, 
  Package, 
  Save,
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  Search,
  ChevronDown
} from 'lucide-react'

interface Contract {
  id: string
  name: string
  client_name: string
}

interface QrTag {
  id: string
  qr_code: string
  status: 'livre' | 'vinculado'
  description?: string
}

interface Manifest {
  id: string
  name: string
  status: string
}

interface Location {
  id: string
  name: string
  type: string
}

interface PalletPhoto {
  id: string
  file: File | null
  preview: string
  uploaded: boolean
}

export default function NewPalletPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Info, 2: QR Tag, 3: Photos, 4: Manifest
  
  // Data states
  const [contracts, setContracts] = useState<Contract[]>([])
  const [availableTags, setAvailableTags] = useState<QrTag[]>([])
  const [manifests, setManifests] = useState<Manifest[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loadingContracts, setLoadingContracts] = useState(true)
  const [tagSearchTerm, setTagSearchTerm] = useState('')
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    contractId: '',
    originLocationId: '',
    qrTagId: '',
    useNewTag: false,
    manifestId: '',
    observations: ''
  })
  
  const [photos, setPhotos] = useState<PalletPhoto[]>([
    { id: '1', file: null, preview: '', uploaded: false },
    { id: '2', file: null, preview: '', uploaded: false },
    { id: '3', file: null, preview: '', uploaded: false }
  ])

  const photoViews = [
    { id: '1', title: 'Vista Frontal', description: 'Foto frontal do palete', icon: '📷', required: true },
    { id: '2', title: 'Vista Lateral', description: 'Foto lateral do palete', icon: '📸', required: true },
    { id: '3', title: 'Vista Superior', description: 'Foto de cima do palete', icon: '🔝', required: true }
  ]
  
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.tag-dropdown-container')) {
        setShowTagDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const loadInitialData = async () => {
    try {
      setLoadingContracts(true)
      
      // Load contracts
      console.log('Carregando contratos...')
      const contractsRes = await fetch('/api/contracts')
      console.log('Response status:', contractsRes.status)
      
      if (contractsRes.ok) {
        const contractsData = await contractsRes.json()
        console.log('Contratos carregados:', contractsData)
        setContracts(contractsData.data || contractsData || [])
      } else {
        console.error('Erro ao carregar contratos:', contractsRes.status, contractsRes.statusText)
        setError('Erro ao carregar contratos. Verifique se a API está funcionando.')
      }

      // Load available QR tags
      const tagsRes = await fetch('/api/qr-tags?status=livre')
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json()
        setAvailableTags(tagsData.data || tagsData || [])
      }

      // Load manifests
      const manifestsRes = await fetch('/api/manifests?status=draft')
      if (manifestsRes.ok) {
        const manifestsData = await manifestsRes.json()
        setManifests(manifestsData.data || manifestsData || [])
      }

      // Load locations
      const locationsRes = await fetch('/api/locations')
      if (locationsRes.ok) {
        const locationsData = await locationsRes.json()
        setLocations(locationsData.data || locationsData || [])
      }
    } catch (err) {
      console.error('Error loading initial data:', err)
      setError('Erro ao carregar dados iniciais. Verifique sua conexão.')
    } finally {
      setLoadingContracts(false)
    }
  }

  const generateNewTag = async () => {
    try {
      setError(null)
      
      // Generate a unique QR code
      const timestamp = Date.now()
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      const newQrCode = `QR${timestamp.toString().slice(-6)}${randomNum}`
      
      const response = await fetch('/api/qr-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qr_code: newQrCode,
          status: 'vinculado',
          description: `Tag gerada para novo palete - ${new Date().toLocaleDateString('pt-BR')}`
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao gerar nova tag')
      }
      
      const result = await response.json()
      
      // Update form with new tag
      setFormData(prev => ({
        ...prev,
        qrTagId: result.data.id,
        useNewTag: true
      }))
      
      alert(`Nova tag gerada!\n\nCódigo QR: ${newQrCode}`)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar nova tag')
    }
  }

  const handlePhotoCapture = (photoId: string, file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setPhotos(prev => prev.map(photo => 
        photo.id === photoId 
          ? { ...photo, file, preview: e.target?.result as string, uploaded: false }
          : photo
      ))
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = (photoId: string) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === photoId 
        ? { id: photoId, file: null, preview: '', uploaded: false }
        : photo
    ))
  }

  const canProceedToNext = () => {
    switch (step) {
      case 1:
        return formData.contractId !== '' && formData.originLocationId !== ''
      case 2:
        return formData.qrTagId !== ''
      case 3:
        return photos.filter(p => p.file !== null).length >= 3
      case 4:
        return true // Optional step
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      // Prepare data for submission - ensure all values are strings or null
      const submitData = {
        contract_id: String(formData.contractId),
        qr_tag_id: String(formData.qrTagId),
        origin_location_id: formData.originLocationId || 'LOC-001',
        // observations: formData.observations || '', // Temporarily removed until DB is updated
        // manifest_id: formData.manifestId ? String(formData.manifestId) : null, // Field doesn't exist in DB table
        status: 'ativo',
        created_by: 'user-001'
      }

      console.log('Submitting pallet data:', submitData)

      const response = await fetch('/api/pallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`Erro ao criar palete: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('Success result:', result)
      
      alert('Palete criado com sucesso!')
      router.push('/pallets')
      
    } catch (err) {
      console.error('Submit error:', err)
      setError(err instanceof Error ? err.message : 'Erro ao criar palete')
    } finally {
      setLoading(false)
    }
  }

  const renderStepIndicator = () => (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
      {/* Mobile: Vertical layout */}
      <div className="block sm:hidden">
        <div className="flex items-center justify-center mb-4">
          <span className="text-sm text-slate-400">Etapa {step} de 4</span>
        </div>
        <div className="flex items-center justify-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
            step >= step 
              ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/25' 
              : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
          }`}>
            {[FileText, QrCode, Camera, Package][step - 1] && 
              React.createElement([FileText, QrCode, Camera, Package][step - 1], { className: "h-6 w-6" })
            }
          </div>
        </div>
        <div className="text-center mt-3">
          <span className="text-white font-medium">
            {['Contrato', 'Tag QR', 'Fotos', 'Manifesto'][step - 1]}
          </span>
        </div>
      </div>

      {/* Desktop: Horizontal layout */}
      <div className="hidden sm:flex items-center justify-between">
        {[
          { num: 1, title: 'Contrato', icon: FileText },
          { num: 2, title: 'Tag QR', icon: QrCode },
          { num: 3, title: 'Fotos', icon: Camera },
          { num: 4, title: 'Manifesto', icon: Package }
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
            {num < 4 && (
              <div className={`w-16 h-0.5 mx-4 ${step > num ? 'bg-blue-400' : 'bg-slate-600'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <AppLayout 
      title="Novo Palete" 
      subtitle="Criar um novo palete no sistema"
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

        {/* Step 1: Contract Selection */}
        {step === 1 && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Selecionar Contrato</h2>
            
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
                  disabled={loadingContracts}
                >
                  <option value="">
                    {loadingContracts ? 'Carregando contratos...' : 'Selecione um contrato'}
                  </option>
                  {contracts.map(contract => (
                    <option key={contract.id} value={contract.id}>
                      {contract.name} - {contract.client_name}
                    </option>
                  ))}
                </select>
                
                {/* Debug info */}
                {contracts.length === 0 && !loadingContracts && (
                  <p className="text-xs text-yellow-400 mt-1">
                    ⚠️ Nenhum contrato encontrado. Verifique se o endpoint /api/contracts está funcionando.
                  </p>
                )}
                
                {contracts.length > 0 && (
                  <p className="text-xs text-green-400 mt-1">
                    ✅ {contracts.length} contrato(s) carregado(s)
                  </p>
                )}
                
                {formData.contractId && (
                  <p className="text-xs text-blue-400 mt-1">
                    ✅ Contrato selecionado
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Local de Origem *
                </label>
                <select
                  value={formData.originLocationId}
                  onChange={(e) => setFormData(prev => ({ ...prev, originLocationId: e.target.value }))}
                  className="w-full px-3 py-3 sm:py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-base sm:text-sm"
                  required
                >
                  <option value="">Selecione o local de origem</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                
                {locations.length === 0 && (
                  <p className="text-xs text-yellow-400 mt-1">
                    ⚠️ Nenhum local encontrado. Verifique se o endpoint /api/locations está funcionando.
                  </p>
                )}
                
                {formData.originLocationId && (
                  <p className="text-xs text-blue-400 mt-1">
                    ✅ Local de origem selecionado
                  </p>
                )}
              </div>

              {formData.contractId && formData.originLocationId && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-green-400 text-sm font-medium">
                    ✅ Pronto para próxima etapa
                  </p>
                </div>
              )}

              {/* Temporarily hidden until DB is updated
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  className="w-full px-3 py-3 sm:py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-base sm:text-sm"
                  rows={3}
                  placeholder="Observações sobre o palete..."
                />
              </div>
              */}
            </div>
          </div>
        )}

        {/* Step 2: QR Tag Selection */}
        {step === 2 && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Escolher Tag QR</h2>
            
            <div className="space-y-6">
              {/* Option 1: Select existing free tag */}
              <div className="border border-slate-600/50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-3">Usar Tag Existente</h3>
                
                {availableTags.length > 0 ? (
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Buscar e selecionar tag QR
                    </label>
                    
                    {/* Searchable Select */}
                    <div className="relative tag-dropdown-container">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={tagSearchTerm}
                          onChange={(e) => {
                            setTagSearchTerm(e.target.value)
                            setShowTagDropdown(true)
                          }}
                          onFocus={() => setShowTagDropdown(true)}
                          placeholder="Digite para buscar uma tag QR..."
                          className="w-full pl-10 pr-10 py-3 sm:py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-base sm:text-sm"
                        />
                        <ChevronDown 
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 transition-transform duration-200 ${
                            showTagDropdown ? 'rotate-180' : ''
                          }`} 
                        />
                      </div>
                      
                      {/* Dropdown */}
                      {showTagDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600/50 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {availableTags
                            .filter(tag => 
                              tag.qr_code.toLowerCase().includes(tagSearchTerm.toLowerCase()) ||
                              (tag.description && tag.description.toLowerCase().includes(tagSearchTerm.toLowerCase()))
                            )
                            .map(tag => (
                              <div
                                key={tag.id}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, qrTagId: tag.id, useNewTag: false }))
                                  setTagSearchTerm(tag.qr_code)
                                  setShowTagDropdown(false)
                                }}
                                className={`p-3 cursor-pointer transition-all duration-200 hover:bg-slate-700/50 border-b border-slate-700/30 last:border-b-0 ${
                                  formData.qrTagId === tag.id && !formData.useNewTag
                                    ? 'bg-blue-500/10 border-l-4 border-l-blue-500'
                                    : ''
                                }`}
                              >
                                <div className="flex items-center">
                                  <QrCode className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
                                  <div className="flex-1">
                                    <span className="text-white font-mono text-sm">{tag.qr_code}</span>
                                    {tag.description && (
                                      <p className="text-xs text-slate-400 mt-1">{tag.description}</p>
                                    )}
                                  </div>
                                  {formData.qrTagId === tag.id && !formData.useNewTag && (
                                    <CheckCircle className="h-4 w-4 text-blue-400 ml-2" />
                                  )}
                                </div>
                              </div>
                            ))
                          }
                          
                          {availableTags.filter(tag => 
                            tag.qr_code.toLowerCase().includes(tagSearchTerm.toLowerCase()) ||
                            (tag.description && tag.description.toLowerCase().includes(tagSearchTerm.toLowerCase()))
                          ).length === 0 && (
                            <div className="p-3 text-center text-slate-400">
                              Nenhuma tag encontrada para &quot;{tagSearchTerm}&quot;
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Selected tag display */}
                    {formData.qrTagId && !formData.useNewTag && (
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-blue-400 mr-2" />
                          <span className="text-blue-400 text-sm font-medium">Tag selecionada:</span>
                          <span className="text-white font-mono text-sm ml-2">
                            {availableTags.find(tag => tag.id === formData.qrTagId)?.qr_code}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-slate-400 mt-2">
                      {availableTags.length} tag(s) livre(s) disponível(is)
                    </p>
                    
                    {formData.qrTagId && (
                      <p className="text-xs text-blue-400 mt-1">
                        ✅ Tag QR selecionada - Pronto para próxima etapa
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400">Nenhuma tag livre disponível</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Photo Capture */}
        {step === 3 && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Capturar Fotos</h2>
            <p className="text-slate-400 text-sm mb-4">
              Capture as 3 fotos obrigatórias do palete para garantir boa qualidade na análise da IA
            </p>
            
            {/* Instruções visuais */}
            <div className="bg-slate-700/30 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-blue-400" />
                Instruções para as fotos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="flex items-start space-x-2">
                  <span className="text-lg">📷</span>
                  <div>
                    <p className="text-white font-medium">Vista Frontal</p>
                    <p className="text-slate-400">Posicione-se de frente para o palete, capture toda a altura e largura</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-lg">📸</span>
                  <div>
                    <p className="text-white font-medium">Vista Lateral</p>
                    <p className="text-slate-400">Posicione-se ao lado do palete, mostre a profundidade e empilhamento</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-lg">🔝</span>
                  <div>
                    <p className="text-white font-medium">Vista Superior</p>
                    <p className="text-slate-400">Posicione-se acima do palete, mostre a organização dos produtos</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {photos.map((photo, index) => {
                const viewInfo = photoViews[index]
                return (
                  <div key={photo.id} className="border-2 border-dashed border-slate-600/50 rounded-lg p-4 sm:p-6 text-center">
                    {/* Header com informações da vista */}
                    <div className="mb-4">
                      <div className="text-2xl mb-2">{viewInfo.icon}</div>
                      <h3 className="text-sm font-semibold text-white">{viewInfo.title}</h3>
                      <p className="text-xs text-slate-400">{viewInfo.description}</p>
                      {viewInfo.required && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                          Obrigatória
                        </span>
                      )}
                    </div>

                    {photo.preview ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <img 
                            src={photo.preview} 
                            alt={viewInfo.title}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removePhoto(photo.id)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm text-green-400 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {viewInfo.title} capturada
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Camera className="h-12 w-12 text-slate-400 mx-auto" />
                        <p className="text-sm text-slate-500 mb-3">
                          Posicione o palete para capturar a {viewInfo.title.toLowerCase()}
                        </p>
                        <label className="inline-block">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handlePhotoCapture(photo.id, file)
                              }
                            }}
                            className="hidden"
                          />
                          <span className="px-4 py-3 sm:px-3 sm:py-2 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-all duration-200 cursor-pointer inline-flex items-center text-base sm:text-sm font-medium">
                            <Camera className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                            Capturar {viewInfo.title}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            <div className="text-center mt-6">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                photos.filter(p => p.file !== null).length >= 3
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}>
                {photos.filter(p => p.file !== null).length}/3 fotos obrigatórias
              </div>
              
              {photos.filter(p => p.file !== null).length >= 3 && (
                <p className="text-xs text-blue-400 mt-2">
                  ✅ Todas as fotos capturadas - Pronto para próxima etapa
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Manifest (Optional) */}
        {step === 4 && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Vincular a Manifesto (Opcional)</h2>
            <p className="text-slate-400 text-sm mb-6">
              Você pode vincular este palete a um manifesto existente ou deixar para fazer isso depois
            </p>
            
            <div className="space-y-6">
              {/* Option 1: No manifest */}
              <div className="border border-slate-600/50 rounded-lg p-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="manifestOption"
                    checked={!formData.manifestId}
                    onChange={() => setFormData(prev => ({ ...prev, manifestId: '' }))}
                    className="mr-3"
                  />
                  <div>
                    <span className="text-white font-medium">Não vincular a nenhum manifesto agora</span>
                    <p className="text-xs text-slate-400 mt-1">O palete ficará com status &quot;ativo&quot; e poderá ser vinculado posteriormente</p>
                  </div>
                </label>
              </div>

              {/* Option 2: Existing manifest */}
              <div className="border border-slate-600/50 rounded-lg p-4">
                <label className="flex items-center mb-3">
                  <input
                    type="radio"
                    name="manifestOption"
                    checked={formData.manifestId !== ''}
                    onChange={() => {
                      if (manifests.length > 0) {
                        setFormData(prev => ({ ...prev, manifestId: manifests[0].id }))
                      }
                    }}
                    className="mr-3"
                  />
                  <div>
                    <span className="text-white font-medium">Vincular a manifesto existente</span>
                    <p className="text-xs text-slate-400 mt-1">Adicione este palete a um manifesto já criado</p>
                  </div>
                </label>
                
                {formData.manifestId !== '' && (
                  <div className="ml-6">
                    <select
                      value={formData.manifestId}
                      onChange={(e) => setFormData(prev => ({ ...prev, manifestId: e.target.value }))}
                      className="w-full px-3 py-3 sm:py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-base sm:text-sm"
                    >
                      <option value="">Selecione um manifesto</option>
                      {manifests.map(manifest => (
                        <option key={manifest.id} value={manifest.id}>
                          {manifest.name} - {manifest.status}
                        </option>
                      ))}
                    </select>
                    
                    {manifests.length === 0 && (
                      <p className="text-xs text-yellow-400 mt-2">
                        ⚠️ Nenhum manifesto disponível. Crie um manifesto primeiro na seção &quot;Manifestos&quot;.
                      </p>
                    )}
                  </div>
                )}
                
                {manifests.length === 0 && (
                  <p className="text-xs text-slate-500 ml-6">
                    Nenhum manifesto disponível no momento
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : router.push('/pallets')}
            className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-all duration-200 flex items-center justify-center text-base sm:text-sm font-medium"
          >
            <ArrowLeft className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
            {step > 1 ? 'Anterior' : 'Cancelar'}
          </button>

          {/* Always show the next/submit button */}
          <div className="w-full sm:w-auto">
            {step < 4 ? (
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
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-gradient-to-r from-green-500 to-emerald-400 text-white font-semibold rounded-lg shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-base sm:text-sm min-h-[48px]"
              >
                <Save className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                {loading ? 'Criando...' : 'Criar Palete'}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
