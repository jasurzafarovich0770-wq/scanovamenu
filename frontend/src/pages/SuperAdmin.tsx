import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ChangePasswordModal from '../components/ChangeCodeModal';
import { useAuthStore, UserActivity, AdminPermissions, DEFAULT_PERMISSIONS, PERMISSION_LABELS, PERMISSION_GROUPS } from '../store/useAuthStore';
import { useOrderLogStore, OrderLogEntry } from '../store/useOrderLogStore';
import { useLangStore, translations } from '../store/useLangStore';
import { authApi, subscriptionApi } from '../lib/api';
import { CrownIcon, ScanIcon, HomeIcon, StoreIcon, RevenueIcon, UsersIcon, TableIcon } from '../components/Icons';
import ThemeToggle from '../components/ThemeToggle';
import toast from 'react-hot-toast';

type Tab = 'dashboard' | 'restaurants' | 'users' | 'activity' | 'orders' | 'settings' | 'payments';

const fmt = (iso: string) => new Date(iso).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

function getBrowser(ua: string) {
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  return 'Boshqa';
}

function getDevice(ua: string) {
  if (/tablet|ipad/i.test(ua)) return 'Tablet';
  if (/mobile|android|iphone/i.test(ua)) return 'Mobil';
  return 'Desktop';
}

function exportCSV(rows: string[][], filename: string) {
  const bom = '\uFEFF';
  const csv = bom + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const STATUS_LABELS: Record<string, string> = { pending: 'Kutilmoqda', confirmed: 'Tasdiqlangan', cancelled: 'Bekor qilingan' };
const STATUS_COLORS: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };

// SVG Icons inline
const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ActivityIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const OrdersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const LogoutIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const GlobeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InfoIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

