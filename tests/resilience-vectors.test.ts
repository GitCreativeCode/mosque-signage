import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { resolveClientIp } from '@/lib/auth/display-pairing';
import { sanitizeCsvCell, formatCsvDayRow } from '@/lib/prayer/month-schedule';
import { parseCsvLineToSchedulePayload, normalizeTimeTo24h } from '@/lib/prayer/csv-parser';
import { isSystemClockSynchronized } from '@/lib/utils/time';
import { shouldTriggerDrawer } from '@/lib/engine/jummah-resolver';
import { computeDisplaySnapshot } from '@/lib/engine/display-snapshot';
import { evaluatePrayerSilenceTransition } from '@/lib/hardware/prayer-silence-monitor';
import { quarantineCorruptedDb, createDatabaseConnection } from '@/lib/db/client';
import type { MonthPrayerDay, PrayerTimesToday, Settings } from '@/types/index';

describe('Resilience Vectors & Pre-Flight Security Hardening', () => {
  describe('Vector 1 (SEC-01): Host Header Spoofing Protection in Display Pairing', () => {
    const origEnv = process.env.TRUST_PROXY_HEADERS;

    afterEach(() => {
      process.env.TRUST_PROXY_HEADERS = origEnv;
    });

    it('defaults to safe remote lan-client identifier and never trusts client Host header when proxy is untrusted', async () => {
      process.env.TRUST_PROXY_HEADERS = 'false';
      // resolveClientIp in non-proxy context must never resolve to 127.0.0.1 or trust Host: localhost
      const ip = await resolveClientIp();
      expect(ip).toBe('lan-client');
      expect(ip).not.toBe('127.0.0.1');
    });
  });

  describe('Vector 10 (SEC-02): CSV Formula Injection (DDE) Sanitization', () => {
    it('prepends a single quote to cells beginning with formula triggers (=, +, -, @, tab, newline)', () => {
      expect(sanitizeCsvCell("=cmd|' /C calc'!A0")).toBe("'=cmd|' /C calc'!A0");
      expect(sanitizeCsvCell('@SUM(1+1)')).toBe("'@SUM(1+1)");
      expect(sanitizeCsvCell('+12345')).toBe("'+12345");
      expect(sanitizeCsvCell('-12345')).toBe("'-12345");
      expect(sanitizeCsvCell('\t=cmd')).toBe("'=cmd");
      expect(sanitizeCsvCell('12:30')).toBe('12:30');
      expect(sanitizeCsvCell(null)).toBe('');
    });

    it('sanitizes day row values in formatCsvDayRow against CSV injection', () => {
      const mockDay: MonthPrayerDay = {
        date: '=2026-11-20',
        dayNumber: 20,
        dayName: 'Fri',
        isToday: true,
        isFriday: true,
        fajr: { adhan: '=05:30', iqamah: '@06:00', source: 'default', adhanSource: 'astronomical' },
        sunrise: { adhan: '+07:15', adhanSource: 'astronomical' },
        dhuhr: { adhan: '12:30', iqamah: '13:00', source: 'default', adhanSource: 'astronomical' },
        asr: { adhan: '15:15', iqamah: '15:45', source: 'default', adhanSource: 'astronomical' },
        maghrib: { adhan: '17:00', iqamah: '17:15', source: 'default', adhanSource: 'astronomical' },
        isha: { adhan: '18:45', iqamah: '19:15', source: 'default', adhanSource: 'astronomical' },
      };

      const legacyRow = formatCsvDayRow(mockDay, 'legacy');
      const cells = legacyRow.split(',');
      expect(cells[0]).toBe("'=2026-11-20");
      expect(cells[1]).toBe("'@06:00");
    });
  });

  describe('Vector 10 (ENG-03 & ENG-04): Chronological Validation & Leap-Year Guards', () => {
    it('rejects full-schedule CSV lines where Iqamah is earlier than Adhan', () => {
      const outOfOrderLine = '11,1,06:30,06:00,07:51,12:22,12:45,14:40,15:00,16:53,17:03,18:32,19:00';
      const parsed = parseCsvLineToSchedulePayload(outOfOrderLine, 'full', 2026, '2026-11-20T00:00:00Z');
      expect(parsed).toBeNull();
    });

    it('rejects CSV lines where prayers regress chronologically (e.g. Asr earlier than Dhuhr)', () => {
      const regressingLine = '11,1,06:00,06:30,07:51,13:30,14:00,12:00,12:30,17:00,17:15,19:00,19:30';
      const parsed = parseCsvLineToSchedulePayload(regressingLine, 'full', 2026, '2026-11-20T00:00:00Z');
      expect(parsed).toBeNull();
    });

    it('accepts strictly chronological CSV lines', () => {
      const validLine = '11,1,06:00,06:30,07:30,12:30,13:00,15:00,15:30,17:00,17:15,19:00,19:30';
      const parsed = parseCsvLineToSchedulePayload(validLine, 'full', 2026, '2026-11-20T00:00:00Z');
      expect(parsed).not.toBeNull();
      expect(parsed?.fajr_adhan).toBe('06:00');
      expect(parsed?.fajr_iqamah).toBe('06:30');
    });

    it('re-anchors ISO row date to forceTargetYear when targetYear is specified', () => {
      const isoLine = '2024-05-10,04:30,05:00,06:00,12:30,13:00,16:00,16:30,18:30,18:45,20:00,20:30';
      const parsed = parseCsvLineToSchedulePayload(isoLine, 'full', 2026, '2026-11-20T00:00:00Z', true);
      expect(parsed).not.toBeNull();
      expect(parsed?.date).toBe('2026-05-10');
    });

    it('collects warnings and skips Feb 29 when importing annual CSV for a non-leap year', async () => {
      const { importAnnualScheduleCsv } = await import('@/lib/actions/prayer-schedules');
      const csv = `Month,Day,Fajr_Adhan,Fajr_Iqamah,Sunrise,Dhuhr_Adhan,Dhuhr_Iqamah,Asr_Adhan,Asr_Iqamah,Maghrib_Adhan,Maghrib_Iqamah,Isha_Adhan,Isha_Iqamah
2,28,05:30,06:00,07:00,12:30,13:00,15:30,16:00,17:30,17:45,19:00,19:30
2,29,05:29,06:00,06:58,12:30,13:00,15:31,16:00,17:31,17:45,19:01,19:30
3,1,05:28,06:00,06:56,12:30,13:00,15:32,16:00,17:32,17:45,19:02,19:30`;

      // 2025 is not a leap year
      const result = await importAnnualScheduleCsv(csv, 2025);
      expect(result.importedCount).toBe(2);
      expect(result.skippedCount).toBe(1);
      expect(result.warnings?.some((w) => w.includes('Feb 29'))).toBe(true);
    });

    it('upsertPrayerOverride rejects invalid time formatting and inverted Iqamah earlier than Adhan', async () => {
      const { upsertPrayerOverride } = await import('@/lib/actions/prayers');

      // Invalid format rejected
      await expect(
        upsertPrayerOverride({
          date: '2026-11-20',
          prayer: 'fajr',
          iqamah_time: 'not-a-time',
        })
      ).rejects.toThrow('Invalid Iqamah time format');

      // Formula injection rejected
      await expect(
        upsertPrayerOverride({
          date: '2026-11-20',
          prayer: 'fajr',
          iqamah_time: "=cmd|' /C calc'!A0",
        })
      ).rejects.toThrow('Invalid Iqamah time format');

      // Iqamah before Adhan rejected
      await expect(
        upsertPrayerOverride({
          date: '2026-11-20',
          prayer: 'fajr',
          adhan_override: '06:00',
          iqamah_time: '05:30',
        })
      ).rejects.toThrow('cannot be earlier than Adhan time');
    });

    it('savePrayerRule rejects invalid fixed time format', async () => {
      const { savePrayerRule } = await import('@/lib/actions/prayers');

      await expect(
        savePrayerRule({
          prayer: 'fajr',
          rule_type: 'FIXED',
          fixed_time: 'invalid',
        })
      ).rejects.toThrow('Invalid fixed time format');
    });
  });

  describe('Vector 8 (ENG-02): Abrupt Power Loss, WAL Checkpointing & Corruption Quarantine', () => {
    it('quarantines a corrupted database file with timestamped backup and allows reinitialization', () => {
      const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wal-corrupt-test-'));
      const dbPath = path.join(scratchDir, 'test_corrupt.db');
      fs.writeFileSync(dbPath, 'corrupted-binary-garbage-page-data');
      fs.writeFileSync(`${dbPath}-wal`, 'corrupted-wal-data');

      expect(fs.existsSync(dbPath)).toBe(true);

      const quarantined = quarantineCorruptedDb(dbPath);
      expect(quarantined).toBe(true);
      expect(fs.existsSync(dbPath)).toBe(false);

      // Verify corrupt archive exists
      const files = fs.readdirSync(scratchDir);
      const corruptFile = files.find((f) => f.includes('corrupt'));
      expect(corruptFile).toBeDefined();

      // Opening connection to dbPath now creates a fresh database cleanly
      const driver = createDatabaseConnection(dbPath);
      expect(driver).toBeDefined();
      driver.exec('CREATE TABLE test_table (id TEXT PRIMARY KEY);');
      driver.exec("INSERT INTO test_table VALUES ('ok');");
      const row = driver.prepare('SELECT * FROM test_table').get() as { id: string };
      expect(row.id).toBe('ok');

      driver.close?.();
      fs.rmSync(scratchDir, { recursive: true, force: true });
    });
  });

  describe('Vector 9 (ENG-01 & ENG-05): Clock Skew, RTC Battery Death (1970) & DST Transitions', () => {
    it('isSystemClockSynchronized correctly detects RTC coin-cell failure (< 2025)', () => {
      expect(isSystemClockSynchronized(new Date('1970-01-01T00:00:00Z'))).toBe(false);
      expect(isSystemClockSynchronized(new Date('2024-12-31T23:59:59Z'))).toBe(false);
      expect(isSystemClockSynchronized(new Date('2026-11-20T07:00:00Z'))).toBe(true);
    });

    it('evaluatePrayerSilenceTransition suppresses audio MUTE when system clock is unsynchronized', async () => {
      const monitorState = { wasMutedForPrayer: false };
      const unsyncedNow = new Date('1970-01-01T05:30:00Z');

      const snapshot = {
        config: {
          audio_mute_during_prayer: true,
          audio_receiver_host: '192.168.1.100',
          audio_receiver_port: 23,
          audio_receiver_protocol: 'denon_telnet' as const,
        },
        isStartingNow: true,
        prayerName: 'Fajr',
        durationMinutes: 10,
      };

      await evaluatePrayerSilenceTransition(snapshot, monitorState, unsyncedNow);
      expect(monitorState.wasMutedForPrayer).toBe(false);
    });

    it('computeDisplaySnapshot flags is_clock_unsynchronized and suppresses STARTING_NOW silence screen', () => {
      const unsyncedNow = new Date('1970-01-01T12:00:00Z');
      const dummySettings: Settings = {
        mosque_name: 'Test Mosque',
        ticker_text: '',
        hijri_offset_days: 0,
        timezone: 'UTC',
        calculation_method: 'NorthAmerica',
        madhab: 'shafi',
        show_prayer_silence_overlay: true,
        prayer_starting_now_duration_minutes: 10,
        drawer_display_seconds: 15,
        drawer_interval_minutes: 3,
        sidebar_mode: 'drawer',
        show_mini_prayer_pill: true,
      };

      const dummyPrayers: PrayerTimesToday = {
        fajr: { adhan_time: '05:00', iqamah_time: '05:30' },
        sunrise: { adhan_time: '06:30', iqamah_time: '06:30' },
        dhuhr: { adhan_time: '12:00', iqamah_time: '12:00' },
        asr: { adhan_time: '15:00', iqamah_time: '15:30' },
        maghrib: { adhan_time: '17:00', iqamah_time: '17:15' },
        isha: { adhan_time: '19:00', iqamah_time: '19:30' },
      };

      const snap = computeDisplaySnapshot(
        dummySettings,
        [],
        dummyPrayers,
        [],
        0,
        new Date(unsyncedNow.getTime() - 60000),
        unsyncedNow
      );

      expect(snap.header.is_clock_unsynchronized).toBe(true);
      expect(snap.next_prayer?.status).not.toBe('STARTING_NOW');
    });

    it('shouldTriggerDrawer handles ambiguous 1-hour jump during DST Fall Back (negative delta)', () => {
      const lastTrigger = new Date('2026-11-01T01:50:00Z');
      // Clock fell back by 1 hour: current time is 01:05 (before lastTrigger)
      const fellBackNow = new Date('2026-11-01T01:05:00Z');

      // Must not stall for 1 hour; should trigger/recover immediately
      const shouldTrigger = shouldTriggerDrawer(lastTrigger, fellBackNow, 3);
      expect(shouldTrigger).toBe(true);
    });
  });
});
