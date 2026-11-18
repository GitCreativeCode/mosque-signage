'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, FileSpreadsheet, Printer, X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import {
  exportScheduleCsv,
  getPrintableTimetable,
  type PrintableTimetableData,
} from '@/lib/actions/prayer-exports';
import {
  buildCsvExportRequest,
  PRINT_TIMETABLE_CSS,
  type CsvExportFormatType,
  type ExportScopeType,
} from '@/lib/prayer/export-builders';
import { PrintableSheetContent } from './PrintableSheetContent';
import { ScheduleCsvExportTab } from './ScheduleCsvExportTab';
import { SchedulePrintTab } from './SchedulePrintTab';

export interface ScheduleExportModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly initialYear: number;
  readonly initialMonth: number;
}

export function ScheduleExportModal({
  isOpen,
  onClose,
  initialYear,
  initialMonth,
}: ScheduleExportModalProps) {
  const modalRef = useFocusTrap({ isActive: isOpen, onEscape: onClose });
  const currentActualYear = new Date().getFullYear();
  const currentActualMonth = new Date().getMonth() + 1;
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'CSV' | 'PRINT'>('CSV');

  const [exportScope, setExportScope] = useState<ExportScopeType>('MONTH');
  const [csvFormat, setCsvFormat] = useState<CsvExportFormatType>('full');
  const [selectedYear, setSelectedYear] = useState<number>(initialYear || currentActualYear);
  const [startMonth, setStartMonth] = useState<number>(initialMonth || currentActualMonth);
  const [endMonth, setEndMonth] = useState<number>(initialMonth < 12 ? initialMonth + 1 : 12);
  const [customStartDate, setCustomStartDate] = useState<string>(
    `${initialYear || currentActualYear}-${String(initialMonth || currentActualMonth).padStart(2, '0')}-01`
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    `${initialYear || currentActualYear}-${String(initialMonth || currentActualMonth).padStart(2, '0')}-28`
  );
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);

  const [printYear, setPrintYear] = useState<number>(initialYear || currentActualYear);
  const [printMonth, setPrintMonth] = useState<number>(initialMonth || currentActualMonth);
  const [printTimingMode, setPrintTimingMode] = useState<'BOTH' | 'ADHAN' | 'IQAMAH'>('BOTH');
  const [printDateType, setPrintDateType] = useState<'GREGORIAN' | 'HIJRI' | 'BOTH'>('GREGORIAN');
  const [printData, setPrintData] = useState<PrintableTimetableData | null>(null);
  const [isLoadingPrintData, setIsLoadingPrintData] = useState(false);

  useEffect(() => { setIsClientMounted(true); }, []);

  useEffect(() => {
    if (!isOpen) return;
    const safeYear = initialYear && initialYear >= 2000 ? initialYear : currentActualYear;
    const safeMonth = initialMonth && initialMonth >= 1 && initialMonth <= 12 ? initialMonth : currentActualMonth;
    setSelectedYear(safeYear);
    setPrintYear(safeYear);
    setStartMonth(safeMonth);
    setEndMonth(safeMonth < 12 ? safeMonth + 1 : 12);
    setCustomStartDate(`${safeYear}-${String(safeMonth).padStart(2, '0')}-01`);
    const lastDay = new Date(safeYear, safeMonth, 0).getDate();
    setCustomEndDate(`${safeYear}-${String(safeMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);
    setCsvError(null);
    setCsvSuccess(null);
  }, [isOpen, initialYear, initialMonth, currentActualYear, currentActualMonth]);

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'PRINT') return;
    let mounted = true;
    const load = async () => {
      setIsLoadingPrintData(true);
      try {
        const data = await getPrintableTimetable(printYear, printMonth);
        if (mounted) setPrintData(data);
      } catch (err) {
        console.error('Failed to load printable timetable:', err);
      } finally {
        if (mounted) setIsLoadingPrintData(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, [isOpen, activeTab, printYear, printMonth]);

  if (!isOpen) return null;

  const handleDownloadCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExportingCsv(true);
    setCsvError(null);
    setCsvSuccess(null);
    try {
      const { options, filename } = buildCsvExportRequest({
        scope: exportScope, format: csvFormat, year: selectedYear,
        startMonth, endMonth, customStartDate, customEndDate,
      });
      const csvContent = await exportScheduleCsv(options);
      const url = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setCsvSuccess(`Export completed! Downloaded ${filename}.csv`);
    } catch (err) {
      setCsvError(err instanceof Error ? err.message : 'Failed to export CSV schedule.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  return (
    <>
      {isOpen && activeTab === 'PRINT' && <style>{PRINT_TIMETABLE_CSS}</style>}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-export-modal-title"
        className="print-modal-overlay no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          ref={modalRef}
          className="print-modal-card w-full max-w-3xl bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl p-6 shadow-2xl text-[var(--admin-text-primary)] max-h-[90vh] flex flex-col"
        >
          <div className="no-print flex items-center justify-between pb-4 border-b border-[var(--admin-border)] mb-4 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-primary)]"><Download className="w-4 h-4 opacity-80" /></div>
              <div>
                <h3 id="schedule-export-modal-title" className="text-base font-bold text-[var(--admin-text-primary)] tracking-tight">Export &amp; Print Timetable</h3>
                <p className="text-xs text-[var(--admin-text-muted)] mt-0.5">Download spreadsheet CSVs across custom ranges or print clean, high-contrast paper schedules.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close export timetable dialog"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] transition cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="no-print flex items-center space-x-1.5 bg-[var(--admin-surface)] p-1 rounded-xl border border-[var(--admin-border)] mb-4 shrink-0">
            <button type="button" onClick={() => setActiveTab('CSV')} className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer ${activeTab === 'CSV' ? 'bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-sm border border-[var(--admin-border)]' : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'}`}>
              <FileSpreadsheet className="w-3.5 h-3.5" /><span>Export CSV Spreadsheet</span>
            </button>
            <button type="button" onClick={() => setActiveTab('PRINT')} className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer ${activeTab === 'PRINT' ? 'bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-sm border border-[var(--admin-border)]' : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'}`}>
              <Printer className="w-3.5 h-3.5" /><span>Print Timetable (PDF / Paper)</span>
            </button>
          </div>

          {activeTab === 'CSV' ? (
            <ScheduleCsvExportTab
              exportScope={exportScope} setExportScope={setExportScope}
              csvFormat={csvFormat} setCsvFormat={setCsvFormat}
              selectedYear={selectedYear} setSelectedYear={setSelectedYear} currentActualYear={currentActualYear}
              startMonth={startMonth} setStartMonth={setStartMonth} endMonth={endMonth} setEndMonth={setEndMonth}
              customStartDate={customStartDate} setCustomStartDate={setCustomStartDate}
              customEndDate={customEndDate} setCustomEndDate={setCustomEndDate}
              isExportingCsv={isExportingCsv} csvError={csvError} csvSuccess={csvSuccess}
              onSubmit={handleDownloadCsv} onCancel={onClose}
            />
          ) : (
            <SchedulePrintTab
              printMonth={printMonth} setPrintMonth={setPrintMonth}
              printYear={printYear} setPrintYear={setPrintYear} currentActualYear={currentActualYear}
              printTimingMode={printTimingMode} setPrintTimingMode={setPrintTimingMode}
              printDateType={printDateType} setPrintDateType={setPrintDateType}
              isLoadingPrintData={isLoadingPrintData} printData={printData}
              onTriggerPrint={() => window.print()}
            />
          )}
        </div>
      </div>

      {isClientMounted && isOpen && activeTab === 'PRINT' && printData && typeof document !== 'undefined' && createPortal(
        <div id="print-portal-mount" aria-hidden="true">
          <div id="printable-schedule-sheet">
            <PrintableSheetContent printData={printData} printTimingMode={printTimingMode} printDateType={printDateType} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
