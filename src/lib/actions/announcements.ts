'use server';

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { postersTable } from '@/lib/db/schema';
import { runSerializedTransaction } from '@/lib/db/tx';
import { eventBus } from '@/lib/events/event-bus';
import { LITURGICAL_THEMES } from '@/lib/posters/notice-themes';
import { assertValidPosterId, getUploadDir, safeUnlinkUploadRelative } from '@/lib/posters/media-storage';
import {
  extractDescriptionFromSvg,
  extractThemeFromSvg,
  generateNoticeSvg,
} from '@/lib/posters/svg-generator';
import type { NoticeTheme, Poster, QrPosition } from '@/types/index';
import { requireAdminAuth } from './auth';

export interface CreateAnnouncementInput {
  readonly headline: string;
  readonly description: string;
  readonly theme?: NoticeTheme | undefined;
  readonly qr_url?: string | undefined;
  readonly qr_label?: string | undefined;
  readonly qr_position?: QrPosition | undefined;
  readonly qr_start_at?: string | null | undefined;
  readonly qr_end_at?: string | null | undefined;
  readonly start_at: string;
  readonly end_at?: string | null | undefined;
  readonly duration_seconds?: number | undefined;
  readonly recurring_schedule?: string | null | undefined;
}

export interface AnnouncementDetails {
  readonly headline: string;
  readonly description: string;
  readonly theme: NoticeTheme;
}

export interface UpdateAnnouncementInput {
  readonly id: string;
  readonly headline: string;
  readonly description: string;
  readonly theme: NoticeTheme;
  readonly start_at: string;
  readonly end_at?: string | null | undefined;
  readonly duration_seconds: number;
  readonly qr_url?: string | undefined;
  readonly qr_label?: string | undefined;
  readonly qr_position?: QrPosition | undefined;
  readonly qr_start_at?: string | null | undefined;
  readonly qr_end_at?: string | null | undefined;
  readonly recurring_schedule?: string | null | undefined;
}

export async function createAnnouncementSlide(input: CreateAnnouncementInput): Promise<Poster> {
  await requireAdminAuth();
  const uniqueId = crypto.randomUUID();
  const diskFileName = `announcement-${uniqueId}.svg`;
  const diskFilePath = path.join(getUploadDir(), diskFileName);
  const selectedTheme = input.theme && input.theme in LITURGICAL_THEMES ? input.theme : 'sapphire';
  const svgContent = generateNoticeSvg({
    headline: input.headline,
    description: input.description,
    theme: selectedTheme,
  });

  try {
    await fs.promises.writeFile(diskFilePath, svgContent, 'utf-8');
  } catch (err: unknown) {
    throw new Error(`Failed to save announcement SVG: ${err instanceof Error ? err.message : String(err)}`);
  }

  const relativePath = `/uploads/${diskFileName}`;
  const nowIso = new Date().toISOString();
  const resolvedEndAt = input.end_at || null;
  let nextOrder = 0;

  try {
    nextOrder = await runSerializedTransaction(db, async (tx) => {
      const maxOrderRes = await tx
        .select({ maxOrder: sql<number>`COALESCE(MAX(${postersTable.display_order}), -1)` })
        .from(postersTable);
      const order = (maxOrderRes[0]?.maxOrder ?? -1) + 1;
      await tx.insert(postersTable).values({
        id: uniqueId,
        title: input.headline.trim(),
        image_path: relativePath,
        qr_url: input.qr_url?.trim() || null,
        qr_label: input.qr_label?.trim() || null,
        qr_position: input.qr_position ?? 'bottom-left',
        qr_start_at: input.qr_start_at || null,
        qr_end_at: input.qr_end_at || null,
        start_at: input.start_at,
        end_at: resolvedEndAt,
        duration_seconds: input.duration_seconds ?? 15,
        recurring_schedule: input.recurring_schedule ?? null,
        display_order: order,
        is_active: true,
        created_at: nowIso,
      });
      return order;
    });
  } catch (insertErr) {
    safeUnlinkUploadRelative(relativePath);
    throw insertErr;
  }

  eventBus.emitEvent('POSTERS_UPDATED', { timestamp: nowIso, action: 'create', posterId: uniqueId });

    return {
      id: uniqueId,
      title: input.headline.trim(),
      image_path: relativePath,
      qr_url: input.qr_url?.trim() || undefined,
      qr_label: input.qr_label?.trim() || undefined,
      qr_position: input.qr_position ?? 'bottom-left',
      qr_start_at: input.qr_start_at ?? null,
      qr_end_at: input.qr_end_at ?? null,
      start_at: input.start_at,
      end_at: resolvedEndAt,
      duration_seconds: input.duration_seconds ?? 15,
      recurring_schedule: input.recurring_schedule ?? null,
      display_order: nextOrder,
      created_at: nowIso,
    };
}

export async function getAnnouncementDetails(posterId: string): Promise<AnnouncementDetails | null> {
  const safeId = assertValidPosterId(posterId);
  const existing = await db.select().from(postersTable).where(eq(postersTable.id, safeId));
  const poster = existing[0];
  if (!poster || !poster.image_path) return null;

  const diskFilePath = path.join(getUploadDir(), path.basename(poster.image_path));
  let description = '';
  let theme: NoticeTheme = 'sapphire';

  if (fs.existsSync(diskFilePath)) {
    try {
      const content = await fs.promises.readFile(diskFilePath, 'utf-8');
      theme = extractThemeFromSvg(content);
      description = extractDescriptionFromSvg(content);
    } catch (err) {
      console.warn('Failed reading announcement SVG:', diskFilePath, err);
    }
  }
  return { headline: poster.title, description, theme };
}

export async function updateAnnouncementSlide(input: UpdateAnnouncementInput): Promise<void> {
  await requireAdminAuth();
  const safeId = assertValidPosterId(input.id);
  const existing = await db.select().from(postersTable).where(eq(postersTable.id, safeId));
  const poster = existing[0];
  if (!poster) throw new Error('Notice poster not found.');

  const selectedTheme = input.theme && input.theme in LITURGICAL_THEMES ? input.theme : 'sapphire';
  const diskFileName = `announcement-${safeId}-${Date.now()}.svg`;
  const relativePath = `/uploads/${diskFileName}`;
  const svgContent = generateNoticeSvg({
    headline: input.headline,
    description: input.description,
    theme: selectedTheme,
  });

  await fs.promises.writeFile(path.join(getUploadDir(), diskFileName), svgContent, 'utf-8');

  try {
    await db
      .update(postersTable)
      .set({
        title: input.headline.trim(),
        image_path: relativePath,
        start_at: input.start_at,
        end_at: input.end_at || null,
        duration_seconds: input.duration_seconds,
        qr_url: input.qr_url?.trim() || null,
        qr_label: input.qr_label?.trim() || null,
        qr_start_at: input.qr_start_at !== undefined ? (input.qr_start_at || null) : undefined,
        qr_end_at: input.qr_end_at !== undefined ? (input.qr_end_at || null) : undefined,
        ...(input.qr_position !== undefined ? { qr_position: input.qr_position } : {}),
        ...(input.recurring_schedule !== undefined ? { recurring_schedule: input.recurring_schedule } : {}),
      })
      .where(eq(postersTable.id, safeId));
  } catch (updateErr) {
    safeUnlinkUploadRelative(relativePath);
    throw updateErr;
  }

  safeUnlinkUploadRelative(poster.image_path);
  eventBus.emitEvent('POSTERS_UPDATED', {
    timestamp: new Date().toISOString(),
    action: 'update',
    posterId: safeId,
  });
}
