/**
 * Next Prayer Countdown & STARTING_NOW Window Resolver
 * MosqueSignage (TV)
 */

import type { PrayerSlot, PrayerTimesToday } from '@/types/index';
import type { NextPrayerResolution } from './prayer-params';
import { parseTimeToDate } from './prayer-time-parser';

export interface NextPrayerOptions {
  readonly timezone?: string | undefined;
  readonly startingNowDurationMinutes?: number | undefined;
  readonly nextDayFajr?: PrayerSlot | undefined;
}

function evaluateSlotWindow(
  name: string,
  slot: PrayerSlot,
  now: Date,
  timezone: string,
  durationMs: number
): NextPrayerResolution | null {
  if (!slot.iqamah_time || slot.iqamah_time === '--:--') {
    return null;
  }
  const nowMs = now.getTime();
  const iqamahDate = parseTimeToDate(slot.iqamah_time, now, timezone);
  const iqamahMs = iqamahDate.getTime();

  if (nowMs >= iqamahMs && nowMs < iqamahMs + durationMs) {
    return {
      prayer_name: name,
      time_display: slot.iqamah_time,
      minutes_remaining: 0,
      status: 'STARTING_NOW',
      target_date: iqamahDate,
    };
  }

  if (nowMs < iqamahMs) {
    return {
      prayer_name: name,
      time_display: slot.iqamah_time,
      minutes_remaining: Math.max(0, Math.ceil((iqamahMs - nowMs) / 60000)),
      status: 'COUNTDOWN',
      target_date: iqamahDate,
    };
  }

  return null;
}

/**
 * Pure function: Resolves the next liturgical prayer event, countdown minutes, and STARTING_NOW status.
 */
export function resolveNextPrayer(
  schedule: PrayerTimesToday,
  now: Date,
  options?: NextPrayerOptions
): NextPrayerResolution {
  const timezone = options?.timezone ?? 'America/Toronto';
  const durationMs = (options?.startingNowDurationMinutes ?? 10) * 60 * 1000;
  const order: readonly { name: string; slot: PrayerSlot }[] = [
    { name: 'Fajr', slot: schedule.fajr },
    { name: 'Dhuhr', slot: schedule.dhuhr },
    { name: 'Asr', slot: schedule.asr },
    { name: 'Maghrib', slot: schedule.maghrib },
    { name: 'Isha', slot: schedule.isha },
  ];

  for (const item of order) {
    const resolved = evaluateSlotWindow(item.name, item.slot, now, timezone, durationMs);
    if (resolved) return resolved;
  }

  const tomorrow = new Date(parseTimeToDate('12:00', now, timezone).getTime() + 86_400_000);
  const nextFajrSlot = options?.nextDayFajr ?? schedule.fajr;
  if (!nextFajrSlot.iqamah_time || nextFajrSlot.iqamah_time === '--:--') {
    return {
      prayer_name: 'Fajr',
      time_display: '--:--',
      minutes_remaining: 0,
      status: 'COUNTDOWN',
      target_date: now,
    };
  }
  const tomorrowFajrDate = parseTimeToDate(nextFajrSlot.iqamah_time, tomorrow, timezone);

  return {
    prayer_name: 'Fajr',
    time_display: nextFajrSlot.iqamah_time,
    minutes_remaining: Math.max(0, Math.ceil((tomorrowFajrDate.getTime() - now.getTime()) / 60000)),
    status: 'COUNTDOWN',
    target_date: tomorrowFajrDate,
  };
}

