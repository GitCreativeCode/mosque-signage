/**
 * Liturgical Calculation Interfaces & Astronomical Parameter Mapping
 * MosqueSignage (TV)
 */

import { CalculationMethod, type CalculationParameters, HighLatitudeRule } from 'adhan';
import type { PrayerOverride, PrayerRule } from '@/types/index';

export interface AnnualScheduleDay {
  readonly fajr_adhan?: string | null | undefined;
  readonly sunrise?: string | null | undefined;
  readonly dhuhr_adhan?: string | null | undefined;
  readonly asr_adhan?: string | null | undefined;
  readonly maghrib_adhan?: string | null | undefined;
  readonly isha_adhan?: string | null | undefined;
  readonly fajr_iqamah?: string | null | undefined;
  readonly dhuhr_iqamah?: string | null | undefined;
  readonly asr_iqamah?: string | null | undefined;
  readonly maghrib_iqamah?: string | null | undefined;
  readonly isha_iqamah?: string | null | undefined;
}

export interface CoordinatesInput {
  readonly latitude?: number | null | undefined;
  readonly longitude?: number | null | undefined;
}

export interface AdhanOffsetsInput {
  readonly fajr?: number | undefined;
  readonly sunrise?: number | undefined;
  readonly dhuhr?: number | undefined;
  readonly asr?: number | undefined;
  readonly maghrib?: number | undefined;
  readonly isha?: number | undefined;
}

export interface PrayerEngineOptions {
  readonly timezone?: string | undefined;
  readonly method?: string | undefined;
  readonly madhab?: 'shafi' | 'hanafi' | undefined;
  readonly highLatitudeRule?: string | undefined;
  readonly rules?: readonly PrayerRule[] | undefined;
  readonly annualSchedule?: AnnualScheduleDay | undefined;
  readonly adhanOffsets?: AdhanOffsetsInput | undefined;
  readonly overrides?: readonly PrayerOverride[] | undefined;
}

export interface NextPrayerResolution {
  readonly prayer_name: string;
  readonly time_display: string;
  readonly minutes_remaining: number;
  readonly status: 'COUNTDOWN' | 'STARTING_NOW';
  readonly target_date: Date;
}

/**
 * Formats a given Date to 'HH:mm' 24-hour time in the specified IANA timezone.
 */
export function formatHHMM(date: Date, timezone: string = 'America/Toronto'): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * Resolves CalculationParameters based on method name and high-latitude rule.
 */
export function getCalculationParameters(
  methodName: string = 'NorthAmerica',
  highLatitudeRule?: string
): CalculationParameters {
  let params: CalculationParameters;
  switch (methodName.toLowerCase()) {
    case 'muslimworldleague':
    case 'mwl':
      params = CalculationMethod.MuslimWorldLeague();
      break;
    case 'egyptian':
      params = CalculationMethod.Egyptian();
      break;
    case 'karachi':
      params = CalculationMethod.Karachi();
      break;
    case 'ummalqura':
      params = CalculationMethod.UmmAlQura();
      break;
    case 'dubai':
      params = CalculationMethod.Dubai();
      break;
    case 'moonsightingcommittee':
      params = CalculationMethod.MoonsightingCommittee();
      break;
    case 'northamerica':
    case 'isna':
    default:
      params = CalculationMethod.NorthAmerica();
      break;
  }

  if (highLatitudeRule) {
    switch (highLatitudeRule.toLowerCase()) {
      case 'middle_of_night':
      case 'middleofthenight':
        params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
        break;
      case 'twilight_angle':
      case 'twilightangle':
        params.highLatitudeRule = HighLatitudeRule.TwilightAngle;
        break;
      case 'none':
        break;
      case 'seventh_of_night':
      case 'seventhofthenight':
      default:
        params.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
        break;
    }
  } else {
    params.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
  }

  return params;
}

