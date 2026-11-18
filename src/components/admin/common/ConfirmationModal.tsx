'use client';
import React from 'react';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export interface ConfirmationModalProps {
  readonly isOpen: boolean;
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly variant?: 'danger' | 'warning' | 'default';
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Discard Changes',
  cancelLabel = 'Keep Editing',
  variant = 'warning',
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const trapRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onEscape: onCancel,
  });

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      ref={trapRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-desc"
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Full-bleed Backdrop extending beyond viewport to eliminate blur kernel edge decay */}
      <div
        className="fixed -inset-8 bg-black/60 backdrop-blur-md animate-fadeIn"
        aria-hidden="true"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--admin-border)]">
          <div className="flex items-center space-x-2.5">
            <div
              className={`p-1.5 rounded-lg ${
                isDanger
                  ? 'bg-rose-500/10 text-rose-500'
                  : 'bg-amber-500/10 text-amber-500'
              }`}
            >
              {isDanger ? (
                <AlertCircle className="w-5 h-5" aria-hidden="true" />
              ) : (
                <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              )}
            </div>
            <h3 id="confirmation-modal-title" className="text-sm font-bold tracking-tight text-[var(--admin-text-primary)]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close confirmation dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] transition cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Message */}
        <p id="confirmation-modal-desc" className="text-xs text-[var(--admin-text-secondary)] leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] font-medium text-xs transition active:scale-95 cursor-pointer shadow-sm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-sm ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)]'
            }`}
          >
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
