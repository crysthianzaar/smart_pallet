'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppLayout } from '../../components/layout/AppLayout'
import { 
  Plus, 
  Search, 
  FileText, 
  Truck,
  Eye,
  Download,
  Edit,
  Trash2,
  Calendar,
  Package,
  CheckCircle,
  Clock,
  User,
  AlertTriangle
} from 'lucide-react'

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

export default function ManifestsPage() {
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingManifest, setDeletingManifest] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchManifests();
  }, []);

  const fetchManifests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/manifests');
      if (!response.ok) throw new Error('Failed to fetch manifests');
      const data = await response.json();
      setManifests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteManifest = async (manifestId: string) => {
    try {
      setDeletingManifest(manifestId);
      const response = await fetch(`/api/manifests?id=${manifestId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete manifest');
      }
      
      // Remove o manifesto da lista local
      setManifests(manifests.filter(m => m.id !== manifestId));
      setShowDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDeletingManifest(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      rascunho: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      carregado: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      em_transito: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      entregue: 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      rascunho: 'Rascunho',
      carregado: 'Carregado',
      em_transito: 'Em Trânsito',
      entregue: 'Entregue'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      rascunho: FileText,
      carregado: Package,
      em_transito: Truck,
      entregue: CheckCircle
    };
    const Icon = icons[status as keyof typeof icons] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const filteredManifests = manifests.filter(manifest => {
    const matchesSearch = manifest.manifest_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manifest.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manifest.vehicle_plate.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || manifest.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <AppLayout title="Manifestos" subtitle="Gerenciar manifestos de carga">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Carregando...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Manifestos (Saídas)" 
      subtitle="Gerenciar manifestos de carga"
      headerActions={
        <>
          {/* Mobile Layout */}
          <div className="flex flex-col gap-2 w-full sm:hidden">
            {/* Search Row */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar manifestos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-sm"
              />
            </div>
            
            {/* Filter and Button Row */}
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-sm"
              >
                <option value="all">Todos</option>
                <option value="rascunho">Rascunho</option>
                <option value="carregado">Carregado</option>
                <option value="em_transito">Trânsito</option>
                <option value="entregue">Entregue</option>
              </select>
              
              <Link
                href="/manifests/new"
                className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-400 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-500 transition-all duration-200 text-sm whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-1" />
                Novo
              </Link>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar manifestos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-sm"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-sm"
            >
              <option value="all">Todos os Status</option>
              <option value="rascunho">Rascunho</option>
              <option value="carregado">Carregado</option>
              <option value="em_transito">Em Trânsito</option>
              <option value="entregue">Entregue</option>
            </select>
            
            <Link
              href="/manifests/new"
              className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-400 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-500 transition-all duration-200 text-sm whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Manifesto
            </Link>
          </div>
        </>
      }
    >
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Manifestos Grid */}
      <div className="grid gap-4 sm:gap-6">
        {filteredManifests.map((manifest) => (
          <div
            key={manifest.id}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 sm:p-6 hover:bg-slate-800/70 transition-all duration-300"
          >
            <div className="flex flex-col">
              {/* Header com ID e Status */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileText className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <h3 className="text-lg font-bold text-white truncate">{manifest.manifest_number}</h3>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full border self-start sm:self-center ${getStatusColor(manifest.status)}`}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(manifest.status)}
                    {getStatusLabel(manifest.status)}
                  </div>
                </span>
              </div>
              
              {/* Informações principais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm text-slate-400 mb-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{manifest.driver_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{manifest.vehicle_plate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>{new Date(manifest.created_at).toLocaleDateString()}</span>
                </div>
                {manifest.loaded_at && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span className="text-xs">Carregado: {new Date(manifest.loaded_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-700/50 pt-4 mt-4">
                <div className="flex flex-col gap-3">
                  <span className="text-xs text-slate-500">
                    Criado por {manifest.created_by} em {new Date(manifest.created_at).toLocaleDateString()}
                  </span>
                  
                  {/* Botões de ação principais */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Link href={`/manifests/${manifest.id}`} className="w-full sm:w-auto">
                      <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-all duration-200 text-sm font-medium">
                        <Eye className="h-4 w-4" />
                        Ver Detalhes
                      </button>
                    </Link>
                    
                    {manifest.status === 'rascunho' && (
                      <>
                        <Link href={`/manifests/${manifest.id}/edit`} className="w-full sm:w-auto">
                          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-lg transition-all duration-200 text-sm font-medium">
                            <Edit className="h-4 w-4" />
                            Editar Manifesto
                          </button>
                        </Link>
                        
                        <button 
                          onClick={() => setShowDeleteConfirm(manifest.id)}
                          disabled={deletingManifest === manifest.id}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingManifest === manifest.id ? 'Excluindo...' : 'Excluir Manifesto'}
                        </button>
                      </>
                    )}
                    
                    {manifest.pdf_path && (
                      <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg transition-all duration-200 text-sm font-medium">
                        <Download className="h-4 w-4" />
                        Baixar PDF
                      </button>
                    )}
                  </div>
                  
                  {manifest.status !== 'rascunho' && (
                    <div className="text-xs text-slate-500 text-center py-2 mt-2">
                      Manifesto {getStatusLabel(manifest.status).toLowerCase()} - ações limitadas
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {filteredManifests.length === 0 && !searchTerm && statusFilter === 'all' && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">Nenhum manifesto cadastrado</p>
            <Link
              href="/manifests/new"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-400 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-500 transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar primeiro manifesto
            </Link>
          </div>
        )}
        
        {filteredManifests.length === 0 && (searchTerm || statusFilter !== 'all') && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Nenhum manifesto encontrado com os filtros aplicados</p>
          </div>
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Confirmar Exclusão</h3>
                <p className="text-sm text-slate-400">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            
            <p className="text-slate-300 mb-6">
              Tem certeza que deseja excluir o manifesto <span className="font-mono text-blue-400">{showDeleteConfirm}</span>?
              <br />
              <span className="text-sm text-slate-400 mt-2 block">
                Todos os dados relacionados ao manifesto serão removidos permanentemente.
              </span>
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteManifest(showDeleteConfirm)}
                disabled={deletingManifest === showDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingManifest === showDeleteConfirm ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
