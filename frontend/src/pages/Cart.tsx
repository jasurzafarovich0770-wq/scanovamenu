import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useGuestStore } from '../store/useGuestStore';
import { useOrderLogStore } from '../store/useOrderLogStore';
import { useAuthStore } from '../store/useAuthStore';
import { useLangStore, translations } from '../store/useLangStore';
import { orderApi, authApi } from '../lib/api';
import toast from 'react-hot-toast';
import { CartIcon, ForkKnifeIcon, HomeIcon, TrashIcon, MinusIcon, PlusIcon } from '../components/Icons';

export default function Cart() {
  const navigate = useNavigate();
  const { items, getSubtotal, getServiceFee, getTotal, clearCart, updateQuantity, removeItem, serviceFeePercent, setServiceFeePercent, updateSpecialInstructions } = useCartStore();
  const { restaurantId, tableNumber } = useGuestStore();
  const { addLog } = useOrderLogStore();
  const { username, getAllUsers } = useAuthStore();
  const { lang } = useLangStore();
  const t = useMemo(
    () => (key: string) => translations[lang]?.[key] || translations['uz']?.[key] || key,
    [lang]
  );

  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [cardQrImage, setCardQrImage] = useState<string>('');

  const menuLink = restaurantId && tableNumber ? `/r/${restaurantId}/t/${tableNumber}` : '/menu';

  useEffect(() => {
    setIsLoaded(true);
    if (restaurantId) {
      const qr = localStorage.getItem(`cardQr_${restaurantId}`);
      if (qr) setCardQrImage(qr);

      authApi.getRestaurantInfo(restaurantId)
        .then(res => {
          const info = res.data?.data;
          if (info?.serviceFeePercent !== undefined && info.serviceFeePercent !== null) {
            setServiceFeePercent(info.serviceFeePercent);
          } else {
            const allUsers = getAllUsers();
            const restaurant = allUsers.find(u => u.restaurantId === restaurantId);
            if (restaurant?.serviceFeePercent !== undefined) {
              setServiceFeePercent(restaurant.serviceFeePercent);
            }
          }
        })
        .catch(() => {
          const allUsers = getAllUsers();
          const restaurant = allUsers.find(u => u.restaurantId === restaurantId);
          if (restaurant?.serviceFeePercent !== undefined) {
            setServiceFeePercent(restaurant.serviceFeePercent);
          }
        });
    }
  }, [restaurantId]);

  const handlePlaceOrder = async () => {
    const guestToken = localStorage.getItem('guestToken');
    if (!guestToken) { toast.error(t('scan_qr_first')); return; }

    try {
      setLoading(true);
      const response = await orderApi.create({
        items: items.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || undefined,
        })),
        paymentMethod,
        orderType,
        serviceFeePercent,
        serviceFee: getServiceFee(),
        total: getTotal(),
      });
      const { data } = response.data;

      addLog({
        username: username || null,
        restaurantId: restaurantId || 'unknown',
        restaurantName: restaurantId || "Noma'lum restoran",
        tableNumber: tableNumber || 'N/A',
        items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        total: getTotal(),
        paymentMethod,
        serviceFee: getServiceFee(),
      });

      clearCart();
      // Buyurtma ID ni localStorage ga saqlaymiz
      try {
        const existingOrders = JSON.parse(localStorage.getItem('my-orders') || '[]');
        existingOrders.unshift({
          id: data.id,
          orderNumber: data.orderNumber || data.id?.slice(-8),
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('my-orders', JSON.stringify(existingOrders.slice(0, 5)));
      } catch { /* ignore */ }
      toast.success(t('order_placed'));
      navigate(`/order/${data.id}`);
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message || t('error_occurred');
      if (error.response?.status === 401) {
        toast.error(t('session_expired_scan'));
        localStorage.removeItem('guestToken');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center animate-fade-in-up">
          <div className="w-24 h-24 mx-auto mb-8 bg-white rounded-3xl shadow-xl flex items-center justify-center float-modern">
            <CartIcon className="w-12 h-12 text-primary-500" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">{t('cart_empty')}</h2>
          <p className="text-slate-500 mb-10 max-w-xs mx-auto">{t('cart_empty_desc')}</p>
          <Link to={menuLink} className="btn-primary">
            <ForkKnifeIcon className="w-5 h-5 mr-1" />
            <span>{t('view_menu')}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="header-modern sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="icon-container-success w-12 h-12 shadow-sm rounded-2xl">
              <CartIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none mb-1">{t('cart_title')}</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{items.length} {t('items_ta')} {t('product')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={menuLink} className="btn-secondary text-sm flex items-center gap-2 py-2.5 px-4 rounded-xl border-slate-200">
              <ForkKnifeIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t('menu')}</span>
            </Link>
            <Link to="/" className="text-slate-400 hover:text-primary-600 transition-colors p-2">
              <HomeIcon className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Cart items list */}
          <div className={`lg:col-span-2 space-y-4 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="classic-card border-none shadow-sm">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-lg font-extrabold text-slate-900">{t('order_list')}</h2>
                <button onClick={() => { clearCart(); toast.success(t('success')); }} className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 uppercase tracking-wider">
                  <TrashIcon className="w-3.5 h-3.5" />
                  {t('clear_btn')}
                </button>
              </div>
              <div className="p-2 space-y-2">
                {items.map(item => (
                  <div key={item.menuItemId} className="p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-lg leading-snug truncate">{item.name}</p>
                        <p className="text-sm font-semibold text-primary-600">{item.price.toLocaleString()} {t('som')}</p>
                      </div>
                      
                      <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                        <button 
                          onClick={() => { 
                            if (item.quantity <= 1) { 
                              removeItem(item.menuItemId); 
                              toast.success(t('deleted')); 
                            } else updateQuantity(item.menuItemId, item.quantity - 1); 
                          }} 
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <MinusIcon className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-black text-slate-900 text-lg">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)} 
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="text-right min-w-[100px]">
                        <p className="font-black text-slate-900 text-lg">{(item.price * item.quantity).toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('som')}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <input
                        type="text"
                        value={item.specialInstructions || ''}
                        onChange={(e) => updateSpecialInstructions(item.menuItemId, e.target.value)}
                      placeholder={t('special_request')}
                        className="w-full text-sm px-4 py-2.5 bg-slate-50 border-2 border-transparent focus:border-primary-100 focus:bg-white rounded-xl text-slate-600 placeholder-slate-400 transition-all outline-none"
                        maxLength={100}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Checkout & Summary Sidebar */}
          <div className={`space-y-6 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.15s' }}>
            <div className="classic-card border-none shadow-xl bg-white sticky top-24 overflow-visible">
              {/* Floating total badge for mobile visibility scroll */}
              <div className="absolute -top-4 -right-2 bg-primary-600 text-white px-5 py-2 rounded-2xl shadow-lg ring-4 ring-slate-50 font-black text-lg animate-bounce-subtle">
                {getTotal().toLocaleString()}
              </div>
              
              <div className="p-8 space-y-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">{t('order_summary')}</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-slate-500 font-bold text-sm">
                      <span className="uppercase tracking-widest">{t('subtotal')}</span>
                      <span className="text-slate-900">{getSubtotal().toLocaleString()} {t('som')}</span>
                    </div>
                    {serviceFeePercent > 0 && (
                      <div className="flex justify-between items-center text-slate-500 font-bold text-sm">
                        <span className="uppercase tracking-widest">{t('service_fee_label')} ({serviceFeePercent}%)</span>
                        <span className="text-emerald-600">+{getServiceFee().toLocaleString()} {t('som')}</span>
                      </div>
                    )}
                    <div className="divider-modern !my-4"></div>
                    <div className="flex justify-between items-end">
                      <span className="font-extrabold text-slate-900 text-lg">{t('total')}:</span>
                      <div className="text-right">
                        <span className="block font-black text-primary-600 text-3xl leading-none">{getTotal().toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('som')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Type Selection */}
                <div className="space-y-3">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('order_type')}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'DINE_IN', label: t('dine_in'), icon: '🍽️', desc: t('dine_in_desc') },
                      { value: 'TAKEAWAY', label: t('takeaway'), icon: '🛍️', desc: t('takeaway_desc') },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setOrderType(opt.value as any)}
                        className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 relative ${
                          orderType === opt.value
                            ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <span className="text-3xl mb-2">{opt.icon}</span>
                        <span className={`text-xs font-black uppercase tracking-wider ${orderType === opt.value ? 'text-blue-700' : 'text-slate-700'}`}>{opt.label}</span>
                        <span className={`text-[10px] font-semibold mt-0.5 ${orderType === opt.value ? 'text-blue-500' : 'text-slate-400'}`}>{opt.desc}</span>
                        {orderType === opt.value && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('payment_method')}</p>
                  <div className="space-y-2">
                    {[
                      { value: 'CASH', label: t('cash'), sub: t('cash_desc'), icon: '💵' },
                      { value: 'CARD', label: t('card'), sub: t('card_desc'), icon: '💳' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setPaymentMethod(opt.value as any)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                          paymentMethod === opt.value
                            ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-12 h-12 flex items-center justify-center text-2xl rounded-xl ${paymentMethod === opt.value ? 'bg-blue-100' : 'bg-gray-50'}`}>
                          {opt.icon}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-black uppercase tracking-tight ${paymentMethod === opt.value ? 'text-blue-800' : 'text-slate-800'}`}>{opt.label}</p>
                          <p className="text-[10px] font-semibold text-slate-400 leading-tight uppercase tracking-wider">{opt.sub}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          paymentMethod === opt.value ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                        }`}>
                          {paymentMethod === opt.value && (
                            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card QR Display */}
                {paymentMethod === 'CARD' && cardQrImage && (
                  <div className="p-4 bg-primary-50 border-2 border-primary-100 rounded-2xl text-center space-y-3 animate-fade-in-up">
                    <p className="text-[10px] font-black text-primary-700 uppercase tracking-widest">{t('card_qr_scan')}</p>
                    <div className="bg-white p-3 rounded-xl shadow-inner inline-block mx-auto border border-primary-100">
                      <img src={cardQrImage} alt="To'lov QR" className="w-32 h-32 object-contain" />
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-4">
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full btn-primary py-4 text-base shadow-lg shadow-primary-200 disabled:opacity-50"
                  >
                    {loading ? (
                      <><div className="spinner !w-5 !h-5" /><span>{t('placing')}</span></>
                    ) : (
                      <>
                        <span>{t('place_order')}</span>
                        <div className="bg-white/20 px-2 py-0.5 rounded-lg text-xs">🚀</div>
                      </>
                    )}
                  </button>
                  
                  <div className="bg-slate-50 rounded-2xl p-4 flex items-start gap-3">
                    <div className="text-xl">ℹ️</div>
                    <p className="text-[10px] font-bold text-slate-500 leading-normal uppercase tracking-wide">
                      {t('order_info')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
