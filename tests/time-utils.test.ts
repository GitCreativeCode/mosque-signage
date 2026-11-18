import { describe, it, expect } from 'vitest';
import {
  timeToMinutes,
  format12h,
  checkChronologicalShifts,
  formatCountdown,
  parseCsvRowDate,
} from '@/lib/utils/time';
import { formatRemainingTime } from '@/components/display/MiniPrayerPill';

describe('Time Utilities & Formatting Suite', () => {
  describe('timeToMinutes & format12h conversions', () => {
    it('converts HH:mm strings to minutes from midnight', () => {
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('05:30')).toBe(330);
      expect(timeToMinutes('12:00')).toBe(720);
      expect(timeToMinutes('23:59')).toBe(1439);
      expect(timeToMinutes('')).toBe(0);
      expect(timeToMinutes(null)).toBe(0);
      expect(timeToMinutes(undefined)).toBe(0);
    });

    it('formats 24-hour time to 12-hour AM/PM representations', () => {
      expect(format12h('00:00')).toBe('12:00 AM');
      expect(format12h('05:15')).toBe('5:15 AM');
      expect(format12h('12:00')).toBe('12:00 PM');
      expect(format12h('13:30')).toBe('1:30 PM');
      expect(format12h('23:45')).toBe('11:45 PM');
      expect(format12h(null)).toBe('—');
      expect(format12h('')).toBe('—');
    });
  });

  describe('checkChronologicalShifts', () => {
    it('returns null when shifts are strictly in chronological order', () => {
      const validShifts = [
        { shift_number: 1, adhan_time: '12:30' },
        { shift_number: 2, adhan_time: '13:15' },
        { shift_number: 3, adhan_time: '14:00' },
      ];
      expect(checkChronologicalShifts(validShifts)).toBeNull();
    });

    it('returns null for an empty or single-element shift array', () => {
      expect(checkChronologicalShifts([])).toBeNull();
      expect(checkChronologicalShifts([{ shift_number: 1, adhan_time: '13:00' }])).toBeNull();
    });

    it('returns an error message when a shift is placed earlier than its predecessor', () => {
      const reversedShifts = [
        { shift_number: 1, adhan_time: '13:30' },
        { shift_number: 2, adhan_time: '12:45' },
      ];
      const result = checkChronologicalShifts(reversedShifts);
      expect(result).not.toBeNull();
      expect(result).toContain('Cannot reorder');
      expect(result).toContain('12:45 PM cannot be placed before or at the same time as Shift at 1:30 PM');
    });

    it('returns an error message when two shifts share the exact same start time', () => {
      const duplicateTimeShifts = [
        { shift_number: 1, adhan_time: '13:00' },
        { shift_number: 2, adhan_time: '13:00' },
      ];
      const result = checkChronologicalShifts(duplicateTimeShifts);
      expect(result).not.toBeNull();
      expect(result).toContain('cannot be placed before or at the same time as');
    });
  });

  describe('formatCountdown', () => {
    it('returns "Upcoming" for negative or undefined minutes', () => {
      expect(formatCountdown(undefined)).toBe('Upcoming');
      expect(formatCountdown(-1)).toBe('Upcoming');
      expect(formatCountdown(-10)).toBe('Upcoming');
    });

    it('returns "Starting Now" when exactly 0 minutes remain', () => {
      expect(formatCountdown(0)).toBe('Starting Now');
    });

    it('returns "in Xm" when duration is under 60 minutes', () => {
      expect(formatCountdown(1)).toBe('in 1m');
      expect(formatCountdown(15)).toBe('in 15m');
      expect(formatCountdown(59)).toBe('in 59m');
    });

    it('returns "in Xh" for exact hours without remainder', () => {
      expect(formatCountdown(60)).toBe('in 1h');
      expect(formatCountdown(120)).toBe('in 2h');
    });

    it('returns "in Xh Ym" for durations with both hours and minutes', () => {
      expect(formatCountdown(65)).toBe('in 1h 5m');
      expect(formatCountdown(135)).toBe('in 2h 15m');
    });
  });

  describe('formatRemainingTime (MiniPrayerPill)', () => {
    it('formats countdowns >= 1 hour with hours and minutes', () => {
      expect(formatRemainingTime(3600)).toBe('in 1h');
      expect(formatRemainingTime(5400)).toBe('in 1h 30m');
      expect(formatRemainingTime(7200)).toBe('in 2h');
    });

    it('formats countdowns between 60s and 3599s in minutes', () => {
      expect(formatRemainingTime(60)).toBe('in 1m');
      expect(formatRemainingTime(90)).toBe('in 2m');
      expect(formatRemainingTime(3599)).toBe('in 60m');
    });

    it('formats countdowns under 60 seconds with exact seconds remaining', () => {
      expect(formatRemainingTime(45)).toBe('in 45s');
      expect(formatRemainingTime(10)).toBe('in 10s');
      expect(formatRemainingTime(1)).toBe('in 1s');
      expect(formatRemainingTime(0)).toBe('in 1s');
    });

    it('falls back to minutesRemaining when secondsRemaining is omitted', () => {
      expect(formatRemainingTime(undefined, 45)).toBe('in 45m');
      expect(formatRemainingTime(undefined, 90)).toBe('in 1h 30m');
      expect(formatRemainingTime(undefined, 0)).toBe('in 1s');
    });
  });

  describe('parseCsvRowDate', () => {
    const defaultYear = 2026;

    it('parses two-column Month, Day inputs', () => {
      const res = parseCsvRowDate('11', '8', defaultYear);
      expect(res).toEqual({
        dateStr: '2026-11-08',
        dataColOffset: 2,
        isMonthDayCol: true,
      });

      const singleDigit = parseCsvRowDate('1', '5', defaultYear);
      expect(singleDigit).toEqual({
        dateStr: '2026-01-05',
        dataColOffset: 2,
        isMonthDayCol: true,
      });
    });

    it('returns null for out-of-range month or day values in 2-column mode', () => {
      expect(parseCsvRowDate('13', '10', defaultYear)).toBeNull();
      expect(parseCsvRowDate('10', '32', defaultYear)).toBeNull();
      expect(parseCsvRowDate('0', '5', defaultYear)).toBeNull();
    });

    it('parses standard ISO date format (YYYY-MM-DD or YYYY/MM/DD)', () => {
      const isoHyphen = parseCsvRowDate('2026-11-08', '', defaultYear);
      expect(isoHyphen).toEqual({
        dateStr: '2026-11-08',
        dataColOffset: 1,
        isMonthDayCol: false,
      });

      const isoSlash = parseCsvRowDate('2026/3/9', '', defaultYear);
      expect(isoSlash).toEqual({
        dateStr: '2026-03-09',
        dataColOffset: 1,
        isMonthDayCol: false,
      });
    });

    it('parses North American date format (MM/DD/YYYY)', () => {
      const naDate = parseCsvRowDate('11/08/2026', '', defaultYear);
      expect(naDate).toEqual({
        dateStr: '2026-11-08',
        dataColOffset: 1,
        isMonthDayCol: false,
      });

      const naHyphen = parseCsvRowDate('3-9-2026', '', defaultYear);
      expect(naHyphen).toEqual({
        dateStr: '2026-03-09',
        dataColOffset: 1,
        isMonthDayCol: false,
      });
    });

    it('returns null for empty or invalid strings', () => {
      expect(parseCsvRowDate('', '', defaultYear)).toBeNull();
      expect(parseCsvRowDate(undefined, undefined, defaultYear)).toBeNull();
      expect(parseCsvRowDate('not-a-date', 'gibberish', defaultYear)).toBeNull();
    });
  });
});

