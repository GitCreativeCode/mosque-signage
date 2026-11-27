'use client';

import React from 'react';
import type { PrayerTimesToday, PrayerSlot, SidebarAccentTheme, TaraweehSession } from '@/types/index';
import { format12h, subtractMinutesFromTime } from '@/lib/utils/time';
import { getAccentTheme, type AccentThemeConfig } from '@/lib/utils/accent-theme';
import { getNightPrayerTypeLabel, normalizeNightPrayerSession } from '@/lib/prayer/ramadan-visibility';

interface PrayerRowProps {
  readonly name: string;
  readonly slot: PrayerSlot;
  readonly isUpcoming: boolean;
  readonly isStartingNow?: boolean | undefined;
  readonly showAdhanTimes?: boolean | undefined;
  readonly theme: AccentThemeConfig;
  readonly ramadanNotes?: readonly string[] | undefined;
  readonly compact?: boolean | undefined;
}

function formatWitrCompact(witrMode: TaraweehSession['witr_mode']): string {
  switch (witrMode) {
    case '2+1':
      return 'Witr 2+1';
    case 'continuous_3':
      return '3 Witr';
    case '1':
      return '1 Witr';
    default:
      return '';
  }
}

function resolveDisplayNightSessions(
  ramadanModeEnabled: boolean,
  sessions?: readonly TaraweehSession[],
  fallbackTime?: string | null,
  fallbackRakats?: string | null
): TaraweehSession[] {
  if (!ramadanModeEnabled) return [];
  if (sessions && sessions.length > 0) return sessions.map(normalizeNightPrayerSession);

  const isLegacyQiyam = fallbackRakats === 'Qiyam';
  const validRakats: TaraweehSession['rakats'] =
    fallbackRakats === '2' ||
    fallbackRakats === '4' ||
    fallbackRakats === '6' ||
    fallbackRakats === '8' ||
    fallbackRakats === '10' ||
    fallbackRakats === '12' ||
    fallbackRakats === '20'
      ? fallbackRakats
      : isLegacyQiyam
        ? '8'
        : '20';

  return [
    {
      session_number: 1,
      prayer_type: isLegacyQiyam ? 'qiyam' : 'taraweeh',
      label: isLegacyQiyam ? 'Qiyam' : 'Taraweeh',
      time_mode: fallbackTime ? 'FIXED' : 'OFFSET',
      offset_minutes: 0,
      fixed_time: fallbackTime || '21:30',
      rakats: validRakats,
      witr_mode: 'none',
    },
  ];
}

function formatNightSessionTitle(session: TaraweehSession, totalSessions: number): string {
  const typeLabel = getNightPrayerTypeLabel(session.prayer_type);
  if (session.label?.trim()) return session.label.trim();
  return totalSessions > 1 ? `${typeLabel} (${session.session_number})` : typeLabel;
}

function formatNightSessionTiming(session: TaraweehSession, ishaIqamah?: string | null): string {
  if (session.time_mode === 'OFFSET') {
    if (!ishaIqamah || ishaIqamah === '--:--') {
      return 'After Isha';
    }
    return session.offset_minutes === 0 ? 'After Isha' : `+${session.offset_minutes}m After Isha`;
  }
  return format12h(session.fixed_time);
}

function formatNightSessionMeta(session: TaraweehSession): string {
  const typeLabel = getNightPrayerTypeLabel(session.prayer_type);
  const customTitleDiffers =
    Boolean(session.label?.trim()) && session.label!.trim().toLowerCase() !== typeLabel.toLowerCase();
  const rakatPart = session.rakats === 'Qiyam' ? 'Qiyam' : `${session.rakats} Rakats`;
  const witrPart = formatWitrCompact(session.witr_mode);
  const parts = [customTitleDiffers ? typeLabel : null, rakatPart, witrPart || null].filter(Boolean);
  return parts.join(' • ');
}

