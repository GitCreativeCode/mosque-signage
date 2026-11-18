'use client';

import React from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import type { PrayerName } from '@/types/index';
import { format12h } from '@/lib/utils/time';
import { TimePicker } from '@/components/admin/common/TimePicker';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export interface MonthlyBulkApplyModalProps {
  readonly isOpen: boolean;
  readonly bulkTimingMode: 'FIXED' | 'OFFSET';
  readonly setBulkTimingMode: (m: 'FIXED' | 'OFFSET') => void;
  readonly bulkPrayer: PrayerName;
  readonly onPrayerChange: (p: PrayerName) => void;
  readonly bulkTime: string;
  readonly setBulkTime: (t: string) => void;
  readonly bulkOffsetMinutes: number;
  readonly setBulkOffsetMinutes: (m: number) => void;
  readonly maxOffsetInfo: { max: number; nextName: string; nextAdhan: string };
  readonly bulkStartDate: string;
  readonly setBulkStartDate: (d: string) => void;
  readonly bulkEndDate: string;
  readonly setBulkEndDate: (d: string) => void;
  readonly bulkError: string | null;
  readonly isSavingBulk: boolean;
  readonly onSubmit: (e: React.FormEvent) => void;
  readonly onClose: () => void;
}

export function MonthlyBulkApplyModal(p: MonthlyBulkApplyModalProps) {
  const modalRef = useFocusTrap({ isActive: p.isOpen, onEscape: p.onClose });
  if (!p.isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-apply-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) p.onClose(); }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl p-6 shadow-2xl text-[var(--admin-text-primary)]"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--admin-border)] mb-4">
          <div>
            <h3 id="bulk-apply-modal-title" className="text-base font-bold text-[var(--admin-text-primary)] tracking-tight">Bulk Apply Iqamah Across Date Range</h3>
            <span className="text-xs text-[var(--admin-text-muted)]">
              Quickly set an Iqamah time for an entire week, month, or customized date range.
            </span>
          </div>
          <button
            type="button"
            onClick={p.onClose}
            aria-label="Close bulk apply dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] transition cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {p.bulkError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" /><span>{p.bulkError}</span>
          </div>
        )}

        <form onSubmit={p.onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">Timing Method</label>
            <div className="flex items-center space-x-1 bg-[var(--admin-surface)] p-1 rounded-xl border border-[var(--admin-border)] w-fit">
              <button type="button" onClick={() => p.setBulkTimingMode('FIXED')} className={`px-3 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${p.bulkTimingMode === 'FIXED' ? 'bg-[var(--admin-card)] text-[var(--admin-text-primary)] border border-[var(--admin-border)] shadow-sm font-semibold' : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'}`}>
                Fixed Clock Time
              </button>
              <button type="button" onClick={() => p.setBulkTimingMode('OFFSET')} className={`px-3 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${p.bulkTimingMode === 'OFFSET' ? 'bg-[var(--admin-card)] text-[var(--admin-text-primary)] border border-[var(--admin-border)] shadow-sm font-semibold' : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'}`}>
                Minutes After Adhan (Offset)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">Target Prayer</label>
              <select value={p.bulkPrayer} onChange={(e) => p.onPrayerChange(e.target.value as PrayerName)} className="w-full px-3 py-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-xs text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]">
                <option value="fajr">Fajr</option><option value="dhuhr">Dhuhr</option><option value="asr">Asr</option><option value="maghrib">Maghrib</option><option value="isha">Isha</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">
                {p.bulkTimingMode === 'FIXED' ? 'New Iqamah Time' : 'Minutes After Adhan'}
              </label>
              {p.bulkTimingMode === 'FIXED' ? (
                <TimePicker value={p.bulkTime} onChange={p.setBulkTime} />
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number" min={1} max={p.maxOffsetInfo.max} value={p.bulkOffsetMinutes}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        p.setBulkOffsetMinutes(Number.isNaN(val) ? 1 : Math.min(p.maxOffsetInfo.max, Math.max(1, val)));
                      }}
                      className="w-24 px-3 py-1.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-xs font-mono font-semibold text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
                    />
                    <span className="text-xs font-medium text-[var(--admin-text-muted)]">min after Adhan</span>
                  </div>
                  <p className="text-[10px] text-[var(--admin-text-muted)] font-mono">
                    Max {p.maxOffsetInfo.max}m (before {p.maxOffsetInfo.nextName} at {format12h(p.maxOffsetInfo.nextAdhan)}).
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">Start Date</label>
              <input type="date" value={p.bulkStartDate} onChange={(e) => p.setBulkStartDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-xs font-mono text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">End Date</label>
              <input type="date" value={p.bulkEndDate} onChange={(e) => p.setBulkEndDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-xs font-mono text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]" required />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-[var(--admin-border)]">
            <button type="button" onClick={p.onClose} className="px-4 py-2 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] text-xs font-medium transition cursor-pointer">Cancel</button>
            <button type="submit" disabled={p.isSavingBulk} className="px-5 py-2 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] font-semibold text-xs flex items-center space-x-1.5 transition active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-sm">
              {p.isSavingBulk && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Apply Range Schedule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

