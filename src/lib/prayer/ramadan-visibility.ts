import type {
  ActiveEidType,
  NightPrayerType,
  PublicDisplaySettings,
  RamadanVisibilityState,
  Settings,
  TaraweehRakats,
  TaraweehSession,
} from '@/types/index';
import { getHijriDateParts } from './hijri';
import { parseTimeToDate } from './prayer-time-parser';
import { timeToMinutes } from '@/lib/utils/time';

export const VALID_NIGHT_RAKATS: readonly TaraweehRakats[] = ['2', '4', '6', '8', '10', '12', '20'];

export function getNightPrayerTypeLabel(prayerType?: NightPrayerType | null): string {
  switch (prayerType) {
    case 'qiyam':
      return 'Qiyam';
    case 'tahajjud':
      return 'Tahajjud';
    case 'taraweeh':
    default:
      return 'Taraweeh';
  }
}

export function getDefaultNightPrayerDuration(
  prayerType?: NightPrayerType | null,
  rakats?: TaraweehRakats | null
): number {
  if ((prayerType ?? 'taraweeh') === 'taraweeh' && rakats === '20') {
    return 60;
  }
  return 45;
}

/**
 * Normalizes legacy sessions (where `rakats === 'Qiyam'`) into separate `prayer_type`, numeric `rakats`, and duration.
 */
export function normalizeNightPrayerSession(session: TaraweehSession): TaraweehSession {
  const prayer_type: NightPrayerType =
    session.prayer_type ?? (session.rakats === 'Qiyam' ? 'qiyam' : 'taraweeh');
  const rakats: TaraweehRakats =
    session.rakats === 'Qiyam' ? '8' : session.rakats;
  const rawDuration = session.duration_minutes;
  const duration_minutes =
    typeof rawDuration === 'number' && Number.isFinite(rawDuration) && rawDuration > 0
      ? Math.min(180, Math.max(10, Math.round(rawDuration)))
      : getDefaultNightPrayerDuration(prayer_type, rakats);
  return {
    ...session,
    prayer_type,
    rakats,
    duration_minutes,
  };
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getLocalIsoDate(date: Date, timezone: string = 'UTC'): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function validateRamadanDisplayStartDate(
  startDate: string | null | undefined,
  options?: {
    readonly hijriOffsetDays?: number | undefined;
    readonly activeEidType?: ActiveEidType | undefined;
    readonly activeEidDate?: string | null | undefined;
  }
): string | null {
  const clean = startDate?.trim();
  if (!clean) return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return 'Ramadan display start date must use YYYY-MM-DD format.';
  }

  const anchor = new Date(`${clean}T12:00:00Z`);
  if (Number.isNaN(anchor.getTime())) {
    return 'Ramadan display start date is not a valid calendar date.';
  }

  const hijri = getHijriDateParts(anchor, options?.hijriOffsetDays ?? 0, 'UTC');
  // 8 = Sha'ban, 9 = Ramadan
  if (hijri.month !== 8 && hijri.month !== 9) {
    return `Display Start Date (${clean} • ${hijri.day} ${hijri.monthName} ${hijri.year} AH) cannot be outside Sha'ban or Ramadan.`;
  }

  const eidType = options?.activeEidType ?? 'none';
  const eidDate = options?.activeEidDate?.trim();
  if (eidType !== 'none' && eidDate) {
    if (eidType === 'eid_ul_fitr' && clean >= eidDate) {
      return `Display Start Date (${clean}) must be before Eid al-Fitr (${eidDate}). Eid and Ramadan/Taraweeh cannot run together.`;
    }
    if (clean === eidDate) {
      return `Display Start Date cannot fall on an Active Eid Date (${eidDate}).`;
    }
  }

  return null;
}

/**
 * Resolves whether Ramadan fasting markers and Taraweeh / Night Prayers should appear on TV for `now`.
 * - Enforces Hijri window (Sha'ban 8 or Ramadan 9).
 * - Honors optional `ramadan_display_start_date` for pre-announcing Taraweeh in Sha'ban/Ramadan.
 * - Suppresses fasting markers & Taraweeh Silence until actual Ramadan (month 9).
 * - Blocks all Ramadan/Taraweeh displays on any Active Eid Date and on Eid al-Fitr Eve after Maghrib.
 */
export function resolveRamadanVisibility(
  settings: PublicDisplaySettings | Settings,
  now: Date,
  maghribAdhan?: string | null
): RamadanVisibilityState {
  const hijri = getHijriDateParts(now, settings.hijri_offset_days ?? 0, settings.timezone);
  const inSeasonalWindow = hijri.month === 8 || hijri.month === 9;

  if (!settings.ramadan_mode_enabled || !inSeasonalWindow) {
    return {
      showNightPrayers: false,
      showFastingMarkers: false,
      showTaraweehSilence: false,
      hijriMonthNumber: hijri.month,
    };
  }

  const todayIso = getLocalIsoDate(now, settings.timezone);
  const startDate = settings.ramadan_display_start_date?.trim();
  if (startDate && todayIso < startDate) {
    return {
      showNightPrayers: false,
      showFastingMarkers: false,
      showTaraweehSilence: false,
      hijriMonthNumber: hijri.month,
    };
  }

  const activeEidType = settings.active_eid_type ?? 'none';
  const activeEidDate = settings.active_eid_date?.trim();
  if (activeEidType !== 'none' && activeEidDate) {
    if (todayIso === activeEidDate) {
      return {
        showNightPrayers: false,
        showFastingMarkers: false,
        showTaraweehSilence: false,
        hijriMonthNumber: hijri.month,
      };
    }

    if (activeEidType === 'eid_ul_fitr' && addDaysToIsoDate(todayIso, 1) === activeEidDate) {
      let isPostMaghrib = false;
      if (maghribAdhan && maghribAdhan !== '--:--' && /^\d{1,2}:\d{2}$/.test(maghribAdhan)) {
        isPostMaghrib = now.getTime() >= parseTimeToDate(maghribAdhan, now, settings.timezone).getTime();
      } else {
        const hhmm = new Intl.DateTimeFormat('en-GB', {
          timeZone: settings.timezone,
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
        }).format(now);
        isPostMaghrib = timeToMinutes(hhmm) >= 17 * 60;
      }

      if (isPostMaghrib) {
        return {
          showNightPrayers: false,
          showFastingMarkers: false,
          showTaraweehSilence: false,
          hijriMonthNumber: hijri.month,
        };
      }
    }
  }

  const isActualRamadan = hijri.month === 9;
  return {
    showNightPrayers: true,
    showFastingMarkers: isActualRamadan,
    showTaraweehSilence: isActualRamadan,
    hijriMonthNumber: hijri.month,
  };
}
