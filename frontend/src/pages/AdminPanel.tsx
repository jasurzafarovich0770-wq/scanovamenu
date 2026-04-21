import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useLangStore, translations } from '../store/useLangStore';
import ChangePasswordModal from '../components/ChangeCodeModal';
import { menuApi, orderApi, authApi, subscriptionApi } from '../lib/api';
import { StoreIcon, ScanIcon, HomeIcon, DashboardIcon, OrdersIcon, MenuBookIcon, CategoryIcon, QRIcon, TableIcon, RevenueIcon, UserIcon, TrashIcon, XCircleIcon } from '../components/Icons';
import ReceiptModal from '../components/ReceiptModal';
import ThemeToggle from '../components/ThemeToggle';
import PaymentStatusBanner from '../components/PaymentStatusBanner';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';

interface MenuItem {
  id: string; name: string; description: string; price: number; categoryId: string;
  category?: { id: string; name: string; }; isAvailable: boolean; image?: string; preparationTime?: number;
}
interface MenuCategory {
  id: string; name: string; description?: string; displayOrder: number; isActive: boolean;
}
interface Order {
  id: string; orderNumber: string; tableNumber: string; items: any[]; total: number;
  status: string; orderType?: string; createdAt: string; paymentMethod: string;
  waiterCalled?: boolean;
}

// Tavsiya etiladigan kategoriyalar
const SUGGESTED_CATEGORIES = {
  'Milliy taomlar': ['Osh', 'Shashlik', 'Manti', 'Lag\'mon', 'Dimlama', 'Mastava', 'Shurpa', 'Norin', 'Chuchvara', 'Somsa', 'Qozon kabob', 'Tandir kabob', 'Qovurma', 'Dolma', 'Halim', 'Naryn', 'Beshbarmaq', 'Qozon osh'],
  'Fast Food': ['Burger', 'Hot Dog', 'Shawarma', 'Lavash', 'Sandwich', 'Nuggets', 'Kartoshka fri', 'Pitsa', 'Donner', 'Wrap', 'Taco', 'Quesadilla'],
  'Sho\'rvalar': ['Mastava', 'Shurpa', 'Lagmon sho\'rva', 'Ugra', 'Mosho\'rva', 'Qovoq sho\'rva', 'Tovuq sho\'rva'],
  'Salatlar': ['Achichuk', 'Toshkent salati', 'Olivye', 'Vinegret', 'Ko\'k salat', 'Gretsiya salati', 'Sezar salati'],
  'Ichimliklar': ['Choy', 'Qahva', 'Sharbat', 'Kompot', 'Ayron', 'Kola', 'Limonad', 'Mineral suv', 'Smoothie', 'Milkshake'],
  'Desertlar': ['Halvo', 'Pishiriq', 'Tort', 'Muzqaymoq', 'Chak-chak', 'Baklava', 'Tiramisu', 'Cheesecake', 'Brownie'],
  'Non va xamirli': ['Non', 'Patir', 'Kulcha', 'Lavash', 'Somsa', 'Samsa', 'Pirozhki', 'Croissant'],
  'Qo\'shimcha': ['Sous', 'Ketchup', 'Mayyonez', 'Sarimsoq sous', 'Lavash', 'Non'],
};

// Kategoriya modal komponenti
interface CategoryModalProps {
  title: string;
  name: string;
  description: string;
  displayOrder: number;
  loading: boolean;
  onChangeName: (v: string) => void;
  onChangeDescription: (v: string) => void;
  onChangeOrder: (v: number) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  submitClass: string;
}

