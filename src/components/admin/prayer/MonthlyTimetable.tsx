'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertCircle, Calendar, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  Download, Loader2, RotateCcw, Settings2, SlidersHorizontal, UploadCloud,
} from 'lucide-react';
import type { MonthPrayerDay, PrayerName } from '@/types/index';
import dynamic from 'next/dynamic';
import { bulkSetIqamahRange, resetMonthToAstronomical, saveDayIqamahSchedule } from '@/lib/actions/prayer-schedules';
import { getMonthPrayerSchedule } from '@/lib/actions/prayer-exports';
import { format12h, timeToMinutes } from '@/lib/utils/time';
import { getMaxAllowedOffsetMinutes, TIMETABLE_MONTH_NAMES } from '@/lib/prayer/timetable-constraints';
import { MonthlyTimetableGrid } from './MonthlyTimetableGrid';
import { MonthlyEditDayModal, type DailyEditTimesState } from './MonthlyEditDayModal';
import { MonthlyBulkApplyModal } from './MonthlyBulkApplyModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { AdminLoadingFallback } from '../common/AdminLoadingFallback';

const DynamicCalculationRulesModal = dynamic(
  () => import('./CalculationRulesModal').then((m) => m.CalculationRulesModal),
  { loading: () => <AdminLoadingFallback label="Loading calculation rules..." /> }
);

const DynamicCsvImportModal = dynamic(
  () => import('./CsvImportModal').then((m) => m.CsvImportModal),
  { loading: () => <AdminLoadingFallback label="Loading CSV importer..." /> }
);

const DynamicScheduleExportModal = dynamic(
  () => import('./ScheduleExportModal').then((m) => m.ScheduleExportModal),
  { loading: () => <AdminLoadingFallback label="Loading schedule exporter..." /> }
);

export interface MonthlyTimetableProps {
  readonly onScheduleChanged?: (() => void) | undefined;
  readonly onOpenCsvModal?: (() => void) | undefined;
}

