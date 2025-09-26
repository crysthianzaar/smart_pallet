'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { AppLayout } from '../../../../components/layout/AppLayout'
import { 
  ArrowLeft, 
  Save, 
  Package, 
  MapPin, 
  Building2, 
  AlertTriangle,
  Loader2,
  CheckCircle
} from 'lucide-react'

interface Contract {
  id: string;
  name: string;
  company: string;
}

interface Location {
  id: string;
  name: string;
  type: 'origem' | 'destino' | 'estoque';
}

interface Pallet {
  id: string;
  qr_tag_id: string;
  contract_id: string;
  origin_location_id: string;
  destination_location_id?: string;
  status: 'ativo' | 'em_manifesto' | 'em_transito' | 'recebido' | 'finalizado';
  ai_confidence?: number;
  requires_manual_review: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface FormData {
  contract_id: string;
  origin_location_id: string;
  destination_location_id: string;
  requires_manual_review: boolean;
}

export default function EditPalletPage() {
  const router = useRouter()
  const params = useParams()
  const palletId = params.id as string

  const [pallet, setPallet] = useState<Pallet | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [formData, setFormData] = useState<FormData>({
    contract_id: '',
    origin_location_id: '',
    destination_location_id: '',
    requires_manual_review: false
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchPalletData()
    fetchContracts()
    fetchLocations()
  }, [palletId])

  const fetchPalletData = async () => {
    try {
      const response = await fetch(`/api/pallets/${palletId}`)
      if (!response.ok) {
        throw new Error('Pallet não encontrado')
      }
      const palletData = await response.json()
      
      // O endpoint pode retornar um objeto com pallet, items, photos ou apenas o pallet
      const pallet = palletData.pallet || palletData
      setPallet(pallet)
      
      // Preencher formulário com dados existentes
      setFormData({
        contract_id: pallet.contract_id,
        origin_location_id: pallet.origin_location_id,
        destination_location_id: pallet.destination_location_id || '',
        requires_manual_review: pallet.requires_manual_review
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pallet')
    }
  }

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/contracts')
      if (response.ok) {
        const data = await response.json()
        setContracts(data)
      }
    } catch (err) {
      console.error('Erro ao carregar contratos:', err)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      }
    } catch (err) {
      console.error('Erro ao carregar localizações:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!pallet) return

    // Verificar se o pallet pode ser editado
    if (pallet.status !== 'ativo') {
      setError('Apenas pallets com status "ativo" podem ser editados')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/pallets/${palletId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar pallet')
      }

      setSuccess(true)
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push(`/pallets/${palletId}`)
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar alterações')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <AppLayout title="Editar Pallet" subtitle="Carregando dados do pallet...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
        </div>
      </AppLayout>
    )
  }

  if (error && !pallet) {
    return (
      <AppLayout title="Erro" subtitle="Não foi possível carregar o pallet">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-400 mb-2">Erro ao carregar pallet</h2>
            <p className="text-red-300 mb-4">{error}</p>
            <Link
              href="/pallets"
              className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Pallets
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (pallet?.status !== 'ativo') {
    return (
      <AppLayout title="Edição Não Permitida" subtitle="Este pallet não pode ser editado">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">Edição não permitida</h2>
            <p className="text-yellow-300 mb-4">
              Apenas pallets com status "ativo" podem ser editados. 
              Este pallet está com status "{pallet?.status}".
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href={`/pallets/${palletId}`}
                className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Ver Detalhes
              </Link>
              <Link
                href="/pallets"
                className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Pallets
              </Link>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout 
      title={`Editar Pallet ${pallet?.id}`} 
      subtitle="Alterar informações do pallet"
      headerActions={
        <Link
          href={`/pallets/${palletId}`}
          className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Link>
      }
    >
      <div className="max-w-2xl mx-auto">
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-green-400 font-medium">Pallet atualizado com sucesso!</p>
              <p className="text-green-300 text-sm">Redirecionando para a página de detalhes...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-400" />
              Informações do Pallet
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  ID do Pallet
                </label>
                <input
                  type="text"
                  value={pallet?.id || ''}
                  disabled
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Status
                </label>
                <input
                  type="text"
                  value={pallet?.status || ''}
                  disabled
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  Contrato *
                </label>
                <select
                  value={formData.contract_id}
                  onChange={(e) => handleInputChange('contract_id', e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                >
                  <option value="">Selecione um contrato</option>
                  {contracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.name} - {contract.company}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Localização de Origem *
                </label>
                <select
                  value={formData.origin_location_id}
                  onChange={(e) => handleInputChange('origin_location_id', e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                >
                  <option value="">Selecione a origem</option>
                  {locations.filter(loc => loc.type === 'origem').map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Localização de Destino
                </label>
                <select
                  value={formData.destination_location_id}
                  onChange={(e) => handleInputChange('destination_location_id', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                >
                  <option value="">Selecione o destino (opcional)</option>
                  {locations.filter(loc => loc.type === 'destino').map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requires_manual_review"
                  checked={formData.requires_manual_review}
                  onChange={(e) => handleInputChange('requires_manual_review', e.target.checked)}
                  className="h-4 w-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="requires_manual_review" className="ml-2 text-sm text-slate-300">
                  Requer revisão manual
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </button>
            
            <Link
              href={`/pallets/${palletId}`}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
