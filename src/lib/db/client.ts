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
  close?: () => void;
}

type SqliteParam = string | number | bigint | null | Uint8Array;

export function quarantineCorruptedDb(dbPath: string): boolean {
  try {
    if (dbPath === ':memory:' || !fs.existsSync(dbPath)) return false;
    const timestamp = Date.now();
    const backupPath = `${dbPath}.corrupt.${timestamp}`;
    fs.renameSync(dbPath, backupPath);
    if (fs.existsSync(`${dbPath}-wal`)) {
      try { fs.renameSync(`${dbPath}-wal`, `${backupPath}-wal`); } catch {}
    }
    if (fs.existsSync(`${dbPath}-shm`)) {
      try { fs.renameSync(`${dbPath}-shm`, `${backupPath}-shm`); } catch {}
    }
    console.warn(`[db] Corrupted database quarantined to: ${backupPath}`);
    return true;
  } catch (quarantineErr) {
    console.error('[db] Failed to quarantine corrupted database:', quarantineErr);
    return false;
  }
}

export function createDatabaseConnection(dbPath: string = DB_PATH): SqliteDriver {
  let syncDb: DatabaseSync;
  try {
    syncDb = new DatabaseSync(dbPath);
    syncDb.exec('PRAGMA busy_timeout = 15000;');
    syncDb.exec('PRAGMA journal_mode = WAL;');
    syncDb.exec('PRAGMA synchronous = NORMAL;');
    try {
      syncDb.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    } catch {
      // Non-fatal if checkpoint is unavailable in memory mode
    }
    const checkStmt = syncDb.prepare('PRAGMA quick_check;');
    const checkRow = checkStmt.get() as Record<string, unknown> | undefined;
    const checkStatus = checkRow ? Object.values(checkRow)[0] : 'ok';
    if (checkStatus !== 'ok') {
      throw new Error(`SQLite quick_check failed: ${checkStatus}`);
    }
  } catch (err) {
    console.error('[db] SQLite connection or integrity check failed on boot:', err);
    quarantineCorruptedDb(dbPath);
    syncDb = new DatabaseSync(dbPath);
    syncDb.exec('PRAGMA busy_timeout = 15000;');
    syncDb.exec('PRAGMA journal_mode = WAL;');
    syncDb.exec('PRAGMA synchronous = NORMAL;');
  }

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
    close: () => {
      try {
        syncDb.close();
      } catch {}
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
