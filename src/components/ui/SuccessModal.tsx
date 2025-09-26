'use client'

import { useEffect } from 'react'
import { CheckCircle, X } from 'lucide-react'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  details?: string
  primaryAction?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  autoCloseDelay?: number
}

export function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  details,
  primaryAction,
  secondaryAction,
  autoCloseDelay = 0
}: SuccessModalProps) {
  useEffect(() => {
    if (isOpen && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, autoCloseDelay)
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoCloseDelay, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-slate-800 border border-green-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl shadow-green-500/20 animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="text-center">
          
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 mb-4 animate-pulse">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          
          {/* Success Message */}
          <h3 className="text-xl font-bold text-white mb-2">
            {title}
          </h3>
          
          <p className="text-slate-300 mb-4">
            {message}
          </p>
          
          {/* Details */}
          {details && (
            <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-slate-400 mb-1">Detalhes:</p>
              <p className="font-mono text-green-400 text-sm break-all">{details}</p>
            </div>
          )}
          
          {/* Auto Close Info */}
          {autoCloseDelay > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
              <p className="text-blue-400 text-sm">
                ⏱️ Fechando automaticamente em {Math.ceil(autoCloseDelay / 1000)} segundos...
              </p>
            </div>
          )}
          
          {/* Action Buttons */}
          {(primaryAction || secondaryAction) && (
            <div className="flex gap-3">
              {primaryAction && (
                <button
                  onClick={primaryAction.onClick}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-500 transition-all duration-200 transform hover:scale-105"
                >
                  {primaryAction.label}
                </button>
              )}
              
              {secondaryAction && (
                <button
                  onClick={secondaryAction.onClick}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors transform hover:scale-105"
                >
                  {secondaryAction.label}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
