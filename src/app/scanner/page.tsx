'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '../../components/layout/AppLayout'
import { 
  Camera, 
  QrCode, 
  Package, 
  Flashlight,
  FlashlightOff,
  RotateCcw,
  X,
  CheckCircle,
  AlertTriangle,
  Zap
} from 'lucide-react'

export default function ScannerPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [lastScan, setLastScan] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Mock scan results database
  const mockPallets = {
    'QR123456789': {
      id: 'PAL-2024-001',
      status: 'sealed',
      location: 'Armazém A - Setor 1',
      items: 125,
      confidence: 92.5
    },
    'QR987654321': {
      id: 'PAL-2024-002',
      status: 'in_transit',
      location: 'Em trânsito',
      items: 75,
      confidence: 88.2
    },
    'QR456789123': {
      id: 'PAL-2024-003',
      status: 'received',
      location: 'Armazém B - Setor 2',
      items: 200,
      confidence: 65.8,
      needsReview: true
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setHasPermission(true)
        setIsScanning(true)
        
        // Start scanning simulation
        simulateScanning()
      }
    } catch (err) {
      console.error('Camera access denied:', err)
      setHasPermission(false)
      setError('Acesso à câmera negado. Verifique as permissões do navegador.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  const simulateScanning = () => {
    // Simulate QR code detection after 3 seconds
    setTimeout(() => {
      if (isScanning) {
        const qrCodes = Object.keys(mockPallets)
        const randomQR = qrCodes[Math.floor(Math.random() * qrCodes.length)]
        handleScanResult(randomQR)
      }
    }, 3000)
  }

  const handleScanResult = async (qrCode: string) => {
    setLastScan(qrCode)
    setError(null)
    
    try {
      const response = await fetch('/api/scanner/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrCode }),
      })
      
      if (!response.ok) {
        throw new Error('QR Code não encontrado no sistema')
      }
      
      const result = await response.json()
      setScanResult(result)
      
      // Navigate based on action
      setTimeout(() => {
        switch (result.action) {
          case 'create_new':
            router.push(`/pallets/new?qr=${qrCode}`)
            break
          case 'continue_editing':
            router.push(`/pallets/${result.pallet.id}`)
            break
          case 'load_to_manifest':
            router.push(`/manifests/new?pallet=${result.pallet.id}`)
            break
          case 'receive_pallet':
            router.push(`/receipts/new?pallet=${result.pallet.id}`)
            break
          case 'view_completed':
          case 'view_pallet':
            router.push(`/pallets/${result.pallet.id}`)
            break
        }
      }, 2000)
      
    } catch (err) {
      setScanResult(null)
      setError(err instanceof Error ? err.message : 'Erro ao processar QR Code')
    }
    
    stopCamera()
  }

  const toggleFlash = async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        const track = stream.getVideoTracks()[0]
        
        if (track && 'torch' in track.getCapabilities()) {
          await track.applyConstraints({
            advanced: [{ torch: !flashEnabled } as any]
          })
          setFlashEnabled(!flashEnabled)
        }
      }
    } catch (err) {
      console.error('Flash toggle failed:', err)
    }
  }

  const resetScanner = () => {
    setScanResult(null)
    setLastScan(null)
    setError(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sealed': return 'success'
      case 'in_transit': return 'warning'
      case 'received': return 'default'
      default: return 'secondary'
    }
  }

  const headerActions = (
    <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30">
      <Zap className="h-4 w-4 text-green-400" />
      <span className="text-sm text-green-300">IA Ativa</span>
    </div>
  )

  return (
    <AppLayout 
      title="Scanner QR" 
      subtitle="Escaneamento de pallets"
      headerActions={headerActions}
    >
        {/* Scanner Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl">
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-lg font-bold text-white flex items-center">
              <QrCode className="h-6 w-6 mr-2 text-green-400" />
              Scanner de QR Code
            </h2>
            <p className="text-sm text-slate-400 mt-1">Escaneie QR codes de pallets para visualizar informações</p>
          </div>
          <div className="p-6 space-y-4">
            {/* Camera View */}
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              {isScanning ? (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                    style={{ display: 'none' }}
                  />
                  
                  {/* Scanning Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-white rounded-lg w-64 h-64 relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                      
                      {/* Scanning Line Animation */}
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-blue-500 animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Controls */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                    <button
                      onClick={toggleFlash}
                      className="p-3 bg-black/50 border border-white/50 text-white rounded-lg hover:bg-black/70 transition-all duration-200"
                    >
                      {flashEnabled ? (
                        <FlashlightOff className="h-5 w-5" />
                      ) : (
                        <Flashlight className="h-5 w-5" />
                      )}
                    </button>
                    
                    <button
                      onClick={stopCamera}
                      className="p-3 bg-black/50 border border-white/50 text-white rounded-lg hover:bg-black/70 transition-all duration-200"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white space-y-4">
                  <QrCode className="h-16 w-16 text-gray-400" />
                  <p className="text-lg font-medium">Câmera Desligada</p>
                  <p className="text-sm text-gray-400 text-center">
                    Clique em "Iniciar Scanner" para começar a escanear QR codes
                  </p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              {!isScanning ? (
                <button 
                  onClick={startCamera} 
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-400 text-white font-semibold rounded-lg shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 transition-all duration-200 flex items-center"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Iniciar Scanner
                </button>
              ) : (
                <button 
                  onClick={stopCamera} 
                  className="px-6 py-3 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-all duration-200 flex items-center"
                >
                  <X className="h-4 w-4 mr-2" />
                  Parar Scanner
                </button>
              )}
              
              {(scanResult || error) && (
                <button 
                  onClick={resetScanner} 
                  className="px-6 py-3 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-all duration-200 flex items-center"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Novo Scan
                </button>
              )}
            </div>

            {/* Permission Error */}
            {hasPermission === false && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                  <p className="text-red-300 font-medium">Acesso à câmera necessário</p>
                </div>
                <p className="text-red-400 text-sm mt-1">
                  Para usar o scanner, permita o acesso à câmera nas configurações do navegador.
                </p>
              </div>
            )}

            {/* Scanning Status */}
            {isScanning && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                  <p className="text-blue-300 font-medium">Escaneando...</p>
                </div>
                <p className="text-blue-400 text-sm mt-1">
                  Posicione o QR code dentro da área destacada
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Scan Result */}
        {scanResult && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl">
            <div className="p-4 md:p-6 border-b border-slate-700/50">
              <h2 className="text-lg font-bold text-green-400 flex items-center">
                <CheckCircle className="h-6 w-6 mr-2" />
                Pallet Encontrado
              </h2>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{scanResult.id}</h3>
                  <p className="text-slate-400">QR: {lastScan}</p>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full w-fit ${
                  scanResult.status === 'sealed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  scanResult.status === 'in_transit' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                  'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }`}>
                  {scanResult.status === 'sealed' ? 'Lacrado' :
                   scanResult.status === 'in_transit' ? 'Em Trânsito' : 'Recebido'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Localização</p>
                  <p className="font-medium text-white">{scanResult.location}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total de Itens</p>
                  <p className="font-medium text-white">{scanResult.items}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Confiança IA</p>
                  <p className={`font-medium ${
                    scanResult.confidence >= 85 ? 'text-green-400' :
                    scanResult.confidence >= 65 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {scanResult.confidence}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      scanResult.status === 'sealed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      scanResult.status === 'in_transit' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}>
                      {scanResult.status === 'sealed' ? 'Lacrado' :
                       scanResult.status === 'in_transit' ? 'Em Trânsito' : 'Recebido'}
                    </span>
                    {scanResult.needsReview && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                        Revisão
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {scanResult.needsReview && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                    <p className="text-yellow-300 font-medium">Revisão Manual Necessária</p>
                  </div>
                  <p className="text-yellow-400 text-sm mt-1">
                    Este pallet possui confiança IA abaixo de 65% e precisa de revisão.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => router.push(`/pallets/${scanResult.id}`)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-200 flex items-center justify-center"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </button>
                
                {scanResult.status === 'in_transit' && (
                  <button 
                    onClick={() => router.push(`/receipts/new?pallet=${scanResult.id}`)}
                    className="flex-1 px-4 py-3 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-all duration-200 flex items-center justify-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Receber
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Result */}
        {error && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl">
            <div className="p-4 md:p-6 border-b border-slate-700/50">
              <h2 className="text-lg font-bold text-red-400 flex items-center">
                <AlertTriangle className="h-6 w-6 mr-2" />
                Erro no Scan
              </h2>
            </div>
            <div className="p-4 md:p-6">
              <p className="text-slate-300 mb-4">{error}</p>
              <p className="text-sm text-slate-400">
                QR Code escaneado: <code className="bg-slate-700/50 px-2 py-1 rounded text-slate-300">{lastScan}</code>
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl">
          <div className="p-4 md:p-6 border-b border-slate-700/50">
            <h2 className="text-lg font-bold text-white">Como usar o Scanner</h2>
          </div>
          <div className="p-4 md:p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center text-sm font-bold text-green-400 mt-0.5 border border-green-500/30 flex-shrink-0">
                1
              </div>
              <p className="text-sm text-slate-300">
                Clique em "Iniciar Scanner" e permita o acesso à câmera
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center text-sm font-bold text-green-400 mt-0.5 border border-green-500/30 flex-shrink-0">
                2
              </div>
              <p className="text-sm text-slate-300">
                Posicione o QR code do pallet dentro da área destacada
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center text-sm font-bold text-green-400 mt-0.5 border border-green-500/30 flex-shrink-0">
                3
              </div>
              <p className="text-sm text-slate-300">
                Aguarde o reconhecimento automático e veja as informações do pallet
              </p>
            </div>
          </div>
        </div>
    </AppLayout>
  )
}
