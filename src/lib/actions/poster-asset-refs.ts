/**
 * Shared Upload Asset Reference Inspection & Safe Unlink Helper
 * MosqueSignage (TV)
 */

import { db } from '@/lib/db/client';
import { postersTable } from '@/lib/db/schema';
import { safeUnlinkUploadRelative } from '@/lib/posters/media-storage';

interface ParsedAssetRefs {
  readonly background_image_path?: string;
  readonly slots?: ReadonlyArray<{ readonly asset_path?: string; readonly thumbnail_path?: string }>;
  readonly stickers?: ReadonlyArray<{ readonly asset_path?: string }>;
}

function extractLayoutAssetPaths(rawLayout: string | null): string[] {
  if (!rawLayout) return [];
  try {
    const parsed = JSON.parse(rawLayout) as ParsedAssetRefs;
    const paths: string[] = [];
    if (parsed.background_image_path) paths.push(parsed.background_image_path);
    for (const slot of parsed.slots ?? []) {
      if (slot.asset_path) paths.push(slot.asset_path);
      if (slot.thumbnail_path) paths.push(slot.thumbnail_path);
    }
    for (const sticker of parsed.stickers ?? []) {
      if (sticker.asset_path) paths.push(sticker.asset_path);
    }
    return paths;
  } catch {
    return [];
  }
}

export async function isUploadAssetReferenced(targetPath: string | null | undefined): Promise<boolean> {
  if (!targetPath) return true;
  const remaining = await db
    .select({
      image_path: postersTable.image_path,
      thumbnail_path: postersTable.thumbnail_path,
      layout_config: postersTable.layout_config,
    })
    .from(postersTable);

  return remaining.some((row) => {
    if (row.image_path === targetPath || row.thumbnail_path === targetPath) return true;
    return extractLayoutAssetPaths(row.layout_config).includes(targetPath);
  });
}

export async function unlinkPosterAssetIfUnreferenced(targetPath?: string | null): Promise<void> {
  if (!targetPath) return;
  if (await isUploadAssetReferenced(targetPath)) return;
  safeUnlinkUploadRelative(targetPath);
}

