'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const THEME_STORAGE_KEY = 'smartline-theme';
type StoreTheme = 'dark' | 'light';

function applyTheme(theme: StoreTheme) {
  document.documentElement.classList.toggle('light', theme === 'light');
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<StoreTheme>('light');

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme = savedTheme === 'dark' ? 'dark' : 'light';
    applyTheme(initialTheme);
    queueMicrotask(() => {
      setTheme(initialTheme);
      setMounted(true);
    });
  }, []);

  // Render placeholder to avoid layout shift during hydration
  if (!mounted) return <div className="h-10 w-10 shrink-0" />;

  const isDark = theme === 'dark';

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    applyTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all"
      style={{ color: 'var(--sl-text-secondary)' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-accent)';
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-bg-elevated)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-secondary)';
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      {isDark
        ? <Sun className="h-5 w-5" />
        : <Moon className="h-5 w-5" />
      }
    </button>
  );
}
