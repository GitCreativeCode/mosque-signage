/**
 * Deterministic Hijri Date Formatter
 * MosqueSignage (TV)
 */

export interface HijriFormatOptions {
  readonly locale?: string;
  readonly timezone?: string;
  readonly day?: 'numeric' | '2-digit';
  readonly month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  readonly year?: 'numeric' | '2-digit';
}

function extractCalendarPartsInTz(
  date: Date,
  timezone: string
): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);

  return {
    year: parseInt(parts.find((p) => p.type === 'year')?.value ?? '2026', 10),
    month: parseInt(parts.find((p) => p.type === 'month')?.value ?? '1', 10),
    day: parseInt(parts.find((p) => p.type === 'day')?.value ?? '1', 10),
  };
}

export interface HijriDateParts {
  readonly day: number;
  readonly month: number;
  readonly year: number;
  readonly monthName: string;
}

/**
 * Extracts structured numeric & localized Hijri date parts anchored to the venue timezone.
 * Hijri months: 8 = Sha'ban, 9 = Ramadan, 10 = Shawwal.
 */
export function getHijriDateParts(
  date: Date,
  offsetDays: number = 0,
  timezone: string = 'UTC'
): HijriDateParts {
  const { year, month, day } = extractCalendarPartsInTz(date, timezone);
  const targetDate = new Date(Date.UTC(year, month - 1, day + offsetDays, 12, 0, 0));

  try {
    const numFormatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      timeZone: 'UTC',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
    const longFormatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      timeZone: 'UTC',
      month: 'long',
    });

    const numParts = numFormatter.formatToParts(targetDate);
    const longParts = longFormatter.formatToParts(targetDate);

    return {
      day: Number.parseInt(numParts.find((p) => p.type === 'day')?.value ?? '1', 10) || 1,
      month: Number.parseInt(numParts.find((p) => p.type === 'month')?.value ?? '1', 10) || 1,
      year: Number.parseInt(numParts.find((p) => p.type === 'year')?.value ?? '1447', 10) || 1447,
      monthName: longParts.find((p) => p.type === 'month')?.value ?? '',
    };
  } catch {
    return { day: 1, month: 1, year: 1447, monthName: '' };
  }
}

/**
 * Formats a Gregorian date into a deterministic Hijri date string using
 * the Umm al-Qura calendar anchored in the venue's IANA timezone.
 */
export function formatHijriDate(
  date: Date,
  offsetDays: number = 0,
  options?: HijriFormatOptions
): string {
  const timezone = options?.timezone ?? 'UTC';
  const { year, month, day } = extractCalendarPartsInTz(date, timezone);
  const targetDate = new Date(Date.UTC(year, month - 1, day + offsetDays, 12, 0, 0));
  const locale = options?.locale ?? 'en-US';

  try {
    const formatter = new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, {
      timeZone: 'UTC',
      day: options?.day ?? 'numeric',
      month: options?.month ?? 'long',
      year: options?.year ?? 'numeric',
    });

    const parts = formatter.formatToParts(targetDate);
    const hijriDay = parts.find((p) => p.type === 'day')?.value ?? '';
    const hijriMonth = parts.find((p) => p.type === 'month')?.value ?? '';
    const hijriYear = parts.find((p) => p.type === 'year')?.value ?? '';

    return `${hijriDay} ${hijriMonth} ${hijriYear} AH`.trim();
  } catch {
    return targetDate.toISOString().split('T')[0] ?? '';
  }
}
