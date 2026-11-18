'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { resetAllToDefaults } from '@/lib/actions/settings';
import { exportScheduleCsv } from '@/lib/actions/prayer-exports';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { triggerBetaNoticeReset } from '@/components/common/BetaNoticeModal';
import { resetPrayerDisclaimer } from '../prayer/PrayerCalculationDisclaimer';
import {
  FactoryResetCompleteView,
  FactoryResetConfirmWordStep,
  FactoryResetIntentStep,
} from './FactoryResetStepViews';
import { FactoryResetBackupStep } from './FactoryResetBackupStep';
import { FactoryResetPinStep } from './FactoryResetPinStep';

export interface FactoryResetModalProps {
  readonly isOpen: boolean;
  readonly authMode?: 'pin' | 'password';
  readonly onClose: () => void;
  readonly onResetSuccess: (options?: { triggerInitialSetup?: boolean }) => void;
}

export function FactoryResetModal({
  isOpen,
  authMode = 'pin',
  onClose,
  onResetSuccess,
}: FactoryResetModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [confirmText, setConfirmText] = useState('');
  const [pin, setPin] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPasswordMode = authMode === 'password';
  const stepLabels: Record<number, string> = {
    1: 'Intent',
    2: 'Backup',
    3: 'Type CONFIRM',
    4: isPasswordMode ? 'Password Auth' : 'PIN Auth',
  };

  const resetModalState = () => {
    setStep(1);
    setConfirmText('');
    setPin('');
    setError(null);
    setExportNotice(null);
    setIsResetting(false);
    setIsComplete(false);
    setIsExporting(false);
  };

  useEffect(() => {
    if (isOpen) resetModalState();
  }, [isOpen]);

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  const trapRef = useFocusTrap<HTMLDivElement>({ isActive: isOpen && !isResetting, onEscape: handleClose });
  if (!isOpen) return null;

  const handleDownloadBackup = async () => {
    setIsExporting(true);
    setExportNotice(null);
    setError(null);
    try {
      const currentYear = new Date().getFullYear();
      const csvData = await exportScheduleCsv({ format: 'full', year: currentYear, month: 1, endMonth: 12 });
      const url = URL.createObjectURL(new Blob([csvData], { type: 'text/csv;charset=utf-8;' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `prayer_timetable_backup_${currentYear}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportNotice(`Saved prayer_timetable_backup_${currentYear}.csv`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export backup timetable.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const minLen = isPasswordMode ? 8 : 4;
    if (pin.trim().length < minLen || isResetting) return;
    setIsResetting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('secret', pin.trim());
      const res = await resetAllToDefaults(formData);
      if (!res.success) { setError(res.error ?? 'Factory reset failed.'); setIsResetting(false); return; }
      setIsResetting(false);
      setIsComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during factory reset.');
      setIsResetting(false);
    }
  };

  return (
    <div
      ref={trapRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="factory-reset-modal-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="fixed -inset-8 bg-black/80 backdrop-blur-md animate-fadeIn" aria-hidden="true" onClick={handleClose} />

      <div className="relative w-full max-w-lg rounded-2xl border border-rose-500/30 bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <h2 id="factory-reset-modal-title" className="sr-only">Factory Reset Wizard</h2>
        <div className="px-5 pt-4 pb-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)]/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                  isComplete || step > s
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : step === s
                    ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                    : 'bg-transparent text-[var(--admin-text-muted)] border border-transparent opacity-50'
                }`}
              >
                <span>{s}</span>
                <span className="hidden sm:inline text-[11px]">{stepLabels[s]}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isResetting}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] transition cursor-pointer disabled:opacity-30"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs leading-relaxed select-text">
          {isComplete && (
            <FactoryResetCompleteView
              onAcknowledge={() => {
                triggerBetaNoticeReset();
                resetPrayerDisclaimer();
                onResetSuccess({ triggerInitialSetup: true });
                handleClose();
              }}
            />
          )}
          {!isComplete && step === 1 && <FactoryResetIntentStep onCancel={handleClose} onContinue={() => setStep(2)} />}
          {!isComplete && step === 2 && (
            <FactoryResetBackupStep
              isExporting={isExporting}
              exportNotice={exportNotice}
              onDownloadBackup={handleDownloadBackup}
              onBack={() => setStep(1)}
              onContinue={() => setStep(3)}
            />
          )}
          {!isComplete && step === 3 && (
            <FactoryResetConfirmWordStep
              confirmText={confirmText}
              onChangeConfirmText={setConfirmText}
              onBack={() => setStep(2)}
              onContinue={() => setStep(4)}
            />
          )}
          {!isComplete && step === 4 && (
            <FactoryResetPinStep
              pin={pin}
              authMode={authMode}
              isResetting={isResetting}
              error={error}
              onChangePin={setPin}
              onBack={() => setStep(3)}
              onSubmit={handleExecuteReset}
            />
          )}
        </div>
      </div>
    </div>
  );
}
