'use client';

import React from 'react';
import type { PrayerOverride, PrayerRule, PrayerTimesToday, Settings } from '@/types/index';
import type { DbJummahShiftRecord } from '@/lib/actions/jummah';
import { useJummahShiftsManager } from '@/hooks/useJummahShiftsManager';
import { ShiftModal } from './prayer/ShiftModal';
import { ConfirmationModal } from './common/ConfirmationModal';
import { MonthlyTimetable } from './prayer/MonthlyTimetable';
import { JummahScheduleEditorCard } from './prayer/JummahScheduleEditorCard';
import { FridayKhateebRosterCard } from './prayer/FridayKhateebRosterCard';
import { SeasonalSchedulesCard } from './prayer/SeasonalSchedulesCard';
import { PrayerCalculationDisclaimer } from './prayer/PrayerCalculationDisclaimer';
import { Compass, HelpCircle } from 'lucide-react';

export interface PrayerScheduleManagerProps {
  readonly settings?: Settings | undefined;
  readonly prayers?: PrayerTimesToday | undefined;
  readonly initialOverrides?: readonly PrayerOverride[] | undefined;
  readonly initialJummahShifts: readonly DbJummahShiftRecord[];
  readonly initialRules?: readonly PrayerRule[] | undefined;
  readonly onRefresh: () => void;
  readonly onDirtyChange?: ((isDirty: boolean) => void) | undefined;
  readonly initialSubTab?: string | undefined;
  readonly activeSubTab?: 'TIMETABLE' | 'JUMMAH' | 'SEASONAL' | undefined;
  readonly onSubTabChange?: ((tab: 'TIMETABLE' | 'JUMMAH' | 'SEASONAL') => void) | undefined;
}

