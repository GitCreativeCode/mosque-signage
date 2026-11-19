import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { NextRequest } from 'next/server';
import { serveMediaFile, MIME_MAP } from '@/lib/posters/media-serve';

describe('Media Streaming & Dynamic Upload Serving', () => {
  let tmpUploadDir: string;
  const originalEnvUploads = process.env['UPLOADS_DIR'];

  beforeEach(() => {
    tmpUploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'media-serve-test-'));
    process.env['UPLOADS_DIR'] = tmpUploadDir;
  });

  afterEach(() => {
    if (originalEnvUploads !== undefined) {
      process.env['UPLOADS_DIR'] = originalEnvUploads;
    } else {
      delete process.env['UPLOADS_DIR'];
    }
    try {
      fs.rmSync(tmpUploadDir, { recursive: true, force: true });
    } catch {}
  });

  it('rejects missing or empty path segments with 400', async () => {
    const req = new NextRequest('http://localhost:3000/uploads');
    const res = serveMediaFile(req, []);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Missing file path');
  });

  it('rejects path traversal attacks with 400 or 403', async () => {
    const req1 = new NextRequest('http://localhost:3000/uploads/../secret.txt');
    const res1 = serveMediaFile(req1, ['..', 'secret.txt']);
    expect([400, 403]).toContain(res1.status);

    const req2 = new NextRequest('http://localhost:3000/uploads/subdir/../../etc/passwd');
    const res2 = serveMediaFile(req2, ['subdir', '..', '..', 'etc', 'passwd']);
    expect([400, 403]).toContain(res2.status);
  });

  it('returns 404 for non-existent files', async () => {
    const req = new NextRequest('http://localhost:3000/uploads/missing.webp');
    const res = serveMediaFile(req, ['missing.webp']);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('Media file not found');
  });

  it('serves an uploaded image with status 200, proper Content-Type, and cache headers', async () => {
    const sampleWebp = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
    const filePath = path.join(tmpUploadDir, 'test-poster.webp');
    fs.writeFileSync(filePath, sampleWebp);

    const req = new NextRequest('http://localhost:3000/uploads/test-poster.webp');
    const res = serveMediaFile(req, ['test-poster.webp']);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/webp');
    expect(res.headers.get('Content-Length')).toBe(String(sampleWebp.length));
    expect(res.headers.get('Cache-Control')).toContain('public');
  });

  it('serves an announcement SVG with image/svg+xml Content-Type', async () => {
    const sampleSvg = '<svg xmlns="http://www.w3.org/2000/svg"><text>Announcement</text></svg>';
    const filePath = path.join(tmpUploadDir, 'announcement-123.svg');
    fs.writeFileSync(filePath, sampleSvg, 'utf-8');

    const req = new NextRequest('http://localhost:3000/uploads/announcement-123.svg');
    const res = serveMediaFile(req, ['announcement-123.svg']);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/svg+xml');
  });

  it('serves nested assets like custom frames from frames/ subdirectory', async () => {
    const framesDir = path.join(tmpUploadDir, 'frames');
    fs.mkdirSync(framesDir, { recursive: true });
    const samplePng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    fs.writeFileSync(path.join(framesDir, 'custom-gold.png'), samplePng);

    const req = new NextRequest('http://localhost:3000/uploads/frames/custom-gold.png');
    const res = serveMediaFile(req, ['frames', 'custom-gold.png']);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
  });

  it('handles HTTP Range requests for video files with status 206 Partial Content', async () => {
    const videoData = Buffer.alloc(1000, 0x42);
    const videoPath = path.join(tmpUploadDir, 'clip.mp4');
    fs.writeFileSync(videoPath, videoData);

    const req = new NextRequest('http://localhost:3000/uploads/clip.mp4', {
      headers: { range: 'bytes=0-499' },
    });
    const res = serveMediaFile(req, ['clip.mp4']);
    expect(res.status).toBe(206);
    expect(res.headers.get('Content-Range')).toBe('bytes 0-499/1000');
    expect(res.headers.get('Content-Length')).toBe('500');
    expect(res.headers.get('Content-Type')).toBe('video/mp4');
  });

  it('returns 416 Range Not Satisfiable for invalid range requests', async () => {
    const videoData = Buffer.alloc(500, 0x42);
    const videoPath = path.join(tmpUploadDir, 'small.mp4');
    fs.writeFileSync(videoPath, videoData);

    const req = new NextRequest('http://localhost:3000/uploads/small.mp4', {
      headers: { range: 'bytes=1000-2000' },
    });
    const res = serveMediaFile(req, ['small.mp4']);
    expect(res.status).toBe(416);
    expect(res.headers.get('Content-Range')).toBe('bytes */500');
  });
});

