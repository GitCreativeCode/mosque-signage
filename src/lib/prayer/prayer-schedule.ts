/**
 * 4-Tier Daily Prayer Schedule Calculator
 * MosqueSignage (TV)
 */

import { Coordinates, Madhab, PrayerTimes } from 'adhan';
import type {
  PrayerName,
  PrayerOverride,
  PrayerRule,
  PrayerSlot,
  PrayerTimesToday,
} from '@/types/index';
import { timeToMinutes } from '@/lib/utils/time';
import {
  formatHHMM,
  getCalculationParameters,
  type AnnualScheduleDay,
  type CoordinatesInput,
  type PrayerEngineOptions,
} from './prayer-params';
import { parseTimeToDate } from './prayer-time-parser';

function anchorLocalNoon(date: Date, timezone: string): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);

  const y = parseInt(parts.find((p) => p.type === 'year')?.value ?? '2026', 10);
  const m = parseInt(parts.find((p) => p.type === 'month')?.value ?? '1', 10) - 1;
  const d = parseInt(parts.find((p) => p.type === 'day')?.value ?? '1', 10);
  return new Date(y, m, d, 12, 0, 0);
}

function resolveEffectiveAdhan(
  prayer: PrayerName,
  rawDate: Date | null,
  baseDate: Date,
  timezone: string,
  options?: PrayerEngineOptions,
  override?: PrayerOverride
): { adhanTimeStr: string; effectiveAdhanDate: Date | null } {
  let adhanTimeStr = '--:--';
  let effectiveAdhanDate: Date | null = null;

  if (rawDate) {
    const globalOffset = options?.adhanOffsets?.[prayer] ?? 0;
    effectiveAdhanDate = new Date(rawDate.getTime() + globalOffset * 60 * 1000);
    adhanTimeStr = formatHHMM(effectiveAdhanDate, timezone);
  }

  if (options?.annualSchedule) {
    const key = (prayer === 'sunrise' ? 'sunrise' : `${prayer.toLowerCase()}_adhan`) as keyof AnnualScheduleDay;
    const annualAdhan = options.annualSchedule[key];
    if (annualAdhan && annualAdhan.trim().length > 0) {
      adhanTimeStr = annualAdhan.trim();
      effectiveAdhanDate = parseTimeToDate(adhanTimeStr, baseDate, timezone);
    }
  }

  if (override?.adhan_override && override.adhan_override.trim().length > 0) {
    adhanTimeStr = override.adhan_override.trim();
    effectiveAdhanDate = parseTimeToDate(adhanTimeStr, baseDate, timezone);
  }

  return { adhanTimeStr, effectiveAdhanDate };
}

function resolveRuleIqamah(
  prayer: PrayerName,
  effectiveAdhanDate: Date | null,
  timezone: string,
  rules?: readonly PrayerRule[]
): string | null {
  if (!rules) return null;
  const rule = rules.find((r) => r.prayer.toLowerCase() === prayer.toLowerCase());
  if (!rule) return null;

  if (rule.rule_type === 'FIXED' && rule.fixed_time && rule.fixed_time.trim().length > 0) {
    return rule.fixed_time.trim();
  }
  if (effectiveAdhanDate && rule.rule_type === 'OFFSET' && typeof rule.offset_minutes === 'number') {
    return formatHHMM(new Date(effectiveAdhanDate.getTime() + rule.offset_minutes * 60 * 1000), timezone);
  }
  return null;
}

