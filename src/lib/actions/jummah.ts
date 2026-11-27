'use server';

import crypto from 'node:crypto';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { eidShiftsTable, fridayKhateebRosterTable, jummahShiftsTable } from '@/lib/db/schema';
import { eventBus } from '@/lib/events/event-bus';
import type { EidShift, EidType, FridayKhateebRosterRecord, JummahShift } from '@/types/index';
import { requireAdminAuth } from './auth';

export interface DbJummahShiftRecord extends JummahShift {
  readonly id: string;
}

export interface CreateJummahShiftInput {
  readonly shift_number?: number | undefined;
  readonly khateeb_name?: string | null | undefined;
  readonly adhan_time: string;
  readonly iqamah_time?: string | null | undefined;
  readonly location?: string | null | undefined;
  readonly language?: string | null | undefined;
  readonly topic?: string | null | undefined;
}

export interface UpdateJummahShiftInput {
  readonly id: string;
  readonly shift_number?: number | undefined;
  readonly khateeb_name?: string | null | undefined;
  readonly adhan_time: string;
  readonly iqamah_time?: string | null | undefined;
  readonly location?: string | null | undefined;
  readonly language?: string | null | undefined;
  readonly topic?: string | null | undefined;
}

export async function getJummahShifts(): Promise<DbJummahShiftRecord[]> {
  const rows = await db.select().from(jummahShiftsTable).orderBy(asc(jummahShiftsTable.shift_number));
  return rows.map((r) => ({
    id: r.id,
    shift_number: r.shift_number,
    khateeb_name: r.khateeb_name,
    adhan_time: r.adhan_time,
    iqamah_time: r.iqamah_time,
    location: r.location ?? null,
    language: r.language ?? null,
    topic: r.topic ?? null,
    status: (r.status as JummahShift['status']) ?? 'UPCOMING',
  }));
}

export async function getEffectiveJummahShifts(forDate?: string): Promise<DbJummahShiftRecord[]> {
  const shifts = await getJummahShifts();
  if (!forDate) return shifts;

  const overrides = await db
    .select()
    .from(fridayKhateebRosterTable)
    .where(eq(fridayKhateebRosterTable.date, forDate));

  const overrideMap = new Map(overrides.map((o) => [o.shift_id, o]));
  return shifts.map((s) => {
    const ovr = overrideMap.get(s.id);
    if (!ovr) return s;
    return {
      ...s,
      khateeb_name: ovr.khateeb_name || s.khateeb_name,
      topic: ovr.topic ?? s.topic,
    };
  });
}

export async function createJummahShift(input: CreateJummahShiftInput): Promise<DbJummahShiftRecord> {
  await requireAdminAuth();
  const existing = await db.select().from(jummahShiftsTable);
  const nextShiftNumber = input.shift_number !== undefined ? input.shift_number : existing.length + 1;
  const id = crypto.randomUUID();
  const cleanIqamah = input.iqamah_time?.trim() || null;
  const cleanKhateeb = input.khateeb_name?.trim() || '';

  await db.insert(jummahShiftsTable).values({
    id,
    shift_number: nextShiftNumber,
    khateeb_name: cleanKhateeb,
    adhan_time: input.adhan_time.trim(),
    iqamah_time: cleanIqamah,
    location: input.location?.trim() || null,
    language: input.language?.trim() || null,
    topic: input.topic?.trim() || null,
    status: 'UPCOMING',
    is_active: true,
  });

  eventBus.emitEvent('PRAYERS_UPDATED', { timestamp: new Date().toISOString() });
  return {
    id,
    shift_number: nextShiftNumber,
    khateeb_name: cleanKhateeb,
    adhan_time: input.adhan_time.trim(),
    iqamah_time: cleanIqamah,
    location: input.location?.trim() || null,
    language: input.language?.trim() || null,
    topic: input.topic?.trim() || null,
    status: 'UPCOMING',
  };
}

