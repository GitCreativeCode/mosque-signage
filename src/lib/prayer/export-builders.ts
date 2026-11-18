import type { ExportScheduleOptions } from '@/lib/actions/prayer-exports';

export type ExportScopeType = 'MONTH' | 'MULTI_MONTH' | 'YEAR' | 'CUSTOM';
export type CsvExportFormatType = 'full' | 'adhan_only' | 'legacy';

export const EXPORT_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function buildCsvExportRequest({
  scope,
  format,
  year,
  startMonth,
  endMonth,
  customStartDate,
  customEndDate,
}: {
  readonly scope: ExportScopeType;
  readonly format: CsvExportFormatType;
  readonly year: number;
  readonly startMonth: number;
  readonly endMonth: number;
  readonly customStartDate: string;
  readonly customEndDate: string;
}): { options: ExportScheduleOptions; filename: string } {
  if (scope === 'MONTH') {
    return {
      options: { format, year, month: startMonth, endMonth: startMonth },
      filename: `prayer_schedule_${year}_${String(startMonth).padStart(2, '0')}`,
    };
  }
  if (scope === 'MULTI_MONTH') {
    if (startMonth > endMonth) throw new Error('Start month cannot be after end month.');
    return {
      options: { format, year, month: startMonth, endMonth },
      filename: `prayer_schedule_${year}_M${startMonth}-M${endMonth}`,
    };
  }
  if (scope === 'YEAR') {
    return {
      options: { format, year, month: 1, endMonth: 12 },
      filename: `prayer_schedule_${year}_full_year`,
    };
  }
  if (!customStartDate || !customEndDate) throw new Error('Please select both start and end dates.');
  if (customStartDate > customEndDate) throw new Error('Start date must be before or equal to end date.');
  return {
    options: { format, startDate: customStartDate, endDate: customEndDate },
    filename: `prayer_schedule_${customStartDate}_to_${customEndDate}`,
  };
}

export const PRINT_TIMETABLE_CSS = `
  @media screen {
    #print-portal-mount { display: none !important; }
  }
  @media print {
    html, body {
      background: #ffffff !important; color: #000000 !important;
      height: auto !important; min-height: 100% !important;
      overflow: visible !important; margin: 0 !important; padding: 0 !important; font-size: 10pt !important;
    }
    body > *:not(#print-portal-mount) { display: none !important; }
    .no-print, nav, header, footer, aside, button { display: none !important; }
    #print-portal-mount, #printable-schedule-sheet {
      display: block !important; position: static !important; width: 100% !important;
      margin: 0 !important; padding: 0 !important; background: #ffffff !important;
      color: #000000 !important; box-shadow: none !important; border: none !important; overflow: visible !important;
    }
    table { width: 100% !important; border-collapse: collapse !important; page-break-inside: auto !important; }
    thead { display: table-header-group !important; }
    tr { page-break-inside: avoid !important; page-break-after: auto !important; }
    @page { size: portrait; margin: 8mm 6mm; }
  }
`;

