import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { HomeIcon, LockIcon } from '../components/Icons';
import { useLangStore, translations } from '../store/useLangStore';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const { login } = useAuthStore();
  const { lang, setLang } = useLangStore();
  const t = useMemo(() => (key: string) => translations[lang]?.[key] || translations['uz']?.[key] || key, [lang]);
  const navigate = useNavigate();

  useEffect(() => { setIsLoaded(true); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = identifier.trim();
    const trimmedPass = password.trim();

    if (!trimmed) { setError('Email yoki telefon raqam kiriting'); return; }
    if (!trimmedPass) { setError('Parolni kiriting'); return; }

    setIsLoading(true);
    try {
      const success = await login(trimmed, trimmedPass);
      if (success) {
        // State yangilanishini kutish
        await new Promise(r => setTimeout(r, 50));
        const { userType } = useAuthStore.getState();
        if (userType === 'super-admin') navigate('/super-admin');
        else if (userType === 'admin') navigate('/admin');
        else navigate('/');
      } else {
        setError('Email/telefon yoki parol noto\'g\'ri');
      }
    } catch {
      setError('Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
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
        <div className={`text-center mb-6 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors font-semibold">
            <HomeIcon className="w-4 h-4 mr-2" />
            {t('back_home')}
          </Link>
        </div>

        <div className={`bg-white rounded-3xl p-8 shadow-xl border border-gray-200 ${isLoaded ? 'animate-scale-in' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mx-auto flex items-center justify-center mb-5 shadow-xl">
              <LockIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('login_title')}</h1>
            <p className="text-gray-500 text-sm">{t('login_subtitle')}</p>
          </div>

          {/* Til tanlash */}
          <div className="flex justify-center gap-1 mb-6">
            {(['uz', 'ru', 'en'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${lang === l ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {l}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="identifier" className="block text-sm font-bold text-gray-700 mb-2">
                {t('identifier_label')}
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={t('identifier_placeholder')}
                className="input-modern w-full"
                required
                autoComplete="username"
                inputMode="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                {t('password_label')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('password_placeholder')}
                className="input-modern w-full"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="alert-modern alert-danger animate-shake">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-base bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="spinner"></div>
                  <span>{t('logging_in')}</span>
                </div>
              ) : t('login_btn')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              {t('no_account')}{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
                {t('register_link')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
