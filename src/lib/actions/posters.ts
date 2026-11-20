'use server';

import crypto from 'node:crypto';
import { asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { postersTable, settingsTable } from '@/lib/db/schema';
import { runSerializedTransaction } from '@/lib/db/tx';
import { calculatePosterStatus } from '@/lib/engine/index';
import { calculateTotalDwell, isVideoMedia, validateVideoDuration } from '@/lib/engine/video-engine';
import { eventBus } from '@/lib/events/event-bus';
import { parseRecurringSchedule } from '@/lib/posters/recurring-schedule';
import {
  assertValidPosterId,
  processAndWriteMediaAsset,
  safeUnlinkUploadRelative,
} from '@/lib/posters/media-storage';
import {
  mapPosterRowToDomain,
  type UpdatePosterInput,
  type UploadPosterInput,
} from '@/lib/posters/poster-mapper';
import type { Poster, PosterWithStatus } from '@/types/index';
import { requireAdminAuth } from './auth';
import { unlinkPosterAssetIfUnreferenced } from './poster-asset-refs';
import { assertSafeOptionalQrUrl } from '@/lib/utils/url-safety';
import { filterPublicActivePosters } from '@/lib/posters/poster-schedule-filter';

export async function uploadPoster(input: UploadPosterInput): Promise<Poster> {
  await requireAdminAuth();
  const safeQrUrl = assertSafeOptionalQrUrl(input.qr_url);
  const isVideo = isVideoMedia(input.mimeType, input.fileName);
  let effectiveDuration = input.duration_seconds ?? 15;
  if (isVideo && input.video_duration_seconds !== undefined) {
    const durValidation = validateVideoDuration(input.video_duration_seconds);
    if (!durValidation.valid) {
      throw new Error(durValidation.error ?? 'Invalid video duration.');
    }
    effectiveDuration = calculateTotalDwell(input.video_duration_seconds, input.video_loop_count ?? 1);
  }

  const uniqueId = crypto.randomUUID();
  const written = await processAndWriteMediaAsset(
    input.fileBuffer, input.fileName, input.mimeType, input.thumbnailBuffer, uniqueId
  );

  const nowIso = new Date().toISOString();
  const resolvedEndAt = input.end_at || null;
  const safeRec = input.recurring_schedule ? JSON.stringify(parseRecurringSchedule(input.recurring_schedule) ?? null) : null;
  let nextOrder = 0;

  try {
    nextOrder = await runSerializedTransaction(db, async (tx) => {
      const maxRes = await tx
        .select({ maxOrder: sql<number>`COALESCE(MAX(${postersTable.display_order}), -1)` })
        .from(postersTable);
      const order = (maxRes[0]?.maxOrder ?? -1) + 1;
      await tx.insert(postersTable).values({
        id: uniqueId, title: input.title.trim(), image_path: written.relativePath,
        media_type: written.isVideo ? 'video' : 'image',
        video_loop_count: written.isVideo ? (input.video_loop_count ?? 1) : 1,
        video_duration_seconds: written.isVideo ? (input.video_duration_seconds ?? null) : null,
        thumbnail_path: written.thumbnailPath,
        allow_audio: written.isVideo ? Boolean(input.allow_audio) : false,
        qr_url: safeQrUrl, qr_label: input.qr_label?.trim() || null,
        qr_position: input.qr_position ?? 'bottom-left', start_at: input.start_at,
        end_at: resolvedEndAt, duration_seconds: effectiveDuration, display_order: order,
        is_active: true, recurring_schedule: safeRec || null, created_at: nowIso,
      });
      return order;
    });
  } catch (insertErr) {
    safeUnlinkUploadRelative(written.relativePath);
    safeUnlinkUploadRelative(written.thumbnailPath);
    throw insertErr;
  }

  eventBus.emitEvent('POSTERS_UPDATED', { timestamp: nowIso, action: 'create', posterId: uniqueId });
  return {
    id: uniqueId, title: input.title.trim(), image_path: written.relativePath,
    media_type: written.isVideo ? 'video' : 'image',
    video_loop_count: written.isVideo ? (input.video_loop_count ?? 1) : 1,
    video_duration_seconds: written.isVideo ? (input.video_duration_seconds ?? undefined) : undefined,
    thumbnail_path: written.thumbnailPath ?? undefined,
    allow_audio: written.isVideo ? Boolean(input.allow_audio) : false,
    qr_url: safeQrUrl ?? undefined, qr_label: input.qr_label?.trim() || undefined,
    qr_position: input.qr_position ?? 'bottom-left',
    start_at: input.start_at, end_at: resolvedEndAt,
    duration_seconds: effectiveDuration, display_order: nextOrder,
    recurring_schedule: safeRec || undefined, created_at: nowIso,
  };
}

export async function updatePoster(input: UpdatePosterInput): Promise<void> {
  await requireAdminAuth();
  const safeId = assertValidPosterId(input.id);
  const safeQrUrl = assertSafeOptionalQrUrl(input.qr_url);
  const existing = await db.select().from(postersTable).where(eq(postersTable.id, safeId));
  const previous = existing[0];
  if (!previous) throw new Error('Poster not found.');

  let replacement: Awaited<ReturnType<typeof processAndWriteMediaAsset>> | undefined;
  if (input.fileBuffer && input.fileName && input.mimeType) {
    replacement = await processAndWriteMediaAsset(
      input.fileBuffer, input.fileName, input.mimeType, input.thumbnailBuffer, `${safeId}-${Date.now()}`
    );
  }

  const recVal = input.recurring_schedule !== undefined
    ? (input.recurring_schedule ? JSON.stringify(parseRecurringSchedule(input.recurring_schedule) ?? null) : null)
    : undefined;

  try {
    await db.update(postersTable).set({
      title: input.title.trim(), start_at: input.start_at, end_at: input.end_at || null,
      duration_seconds: input.duration_seconds,
      qr_url: safeQrUrl, qr_label: input.qr_label?.trim() || null,
      ...(input.qr_position !== undefined ? { qr_position: input.qr_position } : {}),
      ...(replacement ? { image_path: replacement.relativePath, media_type: replacement.isVideo ? 'video' : 'image' } : {}),
      ...(replacement?.thumbnailPath ? { thumbnail_path: replacement.thumbnailPath } : {}),
      ...(input.video_loop_count !== undefined ? { video_loop_count: input.video_loop_count } : {}),
      ...(input.video_duration_seconds !== undefined ? { video_duration_seconds: input.video_duration_seconds } : {}),
      ...(input.allow_audio !== undefined ? { allow_audio: input.allow_audio } : {}),
      ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
      ...(recVal !== undefined ? { recurring_schedule: recVal } : {}),
    }).where(eq(postersTable.id, safeId));
  } catch (updateErr) {
    if (replacement) {
      safeUnlinkUploadRelative(replacement.relativePath);
      safeUnlinkUploadRelative(replacement.thumbnailPath);
    }
    throw updateErr;
  }

  if (replacement) {
    await unlinkPosterAssetIfUnreferenced(previous.image_path);
    await unlinkPosterAssetIfUnreferenced(previous.thumbnail_path);
  }
  eventBus.emitEvent('POSTERS_UPDATED', { timestamp: new Date().toISOString(), action: 'update', posterId: safeId });
}

export async function deletePoster(posterId: string): Promise<void> {
  await requireAdminAuth();
  const safeId = assertValidPosterId(posterId);
  const existing = await db.select().from(postersTable).where(eq(postersTable.id, safeId));
  const poster = existing[0];

  await db.delete(postersTable).where(eq(postersTable.id, safeId));
  await unlinkPosterAssetIfUnreferenced(poster?.image_path);
  await unlinkPosterAssetIfUnreferenced(poster?.thumbnail_path);

  eventBus.emitEvent('POSTERS_UPDATED', { timestamp: new Date().toISOString(), action: 'delete', posterId: safeId });
}

export async function toggleArchivePoster(posterId: string): Promise<boolean> {
  await requireAdminAuth();
  const safeId = assertValidPosterId(posterId);
  const existing = await db.select().from(postersTable).where(eq(postersTable.id, safeId));
  const poster = existing[0];
  if (!poster) throw new Error('Poster not found.');

  const newIsActive = !poster.is_active;
  await db.update(postersTable).set({ is_active: newIsActive }).where(eq(postersTable.id, safeId));
  eventBus.emitEvent('POSTERS_UPDATED', { timestamp: new Date().toISOString(), action: 'update', posterId: safeId });
  return newIsActive;
}

export async function getPostersWithStatus(now: Date = new Date()): Promise<PosterWithStatus[]> {
  await requireAdminAuth();
  const rows = await db
    .select()
    .from(postersTable)
    .orderBy(asc(postersTable.display_order), desc(postersTable.created_at));
  return rows.map((row) => {
    const poster = mapPosterRowToDomain(row);
    return { ...poster, status: calculatePosterStatus(poster, now) };
  });
}

export async function getPublicActivePosters(
  now: Date = new Date()
): Promise<{ posters: Poster[]; nextTransitionAt: string | null }> {
  const [settingsRow] = await db.select({ timezone: settingsTable.timezone }).from(settingsTable).limit(1);
  const timezone = settingsRow?.timezone || 'America/Toronto';
  const rows = await db
    .select()
    .from(postersTable)
    .where(eq(postersTable.is_active, true))
    .orderBy(asc(postersTable.display_order), desc(postersTable.created_at));

  const domainPosters = rows.map((r) => mapPosterRowToDomain(r));
  const { activePosters, nextTransitionAt } = filterPublicActivePosters(domainPosters, now, timezone);
  return { posters: activePosters, nextTransitionAt };
}

export async function reorderPosters(posterIds: string[]): Promise<void> {
  await requireAdminAuth();
  const safeIds = posterIds.filter(Boolean).map((id) => assertValidPosterId(id));
  await runSerializedTransaction(db, async (tx) => {
    for (let i = 0; i < safeIds.length; i++) {
      const safeId = safeIds[i];
      if (safeId) {
        await tx.update(postersTable).set({ display_order: i }).where(eq(postersTable.id, safeId));
      }
    }
  });
  eventBus.emitEvent('POSTERS_UPDATED', { timestamp: new Date().toISOString(), action: 'refresh' });
}

export async function duplicatePoster(posterId: string): Promise<Poster> {
  await requireAdminAuth();
  const safeId = assertValidPosterId(posterId);
  const existing = await db.select().from(postersTable).where(eq(postersTable.id, safeId)).limit(1);
  const orig = existing[0];
  if (!orig) throw new Error('Poster not found to duplicate.');

  const uniqueId = crypto.randomUUID();
  const nowIso = new Date().toISOString();
  const newTitle = orig.title.endsWith('(Copy)') ? orig.title : `${orig.title} (Copy)`;
  const nextOrder = await runSerializedTransaction(db, async (tx) => {
    const maxOrderRes = await tx
      .select({ maxOrder: sql<number>`COALESCE(MAX(${postersTable.display_order}), -1)` })
      .from(postersTable);
    const order = (maxOrderRes[0]?.maxOrder ?? -1) + 1;
    await tx.insert(postersTable).values({
      id: uniqueId, title: newTitle, image_path: orig.image_path, media_type: orig.media_type,
      thumbnail_path: orig.thumbnail_path, video_loop_count: orig.video_loop_count,
      video_duration_seconds: orig.video_duration_seconds, allow_audio: orig.allow_audio,
      qr_url: orig.qr_url, qr_label: orig.qr_label, qr_position: orig.qr_position,
      start_at: orig.start_at, end_at: orig.end_at, duration_seconds: orig.duration_seconds,
      display_order: order, is_active: true, layout_config: orig.layout_config, created_at: nowIso,
    });
    return order;
  });

  eventBus.emitEvent('POSTERS_UPDATED', { timestamp: nowIso, action: 'create', posterId: uniqueId });
  return mapPosterRowToDomain({ ...orig, id: uniqueId, title: newTitle, display_order: nextOrder, is_active: true, created_at: nowIso });
}
