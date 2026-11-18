import { describe, it, expect } from 'vitest';
import { parseDateInput, parseTimeInput } from '@/components/admin/DateTimePicker';

describe('DateTimePicker Input Parsing Engine', () => {
  describe('parseDateInput', () => {
    it('parses standard ISO date YYYY-MM-DD', () => {
      const res = parseDateInput('2026-10-25');
      expect(res).toEqual({ year: 2026, month: 10, day: 25 });
    });

    it('parses slash ISO date YYYY/MM/DD', () => {
      const res = parseDateInput('2026/05/09');
      expect(res).toEqual({ year: 2026, month: 5, day: 9 });
    });

    it('parses US format MM/DD/YYYY', () => {
      const res = parseDateInput('12/31/2026');
      expect(res).toEqual({ year: 2026, month: 12, day: 31 });
    });

    it('parses single digit US format M/D/YYYY', () => {
      const res = parseDateInput('4/5/2026');
      expect(res).toEqual({ year: 2026, month: 4, day: 5 });
    });

    it('rejects invalid months or days', () => {
      expect(parseDateInput('2026-13-01')).toBeNull();
      expect(parseDateInput('2026-00-10')).toBeNull();
      expect(parseDateInput('2026-05-32')).toBeNull();
      expect(parseDateInput('invalid-text')).toBeNull();
    });
  });

  describe('parseTimeInput', () => {
    it('parses 24-hour time HH:mm', () => {
      expect(parseTimeInput('14:30')).toEqual({ hour: 14, minute: 30 });
      expect(parseTimeInput('00:00')).toEqual({ hour: 0, minute: 0 });
      expect(parseTimeInput('23:59')).toEqual({ hour: 23, minute: 59 });
    });

    it('parses 12-hour PM times', () => {
      expect(parseTimeInput('2:30 PM')).toEqual({ hour: 14, minute: 30 });
      expect(parseTimeInput('12:00 pm')).toEqual({ hour: 12, minute: 0 });
      expect(parseTimeInput('11:45PM')).toEqual({ hour: 23, minute: 45 });
    });

    it('parses 12-hour AM times', () => {
      expect(parseTimeInput('12:00 AM')).toEqual({ hour: 0, minute: 0 });
      expect(parseTimeInput('6:15 am')).toEqual({ hour: 6, minute: 15 });
      expect(parseTimeInput('09:05AM')).toEqual({ hour: 9, minute: 5 });
    });

    it('rejects out-of-range times', () => {
      expect(parseTimeInput('25:00')).toBeNull();
      expect(parseTimeInput('12:60')).toBeNull();
      expect(parseTimeInput('13:00 PM')).toBeNull(); // 13 is invalid in 12h AM/PM
      expect(parseTimeInput('garbage')).toBeNull();
    });
  });
});
