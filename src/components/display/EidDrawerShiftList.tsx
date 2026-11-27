'use client';

import React from 'react';
import type { EidShift, EidType, JummahShift, SidebarAccentTheme } from '@/types/index';
import { format12h } from '@/lib/utils/time';
import { getAccentTheme } from '@/lib/utils/accent-theme';

export interface EidDrawerShiftListProps {
  readonly shifts: readonly EidShift[];
  readonly accentTheme?: SidebarAccentTheme | undefined;
  readonly eidType?: EidType | undefined;
  readonly isFriday?: boolean | undefined;
  readonly jummahShifts?: readonly JummahShift[] | undefined;
  readonly dhuhrIqamah?: string | undefined;
  readonly eidFridayNote?: string | null | undefined;
}

export function EidDrawerShiftList({
  shifts,
  accentTheme = 'teal',
  eidType,
  isFriday = false,
  jummahShifts = [],
  dhuhrIqamah,
  eidFridayNote,
}: EidDrawerShiftListProps) {
  const theme = getAccentTheme(accentTheme);
  const isCompact = shifts.length >= 3;
  const eidLabel = eidType === 'eid_ul_adha' ? 'Eid al-Adha' : eidType === 'eid_ul_fitr' ? 'Eid al-Fitr' : 'Eid Salah';

  const afternoonJummahSummary =
    jummahShifts.length > 0
      ? jummahShifts.map((s) => format12h(s.adhan_time)).join(' • ')
      : null;

  return (
    <div className="flex flex-col justify-between h-full space-y-3">
      {shifts.length === 0 ? (
        <div className="p-6 text-center text-white/50 text-sm">
          No Eid prayer shifts configured yet.
        </div>
      ) : (
        <div className={isCompact ? 'space-y-2.5' : 'space-y-3.5'}>
          {shifts.map((shift, idx) => (
            <div
              key={shift.id ?? shift.shift_number ?? idx}
              className={`rounded-xl border transition-all ${
                isCompact ? 'p-3' : 'p-3.5'
              } bg-white/10 border-white/10`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-bold uppercase tracking-wider ${theme.textAccent}`}>
                    Shift {idx + 1}
                  </span>
                  {shift.location?.trim() && (
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/75 text-[10px] font-medium">
                      {shift.location}
                    </span>
                  )}
                </div>

                <span
                  className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${theme.bgSubtle} ${theme.textLight} border ${theme.borderSubtle}`}
                >
                  {eidLabel}
                </span>
              </div>

              {shift.khateeb_name?.trim() ? (
                <div className="mb-2">
                  <span className="text-base font-bold text-white block truncate">
                    Khateeb: {shift.khateeb_name}
                  </span>
                </div>
              ) : null}

              <div className="flex items-center justify-between text-neutral-300 border-t border-white/10 pt-2 text-sm">
                {shift.takbeerat_time?.trim() ? (
                  <div>
                    <span className="text-xs text-neutral-400 uppercase tracking-wider block">
                      Takbeerat
                    </span>
                    <span className="text-base font-bold tabular-nums text-neutral-200">
                      {format12h(shift.takbeerat_time)}
                    </span>
                  </div>
                ) : (
                  <div />
                )}

                <div className="text-right">
                  <span className={`text-xs font-semibold ${theme.textAccent} uppercase tracking-wider block`}>
                    Salah
                  </span>
                  <span className="text-2xl font-black tabular-nums text-white">
                    {format12h(shift.salah_time)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Smart Morning-to-Afternoon Handoff Notice */}
      {(isFriday || eidFridayNote?.trim() || (dhuhrIqamah && dhuhrIqamah !== '--:--')) && (
        <div className="rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2.5 text-xs space-y-1">
          {isFriday && afternoonJummahSummary && (
            <div className="flex items-center justify-between text-neutral-200">
              <span className="font-semibold text-neutral-400 uppercase tracking-wider text-[10px]">
                Afternoon Jummah
              </span>
              <span className={`font-bold tabular-nums ${theme.textLight}`}>
                {afternoonJummahSummary}
              </span>
            </div>
          )}
          {!isFriday && dhuhrIqamah && dhuhrIqamah !== '--:--' && (
            <div className="flex items-center justify-between text-neutral-200">
              <span className="font-semibold text-neutral-400 uppercase tracking-wider text-[10px]">
                Afternoon Dhuhr
              </span>
              <span className="font-bold tabular-nums text-white">
                {format12h(dhuhrIqamah)}
              </span>
            </div>
          )}
          {eidFridayNote?.trim() && (
            <p className="text-[11px] text-amber-300/95 font-medium leading-snug">
              {eidFridayNote.trim()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
