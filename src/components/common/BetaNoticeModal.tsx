'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, HelpCircle } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export const BETA_ACKNOWLEDGED_KEY = 'ms_beta_acknowledged';
export const BETA_RESET_EVENT = 'ms-beta-reset';

export function triggerBetaNoticeReset(): void {
  try {
    localStorage.removeItem(BETA_ACKNOWLEDGED_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(BETA_RESET_EVENT));
    }
  } catch {
    // Ignore
  }
}

export interface BetaNoticeModalProps {
  readonly isSuspended?: boolean;
}

export function BetaNoticeModal({ isSuspended = false }: BetaNoticeModalProps = {}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkState = () => {
      try {
        const acknowledged = localStorage.getItem(BETA_ACKNOWLEDGED_KEY);
        if (acknowledged !== 'true') {
          setIsOpen(true);
        }
      } catch {
        // LocalStorage unavailable (e.g. strict privacy mode)
        setIsOpen(false);
      }
    };

    checkState();

    const handleReset = () => {
      setIsOpen(true);
    };

    window.addEventListener(BETA_RESET_EVENT, handleReset);
    return () => {
      window.removeEventListener(BETA_RESET_EVENT, handleReset);
    };
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(BETA_ACKNOWLEDGED_KEY, 'true');
    } catch {
      // Ignore
    }
    setIsOpen(false);
  };

  const modalRef = useFocusTrap({
    isActive: isOpen,
    onEscape: handleDismiss,
  });

  if (!isOpen || isSuspended) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="beta-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg rounded-2xl sm:rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-2xl p-5 sm:p-7 space-y-5 sm:space-y-6 max-h-[92dvh] overflow-y-auto"
      >
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Public Beta Preview</span>
          </div>
          <h2 id="beta-modal-title" className="text-xl font-bold text-[var(--admin-text-primary)] tracking-tight mt-1">
            Welcome to MosqueSignage
          </h2>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-[var(--admin-text-secondary)] leading-relaxed">
          <p>
            Thank you for installing and testing <strong>MosqueSignage</strong>. This software is currently in active <strong>Community Beta</strong>.
          </p>
          <div className="p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex items-start space-x-3 text-xs text-amber-900 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              While core prayer calculation and TV display rendering are thoroughly tested for 24/7 reliability, you may encounter minor visual bugs or configuration edge cases.
            </p>
          </div>
          <p className="text-xs text-[var(--admin-text-muted)]">
            If you experience any issues or have feedback for our next update, please use the <strong>Problem Report</strong> link in the footer or email our community support team anytime.
          </p>
        </div>

        <div className="pt-2 border-t border-[var(--admin-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href="mailto:helpdesk.guidance@gmail.com"
            className="text-xs text-[var(--admin-text-muted)] hover:text-green-600 dark:hover:text-green-400 transition flex items-center space-x-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Need Help? Contact Support</span>
          </a>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold text-xs sm:text-sm transition flex items-center justify-center space-x-2 cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            <span>I Understand &amp; Continue</span>
          </button>
        </div>
      </div>
    </div>
  );
}