function PrayerRow({
  name,
  slot,
  isUpcoming,
  isStartingNow = false,
  showAdhanTimes = true,
  theme,
  ramadanNotes,
  compact = false,
}: PrayerRowProps) {
  return (
    <div
      className={`flex items-center justify-between px-4 ${compact ? 'py-2' : 'py-2.5'} rounded-xl border transition-colors ${
        isUpcoming
          ? `${theme.bgSubtle} ${theme.borderActive} text-white shadow-lg ${theme.shadowGlow}`
          : 'bg-white/5 border-white/5 text-neutral-300'
      }`}
    >
      <div className="min-w-0 pr-2">
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
        {ramadanNotes && ramadanNotes.length > 0 && (
          <div className="mt-0.5 space-y-0.5">
            {ramadanNotes.map((note, idx) => (
              <div key={idx} className="text-[11px] font-semibold text-amber-300 tracking-wide truncate">
                {note}
              </div>
            ))}
          </div>
        )}
      </div>

      {name === 'Sunrise' ? (
        <div className="text-right min-w-[110px] shrink-0">
          <span className="text-xs font-semibold text-amber-400/90 uppercase tracking-wider block">
            Shuruq
          </span>
          <span className="text-2xl font-black tabular-nums text-white">
            {format12h(slot.adhan_time)}
          </span>
        </div>
      ) : showAdhanTimes ? (
        <div className="flex items-center space-x-6 text-right shrink-0">
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
        <div className="text-right min-w-[110px] shrink-0">
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
  readonly ramadanModeEnabled?: boolean | undefined;
  readonly ramadanFastingMarkersEnabled?: boolean | undefined;
  readonly ramadanSuhoorBufferMinutes?: number | undefined;
  readonly ramadanTaraweehTime?: string | null | undefined;
  readonly ramadanTaraweehRakats?: string | null | undefined;
  readonly ramadanTaraweehSessions?: readonly TaraweehSession[] | undefined;
}

export function DailyPrayerDrawerTable({
  prayers,
  upcomingPrayerName,
  isStartingNow = false,
  showAdhanTimes = true,
  accentTheme = 'teal',
  ramadanModeEnabled = false,
  ramadanFastingMarkersEnabled,
  ramadanSuhoorBufferMinutes = 10,
  ramadanTaraweehTime,
  ramadanTaraweehRakats = '20',
  ramadanTaraweehSessions,
}: DailyPrayerDrawerTableProps) {
  const upcomingUpper = upcomingPrayerName?.toUpperCase();
  const theme = getAccentTheme(accentTheme);

  const fastingActive = ramadanModeEnabled && (ramadanFastingMarkersEnabled ?? ramadanModeEnabled);
  const hasSuhoorBuffer = (ramadanSuhoorBufferMinutes ?? 0) > 0;
  const suhoorCutoff =
    fastingActive && hasSuhoorBuffer && prayers.fajr?.adhan_time
      ? subtractMinutesFromTime(prayers.fajr.adhan_time, ramadanSuhoorBufferMinutes)
      : null;

  const nightSessions = resolveDisplayNightSessions(
    ramadanModeEnabled,
    ramadanTaraweehSessions,
    ramadanTaraweehTime,
    ramadanTaraweehRakats
  );
  const hasNightCard = nightSessions.length > 0;
  const isNightUpcoming = upcomingUpper
    ? nightSessions.some((s) => {
        const title = formatNightSessionTitle(s, nightSessions.length).toUpperCase();
        return (
          upcomingUpper.includes(title) ||
          upcomingUpper.includes('TARAWEEH') ||
          upcomingUpper.includes('QIYAM') ||
          upcomingUpper.includes('TAHAJJUD')
        );
      })
    : false;

  return (
    <div className={hasNightCard ? 'space-y-1.5' : 'space-y-2'}>
      <PrayerRow
        name="Fajr"
        slot={prayers.fajr}
        isUpcoming={upcomingUpper === 'FAJR'}
        isStartingNow={upcomingUpper === 'FAJR' && isStartingNow}
        showAdhanTimes={showAdhanTimes}
        theme={theme}
        compact={hasNightCard}
        ramadanNotes={suhoorCutoff ? [`Suhoor Ends: ${format12h(suhoorCutoff)}`] : undefined}
      />
      <PrayerRow
        name="Sunrise"
        slot={prayers.sunrise}
        isUpcoming={false}
        isStartingNow={false}
        showAdhanTimes={showAdhanTimes}
        theme={theme}
        compact={hasNightCard}
      />
      <PrayerRow
        name="Dhuhr"
        slot={prayers.dhuhr}
        isUpcoming={upcomingUpper === 'DHUHR'}
        isStartingNow={upcomingUpper === 'DHUHR' && isStartingNow}
        showAdhanTimes={showAdhanTimes}
        theme={theme}
        compact={hasNightCard}
      />
      <PrayerRow
        name="Asr"
        slot={prayers.asr}
        isUpcoming={upcomingUpper === 'ASR'}
        isStartingNow={upcomingUpper === 'ASR' && isStartingNow}
        showAdhanTimes={showAdhanTimes}
        theme={theme}
        compact={hasNightCard}
      />
      <PrayerRow
        name="Maghrib"
        slot={prayers.maghrib}
        isUpcoming={upcomingUpper === 'MAGHRIB'}
        isStartingNow={upcomingUpper === 'MAGHRIB' && isStartingNow}
        showAdhanTimes={showAdhanTimes}
        theme={theme}
        compact={hasNightCard}
        ramadanNotes={
          fastingActive && prayers.maghrib?.adhan_time
            ? [`Iftar: ${format12h(prayers.maghrib.adhan_time)}`]
            : undefined
        }
      />
      <PrayerRow
        name="Isha"
        slot={prayers.isha}
        isUpcoming={upcomingUpper === 'ISHA'}
        isStartingNow={upcomingUpper === 'ISHA' && isStartingNow}
        showAdhanTimes={showAdhanTimes}
        theme={theme}
        compact={hasNightCard}
      />

      {hasNightCard && (
        <div
          className={`rounded-xl border px-3.5 py-2.5 transition-colors ${
            isNightUpcoming
              ? `${theme.bgSubtle} ${theme.borderActive} text-white shadow-lg ${theme.shadowGlow}`
              : 'bg-white/[0.06] border-white/10 text-neutral-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${theme.textAccent}`}>
              {fastingActive ? 'Taraweeh & Night Prayers' : 'Upcoming Ramadan • Night Prayers'}
            </span>
            {isNightUpcoming && isStartingNow && (
              <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.textAccent}`}>
                In Progress
              </span>
            )}
          </div>

          {nightSessions.length === 1 ? (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">
                  {formatNightSessionTitle(nightSessions[0]!, 1)}
                </div>
                <div className="text-[11px] font-medium text-neutral-300">
                  {formatNightSessionMeta(nightSessions[0]!)}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-base font-black tabular-nums text-white">
                  {formatNightSessionTiming(nightSessions[0]!, prayers.isha?.iqamah_time)}
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {nightSessions.map((session, idx) => {
                const isOddLast = nightSessions.length % 2 === 1 && idx === nightSessions.length - 1;
                return (
                  <div
                    key={session.session_number}
                    className={`rounded-lg bg-black/25 border border-white/10 px-2.5 py-1.5 min-w-0 ${
                      isOddLast ? 'col-span-2 flex items-center justify-between gap-2' : ''
                    }`}
                  >
                    {isOddLast ? (
                      <>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-white truncate">
                            {formatNightSessionTitle(session, nightSessions.length)}
                          </div>
                          <div className="text-[10px] font-medium text-neutral-300 truncate">
                            {formatNightSessionMeta(session)}
                          </div>
                        </div>
                        <span className={`text-xs font-black tabular-nums ${theme.textAccent} shrink-0`}>
                          {formatNightSessionTiming(session, prayers.isha?.iqamah_time)}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold text-white truncate">
                            {formatNightSessionTitle(session, nightSessions.length)}
                          </span>
                          <span className={`text-[11px] font-black tabular-nums ${theme.textAccent} shrink-0`}>
                            {formatNightSessionTiming(session, prayers.isha?.iqamah_time)}
                          </span>
                        </div>
                        <div className="text-[10px] font-medium text-neutral-300 truncate mt-0.5">
                          {formatNightSessionMeta(session)}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
