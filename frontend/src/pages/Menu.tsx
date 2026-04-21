import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGuestStore } from '../store/useGuestStore';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { guestApi, menuApi, authApi } from '../lib/api';
import toast from 'react-hot-toast';
import { ForkKnifeIcon, CartIcon, HomeIcon, AppLogo } from '../components/Icons';
import { useLangStore, translations } from '../store/useLangStore';
import ThemeToggle from '../components/ThemeToggle';
import { orderApi } from '../lib/api';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  category?: { id: string; name: string };
  image?: string;
  description: string;
  isAvailable: boolean;
  preparationTime?: number;
  tags?: string[];
}

interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  menuItems?: MenuItem[];
}

export default function Menu() {
  const { restaurantId, tableNumber } = useParams();
  const navigate = useNavigate();
  const { setSession } = useGuestStore();
  const { lang, setLang } = useLangStore();
  // t funksiyasini lang ga bog'liq holda yaratish — lang o'zgarganda qayta render bo'ladi
  const t = useMemo(
    () => (key: string) => translations[lang]?.[key] || translations['uz']?.[key] || key,
    [lang]
  );
  const { items, addItem, updateQuantity, removeItem, setRestaurantId, restaurantId: cartRestaurantId, clearCart, setServiceFeePercent } = useCartStore();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [myOrders, setMyOrders] = useState<Array<{ id: string; orderNumber: string; status: string }>>([]);

  useEffect(() => {
    const initSession = async () => {
      try {
        const currentRestaurantId = restaurantId || 'demo-restaurant';
        if (cartRestaurantId && cartRestaurantId !== currentRestaurantId) {
          clearCart();
          toast(t('new_cart'), { icon: 'ℹ️' });
        }
        setRestaurantId(currentRestaurantId);

        authApi.getRestaurantInfo(currentRestaurantId)
          .then(res => {
            const info = res.data?.data;
            if (info?.serviceFeePercent !== undefined && info.serviceFeePercent !== null) {
              setServiceFeePercent(info.serviceFeePercent);
            }
          })
          .catch(() => {});

        if (restaurantId && tableNumber) {
          try {
            const response = await guestApi.createSession(restaurantId, tableNumber);
            const { data } = response.data;
            setSession(data);
            // Yangi token ni localStorage ga saqlash
            if (data?.sessionToken) {
              localStorage.setItem('guestToken', data.sessionToken);
            }
          } catch (sessionErr) {
            // Session xatosi menyu ko'rinishini bloklamamasin
            console.warn('Session yaratishda xatolik (non-fatal):', sessionErr);
          }
        }

        const [itemsRes, categoriesRes] = await Promise.all([
          menuApi.getItemsByRestaurant(currentRestaurantId),
          menuApi.getCategoriesByRestaurant(currentRestaurantId),
        ]);

        const loadedItems = itemsRes.data.data || [];
        const loadedCategories = categoriesRes.data.data || [];
        setMenuItems(loadedItems.filter((item: MenuItem) => item.isAvailable));
        setCategories(loadedCategories);

        const allUsers = useAuthStore.getState().getAllUsers();
        const matchedUser = allUsers.find((u: any) => u.restaurantId === currentRestaurantId);
        setRestaurant({
          id: currentRestaurantId,
          name: matchedUser?.restaurantName || currentRestaurantId,
        });
      } catch (error: any) {
        console.error('Menu loading error:', error);
        toast.error(t('menu_load_error'));
      } finally {
        setLoading(false);
        setTimeout(() => setIsLoaded(true), 100);
      }
    };
    initSession();
  }, [restaurantId, tableNumber]);

  // Buyurtmalarni backend dan olish
  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const res = await orderApi.getMyOrders();
        setMyOrders((res.data?.data || []).slice(0, 3));
      } catch {
        try {
          const stored = JSON.parse(localStorage.getItem('my-orders') || '[]');
          setMyOrders(stored);
        } catch { /* ignore */ }
      }
    };
    fetchMyOrders();
  }, [restaurantId]);

  const getItemQuantityInCart = (itemId: string) => {
    const found = items.find((i) => i.menuItemId === itemId);
    return found ? found.quantity : 0;
  };

  const handleAddToCart = (item: MenuItem) => {
    addItem({ menuItemId: item.id, name: item.name, price: item.price, quantity: 1 });
    toast.success(`${item.name} ${t('item_added_to_cart')}`, { duration: 1500 });
  };

  const handleIncrement = (item: MenuItem) => {
    const qty = getItemQuantityInCart(item.id);
    if (qty === 0) handleAddToCart(item);
    else updateQuantity(item.id, qty + 1);
  };

  const handleDecrement = (item: MenuItem) => {
    const qty = getItemQuantityInCart(item.id);
    if (qty <= 1) removeItem(item.id);
    else updateQuantity(item.id, qty - 1);
  };

  const getCategories = () => ['all', ...categories.map((cat) => cat.id)];

  // Kategoriya nomlarini tarjima qilish — keng tarqalgan nomlar uchun
  const categoryTranslations: Record<string, Record<string, string>> = {
    'Milliy taomlar':  { ru: 'Национальные блюда', en: 'National dishes' },
    'Fast Food':       { ru: 'Фаст Фуд',           en: 'Fast Food' },
    'Ichimliklar':     { ru: 'Напитки',             en: 'Drinks' },
    'Desertlar':       { ru: 'Десерты',             en: 'Desserts' },
    'Salatlar':        { ru: 'Салаты',              en: 'Salads' },
    'Sho\'rvalar':     { ru: 'Супы',                en: 'Soups' },
    'Non va xamirli':  { ru: 'Хлеб и выпечка',     en: 'Bread & Pastry' },
    'Qo\'shimcha':     { ru: 'Дополнительно',       en: 'Extras' },
    'Pizza':           { ru: 'Пицца',               en: 'Pizza' },
    'Burger':          { ru: 'Бургеры',             en: 'Burgers' },
    'Lavash':          { ru: 'Лаваш',               en: 'Lavash' },
    'Shashlik':        { ru: 'Шашлык',              en: 'Shashlik' },
    'Sushi':           { ru: 'Суши',                en: 'Sushi' },
    'Tovuq taomlar':   { ru: 'Блюда из курицы',     en: 'Chicken dishes' },
    'Baliq taomlar':   { ru: 'Рыбные блюда',        en: 'Fish dishes' },
    'Vegetarian':      { ru: 'Вегетарианское',      en: 'Vegetarian' },
  };

  const getCategoryName = (categoryId: string) => {
    if (categoryId === 'all') return t('all');
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return t('category');
    if (lang === 'uz') return cat.name;
    const tr = categoryTranslations[cat.name];
    if (tr && tr[lang]) return tr[lang];
    return cat.name; // tarjima topilmasa asl nomni qaytarish
  };

  const getFilteredItems = () => {
    let filtered = selectedCategory === 'all' ? menuItems : menuItems.filter((item) => item.categoryId === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) => item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)
      );
    }
    return filtered;
  };

  const getItemImage = (item: MenuItem): string | null => {
    if (item.image && item.image.startsWith('data:image')) return item.image;
    return null;
  };

  const totalCartItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalCartPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center animate-pulse">
            <AppLogo size={64} />
          </div>
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm font-medium">{t('loading_menu')}</p>
        </div>
      </div>
    );
  }

  const filteredItems = getFilteredItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── HEADER ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Left: restaurant info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <AppLogo size={32} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate leading-none">{restaurant?.name || 'Menyu'}</p>
              {tableNumber && <p className="text-[10px] text-gray-400 mt-0.5">{t('table_prefix')} {tableNumber}</p>}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* My orders */}
            {myOrders.length > 0 && (
              <button onClick={() => navigate(`/order/${myOrders[0].id}`)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                <span className="hidden sm:inline">{t('my_orders')}</span>
                {myOrders[0].status === 'READY' && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">{t('status_ready')}!</span>}
              </button>
            )}
            <Link to="/" className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
              <HomeIcon className="w-4 h-4" />
            </Link>
            {/* Lang switcher */}
            <div className="hidden sm:flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5 gap-0.5">
              {(['uz', 'ru', 'en'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wide transition-all ${lang === l ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                  {l}
                </button>
              ))}
            </div>
            <ThemeToggle />
            {/* Cart button */}
            <button onClick={() => navigate('/cart')}
              className="relative flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-blue-200">
              <CartIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t('cart_btn')}</span>
              {totalCartItems > 0 && (
                <>
                  <span className="hidden sm:inline text-blue-200 text-xs">·</span>
                  <span className="hidden sm:inline text-xs font-bold">{totalCartPrice.toLocaleString()} {t('som')}</span>
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center sm:hidden">
                    {totalCartItems}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5">
        {/* ── SEARCH ── */}
        <div className="relative mb-5">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all shadow-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors">
              <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>

        {/* ── CATEGORIES ── */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {getCategories().map((categoryId) => {
              const count = categoryId === 'all' ? menuItems.length : menuItems.filter(i => i.categoryId === categoryId).length;
              return (
                <button
                  key={categoryId}
                  onClick={() => setSelectedCategory(categoryId)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                    selectedCategory === categoryId
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {getCategoryName(categoryId)}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    selectedCategory === categoryId ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── MENU ITEMS ── */}
        {menuItems.length > 0 ? (
          <>
            {filteredItems.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item, index) => {
                  const qty = getItemQuantityInCart(item.id);
                  const img = getItemImage(item);
                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      {/* Image */}
                      <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                        {img ? (
                          <img src={img} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-5xl opacity-30">🍽️</span>
                          </div>
                        )}
                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex gap-1">
                          {item.tags?.includes('popular') && (
                            <span className="px-2 py-0.5 bg-amber-400 text-white text-[10px] font-bold rounded-full shadow-sm">
                              ⭐ {t('popular')}
                            </span>
                          )}
                        </div>
                        {/* Category badge */}
                        <div className="absolute bottom-2 left-2">
                          <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm text-gray-600 text-[10px] font-semibold rounded-full shadow-sm">
                            {item.category?.name}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 text-sm mb-1 leading-snug">{item.name}</h3>
                        {item.description && (
                          <p className="text-xs text-gray-500 mb-2 line-clamp-2 leading-relaxed">{item.description}</p>
                        )}
                        {item.preparationTime && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-3">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                            {item.preparationTime} {t('min')}
                          </div>
                        )}

                        {/* Price + Controls */}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-black text-gray-900">{item.price.toLocaleString()}</span>
                            <span className="text-xs text-gray-400 ml-1">{t('som')}</span>
                          </div>

                          {qty === 0 ? (
                            <button onClick={() => handleAddToCart(item)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-blue-200">
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                              {t('add_to_cart')}
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
                              <button onClick={() => handleDecrement(item)}
                                className="w-7 h-7 bg-white border border-gray-200 text-gray-600 rounded-lg flex items-center justify-center font-bold hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors shadow-sm">
                                −
                              </button>
                              <span className="w-6 text-center font-black text-gray-900 text-sm">{qty}</span>
                              <button onClick={() => handleIncrement(item)}
                                className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold hover:bg-blue-700 transition-colors shadow-sm">
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </div>
                <p className="text-gray-500 font-semibold mb-1">
                  {searchQuery ? `"${searchQuery}" ${t('search_empty')}` : t('no_data')}
                </p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}
                    className="mt-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors">
                    {t('clear_search')}
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-5 bg-gray-100 rounded-3xl flex items-center justify-center">
              <ForkKnifeIcon className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">{t('menu_empty')}</h2>
            <p className="text-gray-400 text-sm mb-6">{t('menu_empty_desc')}</p>
            <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
              <HomeIcon className="w-4 h-4" />
              {t('back_home')}
            </Link>
          </div>
        )}
      </main>

      {/* ── FLOATING CART ── */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 lg:hidden">
          <button onClick={() => navigate('/cart')}
            className="flex items-center gap-3 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-2xl shadow-blue-300 font-bold text-sm transition-all hover:-translate-y-0.5">
            <CartIcon className="w-5 h-5" />
            <span>{totalCartItems} {t('items_ta')} {t('product')}</span>
            <span className="text-blue-200">·</span>
            <span>{totalCartPrice.toLocaleString()} {t('som')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
