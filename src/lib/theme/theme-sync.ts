'use client';

import { useState, useEffect, useCallback } from 'react';

export type AppTheme = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_COOKIE_NAME = 'mosque_admin_theme';
export const THEME_PREF_COOKIE_NAME = 'mosque_admin_theme_pref';
export const THEME_STORAGE_KEY = 'mosque_admin_theme';
export const THEME_PREF_STORAGE_KEY = 'mosque_admin_theme_pref';
export const THEME_EVENT_NAME = 'app-theme-changed';

/**
 * Resolves current system/OS color scheme preference.
 */
export function getSystemTheme(): AppTheme {
  if (typeof window === 'undefined') return 'dark';
  try {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
}

/**
 * Reads the stored 3-way theme preference (system, light, or dark).
 */
export function getStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${THEME_PREF_COOKIE_NAME}=(system|light|dark)`));
    if (match?.[1] === 'system' || match?.[1] === 'light' || match?.[1] === 'dark') {
      return match[1];
    }
    const stored = localStorage.getItem(THEME_PREF_STORAGE_KEY);
    if (stored === 'system' || stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // Restricted storage
  }
  return 'system';
}

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

    // 5. Check if preference is explicitly set to system in localStorage
    const pref = localStorage.getItem(THEME_PREF_STORAGE_KEY);
    if (pref === 'system') {
      return getSystemTheme();
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
 * Persists 3-way preference and applies resolved theme.
 */
export function applyThemePreference(pref: ThemePreference): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_PREF_STORAGE_KEY, pref);
    document.cookie = `${THEME_PREF_COOKIE_NAME}=${pref}; path=/; max-age=31536000; SameSite=Lax`;
    const resolved = pref === 'system' ? getSystemTheme() : pref;
    applyTheme(resolved);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Reactive React hook that listens to theme changes anywhere on the site
 * and provides bilateral synchronization.
 */
export function useAppTheme(
  initialFallback: AppTheme = 'dark',
  initialPreference: ThemePreference = 'system'
) {
  const [theme, setThemeState] = useState<AppTheme>(initialFallback);
  const [preference, setPreferenceState] = useState<ThemePreference>(initialPreference);
  const [mounted, setMounted] = useState<boolean>(false);

  // Synchronize on mount and listen to global theme change events
  useEffect(() => {
    setMounted(true);
    const activePref = getStoredPreference();
    setPreferenceState(activePref);
    const resolvedTheme = activePref === 'system' ? getSystemTheme() : getStoredTheme(initialFallback);
    setThemeState(resolvedTheme);
    applyTheme(resolvedTheme);

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<AppTheme>;
      if (customEvent.detail === 'light' || customEvent.detail === 'dark') {
        setThemeState(customEvent.detail);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_PREF_STORAGE_KEY && (e.newValue === 'system' || e.newValue === 'light' || e.newValue === 'dark')) {
        setPreferenceState(e.newValue);
        const next = e.newValue === 'system' ? getSystemTheme() : (e.newValue as AppTheme);
        setThemeState(next);
        applyTheme(next);
      } else if (e.key === THEME_STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
        setThemeState(e.newValue);
        applyTheme(e.newValue);
      }
    };

    window.addEventListener(THEME_EVENT_NAME, handleThemeChange);
    window.addEventListener('storage', handleStorageChange);

    // Listen to OS prefers-color-scheme changes when in system mode
    let mediaQuery: MediaQueryList | null = null;
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (getStoredPreference() === 'system') {
        const nextTheme = e.matches ? 'dark' : 'light';
        setThemeState(nextTheme);
        applyTheme(nextTheme);
      }
    };

    try {
      if (typeof window !== 'undefined' && window.matchMedia) {
        mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', handleMediaChange);
      }
    } catch {
      // MediaQueryList unsupported
    }

    return () => {
      window.removeEventListener(THEME_EVENT_NAME, handleThemeChange);
      window.removeEventListener('storage', handleStorageChange);
      mediaQuery?.removeEventListener('change', handleMediaChange);
    };
  }, [initialFallback]);

  const toggleTheme = useCallback(() => {
    // Cycle: system -> light -> dark -> system
    const nextPref: ThemePreference =
      preference === 'system' ? 'light' : preference === 'light' ? 'dark' : 'system';
    setPreferenceState(nextPref);
    applyThemePreference(nextPref);
    const resolved = nextPref === 'system' ? getSystemTheme() : nextPref;
    setThemeState(resolved);
  }, [preference]);

  const setTheme = useCallback((newTheme: AppTheme) => {
    setPreferenceState(newTheme);
    setThemeState(newTheme);
    applyThemePreference(newTheme);
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    applyThemePreference(pref);
    const resolved = pref === 'system' ? getSystemTheme() : pref;
    setThemeState(resolved);
  }, []);

  return {
    theme,
    preference,
    toggleTheme,
    setTheme,
    setPreference,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    isSystem: preference === 'system',
    mounted,
  };
}
