'use client';

import React from 'react';
import { X, AlertCircle, Loader2, Calendar } from 'lucide-react';
import { format12h } from '@/lib/utils/time';
import { getUpcomingFridays } from '@/lib/prayer/jummah-validation';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { DbJummahShiftRecord } from '@/lib/actions/jummah';

export type ShiftScheduleScope = 'WEEKLY' | 'SPECIFIC_DATE';

export interface ShiftModalProps {
  readonly isOpen: boolean;
  readonly mode: 'ADD' | 'EDIT';
  readonly shiftNumber: number;
  readonly shifts?: readonly DbJummahShiftRecord[] | undefined;
  readonly scheduleScope?: ShiftScheduleScope | undefined;
  readonly setScheduleScope?: ((scope: ShiftScheduleScope) => void) | undefined;
  readonly overrideDate?: string | undefined;
  readonly setOverrideDate?: ((date: string) => void) | undefined;
  readonly overrideShiftId?: string | undefined;
  readonly setOverrideShiftId?: ((id: string) => void) | undefined;
  readonly khateeb: string;
  readonly setKhateeb: (val: string) => void;
  readonly adhan: string;
  readonly setAdhan: (val: string) => void;
  readonly iqamah: string;
  readonly setIqamah: (val: string) => void;
  readonly location?: string | undefined;
  readonly setLocation?: ((val: string) => void) | undefined;
  readonly language?: string | undefined;
  readonly setLanguage?: ((val: string) => void) | undefined;
  readonly topic?: string | undefined;
  readonly setTopic?: ((val: string) => void) | undefined;
  readonly onSubmit: (e: React.FormEvent) => void;
  readonly onClose: () => void;
  readonly isSubmitting: boolean;
  readonly formError: string | null;
}

/**
 * Add / Edit Friday Jummah Shift Modal
 * Supports both Every-Friday repeating baseline shifts and Specific Friday Date guest overrides.
 */
export function ShiftModal({
  isOpen,
  mode,
  shiftNumber,
  shifts = [],
  scheduleScope = 'WEEKLY',
  setScheduleScope,
  overrideDate = '',
  setOverrideDate,
  overrideShiftId = '',
  setOverrideShiftId,
  khateeb,
  setKhateeb,
  adhan,
  setAdhan,
  iqamah,
  setIqamah,
  location = '',
  setLocation,
  language = '',
  setLanguage,
  topic = '',
  setTopic,
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
  const isSpecificDate = scheduleScope === 'SPECIFIC_DATE';
  const upcomingFridays = getUpcomingFridays(12);
  const canPickSpecificDate = shifts.length > 0;

  return (
    <div
      ref={trapRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shift-modal-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
    >
      <div
        className="fixed -inset-8 bg-black/60 backdrop-blur-md animate-fadeIn"
        aria-hidden="true"
        onClick={onClose}
      />

      <div className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[90dvh] sm:max-w-lg bg-[var(--admin-card)] border-0 sm:border border-[var(--admin-border)] rounded-none sm:rounded-2xl p-4 sm:p-6 shadow-2xl text-[var(--admin-text-primary)] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--admin-border)] mb-4">
          <div>
            <h3 id="shift-modal-title" className="text-base font-bold text-[var(--admin-text-primary)] tracking-tight">
              {isAdd ? `Add Friday Jummah Khutbah #${shiftNumber}` : `Edit Friday Khutbah #${shiftNumber}`}
            </h3>
            <span className="text-xs text-[var(--admin-text-muted)]">
              {isSpecificDate
                ? 'Override speaker & topic for one specific Friday without changing weekly shifts.'
                : isAdd
                  ? 'Sets a repeating every-Friday prayer shift.'
                  : `Updating repeating weekly Khutbah #${shiftNumber}`}
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

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center space-x-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Schedule Scope Selector */}
          {setScheduleScope && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--admin-text-secondary)]">
                Schedule Scope
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                <button
                  type="button"
                  onClick={() => setScheduleScope('WEEKLY')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    !isSpecificDate
                      ? 'bg-[var(--admin-card)] text-[var(--admin-text-primary)] border border-[var(--admin-border)] shadow-sm'
                      : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
                  }`}
                >
                  Every Friday (Weekly)
                </button>
                <button
                  type="button"
                  disabled={!canPickSpecificDate}
                  onClick={() => setScheduleScope('SPECIFIC_DATE')}
                  title={!canPickSpecificDate ? 'Add a weekly Khutbah shift first' : 'Assign a guest Khateeb or topic for one date'}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isSpecificDate
                      ? 'bg-[var(--admin-card)] text-[var(--admin-text-primary)] border border-[var(--admin-border)] shadow-sm'
                      : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
                  }`}
                >
                  Specific Friday Date
                </button>
              </div>
            </div>
          )}

          {isSpecificDate ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">
                    Friday Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={overrideDate || upcomingFridays[0] || ''}
                      onChange={(e) => setOverrideDate?.(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] cursor-pointer"
                    >
                      {upcomingFridays.map((dateStr) => {
                        const parts = dateStr.split('-');
                        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        return (
                          <option key={dateStr} value={dateStr} className="bg-[var(--admin-card)]">
                            Fri, {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {isAdd && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">
                      Target Khutbah Shift <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={overrideShiftId || shifts[0]?.id || ''}
                      onChange={(e) => setOverrideShiftId?.(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] cursor-pointer"
                    >
                      {shifts.map((s, idx) => (
                        <option key={s.id} value={s.id} className="bg-[var(--admin-card)]">
                          Khutbah {idx + 1} ({format12h(s.adhan_time)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">
                  Guest Khateeb / Speaker <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={khateeb}
                  onChange={(e) => setKhateeb(e.target.value)}
                  placeholder="e.g. Dr. Tariq Al-Suwaidan"
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] placeholder-[var(--admin-text-muted)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">
                  Khutbah Topic / Theme <span className="text-[11px] text-[var(--admin-text-muted)]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic?.(e.target.value)}
                  placeholder="e.g. Building Strong Families"
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] placeholder-[var(--admin-text-muted)]"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] flex items-center space-x-2 text-[11px] text-[var(--admin-text-muted)]">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>Appears on the TV only on the selected Friday, then reverts automatically next week.</span>
              </div>
            </>
          ) : (
            <>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">
                    Hall / Location <span className="text-[11px] text-[var(--admin-text-muted)]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation?.(e.target.value)}
                    placeholder="e.g. Main Prayer Hall or Gym"
                    className="w-full px-3 py-1.5 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] placeholder-[var(--admin-text-muted)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">
                    Language <span className="text-[11px] text-[var(--admin-text-muted)]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage?.(e.target.value)}
                    placeholder="e.g. English, Arabic, Urdu"
                    className="w-full px-3 py-1.5 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] placeholder-[var(--admin-text-muted)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">
                  Khutbah Topic / Theme <span className="text-[11px] text-[var(--admin-text-muted)]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic?.(e.target.value)}
                  placeholder="e.g. The Value of Time in Islam"
                  className="w-full px-3.5 py-1.5 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] placeholder-[var(--admin-text-muted)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">
                    Khutbah Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={adhan}
                    onChange={(e) => setAdhan(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
                  />
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
                  <input
                    type="time"
                    value={iqamah}
                    onChange={(e) => setIqamah(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]"
                  />
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
            </>
          )}

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
              <span>
                {isSpecificDate
                  ? 'Save Friday Override'
                  : isAdd
                    ? 'Save Shift'
                    : 'Update Shift'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
