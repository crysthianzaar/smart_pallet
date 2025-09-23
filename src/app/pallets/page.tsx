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
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  FileText,
  Tag,
  Camera
} from 'lucide-react'

interface Pallet {
  id: string;
  qr_tag_id: string;
  contract_id: string;
  contract_name?: string;
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

  useEffect(() => {
    fetchPallets();
  }, []);

  const fetchPallets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pallets');
      if (!response.ok) throw new Error('Failed to fetch pallets');
      const data = await response.json();
      setPallets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
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
                         pallet.qr_tag_id.toLowerCase().includes(searchTerm.toLowerCase());
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
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar paletes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
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
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-500 transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Pallet
          </Link>
        </div>
      }
    >
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Pallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPallets.map((pallet) => (
          <div 
            key={pallet.id}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden shadow-lg hover:border-blue-500/50 transition-all duration-300"
          >
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-medium text-white">{pallet.id}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <QrCode className="h-4 w-4" />
                    <span>{pallet.qr_tag_id}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(pallet.status)} border`}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(pallet.status)}
                    <span>{getStatusLabel(pallet.status)}</span>
                  </div>
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500">Origem</p>
                  <p className="text-sm text-slate-300">{pallet.origin_name || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Contrato</p>
                  <p className="text-sm text-slate-300">{pallet.contract_name || pallet.contract_id}</p>
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
              
              <div className="border-t border-slate-700/50 pt-3 mt-1 flex justify-between">
                <span className="text-xs text-slate-500">
                  Criado: {new Date(pallet.created_at).toLocaleDateString()}
                </span>
                <div className="flex gap-1">
                  <Link href={`/pallets/${pallet.id}`}>
                    <button className="p-1 rounded hover:bg-slate-700/50 transition-colors">
                      <Eye className="h-4 w-4 text-slate-400 hover:text-white" />
                    </button>
                  </Link>
                  
                  {pallet.status === 'ativo' && (
                    <Link href={`/pallets/${pallet.id}/edit`}>
                      <button className="p-1 rounded hover:bg-slate-700/50 transition-colors">
                        <Edit className="h-4 w-4 text-slate-400 hover:text-white" />
                      </button>
                    </Link>
                  )}
                  
                  {pallet.status === 'ativo' && (
                    <Link href={`/manifests/new?pallet=${pallet.id}`}>
                      <button className="p-1 rounded hover:bg-slate-700/50 transition-colors" title="Adicionar ao manifesto">
                        <FileText className="h-4 w-4 text-slate-400 hover:text-white" />
                      </button>
                    </Link>
                  )}
                  
                  <button className="p-1 rounded hover:bg-slate-700/50 transition-colors">
                    <MoreHorizontal className="h-4 w-4 text-slate-400 hover:text-white" />
                  </button>
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
    </AppLayout>
  )
}
