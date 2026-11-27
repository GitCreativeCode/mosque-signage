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
  readonly is_clamped?: boolean | undefined;
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

export type JummahShiftStatus = 'UPCOMING' | 'KHUTBAH_IN_PROGRESS' | 'STARTING_NOW' | 'COMPLETED';

export interface JummahShift {
  readonly id?: string | undefined;
  readonly shift_number: number;
  readonly khateeb_name?: string | null | undefined;
  readonly adhan_time: string;
  readonly iqamah_time?: string | null | undefined;
  readonly status: JummahShiftStatus;
  readonly minutes_remaining?: number | undefined;
  readonly location?: string | null | undefined;
  readonly language?: string | null | undefined;
  readonly topic?: string | null | undefined;
}

export interface FridayKhateebRosterRecord {
  readonly id: string;
  readonly date: string; // YYYY-MM-DD
  readonly shift_id: string;
  readonly khateeb_name: string;
  readonly topic?: string | null | undefined;
  readonly created_at?: string | undefined;
}

export type EidType = 'eid_ul_fitr' | 'eid_ul_adha';
export type ActiveEidType = 'none' | EidType;

export type TaraweehTimeMode = 'OFFSET' | 'FIXED';
export type NightPrayerType = 'taraweeh' | 'qiyam' | 'tahajjud';
export type TaraweehRakats = '2' | '4' | '6' | '8' | '10' | '12' | '20' | 'Qiyam';
export type TaraweehWitrMode = 'none' | '2+1' | 'continuous_3' | '1';

export interface TaraweehSession {
  readonly session_number: number;
  readonly prayer_type?: NightPrayerType | undefined;
  readonly label?: string | undefined;
  readonly time_mode: TaraweehTimeMode;
  readonly offset_minutes: number;
  readonly fixed_time: string;
  readonly rakats: TaraweehRakats;
  readonly witr_mode: TaraweehWitrMode;
  readonly duration_minutes?: number | undefined;
}

export interface EidShift {
  readonly id: string;
  readonly eid_type: EidType;
  readonly shift_number: number;
  readonly takbeerat_time: string;
  readonly salah_time: string;
  readonly khateeb_name?: string | null | undefined;
  readonly location?: string | null | undefined;
  readonly is_active: boolean;
  readonly created_at?: string | undefined;
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
  readonly isClamped?: boolean | undefined;
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

