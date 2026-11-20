'use server';

import crypto from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { annualSchedulesTable, prayerOverridesTable, prayerRulesTable } from '@/lib/db/schema';
import { eventBus } from '@/lib/events/event-bus';
import { getVenueSettings, updateVenueSettings } from '@/lib/actions/settings';
import { normalizeTimeTo24h } from '@/lib/prayer/csv-parser';
import { timeToMinutes } from '@/lib/utils/time';
import type { AnnualScheduleRecord, PrayerName, PrayerOverride, PrayerRule } from '@/types/index';
import { requireAdminAuth } from './auth';

export interface UpsertPrayerOverrideInput {
  readonly date: string;
  readonly prayer: PrayerName;
  readonly adhan_override?: string | undefined;
  readonly iqamah_time: string;
}

export interface SavePrayerRuleInput {
  readonly prayer: PrayerName;
  readonly rule_type: 'OFFSET' | 'FIXED';
  readonly offset_minutes?: number | undefined;
  readonly fixed_time?: string | undefined;
}

export async function upsertPrayerOverride(input: UpsertPrayerOverrideInput): Promise<void> {
  await requireAdminAuth();
  const safeIqamah = normalizeTimeTo24h(input.iqamah_time);
  if (!safeIqamah) {
    throw new Error('Invalid Iqamah time format. Expected HH:mm (e.g. 05:30 or 5:30 PM).');
  }

  const safeAdhan = input.adhan_override?.trim()
    ? normalizeTimeTo24h(input.adhan_override)
    : null;
  if (input.adhan_override?.trim() && !safeAdhan) {
    throw new Error('Invalid Adhan override format. Expected HH:mm.');
  }

  if (safeAdhan && timeToMinutes(safeIqamah) < timeToMinutes(safeAdhan)) {
    throw new Error(`Iqamah time (${safeIqamah}) cannot be earlier than Adhan time (${safeAdhan}).`);
  }

  const existing = await db
    .select()
    .from(prayerOverridesTable)
    .where(and(eq(prayerOverridesTable.date, input.date), eq(prayerOverridesTable.prayer, input.prayer)));
  const nowIso = new Date().toISOString();
  const target = existing[0];

  if (target?.id) {
    await db
      .update(prayerOverridesTable)
      .set({
        date: input.date,
        adhan_override: safeAdhan,
        iqamah_time: safeIqamah,
        updated_at: nowIso,
      })
      .where(eq(prayerOverridesTable.id, target.id));
  } else {
    await db.insert(prayerOverridesTable).values({
      id: crypto.randomUUID(),
      date: input.date,
      prayer: input.prayer,
      adhan_override: safeAdhan,
      iqamah_time: safeIqamah,
      updated_at: nowIso,
    });
  }

  eventBus.emitEvent('PRAYERS_UPDATED', {
    timestamp: nowIso,
    prayer: input.prayer,
    iqamahTime: safeIqamah,
  });
}

export async function getPrayerRules(): Promise<PrayerRule[]> {
  const rows = await db.select().from(prayerRulesTable);
  return rows.map((r) => ({
    id: r.id,
    prayer: r.prayer as PrayerName,
    rule_type: r.rule_type as 'OFFSET' | 'FIXED',
    offset_minutes: r.offset_minutes ?? undefined,
    fixed_time: r.fixed_time ?? undefined,
    updated_at: r.updated_at,
  }));
}

