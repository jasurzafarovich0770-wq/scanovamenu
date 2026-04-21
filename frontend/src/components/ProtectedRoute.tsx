import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { authApi, api } from '../lib/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredType: 'admin' | 'super-admin' | 'customer';
}

export default function ProtectedRoute({ children, requiredType }: ProtectedRouteProps) {
  const { isAuthenticated, userType, logout } = useAuthStore();
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(false);

  // Zustand persist hydration ni kutish
  useEffect(() => {
    // persist middleware localStorage dan yuklashni kutish
    const unsub = useAuthStore.persist?.onFinishHydration?.(() => {
      setHydrated(true);
    });
    // Agar allaqachon hydrated bo'lsa
    if (useAuthStore.persist?.hasHydrated?.()) {
      setHydrated(true);
    } else {
      // Fallback: qisqa timeout
      const t = setTimeout(() => setHydrated(true), 100);
      return () => { clearTimeout(t); unsub?.(); };
    }
    return () => unsub?.();
  }, []);

  // Token ni restore qilish
  useEffect(() => {
    authApi.restoreToken();
  }, []);

  // 401 → auto logout
  useEffect(() => {
    const id = api.interceptors.response.use(
      res => res,
      error => {
        if (error.response?.status === 401) { logout(); navigate('/login'); }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(id);
  }, [logout, navigate]);

  // Hydration tugaguncha spinner
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Autentifikatsiya tekshiruvi
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  // Rol tekshiruvi
  if (userType !== requiredType) {
    if (userType === 'super-admin') navigate('/super-admin');
    else if (userType === 'admin') navigate('/admin');
    else navigate('/login');
    return null;
  }

  return <>{children}</>;
}
