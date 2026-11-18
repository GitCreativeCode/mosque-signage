import type { PowerScheduleConfig } from '@/types/index';

/**
 * Parses an 'HH:mm' 24-hour time string into total minutes since midnight (0-1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(':');
  const h = parts[0] ? Number.parseInt(parts[0], 10) : 0;
  const m = parts[1] ? Number.parseInt(parts[1], 10) : 0;
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return 0;
  }
  return Math.min(1439, Math.max(0, h * 60 + m));
}

/**
 * Formats total minutes since midnight into 'HH:mm' 24-hour time string.
 */
export function formatMinutesToTime(totalMinutes: number): string {
  const normalized = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Extracts the current minutes since midnight (0-1439) for a given Date in a specific timezone.
 */
export function getMinutesSinceMidnightInTimezone(now: Date, timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(now);
    const hourPart = parts.find((p) => p.type === 'hour')?.value ?? '0';
    const minutePart = parts.find((p) => p.type === 'minute')?.value ?? '0';
    const h = Number.parseInt(hourPart, 10);
    const m = Number.parseInt(minutePart, 10);
    return Math.min(1439, Math.max(0, (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m)));
  } catch {
    return now.getHours() * 60 + now.getMinutes();
  }
}

export interface EffectivePowerSchedule {
  readonly onTime: string;
  readonly offTime: string;
  readonly onMinutes: number;
  readonly offMinutes: number;
  readonly isPrayerRelative: boolean;
}

/**
 * Resolves effective Power-On and Power-Off times based on schedule mode.
 * - In 'fixed' mode: uses power_on_time and power_off_time directly.
 * - In 'prayer_relative' mode: shifts Fajr Adhan earlier by power_fajr_offset_minutes (default 45m before)
 *   and Isha Iqamah later by power_isha_offset_minutes (default 45m after).
 *   Supports both positive (45) and legacy negative (-45) values gracefully.
 * Falls back gracefully to fixed times if prayer times are omitted.
 */
export function resolveEffectivePowerSchedule(
  config: PowerScheduleConfig,
  prayerTimes?: { readonly fajrAdhan?: string | undefined; readonly ishaIqamah?: string | undefined } | undefined
): EffectivePowerSchedule {
  if (config.power_schedule_mode === 'prayer_relative' && prayerTimes?.fajrAdhan && prayerTimes?.ishaIqamah) {
    const fajrBaseMinutes = parseTimeToMinutes(prayerTimes.fajrAdhan);
    const ishaBaseMinutes = parseTimeToMinutes(prayerTimes.ishaIqamah);

    // Fajr wake offset is minutes BEFORE Fajr (subtract).
    // Math.abs handles both intuitive positive (45) and legacy negative (-45).
    const rawFajrOffset = config.power_fajr_offset_minutes ?? 45;
    const fajrSubtractMinutes = Math.abs(rawFajrOffset);

    // Isha sleep offset is minutes AFTER Isha (add).
    const rawIshaOffset = config.power_isha_offset_minutes ?? 45;
    const ishaAddMinutes = Math.abs(rawIshaOffset);

    const onMinutes = ((fajrBaseMinutes - fajrSubtractMinutes) % 1440 + 1440) % 1440;
    const offMinutes = ((ishaBaseMinutes + ishaAddMinutes) % 1440 + 1440) % 1440;

    return {
      onTime: formatMinutesToTime(onMinutes),
      offTime: formatMinutesToTime(offMinutes),
      onMinutes,
      offMinutes,
      isPrayerRelative: true,
    };
  }

  const onMinutes = parseTimeToMinutes(config.power_on_time || '05:00');
  const offMinutes = parseTimeToMinutes(config.power_off_time || '23:00');

  return {
    onTime: formatMinutesToTime(onMinutes),
    offTime: formatMinutesToTime(offMinutes),
    onMinutes,
    offMinutes,
    isPrayerRelative: false,
  };
}

/**
 * Pure function: Evaluates whether the kiosk display should be powered ON (true)
 * or in low-power STANDBY (false) at injected `now: Date` in the target `timezone`.
 *
 * Handles both:
 * 1. Standard daytime windows (e.g., 05:00 ON -> 23:00 OFF)
 * 2. Cross-midnight windows (e.g., 20:00 ON -> 03:00 OFF)
 * 3. Equal-time edge cases (onMinutes === offMinutes defaults to ON 24/7)
 */
export function isScreenInPowerWindow(
  config: PowerScheduleConfig,
  now: Date,
  timezone: string,
  prayerTimes?: { readonly fajrAdhan?: string | undefined; readonly ishaIqamah?: string | undefined } | undefined
): boolean {
  if (!config.tv_auto_power) {
    // When auto power schedule is disabled, screen remains ON continuously
    return true;
  }

  const schedule = resolveEffectivePowerSchedule(config, prayerTimes);
  const nowMinutes = getMinutesSinceMidnightInTimezone(now, timezone);

  // If onMinutes === offMinutes, treat as continuous 24/7 power
  if (schedule.onMinutes === schedule.offMinutes) {
    return true;
  }

  if (schedule.onMinutes < schedule.offMinutes) {
    // Normal daytime window (e.g. 05:00 to 23:00)
    // Screen is ON if current time is within [onMinutes, offMinutes)
    return nowMinutes >= schedule.onMinutes && nowMinutes < schedule.offMinutes;
  }

  // Cross-midnight window (e.g. 22:00 to 06:00)
  // Screen is ON if >= onMinutes (night) OR < offMinutes (morning)
  return nowMinutes >= schedule.onMinutes || nowMinutes < schedule.offMinutes;
}
