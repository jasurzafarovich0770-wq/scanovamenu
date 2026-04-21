import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: 'light' | 'dark') {
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: getSystemTheme(),

      setTheme: (theme) => {
        const resolved = theme === 'system' ? getSystemTheme() : theme;
        applyTheme(resolved);
        set({ theme, resolvedTheme: resolved });
      },
    }),
    { name: 'theme-storage' }
  )
);

// Init on load
export function initTheme() {
  const stored = localStorage.getItem('theme-storage');
  let theme: Theme = 'system';
  if (stored) {
    try { theme = JSON.parse(stored)?.state?.theme ?? 'system'; } catch {}
  }
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  applyTheme(resolved);

  // Listen for system theme changes
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const current = useThemeStore.getState();
      if (current.theme === 'system') {
        const newResolved = e.matches ? 'dark' : 'light';
        applyTheme(newResolved);
        useThemeStore.setState({ resolvedTheme: newResolved });
      }
    });
  }
}
