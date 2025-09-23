'use client'

import Link from 'next/link'
import { AppLayout } from '../components/layout/AppLayout'
import { 
  Package, 
  FileText, 
  Truck, 
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  ArrowRight
} from 'lucide-react'

// Hook para buscar dados do dashboard
import { useEffect, useState } from 'react'

interface DashboardData {
  pallets: {
    total: number;
    inTransit: number;
    sealed: number;
    received: number;
    draft: number;
    requiresManualReview: number;
    avgConfidence: number;
  };
  qrTags: {
    total: number;
    available: number;
    linked: number;
    utilization: number;
  };
  today: {
    manifestsCreated: number;
    palletsReceived: number;
    criticalDifferences: number;
  };
  trends: {
    palletsGrowth: string;
    confidenceImprovement: string;
    efficiencyRate: string;
  };
}

const useDashboardData = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

export default function Home() {
  const { data, loading, error } = useDashboardData();

  if (loading) {
    return (
      <AppLayout title="Dashboard" subtitle="Visão geral do sistema">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Carregando...</div>
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout title="Dashboard" subtitle="Visão geral do sistema">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400">Erro ao carregar dados: {error}</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Dashboard" 
      subtitle="Visão geral do sistema"
    >

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Total de Pallets</h3>
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg shadow-lg shadow-blue-500/25">
                <Package className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{data.pallets.total.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-400">
              <TrendingUp className="h-3 w-3 mr-1" />
              {data.trends.palletsGrowth} em relação ao mês passado
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Em Trânsito</h3>
              <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg shadow-lg shadow-yellow-500/25">
                <Truck className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{data.pallets.inTransit}</div>
            <div className="flex items-center text-xs text-yellow-400">
              <Clock className="h-3 w-3 mr-1" />
              Aguardando recebimento
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Manifestos Hoje</h3>
              <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg shadow-lg shadow-purple-500/25">
                <FileText className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{data.today.manifestsCreated}</div>
            <div className="flex items-center text-xs text-green-400">
              <TrendingUp className="h-3 w-3 mr-1" />
              Criados hoje
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Recebimentos Hoje</h3>
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg shadow-green-500/25">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{data.today.palletsReceived}</div>
            <div className="flex items-center text-xs text-green-400">
              <BarChart3 className="h-3 w-3 mr-1" />
              {data.trends.efficiencyRate} de eficiência
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Diferenças Críticas</h3>
              <div className="p-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg shadow-lg shadow-red-500/25">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-red-400 mb-2">{data.today.criticalDifferences}</div>
            <div className="flex items-center text-xs text-red-400">
              <XCircle className="h-3 w-3 mr-1" />
              Requer atenção imediata
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Confiança IA Média</h3>
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg shadow-lg shadow-cyan-500/25">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{data.pallets.avgConfidence}%</div>
            <div className="flex items-center text-xs text-green-400">
              <TrendingUp className="h-3 w-3 mr-1" />
              {data.trends.confidenceImprovement} esta semana
            </div>
          </div>
        </div>

        {/* QR Tags Status */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white mb-2">Status das QR Tags</h2>
            <p className="text-sm text-slate-400">Controle do pool de QR Tags disponíveis</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{data.qrTags.total}</div>
              <div className="text-sm text-slate-400">Total de Tags</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">{data.qrTags.available}</div>
              <div className="text-sm text-slate-400">Disponíveis</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{data.qrTags.linked}</div>
              <div className="text-sm text-slate-400">Em Uso ({data.qrTags.utilization}%)</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white mb-2">Ações Rápidas</h2>
            <p className="text-sm text-slate-400">Acesso rápido às funcionalidades mais utilizadas</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/pallets/new" className="flex flex-col items-center justify-center h-20 bg-slate-700/30 border border-slate-600/50 rounded-lg hover:bg-slate-700/50 hover:border-blue-500/50 transition-all duration-300 group">
              <Package className="h-6 w-6 text-slate-400 group-hover:text-blue-400 transition-colors" />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors mt-2">Novo Pallet</span>
            </Link>
            <Link href="/manifests/new" className="flex flex-col items-center justify-center h-20 bg-slate-700/30 border border-slate-600/50 rounded-lg hover:bg-slate-700/50 hover:border-purple-500/50 transition-all duration-300 group">
              <FileText className="h-6 w-6 text-slate-400 group-hover:text-purple-400 transition-colors" />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors mt-2">Criar Manifesto</span>
            </Link>
            <Link href="/receipts/new" className="flex flex-col items-center justify-center h-20 bg-slate-700/30 border border-slate-600/50 rounded-lg hover:bg-slate-700/50 hover:border-green-500/50 transition-all duration-300 group">
              <Truck className="h-6 w-6 text-slate-400 group-hover:text-green-400 transition-colors" />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors mt-2">Receber Pallet</span>
            </Link>
            <Link href="/reports" className="flex flex-col items-center justify-center h-20 bg-slate-700/30 border border-slate-600/50 rounded-lg hover:bg-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 group">
              <BarChart3 className="h-6 w-6 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors mt-2">Relatórios</span>
            </Link>
          </div>
        </div>
    </AppLayout>
  )
}
