'use client';

import React from 'react';
import { Loader2, Printer } from 'lucide-react';
import type { PrintableTimetableData } from '@/lib/actions/prayer-exports';
import { EXPORT_MONTH_NAMES } from '@/lib/prayer/export-builders';
import { PrintableSheetContent } from './PrintableSheetContent';

export interface SchedulePrintTabProps {
  readonly printMonth: number;
  readonly setPrintMonth: (m: number) => void;
  readonly printYear: number;
  readonly setPrintYear: (y: number) => void;
  readonly currentActualYear: number;
  readonly printTimingMode: 'BOTH' | 'ADHAN' | 'IQAMAH';
  readonly setPrintTimingMode: (m: 'BOTH' | 'ADHAN' | 'IQAMAH') => void;
  readonly printDateType: 'GREGORIAN' | 'HIJRI' | 'BOTH';
  readonly setPrintDateType: (d: 'GREGORIAN' | 'HIJRI' | 'BOTH') => void;
  readonly isLoadingPrintData: boolean;
  readonly printData: PrintableTimetableData | null;
  readonly onTriggerPrint: () => void;
}

export function SchedulePrintTab(p: SchedulePrintTabProps) {
  return (
    <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 flex flex-col">
      <div className="no-print p-3 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] flex flex-col gap-2.5 text-xs shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[var(--admin-text-secondary)]">Month:</span>
            <select value={p.printMonth} onChange={(e) => p.setPrintMonth(parseInt(e.target.value, 10))} className="px-2.5 py-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-bold text-xs">
              {EXPORT_MONTH_NAMES.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
            </select>
            <input type="number" value={p.printYear} onChange={(e) => p.setPrintYear(parseInt(e.target.value, 10) || p.currentActualYear)} className="w-20 px-2 py-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-mono font-bold text-xs" />
          </div>

          <button type="button" onClick={p.onTriggerPrint} disabled={p.isLoadingPrintData || !p.printData} className="px-4 py-1.5 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] font-semibold text-xs flex items-center justify-center space-x-1.5 transition active:scale-[0.98] cursor-pointer shadow-sm disabled:opacity-50">
            <Printer className="w-3.5 h-3.5" /><span>Print / Save to PDF</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-[var(--admin-border)]/60 text-[11px]">
          <div className="flex items-center space-x-1.5">
            <span className="text-[var(--admin-text-muted)] font-medium">Timings:</span>
            <div className="flex items-center space-x-1 bg-[var(--admin-card)] p-0.5 rounded-lg border border-[var(--admin-border)]">
              {([
                { key: 'BOTH', label: 'Both (Athan & Iqamah)' },
                { key: 'ADHAN', label: 'Athan Only' },
                { key: 'IQAMAH', label: 'Iqamah Only' },
              ] as const).map((opt) => (
                <button key={opt.key} type="button" onClick={() => p.setPrintTimingMode(opt.key)} className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${p.printTimingMode === opt.key ? 'bg-[var(--admin-surface)] text-[var(--admin-text-primary)] shadow-sm' : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[var(--admin-text-muted)] font-medium">Date Column:</span>
            <div className="flex items-center space-x-1 bg-[var(--admin-card)] p-0.5 rounded-lg border border-[var(--admin-border)]">
              {([
                { key: 'GREGORIAN', label: 'Gregorian' },
                { key: 'HIJRI', label: 'Hijri' },
                { key: 'BOTH', label: 'Both Dates' },
              ] as const).map((opt) => (
                <button key={opt.key} type="button" onClick={() => p.setPrintDateType(opt.key)} className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${p.printDateType === opt.key ? 'bg-[var(--admin-surface)] text-[var(--admin-text-primary)] shadow-sm' : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {p.isLoadingPrintData ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--admin-text-primary)] opacity-60" />
          <span className="text-xs text-[var(--admin-text-muted)]">Rendering printable document...</span>
        </div>
      ) : p.printData ? (
        <div id="screen-preview-sheet" className="rounded-xl border border-neutral-400 bg-white p-5 text-neutral-900 shadow-sm text-xs font-sans overflow-x-auto">
          <PrintableSheetContent printData={p.printData} printTimingMode={p.printTimingMode} printDateType={p.printDateType} />
        </div>
      ) : null}
    </div>
  );
}

