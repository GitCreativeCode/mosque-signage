import { describe, it, expect } from 'vitest';
import type { Poster } from '@/types/poster';
import {
  parseTimeToMinutes, formatMinutesTo12h, formatTimeStrTo12h,
  validateRecurringScheduleRule, parseRecurringSchedule,
  getLocalDayAndTimeInTimezone, isTimeInRecurringWindow,
  detectOverlappingRules, mergeOverlappingRules,
  getNextRecurringTransition, formatRecurringSummary,
} from '@/lib/posters/recurring-schedule';
import { getPosterRecurringSubStatus } from '@/lib/engine/poster-status';
import { filterPublicActivePosters } from '@/lib/posters/poster-schedule-filter';

describe('Recurring Poster Scheduling Engine', () => {
  describe('Time Parsing & Formatting Utilities', () => {
    it('parses "HH:MM" 24h strings into minutes since midnight', () => {
      expect(parseTimeToMinutes('00:00')).toBe(0);
      expect(parseTimeToMinutes('09:30')).toBe(570);
      expect(parseTimeToMinutes('11:00')).toBe(660);
      expect(parseTimeToMinutes('15:45')).toBe(945);
      expect(parseTimeToMinutes('23:59')).toBe(1439);
    });

    it('formats minutes into 12-hour AM/PM string', () => {
      expect(formatMinutesTo12h(0)).toBe('12:00 AM');
      expect(formatMinutesTo12h(570)).toBe('9:30 AM');
      expect(formatMinutesTo12h(720)).toBe('12:00 PM');
      expect(formatMinutesTo12h(780)).toBe('1:00 PM');
      expect(formatMinutesTo12h(1439)).toBe('11:59 PM');
    });

    it('formats time string into 12-hour display format', () => {
      expect(formatTimeStrTo12h('11:00')).toBe('11:00 AM');
      expect(formatTimeStrTo12h('15:00')).toBe('3:00 PM');
    });
  });

  describe('Rule Validation & JSON Parsing', () => {
    it('validates a standard Friday Jumuah window rule', () => {
      expect(validateRecurringScheduleRule({ days: [5], startTime: '11:00', endTime: '15:00' })).toBe(true);
    });

    it('rejects rule with startTime >= endTime', () => {
      expect(validateRecurringScheduleRule({ days: [5], startTime: '15:00', endTime: '11:00' })).toBe(false);
      expect(validateRecurringScheduleRule({ days: [5], startTime: '12:00', endTime: '12:00' })).toBe(false);
    });

    it('rejects rules with malformed time format or invalid day numbers', () => {
      expect(validateRecurringScheduleRule({ days: [5], startTime: '9:00', endTime: '15:00' })).toBe(false);
      expect(validateRecurringScheduleRule({ days: [5], startTime: '25:00', endTime: '26:00' })).toBe(false);
      expect(validateRecurringScheduleRule({ days: [], startTime: '10:00', endTime: '12:00' })).toBe(false);
      expect(validateRecurringScheduleRule({ days: [7], startTime: '10:00', endTime: '12:00' })).toBe(false);
      expect(validateRecurringScheduleRule({ days: [-1], startTime: '10:00', endTime: '12:00' })).toBe(false);
    });

    it('parses valid JSON array of rules', () => {
      const json = JSON.stringify([
        { days: [5], startTime: '11:00', endTime: '15:00' },
        { days: [0, 6], startTime: '09:00', endTime: '18:00' },
      ]);
      const rules = parseRecurringSchedule(json);
      expect(rules).not.toBeNull();
      expect(rules?.length).toBe(2);
      expect(rules?.[0]?.days).toEqual([5]);
    });

    it('parses object wrapper with enabled flag', () => {
      const enabledJson = JSON.stringify({
        enabled: true,
        rules: [{ days: [5], startTime: '11:00', endTime: '15:00' }],
      });
      expect(parseRecurringSchedule(enabledJson)).toHaveLength(1);

      const disabledJson = JSON.stringify({
        enabled: false,
        rules: [{ days: [5], startTime: '11:00', endTime: '15:00' }],
      });
      expect(parseRecurringSchedule(disabledJson)).toBeNull();
    });

    it('fails closed (returns null) on corrupt JSON or invalid rules', () => {
      expect(parseRecurringSchedule('')).toBeNull();
      expect(parseRecurringSchedule(null)).toBeNull();
      expect(parseRecurringSchedule('null')).toBeNull();
      expect(parseRecurringSchedule('{ corrupt json')).toBeNull();
      expect(parseRecurringSchedule('[]')).toBeNull();
      expect(parseRecurringSchedule(JSON.stringify([{ days: [5], startTime: '15:00', endTime: '11:00' }]))).toBeNull();
    });
  });

  describe('Timezone Resolution & Window Matching', () => {
    const fridayUtc = new Date('2026-11-20T17:00:00Z');

    it('resolves correct local weekday and time in venue timezone', () => {
      const ny = getLocalDayAndTimeInTimezone(fridayUtc, 'America/New_York');
      expect(ny.day).toBe(5);
      expect(ny.timeStr).toBe('12:00');
      expect(ny.timeMinutes).toBe(720);

      const la = getLocalDayAndTimeInTimezone(fridayUtc, 'America/Los_Angeles');
      expect(la.day).toBe(5);
      expect(la.timeStr).toBe('09:00');
      expect(la.timeMinutes).toBe(540);
    });

    it('correctly matches when time is in recurring window', () => {
      const rules = [{ days: [5], startTime: '11:00', endTime: '15:00' }];
      expect(isTimeInRecurringWindow(rules, fridayUtc, 'America/New_York')).toBe(true);
      expect(isTimeInRecurringWindow(rules, fridayUtc, 'America/Los_Angeles')).toBe(false);
    });

    it('respects exact window start (inclusive) and end boundary (exclusive)', () => {
      const rules = [{ days: [5], startTime: '11:00', endTime: '15:00' }];
      expect(isTimeInRecurringWindow(rules, new Date('2026-11-20T16:00:00Z'), 'America/New_York')).toBe(true);
      expect(isTimeInRecurringWindow(rules, new Date('2026-11-20T15:59:59Z'), 'America/New_York')).toBe(false);
      expect(isTimeInRecurringWindow(rules, new Date('2026-11-20T20:00:00Z'), 'America/New_York')).toBe(false);
    });

    it('rejects non-matching day of week', () => {
      const thursdayUtc = new Date('2026-11-19T17:00:00Z');
      expect(isTimeInRecurringWindow([{ days: [5], startTime: '11:00', endTime: '15:00' }], thursdayUtc, 'America/New_York')).toBe(false);
    });
  });

  describe('Overlap Detection and Merging', () => {
    it('detects overlapping rules on the same day', () => {
      const check = detectOverlappingRules([
        { days: [5], startTime: '10:00', endTime: '13:00' },
        { days: [5], startTime: '12:00', endTime: '15:00' },
      ]);
      expect(check.hasOverlap).toBe(true);
      expect(check.dayNames).toContain('Fri');
    });

    it('reports no overlap for disjoint times or distinct days', () => {
      const check = detectOverlappingRules([
        { days: [5], startTime: '10:00', endTime: '12:00' },
        { days: [5], startTime: '13:00', endTime: '15:00' },
        { days: [0], startTime: '10:00', endTime: '14:00' },
      ]);
      expect(check.hasOverlap).toBe(false);
      expect(check.dayNames).toHaveLength(0);
    });

    it('merges overlapping rules into single union intervals', () => {
      const merged = mergeOverlappingRules([
        { days: [5], startTime: '10:00', endTime: '12:30' },
        { days: [5], startTime: '12:00', endTime: '14:00' },
      ]);
      expect(merged).toHaveLength(1);
      expect(merged[0]?.startTime).toBe('10:00');
      expect(merged[0]?.endTime).toBe('14:00');
      expect(merged[0]?.days).toEqual([5]);
    });
  });

  describe('Next Transition Telemetry & Summaries', () => {
    it('calculates the next upcoming boundary timestamp', () => {
      const rules = [{ days: [5], startTime: '11:00', endTime: '15:00' }];
      const now = new Date('2026-11-20T14:00:00Z'); // Friday 09:00 AM NY
      const nextTransition = getNextRecurringTransition(rules, now, 'America/New_York');
      expect(nextTransition).not.toBeNull();
      expect(nextTransition?.getTime()).toBeGreaterThan(now.getTime());
    });

    it('formats human-readable summary badges', () => {
      expect(formatRecurringSummary(null)).toBe('All Day (Continuous 24/7)');
      expect(formatRecurringSummary([])).toBe('All Day (Continuous 24/7)');
      expect(formatRecurringSummary([{ days: [5], startTime: '11:00', endTime: '15:00' }])).toBe('Fridays Only from 11:00 AM to 3:00 PM');
      expect(formatRecurringSummary([{ days: [0, 6], startTime: '09:00', endTime: '18:00' }])).toBe('Weekends from 9:00 AM to 6:00 PM');
    });
  });

  describe('Poster Status Sub-Status & Engine Filtering', () => {
    const basePoster: Poster = {
      id: 'poster-1', title: 'Jumuah Program', image_path: '/uploads/jumuah.jpg',
      start_at: '2026-11-01T00:00:00Z', end_at: '2026-12-01T00:00:00Z',
      duration_seconds: 15, is_active: true, display_order: 1, created_at: '2026-11-01T00:00:00Z',
    };

    it('identifies continuous, active now, and standby sub-statuses', () => {
      expect(getPosterRecurringSubStatus(basePoster, new Date())).toBe('CONTINUOUS');

      const jumuahPoster: Poster = {
        ...basePoster,
        recurring_schedule: JSON.stringify([{ days: [5], startTime: '11:00', endTime: '15:00' }]),
      };
      // Friday 12:00 PM NY -> ACTIVE_NOW
      expect(getPosterRecurringSubStatus(jumuahPoster, new Date('2026-11-20T17:00:00Z'), 'America/New_York')).toBe('ACTIVE_NOW');
      // Thursday 12:00 PM NY -> STANDBY
      expect(getPosterRecurringSubStatus(jumuahPoster, new Date('2026-11-19T17:00:00Z'), 'America/New_York')).toBe('STANDBY');
    });

    it('filterPublicActivePosters strictly excludes standby posters (Anti-Leak Security)', () => {
      const continuousPoster: Poster = { ...basePoster, id: 'continuous' };
      const jumuahPoster: Poster = {
        ...basePoster, id: 'jumuah',
        recurring_schedule: JSON.stringify([{ days: [5], startTime: '11:00', endTime: '15:00' }]),
      };
      const expiredPoster: Poster = {
        ...basePoster, id: 'expired', end_at: '2026-11-10T00:00:00Z',
        recurring_schedule: JSON.stringify([{ days: [5], startTime: '11:00', endTime: '15:00' }]),
      };

      const all = [continuousPoster, jumuahPoster, expiredPoster];
      // On Thursday (outside Friday window):
      const filteredThursday = filterPublicActivePosters(all, new Date('2026-11-19T17:00:00Z'), 'America/New_York');
      expect(filteredThursday.activePosters.map((p) => p.id)).toEqual(['continuous']);

      // On Friday during window:
      const filteredFriday = filterPublicActivePosters(all, new Date('2026-11-20T17:00:00Z'), 'America/New_York');
      expect(filteredFriday.activePosters.map((p) => p.id)).toEqual(['continuous', 'jumuah']);
    });
  });
});
