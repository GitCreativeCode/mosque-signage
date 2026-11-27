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
  const isCompact = shifts.length >= 3;

  return (
    <div className={isCompact ? 'space-y-2.5' : 'space-y-3.5'}>
      {shifts.map((shift) => {
        const isKhutbahInProgress = shift.status === 'KHUTBAH_IN_PROGRESS';
        const isStartingNow = shift.status === 'STARTING_NOW';
        const isDone = shift.status === 'COMPLETED';

        return (
          <div
            key={shift.shift_number}
            className={`rounded-xl border transition-all ${
              isCompact ? 'p-3' : 'p-3.5'
            } ${
              isKhutbahInProgress || isStartingNow
                ? 'bg-white/[0.08] border-white/25 shadow-lg'
                : isDone
                ? 'bg-white/5 border-white/5 opacity-50'
                : 'bg-white/10 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-bold uppercase tracking-wider ${theme.textAccent}`}>
                  Khutbah {shift.shift_number}
                </span>
                {shift.location?.trim() && (
                  <span className="px-1.5 py-0.2 rounded bg-white/10 text-white/70 text-[10px] font-medium">
                    {shift.location}
                  </span>
                )}
                {shift.language?.trim() && (
                  <span className="px-1.5 py-0.2 rounded bg-white/10 text-white/70 text-[10px] font-medium">
                    {shift.language}
                  </span>
                )}
              </div>

              <span
                className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider tabular-nums flex items-center space-x-1.5 ${
                  isKhutbahInProgress || isStartingNow
                    ? 'bg-white/15 text-white border border-white/20'
                    : isDone
                    ? 'bg-neutral-800 text-neutral-400'
                    : `${theme.bgSubtle} ${theme.textLight} border ${theme.borderSubtle}`
                }`}
              >
                {(isKhutbahInProgress || isStartingNow) && (
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
                  {isKhutbahInProgress
                    ? 'Khutbah Active'
                    : isStartingNow
                    ? 'Salah Active'
                    : isDone
                    ? 'Done'
                    : formatCountdown(shift.minutes_remaining)}
                </span>
              </span>
            </div>

            {shift.khateeb_name?.trim() ? (
              <div className="mb-2">
                <span className="text-base font-bold text-white block truncate">
                  Khateeb: {shift.khateeb_name}
                </span>
                {shift.topic?.trim() && (
                  <span className="text-xs text-neutral-300 italic block truncate">
                    Topic: {shift.topic}
                  </span>
                )}
              </div>
            ) : null}

            <div className="flex items-center justify-between text-neutral-300 border-t border-white/10 pt-2 text-sm">
              <div>
                <span className="text-neutral-400 block text-[11px]">Khutbah</span>
                <span className="font-bold tabular-nums text-white text-base">
                  {format12h(shift.adhan_time)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-emerald-400 block text-[11px] font-semibold uppercase tracking-wider">
                  Iqamah
                </span>
                <span className="font-black tabular-nums text-white text-lg">
                  {format12h(
                    shift.iqamah_time && shift.iqamah_time.trim().length > 0
                      ? shift.iqamah_time
                      : shift.adhan_time
                  )}
                </span>
                {!isDone && !isStartingNow && !isKhutbahInProgress && typeof shift.minutes_remaining === 'number' && (
                  <span className="text-[10px] text-emerald-400 font-mono tabular-nums font-medium block">
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
