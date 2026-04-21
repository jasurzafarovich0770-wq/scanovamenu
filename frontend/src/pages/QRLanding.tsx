import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { ScanIcon, StoreIcon, UserIcon, CheckCircleIcon, AppLogo, ForkKnifeIcon } from '../components/Icons';
import { useAuthStore } from '../store/useAuthStore';
import { useLangStore, translations } from '../store/useLangStore';
import { useVerification } from '../utils/useVerification';
import VerificationModal from '../components/VerificationModal';
import ThemeToggle from '../components/ThemeToggle';
import { useThemeStore } from '../store/useThemeStore';
import toast from 'react-hot-toast';

// ── Login Form ─────────────────────────────────────────────────────────────
function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const { lang } = useLangStore();
  const t = useMemo(() => (key: string) => translations[lang]?.[key] || translations['uz']?.[key] || key, [lang]);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !password.trim()) { setError(t('login_error')); return; }
    setLoading(true);
    try {
      const ok = await login(identifier.trim(), password.trim());
      if (ok) {
        const { userType } = useAuthStore.getState();
        onSuccess();
        if (userType === 'super-admin') navigate('/super-admin');
        else if (userType === 'admin') navigate('/admin');
        else navigate('/');
      } else setError(t('login_error'));
    } catch { setError(t('login_error')); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-widest">{t('identifier_label')}</label>
        <input id="login-id" name="identifier" type="text" value={identifier} onChange={e => setIdentifier(e.target.value)}
          placeholder={t('identifier_placeholder')} autoComplete="username"
          className="w-full px-4 py-3 bg-white/8 border border-white/15 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-indigo-400 focus:bg-white/12 transition-all text-sm backdrop-blur-sm" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-widest">{t('password_label')}</label>
        <input id="login-pw" name="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="••••••••" autoComplete="current-password"
          className="w-full px-4 py-3 bg-white/8 border border-white/15 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-indigo-400 focus:bg-white/12 transition-all text-sm backdrop-blur-sm" />
      </div>
      {error && <p className="text-red-300 text-xs bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
        {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>{t('logging_in')}</span></> : t('login_btn')}
      </button>
    </form>
  );
}

