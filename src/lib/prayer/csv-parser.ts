/**
 * Pure Multi-Dialect CSV Prayer Timetable Parser
 * MosqueSignage (TV)
 */

import { parseCsvRowDate } from '@/lib/utils/time';

export type CsvImportFormat = 'full' | 'adhan_only' | 'legacy_iqamah';

export interface CsvImportResult {
  readonly importedCount: number;
  readonly formatDetected: CsvImportFormat;
}

export interface ParsedCsvScheduleRow {
  readonly date: string;
  readonly fajr_adhan?: string | undefined;
  readonly fajr_iqamah?: string | undefined;
  readonly sunrise?: string | null | undefined;
  readonly dhuhr_adhan?: string | undefined;
  readonly dhuhr_iqamah?: string | undefined;
  readonly asr_adhan?: string | undefined;
  readonly asr_iqamah?: string | undefined;
  readonly maghrib_adhan?: string | undefined;
  readonly maghrib_iqamah?: string | undefined;
  readonly isha_adhan?: string | undefined;
  readonly isha_iqamah?: string | undefined;
  readonly updated_at: string;
}

export function normalizeTimeTo24h(timeStr: string | null | undefined): string | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match || !match[1] || !match[2]) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (Number.isNaN(hour) || Number.isNaN(minute) || minute < 0 || minute > 59) return null;

  const ampm = match[3]?.toUpperCase();
  if (ampm) {
    if (hour < 1 || hour > 12) return null;
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
  } else if (hour < 0 || hour > 23) {
    return null;
  }
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function cleanHeaderCell(s: string): string {
  return s.trim().toLowerCase().replace(/[\s_-]/g, '');
}

function isHeaderCandidate(line: string): boolean {
  if (line.startsWith('#')) return false;
  const lower = line.toLowerCase();
  return ['fajr', 'date', 'month', 'athan', 'azan', 'iqamah'].some((kw) => lower.includes(kw));
}

function detectFormatFromTokens(tokens: readonly string[]): CsvImportFormat {
  const hasAdhan = tokens.some((t) => ['adhan', 'athan', 'azan', 'ezan'].some((k) => t.includes(k)));
  const hasIqamah = tokens.some((t) => ['iqamah', 'iqama', 'iqaamah', 'jamaat', 'jamat'].some((k) => t.includes(k)));
  const hasSunrise = tokens.some((t) => ['sunrise', 'shuruq', 'shurooq', 'ishraq'].some((k) => t.includes(k)));

  if (hasAdhan && hasIqamah) return 'full';
  if (hasAdhan || (hasSunrise && !hasIqamah)) return 'adhan_only';
  if (tokens.length >= 12) return 'full';
  if (tokens.length >= 7 && hasSunrise) return 'adhan_only';
  return 'legacy_iqamah';
}

export function detectCsvDialect(lines: readonly string[]): {
  formatDetected: CsvImportFormat;
  dataLines: readonly string[];
} {
  let headerIndex = -1;
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    if (line && isHeaderCandidate(line)) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex !== -1) {
    const tokens = (lines[headerIndex] ?? '').split(',').map(cleanHeaderCell);
    return { formatDetected: detectFormatFromTokens(tokens), dataLines: lines.slice(headerIndex + 1) };
  }

  const firstCols = (lines[0] ?? '').split(',').map((p) => p.trim());
  const formatDetected: CsvImportFormat =
    firstCols.length >= 12 ? 'full' : firstCols.length >= 7 ? 'adhan_only' : 'legacy_iqamah';
  return { formatDetected, dataLines: lines };
}

function parseFullScheduleCols(cols: readonly string[], date: string, nowIso: string): ParsedCsvScheduleRow | null {
  if (cols.length < 11) return null;
  const [fA, fI, sun, dA, dI, aA, aI, mA, mI, iA, iI] = cols.map(normalizeTimeTo24h);
  if (!fA || !dA || !aA || !mA || !iA) return null;
  return {
    date, fajr_adhan: fA, fajr_iqamah: fI ?? fA, sunrise: sun, dhuhr_adhan: dA, dhuhr_iqamah: dI ?? dA,
    asr_adhan: aA, asr_iqamah: aI ?? aA, maghrib_adhan: mA, maghrib_iqamah: mI ?? mA,
    isha_adhan: iA, isha_iqamah: iI ?? iA, updated_at: nowIso,
  };
}

function parseAdhanOnlyCols(cols: readonly string[], date: string, nowIso: string): ParsedCsvScheduleRow | null {
  if (cols.length < 6) return null;
  const [fA, sun, dA, aA, mA, iA] = cols.map(normalizeTimeTo24h);
  if (!fA || !dA || !aA || !mA || !iA) return null;
  return {
    date, fajr_adhan: fA, sunrise: sun, dhuhr_adhan: dA, asr_adhan: aA, maghrib_adhan: mA, isha_adhan: iA,
    updated_at: nowIso,
  };
}

function parseLegacyCols(cols: readonly string[], date: string, nowIso: string): ParsedCsvScheduleRow | null {
  if (cols.length < 5) return null;
  const [fI, dI, aI, mI, iI] = cols.map(normalizeTimeTo24h);
  if (!fI || !dI || !aI || !mI || !iI) return null;
  return {
    date, fajr_iqamah: fI, dhuhr_iqamah: dI, asr_iqamah: aI, maghrib_iqamah: mI, isha_iqamah: iI,
    updated_at: nowIso,
  };
}

export function parseCsvLineToSchedulePayload(
  line: string,
  format: CsvImportFormat,
  defaultYear: number,
  nowIso: string
): ParsedCsvScheduleRow | null {
  if (line.startsWith('#') || line.trim().length === 0) return null;
  const parts = line.split(',').map((p) => p.trim());
  if (parts.length < 5) return null;

  const parsedDate = parseCsvRowDate(parts[0], parts[1], defaultYear);
  if (!parsedDate) return null;

  const cols = parts.slice(parsedDate.dataColOffset);
  if (format === 'full') return parseFullScheduleCols(cols, parsedDate.dateStr, nowIso);
  if (format === 'adhan_only') return parseAdhanOnlyCols(cols, parsedDate.dateStr, nowIso);
  return parseLegacyCols(cols, parsedDate.dateStr, nowIso);
}
