/**
 * Pure Jummah Shift Resolution, Drawer Trigger & Clock Formatters
 * MosqueSignage (TV)
 */

import type { JummahShift } from '@/types/index';
import { parseTimeToDate } from '@/lib/prayer/prayer-engine';

export function shouldTriggerDrawer(
  lastDrawerOpenTime: Date,
  now: Date,
  intervalMinutes: number = 3
): boolean {
  const elapsedMs = now.getTime() - lastDrawerOpenTime.getTime();
  // Handle clock adjustments (DST Fall Back negative deltas or day jumps)
  if (elapsedMs < 0 || elapsedMs > 86_400_000) {
    return true;
  }
  return elapsedMs >= intervalMinutes * 60 * 1000;
}

export function resolveJummahShifts(
  shifts: readonly JummahShift[],
  now: Date,
  timezone: string = 'America/Toronto',
  startingNowDurationMinutes: number = 10
): JummahShift[] {
  const nowMs = now.getTime();
  const durationMs = startingNowDurationMinutes * 60 * 1000;
  // When no separate Salah time is configured, hold sermon silence at least 25 min unless global window is longer
  const khutbahOnlyDurationMs = Math.max(startingNowDurationMinutes, 25) * 60 * 1000;

  return shifts.map((shift) => {
    const hasSeparateSalahTime = Boolean(shift.iqamah_time && shift.iqamah_time.trim().length > 0);
    const adhanMs = parseTimeToDate(shift.adhan_time, now, timezone).getTime();
    const iqamahMs = hasSeparateSalahTime
      ? parseTimeToDate(shift.iqamah_time!.trim(), now, timezone).getTime()
      : adhanMs;

    let status: JummahShift['status'] = 'UPCOMING';

    if (hasSeparateSalahTime) {
      if (nowMs < adhanMs) {
        status = 'UPCOMING';
      } else if (nowMs < iqamahMs) {
        status = 'KHUTBAH_IN_PROGRESS';
      } else if (nowMs < iqamahMs + durationMs) {
        status = 'STARTING_NOW';
      } else {
        status = 'COMPLETED';
      }
    } else {
      if (nowMs < adhanMs) {
        status = 'UPCOMING';
      } else if (nowMs < adhanMs + khutbahOnlyDurationMs) {
        status = 'STARTING_NOW';
      } else {
        status = 'COMPLETED';
      }
    }

    const minutesRemaining =
      status === 'STARTING_NOW' || status === 'COMPLETED'
        ? 0
        : Math.max(0, Math.ceil((iqamahMs - nowMs) / 60000));

    return {
      ...shift,
      status,
      minutes_remaining: minutesRemaining,
    };
  });
}

export function formatClockTime(
  date: Date,
  timezone: string = 'America/Toronto',
  options?: { readonly showSeconds?: boolean | undefined; readonly timeFormat?: '12h' | '24h' | undefined }
): string {
  const is24h = options?.timeFormat === '24h';
  const showSec = options?.showSeconds ?? false;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: is24h ? '2-digit' : 'numeric',
    minute: '2-digit',
    second: showSec ? '2-digit' : undefined,
    hour12: !is24h,
  }).format(date);
}

export function isFriday(date: Date, timezone: string = 'America/Toronto'): boolean {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).format(date);
  return weekday.toLowerCase().startsWith('fri');
}

