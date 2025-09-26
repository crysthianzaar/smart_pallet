'use client'

import { useState } from 'react'
import { AppLayout } from '../../../components/layout/AppLayout'
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Edit,
  Trash2,
  MoreHorizontal,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Calendar
} from 'lucide-react'

// Mock data
const users = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@empresa.com',
    role: 'admin',
    isActive: true,
    lastLogin: '2024-01-20 14:30',
    createdAt: '2024-01-15 10:00',
    palletsCreated: 25,
    receiptsProcessed: 18
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria.santos@empresa.com',
    role: 'conferente',
    isActive: true,
    lastLogin: '2024-01-20 13:45',
    createdAt: '2024-01-16 09:30',
    palletsCreated: 42,
    receiptsProcessed: 35
  },
  {
    id: '3',
    name: 'Pedro Costa',
    email: 'pedro.costa@empresa.com',
    role: 'conferente',
    isActive: true,
    lastLogin: '2024-01-20 11:15',
    createdAt: '2024-01-17 14:20',
    palletsCreated: 18,
    receiptsProcessed: 22
  },
  {
    id: '4',
    name: 'Ana Oliveira',
    email: 'ana.oliveira@empresa.com',
    role: 'conferente',
    isActive: false,
    lastLogin: '2024-01-18 16:30',
    createdAt: '2024-01-10 11:45',
    palletsCreated: 8,
    receiptsProcessed: 5
  }
]

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive)
    return matchesSearch && matchesRole && matchesStatus
  })

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    admins: users.filter(u => u.role === 'admin').length,
    conferentes: users.filter(u => u.role === 'conferente').length
  }

  const headerActions = (
    <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-200 flex items-center">
      <Plus className="h-4 w-4 mr-2" />
      Novo Usuário
    </button>
  )

  const toggleUserStatus = (userId: string) => {
    // TODO: Implement API call to toggle user status
    console.log('Toggle user status:', userId)
  }

  const deleteUser = (userId: string) => {
    // TODO: Implement API call to delete user
    console.log('Delete user:', userId)
  }

  return (
    <AppLayout 
      title="Usuários" 
      subtitle="Gestão de usuários do sistema"
      headerActions={headerActions}
    >
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        >
          <option value="all">Todas as funções</option>
          <option value="admin">Admin</option>
          <option value="conferente">Conferente</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
        <button className="px-4 py-3 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-all duration-200 flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Ativos</p>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
            </div>
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-400 rounded-lg">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Inativos</p>
              <p className="text-2xl font-bold text-white">{stats.inactive}</p>
            </div>
            <div className="p-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg">
              <UserX className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Admins</p>
              <p className="text-2xl font-bold text-white">{stats.admins}</p>
            </div>
            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Conferentes</p>
              <p className="text-2xl font-bold text-white">{stats.conferentes}</p>
            </div>
            <div className="h-8 w-8 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
              <div className="h-4 w-4 bg-blue-400 rounded-full" />
            </div>
          </div>
        </div>
      </div>

        {/* Users List */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl">
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-lg font-bold text-white">Lista de Usuários</h2>
            <p className="text-sm text-slate-400 mt-1">Gerencie todos os usuários do sistema</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 hover:bg-slate-700/50 transition-all duration-300">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${
                        user.isActive ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-slate-600'
                      }`}>
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white">{user.name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {user.role === 'admin' ? 'Admin' : 'Conferente'}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.isActive ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                          }`}>
                            {user.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-2">
                          <span className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {user.email}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Último login: {user.lastLogin}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span>{user.palletsCreated} pallets criados</span>
                          <span>{user.receiptsProcessed} recebimentos processados</span>
                          <span>Criado em: {user.createdAt}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`px-3 py-2 rounded-lg border transition-all duration-200 flex items-center text-sm ${
                          user.isActive 
                            ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30' 
                            : 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
                        }`}
                      >
                        {user.isActive ? (
                          <>
                            <UserX className="h-4 w-4 mr-1" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Ativar
                          </>
                        )}
                      </button>
                      
                      <button className="px-3 py-2 bg-slate-600/50 text-slate-300 border border-slate-500/50 rounded-lg hover:bg-slate-500/50 transition-all duration-200 flex items-center text-sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </button>
                      
                      <button 
                        onClick={() => deleteUser(user.id)}
                        className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all duration-200 flex items-center text-sm"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </button>
                      
                      <button className="p-2 text-slate-400 hover:text-white transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Nenhum usuário encontrado
                </h3>
                <p className="text-slate-400 mb-6">
                  Tente ajustar os filtros ou criar um novo usuário.
                </p>
                <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-200">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Usuário
                </button>
              </div>
            )}
          </div>
        </div>
    </AppLayout>
  )
}
