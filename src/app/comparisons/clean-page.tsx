'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppLayout } from '../../components/layout/AppLayout'
import { 
  Plus, 
  Search, 
  BarChart3,
  Eye,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Package,
  Calendar,
  Tag,
  MoreHorizontal
} from 'lucide-react'

interface Comparison {
  id: string;
  receipt_id: string;
  pallet_id: string;
  sku_id: string;
  quantity_origin: number;
  quantity_destination: number;
  difference: number;
  difference_type?: 'falta' | 'sobra' | 'avaria' | 'troca';
  reason?: string;
  evidence_photos?: string;
  created_at: string;
}

export default function ComparisonsPage() {
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchComparisons();
  }, []);

  const fetchComparisons = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/comparisons');
      if (!response.ok) throw new Error('Failed to fetch comparisons');
      const data = await response.json();
      setComparisons(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type?: string) => {
    const colors = {
      falta: 'bg-red-500/20 text-red-400 border-red-500/30',
      sobra: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      avaria: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      troca: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getTypeLabel = (type?: string) => {
    const labels = {
      falta: 'Falta',
      sobra: 'Sobra',
      avaria: 'Avaria',
      troca: 'Troca'
    };
    return labels[type as keyof typeof labels] || 'N/A';
  };

  const getDifferenceIcon = (difference: number) => {
    if (difference > 0) return <TrendingUp className="h-4 w-4 text-blue-400" />;
    if (difference < 0) return <TrendingDown className="h-4 w-4 text-red-400" />;
    return <BarChart3 className="h-4 w-4 text-gray-400" />;
  };

  const filteredComparisons = comparisons.filter(comparison => {
    const matchesSearch = comparison.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comparison.pallet_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comparison.sku_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || comparison.difference_type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <AppLayout title="Comparações" subtitle="Análise de diferenças nos recebimentos">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Carregando...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Comparações" 
      subtitle="Análise de diferenças nos recebimentos"
      headerActions={
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar comparações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
          >
            <option value="all">Todos os Tipos</option>
            <option value="falta">Falta</option>
            <option value="sobra">Sobra</option>
            <option value="avaria">Avaria</option>
            <option value="troca">Troca</option>
          </select>
          <Link
            href="/comparisons/report"
            className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-red-400 text-white font-medium rounded-lg hover:from-orange-600 hover:to-red-500 transition-all duration-200"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Relatório
          </Link>
        </div>
      }
    >
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Comparisons Grid */}
      <div className="grid gap-6">
        {filteredComparisons.map((comparison) => (
          <div
            key={comparison.id}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <BarChart3 className="h-5 w-5 text-orange-400" />
                  <h3 className="text-lg font-bold text-white">{comparison.id}</h3>
                  {comparison.difference_type && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(comparison.difference_type)}`}>
                      {getTypeLabel(comparison.difference_type)}
                    </span>
                  )}
                  {Math.abs(comparison.difference) >= 5 && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                      <AlertTriangle className="h-3 w-3 mr-1 inline" />
                      Crítico
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm text-slate-400 mb-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span>Pallet: {comparison.pallet_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <span>SKU: {comparison.sku_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Origem: {comparison.quantity_origin}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Destino: {comparison.quantity_destination}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getDifferenceIcon(comparison.difference)}
                    <span className={comparison.difference > 0 ? 'text-blue-400' : comparison.difference < 0 ? 'text-red-400' : 'text-gray-400'}>
                      Diferença: {comparison.difference > 0 ? '+' : ''}{comparison.difference}
                    </span>
                  </div>
                </div>

                {comparison.reason && (
                  <div className="bg-slate-700/30 rounded-lg p-3 mb-3">
                    <p className="text-sm text-slate-300">{comparison.reason}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Criado em {new Date(comparison.created_at).toLocaleString()}
                  </div>
                  {comparison.evidence_photos && (
                    <div className="text-xs text-blue-400">
                      📷 Evidências disponíveis
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Link
                  href={`/comparisons/${comparison.id}`}
                  className="p-2 text-slate-400 hover:text-orange-400 hover:bg-orange-500/20 rounded-lg transition-all duration-200"
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
        
        {filteredComparisons.length === 0 && !searchTerm && typeFilter === 'all' && (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">Nenhuma comparação encontrada</p>
            <p className="text-slate-500 text-sm">
              As comparações são criadas automaticamente durante o processo de recebimento
            </p>
          </div>
        )}
        
        {filteredComparisons.length === 0 && (searchTerm || typeFilter !== 'all') && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Nenhuma comparação encontrada com os filtros aplicados</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
