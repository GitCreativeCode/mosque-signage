'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tag, X, ArrowRight, CheckCircle } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { APP_VERSION, OFFICIAL_RELEASE_HISTORY } from '@/lib/system/version';

const STORAGE_KEY = 'mosque_last_seen_version';

export interface WhatsNewModalProps {
  readonly forceOpen?: boolean;
  readonly onClose?: () => void;
}

export function WhatsNewModal({ forceOpen = false, onClose }: WhatsNewModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, APP_VERSION);
    } catch {}
    setIsOpen(false);
    onClose?.();
  };

  const modalRef = useFocusTrap({ isActive: isOpen, onEscape: handleDismiss });

  const currentRelease =
    OFFICIAL_RELEASE_HISTORY.find((item) => item.version === APP_VERSION) ||
    OFFICIAL_RELEASE_HISTORY[0];

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    try {
      const lastSeen = localStorage.getItem(STORAGE_KEY);
      // If never seen or updated to a newer version, show announcement
      if (lastSeen && lastSeen !== APP_VERSION) {
        setIsOpen(true);
      }
    } catch {
      // localStorage disabled or SSR
    }
  }, [forceOpen]);

  if (!isOpen || !currentRelease) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="whats-new-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-2xl p-6 sm:p-7 space-y-5"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-green-600/15 border border-green-600/30 text-green-600 dark:text-green-400 flex items-center justify-center shadow-xs">
              <Tag className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-full bg-green-600/10 border border-green-600/20 text-green-700 dark:text-green-400 text-[10px] font-mono font-bold">
                Version {APP_VERSION}
              </span>
              <h2 id="whats-new-title" className="text-base font-extrabold text-[var(--admin-text-primary)] tracking-tight mt-0.5">
                What&apos;s New in MosqueSignage
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-card-hover)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] transition cursor-pointer"
            aria-label="Dismiss What's New Dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-[var(--admin-text-secondary)]">
            {currentRelease.title}
          </p>
          <ul className="space-y-2 text-xs text-[var(--admin-text-muted)] leading-relaxed">
            {currentRelease.highlights.map((highlight, idx) => (
              <li key={idx} className="flex items-start space-x-2.5">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
          <Link
            href="/releases"
            onClick={handleDismiss}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] font-semibold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
          >
            <span>View Full Timeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-md shadow-green-600/20 transition cursor-pointer active:scale-95"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