export async function savePrayerRule(input: SavePrayerRuleInput): Promise<void> {
  await requireAdminAuth();
  let normalizedFixedTime: string | null = null;
  if (input.rule_type === 'FIXED') {
    if (!input.fixed_time?.trim()) {
      throw new Error('Fixed time is required when rule type is FIXED.');
    }
    normalizedFixedTime = normalizeTimeTo24h(input.fixed_time);
    if (!normalizedFixedTime) {
      throw new Error('Invalid fixed time format. Expected HH:mm.');
    }
  }

  const existing = await db.select().from(prayerRulesTable).where(eq(prayerRulesTable.prayer, input.prayer));
  const nowIso = new Date().toISOString();
  const target = existing[0];

  if (target?.id) {
    await db
      .update(prayerRulesTable)
      .set({
        rule_type: input.rule_type,
        offset_minutes: input.offset_minutes ?? null,
        fixed_time: normalizedFixedTime,
        updated_at: nowIso,
      })
      .where(eq(prayerRulesTable.id, target.id));
  } else {
    await db.insert(prayerRulesTable).values({
      id: crypto.randomUUID(),
      prayer: input.prayer,
      rule_type: input.rule_type,
      offset_minutes: input.offset_minutes ?? null,
      fixed_time: normalizedFixedTime,
      updated_at: nowIso,
    });
  }

  eventBus.emitEvent('PRAYERS_UPDATED', { timestamp: nowIso, prayer: input.prayer });
}

export async function saveAdhanOffsets(offsets: Partial<Record<PrayerName, number>>): Promise<void> {
  await requireAdminAuth();
  await updateVenueSettings({
    ...(typeof offsets.fajr === 'number' ? { fajr_adhan_offset_minutes: offsets.fajr } : {}),
    ...(typeof offsets.sunrise === 'number' ? { sunrise_adhan_offset_minutes: offsets.sunrise } : {}),
    ...(typeof offsets.dhuhr === 'number' ? { dhuhr_adhan_offset_minutes: offsets.dhuhr } : {}),
    ...(typeof offsets.asr === 'number' ? { asr_adhan_offset_minutes: offsets.asr } : {}),
    ...(typeof offsets.maghrib === 'number' ? { maghrib_adhan_offset_minutes: offsets.maghrib } : {}),
    ...(typeof offsets.isha === 'number' ? { isha_adhan_offset_minutes: offsets.isha } : {}),
  });
}

export async function getAdhanOffsets(): Promise<Record<PrayerName, number>> {
  const settings = await getVenueSettings();
  return {
    fajr: settings.fajr_adhan_offset_minutes ?? 0,
    sunrise: settings.sunrise_adhan_offset_minutes ?? 0,
    dhuhr: settings.dhuhr_adhan_offset_minutes ?? 0,
    asr: settings.asr_adhan_offset_minutes ?? 0,
    maghrib: settings.maghrib_adhan_offset_minutes ?? 0,
    isha: settings.isha_adhan_offset_minutes ?? 0,
  };
}

export async function getAnnualScheduleForDate(dateStr: string): Promise<AnnualScheduleRecord | null> {
  const rows = await db.select().from(annualSchedulesTable).where(eq(annualSchedulesTable.date, dateStr));
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    date: row.date,
    fajr_adhan: row.fajr_adhan,
    sunrise: row.sunrise,
    dhuhr_adhan: row.dhuhr_adhan,
    asr_adhan: row.asr_adhan,
    maghrib_adhan: row.maghrib_adhan,
    isha_adhan: row.isha_adhan,
    fajr_iqamah: row.fajr_iqamah,
    dhuhr_iqamah: row.dhuhr_iqamah,
    asr_iqamah: row.asr_iqamah,
    maghrib_iqamah: row.maghrib_iqamah,
    isha_iqamah: row.isha_iqamah,
    updated_at: row.updated_at,
  };
}

export async function getPrayerOverrides(dateStr?: string): Promise<PrayerOverride[]> {
  const rows = dateStr
    ? await db.select().from(prayerOverridesTable).where(eq(prayerOverridesTable.date, dateStr))
    : await db.select().from(prayerOverridesTable);
  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    prayer: r.prayer as PrayerName,
    adhan_override: r.adhan_override ?? undefined,
    iqamah_time: r.iqamah_time,
  }));
}

export async function hasConfiguredAnnualSchedule(): Promise<boolean> {
  const rows = await db.select({ count: sql<number>`count(*)` }).from(annualSchedulesTable);
  return Number(rows[0]?.count ?? 0) > 0;
}
