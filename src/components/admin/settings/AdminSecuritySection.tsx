'use client';

import React, { useState } from 'react';
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  LogOut,
} from 'lucide-react';
import { changeAdminCredentials, revokeAllAdminSessions } from '@/lib/actions/auth';
import type { Settings } from '@/types/index';
import { AdminSecurityModeSelector } from './AdminSecurityModeSelector';
import { AdminCredentialInputs } from './AdminCredentialInputs';

export interface AdminSecuritySectionProps {
  readonly settings?: Settings | undefined;
  readonly onLocked?: () => void;
}

export function AdminSecuritySection({ settings, onLocked }: AdminSecuritySectionProps) {
  const currentMode = settings?.auth_mode ?? 'pin';
  const [targetMode, setTargetMode] = useState<'pin' | 'password'>(currentMode);
  const [currentSecret, setCurrentSecret] = useState('');
  const [newUsername, setNewUsername] = useState(settings?.admin_username || 'admin');
  const [newSecret, setNewSecret] = useState('');
  const [confirmSecret, setConfirmSecret] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isDefaultPin = Boolean(settings?.is_default_pin_active);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentSecret) {
      setError('Please enter your current credential.');
      return;
    }

    if (newSecret !== confirmSecret) {
      setError('New credentials do not match.');
      return;
    }

    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append('currentSecret', currentSecret);
      formData.append('newAuthMode', targetMode);
      if (targetMode === 'password') {
        formData.append('newUsername', newUsername);
        formData.append('newPassword', newSecret);
      } else {
        formData.append('newPin', newSecret);
      }
      const res = await changeAdminCredentials(formData);

      if (res.success) {
        setSuccess('Security credentials successfully updated!');
        setCurrentSecret('');
        setNewSecret('');
        setConfirmSecret('');
        setTimeout(() => setSuccess(null), 4000);
        onLocked?.();
      } else {
        setError(res.error ?? 'Failed to update credentials.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating credentials.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRevokeAll = async () => {
    if (!window.confirm('Log out all other active devices and browser sessions?')) return;
    setIsRevoking(true);
    setError(null);
    try {
      const res = await revokeAllAdminSessions();
      if (res.success) {
        setSuccess(res.message);
        setTimeout(() => setSuccess(null), 4000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke sessions.');
    } finally {
      setIsRevoking(false);
    }
  };

  const isPasswordValid =
    newSecret.length >= 8 &&
    /[A-Z]/.test(newSecret) &&
    /[a-z]/.test(newSecret) &&
    /[0-9]/.test(newSecret) &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newSecret);
  const isPinValid = /^\d{4,8}$/.test(newSecret);
  const isSecretValid = targetMode === 'password' ? isPasswordValid : isPinValid;
  const isUsernameValid = targetMode === 'password' ? newUsername.trim().length >= 3 : true;
  const isMatching = newSecret === confirmSecret && confirmSecret.length > 0;
  const canSubmit = !isUpdating && Boolean(currentSecret) && isSecretValid && isUsernameValid && isMatching;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-secondary)]">
          Admin Security &amp; Access Control
        </h4>
        <p className="text-xs text-[var(--admin-text-muted)] mt-0.5">
          Configure authentication for touchscreens and remote public access.
        </p>
      </div>

      {isDefaultPin && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-amber-900 dark:text-amber-200">Default factory PIN active (1234)</p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300/80">
              Your signage appliance is still using the default factory PIN. Please change it before
              connecting to the internet or enabling remote domain access.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-[var(--admin-success-subtle)] border border-[var(--admin-success)]/20 text-xs text-[var(--admin-success)] flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--admin-success)]" />
          <span>{success}</span>
        </div>
      )}

      <form
        onSubmit={handleUpdate}
        className="p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/60 space-y-4"
      >
        <AdminSecurityModeSelector targetMode={targetMode} onSelectMode={setTargetMode} />

        <AdminCredentialInputs
          currentMode={currentMode}
          targetMode={targetMode}
          currentSecret={currentSecret}
          newUsername={newUsername}
          newSecret={newSecret}
          confirmSecret={confirmSecret}
          onCurrentSecretChange={setCurrentSecret}
          onNewUsernameChange={setNewUsername}
          onNewSecretChange={setNewSecret}
          onConfirmSecretChange={setConfirmSecret}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[var(--admin-border)]">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={isRevoking}
              onClick={handleRevokeAll}
              className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-medium text-xs flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
              title="Log out all other sessions"
            >
              {isRevoking ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5 opacity-70" />
              )}
              <span>Log Out All Other Devices</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full sm:w-fit min-h-[44px] sm:min-h-0 px-4 py-2 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] font-semibold text-xs flex items-center justify-center space-x-1.5 transition active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {isUpdating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <KeyRound className="w-3.5 h-3.5" />
            )}
            <span>Save Security Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
