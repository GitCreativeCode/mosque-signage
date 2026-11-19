/**
 * Uploaded Media Streaming & Range Request Handler
 * MosqueSignage (TV)
 */

import fs from 'node:fs';
import path from 'node:path';
import { type NextRequest, NextResponse } from 'next/server';
import { getUploadDir } from './media-storage';

export const MIME_MAP: Record<string, string> = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.ogg': 'video/ogg',
  '.json': 'application/json',
};

/**
 * Streams an uploaded media asset from disk, supporting HTTP byte-range requests for videos
 * and streaming responses with proper cache headers.
 */
export function serveMediaFile(
  request: NextRequest,
  relativeSegments: readonly string[]
): Response {
  if (!relativeSegments || relativeSegments.length === 0) {
    return NextResponse.json({ error: 'Missing file path.' }, { status: 400 });
  }

  const relativePath = relativeSegments.join('/');
  if (relativePath.includes('..') || relativePath.includes('\0')) {
    return NextResponse.json({ error: 'Invalid file path.' }, { status: 400 });
  }

  const uploadDir = getUploadDir();
  const filePath = path.resolve(uploadDir, relativePath);

  // Security guard: Ensure target path is strictly contained within uploads directory
  if (!filePath.startsWith(uploadDir)) {
    return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Media file not found.' }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  if (!stat.isFile()) {
    return NextResponse.json({ error: 'Requested path is not a file.' }, { status: 400 });
  }

  const fileSize = stat.size;
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_MAP[ext] ?? 'application/octet-stream';
  const rangeHeader = request.headers.get('range');

  if (rangeHeader && rangeHeader.startsWith('bytes=')) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0] ?? '0', 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      return new Response(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${fileSize}` },
      });
    }

    const chunkSize = end - start + 1;
    const stream = fs.createReadStream(filePath, { start, end });
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
      cancel() {
        stream.destroy();
      },
    });

    return new Response(webStream, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize.toString(),
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  const nodeStream = fs.createReadStream(filePath);
  const readable = new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk) => controller.enqueue(chunk));
      nodeStream.on('end', () => controller.close());
      nodeStream.on('error', (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });

  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Length': fileSize.toString(),
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

