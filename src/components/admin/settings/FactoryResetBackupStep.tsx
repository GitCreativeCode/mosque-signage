'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Download, FileSpreadsheet, Loader2 } from 'lucide-react';

export function FactoryResetBackupStep({
  isExporting,
  exportNotice,
  onDownloadBackup,
  onBack,
  onContinue,
}: {
  readonly isExporting: boolean;
  readonly exportNotice: string | null;
  readonly onDownloadBackup: () => void;
  readonly onBack: () => void;
  readonly onContinue: () => void;
}) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-start space-x-3.5">
        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
            Save a Prayer Timetable Backup First?
          </h3>
          <p className="text-xs text-[var(--admin-text-muted)] mt-1">
            It is strongly recommended to download your timetable so you don&apos;t lose custom Iqamah times.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/70 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[var(--admin-text-secondary)]">Prayer Schedule Backup (CSV)</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            Recommended
          </span>
        </div>
        <p className="text-[11px] text-[var(--admin-text-muted)]">
          Download a complete spreadsheet with all 12 months of prayer and Iqamah schedules.
        </p>

        <button
          type="button"
          onClick={onDownloadBackup}
          disabled={isExporting}
          className="w-full py-2.5 px-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-surface)] text-xs font-bold text-[var(--admin-text-primary)] flex items-center justify-center space-x-2 transition shadow-sm cursor-pointer disabled:opacity-50"
        >
          {isExporting ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--admin-tab-active-border)]" /><span>Generating Backup File...</span></>
          ) : (
            <><Download className="w-3.5 h-3.5 text-emerald-400" /><span>Download Prayer Timetable Backup (CSV)</span></>
          )}
        </button>

        {exportNotice && (
          <p className="text-[11px] text-emerald-400 flex items-center space-x-1.5 font-medium pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{exportNotice}</span>
          </p>
        )}
      </div>

      <div className="pt-2 flex items-center justify-between border-t border-[var(--admin-border)]">
        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] transition flex items-center space-x-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Go Back</span>
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] transition flex items-center space-x-1.5 shadow-sm cursor-pointer active:scale-95"
        >
          <span>I&apos;m Ready, Continue</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

