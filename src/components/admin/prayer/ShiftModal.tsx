'use client';

import React from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { format12h } from '@/lib/utils/time';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export interface ShiftModalProps {
  readonly isOpen: boolean;
  readonly mode: 'ADD' | 'EDIT';
  readonly shiftNumber: number;
  readonly khateeb: string;
  readonly setKhateeb: (val: string) => void;
  readonly adhan: string;
  readonly setAdhan: (val: string) => void;
  readonly iqamah: string;
  readonly setIqamah: (val: string) => void;
  readonly onSubmit: (e: React.FormEvent) => void;
  readonly onClose: () => void;
  readonly isSubmitting: boolean;
  readonly formError: string | null;
}

/**
 * Add / Edit Friday Jummah Shift Modal
 * Human-ergonomic form supporting optional Khateeb / speaker name,
 * optional Salah time, and inline chronological order validation.
 */
export function ShiftModal({
  isOpen,
  mode,
  shiftNumber,
  khateeb,
  setKhateeb,
  adhan,
  setAdhan,
  iqamah,
  setIqamah,
  onSubmit,
  onClose,
  isSubmitting,
  formError,
}: ShiftModalProps) {
  const trapRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen && !isSubmitting,
    onEscape: onClose,
  });

  if (!isOpen) return null;

  const isAdd = mode === 'ADD';

  return (
    <div
      ref={trapRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shift-modal-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Full-bleed Backdrop extending beyond viewport to eliminate blur kernel edge decay */}
      <div
        className="fixed -inset-8 bg-black/60 backdrop-blur-md animate-fadeIn"
        aria-hidden="true"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl p-6 shadow-2xl text-[var(--admin-text-primary)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--admin-border)] mb-4">
          <div>
            <h3 id="shift-modal-title" className="text-base font-bold text-[var(--admin-text-primary)] tracking-tight">
              {isAdd ? `Add Friday Jummah Khutbah #${shiftNumber}` : 'Edit Friday Jummah Khutbah'}
            </h3>
            <span className="text-xs text-[var(--admin-text-muted)]">
              {isAdd
                ? 'Sequential Khutbah order is managed automatically.'
                : `Positioned as Khutbah #${shiftNumber}`}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] transition cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Validation Error Alert */}
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center space-x-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[var(--admin-text-secondary)]">
                Khateeb / Speaker
              </label>
              <span className="text-[11px] text-[var(--admin-text-muted)]">(Optional)</span>
            </div>
            <input
              type="text"
              value={khateeb}
              onChange={(e) => setKhateeb(e.target.value)}
              placeholder="e.g. Imam Nafis Bhayat (leave blank if unassigned)"
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] placeholder-[var(--admin-text-muted)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">
                Khutbah Time <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="time"
                  required
                  value={adhan}
                  onChange={(e) => setAdhan(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
                />
              </div>
              {adhan && (
                <span className="text-[11px] font-mono text-[var(--admin-text-muted)] mt-1 block">
                  ({format12h(adhan)})
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[var(--admin-text-secondary)]">
                  Salah Time <span className="text-[var(--admin-text-muted)]">(Optional)</span>
                </label>
                {iqamah && (
                  <button
                    type="button"
                    onClick={() => setIqamah('')}
                    className="text-[10px] text-[var(--admin-text-muted)] hover:text-rose-400 transition cursor-pointer"
                  >
                    Clear time
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="time"
                  value={iqamah}
                  onChange={(e) => setIqamah(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
                />
              </div>
              {iqamah ? (
                <span className="text-[11px] font-mono text-[var(--admin-text-muted)] mt-1 block">
                  ({format12h(iqamah)})
                </span>
              ) : (
                <span className="text-[11px] text-[var(--admin-text-muted)] mt-1 block italic">
                  Empty — Salah follows Khutbah directly
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-[var(--admin-border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] active:scale-[0.98] cursor-pointer font-medium text-xs transition shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] active:scale-[0.98] cursor-pointer text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isAdd ? 'Save Shift' : 'Update Shift'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
