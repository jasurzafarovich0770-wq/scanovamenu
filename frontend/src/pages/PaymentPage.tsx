import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionApi, uploadApi } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { useLangStore, translations } from '../store/useLangStore';
import toast from 'react-hot-toast';

const PAYMENT_AMOUNT = 99000; // so'm/oy
const CLICK_CARD = '5614 6835 1324 8583';
const PAYME_CARD = '5614 6835 1324 8583';

export default function PaymentPage() {
  const navigate = useNavigate();
  const { username } = useAuthStore();
  const { lang } = useLangStore();
  const t = useMemo(() => (key: string) => translations[lang]?.[key] || translations['uz']?.[key] || key, [lang]);

  const [screenshot, setScreenshot] = useState<string>('');       // preview (base64)
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null); // actual file
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [myPayments, setMyPayments] = useState<any[]>([]);
  const [activeMethod, setActiveMethod] = useState<'click' | 'payme'>('click');

  useEffect(() => {
    subscriptionApi.getMyPayments()
      .then(res => setMyPayments(res.data.data || []))
      .catch(() => {});
  }, []);

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Rasm 5MB dan kichik bo\'lsin'); return; }
    setScreenshotFile(file);
    // Preview uchun base64
    const reader = new FileReader();
    reader.onloadend = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshotFile) { toast.error('Screenshot yuklang'); return; }
    setLoading(true);
    try {
      // POST /upload orqali yuborish (Cloudinary yoki base64 fallback)
      setUploadingScreenshot(true);
      let screenshotUrl: string;
      try {
        screenshotUrl = await uploadApi.uploadFile(screenshotFile);
      } catch {
        // uploadApi xato bo'lsa — base64 ni to'g'ridan-to'g'ri ishlatish
        screenshotUrl = screenshot;
      }
      setUploadingScreenshot(false);

      await subscriptionApi.submitPayment({
        amount: PAYMENT_AMOUNT,
        screenshotUrl,
        comment,
      });
      toast.success('To\'lov yuborildi! Tez orada tekshiriladi.');
      const res = await subscriptionApi.getMyPayments();
      setMyPayments(res.data.data || []);
      setScreenshot('');
      setScreenshotFile(null);
      setComment('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
      setUploadingScreenshot(false);
    }
  };

  const pendingPayment = myPayments.find(p => p.status === 'PENDING');
  const approvedPayment = myPayments.find(p => p.status === 'APPROVED');

  const statusBadge = (status: string) => {
    if (status === 'PENDING') return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Tekshirilmoqda</span>;
    if (status === 'APPROVED') return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Tasdiqlandi ✓</span>;
    return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Rad etildi</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Obuna to'lovi</h1>
          <p className="text-gray-500 text-sm mt-1">Platformadan to'liq foydalanish uchun oylik to'lovni amalga oshiring</p>
        </div>

        {/* Approved */}
        {approvedPayment && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">✅</div>
            <p className="font-bold text-green-800">Hisobingiz faol!</p>
            <p className="text-green-600 text-sm mt-1">To'lovingiz tasdiqlangan. Platformadan to'liq foydalanishingiz mumkin.</p>
            <button onClick={() => navigate('/admin')} className="mt-4 px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors">
              Admin panelga o'tish →
            </button>
          </div>
        )}

        {/* Pending */}
        {pendingPayment && !approvedPayment && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">⏳</div>
            <p className="font-bold text-amber-800">To'lovingiz tekshirilmoqda</p>
            <p className="text-amber-600 text-sm mt-1">Odatda 1-24 soat ichida tekshiriladi. Sabr qiling.</p>
            <p className="text-amber-500 text-xs mt-2">Yuborilgan: {new Date(pendingPayment.createdAt).toLocaleString('uz-UZ')}</p>
          </div>
        )}

        {/* Price card */}
        {!approvedPayment && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">Oylik obuna</p>
                <p className="text-3xl font-black text-gray-900">{PAYMENT_AMOUNT.toLocaleString()} <span className="text-lg text-gray-400">so'm</span></p>
              </div>
              <div className="bg-indigo-50 px-3 py-1.5 rounded-xl">
                <p className="text-xs font-bold text-indigo-600">1 OY</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              {['Cheksiz menyu boshqaruvi', 'QR kod tizimi', 'Real-time buyurtmalar', 'Analitika va hisobotlar'].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Payment methods */}
        {!approvedPayment && !pendingPayment && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-gray-900">To'lov usulini tanlang</h2>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  id: 'click',
                  label: 'Click',
                  card: CLICK_CARD,
                  logo: (
                    <div className="h-10 w-auto bg-black rounded-lg px-2 flex items-center justify-center">
                      <img
                        src="/click-logo.png"
                        alt="Click"
                        className="h-6 w-auto object-contain"
                      />
                    </div>
                  ),
                },
                {
                  id: 'payme',
                  label: 'Payme',
                  card: PAYME_CARD,
                  logo: (
                    <img
                      src="/payme-logo.png"
                      alt="Payme"
                      className="h-10 w-auto object-contain"
                    />
                  ),
                },
              ].map(m => (
                <button key={m.id} onClick={() => setActiveMethod(m.id as any)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${activeMethod === m.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="mb-2 h-10 flex items-center">{m.logo}</div>
                  <p className="font-bold text-sm text-gray-900">{m.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Karta orqali</p>
                </button>
              ))}
            </div>

            {/* Card info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">To'lov rekvizitlari</p>
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm font-bold text-gray-900">
                  {activeMethod === 'click' ? CLICK_CARD : PAYME_CARD}
                </p>
                <button onClick={() => {
                  navigator.clipboard.writeText(activeMethod === 'click' ? CLICK_CARD : PAYME_CARD);
                  toast.success('Nusxalandi!');
                }} className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">
                  Nusxalash
                </button>
              </div>
              <p className="text-xs text-gray-500">Summa: <span className="font-bold text-gray-900">{PAYMENT_AMOUNT.toLocaleString()} so'm</span></p>
              <p className="text-xs text-gray-500">Izoh: <span className="font-bold text-gray-900">{username}</span></p>
            </div>

            {/* Screenshot upload */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  To'lov screenshoti <span className="text-red-500">*</span>
                </label>
                <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${screenshotFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-indigo-400'}`}>
                  {screenshotFile ? (
                    <div className="space-y-2">
                      <img src={screenshot} alt="Screenshot" className="max-h-40 mx-auto rounded-lg object-contain" />
                      <button type="button" onClick={() => { setScreenshot(''); setScreenshotFile(null); }} className="text-xs text-red-500 hover:text-red-600">O'chirish</button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <p className="text-sm text-gray-500">Screenshot yuklash uchun bosing</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG — max 5MB</p>
                      <input type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Izoh (ixtiyoriy)</label>
                <input type="text" value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Qo'shimcha ma'lumot..."
                  className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 placeholder:text-gray-400" />
              </div>

              <button type="submit" disabled={loading || !screenshot}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {uploadingScreenshot
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Yuklanmoqda...</>
                  : loading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Yuborilmoqda...</>
                  : '📤 To\'lovni yuborish'}
              </button>
            </form>
          </div>
        )}

        {/* History */}
        {myPayments.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">To'lovlar tarixi</h3>
            <div className="space-y-2">
              {myPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{p.amount.toLocaleString()} so'm</p>
                    <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString('uz-UZ')}</p>
                    {p.adminNote && <p className="text-xs text-red-500 mt-0.5">Izoh: {p.adminNote}</p>}
                  </div>
                  {statusBadge(p.status)}
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => navigate('/admin')} className="w-full py-3 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors">
          ← Admin panelga qaytish
        </button>
      </div>
    </div>
  );
}