export function PrayerScheduleManager({
  settings,
  prayers,
  initialJummahShifts,
  onRefresh,
  initialSubTab,
  activeSubTab: controlledSubTab,
  onSubTabChange,
}: PrayerScheduleManagerProps) {
  const m = useJummahShiftsManager({
    initialJummahShifts,
    onRefresh,
    initialSubTab,
    controlledSubTab,
    onSubTabChange,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <div className="flex items-start sm:items-center justify-between sm:justify-start gap-2">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--admin-text-primary)]">
              Prayer Timetable &amp; Friday Congregation
            </h2>
            <div className="relative group shrink-0">
              <a
                href="/faq/prayer-and-jummah-schedule-guide"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[36px] min-w-[36px] p-1 rounded-full text-[var(--admin-text-muted)] hover:text-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-surface)] transition inline-flex items-center justify-center cursor-pointer"
                aria-label="View Prayer & Jummah Schedule Guide"
              >
                <HelpCircle className="w-4 h-4" />
              </a>
              <div className="hidden sm:group-hover:flex absolute left-1/2 -translate-x-1/2 top-full mt-1.5 flex-col items-center z-50 pointer-events-none animate-fadeIn">
                <div className="w-2 h-2 bg-neutral-900 rotate-45 -mb-1 border-t border-l border-white/10" />
                <div className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-white/15 text-white text-[11px] font-medium shadow-xl whitespace-nowrap">
                  Need guidance? Open the complete Prayer &amp; Jummah Schedule Guide
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-[var(--admin-text-muted)] mt-0.5">
            Manage the monthly prayer schedule, automated calculation rules, Friday multi-shift Jummah, and seasonal liturgical events.
          </p>
        </div>

        <PrayerCalculationDisclaimer />

        {(!settings?.latitude || !settings?.longitude) && (
          <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex items-start space-x-3 text-xs shadow-sm">
            <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <span className="font-bold block">Venue Coordinates Not Configured</span>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                Astronomical prayer calculations are currently paused because latitude and longitude coordinates have not been set.
                You can{' '}
                <a
                  href="/admin?tab=settings&sub=astronomy"
                  className="underline font-bold hover:text-amber-950 dark:hover:text-white"
                >
                  configure coordinates in Settings
                </a>{' '}
                or upload an annual timetable CSV.
              </p>
            </div>
          </div>
        )}

        <div className="border-b border-[var(--admin-border)]">
          <nav className="flex space-x-5 sm:space-x-6 -mb-px overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => m.handleSubTabChange('TIMETABLE')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                m.activeTab === 'TIMETABLE'
                  ? 'border-[var(--admin-tab-active-border)] text-[var(--admin-text-primary)]'
                  : 'border-transparent text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:border-[var(--admin-border)]'
              }`}
            >
              Prayer Timetable
            </button>
            <button
              type="button"
              onClick={() => m.handleSubTabChange('JUMMAH')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap shrink-0 ${
                m.activeTab === 'JUMMAH'
                  ? 'border-[var(--admin-tab-active-border)] text-[var(--admin-text-primary)]'
                  : 'border-transparent text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:border-[var(--admin-border)]'
              }`}
            >
              <span>Friday Jummah</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[10px] font-mono tabular-nums text-[var(--admin-text-muted)]">
                {m.shifts.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => m.handleSubTabChange('SEASONAL')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                m.activeTab === 'SEASONAL'
                  ? 'border-[var(--admin-tab-active-border)] text-[var(--admin-text-primary)]'
                  : 'border-transparent text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:border-[var(--admin-border)]'
              }`}
            >
              Seasonal (Eid &amp; Ramadan)
            </button>
          </nav>
        </div>
      </div>

      {m.activeTab === 'TIMETABLE' && <MonthlyTimetable onScheduleChanged={onRefresh} />}

      {m.activeTab === 'JUMMAH' && (
        <div className="space-y-6">
          <JummahScheduleEditorCard
            shifts={m.shifts}
            draggedIndex={m.draggedIndex}
            dragOverIndex={m.dragOverIndex}
            jummahSuccess={m.jummahSuccess}
            shiftOrderError={m.shiftOrderError}
            onOpenAdd={m.handleOpenAddModal}
            onOpenEdit={m.handleOpenEditShift}
            onRequestDelete={m.setDeletingShiftId}
            onMoveShift={m.handleMoveShift}
            onDragStart={(e, idx) => { m.setDraggedIndex(idx); e.dataTransfer.effectAllowed = 'move'; }}
            onDragOver={(e, idx) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (m.dragOverIndex !== idx) m.setDragOverIndex(idx); }}
            onDrop={m.handleDrop}
          />
          <FridayKhateebRosterCard
            shifts={m.shifts}
            onScheduleChanged={onRefresh}
            refreshKey={m.rosterRefreshKey}
          />
        </div>
      )}

      {m.activeTab === 'SEASONAL' && (
        <SeasonalSchedulesCard settings={settings} prayers={prayers} onRefresh={onRefresh} />
      )}

      <ShiftModal
        isOpen={m.isAddingShift}
        mode="ADD"
        shiftNumber={m.shifts.length + 1}
        shifts={m.shifts}
        scheduleScope={m.scheduleScope}
        setScheduleScope={m.setScheduleScope}
        overrideDate={m.overrideDate}
        setOverrideDate={m.setOverrideDate}
        overrideShiftId={m.overrideShiftId}
        setOverrideShiftId={m.setOverrideShiftId}
        khateeb={m.newKhateeb}
        setKhateeb={m.setNewKhateeb}
        adhan={m.newAdhan}
        setAdhan={m.setNewAdhan}
        iqamah={m.newIqamah}
        setIqamah={m.setNewIqamah}
        location={m.newLocation}
        setLocation={m.setNewLocation}
        language={m.newLanguage}
        setLanguage={m.setNewLanguage}
        topic={m.newTopic}
        setTopic={m.setNewTopic}
        onSubmit={m.handleAddNewShift}
        onClose={() => m.setIsAddingShift(false)}
        isSubmitting={m.isShiftSubmitting}
        formError={m.shiftFormError}
      />

      <ShiftModal
        isOpen={Boolean(m.editingShift)}
        mode="EDIT"
        shiftNumber={m.shifts.findIndex((s) => s.id === m.editingShift?.id) + 1}
        shifts={m.shifts}
        scheduleScope={m.scheduleScope}
        setScheduleScope={m.setScheduleScope}
        overrideDate={m.overrideDate}
        setOverrideDate={m.setOverrideDate}
        khateeb={m.editKhateeb}
        setKhateeb={m.setEditKhateeb}
        adhan={m.editAdhan}
        setAdhan={m.setEditAdhan}
        iqamah={m.editIqamah}
        setIqamah={m.setEditIqamah}
        location={m.editLocation}
        setLocation={m.setEditLocation}
        language={m.editLanguage}
        setLanguage={m.setEditLanguage}
        topic={m.editTopic}
        setTopic={m.setEditTopic}
        onSubmit={m.handleSaveEditedShift}
        onClose={() => m.setEditingShift(null)}
        isSubmitting={m.isShiftSubmitting}
        formError={m.shiftFormError}
      />

      <ConfirmationModal
        isOpen={m.deletingShiftId !== null}
        title="Delete Friday Khutbah?"
        message="Are you sure you want to delete this Friday prayer Khutbah service? It will be immediately removed from the live display schedule."
        confirmLabel="Delete Khutbah"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => { if (m.deletingShiftId) void m.handleDeleteShift(m.deletingShiftId); }}
        onCancel={() => m.setDeletingShiftId(null)}
      />
    </div>
  );
}
