'use client';

import React, { useState, useRef } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Layers,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { importAnnualScheduleCsv } from '@/lib/actions/prayer-schedules';
import type { CsvImportFormat } from '@/lib/prayer/csv-parser';
import {
  buildCsvPreviewSummary,
  buildSampleCsvTemplate,
  type ParsedPreviewRow,
} from '@/lib/prayer/csv-preview';
import { CsvPreviewTable } from './CsvPreviewTable';

export interface CsvImportModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onImportSuccess?: ((count: number) => void) | undefined;
}

export function CsvImportModal({ isOpen, onClose, onImportSuccess }: CsvImportModalProps) {
  const currentYear = new Date().getFullYear();
  const [targetYear, setTargetYear] = useState<number>(currentYear);
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<readonly ParsedPreviewRow[]>([]);
  const [detectedFormat, setDetectedFormat] = useState<CsvImportFormat>('legacy_iqamah');
  const [hasMonthDayFormat, setHasMonthDayFormat] = useState<boolean>(false);
  const [totalRowsDetected, setTotalRowsDetected] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useFocusTrap({ isActive: isOpen, onEscape: onClose });

  if (!isOpen) return null;

  const handleFileSelected = async (selectedFile: File | null) => {
    setError(null);
    setSuccessMessage(null);
    setPreviewRows([]);
    setTotalRowsDetected(0);
    if (!selectedFile) { setFile(null); return; }

    const isCsv = selectedFile.name.endsWith('.csv') || selectedFile.type === 'text/csv' || selectedFile.type === 'application/vnd.ms-excel';
    if (!isCsv) { setError('Please select a valid .csv file.'); return; }

    setFile(selectedFile);
    try {
      const summary = buildCsvPreviewSummary(await selectedFile.text(), targetYear);
      setDetectedFormat(summary.detectedFormat);
      setHasMonthDayFormat(summary.hasMonthDayFormat);
      setTotalRowsDetected(summary.totalRowsDetected);
      setPreviewRows(summary.previewRows);
    } catch {
      setError('Unable to read selected CSV file.');
    }
  };

  const handleDownloadSample = (type: 'full' | 'adhan_only' | 'legacy') => {
    const { sampleCsv, filename } = buildSampleCsvTemplate(type, currentYear);
    const url = URL.createObjectURL(new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError('Please select a CSV file first.'); return; }
    setIsImporting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await importAnnualScheduleCsv(await file.text(), targetYear);
      if (res.importedCount <= 0) {
        setError('No valid date rows found. Check column headers or format.');
        return;
      }
      const modeLabel = res.formatDetected === 'full' ? 'Full Schedule (Adhan & Iqamah)' : res.formatDetected === 'adhan_only' ? 'Adhan-Only Schedule' : 'Iqamah Schedule';
      setSuccessMessage(`Successfully imported ${res.importedCount} records using ${modeLabel}!`);
      onImportSuccess?.(res.importedCount);
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import CSV timetable.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-import-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={modalRef}
        className="w-full h-[100dvh] sm:h-auto sm:max-h-[90dvh] sm:max-w-xl rounded-none sm:rounded-2xl border-0 sm:border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 sm:p-6 shadow-2xl text-[var(--admin-text-primary)] space-y-4 overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--admin-border)]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-primary)]"><Layers className="w-4 h-4 opacity-80" /></div>
            <div>
              <h3 id="csv-import-modal-title" className="text-base font-bold text-[var(--admin-text-primary)] tracking-tight">Import Prayer Timetable CSV</h3>
              <p className="text-xs text-[var(--admin-text-muted)] mt-0.5">Bulk import pre-published council timetables or custom Iqamah schedules.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close CSV import dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] transition cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-[var(--admin-text-secondary)]">Download Templates:</span>
          <div className="flex items-center space-x-2 flex-wrap">
            {([
              { id: 'full', label: 'Full Schedule', title: 'Full Adhan + Iqamah schedule' },
              { id: 'adhan_only', label: 'Adhan-Only', title: 'Adhan-only schedule with dynamic Iqamah' },
              { id: 'legacy', label: 'Iqamah-Only', title: 'Legacy Iqamah schedule' },
            ] as const).map((tpl, idx) => (
              <React.Fragment key={tpl.id}>
                {idx > 0 && <span className="text-[var(--admin-text-muted)]">•</span>}
                <button type="button" onClick={() => handleDownloadSample(tpl.id)} className="text-[11px] font-semibold text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] flex items-center space-x-1 cursor-pointer transition underline underline-offset-2" title={tpl.title}>
                  <Download className="w-3 h-3" /><span>{tpl.label}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {hasMonthDayFormat && (
          <div className="p-2.5 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] flex items-center justify-between text-xs animate-fadeIn">
            <div className="flex items-center space-x-1.5 text-[var(--admin-text-secondary)]">
              <Calendar className="w-3.5 h-3.5 text-[var(--admin-tab-active-border)]" />
              <span>Target Year for Month/Day rows:</span>
            </div>
            <select value={targetYear} onChange={(e) => setTargetYear(parseInt(e.target.value, 10))} className="px-2.5 py-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-xs font-bold font-mono text-[var(--admin-text-primary)] focus:outline-none">
              {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}

        {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center space-x-2 animate-fadeIn"><AlertCircle className="w-4 h-4 shrink-0 text-rose-400" /><span>{error}</span></div>}
        {successMessage && <div className="p-3 rounded-xl bg-[var(--admin-success-subtle)] border border-[var(--admin-success)]/20 text-xs text-[var(--admin-success)] flex items-center space-x-2 animate-fadeIn"><CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--admin-success)]" /><span>{successMessage}</span></div>}

        <form onSubmit={handleImport} className="space-y-4">
          <input type="file" accept=".csv,text/csv" ref={fileInputRef} onChange={(e) => void handleFileSelected(e.target.files?.[0] ?? null)} className="hidden" />
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); void handleFileSelected(e.dataTransfer.files?.[0] ?? null); }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragging ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-tab-active-border)]/10' : 'border-[var(--admin-border)] hover:border-[var(--admin-text-muted)] bg-[var(--admin-surface)]/60'}`}
          >
            {file ? (
              <div className="flex flex-col items-center text-center space-y-1">
                <FileText className="w-7 h-7 text-[var(--admin-tab-active-border)] mb-0.5" />
                <span className="text-xs font-bold text-[var(--admin-text-primary)] font-mono">{file.name}</span>
                <div className="flex items-center space-x-2 text-[11px] text-[var(--admin-text-muted)]">
                  <span>{(file.size / 1024).toFixed(1)} KB</span><span>•</span><span>{totalRowsDetected} date rows detected</span><span>•</span>
                  <span className="font-semibold text-emerald-400 uppercase text-[10px]">
                    {detectedFormat === 'full' ? 'Full Adhan + Iqamah' : detectedFormat === 'adhan_only' ? 'Adhan-Only' : 'Iqamah-Only'}
                  </span>
                </div>
                <span className="text-[10px] text-[var(--admin-tab-active-border)] underline pt-1">Click to replace file</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center space-y-1">
                <UploadCloud className="w-8 h-8 text-[var(--admin-text-muted)] mb-1" />
                <span className="text-xs font-semibold text-[var(--admin-text-primary)]">Drag and drop CSV file here, or click to browse</span>
                <span className="text-[11px] text-[var(--admin-text-muted)]">Supports Full Schedule (13 cols), Adhan-Only (8 cols), or Legacy (6 cols)</span>
              </div>
            )}
          </div>

          <CsvPreviewTable previewRows={previewRows} detectedFormat={detectedFormat} />

          <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-[var(--admin-border)]">
            <button type="button" onClick={onClose} className="px-3.5 py-1.5 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] text-xs font-medium transition cursor-pointer">Cancel</button>
            <button type="submit" disabled={!file || isImporting} className="px-4 py-2 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] font-semibold text-xs flex items-center space-x-1.5 transition active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-sm">
              {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              <span>{isImporting ? 'Importing Records...' : `Import ${totalRowsDetected > 0 ? `${totalRowsDetected} Days` : 'Schedule'}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
