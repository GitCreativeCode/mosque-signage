'use client';

import React from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import type { MonthPrayerDay } from '@/types/index';
import { format12h } from '@/lib/utils/time';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export interface DailyEditTimesState {
  readonly fajr: string;
  readonly dhuhr: string;
  readonly asr: string;
  readonly maghrib: string;
  readonly isha: string;
}

export interface MonthlyEditDayModalProps {
  readonly editingDay: MonthPrayerDay | null;
  readonly editTimes: DailyEditTimesState;
  readonly setEditTimes: React.Dispatch<React.SetStateAction<DailyEditTimesState>>;
  readonly editDayError: string | null;
  readonly isSavingDay: boolean;
  readonly onAdjustMinute: (prayer: keyof DailyEditTimesState, delta: number) => void;
  readonly onSubmit: (e: React.FormEvent) => void;
  readonly onClose: () => void;
}

const EDIT_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

export function MonthlyEditDayModal({
  editingDay,
  editTimes,
  setEditTimes,
  editDayError,
  isSavingDay,
  onAdjustMinute,
  onSubmit,
  onClose,
}: MonthlyEditDayModalProps) {
  const modalRef = useFocusTrap({ isActive: Boolean(editingDay), onEscape: onClose });
  if (!editingDay) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-day-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={modalRef}
        className="w-full h-[100dvh] sm:h-auto sm:max-h-[90dvh] sm:max-w-lg bg-[var(--admin-card)] border-0 sm:border border-[var(--admin-border)] rounded-none sm:rounded-2xl p-4 sm:p-6 shadow-2xl text-[var(--admin-text-primary)] overflow-y-auto flex flex-col"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--admin-border)] mb-4">
          <div>
            <h3 id="edit-day-modal-title" className="text-base font-bold text-[var(--admin-text-primary)] tracking-tight">Edit Daily Iqamah Times</h3>
            <span className="text-xs text-[var(--admin-text-muted)] font-mono">{editingDay.dayName}, {editingDay.date}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit daily iqamah dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] transition cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {editDayError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{editDayError}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3.5">
          {EDIT_PRAYERS.map((p) => {
            const label = p.charAt(0).toUpperCase() + p.slice(1);
            return (
              <div key={p} className="p-3 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                <div>
                  <div className="text-xs font-bold text-[var(--admin-text-primary)]">{label}</div>
                  <div className="text-[10px] text-[var(--admin-text-muted)] font-mono">Adhan: {format12h(editingDay[p].adhan)}</div>
                </div>
                <div className="flex items-center justify-between sm:justify-end space-x-2">
                  <input
                    type="time"
                    value={editTimes[p]}
                    onChange={(e) => setEditTimes((prev) => ({ ...prev, [p]: e.target.value }))}
                    className="px-2.5 py-1.5 text-xs font-mono font-semibold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
                  />
                  <div className="flex items-center space-x-1">
                    <button type="button" onClick={() => onAdjustMinute(p, -5)} className="min-h-[36px] sm:min-h-0 px-2.5 py-1 rounded-lg bg-[var(--admin-card)] hover:bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[10px] font-mono text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] transition cursor-pointer" title="Subtract 5 minutes">-5m</button>
                    <button type="button" onClick={() => onAdjustMinute(p, 5)} className="min-h-[36px] sm:min-h-0 px-2.5 py-1 rounded-lg bg-[var(--admin-card)] hover:bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[10px] font-mono text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] transition cursor-pointer" title="Add 5 minutes">+5m</button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-[var(--admin-border)]">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] text-xs font-medium transition cursor-pointer">Cancel</button>
            <button type="submit" disabled={isSavingDay} className="px-5 py-2 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] font-semibold text-xs flex items-center space-x-1.5 transition active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-sm">
              {isSavingDay && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Day Schedule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

