import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { settingsTable } from '@/lib/db/schema';
import { initializeTables, type db as dbClientType } from '@/lib/db/client';
import { eq } from 'drizzle-orm';
import { dispatchTvPowerCommand } from '@/lib/hardware/display-driver';
import { dispatchAudioReceiverCommand } from '@/lib/hardware/audio-driver';
import { eventBus } from '@/lib/events/event-bus';
import type { AudioReceiverConfig } from '@/types/index';

describe('Hardware Automation Mutations & Database Isolation', () => {
  let tempDir: string;
  let tempDbPath: string;
  let testDrizzleDb: typeof dbClientType;
  let testSqlite: DatabaseSync;

  beforeAll(() => {
    // 1. Create isolated temporary directory in os.tmpdir() to protect live production db
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mosque_test_hardware_'));
    tempDbPath = path.join(tempDir, 'isolated_hardware_test.db');

    // 2. Initialize embedded SQLite
    testSqlite = new DatabaseSync(tempDbPath);
    testSqlite.exec('PRAGMA journal_mode = WAL;');

    const testDriver = {
      exec: (sql: string) => testSqlite.exec(sql),
      prepare: (sql: string) => {
        const stmt = testSqlite.prepare(sql);
        return {
          all: (...params: unknown[]) =>
            stmt.all(...(params as (string | number | bigint | null | Uint8Array)[])),
          get: (...params: unknown[]) =>
            stmt.get(...(params as (string | number | bigint | null | Uint8Array)[])) ?? undefined,
          run: (...params: unknown[]) => {
            stmt.run(...(params as (string | number | bigint | null | Uint8Array)[]));
          },
        };
      },
    };

    initializeTables(testDriver);

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
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it('initializes settings table with all hardware power and audio columns', async () => {
    const nowIso = new Date().toISOString();

    await testDrizzleDb
      .insert(settingsTable)
      .values({
        id: 'global',
        mosque_name: 'Test Mosque',
        ticker_text: 'Test Ticker',
        timezone: 'America/Toronto',
        hijri_offset_days: 0,
        drawer_interval_minutes: 3,
        drawer_display_seconds: 12,
        prayer_starting_now_duration_minutes: 10,
        show_adhan_times: true,
        date_format: 'both',
        poster_transition: 'fade',
        poster_fit: 'cover',
        display_resolution: '1080p',
        sidebar_mode: 'drawer',
        sidebar_position: 'right',
        sidebar_accent_theme: 'teal',
        qr_entrance_delay_seconds: 3,
        show_qr_during_drawer: false,
        latitude: 43.589,
        longitude: -79.6441,
        calculation_method: 'NorthAmerica',
        madhab: 'shafi',
        tv_auto_power: false,
        power_on_time: '05:00',
        power_off_time: '23:00',
        power_schedule_mode: 'fixed',
        power_fajr_offset_minutes: 45,
        power_isha_offset_minutes: 45,
        tv_control_protocol: 'hybrid',
        audio_mute_during_prayer: false,
        audio_receiver_host: '',
        audio_receiver_port: 23,
        audio_receiver_protocol: 'denon_telnet',
        audio_mute_delay_seconds: 0,
        updated_at: nowIso,
      })
      .onConflictDoNothing();

    const rows = await testDrizzleDb.select().from(settingsTable).where(eq(settingsTable.id, 'global'));
    expect(rows.length).toBe(1);

    const record = rows[0]!;
    expect(record.tv_auto_power).toBe(false);
    expect(record.power_on_time).toBe('05:00');
    expect(record.power_off_time).toBe('23:00');
    expect(record.power_schedule_mode).toBe('fixed');
    expect(record.audio_mute_during_prayer).toBe(false);
    expect(record.audio_receiver_protocol).toBe('denon_telnet');
  });

  it('updates hardware automation fields in isolated database', async () => {
    const updatedIso = new Date().toISOString();

    await testDrizzleDb
      .update(settingsTable)
      .set({
        tv_auto_power: true,
        power_on_time: '04:30',
        power_off_time: '23:45',
        power_schedule_mode: 'prayer_relative',
        power_fajr_offset_minutes: 30,
        power_isha_offset_minutes: 60,
        tv_control_protocol: 'hybrid',
        audio_mute_during_prayer: true,
        audio_receiver_host: '192.168.1.100',
        audio_receiver_port: 23,
        audio_receiver_protocol: 'denon_telnet',
        updated_at: updatedIso,
      })
      .where(eq(settingsTable.id, 'global'));

    const rows = await testDrizzleDb.select().from(settingsTable).where(eq(settingsTable.id, 'global'));
    const record = rows[0]!;

    expect(record.tv_auto_power).toBe(true);
    expect(record.power_on_time).toBe('04:30');
    expect(record.power_off_time).toBe('23:45');
    expect(record.power_schedule_mode).toBe('prayer_relative');
    expect(record.power_fajr_offset_minutes).toBe(30);
    expect(record.power_isha_offset_minutes).toBe(60);
    expect(record.audio_mute_during_prayer).toBe(true);
    expect(record.audio_receiver_host).toBe('192.168.1.100');
  });

  it('dispatches TV power commands and emits POWER_STATE_CHANGED event', async () => {
    const capture: { event: { state?: string } | null } = { event: null };
    const unsub = eventBus.subscribe('POWER_STATE_CHANGED', (payload) => {
      capture.event = payload as { state?: string };
    });

    try {
      const res = await dispatchTvPowerCommand('STANDBY', 'software_blackout');
      expect(res.success).toBe(true);
      expect(res.method).toBe('software_blackout');
      expect(capture.event).not.toBeNull();
      expect(capture.event?.state).toBe('STANDBY');
    } finally {
      unsub();
    }
  });

  it('handles audio receiver commands and emits AUDIO_MUTE_DISPATCHED event', async () => {
    const capture: { event: { success?: boolean } | null } = { event: null };
    const unsub = eventBus.subscribe('AUDIO_MUTE_DISPATCHED', (payload) => {
      capture.event = payload as { success?: boolean };
    });

    try {
      const config: AudioReceiverConfig = {
        audio_mute_during_prayer: true,
        audio_receiver_host: '', // deliberately empty to test safe fallback
        audio_receiver_port: 23,
        audio_receiver_protocol: 'denon_telnet',
      };

      const res = await dispatchAudioReceiverCommand(config, 'MUTE');
      expect(res.success).toBe(false);
      expect(res.message).toContain('Audio receiver host/IP is not configured');
      expect(capture.event).not.toBeNull();
      expect(capture.event?.success).toBe(false);
    } finally {
      unsub();
    }
  });
});
