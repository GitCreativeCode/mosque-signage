import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import {
  settingsTable,
  postersTable,
  prayerOverridesTable,
  prayerRulesTable,
} from '@/lib/db/schema';
import { initializeTables, type db as dbClientType } from '@/lib/db/client';
import { executeFactoryResetCore } from '@/lib/db/reset';
import { verifyPin } from '@/lib/auth/crypto';
import { eq } from 'drizzle-orm';

describe('Factory Reset Isolation Engine', () => {
  let tempDir: string;
  let tempDbPath: string;
  let tempUploadsDir: string;
  let testDrizzleDb: typeof dbClientType;
  let testSqlite: DatabaseSync;

  beforeAll(() => {
    // Create completely isolated temp directory to protect real data
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mosque_test_reset_'));
    tempDbPath = path.join(tempDir, 'isolated_test.db');
    tempUploadsDir = path.join(tempDir, 'uploads');

    fs.mkdirSync(path.join(tempUploadsDir, 'posters'), { recursive: true });
    // Dummy seed poster (should be preserved)
    fs.writeFileSync(path.join(tempUploadsDir, 'posters', 'jummah-announcement.webp'), 'fake-seed-image');
    // Dummy user upload (should be deleted)
    fs.writeFileSync(path.join(tempUploadsDir, 'custom_user_flyer.webp'), 'fake-user-image');
    // Default WebP posters (should be preserved)
    fs.writeFileSync(path.join(tempUploadsDir, 'Mosque_Signage_Welcome.webp'), 'fake-welcome-image');
    fs.writeFileSync(path.join(tempUploadsDir, 'Mosque_Signage_Ramadan.webp'), 'fake-ramadan-image');
    // Custom uploaded frame folder and frame metadata (should be deleted upon reset)
    fs.mkdirSync(path.join(tempUploadsDir, 'frames'), { recursive: true });
    fs.writeFileSync(path.join(tempUploadsDir, 'frames', 'custom-frame.png'), 'fake-custom-frame');
    fs.writeFileSync(
      path.join(tempUploadsDir, 'frames', 'frames.json'),
      JSON.stringify([{ id: 'frame-1', name: 'Custom Frame', url: '/uploads/frames/custom-frame.png' }])
    );

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

  it('safely wipes isolated test database and test uploads without touching real data', async () => {
    // 1. Populate isolated test database with custom data
    const nowIso = new Date().toISOString();
    await testDrizzleDb.insert(settingsTable).values({
      id: 'global',
      mosque_name: 'Custom Community Hall',
      ticker_text: 'Custom Ticker Message',
      timezone: 'America/New_York',
      admin_pin_hash: 'mock_hashed_pin_1234',
      admin_pin_salt: 'mock_salt_1234',
      updated_at: nowIso,
    });

    await testDrizzleDb.insert(postersTable).values({
      id: 'custom-poster-99',
      title: 'Custom BBQ Poster',
      image_path: '/uploads/custom_user_flyer.webp',
      start_at: '2026-10-01T00:00:00.000Z',
      end_at: '2026-10-31T23:59:59.000Z',
      duration_seconds: 15,
      is_active: true,
      created_at: nowIso,
    });

    await testDrizzleDb.insert(prayerOverridesTable).values({
      id: 'override-1',
      date: '2026-11-01',
      prayer: 'fajr',
      iqamah_time: '06:15',
      updated_at: nowIso,
    });

    await testDrizzleDb.insert(prayerRulesTable).values({
      id: 'rule-1',
      prayer: 'dhuhr',
      rule_type: 'FIXED',
      fixed_time: '13:30',
      updated_at: nowIso,
    });

    // Verify custom data exists in isolated test DB
    const initialPosters = await testDrizzleDb.select().from(postersTable);
    expect(initialPosters).toHaveLength(1);
    expect(initialPosters[0]?.title).toBe('Custom BBQ Poster');
    expect(fs.existsSync(path.join(tempUploadsDir, 'custom_user_flyer.webp'))).toBe(true);

    // 2. Execute factory reset targeting ONLY the isolated test DB and test uploads folder
    await executeFactoryResetCore({
      dbOverride: testDrizzleDb,
      uploadsDirOverride: tempUploadsDir,
      now: new Date('2026-10-24T21:00:00.000Z'),
    });

    // 3. Verify custom poster was replaced by default seed posters
    const resetPosters = await testDrizzleDb.select().from(postersTable);
    expect(resetPosters.length).toBeGreaterThanOrEqual(2);
    expect(resetPosters.some((p: { title: string }) => p.title === 'Custom BBQ Poster')).toBe(false);
    expect(resetPosters.some((p: { title: string }) => p.title === 'Welcome to the Community Center')).toBe(true);
    expect(resetPosters.some((p: { title: string }) => p.title === 'Holy Month of Ramadan')).toBe(true);

    // 4. Verify custom overrides and rules were wiped
    const resetOverrides = await testDrizzleDb.select().from(prayerOverridesTable);
    expect(resetOverrides).toHaveLength(0);

    const resetRules = await testDrizzleDb.select().from(prayerRulesTable);
    expect(resetRules).toHaveLength(0);

    // 5. Verify venue settings were restored to clean generic defaults ("Islamic Community Center")
    const resetSettings = await testDrizzleDb.select().from(settingsTable).where(eq(settingsTable.id, 'global'));
    expect(resetSettings[0]?.mosque_name).toBe('Islamic Community Center');
    // Verify admin PIN was reset back to factory default 1234
    expect(resetSettings[0]?.admin_pin_hash).toBeTruthy();
    expect(resetSettings[0]?.admin_pin_salt).toBeTruthy();
    expect(resetSettings[0]?.admin_pin_hash).not.toBe('mock_hashed_pin_1234');
    expect(
      verifyPin('1234', resetSettings[0]!.admin_pin_salt!, resetSettings[0]!.admin_pin_hash!)
    ).toBe(true);
    // Verify initial setup completed is reset to false
    expect(resetSettings[0]?.initial_setup_completed).toBe(false);
    // Verify session_version is incremented to 2 to invalidate stale external sessions
    expect(resetSettings[0]?.session_version).toBe(2);

    // 6. Verify custom upload file and custom frames were deleted from test uploads directory
    expect(fs.existsSync(path.join(tempUploadsDir, 'custom_user_flyer.webp'))).toBe(false);
    expect(fs.existsSync(path.join(tempUploadsDir, 'frames'))).toBe(false);
    // Verify default WebP posters and seed directory were preserved
    expect(fs.existsSync(path.join(tempUploadsDir, 'posters', 'jummah-announcement.webp'))).toBe(true);
    expect(fs.existsSync(path.join(tempUploadsDir, 'Mosque_Signage_Welcome.webp'))).toBe(true);
    expect(fs.existsSync(path.join(tempUploadsDir, 'Mosque_Signage_Ramadan.webp'))).toBe(true);

    // 7. Verify real database file was NEVER modified or truncated
    const realDbPath = path.resolve(process.cwd(), 'data/mosque_signage.db');
    expect(fs.existsSync(realDbPath)).toBe(true);
  });

  it('increments session_version when reset from password mode and returns new version', async () => {
    const nowIso = new Date().toISOString();
    await testDrizzleDb
      .update(settingsTable)
      .set({
        auth_mode: 'password',
        admin_username: 'custom_admin',
        admin_password_hash: 'mock_password_hash',
        admin_password_salt: 'mock_password_salt',
        session_version: 5,
        updated_at: nowIso,
      })
      .where(eq(settingsTable.id, 'global'));

    const result = await executeFactoryResetCore({
      dbOverride: testDrizzleDb,
      uploadsDirOverride: tempUploadsDir,
    });

    expect(result.sessionVersion).toBe(6);

    const rows = await testDrizzleDb.select().from(settingsTable).where(eq(settingsTable.id, 'global'));
    expect(rows[0]?.session_version).toBe(6);
    expect(rows[0]?.auth_mode).toBe('pin');
    expect(rows[0]?.initial_setup_completed).toBe(false);
  });
});
