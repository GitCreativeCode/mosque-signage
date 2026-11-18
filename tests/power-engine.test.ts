import { describe, it, expect } from 'vitest';
import {
  parseTimeToMinutes,
  formatMinutesToTime,
  getMinutesSinceMidnightInTimezone,
  resolveEffectivePowerSchedule,
  isScreenInPowerWindow,
} from '@/lib/hardware/power-engine';
import type { PowerScheduleConfig } from '@/types/index';

describe('Display Screen Power Scheduling Engine', () => {
  describe('Time Parsing & Formatting Utilities', () => {
    it('parses standard 24-hour time strings into total minutes since midnight', () => {
      expect(parseTimeToMinutes('00:00')).toBe(0);
      expect(parseTimeToMinutes('05:00')).toBe(300);
      expect(parseTimeToMinutes('12:30')).toBe(750);
      expect(parseTimeToMinutes('23:59')).toBe(1439);
    });

    it('gracefully handles malformed or out-of-range time strings', () => {
      expect(parseTimeToMinutes('invalid')).toBe(0);
      expect(parseTimeToMinutes('')).toBe(0);
    });

    it('formats total minutes into HH:mm strings with two-digit padding', () => {
      expect(formatMinutesToTime(0)).toBe('00:00');
      expect(formatMinutesToTime(300)).toBe('05:00');
      expect(formatMinutesToTime(750)).toBe('12:30');
      expect(formatMinutesToTime(1439)).toBe('23:59');
    });

    it('normalizes overflow and negative minutes into the 24-hour clock', () => {
      expect(formatMinutesToTime(-45)).toBe('23:15');
      expect(formatMinutesToTime(1445)).toBe('00:05');
    });
  });

  describe('Timezone-Aware Minutes Since Midnight', () => {
    it('extracts correct local minutes for UTC dates in America/Toronto', () => {
      // 2026-10-25 14:00 UTC = 10:00 AM EDT (Eastern Daylight Time, UTC-4) = 600 minutes
      const testDate = new Date('2026-10-25T14:00:00.000Z');
      const minutes = getMinutesSinceMidnightInTimezone(testDate, 'America/Toronto');
      expect(minutes).toBe(600);
    });

    it('extracts correct local minutes in Asia/Riyadh (UTC+3)', () => {
      // 2026-10-25 14:00 UTC = 17:00 (5:00 PM AST, UTC+3) = 1020 minutes
      const testDate = new Date('2026-10-25T14:00:00.000Z');
      const minutes = getMinutesSinceMidnightInTimezone(testDate, 'Asia/Riyadh');
      expect(minutes).toBe(1020);
    });
  });

  describe('Schedule Resolution (Fixed vs Prayer-Relative)', () => {
    it('resolves fixed schedule when mode is fixed', () => {
      const config: PowerScheduleConfig = {
        tv_auto_power: true,
        power_schedule_mode: 'fixed',
        power_on_time: '05:15',
        power_off_time: '23:30',
      };

      const resolved = resolveEffectivePowerSchedule(config);
      expect(resolved.onTime).toBe('05:15');
      expect(resolved.offTime).toBe('23:30');
      expect(resolved.isPrayerRelative).toBe(false);
    });

    it('resolves prayer-relative offsets with intuitive positive minutes (Fajr 45m before, Isha 45m after)', () => {
      const config: PowerScheduleConfig = {
        tv_auto_power: true,
        power_schedule_mode: 'prayer_relative',
        power_on_time: '05:00',
        power_off_time: '23:00',
        power_fajr_offset_minutes: 45,
        power_isha_offset_minutes: 45,
      };

      const prayerTimes = {
        fajrAdhan: '05:30', // 330m - 45m = 285m = 04:45
        ishaIqamah: '20:15', // 1215m + 45m = 1260m = 21:00
      };

      const resolved = resolveEffectivePowerSchedule(config, prayerTimes);
      expect(resolved.onTime).toBe('04:45');
      expect(resolved.offTime).toBe('21:00');
      expect(resolved.isPrayerRelative).toBe(true);
    });

    it('gracefully handles legacy negative offset for Fajr (-45m)', () => {
      const config: PowerScheduleConfig = {
        tv_auto_power: true,
        power_schedule_mode: 'prayer_relative',
        power_on_time: '05:00',
        power_off_time: '23:00',
        power_fajr_offset_minutes: -45,
        power_isha_offset_minutes: 45,
      };

      const prayerTimes = {
        fajrAdhan: '05:30', // 330m - 45m = 285m = 04:45
        ishaIqamah: '20:15', // 1215m + 45m = 1260m = 21:00
      };

      const resolved = resolveEffectivePowerSchedule(config, prayerTimes);
      expect(resolved.onTime).toBe('04:45');
      expect(resolved.offTime).toBe('21:00');
      expect(resolved.isPrayerRelative).toBe(true);
    });

    it('falls back to fixed times when prayer times are missing in prayer_relative mode', () => {
      const config: PowerScheduleConfig = {
        tv_auto_power: true,
        power_schedule_mode: 'prayer_relative',
        power_on_time: '06:00',
        power_off_time: '22:00',
      };

      const resolved = resolveEffectivePowerSchedule(config, undefined);
      expect(resolved.onTime).toBe('06:00');
      expect(resolved.offTime).toBe('22:00');
      expect(resolved.isPrayerRelative).toBe(false);
    });
  });

  describe('isScreenInPowerWindow Evaluation', () => {
    const tz = 'America/Toronto'; // UTC-4 in October

    it('always returns true when tv_auto_power is disabled', () => {
      const config: PowerScheduleConfig = {
        tv_auto_power: false,
        power_schedule_mode: 'fixed',
        power_on_time: '05:00',
        power_off_time: '23:00',
      };

      // 03:00 AM EDT (outside fixed window)
      const earlyMorning = new Date('2026-10-25T07:00:00.000Z');
      expect(isScreenInPowerWindow(config, earlyMorning, tz)).toBe(true);
    });

    it('evaluates standard daytime window (05:00 to 23:00)', () => {
      const config: PowerScheduleConfig = {
        tv_auto_power: true,
        power_schedule_mode: 'fixed',
        power_on_time: '05:00',
        power_off_time: '23:00',
      };

      // 04:59 AM EDT -> Standby (false)
      const beforeOn = new Date('2026-10-25T08:59:00.000Z');
      expect(isScreenInPowerWindow(config, beforeOn, tz)).toBe(false);

      // 05:00 AM EDT -> Powered ON (true)
      const exactlyOn = new Date('2026-10-25T09:00:00.000Z');
      expect(isScreenInPowerWindow(config, exactlyOn, tz)).toBe(true);

      // 14:30 PM EDT -> Powered ON (true)
      const midDay = new Date('2026-10-25T18:30:00.000Z');
      expect(isScreenInPowerWindow(config, midDay, tz)).toBe(true);

      // 22:59 PM EDT -> Powered ON (true)
      const justBeforeOff = new Date('2026-10-26T02:59:00.000Z');
      expect(isScreenInPowerWindow(config, justBeforeOff, tz)).toBe(true);

      // 23:00 PM EDT -> Standby (false)
      const exactlyOff = new Date('2026-10-26T03:00:00.000Z');
      expect(isScreenInPowerWindow(config, exactlyOff, tz)).toBe(false);

      // 01:00 AM EDT -> Standby (false)
      const lateNight = new Date('2026-10-26T05:00:00.000Z');
      expect(isScreenInPowerWindow(config, lateNight, tz)).toBe(false);
    });

    it('evaluates cross-midnight window (e.g. 20:00 ON -> 03:00 OFF)', () => {
      const config: PowerScheduleConfig = {
        tv_auto_power: true,
        power_schedule_mode: 'fixed',
        power_on_time: '20:00',
        power_off_time: '03:00',
      };

      // 19:59 PM EDT -> Standby (false)
      const beforeStart = new Date('2026-10-25T23:59:00.000Z');
      expect(isScreenInPowerWindow(config, beforeStart, tz)).toBe(false);

      // 20:00 PM EDT -> Powered ON (true)
      const atStart = new Date('2026-10-26T00:00:00.000Z');
      expect(isScreenInPowerWindow(config, atStart, tz)).toBe(true);

      // 23:30 PM EDT -> Powered ON (true)
      const lateNight = new Date('2026-10-26T03:30:00.000Z');
      expect(isScreenInPowerWindow(config, lateNight, tz)).toBe(true);

      // 01:15 AM EDT (past midnight) -> Powered ON (true)
      const pastMidnight = new Date('2026-10-26T05:15:00.000Z');
      expect(isScreenInPowerWindow(config, pastMidnight, tz)).toBe(true);

      // 03:00 AM EDT -> Standby (false)
      const atEnd = new Date('2026-10-26T07:00:00.000Z');
      expect(isScreenInPowerWindow(config, atEnd, tz)).toBe(false);

      // 10:00 AM EDT (daytime) -> Standby (false)
      const daytime = new Date('2026-10-26T14:00:00.000Z');
      expect(isScreenInPowerWindow(config, daytime, tz)).toBe(false);
    });

    it('evaluates dynamic prayer-relative schedules', () => {
      const config: PowerScheduleConfig = {
        tv_auto_power: true,
        power_schedule_mode: 'prayer_relative',
        power_on_time: '05:00',
        power_off_time: '23:00',
        power_fajr_offset_minutes: -30, // 30 min before Fajr
        power_isha_offset_minutes: 30, // 30 min after Isha
      };

      const prayerTimes = {
        fajrAdhan: '06:00', // Effective ON: 05:30 (09:30 UTC)
        ishaIqamah: '21:00', // Effective OFF: 21:30 (01:30 UTC next day)
      };

      // 05:15 AM EDT (before 05:30) -> Standby (false)
      const beforeFajrWake = new Date('2026-10-25T09:15:00.000Z');
      expect(isScreenInPowerWindow(config, beforeFajrWake, tz, prayerTimes)).toBe(false);

      // 05:35 AM EDT (after 05:30) -> Powered ON (true)
      const duringDay = new Date('2026-10-25T09:35:00.000Z');
      expect(isScreenInPowerWindow(config, duringDay, tz, prayerTimes)).toBe(true);

      // 21:35 PM EDT (after 21:30) -> Standby (false)
      const afterIshaSleep = new Date('2026-10-26T01:35:00.000Z');
      expect(isScreenInPowerWindow(config, afterIshaSleep, tz, prayerTimes)).toBe(false);
    });
  });
});
