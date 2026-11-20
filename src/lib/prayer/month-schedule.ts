/**
 * Pure Monthly Timetable Builder & CSV Row Formatter
 * MosqueSignage (TV)
 */

import type {
  AdhanSource,
  AnnualScheduleRecord,
  IqamahSource,
  MonthPrayerDay,
  MonthPrayerDaySlot,
  PrayerName,
  PrayerOverride,
  PrayerRule,
  Settings,
} from '@/types/index';
import { calculateDailySchedule } from './prayer-engine';
import { zonedWallClockToDate } from './prayer-time-parser';

function getIqamahSource(
  p: PrayerName,
  dayOverrides: readonly PrayerOverride[],
  dayAnnual: AnnualScheduleRecord | undefined,
  rules: readonly PrayerRule[]
): IqamahSource {
  if (dayOverrides.some((o) => o.prayer.toLowerCase() === p && Boolean(o.iqamah_time))) return 'manual';
  if (dayAnnual) {
    const key = `${p}_iqamah` as keyof AnnualScheduleRecord;
    if (dayAnnual[key]) return 'csv';
  }
  if (rules.some((r) => r.prayer.toLowerCase() === p)) return 'rule';
  return 'default';
}

function getAdhanSource(
  p: PrayerName,
  dayOverrides: readonly PrayerOverride[],
  dayAnnual: AnnualScheduleRecord | undefined,
  settings: Settings
): AdhanSource {
  if (dayOverrides.some((o) => o.prayer.toLowerCase() === p && Boolean(o.adhan_override))) return 'manual';
  if (dayAnnual) {
    const key = (p === 'sunrise' ? 'sunrise' : `${p}_adhan`) as keyof AnnualScheduleRecord;
    if (dayAnnual[key]) return 'csv';
  }
  const offsetKey = `${p}_adhan_offset_minutes` as keyof Settings;
  const offsetVal = settings[offsetKey];
  return typeof offsetVal === 'number' && offsetVal !== 0 ? 'offset' : 'astronomical';
}

function buildDaySlot(
  p: Exclude<PrayerName, 'sunrise'>,
  adhan: string,
  iqamah: string,
  dayOverrides: readonly PrayerOverride[],
  dayAnnual: AnnualScheduleRecord | undefined,
  rules: readonly PrayerRule[],
  settings: Settings
): MonthPrayerDaySlot {
  return {
    adhan,
    iqamah,
    source: getIqamahSource(p, dayOverrides, dayAnnual, rules),
    adhanSource: getAdhanSource(p, dayOverrides, dayAnnual, settings),
  };
}

export function buildSingleMonthDay(
  year: number,
  month: number,
  day: number,
  todayStr: string,
  settings: Settings,
  rules: readonly PrayerRule[],
  dayAnnual: AnnualScheduleRecord | undefined,
  dayOverrides: readonly PrayerOverride[]
): MonthPrayerDay {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dayDate = zonedWallClockToDate(year, month, day, 12, 0, settings.timezone);
  const dayName = new Intl.DateTimeFormat('en-US', {
    timeZone: settings.timezone,
    weekday: 'short',
  }).format(dayDate);
  const calc = calculateDailySchedule(
    { latitude: settings.latitude ?? null, longitude: settings.longitude ?? null },
    dayDate,
    dayOverrides,
    {
      timezone: settings.timezone,
      method: settings.calculation_method,
      madhab: settings.madhab ?? 'shafi',
      rules,
      annualSchedule: dayAnnual,
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

  return {
    date: dateStr,
    dayNumber: day,
    dayName,
    isToday: dateStr === todayStr,
    isFriday: dayName.toLowerCase().startsWith('fri'),
    fajr: buildDaySlot('fajr', calc.fajr.adhan_time, calc.fajr.iqamah_time, dayOverrides, dayAnnual, rules, settings),
    sunrise: { adhan: calc.sunrise.adhan_time, adhanSource: getAdhanSource('sunrise', dayOverrides, dayAnnual, settings) },
    dhuhr: buildDaySlot('dhuhr', calc.dhuhr.adhan_time, calc.dhuhr.iqamah_time, dayOverrides, dayAnnual, rules, settings),
    asr: buildDaySlot('asr', calc.asr.adhan_time, calc.asr.iqamah_time, dayOverrides, dayAnnual, rules, settings),
    maghrib: buildDaySlot('maghrib', calc.maghrib.adhan_time, calc.maghrib.iqamah_time, dayOverrides, dayAnnual, rules, settings),
    isha: buildDaySlot('isha', calc.isha.adhan_time, calc.isha.iqamah_time, dayOverrides, dayAnnual, rules, settings),
  };
}

/**
 * Sanitizes a CSV cell to prevent CSV Formula Injection (DDE).
 * Prepends a single quote if the string begins with =, +, -, @, tab, or carriage return.
 */
export function sanitizeCsvCell(value: string | null | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (/^[=+@\-\t\r]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

export function formatCsvDayRow(d: MonthPrayerDay, format: 'legacy' | 'full' | 'adhan_only'): string {
  const c = sanitizeCsvCell;
  if (format === 'full') {
    return `${c(d.date)},${c(d.fajr.adhan)},${c(d.fajr.iqamah)},${c(d.sunrise.adhan)},${c(d.dhuhr.adhan)},${c(d.dhuhr.iqamah)},${c(d.asr.adhan)},${c(d.asr.iqamah)},${c(d.maghrib.adhan)},${c(d.maghrib.iqamah)},${c(d.isha.adhan)},${c(d.isha.iqamah)}`;
  }
  if (format === 'adhan_only') {
    return `${c(d.date)},${c(d.fajr.adhan)},${c(d.sunrise.adhan)},${c(d.dhuhr.adhan)},${c(d.asr.adhan)},${c(d.maghrib.adhan)},${c(d.isha.adhan)}`;
  }
  return `${c(d.date)},${c(d.fajr.iqamah)},${c(d.dhuhr.iqamah)},${c(d.asr.iqamah)},${c(d.maghrib.iqamah)},${c(d.isha.iqamah)}`;
}

export function computeOffsetIqamahTime(
  prayer: PrayerName,
  dayDate: Date,
  settings: Settings,
  offsetMinutes: number
): string {
  const calculated = calculateDailySchedule(
    { latitude: settings.latitude ?? null, longitude: settings.longitude ?? null },
    dayDate,
    [],
    { timezone: settings.timezone, method: settings.calculation_method, madhab: settings.madhab ?? 'shafi' }
  );
  const slot = calculated[prayer.toLowerCase() as keyof typeof calculated];
  if (!slot?.adhan_time || slot.adhan_time === '--:--') {
    return '--:--';
  }
  const [adhH, adhM] = slot.adhan_time.split(':').map(Number);
  const totalMins = ((adhH ?? 0) * 60 + (adhM ?? 0) + offsetMinutes + 1440) % 1440;
  return `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;
}

