/**
 * Liturgical Prayer, Timetable, Rule & Jummah Shift Types
 * MosqueSignage (TV)
 */

export type PrayerRuleType = 'OFFSET' | 'FIXED';

export interface PrayerRule {
  readonly id?: string | undefined;
  readonly prayer: PrayerName;
  readonly rule_type: PrayerRuleType;
  readonly offset_minutes?: number | null | undefined;
  readonly fixed_time?: string | null | undefined;
  readonly updated_at?: string | undefined;
}

export interface AnnualScheduleRecord {
  readonly id: string;
  readonly date: string;
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
  readonly updated_at?: string | undefined;
}

export interface PrayerSlot {
  readonly adhan_time: string;
  readonly iqamah_time: string;
}

export interface PrayerTimesToday {
  readonly fajr: PrayerSlot;
  readonly sunrise: PrayerSlot;
  readonly dhuhr: PrayerSlot;
  readonly asr: PrayerSlot;
  readonly maghrib: PrayerSlot;
  readonly isha: PrayerSlot;
}

export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type JummahShiftStatus = 'UPCOMING' | 'STARTING_NOW' | 'COMPLETED';

export interface JummahShift {
  readonly shift_number: number;
  readonly khateeb_name?: string | null | undefined;
  readonly adhan_time: string;
  readonly iqamah_time?: string | null | undefined;
  readonly status: JummahShiftStatus;
  readonly minutes_remaining?: number | undefined;
}

export interface PrayerOverride {
  readonly id: string;
  readonly date: string;
  readonly prayer: PrayerName;
  readonly adhan_override?: string | undefined;
  readonly iqamah_time: string;
}

export type IqamahSource = 'manual' | 'csv' | 'rule' | 'default';
export type AdhanSource = 'manual' | 'csv' | 'offset' | 'astronomical';

export interface MonthPrayerDaySlot {
  readonly adhan: string;
  readonly iqamah: string;
  readonly source: IqamahSource;
  readonly adhanSource?: AdhanSource | undefined;
}

export interface MonthPrayerDay {
  readonly date: string;
  readonly dayNumber: number;
  readonly dayName: string;
  readonly isToday: boolean;
  readonly isFriday: boolean;
  readonly fajr: MonthPrayerDaySlot;
  readonly sunrise: { readonly adhan: string; readonly adhanSource?: AdhanSource | undefined };
  readonly dhuhr: MonthPrayerDaySlot;
  readonly asr: MonthPrayerDaySlot;
  readonly maghrib: MonthPrayerDaySlot;
  readonly isha: MonthPrayerDaySlot;
}

