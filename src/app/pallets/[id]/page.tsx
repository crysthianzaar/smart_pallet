'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '../../../components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
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
  Share
} from 'lucide-react'

// Mock data - seria carregado da API
const palletData = {
  id: 'PAL-2024-001',
  qr: 'QR123456789',
  status: 'sealed',
  contractId: 'CONT-001',
  contractName: 'Cliente A - Contrato Principal',
  originLocation: 'Armazém A - Setor 1',
  destinationLocation: 'Armazém B - Setor 2',
  createdAt: '2024-01-20 14:30',
  createdBy: 'João Silva',
  sealedAt: '2024-01-20 15:45',
  confidence: 92.5,
  needsReview: false,
  observations: 'Pallet com produtos frágeis, manuseio cuidadoso',
  photos: [
    { id: 1, url: '/api/photos/1.jpg', type: 'general' },
    { id: 2, url: '/api/photos/2.jpg', type: 'items' },
    { id: 3, url: '/api/photos/3.jpg', type: 'label' },
    { id: 4, url: '/api/photos/4.jpg', type: 'general' }
  ],
  items: [
    {
      id: 1,
      skuId: 'SKU001',
      skuCode: 'PROD-A-001',
      skuName: 'Produto A Premium',
      quantity: 75,
      unitPrice: 25.99,
      totalValue: 1949.25,
      aiQuantity: 73,
      aiConfidence: 89.2
    },
    {
      id: 2,
      skuId: 'SKU002',
      skuCode: 'PROD-B-002',
      skuName: 'Produto B Standard',
      quantity: 50,
      unitPrice: 15.50,
      totalValue: 775.00,
      aiQuantity: 52,
      aiConfidence: 95.8
    }
  ],
  auditLog: [
    {
      id: 1,
      action: 'pallet_created',
      description: 'Pallet criado',
      user: 'João Silva',
      timestamp: '2024-01-20 14:30'
    },
    {
      id: 2,
      action: 'photos_captured',
      description: '4 fotos capturadas',
      user: 'João Silva',
      timestamp: '2024-01-20 14:45'
    },
    {
      id: 3,
      action: 'ai_analysis',
      description: 'Análise IA concluída - Confiança: 92.5%',
      user: 'Sistema',
      timestamp: '2024-01-20 15:30'
    },
    {
      id: 4,
      action: 'pallet_sealed',
      description: 'Pallet lacrado e aprovado',
      user: 'João Silva',
      timestamp: '2024-01-20 15:45'
    }
  ]
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'sealed': return 'success'
    case 'in_transit': return 'warning'
    case 'received': return 'default'
    default: return 'secondary'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'sealed': return 'Lacrado'
    case 'in_transit': return 'Em Trânsito'
    case 'received': return 'Recebido'
    default: return status
  }
}

export default function PalletDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')

  const palletId = params.id as string
  const totalItems = palletData.items.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = palletData.items.reduce((sum, item) => sum + item.totalValue, 0)

  return (
    <MainLayout title={`Pallet ${palletId}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/pallets')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{palletData.id}</h1>
              <p className="text-gray-500">{palletData.contractName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={getStatusColor(palletData.status)}>
              {getStatusLabel(palletData.status)}
            </Badge>
            {palletData.needsReview && (
              <Badge variant="critical">Revisão Necessária</Badge>
            )}
            <Button variant="outline">
              <Share className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Relatório
            </Button>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Itens</p>
                  <p className="text-2xl font-bold">{totalItems}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold">R$ {totalValue.toFixed(2)}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">R$</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Confiança IA</p>
                  <p className="text-2xl font-bold">{palletData.confidence}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">SKUs Diferentes</p>
                  <p className="text-2xl font-bold">{palletData.items.length}</p>
                </div>
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <div className="h-4 w-4 bg-purple-500 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Visão Geral' },
              { id: 'items', name: 'Itens' },
              { id: 'photos', name: 'Fotos' },
              { id: 'audit', name: 'Histórico' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">ID do Pallet</p>
                    <p className="font-medium">{palletData.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">QR Code</p>
                    <p className="font-medium flex items-center">
                      <QrCode className="h-4 w-4 mr-1" />
                      {palletData.qr}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Contrato</p>
                    <p className="font-medium">{palletData.contractId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge variant={getStatusColor(palletData.status)}>
                      {getStatusLabel(palletData.status)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Local de Origem</p>
                    <p className="font-medium">{palletData.originLocation}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Local de Destino</p>
                    <p className="font-medium">{palletData.destinationLocation}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Criado por</p>
                    <p className="font-medium">{palletData.createdBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Data de Criação</p>
                    <p className="font-medium">{palletData.createdAt}</p>
                  </div>
                </div>

                {palletData.observations && (
                  <div>
                    <p className="text-sm text-gray-600">Observações</p>
                    <p className="font-medium">{palletData.observations}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise da IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${
                    palletData.confidence >= 85 ? 'text-green-600' :
                    palletData.confidence >= 65 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {palletData.confidence}%
                  </div>
                  <p className="text-gray-600">Confiança Geral</p>
                </div>

                <div className="space-y-3">
                  {palletData.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.skuName}</p>
                        <p className="text-sm text-gray-600">
                          Manual: {item.quantity} | IA: {item.aiQuantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          item.aiConfidence >= 85 ? 'text-green-600' :
                          item.aiConfidence >= 65 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {item.aiConfidence}%
                        </p>
                        <p className="text-xs text-gray-500">confiança</p>
                      </div>
                    </div>
                  ))}
                </div>

                {palletData.confidence < 65 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                      <p className="text-red-800 font-medium">Revisão Manual Necessária</p>
                    </div>
                    <p className="text-red-600 text-sm mt-1">
                      A confiança da IA está abaixo do limite de 65%. É necessária uma revisão manual.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'items' && (
          <Card>
            <CardHeader>
              <CardTitle>Itens do Pallet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {palletData.items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                      <div className="md:col-span-2">
                        <h4 className="font-medium">{item.skuName}</h4>
                        <p className="text-sm text-gray-600">{item.skuCode}</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-lg font-bold">{item.quantity}</p>
                        <p className="text-xs text-gray-500">Qtd. Manual</p>
                      </div>
                      
                      <div className="text-center">
                        <p className={`text-lg font-bold ${
                          Math.abs(item.quantity - item.aiQuantity) <= 2 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.aiQuantity}
                        </p>
                        <p className="text-xs text-gray-500">Qtd. IA</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-lg font-bold">R$ {item.unitPrice.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Preço Unit.</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-lg font-bold">R$ {item.totalValue.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Total</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Confiança IA:</span>
                        <Badge variant={
                          item.aiConfidence >= 85 ? 'success' :
                          item.aiConfidence >= 65 ? 'warning' : 'critical'
                        }>
                          {item.aiConfidence}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'photos' && (
          <Card>
            <CardHeader>
              <CardTitle>Fotos do Pallet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {palletData.photos.map((photo) => (
                  <div key={photo.id} className="border rounded-lg p-4">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                      <Camera className="h-12 w-12 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Foto {photo.id}</p>
                      <p className="text-xs text-gray-500 capitalize">{photo.type}</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'audit' && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Auditoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {palletData.auditLog.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {log.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {log.user} • {log.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