// ── Register Form ──────────────────────────────────────────────────────────
function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { addUser, login } = useAuthStore();
  const { lang } = useLangStore();
  const t = useMemo(() => (key: string) => translations[lang]?.[key] || translations['uz']?.[key] || key, [lang]);
  const verification = useVerification();
  const navigate = useNavigate();

  const handleSendCode = async () => {
    if (!email.trim()) { toast.error(t('email_required')); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { toast.error(t('email_invalid')); return; }
    setVerifyOpen(true);
    await verification.sendCode(email, 'email');
  };

  const handleVerify = async (code: string): Promise<boolean> => {
    const ok = await verification.verify(code);
    if (ok) { setEmailVerified(true); toast.success(t('email_verified')); setVerifyOpen(false); }
    return ok;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const e2: Record<string, string> = {};
    if (!email.trim()) e2.email = t('email_required');
    else if (!emailVerified) e2.email = t('email_not_verified');
    if (!password || password.length < 6) e2.password = t('password_min');
    if (password !== confirm) e2.confirm = t('passwords_not_match');
    setErrors(e2);
    if (Object.keys(e2).length) return;
    setLoading(true);
    try {
      const genUser = (v: string) => v.includes('@') ? v.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) : 'user' + Date.now().toString().slice(-6);
      let username = genUser(email.trim());
      let ok = await addUser(username, password, 'customer', undefined, { email: email.trim() });
      if (!ok) { username += Date.now().toString().slice(-4); ok = await addUser(username, password, 'customer', undefined, { email: email.trim() }); }
      if (!ok) { toast.error(t('email_already_exists')); return; }
      const loginOk = await login(email.trim(), password);
      toast.success(t('register_success'));
      if (loginOk) {
        const { userType } = useAuthStore.getState();
        onSuccess();
        if (userType === 'admin') navigate('/admin');
        else if (userType === 'super-admin') navigate('/super-admin');
        else navigate('/');
      }
    } catch { toast.error(t('error_occurred')); }
    finally { setLoading(false); }
  };

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : password.length < 14 ? 3 : 4;
  const strengthColors = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-emerald-400'];

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-widest">{t('email_label')}</label>
          <div className="flex gap-2">
            <input id="reg-email" name="email" type="email" value={email}
              onChange={e => { setEmail(e.target.value); setEmailVerified(false); setErrors(p => ({ ...p, email: '' })); }}
              placeholder="email@example.com"
              className={`flex-1 px-4 py-3 bg-white/8 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-indigo-400 transition-all text-sm backdrop-blur-sm ${errors.email ? 'border-red-400/60' : emailVerified ? 'border-emerald-400/60' : 'border-white/15'}`} />
            {emailVerified
              ? <span className="shrink-0 px-3 py-3 text-xs bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30 font-semibold">✓</span>
              : <button type="button" onClick={handleSendCode} className="shrink-0 px-3 py-2 text-xs bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30 hover:bg-indigo-500/30 font-semibold transition-all">{t('verify_btn')}</button>
            }
          </div>
          {errors.email && <p className="text-red-300 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-widest">{t('password_label')}</label>
          <input id="reg-pw" name="password" type="password" value={password}
            onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
            placeholder="••••••••"
            className={`w-full px-4 py-3 bg-white/8 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-indigo-400 transition-all text-sm backdrop-blur-sm ${errors.password ? 'border-red-400/60' : 'border-white/15'}`} />
          {password && (
            <div className="flex gap-1 mt-2">
              {[1,2,3,4].map(i => <div key={i} className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColors[strength] : 'bg-white/10'}`} />)}
            </div>
          )}
          {errors.password && <p className="text-red-300 text-xs mt-1">{errors.password}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-widest">{t('confirm_password')}</label>
          <input id="reg-confirm" name="confirmPassword" type="password" value={confirm}
            onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: '' })); }}
            placeholder="••••••••"
            className={`w-full px-4 py-3 bg-white/8 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-indigo-400 transition-all text-sm backdrop-blur-sm ${errors.confirm ? 'border-red-400/60' : 'border-white/15'}`} />
          {errors.confirm && <p className="text-red-300 text-xs mt-1">{errors.confirm}</p>}
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
          {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>{t('registering')}</span></> : <><CheckCircleIcon className="w-4 h-4" />{t('register_btn')}</>}
        </button>
      </form>
      <VerificationModal isOpen={verifyOpen} target={email} type="email" timeLeft={verification.timeLeft}
        onVerify={handleVerify} onResend={() => verification.sendCode(email, 'email')}
        onCancel={() => { setVerifyOpen(false); verification.reset(); }} />
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function QRLanding() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [modal, setModal] = useState<'login' | 'register' | null>(null);
  const navigate = useNavigate();
  const { lang, setLang } = useLangStore();
  const t = useMemo(() => (key: string) => translations[lang]?.[key] || translations['uz']?.[key] || key, [lang]);
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  // Theme-aware colors — bir xil accent, faqat fon/matn farqli
  const heroBg       = isDark ? '#07091a' : '#fafbff';
  const sectionAlt   = isDark ? '#0b0f24' : '#f5f7ff';   // features, cta
  const sectionBase  = isDark ? '#080c1a' : '#ffffff';    // how it works
  const textPrimary  = isDark ? 'text-white'     : 'text-slate-900';
  const textSecondary= isDark ? 'text-white/45'  : 'text-slate-500';
  const badgeBg      = isDark
    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
    : 'bg-indigo-50 text-indigo-600 border border-indigo-100';
  const cardClass    = isDark
    ? 'border border-white/6 bg-white/3 hover:border-white/12'
    : 'border border-indigo-50 bg-white hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50';

  useEffect(() => {
    setIsLoaded(true);
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    { icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14h1v1h-1zM17 17h3v3h-3zM20 20h1v1h-1z"/></svg>, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', titleKey: 'feat1_title', descKey: 'feat1_desc' },
    { icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', titleKey: 'feat2_title', descKey: 'feat2_desc' },
    { icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', titleKey: 'feat3_title', descKey: 'feat3_desc' },
    { icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>, color: 'from-orange-500 to-rose-500', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', titleKey: 'feat4_title', descKey: 'feat4_desc' },
    { icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>, color: 'from-pink-500 to-rose-500', bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100', titleKey: 'feat5_title', descKey: 'feat5_desc' },
    { icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>, color: 'from-indigo-500 to-blue-600', bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', titleKey: 'feat6_title', descKey: 'feat6_desc' },
  ];

  const steps = [
    {
      titleKey: 'step1_title', descKey: 'step1_desc', num: '01',
      icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14h1v1h-1zM17 17h3v3h-3zM20 20h1v1h-1z"/></svg>,
      color: 'from-indigo-500 to-violet-500', iconColor: '#818cf8',
    },
    {
      titleKey: 'step2_title', descKey: 'step2_desc', num: '02',
      icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>,
      color: 'from-blue-500 to-cyan-500', iconColor: '#60a5fa',
    },
    {
      titleKey: 'step3_title', descKey: 'step3_desc', num: '03',
      icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>,
      color: 'from-emerald-500 to-teal-500', iconColor: '#34d399',
    },
    {
      titleKey: 'step4_title', descKey: 'step4_desc', num: '04',
      icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>,
      color: 'from-violet-500 to-purple-500', iconColor: '#a78bfa',
    },
  ];

  const stats = [
    { value: '99.9%', labelKey: 'stat_uptime', color: 'from-indigo-400 to-violet-400' },
    { value: '<1s', labelKey: 'stat_response', color: 'from-blue-400 to-cyan-400' },
    { value: '∞', labelKey: 'stat_orders', color: 'from-emerald-400 to-teal-400' },
    { value: '3', labelKey: 'stat_langs', color: 'from-violet-400 to-purple-400' },
  ];

  const scrolled = scrollY > 20;

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? (isDark ? 'bg-gray-950/95 backdrop-blur-xl shadow-sm border-b border-white/5' : 'bg-white/98 backdrop-blur-xl shadow-sm border-b border-gray-100/80') : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className={`flex items-center gap-2.5 transition-all duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <AppLogo size={34} />
            <div className="hidden sm:block">
              <p className={`text-sm font-bold leading-none ${scrolled ? 'text-gray-900' : isDark ? 'text-white' : 'text-gray-900'}`}>Restaurant QR</p>
              <p className={`text-[10px] leading-none mt-0.5 ${scrolled ? 'text-gray-400' : isDark ? 'text-white/50' : 'text-gray-500'}`}>{t('app_tagline')}</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className={`hidden md:flex items-center gap-1 transition-all duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            {/* Lang switcher */}
            <div className={`flex items-center rounded-lg p-0.5 gap-0.5 mr-3 ${scrolled ? 'bg-gray-100' : isDark ? 'bg-white/10 backdrop-blur-sm' : 'bg-gray-100'}`}>
              {(['uz', 'ru', 'en'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${lang === l
                    ? scrolled || !isDark ? 'bg-white text-gray-900 shadow-sm' : 'bg-white/25 text-white'
                    : scrolled || !isDark ? 'text-gray-400 hover:text-gray-700' : 'text-white/40 hover:text-white/70'}`}>
                  {l}
                </button>
              ))}
            </div>

            <Link to="/scanner"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${scrolled || !isDark ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
              <ScanIcon className="w-4 h-4" />
              {t('scanner_link')}
            </Link>

            <button onClick={() => setModal('register')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${scrolled || !isDark ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
              <UserIcon className="w-4 h-4" />
              {t('register_link2')}
            </button>

            <button onClick={() => setModal('login')}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/20 hover:-translate-y-0.5 ml-1">
              {t('login_link2')}
            </button>
            <ThemeToggle transparent={isDark && !scrolled} />
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <div className={`flex items-center rounded-lg p-0.5 gap-0.5 ${scrolled || !isDark ? 'bg-gray-100' : 'bg-white/10'}`}>
              {(['uz', 'ru', 'en'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${lang === l ? (scrolled || !isDark ? 'bg-white text-gray-900 shadow-sm' : 'bg-white/25 text-white') : (scrolled || !isDark ? 'text-gray-400' : 'text-white/40')}`}>
                  {l}
                </button>
              ))}
            </div>
            <ThemeToggle transparent={isDark && !scrolled} />
            <button onClick={() => setModal('login')} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl">
              {t('login_link2')}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0" style={{ backgroundColor: heroBg }}>
          {/* Noise texture */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }}></div>
          {/* Gradient mesh */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.25) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(139,92,246,0.15) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(59,130,246,0.12) 0%, transparent 50%)' }}></div>
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '80px 80px' }}></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-20">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 backdrop-blur-sm border rounded-full text-xs font-medium mb-10 transition-all duration-700 ${isDark ? 'bg-white/5 border-white/10 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-600'} ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            {t('hero_badge')}
          </div>

          {/* Heading */}
          <h1 className={`text-5xl sm:text-6xl md:text-7xl font-black mb-6 leading-[1.05] tracking-tight transition-all duration-700 delay-100 ${isDark ? 'text-white' : 'text-gray-900'} ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            {t('hero_title1')}
            <br />
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">
              {t('hero_title2')}
            </span>
          </h1>

          <p className={`text-base md:text-lg mb-12 max-w-xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${isDark ? 'text-white/50' : 'text-gray-500'} ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            {t('hero_desc')}
          </p>

          {/* CTA */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 mb-20 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <Link to="/r/demo-restaurant/t/1"
              className="group flex items-center gap-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl transition-all shadow-xl shadow-indigo-500/20 hover:-translate-y-0.5 text-sm">
              <ForkKnifeIcon className="w-4 h-4" />
              {t('demo_menu')}
              <svg className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <button onClick={async () => {
              const { login } = useAuthStore.getState();
              const ok = await login('demoadmin', 'demo1234');
              if (ok) navigate('/admin');
              else setModal('login');
            }} className={`flex items-center gap-2 px-7 py-3.5 font-medium rounded-2xl border transition-all text-sm ${isDark ? 'bg-white/6 hover:bg-white/10 text-white/80 hover:text-white border-white/10 hover:border-white/20 backdrop-blur-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'}`}>
              <StoreIcon className="w-4 h-4" />
              {t('demo_admin')}
            </button>
          </div>

          {/* Stats */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-24 transition-all duration-700 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            {stats.map((s, i) => (
              <div key={i} className={`relative group overflow-hidden rounded-2xl p-5 text-center transition-all duration-300 ${isDark ? 'border border-white/8 bg-white/4 backdrop-blur-sm hover:border-white/15 hover:bg-white/6' : 'border border-indigo-100 bg-white hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50'}`}>
                {/* Subtle gradient top line */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-px bg-gradient-to-r ${s.color} opacity-60 group-hover:opacity-100 group-hover:w-12 transition-all duration-300`} />
                <div className={`text-2xl font-black bg-gradient-to-r ${s.color} bg-clip-text text-transparent leading-none mb-1.5`}>{s.value}</div>
                <div className={`text-[10px] uppercase tracking-widest font-medium ${isDark ? 'text-white/35' : 'text-gray-400'}`}>{t(s.labelKey)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          <span className={`text-[9px] uppercase tracking-[0.3em] font-medium ${isDark ? 'text-white/50' : 'text-gray-400'}`}>{t('scroll_down')}</span>
          <div className="flex flex-col items-center gap-0.5">
            {[0, 1, 2].map(i => (
              <svg
                key={i}
                className="w-3.5 h-3.5"
                style={{
                  animation: `scrollFade 1.5s ease-in-out ${i * 0.2}s infinite`,
                  color: i === 0 ? 'rgba(129,140,248,0.9)' : i === 1 ? 'rgba(129,140,248,0.55)' : 'rgba(129,140,248,0.25)',
                }}
                viewBox="0 0 12 8" fill="none"
              >
                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ))}
          </div>
          <style>{`
            @keyframes scrollFade {
              0%, 100% { opacity: 0.4; transform: translateY(0); }
              50% { opacity: 1; transform: translateY(4px); }
            }
          `}</style>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ backgroundColor: sectionAlt }} className="py-24 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-4 uppercase tracking-wider ${badgeBg}`}>{t('features_badge')}</span>
            <h2 className={`text-3xl md:text-4xl font-black mb-3 tracking-tight ${textPrimary}`}>{t('features_title')}</h2>
            <p className={`text-base max-w-lg mx-auto ${textSecondary}`}>{t('features_desc')}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 cursor-default ${cardClass} ${isDark ? 'backdrop-blur-sm' : ''}`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 bg-gradient-to-br ${f.color} rounded-2xl pointer-events-none`} />
                <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${f.color} opacity-0 group-hover:opacity-60 transition-opacity duration-500`} />
                <div className="relative w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110">
                  <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${f.color} ${isDark ? 'opacity-15 group-hover:opacity-25' : 'opacity-10 group-hover:opacity-20'} transition-opacity`} />
                  <span className={`relative ${f.text}`}>{f.icon}</span>
                </div>
                <h3 className={`text-base font-bold mb-2 ${textPrimary}`}>{t(f.titleKey)}</h3>
                <p className={`text-sm leading-relaxed ${textSecondary}`}>{t(f.descKey)}</p>
                <div className={`absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl ${f.color} opacity-0 group-hover:opacity-5 rounded-tl-3xl transition-opacity duration-500`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ backgroundColor: sectionBase }} className="py-24 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-4 uppercase tracking-wider ${isDark ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'bg-violet-50 text-violet-600'}`}>{t('how_it_works_badge')}</span>
            <h2 className={`text-3xl md:text-4xl font-black mb-3 tracking-tight ${textPrimary}`}>{t('how_it_works_title')}</h2>
            <p className={`text-base ${textSecondary}`}>{t('how_it_works_desc')}</p>
          </div>

          <div className="grid md:grid-cols-4 gap-4 relative">
            <div className="hidden md:block absolute top-[2.6rem] left-[14%] right-[14%] h-px"
              style={{ background: isDark ? 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3) 20%, rgba(99,102,241,0.3) 80%, transparent)' : 'linear-gradient(90deg, transparent, rgba(99,102,241,0.2) 20%, rgba(99,102,241,0.2) 80%, transparent)' }} />

            {steps.map((step, i) => (
              <div key={i} className="group relative flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500 scale-150`} />
                  <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center group-hover:-translate-y-1 transition-all duration-300 ${isDark ? 'border border-white/8 bg-white/4 backdrop-blur-sm hover:border-white/15' : 'border border-indigo-100 bg-white shadow-sm hover:shadow-md hover:border-indigo-200'}`}>
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    <div className={`absolute top-0 left-0 right-0 h-px rounded-t-2xl bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-70 transition-opacity duration-300`} />
                    <span className="relative" style={{ color: step.iconColor }}>{step.icon}</span>
                  </div>
                  <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-[9px] font-black shadow-lg`}>
                    {i + 1}
                  </div>
                </div>
                <h3 className={`text-sm font-bold mb-2 ${textPrimary}`}>{t(step.titleKey)}</h3>
                <p className={`text-xs leading-relaxed ${textSecondary}`}>{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ backgroundColor: sectionAlt }} className="py-24 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative bg-[#080c1a] rounded-3xl p-12 md:p-16 text-center overflow-hidden">
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(99,102,241,0.3) 0%, transparent 60%)' }}></div>
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-white/10 text-white/70 text-xs font-semibold rounded-full mb-6 uppercase tracking-wider">{t('cta_badge')}</span>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">{t('cta_title')}</h2>
              <p className="text-white/40 text-base mb-10 max-w-md mx-auto">{t('cta_desc')}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button onClick={() => setModal('register')}
                  className="flex items-center gap-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl transition-all shadow-xl shadow-indigo-500/20 hover:-translate-y-0.5 text-sm">
                  <UserIcon className="w-4 h-4" />
                  {t('register_link2')}
                </button>
                <button onClick={() => setModal('login')}
                  className="flex items-center gap-2 px-7 py-3.5 bg-white/6 hover:bg-white/10 text-white/70 hover:text-white font-medium rounded-2xl border border-white/10 hover:border-white/20 transition-all text-sm">
                  {t('login_link2')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MODAL ── */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="absolute inset-0 bg-[#080c1a]/80 backdrop-blur-xl" />
          <div className="relative z-10 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="bg-white/6 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
              {/* Close */}
              <button onClick={() => setModal(null)}
                className="absolute top-4 right-4 w-7 h-7 bg-white/8 hover:bg-white/15 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all z-10">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
              {/* Tabs */}
              <div className="flex border-b border-white/8">
                <button onClick={() => setModal('login')}
                  className={`flex-1 py-4 text-xs font-bold tracking-widest uppercase transition-all ${modal === 'login' ? 'text-white border-b-2 border-indigo-400' : 'text-white/30 hover:text-white/60'}`}>
                  {t('login_link2')}
                </button>
                <button onClick={() => setModal('register')}
                  className={`flex-1 py-4 text-xs font-bold tracking-widest uppercase transition-all ${modal === 'register' ? 'text-white border-b-2 border-indigo-400' : 'text-white/30 hover:text-white/60'}`}>
                  {t('register_link2')}
                </button>
              </div>
              <div className="p-7">
                {modal === 'login' ? <LoginForm onSuccess={() => setModal(null)} /> : <RegisterForm onSuccess={() => setModal(null)} />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor: isDark ? '#030712' : '#111827' }} className="text-white py-14 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <AppLogo size={32} />
                <span className="text-base font-bold">Restaurant QR</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{t('footer_desc')}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">{t('footer_links')}</h3>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><button onClick={() => setModal('login')} className="hover:text-white transition-colors">{t('admin_panel')}</button></li>
                <li><Link to="/scanner" className="hover:text-white transition-colors">{t('scanner_link')}</Link></li>
                <li><button onClick={() => setModal('register')} className="hover:text-white transition-colors">{t('register_link2')}</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">{t('footer_contact')}</h3>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li>info@restaurantqr.uz</li>
                <li>{t('footer_location')}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-gray-600 text-xs">{t('footer_rights')}</p>
            <div className="flex items-center gap-2 text-gray-600 text-xs">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              {t('footer_status')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
