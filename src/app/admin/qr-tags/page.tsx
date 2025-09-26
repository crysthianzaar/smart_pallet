'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '../../../components/layout/AppLayout'
import { 
  Plus, 
  QrCode, 
  Search,
  Download,
  CheckCircle,
  XCircle,
  Package
} from 'lucide-react'

interface QrTag {
  id: string;
  qr_code: string;
  status: 'livre' | 'vinculado';
  current_pallet_id?: string;
  created_at: string;
  updated_at: string;
}

interface QrTagStats {
  total: number;
  available: number;
  linked: number;
  utilization: number;
}

export default function QrTagsPage() {
  const [qrTags, setQrTags] = useState<QrTag[]>([]);
  const [filteredQrTags, setFilteredQrTags] = useState<QrTag[]>([]);
  const [stats, setStats] = useState<QrTagStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'livre' | 'vinculado'>('all');

  const [bulkFormData, setBulkFormData] = useState({
    prefix: 'QR',
    startNumber: 1,
    quantity: 10
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = qrTags;
    
    if (searchTerm) {
      filtered = filtered.filter(tag => 
        tag.qr_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tag => tag.status === statusFilter);
    }
    
    setFilteredQrTags(filtered);
  }, [searchTerm, statusFilter, qrTags]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qrTagsRes, statsRes] = await Promise.all([
        fetch('/api/qr-tags'),
        fetch('/api/qr-tags/stats')
      ]);
      
      if (!qrTagsRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const [qrTagsData, statsData] = await Promise.all([
        qrTagsRes.json(),
        statsRes.json()
      ]);
      
      setQrTags(qrTagsData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const qrTags = [];
      for (let i = 0; i < bulkFormData.quantity; i++) {
        const number = bulkFormData.startNumber + i;
        const qrCode = `${bulkFormData.prefix}${number.toString().padStart(6, '0')}`;
        qrTags.push({ qr_code: qrCode });
      }
      
      const response = await fetch('/api/qr-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(qrTags),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create QR tags');
      }

      await fetchData();
      setShowBulkForm(false);
      setBulkFormData({ prefix: 'QR', startNumber: 1, quantity: 10 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create QR tags');
    }
  };

  const exportQrTags = () => {
    const csvContent = [
      ['QR Code', 'Status', 'Pallet ID', 'Created At'].join(','),
      ...filteredQrTags.map(tag => [
        tag.qr_code,
        tag.status,
        tag.current_pallet_id || '',
        new Date(tag.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-tags-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AppLayout title="QR Tags" subtitle="Gerenciar pool de códigos QR">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Carregando...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="QR Tags" 
      subtitle="Gerenciar pool de códigos QR"
      headerActions={
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar QR code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'livre' | 'vinculado')}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
          >
            <option value="all">Todos</option>
            <option value="livre">Livres</option>
            <option value="vinculado">Vinculados</option>
          </select>
          <button
            onClick={exportQrTags}
            className="flex items-center px-4 py-2 bg-slate-600 text-white font-medium rounded-lg hover:bg-slate-500 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
          <button
            onClick={() => setShowBulkForm(true)}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-red-400 text-white font-medium rounded-lg hover:from-orange-600 hover:to-red-500 transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar em Lote
          </button>
        </div>
      }
    >
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-300">Total</h3>
              <QrCode className="h-5 w-5 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-300">Disponíveis</h3>
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-400">{stats.available}</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-300">Em Uso</h3>
              <Package className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-yellow-400">{stats.linked}</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-300">Utilização</h3>
              <div className="h-5 w-5 rounded-full bg-gradient-to-r from-orange-500 to-red-400"></div>
            </div>
            <div className="text-2xl font-bold text-white">{stats.utilization}%</div>
          </div>
        </div>
      )}

      {/* Bulk Create Form Modal */}
      {showBulkForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Criar QR Tags em Lote</h3>
            
            <form onSubmit={handleBulkCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Prefixo
                </label>
                <input
                  type="text"
                  value={bulkFormData.prefix}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, prefix: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Número Inicial
                </label>
                <input
                  type="number"
                  min="1"
                  value={bulkFormData.startNumber}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, startNumber: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Quantidade
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={bulkFormData.quantity}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, quantity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="bg-slate-700/50 p-3 rounded-lg">
                <p className="text-sm text-slate-300 mb-2">Preview:</p>
                <div className="flex gap-2 text-xs text-slate-400">
                  <span>{bulkFormData.prefix}{bulkFormData.startNumber.toString().padStart(6, '0')}</span>
                  <span>...</span>
                  <span>{bulkFormData.prefix}{(bulkFormData.startNumber + bulkFormData.quantity - 1).toString().padStart(6, '0')}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBulkForm(false)}
                  className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-400 text-white rounded-lg hover:from-orange-600 hover:to-red-500 transition-all duration-200"
                >
                  Criar {bulkFormData.quantity} Tags
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Tags List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredQrTags.map((qrTag) => (
          <div
            key={qrTag.id}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <QrCode className="h-5 w-5 text-orange-400" />
              <div className="flex items-center gap-1">
                {qrTag.status === 'livre' ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-yellow-400" />
                )}
                <span className={`text-xs font-medium ${
                  qrTag.status === 'livre' ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {qrTag.status === 'livre' ? 'Livre' : 'Vinculado'}
                </span>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2">{qrTag.qr_code}</h3>
            
            {qrTag.current_pallet_id && (
              <div className="text-sm text-slate-400">
                Pallet: {qrTag.current_pallet_id}
              </div>
            )}
            
            <div className="text-xs text-slate-500 mt-2">
              Criado em {new Date(qrTag.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
        
        {filteredQrTags.length === 0 && !searchTerm && statusFilter === 'all' && (
          <div className="col-span-full text-center py-12">
            <QrCode className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Nenhuma QR tag cadastrada</p>
            <button
              onClick={() => setShowBulkForm(true)}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-400 text-white font-medium rounded-lg hover:from-orange-600 hover:to-red-500 transition-all duration-200"
            >
              Criar primeiras QR tags
            </button>
          </div>
        )}
        
        {filteredQrTags.length === 0 && (searchTerm || statusFilter !== 'all') && (
          <div className="col-span-full text-center py-12">
            <Search className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Nenhuma QR tag encontrada com os filtros aplicados</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
