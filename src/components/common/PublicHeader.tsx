'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { useAppTheme } from '@/lib/theme/theme-sync';

export interface PublicHeaderProps {
  readonly title?: string | undefined;
  readonly subtitle?: string | undefined;
  readonly backHref?: string | undefined;
  readonly backLabel?: string | undefined;
  readonly initialTheme?: 'light' | 'dark' | undefined;
}

export function PublicHeader({
  title = 'MosqueSignage',
  subtitle,
  backHref = '/admin',
  backLabel = 'Return to Admin',
  initialTheme,
}: PublicHeaderProps) {
  const { theme, toggleTheme } = useAppTheme(initialTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[var(--admin-surface)] border-b border-[var(--admin-border)] px-6 py-3.5 shadow-xs transition-colors">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Back Link & Identity */}
        <div className="flex items-center space-x-3">
          <Link
            href={backHref}
            className="p-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-card-hover)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] transition cursor-pointer"
            title={backLabel}
            aria-label={backLabel}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-sm font-bold text-[var(--admin-text-primary)] tracking-tight">
                {title}
              </h1>
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md bg-green-600/15 border border-green-600/30 text-green-700 dark:text-green-400">
                BETA
              </span>
            </div>
            {subtitle && (
              <p className="text-[11px] text-[var(--admin-text-muted)] leading-none mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Navigation Links & Theme Switcher */}
        <div className="flex items-center space-x-4 text-xs">
          <nav aria-label="Quick documentation links" className="hidden sm:flex items-center space-x-3 text-[var(--admin-text-muted)]">
            <Link
              href="/faq"
              className="hover:text-[var(--admin-text-primary)] hover:underline underline-offset-4 transition"
            >
              FAQ
            </Link>
            <Link
              href="/releases"
              className="hover:text-[var(--admin-text-primary)] hover:underline underline-offset-4 transition"
            >
              Releases
            </Link>
            <Link
              href="/privacy"
              className="hover:text-[var(--admin-text-primary)] hover:underline underline-offset-4 transition"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-[var(--admin-text-primary)] hover:underline underline-offset-4 transition"
            >
              Terms
            </Link>
          </nav>

          {/* Theme Toggle Button with Hydration Guard */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-card-hover)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] transition cursor-pointer"
            aria-label={mounted ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : 'Switch theme'}
            title={mounted ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : 'Switch theme'}
            suppressHydrationWarning
          >
            {mounted ? (
              theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[var(--admin-text-secondary)]" />
              )
            ) : (
              <span className="w-4 h-4 block" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

