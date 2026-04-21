import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderApi } from '../lib/api';
import toast from 'react-hot-toast';
import {
  ForkKnifeIcon, SignalIcon, BellIcon,
  ClockIcon, ConfirmIcon, CookingIcon, BellRingIcon, ServeIcon, StarIcon, XCircleIcon
} from '../components/Icons';
import { useGuestStore } from '../store/useGuestStore';
import { useLangStore, translations } from '../store/useLangStore';
import ReceiptModal from '../components/ReceiptModal';

enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

interface Order {
  id: string;
  orderNumber: string;
  tableNumber: string;
  items: any[];
  total: number;
  status: OrderStatus;
  orderType?: 'DINE_IN' | 'TAKEAWAY';
  guestSessionId?: string;
  paymentMethod: string;
  createdAt: string;
}

const statusConfig: Record<OrderStatus, {
  icon: React.ReactNode;
  gradient: string;
  accentColor: string;
  bgLight: string;
  key: string;
}> = {
  PENDING:   { icon: <ClockIcon className="w-7 h-7" />,    key: 'status_pending',   gradient: 'from-amber-400 to-orange-500',   accentColor: '#f59e0b', bgLight: 'bg-amber-50' },
  CONFIRMED: { icon: <ConfirmIcon className="w-7 h-7" />,  key: 'status_confirmed', gradient: 'from-blue-500 to-indigo-600',    accentColor: '#6366f1', bgLight: 'bg-indigo-50' },
  PREPARING: { icon: <CookingIcon className="w-7 h-7" />,  key: 'status_preparing', gradient: 'from-violet-500 to-purple-600',  accentColor: '#8b5cf6', bgLight: 'bg-violet-50' },
  READY:     { icon: <BellRingIcon className="w-7 h-7" />, key: 'status_ready',     gradient: 'from-emerald-500 to-teal-600',   accentColor: '#10b981', bgLight: 'bg-emerald-50' },
  SERVED:    { icon: <ServeIcon className="w-7 h-7" />,    key: 'status_served',    gradient: 'from-cyan-500 to-blue-500',      accentColor: '#06b6d4', bgLight: 'bg-cyan-50' },
  COMPLETED: { icon: <StarIcon className="w-7 h-7" />,     key: 'status_completed', gradient: 'from-slate-600 to-slate-800',    accentColor: '#475569', bgLight: 'bg-slate-50' },
  CANCELLED: { icon: <XCircleIcon className="w-7 h-7" />,  key: 'status_cancelled', gradient: 'from-red-500 to-rose-600',       accentColor: '#ef4444', bgLight: 'bg-red-50' },
};

const stepDescriptions = [
  'step_pending',
  'step_confirmed',
  'step_preparing',
  'step_ready',
  'step_served',
];

