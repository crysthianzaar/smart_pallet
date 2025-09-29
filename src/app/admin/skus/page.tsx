'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '../../../components/layout/AppLayout'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Tag,
  Package,
  Search,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface Sku {
  id: string;
  code: string;
  name: string;
  description?: string;
  unit: string;
  weight?: number;
  dimensions?: string;
  unit_price?: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export default function SkusPage() {
  const [skus, setSkus] = useState<Sku[]>([]);
  const [filteredSkus, setFilteredSkus] = useState<Sku[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSku, setEditingSku] = useState<Sku | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    unit: 'un',
    weight: '',
    dimensions: '',
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    fetchSkus();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = skus.filter(sku => 
        sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sku.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sku.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSkus(filtered);
    } else {
      setFilteredSkus(skus);
    }
  }, [searchTerm, skus]);

  const fetchSkus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/skus');
      if (!response.ok) throw new Error('Failed to fetch SKUs');
      const data = await response.json();
      setSkus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingSku ? `/api/skus/${editingSku.id}` : '/api/skus';
      const method = editingSku ? 'PUT' : 'POST';
      
      const submitData = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : undefined
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save SKU');
      }

      await fetchSkus();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save SKU');
    }
  };

  const handleEdit = (sku: Sku) => {
    setEditingSku(sku);
    setFormData({
      code: sku.code,
      name: sku.name,
      description: sku.description || '',
      unit: sku.unit,
      weight: sku.weight?.toString() || '',
      dimensions: sku.dimensions || '',
      status: sku.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este SKU?')) return;
    
    try {
      const response = await fetch(`/api/skus/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete SKU');
      }

      await fetchSkus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete SKU');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      unit: 'un',
      weight: '',
      dimensions: '',
      status: 'active'
    });
    setEditingSku(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <AppLayout title="SKUs" subtitle="Gerenciar catálogo de produtos">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Carregando...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="SKUs" 
      subtitle="Gerenciar catálogo de produtos"
      headerActions={
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar SKUs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-400 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-500 transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo SKU
          </button>
        </div>
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
              {editingSku ? 'Editar SKU' : 'Novo SKU'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Código do SKU
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome do Produto
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Unidade
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    required
                  >
                    <option value="un">Unidade</option>
                    <option value="kg">Quilograma</option>
                    <option value="g">Grama</option>
                    <option value="l">Litro</option>
                    <option value="ml">Mililitro</option>
                    <option value="m">Metro</option>
                    <option value="cm">Centímetro</option>
                    <option value="cx">Caixa</option>
                    <option value="pc">Peça</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Dimensões
                </label>
                <input
                  type="text"
                  placeholder="Ex: 10x20x30 cm"
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
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
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-400 text-white rounded-lg hover:from-purple-600 hover:to-pink-500 transition-all duration-200"
                >
                  {editingSku ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SKUs List */}
      <div className="grid gap-4">
        {filteredSkus.map((sku) => (
          <div
            key={sku.id}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Tag className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-white">{sku.name}</h3>
                  <span className="px-2 py-1 text-xs font-medium bg-slate-600 text-slate-300 rounded-full">
                    {sku.code}
                  </span>
                  <div className="flex items-center gap-1">
                    {sku.status === 'active' ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className={`text-xs font-medium ${
                      sku.status === 'active' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {sku.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                
                {sku.description && (
                  <p className="text-slate-300 mb-3">{sku.description}</p>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {sku.unit}
                  </div>
                  {sku.weight && (
                    <div>Peso: {sku.weight}kg</div>
                  )}
                  {sku.dimensions && (
                    <div>Dimensões: {sku.dimensions}</div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(sku)}
                  className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-500/20 rounded-lg transition-all duration-200"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(sku.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {filteredSkus.length === 0 && !searchTerm && (
          <div className="text-center py-12">
            <Tag className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Nenhum SKU cadastrado</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-400 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-500 transition-all duration-200"
            >
              Criar primeiro SKU
            </button>
          </div>
        )}
        
        {filteredSkus.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Nenhum SKU encontrado para &quot;{searchTerm}&quot;</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
