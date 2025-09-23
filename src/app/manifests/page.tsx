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
  MoreHorizontal,
  Calendar,
  Package,
  CheckCircle,
  Clock,
  User
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
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar manifestos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Todos os Status</option>
            <option value="rascunho">Rascunho</option>
            <option value="carregado">Carregado</option>
            <option value="em_transito">Em Trânsito</option>
            <option value="entregue">Entregue</option>
          </select>
          <Link
            href="/manifests/new"
            className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-400 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-500 transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Manifesto
          </Link>
        </div>
      }
    >
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Manifestos Grid */}
      <div className="grid gap-6">
        {filteredManifests.map((manifest) => (
          <div
            key={manifest.id}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-white">{manifest.manifest_number}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(manifest.status)}`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(manifest.status)}
                      {getStatusLabel(manifest.status)}
                    </div>
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-400 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{manifest.driver_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span>{manifest.vehicle_plate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(manifest.created_at).toLocaleDateString()}</span>
                  </div>
                  {manifest.loaded_at && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Carregado: {new Date(manifest.loaded_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-500">
                  Criado por {manifest.created_by} em {new Date(manifest.created_at).toLocaleString()}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Link
                  href={`/manifests/${manifest.id}`}
                  className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-500/20 rounded-lg transition-all duration-200"
                >
                  <Eye className="h-4 w-4" />
                </Link>
                {manifest.pdf_path && (
                  <button className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/20 rounded-lg transition-all duration-200">
                    <Download className="h-4 w-4" />
                  </button>
                )}
                <button className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-600/50 rounded-lg transition-all duration-200">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
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
    </AppLayout>
  )
}