export async function updateJummahShift(input: UpdateJummahShiftInput): Promise<DbJummahShiftRecord> {
  await requireAdminAuth();
  const cleanIqamah = input.iqamah_time?.trim() || null;
  const cleanKhateeb = input.khateeb_name !== undefined ? (input.khateeb_name?.trim() || '') : undefined;

  const updateData: Record<string, unknown> = {
    adhan_time: input.adhan_time.trim(),
    iqamah_time: cleanIqamah,
    ...(input.shift_number !== undefined ? { shift_number: input.shift_number } : {}),
    ...(cleanKhateeb !== undefined ? { khateeb_name: cleanKhateeb } : {}),
    ...(input.location !== undefined ? { location: input.location?.trim() || null } : {}),
    ...(input.language !== undefined ? { language: input.language?.trim() || null } : {}),
    ...(input.topic !== undefined ? { topic: input.topic?.trim() || null } : {}),
  };

  await db.update(jummahShiftsTable).set(updateData).where(eq(jummahShiftsTable.id, input.id));
  eventBus.emitEvent('PRAYERS_UPDATED', { timestamp: new Date().toISOString() });

  const [row] = await db.select().from(jummahShiftsTable).where(eq(jummahShiftsTable.id, input.id));
  return {
    id: input.id,
    shift_number: row?.shift_number ?? input.shift_number ?? 1,
    khateeb_name: row?.khateeb_name ?? cleanKhateeb ?? '',
    adhan_time: input.adhan_time.trim(),
    iqamah_time: cleanIqamah,
    location: row?.location ?? null,
    language: row?.language ?? null,
    topic: row?.topic ?? null,
    status: (row?.status as JummahShift['status']) ?? 'UPCOMING',
  };
}

export async function reorderJummahShifts(shiftIds: string[]): Promise<DbJummahShiftRecord[]> {
  await requireAdminAuth();
  for (let i = 0; i < shiftIds.length; i++) {
    const id = shiftIds[i];
    if (!id) continue;
    await db.update(jummahShiftsTable).set({ shift_number: i + 1 }).where(eq(jummahShiftsTable.id, id));
  }
  eventBus.emitEvent('PRAYERS_UPDATED', { timestamp: new Date().toISOString() });
  return getJummahShifts();
}

export async function deleteJummahShift(id: string): Promise<void> {
  await requireAdminAuth();
  await db.delete(jummahShiftsTable).where(eq(jummahShiftsTable.id, id));
  await db.delete(fridayKhateebRosterTable).where(eq(fridayKhateebRosterTable.shift_id, id));

  const remaining = await db.select().from(jummahShiftsTable).orderBy(asc(jummahShiftsTable.shift_number));
  for (let i = 0; i < remaining.length; i++) {
    const shift = remaining[i];
    if (shift && shift.shift_number !== i + 1) {
      await db.update(jummahShiftsTable).set({ shift_number: i + 1 }).where(eq(jummahShiftsTable.id, shift.id));
    }
  }
  eventBus.emitEvent('PRAYERS_UPDATED', { timestamp: new Date().toISOString() });
}

// ==================== Friday Khateeb Roster Overrides ====================

export async function getFridayKhateebRoster(date: string): Promise<FridayKhateebRosterRecord[]> {
  const rows = await db
    .select()
    .from(fridayKhateebRosterTable)
    .where(eq(fridayKhateebRosterTable.date, date));
  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    shift_id: r.shift_id,
    khateeb_name: r.khateeb_name,
    topic: r.topic ?? null,
    created_at: r.created_at,
  }));
}

export async function saveFridayKhateebOverride(
  date: string,
  shiftId: string,
  khateebName: string,
  topic?: string
): Promise<void> {
  await requireAdminAuth();
  const cleanName = khateebName.trim();
  const cleanTopic = topic?.trim() || null;
  const nowIso = new Date().toISOString();

  const existing = await db
    .select()
    .from(fridayKhateebRosterTable)
    .where(
      and(
        eq(fridayKhateebRosterTable.date, date),
        eq(fridayKhateebRosterTable.shift_id, shiftId)
      )
    );

  if (existing[0]) {
    await db
      .update(fridayKhateebRosterTable)
      .set({ khateeb_name: cleanName, topic: cleanTopic })
      .where(eq(fridayKhateebRosterTable.id, existing[0].id));
  } else {
    await db.insert(fridayKhateebRosterTable).values({
      id: crypto.randomUUID(),
      date,
      shift_id: shiftId,
      khateeb_name: cleanName,
      topic: cleanTopic,
      created_at: nowIso,
    });
  }
  eventBus.emitEvent('PRAYERS_UPDATED', { timestamp: nowIso });
}

