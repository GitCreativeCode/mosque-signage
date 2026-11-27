'use client';

import React, { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { AdminPasswordForm } from './AdminPasswordForm';
import { AdminPinKeypadForm } from './AdminPinKeypadForm';

export interface AdminPinGateProps {
  readonly mosqueName?: string | undefined;
  readonly greeting?: string | undefined;
  readonly authMode?: 'pin' | 'password' | undefined;
  readonly onSuccess: () => void;
}

export function AdminPinGate({
  mosqueName = 'Islamic Community Center',
  greeting = 'Welcome to',
  authMode = 'pin',
  onSuccess,
}: AdminPinGateProps) {
  const [error, setError] = useState<string | null>(null);
  const isPasswordMode = authMode === 'password';

  return (
    <div className="min-h-[100dvh] bg-[var(--admin-bg)] flex flex-col items-center justify-center p-3 sm:p-4 selection:bg-neutral-700">
      <div className="w-full max-w-sm bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl p-5 sm:p-6 shadow-2xl text-[var(--admin-text-primary)] space-y-5 sm:space-y-6 animate-fadeIn">
        {/* Header Branding */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)] flex items-center justify-center mx-auto text-[var(--admin-text-primary)] shadow-sm">
            <Lock className="w-5 h-5 opacity-90" />
          </div>
          <p className="text-xs text-[var(--admin-text-muted)] font-medium">
            {greeting} {mosqueName}
          </p>
          <h2 className="text-lg font-bold tracking-tight text-[var(--admin-text-primary)]">
            Admin Access
          </h2>
          <p className="text-xs text-[var(--admin-text-muted)]">
            {isPasswordMode
              ? 'Enter your administrator credentials to unlock the administration panel.'
              : 'Enter your mosque management PIN to unlock the administration panel.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            id="admin-pin-error"
            role="alert"
            aria-live="assertive"
            className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center space-x-2 animate-fadeIn"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Dynamic Auth Barrier: Username+Password vs Tactile Numeric Keypad */}
        {isPasswordMode ? (
          <AdminPasswordForm onSuccess={onSuccess} error={error} setError={setError} />
        ) : (
          <AdminPinKeypadForm onSuccess={onSuccess} error={error} setError={setError} />
        )}

        {/* Default PIN Helper Footnote (PIN mode only) */}
        {!isPasswordMode && (
          <div className="pt-2 border-t border-[var(--admin-border)] text-center">
            <p className="text-[11px] text-[var(--admin-text-muted)]">
              Default factory PIN is{' '}
              <span className="font-mono font-bold text-[var(--admin-text-primary)]">1234</span>. You
              can change this anytime in Venue &amp; Display settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