function resolvePrayerSlot(
  prayer: PrayerName,
  rawDate: Date | null,
  defaultOffsetMin: number,
  baseDate: Date,
  timezone: string,
  targetIsoDate: string,
  overrides: readonly PrayerOverride[],
  options?: PrayerEngineOptions
): PrayerSlot {
  const override = overrides.find(
    (o) => (!o.date || o.date === targetIsoDate) && o.prayer.toLowerCase() === prayer.toLowerCase()
  );
  const { adhanTimeStr, effectiveAdhanDate } = resolveEffectiveAdhan(
    prayer, rawDate, baseDate, timezone, options, override
  );

  let rawIqamah = '--:--';
  let isRuleDerived = false;

  if (override?.iqamah_time && override.iqamah_time.trim().length > 0) {
    rawIqamah = override.iqamah_time.trim();
  } else {
    const annualKey = `${prayer.toLowerCase()}_iqamah` as keyof AnnualScheduleDay;
    const annualIqamah = options?.annualSchedule?.[annualKey];
    if (annualIqamah && annualIqamah.trim().length > 0) {
      rawIqamah = annualIqamah.trim();
    } else {
      const ruleIqamah = resolveRuleIqamah(prayer, effectiveAdhanDate, timezone, options?.rules);
      if (ruleIqamah) {
        rawIqamah = ruleIqamah;
        isRuleDerived = true;
      } else if (effectiveAdhanDate) {
        const fallbackDate = new Date(effectiveAdhanDate.getTime() + defaultOffsetMin * 60 * 1000);
        rawIqamah = formatHHMM(fallbackDate, timezone);
      }
    }
  }

  // Smart Clamping: If solar Adhan shifts later than fixed Iqamah rule, clamp Iqamah to Adhan + 5 min
  let isClamped = false;
  if (
    isRuleDerived &&
    prayer !== 'sunrise' &&
    effectiveAdhanDate &&
    rawIqamah !== '--:--' &&
    adhanTimeStr !== '--:--'
  ) {
    const adhanMins = timeToMinutes(adhanTimeStr);
    const iqamahMins = timeToMinutes(rawIqamah);
    if (iqamahMins < adhanMins + 5) {
      const clampedDate = new Date(effectiveAdhanDate.getTime() + 5 * 60 * 1000);
      rawIqamah = formatHHMM(clampedDate, timezone);
      isClamped = true;
    }
  }

  return { adhan_time: adhanTimeStr, iqamah_time: rawIqamah, is_clamped: isClamped };
}

/**
 * Pure function: Calculates daily prayer times schedule given coordinates, date, and overrides.
 */
export function calculateDailySchedule(
  coords: CoordinatesInput,
  date: Date,
  overrides: readonly PrayerOverride[] = [],
  options?: PrayerEngineOptions
): PrayerTimesToday {
  const timezone = options?.timezone ?? 'America/Toronto';
  const targetIsoDate = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(date);
  const parameters = getCalculationParameters(options?.method ?? 'NorthAmerica', options?.highLatitudeRule);
  parameters.madhab = options?.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;

  const hasCoords =
    typeof coords?.latitude === 'number' &&
    typeof coords?.longitude === 'number' &&
    Number.isFinite(coords.latitude) &&
    Number.isFinite(coords.longitude);

  const times = hasCoords
    ? new PrayerTimes(new Coordinates(coords.latitude!, coords.longitude!), anchorLocalNoon(date, timezone), parameters)
    : null;

  return {
    fajr: resolvePrayerSlot('fajr', times?.fajr ?? null, 25, date, timezone, targetIsoDate, overrides, options),
    sunrise: resolvePrayerSlot('sunrise', times?.sunrise ?? null, 0, date, timezone, targetIsoDate, overrides, options),
    dhuhr: resolvePrayerSlot('dhuhr', times?.dhuhr ?? null, 20, date, timezone, targetIsoDate, overrides, options),
    asr: resolvePrayerSlot('asr', times?.asr ?? null, 15, date, timezone, targetIsoDate, overrides, options),
    maghrib: resolvePrayerSlot('maghrib', times?.maghrib ?? null, 10, date, timezone, targetIsoDate, overrides, options),
    isha: resolvePrayerSlot('isha', times?.isha ?? null, 15, date, timezone, targetIsoDate, overrides, options),
  };
}

