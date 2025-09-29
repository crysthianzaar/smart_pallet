'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '../../components/layout/AppLayout'
import { 
  Package, 
  MapPin, 
  Tag, 
  QrCode,
  Plus,
  Database,
  Download,
  Upload
} from 'lucide-react'

interface AdminStats {
  contracts: number;
  locations: number;
  skus: number;
  qrTags: {
    total: number;
    available: number;
    linked: number;
    utilization: number;
  };
  pallets: number;
}

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to seed database');
      }
      
      const result = await response.json();
      setMessage(`✅ Banco populado com sucesso! ${JSON.stringify(result.data)}`);
      await fetchStats(); // Recarregar estatísticas
    } catch (error) {
      setMessage(`❌ Erro: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm('⚠️ ATENÇÃO: Esta ação irá apagar TODOS os dados do banco! Tem certeza?')) {
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset database');
      }
      
      const result = await response.json();
      setMessage(`✅ Banco limpo com sucesso! ${result.tablesCleared} tabelas limpas.`);
      await fetchStats(); // Recarregar estatísticas
    } catch (error) {
      setMessage(`❌ Erro: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const adminSections = [
    {
      title: 'Contratos',
      description: 'Gerenciar empresas e parceiros',
      icon: Package,
      href: '/admin/contracts',
      color: 'from-blue-500 to-cyan-400'
    },
    {
      title: 'Locais',
      description: 'Origens, destinos e estoques',
      icon: MapPin,
      href: '/admin/locations',
      color: 'from-green-500 to-emerald-400'
    },
    {
      title: 'SKUs',
      description: 'Catálogo de produtos',
      icon: Tag,
      href: '/admin/skus',
      color: 'from-purple-500 to-pink-400'
    },
    {
      title: 'QR Tags',
      description: 'Pool de códigos QR',
      icon: QrCode,
      href: '/admin/qr-tags',
      color: 'from-orange-500 to-red-400'
    }
  ];

  return (
    <AppLayout 
      title="Configurações" 
      subtitle="Configuração e gerenciamento do sistema"
    >

      {/* Admin Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminSections.map((section, index) => (
          <a
            key={index}
            href={section.href}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 hover:border-slate-600/50 transition-all duration-300 hover:scale-105 group"
          >
            <div className={`inline-flex items-center justify-center p-4 bg-gradient-to-r ${section.color} rounded-xl shadow-lg mb-4`}>
              <section.icon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
              {section.title}
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {section.description}
            </p>
          </a>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white mb-2">Estatísticas do Sistema</h2>
          <p className="text-sm text-slate-400">Visão geral dos dados cadastrados</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {statsLoading ? '...' : stats?.contracts || 0}
            </div>
            <div className="text-sm text-slate-400">Contratos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {statsLoading ? '...' : stats?.locations || 0}
            </div>
            <div className="text-sm text-slate-400">Locais</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {statsLoading ? '...' : stats?.skus || 0}
            </div>
            <div className="text-sm text-slate-400">SKUs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400 mb-1">
              {statsLoading ? '...' : stats?.qrTags.total || 0}
            </div>
            <div className="text-sm text-slate-400">QR Tags</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400 mb-1">
              {statsLoading ? '...' : stats?.pallets || 0}
            </div>
            <div className="text-sm text-slate-400">Pallets</div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