function CategoryModal({ title, name, description, displayOrder, loading, onChangeName, onChangeDescription, onChangeOrder, onCancel, onSubmit, submitLabel, submitClass }: CategoryModalProps) {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const { lang } = useLangStore();
  const t = useMemo(() => (key: string) => translations[lang]?.[key] || translations['uz']?.[key] || key, [lang]);

  return (
    <div className="fixed inset-0 modal-overlay-modern flex items-center justify-center p-4 z-[200] animate-fade-in">
      <div className="modal-content-modern max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto animate-scale-in bg-white">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Kategoriya sozlamalari</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Quick Selection */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-inner">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
               Tezkor tanlov
             </p>
             <div className="space-y-2">
               {Object.entries(SUGGESTED_CATEGORIES).map(([group, items]) => (
                 <div key={group} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                   <button
                     type="button"
                     onClick={() => setActiveGroup(activeGroup === group ? null : group)}
                     className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-xs font-black text-slate-600 uppercase tracking-wider"
                   >
                     <span>{group}</span>
                     <span className={`text-slate-300 transition-transform duration-300 ${activeGroup === group ? 'rotate-180' : ''}`}>▼</span>
                   </button>
                   {activeGroup === group && (
                     <div className="p-3 flex flex-wrap gap-1.5 border-t border-slate-50">
                       {items.map((item) => (
                         <button
                           key={item}
                           type="button"
                           onClick={() => onChangeName(item)}
                           className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                             name === item
                               ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                               : 'bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                           }`}
                         >
                           {item}
                         </button>
                       ))}
                     </div>
                   )}
                 </div>
               ))}
             </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Nomi</label>
              <input
                type="text"
                value={name}
                onChange={(e) => onChangeName(e.target.value)}
                placeholder="Masalan: Milliy taomlar..."
                className="input-modern w-full font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Tartib</label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => onChangeOrder(Number(e.target.value))}
                  className="input-modern w-full font-bold"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Tavsif</label>
              <textarea
                value={description}
                onChange={(e) => onChangeDescription(e.target.value)}
                rows={2}
                className="input-modern w-full resize-none text-sm font-medium"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-10">
          <button onClick={onCancel} className="btn-secondary flex-1 py-3 text-xs uppercase tracking-widest font-black">{t('cancel_btn')}</button>
          <button onClick={onSubmit} disabled={loading} className={`${submitClass} flex-1 py-3 text-xs uppercase tracking-widest font-black shadow-lg`}>
            {loading ? <div className="spinner !w-4 !h-4" /> : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}


function AdminPanel() {
  const { restaurantId, username, permissions, updateUser, isActive } = useAuthStore();
  const { lang, setLang } = useLangStore();
  const t = useMemo(() => (key: string) => translations[lang]?.[key] || translations['uz']?.[key] || key, [lang]);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'menu' | 'categories' | 'qr' | 'settings'>('dashboard');
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({ name: '', description: '', price: 0, categoryId: '', isAvailable: true, preparationTime: 15, image: '' });
  const [newCategory, setNewCategory] = useState<Partial<MenuCategory>>({ name: '', description: '', displayOrder: 0 });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [editImagePreview, setEditImagePreview] = useState<string>('');
  const [qrDataUrls, setQrDataUrls] = useState<Record<number, string>>({});
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [latestPayment, setLatestPayment] = useState<{ status: string; adminNote?: string } | null>(null);
  const [statusLoaded, setStatusLoaded] = useState(false);

  const allUsers = useAuthStore.getState().getAllUsers();
  const currentUser = allUsers.find(u => u.username === username);
  const restaurantName = currentUser?.restaurantName || 'Mening Restoranim';
  const [restaurantTables, setRestaurantTables] = useState(currentUser?.tables || 10);

  const [adminServiceFeePercent, setAdminServiceFeePercent] = useState(currentUser?.serviceFeePercent ?? 10);
  const [restaurantForm, setRestaurantForm] = useState({
    restaurantName: currentUser?.restaurantName || '',
    ownerName: currentUser?.ownerName || '',
    email: currentUser?.email || '',
    tables: currentUser?.tables || 10,
  });
  const [restaurantSaving, setRestaurantSaving] = useState(false);

  const currentRestaurant = {
    id: restaurantId || 'demo-restaurant',
    name: restaurantName,
    tables: restaurantTables,
    revenue: orders.reduce((sum, o) => sum + o.total, 0),
  };

  // isActive + restaurantId ni backend dan yangilash + polling
  useEffect(() => {
    const checkStatus = () => {
      authApi.getMe().then(res => {
        const me = res.data?.data;
        if (!me) { setStatusLoaded(true); return; }

        const currentRid = useAuthStore.getState().restaurantId;
        const updates: Record<string, any> = {};
        if (me.isActive !== undefined) updates.isActive = me.isActive;
        if (me.restaurantId) updates.restaurantId = me.restaurantId;
        if (Object.keys(updates).length > 0) useAuthStore.setState(updates);
        if (me.tables && me.tables > 0) setRestaurantTables(me.tables);
        setStatusLoaded(true);

        // isActive=true bo'lganda menu va ordersni yuklash
        if (me.isActive && me.restaurantId) {
          setTimeout(() => {
            loadMenuData();
            loadOrders();
          }, 150);
        }
      }).catch(() => { setStatusLoaded(true); });

      subscriptionApi.getMyPayments().then(res => {
        const payments: any[] = res.data?.data || [];
        if (payments.length > 0) setLatestPayment(payments[0]);
      }).catch(() => {});
    };

    checkStatus();

    const interval = setInterval(() => {
      if (!useAuthStore.getState().isActive) checkStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Faqat isActive=true bo'lganda yuklash
    if (restaurantId && isActive) {
      loadMenuData();
      loadOrders();
    }
  }, [restaurantId, isActive]);

  useEffect(() => {
    const currentRestaurantId = restaurantId || useAuthStore.getState().restaurantId;
    if (activeTab === 'qr' && currentRestaurantId) generateAllQRCodes();
  }, [activeTab, restaurantId, restaurantTables]);

  useEffect(() => {
    if (activeTab === 'orders' && restaurantId) {
      const interval = setInterval(() => loadOrders(), 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, restaurantId]);

  const generateAllQRCodes = async () => {
    const currentRestaurantId = restaurantId || useAuthStore.getState().restaurantId;
    if (!currentRestaurantId) return;
    const baseUrl = window.location.origin;
    const newQrUrls: Record<number, string> = {};
    for (let i = 1; i <= restaurantTables; i++) {
      try {
        newQrUrls[i] = await QRCode.toDataURL(`${baseUrl}/r/${currentRestaurantId}/t/${i}`, { width: 256, margin: 2, color: { dark: '#1e40af', light: '#ffffff' }, errorCorrectionLevel: 'H' });
      } catch (err) { console.error(`QR ${i} xatolik:`, err); }
    }
    setQrDataUrls(newQrUrls);
  };

  const downloadQR = (tableNumber: number, dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl; link.download = `${currentRestaurant.name}-stol-${tableNumber}-qr.png`; link.click();
  };
  const downloadAllQRs = () => Object.entries(qrDataUrls).forEach(([table, dataUrl]) => setTimeout(() => downloadQR(Number(table), dataUrl), Number(table) * 200));

  const loadOrders = async () => {
    const currentRestaurantId = restaurantId || useAuthStore.getState().restaurantId;
    if (!currentRestaurantId) return;
    setOrdersLoading(true);
    try {
      const response = await orderApi.getByRestaurant(currentRestaurantId);
      const ordersData = response.data?.data?.data || response.data?.data || [];
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (err) { console.error('Orders load error:', err); }
    finally { setOrdersLoading(false); }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await orderApi.updateStatus(orderId, newStatus);
      await loadOrders();
      toast.success(t('order_status_updated'));
    } catch { toast.error(t('error_occurred')); }
  };

  const handleDismissWaiterCall = async (orderId: string) => {
    try {
      await orderApi.dismissWaiterCall(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, waiterCalled: false } : o));
    } catch { /* ignore */ }
  };

  const loadMenuData = async () => {
    let currentRestaurantId = restaurantId || useAuthStore.getState().restaurantId;
    // restaurantId yo'q bo'lsa — backend dan olish
    if (!currentRestaurantId) {
      try {
        const res = await authApi.getMe();
        const me = res.data?.data;
        if (me?.restaurantId) {
          useAuthStore.setState({ restaurantId: me.restaurantId });
          currentRestaurantId = me.restaurantId;
        }
      } catch { /* ignore */ }
    }
    if (!currentRestaurantId) return; // xato ko'rsatmasdan chiqish
    setLoading(true); setError(null);
    try {
      const [itemsRes, categoriesRes] = await Promise.all([menuApi.getItemsByRestaurant(currentRestaurantId), menuApi.getCategoriesByRestaurant(currentRestaurantId)]);
      setMenuItems(itemsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || '';
      // 403 ACCOUNT_INACTIVE — xato ko'rsatmaslik
      if (err.response?.status !== 403) {
        setError('Menyu yuklashda xatolik: ' + msg);
      }
    } finally { setLoading(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Rasm hajmi 5MB dan kichik bo\'lishi kerak'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Faqat rasm fayllari qabul qilinadi'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (isEdit && editingItem) { setEditingItem({ ...editingItem, image: base64String }); setEditImagePreview(base64String); }
      else { setNewItem({ ...newItem, image: base64String }); setImagePreview(base64String); }
    };
    reader.readAsDataURL(file);
  };

  const addMenuItem = async () => {
    let currentRestaurantId = restaurantId || useAuthStore.getState().restaurantId;
    if (!currentRestaurantId) {
      try {
        const res = await authApi.getMe();
        const me = res.data?.data;
        if (me?.restaurantId) { useAuthStore.setState({ restaurantId: me.restaurantId }); currentRestaurantId = me.restaurantId; }
      } catch { /* ignore */ }
    }
    if (!newItem.name || !newItem.price || !newItem.categoryId || !currentRestaurantId) { toast.error('Barcha majburiy maydonlarni to\'ldiring'); return; }
    if (newItem.price <= 0) { toast.error('Narx 0 dan katta bo\'lishi kerak'); return; }
    setLoading(true); setError(null);
    try {
      const response = await menuApi.createItem({ restaurantId: currentRestaurantId, categoryId: newItem.categoryId!, name: newItem.name!, description: newItem.description || '', price: newItem.price!, isAvailable: newItem.isAvailable ?? true, preparationTime: newItem.preparationTime || 15, image: newItem.image || undefined });
      setMenuItems([...menuItems, response.data.data]);
      setNewItem({ name: '', description: '', price: 0, categoryId: '', isAvailable: true, preparationTime: 15, image: '' });
      setImagePreview(''); setShowAddMenuModal(false);
      toast.success('Ovqat muvaffaqiyatli qo\'shildi!');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Ovqat qo\'shishda xatolik';
      toast.error('Xatolik: ' + msg); setError(msg);
    } finally { setLoading(false); }
  };

  const updateMenuItem = async () => {
    if (!editingItem) return;
    if (!editingItem.name || !editingItem.price || !editingItem.categoryId) { toast.error('Barcha majburiy maydonlarni to\'ldiring'); return; }
    setLoading(true); setError(null);
    try {
      const response = await menuApi.updateItem(editingItem.id, { name: editingItem.name, description: editingItem.description, price: editingItem.price, categoryId: editingItem.categoryId, isAvailable: editingItem.isAvailable, preparationTime: editingItem.preparationTime, image: editingItem.image });
      setMenuItems(menuItems.map(item => item.id === editingItem.id ? response.data.data : item));
      setEditingItem(null); setEditImagePreview('');
      toast.success('Ovqat muvaffaqiyatli yangilandi!');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Yangilashda xatolik';
      toast.error('Xatolik: ' + msg); setError(msg);
    } finally { setLoading(false); }
  };

  const deleteMenuItem = async (id: string) => {
    setLoading(true); setError(null);
    try {
      await menuApi.deleteItem(id);
      setMenuItems(menuItems.filter(item => item.id !== id));
      toast.success('Ovqat o\'chirildi!');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'O\'chirishda xatolik';
      toast.error('Xatolik: ' + msg); setError(msg);
    } finally { setLoading(false); }
  };

  const toggleItemAvailability = async (id: string) => {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;
    setLoading(true);
    try {
      const response = await menuApi.updateItem(id, { isAvailable: !item.isAvailable });
      setMenuItems(menuItems.map(i => i.id === id ? response.data.data : i));
    } catch (err: any) {
      toast.error('Holat o\'zgartirishda xatolik');
    } finally { setLoading(false); }
  };

  const addCategory = async () => {
    if (!newCategory.name?.trim()) { toast.error('Kategoriya nomini kiriting'); return; }
    let currentRestaurantId = restaurantId || useAuthStore.getState().restaurantId;
    if (!currentRestaurantId) {
      try {
        const res = await authApi.getMe();
        const me = res.data?.data;
        if (me?.restaurantId) { useAuthStore.setState({ restaurantId: me.restaurantId }); currentRestaurantId = me.restaurantId; }
      } catch { /* ignore */ }
    }
    if (!currentRestaurantId) { toast.error('Restaurant ID topilmadi. Qayta login qiling.'); return; }
    setLoading(true); setError(null);
    try {
      const response = await menuApi.createCategory({ restaurantId: currentRestaurantId, name: newCategory.name!, description: newCategory.description || '', displayOrder: newCategory.displayOrder || 0 });
      setCategories([...categories, response.data.data]);
      setNewCategory({ name: '', description: '', displayOrder: 0 }); setShowAddCategoryModal(false);
      toast.success('Kategoriya qo\'shildi!');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Kategoriya qo\'shishda xatolik';
      toast.error('Xatolik: ' + msg); setError(msg);
    } finally { setLoading(false); }
  };

  const updateCategory = async () => {
    if (!editingCategory) return;
    setLoading(true);
    try {
      const response = await menuApi.updateCategory(editingCategory.id, { name: editingCategory.name, description: editingCategory.description, displayOrder: editingCategory.displayOrder });
      setCategories(categories.map(cat => cat.id === editingCategory.id ? response.data.data : cat));
      setEditingCategory(null); toast.success('Kategoriya yangilandi!');
    } catch { toast.error('Kategoriyani yangilashda xatolik'); }
    finally { setLoading(false); }
  };

  const deleteCategory = async (id: string) => {
    setLoading(true);
    try {
      await menuApi.deleteCategory(id);
      setCategories(categories.filter(cat => cat.id !== id));
      setMenuItems(menuItems.filter(item => item.categoryId !== id));
      toast.success('Kategoriya o\'chirildi!');
    } catch { toast.error('Kategoriyani o\'chirishda xatolik'); }
    finally { setLoading(false); }
  };

  const filteredMenuItems = selectedCategory === 'all' ? menuItems : menuItems.filter(item => item.categoryId === selectedCategory);

  type TabKey = 'dashboard' | 'orders' | 'categories' | 'menu' | 'qr' | 'settings';
  const allTabs: { key: TabKey; label: string; icon: React.ReactNode; show: boolean }[] = [
    { key: 'dashboard', label: t('dashboard'), icon: <DashboardIcon className="w-4 h-4" />, show: permissions?.viewReports !== false },
    { key: 'orders', label: t('orders'), icon: <OrdersIcon className="w-4 h-4" />, show: permissions?.manageOrders !== false },
    { key: 'categories', label: t('categories'), icon: <CategoryIcon className="w-4 h-4" />, show: permissions?.manageMenu !== false },
    { key: 'menu', label: t('menu'), icon: <MenuBookIcon className="w-4 h-4" />, show: permissions?.manageMenu !== false },
    { key: 'settings', label: t('settings'), icon: <UserIcon className="w-4 h-4" />, show: permissions?.manageSettings !== false },
    { key: 'qr', label: t('qr_codes'), icon: <QRIcon className="w-4 h-4" />, show: permissions?.manageQR !== false },
  ];
  const tabs = allTabs.filter(t => t.show);

  // Paywall — isActive false bo'lsa to'lov sahifasiga yo'naltirish
  const isAccountActive = !statusLoaded ? true : isActive;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Paywall Banner */}
      <PaymentStatusBanner
        isActive={isAccountActive}
        latestPayment={latestPayment}
        onRefresh={() => {
          authApi.getMe().then(res => {
            const me = res.data?.data;
            if (me?.isActive !== undefined) useAuthStore.setState({ isActive: me.isActive });
          }).catch(() => {});
          subscriptionApi.getMyPayments().then(res => {
            const payments: any[] = res.data?.data || [];
            if (payments.length > 0) setLatestPayment(payments[0]);
          }).catch(() => {});
        }}
      />
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-[60]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
              <StoreIcon className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-none">{currentRestaurant.name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{t('admin_panel')}</p>
            </div>
          </Link>

          {/* Center — badges */}
          <div className="flex items-center gap-2">
            {orders.filter(o => o.status === 'PENDING').length > 0 && (
              <button onClick={() => setActiveTab('orders')}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                {orders.filter(o => o.status === 'PENDING').length} {t('new_orders_badge')}
              </button>
            )}
            {orders.filter(o => o.waiterCalled).length > 0 && (
              <button onClick={() => setActiveTab('orders')}
                className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-xl text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-colors animate-pulse">
                🛎️ {orders.filter(o => o.waiterCalled).length} {t('waiter_badge')}
              </button>
            )}
          </div>

          {/* Right actions */}
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
            <Link to="/scanner"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors">
              <ScanIcon className="w-3.5 h-3.5" /><span>Skaner</span>
            </Link>
            <button onClick={() => setShowChangePasswordModal(true)}
              className="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-500 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
              <UserIcon className="w-4 h-4" />
            </button>
            <Link to="/"
              className="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-500 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
              <HomeIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-[1600px] mx-auto w-full">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-100 sticky top-16 h-[calc(100vh-64px)] py-6 px-3 shrink-0 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-3">Menyu</p>
          <nav className="space-y-0.5">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                  activeTab === tab.key
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className={activeTab === tab.key ? 'text-blue-600' : 'text-gray-400'}>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.key === 'orders' && orders.filter(o => o.status === 'PENDING').length > 0 && (
                  <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {orders.filter(o => o.status === 'PENDING').length}
                  </span>
                )}
                {activeTab === tab.key && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-r-full"></div>
                )}
              </button>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className="mt-auto pt-4 border-t border-gray-100">
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-gray-700 truncate">{username}</p>
              <p className="text-[10px] text-gray-400">Admin</p>
            </div>
          </div>
        </aside>

        {/* Bottom Nav — mobile */}
        <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white rounded-2xl shadow-2xl flex items-center gap-0.5 p-1.5 border border-white/10" style={{maxWidth: 'calc(100% - 32px)'}}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center justify-center p-2.5 rounded-xl transition-all relative ${
                activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.icon}
              {tab.key === 'orders' && orders.filter(o => o.status === 'PENDING').length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {orders.filter(o => o.status === 'PENDING').length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto pb-24 md:pb-6">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

          {/* Ruxsat yo'q xabari */}
          {activeTab === 'dashboard' && permissions?.viewReports === false && (
            <div className="classic-card text-center py-16"><div className="classic-card-body"><p className="text-4xl mb-4">🔒</p><p className="text-gray-700 font-semibold">Bu bo'limga ruxsatingiz yo'q</p><p className="text-gray-400 text-sm mt-1">Super admin bilan bog'laning</p></div></div>
          )}
          {activeTab === 'orders' && permissions?.manageOrders === false && (
            <div className="classic-card text-center py-16"><div className="classic-card-body"><p className="text-4xl mb-4">🔒</p><p className="text-gray-700 font-semibold">Buyurtmalarni ko'rish uchun ruxsat yo'q</p><p className="text-gray-400 text-sm mt-1">Super admin bilan bog'laning</p></div></div>
          )}
          {(activeTab === 'categories' || activeTab === 'menu') && permissions?.manageMenu === false && (
            <div className="classic-card text-center py-16"><div className="classic-card-body"><p className="text-4xl mb-4">🔒</p><p className="text-gray-700 font-semibold">Menyu boshqarish uchun ruxsat yo'q</p><p className="text-gray-400 text-sm mt-1">Super admin bilan bog'laning</p></div></div>
          )}
          {activeTab === 'qr' && permissions?.manageQR === false && (
            <div className="classic-card text-center py-16"><div className="classic-card-body"><p className="text-4xl mb-4">🔒</p><p className="text-gray-700 font-semibold">QR kodlarni ko'rish uchun ruxsat yo'q</p><p className="text-gray-400 text-sm mt-1">Super admin bilan bog'laning</p></div></div>
          )}
          {activeTab === 'settings' && permissions?.manageSettings === false && (
            <div className="classic-card text-center py-16"><div className="classic-card-body"><p className="text-4xl mb-4">🔒</p><p className="text-gray-700 font-semibold">Sozlamalarni ko'rish uchun ruxsat yo'q</p><p className="text-gray-400 text-sm mt-1">Super admin bilan bog'laning</p></div></div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && permissions?.viewReports !== false && (
            <div className="animate-fade-in-up">
              {/* Dashboard header */}
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{t('welcome')}, {username}</h1>
                  <p className="text-sm text-gray-500 mt-0.5">{t('today_status')}</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-semibold text-emerald-700">{t('live_update')}</span>
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  {
                    label: t('tables'), value: currentRestaurant.tables,
                    icon: <TableIcon className="w-5 h-5" />,
                    color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100',
                    sub: t('active')
                  },
                  {
                    label: t('orders'), value: orders.length,
                    icon: <OrdersIcon className="w-5 h-5" />,
                    color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100',
                    sub: t('today_status')
                  },
                  {
                    label: t('total_revenue'), value: orders.reduce((s, o) => s + o.total, 0).toLocaleString(),
                    unit: "so'm",
                    icon: <RevenueIcon className="w-5 h-5" />,
                    color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100',
                    sub: t('total')
                  },
                  {
                    label: t('menu_items'), value: menuItems.length,
                    icon: <MenuBookIcon className="w-5 h-5" />,
                    color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100',
                    sub: t('items')
                  },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                        {stat.icon}
                      </div>
                      <span className={`text-[10px] font-semibold ${stat.color} ${stat.bg} px-2 py-1 rounded-lg border ${stat.border}`}>{stat.sub}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                      {stat.unit && <span className="text-xs text-gray-400">{stat.unit}</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                   <div className="classic-card border-none shadow-sm h-full">
                     <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                       <h2 className="text-xl font-black text-slate-900 tracking-tight">{t('recent_orders')}</h2>
                       <button onClick={() => setActiveTab('orders')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                         {t('view_all')} <span>→</span>
                       </button>
                     </div>
                     <div className="p-8">
                       {orders.length > 0 ? (
                         <div className="space-y-6">
                           {orders.slice(0, 5).map(o => (
                             <div key={o.id} className="flex items-center gap-4">
                               <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                 o.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-500' : 
                                 o.status === 'PENDING' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                               }`}>
                                 <OrdersIcon className="w-5 h-5" />
                               </div>
                               <div className="flex-1 min-w-0">
                                 <p className="font-extrabold text-slate-800 text-sm truncate">#{o.orderNumber} — Stol {o.tableNumber}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                   {o.items.length} ta mahsulot • {new Date(o.createdAt).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute: '2-digit'})}
                                 </p>
                               </div>
                               <div className="text-right">
                                 <p className="font-black text-slate-900 text-sm">{o.total.toLocaleString()} so'm</p>
                                 <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Status: {o.status}</span>
                               </div>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="text-center py-10 opacity-40">
                            <p className="font-black text-sm uppercase tracking-widest mb-1">{t('no_orders')}</p>
                            <p className="text-xs">{t('orders_appear')}</p>
                         </div>
                       )}
                     </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="classic-card border-none shadow-sm bg-slate-900 text-white">
                      <div className="p-8">
                        <h3 className="text-lg font-black tracking-tight mb-4 text-emerald-400 uppercase tracking-widest text-xs">{t('quick_links')}</h3>
                        <div className="space-y-3">
                          <button onClick={() => setActiveTab('menu')} className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                            <span className="text-xs font-black uppercase tracking-widest">{t('add_menu')}</span>
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                          </button>
                          <button onClick={() => setActiveTab('qr')} className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                            <span className="text-xs font-black uppercase tracking-widest">{t('qr_codes')}</span>
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                          </button>
                        </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Eng ko'p sotilgan taomlar */}
              {orders.length > 0 && (() => {
                const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};
                orders.forEach(o => o.items.forEach((item: any) => {
                  const key = item.name;
                  if (!itemCounts[key]) itemCounts[key] = { name: item.name, count: 0, revenue: 0 };
                  itemCounts[key].count += item.quantity || 1;
                  itemCounts[key].revenue += (item.price || 0) * (item.quantity || 1);
                }));
                const top = Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 5);
                const maxCount = top[0]?.count || 1;
                return (
                  <div className="classic-card border-none shadow-sm mt-8">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">{t('top_items')}</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t('all_orders_stat')}</p>
                      </div>
                      <span className="text-2xl">📊</span>
                    </div>
                    <div className="p-8 space-y-4">
                      {top.map((item, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-bold text-slate-800 truncate">{item.name}</span>
                              <span className="text-xs font-black text-slate-500 ml-2 shrink-0">{item.count} {t('sold_count')}</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  i === 0 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                                  i === 1 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                                  i === 2 ? 'bg-gradient-to-r from-violet-500 to-purple-500' :
                                  'bg-gradient-to-r from-amber-400 to-orange-400'
                                }`}
                                style={{ width: `${(item.count / maxCount) * 100}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-bold text-slate-400 shrink-0 min-w-[80px] text-right">
                            {item.revenue.toLocaleString()} so'm
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Orders Tab — Already Updated or to be updated separately */}
          {activeTab === 'orders' && permissions?.manageOrders !== false && (
            <div className="animate-fade-in-up">
              <div className="mb-10 flex border-b border-slate-100 pb-8 flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">{t('orders')}</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">{t('order_management')}</p>
                </div>
                <div className="flex gap-2">
                   <button onClick={loadOrders} disabled={ordersLoading} className="btn-secondary py-3 px-6 text-xs uppercase tracking-widest font-black flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${ordersLoading ? 'bg-amber-500 animate-spin' : 'bg-emerald-500'}`}></div>
                     {ordersLoading ? t('refreshing_btn') : t('refresh_btn')}
                   </button>
                </div>
              </div>

              {orders.length > 0 ? (
                <div className="classic-card border-none shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="table-modern">
                      <thead>
                        <tr>
                          <th>ID / {t('order')}</th>
                          <th>{t('table')}</th>
                          <th>{t('items')}</th>
                          <th>{t('total')}</th>
                          <th>{t('status')}</th>
                          <th>{t('payment')}</th>
                          <th>{t('actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="group transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                            <td>
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-900">#{order.orderNumber}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  {new Date(order.createdAt).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute: '2-digit'})}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-700 uppercase tracking-widest w-fit">
                                  {t('table_prefix')} {order.tableNumber}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest w-fit ${
                                  order.orderType === 'TAKEAWAY' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                  {order.orderType === 'TAKEAWAY' ? '🛍️ Takeaway' : '🍽️ Dine-in'}
                                </span>
                                {order.waiterCalled && (
                                  <button
                                    onClick={() => handleDismissWaiterCall(order.id)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-widest w-fit animate-pulse hover:animate-none hover:bg-amber-200 transition-colors"
                                    title="Bosib o'chirish"
                                  >
                                    🛎️ Ofitsiant!
                                  </button>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="max-w-[220px] space-y-1">
                                {order.items.slice(0, 4).map((i: any, idx: number) => (
                                  <div key={idx}>
                                    <p className="text-xs font-semibold text-slate-700 leading-tight">
                                      <span className="text-slate-400 font-bold">{i.quantity}×</span> {i.name}
                                    </p>
                                    {i.specialInstructions && (
                                      <p className="text-[9px] text-amber-600 bg-amber-50 rounded px-1.5 py-0.5 mt-0.5 font-medium">
                                        💬 {i.specialInstructions}
                                      </p>
                                    )}
                                  </div>
                                ))}
                                {order.items.length > 4 && (
                                  <p className="text-[9px] text-slate-400 font-bold">+{order.items.length - 4} ta ko'proq</p>
                                )}
                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                                  Jami {order.items.length} ta
                                </p>
                              </div>
                            </td>
                            <td>
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-900">{order.total.toLocaleString()}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">so'm</span>
                              </div>
                            </td>
                            <td>
                              <span className={`badge-modern !text-[9px] ${
                                order.status === 'PENDING' ? 'badge-warning' : 
                                order.status === 'CONFIRMED' ? 'badge-primary' : 
                                order.status === 'PREPARING' ? 'badge-warning bg-purple-50 text-purple-600 border-purple-100' : 
                                ['READY','SERVED','COMPLETED'].includes(order.status) ? 'badge-success' : 
                                'badge-danger'
                              }`}>
                                {order.status === 'PENDING' && t('pending_status')}
                                {order.status === 'CONFIRMED' && t('confirmed')}
                                {order.status === 'PREPARING' && t('preparing')}
                                {order.status === 'READY' && t('ready')}
                                {order.status === 'SERVED' && t('served')}
                                {order.status === 'COMPLETED' && t('completed')}
                                {order.status === 'CANCELLED' && t('cancelled')}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center gap-1">
                                <span className="text-lg">{order.paymentMethod === 'CASH' ? '💵' : '💳'}</span>
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                  {order.paymentMethod === 'CASH' ? t('cash') : t('card')}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="flex flex-col gap-1.5 min-w-[90px]">
                                {order.status === 'PENDING' && (
                                  <button onClick={() => handleUpdateOrderStatus(order.id, 'CONFIRMED')}
                                    className="px-3 py-2 rounded-lg bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wide hover:bg-blue-700 transition-colors whitespace-nowrap">
                                    ✓ {t('confirm_order')}
                                  </button>
                                )}
                                {order.status === 'CONFIRMED' && (
                                  <button onClick={() => handleUpdateOrderStatus(order.id, 'PREPARING')}
                                    className="px-3 py-2 rounded-lg bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wide hover:bg-purple-700 transition-colors whitespace-nowrap">
                                    🍳 {t('prepare_order')}
                                  </button>
                                )}
                                {order.status === 'PREPARING' && (
                                  <button onClick={() => handleUpdateOrderStatus(order.id, 'READY')}
                                    className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wide hover:bg-emerald-700 transition-colors whitespace-nowrap">
                                    ✓ {t('ready_order')}
                                  </button>
                                )}
                                {order.status === 'READY' && (
                                  <button onClick={() => handleUpdateOrderStatus(order.id, 'SERVED')}
                                    className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wide hover:bg-indigo-700 transition-colors whitespace-nowrap">
                                    🍽 {t('serve_order')}
                                  </button>
                                )}
                                {order.status === 'SERVED' && (
                                  <button onClick={() => handleUpdateOrderStatus(order.id, 'COMPLETED')}
                                    className="px-3 py-2 rounded-lg bg-gray-800 text-white text-[10px] font-bold uppercase tracking-wide hover:bg-gray-900 transition-colors whitespace-nowrap">
                                    ✓ {t('complete_order')}
                                  </button>
                                )}
                                {['PENDING','CONFIRMED'].includes(order.status) && (
                                  <button onClick={() => handleUpdateOrderStatus(order.id, 'CANCELLED')}
                                    className="px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold uppercase tracking-wide hover:bg-red-600 hover:text-white transition-colors whitespace-nowrap">
                                    ✕ {t('cancel_btn')}
                                  </button>
                                )}
                                {/* Chek tugmasi — har doim ko'rinadi */}
                                <button
                                  onClick={() => setSelectedReceiptOrder(order)}
                                  className="px-3 py-2 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 text-[10px] font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors whitespace-nowrap flex items-center gap-1">
                                  🧾 Chek
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm border-dashed">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                    <OrdersIcon className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] mb-1">{t('no_orders')}</p>
                  <p className="text-[10px] text-slate-300 font-medium">{t('orders_appear')}</p>
                </div>
              )}
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && permissions?.manageMenu !== false && (
            <div className="animate-fade-in-up">
              <div className="mb-10 flex border-b border-slate-100 pb-8 flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">{t('categories')}</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">{t('manage_categories')}</p>
                </div>
                <button onClick={() => setShowAddCategoryModal(true)} className="btn-primary py-3 px-6 text-xs uppercase tracking-widest font-black flex items-center gap-2 shadow-lg shadow-blue-200 hover:scale-105 transition-transform active:scale-95">
                  <span>+ {t('add_category')}</span>
                </button>
              </div>

              {loading && (
                <div className="flex justify-center py-20">
                  <div className="spinner !w-10 !h-10 !border-4" />
                </div>
              )}

              {categories.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm border-dashed">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                    <CategoryIcon className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] mb-6">{t('no_categories')}</p>
                  <button onClick={() => setShowAddCategoryModal(true)} className="btn-secondary py-3 px-6 text-xs uppercase tracking-widest font-black">
                    {t('add_first_category')}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <div key={category.id} className="stat-card-modern group !p-0 overflow-hidden flex flex-col">
                    <div className="p-8 flex-1">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors duration-500 shadow-inner group-hover:shadow-lg">
                          <CategoryIcon className="w-6 h-6 text-blue-500" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">Tartib: #{category.displayOrder}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors">{category.name}</h3>
                      <p className="text-xs font-medium text-slate-500 line-clamp-2 leading-relaxed h-8">
                        {category.description || 'Tavsif kiritilmagan'}
                      </p>
                    </div>
                    <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {menuItems.filter(item => item.categoryId === category.id).length} ta mahsulot
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingCategory(category)} className="p-2 bg-white rounded-lg text-slate-400 hover:text-blue-600 transition-colors shadow-sm hover:shadow-md">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => deleteCategory(category.id)} className="p-2 bg-white rounded-lg text-slate-400 hover:text-red-500 transition-colors shadow-sm hover:shadow-md">
                           <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Menu Tab */}
          {activeTab === 'menu' && permissions?.manageMenu !== false && (
            <div className="animate-fade-in-up">
              <div className="mb-10 flex border-b border-slate-100 pb-8 flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Menyu Boshqaruvi</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Ovqatlar va ichimliklar ro'yxati</p>
                </div>
                <button 
                  onClick={() => setShowAddMenuModal(true)} 
                  disabled={categories.length === 0 || loading} 
                  className="btn-primary py-3 px-6 text-xs uppercase tracking-widest font-black flex items-center gap-2 shadow-lg shadow-blue-200 hover:scale-105 transition-transform active:scale-95 disabled:opacity-50"
                >
                  <span>+ {t('add_item')}</span>
                </button>
              </div>

              {categories.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm border-dashed mb-10">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                    <CategoryIcon className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] mb-6">Avval kategoriya qo'shishingiz kerak</p>
                  <button onClick={() => setActiveTab('categories')} className="btn-secondary py-3 px-6 text-xs uppercase tracking-widest font-black">
                    Kategoriyalar bo'limiga o'tish
                  </button>
                </div>
              )}

              {categories.length > 0 && (
                <div className="mb-10 flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                  <button 
                    onClick={() => setSelectedCategory('all')} 
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                      selectedCategory === 'all' 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {t('all')} ({menuItems.length})
                  </button>
                  {categories.map((cat) => (
                    <button 
                      key={cat.id} 
                      onClick={() => setSelectedCategory(cat.id)} 
                      className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                        selectedCategory === cat.id 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                          : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {cat.name} ({menuItems.filter(i => i.categoryId === cat.id).length})
                    </button>
                  ))}
                </div>
              )}

              {loading && (
                <div className="flex justify-center py-20">
                  <div className="spinner !w-10 !h-10 !border-4" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredMenuItems.map((item) => (
                  <div key={item.id} className="stat-card-modern group !p-0 overflow-hidden flex flex-col hover:-translate-y-2 transition-transform duration-500">
                    <div className="relative h-56 overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                          <MenuBookIcon className="w-12 h-12 text-slate-200" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white shadow-sm">
                          {item.category?.name}
                        </span>
                      </div>
                      <div className="absolute top-4 right-4">
                        <button 
                          onClick={() => toggleItemAvailability(item.id)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md transition-all shadow-lg ${
                            item.isAvailable 
                              ? 'bg-emerald-500/90 text-white' 
                              : 'bg-red-500/90 text-white'
                          }`}
                        >
                          {item.isAvailable ? '✓' : '✕'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-8 flex-1">
                      <div className="flex justify-between items-start mb-4">
                         <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-indigo-400 transition-colors">{item.name}</h3>
                         <span className="text-sm font-black text-blue-600 dark:text-indigo-400 tracking-tight">{item.price.toLocaleString()} {t('som')}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed h-8 mb-6">
                        {item.description || "Tavsif kiritilmagan"}
                      </p>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingItem(item)} 
                          className="flex-1 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 dark:shadow-indigo-900/30 hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all active:scale-95"
                        >
                          {t('edit_btn')}
                        </button>
                        <button 
                          onClick={() => deleteMenuItem(item.id)} 
                          className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredMenuItems.length === 0 && !loading && categories.length > 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm border-dashed">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                    <MenuBookIcon className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] mb-6">
                    {selectedCategory === 'all' ? 'Hozircha ovqatlar qo\'shilmagan' : 'Bu turdagi ovqatlar topilmadi'}
                  </p>
                  <button onClick={() => setShowAddMenuModal(true)} className="btn-secondary py-3 px-6 text-xs uppercase tracking-widest font-black">
                    Yangi ovqat qo'shish
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && permissions?.manageSettings !== false && (
            <div className="animate-fade-in-up max-w-2xl">
              <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">{t('settings')}</h2>
                <p className="text-slate-400 text-sm">{t('restaurant_settings')}</p>
              </div>

              <div className="space-y-4">

                {/* Restoran ma'lumotlari */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Restoran ma'lumotlari</p>
                      <p className="text-xs text-slate-400">Asosiy ma'lumotlarni yangilang</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Restoran nomi</label>
                        <input type="text" value={restaurantForm.restaurantName}
                          onChange={e => setRestaurantForm(p => ({ ...p, restaurantName: e.target.value }))}
                          placeholder="Restoran nomi" className="input-modern w-full text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Egasi ismi</label>
                        <input type="text" value={restaurantForm.ownerName}
                          onChange={e => setRestaurantForm(p => ({ ...p, ownerName: e.target.value }))}
                          placeholder="To'liq ism" className="input-modern w-full text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email</label>
                        <input type="email" value={restaurantForm.email}
                          onChange={e => setRestaurantForm(p => ({ ...p, email: e.target.value }))}
                          placeholder="info@restoran.uz" className="input-modern w-full text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Stollar soni</label>
                        <input type="number" min="1" max="100" value={restaurantForm.tables}
                          onChange={e => setRestaurantForm(p => ({ ...p, tables: parseInt(e.target.value) || 1 }))}
                          className="input-modern w-full text-sm" />
                      </div>
                    </div>
                    <button
                      disabled={restaurantSaving}
                      onClick={async () => {
                        setRestaurantSaving(true);
                        try {
                          const token = localStorage.getItem('authToken');
                          if (token) {
                            await authApi.updateProfile({
                              restaurantName: restaurantForm.restaurantName,
                              ownerName: restaurantForm.ownerName,
                              email: restaurantForm.email,
                              tables: restaurantForm.tables,
                            });
                          }
                          if (username) updateUser(username, {
                            restaurantName: restaurantForm.restaurantName,
                            ownerName: restaurantForm.ownerName,
                            email: restaurantForm.email,
                            tables: restaurantForm.tables,
                          });
                          // Stollar soni o'zgarganda QR kodlarni qayta generatsiya qilish
                          if (restaurantForm.tables !== restaurantTables) {
                            setRestaurantTables(restaurantForm.tables);
                            setQrDataUrls({});
                          }
                          toast.success('Saqlandi');
                        } catch { toast.error('Xatolik yuz berdi'); }
                        finally { setRestaurantSaving(false); }
                      }}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm disabled:opacity-50"
                    >
                  {restaurantSaving ? t('saving_btn') : t('save_btn')}
                    </button>
                  </div>
                </div>

                {/* Til tanlash */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                      <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{t('language')}</p>
                      <p className="text-xs text-slate-400">Interfeys tili</p>
                    </div>
                    <div className="ml-auto text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {lang.toUpperCase()}
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-3 gap-2">
                    {([
                      { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
                      { code: 'ru', label: 'Русский', flag: '🇷🇺' },
                      { code: 'en', label: 'English', flag: '🇬🇧' },
                    ] as const).map(l => (
                      <button key={l.code} onClick={() => setLang(l.code)}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all text-sm font-semibold ${
                          lang === l.code ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                        }`}>
                        <span className="text-lg">{l.flag}</span>
                        <span>{l.label}</span>
                        {lang === l.code && <svg className="w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Xizmat haqi */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{t('service_fee')}</p>
                      <p className="text-xs text-slate-400">Buyurtma subtotalidan olinadigan foiz</p>
                    </div>
                    <div className="ml-auto">
                      <span className="text-2xl font-black text-emerald-600">{adminServiceFeePercent}%</span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <input type="range" min="0" max="30" step="1" value={adminServiceFeePercent}
                      onChange={(e) => setAdminServiceFeePercent(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-emerald-500" />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>0%</span><span>5%</span><span>10%</span><span>15%</span><span>20%</span><span>25%</span><span>30%</span>
                    </div>
                    <div className="flex gap-2">
                      {[0, 5, 10, 15, 20].map(v => (
                        <button key={v} onClick={() => setAdminServiceFeePercent(v)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${adminServiceFeePercent === v ? 'bg-emerald-500 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                          {v}%
                        </button>
                      ))}
                    </div>
                    <button onClick={async () => {
                      const token = localStorage.getItem('authToken');
                      if (token) {
                        try { await authApi.updateProfile({ serviceFeePercent: adminServiceFeePercent }); } catch { /* ignore */ }
                      }
                      if (username) updateUser(username, { serviceFeePercent: adminServiceFeePercent });
                      toast.success('Saqlandi');
                    }} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-sm">
                      {t('save')}
                    </button>
                  </div>
                </div>

                {/* Hisob xavfsizligi */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Xavfsizlik</p>
                      <p className="text-xs text-slate-400">Parol va hisob xavfsizligi</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <button onClick={() => setShowChangePasswordModal(true)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group">
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                        <span className="text-sm font-semibold text-gray-700">Parolni o'zgartirish</span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  </div>
                </div>

                {/* Xavfli zona */}
                <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-red-50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-700">Xavfli zona</p>
                      <p className="text-xs text-red-400">Qaytarib bo'lmaydigan amallar</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <button onClick={() => { useAuthStore.getState().logout(); }}
                      className="w-full flex items-center justify-between px-4 py-3 bg-red-50 hover:bg-red-100 rounded-xl transition-colors group border border-red-100">
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                        </svg>
                        <span className="text-sm font-semibold text-red-600">Tizimdan chiqish</span>
                      </div>
                      <svg className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* QR Tab */}
          {activeTab === 'qr' && permissions?.manageQR !== false && (
            <div className="animate-fade-in-up">
              <div className="mb-10 flex border-b border-slate-100 pb-8 flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">{t('qr_title')}</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">{t('unique_order_system')}</p>
                </div>
                {Object.keys(qrDataUrls).length > 0 && (
                  <button onClick={downloadAllQRs} className="btn-primary py-3 px-6 text-xs uppercase tracking-widest font-black flex items-center gap-2 shadow-lg shadow-blue-200 hover:scale-105 transition-transform active:scale-95">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>{t('download_all')}</span>
                  </button>
                )}
              </div>

              {Object.keys(qrDataUrls).length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="spinner !w-12 !h-12 !border-4 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">QR kodlar tayyorlanmoqda...</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: restaurantTables }, (_, i) => i + 1).map((tableNumber) => (
                  <div key={tableNumber} className="stat-card-modern group p-8 flex flex-col items-center text-center">
                    <div className="w-full flex justify-between items-center mb-6">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl">{t('table_num')} #{tableNumber}</span>
                       <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    </div>
                    
                    <div className="relative mb-8 p-4 bg-white rounded-[2rem] shadow-inner-lg border border-slate-50 group-hover:scale-105 transition-transform duration-500">
                      {qrDataUrls[tableNumber] ? (
                        <img src={qrDataUrls[tableNumber]} alt={`Stol ${tableNumber} QR`} className="w-40 h-40 object-contain rounded-2xl" />
                      ) : (
                        <div className="w-40 h-40 bg-slate-50 rounded-2xl flex items-center justify-center">
                          <div className="spinner !w-6 !h-6" />
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => qrDataUrls[tableNumber] && downloadQR(tableNumber, qrDataUrls[tableNumber])} 
                      disabled={!qrDataUrls[tableNumber]} 
                      className="w-full btn-secondary py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-slate-900 group-hover:text-white transition-all disabled:opacity-40"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      {t('download')}
                    </button>
                    
                    <p className="mt-4 text-[9px] font-bold text-slate-300 uppercase tracking-tighter truncate max-w-full italic px-2">
                       {window.location.host}/r/{restaurantId}/t/{tableNumber}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showAddMenuModal && (
        <div className="fixed inset-0 modal-overlay-modern flex items-center justify-center p-4 z-[200] animate-fade-in">
          <div className="modal-content-modern max-w-xl w-full p-8 max-h-[90vh] overflow-y-auto animate-zoom-in bg-white">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('add_item_title2')}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Barcha maydonlarni to'ldiring</p>
              </div>
              <button 
                onClick={() => setShowAddMenuModal(false)}
                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Ovqat Nomi *</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="Masalan: Maxsus Osh"
                    className="input-modern w-full"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Tavsif</label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Ovqat tarkibi va tayyorlanishi haqida..."
                    rows={3}
                    className="input-modern w-full resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">{t('price_label')} *</label>
                  <input
                    type="number"
                    value={newItem.price || ''}
                    onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                    placeholder="0"
                    className="input-modern w-full"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Kategoriya *</label>
                  <select
                    value={newItem.categoryId}
                    onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}
                    className="select-modern w-full"
                  >
                    <option value="">Tanlang...</option>
                    {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Ovqat Rasmi</label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, false)}
                        className="hidden"
                        id="menu-image-upload"
                      />
                      <label 
                        htmlFor="menu-image-upload"
                        className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all group"
                      >
                        <span className="text-[10px] font-black text-slate-400 group-hover:text-blue-600 uppercase tracking-widest">Rasm tanlash</span>
                      </label>
                    </div>
                    {imagePreview && (
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => { setImagePreview(''); setNewItem({ ...newItem, image: '' }); }}
                          className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-50">
                <button 
                  onClick={() => setShowAddMenuModal(false)}
                  className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {t('cancel_btn')}
                </button>
                <button 
                  onClick={addMenuItem} 
                  disabled={loading}
                  className="flex-[2] btn-primary py-4 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-200 disabled:opacity-50"
                >
                  {loading ? t('submitting') : t('save_btn') + ' ✨'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 modal-overlay-modern flex items-center justify-center p-4 z-[200]">
          <div className="modal-content-modern max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{t('edit_item_title2')}</h3>
            <p className="text-sm text-gray-500 mb-5">* belgisi bilan belgilangan maydonlar majburiy</p>

            <div className="space-y-4">
              {/* Ovqat nomi */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Ovqat nomi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="Masalan: Osh, Lag'mon, Shashlik..."
                  className="input-modern w-full"
                />
                <p className="text-xs text-gray-400 mt-1">Menyuda ko'rinadigan ovqat nomi</p>
              </div>

              {/* Tavsif */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tavsif</label>
                <textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Ovqat haqida qisqacha ma'lumot..."
                  rows={2}
                  className="input-modern w-full resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">Ovqat haqida qisqacha ma'lumot (ixtiyoriy)</p>
              </div>

              {/* Narx va Tayyorlanish vaqti */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Narx <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={editingItem.price || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                      placeholder="0"
                      className="input-modern w-full pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium pointer-events-none">so'm</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Faqat raqam kiriting</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tayyorlanish vaqti</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={editingItem.preparationTime || 15}
                      onChange={(e) => setEditingItem({ ...editingItem, preparationTime: Number(e.target.value) })}
                      placeholder="15"
                      className="input-modern w-full pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium pointer-events-none">daqiqa</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">O'rtacha vaqt</p>
                </div>
              </div>

              {/* Kategoriya */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Kategoriya <span className="text-red-500">*</span>
                </label>
                <select
                  value={editingItem.categoryId}
                  onChange={(e) => setEditingItem({ ...editingItem, categoryId: e.target.value })}
                  className="select-modern w-full"
                >
                  <option value="">— Kategoriyani tanlang —</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">Ovqat qaysi bo'limga kiradi</p>
              </div>

              {/* Rasm */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Ovqat rasmi</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, true)}
                  className="w-full p-2 bg-white border-2 border-gray-200 rounded-lg text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF — maksimal 5MB (ixtiyoriy)</p>
                {(editImagePreview || editingItem.image) && (
                  <div className="mt-2 relative">
                    <img src={editImagePreview || editingItem.image} alt="Preview" className="w-full h-36 object-cover rounded-lg border border-gray-200" />
                    <button
                      onClick={() => { setEditImagePreview(''); setEditingItem({ ...editingItem, image: '' }); }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >×</button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button onClick={() => setEditingItem(null)} className="btn-secondary flex-1 py-2">{t('cancel_btn')}</button>
              <button onClick={updateMenuItem} disabled={loading} className="btn-primary flex-1 py-2 disabled:opacity-50">
                {loading ? t('saving_btn') : t('save_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCategoryModal && (
        <CategoryModal
          title={t('add_category_btn')}
          name={newCategory.name || ''}
          description={newCategory.description || ''}
          displayOrder={newCategory.displayOrder || 0}
          loading={loading}
          onChangeName={(v) => setNewCategory({ ...newCategory, name: v })}
          onChangeDescription={(v) => setNewCategory({ ...newCategory, description: v })}
          onChangeOrder={(v) => setNewCategory({ ...newCategory, displayOrder: v })}
          onCancel={() => setShowAddCategoryModal(false)}
          onSubmit={addCategory}
          submitLabel={t('add_btn')}
          submitClass="btn-success"
        />
      )}

      {editingCategory && (
        <CategoryModal
          title={t('edit_category_btn')}
          name={editingCategory.name}
          description={editingCategory.description || ''}
          displayOrder={editingCategory.displayOrder}
          loading={loading}
          onChangeName={(v) => setEditingCategory({ ...editingCategory, name: v })}
          onChangeDescription={(v) => setEditingCategory({ ...editingCategory, description: v })}
          onChangeOrder={(v) => setEditingCategory({ ...editingCategory, displayOrder: v })}
          onCancel={() => setEditingCategory(null)}
          onSubmit={updateCategory}
          submitLabel={t('save_btn')}
          submitClass="btn-primary"
        />
      )}

      <ChangePasswordModal isOpen={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)} userType="admin" username={username || ""} />

      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          restaurantName={restaurantName}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  );
}

export default AdminPanel;
