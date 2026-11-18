'use client';

import React, { useState } from 'react';
import { KeyRound, Loader2, Eye, EyeOff, User, Lock } from 'lucide-react';
import { verifyAdminCredentials } from '@/lib/actions/auth';

export interface AdminPasswordFormProps {
  readonly onSuccess: () => void;
  readonly error: string | null;
  readonly setError: (err: string | null) => void;
}

export function AdminPasswordForm({
  onSuccess,
  error,
  setError,
}: AdminPasswordFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both your username and password.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('username', username.trim());
      formData.append('password', password);
      const res = await verifyAdminCredentials(formData);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error ?? 'Incorrect username or password. Please try again.');
        setPassword('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Admin Credentials Login Form" className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="admin-username-input"
          className="text-xs font-semibold text-[var(--admin-text-secondary)] flex items-center space-x-1.5"
        >
          <User className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
          <span>Username</span>
        </label>
        <input
          id="admin-username-input"
          type="text"
          autoComplete="username"
          autoFocus
          aria-label="Admin Username"
          aria-required="true"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'admin-pin-error' : undefined}
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError(null);
          }}
          placeholder="admin"
          className="w-full text-sm py-2 px-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-tab-active-border)] placeholder:text-neutral-500 font-medium"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="admin-password-input"
          className="text-xs font-semibold text-[var(--admin-text-secondary)] flex items-center space-x-1.5"
        >
          <Lock className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
          <span>Password</span>
        </label>
        <div className="relative">
          <input
            id="admin-password-input"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            aria-label="Admin Password"
            aria-required="true"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'admin-pin-error' : undefined}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            placeholder="••••••••••••"
            className="w-full text-sm py-2 px-3 pr-10 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-tab-active-border)] placeholder:text-neutral-500 font-medium"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 transition cursor-pointer"
            title={showPassword ? 'Hide Password' : 'Show Password'}
            aria-label={showPassword ? 'Hide Password' : 'Show Password'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Eye className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isVerifying || !username.trim() || !password}
        aria-label="Sign In as Admin"
        className="w-full py-2.5 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] font-semibold text-xs flex items-center justify-center space-x-2 transition active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-sm"
      >
        {isVerifying ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          <KeyRound className="w-4 h-4" aria-hidden="true" />
        )}
        <span>{isVerifying ? 'Authenticating...' : 'Sign In as Admin'}</span>
      </button>
    </form>
  );
}

