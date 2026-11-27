'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sun, Moon, Laptop, Menu, X } from 'lucide-react';
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
  const { theme, preference, toggleTheme } = useAppTheme(initialTheme);
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    window.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      window.removeEventListener('keydown', onEscape);
    };
  }, [isMobileMenuOpen]);

  const handleBackClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== 'undefined') {
      // If opened in a new tab / window from admin, close the tab
      if (window.opener || window.history.length <= 1) {
        e.preventDefault();
        window.close();
        setTimeout(() => {
          if (!window.closed) {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              window.location.href = backHref;
            }
          }
        }, 100);
      }
    }
  };

  return (
    <header ref={menuContainerRef} className="sticky top-0 z-40 bg-[var(--admin-surface)] border-b border-[var(--admin-border)] px-3.5 sm:px-6 py-2.5 sm:py-3.5 shadow-xs transition-colors">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Back Link & Identity */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <Link
            href={backHref}
            onClick={handleBackClick}
            className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-1.5 flex items-center justify-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-card-hover)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] transition cursor-pointer shrink-0"
            title={backLabel}
            aria-label={backLabel}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <h1 className="text-sm font-bold text-[var(--admin-text-primary)] tracking-tight truncate">
                {title}
              </h1>
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md bg-green-600/15 border border-green-600/30 text-green-700 dark:text-green-400 shrink-0">
                BETA
              </span>
            </div>
            {subtitle && (
              <p className="text-[11px] text-[var(--admin-text-muted)] leading-none mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Navigation Links, Mobile Hamburger & Theme Switcher */}
        <div className="flex items-center space-x-2 sm:space-x-4 text-xs shrink-0">
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

          {/* Theme Toggle Button with Hydration Guard: Cycles System -> Light -> Dark */}
          <button
            type="button"
            onClick={toggleTheme}
            className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-1.5 flex items-center justify-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-card-hover)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] transition cursor-pointer"
            aria-label={
              mounted
                ? preference === 'system'
                  ? 'Theme: System Default (Click to switch to Light mode)'
                  : preference === 'light'
                  ? 'Theme: Light Mode (Click to switch to Dark mode)'
                  : 'Theme: Dark Mode (Click to switch to System mode)'
                : 'Switch theme'
            }
            title={
              mounted
                ? preference === 'system'
                  ? 'Theme: System Default (Click for Light mode)'
                  : preference === 'light'
                  ? 'Theme: Light Mode (Click for Dark mode)'
                  : 'Theme: Dark Mode (Click for System Default)'
                : 'Switch theme'
            }
            suppressHydrationWarning
          >
            {mounted ? (
              preference === 'system' ? (
                <Laptop className="w-4 h-4 text-emerald-500" />
              ) : theme === 'dark' ? (
                <Moon className="w-4 h-4 text-sky-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )
            ) : (
              <span className="w-4 h-4 block" aria-hidden="true" />
            )}
          </button>

          {/* Mobile Menu Toggle (< 640px) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="public-mobile-nav"
            aria-label={isMobileMenuOpen ? 'Close documentation menu' : 'Open documentation menu'}
            className="sm:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-card-hover)] text-[var(--admin-text-primary)] transition cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" aria-hidden="true" /> : <Menu className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <nav
          id="public-mobile-nav"
          aria-label="Mobile documentation links"
          className="sm:hidden mt-2.5 pt-2.5 border-t border-[var(--admin-border)] grid grid-cols-2 gap-2 text-xs animate-fadeIn"
        >
          {[
            { href: '/faq', label: 'FAQ & Guides' },
            { href: '/releases', label: 'Releases' },
            { href: '/privacy', label: 'Privacy Policy' },
            { href: '/terms', label: 'Terms of Use' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[44px] px-3 py-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-card-hover)] text-[var(--admin-text-primary)] font-semibold flex items-center justify-center transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

