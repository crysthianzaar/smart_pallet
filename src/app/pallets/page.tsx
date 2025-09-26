'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppLayout } from '../../components/layout/AppLayout'
import { 
  Plus, 
  Search, 
  Package, 
  QrCode,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  FileText,
  Tag,
  Camera,
  ExternalLink
} from 'lucide-react'

interface Pallet {
  id: string;
  qr_tag_id: string;
  qr_code?: string; // Adicionado campo para o código legível do QR
  contract_id: string;
  contract_name?: string;
  contract_company?: string; // Adicionado campo para a empresa do contrato
  origin_location_id: string;
  origin_name?: string;
  destination_location_id?: string;
  destination_name?: string;
  // Status atualizado conforme requisitos
  status: 'ativo' | 'em_manifesto' | 'em_transito' | 'recebido' | 'finalizado';
  ai_confidence?: number;
  requires_manual_review: boolean;
  photos_count?: number;
  items_count?: number;
  manifest_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function PalletsPage() {
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingPallet, setDeletingPallet] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchPallets();
  }, []);

  const fetchPallets = async () => {
    try {
      setLoading(true);
      // Buscar pallets com informações completas (incluindo QR codes e nomes de contratos)
      const response = await fetch('/api/pallets?withDetails=true');
      if (!response.ok) throw new Error('Failed to fetch pallets');
      const data = await response.json();
      console.log('Pallets com detalhes:', data);
      setPallets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePallet = async (palletId: string) => {
    try {
      setDeletingPallet(palletId);
      const response = await fetch(`/api/pallets?id=${palletId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete pallet');
      }
      
      // Remove o pallet da lista local
      setPallets(pallets.filter(p => p.id !== palletId));
      setShowDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDeletingPallet(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ativo: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      em_manifesto: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      em_transito: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      recebido: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      finalizado: 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      ativo: 'Ativo',
      em_manifesto: 'Em Manifesto',
      em_transito: 'Em Trânsito',
      recebido: 'Recebido',
      finalizado: 'Finalizado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      ativo: Package,
      em_manifesto: FileText,
      em_transito: Truck,
      recebido: CheckCircle,
      finalizado: Tag
    };
    const Icon = icons[status as keyof typeof icons] || Package;
    return <Icon className="h-4 w-4" />;
  };

  const filteredPallets = pallets.filter(pallet => {
    const matchesSearch = pallet.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pallet.qr_tag_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (pallet.qr_code && pallet.qr_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (pallet.contract_name && pallet.contract_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || pallet.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <AppLayout title="Pallets" subtitle="Gerenciar pallets do sistema">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Carregando...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Paletes" 
      subtitle="Gerenciar paletes do sistema"
      headerActions={
        <>
          {/* Mobile Layout */}
          <div className="flex flex-col gap-2 w-full sm:hidden">
            {/* Search Row */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar paletes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm"
              />
            </div>
            
            {/* Filter and Button Row */}
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm"
              >
                <option value="all">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="em_manifesto">Manifesto</option>
                <option value="em_transito">Trânsito</option>
                <option value="recebido">Recebido</option>
                <option value="finalizado">Finalizado</option>
              </select>
              
              <Link
                href="/pallets/new"
                className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-500 transition-all duration-200 text-sm whitespace-nowrap"
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
                placeholder="Buscar paletes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm"
            >
              <option value="all">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="em_manifesto">Em Manifesto</option>
              <option value="em_transito">Em Trânsito</option>
              <option value="recebido">Recebido</option>
              <option value="finalizado">Finalizado</option>
            </select>
            
            <Link
              href="/pallets/new"
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-500 transition-all duration-200 text-sm whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Pallet
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

      {/* Pallets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredPallets.map((pallet) => (
          <div 
            key={pallet.id}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden shadow-lg hover:border-blue-500/50 transition-all duration-300"
          >
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2 mb-3">
                {pallet.id.startsWith('CTX-') ? (
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="bg-blue-500/30 text-blue-300 px-2 py-1 rounded-md font-mono text-xs sm:text-sm flex-shrink-0">CTX</span>
                    <span className="font-mono text-sm sm:text-base truncate">{pallet.id.replace('CTX-', '')}</span>
                  </div>
                ) : (
                  <span className="truncate text-sm sm:text-base">{pallet.id}</span>
                )}
              </h3>
              
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="flex items-center gap-1 mr-2">
                  {getStatusIcon(pallet.status)}
                  <span className="text-sm text-slate-300">{getStatusLabel(pallet.status)}</span>
                </div>
                
                {pallet.qr_code && (
                  <div className="flex items-center gap-1">
                    <QrCode className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-mono bg-slate-700/50 px-2 py-1 rounded text-cyan-300">
                      {pallet.qr_code}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500">Origem</p>
                  <p className="text-sm text-slate-300">{pallet.origin_name || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Contrato</p>
                  <p className="text-sm text-slate-300">
                    {pallet.contract_name ? (
                      <span className="font-medium">{pallet.contract_name}</span>
                    ) : (
                      <span className="text-slate-500 text-xs">{pallet.contract_id.substring(0, 8)}...</span>
                    )}
                    {pallet.contract_company && (
                      <span className="block text-xs text-slate-400">{pallet.contract_company}</span>
                    )}
                  </p>
                </div>
                {pallet.manifest_id && (
                  <div>
                    <p className="text-xs text-slate-500">Manifesto</p>
                    <p className="text-sm text-slate-300">{pallet.manifest_id}</p>
                  </div>
                )}
                {pallet.destination_name && (
                  <div>
                    <p className="text-xs text-slate-500">Destino</p>
                    <p className="text-sm text-slate-300">{pallet.destination_name}</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {pallet.items_count !== undefined && (
                  <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2 py-1 text-xs rounded-full flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {pallet.items_count} itens
                  </div>
                )}
                {pallet.photos_count !== undefined && (
                  <div className="bg-purple-500/10 border border-purple-500/30 text-purple-400 px-2 py-1 text-xs rounded-full flex items-center gap-1">
                    <Camera className="h-3 w-3" />
                    {pallet.photos_count} fotos
                  </div>
                )}
                {pallet.requires_manual_review && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-2 py-1 text-xs rounded-full flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Revisão
                  </div>
                )}
                {pallet.ai_confidence !== undefined && (
                  <div className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${pallet.ai_confidence > 75 ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'}`}>
                    IA: {pallet.ai_confidence}%
                  </div>
                )}
              </div>
              
              <div className="border-t border-slate-700/50 pt-4 mt-4">
                <div className="flex flex-col gap-3">
                  <span className="text-xs text-slate-500">
                    Criado: {new Date(pallet.created_at).toLocaleDateString()}
                  </span>
                  
                  {/* Botões de ação principais */}
                  <div className="flex flex-col gap-2">
                    <Link href={`/pallets/${pallet.id}`} className="w-full">
                      <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-all duration-200 text-sm font-medium">
                        <Eye className="h-4 w-4" />
                        Ver Detalhes
                      </button>
                    </Link>
                    
                    {pallet.status === 'ativo' && (
                      <>
                        <Link href={`/pallets/${pallet.id}/edit`} className="w-full">
                          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-lg transition-all duration-200 text-sm font-medium">
                            <Edit className="h-4 w-4" />
                            Editar Pallet
                          </button>
                        </Link>
                        
                        <Link href={`/manifests/new?pallet=${pallet.id}`} className="w-full">
                          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 rounded-lg transition-all duration-200 text-sm font-medium">
                            <FileText className="h-4 w-4" />
                            Adicionar ao Manifesto
                          </button>
                        </Link>
                        
                        <button 
                          onClick={() => setShowDeleteConfirm(pallet.id)}
                          disabled={deletingPallet === pallet.id}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingPallet === pallet.id ? 'Excluindo...' : 'Excluir Pallet'}
                        </button>
                      </>
                    )}
                    
                    {pallet.status !== 'ativo' && (
                      <div className="text-xs text-slate-500 text-center py-2">
                        Pallet {getStatusLabel(pallet.status).toLowerCase()} - ações limitadas
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {filteredPallets.length === 0 && !searchTerm && statusFilter === 'all' && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">Nenhum pallet cadastrado</p>
            <Link
              href="/pallets/new"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-500 transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar primeiro pallet
            </Link>
          </div>
        )}
        
        {filteredPallets.length === 0 && (searchTerm || statusFilter !== 'all') && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Nenhum pallet encontrado com os filtros aplicados</p>
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
              Tem certeza que deseja excluir o pallet <span className="font-mono text-blue-400">{showDeleteConfirm}</span>?
              <br />
              <span className="text-sm text-slate-400 mt-2 block">
                O QR tag será automaticamente liberado para uso em outros pallets.
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
                onClick={() => handleDeletePallet(showDeleteConfirm)}
                disabled={deletingPallet === showDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingPallet === showDeleteConfirm ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
