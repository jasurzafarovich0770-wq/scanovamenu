import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import ChangePasswordModal from '../components/ChangeCodeModal';
import { useAuthStore } from '../store/useAuthStore';

interface Restaurant {
  id: string;
  name: string;
  owner: string;
  email: string;
  phone: string;
  tables: number;
  orders: number;
  revenue: number;
  status: 'active' | 'inactive' | 'pending';
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  createdAt: string;
  growth: number;
  accessCode: string;
}

function SuperAdminPanelContent(): JSX.Element {
  const { username } = useAuthStore();
  const [restaurants] = useState<Restaurant[]>([
    {
      id: 'demo-restaurant',
      name: 'Demo Pizza',
      owner: 'Ali Valiyev',
      email: 'info@demopizza.uz',
      phone: '+998901234567',
      tables: 10,
      orders: 145,
      revenue: 2500000,
      status: 'active',
      plan: 'PRO',
      createdAt: '2024-01-15',
      growth: 15.2,
      accessCode: 'ADMIN001'
    },
    {
      id: 'demo-cafe',
      name: 'Demo Kafe',
      owner: 'Malika Karimova',
      email: 'info@demokafe.uz',
      phone: '+998907654321',
      tables: 8,
      orders: 89,
      revenue: 1200000,
      status: 'active',
      plan: 'STARTER',
      createdAt: '2024-02-01',
      growth: 8.7,
      accessCode: 'ADMIN002'
    },
    {
      id: 'demo-fastfood',
      name: 'Demo Fast Food',
      owner: 'Bobur Toshmatov',
      email: 'info@demofastfood.uz',
      phone: '+998909876543',
      tables: 15,
      orders: 234,
      revenue: 3200000,
      status: 'active',
      plan: 'ENTERPRISE',
      createdAt: '2024-01-10',
      growth: 22.1,
      accessCode: 'ADMIN003'
    }
  ]);

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const getPlanColor = (plan: Restaurant['plan']): string => {
    switch (plan) {
      case 'FREE': return 'bg-gray-100 text-gray-800';
      case 'STARTER': return 'bg-blue-100 text-blue-800';
      case 'PRO': return 'bg-purple-100 text-purple-800';
      case 'ENTERPRISE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-bold text-lg">👑</span>
            </div>
            <div>
              <span className="text-xl font-bold text-white">Super Admin Panel</span>
              <p className="text-xs text-gray-300">System Management</p>
            </div>
          </Link>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowChangePasswordModal(true)}
              className="glass text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
            >
              <span>🔐</span>
              <span>Parol O'zgartirish</span>
            </button>
            <Link 
              to="/scanner" 
              className="glass text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
            >
              📱 QR Scanner
            </Link>
            <Link 
              to="/admin" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              🏪 Admin Panel
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8 animate-fade-in-up">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 gradient-text">Super Admin Dashboard</h1>
            <p className="text-gray-300">Barcha restoranlar va tizimni professional tarzda boshqaring</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8 animate-fade-in-up animation-delay-200">
          <div className="glass rounded-2xl p-6 border border-white/10 hover:bg-white/5 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center animate-pulse-glow">
                  <span className="text-2xl">🏪</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-400">Jami Restoranlar</p>
                  <p className="text-3xl font-bold text-white">{restaurants.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/10 hover:bg-white/5 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center animate-pulse-glow">
                  <span className="text-2xl">📋</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-400">Jami Buyurtmalar</p>
                  <p className="text-3xl font-bold text-white">
                    {restaurants.reduce((sum, r) => sum + r.orders, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/10 hover:bg-white/5 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center animate-pulse-glow">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-400">Jami Daromad</p>
                  <p className="text-3xl font-bold text-white">
                    {(restaurants.reduce((sum, r) => sum + r.revenue, 0) / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/10 hover:bg-white/5 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center animate-pulse-glow">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-400">Kutilayotgan</p>
                  <p className="text-3xl font-bold text-white">
                    {restaurants.filter(r => r.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Restaurants Table */}
        <div className="glass rounded-2xl border border-white/10 overflow-hidden animate-fade-in-up animation-delay-400">
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-red-500/10 to-orange-600/10">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <span className="mr-2">📊</span>
              Restoranlar Ro'yxati
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/20">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Restoran
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Egasi
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Holat
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Buyurtmalar
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Daromad
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {restaurants.map((restaurant, index) => (
                  <tr 
                    key={restaurant.id} 
                    className="hover:bg-white/5 transition-all duration-300 animate-slide-in"
                    style={{ animationDelay: `${500 + index * 100}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-white font-bold text-sm">
                            {restaurant.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-white">{restaurant.name}</div>
                          <div className="text-sm text-gray-400">{restaurant.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">{restaurant.owner}</div>
                        <div className="text-sm text-gray-400">{restaurant.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlanColor(restaurant.plan)}`}>
                        {restaurant.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ Faol
                        </span>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-2"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white font-medium">{restaurant.orders}</div>
                      <div className="text-xs text-gray-400">{restaurant.tables} stol</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">
                        {(restaurant.revenue / 1000).toFixed(0)}K so'm
                      </div>
                      <div className="text-xs text-gray-400">Bu oy</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-400 hover:text-blue-300 text-sm bg-blue-500/20 px-2 py-1 rounded transition-colors duration-300">
                          👁️ Ko'rish
                        </button>
                        <button className="text-red-400 hover:text-red-300 text-sm bg-red-500/20 px-2 py-1 rounded transition-colors duration-300">
                          🗑️ O'chirish
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        userType="super-admin"
        username={username || ''}
      />
    </div>
  );
}

const SuperAdminPanel: React.FC = () => {
  return (
    <ProtectedRoute requiredType="super-admin">
      <SuperAdminPanelContent />
    </ProtectedRoute>
  );
};

export default SuperAdminPanel;