export async function deleteFridayKhateebOverride(id: string): Promise<void> {
  await requireAdminAuth();
  await db.delete(fridayKhateebRosterTable).where(eq(fridayKhateebRosterTable.id, id));
  eventBus.emitEvent('PRAYERS_UPDATED', { timestamp: new Date().toISOString() });
}

// ==================== Eid Multi-Shift Schedules ====================

export async function getEidShifts(eidType?: EidType): Promise<EidShift[]> {
  const query = db.select().from(eidShiftsTable).orderBy(asc(eidShiftsTable.shift_number));
  const rows = eidType ? await query.where(eq(eidShiftsTable.eid_type, eidType)) : await query;
  return rows.map((r) => ({
    id: r.id,
    eid_type: r.eid_type as EidType,
    shift_number: r.shift_number,
    takbeerat_time: r.takbeerat_time,
    salah_time: r.salah_time,
    khateeb_name: r.khateeb_name ?? null,
    location: r.location ?? null,
    is_active: r.is_active,
    created_at: r.created_at,
  }));
}

export async function saveEidShift(input: {
  readonly id?: string | undefined;
  readonly eid_type: EidType;
  readonly shift_number?: number | undefined;
  readonly takbeerat_time: string;
  readonly salah_time: string;
  readonly khateeb_name?: string | null | undefined;
  readonly location?: string | null | undefined;
}): Promise<EidShift> {
  await requireAdminAuth();
  const id = input.id || crypto.randomUUID();
  const nowIso = new Date().toISOString();

  if (input.id) {
    await db
      .update(eidShiftsTable)
      .set({
        eid_type: input.eid_type,
        takbeerat_time: input.takbeerat_time.trim(),
        salah_time: input.salah_time.trim(),
        khateeb_name: input.khateeb_name?.trim() || null,
        location: input.location?.trim() || null,
        ...(input.shift_number !== undefined ? { shift_number: input.shift_number } : {}),
      })
      .where(eq(eidShiftsTable.id, input.id));
  } else {
    const existing = await getEidShifts(input.eid_type);
    const nextNumber = input.shift_number !== undefined ? input.shift_number : existing.length + 1;
    await db.insert(eidShiftsTable).values({
      id,
      eid_type: input.eid_type,
      shift_number: nextNumber,
      takbeerat_time: input.takbeerat_time.trim(),
      salah_time: input.salah_time.trim(),
      khateeb_name: input.khateeb_name?.trim() || null,
      location: input.location?.trim() || null,
      is_active: true,
      created_at: nowIso,
    });
  }

  eventBus.emitEvent('PRAYERS_UPDATED', { timestamp: nowIso });
  const [saved] = await db.select().from(eidShiftsTable).where(eq(eidShiftsTable.id, id));
  return {
    id,
    eid_type: (saved?.eid_type as EidType) ?? input.eid_type,
    shift_number: saved?.shift_number ?? 1,
    takbeerat_time: saved?.takbeerat_time ?? input.takbeerat_time,
    salah_time: saved?.salah_time ?? input.salah_time,
    khateeb_name: saved?.khateeb_name ?? null,
    location: saved?.location ?? null,
    is_active: saved?.is_active ?? true,
    created_at: saved?.created_at ?? nowIso,
  };
}

export async function deleteEidShift(id: string): Promise<void> {
  await requireAdminAuth();
  await db.delete(eidShiftsTable).where(eq(eidShiftsTable.id, id));
  eventBus.emitEvent('PRAYERS_UPDATED', { timestamp: new Date().toISOString() });
}

