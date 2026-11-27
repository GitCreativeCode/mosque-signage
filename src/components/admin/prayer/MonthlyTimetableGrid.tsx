'use client';

import React from 'react';
import { Pencil } from 'lucide-react';
import type { MonthPrayerDay } from '@/types/index';
import { format12h } from '@/lib/utils/time';
import { ADHAN_SOURCE_COLOR, ADHAN_SOURCE_TOOLTIP } from '@/lib/prayer/timetable-constraints';
import { MonthlyTimetableMobileList } from './MonthlyTimetableMobileList';

export interface MonthlyTimetableGridProps {
  readonly schedule: readonly MonthPrayerDay[];
  readonly onEditDay: (day: MonthPrayerDay) => void;
}

const CONGREGATIONAL_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

export function MonthlyTimetableGrid({ schedule, onEditDay }: MonthlyTimetableGridProps) {
  return (
    <>
      <div className="md:hidden max-h-[68vh] overflow-y-auto">
        <MonthlyTimetableMobileList schedule={schedule} onEditDay={onEditDay} />
      </div>

      <div className="hidden md:block overflow-x-auto max-h-[640px] overflow-y-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="sticky top-0 z-10 bg-[var(--admin-surface)] border-b border-[var(--admin-border)] text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">
          <tr>
            <th className="py-3 px-3.5">Date</th>
            <th className="py-3 px-3"><div>Fajr</div><span className="text-[10px] font-normal normal-case opacity-70">Adhan | Iqamah</span></th>
            <th className="py-3 px-3"><div>Sunrise</div><span className="text-[10px] font-normal normal-case opacity-70">Shuruq</span></th>
            <th className="py-3 px-3"><div>Dhuhr</div><span className="text-[10px] font-normal normal-case opacity-70">Adhan | Iqamah</span></th>
            <th className="py-3 px-3"><div>Asr</div><span className="text-[10px] font-normal normal-case opacity-70">Adhan | Iqamah</span></th>
            <th className="py-3 px-3"><div>Maghrib</div><span className="text-[10px] font-normal normal-case opacity-70">Adhan | Iqamah</span></th>
            <th className="py-3 px-3"><div>Isha</div><span className="text-[10px] font-normal normal-case opacity-70">Adhan | Iqamah</span></th>
            <th className="py-3 px-3 text-right">Edit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--admin-border)] font-mono">
          {schedule.map((day) => {
            const isCurrentDay = day.isToday;
            const isFriday = day.isFriday;
            const rowStyle = isCurrentDay
              ? 'bg-emerald-500/15 dark:bg-emerald-900/30 font-bold border-l-4 border-l-emerald-600'
              : isFriday
              ? 'bg-[var(--admin-surface)]/50 hover:bg-[var(--admin-card-hover)]/60'
              : 'hover:bg-[var(--admin-card-hover)]/40';

            return (
              <tr key={day.date} className={`transition-colors group ${rowStyle}`}>
                <td className="py-2.5 px-3.5 font-sans whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 text-right font-mono font-bold text-xs text-[var(--admin-text-primary)]">{day.dayNumber}</span>
                    <span className={`text-[11px] ${isFriday ? 'text-[var(--admin-text-primary)] font-semibold' : 'text-[var(--admin-text-muted)] font-medium'}`}>
                      {day.dayName}
                    </span>
                    {isCurrentDay && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-700 dark:bg-emerald-600 text-white text-[9px] uppercase font-bold tracking-wider">
                        Today
                      </span>
                    )}
                    {isFriday && !isCurrentDay && (
                      <span className="px-1.5 py-0.5 rounded bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-muted)] text-[9px] font-medium">Jummah</span>
                    )}
                  </div>
                </td>

                {CONGREGATIONAL_PRAYERS.map((pKey) => {
                  const slot = day[pKey];
                  const source = slot.adhanSource ?? 'astronomical';
                  return (
                    <React.Fragment key={pKey}>
                      {pKey === 'dhuhr' && (
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`text-[11px] font-medium ${ADHAN_SOURCE_COLOR[day.sunrise.adhanSource ?? 'astronomical']}`}
                            title={ADHAN_SOURCE_TOOLTIP[day.sunrise.adhanSource ?? 'astronomical']}
                          >
                            {format12h(day.sunrise.adhan)}
                          </span>
                        </td>
                      )}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-1.5 whitespace-nowrap">
                          <span className={`text-[11px] ${ADHAN_SOURCE_COLOR[source]}`} title={ADHAN_SOURCE_TOOLTIP[source]}>
                            {format12h(slot.adhan)}
                          </span>
                          <span className="text-[var(--admin-text-muted)] text-[10px]">|</span>
                          <span className="text-[var(--admin-text-primary)] font-semibold text-xs">{format12h(slot.iqamah)}</span>
                          {slot.isClamped && (
                            <span
                              className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[9px] font-sans font-bold cursor-help"
                              title="Smart Clamping: Astronomical Adhan moved past configured Iqamah. Automatically adjusted to Adhan + 5 min."
                            >
                              Adj
                            </span>
                          )}
                        </div>
                      </td>
                    </React.Fragment>
                  );
                })}

                <td className="py-2.5 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => onEditDay(day)}
                    className="p-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-card-hover)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] transition cursor-pointer"
                    title={`Edit Iqamah times for ${day.date}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </>
  );
}

