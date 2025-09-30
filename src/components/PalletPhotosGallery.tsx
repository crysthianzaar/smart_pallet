'use client'

import { useState } from 'react'
import { Camera, X, ZoomIn } from 'lucide-react'

interface PalletPhoto {
  id: string;
  photo_type: 'frontal' | 'lateral' | 'superior';
  stage: 'origem' | 'destino';
  file_path: string;
  uploaded_at?: string;
  created_at?: string;
}

interface PalletPhotosGalleryProps {
  photos: PalletPhoto[];
  palletId: string;
}

export function PalletPhotosGallery({ photos, palletId }: PalletPhotosGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PalletPhoto | null>(null)

  const getPhotoTypeLabel = (type: string) => {
    const labels = {
      frontal: 'Frontal',
      lateral: 'Lateral',
      superior: 'Superior'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getStageLabel = (stage: string) => {
    const labels = {
      origem: 'Origem',
      destino: 'Destino'
    }
    return labels[stage as keyof typeof labels] || stage
  }

  const getPhotoTypeColor = (type: string) => {
    const colors = {
      frontal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      lateral: 'bg-green-500/20 text-green-400 border-green-500/30',
      superior: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  const getStageColor = (stage: string) => {
    const colors = {
      origem: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      destino: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    }
    return colors[stage as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <Camera className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">Nenhuma foto encontrada para este pallet</p>
        <p className="text-slate-500 text-sm mt-2">
          As fotos são capturadas durante o processo de criação do pallet
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map((photo) => (
          <div key={photo.id} className="bg-slate-700/30 border border-slate-600/50 rounded-lg overflow-hidden">
            <div className="aspect-video bg-slate-800/50 relative group cursor-pointer"
                 onClick={() => setSelectedPhoto(photo)}>
              <img
                src={photo.file_path}
                alt={`${getPhotoTypeLabel(photo.photo_type)} - ${getStageLabel(photo.stage)}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder-image.png' // Fallback image
                }}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ZoomIn className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getPhotoTypeColor(photo.photo_type)}`}>
                  {getPhotoTypeLabel(photo.photo_type)}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getStageColor(photo.stage)}`}>
                  {getStageLabel(photo.stage)}
                </span>
              </div>
              
              {(photo.uploaded_at || photo.created_at) && (
                <p className="text-xs text-slate-400">
                  {new Date(photo.uploaded_at || photo.created_at!).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal para visualizar foto em tamanho maior */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            
            <img
              src={selectedPhoto.file_path}
              alt={`${getPhotoTypeLabel(selectedPhoto.photo_type)} - ${getStageLabel(selectedPhoto.stage)}`}
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/placeholder-image.png' // Fallback image
              }}
            />
            
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4 rounded-b-lg">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getPhotoTypeColor(selectedPhoto.photo_type)}`}>
                  {getPhotoTypeLabel(selectedPhoto.photo_type)}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getStageColor(selectedPhoto.stage)}`}>
                  {getStageLabel(selectedPhoto.stage)}
                </span>
              </div>
              {(selectedPhoto.uploaded_at || selectedPhoto.created_at) && (
                <p className="text-sm text-gray-300">
                  Capturada em: {new Date(selectedPhoto.uploaded_at || selectedPhoto.created_at!).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
