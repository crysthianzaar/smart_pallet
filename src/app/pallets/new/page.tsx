'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '../../../components/layout/AppLayout'
import { useVisionAnalysis } from '../../../hooks/useVisionAnalysis'
import { VisionAnalysisResults } from '../../../components/VisionAnalysisResults'
import { MobilePhotoCapture } from '../../../components/MobilePhotoCapture'
import { QRCodeScanner } from '../../../components/QRCodeScanner'
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
  ChevronDown,
  Brain
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

interface Sku {
  id: string
  code: string
  name: string
  description?: string
  unit: string
  weight?: number
  dimensions?: string
  status: 'active' | 'inactive'
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
  const [step, setStep] = useState(1) // 1: Info, 2: QR Tag, 3: Photos, 4: SKUs, 5: Vision Analysis
  
  // Data states
  const [contracts, setContracts] = useState<Contract[]>([])
  const [availableTags, setAvailableTags] = useState<QrTag[]>([])
  const [manifests, setManifests] = useState<Manifest[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [skus, setSkus] = useState<Sku[]>([])
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

  // SKU selection state
  const [selectedSkus, setSelectedSkus] = useState<Sku[]>([])
  const [skuSearchTerm, setSkuSearchTerm] = useState('')

  const photoViews = [
    { id: '1', title: 'Vista Frontal', description: 'Foto frontal do palete', icon: '📷', required: true },
    { id: '2', title: 'Vista Lateral', description: 'Foto lateral do palete', icon: '📸', required: true },
    { id: '3', title: 'Vista Superior', description: 'Foto de cima do palete', icon: '🔝', required: false }
  ]
  
  const [error, setError] = useState<string | null>(null)
  const [visionResult, setVisionResult] = useState<any>(null)
  const [showVisionResults, setShowVisionResults] = useState(false)
  const [acceptedItemCount, setAcceptedItemCount] = useState<number | null>(null)
  const [showQRScanner, setShowQRScanner] = useState(false)
  
  // Vision analysis hook
  const { analyzeImages, isAnalyzing, error: visionError, clearError } = useVisionAnalysis()

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

      // Load SKUs
      const skusRes = await fetch('/api/skus?status=active')
      if (skusRes.ok) {
        const skusData = await skusRes.json()
        setSkus(skusData.data || skusData || [])
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

  const handleQRCodeDetected = async (qrCode: string) => {
    try {
      setShowQRScanner(false)
      
      // Check if this QR code exists in available tags
      const existingTag = availableTags.find(tag => tag.qr_code === qrCode)
      
      if (existingTag) {
        // Use existing tag
        setFormData(prev => ({ ...prev, qrTagId: existingTag.id, useNewTag: false }))
        setTagSearchTerm(existingTag.qr_code)
      } else {
        // Create new tag with scanned QR code
        const response = await fetch('/api/qr-tags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            qr_code: qrCode,
            status: 'vinculado',
            description: `Tag escaneada - ${new Date().toLocaleDateString('pt-BR')}`
          }),
        })
        
        if (!response.ok) {
          throw new Error('Erro ao criar nova tag')
        }
        
        const result = await response.json()
        setFormData(prev => ({ ...prev, qrTagId: result.data.id, useNewTag: true }))
        setTagSearchTerm(qrCode)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar QR code')
    }
  }

  const canProceedToNext = () => {
    switch (step) {
      case 1:
        return formData.contractId !== '' && formData.originLocationId !== ''
      case 2:
        return formData.qrTagId !== ''
      case 3:
        const requiredPhotos = photos.filter((p, index) => photoViews[index]?.required && p.file !== null).length
        return requiredPhotos >= 2 // At least front and side photos
      case 4:
        return selectedSkus.length > 0 // At least one SKU selected
      case 5:
        return true // Vision analysis step
      default:
        return false
    }
  }

