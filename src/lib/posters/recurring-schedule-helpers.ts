/**
 * Pure Recurring Poster Scheduling Helpers & Timezone Formatter
 * MosqueSignage (TV)
 */

import type { RecurringSchedule } from '@/types/index';

export const WEEKDAY_SHORT_MAP: Readonly<Record<string, number>> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [hStr, mStr] = timeStr.trim().split(':');
  const h = Number.parseInt(hStr ?? '0', 10);
  const m = Number.parseInt(mStr ?? '0', 10);
  return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
}

export function formatMinutesTo12h(minutes: number): string {
  const totalM = Math.min(1439, Math.max(0, minutes));
  const h24 = Math.floor(totalM / 60);
  const m = totalM % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mStr = String(m).padStart(2, '0');
  return `${h12}:${mStr} ${ampm}`;
}

export function formatTimeStrTo12h(timeStr: string): string {
  return formatMinutesTo12h(parseTimeToMinutes(timeStr));
}

export function getLocalDayAndTimeInTimezone(
  now: Date,
  timezone: string
): { day: number; timeMinutes: number; timeStr: string } {
  try {
    const dayFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
    });
    const dayName = dayFormatter.format(now);
    const day = WEEKDAY_SHORT_MAP[dayName] ?? now.getDay();

    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const parts = timeFormatter.formatToParts(now);
    const hourVal = parts.find((p) => p.type === 'hour')?.value ?? '00';
    const minuteVal = parts.find((p) => p.type === 'minute')?.value ?? '00';

    const h = Number.parseInt(hourVal, 10);
    const m = Number.parseInt(minuteVal, 10);
    const cleanH = Number.isNaN(h) ? 0 : h === 24 ? 0 : h;
    const cleanM = Number.isNaN(m) ? 0 : m;

    const timeMinutes = cleanH * 60 + cleanM;
    const timeStr = `${String(cleanH).padStart(2, '0')}:${String(cleanM).padStart(2, '0')}`;

    return { day, timeMinutes, timeStr };
  } catch {
    const day = now.getDay();
    const timeMinutes = now.getHours() * 60 + now.getMinutes();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return { day, timeMinutes, timeStr };
  }
}

export function getNextRecurringTransition(
  rules: RecurringSchedule | null | undefined,
  now: Date,
  timezone: string
): Date | null {
  if (!rules || rules.length === 0) return null;

  const nowMs = now.getTime();
  let earliestFutureMs = Number.POSITIVE_INFINITY;

  for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
    const targetDate = new Date(nowMs + dayOffset * 86400000);
    const { day } = getLocalDayAndTimeInTimezone(targetDate, timezone);

    for (const rule of rules) {
      if (rule.days.includes(day)) {
        for (const timeStr of [rule.startTime, rule.endTime]) {
          const [hStr, mStr] = timeStr.split(':');
          const h = Number.parseInt(hStr ?? '0', 10);
          const m = Number.parseInt(mStr ?? '0', 10);

          try {
            const dateInTzFormatter = new Intl.DateTimeFormat('en-US', {
              timeZone: timezone,
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            });
            const parts = dateInTzFormatter.formatToParts(targetDate);
            const y = parts.find((p) => p.type === 'year')?.value;
            const mo = parts.find((p) => p.type === 'month')?.value;
            const d = parts.find((p) => p.type === 'day')?.value;

            if (y && mo && d) {
              const candidate = new Date(
                Date.parse(`${y}-${mo}-${d}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)
              );
              const candidateMs = candidate.getTime();
              if (candidateMs > nowMs && candidateMs < earliestFutureMs) {
                earliestFutureMs = candidateMs;
              }
            }
          } catch {
            const candidate = new Date(targetDate);
            candidate.setHours(h, m, 0, 0);
            const candidateMs = candidate.getTime();
            if (candidateMs > nowMs && candidateMs < earliestFutureMs) {
              earliestFutureMs = candidateMs;
            }
          }
        }
      }
    }
  }

  return Number.isFinite(earliestFutureMs) ? new Date(earliestFutureMs) : null;
}

export function formatRecurringSummary(rules: RecurringSchedule | null | undefined): string {
  if (!rules || rules.length === 0) return 'All Day (Continuous 24/7)';

  const summaries = rules.map((r) => {
    let daysSummary: string;
    const sortedDays = [...r.days].sort();
    if (sortedDays.length === 7) {
      daysSummary = 'All Days';
    } else if (sortedDays.length === 5 && sortedDays.join(',') === '1,2,3,4,5') {
      daysSummary = 'Weekdays';
    } else if (sortedDays.length === 2 && sortedDays.join(',') === '0,6') {
      daysSummary = 'Weekends';
    } else if (sortedDays.length === 1 && sortedDays[0] === 5) {
      daysSummary = 'Fridays Only';
    } else {
      daysSummary = sortedDays.map((d) => DAY_LABELS[d] ?? '').join(', ');
    }

    return `${daysSummary} from ${formatTimeStrTo12h(r.startTime)} to ${formatTimeStrTo12h(r.endTime)}`;
  });

  return summaries.join('; ');
}

export function formatNextActiveTelemetry(
  rules: RecurringSchedule | null | undefined,
  now: Date,
  timezone: string
): string {
  if (!rules || rules.length === 0) return 'Active';

  const next = getNextRecurringTransition(rules, now, timezone);
  if (!next) return 'Standby';

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
    return `Next: ${formatter.format(next)}`;
  } catch {
    return 'Standby';
  }
}

