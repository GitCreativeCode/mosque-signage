/**
 * Deterministic Display Snapshot Reducer
 * MosqueSignage (TV)
 */

import type {
  DisplayState,
  DrawerType,
  HeaderState,
  JummahShift,
  MiniPillState,
  Poster,
  PrayerTimesToday,
  QrCardState,
  PublicDisplaySettings,
  Settings,
} from '@/types/index';
import { formatHijriDate } from '@/lib/prayer/hijri';
import { parseTimeToDate, resolveNextPrayer } from '@/lib/prayer/prayer-engine';
import { getActivePosters } from './poster-status';
import { formatClockTime, isFriday, resolveJummahShifts } from './jummah-resolver';
import { isSystemClockSynchronized } from '@/lib/utils/time';

export interface DisplaySnapshotOptions {
  readonly forceDrawerOpen?: boolean | undefined;
}

function getEffectiveShiftTime(shift: JummahShift): string {
  return shift.iqamah_time && shift.iqamah_time.trim().length > 0
    ? shift.iqamah_time
    : shift.adhan_time;
}

function resolveDrawerType(
  isDrawerOpen: boolean,
  isFri: boolean,
  isFajrFinished: boolean,
  resolvedJummahShifts: readonly JummahShift[],
  silenceDurationMs: number,
  now: Date,
  timezone: string
): DrawerType {
  if (!isDrawerOpen) return null;
  if (!isFri || resolvedJummahShifts.length === 0) return 'DAILY_PRAYER';

  const lastShift = [...resolvedJummahShifts].sort((a, b) => b.shift_number - a.shift_number)[0];
  const lastShiftTime = lastShift
    ? parseTimeToDate(getEffectiveShiftTime(lastShift), now, timezone).getTime() + silenceDurationMs
    : Number.POSITIVE_INFINITY;

  return isFajrFinished && now.getTime() <= lastShiftTime ? 'JUMMAH' : 'DAILY_PRAYER';
}

function buildFridayTargetTelemetry(target: JummahShift, now: Date, timezone: string): MiniPillState {
  const effectiveTime = getEffectiveShiftTime(target);
  const targetDate = parseTimeToDate(effectiveTime, now, timezone);
  const totalSec = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));
  return {
    prayer_name: `Khutbah ${target.shift_number}`,
    time_display: effectiveTime,
    minutes_remaining: Math.ceil(totalSec / 60),
    seconds_remaining: totalSec,
    target_iso: targetDate.toISOString(),
    status: target.status === 'STARTING_NOW' ? 'STARTING_NOW' : 'COUNTDOWN',
  };
}

function buildDailyPrayerTelemetry(
  settings: Settings,
  prayers: PrayerTimesToday,
  skipDhuhr: boolean,
  now: Date
): MiniPillState {
  const adjusted = skipDhuhr
    ? { ...prayers, dhuhr: { ...prayers.dhuhr, iqamah_time: '00:00' } }
    : prayers;
  const resolved = resolveNextPrayer(adjusted, now, {
    timezone: settings.timezone,
    startingNowDurationMinutes: settings.prayer_starting_now_duration_minutes,
  });
  const totalSec = Math.max(0, Math.floor((resolved.target_date.getTime() - now.getTime()) / 1000));
  return {
    prayer_name: resolved.prayer_name,
    time_display: resolved.time_display,
    minutes_remaining: Math.ceil(totalSec / 60),
    seconds_remaining: totalSec,
    target_iso: resolved.target_date.toISOString(),
    status: resolved.status,
  };
}

function resolveQrCardState(
  activePoster: Poster | null,
  isDrawerOpen: boolean,
  showDuringDrawer?: boolean
): QrCardState | null {
  if (isDrawerOpen && !showDuringDrawer) return null;
  if (!activePoster?.qr_url || activePoster.qr_url.trim().length === 0) return null;
  return {
    url: activePoster.qr_url,
    label: activePoster.qr_label ?? 'Scan to Learn More',
    position: activePoster.qr_position ?? 'bottom-left',
  };
}

function buildHeaderState(settings: Settings, now: Date): HeaderState {
  const isClockUnsynced = !isSystemClockSynchronized(now);
  const gregorian = new Intl.DateTimeFormat('en-US', {
    timeZone: settings.timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(now);

  return {
    hijri_date: formatHijriDate(now, settings.hijri_offset_days, { timezone: settings.timezone }),
    gregorian_date: gregorian,
    date_format: settings.date_format ?? 'both',
    clock_time: formatClockTime(now, settings.timezone),
    ticker: settings.ticker_text,
    is_clock_unsynchronized: isClockUnsynced,
  };
}

export function computeDisplaySnapshot(
  settings: PublicDisplaySettings | Settings,
  posters: readonly Poster[],
  prayers: PrayerTimesToday,
  jummahShifts: readonly JummahShift[],
  currentSlideIndex: number = 0,
  lastDrawerTrigger: Date,
  now: Date,
  options?: DisplaySnapshotOptions
): DisplayState {
  const timezone = settings.timezone;
  const activePosters = getActivePosters(posters, now, timezone);
  const activePoster =
    activePosters.length > 0 ? activePosters[currentSlideIndex % activePosters.length] ?? null : null;

  const elapsedMs = now.getTime() - lastDrawerTrigger.getTime();
  const isDrawerOpen =
    options?.forceDrawerOpen ?? (elapsedMs >= 0 && elapsedMs < settings.drawer_display_seconds * 1000);

  const resolvedShifts = resolveJummahShifts(
    jummahShifts,
    now,
    timezone,
    settings.prayer_starting_now_duration_minutes
  );
  const isFri = isFriday(now, timezone);
  const silenceMs = (settings.prayer_starting_now_duration_minutes ?? 10) * 60 * 1000;
  const isFajrFinished =
    now.getTime() >= parseTimeToDate(prayers.fajr.iqamah_time, now, timezone).getTime() + silenceMs;

  const fridayTarget =
    isFri && resolvedShifts.length > 0 && isFajrFinished
      ? resolvedShifts.find((s) => s.status === 'STARTING_NOW' || s.status === 'UPCOMING')
      : undefined;

  const rawNextPrayer = fridayTarget
    ? buildFridayTargetTelemetry(fridayTarget, now, timezone)
    : buildDailyPrayerTelemetry(settings, prayers, isFri && resolvedShifts.length > 0 && isFajrFinished, now);

  const isClockUnsynced = !isSystemClockSynchronized(now);
  const nextPrayerInfo: MiniPillState | null = rawNextPrayer
    ? {
        ...rawNextPrayer,
        status: isClockUnsynced && rawNextPrayer.status === 'STARTING_NOW' ? 'COUNTDOWN' : rawNextPrayer.status,
      }
    : null;

  return {
    active_poster: activePoster,
    is_drawer_open: isDrawerOpen,
    drawer_type: resolveDrawerType(isDrawerOpen, isFri, isFajrFinished, resolvedShifts, silenceMs, now, timezone),
    mini_pill: isDrawerOpen ? null : nextPrayerInfo,
    next_prayer: nextPrayerInfo,
    qr_card: resolveQrCardState(activePoster, isDrawerOpen, settings.show_qr_during_drawer),
    header: buildHeaderState(settings, now),
    resolved_jummah_shifts: resolvedShifts,
  };
}
