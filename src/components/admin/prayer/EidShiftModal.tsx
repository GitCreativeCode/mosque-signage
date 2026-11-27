'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { format12h } from '@/lib/utils/time';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { EidShift, EidType } from '@/types/index';

export interface EidShiftModalProps {
  readonly isOpen: boolean;
  readonly mode: 'ADD' | 'EDIT';
  readonly eidType: EidType;
  readonly editingShift: EidShift | null;
  readonly shiftNumber: number;
  readonly onSubmit: (shift: {
    id?: string | undefined;
    eid_type: EidType;
    shift_number?: number | undefined;
    takbeerat_time: string;
    salah_time: string;
    khateeb_name?: string | null | undefined;
    location?: string | null | undefined;
  }) => Promise<void>;
  readonly onClose: () => void;
}

export function EidShiftModal({
  isOpen,
  mode,
  eidType,
  editingShift,
  shiftNumber,
  onSubmit,
  onClose,
}: EidShiftModalProps) {
  const [takbeerat, setTakbeerat] = useState('07:30');
  const [salah, setSalah] = useState('08:00');
  const [khateeb, setKhateeb] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trapRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen && !isSubmitting,
    onEscape: onClose,
  });

  useEffect(() => {
    if (editingShift) {
      setTakbeerat(editingShift.takbeerat_time);
      setSalah(editingShift.salah_time);
      setKhateeb(editingShift.khateeb_name ?? '');
      setLocation(editingShift.location ?? '');
    } else {
      setTakbeerat('07:30');
      setSalah('08:00');
      setKhateeb('');
      setLocation('');
    }
    setError(null);
  }, [editingShift, isOpen]);

  if (!isOpen) return null;

  const isAdd = mode === 'ADD';
  const eidTitle = eidType === 'eid_ul_fitr' ? 'Eid al-Fitr' : 'Eid al-Adha';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!takbeerat || !salah) {
      setError('Both Takbeerat time and Salah time are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...(editingShift?.id ? { id: editingShift.id } : {}),
        eid_type: eidType,
        shift_number: editingShift?.shift_number ?? shiftNumber,
        takbeerat_time: takbeerat,
        salah_time: salah,
        khateeb_name: khateeb.trim() || null,
        location: location.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save Eid prayer shift.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={trapRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="eid-shift-modal-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
    >
      <div className="fixed -inset-8 bg-black/60 backdrop-blur-md animate-fadeIn" aria-hidden="true" onClick={onClose} />
      <div className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[90dvh] sm:max-w-lg bg-[var(--admin-card)] border-0 sm:border border-[var(--admin-border)] rounded-none sm:rounded-2xl p-4 sm:p-6 shadow-2xl text-[var(--admin-text-primary)] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--admin-border)] mb-4">
          <div>
            <h3 id="eid-shift-modal-title" className="text-base font-bold text-[var(--admin-text-primary)] tracking-tight">
              {isAdd ? `Add ${eidTitle} Prayer #${shiftNumber}` : `Edit ${eidTitle} Prayer`}
            </h3>
            <span className="text-xs text-[var(--admin-text-muted)]">
              Configure Takbeerat and congregational Salah timing.
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

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center space-x-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">
                Takbeerat Starts <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={takbeerat}
                onChange={(e) => setTakbeerat(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
              />
              {takbeerat && (
                <span className="text-[11px] font-mono text-[var(--admin-text-muted)] mt-1 block">
                  ({format12h(takbeerat)})
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">
                Eid Salah Starts <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={salah}
                onChange={(e) => setSalah(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
              />
              {salah && (
                <span className="text-[11px] font-mono text-[var(--admin-text-muted)] mt-1 block">
                  ({format12h(salah)})
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">
              Khateeb / Imam <span className="text-[11px] text-[var(--admin-text-muted)]">(Optional)</span>
            </label>
            <input
              type="text"
              value={khateeb}
              onChange={(e) => setKhateeb(e.target.value)}
              placeholder="e.g. Sheikh Abdullah"
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] placeholder-[var(--admin-text-muted)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">
              Hall / Location <span className="text-[11px] text-[var(--admin-text-muted)]">(Optional)</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Main Prayer Hall or Gymnasium"
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] placeholder-[var(--admin-text-muted)]"
            />
          </div>

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
              <span>{isAdd ? 'Save Eid Shift' : 'Update Eid Shift'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
