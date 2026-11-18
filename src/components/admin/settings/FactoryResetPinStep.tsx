'use client';

import React, { useState } from 'react';
import { AlertTriangle, ArrowLeft, KeyRound, Loader2, Eye, EyeOff } from 'lucide-react';

export interface FactoryResetPinStepProps {
  readonly pin: string;
  readonly authMode?: 'pin' | 'password';
  readonly isResetting: boolean;
  readonly error: string | null;
  readonly onChangePin: (pin: string) => void;
  readonly onBack: () => void;
  readonly onSubmit: (e: React.FormEvent) => void;
}

export function FactoryResetPinStep({
  pin,
  authMode = 'pin',
  isResetting,
  error,
  onChangePin,
  onBack,
  onSubmit,
}: FactoryResetPinStepProps) {
  const [showSecret, setShowSecret] = useState(false);
  const isPasswordMode = authMode === 'password';
  const isValid = isPasswordMode ? pin.trim().length >= 8 : pin.trim().length >= 4;

  return (
    <form onSubmit={onSubmit} className="space-y-4 animate-fadeIn">
      {isResetting ? (
        <div className="py-8 space-y-4 text-center animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto">
            <Loader2 className="w-7 h-7 animate-spin text-rose-500" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-base font-bold text-rose-500">Factory Reset in Progress...</h4>
            <p className="text-xs text-[var(--admin-text-muted)] max-w-xs mx-auto">
              Wiping timetable overrides, restoring default database tables, and resetting default posters...
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-500">
                {isPasswordMode ? 'Enter Admin Password to Authorize Reset' : 'Enter Admin PIN to Authorize Reset'}
              </h3>
              <p className="text-xs text-[var(--admin-text-muted)] mt-1">
                {isPasswordMode
                  ? 'Enter your current admin password to finalize factory reset.'
                  : 'Enter your 4 to 8 digit Admin PIN to finalize factory reset.'}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-400 text-xs font-medium flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2 p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/70">
            <label className="block text-xs font-semibold text-[var(--admin-text-secondary)]">
              {isPasswordMode ? 'Admin Password:' : 'Admin PIN:'}
            </label>
            <div className="relative">
              <input
                type={showSecret || !isPasswordMode ? (showSecret ? 'text' : 'password') : 'password'}
                autoFocus
                maxLength={isPasswordMode ? 100 : 8}
                inputMode={isPasswordMode ? 'text' : 'numeric'}
                value={pin}
                onChange={(e) => onChangePin(e.target.value)}
                placeholder={isPasswordMode ? 'Enter your admin password' : 'Enter 4-8 digit PIN'}
                disabled={isResetting}
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-mono ${
                  isPasswordMode ? 'pr-10' : 'text-center tracking-[0.4em] font-bold text-base'
                } focus:outline-none focus:ring-1 focus:ring-rose-500`}
              />
              <button
                type="button"
                onClick={() => setShowSecret((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 transition p-1"
                title={showSecret ? 'Hide' : 'Show'}
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[var(--admin-text-muted)] text-center">
              {isPasswordMode
                ? 'Upon reset, the appliance restores factory defaults (PIN Mode with PIN 1234).'
                : 'Default PIN is 1234 if not modified.'}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-[var(--admin-border)]">
            <button
              type="button"
              disabled={isResetting}
              onClick={onBack}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Go Back</span>
            </button>

            <button
              type="submit"
              disabled={!isValid || isResetting}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center space-x-2 ${
                isValid && !isResetting
                  ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-lg shadow-rose-600/30 active:scale-95'
                  : 'bg-rose-900/30 text-rose-300/40 border border-rose-900/40 cursor-not-allowed opacity-40'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Permanently Reset Everything</span>
            </button>
          </div>
        </>
      )}
    </form>
  );
}
