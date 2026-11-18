/**
 * Database Default Seeding & Production Poster Restoration
 * MosqueSignage (TV)
 */

import fs from 'node:fs';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { db, initializeTables, sqlite } from './client';
import {
  settingsTable,
  postersTable,
  jummahShiftsTable,
  tickerMessagesTable,
} from './schema';
import { DEFAULT_POSTERS_CONFIG } from './default-posters';
import {
  buildDefaultPostersRows,
  buildDefaultSettingsRow,
  buildDefaultTickerRows,
  DEFAULT_JUMMAH_SHIFTS_ROWS,
} from './seed-records';

export function ensureDefaultPosterAssets(baseDir: string = process.cwd()): void {
  const envUploads = baseDir === process.cwd() ? process.env['UPLOADS_DIR']?.trim() : undefined;
  const uploadsDir = envUploads ? path.resolve(envUploads) : path.resolve(baseDir, 'public/uploads');
  if (!fs.existsSync(/*turbopackIgnore: true*/ uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const seedAssetsDir = fs.existsSync(/*turbopackIgnore: true*/ path.resolve(baseDir, 'public/seed-assets'))
    ? path.resolve(baseDir, 'public/seed-assets')
    : path.resolve(process.cwd(), 'public/seed-assets');

  for (const fileName of ['Mosque_Signage_Welcome.webp', 'Mosque_Signage_Ramadan.webp']) {
    const targetFile = path.join(/*turbopackIgnore: true*/ uploadsDir, fileName);
    const sourceFile = path.join(/*turbopackIgnore: true*/ seedAssetsDir, fileName);
    if (!fs.existsSync(/*turbopackIgnore: true*/ targetFile) && fs.existsSync(/*turbopackIgnore: true*/ sourceFile)) {
      try {
        fs.copyFileSync(sourceFile, targetFile);
      } catch {
        // Ignore file copy failures in restricted environments
      }
    }
  }

  for (const svgFile of ['default-welcome.svg', 'default-event.svg']) {
    const fullPath = path.join(/*turbopackIgnore: true*/ uploadsDir, svgFile);
    if (fs.existsSync(/*turbopackIgnore: true*/ fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch {
        // Ignore deletion errors in restricted environments
      }
    }
  }
}

async function syncDefaultPosterMetadata(): Promise<void> {
  const defaults = [DEFAULT_POSTERS_CONFIG.welcome, DEFAULT_POSTERS_CONFIG.event];
  for (const cfg of defaults) {
    await db
      .update(postersTable)
      .set({
        title: cfg.title,
        image_path: cfg.image_path,
        qr_url: cfg.qr_url,
        qr_label: cfg.qr_label,
        duration_seconds: cfg.duration_seconds,
      })
      .where(eq(postersTable.id, cfg.id));
  }
}

export async function seedDefaults(now: Date = new Date()): Promise<void> {
  initializeTables(sqlite);
  ensureDefaultPosterAssets();

  const nowIso = now.toISOString();
  await db.insert(settingsTable).values(buildDefaultSettingsRow(nowIso)).onConflictDoNothing();
  await db.insert(postersTable).values(buildDefaultPostersRows(nowIso)).onConflictDoNothing();
  await syncDefaultPosterMetadata();
  if (DEFAULT_JUMMAH_SHIFTS_ROWS.length > 0) {
    await db.insert(jummahShiftsTable).values([...DEFAULT_JUMMAH_SHIFTS_ROWS]).onConflictDoNothing();
  }
  await db.insert(tickerMessagesTable).values(buildDefaultTickerRows(nowIso)).onConflictDoNothing();
}

const isMain = process.argv[1]?.replace(/\\/g, '/').endsWith('src/lib/db/seed.ts');
if (isMain) {
  console.log('Seeding default database values...');
  seedDefaults()
    .then(() => {
      console.log('Database seeded successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to seed database:', err);
      process.exit(1);
    });
}
