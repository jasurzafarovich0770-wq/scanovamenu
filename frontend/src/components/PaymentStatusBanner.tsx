import { Link } from 'react-router-dom';

interface Props {
  isActive: boolean;
  latestPayment: { status: string; adminNote?: string } | null;
  onRefresh?: () => void;
}

export default function PaymentStatusBanner({ isActive, latestPayment, onRefresh }: Props) {
  if (isActive) return null;

  // PENDING
  if (latestPayment?.status === 'PENDING') {
    return (
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">To'lov tekshirilmoqda</h2>
          <p className="text-gray-500 text-sm mb-6">
            To'lovingiz qabul qilindi va tekshirilmoqda. Odatda 1–24 soat ichida hisobingiz faollashadi.
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700 font-medium">
            Iltimos, kuting. Tasdiqlangandan so'ng avtomatik kirish imkoni beriladi.
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mt-4 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Holatni yangilash
            </button>
          )}
        </div>
      </div>
    );
  }

  // REJECTED
  if (latestPayment?.status === 'REJECTED') {
    return (
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">To'lov rad etildi</h2>
          {latestPayment.adminNote && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 text-sm text-red-700 text-left">
              <span className="font-semibold">Sabab: </span>{latestPayment.adminNote}
            </div>
          )}
          <p className="text-gray-500 text-sm mb-6">
            To'lovingiz rad etildi. Iltimos, qayta to'lov qiling.
          </p>
          <Link to="/payment"
            className="block w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors text-sm">
            Qayta to'lov qilish
          </Link>
        </div>
      </div>
    );
  }

  // No payment yet
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Obuna faol emas</h2>
        <p className="text-gray-500 text-sm mb-6">
          Platformadan to'liq foydalanish uchun oylik obuna to'lovini amalga oshiring.
          To'lovdan so'ng 1–24 soat ichida hisobingiz faollashadi.
        </p>
        <div className="bg-indigo-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Oylik narx</p>
          <p className="text-2xl font-black text-indigo-700">99,000 <span className="text-base font-normal text-indigo-400">so'm/oy</span></p>
        </div>
        <Link to="/payment"
          className="block w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors text-sm">
          To'lov qilish
        </Link>
        <p className="text-xs text-gray-400 mt-3">Click yoki Payme orqali to'lash mumkin</p>
      </div>
    </div>
  );
}
