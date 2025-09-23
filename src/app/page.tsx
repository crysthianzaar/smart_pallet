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
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Em Trânsito</h3>
              <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg shadow-lg shadow-yellow-500/25">
                <Truck className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{data.pallets.inTransit}</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Manifestos Hoje (Saídas)</h3>
              <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg shadow-lg shadow-purple-500/25">
                <FileText className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{data.today.manifestsCreated}</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Recebimentos Hoje</h3>
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg shadow-green-500/25">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{data.today.palletsReceived}</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Diferenças Críticas</h3>
              <div className="p-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg shadow-lg shadow-red-500/25">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-red-400 mb-2">{data.today.criticalDifferences}</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Confiança IA Média</h3>
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg shadow-lg shadow-cyan-500/25">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{data.pallets.avgConfidence}%</div>
          </div>
        </div>
    </AppLayout>
  )
}
