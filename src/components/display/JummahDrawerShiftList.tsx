'use client';

import React from 'react';
import type { JummahShift, SidebarAccentTheme } from '@/types/index';
import { format12h, formatCountdown } from '@/lib/utils/time';
import { getAccentTheme } from '@/lib/utils/accent-theme';

export interface JummahDrawerShiftListProps {
  readonly shifts: readonly JummahShift[];
  readonly accentTheme?: SidebarAccentTheme | undefined;
}

export function JummahDrawerShiftList({ shifts, accentTheme = 'teal' }: JummahDrawerShiftListProps) {
  const theme = getAccentTheme(accentTheme);

  return (
    <div className="space-y-4">
      {shifts.map((shift) => {
        const isStartingNow = shift.status === 'STARTING_NOW';
        const isDone = shift.status === 'COMPLETED';

        return (
          <div
            key={shift.shift_number}
            className={`p-4 rounded-xl border transition-all ${
              isStartingNow
                ? 'bg-white/[0.08] border-white/20 shadow-lg'
                : isDone
                ? 'bg-white/5 border-white/5 opacity-60'
                : 'bg-white/10 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-bold uppercase tracking-wider ${theme.textAccent}`}>
                Khutbah {shift.shift_number}
              </span>
              <span
                className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider tabular-nums flex items-center space-x-1.5 ${
                  isStartingNow
                    ? 'bg-white/10 text-white border border-white/20'
                    : isDone
                    ? 'bg-neutral-800 text-neutral-400'
                    : `${theme.bgSubtle} ${theme.textLight} border ${theme.borderSubtle}`
                }`}
              >
                {isStartingNow && (
                  <span className="relative flex h-2 w-2 mr-1">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: theme.dotColor, animationDuration: '3s' }}
                    />
                    <span
                      className="relative inline-flex rounded-full h-2 w-2"
                      style={{ backgroundColor: theme.dotColor }}
                    />
                  </span>
                )}
                <span>
                  {isStartingNow
                    ? 'In Progress'
                    : isDone
                    ? 'Done'
                    : formatCountdown(shift.minutes_remaining)}
                </span>
              </span>
            </div>

            {shift.khateeb_name?.trim() ? (
              <div className="text-lg font-bold text-white mb-3">
                Khateeb: {shift.khateeb_name}
              </div>
            ) : null}

            <div className="flex items-center justify-between text-neutral-300 border-t border-white/10 pt-2 text-sm">
              <div>
                <span className="text-neutral-400 block text-xs">Khutbah</span>
                <span className="font-bold tabular-nums text-white text-base">
                  {format12h(shift.adhan_time)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-emerald-400 block text-xs font-semibold uppercase tracking-wider">
                  Iqamah
                </span>
                <span className="font-black tabular-nums text-white text-xl">
                  {format12h(
                    shift.iqamah_time && shift.iqamah_time.trim().length > 0
                      ? shift.iqamah_time
                      : shift.adhan_time
                  )}
                </span>
                {!isDone && !isStartingNow && typeof shift.minutes_remaining === 'number' && (
                  <span className="text-[11px] text-emerald-400 font-mono tabular-nums font-medium block">
                    {formatCountdown(shift.minutes_remaining)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
