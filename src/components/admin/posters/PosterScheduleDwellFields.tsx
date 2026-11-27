'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, Clock, ChevronDown, Infinity } from 'lucide-react';
import { RecurringScheduleBuilder } from './RecurringScheduleBuilder';
import { parseRecurringSchedule, formatRecurringSummary } from '@/lib/posters/recurring-schedule';

export interface PosterScheduleDwellFieldsProps {
  readonly showDurationSlider?: boolean | undefined;
  readonly duration: number;
  readonly onChangeDuration: (sec: number) => void;
  readonly isIndefinite: boolean;
  readonly onChangeIndefinite: (val: boolean) => void;
  readonly startAt: string;
  readonly onChangeStartAt: (val: string) => void;
  readonly endAt: string;
  readonly onChangeEndAt: (val: string) => void;
  readonly recurringSchedule?: string | null | undefined;
  readonly onChangeRecurringSchedule?: ((val: string | null) => void) | undefined;
  readonly venueTimezone?: string | undefined;
}

export function PosterScheduleDwellFields({
  showDurationSlider = true,
  duration,
  onChangeDuration,
  isIndefinite,
  onChangeIndefinite,
  startAt,
  onChangeStartAt,
  endAt,
  onChangeEndAt,
  recurringSchedule,
  onChangeRecurringSchedule,
  venueTimezone,
}: PosterScheduleDwellFieldsProps) {
  const hasRecurring = useMemo(() => {
    const rules = parseRecurringSchedule(recurringSchedule);
    return Boolean(rules && rules.length > 0);
  }, [recurringSchedule]);

  const [isRecurringOpen, setIsRecurringOpen] = useState<boolean>(hasRecurring);

  const summaryText = useMemo(() => {
    if (!hasRecurring) return 'Continuous (24/7)';
    const rules = parseRecurringSchedule(recurringSchedule);
    return formatRecurringSummary(rules);
  }, [hasRecurring, recurringSchedule]);

  return (
    <>
      {showDurationSlider && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--admin-text-secondary)] flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-[var(--admin-text-muted)]" />
              <span>Display Duration on Screen</span>
            </label>
            <span className="px-2 py-0.5 rounded-md bg-[var(--admin-surface)] border border-[var(--admin-border)] font-mono text-xs font-bold text-[var(--admin-text-primary)] tabular-nums">
              {duration} seconds
            </span>
          </div>
          <input
            type="range"
            min="15"
            max="120"
            step="5"
            value={Math.max(15, duration)}
            onChange={(e) => onChangeDuration(parseInt(e.target.value, 10))}
            className="w-full accent-[var(--admin-tab-active-border)] cursor-pointer"
          />
          <div className="relative w-full h-4 text-[9px] sm:text-[10px] text-[var(--admin-text-muted)] font-mono select-none">
            <span className="absolute left-0 cursor-pointer hover:text-[var(--admin-text-primary)]" onClick={() => onChangeDuration(15)}>15s</span>
            <span className="absolute left-[14.3%] -translate-x-1/2 cursor-pointer hover:text-[var(--admin-text-primary)]" onClick={() => onChangeDuration(30)}>30s</span>
            <span className="absolute left-[28.6%] -translate-x-1/2 cursor-pointer hover:text-[var(--admin-text-primary)]" onClick={() => onChangeDuration(45)}>45s</span>
            <span className="absolute left-[42.9%] -translate-x-1/2 cursor-pointer hover:text-[var(--admin-text-primary)]" onClick={() => onChangeDuration(60)}>60s</span>
            <span className="absolute left-[71.4%] -translate-x-1/2 cursor-pointer hover:text-[var(--admin-text-primary)]" onClick={() => onChangeDuration(90)}>90s</span>
            <span className="absolute right-0 cursor-pointer hover:text-[var(--admin-text-primary)]" onClick={() => onChangeDuration(120)}>120s</span>
          </div>
        </div>
      )}

      <div className="p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-[var(--admin-text-muted)]" />
            <span className="text-xs font-semibold text-[var(--admin-text-primary)]">Broadcast Schedule</span>
          </div>
          <label className="flex items-center space-x-1.5 text-xs text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] cursor-pointer select-none">
            <input type="checkbox" checked={isIndefinite} onChange={(e) => onChangeIndefinite(e.target.checked)} className="w-4 h-4 accent-[var(--admin-tab-active-border)] rounded cursor-pointer" />
            <span className="font-medium text-[11px]">Run Indefinitely</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[var(--admin-text-secondary)] block">Start Date &amp; Time</label>
            <input type="datetime-local" value={startAt} onChange={(e) => onChangeStartAt(e.target.value)} className="w-full h-10 px-3 text-xs rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]" />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[var(--admin-text-secondary)] block">End Date &amp; Time</label>
            {isIndefinite ? (
              <div className="w-full h-10 px-3 text-xs rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-card)]/60 text-[var(--admin-text-muted)] flex items-center space-x-2">
                <Infinity className="w-4 h-4 shrink-0 text-[var(--admin-text-muted)]" />
                <span className="truncate text-[11px]">No expiration date</span>
              </div>
            ) : (
              <input type="datetime-local" value={endAt} onChange={(e) => onChangeEndAt(e.target.value)} className="w-full h-10 px-3 text-xs rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-mono animate-fadeIn focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)]" />
            )}
          </div>
        </div>

        {onChangeRecurringSchedule && (
          <div className="pt-2 border-t border-[var(--admin-border)] space-y-2.5">
            <button
              type="button"
              onClick={() => setIsRecurringOpen((prev) => !prev)}
              aria-expanded={isRecurringOpen}
              className="w-full min-h-[40px] flex flex-wrap items-center justify-between gap-2 py-1.5 text-xs text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] transition select-none cursor-pointer group"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <span className="w-7 h-7 rounded-lg bg-[var(--admin-card)] border border-[var(--admin-border)] group-hover:border-[var(--admin-tab-active-border)] flex items-center justify-center shrink-0 transition-colors">
                  <ChevronDown
                    className={`w-4 h-4 text-[var(--admin-text-primary)] transition-transform duration-200 ${
                      isRecurringOpen ? 'rotate-180' : ''
                    }`}
                  />
                </span>
                <span className="font-semibold text-xs text-[var(--admin-text-primary)] text-left leading-snug">
                  Advanced: Recurring Day &amp; Time Windows
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-md bg-[var(--admin-card)] border border-[var(--admin-border)] text-[10px] font-mono text-[var(--admin-text-secondary)] shrink-0 ml-auto">
                {summaryText}
              </span>
            </button>

            {isRecurringOpen && (
              <div className="pt-2 border-t border-[var(--admin-border)]/50 animate-fadeIn">
                <RecurringScheduleBuilder
                  value={recurringSchedule}
                  onChange={onChangeRecurringSchedule}
                  venueTimezone={venueTimezone}
                  embedded
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
