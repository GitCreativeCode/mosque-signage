/**
 * DST-Safe IANA Timezone String Parser
 * MosqueSignage (TV)
 */

function extractDateParts(
  baseDate: Date,
  timezone: string
): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(baseDate);

  return {
    year: parseInt(parts.find((p) => p.type === 'year')?.value ?? '2026', 10),
    month: parseInt(parts.find((p) => p.type === 'month')?.value ?? '01', 10),
    day: parseInt(parts.find((p) => p.type === 'day')?.value ?? '01', 10),
  };
}

/**
 * Resolves the UTC offset (in minutes, e.g. -300 for EST) of an instant in a given IANA timezone.
 */
export function resolveTimezoneOffsetMinutes(instant: Date, timezone: string): number {
  const tzName =
    new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'longOffset' })
      .formatToParts(instant)
      .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';

  const cleanOffset = tzName.replace(/\u2212/g, '-').replace('GMT', '').trim();
  if (!cleanOffset || cleanOffset === 'Z') return 0;

  const match = cleanOffset.match(/^([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!match || !match[2]) return 0;

  const sign = match[1] === '-' ? -1 : 1;
  const offHours = parseInt(match[2], 10);
  const offMins = parseInt(match[3] || '0', 10);
  return sign * (offHours * 60 + offMins);
}

/**
 * Resolves a wall-clock date/time within an IANA timezone to a UTC Date using 2-pass DST convergence.
 */
export function zonedWallClockToDate(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  timezone: string
): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
  const offsetPass1 = resolveTimezoneOffsetMinutes(utcGuess, timezone);
  const candidatePass1 = new Date(utcGuess.getTime() - offsetPass1 * 60_000);
  const offsetPass2 = resolveTimezoneOffsetMinutes(candidatePass1, timezone);
  return new Date(utcGuess.getTime() - offsetPass2 * 60_000);
}

/**
 * Parses an 'HH:mm' string on a base date within an IANA timezone into a UTC Date.
 */
export function parseTimeToDate(
  timeStr: string,
  baseDate: Date,
  timezone: string = 'America/Toronto'
): Date {
  const { year, month, day } = extractDateParts(baseDate, timezone);
  const cleanTime = timeStr.trim();
  const [hStr, mStr] = cleanTime.split(':');
  const parsedH = Number.parseInt(hStr ?? '', 10);
  const parsedM = Number.parseInt(mStr ?? '', 10);
  const safeHours = Number.isFinite(parsedH) ? Math.min(23, Math.max(0, parsedH)) : 0;
  const safeMinutes = Number.isFinite(parsedM) ? Math.min(59, Math.max(0, parsedM)) : 0;

  return zonedWallClockToDate(year, month, day, safeHours, safeMinutes, timezone);
}
