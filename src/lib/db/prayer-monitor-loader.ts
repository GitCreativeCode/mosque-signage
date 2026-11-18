/**
 * SQLite State Loader for Autonomous Prayer-Silence Audio Monitor
 * MosqueSignage (TV)
 */

import type { AnnualScheduleRecord, AudioReceiverProtocol, JummahShift, PrayerOverride, PrayerRule } from '@/types/index';
import type { RawSettingsRow } from './settings-mapper';
import { mapSettingsRowToDomain } from './settings-mapper';
import { calculateDailySchedule } from '@/lib/prayer/prayer-schedule';
import { resolveNextPrayer } from '@/lib/prayer/next-prayer';
import { parseTimeToDate } from '@/lib/prayer/prayer-time-parser';
import { isFriday, resolveJummahShifts } from '@/lib/engine/jummah-resolver';
import type { PrayerSilenceSnapshot } from '@/lib/hardware/prayer-silence-monitor';

interface MonitorSqliteDriver {
  prepare: (sql: string) => {
    get: (...params: unknown[]) => unknown;
    all: (...params: unknown[]) => unknown[];
  };
}

function resolveVenueIsoDate(now: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);
  } catch {
    return now.toISOString().split('T')[0] ?? '';
  }
}

/**
 * Reads settings and today's prayer schedule directly via SQLite and evaluates STARTING_NOW status.
 */
export function loadPrayerSilenceState(
  sqlite: MonitorSqliteDriver,
  now: Date
): PrayerSilenceSnapshot | null {
  const rawSettings = sqlite.prepare('SELECT * FROM settings WHERE id = ?').get('global') as RawSettingsRow;
  if (!rawSettings) return null;

  const settings = mapSettingsRowToDomain(rawSettings);
  const todayIsoDate = resolveVenueIsoDate(now, settings.timezone);
  const overrides = sqlite
    .prepare('SELECT * FROM prayer_overrides WHERE date = ?')
    .all(todayIsoDate) as PrayerOverride[];
  const rules = sqlite.prepare('SELECT * FROM prayer_rules').all() as PrayerRule[];
  const annualRow = sqlite
    .prepare('SELECT * FROM annual_schedules WHERE date = ?')
    .get(todayIsoDate) as AnnualScheduleRecord | undefined;

  const daily = calculateDailySchedule(
    { latitude: settings.latitude ?? null, longitude: settings.longitude ?? null },
    now,
    overrides,
    {
      timezone: settings.timezone,
      method: settings.calculation_method,
      madhab: settings.madhab ?? 'shafi',
      rules,
      annualSchedule: annualRow,
      adhanOffsets: {
        fajr: settings.fajr_adhan_offset_minutes ?? 0,
        sunrise: settings.sunrise_adhan_offset_minutes ?? 0,
        dhuhr: settings.dhuhr_adhan_offset_minutes ?? 0,
        asr: settings.asr_adhan_offset_minutes ?? 0,
        maghrib: settings.maghrib_adhan_offset_minutes ?? 0,
        isha: settings.isha_adhan_offset_minutes ?? 0,
      },
    }
  );

  const durationMinutes = settings.prayer_starting_now_duration_minutes ?? 10;
  const resolved = resolveNextPrayer(daily, now, {
    timezone: settings.timezone,
    startingNowDurationMinutes: durationMinutes,
  });

  let isStartingNow = resolved.status === 'STARTING_NOW';
  let prayerName = resolved.prayer_name;

  if (!isStartingNow && isFriday(now, settings.timezone)) {
    const rawShifts = sqlite
      .prepare('SELECT * FROM jummah_shifts WHERE is_active = 1 ORDER BY shift_number ASC')
      .all() as JummahShift[];
    const fajrDoneAt = parseTimeToDate(daily.fajr.iqamah_time, now, settings.timezone).getTime() + durationMinutes * 60_000;
    if (now.getTime() >= fajrDoneAt) {
      const resolvedShifts = resolveJummahShifts(rawShifts, now, settings.timezone, durationMinutes);
      const activeShift = resolvedShifts.find((s) => s.status === 'STARTING_NOW');
      if (activeShift) {
        isStartingNow = true;
        prayerName = `Jummah Shift ${activeShift.shift_number}`;
      }
    }
  }

  return {
    config: {
      audio_mute_during_prayer: Boolean(settings.audio_mute_during_prayer),
      audio_receiver_host: settings.audio_receiver_host ?? '',
      audio_receiver_port: settings.audio_receiver_port ?? 23,
      audio_receiver_protocol: (settings.audio_receiver_protocol as AudioReceiverProtocol) ?? 'denon_telnet',
      audio_mute_delay_seconds: settings.audio_mute_delay_seconds ?? 0,
    },
    isStartingNow,
    prayerName,
    durationMinutes,
  };
}