  const runVisionAnalysis = async () => {
    try {
      setError(null)
      clearError()
      
      // Prepare images for analysis
      const images: any = {}
      
      photos.forEach((photo, index) => {
        if (photo.file) {
          const viewType = photoViews[index]
          if (viewType.id === '1') images.front_image = photo.file
          if (viewType.id === '2') images.side_image = photo.file  
          if (viewType.id === '3') images.top_image = photo.file
        }
      })

      // Prepare metadata from form data and selected SKUs
      const selectedContract = contracts.find(c => c.id === formData.contractId)
      const skuInfo = selectedSkus.map(sku => ({
        code: sku.code,
        name: sku.name,
        description: sku.description,
        unit: sku.unit,
        weight: sku.weight,
        dimensions: sku.dimensions
      }))
      
      const metadata = {
        contract_name: selectedContract?.name || 'Contrato não identificado',
        skus: skuInfo,
        item_types_count: selectedSkus.length
      }

      console.log('Running vision analysis with images:', Object.keys(images))
      
      const result = await analyzeImages(images, metadata)
      setVisionResult(result)
      setShowVisionResults(true)
      
    } catch (err) {
      console.error('Vision analysis error:', err)
      setError(err instanceof Error ? err.message : 'Erro na análise de visão')
    }
  }

  const handleAcceptVisionResult = (itemCount: number) => {
    setAcceptedItemCount(itemCount)
    setShowVisionResults(false)
    // Proceed to submit the pallet with the accepted count
    handleSubmit(itemCount)
  }

  const handleRejectVisionResult = () => {
    setShowVisionResults(false)
    setVisionResult(null)
    // Allow manual entry - could show a form for manual count
    handleSubmit(null)
  }

