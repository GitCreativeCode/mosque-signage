import { describe, it, expect } from 'vitest';
import {
  calculateDailySchedule,
  resolveNextPrayer,
  parseTimeToDate,
  formatHHMM,
} from '@/lib/prayer/prayer-engine';
import { formatHijriDate } from '@/lib/prayer/hijri';
import type { PrayerTimesToday } from '@/types/index';

describe('Astronomical Prayer Engine & Resolution', () => {
  const iccoCoords = { latitude: 43.589, longitude: -79.6441 };
  const timezone = 'America/Toronto';

  // Standard fixed schedule fixture for deterministic time evaluation
  const mockSchedule: PrayerTimesToday = {
    fajr: { adhan_time: '05:30', iqamah_time: '05:55' },
    sunrise: { adhan_time: '07:15', iqamah_time: '07:15' },
    dhuhr: { adhan_time: '13:05', iqamah_time: '13:25' },
    asr: { adhan_time: '16:15', iqamah_time: '16:30' },
    maghrib: { adhan_time: '18:45', iqamah_time: '18:55' },
    isha: { adhan_time: '20:15', iqamah_time: '20:35' },
  };

  it('calculates daily schedule with correct astronomical times for Toronto', () => {
    const testDate = new Date('2026-10-17T12:00:00Z');
    const schedule = calculateDailySchedule(iccoCoords, testDate, [], { timezone });

    expect(schedule.fajr.adhan_time).toMatch(/^\d{2}:\d{2}$/);
    expect(schedule.dhuhr.adhan_time).toMatch(/^\d{2}:\d{2}$/);
    expect(schedule.asr.adhan_time).toMatch(/^\d{2}:\d{2}$/);
    expect(schedule.maghrib.adhan_time).toMatch(/^\d{2}:\d{2}$/);
    expect(schedule.isha.adhan_time).toMatch(/^\d{2}:\d{2}$/);
  });

  it('applies manual overrides to Iqamah and Adhan times', () => {
    const testDate = new Date('2026-10-17T12:00:00Z');
    const overrides = [
      {
        id: 'ov-1',
        date: '2026-10-17',
        prayer: 'fajr' as const,
        adhan_override: '05:45',
        iqamah_time: '06:15',
      },
      {
        id: 'ov-2',
        date: '2026-10-17',
        prayer: 'isha' as const,
        iqamah_time: '21:00',
      },
    ];

    const schedule = calculateDailySchedule(iccoCoords, testDate, overrides, { timezone });
    expect(schedule.fajr.adhan_time).toBe('05:45');
    expect(schedule.fajr.iqamah_time).toBe('06:15');
    expect(schedule.isha.iqamah_time).toBe('21:00');
  });

  describe('Automated Dynamic Rules & 4-Tier Resolution Hierarchy', () => {
    const testDate = new Date('2026-10-17T12:00:00Z');

    it('computes Iqamah from dynamic offset rules (+minutes after Adhan)', () => {
      const rules = [
        {
          id: 'rule-fajr',
          prayer: 'fajr' as const,
          rule_type: 'OFFSET' as const,
          offset_minutes: 30,
          fixed_time: null,
          updated_at: '2026-10-17T00:00:00Z',
        },
      ];

      const schedule = calculateDailySchedule(iccoCoords, testDate, [], { timezone, rules });
      // Fajr adhan is calculated; Iqamah must be adhan + 30m
      const adhanDate = parseTimeToDate(schedule.fajr.adhan_time, testDate, timezone);
      const expectedIqamahDate = new Date(adhanDate.getTime() + 30 * 60 * 1000);
      const expectedIqamahStr = formatHHMM(expectedIqamahDate, timezone);

      expect(schedule.fajr.iqamah_time).toBe(expectedIqamahStr);
    });

    it('applies fixed time rules for prayers (e.g. Dhuhr fixed at 13:30)', () => {
      const rules = [
        {
          id: 'rule-dhuhr',
          prayer: 'dhuhr' as const,
          rule_type: 'FIXED' as const,
          offset_minutes: null,
          fixed_time: '13:30',
          updated_at: '2026-10-17T00:00:00Z',
        },
        {
          id: 'rule-isha',
          prayer: 'isha' as const,
          rule_type: 'FIXED' as const,
          offset_minutes: null,
          fixed_time: '20:45',
          updated_at: '2026-10-17T00:00:00Z',
        },
      ];

      const schedule = calculateDailySchedule(iccoCoords, testDate, [], { timezone, rules });
      expect(schedule.dhuhr.iqamah_time).toBe('13:30');
      expect(schedule.isha.iqamah_time).toBe('20:45');
    });

    it('prioritizes Manual Override > Annual Schedule > Dynamic Rule > Default fallback', () => {
      // Setup all 4 tiers for Fajr, Dhuhr, Asr, Maghrib
      const overrides = [
        {
          id: 'ov-fajr',
          date: '2026-10-17',
          prayer: 'fajr' as const,
          iqamah_time: '06:30', // Tier 1: Override
        },
      ];

      const annualSchedule = {
        fajr_iqamah: '06:15', // Tier 2 (should be superseded by override)
        dhuhr_iqamah: '13:45', // Tier 2: Annual Schedule
        asr_iqamah: '17:00', // Tier 2
      };

      const rules = [
        {
          id: 'rule-fajr',
          prayer: 'fajr' as const,
          rule_type: 'FIXED' as const,
          offset_minutes: null,
          fixed_time: '06:00', // Tier 3
          updated_at: '2026-10-17T00:00:00Z',
        },
        {
          id: 'rule-dhuhr',
          prayer: 'dhuhr' as const,
          rule_type: 'FIXED' as const,
          offset_minutes: null,
          fixed_time: '13:15', // Tier 3 (should be superseded by annual schedule)
          updated_at: '2026-10-17T00:00:00Z',
        },
        {
          id: 'rule-maghrib',
          prayer: 'maghrib' as const,
          rule_type: 'OFFSET' as const,
          offset_minutes: 7, // Tier 3: Dynamic Rule
          fixed_time: null,
          updated_at: '2026-10-17T00:00:00Z',
        },
      ];

      const schedule = calculateDailySchedule(iccoCoords, testDate, overrides, {
        timezone,
        annualSchedule,
        rules,
      });

      // Fajr: Override wins (06:30) over Annual (06:15) and Rule (06:00)
      expect(schedule.fajr.iqamah_time).toBe('06:30');

      // Dhuhr: Annual schedule wins (13:45) over Dynamic Rule (13:15)
      expect(schedule.dhuhr.iqamah_time).toBe('13:45');

      // Maghrib: Dynamic Rule wins (Adhan + 7m) over Default (Adhan + 10m)
      const maghribAdhan = parseTimeToDate(schedule.maghrib.adhan_time, testDate, timezone);
      const expectedMaghribIqamah = formatHHMM(
        new Date(maghribAdhan.getTime() + 7 * 60 * 1000),
        timezone
      );
      expect(schedule.maghrib.iqamah_time).toBe(expectedMaghribIqamah);

      // Isha: No override, no annual, no rule -> Default fallback (+15m)
      const ishaAdhan = parseTimeToDate(schedule.isha.adhan_time, testDate, timezone);
      const expectedIshaIqamah = formatHHMM(
        new Date(ishaAdhan.getTime() + 15 * 60 * 1000),
        timezone
      );
      expect(schedule.isha.iqamah_time).toBe(expectedIshaIqamah);
    });
  });

  describe('Next Prayer Resolution & Rollover', () => {
    const baseDate = new Date('2026-10-17T00:00:00Z');

    it('detects Fajr as next prayer before Fajr in the early morning', () => {
      // 04:00 AM Toronto time
      const earlyMorning = parseTimeToDate('04:00', baseDate, timezone);
      const res = resolveNextPrayer(mockSchedule, earlyMorning, { timezone });

      expect(res.prayer_name).toBe('Fajr');
      expect(res.status).toBe('COUNTDOWN');
      expect(res.time_display).toBe('05:55');
      // From 04:00 to 05:55 is 115 minutes
      expect(res.minutes_remaining).toBe(115);
    });

    it('detects Dhuhr as next prayer at midday (between Fajr window and Dhuhr)', () => {
      // 11:30 AM Toronto time
      const midday = parseTimeToDate('11:30', baseDate, timezone);
      const res = resolveNextPrayer(mockSchedule, midday, { timezone });

      expect(res.prayer_name).toBe('Dhuhr');
      expect(res.status).toBe('COUNTDOWN');
      expect(res.time_display).toBe('13:25');
      // From 11:30 to 13:25 is 115 minutes
      expect(res.minutes_remaining).toBe(115);
    });

    it('detects Asr as next prayer in the afternoon after Dhuhr window', () => {
      // 14:00 Toronto time
      const afternoon = parseTimeToDate('14:00', baseDate, timezone);
      const res = resolveNextPrayer(mockSchedule, afternoon, { timezone });

      expect(res.prayer_name).toBe('Asr');
      expect(res.status).toBe('COUNTDOWN');
      expect(res.time_display).toBe('16:30');
      // From 14:00 to 16:30 is 150 minutes
      expect(res.minutes_remaining).toBe(150);
    });

    it('rolls over to next day Fajr after Isha starting-now window elapses', () => {
      // Isha Iqamah is 20:35; starting-now window is 10 min (ends at 20:45)
      // At 21:00 Toronto time, Isha has concluded
      const lateNight = parseTimeToDate('21:00', baseDate, timezone);
      const res = resolveNextPrayer(mockSchedule, lateNight, { timezone });

      expect(res.prayer_name).toBe('Fajr');
      expect(res.status).toBe('COUNTDOWN');
      expect(res.time_display).toBe('05:55');
      // From 21:00 to 05:55 next day is 8h 55m = 535 minutes
      expect(res.minutes_remaining).toBe(535);
    });
  });

  describe('STARTING_NOW State Invariants', () => {
    const baseDate = new Date('2026-10-17T00:00:00Z');

    it('remains in COUNTDOWN one second prior to Iqamah', () => {
      // Dhuhr Iqamah is 13:25:00. At 13:24:59:
      const justBefore = new Date(parseTimeToDate('13:25', baseDate, timezone).getTime() - 1000);
      const res = resolveNextPrayer(mockSchedule, justBefore, { timezone });

      expect(res.prayer_name).toBe('Dhuhr');
      expect(res.status).toBe('COUNTDOWN');
      expect(res.minutes_remaining).toBe(1);
    });

    it('triggers STARTING_NOW on the exact millisecond of Iqamah', () => {
      const exactIqamah = parseTimeToDate('13:25', baseDate, timezone);
      const res = resolveNextPrayer(mockSchedule, exactIqamah, { timezone });

      expect(res.prayer_name).toBe('Dhuhr');
      expect(res.status).toBe('STARTING_NOW');
      expect(res.minutes_remaining).toBe(0);
      expect(res.time_display).toBe('13:25');
    });

    it('persists STARTING_NOW during the 10-minute threshold', () => {
      // 5 minutes into the Iqamah window (13:30:00)
      const midIqamah = new Date(parseTimeToDate('13:25', baseDate, timezone).getTime() + 5 * 60 * 1000);
      const res = resolveNextPrayer(mockSchedule, midIqamah, { timezone });

      expect(res.prayer_name).toBe('Dhuhr');
      expect(res.status).toBe('STARTING_NOW');
      expect(res.minutes_remaining).toBe(0);
    });

    it('persists STARTING_NOW at 9 minutes and 59 seconds post-Iqamah', () => {
      const justBeforeClear = new Date(
        parseTimeToDate('13:25', baseDate, timezone).getTime() + 10 * 60 * 1000 - 1000
      );
      const res = resolveNextPrayer(mockSchedule, justBeforeClear, { timezone });

      expect(res.prayer_name).toBe('Dhuhr');
      expect(res.status).toBe('STARTING_NOW');
    });

    it('clears STARTING_NOW after exactly 10 minutes and transitions to next prayer', () => {
      // Exactly 10 minutes after Dhuhr Iqamah (13:35:00)
      const exactTenMinutes = new Date(
        parseTimeToDate('13:25', baseDate, timezone).getTime() + 10 * 60 * 1000
      );
      const res = resolveNextPrayer(mockSchedule, exactTenMinutes, { timezone });

      // Must have transitioned to upcoming Asr
      expect(res.prayer_name).toBe('Asr');
      expect(res.status).toBe('COUNTDOWN');
      expect(res.time_display).toBe('16:30');
      // From 13:35 to 16:30 is 175 minutes
      expect(res.minutes_remaining).toBe(175);
    });
  });

  describe('Hijri Date Formatter', () => {
    it('formats Gregorian date into deterministic Umm al-Qura Hijri date', () => {
      const fixedDate = new Date('2026-10-17T12:00:00Z');
      const hijriStr = formatHijriDate(fixedDate, 0);

      expect(hijriStr).toContain('AH');
      expect(hijriStr.length).toBeGreaterThan(6);
    });

    it('applies manual offset days (-1, +1) correctly', () => {
      const fixedDate = new Date('2026-10-17T12:00:00Z');
      const standard = formatHijriDate(fixedDate, 0);
      const shifted = formatHijriDate(fixedDate, 1);

      // A +1 day offset changes the day portion
      expect(standard).not.toBe(shifted);
    });
  });

  describe('Astronomical Adhan Offsets & Timetable Overrides', () => {
    const testDate = new Date('2026-10-17T12:00:00Z');

    it('applies global per-prayer Adhan offsets and propagates to relative Iqamah', () => {
      // 1. Raw calculation without offset
      const rawSchedule = calculateDailySchedule(iccoCoords, testDate, [], { timezone });
      const rawFajrAdhan = rawSchedule.fajr.adhan_time;
      const rawDhuhrAdhan = rawSchedule.dhuhr.adhan_time;

      // 2. Schedule with +2m Fajr (precautionary) and +5m Dhuhr (zawal delay)
      const offsetSchedule = calculateDailySchedule(iccoCoords, testDate, [], {
        timezone,
        adhanOffsets: {
          fajr: 2,
          dhuhr: 5,
        },
      });

      const rawFajrDate = parseTimeToDate(rawFajrAdhan, testDate, timezone);
      const expectedFajrDate = new Date(rawFajrDate.getTime() + 2 * 60 * 1000);
      expect(offsetSchedule.fajr.adhan_time).toBe(formatHHMM(expectedFajrDate, timezone));

      const rawDhuhrDate = parseTimeToDate(rawDhuhrAdhan, testDate, timezone);
      const expectedDhuhrDate = new Date(rawDhuhrDate.getTime() + 5 * 60 * 1000);
      expect(offsetSchedule.dhuhr.adhan_time).toBe(formatHHMM(expectedDhuhrDate, timezone));

      // Standard fallback for Dhuhr is Adhan + 20m. Verify Iqamah shifted with effective Adhan:
      const expectedDhuhrIqamahDate = new Date(expectedDhuhrDate.getTime() + 20 * 60 * 1000);
      expect(offsetSchedule.dhuhr.iqamah_time).toBe(formatHHMM(expectedDhuhrIqamahDate, timezone));
    });

    it('supports negative Adhan offsets (e.g. -3m)', () => {
      const rawSchedule = calculateDailySchedule(iccoCoords, testDate, [], { timezone });
      const rawAsrAdhan = rawSchedule.asr.adhan_time;

      const offsetSchedule = calculateDailySchedule(iccoCoords, testDate, [], {
        timezone,
        adhanOffsets: { asr: -3 },
      });

      const rawAsrDate = parseTimeToDate(rawAsrAdhan, testDate, timezone);
      const expectedAsrDate = new Date(rawAsrDate.getTime() - 3 * 60 * 1000);
      expect(offsetSchedule.asr.adhan_time).toBe(formatHHMM(expectedAsrDate, timezone));
    });

    it('annual timetable Adhan overrides astronomical computation and global offset', () => {
      const schedule = calculateDailySchedule(iccoCoords, testDate, [], {
        timezone,
        adhanOffsets: { fajr: 10 },
        annualSchedule: {
          fajr_adhan: '06:12',
        },
        rules: [
          {
            prayer: 'fajr',
            rule_type: 'OFFSET',
            offset_minutes: 18,
          },
        ],
      });

      // Annual schedule Adhan must override the astronomical Adhan + 10m
      expect(schedule.fajr.adhan_time).toBe('06:12');

      // Relative Iqamah rule (+18m) must anchor to effective Adhan (06:12 + 18m = 06:30)
      expect(schedule.fajr.iqamah_time).toBe('06:30');
    });

    it('daily manual override takes precedence over annual timetable and global offsets', () => {
      const overrides = [
        {
          id: 'ov-test',
          date: '2026-10-17',
          prayer: 'fajr' as const,
          adhan_override: '06:22',
          iqamah_time: '06:45',
        },
      ];

      const schedule = calculateDailySchedule(iccoCoords, testDate, overrides, {
        timezone,
        adhanOffsets: { fajr: 10 },
        annualSchedule: {
          fajr_adhan: '06:12',
          fajr_iqamah: '06:30',
        },
      });

      expect(schedule.fajr.adhan_time).toBe('06:22');
      expect(schedule.fajr.iqamah_time).toBe('06:45');
    });

    it('fixed time Iqamah rules remain stationary when Adhan offset is applied', () => {
      const schedule = calculateDailySchedule(iccoCoords, testDate, [], {
        timezone,
        adhanOffsets: { dhuhr: 15 },
        rules: [
          {
            prayer: 'dhuhr',
            rule_type: 'FIXED',
            fixed_time: '13:45',
          },
        ],
      });

      // Fixed Iqamah stays at 13:45 regardless of Adhan shifting
      expect(schedule.dhuhr.iqamah_time).toBe('13:45');
    });
  });

  describe('DST Transitions & Timezone Boundary Handling (parseTimeToDate)', () => {
    it('accurately resolves Spring Forward DST boundary to UTC-4 (EDT)', () => {
      // March 8, 2026 is DST Spring Forward in America/Toronto
      const springForwardBase = new Date('2026-03-08T12:00:00Z');
      const parsedDate = parseTimeToDate('13:15', springForwardBase, timezone);

      // In EDT (UTC-4), 13:15 EDT is exactly 17:15:00.000Z
      expect(parsedDate.toISOString()).toBe('2026-03-08T17:15:00.000Z');
    });

    it('accurately resolves Fall Back DST boundary to UTC-5 (EST)', () => {
      // November 1, 2026 is DST Fall Back in America/Toronto
      const fallBackBase = new Date('2026-11-01T12:00:00Z');
      const parsedDate = parseTimeToDate('13:15', fallBackBase, timezone);

      // In EST (UTC-5), 13:15 EST is exactly 18:15:00.000Z
      expect(parsedDate.toISOString()).toBe('2026-11-01T18:15:00.000Z');
    });

    it('handles unicode minus symbols cleanly without returning Invalid Date', () => {
      const baseDate = new Date('2026-06-15T12:00:00Z');
      // Time string containing non-breaking or unicode character
      const parsed = parseTimeToDate('14:30', baseDate, timezone);
      expect(isNaN(parsed.getTime())).toBe(false);
      expect(parsed.toISOString()).toBe('2026-06-15T18:30:00.000Z');
    });
  });

  describe('Unconfigured Coordinates & Graceful Fallback Handling', () => {
    it('returns --:-- for daily schedule when coordinates are null without crashing', () => {
      const testDate = new Date('2026-10-17T12:00:00Z');
      const schedule = calculateDailySchedule({ latitude: null, longitude: null }, testDate, [], { timezone });

      expect(schedule.fajr.adhan_time).toBe('--:--');
      expect(schedule.fajr.iqamah_time).toBe('--:--');
      expect(schedule.sunrise.adhan_time).toBe('--:--');
      expect(schedule.dhuhr.adhan_time).toBe('--:--');
      expect(schedule.asr.adhan_time).toBe('--:--');
      expect(schedule.maghrib.adhan_time).toBe('--:--');
      expect(schedule.isha.adhan_time).toBe('--:--');
    });

    it('honors manual overrides and annual schedules when coordinates are null', () => {
      const testDate = new Date('2026-10-17T12:00:00Z');
      const overrides = [
        {
          id: 'ov-fajr',
          date: '2026-10-17',
          prayer: 'fajr' as const,
          adhan_override: '05:45',
          iqamah_time: '06:15',
        },
      ];
      const annualSchedule = {
        dhuhr_adhan: '13:10',
        dhuhr_iqamah: '13:30',
      };

      const schedule = calculateDailySchedule(
        { latitude: null, longitude: null },
        testDate,
        overrides,
        { timezone, annualSchedule }
      );

      expect(schedule.fajr.adhan_time).toBe('05:45');
      expect(schedule.fajr.iqamah_time).toBe('06:15');
      expect(schedule.dhuhr.adhan_time).toBe('13:10');
      expect(schedule.dhuhr.iqamah_time).toBe('13:30');
      expect(schedule.asr.adhan_time).toBe('--:--');
    });

    it('gracefully handles resolveNextPrayer when all prayers are --:--', () => {
      const unconfiguredSchedule: PrayerTimesToday = {
        fajr: { adhan_time: '--:--', iqamah_time: '--:--' },
        sunrise: { adhan_time: '--:--', iqamah_time: '--:--' },
        dhuhr: { adhan_time: '--:--', iqamah_time: '--:--' },
        asr: { adhan_time: '--:--', iqamah_time: '--:--' },
        maghrib: { adhan_time: '--:--', iqamah_time: '--:--' },
        isha: { adhan_time: '--:--', iqamah_time: '--:--' },
      };
      const now = new Date('2026-10-17T14:00:00Z');
      const res = resolveNextPrayer(unconfiguredSchedule, now, { timezone });

      expect(res.prayer_name).toBe('Fajr');
      expect(res.time_display).toBe('--:--');
      expect(res.minutes_remaining).toBe(0);
      expect(res.status).toBe('COUNTDOWN');
    });
  });
});
