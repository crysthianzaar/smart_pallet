'use client'

import React from 'react'
import { Camera, Upload, X, CheckCircle } from 'lucide-react'

interface PhotoView {
  title: string
  description: string
  icon: string
  required: boolean
}

interface PalletPhoto {
  id: string
  file: File | null
  preview: string
  uploaded: boolean
}

interface MobilePhotoCaptureProps {
  photos: PalletPhoto[]
  photoViews: PhotoView[]
  onPhotoCapture: (photoId: string, file: File) => void
  onRemovePhoto: (photoId: string) => void
}

export function MobilePhotoCapture({ 
  photos, 
  photoViews, 
  onPhotoCapture, 
  onRemovePhoto 
}: MobilePhotoCaptureProps) {
  return (
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
                    onClick={() => onRemovePhoto(photo.id)}
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
                
                {/* Mobile: Two buttons side by side */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {/* Camera Capture Button */}
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          onPhotoCapture(photo.id, file)
                        }
                      }}
                      className="hidden"
                    />
                    <span className="w-full px-3 py-2 bg-blue-600/80 text-white border border-blue-500/50 rounded-lg hover:bg-blue-600 transition-all duration-200 cursor-pointer inline-flex items-center justify-center text-sm font-medium">
                      <Camera className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Tirar Foto</span>
                      <span className="sm:hidden">Câmera</span>
                    </span>
                  </label>

                  {/* Gallery Upload Button */}
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          onPhotoCapture(photo.id, file)
                        }
                      }}
                      className="hidden"
                    />
                    <span className="w-full px-3 py-2 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-all duration-200 cursor-pointer inline-flex items-center justify-center text-sm font-medium">
                      <Upload className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Da Galeria</span>
                      <span className="sm:hidden">Galeria</span>
                    </span>
                  </label>
                </div>
                
                {/* Help text for mobile */}
                <p className="text-xs text-slate-500 text-center sm:hidden">
                  Use a câmera ou selecione da galeria
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
