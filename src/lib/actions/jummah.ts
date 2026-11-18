'use server';

import crypto from 'node:crypto';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { jummahShiftsTable } from '@/lib/db/schema';
import { eventBus } from '@/lib/events/event-bus';
import type { JummahShift } from '@/types/index';
import { requireAdminAuth } from './auth';

export interface DbJummahShiftRecord extends JummahShift {
  readonly id: string;
}

export interface CreateJummahShiftInput {
  readonly shift_number?: number | undefined;
  readonly khateeb_name?: string | null | undefined;
  readonly adhan_time: string;
  readonly iqamah_time?: string | null | undefined;
}

export interface UpdateJummahShiftInput {
  readonly id: string;
  readonly shift_number?: number | undefined;
  readonly khateeb_name?: string | null | undefined;
  readonly adhan_time: string;
  readonly iqamah_time?: string | null | undefined;
}

export async function getJummahShifts(): Promise<DbJummahShiftRecord[]> {
  const rows = await db.select().from(jummahShiftsTable).orderBy(asc(jummahShiftsTable.shift_number));
  return rows.map((r) => ({
    id: r.id,
    shift_number: r.shift_number,
    khateeb_name: r.khateeb_name,
    adhan_time: r.adhan_time,
    iqamah_time: r.iqamah_time,
    status: (r.status as JummahShift['status']) ?? 'UPCOMING',
  }));
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

  const remaining = await db.select().from(jummahShiftsTable).orderBy(asc(jummahShiftsTable.shift_number));
  for (let i = 0; i < remaining.length; i++) {
    const shift = remaining[i];
    if (shift && shift.shift_number !== i + 1) {
      await db.update(jummahShiftsTable).set({ shift_number: i + 1 }).where(eq(jummahShiftsTable.id, shift.id));
    }
  }
  eventBus.emitEvent('PRAYERS_UPDATED', { timestamp: new Date().toISOString() });
}

