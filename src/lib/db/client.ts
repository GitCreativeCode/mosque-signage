/**
 * SQLite WAL Connection & Drizzle ORM Client
 * MosqueSignage (TV)
 */

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema';
import { recoverAudioReceiverOnBoot } from '../hardware/audio-coordinator';
import { startPrayerSilenceMonitor } from '../hardware/prayer-silence-monitor';
import { loadPrayerSilenceState } from './prayer-monitor-loader';
import { BASE_TABLES_DDL } from './migrations-ddl';
import { applyColumnMigrations, ensureDefaultAdminPin } from './migrations-columns';
import { migrateLegacyTableConstraints } from './migrations-constraints';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = process.env['DATABASE_PATH'] ?? path.join(DB_DIR, 'mosque_signage.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export interface SqliteDriver {
  exec(sql: string): void;
  prepare(sql: string): {
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): void;
  };
}

type SqliteParam = string | number | bigint | null | Uint8Array;

export function createDatabaseConnection(dbPath: string = DB_PATH): SqliteDriver {
  const syncDb = new DatabaseSync(dbPath);
  syncDb.exec('PRAGMA busy_timeout = 15000;');
  syncDb.exec('PRAGMA journal_mode = WAL;');
  syncDb.exec('PRAGMA synchronous = NORMAL;');
  return {
    exec: (sql: string) => syncDb.exec(sql),
    prepare: (sql: string) => {
      const stmt = syncDb.prepare(sql);
      return {
        all: (...params: unknown[]) => stmt.all(...(params as SqliteParam[])),
        get: (...params: unknown[]) => stmt.get(...(params as SqliteParam[])) ?? undefined,
        run: (...params: unknown[]) => {
          stmt.run(...(params as SqliteParam[]));
        },
      };
    },
  };
}

export function initializeTables(driver: SqliteDriver): void {
  driver.exec(BASE_TABLES_DDL);
  applyColumnMigrations(driver);
  ensureDefaultAdminPin(driver);
  migrateLegacyTableConstraints(driver);
}

export const sqlite = createDatabaseConnection();
initializeTables(sqlite);

if (process.env['NODE_ENV'] !== 'test' || process.env['FORCE_AUDIO_BOOT_RECOVERY']) {
  recoverAudioReceiverOnBoot(sqlite).catch((err) => {
    console.error('Audio boot recovery error:', err);
  });
}

if (process.env['NODE_ENV'] !== 'test') {
  startPrayerSilenceMonitor((now) => loadPrayerSilenceState(sqlite, now));
}

export const db = drizzle(async (sql, params, method) => {
  try {
    const stmt = sqlite.prepare(sql);
    if (method === 'all') {
      const rows = stmt.all(...params) as Record<string, unknown>[];
      return { rows: rows.map((r) => Object.values(r)) };
    }
    if (method === 'get') {
      const row = stmt.get(...params) as Record<string, unknown> | undefined;
      return { rows: row ? (Object.values(row) as unknown[]) : [] };
    }
    stmt.run(...params);
    return { rows: [] };
  } catch (error) {
    console.error('SQLite execution error:', sql, error);
    throw error;
  }
}, { schema });
