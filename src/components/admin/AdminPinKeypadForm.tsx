'use client';

import React, { useState } from 'react';
import { Delete, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { verifyAdminPin } from '@/lib/actions/auth';

export interface AdminPinKeypadFormProps {
  readonly onSuccess: () => void;
  readonly error: string | null;
  readonly setError: (err: string | null) => void;
}

export function AdminPinKeypadForm({
  onSuccess,
  error,
  setError,
}: AdminPinKeypadFormProps) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 8) {
      setPin((prev) => prev + digit);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!pin) {
      setError('Please enter your admin PIN.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('pin', pin);
      const res = await verifyAdminPin(formData);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error ?? 'Incorrect PIN. Please try again.');
        setPin('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Admin PIN Unlock Form" className="space-y-4">
      <div className="relative">
        <input
          id="admin-pin-input"
          type={showPin ? 'text' : 'password'}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={8}
          autoFocus
          aria-label="Admin PIN"
          aria-required="true"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'admin-pin-error' : undefined}
          value={pin}
          onChange={(e) => {
            const clean = e.target.value.replace(/\D/g, '');
            setPin(clean);
            setError(null);
          }}
          placeholder="••••"
          className="w-full text-center text-2xl tracking-[0.35em] font-mono py-2.5 px-10 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-tab-active-border)] placeholder:tracking-normal placeholder:text-neutral-500 placeholder:text-base font-bold"
        />
        <button
          type="button"
          onClick={() => setShowPin((prev) => !prev)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] transition"
          title={showPin ? 'Hide PIN' : 'Show PIN'}
          aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
        >
          {showPin ? (
            <EyeOff className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 select-none" role="group" aria-label="PIN Keypad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleKeyPress(digit)}
            aria-label={`Digit ${digit}`}
            className="py-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-card-hover)] active:scale-95 text-base font-bold font-mono text-[var(--admin-text-primary)] transition cursor-pointer"
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear PIN entry"
          className="py-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-card-hover)] active:scale-95 text-xs font-semibold text-[var(--admin-text-muted)] transition cursor-pointer"
          title="Clear"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('0')}
          aria-label="Digit 0"
          className="py-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-card-hover)] active:scale-95 text-base font-bold font-mono text-[var(--admin-text-primary)] transition cursor-pointer"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          aria-label="Delete last digit"
          className="py-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-card-hover)] active:scale-95 text-xs font-semibold text-[var(--admin-text-muted)] flex items-center justify-center transition cursor-pointer"
          title="Backspace"
        >
          <Delete className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <button
        type="submit"
        disabled={isVerifying || pin.length < 4}
        aria-label="Unlock Admin Panel"
        className="w-full py-2.5 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] font-semibold text-xs flex items-center justify-center space-x-2 transition active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-sm"
      >
        {isVerifying ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          <KeyRound className="w-4 h-4" aria-hidden="true" />
        )}
        <span>{isVerifying ? 'Verifying PIN...' : 'Unlock Admin Panel'}</span>
      </button>
    </form>
  );
}

