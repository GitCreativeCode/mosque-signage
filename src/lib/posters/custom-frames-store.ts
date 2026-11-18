/**
 * Custom Transparent PNG/SVG Frame Asset Storage
 * MosqueSignage (TV)
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { assertValidPosterId, getUploadDir, toNodeBuffer } from './media-storage';
import { validateMediaMagicNumbers } from './media-validation';

export interface CustomFrameItem {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly created_at: string;
}

export interface UploadCustomFrameInput {
  readonly fileBuffer: Buffer | Uint8Array | ArrayBuffer;
  readonly fileName: string;
  readonly mimeType: string;
  readonly name?: string | undefined;
}

const MAX_FRAME_BYTES = 5 * 1024 * 1024;
const UNSAFE_SVG_PATTERN =
  /<script\b|<foreignObject\b|<iframe\b|<object\b|<embed\b|<style\b|<animate[a-z]*\b|<set\b|<handler\b|<listener\b|<!DOCTYPE\b|<!ENTITY\b|&#|xmlns\s*=\s*["'][^"']*xhtml|[\s/>]on[a-z]+\s*=|javascript:|vbscript:|data:|url\s*\(|@import/i;
const EXTERNAL_SVG_REF_PATTERN = /<(?:use|image|a)\b[^>]*\b(?:xlink:)?href\s*=\s*["']\s*(?:https?:|\/\/)/i;

let metaQueue: Promise<unknown> = Promise.resolve();

function getFramesPaths(): { dir: string; metaFile: string } {
  const dir = path.join(/*turbopackIgnore: true*/ getUploadDir(), 'frames');
  return { dir, metaFile: path.join(/*turbopackIgnore: true*/ dir, 'frames.json') };
}

function enqueueMetaWrite<T>(task: () => Promise<T>): Promise<T> {
  const next = metaQueue.then(task);
  metaQueue = next.catch(() => undefined);
  return next;
}

function validateCustomFramePayload(buffer: Buffer, isSvg: boolean): void {
  if (buffer.length > MAX_FRAME_BYTES) {
    throw new Error('Frame file size exceeds 5MB limit.');
  }
  if (!isSvg) {
    const magic = validateMediaMagicNumbers(buffer, false);
    if (!magic.valid || magic.detectedType !== 'png') {
      throw new Error('Invalid PNG frame: file header does not match PNG magic bytes.');
    }
    return;
  }

  const rawText = buffer.toString('utf-8').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
  if (!/<svg[\s>]/i.test(rawText)) {
    throw new Error('Invalid SVG frame: missing root <svg> element.');
  }
  if (UNSAFE_SVG_PATTERN.test(rawText) || EXTERNAL_SVG_REF_PATTERN.test(rawText)) {
    throw new Error('SVG frame rejected: active scripts, event handlers, or external refs are not permitted.');
  }
}

export async function readCustomFramesMeta(): Promise<CustomFrameItem[]> {
  try {
    const { dir, metaFile } = getFramesPaths();
    if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) await fs.promises.mkdir(dir, { recursive: true });
    if (!fs.existsSync(/*turbopackIgnore: true*/ metaFile)) return [];
    const parsed: unknown = JSON.parse(await fs.promises.readFile(/*turbopackIgnore: true*/ metaFile, 'utf-8'));
    return Array.isArray(parsed) ? (parsed as CustomFrameItem[]) : [];
  } catch {
    return [];
  }
}

async function writeCustomFramesMeta(frames: readonly CustomFrameItem[]): Promise<void> {
  const { dir, metaFile } = getFramesPaths();
  if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(/*turbopackIgnore: true*/ metaFile, JSON.stringify(frames, null, 2), 'utf-8');
}

export async function storeCustomFrameFile(input: UploadCustomFrameInput): Promise<CustomFrameItem> {
  const lowerExt = path.extname(input.fileName).toLowerCase();
  const isPng = input.mimeType === 'image/png' || lowerExt === '.png';
  const isSvg = input.mimeType === 'image/svg+xml' || lowerExt === '.svg';
  if (!isPng && !isSvg) throw new Error('Only transparent PNG or SVG frame files are permitted.');

  const buffer = toNodeBuffer(input.fileBuffer);
  validateCustomFramePayload(buffer, isSvg);

  const id = crypto.randomUUID();
  const fileName = `${id}${isSvg ? '.svg' : '.png'}`;
  const { dir } = getFramesPaths();
  if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) await fs.promises.mkdir(dir, { recursive: true });
  const diskPath = path.join(/*turbopackIgnore: true*/ dir, fileName);
  await fs.promises.writeFile(/*turbopackIgnore: true*/ diskPath, buffer);

  const cleanName = input.name?.trim() || input.fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const newFrame: CustomFrameItem = {
    id,
    name: cleanName || 'Custom Frame',
    url: `/uploads/frames/${fileName}`,
    created_at: new Date().toISOString(),
  };

  try {
    await enqueueMetaWrite(async () => {
      const frames = await readCustomFramesMeta();
      await writeCustomFramesMeta([newFrame, ...frames]);
    });
  } catch (err) {
    await fs.promises.unlink(diskPath).catch(() => undefined);
    throw err;
  }
  return newFrame;
}

export async function removeCustomFrameFile(frameId: string): Promise<void> {
  const safeId = assertValidPosterId(frameId);
  const { dir } = getFramesPaths();

  const targetUrl = await enqueueMetaWrite(async () => {
    const frames = await readCustomFramesMeta();
    const target = frames.find((f) => f.id === safeId);
    if (!target) return null;
    await writeCustomFramesMeta(frames.filter((f) => f.id !== safeId));
    return target.url;
  });

  if (!targetUrl) return;
  const filePath = path.join(dir, path.basename(targetUrl));
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath).catch((err) => {
      console.warn('Failed deleting frame file:', err);
    });
  }
}
