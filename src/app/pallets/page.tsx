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
  Truck
} from 'lucide-react'

interface Pallet {
  id: string;
  qr_tag_id: string;
  contract_id: string;
  origin_location_id: string;
  destination_location_id?: string;
  status: 'rascunho' | 'selado' | 'em_transporte' | 'recebido' | 'cancelado';
  ai_confidence?: number;
  requires_manual_review: boolean;
  sealed_at?: string;
  sealed_by?: string;
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
      rascunho: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      selado: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      em_transporte: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      recebido: 'bg-green-500/20 text-green-400 border-green-500/30',
      cancelado: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      rascunho: 'Rascunho',
      selado: 'Selado',
      em_transporte: 'Em Trânsito',
      recebido: 'Recebido',
      cancelado: 'Cancelado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      rascunho: Edit,
      selado: Package,
      em_transporte: Truck,
      recebido: CheckCircle,
      cancelado: AlertTriangle
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
      title="Pallets" 
      subtitle="Gerenciar pallets do sistema"
      headerActions={
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar pallets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todos os Status</option>
            <option value="rascunho">Rascunho</option>
            <option value="selado">Selado</option>
            <option value="em_transporte">Em Trânsito</option>
            <option value="recebido">Recebido</option>
            <option value="cancelado">Cancelado</option>
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
      <div className="grid gap-6">
        {filteredPallets.map((pallet) => (
          <div
            key={pallet.id}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Package className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">{pallet.id}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(pallet.status)}`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(pallet.status)}
                      {getStatusLabel(pallet.status)}
                    </div>
                  </span>
                  {pallet.requires_manual_review && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Revisão Manual
                      </div>
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-400 mb-4">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    <span>QR: {pallet.qr_tag_id}</span>
                  </div>
                  {pallet.ai_confidence && (
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span>IA: {pallet.ai_confidence}%</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(pallet.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {pallet.sealed_at && (
                  <div className="text-xs text-slate-500">
                    Selado em {new Date(pallet.sealed_at).toLocaleString()}
                    {pallet.sealed_by && ` por ${pallet.sealed_by}`}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Link
                  href={`/pallets/${pallet.id}`}
                  className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all duration-200"
                >
                  <Eye className="h-4 w-4" />
                </Link>
                {pallet.status === 'rascunho' && (
                  <Link
                    href={`/pallets/${pallet.id}/edit`}
                    className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/20 rounded-lg transition-all duration-200"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                )}
                <button className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-600/50 rounded-lg transition-all duration-200">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
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
