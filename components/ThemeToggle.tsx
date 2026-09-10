'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.dataset.theme = 'dark';
    } else {
      delete document.documentElement.dataset.theme;
    }
    try {
      localStorage.setItem('theme', next);
    } catch {
      // localStorage unavailable — theme just won't persist across visits.
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle color theme"
      className={`text-[var(--text-muted)] transition-colors hover:text-[var(--accent)] ${className}`}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
