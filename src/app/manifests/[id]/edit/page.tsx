'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { AppLayout } from '../../../../components/layout/AppLayout'
import { 
  ArrowLeft, 
  Save, 
  FileText, 
  MapPin, 
  Building2, 
  Truck,
  User,
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

interface Manifest {
  id: string;
  manifest_number: string;
  contract_id: string;
  origin_location_id: string;
  destination_location_id: string;
  driver_name: string;
  vehicle_plate: string;
  status: 'rascunho' | 'carregado' | 'em_transito' | 'entregue';
  pdf_path?: string;
  loaded_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface FormData {
  contract_id: string;
  origin_location_id: string;
  destination_location_id: string;
  driver_name: string;
  vehicle_plate: string;
}

export default function EditManifestPage() {
  const router = useRouter()
  const params = useParams()
  const manifestId = params.id as string

  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [formData, setFormData] = useState<FormData>({
    contract_id: '',
    origin_location_id: '',
    destination_location_id: '',
    driver_name: '',
    vehicle_plate: ''
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchManifestData()
    fetchContracts()
    fetchLocations()
  }, [manifestId])

  const fetchManifestData = async () => {
    try {
      const response = await fetch(`/api/manifests/${manifestId}`)
      if (!response.ok) {
        throw new Error('Manifesto não encontrado')
      }
      const manifestData = await response.json()
      
      // O endpoint pode retornar um objeto com manifest, pallets ou apenas o manifest
      const manifest = manifestData.manifest || manifestData
      setManifest(manifest)
      
      // Preencher formulário com dados existentes
      setFormData({
        contract_id: manifest.contract_id,
        origin_location_id: manifest.origin_location_id,
        destination_location_id: manifest.destination_location_id,
        driver_name: manifest.driver_name,
        vehicle_plate: manifest.vehicle_plate
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar manifesto')
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
    
    if (!manifest) return

    // Verificar se o manifesto pode ser editado
    if (manifest.status !== 'rascunho') {
      setError('Apenas manifestos com status "rascunho" podem ser editados')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/manifests/${manifestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar manifesto')
      }

      setSuccess(true)
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push(`/manifests/${manifestId}`)
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar alterações')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <AppLayout title="Editar Manifesto" subtitle="Carregando dados do manifesto...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
        </div>
      </AppLayout>
    )
  }

  if (error && !manifest) {
    return (
      <AppLayout title="Erro" subtitle="Não foi possível carregar o manifesto">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-400 mb-2">Erro ao carregar manifesto</h2>
            <p className="text-red-300 mb-4">{error}</p>
            <Link
              href="/manifests"
              className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Manifestos
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (manifest?.status !== 'rascunho') {
    return (
      <AppLayout title="Edição Não Permitida" subtitle="Este manifesto não pode ser editado">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">Edição não permitida</h2>
            <p className="text-yellow-300 mb-4">
              Apenas manifestos com status &quot;rascunho&quot; podem ser editados. 
              Este manifesto está com status &quot;{manifest?.status}&quot;.
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href={`/manifests/${manifestId}`}
                className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Ver Detalhes
              </Link>
              <Link
                href="/manifests"
                className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Manifestos
              </Link>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout 
      title={`Editar Manifesto ${manifest?.manifest_number}`} 
      subtitle="Alterar informações do manifesto"
      headerActions={
        <Link
          href={`/manifests/${manifestId}`}
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
              <p className="text-green-400 font-medium">Manifesto atualizado com sucesso!</p>
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
              <FileText className="h-5 w-5 text-blue-400" />
              Informações do Manifesto
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Número do Manifesto
                </label>
                <input
                  type="text"
                  value={manifest?.manifest_number || ''}
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
                  value={manifest?.status || ''}
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
                  Localização de Destino *
                </label>
                <select
                  value={formData.destination_location_id}
                  onChange={(e) => handleInputChange('destination_location_id', e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                >
                  <option value="">Selecione o destino</option>
                  {locations.filter(loc => loc.type === 'destino').map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  Nome do Motorista *
                </label>
                <input
                  type="text"
                  value={formData.driver_name}
                  onChange={(e) => handleInputChange('driver_name', e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  placeholder="Digite o nome do motorista"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Truck className="h-4 w-4 inline mr-1" />
                  Placa do Veículo *
                </label>
                <input
                  type="text"
                  value={formData.vehicle_plate}
                  onChange={(e) => handleInputChange('vehicle_plate', e.target.value.toUpperCase())}
                  required
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  placeholder="ABC-1234"
                  maxLength={8}
                />
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
              href={`/manifests/${manifestId}`}
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
