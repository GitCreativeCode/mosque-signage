import type { CsvImportFormat } from '@/lib/prayer/csv-parser';
import { parseCsvRowDate } from '@/lib/utils/time';

export interface ParsedPreviewRow {
  readonly date: string;
  readonly fajr: string;
  readonly sunrise?: string;
  readonly dhuhr: string;
  readonly asr: string;
  readonly maghrib: string;
  readonly isha: string;
  readonly fajrIqamah?: string;
  readonly dhuhrIqamah?: string;
  readonly asrIqamah?: string;
  readonly maghribIqamah?: string;
  readonly ishaIqamah?: string;
}

export interface CsvPreviewSummary {
  readonly detectedFormat: CsvImportFormat;
  readonly hasMonthDayFormat: boolean;
  readonly totalRowsDetected: number;
  readonly previewRows: readonly ParsedPreviewRow[];
}

function resolveCsvFormat(headerLine: string, firstDataRow?: string): CsvImportFormat {
  if (headerLine) {
    const tokens = headerLine.split(',').map((s) => s.trim().replace(/[\s_-]/g, ''));
    const hasAdhan = tokens.some((t) => t.includes('adhan') || t.includes('athan') || t.includes('azan') || t.includes('ezan'));
    const hasIqamah = tokens.some((t) => t.includes('iqamah') || t.includes('iqama') || t.includes('iqaamah') || t.includes('jamaat') || t.includes('jamat'));
    const hasSunrise = tokens.some((t) => t.includes('sunrise') || t.includes('shuruq') || t.includes('shurooq') || t.includes('ishraq'));

    if (hasAdhan && hasIqamah) return 'full';
    if (hasAdhan || (hasSunrise && !hasIqamah)) return 'adhan_only';
    if (tokens.length >= 12) return 'full';
    if (tokens.length >= 7 && hasSunrise) return 'adhan_only';
    return 'legacy_iqamah';
  }
  if (!firstDataRow) return 'legacy_iqamah';
  const parts = firstDataRow.split(',').map((p) => p.trim());
  if (parts.length >= 12) return 'full';
  if (parts.length >= 7) return 'adhan_only';
  return 'legacy_iqamah';
}

export function buildCsvPreviewSummary(text: string, targetYear: number): CsvPreviewSummary {
  const dataRows = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith('#'));
  let headerLine = '';
  let startIdx = 0;

  if (dataRows.length > 0) {
    const first = dataRows[0]!.toLowerCase();
    if (first.includes('fajr') || first.includes('date') || first.includes('month')) {
      headerLine = first;
      startIdx = 1;
    }
  }

  const actualDataRows = dataRows.slice(startIdx);
  const detectedFormat = resolveCsvFormat(headerLine, actualDataRows[0]);
  let hasMonthDayFormat = false;
  const previewRows: ParsedPreviewRow[] = [];

  for (const line of actualDataRows.slice(0, 3)) {
    const parts = line.split(',').map((p) => p.trim());
    if (parts.length < 5) continue;
    const dateParsed = parseCsvRowDate(parts[0], parts[1], targetYear);
    if (!dateParsed) continue;
    if (dateParsed.isMonthDayCol) hasMonthDayFormat = true;
    const dataCols = parts.slice(dateParsed.dataColOffset);

    if (detectedFormat === 'full' && dataCols.length >= 11) {
      previewRows.push({
        date: dateParsed.dateStr,
        fajr: dataCols[0] ?? '', fajrIqamah: dataCols[1] ?? '', sunrise: dataCols[2] ?? '',
        dhuhr: dataCols[3] ?? '', dhuhrIqamah: dataCols[4] ?? '',
        asr: dataCols[5] ?? '', asrIqamah: dataCols[6] ?? '',
        maghrib: dataCols[7] ?? '', maghribIqamah: dataCols[8] ?? '',
        isha: dataCols[9] ?? '', ishaIqamah: dataCols[10] ?? '',
      });
    } else if (detectedFormat === 'adhan_only' && dataCols.length >= 6) {
      previewRows.push({
        date: dateParsed.dateStr, fajr: dataCols[0] ?? '', sunrise: dataCols[1] ?? '',
        dhuhr: dataCols[2] ?? '', asr: dataCols[3] ?? '', maghrib: dataCols[4] ?? '', isha: dataCols[5] ?? '',
      });
    } else if (dataCols.length >= 5) {
      previewRows.push({
        date: dateParsed.dateStr, fajr: dataCols[0] ?? '', dhuhr: dataCols[1] ?? '',
        asr: dataCols[2] ?? '', maghrib: dataCols[3] ?? '', isha: dataCols[4] ?? '',
      });
    }
  }

  return { detectedFormat, hasMonthDayFormat, totalRowsDetected: actualDataRows.length, previewRows };
}

export function buildSampleCsvTemplate(
  type: 'full' | 'adhan_only' | 'legacy',
  currentYear: number
): { sampleCsv: string; filename: string } {
  if (type === 'full') {
    return {
      filename: 'prayer_timetable_full_schedule.csv',
      sampleCsv: `Month,Day,Fajr_Adhan,Fajr_Iqamah,Sunrise,Dhuhr_Adhan,Dhuhr_Iqamah,Asr_Adhan,Asr_Iqamah,Maghrib_Adhan,Maghrib_Iqamah,Isha_Adhan,Isha_Iqamah\n1,1,06:12,06:30,07:51,12:22,12:45,14:40,15:00,16:53,17:03,18:32,19:00\n1,2,06:13,06:30,07:52,12:22,12:45,14:39,15:00,16:52,17:02,18:31,19:00\n1,3,06:13,06:30,07:52,12:23,12:45,14:40,15:00,16:53,17:03,18:32,19:00`,
    };
  }
  if (type === 'adhan_only') {
    return {
      filename: 'prayer_timetable_adhan_only.csv',
      sampleCsv: `Month,Day,Fajr,Sunrise,Dhuhr,Asr,Maghrib,Isha\n1,1,06:12,07:51,12:22,14:40,16:53,18:32\n1,2,06:13,07:52,12:22,14:39,16:52,18:31\n1,3,06:13,07:52,12:23,14:40,16:53,18:32`,
    };
  }
  return {
    filename: 'prayer_timetable_legacy_iqamah.csv',
    sampleCsv: `date,fajr,dhuhr,asr,maghrib,isha\n${currentYear}-01-01,06:15,13:15,15:30,17:00,19:15\n${currentYear}-01-02,06:15,13:15,15:30,17:01,19:15\n${currentYear}-01-03,06:15,13:15,15:30,17:02,19:15`,
  };
}

