'use server';

import crypto from 'node:crypto';
import { eq, like } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { annualSchedulesTable, prayerOverridesTable } from '@/lib/db/schema';
import { runSerializedTransaction } from '@/lib/db/tx';
import { eventBus } from '@/lib/events/event-bus';
import { getVenueSettings } from '@/lib/actions/settings';
import {
  detectCsvDialect,
  normalizeTimeTo24h,
  parseCsvLineToSchedulePayload,
  type CsvImportFormat,
  type CsvImportResult,
} from '@/lib/prayer/csv-parser';
import { computeOffsetIqamahTime } from '@/lib/prayer/month-schedule';
import type { PrayerName } from '@/types/index';
import { requireAdminAuth } from './auth';

export interface SaveDayIqamahTimings {
  readonly fajr?: string | undefined;
  readonly dhuhr?: string | undefined;
  readonly asr?: string | undefined;
  readonly maghrib?: string | undefined;
  readonly isha?: string | undefined;
  readonly fajr_adhan?: string | undefined;
  readonly sunrise?: string | undefined;
  readonly dhuhr_adhan?: string | undefined;
  readonly asr_adhan?: string | undefined;
  readonly maghrib_adhan?: string | undefined;
  readonly isha_adhan?: string | undefined;
}

export interface BulkSetIqamahRangeInput {
  readonly startDate: string;
  readonly endDate: string;
  readonly prayer: PrayerName;
  readonly mode?: 'FIXED' | 'OFFSET' | undefined;
  readonly iqamahTime?: string | undefined;
  readonly offsetMinutes?: number | undefined;
}

async function upsertAnnualRow(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  dateStr: string,
  payload: Record<string, unknown>
): Promise<void> {
  const existing = await tx.select().from(annualSchedulesTable).where(eq(annualSchedulesTable.date, dateStr));
  const target = existing[0];
  if (target?.id) {
    await tx.update(annualSchedulesTable).set(payload).where(eq(annualSchedulesTable.id, target.id));
    return;
  }
  await tx.insert(annualSchedulesTable).values({ id: crypto.randomUUID(), date: dateStr, ...payload } as typeof annualSchedulesTable.$inferInsert);
}

export async function importAnnualScheduleCsv(csvContent: string, targetYear?: number): Promise<CsvImportResult> {
  await requireAdminAuth();
  const lines = csvContent.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) {
    return { importedCount: 0, formatDetected: 'legacy_iqamah', skippedCount: 0, warnings: [] };
  }

  const nowIso = new Date().toISOString();
  const defaultYear = targetYear ?? new Date().getFullYear();
  const forceTargetYear = typeof targetYear === 'number';
  const { formatDetected, dataLines } = detectCsvDialect(lines);

  const warnings: string[] = [];
  let skippedCount = 0;

  const importedCount = await runSerializedTransaction(db, async (tx) => {
    let count = 0;
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i]!;
      if (line.startsWith('#') || line.trim().length === 0) continue;

      if (line.includes('2,29') || line.includes('2, 29') || line.includes('02-29') || line.includes('02/29')) {
        const isLeap = (defaultYear % 4 === 0 && defaultYear % 100 !== 0) || defaultYear % 400 === 0;
        if (!isLeap) {
          warnings.push(`Row ${i + 1}: Feb 29 skipped because ${defaultYear} is not a leap year.`);
        }
      }

      const payload = parseCsvLineToSchedulePayload(line, formatDetected, defaultYear, nowIso, forceTargetYear);
      if (!payload) {
        skippedCount++;
        warnings.push(`Row ${i + 1}: Skipped due to invalid format or out-of-order prayer times.`);
        continue;
      }
      await upsertAnnualRow(tx, payload.date, payload as unknown as Record<string, unknown>);
      count++;
    }
    return count;
  });

  if (importedCount > 0) eventBus.emitEvent('PRAYERS_UPDATED', { timestamp: nowIso });
  return { importedCount, formatDetected, skippedCount, warnings };
}

