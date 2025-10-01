'use client'

import React, { useState, useRef } from 'react'
import { Camera, Upload, X, CheckCircle, QrCode, AlertCircle } from 'lucide-react'

interface QRCodeScannerProps {
  onQRCodeDetected: (qrCode: string) => void
  onCancel: () => void
}

export function QRCodeScanner({ onQRCodeDetected, onCancel }: QRCodeScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processImage = async (file: File) => {
    try {
      setIsProcessing(true)
      setError(null)

      // Create a canvas to process the image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      return new Promise<void>((resolve, reject) => {
        img.onload = async () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx?.drawImage(img, 0, 0)

          // Convert to base64 for API processing
          const base64 = canvas.toDataURL('image/jpeg', 0.8)

          try {
            // Call QR code detection API
            const response = await fetch('/api/qr-code/detect', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ image: base64 })
            })

            if (!response.ok) {
              throw new Error('Erro ao processar imagem')
            }

            const result = await response.json()
            
            if (result.qr_code) {
              onQRCodeDetected(result.qr_code)
              resolve()
            } else {
              setError('Nenhum QR code encontrado na imagem. Tente uma foto mais clara.')
              reject(new Error('QR code not found'))
            }
          } catch (apiError) {
            console.error('API Error:', apiError)
            setError('Erro ao processar a imagem. Tente novamente.')
            reject(apiError)
          }
        }

        img.onerror = () => {
          setError('Erro ao carregar a imagem')
          reject(new Error('Image load error'))
        }

        img.src = URL.createObjectURL(file)
      })
    } catch (err) {
      console.error('Processing error:', err)
      setError('Erro ao processar a imagem')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await processImage(file)
    }
  }

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleGallerySelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture')
      fileInputRef.current.click()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <QrCode className="h-6 w-6 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Escanear QR Code</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-slate-400 text-sm text-center">
            Tire uma foto ou selecione uma imagem do QR code do pallet
          </p>

          <div className="grid grid-cols-1 gap-3">
            {/* Camera Button */}
            <button
              onClick={handleCameraCapture}
              disabled={isProcessing}
              className="w-full p-4 bg-blue-600/80 text-white border border-blue-500/50 rounded-lg hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <Camera className="h-5 w-5" />
              <span className="font-medium">Tirar Foto do QR Code</span>
            </button>

            {/* Gallery Button */}
            <button
              onClick={handleGallerySelect}
              disabled={isProcessing}
              className="w-full p-4 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <Upload className="h-5 w-5" />
              <span className="font-medium">Selecionar da Galeria</span>
            </button>
          </div>

          {isProcessing && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                <p className="text-blue-400 text-sm">Processando imagem...</p>
              </div>
            </div>
          )}

          <div className="bg-slate-700/30 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2 text-sm">Dicas para melhor resultado:</h4>
            <ul className="text-slate-400 text-xs space-y-1">
              <li>• Mantenha o QR code bem enquadrado</li>
              <li>• Certifique-se de que há boa iluminação</li>
              <li>• Evite reflexos ou sombras no código</li>
              <li>• Mantenha a câmera estável</li>
            </ul>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  )
}
