'use client';

import React, { useState } from 'react';
import { Check, Eye, EyeOff, X } from 'lucide-react';

export interface AdminCredentialInputsProps {
  readonly currentMode: 'pin' | 'password';
  readonly targetMode: 'pin' | 'password';
  readonly currentSecret: string;
  readonly newUsername: string;
  readonly newSecret: string;
  readonly confirmSecret: string;
  readonly onCurrentSecretChange: (v: string) => void;
  readonly onNewUsernameChange: (v: string) => void;
  readonly onNewSecretChange: (v: string) => void;
  readonly onConfirmSecretChange: (v: string) => void;
}

export function AdminCredentialInputs({
  currentMode,
  targetMode,
  currentSecret,
  newUsername,
  newSecret,
  confirmSecret,
  onCurrentSecretChange,
  onNewUsernameChange,
  onNewSecretChange,
  onConfirmSecretChange,
}: AdminCredentialInputsProps) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isPassword = targetMode === 'password';
  const hasConfirm = confirmSecret.length > 0;
  const isMatching = hasConfirm && newSecret === confirmSecret;

  const passwordRules = [
    { key: 'len', label: 'At least 8 characters long', met: newSecret.length >= 8 },
    { key: 'upper', label: 'At least one uppercase letter (A-Z)', met: /[A-Z]/.test(newSecret) },
    { key: 'lower', label: 'At least one lowercase letter (a-z)', met: /[a-z]/.test(newSecret) },
    { key: 'num', label: 'At least one number (0-9)', met: /[0-9]/.test(newSecret) },
    { key: 'sym', label: 'At least one special symbol (!@#$%^&*)', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newSecret) },
  ];

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">
          Current {currentMode === 'password' ? 'Password' : 'PIN'}
        </label>
        <div className="relative">
          <input
            type={showCurrent ? 'text' : 'password'}
            value={currentSecret}
            onChange={(e) => onCurrentSecretChange(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 pr-9 text-xs font-mono font-bold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
            required
          />
          <button
            type="button"
            onClick={() => setShowCurrent((p) => !p)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 transition p-1 cursor-pointer"
            title={showCurrent ? 'Hide' : 'Show'}
          >
            {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isPassword && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">
            Admin Username
          </label>
          <input
            type="text"
            value={newUsername}
            onChange={(e) => onNewUsernameChange(e.target.value)}
            placeholder="admin"
            className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
            required
          />
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">
          New {isPassword ? 'Password' : 'PIN (4–8 digits)'}
        </label>
        <div className="relative">
          <input
            type={showNew ? 'text' : 'password'}
            value={newSecret}
            onChange={(e) => onNewSecretChange(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 pr-9 text-xs font-mono font-bold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
            required
          />
          <button
            type="button"
            onClick={() => setShowNew((p) => !p)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 transition p-1 cursor-pointer"
            title={showNew ? 'Hide' : 'Show'}
          >
            {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isPassword && (
          <div className="p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)]/80 space-y-2 mt-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">
              Password Requirements
            </p>
            <ul className="space-y-1.5">
              {passwordRules.map((r) => (
                <li
                  key={r.key}
                  className={`flex items-center space-x-2 text-xs transition-colors ${
                    r.met
                      ? 'text-emerald-400 font-medium'
                      : 'text-[var(--admin-text-muted)]'
                  }`}
                >
                  {r.met ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
                  )}
                  <span>{r.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!isPassword && newSecret.length > 0 && (
          <div className="p-2.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)]/80 mt-2">
            <div
              className={`flex items-center space-x-2 text-xs font-medium ${
                /^\d{4,8}$/.test(newSecret) ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {/^\d{4,8}$/.test(newSecret) ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              )}
              <span>{/^\d{4,8}$/.test(newSecret) ? 'Valid 4–8 numeric PIN' : 'Must be 4 to 8 numeric digits'}</span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">
          Confirm New {isPassword ? 'Password' : 'PIN'}
        </label>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmSecret}
            onChange={(e) => onConfirmSecretChange(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 pr-9 text-xs font-mono font-bold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirm((p) => !p)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 transition p-1 cursor-pointer"
            title={showConfirm ? 'Hide' : 'Show'}
          >
            {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>

        {hasConfirm && (
          <div className="p-2.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)]/80 mt-2">
            <div
              className={`flex items-center space-x-2 text-xs font-medium ${
                isMatching ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isMatching ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              )}
              <span>
                {isPassword
                  ? isMatching ? 'Passwords match' : 'Passwords do not match'
                  : isMatching ? 'PINs match' : 'PINs do not match'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
