import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LockIcon, CheckCircleIcon } from '../components/Icons';
import { useVerification } from '../utils/useVerification';
import VerificationModal from '../components/VerificationModal';
import toast from 'react-hot-toast';

function genUsername(value: string): string {
  if (value.includes('@')) return value.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
  return 'user' + Date.now().toString().slice(-6);
}

export default function Register() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  const verification = useVerification();
  const { addUser, login } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => { setIsLoaded(true); }, []);

  const handleSendCode = async () => {
    if (!email.trim()) { toast.error('Email kiriting'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { toast.error("Email noto'g'ri formatda"); return; }
    setVerifyOpen(true);
    await verification.sendCode(email, 'email');
  };

  const handleVerifyConfirm = async (code: string): Promise<boolean> => {
    const ok = await verification.verify(code);
    if (ok) {
      setEmailVerified(true);
      toast.success('Email tasdiqlandi');
      setVerifyOpen(false);
    }
    return ok;
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Email kiritilishi shart";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Email noto'g'ri formatda";
    else if (!emailVerified) e.email = "Email tasdiqlanmagan. 'Tasdiqlash' tugmasini bosing";
    if (!password) e.password = "Parol kiritilmadi";
    else if (password.length < 6) e.password = "Kamida 6 ta belgi";
    if (password !== confirm) e.confirm = "Parollar mos kelmaydi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyOpen) return; // Modal ochiq paytda submit qilmaslik
    if (!validate()) return;
    setIsLoading(true);
    try {
      let username = genUsername(email.trim());
      let ok = await addUser(username, password, 'customer', undefined, { email: email.trim() });
      if (!ok) {
        username = username + Date.now().toString().slice(-4);
        ok = await addUser(username, password, 'customer', undefined, { email: email.trim() });
      }
      if (!ok) { toast.error("Bu email allaqachon ro'yxatdan o'tgan."); return; }
      const loginOk = await login(email.trim(), password);
      toast.success("Ro'yxatdan o'tish muvaffaqiyatli!");
      if (loginOk) {
        const { userType } = useAuthStore.getState();
        if (userType === 'admin') navigate('/admin');
        else if (userType === 'super-admin') navigate('/super-admin');
        else navigate('/');
      } else {
        navigate('/login');
      }
    } catch {
      toast.error("Xatolik yuz berdi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="decorative-blob w-96 h-96 bg-blue-400 top-20 right-10"></div>
        <div className="decorative-blob w-80 h-80 bg-indigo-400 bottom-20 left-10" style={{ animationDelay: '5s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className={`text-center mb-5 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <Link to="/login" className="inline-flex items-center text-gray-500 hover:text-gray-800 text-sm font-medium">
            &#8592; Kirishga qaytish
          </Link>
        </div>

        <div className={`bg-white rounded-2xl shadow-xl border border-gray-200 p-8 ${isLoaded ? 'animate-scale-in' : 'opacity-0'} ${verifyOpen ? 'invisible' : ''}`} style={{ animationDelay: '0.1s' }}>
          <div className="text-center mb-7">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
              <LockIcon className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Ro'yxatdan O'tish</h1>
            <p className="text-gray-500 text-sm mt-1">Email bilan ro'yxatdan o'ting</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailVerified(false); setErrors(p => ({ ...p, email: '' })); }}
                  placeholder="email@example.com"
                  className={`input-modern flex-1 ${errors.email ? 'border-red-400' : ''} ${emailVerified ? 'border-green-400 bg-green-50' : ''}`}
                />
                {emailVerified ? (
                  <span className="shrink-0 px-3 py-2 text-xs bg-green-100 text-green-700 rounded-lg font-medium border border-green-200">&#10003; Tasdiqlandi</span>
                ) : (
                  <button type="button" onClick={handleSendCode}
                    className="shrink-0 px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                    Tasdiqlash
                  </button>
                )}
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">&#9888; {errors.email}</p>}
            </div>

            {/* Parol */}
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <LockIcon className="w-3.5 h-3.5" /> Parol
              </p>
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                    placeholder="Kamida 6 ta belgi"
                    className={`input-modern w-full pr-16 ${errors.password ? 'border-red-400' : ''}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                    {showPassword ? 'Yashir' : "Ko'rsat"}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">&#9888; {errors.password}</p>}
              </div>
              <div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: '' })); }}
                  placeholder="Parolni qayta kiriting"
                  className={`input-modern w-full ${errors.confirm ? 'border-red-400' : ''}`}
                />
                {errors.confirm && <p className="text-xs text-red-500 mt-1">&#9888; {errors.confirm}</p>}
              </div>
            </div>

            {password && (
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                    password.length >= i * 3
                      ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-yellow-400' : i <= 3 ? 'bg-blue-400' : 'bg-green-500'
                      : 'bg-gray-200'
                  }`} />
                ))}
              </div>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full py-3 rounded-xl font-bold text-base bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoading
                ? <><div className="spinner w-4 h-4"></div><span>Ro'yxatdan o'tmoqda...</span></>
                : <><CheckCircleIcon className="w-5 h-5" /><span>Ro'yxatdan o'tish</span></>
              }
            </button>

            <p className="text-center text-sm text-gray-500">
              Allaqachon hisobingiz bormi?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">Kirish</Link>
            </p>
          </form>
        </div>
      </div>

      <VerificationModal
        isOpen={verifyOpen}
        target={email}
        type="email"
        timeLeft={verification.timeLeft}
        onVerify={handleVerifyConfirm}
        onResend={() => verification.sendCode(email, 'email')}
        onCancel={() => { setVerifyOpen(false); verification.reset(); }}
      />
    </div>
  );
}
