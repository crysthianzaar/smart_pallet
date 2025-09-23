'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '../../../components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Badge } from '../../../components/ui/badge'
import { 
  Camera, 
  QrCode, 
  Plus, 
  Minus, 
  Package, 
  Save,
  ArrowLeft,
  Upload
} from 'lucide-react'

interface PalletItem {
  id: string
  skuId: string
  skuName: string
  skuCode: string
  quantity: number
  unitPrice: number
}

export default function NewPalletPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Info, 2: Items, 3: Photos
  
  // Form data
  const [palletData, setPalletData] = useState({
    contractId: '',
    originLocationId: '',
    observations: ''
  })
  
  const [items, setItems] = useState<PalletItem[]>([
    {
      id: '1',
      skuId: 'SKU001',
      skuName: 'Produto A',
      skuCode: 'PROD-A-001',
      quantity: 50,
      unitPrice: 25.99
    }
  ])
  
  const [photos, setPhotos] = useState<string[]>([])

  const addItem = () => {
    const newItem: PalletItem = {
      id: Date.now().toString(),
      skuId: '',
      skuName: '',
      skuCode: '',
      quantity: 0,
      unitPrice: 0
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: keyof PalletItem, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // TODO: Implement API call
      console.log('Creating pallet:', { palletData, items, photos })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      router.push('/pallets')
    } catch (error) {
      console.error('Error creating pallet:', error)
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return palletData.contractId && palletData.originLocationId
      case 2:
        return items.length > 0 && items.length <= 2 && items.every(item => 
          item.skuId && item.quantity > 0
        )
      case 3:
        return photos.length >= 3
      default:
        return false
    }
  }

  return (
    <MainLayout title="Novo Pallet">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Progress Steps */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <span className={step >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                  Informações Básicas
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
                <span className={step >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                  Itens do Pallet
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  3
                </div>
                <span className={step >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                  Fotos e Finalização
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas do Pallet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contract">Contrato *</Label>
                  <select
                    id="contract"
                    value={palletData.contractId}
                    onChange={(e) => setPalletData({...palletData, contractId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Selecione um contrato</option>
                    <option value="CONT-001">CONT-001 - Cliente A</option>
                    <option value="CONT-002">CONT-002 - Cliente B</option>
                    <option value="CONT-003">CONT-003 - Cliente C</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Local de Origem *</Label>
                  <select
                    id="location"
                    value={palletData.originLocationId}
                    onChange={(e) => setPalletData({...palletData, originLocationId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Selecione o local</option>
                    <option value="LOC-001">Armazém A - Setor 1</option>
                    <option value="LOC-002">Armazém A - Setor 2</option>
                    <option value="LOC-003">Armazém B - Setor 1</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <textarea
                  id="observations"
                  value={palletData.observations}
                  onChange={(e) => setPalletData({...palletData, observations: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Observações adicionais sobre o pallet..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Items */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Itens do Pallet</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Máximo de 2 SKUs diferentes por pallet
                  </p>
                </div>
                <Badge variant={items.length <= 2 ? 'success' : 'critical'}>
                  {items.length}/2 SKUs
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {items.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>SKU *</Label>
                      <select
                        value={item.skuId}
                        onChange={(e) => {
                          const selectedSku = e.target.value
                          updateItem(item.id, 'skuId', selectedSku)
                          // Mock SKU data update
                          if (selectedSku === 'SKU001') {
                            updateItem(item.id, 'skuName', 'Produto A')
                            updateItem(item.id, 'skuCode', 'PROD-A-001')
                            updateItem(item.id, 'unitPrice', 25.99)
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Selecione SKU</option>
                        <option value="SKU001">SKU001 - Produto A</option>
                        <option value="SKU002">SKU002 - Produto B</option>
                        <option value="SKU003">SKU003 - Produto C</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Nome do Produto</Label>
                      <Input
                        value={item.skuName}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Quantidade *</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Preço Unitário</Label>
                      <Input
                        type="number"
                        value={item.unitPrice}
                        readOnly
                        className="bg-gray-50"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {items.length < 2 && (
                <Button
                  variant="outline"
                  onClick={addItem}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              )}

              {/* Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total de Itens:</span>
                  <span className="text-lg font-bold">
                    {items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium">Valor Total:</span>
                  <span className="text-lg font-bold">
                    R$ {items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Photos */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Fotos do Pallet</CardTitle>
              <p className="text-sm text-gray-500">
                Tire pelo menos 3 fotos do pallet para garantir boa qualidade na análise da IA
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4].map((photoNum) => (
                  <div key={photoNum} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    {photos[photoNum - 1] ? (
                      <div className="space-y-2">
                        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-sm text-green-600">Foto {photoNum} capturada</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Camera className="h-12 w-12 text-gray-400 mx-auto" />
                        <p className="text-sm text-gray-500">
                          {photoNum <= 3 ? `Foto ${photoNum} *` : `Foto ${photoNum} (opcional)`}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Mock photo capture
                            const newPhotos = [...photos]
                            newPhotos[photoNum - 1] = `photo-${photoNum}-${Date.now()}.jpg`
                            setPhotos(newPhotos)
                          }}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Capturar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Badge variant={photos.length >= 3 ? 'success' : 'warning'}>
                  {photos.length}/3 fotos obrigatórias
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : router.push('/pallets')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {step > 1 ? 'Anterior' : 'Cancelar'}
          </Button>

          <div className="space-x-2">
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                Próximo
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Criando...' : 'Criar Pallet'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
