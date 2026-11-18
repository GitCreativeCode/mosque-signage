'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Download, Loader2 } from 'lucide-react';
import {
  EXPORT_MONTH_NAMES,
  type CsvExportFormatType,
  type ExportScopeType,
} from '@/lib/prayer/export-builders';

export interface ScheduleCsvExportTabProps {
  readonly exportScope: ExportScopeType;
  readonly setExportScope: (s: ExportScopeType) => void;
  readonly csvFormat: CsvExportFormatType;
  readonly setCsvFormat: (f: CsvExportFormatType) => void;
  readonly selectedYear: number;
  readonly setSelectedYear: (y: number) => void;
  readonly currentActualYear: number;
  readonly startMonth: number;
  readonly setStartMonth: (m: number) => void;
  readonly endMonth: number;
  readonly setEndMonth: (m: number) => void;
  readonly customStartDate: string;
  readonly setCustomStartDate: (d: string) => void;
  readonly customEndDate: string;
  readonly setCustomEndDate: (d: string) => void;
  readonly isExportingCsv: boolean;
  readonly csvError: string | null;
  readonly csvSuccess: string | null;
  readonly onSubmit: (e: React.FormEvent) => void;
  readonly onCancel: () => void;
}

const SCOPE_CARDS: ReadonlyArray<{ readonly key: ExportScopeType; readonly title: string; readonly sub: string }> = [
  { key: 'MONTH', title: 'Single Month', sub: 'Current displayed' },
  { key: 'MULTI_MONTH', title: 'Multi-Month', sub: 'e.g. 2 months span' },
  { key: 'YEAR', title: 'Full Year', sub: 'All 365/366 days' },
  { key: 'CUSTOM', title: 'Custom Range', sub: 'Start to end date' },
];

const FORMAT_CARDS: ReadonlyArray<{ readonly key: CsvExportFormatType; readonly title: string; readonly sub: string }> = [
  { key: 'full', title: 'Full Schedule', sub: '12 cols (Adhan + Iqamah + Sunrise)' },
  { key: 'adhan_only', title: 'Adhan-Only', sub: '7 cols (Astronomical solar timings)' },
  { key: 'legacy', title: 'Iqamah-Only', sub: '6 cols (Congregational prayer times)' },
];

export function ScheduleCsvExportTab(p: ScheduleCsvExportTabProps) {
  return (
    <form onSubmit={p.onSubmit} className="space-y-4 overflow-y-auto pr-1">
      {p.csvError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center space-x-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" /><span>{p.csvError}</span>
        </div>
      )}
      {p.csvSuccess && (
        <div className="p-3 rounded-xl bg-[var(--admin-success-subtle)] border border-[var(--admin-success)]/20 text-xs text-[var(--admin-success)] flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--admin-success)]" /><span>{p.csvSuccess}</span>
        </div>
      )}

      <div className="space-y-2.5">
        <label className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider block">
          1. Select Range &amp; Span
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SCOPE_CARDS.map((card) => (
            <button
              key={card.key}
              type="button"
              onClick={() => p.setExportScope(card.key)}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                p.exportScope === card.key
                  ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-tab-active-border)]/10 text-[var(--admin-text-primary)] font-semibold shadow-sm'
                  : 'border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-surface)]/80 text-[var(--admin-text-muted)]'
              }`}
            >
              <div className="text-xs font-bold">{card.title}</div>
              <div className="text-[10px] opacity-75 mt-0.5">{card.sub}</div>
            </button>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {p.exportScope === 'MONTH' && (
            <div className="flex items-center space-x-2">
              <span className="text-[var(--admin-text-muted)]">Month:</span>
              <select value={p.startMonth} onChange={(e) => p.setStartMonth(parseInt(e.target.value, 10))} className="px-2 py-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-bold text-xs">
                {EXPORT_MONTH_NAMES.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
              </select>
              <span className="text-[var(--admin-text-muted)] ml-2">Year:</span>
              <input type="number" value={p.selectedYear} onChange={(e) => p.setSelectedYear(parseInt(e.target.value, 10) || p.currentActualYear)} className="w-20 px-2 py-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-mono font-bold text-xs" />
            </div>
          )}

          {p.exportScope === 'MULTI_MONTH' && (
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              <span className="text-[var(--admin-text-muted)]">From:</span>
              <select value={p.startMonth} onChange={(e) => p.setStartMonth(parseInt(e.target.value, 10))} className="px-2 py-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-bold text-xs">
                {EXPORT_MONTH_NAMES.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
              </select>
              <span className="text-[var(--admin-text-muted)]">To:</span>
              <select value={p.endMonth} onChange={(e) => p.setEndMonth(parseInt(e.target.value, 10))} className="px-2 py-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-bold text-xs">
                {EXPORT_MONTH_NAMES.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
              </select>
              <span className="text-[var(--admin-text-muted)] ml-1">Year:</span>
              <input type="number" value={p.selectedYear} onChange={(e) => p.setSelectedYear(parseInt(e.target.value, 10) || p.currentActualYear)} className="w-20 px-2 py-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-mono font-bold text-xs" />
            </div>
          )}

          {p.exportScope === 'YEAR' && (
            <div className="flex items-center space-x-2">
              <span className="text-[var(--admin-text-muted)]">Calendar Year:</span>
              <input type="number" value={p.selectedYear} onChange={(e) => p.setSelectedYear(parseInt(e.target.value, 10) || p.currentActualYear)} className="w-24 px-2.5 py-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-mono font-bold text-xs" />
              <span className="text-[11px] text-[var(--admin-text-muted)]">(Generates complete 12-month annual schedule for {p.selectedYear})</span>
            </div>
          )}

          {p.exportScope === 'CUSTOM' && (
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              <span className="text-[var(--admin-text-muted)]">Start Date:</span>
              <input type="date" value={p.customStartDate} onChange={(e) => p.setCustomStartDate(e.target.value)} className="px-2 py-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-mono font-bold text-xs" />
              <span className="text-[var(--admin-text-muted)]">End Date:</span>
              <input type="date" value={p.customEndDate} onChange={(e) => p.setCustomEndDate(e.target.value)} className="px-2 py-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-mono font-bold text-xs" />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        <label className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider block">
          2. Choose CSV Column Format
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {FORMAT_CARDS.map((card) => (
            <button
              key={card.key}
              type="button"
              onClick={() => p.setCsvFormat(card.key)}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                p.csvFormat === card.key
                  ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-tab-active-border)]/10 text-[var(--admin-text-primary)] font-semibold shadow-sm'
                  : 'border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-surface)]/80 text-[var(--admin-text-muted)]'
              }`}
            >
              <div className="text-xs font-bold">{card.title}</div>
              <div className="text-[10px] opacity-75 mt-0.5">{card.sub}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-[var(--admin-border)]">
        <button type="button" onClick={p.onCancel} className="px-3.5 py-2 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] text-xs font-medium transition cursor-pointer">Cancel</button>
        <button type="submit" disabled={p.isExportingCsv} className="px-5 py-2 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] font-semibold text-xs flex items-center space-x-1.5 transition active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-sm">
          {p.isExportingCsv ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          <span>Export CSV File</span>
        </button>
      </div>
    </form>
  );
}

