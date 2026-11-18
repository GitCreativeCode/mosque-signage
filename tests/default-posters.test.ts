import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { ensureDefaultPosterAssets } from '@/lib/db/seed';
import { DEFAULT_POSTERS_CONFIG } from '@/lib/db/default-posters';

describe('Default Onboarding Raster Assets & Kiosk Preview Verification', () => {
  const uploadsDir = path.resolve(process.cwd(), 'public/uploads');
  const welcomeWebpPath = path.join(uploadsDir, 'Mosque_Signage_Welcome.webp');
  const ramadanWebpPath = path.join(uploadsDir, 'Mosque_Signage_Ramadan.webp');
  const previewPngPath = path.resolve(process.cwd(), 'public/kiosk-preview.png');
  const previewSvgPath = path.resolve(process.cwd(), 'public/kiosk-preview.svg');

  it('validates production-ready Mosque_Signage_Welcome.webp raster asset format and 1080p dimensions', async () => {
    expect(fs.existsSync(welcomeWebpPath)).toBe(true);
    const stats = fs.statSync(welcomeWebpPath);
    expect(stats.size).toBeGreaterThan(50000); // Production raster asset check

    const meta = await sharp(welcomeWebpPath).metadata();
    expect(meta.width).toBe(1920);
    expect(meta.height).toBe(1080);
    expect(meta.format).toBe('webp');
  });

  it('validates production-ready Mosque_Signage_Ramadan.webp raster asset format and 1080p dimensions', async () => {
    expect(fs.existsSync(ramadanWebpPath)).toBe(true);
    const stats = fs.statSync(ramadanWebpPath);
    expect(stats.size).toBeGreaterThan(50000); // Production raster asset check

    const meta = await sharp(ramadanWebpPath).metadata();
    expect(meta.width).toBe(1920);
    expect(meta.height).toBe(1080);
    expect(meta.format).toBe('webp');
  });

  it('guarantees ensureDefaultPosterAssets purges legacy SVG placeholders and restores missing seed assets', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mosque_raster_test_'));
    const tempUploads = path.join(tempDir, 'public', 'uploads');
    fs.mkdirSync(tempUploads, { recursive: true });

    // Place legacy SVG files
    fs.writeFileSync(path.join(tempUploads, 'default-welcome.svg'), '<svg></svg>', 'utf-8');
    fs.writeFileSync(path.join(tempUploads, 'default-event.svg'), '<svg></svg>', 'utf-8');

    ensureDefaultPosterAssets(tempDir);

    expect(fs.existsSync(tempUploads)).toBe(true);
    expect(fs.existsSync(path.join(tempUploads, 'default-welcome.svg'))).toBe(false);
    expect(fs.existsSync(path.join(tempUploads, 'default-event.svg'))).toBe(false);
    // Verified restoration from root public/seed-assets
    expect(fs.existsSync(path.join(tempUploads, 'Mosque_Signage_Welcome.webp'))).toBe(true);
    expect(fs.existsSync(path.join(tempUploads, 'Mosque_Signage_Ramadan.webp'))).toBe(true);

    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('validates DEFAULT_POSTERS_CONFIG points to raster WebP assets with proper attributes', () => {
    expect(DEFAULT_POSTERS_CONFIG.welcome.id).toBe('poster-1');
    expect(DEFAULT_POSTERS_CONFIG.welcome.title).toBe('Welcome to the Community Center');
    expect(DEFAULT_POSTERS_CONFIG.welcome.image_path).toBe('/uploads/Mosque_Signage_Welcome.webp');
    expect(DEFAULT_POSTERS_CONFIG.welcome.qr_url).toBeNull();
    expect(DEFAULT_POSTERS_CONFIG.welcome.duration_seconds).toBe(15);

    expect(DEFAULT_POSTERS_CONFIG.event.id).toBe('poster-2');
    expect(DEFAULT_POSTERS_CONFIG.event.title).toBe('Holy Month of Ramadan');
    expect(DEFAULT_POSTERS_CONFIG.event.image_path).toBe('/uploads/Mosque_Signage_Ramadan.webp');
    expect(DEFAULT_POSTERS_CONFIG.event.qr_url).toBeNull();
    expect(DEFAULT_POSTERS_CONFIG.event.duration_seconds).toBe(20);
  });

  it('validates public/kiosk-preview.png is an authentic 1080p raster screenshot and legacy SVG is removed', async () => {
    expect(fs.existsSync(previewPngPath)).toBe(true);
    expect(fs.existsSync(previewSvgPath)).toBe(false);

    const stats = fs.statSync(previewPngPath);
    expect(stats.size).toBeGreaterThan(100000); // Authentic 1080p screenshot size check

    const meta = await sharp(previewPngPath).metadata();
    expect(meta.width).toBe(1920);
    expect(meta.height).toBe(1080);
    expect(meta.format).toBe('png');
  });

  it('verifies root README.md embeds kiosk-preview.png cleanly beneath the main title', () => {
    const readmePath = path.resolve(process.cwd(), 'README.md');
    const readmeContent = fs.readFileSync(readmePath, 'utf-8');
    expect(readmeContent).toContain('![MosqueSignage 1080p Kiosk Interface Preview](public/kiosk-preview.png)');
  });
});
