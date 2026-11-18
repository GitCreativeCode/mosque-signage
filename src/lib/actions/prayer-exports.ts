'use server';

import { like } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { annualSchedulesTable, prayerOverridesTable } from '@/lib/db/schema';
import { getVenueSettings } from '@/lib/actions/settings';
import { buildSingleMonthDay, formatCsvDayRow } from '@/lib/prayer/month-schedule';
import type { MonthPrayerDay, PrayerName, PrayerOverride } from '@/types/index';
import { getJummahShifts, type DbJummahShiftRecord } from './jummah';
import { getPrayerRules } from './prayers';

export interface ExportScheduleOptions {
  readonly year?: number | undefined;
  readonly month?: number | undefined;
  readonly endMonth?: number | undefined;
  readonly startDate?: string | undefined;
  readonly endDate?: string | undefined;
  readonly format?: 'legacy' | 'full' | 'adhan_only' | undefined;
}

export interface PrintableTimetableData {
  readonly mosqueName: string;
  readonly timezone: string;
  readonly hijriOffset: number;
  readonly year: number;
  readonly month: number;
  readonly monthName: string;
  readonly days: readonly MonthPrayerDay[];
  readonly jummahShifts: readonly DbJummahShiftRecord[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CSV_HEADERS: Record<'legacy' | 'full' | 'adhan_only', string> = {
  legacy: 'date,fajr,dhuhr,asr,maghrib,isha',
  adhan_only: 'date,fajr,sunrise,dhuhr,asr,maghrib,isha',
  full: 'date,fajr_adhan,fajr_iqamah,sunrise,dhuhr_adhan,dhuhr_iqamah,asr_adhan,asr_iqamah,maghrib_adhan,maghrib_iqamah,isha_adhan,isha_iqamah',
};

export async function getMonthPrayerSchedule(year: number, month: number): Promise<MonthPrayerDay[]> {
  if (month < 1 || month > 12) throw new Error('Month must be between 1 and 12.');

  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const totalDays = new Date(year, month, 0).getDate();
  const [settings, rules, annualRows, overrideRows] = await Promise.all([
    getVenueSettings(),
    getPrayerRules(),
    db.select().from(annualSchedulesTable).where(like(annualSchedulesTable.date, `${monthPrefix}%`)),
    db.select().from(prayerOverridesTable).where(like(prayerOverridesTable.date, `${monthPrefix}%`)),
  ]);

  const annualMap = new Map(annualRows.map((r) => [r.date, r]));
  const overrides: PrayerOverride[] = overrideRows.map((o) => ({
    id: o.id, date: o.date, prayer: o.prayer as PrayerName,
    adhan_override: o.adhan_override ?? undefined, iqamah_time: o.iqamah_time,
  }));
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: settings.timezone }).format(new Date());

  const days: MonthPrayerDay[] = [];
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${monthPrefix}-${String(d).padStart(2, '0')}`;
    const dayOverrides = overrides.filter((o) => o.date === dateStr);
    days.push(buildSingleMonthDay(year, month, d, todayStr, settings, rules, annualMap.get(dateStr), dayOverrides));
  }
  return days;
}

async function collectRangeCsvRows(
  startDate: string,
  endDate: string,
  format: 'legacy' | 'full' | 'adhan_only'
): Promise<string[]> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];

  const rows: string[] = [];
  let curYear = start.getFullYear();
  let curMonth = start.getMonth() + 1;
  const endYear = end.getFullYear();
  const endMonth = end.getMonth() + 1;

  while (curYear < endYear || (curYear === endYear && curMonth <= endMonth)) {
    const days = await getMonthPrayerSchedule(curYear, curMonth);
    for (const d of days) {
      if (d.date >= startDate && d.date <= endDate) rows.push(formatCsvDayRow(d, format));
    }
    curMonth = curMonth === 12 ? 1 : curMonth + 1;
    if (curMonth === 1) curYear++;
  }
  return rows;
}

export async function exportScheduleCsv(
  yearOrOptions: number | ExportScheduleOptions,
  legacyMonth?: number,
  legacyFormat: 'legacy' | 'full' | 'adhan_only' = 'legacy'
): Promise<string> {
  const opts: ExportScheduleOptions =
    typeof yearOrOptions === 'number'
      ? { year: yearOrOptions, month: legacyMonth, endMonth: legacyMonth, format: legacyFormat }
      : yearOrOptions;
  const format = opts.format ?? 'legacy';
  const rows: string[] = [CSV_HEADERS[format]];

  if (opts.startDate && opts.endDate) {
    rows.push(...(await collectRangeCsvRows(opts.startDate, opts.endDate, format)));
    return rows.join('\n');
  }

  const y = opts.year ?? new Date().getFullYear();
  const startM = opts.month && opts.month >= 1 && opts.month <= 12 ? opts.month : 1;
  const endM = opts.endMonth && opts.endMonth >= startM && opts.endMonth <= 12 ? opts.endMonth : opts.month ?? 12;

  for (let m = startM; m <= endM; m++) {
    const days = await getMonthPrayerSchedule(y, m);
    for (const d of days) rows.push(formatCsvDayRow(d, format));
  }
  return rows.join('\n');
}

export async function getPrintableTimetable(year: number, month: number): Promise<PrintableTimetableData> {
  const [settings, days, jummahShifts] = await Promise.all([
    getVenueSettings(),
    getMonthPrayerSchedule(year, month),
    getJummahShifts(),
  ]);
  return {
    mosqueName: settings.mosque_name || 'Mosque Signage',
    timezone: settings.timezone || 'America/Toronto',
    hijriOffset: settings.hijri_offset_days ?? 0,
    year,
    month,
    monthName: MONTH_NAMES[month - 1] ?? `Month ${month}`,
    days,
    jummahShifts,
  };
}