  const handleSubmit = async (visionItemCount?: number | null) => {
    try {
      setLoading(true)
      setError(null)

      // Upload photos first and get their URLs
      const uploadedPhotos: Array<{
        photo_type: string;
        stage: string;
        file_path: string;
      }> = []
      
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        if (photo.file) {
          try {
            const photoType = i === 0 ? 'frontal' : i === 1 ? 'lateral' : 'superior'
            const fileName = `pallets/${Date.now()}_${i + 1}_${photoType}_origem.jpg`
            
            // Upload to Supabase Storage
            const formData = new FormData()
            formData.append('file', photo.file!)
            formData.append('fileName', fileName)
            
            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              body: formData
            })
            
            if (!uploadResponse.ok) {
              throw new Error('Failed to upload image')
            }
            
            const { publicUrl } = await uploadResponse.json()
            
            uploadedPhotos.push({
              photo_type: photoType,
              stage: 'origem',
              file_path: publicUrl
            })
          } catch (error) {
            console.error('Error processing photo:', error)
            throw new Error(`Erro ao fazer upload da foto ${i + 1}`)
          }
        }
      }

      // Prepare data for submission - ensure all values are strings or null
      const submitData = {
        contract_id: String(formData.contractId),
        qr_tag_id: String(formData.qrTagId),
        origin_location_id: formData.originLocationId || 'LOC-001',
        status: 'ativo',
        created_by: 'user-001',
        // Add selected SKUs information
        selected_skus: selectedSkus.map(sku => ({
          sku_id: sku.id,
          expected_quantity: 1
        })),
        // Add photos if any were captured
        photos: uploadedPhotos,
        // Add vision metadata if analysis was run
        vision_metadata: visionResult ? {
          item_count: visionItemCount || visionResult.itemCount,
          confidence: visionResult.confidence,
          rationale: visionResult.rationale,
          suggestions: visionResult.suggestions,
          item_count_by_layer: visionResult.itemCountByLayer,
          debug: visionResult.debug
        } : null
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
      
      alert(`Palete criado com sucesso!${visionItemCount ? ` Contagem estimada: ${visionItemCount} itens` : ''}`)
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
          <span className="text-sm text-slate-400">Etapa {step} de 5</span>
        </div>
        <div className="flex items-center justify-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
            step >= step 
              ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/25' 
              : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
          }`}>
            {[FileText, QrCode, Camera, Package, Brain][step - 1] && 
              React.createElement([FileText, QrCode, Camera, Package, Brain][step - 1], { className: "h-6 w-6" })
            }
          </div>
        </div>
        <div className="text-center mt-3">
          <span className="text-white font-medium">
            {['Contrato', 'Tag QR', 'Fotos', 'Produtos', 'Análise IA'][step - 1]}
          </span>
        </div>
      </div>

      {/* Desktop: Horizontal layout */}
      <div className="hidden sm:flex items-center justify-between">
        {[
          { num: 1, title: 'Contrato', icon: FileText },
          { num: 2, title: 'Tag QR', icon: QrCode },
          { num: 3, title: 'Fotos', icon: Camera },
          { num: 4, title: 'Produtos', icon: Package },
          { num: 5, title: 'Análise IA', icon: Brain }
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
            {num < 5 && (
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
            
            <div className="space-y-4">
              {/* QR Scanner Button - Mobile First */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg p-4">
                <button
                  onClick={() => setShowQRScanner(true)}
                  className="w-full flex items-center justify-center gap-3 text-white font-semibold py-3"
                >
                  <Camera className="h-6 w-6" />
                  <span className="text-lg">Escanear QR Code do Pallet</span>
                </button>
                <p className="text-blue-100 text-sm text-center mt-2">
                  Tire uma foto ou selecione da galeria
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-600"></div>
                <span className="text-slate-400 text-sm">ou</span>
                <div className="flex-1 h-px bg-slate-600"></div>
              </div>

              {/* Manual Selection */}
              <div className="border border-slate-600/50 rounded-lg p-4">
                <h3 className="text-base font-medium text-white mb-3 flex items-center">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Tag Existente
                </h3>
                
                {availableTags.length > 0 ? (
                  <div className="space-y-3 tag-dropdown-container">
                    {/* Search Input */}
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
                        placeholder="Digite o código da tag QR..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>

                    {/* Show available tags count when not searching */}
                    {!showTagDropdown && tagSearchTerm.length === 0 && (
                      <div className="text-center py-2">
                        <p className="text-slate-400 text-sm">
                          {availableTags.length} tag(s) disponível(is) - clique no campo para ver
                        </p>
                      </div>
                    )}

                    {/* Tags List - Mobile Optimized */}
                    {(showTagDropdown || tagSearchTerm.length > 0) && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {availableTags
                          .filter(tag => 
                            tagSearchTerm.length === 0 || // Show all if no search term
                            tag.qr_code.toLowerCase().includes(tagSearchTerm.toLowerCase()) ||
                            (tag.description && tag.description.toLowerCase().includes(tagSearchTerm.toLowerCase()))
                          )
                          .slice(0, 5) // Limit to 5 items for mobile
                          .map(tag => (
                            <div
                              key={tag.id}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, qrTagId: tag.id, useNewTag: false }))
                                setTagSearchTerm(tag.qr_code)
                                setShowTagDropdown(false)
                              }}
                              className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                                formData.qrTagId === tag.id && !formData.useNewTag
                                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                  : 'bg-slate-700/30 border-slate-600/50 hover:bg-slate-600/30 text-white'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <QrCode className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                  <div>
                                    <span className="font-mono text-sm font-medium">{tag.qr_code}</span>
                                    {tag.description && (
                                      <p className="text-xs text-slate-400 mt-1">{tag.description}</p>
                                    )}
                                  </div>
                                </div>
                                {formData.qrTagId === tag.id && !formData.useNewTag && (
                                  <CheckCircle className="h-4 w-4 text-blue-400" />
                                )}
                              </div>
                            </div>
                          ))
                        }
                        
                        {availableTags.filter(tag => 
                          tagSearchTerm.length === 0 || // Show all if no search term
                          tag.qr_code.toLowerCase().includes(tagSearchTerm.toLowerCase()) ||
                          (tag.description && tag.description.toLowerCase().includes(tagSearchTerm.toLowerCase()))
                        ).length === 0 && tagSearchTerm.length > 0 && (
                          <div className="p-4 text-center text-slate-400 bg-slate-700/20 rounded-lg">
                            <QrCode className="h-8 w-8 mx-auto mb-2 text-slate-500" />
                            <p className="text-sm">Nenhuma tag encontrada</p>
                            <p className="text-xs mt-1">Tente escanear o QR code</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <QrCode className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Nenhuma tag livre disponível</p>
                    <p className="text-slate-500 text-xs mt-1">Use o scanner para criar uma nova</p>
                  </div>
                )}
              </div>

              {/* Selected Tag Display */}
              {formData.qrTagId && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-green-400 font-medium text-sm">Tag QR Selecionada</p>
                      <p className="text-white font-mono text-lg">
                        {formData.useNewTag ? tagSearchTerm : availableTags.find(tag => tag.id === formData.qrTagId)?.qr_code}
                      </p>
                      <p className="text-green-300 text-xs mt-1">
                        {formData.useNewTag ? 'Nova tag criada' : 'Tag existente'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
            
            <MobilePhotoCapture
              photos={photos}
              photoViews={photoViews}
              onPhotoCapture={handlePhotoCapture}
              onRemovePhoto={removePhoto}
            />
            
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

        {/* Step 4: SKU Selection */}
        {step === 4 && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <Package className="h-6 w-6 text-green-400" />
              <h2 className="text-lg sm:text-xl font-bold text-white">Produtos do Pallet</h2>
            </div>
            
            <p className="text-slate-400 text-sm mb-6">
              Selecione os tipos de produtos (SKUs) que estão neste pallet. A IA irá identificar e contar automaticamente a quantidade de cada produto nas imagens.
            </p>

            {/* SKU Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Buscar Produto
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={skuSearchTerm}
                  onChange={(e) => setSkuSearchTerm(e.target.value)}
                  placeholder="Digite o código ou nome do produto..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            {/* Available SKUs */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Produtos Disponíveis</h3>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {skus
                  .filter(sku => 
                    skuSearchTerm === '' || 
                    sku.code.toLowerCase().includes(skuSearchTerm.toLowerCase()) ||
                    sku.name.toLowerCase().includes(skuSearchTerm.toLowerCase())
                  )
                  .slice(0, 10)
                  .map(sku => (
                    <div
                      key={sku.id}
                      onClick={() => {
                        if (!selectedSkus.find(s => s.id === sku.id)) {
                          setSelectedSkus([...selectedSkus, sku])
                          setSkuSearchTerm('')
                        }
                      }}
                      className="p-3 bg-slate-700/30 border border-slate-600/30 rounded-lg hover:bg-slate-600/30 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-medium">{sku.code} - {sku.name}</p>
                          <p className="text-slate-400 text-sm">{sku.description}</p>
                          <div className="flex gap-4 text-xs text-slate-500 mt-1">
                            <span>Unidade: {sku.unit}</span>
                            {sku.weight && <span>Peso: {sku.weight}kg</span>}
                            {sku.dimensions && <span>Dimensões: {sku.dimensions}</span>}
                          </div>
                        </div>
                        <Plus className="h-4 w-4 text-green-400" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Selected SKUs */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3">
                Produtos Selecionados ({selectedSkus.length})
              </h3>
              
              {selectedSkus.length === 0 ? (
                <div className="p-4 bg-slate-700/20 border border-slate-600/20 rounded-lg text-center">
                  <Package className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Nenhum produto selecionado ainda</p>
                  <p className="text-slate-500 text-xs mt-1">Use a busca acima para adicionar produtos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedSkus.map((sku, index) => (
                    <div key={sku.id} className="p-4 bg-slate-700/30 border border-slate-600/30 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="text-white font-medium">{sku.code} - {sku.name}</p>
                          <p className="text-slate-400 text-sm">{sku.description}</p>
                          <div className="flex gap-4 text-xs text-slate-500 mt-1">
                            <span>Unidade: {sku.unit}</span>
                            {sku.weight && <span>Peso: {sku.weight}kg</span>}
                            {sku.dimensions && <span>Dimensões: {sku.dimensions}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedSkus(selectedSkus.filter((_, i) => i !== index))}
                          className="text-red-400 hover:text-red-300 transition-colors ml-3"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-blue-300 text-sm font-medium">
                      {selectedSkus.length} tipo{selectedSkus.length !== 1 ? 's' : ''} de produto{selectedSkus.length !== 1 ? 's' : ''} selecionado{selectedSkus.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-blue-200 text-xs mt-1">
                      A IA irá contar automaticamente a quantidade de cada produto
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Vision Analysis */}
        {step === 5 && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="h-6 w-6 text-purple-400" />
              <h2 className="text-lg sm:text-xl font-bold text-white">Análise de Visão Computacional</h2>
            </div>
            
            <p className="text-slate-400 text-sm mb-6">
              Vamos analisar as fotos do pallet para estimar automaticamente a quantidade de itens usando inteligência artificial.
            </p>

            {!showVisionResults && !visionResult && (
              <div className="space-y-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">Imagens Disponíveis:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {photos.map((photo, index) => {
                      const viewType = photoViews[index];
                      return (
                        <div key={photo.id} className="text-center">
                          <div className={`w-full h-24 rounded-lg flex items-center justify-center ${
                            photo.file ? 'bg-green-500/20 border-green-500/50' : 'bg-slate-600/50 border-slate-500/50'
                          } border`}>
                            {photo.file ? (
                              <CheckCircle className="h-6 w-6 text-green-400" />
                            ) : (
                              <X className="h-6 w-6 text-slate-400" />
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{viewType.title}</p>
                          <p className="text-xs text-slate-500">{photo.file ? 'Disponível' : 'Não fornecida'}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={runVisionAnalysis}
                  disabled={isAnalyzing || photos.filter(p => p.file).length === 0}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-400 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Analisando Imagens...
                    </>
                  ) : (
                    <>
                      <Eye className="h-5 w-5" />
                      Iniciar Análise de Visão
                    </>
                  )}
                </button>

                {(visionError || error) && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{visionError || error}</p>
                  </div>
                )}
              </div>
            )}

            {showVisionResults && visionResult && (
              <VisionAnalysisResults
                result={visionResult}
                onAccept={handleAcceptVisionResult}
                onReject={handleRejectVisionResult}
                onRetry={() => {
                  setShowVisionResults(false)
                  setVisionResult(null)
                  runVisionAnalysis()
                }}
              />
            )}

            {!showVisionResults && !isAnalyzing && (
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-300">
                    <p className="font-medium mb-1">Como funciona:</p>
                    <ul className="text-xs space-y-1 text-blue-200">
                      <li>• A IA analisa as fotos para identificar e contar os itens</li>
                      <li>• Quanto mais fotos, maior a precisão da contagem</li>
                      <li>• Você pode aceitar o resultado ou inserir manualmente</li>
                      <li>• O sistema aprende com cada análise para melhorar</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
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
            {step < 5 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceedToNext()}
                className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm min-h-[48px] flex items-center justify-center"
              >
                Próximo
              </button>
            ) : (
              // Step 5: Only show "Create Pallet" button if vision analysis was completed or user chose manual entry
              (acceptedItemCount !== null || visionResult === null) && (
                <button
                  onClick={() => handleSubmit(acceptedItemCount)}
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-gradient-to-r from-green-500 to-emerald-400 text-white font-semibold rounded-lg shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-base sm:text-sm min-h-[48px]"
                >
                  <Save className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                  {loading ? 'Criando...' : 'Criar Palete'}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* QR Code Scanner Modal */}
      {showQRScanner && (
        <QRCodeScanner
          onQRCodeDetected={handleQRCodeDetected}
          onCancel={() => setShowQRScanner(false)}
        />
      )}
    </AppLayout>
  )
}