export function MonthlyTimetable({ onScheduleChanged, onOpenCsvModal }: MonthlyTimetableProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1);
  const [schedule, setSchedule] = useState<MonthPrayerDay[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [editingDay, setEditingDay] = useState<MonthPrayerDay | null>(null);
  const [editTimes, setEditTimes] = useState<DailyEditTimesState>({ fajr: '05:30', dhuhr: '13:30', asr: '17:00', maghrib: '19:00', isha: '20:30' });
  const [isSavingDay, setIsSavingDay] = useState(false);
  const [editDayError, setEditDayError] = useState<string | null>(null);

  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const [bulkTimingMode, setBulkTimingMode] = useState<'FIXED' | 'OFFSET'>('FIXED');
  const [bulkPrayer, setBulkPrayer] = useState<PrayerName>('maghrib');
  const [bulkTime, setBulkTime] = useState('17:00');
  const [bulkOffsetMinutes, setBulkOffsetMinutes] = useState(5);
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkEndDate, setBulkEndDate] = useState('');
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadSchedule = useCallback(async (year: number, month: number) => {
    setIsLoading(true);
    setError(null);
    try { setSchedule(await getMonthPrayerSchedule(year, month)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load month schedule.'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void loadSchedule(currentYear, currentMonth); }, [currentYear, currentMonth, loadSchedule]);
  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (editingDay) setEditingDay(null); if (isBulkOpen) setIsBulkOpen(false); setIsActionsOpen(false); } };
    const onOutside = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) setIsActionsOpen(false);
    };
    window.addEventListener('keydown', onEscape);
    document.addEventListener('mousedown', onOutside);
    return () => {
      window.removeEventListener('keydown', onEscape);
      document.removeEventListener('mousedown', onOutside);
    };
  }, [editingDay, isBulkOpen]);

  const sampleDay = schedule.find((d) => d.isToday) ?? schedule[0];
  const maxOffsetInfo = getMaxAllowedOffsetMinutes(bulkPrayer, sampleDay);

  const handleSaveDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDay) return;
    for (const p of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const) {
      if (timeToMinutes(editTimes[p]) < timeToMinutes(editingDay[p].adhan)) {
        const pLabel = p.charAt(0).toUpperCase() + p.slice(1);
        setEditDayError(`${pLabel} Iqamah (${format12h(editTimes[p])}) cannot be earlier than ${pLabel} Adhan (${format12h(editingDay[p].adhan)}).`);
        return;
      }
    }
    setIsSavingDay(true);
    setEditDayError(null);
    try {
      await saveDayIqamahSchedule(editingDay.date, editTimes);
      showToast(`Updated Iqamah schedule for ${editingDay.date}`);
      setEditingDay(null);
      await loadSchedule(currentYear, currentMonth);
      onScheduleChanged?.();
    } catch (err) {
      setEditDayError(err instanceof Error ? err.message : 'Failed to save schedule.');
    } finally { setIsSavingDay(false); }
  };

  const handleApplyBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkStartDate || !bulkEndDate) { setBulkError('Please specify start and end dates.'); return; }
    if (bulkStartDate > bulkEndDate) { setBulkError('Start date must be before or equal to end date.'); return; }
    if (bulkTimingMode === 'OFFSET' && bulkOffsetMinutes > maxOffsetInfo.max) {
      setBulkError(`Offset cannot exceed ${maxOffsetInfo.max} minutes (must be before ${maxOffsetInfo.nextName}).`);
      return;
    }
    setIsSavingBulk(true);
    setBulkError(null);
    try {
      const res = await bulkSetIqamahRange({
        startDate: bulkStartDate, endDate: bulkEndDate, prayer: bulkPrayer, mode: bulkTimingMode,
        iqamahTime: bulkTimingMode === 'FIXED' ? bulkTime : undefined,
        offsetMinutes: bulkTimingMode === 'OFFSET' ? bulkOffsetMinutes : undefined,
      });
      const label = bulkTimingMode === 'OFFSET' ? `Adhan +${bulkOffsetMinutes}m` : format12h(bulkTime);
      showToast(`Updated ${bulkPrayer.toUpperCase()} Iqamah (${label}) for ${res.affectedDays} days.`);
      setIsBulkOpen(false);
      await loadSchedule(currentYear, currentMonth);
      onScheduleChanged?.();
    } catch (err) { setBulkError(err instanceof Error ? err.message : 'Failed to bulk apply schedule.'); }
    finally { setIsSavingBulk(false); }
  };

  return (
    <div className="space-y-4 no-print">
      {toastMessage && (
        <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:bottom-auto sm:top-5 sm:right-5 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-xl shadow-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] text-xs font-medium animate-fadeIn">
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[var(--admin-text-primary)] shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      <div className="p-3 sm:p-4 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-2 w-full lg:w-auto min-w-0">
          <div className="flex items-center space-x-0.5 sm:space-x-1 bg-[var(--admin-surface)] p-1 rounded-xl border border-[var(--admin-border)] flex-1 sm:flex-none min-w-0 justify-between">
            <button type="button" onClick={() => { if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear((y) => y - 1); } else setCurrentMonth((m) => m - 1); }} className="min-h-[36px] min-w-[36px] shrink-0 flex items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-card)] transition cursor-pointer" title="Previous month" aria-label="Previous month"><ChevronLeft className="w-4 h-4" /></button>
            <div className="px-1.5 sm:px-3 py-1 text-xs sm:text-sm font-bold text-[var(--admin-text-primary)] min-w-0 sm:min-w-[140px] text-center truncate">{TIMETABLE_MONTH_NAMES[currentMonth - 1]} {currentYear}</div>
            <button type="button" onClick={() => { if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear((y) => y + 1); } else setCurrentMonth((m) => m + 1); }} className="min-h-[36px] min-w-[36px] shrink-0 flex items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-card)] transition cursor-pointer" title="Next month" aria-label="Next month"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <button type="button" onClick={() => { const n = new Date(); setCurrentYear(n.getFullYear()); setCurrentMonth(n.getMonth() + 1); }} className="min-h-[40px] sm:min-h-0 px-2.5 sm:px-3 py-1.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-card)] text-xs font-medium text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] transition cursor-pointer flex items-center space-x-1.5 shrink-0" title="Jump to current month">
            <Calendar className="w-3.5 h-3.5 shrink-0" /><span>Today</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button type="button" onClick={() => setIsRulesModalOpen(true)} className="min-h-[40px] sm:min-h-0 px-3 sm:px-3.5 py-1.5 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] font-medium text-xs flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-sm whitespace-nowrap"><Settings2 className="w-3.5 h-3.5 opacity-70" /><span>Rules &amp; Adhan Offsets</span></button>
          <button type="button" onClick={() => { const mStr = String(currentMonth).padStart(2, '0'); const last = new Date(currentYear, currentMonth, 0).getDate(); setBulkStartDate(`${currentYear}-${mStr}-01`); setBulkEndDate(`${currentYear}-${mStr}-${String(last).padStart(2, '0')}`); setBulkError(null); setIsBulkOpen(true); }} className="min-h-[40px] sm:min-h-0 px-3 sm:px-3.5 py-1.5 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] font-medium text-xs flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-sm whitespace-nowrap"><SlidersHorizontal className="w-3.5 h-3.5 opacity-70" /><span>Bulk Apply</span></button>

          <div ref={actionsRef} className="relative ml-auto sm:ml-0">
            <button
              type="button"
              onClick={() => setIsActionsOpen((prev) => !prev)}
              aria-expanded={isActionsOpen}
              aria-haspopup="menu"
              className="min-h-[40px] sm:min-h-0 px-3 sm:px-3.5 py-1.5 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] font-medium text-xs flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-sm whitespace-nowrap"
            >
              <span>Actions</span>
              <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform ${isActionsOpen ? 'rotate-180' : ''}`} />
            </button>

            {isActionsOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-1.5 w-[min(14rem,calc(100vw-2rem))] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] shadow-2xl py-1.5 z-30 animate-fadeIn"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setIsActionsOpen(false); if (onOpenCsvModal) onOpenCsvModal(); else setIsCsvModalOpen(true); }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] flex items-center space-x-2.5 transition cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-[var(--admin-text-muted)]" />
                  <span>Import CSV</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setIsActionsOpen(false); setIsExportModalOpen(true); }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] flex items-center space-x-2.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--admin-text-muted)]" />
                  <span>Export &amp; Print</span>
                </button>
                <div className="my-1 border-t border-[var(--admin-border)]" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setIsActionsOpen(false); setIsResetModalOpen(true); }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 opacity-80" />
                  <span>Reset to Pure Astronomical</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-3"><Loader2 className="w-8 h-8 animate-spin text-[var(--admin-text-primary)] opacity-60" /><p className="text-xs text-[var(--admin-text-muted)]">Calculating astronomical timings and resolving Iqamah schedule...</p></div>
        ) : error ? (
          <div className="p-8 text-center space-y-2"><AlertCircle className="w-8 h-8 text-rose-400 mx-auto" /><p className="text-sm font-semibold text-rose-300">{error}</p><button type="button" onClick={() => void loadSchedule(currentYear, currentMonth)} className="px-3.5 py-1.5 rounded-xl bg-[var(--admin-btn-secondary-bg)] border border-[var(--admin-border)] text-xs font-medium text-[var(--admin-text-primary)] hover:bg-[var(--admin-card-hover)]">Retry</button></div>
        ) : schedule.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--admin-text-muted)]">No schedule records found for this period.</div>
        ) : (
          <MonthlyTimetableGrid
            schedule={schedule}
            onEditDay={(day) => {
              setEditingDay(day);
              setEditTimes({ fajr: day.fajr.iqamah, dhuhr: day.dhuhr.iqamah, asr: day.asr.iqamah, maghrib: day.maghrib.iqamah, isha: day.isha.iqamah });
              setEditDayError(null);
            }}
          />
        )}
      </div>

      <MonthlyEditDayModal
        editingDay={editingDay} editTimes={editTimes} setEditTimes={setEditTimes}
        editDayError={editDayError} isSavingDay={isSavingDay} onSubmit={handleSaveDay} onClose={() => setEditingDay(null)}
        onAdjustMinute={(prayer, delta) => {
          const parts = editTimes[prayer].split(':');
          const total = ((Number(parts[0] ?? '0') * 60 + Number(parts[1] ?? '0')) + delta + 1440) % 1440;
          setEditTimes((p) => ({ ...p, [prayer]: `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}` }));
        }}
      />

      <MonthlyBulkApplyModal
        isOpen={isBulkOpen} bulkTimingMode={bulkTimingMode} setBulkTimingMode={setBulkTimingMode}
        bulkPrayer={bulkPrayer} bulkTime={bulkTime} setBulkTime={setBulkTime}
        bulkOffsetMinutes={bulkOffsetMinutes} setBulkOffsetMinutes={setBulkOffsetMinutes} maxOffsetInfo={maxOffsetInfo}
        bulkStartDate={bulkStartDate} setBulkStartDate={setBulkStartDate} bulkEndDate={bulkEndDate} setBulkEndDate={setBulkEndDate}
        bulkError={bulkError} isSavingBulk={isSavingBulk} onSubmit={handleApplyBulk} onClose={() => setIsBulkOpen(false)}
        onPrayerChange={(p) => { setBulkPrayer(p); const info = getMaxAllowedOffsetMinutes(p, sampleDay); if (bulkOffsetMinutes > info.max) setBulkOffsetMinutes(info.max); }}
      />

      {isRulesModalOpen && <DynamicCalculationRulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} onRulesSaved={() => { showToast('Default calculation rules saved.'); void loadSchedule(currentYear, currentMonth); onScheduleChanged?.(); }} />}
      {isCsvModalOpen && <DynamicCsvImportModal isOpen={isCsvModalOpen} onClose={() => setIsCsvModalOpen(false)} onImportSuccess={async (c) => { showToast(`Successfully imported ${c} timetable records!`); await loadSchedule(currentYear, currentMonth); onScheduleChanged?.(); }} />}
      {isExportModalOpen && <DynamicScheduleExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} initialYear={currentYear} initialMonth={currentMonth} />}

      <ConfirmationModal
        isOpen={isResetModalOpen}
        title={`Reset ${TIMETABLE_MONTH_NAMES[currentMonth - 1]} ${currentYear} to Pure Astronomical?`}
        message="This will immediately remove all manual day overrides and uploaded CSV timetable records for this month, reverting the schedule to pure astronomical calculations."
        confirmLabel="Reset Month"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={async () => {
          setIsResetModalOpen(false);
          try {
            await resetMonthToAstronomical(currentYear, currentMonth);
            showToast(`Reset ${TIMETABLE_MONTH_NAMES[currentMonth - 1]} ${currentYear} to astronomical.`);
            await loadSchedule(currentYear, currentMonth);
            onScheduleChanged?.();
          } catch {
            showToast('Failed to reset month schedule.', 'error');
          }
        }}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
}
