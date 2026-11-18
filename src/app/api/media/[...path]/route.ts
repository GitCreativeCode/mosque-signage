import fs from 'node:fs';
import path from 'node:path';
import { type NextRequest, NextResponse } from 'next/server';
import { verifyCurrentDisplaySession } from '@/lib/auth/display-pairing';
import { getUploadDir } from '@/lib/posters/media-storage';

export const dynamic = 'force-dynamic';

const MIME_MAP: Record<string, string> = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.ogg': 'video/ogg',
  '.svg': 'image/svg+xml',
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  const isAuthorized = await verifyCurrentDisplaySession();
  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Unauthorized: Display pairing or admin session required to access media.' },
      { status: 401 }
    );
  }

  const { path: segments } = await context.params;
  const fileName = path.basename(segments.join('/'));
  if (!fileName || fileName.includes('..')) {
    return NextResponse.json({ error: 'Invalid file path.' }, { status: 400 });
  }

  const uploadDir = getUploadDir();
  const filePath = path.join(uploadDir, fileName);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Media file not found.' }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const ext = path.extname(fileName).toLowerCase();
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

    const chunksize = end - start + 1;
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
        'Content-Length': chunksize.toString(),
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=86400',
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
      'Cache-Control': 'private, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