export default function OrderTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { lang } = useLangStore();
  const t = useMemo(
    () => (key: string) => translations[lang]?.[key] || translations['uz']?.[key] || key,
    [lang]
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [waiterCalling, setWaiterCalling] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const { restaurantId, tableNumber: guestTable } = useGuestStore();

  const menuLink = restaurantId && guestTable ? `/r/${restaurantId}/t/${guestTable}` : '/menu';

  useEffect(() => { setIsLoaded(true); }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await orderApi.getById(orderId!);
        setOrder(response.data.data);
      } catch (error) {
        console.error('Failed to fetch order', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      await orderApi.cancelByGuest(order.id);
      setOrder({ ...order, status: OrderStatus.CANCELLED });
      toast.success(t('order_cancelled_success'));
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('cancel_error'));
    } finally {
      setCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  const handleCallWaiter = async () => {
    if (!order || waiterCalling) return;
    setWaiterCalling(true);
    try {
      await orderApi.callWaiter(order.id);
      setWaiterCalled(true);
      toast.success(t('waiter_called_toast'));
      setTimeout(() => setWaiterCalled(false), 3 * 60 * 1000);
    } catch {
      toast.error(t('error_occurred'));
    } finally {
      setWaiterCalling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" style={{ borderWidth: 3 }} />
          <p className="text-sm text-gray-400 font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-50 rounded-3xl flex items-center justify-center">
            <XCircleIcon className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('order_not_found')}</h2>
          <p className="text-gray-400 text-sm mb-8">{t('order_not_found_desc')}</p>
          <Link to={menuLink} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-semibold text-sm hover:bg-indigo-700 transition-colors">
            <ForkKnifeIcon className="w-4 h-4" />
            {t('back_to_menu')}
          </Link>
        </div>
      </div>
    );
  }

  const statusSteps = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED];
  const currentIndex = order.status === OrderStatus.COMPLETED
    ? statusSteps.length - 1
    : order.status === OrderStatus.CANCELLED ? -1
    : statusSteps.indexOf(order.status);
  const cfg = statusConfig[order.status];
  const isCancelled = order.status === OrderStatus.CANCELLED;
  const isDone = order.status === OrderStatus.COMPLETED || order.status === OrderStatus.SERVED;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className={`transition-all duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-sm font-bold text-gray-900">#{order.orderNumber}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-gray-400">{t('table_prefix')} {order.tableNumber}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className={`text-xs font-medium ${order.orderType === 'TAKEAWAY' ? 'text-orange-500' : 'text-indigo-500'}`}>
                {order.orderType === 'TAKEAWAY' ? t('takeaway') : t('dine_in')}
              </span>
            </div>
          </div>
          <Link to={menuLink}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold transition-colors border border-gray-200">
            <ForkKnifeIcon className="w-3.5 h-3.5" />
            {t('menu')}
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-5 gap-5">

          {/* Left — Status + Timeline */}
          <div className={`lg:col-span-3 space-y-4 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

            {/* Status Hero Card */}
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              {/* Gradient top bar */}
              <div className={`h-1.5 bg-gradient-to-r ${cfg.gradient}`} />
              <div className="p-8 text-center">
                <div className={`w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-white shadow-lg`}
                  style={{ boxShadow: `0 8px 24px ${cfg.accentColor}30` }}>
                  {cfg.icon}
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">{t(cfg.key)}</h2>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">{t('today_status')}</p>

                {order.status === OrderStatus.READY && (
                  <div className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-200">
                    <BellRingIcon className="w-4 h-4" />
                    Buyurtmangiz tayyor!
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h3 className="text-sm font-bold text-gray-900">{t('order_process')}</h3>
              </div>
              <div className="p-5 space-y-1">
                {statusSteps.map((status, index) => {
                  const stepCfg = statusConfig[status];
                  const isCompleted = !isCancelled && index <= currentIndex;
                  const isCurrent = !isCancelled && index === currentIndex;
                  const isPast = !isCancelled && index < currentIndex;

                  return (
                    <div key={status} className="relative flex items-start gap-4 py-3">
                      {/* Connector */}
                      {index < statusSteps.length - 1 && (
                        <div className={`absolute left-[22px] top-[52px] w-0.5 h-6 transition-colors duration-700 ${isPast ? 'bg-indigo-300' : 'bg-gray-100'}`} />
                      )}
                      {/* Icon */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                        isCompleted
                          ? `bg-gradient-to-br ${stepCfg.gradient} text-white shadow-md`
                          : 'bg-gray-50 text-gray-300 border border-gray-100'
                      } ${isCurrent ? 'scale-110' : ''}`}>
                        {isCompleted ? stepCfg.icon : <span className="text-xs font-black">{index + 1}</span>}
                      </div>
                      {/* Text */}
                      <div className="flex-1 pt-1">
                        <p className={`text-sm font-bold ${isCompleted ? 'text-gray-900' : 'text-gray-300'}`}>
                          {t(stepCfg.key)}
                        </p>
                        <p className={`text-xs mt-0.5 ${isCompleted ? 'text-gray-400' : 'text-gray-200'}`}>
                          {t(stepDescriptions[index])}
                        </p>
                      </div>
                      {/* Current indicator */}
                      {isCurrent && (
                        <div className="flex items-center gap-1.5 pt-1.5">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{t('now')}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right — Order summary + actions */}
          <div className={`lg:col-span-2 space-y-4 transition-all duration-500 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

            {/* Order items */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">{t('order_items')}</h3>
                <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                  {order.items.length} {t('items_ta')}
                </span>
              </div>
              <div className="p-4 space-y-1">
                {(order.items as any[]).map((item: any, i: number) => (
                  <div key={i} className="flex items-start justify-between py-2.5 px-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">×{item.quantity}</p>
                      {item.specialInstructions && (
                        <p className="text-[10px] text-amber-600 bg-amber-50 rounded-lg px-2 py-1 mt-1 font-medium">
                          💬 {item.specialInstructions}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-900 ml-3 shrink-0">
                      {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              {/* Total */}
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('total')}</span>
                <div className="text-right">
                  <span className="text-xl font-black text-indigo-600">{order.total.toLocaleString()}</span>
                  <span className="text-xs text-gray-400 ml-1">{t('som')}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="px-4 pb-4 space-y-2.5">
                {/* Chek */}
                {isDone && (
                  <button onClick={() => setShowReceipt(true)}
                    className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border border-emerald-100">
                    🧾 {t('get_receipt')}
                  </button>
                )}
                {/* Bekor qilish */}
                {order.status === OrderStatus.PENDING && (
                  <button onClick={() => setShowCancelConfirm(true)}
                    className="w-full py-3 text-red-500 hover:text-white hover:bg-red-500 border border-red-100 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                    <XCircleIcon className="w-3.5 h-3.5" />
                    {t('cancel_order')}
                  </button>
                )}
              </div>
            </div>

            {/* Live indicator */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                  <SignalIcon className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t('live_tracking')}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t('live_tracking_desc')}</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 shrink-0">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Live</span>
                </div>
              </div>
            </div>

            {/* Ofitsiant chaqirish */}
            {!isCancelled && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                      <BellIcon className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{t('call_waiter')}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t('waiter_call_desc')}</p>
                    </div>
                  </div>

                  {waiterCalled ? (
                    <div className="w-full py-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-xs font-bold text-emerald-700">{t('waiter_called')}</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleCallWaiter}
                      disabled={waiterCalling || isDone}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      {waiterCalling
                        ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('waiter_calling')}</>
                        : <><BellIcon className="w-3.5 h-3.5" />{t('call_waiter_btn')}</>
                      }
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Cancel Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowCancelConfirm(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <XCircleIcon className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">{t('cancel_confirm')}</h3>
            <p className="text-sm text-gray-400 mb-7">#{order.orderNumber} {t('cancel_confirm_desc')}</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowCancelConfirm(false)}
                className="py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl text-sm font-semibold transition-colors">
                {t('no')}
              </button>
              <button onClick={handleCancelOrder} disabled={cancelling}
                className="py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-sm font-semibold transition-colors disabled:opacity-50">
                {cancelling ? t('cancelling') : t('cancel_yes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && <ReceiptModal order={order} onClose={() => setShowReceipt(false)} />}
    </div>
  );
}
