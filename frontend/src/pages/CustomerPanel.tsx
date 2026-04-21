import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import ChangePasswordModal from '../components/ChangeCodeModal';
import { StoreIcon, ScanIcon, HomeIcon, UserIcon, ForkKnifeIcon } from '../components/Icons';
import { authApi } from '../lib/api';
import toast from 'react-hot-toast';

interface Restaurant {
  username: string;
  restaurantId: string | null;
  restaurantName?: string;
  ownerName?: string;
  tables?: number;
}

export default function CustomerPanel() {
  const { username } = useAuthStore();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    const fetchRestaurants = async () => {
      try {
        const res = await authApi.getAllUsers();
        const users: any[] = res.data?.data || [];
        setRestaurants(users.filter((u: any) => u.role === 'ADMIN' || u.type === 'admin'));
      } catch {
        toast.error("Restoranlar yuklanmadi");
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="decorative-blob w-96 h-96 bg-blue-400 top-20 right-10"></div>
        <div className="decorative-blob w-80 h-80 bg-indigo-400 bottom-20 left-10" style={{ animationDelay: '5s' }}></div>
      </div>

      {/* Header */}
      <header className="header-modern sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className={`flex items-center space-x-3 ${isLoaded ? 'animate-slide-in-right' : 'opacity-0'}`}>
            <div className="icon-container w-10 h-10">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900">Mijoz Paneli</span>
              <p className="text-xs text-gray-500">Xush kelibsiz, {username}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowChangePasswordModal(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              <UserIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Profil</span>
            </button>
            <Link to="/" className="flex items-center space-x-2 px-3 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium">
              <HomeIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Bosh sahifa</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className={`mb-8 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h1 className="text-2xl font-bold text-gray-900">Mijoz Paneli</h1>
          <p className="text-gray-500 text-sm mt-1">QR kod skanerlang yoki restoranlarni ko'ring</p>
        </div>

        {/* QR Scanner Card */}
        <div className={`classic-card mb-6 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="classic-card-header border-accent">
            <h2 className="font-semibold text-gray-900 flex items-center space-x-2">
              <ScanIcon className="w-5 h-5 text-blue-600" />
              <span>QR Kod Skanerlash</span>
            </h2>
          </div>
          <div className="classic-card-body text-center py-10">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl float-modern">
              <ScanIcon className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Stol QR kodini skanerlang</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">Telefon kamerasi orqali QR kodni skanerlang va buyurtma bering</p>
            <Link to="/scanner" className="btn-primary inline-flex items-center gap-2 py-3 px-8">
              <ScanIcon className="w-5 h-5" />
              <span>QR Skanerlash</span>
            </Link>
          </div>
        </div>

        {/* Restaurants List */}
        <div className={`classic-card ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
          <div className="classic-card-header border-accent">
            <h2 className="font-semibold text-gray-900 flex items-center space-x-2">
              <StoreIcon className="w-5 h-5 text-blue-600" />
              <span>Restoranlar</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Barcha mavjud restoranlar ro'yxati</p>
          </div>
          <div className="classic-card-body">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-500 text-sm">Yuklanmoqda...</p>
              </div>
            ) : restaurants.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <StoreIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Hozircha restoranlar yo'q</p>
                <p className="text-gray-400 text-sm mt-1">QR kodni skanerlang</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {restaurants.map((restaurant, i) => (
                  <div
                    key={restaurant.username}
                    className={`bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-300 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
                    style={{ animationDelay: `${0.1 + i * 0.05}s` }}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-md">
                        {restaurant.restaurantName?.charAt(0).toUpperCase() || 'R'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{restaurant.restaurantName || 'Restoran'}</h3>
                        <p className="text-sm text-gray-500">{restaurant.ownerName || '—'}</p>
                        <span className="inline-block mt-1 text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 font-medium">
                          {restaurant.tables || 0} ta stol
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/r/${restaurant.restaurantId}/t/1`}
                      className="w-full text-center text-sm py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <ForkKnifeIcon className="w-4 h-4" />
                      <span>Menyuni ko'rish</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        userType="customer"
        username={username || ''}
      />
    </div>
  );
}
