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

  return shifts.map((shift) => {
    const effectiveTime =
      shift.iqamah_time && shift.iqamah_time.trim().length > 0
        ? shift.iqamah_time
        : shift.adhan_time;
    const iqamahMs = parseTimeToDate(effectiveTime, now, timezone).getTime();
    const status =
      nowMs < iqamahMs
        ? 'UPCOMING'
        : nowMs < iqamahMs + durationMs
          ? 'STARTING_NOW'
          : 'COMPLETED';

    return {
      ...shift,
      status,
      minutes_remaining: Math.max(0, Math.ceil((iqamahMs - nowMs) / 60000)),
    };
  });
}

export function formatClockTime(date: Date, timezone: string = 'America/Toronto'): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

export function isFriday(date: Date, timezone: string = 'America/Toronto'): boolean {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).format(date);
  return weekday.toLowerCase().startsWith('fri');
}

