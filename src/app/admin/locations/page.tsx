'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '../../../components/layout/AppLayout'
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin,
  Building,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface Location {
  id: string;
  name: string;
  type: 'origem' | 'destino' | 'estoque';
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  contract_id?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface Contract {
  id: string;
  name: string;
  company: string;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'origem' as 'origem' | 'destino' | 'estoque',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    contract_id: '',
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [locationsRes, contractsRes] = await Promise.all([
        fetch('/api/locations'),
        fetch('/api/contracts?status=active')
      ]);
      
      if (!locationsRes.ok || !contractsRes.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const [locationsData, contractsData] = await Promise.all([
        locationsRes.json(),
        contractsRes.json()
      ]);
      
      setLocations(locationsData);
      setContracts(contractsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingLocation ? `/api/locations/${editingLocation.id}` : '/api/locations';
      const method = editingLocation ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save location');

      await fetchData();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save location');
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      type: location.type,
      address: location.address || '',
      city: location.city || '',
      state: location.state || '',
      postal_code: location.postal_code || '',
      contract_id: location.contract_id || '',
      status: location.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este local?')) return;
    
    try {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete location');

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete location');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'origem',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      contract_id: '',
      status: 'active'
    });
    setEditingLocation(null);
    setShowForm(false);
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      origem: 'Origem',
      destino: 'Destino',
      estoque: 'Estoque'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      origem: 'text-blue-400 bg-blue-500/20',
      destino: 'text-green-400 bg-green-500/20',
      estoque: 'text-purple-400 bg-purple-500/20'
    };
    return colors[type as keyof typeof colors] || 'text-gray-400 bg-gray-500/20';
  };

  if (loading) {
    return (
      <AppLayout title="Locais" subtitle="Gerenciar origens, destinos e estoques">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Carregando...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Locais" 
      subtitle="Gerenciar origens, destinos e estoques"
      headerActions={
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-400 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-500 transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Local
        </button>
      }
    >
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingLocation ? 'Editar Local' : 'Novo Local'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome do Local
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'origem' | 'destino' | 'estoque' })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                  required
                >
                  <option value="origem">Origem</option>
                  <option value="destino">Destino</option>
                  <option value="estoque">Estoque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Contrato
                </label>
                <select
                  value={formData.contract_id}
                  onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
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
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Estado
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                    maxLength={2}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  CEP
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-400 text-white rounded-lg hover:from-green-600 hover:to-emerald-500 transition-all duration-200"
                >
                  {editingLocation ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Locations List */}
      <div className="grid gap-6">
        {locations.map((location) => (
          <div
            key={location.id}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="h-5 w-5 text-green-400" />
                  <h3 className="text-lg font-bold text-white">{location.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(location.type)}`}>
                    {getTypeLabel(location.type)}
                  </span>
                  <div className="flex items-center gap-1">
                    {location.status === 'active' ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className={`text-xs font-medium ${
                      location.status === 'active' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {location.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                
                {location.address && (
                  <p className="text-slate-300 mb-2">{location.address}</p>
                )}
                
                {(location.city || location.state || location.postal_code) && (
                  <p className="text-slate-400 text-sm">
                    {[location.city, location.state, location.postal_code].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(location)}
                  className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/20 rounded-lg transition-all duration-200"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(location.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {locations.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Nenhum local cadastrado</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-400 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-500 transition-all duration-200"
            >
              Criar primeiro local
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
