'use server';

import { inArray, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { postersTable } from '@/lib/db/schema';
import { eventBus } from '@/lib/events/event-bus';
import { assertValidPosterId } from '@/lib/posters/media-storage';
import { unlinkPosterAssetIfUnreferenced } from './poster-asset-refs';
import { requireAdminAuth } from './auth';

/**
 * 1-Click quick toggle to pause (archive) or resume (activate) a single poster.
 */
export async function togglePosterActive(posterId: string): Promise<boolean> {
  await requireAdminAuth();
  const safeId = assertValidPosterId(posterId);
  const rows = await db.select().from(postersTable).where(eq(postersTable.id, safeId));
  const poster = rows[0];
  if (!poster) throw new Error('Poster not found.');

  const nextActive = !poster.is_active;
  await db
    .update(postersTable)
    .set({ is_active: nextActive })
    .where(eq(postersTable.id, safeId));

  eventBus.emitEvent('POSTERS_UPDATED', {
    timestamp: new Date().toISOString(),
    action: 'update',
    posterId: safeId,
  });

  return nextActive;
}

/**
 * Bulk updates the active/archived state for an array of posters.
 */
export async function bulkArchivePosters(
  posterIds: readonly string[],
  archive: boolean = true
): Promise<number> {
  await requireAdminAuth();
  const safeIds = posterIds
    .filter(Boolean)
    .map((id) => assertValidPosterId(id));

  if (safeIds.length === 0) return 0;

  await db
    .update(postersTable)
    .set({ is_active: !archive })
    .where(inArray(postersTable.id, safeIds));

  eventBus.emitEvent('POSTERS_UPDATED', {
    timestamp: new Date().toISOString(),
    action: 'refresh',
  });

  return safeIds.length;
}

/**
 * Bulk deletes an array of posters and cleans up orphaned media assets.
 */
export async function bulkDeletePosters(posterIds: readonly string[]): Promise<number> {
  await requireAdminAuth();
  const safeIds = posterIds
    .filter(Boolean)
    .map((id) => assertValidPosterId(id));

  if (safeIds.length === 0) return 0;

  const existingRows = await db
    .select({
      id: postersTable.id,
      image_path: postersTable.image_path,
      thumbnail_path: postersTable.thumbnail_path,
    })
    .from(postersTable)
    .where(inArray(postersTable.id, safeIds));

  await db.delete(postersTable).where(inArray(postersTable.id, safeIds));

  for (const row of existingRows) {
    await unlinkPosterAssetIfUnreferenced(row.image_path);
    await unlinkPosterAssetIfUnreferenced(row.thumbnail_path);
  }

  eventBus.emitEvent('POSTERS_UPDATED', {
    timestamp: new Date().toISOString(),
    action: 'delete',
  });

  return existingRows.length;
}