function SuperAdmin(): JSX.Element {
  const { username, getAllUsers, updateUserType, updateUser, deleteUser, addUser, getActivityLogs, updatePermissions } = useAuthStore();
  const { logs: orderLogs, clearLogs } = useOrderLogStore();
  const { lang, setLang } = useLangStore();
  const t = useMemo(() => (key: string) => translations[lang]?.[key] || translations['uz']?.[key] || key, [lang]);

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState('');
  const [rejectNoteMap, setRejectNoteMap] = useState<Record<string, string>>({});
  const [screenshotModal, setScreenshotModal] = useState<string | null>(null);
  const [users, setUsers] = useState<ReturnType<typeof getAllUsers>>([]);
  const [activityLogs, setActivityLogs] = useState<UserActivity[]>(getActivityLogs());
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<any>(null);
  const [restaurantForm, setRestaurantForm] = useState({ username: '', password: '', restaurantName: '', ownerName: '', email: '', tables: 5 });

  const [selectedActivity, setSelectedActivity] = useState<UserActivity | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderLogEntry | null>(null);
  const [permissionsUser, setPermissionsUser] = useState<{ username: string; permissions: AdminPermissions } | null>(null);

  const [orderSearch, setOrderSearch] = useState('');
  const [orderRestaurantFilter, setOrderRestaurantFilter] = useState('');
  const [orderDateFilter, setOrderDateFilter] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [activitySearch, setActivitySearch] = useState('');

  // Settings state
  const [settingsLang, setSettingsLang] = useState<'uz' | 'ru' | 'en'>(lang);
  const [showDangerZone, setShowDangerZone] = useState(false);

  useEffect(() => { loadUsers(); setActivityLogs(getActivityLogs()); }, []);

  const loadPayments = async (statusFilter?: string) => {
    setPaymentsLoading(true);
    try {
      const res = await subscriptionApi.getAllPayments(statusFilter);
      setPayments(res.data?.data || []);
    } catch { setPayments([]); }
    finally { setPaymentsLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'payments') loadPayments();
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      const res = await authApi.getAllUsers();
      const backendUsers = res.data.data;
      const roleMap: Record<string, 'admin' | 'super-admin' | 'customer'> = {
        SUPER_ADMIN: 'super-admin', ADMIN: 'admin', CUSTOMER: 'customer',
      };
      const mapped = backendUsers.map((u: any) => ({
        username: u.username, type: roleMap[u.role] || 'customer',
        restaurantId: u.restaurantId || null, restaurantName: u.restaurantName || null,
        ownerName: u.ownerName || null, email: u.email || null,
        tables: u.tables || 0, permissions: u.permissions || (u.role === 'ADMIN' ? DEFAULT_PERMISSIONS : undefined),
        cardNumber: u.cardNumber || '', serviceFeePercent: u.serviceFeePercent ?? 10,
        balance: 0, waiters: [], id: u.id,
      }));
      setUsers(mapped);
    } catch { setUsers([]); }
  };

  const refreshUsers = () => { loadUsers(); setActivityLogs(getActivityLogs()); };
  // Admin bo'lgan barcha userlar restoran sifatida ko'rsatiladi
  const restaurants = users.filter(u => u.type === 'admin');

  const filteredOrders = useMemo(() => {
    return orderLogs.filter(log => {
      const matchSearch = !orderSearch || log.username?.includes(orderSearch) || log.restaurantName.toLowerCase().includes(orderSearch.toLowerCase()) || log.ip.includes(orderSearch);
      const matchRestaurant = !orderRestaurantFilter || log.restaurantId === orderRestaurantFilter;
      const matchDate = !orderDateFilter || fmtDate(log.createdAt) === fmtDate(orderDateFilter);
      const matchStatus = !orderStatusFilter || log.status === orderStatusFilter;
      return matchSearch && matchRestaurant && matchDate && matchStatus;
    });
  }, [orderLogs, orderSearch, orderRestaurantFilter, orderDateFilter, orderStatusFilter]);

  const filteredActivity = useMemo(() => {
    return activityLogs.filter(l => !activitySearch || l.username.includes(activitySearch) || l.ip.includes(activitySearch) || l.country.includes(activitySearch));
  }, [activityLogs, activitySearch]);

  const todayOrders = orderLogs.filter(l => isToday(l.createdAt));
  const todayRevenue = todayOrders.reduce((s, l) => s + l.total, 0);
  const totalRevenue = orderLogs.reduce((s, l) => s + l.total, 0);

  const last7 = useMemo(() => {
    const days: { date: string; count: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const dayLogs = orderLogs.filter(l => new Date(l.createdAt).toDateString() === dateStr);
      days.push({ date: d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' }), count: dayLogs.length, revenue: dayLogs.reduce((s, l) => s + l.total, 0) });
    }
    return days;
  }, [orderLogs]);
  const maxCount = Math.max(...last7.map(d => d.count), 1);

  const handleUpdateUserType = async (uname: string, newType: 'admin' | 'super-admin' | 'customer') => {
    const names = { 'super-admin': 'Super Admin', 'admin': 'Admin', 'customer': 'Foydalanuvchi' };
    const roleMap: Record<string, string> = { 'super-admin': 'SUPER_ADMIN', 'admin': 'ADMIN', 'customer': 'CUSTOMER' };
    const user = users.find(u => u.username === uname);
    if (!user) return;
    try {
      if ((user as any).id) await authApi.updateUserRole((user as any).id, roleMap[newType]);
      else updateUserType(uname, newType);
      refreshUsers(); toast.success(`${uname} → ${names[newType]}`);
    } catch {
      if (updateUserType(uname, newType)) { refreshUsers(); toast.success(`${uname} → ${names[newType]}`); }
    }
  };

  const handleDeleteUser = async (uname: string) => {
    if (uname === 'superadmin') { toast.error('Asosiy Super Admin o\'chirib bo\'lmaydi!'); return; }
    const user = users.find(u => u.username === uname);
    try {
      if (user && (user as any).id) { await authApi.deleteUser((user as any).id); refreshUsers(); toast.success('O\'chirildi'); }
      else if (deleteUser(uname)) { refreshUsers(); toast.success('O\'chirildi'); }
    } catch {
      if (deleteUser(uname)) { refreshUsers(); toast.success('O\'chirildi'); }
    }
  };

  const openAddRestaurant = () => {
    setEditingRestaurant(null);
    setRestaurantForm({ username: '', password: '', restaurantName: '', ownerName: '', email: '', tables: 5 });
    setShowRestaurantModal(true);
  };

  const openEditRestaurant = (r: any) => {
    setEditingRestaurant(r);
    setRestaurantForm({ username: r.username, password: '', restaurantName: r.restaurantName || '', ownerName: r.ownerName || '', email: r.email || '', tables: r.tables || 5 });
    setShowRestaurantModal(true);
  };

  const handleSaveRestaurant = async () => {
    if (!restaurantForm.restaurantName.trim()) { toast.error('Restoran nomi majburiy'); return; }
    if (!restaurantForm.ownerName.trim()) { toast.error('Egasi ismi majburiy'); return; }
    if (editingRestaurant) {
      updateUser(editingRestaurant.username, { restaurantName: restaurantForm.restaurantName, ownerName: restaurantForm.ownerName, email: restaurantForm.email, tables: restaurantForm.tables });
      refreshUsers(); toast.success('Yangilandi!'); setShowRestaurantModal(false);
    } else {
      if (!restaurantForm.username.trim()) { toast.error('Login majburiy'); return; }
      if (!/^[a-zA-Z0-9_]+$/.test(restaurantForm.username)) { toast.error('Login faqat lotin harflari, raqamlar va _ bo\'lishi kerak'); return; }
      if (!restaurantForm.password || restaurantForm.password.length < 6) { toast.error('Parol kamida 6 ta belgi bo\'lishi kerak'); return; }
      const rid = restaurantForm.restaurantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (await addUser(restaurantForm.username, restaurantForm.password, 'admin', rid, { restaurantName: restaurantForm.restaurantName, ownerName: restaurantForm.ownerName, email: restaurantForm.email, tables: restaurantForm.tables })) {
        refreshUsers(); toast.success('Qo\'shildi!'); setShowRestaurantModal(false);
      } else toast.error('Bu login band');
    }
  };

  const exportOrders = () => {
    const header = ['ID', 'Vaqt', 'Foydalanuvchi', 'Restoran', 'Stol', 'Taomlar', 'Jami (so\'m)', 'To\'lov', 'Status', 'IP', 'Mamlakat', 'Shahar', 'Qurilma'];
    const rows = filteredOrders.map(l => [l.id, fmt(l.createdAt), l.username || 'Mehmon', l.restaurantName, String(l.tableNumber), l.items.map(i => `${i.name}x${i.quantity}`).join('; '), String(l.total), l.paymentMethod, STATUS_LABELS[l.status] || l.status, l.ip, l.country, l.city, l.deviceType]);
    exportCSV([header, ...rows], `zakazlar-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('CSV yuklab olindi');
  };

  const exportActivity = () => {
    const header = ['Foydalanuvchi', 'IP', 'Mamlakat', 'Shahar', 'Oxirgi faollik', 'Kirish soni', 'Brauzer'];
    const rows = filteredActivity.map(l => [l.username, l.ip, l.country, l.city, fmt(l.lastSeen), String(l.loginCount), getBrowser(l.userAgent)]);
    exportCSV([header, ...rows], `faollik-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('CSV yuklab olindi');
  };

  const typeBadge = (type: string) => {
    if (type === 'super-admin') return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700';
    if (type === 'admin') return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700';
    return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700';
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <RevenueIcon className="w-4 h-4" /> },
    { key: 'restaurants', label: `${t('restaurants_count')} (${restaurants.length})`, icon: <StoreIcon className="w-4 h-4" /> },
    { key: 'users', label: `${t('users_count')} (${users.length})`, icon: <UsersIcon className="w-4 h-4" /> },
    { key: 'activity', label: `${t('activity')} (${activityLogs.length})`, icon: <ActivityIcon className="w-4 h-4" /> },
    { key: 'orders', label: `${t('orders')} (${orderLogs.length})`, icon: <OrdersIcon className="w-4 h-4" /> },
    { key: 'payments', label: `To'lovlar${payments.filter(p => p.status === 'PENDING').length > 0 ? ` (${payments.filter(p => p.status === 'PENDING').length})` : ''}`, icon: <RevenueIcon className="w-4 h-4" /> },
    { key: 'settings', label: t('settings'), icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 h-16">
        <div className="max-w-[1600px] mx-auto px-4 h-full flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-amber-200">
              <CrownIcon className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-none">Super Admin</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Tizim boshqaruvi</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            {/* Lang switcher */}
            <div className="hidden md:flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5 gap-0.5">
              {(['uz', 'ru', 'en'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${lang === l ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                  {l}
                </button>
              ))}
            </div>
            <ThemeToggle />
            <Link to="/scanner" className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors">
              <ScanIcon className="w-3.5 h-3.5" /><span>Skaner</span>
            </Link>
            <button onClick={() => setShowChangePasswordModal(true)}
              className="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-500 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors" title="Profil">
              <CrownIcon className="w-4 h-4" />
            </button>
            <Link to="/" className="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-500 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors" title="Chiqish">
              <HomeIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-[1600px] mx-auto w-full">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-100 sticky top-16 h-[calc(100vh-64px)] py-6 px-3 shrink-0 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-3">Boshqaruv</p>
          <nav className="space-y-0.5">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${activeTab === tab.key ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <span className={activeTab === tab.key ? 'text-amber-600' : 'text-gray-400'}>{tab.icon}</span>
                <span>{tab.label}</span>
                {activeTab === tab.key && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-500 rounded-r-full"></div>}
              </button>
            ))}
          </nav>
          <div className="mt-auto pt-4 border-t border-gray-100">
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-gray-700 truncate">{username}</p>
              <p className="text-[10px] text-gray-400">Super Admin</p>
            </div>
          </div>
        </aside>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white rounded-2xl shadow-2xl flex items-center gap-0.5 p-1.5 border border-white/10" style={{ maxWidth: 'calc(100% - 32px)' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center justify-center p-2.5 rounded-xl transition-all ${activeTab === tab.key ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
              {tab.icon}
            </button>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-6 overflow-auto pb-24 lg:pb-6">

          {/* ===== DASHBOARD ===== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Tizim umumiy ko'rinishi</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-semibold text-emerald-700">t('live_data')</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Restoranlar', value: restaurants.length, sub: 'Jami faol', icon: <StoreIcon className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                  { label: 'Bugungi zakazlar', value: todayOrders.length, sub: `Jami: ${orderLogs.length}`, icon: <OrdersIcon className="w-5 h-5" />, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
                  { label: 'Bugungi daromad', value: todayRevenue.toLocaleString() + ' so\'m', sub: `Jami: ${totalRevenue.toLocaleString()}`, icon: <RevenueIcon className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                  { label: 'Foydalanuvchilar', value: users.length, sub: `Adminlar: ${restaurants.length}`, icon: <UsersIcon className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                ].map((s, i) => (
                  <div key={i} className={`bg-white border ${s.border} rounded-xl p-4 flex items-start gap-3 hover:shadow-md transition-shadow`}>
                    <div className={`${s.bg} p-2.5 rounded-xl shrink-0 ${s.color}`}>{s.icon}</div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 truncate">{s.label}</p>
                      <p className="text-lg font-bold text-gray-900 leading-tight truncate">{s.value}</p>
                      <p className="text-xs text-gray-400 truncate">{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 7 kunlik grafik */}
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-4">So'nggi 7 kun — Zakazlar</h3>
                <div className="flex items-end gap-2 h-32">
                  {last7.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-500 font-medium">{d.count}</span>
                      <div className="w-full bg-amber-400 rounded-t-md transition-all hover:bg-amber-500" style={{ height: `${(d.count / maxCount) * 80 + 4}px`, minHeight: '4px' }} title={`${d.date}: ${d.count} zakaz`} />
                      <span className="text-[10px] text-gray-400">{d.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* So'nggi zakazlar */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">So'nggi zakazlar</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-xs text-amber-600 hover:underline font-medium">Barchasini ko'rish →</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 border-b border-gray-100">{['Vaqt', 'Foydalanuvchi', 'Restoran / Stol', 'Jami', 'Status'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {orderLogs.slice(0, 5).map(log => (
                        <tr key={log.id} className="cursor-pointer hover:bg-amber-50 transition-colors" onClick={() => setSelectedOrder(log)}>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmt(log.createdAt)}</td>
                          <td className="px-4 py-3 font-medium">{log.username || <span className="text-gray-400 italic">Mehmon</span>}</td>
                          <td className="px-4 py-3"><div className="font-semibold text-gray-900">{log.restaurantName}</div><div className="text-xs text-gray-400">Stol #{log.tableNumber}</div></td>
                          <td className="px-4 py-3 font-semibold text-emerald-700">{log.total.toLocaleString()} so'm</td>
                          <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[log.status]}`}>{STATUS_LABELS[log.status]}</span></td>
                        </tr>
                      ))}
                      {orderLogs.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-400">Hozircha zakazlar yo'q</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===== RESTAURANTS ===== */}
          {activeTab === 'restaurants' && (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2"><StoreIcon className="w-5 h-5 text-orange-500" /><span>Restoranlar ({restaurants.length})</span></h2>
                <button onClick={openAddRestaurant} className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">+ {t('new_restaurant_btn')}</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 border-b border-gray-100">{['Restoran', 'Egasi', 'Aloqa', 'Stollar', 'Login', 'Holat', 'Amallar'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {restaurants.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-400">Hozircha restoranlar yo'q.</td></tr>}
                    {restaurants.map(r => (
                      <tr key={r.username} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm">{(r.restaurantName || r.username).charAt(0).toUpperCase()}</div>
                            <div><div className="font-semibold text-gray-900">{r.restaurantName || r.username}</div><div className="text-xs text-gray-400">{r.email || '—'}</div></div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{r.ownerName || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{r.email || '—'}</td>
                        <td className="px-4 py-3"><span className="font-semibold text-gray-900">{r.tables || 0}</span></td>
                        <td className="px-4 py-3"><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg">{r.username}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold w-fit ${(r as any).isActive ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {(r as any).isActive ? 'Faol' : 'Nofaol'}
                            </span>
                            {(r as any).blocked && <span className="text-xs px-2 py-0.5 rounded-full font-semibold w-fit bg-red-100 text-red-700">Bloklangan</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => openEditRestaurant(r)} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg hover:bg-blue-100 font-medium transition-colors">{t('edit_btn2')}</button>
                            <button onClick={async () => {
                              try {
                                await subscriptionApi.toggleBlock((r as any).id);
                                refreshUsers();
                                toast.success((r as any).blocked ? 'Blok olib tashlandi' : 'Bloklandi');
                              } catch { toast.error('Xatolik'); }
                            }} className={`text-xs px-3 py-1.5 border rounded-lg font-medium transition-colors ${(r as any).blocked ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100' : 'bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100'}`}>
                              {(r as any).blocked ? 'Blokdan chiqarish' : 'Bloklash'}
                            </button>
                            <button onClick={() => handleDeleteUser(r.username)} className="text-xs px-3 py-1.5 bg-red-50 text-red-700 border border-red-100 rounded-lg hover:bg-red-100 font-medium transition-colors">{t('delete_btn2')}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== USERS ===== */}
          {activeTab === 'users' && (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2"><UsersIcon className="w-5 h-5 text-blue-600" /><span>Foydalanuvchilar ({users.length})</span></h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 border-b border-gray-100">{['Foydalanuvchi', 'Restoran', 'Aloqa', 'Turi', 'Amallar'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(user => (
                      <tr key={user.username} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${user.type === 'super-admin' ? 'bg-gradient-to-br from-red-400 to-orange-500' : 'bg-gradient-to-br from-blue-400 to-indigo-500'} rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0`}>{user.username.charAt(0).toUpperCase()}</div>
                            <div><div className="font-semibold text-gray-900">{user.username}</div><div className="text-xs text-gray-400">{user.ownerName || '—'}</div></div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><div className="text-gray-700">{user.restaurantName || '—'}</div><div className="text-xs text-gray-400">{user.tables ? `${user.tables} stol` : ''}</div></td>
                        <td className="px-4 py-3 text-gray-700">{user.email || '—'}</td>
                        <td className="px-4 py-3"><span className={typeBadge(user.type)}>{user.type === 'super-admin' ? 'Super Admin' : user.type === 'admin' ? 'Admin' : 'Foydalanuvchi'}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {user.type === 'customer' && <button onClick={() => { handleUpdateUserType(user.username, 'admin'); setTimeout(() => setPermissionsUser({ username: user.username, permissions: DEFAULT_PERMISSIONS }), 150); }} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors">{t('make_admin_btn')}</button>}
                            {user.type === 'admin' && (
                              <>
                                <button onClick={() => setActiveTab('restaurants')} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors">🏪 Restoran</button>
                                <button onClick={() => setPermissionsUser({ username: user.username, permissions: user.permissions || DEFAULT_PERMISSIONS })} className="text-xs px-2 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg hover:bg-purple-100 font-medium transition-colors">{t('permissions_btn')}</button>
                                <button onClick={() => handleUpdateUserType(user.username, 'super-admin')} className="text-xs px-2 py-1 bg-orange-50 text-orange-700 border border-orange-100 rounded-lg hover:bg-orange-100 transition-colors">{t('promote_btn')}</button>
                                <button onClick={() => handleUpdateUserType(user.username, 'customer')} className="text-xs px-2 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg hover:bg-green-100 transition-colors">{t('demote_btn')}</button>
                              </>
                            )}
                            {user.type === 'super-admin' && user.username !== 'superadmin' && <button onClick={() => handleUpdateUserType(user.username, 'admin')} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors">{t('demote_btn')}</button>}
                            {user.username !== 'superadmin' && <button onClick={() => handleDeleteUser(user.username)} className="text-xs px-2 py-1 bg-red-50 text-red-700 border border-red-100 rounded-lg hover:bg-red-100 transition-colors">{t('delete_btn2')}</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== ACTIVITY ===== */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input value={activitySearch} onChange={e => setActivitySearch(e.target.value)} placeholder="Qidirish: username, IP, mamlakat..." className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                <button onClick={() => { setActivityLogs(getActivityLogs()); toast.success('Yangilandi'); }} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">Yangilash</button>
                <button onClick={exportActivity} className="px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors">CSV Eksport</button>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2"><ActivityIcon className="w-5 h-5 text-purple-600" /><span>Foydalanuvchi Faolligi ({filteredActivity.length})</span></h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 border-b border-gray-100">{['Foydalanuvchi', 'IP Manzil', 'Joylashuv', 'Oxirgi faollik', 'Kirish soni', 'Qurilma'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredActivity.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-400">Ma'lumot yo'q. Foydalanuvchilar tizimga kirganda bu yerda ko'rinadi.</td></tr>}
                      {filteredActivity.map((log, i) => {
                        const userInfo = users.find(u => u.username === log.username);
                        return (
                          <tr key={i} className="cursor-pointer hover:bg-amber-50 transition-colors" onClick={() => setSelectedActivity(log)}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${userInfo?.type === 'super-admin' ? 'bg-red-500' : userInfo?.type === 'admin' ? 'bg-blue-500' : 'bg-green-500'}`}>{log.username.charAt(0).toUpperCase()}</div>
                                <div><div className="font-semibold">{log.username}</div><div className="text-xs text-gray-400">{userInfo?.type === 'super-admin' ? 'Super Admin' : userInfo?.type === 'admin' ? 'Admin' : 'Foydalanuvchi'}</div></div>
                              </div>
                            </td>
                            <td className="px-4 py-3"><span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded-lg">{log.ip}</span></td>
                            <td className="px-4 py-3"><div className="text-gray-700">{log.country}</div><div className="text-xs text-gray-400">{log.city}</div></td>
                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmt(log.lastSeen)}</td>
                            <td className="px-4 py-3"><span className="font-semibold text-gray-900">{log.loginCount}</span></td>
                            <td className="px-4 py-3 text-gray-600">{getDevice(log.userAgent)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===== ORDERS ===== */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <input value={orderSearch} onChange={e => setOrderSearch(e.target.value)} placeholder="Qidirish: username, restoran, IP..." className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                  <select value={orderRestaurantFilter} onChange={e => setOrderRestaurantFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white">
                    <option value="">{t('all_restaurants')}</option>
                    {restaurants.map(r => <option key={r.restaurantId} value={r.restaurantId || ''}>{r.restaurantName}</option>)}
                  </select>
                  <select value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white">
                    <option value="">{t('all_statuses')}</option>
                    <option value="pending">Kutilmoqda</option>
                    <option value="confirmed">Tasdiqlangan</option>
                    <option value="cancelled">Bekor qilingan</option>
                  </select>
                  <input type="date" value={orderDateFilter} onChange={e => setOrderDateFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setOrderSearch(''); setOrderRestaurantFilter(''); setOrderStatusFilter(''); setOrderDateFilter(''); }} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">{t('clear_btn')}</button>
                  <button onClick={exportOrders} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors">{t('csv_export')} ({filteredOrders.length})</button>
                  {orderLogs.length > 0 && <button onClick={() => { clearLogs(); toast.success(t('saved')); }} className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-100 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">{t('delete_all_btn')}</button>}
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2"><OrdersIcon className="w-5 h-5 text-green-600" /><span>Zakazlar ({filteredOrders.length})</span></h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 border-b border-gray-100">{['Vaqt', 'Foydalanuvchi', 'Restoran / Stol', 'Taomlar', 'Jami', 'To\'lov', 'IP / Joylashuv', 'Status'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredOrders.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray-400">{ t('no_orders_found') }</td></tr>}
                      {filteredOrders.map(log => (
                        <tr key={log.id} className="cursor-pointer hover:bg-amber-50 transition-colors" onClick={() => setSelectedOrder(log)}>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmt(log.createdAt)}</td>
                          <td className="px-4 py-3"><span className={`font-medium ${log.username ? 'text-gray-900' : 'text-gray-400 italic'}`}>{log.username || 'Mehmon'}</span></td>
                          <td className="px-4 py-3"><div className="font-semibold text-gray-900">{log.restaurantName}</div><div className="text-xs text-gray-400">Stol #{log.tableNumber}</div></td>
                          <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{log.items.slice(0, 2).map((item, i) => <span key={i} className="inline-block bg-gray-100 rounded-lg px-1.5 py-0.5 text-xs">{item.name} ×{item.quantity}</span>)}{log.items.length > 2 && <span className="text-gray-400 text-xs">+{log.items.length - 2}</span>}</div></td>
                          <td className="px-4 py-3 font-semibold text-emerald-700 whitespace-nowrap">{log.total.toLocaleString()} so'm</td>
                          <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-lg font-medium ${log.paymentMethod === 'CASH' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{log.paymentMethod === 'CASH' ? 'Naqd' : 'Karta'}</span></td>
                          <td className="px-4 py-3"><div className="font-mono text-xs text-gray-600">{log.ip}</div><div className="text-xs text-gray-400">{log.city}, {log.country}</div></td>
                          <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[log.status]}`}>{STATUS_LABELS[log.status]}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===== PAYMENTS ===== */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">To'lovlar</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Obuna to'lovlarini ko'rish va tasdiqlash</p>
                </div>
                <div className="flex gap-2">
                  {(['', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(s => (
                    <button key={s} onClick={() => { setPaymentsStatusFilter(s); loadPayments(s || undefined); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${paymentsStatusFilter === s ? 'bg-amber-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-300'}`}>
                      {s === '' ? 'Barchasi' : s === 'PENDING' ? 'Kutilmoqda' : s === 'APPROVED' ? 'Tasdiqlangan' : 'Rad etilgan'}
                    </button>
                  ))}
                </div>
              </div>

              {paymentsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
                </div>
              ) : payments.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-xl p-12 text-center text-gray-400">
                  Hozircha to'lovlar yo'q
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((p: any) => (
                    <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Screenshot */}
                        {p.screenshotUrl ? (
                          <button
                            type="button"
                            onClick={() => setScreenshotModal(p.screenshotUrl)}
                            className="shrink-0 group relative"
                            title="Kattalashtirish uchun bosing"
                          >
                            <img
                              src={p.screenshotUrl}
                              alt="Chek"
                              className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200 group-hover:border-amber-400 transition-all"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-all flex items-center justify-center">
                              <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </button>
                        ) : (
                          <div className="shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900">{p.user?.restaurantName || p.user?.username || '—'}</span>
                            <span className="text-xs text-gray-400">{p.user?.email || '—'}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : p.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {p.status === 'PENDING' ? 'Kutilmoqda' : p.status === 'APPROVED' ? 'Tasdiqlangan' : 'Rad etildi'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span>Summa: <span className="font-semibold text-gray-900">{p.amount?.toLocaleString()} so'm</span></span>
                            <span>Sana: <span className="font-medium">{fmt(p.createdAt)}</span></span>
                            <span>Usul: <span className="font-medium">{p.paymentMethod || 'MANUAL'}</span></span>
                          </div>
                          {p.comment && <p className="text-xs text-gray-500 mt-1">Izoh: {p.comment}</p>}
                          {p.adminNote && <p className="text-xs text-red-600 mt-1">Admin izohi: {p.adminNote}</p>}
                        </div>
                        {/* Actions */}
                        {p.status === 'PENDING' && (
                          <div className="flex flex-col gap-2 shrink-0 min-w-[180px]">
                            <button onClick={async () => {
                              try {
                                await subscriptionApi.reviewPayment(p.id, 'approve');
                                toast.success('Tasdiqlandi! Hisob faollashdi.');
                                loadPayments(paymentsStatusFilter || undefined);
                                loadUsers();
                              } catch { toast.error('Xatolik yuz berdi'); }
                            }} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors">
                              ✓ Tasdiqlash
                            </button>
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                placeholder="Rad etish sababi (ixtiyoriy)..."
                                value={rejectNoteMap[p.id] || ''}
                                onChange={e => setRejectNoteMap(prev => ({ ...prev, [p.id]: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-red-400"
                              />
                              <button onClick={async () => {
                                try {
                                  await subscriptionApi.reviewPayment(p.id, 'reject', rejectNoteMap[p.id] || '');
                                  toast.success('Rad etildi');
                                  setRejectNoteMap(prev => { const n = { ...prev }; delete n[p.id]; return n; });
                                  loadPayments(paymentsStatusFilter || undefined);
                                } catch { toast.error('Xatolik yuz berdi'); }
                              }} className="w-full px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">
                                ✕ Rad etish
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== SETTINGS ===== */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sozlamalar</h1>
                <p className="text-sm text-gray-500 mt-0.5">Tizim va profil sozlamalari</p>
              </div>

              {/* System info */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <InfoIcon className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">{t('system_info')}</h3>
                </div>
                <div className="p-5 grid grid-cols-2 gap-4">
                  {[
                    { label: t('user_col'), value: username || '—' },
                    { label: t('type_col'), value: t('super_admin_role') },
                    { label: t('restaurants_count'), value: String(restaurants.length) },
                    { label: t('users_count'), value: String(users.length) },
                    { label: t('orders'), value: String(orderLogs.length) },
                    { label: t('total_revenue'), value: totalRevenue.toLocaleString() + ' ' + t('som') },
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                      <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Til tanlash */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <GlobeIcon className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">{t('language')}</h3>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-500 mb-4">{t('interface_lang_label')}. {t('try_again')}.</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { code: 'uz' as const, label: "O'zbek", flag: '🇺🇿', desc: "O'zbek tili" },
                      { code: 'ru' as const, label: 'Русский', flag: '🇷🇺', desc: 'Rus tili' },
                      { code: 'en' as const, label: 'English', flag: '🇬🇧', desc: 'Ingliz tili' },
                    ].map(l => (
                      <button key={l.code} onClick={() => { setLang(l.code); setSettingsLang(l.code); toast.success(`Til o'zgartirildi: ${l.label}`); }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${lang === l.code ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                        <span className="text-2xl">{l.flag}</span>
                        <span className={`text-sm font-semibold ${lang === l.code ? 'text-indigo-700' : 'text-gray-700'}`}>{l.label}</span>
                        <span className="text-xs text-gray-400">{l.desc}</span>
                        {lang === l.code && <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-semibold">{t('active_status')}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Xavfsizlik */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <ShieldIcon className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-semibold text-gray-900">{t('security_section')}</h3>
                </div>
                <div className="p-5 space-y-3">
                  <p className="text-sm text-gray-500">Hisobingiz xavfsizligini ta'minlash uchun kuchli parol o'rnating.</p>
                  <button onClick={() => setShowChangePasswordModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors">
                    <ShieldIcon className="w-4 h-4" />
                    {t('change_password_btn')}
                  </button>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-xs text-blue-700 font-medium">{t('security_tip')}</p>
                    <p className="text-xs text-blue-600 mt-1">{t('security_tip_desc')}</p>
                  </div>
                </div>
              </div>

              {/* Xavfli zona */}
              <div className="bg-white border border-red-100 rounded-xl overflow-hidden">
                <button onClick={() => setShowDangerZone(!showDangerZone)}
                  className="w-full px-5 py-4 border-b border-red-100 flex items-center justify-between hover:bg-red-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="font-semibold text-red-700">{t('danger_zone')}</h3>
                  </div>
                  <span className={`text-gray-400 transition-transform duration-200 ${showDangerZone ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {showDangerZone && (
                  <div className="p-5 space-y-3">
                    <p className="text-sm text-red-600">{t('danger_zone_desc')}</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={() => { clearLogs(); toast.success(t('deleted')); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        {t('delete_all_orders')}
                      </button>
                      <Link to="/" onClick={() => { localStorage.clear(); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
                        <LogoutIcon className="w-4 h-4" />
                        {t('sign_out_btn')}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ===== ACTIVITY DETAIL MODAL ===== */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedActivity(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Foydalanuvchi tafsiloti</h3>
              <button onClick={() => setSelectedActivity(null)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Username', value: selectedActivity.username },
                { label: 'Kirish soni', value: String(selectedActivity.loginCount) },
                { label: 'IP Manzil', value: selectedActivity.ip },
                { label: 'Mamlakat', value: selectedActivity.country },
                { label: 'Shahar', value: selectedActivity.city },
                { label: 'Qurilma', value: getDevice(selectedActivity.userAgent) },
                { label: 'Brauzer', value: getBrowser(selectedActivity.userAgent) },
                { label: 'Oxirgi faollik', value: fmt(selectedActivity.lastSeen) },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900 break-all">{item.value}</p>
                </div>
              ))}
            </div>
            {selectedActivity.loginHistory?.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Kirish tarixi (so'nggi {selectedActivity.loginHistory.length} ta)</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedActivity.loginHistory.map((h, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 text-xs">
                      <span className="font-mono text-gray-600">{h.ip}</span>
                      <span className="text-gray-500">{h.city}, {h.country}</span>
                      <span className="text-gray-400">{fmt(h.time)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== ORDER DETAIL MODAL ===== */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Zakaz tafsiloti</h3>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Foydalanuvchi', value: selectedOrder.username || 'Mehmon' },
                { label: 'Vaqt', value: fmt(selectedOrder.createdAt) },
                { label: 'Restoran', value: selectedOrder.restaurantName },
                { label: 'Stol', value: `#${selectedOrder.tableNumber}` },
                { label: 'IP Manzil', value: selectedOrder.ip },
                { label: 'Joylashuv', value: `${selectedOrder.city}, ${selectedOrder.country}` },
                { label: 'Qurilma', value: selectedOrder.deviceType },
                { label: 'To\'lov', value: selectedOrder.paymentMethod === 'CASH' ? 'Naqd pul' : 'Plastik karta' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900 break-all">{item.value}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Buyurtma qilingan taomlar</p>
              <div className="space-y-2">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                    <span className="text-sm text-gray-800">{item.name}</span>
                    <span className="text-xs text-gray-500">×{item.quantity}</span>
                    <span className="text-sm font-semibold text-gray-900">{(item.price * item.quantity).toLocaleString()} so'm</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                <span className="font-bold text-gray-900">Jami:</span>
                <span className="font-bold text-emerald-700 text-lg">{selectedOrder.total.toLocaleString()} so'm</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Status</p>
              <span className={`inline-block text-sm px-3 py-1.5 rounded-full font-semibold ${STATUS_COLORS[selectedOrder.status]}`}>{STATUS_LABELS[selectedOrder.status]}</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== RESTAURANT MODAL ===== */}
      {showRestaurantModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">{editingRestaurant ? t('edit_btn2') : t('new_restaurant_btn')}</h3>
            <div className="space-y-3">
              {!editingRestaurant && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Login *</label><input id="rest-username" name="rest-username" type="text" value={restaurantForm.username} onChange={e => setRestaurantForm({ ...restaurantForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} placeholder="admin_login" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400" autoComplete="username" /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Parol *</label><input id="rest-password" name="rest-password" type="password" value={restaurantForm.password} onChange={e => setRestaurantForm({ ...restaurantForm, password: e.target.value })} placeholder="Kamida 6 ta belgi" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400" autoComplete="new-password" /></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Restoran nomi *</label><input id="rest-name" name="rest-name" type="text" value={restaurantForm.restaurantName} onChange={e => setRestaurantForm({ ...restaurantForm, restaurantName: e.target.value })} placeholder="Oqtepa Lavash" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Egasi *</label><input id="rest-owner" name="rest-owner" type="text" value={restaurantForm.ownerName} onChange={e => setRestaurantForm({ ...restaurantForm, ownerName: e.target.value })} placeholder="To'liq ism" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Email</label><input id="rest-email" name="rest-email" type="email" value={restaurantForm.email} onChange={e => setRestaurantForm({ ...restaurantForm, email: e.target.value })} placeholder="info@restoran.uz" className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400" autoComplete="email" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Stollar soni</label><input id="rest-tables" name="rest-tables" type="number" min="1" max="100" value={restaurantForm.tables} onChange={e => setRestaurantForm({ ...restaurantForm, tables: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowRestaurantModal(false)} className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Bekor qilish</button>
              <button onClick={handleSaveRestaurant} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">{editingRestaurant ? 'Saqlash' : 'Qo\'shish'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PERMISSIONS MODAL ===== */}
      {permissionsUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setPermissionsUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">Admin Ruxsatlari</h3>
              <button onClick={() => setPermissionsUser(null)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">✕</button>
            </div>
            <p className="text-sm text-gray-500 mb-1"><span className="font-semibold text-gray-700">{permissionsUser.username}</span> uchun vakolatlar</p>
            <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 mb-5">Tizim vakolatlari xavfli — faqat ishonchli adminlarga bering</p>

            <div className="grid grid-cols-3 gap-2 mb-5">
              <button onClick={() => setPermissionsUser({ ...permissionsUser, permissions: DEFAULT_PERMISSIONS })} className="text-xs py-2 px-2 bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 font-medium transition-colors">Standart admin</button>
              <button onClick={() => setPermissionsUser({ ...permissionsUser, permissions: { manageMenu: false, manageOrders: true, viewReports: true, manageQR: false, manageSettings: false, manageUsers: false, promoteToSuperAdmin: false, manageRestaurants: false, viewActivityLogs: false, exportData: false } })} className="text-xs py-2 px-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl hover:bg-yellow-100 font-medium transition-colors">Faqat buyurtmalar</button>
              <button onClick={() => setPermissionsUser({ ...permissionsUser, permissions: { manageMenu: true, manageOrders: true, viewReports: true, manageQR: true, manageSettings: true, manageUsers: true, promoteToSuperAdmin: false, manageRestaurants: true, viewActivityLogs: true, exportData: true } })} className="text-xs py-2 px-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl hover:bg-purple-100 font-medium transition-colors">Kengaytirilgan</button>
            </div>

            <div className="space-y-5 mb-6">
              {PERMISSION_GROUPS.map(group => (
                <div key={group.label}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{group.label}</p>
                  <div className="space-y-2">
                    {group.keys.map(key => {
                      const info = PERMISSION_LABELS[key];
                      const checked = permissionsUser.permissions[key];
                      return (
                        <label key={key} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${checked ? info.danger ? 'border-orange-300 bg-orange-50' : 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                          <input type="checkbox" checked={checked} onChange={e => setPermissionsUser({ ...permissionsUser, permissions: { ...permissionsUser.permissions, [key]: e.target.checked } })} className="mt-0.5 w-4 h-4 rounded" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-semibold ${checked ? (info.danger ? 'text-orange-800' : 'text-blue-800') : 'text-gray-700'}`}>{info.label}</p>
                              {info.danger && <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-lg font-medium shrink-0">Xavfli</span>}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{info.description}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${checked ? (info.danger ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800') : 'bg-gray-100 text-gray-500'}`}>{checked ? 'Ruxsat' : 'Taqiq'}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPermissionsUser(null)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">Bekor qilish</button>
              <button onClick={async () => {
                const user = users.find(u => u.username === permissionsUser.username);
                try {
                  if (user && (user as any).id) {
                    await authApi.updatePermissions((user as any).id, permissionsUser.permissions as unknown as Record<string, boolean>);
                  } else {
                    updatePermissions(permissionsUser.username, permissionsUser.permissions);
                  }
                  refreshUsers(); toast.success(`${permissionsUser.username} ruxsatlari saqlandi`); setPermissionsUser(null);
                } catch {
                  if (updatePermissions(permissionsUser.username, permissionsUser.permissions)) {
                    refreshUsers(); toast.success(`${permissionsUser.username} ruxsatlari saqlandi`); setPermissionsUser(null);
                  }
                }
              }} className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors">Saqlash</button>
            </div>
          </div>
        </div>
      )}

      <ChangePasswordModal isOpen={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)} userType="super-admin" username={username || ''} />

      {/* Screenshot Modal */}
      {screenshotModal && (
        <div
          className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setScreenshotModal(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setScreenshotModal(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white text-sm font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Yopish
            </button>
            <img
              src={screenshotModal}
              alt="To'lov cheki"
              className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdmin;
