'use client';

import React from 'react';
import { Pencil } from 'lucide-react';
import type { MonthPrayerDay } from '@/types/index';
import { format12h } from '@/lib/utils/time';
import { ADHAN_SOURCE_COLOR, ADHAN_SOURCE_TOOLTIP } from '@/lib/prayer/timetable-constraints';

export interface MonthlyTimetableMobileListProps {
  readonly schedule: readonly MonthPrayerDay[];
  readonly onEditDay: (day: MonthPrayerDay) => void;
}

const MOBILE_SLOTS = [
  { key: 'fajr', label: 'Fajr' },
  { key: 'sunrise', label: 'Sunrise' },
  { key: 'dhuhr', label: 'Dhuhr' },
  { key: 'asr', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha', label: 'Isha' },
] as const;

/** Compact stacked Day Cards rendering monthly prayer times cleanly on phones (< 768px). */
export function MonthlyTimetableMobileList({ schedule, onEditDay }: MonthlyTimetableMobileListProps) {
  return (
    <div className="divide-y divide-[var(--admin-border)]">
      {schedule.map((day) => {
        const isCurrentDay = day.isToday;
        const isFriday = day.isFriday;
        const cardBg = isCurrentDay
          ? 'bg-emerald-500/12 dark:bg-emerald-900/25 border-l-4 border-l-emerald-600'
          : isFriday
          ? 'bg-[var(--admin-surface)]/50'
          : '';

        return (
          <div key={day.date} className={`p-3.5 space-y-2.5 ${cardBg}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 min-w-0">
                <span className="font-mono font-bold text-sm text-[var(--admin-text-primary)]">
                  {day.dayNumber}
                </span>
                <span className={`text-xs ${isFriday ? 'font-semibold text-[var(--admin-text-primary)]' : 'text-[var(--admin-text-muted)]'}`}>
                  {day.dayName}
                </span>
                {isCurrentDay && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-700 dark:bg-emerald-600 text-white text-[9px] uppercase font-bold tracking-wider">
                    Today
                  </span>
                )}
                {isFriday && !isCurrentDay && (
                  <span className="px-1.5 py-0.5 rounded bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-muted)] text-[9px] font-medium">
                    Jummah
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onEditDay(day)}
                className="min-h-[40px] min-w-[40px] px-2.5 py-1.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-card-hover)] text-xs font-medium text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] inline-flex items-center space-x-1.5 transition cursor-pointer"
                title={`Edit Iqamah times for ${day.date}`}
                aria-label={`Edit Iqamah times for ${day.date}`}
              >
                <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Edit</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono">
              {MOBILE_SLOTS.map(({ key, label }) => {
                if (key === 'sunrise') {
                  const sunSource = day.sunrise.adhanSource ?? 'astronomical';
                  return (
                    <div
                      key={key}
                      className="px-2.5 py-1.5 rounded-xl border border-[var(--admin-border)]/70 bg-[var(--admin-surface)]/60 flex items-center justify-between gap-1.5"
                    >
                      <span className="font-sans text-[11px] font-medium text-[var(--admin-text-muted)]">
                        {label}
                      </span>
                      <span
                        className={`text-[11px] font-semibold ${ADHAN_SOURCE_COLOR[sunSource]}`}
                        title={ADHAN_SOURCE_TOOLTIP[sunSource]}
                      >
                        {format12h(day.sunrise.adhan)}
                      </span>
                    </div>
                  );
                }

                const slot = day[key];
                const source = slot.adhanSource ?? 'astronomical';
                return (
                  <div
                    key={key}
                    className="px-2.5 py-1.5 rounded-xl border border-[var(--admin-border)]/70 bg-[var(--admin-surface)]/60 space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-[11px] font-semibold text-[var(--admin-text-secondary)]">
                        {label}
                      </span>
                      {slot.isClamped && (
                        <span
                          className="px-1 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[9px] font-sans font-bold"
                          title="Smart Clamping: Automatically adjusted to Adhan + 5 min."
                        >
                          Adj
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] gap-1">
                      <span className={ADHAN_SOURCE_COLOR[source]} title={ADHAN_SOURCE_TOOLTIP[source]}>
                        {format12h(slot.adhan)}
                      </span>
                      <span className="text-[var(--admin-text-muted)]">|</span>
                      <span className="text-[var(--admin-text-primary)] font-bold">
                        {format12h(slot.iqamah)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
