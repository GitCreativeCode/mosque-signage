'use client';

import React from 'react';
import type { PrayerOverride, PrayerRule, PrayerTimesToday, Settings } from '@/types/index';
import type { DbJummahShiftRecord } from '@/lib/actions/jummah';
import { useJummahShiftsManager } from '@/hooks/useJummahShiftsManager';
import { ShiftModal } from './prayer/ShiftModal';
import { ConfirmationModal } from './common/ConfirmationModal';
import { MonthlyTimetable } from './prayer/MonthlyTimetable';
import { JummahScheduleEditorCard } from './prayer/JummahScheduleEditorCard';
import { PrayerCalculationDisclaimer } from './prayer/PrayerCalculationDisclaimer';
import { Compass } from 'lucide-react';

export interface PrayerScheduleManagerProps {
  readonly settings?: Settings | undefined;
  readonly prayers?: PrayerTimesToday | undefined;
  readonly initialOverrides?: readonly PrayerOverride[] | undefined;
  readonly initialJummahShifts: readonly DbJummahShiftRecord[];
  readonly initialRules?: readonly PrayerRule[] | undefined;
  readonly onRefresh: () => void;
  readonly onDirtyChange?: ((isDirty: boolean) => void) | undefined;
  readonly initialSubTab?: string | undefined;
  readonly activeSubTab?: 'TIMETABLE' | 'JUMMAH' | undefined;
  readonly onSubTabChange?: ((tab: 'TIMETABLE' | 'JUMMAH') => void) | undefined;
}

export function PrayerScheduleManager({
  settings,
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
          <h2 className="text-xl font-bold tracking-tight text-[var(--admin-text-primary)]">
            Prayer Timetable &amp; Friday Congregation
          </h2>
          <p className="text-xs text-[var(--admin-text-muted)] mt-0.5">
            Manage the monthly prayer schedule, automated calculation rules, and Friday multi-shift Jummah.
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
          <nav className="flex space-x-6 -mb-px">
            <button
              type="button"
              onClick={() => m.handleSubTabChange('TIMETABLE')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
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
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
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
          </nav>
        </div>
      </div>

      {m.activeTab === 'TIMETABLE' && <MonthlyTimetable onScheduleChanged={onRefresh} />}

      {m.activeTab === 'JUMMAH' && (
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
      )}

      <ShiftModal
        isOpen={m.isAddingShift}
        mode="ADD"
        shiftNumber={m.shifts.length + 1}
        khateeb={m.newKhateeb}
        setKhateeb={m.setNewKhateeb}
        adhan={m.newAdhan}
        setAdhan={m.setNewAdhan}
        iqamah={m.newIqamah}
        setIqamah={m.setNewIqamah}
        onSubmit={m.handleAddNewShift}
        onClose={() => m.setIsAddingShift(false)}
        isSubmitting={m.isShiftSubmitting}
        formError={m.shiftFormError}
      />

      <ShiftModal
        isOpen={Boolean(m.editingShift)}
        mode="EDIT"
        shiftNumber={m.shifts.findIndex((s) => s.id === m.editingShift?.id) + 1}
        khateeb={m.editKhateeb}
        setKhateeb={m.setEditKhateeb}
        adhan={m.editAdhan}
        setAdhan={m.setEditAdhan}
        iqamah={m.editIqamah}
        setIqamah={m.setEditIqamah}
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
