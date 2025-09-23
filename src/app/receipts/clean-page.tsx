'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppLayout } from '../../components/layout/AppLayout'
import { 
  Plus, 
  Search, 
  Package,
  Eye,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  MapPin,
  User,
  Clock,
  MoreHorizontal
} from 'lucide-react'

interface Receipt {
  id: string;
  pallet_id: string;
  manifest_id?: string;
  location_id: string;
  received_by: string;
  ai_confidence?: number;
  status: 'ok' | 'alerta' | 'critico';
  notes?: string;
  received_at: string;
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/receipts');
      if (!response.ok) throw new Error('Failed to fetch receipts');
      const data = await response.json();
      setReceipts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ok: 'bg-green-500/20 text-green-400 border-green-500/30',
      alerta: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      critico: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      ok: 'OK',
      alerta: 'Alerta',
      critico: 'Crítico'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      ok: CheckCircle,
      alerta: AlertTriangle,
      critico: XCircle
    };
    const Icon = icons[status as keyof typeof icons] || CheckCircle;
    return <Icon className="h-4 w-4" />;
  };

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = receipt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.pallet_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.received_by.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || receipt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <AppLayout title="Recebimentos" subtitle="Gerenciar recebimentos de pallets">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Carregando...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Recebimentos" 
      subtitle="Gerenciar recebimentos de pallets"
      headerActions={
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar recebimentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
          >
            <option value="all">Todos os Status</option>
            <option value="ok">OK</option>
            <option value="alerta">Alerta</option>
            <option value="critico">Crítico</option>
          </select>
          <Link
            href="/receipts/new"
            className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-400 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-500 transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Recebimento
          </Link>
        </div>
      }
    >
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Receipts Grid */}
      <div className="grid gap-6">
        {filteredReceipts.map((receipt) => (
          <div
            key={receipt.id}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Package className="h-5 w-5 text-green-400" />
                  <h3 className="text-lg font-bold text-white">{receipt.id}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(receipt.status)}`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(receipt.status)}
                      {getStatusLabel(receipt.status)}
                    </div>
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-400 mb-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span>Pallet: {receipt.pallet_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{receipt.received_by}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(receipt.received_at).toLocaleDateString()}</span>
                  </div>
                  {receipt.ai_confidence && (
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span>IA: {receipt.ai_confidence}%</span>
                    </div>
                  )}
                </div>

                {receipt.notes && (
                  <div className="bg-slate-700/30 rounded-lg p-3 mb-3">
                    <p className="text-sm text-slate-300">{receipt.notes}</p>
                  </div>
                )}

                <div className="text-xs text-slate-500">
                  Recebido em {new Date(receipt.received_at).toLocaleString()}
                  {receipt.manifest_id && ` • Manifesto: ${receipt.manifest_id}`}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Link
                  href={`/receipts/${receipt.id}`}
                  className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/20 rounded-lg transition-all duration-200"
                >
                  <Eye className="h-4 w-4" />
                </Link>
                <button className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-600/50 rounded-lg transition-all duration-200">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {filteredReceipts.length === 0 && !searchTerm && statusFilter === 'all' && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">Nenhum recebimento cadastrado</p>
            <Link
              href="/receipts/new"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-400 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-500 transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar primeiro recebimento
            </Link>
          </div>
        )}
        
        {filteredReceipts.length === 0 && (searchTerm || statusFilter !== 'all') && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Nenhum recebimento encontrado com os filtros aplicados</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
