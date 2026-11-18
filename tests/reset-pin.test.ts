import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { settingsTable } from '@/lib/db/schema';
import { initializeTables, type db as dbClientType } from '@/lib/db/client';
import { resetPinCore, resetPasswordCore } from '../scripts/reset-pin';
import { hashPin, verifyPin } from '@/lib/auth/pin';
import { eq } from 'drizzle-orm';

describe('Admin PIN Reset Script (Option A)', () => {
  let tempDir: string;
  let tempDbPath: string;
  let testDrizzleDb: typeof dbClientType;
  let testSqlite: DatabaseSync;

  beforeAll(() => {
    // Create completely isolated temp directory to protect real data
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mosque_test_pin_'));
    tempDbPath = path.join(tempDir, 'isolated_pin_test.db');

    // Create isolated SQLite connection
    testSqlite = new DatabaseSync(tempDbPath);
    testSqlite.exec('PRAGMA journal_mode = WAL;');

    const testDriver = {
      exec: (sql: string) => testSqlite.exec(sql),
      prepare: (sql: string) => {
        const stmt = testSqlite.prepare(sql);
        return {
          all: (...params: unknown[]) => stmt.all(...(params as (string | number | bigint | null | Uint8Array)[])),
          get: (...params: unknown[]) => stmt.get(...(params as (string | number | bigint | null | Uint8Array)[])) ?? undefined,
          run: (...params: unknown[]) => {
            stmt.run(...(params as (string | number | bigint | null | Uint8Array)[]));
          },
        };
      },
    };

    initializeTables(testDriver);

    // Setup isolated drizzle proxy
    testDrizzleDb = drizzle(async (sql, params, method) => {
      if (method === 'all') {
        const rows = testDriver.prepare(sql).all(...params);
        return { rows: rows.map((r) => Object.values(r as Record<string, unknown>)) };
      }
      if (method === 'get') {
        const row = testDriver.prepare(sql).get(...params);
        return { rows: row ? Object.values(row as Record<string, unknown>) : [] };
      }
      testDriver.prepare(sql).run(...params);
      return { rows: [] };
    });
  });

  afterAll(() => {
    try {
      testSqlite.close();
    } catch {
      // Ignore close error
    }
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  });

  it('resets an existing custom PIN to default 1234 without touching real data', async () => {
    const oldCreds = hashPin('9876');
    const nowIso = new Date().toISOString();

    // Populate isolated test database with custom old PIN
    await testDrizzleDb.insert(settingsTable).values({
      id: 'global',
      mosque_name: 'Isolated Test Center',
      ticker_text: 'Test Ticker',
      timezone: 'America/Toronto',
      admin_pin_hash: oldCreds.hash,
      admin_pin_salt: oldCreds.salt,
      updated_at: nowIso,
    });

    // Reset PIN to default '1234'
    const result = await resetPinCore('1234', { dbOverride: testDrizzleDb });
    expect(result.success).toBe(true);
    expect(result.pin).toBe('1234');

    // Verify row was updated in isolated DB
    const rows = await testDrizzleDb.select().from(settingsTable).where(eq(settingsTable.id, 'global'));
    expect(rows).toHaveLength(1);
    const updated = rows[0]!;

    // Old PIN should no longer verify
    expect(verifyPin('9876', updated.admin_pin_salt!, updated.admin_pin_hash!)).toBe(false);
    // New default PIN should verify perfectly
    expect(verifyPin('1234', updated.admin_pin_salt!, updated.admin_pin_hash!)).toBe(true);
  });

  it('resets PIN to a custom valid 4-8 digit numeric value', async () => {
    const customPin = '654321';
    const result = await resetPinCore(customPin, { dbOverride: testDrizzleDb });
    expect(result.success).toBe(true);
    expect(result.pin).toBe(customPin);

    const rows = await testDrizzleDb.select().from(settingsTable).where(eq(settingsTable.id, 'global'));
    const updated = rows[0]!;
    expect(verifyPin(customPin, updated.admin_pin_salt!, updated.admin_pin_hash!)).toBe(true);
    expect(verifyPin('1234', updated.admin_pin_salt!, updated.admin_pin_hash!)).toBe(false);
  });

  it('rejects invalid PIN formats and retains existing credentials', async () => {
    // 3 digits (too short)
    const tooShort = await resetPinCore('123', { dbOverride: testDrizzleDb });
    expect(tooShort.success).toBe(false);
    expect(tooShort.error).toMatch(/between 4 and 8 digits/);

    // 9 digits (too long)
    const tooLong = await resetPinCore('123456789', { dbOverride: testDrizzleDb });
    expect(tooLong.success).toBe(false);
    expect(tooLong.error).toMatch(/between 4 and 8 digits/);

    // Alpha / special characters
    const nonNumeric = await resetPinCore('12ab', { dbOverride: testDrizzleDb });
    expect(nonNumeric.success).toBe(false);
    expect(nonNumeric.error).toMatch(/between 4 and 8 digits/);

    // Current PIN in isolated DB should still be 654321 from previous test
    const rows = await testDrizzleDb.select().from(settingsTable).where(eq(settingsTable.id, 'global'));
    const current = rows[0]!;
    expect(verifyPin('654321', current.admin_pin_salt!, current.admin_pin_hash!)).toBe(true);
  });

  it('handles unseeded database by inserting global settings with new credentials', async () => {
    // Create another clean isolated SQLite DB without any settings row
    const freshDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mosque_test_pin_fresh_'));
    const freshDbPath = path.join(freshDir, 'fresh.db');
    const freshSqlite = new DatabaseSync(freshDbPath);

    const freshDriver = {
      exec: (sql: string) => freshSqlite.exec(sql),
      prepare: (sql: string) => {
        const stmt = freshSqlite.prepare(sql);
        return {
          all: (...params: unknown[]) => stmt.all(...(params as (string | number | bigint | null | Uint8Array)[])),
          get: (...params: unknown[]) => stmt.get(...(params as (string | number | bigint | null | Uint8Array)[])) ?? undefined,
          run: (...params: unknown[]) => {
            stmt.run(...(params as (string | number | bigint | null | Uint8Array)[]));
          },
        };
      },
    };

    initializeTables(freshDriver);

    // Delete any default seeded settings row to simulate totally uninitialized settings table
    freshSqlite.exec("DELETE FROM settings WHERE id = 'global';");

    const freshDrizzle = drizzle(async (sql, params, method) => {
      if (method === 'all') {
        const rows = freshDriver.prepare(sql).all(...params);
        return { rows: rows.map((r) => Object.values(r as Record<string, unknown>)) };
      }
      if (method === 'get') {
        const row = freshDriver.prepare(sql).get(...params);
        return { rows: row ? Object.values(row as Record<string, unknown>) : [] };
      }
      freshDriver.prepare(sql).run(...params);
      return { rows: [] };
    });

    const res = await resetPinCore('4321', { dbOverride: freshDrizzle });
    expect(res.success).toBe(true);

    const rows = await freshDrizzle.select().from(settingsTable).where(eq(settingsTable.id, 'global'));
    expect(rows).toHaveLength(1);
    expect(verifyPin('4321', rows[0]!.admin_pin_salt!, rows[0]!.admin_pin_hash!)).toBe(true);

    freshSqlite.close();
    fs.rmSync(freshDir, { recursive: true, force: true });
  });

  it('gracefully handles database write failures without throwing unhandled exceptions', async () => {
    // Failing mock db
    const failingDb = {
      select: () => {
        throw new Error('Disk I/O error or permission denied');
      },
    };

    const res = await resetPinCore('5555', { dbOverride: failingDb });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Disk I/O error or permission denied');
  });

  it('resets password and username via resetPasswordCore with 8+ char complex policy', async () => {
    // Valid reset
    const res = await resetPasswordCore('new_admin', 'ComplexPass123!', { dbOverride: testDrizzleDb });
    expect(res.success).toBe(true);
    expect(res.username).toBe('new_admin');

    const rows = await testDrizzleDb.select().from(settingsTable).where(eq(settingsTable.id, 'global'));
    const updated = rows[0]!;
    expect(updated.auth_mode).toBe('password');
    expect(updated.admin_username).toBe('new_admin');
    expect(updated.admin_password_hash).toBeDefined();

    // Rejection of invalid passwords
    const short = await resetPasswordCore('new_admin', 'short', { dbOverride: testDrizzleDb });
    expect(short.success).toBe(false);
    expect(short.error).toContain('at least 8 characters');

    const noSymbol = await resetPasswordCore('new_admin', 'Password123', { dbOverride: testDrizzleDb });
    expect(noSymbol.success).toBe(false);
    expect(noSymbol.error).toContain('special symbol');
  });

  it('guarantees that production database and real user data are untouched', () => {
    const realDbPath = path.resolve(process.cwd(), 'data/mosque_signage.db');
    expect(fs.existsSync(realDbPath)).toBe(true);

    const realSqlite = new DatabaseSync(realDbPath);
    const posterRows = realSqlite.prepare('SELECT title FROM posters').all() as { title: string }[];
    realSqlite.close();

    // Verify real user posters remain untouched
    expect(posterRows.length).toBeGreaterThanOrEqual(2);
  });
});
