/**
 * Local Media Storage, Sharp WebP Optimization & Path Sanitization
 * MosqueSignage (TV)
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {
  isSupportedImageMime,
  isSupportedVideoMime,
  isVideoMedia,
  validateMediaFileSize,
} from '@/lib/engine/video-engine';
import { validateMediaMagicNumbers } from './media-validation';

/**
 * Resolves the active uploads directory, honoring UPLOADS_DIR for isolated test runs.
 */
export function getUploadDir(): string {
  const override = process.env['UPLOADS_DIR']?.trim();
  const dir = override ? path.resolve(override) : path.resolve(process.cwd(), 'public/uploads');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export const UPLOAD_DIR = getUploadDir();

const ALLOWED_VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov', '.ogg']);
const ALLOWED_IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const PROTECTED_SEED_FILENAMES = new Set([
  'Mosque_Signage_Welcome.webp',
  'Mosque_Signage_Ramadan.webp',
]);

export interface PreparedMediaWrite {
  readonly diskFileName: string;
  readonly relativePath: string;
  readonly thumbnailPath: string | null;
  readonly isVideo: boolean;
}

export function assertValidPosterId(posterId: string): string {
  if (
    !posterId ||
    !/^[a-zA-Z0-9_-]{1,64}$/.test(posterId) ||
    posterId.includes('..') ||
    posterId.includes('/') ||
    posterId.includes('\\')
  ) {
    throw new Error('Invalid poster identifier format.');
  }
  return path.basename(posterId);
}

export function isProtectedSeedAsset(relativePath?: string | null): boolean {
  if (!relativePath) return false;
  if (relativePath.startsWith('/seed-assets/')) return true;
  const baseName = path.basename(relativePath);
  return baseName.startsWith('default-') || PROTECTED_SEED_FILENAMES.has(baseName);
}

export function safeUnlinkUploadRelative(relativePath?: string | null): void {
  if (!relativePath || isProtectedSeedAsset(relativePath)) return;
  const baseName = path.basename(relativePath);
  if (!baseName) return;
  const diskPath = path.join(getUploadDir(), baseName);
  if (!fs.existsSync(diskPath)) return;
  try {
    fs.unlinkSync(diskPath);
  } catch (err) {
    console.warn('Failed to delete physical file:', diskPath, err);
  }
}

export function toNodeBuffer(raw: Buffer | Uint8Array | ArrayBuffer): Buffer {
  return Buffer.isBuffer(raw) ? raw : Buffer.from(raw as ArrayBuffer);
}

export function validateIncomingMedia(
  fileBuffer: Buffer | Uint8Array | ArrayBuffer,
  fileName: string,
  mimeType: string
): { buffer: Buffer; isVideo: boolean } {
  const isVideo = isVideoMedia(mimeType, fileName);
  const rawExt = path.extname(fileName).toLowerCase();

  if (isVideo && !isSupportedVideoMime(mimeType) && !isVideoMedia(undefined, fileName)) {
    throw new Error('Invalid video format. Supported formats: MP4, WebM, QuickTime (.mov), and Ogg.');
  }
  if (!isVideo && !isSupportedImageMime(mimeType)) {
    throw new Error('Invalid file type. Only PNG, JPEG, WebP images and MP4, WebM, MOV videos are permitted.');
  }
  if (!isVideo && rawExt && !ALLOWED_IMAGE_EXTS.has(rawExt)) {
    throw new Error('Invalid image file extension. Supported extensions: .png, .jpg, .jpeg, .webp.');
  }

  const buffer = toNodeBuffer(fileBuffer);
  const magic = validateMediaMagicNumbers(buffer, isVideo);
  if (!magic.valid) {
    throw new Error(magic.error ?? 'Invalid media file format.');
  }
  const size = validateMediaFileSize(buffer.length, isVideo);
  if (!size.valid) {
    throw new Error(size.error ?? 'File size exceeds maximum permitted limit.');
  }
  return { buffer, isVideo };
}

async function writeVideoThumbnailWebp(
  prefix: string,
  thumbnailBuffer?: Buffer | Uint8Array | ArrayBuffer
): Promise<string | null> {
  if (!thumbnailBuffer) return null;
  try {
    const processed = await sharp(toNodeBuffer(thumbnailBuffer))
      .resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    const thumbFileName = `${prefix}-thumb.webp`;
    await fs.promises.writeFile(path.join(getUploadDir(), thumbFileName), processed);
    return `/uploads/${thumbFileName}`;
  } catch (err) {
    console.warn('Failed saving video thumbnail:', err);
    return null;
  }
}

export async function processAndWriteMediaAsset(
  fileBuffer: Buffer | Uint8Array | ArrayBuffer,
  fileName: string,
  mimeType: string,
  thumbnailBuffer?: Buffer | Uint8Array | ArrayBuffer,
  filePrefix: string = crypto.randomUUID()
): Promise<PreparedMediaWrite> {
  const { buffer, isVideo } = validateIncomingMedia(fileBuffer, fileName, mimeType);
  const uploadDir = getUploadDir();

  if (isVideo) {
    const rawExt = path.extname(fileName).toLowerCase();
    const safeExt = ALLOWED_VIDEO_EXTS.has(rawExt) ? rawExt : '.mp4';
    const diskFileName = `${filePrefix}${safeExt}`;
    await fs.promises.writeFile(path.join(uploadDir, diskFileName), buffer);
    const thumbnailPath = await writeVideoThumbnailWebp(filePrefix, thumbnailBuffer);
    return { diskFileName, relativePath: `/uploads/${diskFileName}`, thumbnailPath, isVideo: true };
  }

  let optimized: Buffer;
  try {
    optimized = await sharp(buffer)
      .resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
  } catch (err) {
    console.error('Sharp optimization failed for valid image format:', err);
    throw new Error(`Failed to process and optimize image: ${err instanceof Error ? err.message : String(err)}`);
  }

  const diskFileName = `${filePrefix}.webp`;
  await fs.promises.writeFile(path.join(uploadDir, diskFileName), optimized);
  return { diskFileName, relativePath: `/uploads/${diskFileName}`, thumbnailPath: null, isVideo: false };
}
