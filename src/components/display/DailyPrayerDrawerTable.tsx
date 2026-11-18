'use client';

import React from 'react';
import type { PrayerTimesToday, PrayerSlot, SidebarAccentTheme } from '@/types/index';
import { format12h } from '@/lib/utils/time';
import { getAccentTheme, type AccentThemeConfig } from '@/lib/utils/accent-theme';

interface PrayerRowProps {
  readonly name: string;
  readonly slot: PrayerSlot;
  readonly isUpcoming: boolean;
  readonly isStartingNow?: boolean | undefined;
  readonly showAdhanTimes?: boolean | undefined;
  readonly theme: AccentThemeConfig;
}

function PrayerRow({
  name,
  slot,
  isUpcoming,
  isStartingNow = false,
  showAdhanTimes = true,
  theme,
}: PrayerRowProps) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-2.5 rounded-xl border transition-colors ${
        isUpcoming
          ? `${theme.bgSubtle} ${theme.borderActive} text-white shadow-lg ${theme.shadowGlow}`
          : 'bg-white/5 border-white/5 text-neutral-300'
      }`}
    >
      <div>
        <span className="text-xl font-bold tracking-tight block text-white">{name}</span>
        {isUpcoming && (
          <span
            className={`text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 ${theme.textAccent}`}
          >
            {isStartingNow ? (
              <>
                <span className="relative flex h-2 w-2 mr-0.5">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ backgroundColor: theme.dotColor, animationDuration: '3s' }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-2 w-2"
                    style={{ backgroundColor: theme.dotColor }}
                  />
                </span>
                <span>In Progress</span>
              </>
            ) : (
              <span>Next Prayer</span>
            )}
          </span>
        )}
      </div>

      {name === 'Sunrise' ? (
        <div className="text-right min-w-[110px]">
          <span className="text-xs font-semibold text-amber-400/90 uppercase tracking-wider block">
            Shuruq
          </span>
          <span className="text-2xl font-black tabular-nums text-white">
            {format12h(slot.adhan_time)}
          </span>
        </div>
      ) : showAdhanTimes ? (
        <div className="flex items-center space-x-6 text-right">
          <div>
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider block">
              Adhan
            </span>
            <span className="text-lg font-bold tabular-nums text-neutral-200">
              {format12h(slot.adhan_time)}
            </span>
          </div>
          <div className="border-l border-white/10 pl-6 min-w-[95px]">
            <span className={`text-xs font-semibold ${theme.textAccent} uppercase tracking-wider block`}>
              Iqamah
            </span>
            <span className="text-2xl font-black tabular-nums text-white">
              {format12h(slot.iqamah_time)}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-right min-w-[110px]">
          <span className={`text-xs font-bold ${theme.textAccent} uppercase tracking-widest block mb-0.5`}>
            Iqamah
          </span>
          <span className="text-3xl font-black tabular-nums text-white">
            {format12h(slot.iqamah_time)}
          </span>
        </div>
      )}
    </div>
  );
}

export interface DailyPrayerDrawerTableProps {
  readonly prayers: PrayerTimesToday;
  readonly upcomingPrayerName?: string | undefined;
  readonly isStartingNow?: boolean | undefined;
  readonly showAdhanTimes?: boolean | undefined;
  readonly accentTheme?: SidebarAccentTheme | undefined;
}

export function DailyPrayerDrawerTable({
  prayers,
  upcomingPrayerName,
  isStartingNow = false,
  showAdhanTimes = true,
  accentTheme = 'teal',
}: DailyPrayerDrawerTableProps) {
  const upcomingUpper = upcomingPrayerName?.toUpperCase();
  const theme = getAccentTheme(accentTheme);

  return (
    <div className="space-y-2">
      <PrayerRow
        name="Fajr"
        slot={prayers.fajr}
        isUpcoming={upcomingUpper === 'FAJR'}
        isStartingNow={upcomingUpper === 'FAJR' && isStartingNow}
        showAdhanTimes={showAdhanTimes}
        theme={theme}
      />
      <PrayerRow
        name="Sunrise"
        slot={prayers.sunrise}
        isUpcoming={false}
        isStartingNow={false}
        showAdhanTimes={showAdhanTimes}
        theme={theme}
      />
      <PrayerRow
        name="Dhuhr"
        slot={prayers.dhuhr}
        isUpcoming={upcomingUpper === 'DHUHR'}
        isStartingNow={upcomingUpper === 'DHUHR' && isStartingNow}
        showAdhanTimes={showAdhanTimes}
        theme={theme}
      />
      <PrayerRow
        name="Asr"
        slot={prayers.asr}
        isUpcoming={upcomingUpper === 'ASR'}
        isStartingNow={upcomingUpper === 'ASR' && isStartingNow}
        showAdhanTimes={showAdhanTimes}
        theme={theme}
      />
      <PrayerRow
        name="Maghrib"
        slot={prayers.maghrib}
        isUpcoming={upcomingUpper === 'MAGHRIB'}
        isStartingNow={upcomingUpper === 'MAGHRIB' && isStartingNow}
        showAdhanTimes={showAdhanTimes}
        theme={theme}
      />
      <PrayerRow
        name="Isha"
        slot={prayers.isha}
        isUpcoming={upcomingUpper === 'ISHA'}
        isStartingNow={upcomingUpper === 'ISHA' && isStartingNow}
        showAdhanTimes={showAdhanTimes}
        theme={theme}
      />
    </div>
  );
}
