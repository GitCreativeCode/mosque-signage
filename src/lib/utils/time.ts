/**
 * Time Utilities & Formatting
 * MosqueSignage (TV)
 */

/**
 * Converts minutes from midnight (0–1439) into a 24-hour 'HH:mm' time string.
 */
export function minutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Subtracts minutes from a 24-hour 'HH:mm' time string, wrapping across midnight if necessary.
 */
export function subtractMinutesFromTime(
  timeStr: string | null | undefined,
  minutesToSubtract: number
): string {
  if (!timeStr) return '--:--';
  const mins = timeToMinutes(timeStr);
  return minutesToTime(mins - minutesToSubtract);
}

/**
 * Converts a 24-hour 'HH:mm' time string into minutes from midnight (0–1439).
 * Returns 0 for empty or invalid inputs.
 */
export function timeToMinutes(timeStr: string | null | undefined): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0] ?? '0', 10);
  const m = parseInt(parts[1] ?? '0', 10);
  return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
}

/**
 * Converts a 24-hour 'HH:mm' time string into a 12-hour formatted string with AM/PM.
 * Example: '13:30' -> '1:30 PM', '05:15' -> '5:15 AM'.
 */
export function format12h(timeStr: string | null | undefined): string {
  if (!timeStr) return '—';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const h24 = parseInt(parts[0] ?? '0', 10);
  const m = parseInt(parts[1] ?? '0', 10);
  if (Number.isNaN(h24) || Number.isNaN(m)) return timeStr;
  const isPm = h24 >= 12;
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${isPm ? 'PM' : 'AM'}`;
}

/**
 * Validates that an array of shifts follows strict ascending chronological order
 * based on their primary adhan_time (Khutbah time).
 * Returns an error message string if any violation is found, or null if valid.
 */
export function checkChronologicalShifts<T extends { adhan_time: string }>(
  shifts: readonly T[]
): string | null {
  for (let i = 1; i < shifts.length; i++) {
    const prev = shifts[i - 1];
    const curr = shifts[i];
    if (prev && curr && timeToMinutes(curr.adhan_time) <= timeToMinutes(prev.adhan_time)) {
      return `Cannot reorder: Shift at ${format12h(curr.adhan_time)} cannot be placed before or at the same time as Shift at ${format12h(prev.adhan_time)}. Shifts must follow chronological order.`;
    }
  }
  return null;
}

/**
 * Formats countdown minutes into concise human-readable text.
 * Multi-tier: >= 60m shows 'in Xh Ym' or 'in Xh', < 60m shows 'in Xm'.
 */
export function formatCountdown(minutesRemaining: number | undefined): string {
  if (typeof minutesRemaining !== 'number' || minutesRemaining < 0) {
    return 'Upcoming';
  }
  if (minutesRemaining === 0) {
    return 'Starting Now';
  }
  if (minutesRemaining < 60) {
    return `in ${minutesRemaining}m`;
  }
  const hours = Math.floor(minutesRemaining / 60);
  const mins = minutesRemaining % 60;
  return mins > 0 ? `in ${hours}h ${mins}m` : `in ${hours}h`;
}

/**
 * Formats a Date, ISO string, or timestamp into a local 'YYYY-MM-DDTHH:mm' string
 * suitable for HTML5 `<input type="datetime-local">`.
 * Uses local time components to prevent UTC time shifts (+4h / timezone offsets).
 */
export function toLocalDatetimeString(dateInput?: Date | string | number | null): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) {
    return formatLocalYmdHm(new Date());
  }
  return formatLocalYmdHm(d);
}

function formatLocalYmdHm(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Converts a local datetime string 'YYYY-MM-DDTHH:mm' back to an ISO-8601 string for persistent storage.
 */
export function fromLocalDatetimeString(localStr: string): string {
  if (!localStr) return new Date().toISOString();
  const d = new Date(localStr);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export interface ParsedCsvDate {
  readonly dateStr: string;
  readonly dataColOffset: number;
  readonly isMonthDayCol: boolean;
}

/**
 * Resolves date from CSV row columns.
 * Supports:
 * - Month, Day (2 columns): e.g. "11, 8" or "1, 1" (uses target defaultYear)
 * - ISO date (1 column): e.g. "2026-11-08", "2026/11/8", "2026-1-5"
 * - North American date (1 column): e.g. "11/08/2026", "11/8/2026", "11-8-2026"
 */
function formatValidCalendarDate(year: number, month: number, day: number): string | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseCsvRowDate(
  col0: string | undefined,
  col1: string | undefined,
  defaultYear: number,
  forceTargetYear: boolean = false
): ParsedCsvDate | null {
  if (!col0) return null;
  const c0 = col0.trim();
  const c1 = col1 ? col1.trim() : '';

  // 1. Two separate columns: Month, Day (e.g. "11, 8" or "1, 1")
  if (/^\d{1,2}$/.test(c0) && /^\d{1,2}$/.test(c1)) {
    const dateStr = formatValidCalendarDate(defaultYear, parseInt(c0, 10), parseInt(c1, 10));
    if (dateStr) return { dateStr, dataColOffset: 2, isMonthDayCol: true };
    return null;
  }

  // 2. ISO or ISO-like format: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = c0.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const yr = forceTargetYear ? defaultYear : parseInt(isoMatch[1]!, 10);
    const dateStr = formatValidCalendarDate(
      yr,
      parseInt(isoMatch[2]!, 10),
      parseInt(isoMatch[3]!, 10)
    );
    return dateStr ? { dateStr, dataColOffset: 1, isMonthDayCol: false } : null;
  }

  // 3. North American format: MM/DD/YYYY or M/D/YYYY
  const naMatch = c0.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (naMatch) {
    const yr = forceTargetYear ? defaultYear : parseInt(naMatch[3]!, 10);
    const dateStr = formatValidCalendarDate(
      yr,
      parseInt(naMatch[1]!, 10),
      parseInt(naMatch[2]!, 10)
    );
    return dateStr ? { dateStr, dataColOffset: 1, isMonthDayCol: false } : null;
  }

  return null;
}

/**
 * Verifies that the system clock is synchronized to a realistic calendar date.
 * Embedded appliances (e.g. Raspberry Pi) whose coin-cell RTC battery has died
 * reset to Jan 1, 1970. Returns false if the clock is un-synchronized (< 2025).
 */
export function isSystemClockSynchronized(date: Date = new Date()): boolean {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
    return false;
  }
  const year = date.getFullYear();
  return year >= 2025 && year <= 2099;
}

/**
 * Formats an ISO date string into concise human-readable date & time (e.g. 'Nov 23, 1:30 PM').
 * Gracefully falls back to the original string on parsing error.
 */
export function formatIsoDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}


