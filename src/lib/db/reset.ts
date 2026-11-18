/**
 * Core Disaster Recovery & Factory Reset Engine (Internal Non-RPC)
 * MosqueSignage (TV)
 */

import fs from 'node:fs';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { db } from './client';
import {
  settingsTable,
  postersTable,
  prayerOverridesTable,
  prayerRulesTable,
  annualSchedulesTable,
  jummahShiftsTable,
  tickerMessagesTable,
} from './schema';
import { runSerializedTransaction } from './tx';
import { eventBus } from '@/lib/events/event-bus';
import { ensureDefaultPosterAssets } from './seed';
import {
  buildDefaultPostersRows,
  buildDefaultSettingsRow,
  buildDefaultTickerRows,
  DEFAULT_JUMMAH_SHIFTS_ROWS,
} from './seed-records';

export interface FactoryResetOptions {
  readonly dbOverride?: typeof db | undefined;
  readonly uploadsDirOverride?: string | undefined;
  readonly now?: Date | undefined;
}

const PRESERVED_UPLOAD_NAMES = new Set([
  'posters',
  'frames',
  'Mosque_Signage_Welcome.webp',
  'Mosque_Signage_Ramadan.webp',
]);

function shouldPreserveUploadEntry(entryName: string): boolean {
  return (
    PRESERVED_UPLOAD_NAMES.has(entryName) ||
    entryName.startsWith('.') ||
    entryName.startsWith('default-') ||
    entryName.endsWith('.md')
  );
}

function removeSingleUploadEntry(fullPath: string, isDirectory: boolean): void {
  try {
    if (isDirectory) fs.rmSync(fullPath, { recursive: true, force: true });
    else fs.unlinkSync(fullPath);
  } catch {
    // Ignore individual unlink errors
  }
}

function purgeCustomUploadFiles(targetUploadsDir: string): void {
  if (!fs.existsSync(targetUploadsDir)) return;
  try {
    const entries = fs.readdirSync(targetUploadsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (shouldPreserveUploadEntry(entry.name)) continue;
      removeSingleUploadEntry(path.join(targetUploadsDir, entry.name), entry.isDirectory());
    }
  } catch {
    // Ignore directory scan errors
  }
}

interface ExistingAuthInfo {
  readonly pinHash: string | null;
  readonly pinSalt: string | null;
  readonly sessionVersion: number;
}

async function readExistingAuthInfo(targetDb: typeof db): Promise<ExistingAuthInfo> {
  try {
    const rows = await targetDb.select().from(settingsTable).where(eq(settingsTable.id, 'global'));
    const first = rows[0];
    return {
      pinHash: first?.admin_pin_hash ?? null,
      pinSalt: first?.admin_pin_salt ?? null,
      sessionVersion: first?.session_version ?? 1,
    };
  } catch {
    return { pinHash: null, pinSalt: null, sessionVersion: 1 };
  }
}

export async function executeFactoryResetCore(
  options?: FactoryResetOptions
): Promise<{ sessionVersion: number }> {
  const targetDb = options?.dbOverride ?? db;
  const targetUploadsDir = options?.uploadsDirOverride ?? path.resolve(process.cwd(), 'public/uploads');
  const authInfo = await readExistingAuthInfo(targetDb);
  const nextSessionVersion = authInfo.sessionVersion + 1;
  const nowIso = (options?.now ?? new Date()).toISOString();

  await runSerializedTransaction(targetDb, async (tx) => {
    await tx.delete(postersTable);
    await tx.delete(prayerOverridesTable);
    await tx.delete(prayerRulesTable);
    await tx.delete(annualSchedulesTable);
    await tx.delete(jummahShiftsTable);
    await tx.delete(tickerMessagesTable);
    await tx.delete(settingsTable);

    await tx.insert(settingsTable).values(
      buildDefaultSettingsRow(
        nowIso,
        { hash: authInfo.pinHash, salt: authInfo.pinSalt },
        nextSessionVersion
      )
    );
    await tx.insert(postersTable).values(buildDefaultPostersRows(nowIso));
    if (DEFAULT_JUMMAH_SHIFTS_ROWS.length > 0) {
      await tx.insert(jummahShiftsTable).values([...DEFAULT_JUMMAH_SHIFTS_ROWS]);
    }
    await tx.insert(tickerMessagesTable).values(buildDefaultTickerRows(nowIso));
  });

  purgeCustomUploadFiles(targetUploadsDir);
  try {
    ensureDefaultPosterAssets(path.resolve(targetUploadsDir, '../..'));
  } catch {
    // Ignore in mock test environments
  }

  if (!options?.dbOverride) {
    eventBus.emitEvent('RELOAD_DISPLAY', {
      timestamp: nowIso,
      reason: 'Factory reset completed',
    });
  }

  return { sessionVersion: nextSessionVersion };
}