export async function saveDayIqamahSchedule(date: string, timings: SaveDayIqamahTimings): Promise<void> {
  await requireAdminAuth();
  const nowIso = new Date().toISOString();
  const existing = await db.select().from(annualSchedulesTable).where(eq(annualSchedulesTable.date, date));
  const row = existing[0];

  if (row?.id) {
    await db.update(annualSchedulesTable).set({
      ...(timings.fajr ? { fajr_iqamah: normalizeTimeTo24h(timings.fajr) } : {}),
      ...(timings.dhuhr ? { dhuhr_iqamah: normalizeTimeTo24h(timings.dhuhr) } : {}),
      ...(timings.asr ? { asr_iqamah: normalizeTimeTo24h(timings.asr) } : {}),
      ...(timings.maghrib ? { maghrib_iqamah: normalizeTimeTo24h(timings.maghrib) } : {}),
      ...(timings.isha ? { isha_iqamah: normalizeTimeTo24h(timings.isha) } : {}),
      ...(timings.fajr_adhan ? { fajr_adhan: normalizeTimeTo24h(timings.fajr_adhan) } : {}),
      ...(timings.sunrise ? { sunrise: normalizeTimeTo24h(timings.sunrise) } : {}),
      ...(timings.dhuhr_adhan ? { dhuhr_adhan: normalizeTimeTo24h(timings.dhuhr_adhan) } : {}),
      ...(timings.asr_adhan ? { asr_adhan: normalizeTimeTo24h(timings.asr_adhan) } : {}),
      ...(timings.maghrib_adhan ? { maghrib_adhan: normalizeTimeTo24h(timings.maghrib_adhan) } : {}),
      ...(timings.isha_adhan ? { isha_adhan: normalizeTimeTo24h(timings.isha_adhan) } : {}),
      updated_at: nowIso,
    }).where(eq(annualSchedulesTable.id, row.id));
  } else {
    await db.insert(annualSchedulesTable).values({
      id: crypto.randomUUID(),
      date,
      fajr_iqamah: normalizeTimeTo24h(timings.fajr ?? '05:30'),
      dhuhr_iqamah: normalizeTimeTo24h(timings.dhuhr ?? '13:30'),
      asr_iqamah: normalizeTimeTo24h(timings.asr ?? '17:00'),
      maghrib_iqamah: normalizeTimeTo24h(timings.maghrib ?? '19:00'),
      isha_iqamah: normalizeTimeTo24h(timings.isha ?? '20:30'),
      fajr_adhan: timings.fajr_adhan ? normalizeTimeTo24h(timings.fajr_adhan) : null,
      sunrise: timings.sunrise ? normalizeTimeTo24h(timings.sunrise) : null,
      dhuhr_adhan: timings.dhuhr_adhan ? normalizeTimeTo24h(timings.dhuhr_adhan) : null,
      asr_adhan: timings.asr_adhan ? normalizeTimeTo24h(timings.asr_adhan) : null,
      maghrib_adhan: timings.maghrib_adhan ? normalizeTimeTo24h(timings.maghrib_adhan) : null,
      isha_adhan: timings.isha_adhan ? normalizeTimeTo24h(timings.isha_adhan) : null,
      updated_at: nowIso,
    });
  }
  eventBus.emitEvent('PRAYERS_UPDATED', { timestamp: nowIso });
}

export async function bulkSetIqamahRange(input: BulkSetIqamahRangeInput): Promise<{ affectedDays: number }> {
  await requireAdminAuth();
  if (input.prayer.toLowerCase() === 'sunrise') {
    throw new Error('Sunrise does not have an Iqamah prayer time.');
  }
  if (input.startDate > input.endDate) throw new Error('Start date must be before or equal to end date.');

  const [sy, sm, sd] = input.startDate.split('-').map(Number);
  const [ey, em, ed] = input.endDate.split('-').map(Number);
  if (!sy || !sm || !sd || !ey || !em || !ed) throw new Error('Invalid date format. Expected YYYY-MM-DD.');

  const prayerKey = `${input.prayer.toLowerCase()}_iqamah`;
  const isOffset = input.mode === 'OFFSET';
  const settings = isOffset ? await getVenueSettings() : null;
  const fixedVal = input.iqamahTime ? normalizeTimeTo24h(input.iqamahTime) : '17:00';
  const nowIso = new Date().toISOString();

  const curr = new Date(Date.UTC(sy, sm - 1, sd, 12, 0, 0));
  const end = new Date(Date.UTC(ey, em - 1, ed, 12, 0, 0));

  const affectedDays = await runSerializedTransaction(db, async (tx) => {
    let count = 0;
    while (curr <= end) {
      const dateStr = `${curr.getUTCFullYear()}-${String(curr.getUTCMonth() + 1).padStart(2, '0')}-${String(curr.getUTCDate()).padStart(2, '0')}`;
      const resolvedTime = isOffset && settings
        ? computeOffsetIqamahTime(input.prayer, curr, settings, input.offsetMinutes ?? 5)
        : fixedVal;

      const existing = await tx.select().from(annualSchedulesTable).where(eq(annualSchedulesTable.date, dateStr));
      if (existing[0]?.id) {
        await tx.update(annualSchedulesTable).set({ [prayerKey]: resolvedTime, updated_at: nowIso }).where(eq(annualSchedulesTable.id, existing[0].id));
      } else {
        await tx.insert(annualSchedulesTable).values({
          id: crypto.randomUUID(), date: dateStr,
          fajr_iqamah: '05:30', dhuhr_iqamah: '13:30', asr_iqamah: '17:00', maghrib_iqamah: '19:00', isha_iqamah: '20:30',
          [prayerKey]: resolvedTime, updated_at: nowIso,
        });
      }
      count++;
      curr.setUTCDate(curr.getUTCDate() + 1);
    }
    return count;
  });

  if (affectedDays > 0) eventBus.emitEvent('PRAYERS_UPDATED', { timestamp: nowIso, prayer: input.prayer });
  return { affectedDays };
}

export async function resetDayToAstronomical(dateStr: string): Promise<void> {
  await requireAdminAuth();
  await runSerializedTransaction(db, async (tx) => {
    await tx.delete(prayerOverridesTable).where(eq(prayerOverridesTable.date, dateStr));
    await tx.delete(annualSchedulesTable).where(eq(annualSchedulesTable.date, dateStr));
  });
  eventBus.emitEvent('PRAYERS_UPDATED', { timestamp: new Date().toISOString() });
}

export async function resetMonthToAstronomical(year: number, month: number): Promise<void> {
  await requireAdminAuth();
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  await runSerializedTransaction(db, async (tx) => {
    await tx.delete(prayerOverridesTable).where(like(prayerOverridesTable.date, `${monthPrefix}%`));
    await tx.delete(annualSchedulesTable).where(like(annualSchedulesTable.date, `${monthPrefix}%`));
  });
  eventBus.emitEvent('PRAYERS_UPDATED', { timestamp: new Date().toISOString() });
}

