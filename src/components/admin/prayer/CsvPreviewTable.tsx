'use client';

import React from 'react';
import type { CsvImportFormat } from '@/lib/prayer/csv-parser';
import type { ParsedPreviewRow } from '@/lib/prayer/csv-preview';

export interface CsvPreviewTableProps {
  readonly previewRows: readonly ParsedPreviewRow[];
  readonly detectedFormat: CsvImportFormat;
}

export function CsvPreviewTable({ previewRows, detectedFormat }: CsvPreviewTableProps) {
  if (previewRows.length === 0) return null;

  return (
    <div className="space-y-1.5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider block">
          Preview (First {previewRows.length} rows):
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] border border-[var(--admin-border)]">
          Mode: {detectedFormat.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="rounded-xl border border-[var(--admin-border)] overflow-x-auto text-[11px] font-mono">
        <table className="w-full text-left divide-y divide-[var(--admin-border)]">
          <thead className="bg-[var(--admin-surface)] text-[var(--admin-text-muted)]">
            <tr>
              <th className="px-2.5 py-1.5 font-semibold">Date</th>
              <th className="px-2 py-1.5 font-semibold">Fajr</th>
              {detectedFormat !== 'legacy_iqamah' && <th className="px-2 py-1.5 font-semibold">Sunrise</th>}
              <th className="px-2 py-1.5 font-semibold">Dhuhr</th>
              <th className="px-2 py-1.5 font-semibold">Asr</th>
              <th className="px-2 py-1.5 font-semibold">Maghrib</th>
              <th className="px-2 py-1.5 font-semibold">Isha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-secondary)]">
            {previewRows.map((row) => (
              <tr key={row.date}>
                <td className="px-2.5 py-1.5 text-[var(--admin-text-primary)] font-semibold whitespace-nowrap">{row.date}</td>
                <td className="px-2 py-1.5 whitespace-nowrap">{row.fajrIqamah ? `${row.fajr} | ${row.fajrIqamah}` : row.fajr}</td>
                {detectedFormat !== 'legacy_iqamah' && <td className="px-2 py-1.5 whitespace-nowrap">{row.sunrise ?? '—'}</td>}
                <td className="px-2 py-1.5 whitespace-nowrap">{row.dhuhrIqamah ? `${row.dhuhr} | ${row.dhuhrIqamah}` : row.dhuhr}</td>
                <td className="px-2 py-1.5 whitespace-nowrap">{row.asrIqamah ? `${row.asr} | ${row.asrIqamah}` : row.asr}</td>
                <td className="px-2 py-1.5 whitespace-nowrap">{row.maghribIqamah ? `${row.maghrib} | ${row.maghribIqamah}` : row.maghrib}</td>
                <td className="px-2 py-1.5 whitespace-nowrap">{row.ishaIqamah ? `${row.isha} | ${row.ishaIqamah}` : row.isha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

