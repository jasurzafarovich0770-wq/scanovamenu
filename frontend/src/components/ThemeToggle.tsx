import { useThemeStore } from '../store/useThemeStore';

const SunIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
  </svg>
);

const MoonIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const SystemIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <path d="M8 21h8M12 17v4"/>
  </svg>
);

interface ThemeToggleProps {
  variant?: 'icon' | 'full';
  /** transparent — qora/shaffof fon ustida (hero navbar) */
  transparent?: boolean;
  className?: string;
}

export default function ThemeToggle({ variant = 'icon', transparent = false, className = '' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useThemeStore();

  if (variant === 'icon') {
    const isDark = resolvedTheme === 'dark';

    if (transparent) {
      // Hero navbar uchun — shaffof fon ustida
      return (
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all bg-white/10 hover:bg-white/20 text-white/70 hover:text-white ${className}`}
          title={isDark ? 'Kunduzgi rejim' : 'Tungi rejim'}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
      );
    }

    return (
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
          isDark
            ? 'bg-slate-700 text-amber-400 hover:bg-slate-600'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        } ${className}`}
        title={isDark ? 'Kunduzgi rejim' : 'Tungi rejim'}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>
    );
  }

  // Full 3-option switcher
  const options = [
    { value: 'light' as const, icon: <SunIcon />, label: 'Kunduz' },
    { value: 'system' as const, icon: <SystemIcon />, label: 'Avto' },
    { value: 'dark' as const, icon: <MoonIcon />, label: 'Tun' },
  ];

  return (
    <div className={`flex items-center bg-gray-100 dark:bg-slate-800 rounded-xl p-1 gap-0.5 ${className}`}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            theme === opt.value
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
          }`}
          title={opt.label}
        >
          {opt.icon}
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
