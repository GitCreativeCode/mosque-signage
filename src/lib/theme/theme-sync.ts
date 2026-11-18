'use client';

import { useState, useEffect, useCallback } from 'react';

export type AppTheme = 'light' | 'dark';

export const THEME_COOKIE_NAME = 'mosque_admin_theme';
export const THEME_STORAGE_KEY = 'mosque_admin_theme';
export const THEME_EVENT_NAME = 'app-theme-changed';

/**
 * Reads the current theme preference from cookie, localStorage, or DOM class.
 */
export function getStoredTheme(defaultFallback: AppTheme = 'dark'): AppTheme {
  if (typeof window === 'undefined') return defaultFallback;

  try {
    // 1. Check DOM data-theme attribute set by head script or RootLayout
    const domTheme = document.documentElement.getAttribute('data-theme');
    if (domTheme === 'light' || domTheme === 'dark') {
      return domTheme;
    }

    // 2. Check Cookie
    const match = document.cookie.match(new RegExp(`(?:^|; )${THEME_COOKIE_NAME}=(light|dark)`));
    if (match?.[1] === 'light' || match?.[1] === 'dark') {
      return match[1];
    }

    // 3. Check localStorage
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    // 4. Check document element class
    if (document.documentElement.classList.contains('light')) {
      return 'light';
    }
    if (document.documentElement.classList.contains('dark')) {
      return 'dark';
    }
  } catch {
    // Storage access restricted
  }

  return defaultFallback;
}

/**
 * Universally applies the theme across DOM root element, cookies, localStorage, and triggers event.
 */
export function applyTheme(theme: AppTheme): void {
  if (typeof window === 'undefined') return;

  try {
    const isDark = theme === 'dark';

    // 1. Update <html> class and data-theme attribute
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
    document.documentElement.setAttribute('data-theme', theme);

    // 2. Persist in cookie (1 year expiration)
    document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=31536000; SameSite=Lax`;

    // 3. Persist in localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    // 4. Dispatch custom event for real-time bilateral synchronization
    window.dispatchEvent(new CustomEvent(THEME_EVENT_NAME, { detail: theme }));
  } catch {
    // Ignore restricted storage errors
  }
}

/**
 * Reactive React hook that listens to theme changes anywhere on the site
 * and provides bilateral synchronization.
 */
export function useAppTheme(initialFallback?: AppTheme) {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    return initialFallback || getStoredTheme('dark');
  });

  // Synchronize on mount and listen to global theme change events
  useEffect(() => {
    const activeTheme = getStoredTheme(initialFallback || 'dark');
    setThemeState(activeTheme);
    applyTheme(activeTheme);

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<AppTheme>;
      if (customEvent.detail === 'light' || customEvent.detail === 'dark') {
        setThemeState(customEvent.detail);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
        setThemeState(e.newValue);
        applyTheme(e.newValue);
      }
    };

    window.addEventListener(THEME_EVENT_NAME, handleThemeChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(THEME_EVENT_NAME, handleThemeChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [initialFallback]);

  const toggleTheme = useCallback(() => {
    const nextTheme: AppTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(nextTheme);
    applyTheme(nextTheme);
  }, [theme]);

  const setTheme = useCallback((newTheme: AppTheme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  }, []);

  return {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };
}
