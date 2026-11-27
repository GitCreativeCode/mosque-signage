'use server';

import crypto from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { postersTable } from '@/lib/db/schema';
import { runSerializedTransaction } from '@/lib/db/tx';
import { eventBus } from '@/lib/events/event-bus';
import { validateLayoutConfig } from '@/lib/posters/layout-engine';
import { assertValidPosterId, processAndWriteMediaAsset } from '@/lib/posters/media-storage';
import { mapPosterRowToDomain } from '@/lib/posters/poster-mapper';
import type { Poster, PosterLayoutConfig, QrPosition } from '@/types/index';
import { requireAdminAuth } from './auth';
import { assertSafeOptionalQrUrl } from '@/lib/utils/url-safety';

export interface UploadLayoutAssetInput {
  readonly fileBuffer: Buffer | Uint8Array | ArrayBuffer;
  readonly fileName: string;
  readonly mimeType: string;
  readonly thumbnailBuffer?: (Buffer | Uint8Array | ArrayBuffer) | undefined;
}

export interface UploadLayoutAssetResult {
  readonly asset_path: string;
  readonly type: 'image' | 'video';
  readonly original_filename: string;
  readonly thumbnail_path?: string | undefined;
}

export interface SaveMultiAssetPosterInput {
  readonly id?: string | undefined;
  readonly title: string;
  readonly layout_config: PosterLayoutConfig;
  readonly start_at: string;
  readonly end_at?: string | null | undefined;
  readonly duration_seconds: number;
  readonly qr_url?: string | undefined;
  readonly qr_label?: string | undefined;
  readonly qr_position?: QrPosition | undefined;
  readonly qr_start_at?: string | null | undefined;
  readonly qr_end_at?: string | null | undefined;
  readonly allow_audio?: boolean | undefined;
  readonly recurring_schedule?: string | null | undefined;
}

export async function uploadLayoutAsset(input: UploadLayoutAssetInput): Promise<UploadLayoutAssetResult> {
  await requireAdminAuth();
  const written = await processAndWriteMediaAsset(
    input.fileBuffer,
    input.fileName,
    input.mimeType,
    input.thumbnailBuffer
  );

  return {
    asset_path: written.relativePath,
    type: written.isVideo ? 'video' : 'image',
    original_filename: input.fileName,
    thumbnail_path: written.thumbnailPath ?? undefined,
  };
}

export async function saveMultiAssetPoster(input: SaveMultiAssetPosterInput): Promise<Poster> {
  await requireAdminAuth();
  const safeQrUrl = assertSafeOptionalQrUrl(input.qr_url);
  const validation = validateLayoutConfig(input.layout_config);
  if (!validation.valid) {
    throw new Error(validation.error ?? 'Invalid layout configuration.');
  }

  const primaryImagePath = input.layout_config.slots[0]?.asset_path || '/uploads/Mosque_Signage_Welcome.webp';
  const nowIso = new Date().toISOString();
  const resolvedEndAt = input.end_at || null;
  const serializedLayout = JSON.stringify(input.layout_config);

  if (input.id) {
    const safeId = assertValidPosterId(input.id);
    const existing = await db.select().from(postersTable).where(eq(postersTable.id, safeId));
    if (!existing[0]) {
      throw new Error('Poster not found.');
    }

    await db
      .update(postersTable)
      .set({
        title: input.title.trim(),
        image_path: primaryImagePath,
        media_type: 'composite',
        layout_config: serializedLayout,
        start_at: input.start_at,
        end_at: resolvedEndAt,
        duration_seconds: input.duration_seconds,
        qr_url: safeQrUrl,
        qr_label: input.qr_label?.trim() || null,
        qr_position: input.qr_position ?? 'bottom-left',
        qr_start_at: input.qr_start_at !== undefined ? (input.qr_start_at || null) : undefined,
        qr_end_at: input.qr_end_at !== undefined ? (input.qr_end_at || null) : undefined,
        allow_audio: Boolean(input.allow_audio),
        ...(input.recurring_schedule !== undefined ? { recurring_schedule: input.recurring_schedule } : {}),
      })
      .where(eq(postersTable.id, safeId));

    const updated = await db.select().from(postersTable).where(eq(postersTable.id, safeId));
    const row = updated[0];
    if (!row) throw new Error('Poster not found after update.');
    eventBus.emitEvent('POSTERS_UPDATED', { timestamp: nowIso, action: 'update', posterId: safeId });
    return mapPosterRowToDomain(row);
  }

  const uniqueId = crypto.randomUUID();
  const nextOrder = await runSerializedTransaction(db, async (tx) => {
    const maxOrderRes = await tx
      .select({ maxOrder: sql<number>`COALESCE(MAX(${postersTable.display_order}), -1)` })
      .from(postersTable);
    const order = (maxOrderRes[0]?.maxOrder ?? -1) + 1;
    await tx.insert(postersTable).values({
      id: uniqueId,
      title: input.title.trim(),
      image_path: primaryImagePath,
      media_type: 'composite',
      layout_config: serializedLayout,
      thumbnail_path: primaryImagePath,
      video_loop_count: 1,
      allow_audio: Boolean(input.allow_audio),
      qr_url: safeQrUrl,
      qr_label: input.qr_label?.trim() || null,
      qr_position: input.qr_position ?? 'bottom-left',
      qr_start_at: input.qr_start_at || null,
      qr_end_at: input.qr_end_at || null,
      start_at: input.start_at,
      end_at: resolvedEndAt,
      duration_seconds: input.duration_seconds,
      recurring_schedule: input.recurring_schedule ?? null,
      display_order: order,
      is_active: true,
      created_at: nowIso,
    });
    return order;
  });

  eventBus.emitEvent('POSTERS_UPDATED', { timestamp: nowIso, action: 'create', posterId: uniqueId });

  return {
    id: uniqueId,
    title: input.title.trim(),
    image_path: primaryImagePath,
    media_type: 'composite',
    layout_config: serializedLayout,
    thumbnail_path: primaryImagePath,
    video_loop_count: 1,
    allow_audio: Boolean(input.allow_audio),
    qr_url: safeQrUrl ?? undefined,
    qr_label: input.qr_label?.trim() || undefined,
    qr_position: input.qr_position ?? 'bottom-left',
    start_at: input.start_at,
    end_at: resolvedEndAt,
    duration_seconds: input.duration_seconds,
    recurring_schedule: input.recurring_schedule ?? null,
    display_order: nextOrder,
    is_active: true,
    created_at: nowIso,
  };
}
