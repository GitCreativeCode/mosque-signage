/**
 * Pure Recurring Poster Scheduling Engine & Rule Evaluator
 * MosqueSignage (TV)
 */

import type { RecurringSchedule, RecurringScheduleRule } from '@/types/index';
import {
  parseTimeToMinutes,
  getLocalDayAndTimeInTimezone,
  DAY_LABELS,
} from './recurring-schedule-helpers';

export * from './recurring-schedule-helpers';

export function validateRecurringScheduleRule(rule: unknown): rule is RecurringScheduleRule {
  if (!rule || typeof rule !== 'object') return false;
  const r = rule as Partial<RecurringScheduleRule>;
  if (r.id !== undefined && typeof r.id !== 'string') return false;
  if (!Array.isArray(r.days) || r.days.length === 0) return false;
  for (const day of r.days) {
    if (typeof day !== 'number' || day < 0 || day > 6 || !Number.isInteger(day)) {
      return false;
    }
  }
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!r.startTime || typeof r.startTime !== 'string' || !timeRegex.test(r.startTime)) {
    return false;
  }
  if (!r.endTime || typeof r.endTime !== 'string' || !timeRegex.test(r.endTime)) {
    return false;
  }
  return parseTimeToMinutes(r.startTime) < parseTimeToMinutes(r.endTime);
}

export function parseRecurringSchedule(json: string | null | undefined): RecurringSchedule | null {
  if (!json || typeof json !== 'string') return null;
  const trimmed = json.trim();
  if (trimmed === '' || trimmed === 'null') return null;

  try {
    let raw: unknown = JSON.parse(trimmed);
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const obj = raw as { enabled?: boolean; rules?: unknown };
      if (obj.enabled === false) return null;
      raw = obj.rules;
    }
    if (!Array.isArray(raw) || raw.length === 0) return null;
    const validatedRules: RecurringScheduleRule[] = [];
    for (const item of raw) {
      if (!validateRecurringScheduleRule(item)) {
        return null; // fail-closed on corrupt rule
      }
      validatedRules.push(item);
    }
    return validatedRules;
  } catch {
    return null; // fail-closed on malformed JSON
  }
}

export function isTimeInRecurringWindow(
  rules: RecurringSchedule | null | undefined,
  now: Date,
  timezone: string
): boolean {
  if (!rules || rules.length === 0) return true; // Continuous 24/7 rotation

  const { day, timeMinutes } = getLocalDayAndTimeInTimezone(now, timezone);

  for (const rule of rules) {
    if (rule.days.includes(day)) {
      const startMin = parseTimeToMinutes(rule.startTime);
      const endMin = parseTimeToMinutes(rule.endTime);
      if (timeMinutes >= startMin && timeMinutes < endMin) {
        return true; // Match found (logical OR)
      }
    }
  }

  return false;
}

export function detectOverlappingRules(rules: RecurringSchedule): {
  readonly hasOverlap: boolean;
  readonly dayNames: readonly string[];
} {
  if (rules.length < 2) return { hasOverlap: false, dayNames: [] };

  const overlappingDays = new Set<string>();

  for (let i = 0; i < rules.length; i++) {
    const a = rules[i];
    if (!a) continue;
    const startA = parseTimeToMinutes(a.startTime);
    const endA = parseTimeToMinutes(a.endTime);

    for (let j = i + 1; j < rules.length; j++) {
      const b = rules[j];
      if (!b) continue;
      const startB = parseTimeToMinutes(b.startTime);
      const endB = parseTimeToMinutes(b.endTime);

      const timeOverlaps = startA < endB && startB < endA;
      if (timeOverlaps) {
        for (const day of a.days) {
          if (b.days.includes(day)) {
            overlappingDays.add(DAY_LABELS[day] ?? `Day ${day}`);
          }
        }
      }
    }
  }

  return {
    hasOverlap: overlappingDays.size > 0,
    dayNames: Array.from(overlappingDays),
  };
}

export function mergeOverlappingRules(rules: RecurringSchedule): RecurringSchedule {
  if (rules.length < 2) return rules;

  interface TempRule {
    id: string;
    days: number[];
    startTime: string;
    endTime: string;
  }
  const merged: TempRule[] = [];

  for (let d = 0; d <= 6; d++) {
    const dayRules = rules.filter((r) => r.days.includes(d));
    if (dayRules.length === 0) continue;

    const intervals = dayRules
      .map((r) => ({
        start: parseTimeToMinutes(r.startTime),
        end: parseTimeToMinutes(r.endTime),
      }))
      .sort((a, b) => a.start - b.start);

    const mergedIntervals: Array<{ start: number; end: number }> = [];
    for (const curr of intervals) {
      const last = mergedIntervals[mergedIntervals.length - 1];
      if (!last) {
        mergedIntervals.push({ ...curr });
      } else if (curr.start <= last.end) {
        last.end = Math.max(last.end, curr.end);
      } else {
        mergedIntervals.push({ ...curr });
      }
    }

    for (const interval of mergedIntervals) {
      const startStr = `${String(Math.floor(interval.start / 60)).padStart(2, '0')}:${String(
        interval.start % 60
      ).padStart(2, '0')}`;
      const endStr = `${String(Math.floor(interval.end / 60)).padStart(2, '0')}:${String(
        interval.end % 60
      ).padStart(2, '0')}`;

      const existingMatch = merged.find(
        (m) => m.startTime === startStr && m.endTime === endStr
      );
      if (existingMatch) {
        if (!existingMatch.days.includes(d)) {
          existingMatch.days = [...existingMatch.days, d].sort();
        }
      } else {
        merged.push({
          id: `merged-${d}-${interval.start}-${interval.end}`,
          days: [d],
          startTime: startStr,
          endTime: endStr,
        });
      }
    }
  }

  return merged;
}
